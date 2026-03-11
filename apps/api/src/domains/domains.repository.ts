import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface StoreDomainRecord {
  id: string;
  store_id: string;
  hostname: string;
  verification_token: string;
  status: 'pending' | 'verified' | 'active';
  ssl_status: 'pending' | 'requested' | 'issued' | 'error';
  ssl_provider: 'manual' | 'cloudflare';
  ssl_mode: 'full' | 'full_strict';
  cloudflare_zone_id: string | null;
  cloudflare_hostname_id: string | null;
  ssl_last_checked_at: Date | null;
  ssl_error: string | null;
  verified_at: Date | null;
  activated_at: Date | null;
}

@Injectable()
export class DomainsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: {
    storeId: string;
    hostname: string;
    verificationToken: string;
    sslProvider: 'manual' | 'cloudflare';
    sslMode: 'full' | 'full_strict';
    cloudflareZoneId: string | null;
  }): Promise<StoreDomainRecord> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        INSERT INTO store_domains (
          id,
          store_id,
          hostname,
          verification_token,
          status,
          ssl_status,
          ssl_provider,
          ssl_mode,
          cloudflare_zone_id
        ) VALUES ($1, $2, $3, $4, 'pending', 'pending', $5, $6, $7)
        RETURNING id, store_id, hostname, verification_token, status, ssl_status,
                  ssl_provider, ssl_mode, cloudflare_zone_id, cloudflare_hostname_id,
                  ssl_last_checked_at, ssl_error, verified_at, activated_at
      `,
      [
        uuidv4(),
        input.storeId,
        input.hostname,
        input.verificationToken,
        input.sslProvider,
        input.sslMode,
        input.cloudflareZoneId,
      ],
    );
    return result.rows[0] as StoreDomainRecord;
  }

  async list(storeId: string): Promise<StoreDomainRecord[]> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        SELECT id, store_id, hostname, verification_token, status, ssl_status, verified_at, activated_at
               , ssl_provider, ssl_mode, cloudflare_zone_id, cloudflare_hostname_id,
                 ssl_last_checked_at, ssl_error
        FROM store_domains
        WHERE store_id = $1
        ORDER BY created_at DESC
      `,
      [storeId],
    );
    return result.rows;
  }

  async findById(storeId: string, domainId: string): Promise<StoreDomainRecord | null> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        SELECT id, store_id, hostname, verification_token, status, ssl_status, verified_at, activated_at
               , ssl_provider, ssl_mode, cloudflare_zone_id, cloudflare_hostname_id,
                 ssl_last_checked_at, ssl_error
        FROM store_domains
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, domainId],
    );
    return result.rows[0] ?? null;
  }

  async markVerified(storeId: string, domainId: string): Promise<StoreDomainRecord | null> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        UPDATE store_domains
        SET status = 'verified',
            verified_at = COALESCE(verified_at, NOW()),
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, hostname, verification_token, status, ssl_status, verified_at, activated_at
                  , ssl_provider, ssl_mode, cloudflare_zone_id, cloudflare_hostname_id,
                    ssl_last_checked_at, ssl_error
      `,
      [storeId, domainId],
    );
    return result.rows[0] ?? null;
  }

  async markActive(input: {
    storeId: string;
    domainId: string;
    sslStatus: 'requested' | 'issued' | 'error';
    cloudflareHostnameId: string | null;
    sslError: string | null;
  }): Promise<StoreDomainRecord | null> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        UPDATE store_domains
        SET status = 'active',
            ssl_status = $3,
            cloudflare_hostname_id = COALESCE($4, cloudflare_hostname_id),
            ssl_last_checked_at = NOW(),
            ssl_error = $5,
            activated_at = COALESCE(activated_at, NOW()),
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, hostname, verification_token, status, ssl_status,
                  ssl_provider, ssl_mode, cloudflare_zone_id, cloudflare_hostname_id,
                  ssl_last_checked_at, ssl_error, verified_at, activated_at
      `,
      [input.storeId, input.domainId, input.sslStatus, input.cloudflareHostnameId, input.sslError],
    );
    return result.rows[0] ?? null;
  }

  async updateSslState(input: {
    storeId: string;
    domainId: string;
    sslStatus: 'requested' | 'issued' | 'error';
    cloudflareHostnameId?: string | null;
    sslError: string | null;
  }): Promise<StoreDomainRecord | null> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        UPDATE store_domains
        SET ssl_status = $3,
            cloudflare_hostname_id = COALESCE($4, cloudflare_hostname_id),
            ssl_last_checked_at = NOW(),
            ssl_error = $5,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, hostname, verification_token, status, ssl_status,
                  ssl_provider, ssl_mode, cloudflare_zone_id, cloudflare_hostname_id,
                  ssl_last_checked_at, ssl_error, verified_at, activated_at
      `,
      [
        input.storeId,
        input.domainId,
        input.sslStatus,
        input.cloudflareHostnameId ?? null,
        input.sslError,
      ],
    );

    return result.rows[0] ?? null;
  }

  async delete(storeId: string, domainId: string): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM store_domains
        WHERE store_id = $1
          AND id = $2
      `,
      [storeId, domainId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
