import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface StoreSettingsRecord {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  currency_code: string;
  timezone: string;
  shipping_policy: string | null;
  return_policy: string | null;
  privacy_policy: string | null;
  terms_of_service: string | null;
}

export interface StorePublicRecord {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  currency_code: string;
  is_suspended: boolean;
}

@Injectable()
export class StoresRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(storeId: string): Promise<StoreSettingsRecord | null> {
    const result = await this.databaseService.db.query<StoreSettingsRecord>(
      `
        SELECT id, name, slug, logo_url, phone, address, currency_code, timezone
               , shipping_policy, return_policy, privacy_policy, terms_of_service
        FROM stores
        WHERE id = $1
        LIMIT 1
      `,
      [storeId],
    );

    return result.rows[0] ?? null;
  }

  async findBySlug(storeSlug: string): Promise<StorePublicRecord | null> {
    const result = await this.databaseService.db.query<StorePublicRecord>(
      `
        SELECT id, name, slug, logo_url, currency_code, is_suspended
        FROM stores
        WHERE slug = $1
        LIMIT 1
      `,
      [storeSlug],
    );

    return result.rows[0] ?? null;
  }

  async findPublicByHostname(hostname: string): Promise<StorePublicRecord | null> {
    const result = await this.databaseService.db.query<StorePublicRecord>(
      `
        SELECT s.id, s.name, s.slug, s.logo_url, s.currency_code, s.is_suspended
        FROM stores s
        INNER JOIN store_domains d
          ON d.store_id = s.id
        WHERE LOWER(d.hostname) = LOWER($1)
          AND d.status = 'active'
        LIMIT 1
      `,
      [hostname],
    );

    return result.rows[0] ?? null;
  }

  async findPublicById(storeId: string): Promise<StorePublicRecord | null> {
    const result = await this.databaseService.db.query<StorePublicRecord>(
      `
        SELECT id, name, slug, logo_url, currency_code, is_suspended
        FROM stores
        WHERE id = $1
        LIMIT 1
      `,
      [storeId],
    );

    return result.rows[0] ?? null;
  }

  async updateSettings(input: {
    storeId: string;
    name: string;
    currencyCode: string;
    timezone: string;
    logoUrl: string | null;
    phone: string | null;
    address: string | null;
    shippingPolicy: string | null;
    returnPolicy: string | null;
    privacyPolicy: string | null;
    termsOfService: string | null;
  }): Promise<StoreSettingsRecord> {
    const result = await this.databaseService.db.query<StoreSettingsRecord>(
      `
        UPDATE stores
        SET name = $2,
            currency_code = $3,
            timezone = $4,
            logo_url = $5,
            phone = $6,
            address = $7,
            shipping_policy = $8,
            return_policy = $9,
            privacy_policy = $10,
            terms_of_service = $11,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, slug, logo_url, phone, address, currency_code, timezone,
                  shipping_policy, return_policy, privacy_policy, terms_of_service
      `,
      [
        input.storeId,
        input.name,
        input.currencyCode,
        input.timezone,
        input.logoUrl,
        input.phone,
        input.address,
        input.shippingPolicy,
        input.returnPolicy,
        input.privacyPolicy,
        input.termsOfService,
      ],
    );

    return result.rows[0] as StoreSettingsRecord;
  }
}
