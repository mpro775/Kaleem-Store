import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { DatabaseService } from '../database/database.service';
import { StoresRepository, type StorePublicRecord } from '../stores/stores.repository';

@Injectable()
export class StoreResolverService {
  private readonly cacheTtlSeconds = 300;

  constructor(
    private readonly storesRepository: StoresRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async resolve(request: Request): Promise<StorePublicRecord> {
    const hostname = this.getHost(request);
    const fromCache = await this.resolveFromCache(hostname);
    if (fromCache) {
      this.assertStoreIsActive(fromCache);
      return fromCache;
    }

    const byDomain = await this.storesRepository.findPublicByHostname(hostname);
    if (byDomain) {
      this.assertStoreIsActive(byDomain);
      await this.cacheStoreHost(hostname, byDomain.id);
      return byDomain;
    }

    const slug = this.resolveSlugFromRequest(request, hostname);
    const store = await this.storesRepository.findBySlug(slug);
    if (!store) {
      throw new NotFoundException('Store not found for current host');
    }

    this.assertStoreIsActive(store);

    await this.cacheStoreHost(hostname, store.id);
    return store;
  }

  private getHost(request: Request): string {
    const forwardedHost = request.header('x-forwarded-host');
    const host = this.normalizeForwardedHost(forwardedHost) ?? request.header('host');
    if (!host) {
      throw new BadRequestException('Host header is required');
    }

    const hostname = host.toLowerCase().split(':')[0]?.trim();
    if (!hostname) {
      throw new BadRequestException('Host header is invalid');
    }

    return hostname;
  }

  private resolveSlugFromRequest(request: Request, host: string): string {
    const queryStore = typeof request.query.store === 'string' ? request.query.store : null;
    if (queryStore && queryStore.trim().length > 0) {
      return queryStore.trim().toLowerCase();
    }

    const explicitSlug = request.header('x-store-slug');
    if (explicitSlug) {
      return explicitSlug.trim().toLowerCase();
    }

    if (host === 'localhost' || host === '127.0.0.1') {
      throw new BadRequestException('Store slug is required for localhost requests');
    }

    const parts = host.split('.');
    if (parts.length < 2) {
      throw new BadRequestException('Cannot resolve store from host');
    }

    const slug = parts[0]?.trim().toLowerCase();
    if (!slug) {
      throw new BadRequestException('Cannot resolve store slug from host');
    }

    return slug;
  }

  private normalizeForwardedHost(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const first = value.split(',')[0]?.trim();
    if (!first) {
      return null;
    }

    return first;
  }

  private async resolveFromCache(host: string): Promise<StorePublicRecord | null> {
    try {
      await this.databaseService.pingRedis();
      const storeId = await this.databaseService.cache.get(this.cacheKey(host));
      if (!storeId) {
        return null;
      }

      return this.storesRepository.findPublicById(storeId);
    } catch {
      return null;
    }
  }

  private async cacheStoreHost(host: string, storeId: string): Promise<void> {
    try {
      await this.databaseService.pingRedis();
      await this.databaseService.cache.set(
        this.cacheKey(host),
        storeId,
        'EX',
        this.cacheTtlSeconds,
      );
    } catch {
      return;
    }
  }

  private cacheKey(host: string): string {
    return `store:host:${host}`;
  }

  private assertStoreIsActive(store: StorePublicRecord): void {
    if (store.is_suspended) {
      throw new ForbiddenException('Store is suspended');
    }
  }
}
