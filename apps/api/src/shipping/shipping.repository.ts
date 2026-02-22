import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

export interface ShippingZoneRecord {
  id: string;
  store_id: string;
  name: string;
  city: string | null;
  area: string | null;
  fee: string;
  is_active: boolean;
}

@Injectable()
export class ShippingRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: {
    storeId: string;
    name: string;
    city: string | null;
    area: string | null;
    fee: number;
    isActive: boolean;
  }): Promise<ShippingZoneRecord> {
    const result = await this.databaseService.db.query<ShippingZoneRecord>(
      `
        INSERT INTO shipping_zones (id, store_id, name, city, area, fee, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, store_id, name, city, area, fee, is_active
      `,
      [uuidv4(), input.storeId, input.name, input.city, input.area, input.fee, input.isActive],
    );
    return result.rows[0] as ShippingZoneRecord;
  }

  async list(storeId: string, q?: string): Promise<ShippingZoneRecord[]> {
    const result = await this.databaseService.db.query<ShippingZoneRecord>(
      `
        SELECT id, store_id, name, city, area, fee, is_active
        FROM shipping_zones
        WHERE store_id = $1
          AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%' OR city ILIKE '%' || $2 || '%' OR area ILIKE '%' || $2 || '%')
        ORDER BY created_at DESC
      `,
      [storeId, q ?? null],
    );
    return result.rows;
  }

  async findById(storeId: string, zoneId: string): Promise<ShippingZoneRecord | null> {
    const result = await this.databaseService.db.query<ShippingZoneRecord>(
      `
        SELECT id, store_id, name, city, area, fee, is_active
        FROM shipping_zones
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, zoneId],
    );
    return result.rows[0] ?? null;
  }

  async findActiveById(storeId: string, zoneId: string): Promise<ShippingZoneRecord | null> {
    const result = await this.databaseService.db.query<ShippingZoneRecord>(
      `
        SELECT id, store_id, name, city, area, fee, is_active
        FROM shipping_zones
        WHERE store_id = $1
          AND id = $2
          AND is_active = TRUE
        LIMIT 1
      `,
      [storeId, zoneId],
    );
    return result.rows[0] ?? null;
  }

  async update(input: {
    storeId: string;
    zoneId: string;
    name: string;
    city: string | null;
    area: string | null;
    fee: number;
    isActive: boolean;
  }): Promise<ShippingZoneRecord | null> {
    const result = await this.databaseService.db.query<ShippingZoneRecord>(
      `
        UPDATE shipping_zones
        SET name = $3,
            city = $4,
            area = $5,
            fee = $6,
            is_active = $7,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, name, city, area, fee, is_active
      `,
      [input.storeId, input.zoneId, input.name, input.city, input.area, input.fee, input.isActive],
    );
    return result.rows[0] ?? null;
  }

  async delete(storeId: string, zoneId: string): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM shipping_zones
        WHERE store_id = $1
          AND id = $2
      `,
      [storeId, zoneId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}
