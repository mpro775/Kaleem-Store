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
  }): Promise<StoreDomainRecord> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        INSERT INTO store_domains (
          id,
          store_id,
          hostname,
          verification_token,
          status,
          ssl_status
        ) VALUES ($1, $2, $3, $4, 'pending', 'pending')
        RETURNING id, store_id, hostname, verification_token, status, ssl_status, verified_at, activated_at
      `,
      [uuidv4(), input.storeId, input.hostname, input.verificationToken],
    );
    return result.rows[0] as StoreDomainRecord;
  }

  async list(storeId: string): Promise<StoreDomainRecord[]> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        SELECT id, store_id, hostname, verification_token, status, ssl_status, verified_at, activated_at
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
      `,
      [storeId, domainId],
    );
    return result.rows[0] ?? null;
  }

  async markActive(storeId: string, domainId: string): Promise<StoreDomainRecord | null> {
    const result = await this.databaseService.db.query<StoreDomainRecord>(
      `
        UPDATE store_domains
        SET status = 'active',
            ssl_status = 'issued',
            activated_at = COALESCE(activated_at, NOW()),
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, hostname, verification_token, status, ssl_status, verified_at, activated_at
      `,
      [storeId, domainId],
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
