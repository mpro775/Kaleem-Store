import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CloudflareApiEnvelope<T> {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  result?: T;
}

interface CloudflareCustomHostnameResult {
  id: string;
  hostname: string;
  ssl?: {
    status?: string;
    method?: string;
    type?: string;
  };
}

@Injectable()
export class CloudflareDomainsService {
  private readonly logger = new Logger(CloudflareDomainsService.name);

  constructor(private readonly configService: ConfigService) {}

  isEnabled(): boolean {
    return this.provider === 'cloudflare' && this.zoneId.length > 0 && this.apiToken.length > 0;
  }

  async createCustomHostname(hostname: string, sslMode: 'full' | 'full_strict'): Promise<{
    cloudflareHostnameId: string;
    sslStatus: 'requested' | 'issued' | 'error';
  }> {
    const result = await this.request<CloudflareCustomHostnameResult>(
      `/zones/${this.zoneId}/custom_hostnames`,
      {
        method: 'POST',
        body: JSON.stringify({
          hostname,
          ssl: {
            method: this.validationMethod,
            type: 'dv',
            settings: {
              min_tls_version: this.minTlsVersion,
              ciphers: this.tlsCiphers,
              http2: 'on',
              tls_1_3: 'on',
            },
            wildcard: false,
            bundle_method: 'ubiquitous',
            certificate_authority: 'google',
          },
          custom_origin_server: this.originServerName,
          custom_origin_sni: this.originServerName,
          wait_for_ssl_pending_validation: false,
          metadata: {
            requestedSslMode: sslMode,
          },
        }),
      },
    );

    return {
      cloudflareHostnameId: result.id,
      sslStatus: this.mapSslStatus(result.ssl?.status),
    };
  }

  async getCustomHostname(customHostnameId: string): Promise<{ sslStatus: 'requested' | 'issued' | 'error' }> {
    const result = await this.request<CloudflareCustomHostnameResult>(
      `/zones/${this.zoneId}/custom_hostnames/${encodeURIComponent(customHostnameId)}`,
      { method: 'GET' },
    );

    return {
      sslStatus: this.mapSslStatus(result.ssl?.status),
    };
  }

  async deleteCustomHostname(customHostnameId: string): Promise<void> {
    try {
      await this.request<unknown>(
        `/zones/${this.zoneId}/custom_hostnames/${encodeURIComponent(customHostnameId)}`,
        { method: 'DELETE' },
      );
    } catch (error) {
      this.logger.warn(
        `Failed deleting Cloudflare custom hostname ${customHostnameId}: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
      signal: AbortSignal.timeout(15_000),
    });

    const envelope = (await response.json().catch(() => null)) as CloudflareApiEnvelope<T> | null;
    if (!response.ok || !envelope?.success || !envelope.result) {
      const message = envelope?.errors?.map((error) => error.message).join('; ') ?? response.statusText;
      throw new Error(`Cloudflare API request failed: ${message}`);
    }

    return envelope.result;
  }

  private mapSslStatus(status: string | undefined): 'requested' | 'issued' | 'error' {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'active' || normalized === 'active_redeploying' || normalized === 'active_renewing') {
      return 'issued';
    }

    if (
      normalized === 'pending_validation' ||
      normalized === 'pending_issuance' ||
      normalized === 'initializing' ||
      normalized === 'pending_deployment'
    ) {
      return 'requested';
    }

    return 'error';
  }

  private get provider(): string {
    return this.configService.get<string>('DOMAIN_SSL_PROVIDER', 'manual').trim().toLowerCase();
  }

  private get apiBaseUrl(): string {
    return this.configService
      .get<string>('CLOUDFLARE_API_BASE_URL', 'https://api.cloudflare.com/client/v4')
      .replace(/\/+$/, '');
  }

  private get apiToken(): string {
    return this.configService.get<string>('CLOUDFLARE_API_TOKEN', '').trim();
  }

  private get zoneId(): string {
    return this.configService.get<string>('CLOUDFLARE_ZONE_ID', '').trim();
  }

  private get validationMethod(): string {
    const configured = this.configService
      .get<string>('CLOUDFLARE_SSL_VALIDATION_METHOD', 'txt')
      .trim()
      .toLowerCase();
    return configured === 'http' ? 'http' : 'txt';
  }

  private get minTlsVersion(): string {
    const configured = this.configService
      .get<string>('CLOUDFLARE_MIN_TLS_VERSION', '1.2')
      .trim();
    return configured === '1.3' ? '1.3' : '1.2';
  }

  private get tlsCiphers(): string[] {
    const configured = this.configService.get<string>('CLOUDFLARE_TLS_CIPHERS', '').trim();
    if (configured.length === 0) {
      return [];
    }

    return configured
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private get originServerName(): string {
    return this.configService.get<string>('DOMAIN_CNAME_TARGET', 'stores.example.com').trim();
  }
}
