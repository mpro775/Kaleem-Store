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
  sslProvider: 'cloudflare';
  sslMode: 'full' | 'full_strict';
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
  ) {}

  async create(
    currentUser: AuthUser,
    input: CreateDomainDto,
    context: RequestContextData,
  ): Promise<StoreDomainResponse> {
    await this.saasService.assertMetricCanGrow(currentUser.storeId, 'domains.total', 1);

    const verificationToken = this.generateVerificationToken();

    try {
      const created = await this.domainsRepository.create({
        storeId: currentUser.storeId,
        hostname: input.hostname,
        verificationToken,
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

    const activated = await this.domainsRepository.markActive(currentUser.storeId, domain.id);
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
      },
    });

    await this.log('domains.activated', currentUser, activated.id, context, {
      hostname: activated.hostname,
      sslStatus: activated.ssl_status,
    });

    return this.toResponse(activated);
  }

  async remove(
    currentUser: AuthUser,
    domainId: string,
    context: RequestContextData,
  ): Promise<void> {
    const deleted = await this.domainsRepository.delete(currentUser.storeId, domainId);
    if (!deleted) {
      throw new NotFoundException('Domain not found');
    }

    await this.log('domains.deleted', currentUser, domainId, context, {});
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
      sslProvider: 'cloudflare',
      sslMode: this.sslMode,
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
