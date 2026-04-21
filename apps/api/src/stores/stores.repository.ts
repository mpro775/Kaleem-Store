import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface StoreSettingsRecord {
  id: string;
  name: string;
  slug: string;
  logo_media_asset_id: string | null;
  logo_url: string | null;
  favicon_media_asset_id: string | null;
  favicon_url: string | null;
  business_category: string | null;
  onboarding_completed_at: Date | null;
  phone: string | null;
  address: string | null;
  country: string;
  city: string | null;
  address_details: string | null;
  latitude: number | null;
  longitude: number | null;
  working_hours: Array<{ day: string; isClosed: boolean; slots: Array<{ open: string; close: string }> }>;
  social_links: Record<string, unknown>;
  currency_code: string;
  timezone: string;
  shipping_policy: string | null;
  return_policy: string | null;
  privacy_policy: string | null;
  terms_of_service: string | null;
  loyalty_policy: string | null;
}

export interface StorePublicRecord {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  favicon_url: string | null;
  currency_code: string;
  is_suspended: boolean;
}

@Injectable()
export class StoresRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(storeId: string): Promise<StoreSettingsRecord | null> {
    const result = await this.databaseService.db.query<StoreSettingsRecord>(
      `
        SELECT id, name, slug, logo_media_asset_id, logo_url, phone, address,
               favicon_media_asset_id, favicon_url, business_category, onboarding_completed_at,
               country, city, address_details, latitude, longitude,
               working_hours, social_links,
               currency_code, timezone,
               shipping_policy, return_policy, privacy_policy, terms_of_service
               , loyalty_policy
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
        SELECT id, name, slug, logo_url, favicon_url, currency_code, is_suspended
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
        SELECT s.id, s.name, s.slug, s.logo_url, s.favicon_url, s.currency_code, s.is_suspended
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
        SELECT id, name, slug, logo_url, favicon_url, currency_code, is_suspended
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
    slug: string;
    currencyCode: string;
    timezone: string;
    logoMediaAssetId: string | null;
    logoUrl: string | null;
    faviconMediaAssetId: string | null;
    faviconUrl: string | null;
    businessCategory: string | null;
    phone: string | null;
    address: string | null;
    country: string;
    city: string | null;
    addressDetails: string | null;
    latitude: number | null;
    longitude: number | null;
    workingHours: Array<{ day: string; isClosed: boolean; slots: Array<{ open: string; close: string }> }>;
    socialLinks: Record<string, unknown>;
    shippingPolicy: string | null;
    returnPolicy: string | null;
    privacyPolicy: string | null;
    termsOfService: string | null;
    loyaltyPolicy: string | null;
    onboardingCompletedAt: Date | null;
  }): Promise<StoreSettingsRecord> {
    const result = await this.databaseService.db.query<StoreSettingsRecord>(
      `
        UPDATE stores
        SET name = $2,
            slug = $3,
            currency_code = $4,
            timezone = $5,
            logo_media_asset_id = $6,
            logo_url = $7,
            favicon_media_asset_id = $8,
            favicon_url = $9,
            business_category = $10,
            phone = $11,
            address = $12,
            country = $13,
            city = $14,
            address_details = $15,
            latitude = $16,
            longitude = $17,
            working_hours = $18::jsonb,
            social_links = $19::jsonb,
            shipping_policy = $20,
            return_policy = $21,
            privacy_policy = $22,
            terms_of_service = $23,
            loyalty_policy = $24,
            onboarding_completed_at = $25,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id, name, slug, logo_media_asset_id, logo_url,
                  favicon_media_asset_id, favicon_url, business_category, onboarding_completed_at,
                  phone, address,
                  country, city, address_details, latitude, longitude,
                  working_hours, social_links,
                  currency_code, timezone,
                  shipping_policy, return_policy, privacy_policy, terms_of_service, loyalty_policy
      `,
      [
        input.storeId,
        input.name,
        input.slug,
        input.currencyCode,
        input.timezone,
        input.logoMediaAssetId,
        input.logoUrl,
        input.faviconMediaAssetId,
        input.faviconUrl,
        input.businessCategory,
        input.phone,
        input.address,
        input.country,
        input.city,
        input.addressDetails,
        input.latitude,
        input.longitude,
        JSON.stringify(input.workingHours),
        JSON.stringify(input.socialLinks),
        input.shippingPolicy,
        input.returnPolicy,
        input.privacyPolicy,
        input.termsOfService,
        input.loyaltyPolicy,
        input.onboardingCompletedAt,
      ],
    );

    return result.rows[0] as StoreSettingsRecord;
  }

  async findStoreBySlug(storeSlug: string): Promise<{ id: string; slug: string } | null> {
    const result = await this.databaseService.db.query<{ id: string; slug: string }>(
      `
        SELECT id, slug
        FROM stores
        WHERE slug = $1
        LIMIT 1
      `,
      [storeSlug],
    );

    return result.rows[0] ?? null;
  }
}
