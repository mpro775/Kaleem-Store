import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';

interface Queryable {
  query: <T = unknown>(
    queryText: string,
    values?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
}

export interface AttributeRecord {
  id: string;
  store_id: string;
  name: string;
  slug: string;
}

export interface AttributeValueRecord {
  id: string;
  store_id: string;
  attribute_id: string;
  value: string;
  slug: string;
}

export interface AttributeValueWithAttributeRecord extends AttributeValueRecord {
  attribute_name: string;
  attribute_slug: string;
}

export interface VariantAttributeSelectionRecord {
  variant_id: string;
  attribute_id: string;
  attribute_slug: string;
  attribute_value_id: string;
  value_slug: string;
}

@Injectable()
export class AttributesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listAttributes(storeId: string, q?: string): Promise<AttributeRecord[]> {
    const result = await this.databaseService.db.query<AttributeRecord>(
      `
        SELECT id, store_id, name, slug
        FROM attributes
        WHERE store_id = $1
          AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%' OR slug ILIKE '%' || $2 || '%')
        ORDER BY name ASC
      `,
      [storeId, q ?? null],
    );

    return result.rows;
  }

  async listAttributesByIds(storeId: string, attributeIds: string[]): Promise<AttributeRecord[]> {
    if (attributeIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.db.query<AttributeRecord>(
      `
        SELECT id, store_id, name, slug
        FROM attributes
        WHERE store_id = $1
          AND id = ANY($2::uuid[])
        ORDER BY name ASC
      `,
      [storeId, attributeIds],
    );

    return result.rows;
  }

  async findAttributeById(storeId: string, attributeId: string): Promise<AttributeRecord | null> {
    const result = await this.databaseService.db.query<AttributeRecord>(
      `
        SELECT id, store_id, name, slug
        FROM attributes
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, attributeId],
    );

    return result.rows[0] ?? null;
  }

  async findAttributeBySlug(storeId: string, slug: string): Promise<AttributeRecord | null> {
    const result = await this.databaseService.db.query<AttributeRecord>(
      `
        SELECT id, store_id, name, slug
        FROM attributes
        WHERE store_id = $1
          AND slug = $2
        LIMIT 1
      `,
      [storeId, slug],
    );

    return result.rows[0] ?? null;
  }

  async createAttribute(input: {
    storeId: string;
    name: string;
    slug: string;
  }): Promise<AttributeRecord> {
    const result = await this.databaseService.db.query<AttributeRecord>(
      `
        INSERT INTO attributes (id, store_id, name, slug)
        VALUES ($1, $2, $3, $4)
        RETURNING id, store_id, name, slug
      `,
      [uuidv4(), input.storeId, input.name, input.slug],
    );

    return result.rows[0] as AttributeRecord;
  }

  async updateAttribute(input: {
    storeId: string;
    attributeId: string;
    name: string;
    slug: string;
  }): Promise<AttributeRecord | null> {
    const result = await this.databaseService.db.query<AttributeRecord>(
      `
        UPDATE attributes
        SET name = $3,
            slug = $4,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, name, slug
      `,
      [input.storeId, input.attributeId, input.name, input.slug],
    );

    return result.rows[0] ?? null;
  }

  async deleteAttribute(storeId: string, attributeId: string): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM attributes
        WHERE store_id = $1
          AND id = $2
      `,
      [storeId, attributeId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async listAttributeValues(
    storeId: string,
    attributeId: string,
    q?: string,
  ): Promise<AttributeValueRecord[]> {
    const result = await this.databaseService.db.query<AttributeValueRecord>(
      `
        SELECT id, store_id, attribute_id, value, slug
        FROM attribute_values
        WHERE store_id = $1
          AND attribute_id = $2
          AND ($3::text IS NULL OR value ILIKE '%' || $3 || '%' OR slug ILIKE '%' || $3 || '%')
        ORDER BY value ASC
      `,
      [storeId, attributeId, q ?? null],
    );

    return result.rows;
  }

  async listAttributeValuesByAttributeIds(
    storeId: string,
    attributeIds: string[],
  ): Promise<AttributeValueRecord[]> {
    if (attributeIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.db.query<AttributeValueRecord>(
      `
        SELECT id, store_id, attribute_id, value, slug
        FROM attribute_values
        WHERE store_id = $1
          AND attribute_id = ANY($2::uuid[])
        ORDER BY value ASC
      `,
      [storeId, attributeIds],
    );

    return result.rows;
  }

  async findAttributeValueById(
    storeId: string,
    valueId: string,
  ): Promise<AttributeValueRecord | null> {
    const result = await this.databaseService.db.query<AttributeValueRecord>(
      `
        SELECT id, store_id, attribute_id, value, slug
        FROM attribute_values
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, valueId],
    );

    return result.rows[0] ?? null;
  }

  async findAttributeValueBySlug(
    storeId: string,
    attributeId: string,
    slug: string,
  ): Promise<AttributeValueRecord | null> {
    const result = await this.databaseService.db.query<AttributeValueRecord>(
      `
        SELECT id, store_id, attribute_id, value, slug
        FROM attribute_values
        WHERE store_id = $1
          AND attribute_id = $2
          AND slug = $3
        LIMIT 1
      `,
      [storeId, attributeId, slug],
    );

    return result.rows[0] ?? null;
  }

  async createAttributeValue(input: {
    storeId: string;
    attributeId: string;
    value: string;
    slug: string;
  }): Promise<AttributeValueRecord> {
    const result = await this.databaseService.db.query<AttributeValueRecord>(
      `
        INSERT INTO attribute_values (id, store_id, attribute_id, value, slug)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, store_id, attribute_id, value, slug
      `,
      [uuidv4(), input.storeId, input.attributeId, input.value, input.slug],
    );

    return result.rows[0] as AttributeValueRecord;
  }

  async updateAttributeValue(input: {
    storeId: string;
    valueId: string;
    value: string;
    slug: string;
  }): Promise<AttributeValueRecord | null> {
    const result = await this.databaseService.db.query<AttributeValueRecord>(
      `
        UPDATE attribute_values
        SET value = $3,
            slug = $4,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, attribute_id, value, slug
      `,
      [input.storeId, input.valueId, input.value, input.slug],
    );

    return result.rows[0] ?? null;
  }

  async deleteAttributeValue(storeId: string, valueId: string): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM attribute_values
        WHERE store_id = $1
          AND id = $2
      `,
      [storeId, valueId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async listCategoryAttributeIds(storeId: string, categoryId: string): Promise<string[]> {
    const result = await this.databaseService.db.query<{ attribute_id: string }>(
      `
        SELECT attribute_id
        FROM category_attributes
        WHERE store_id = $1
          AND category_id = $2
        ORDER BY attribute_id ASC
      `,
      [storeId, categoryId],
    );

    return result.rows.map((row) => row.attribute_id);
  }

  async replaceCategoryAttributeIds(
    storeId: string,
    categoryId: string,
    attributeIds: string[],
  ): Promise<void> {
    await this.withTransaction(async (db) => {
      await db.query(
        `
          DELETE FROM category_attributes
          WHERE store_id = $1
            AND category_id = $2
        `,
        [storeId, categoryId],
      );

      for (const attributeId of attributeIds) {
        await db.query(
          `
            INSERT INTO category_attributes (id, store_id, category_id, attribute_id)
            VALUES ($1, $2, $3, $4)
          `,
          [uuidv4(), storeId, categoryId, attributeId],
        );
      }
    });
  }

  async listAttributeValuesByIds(
    storeId: string,
    valueIds: string[],
  ): Promise<AttributeValueWithAttributeRecord[]> {
    if (valueIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.db.query<AttributeValueWithAttributeRecord>(
      `
        SELECT
          av.id,
          av.store_id,
          av.attribute_id,
          av.value,
          av.slug,
          a.name AS attribute_name,
          a.slug AS attribute_slug
        FROM attribute_values av
        INNER JOIN attributes a
          ON a.id = av.attribute_id
         AND a.store_id = av.store_id
        WHERE av.store_id = $1
          AND av.id = ANY($2::uuid[])
      `,
      [storeId, valueIds],
    );

    return result.rows;
  }

  async listVariantAttributeSelections(
    storeId: string,
    variantIds: string[],
  ): Promise<VariantAttributeSelectionRecord[]> {
    if (variantIds.length === 0) {
      return [];
    }

    const result = await this.databaseService.db.query<VariantAttributeSelectionRecord>(
      `
        SELECT
          vav.variant_id,
          vav.attribute_id,
          a.slug AS attribute_slug,
          vav.attribute_value_id,
          av.slug AS value_slug
        FROM variant_attribute_values vav
        INNER JOIN attributes a
          ON a.id = vav.attribute_id
         AND a.store_id = vav.store_id
        INNER JOIN attribute_values av
          ON av.id = vav.attribute_value_id
         AND av.store_id = vav.store_id
        WHERE vav.store_id = $1
          AND vav.variant_id = ANY($2::uuid[])
      `,
      [storeId, variantIds],
    );

    return result.rows;
  }

  async replaceVariantAttributeValues(
    storeId: string,
    variantId: string,
    assignments: Array<{ attributeId: string; attributeValueId: string }>,
  ): Promise<void> {
    await this.withTransaction(async (db) => {
      await db.query(
        `
          DELETE FROM variant_attribute_values
          WHERE store_id = $1
            AND variant_id = $2
        `,
        [storeId, variantId],
      );

      for (const assignment of assignments) {
        await db.query(
          `
            INSERT INTO variant_attribute_values (
              id,
              store_id,
              variant_id,
              attribute_id,
              attribute_value_id
            ) VALUES ($1, $2, $3, $4, $5)
          `,
          [uuidv4(), storeId, variantId, assignment.attributeId, assignment.attributeValueId],
        );
      }
    });
  }

  private async withTransaction<T>(callback: (db: Queryable) => Promise<T>): Promise<T> {
    const client = await this.databaseService.db.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
