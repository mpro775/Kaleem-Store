import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import type { RequestContextData } from '../common/utils/request-context.util';
import { OutboxService } from '../messaging/outbox.service';
import { SaasService } from '../saas/saas.service';
import { CloudflareDomainsService } from './cloudflare-domains.service';
import type { CreateDomainDto } from './dto/create-domain.dto';
import { DnsResolverService } from './dns-resolver.service';
import { DomainsRepository, type StoreDomainRecord } from './domains.repository';

export interface StoreDomainResponse {
  id: string;
  storeId: string;
  hostname: string;
  routingType: 'cname';
  routingHost: string;
  routingTarget: string;
  status: 'pending' | 'verified' | 'active';
  sslStatus: 'pending' | 'requested' | 'issued' | 'error';
  sslProvider: 'manual' | 'cloudflare';
  sslMode: 'full' | 'full_strict';
  sslLastCheckedAt: Date | null;
  sslError: string | null;
  verificationToken: string;
  verificationDnsHost: string;
  verifiedAt: Date | null;
  activatedAt: Date | null;
}

@Injectable()
export class DomainsService {
  constructor(
    private readonly domainsRepository: DomainsRepository,
    private readonly dnsResolverService: DnsResolverService,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly saasService: SaasService,
    private readonly cloudflareDomainsService: CloudflareDomainsService,
  ) {}

  async create(
    currentUser: AuthUser,
    input: CreateDomainDto,
    context: RequestContextData,
  ): Promise<StoreDomainResponse> {
    await this.saasService.assertFeatureEnabled(currentUser.storeId, 'custom_domains');
    await this.saasService.assertMetricCanGrow(currentUser.storeId, 'domains.total', 1);

    const verificationToken = this.generateVerificationToken();

    try {
      const created = await this.domainsRepository.create({
        storeId: currentUser.storeId,
        hostname: input.hostname,
        verificationToken,
        sslProvider: this.sslProvider,
        sslMode: this.sslMode,
        cloudflareZoneId: this.cloudflareZoneId,
      });

      await this.log('domains.created', currentUser, created.id, context, {
        hostname: created.hostname,
      });

      return this.toResponse(created);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Hostname is already in use');
      }
      throw error;
    }
  }

  async list(currentUser: AuthUser): Promise<StoreDomainResponse[]> {
    const domains = await this.domainsRepository.list(currentUser.storeId);
    return domains.map((domain) => this.toResponse(domain));
  }

  async verify(
    currentUser: AuthUser,
    domainId: string,
    context: RequestContextData,
  ): Promise<StoreDomainResponse> {
    const domain = await this.requireDomain(currentUser.storeId, domainId);

    if (domain.status === 'verified' || domain.status === 'active') {
      return this.toResponse(domain);
    }

    const isVerified = await this.dnsResolverService.hasVerificationRecord(
      domain.hostname,
      domain.verification_token,
      this.verificationPrefix,
    );

    if (!isVerified) {
      throw new BadRequestException('Domain verification token not found in DNS TXT records');
    }

    const verified = await this.domainsRepository.markVerified(currentUser.storeId, domain.id);
    if (!verified) {
      throw new NotFoundException('Domain not found');
    }

    await this.outboxService.enqueue({
      aggregateType: 'domain',
      aggregateId: verified.id,
      eventType: 'domain.verified',
      payload: {
        storeId: currentUser.storeId,
        domainId: verified.id,
        hostname: verified.hostname,
      },
    });

    await this.log('domains.verified', currentUser, verified.id, context, {
      hostname: verified.hostname,
    });

    return this.toResponse(verified);
  }

  async activate(
    currentUser: AuthUser,
    domainId: string,
    context: RequestContextData,
  ): Promise<StoreDomainResponse> {
    const domain = await this.requireDomain(currentUser.storeId, domainId);
    if (domain.status === 'pending') {
      throw new BadRequestException('Domain must be verified before activation');
    }

    const hasRoutingCname = await this.dnsResolverService.hasRoutingCname(
      domain.hostname,
      this.routingTarget,
    );

    if (!hasRoutingCname) {
      throw new BadRequestException(
        `Domain routing CNAME is missing. Expected ${domain.hostname} -> ${this.routingTarget}`,
      );
    }

    let nextSslStatus: 'requested' | 'issued' | 'error' = 'issued';
    let cloudflareHostnameId: string | null = domain.cloudflare_hostname_id;
    let sslError: string | null = null;

    if (domain.ssl_provider === 'cloudflare') {
      if (!this.cloudflareDomainsService.isEnabled()) {
        throw new BadRequestException(
          'Cloudflare integration is not configured. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN.',
        );
      }

      try {
        if (domain.cloudflare_hostname_id) {
          const status = await this.cloudflareDomainsService.getCustomHostname(
            domain.cloudflare_hostname_id,
          );
          nextSslStatus = status.sslStatus;
        } else {
          const created = await this.cloudflareDomainsService.createCustomHostname(
            domain.hostname,
            domain.ssl_mode,
          );
          cloudflareHostnameId = created.cloudflareHostnameId;
          nextSslStatus = created.sslStatus;
        }
      } catch (error) {
        nextSslStatus = 'error';
        sslError = error instanceof Error ? error.message : 'Cloudflare SSL provisioning failed';
      }
    }

    const activated = await this.domainsRepository.markActive({
      storeId: currentUser.storeId,
      domainId: domain.id,
      sslStatus: nextSslStatus,
      cloudflareHostnameId,
      sslError,
    });
    if (!activated) {
      throw new NotFoundException('Domain not found');
    }

    await this.outboxService.enqueue({
      aggregateType: 'domain',
      aggregateId: activated.id,
      eventType: 'domain.activated',
      payload: {
        storeId: currentUser.storeId,
        domainId: activated.id,
        hostname: activated.hostname,
        sslStatus: activated.ssl_status,
        sslError: activated.ssl_error,
      },
    });

    await this.log('domains.activated', currentUser, activated.id, context, {
      hostname: activated.hostname,
      sslStatus: activated.ssl_status,
      sslError: activated.ssl_error,
    });

    return this.toResponse(activated);
  }

  async remove(
    currentUser: AuthUser,
    domainId: string,
    context: RequestContextData,
  ): Promise<void> {
    const domain = await this.requireDomain(currentUser.storeId, domainId);

    if (
      domain.ssl_provider === 'cloudflare' &&
      domain.cloudflare_hostname_id &&
      this.cloudflareDomainsService.isEnabled()
    ) {
      await this.cloudflareDomainsService.deleteCustomHostname(domain.cloudflare_hostname_id);
    }

    const deleted = await this.domainsRepository.delete(currentUser.storeId, domainId);
    if (!deleted) {
      throw new NotFoundException('Domain not found');
    }

    await this.log('domains.deleted', currentUser, domainId, context, {});
  }

  async syncSslStatus(
    currentUser: AuthUser,
    domainId: string,
    context: RequestContextData,
  ): Promise<StoreDomainResponse> {
    const domain = await this.requireDomain(currentUser.storeId, domainId);

    if (domain.ssl_provider !== 'cloudflare') {
      return this.toResponse(domain);
    }

    if (!this.cloudflareDomainsService.isEnabled()) {
      throw new BadRequestException(
        'Cloudflare integration is not configured. Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN.',
      );
    }

    if (!domain.cloudflare_hostname_id) {
      throw new BadRequestException('Cloudflare custom hostname id is not set for this domain');
    }

    let sslStatus: 'requested' | 'issued' | 'error' =
      domain.ssl_status === 'issued'
        ? 'issued'
        : domain.ssl_status === 'requested'
          ? 'requested'
          : 'error';
    let sslError: string | null = null;

    try {
      const cloudflareState = await this.cloudflareDomainsService.getCustomHostname(
        domain.cloudflare_hostname_id,
      );
      sslStatus = cloudflareState.sslStatus;
    } catch (error) {
      sslStatus = 'error';
      sslError = error instanceof Error ? error.message : 'Cloudflare SSL sync failed';
    }

    const updated = await this.domainsRepository.updateSslState({
      storeId: currentUser.storeId,
      domainId,
      sslStatus,
      sslError,
    });

    if (!updated) {
      throw new NotFoundException('Domain not found');
    }

    await this.log('domains.ssl_synced', currentUser, domainId, context, {
      hostname: updated.hostname,
      sslStatus: updated.ssl_status,
      sslError: updated.ssl_error,
    });

    return this.toResponse(updated);
  }

  private async requireDomain(storeId: string, domainId: string): Promise<StoreDomainRecord> {
    const domain = await this.domainsRepository.findById(storeId, domainId);
    if (!domain) {
      throw new NotFoundException('Domain not found');
    }
    return domain;
  }

  private async log(
    action: string,
    currentUser: AuthUser,
    domainId: string,
    context: RequestContextData,
    metadata: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.log({
      action,
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'store_domain',
      targetId: domainId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        ...metadata,
        ...(context.requestId ? { requestId: context.requestId } : {}),
      },
    });
  }

  private toResponse(domain: StoreDomainRecord): StoreDomainResponse {
    return {
      id: domain.id,
      storeId: domain.store_id,
      hostname: domain.hostname,
      routingType: 'cname',
      routingHost: domain.hostname,
      routingTarget: this.routingTarget,
      status: domain.status,
      sslStatus: domain.ssl_status,
      sslProvider: domain.ssl_provider,
      sslMode: domain.ssl_mode,
      sslLastCheckedAt: domain.ssl_last_checked_at,
      sslError: domain.ssl_error,
      verificationToken: domain.verification_token,
      verificationDnsHost: `${this.verificationPrefix}.${domain.hostname}`,
      verifiedAt: domain.verified_at,
      activatedAt: domain.activated_at,
    };
  }

  private get verificationPrefix(): string {
    return this.configService.get<string>('DOMAIN_VERIFY_TXT_PREFIX', '_kaleem-verify');
  }

  private get routingTarget(): string {
    const configuredTarget = this.configService.get<string>(
      'DOMAIN_CNAME_TARGET',
      'stores.example.com',
    );
    const normalizedTarget = this.normalizeHostname(configuredTarget);
    return normalizedTarget.length > 0 ? normalizedTarget : 'stores.example.com';
  }

  private get sslMode(): 'full' | 'full_strict' {
    const configured = this.configService.get<string>('DOMAIN_SSL_MODE', 'full_strict');
    return configured === 'full' ? 'full' : 'full_strict';
  }

  private get sslProvider(): 'manual' | 'cloudflare' {
    const configured = this.configService.get<string>('DOMAIN_SSL_PROVIDER', 'manual').trim();
    return configured === 'cloudflare' ? 'cloudflare' : 'manual';
  }

  private get cloudflareZoneId(): string | null {
    const value = this.configService.get<string>('CLOUDFLARE_ZONE_ID', '').trim();
    return value.length > 0 ? value : null;
  }

  private generateVerificationToken(): string {
    return randomBytes(16).toString('hex');
  }

  private normalizeHostname(value: string): string {
    return value.trim().toLowerCase().replace(/\.$/, '');
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const dbError = error as Error & { code?: string };
    return dbError.code === '23505';
  }
}
