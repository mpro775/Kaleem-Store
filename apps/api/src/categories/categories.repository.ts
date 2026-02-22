import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface CategoryRecord {
  id: string;
  store_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

@Injectable()
export class CategoriesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(storeId: string, categoryId: string): Promise<CategoryRecord | null> {
    const result = await this.databaseService.db.query<CategoryRecord>(
      `
        SELECT id, store_id, parent_id, name, slug, description, sort_order, is_active
        FROM categories
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, categoryId],
    );
    return result.rows[0] ?? null;
  }

  async findBySlug(storeId: string, slug: string): Promise<CategoryRecord | null> {
    const result = await this.databaseService.db.query<CategoryRecord>(
      `
        SELECT id, store_id, parent_id, name, slug, description, sort_order, is_active
        FROM categories
        WHERE store_id = $1
          AND slug = $2
        LIMIT 1
      `,
      [storeId, slug],
    );
    return result.rows[0] ?? null;
  }

  async create(input: {
    id: string;
    storeId: string;
    parentId: string | null;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  }): Promise<CategoryRecord> {
    const result = await this.databaseService.db.query<CategoryRecord>(
      `
        INSERT INTO categories (
          id, store_id, parent_id, name, slug, description, sort_order, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, store_id, parent_id, name, slug, description, sort_order, is_active
      `,
      [
        input.id,
        input.storeId,
        input.parentId,
        input.name,
        input.slug,
        input.description,
        input.sortOrder,
        input.isActive,
      ],
    );

    return result.rows[0] as CategoryRecord;
  }

  async list(
    storeId: string,
    filters: { q?: string | undefined; parentId?: string | undefined },
  ): Promise<CategoryRecord[]> {
    const result = await this.databaseService.db.query<CategoryRecord>(
      `
        SELECT id, store_id, parent_id, name, slug, description, sort_order, is_active
        FROM categories
        WHERE store_id = $1
          AND ($2::text IS NULL OR parent_id = $2::uuid)
          AND ($3::text IS NULL OR name ILIKE '%' || $3 || '%' OR slug ILIKE '%' || $3 || '%')
        ORDER BY sort_order ASC, created_at DESC
      `,
      [storeId, filters.parentId ?? null, filters.q ?? null],
    );

    return result.rows;
  }

  async listActive(storeId: string): Promise<CategoryRecord[]> {
    const result = await this.databaseService.db.query<CategoryRecord>(
      `
        SELECT id, store_id, parent_id, name, slug, description, sort_order, is_active
        FROM categories
        WHERE store_id = $1
          AND is_active = TRUE
        ORDER BY sort_order ASC, created_at DESC
      `,
      [storeId],
    );

    return result.rows;
  }

  async update(input: {
    storeId: string;
    categoryId: string;
    parentId: string | null;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
    isActive: boolean;
  }): Promise<CategoryRecord | null> {
    const result = await this.databaseService.db.query<CategoryRecord>(
      `
        UPDATE categories
        SET parent_id = $3,
            name = $4,
            slug = $5,
            description = $6,
            sort_order = $7,
            is_active = $8,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, store_id, parent_id, name, slug, description, sort_order, is_active
      `,
      [
        input.storeId,
        input.categoryId,
        input.parentId,
        input.name,
        input.slug,
        input.description,
        input.sortOrder,
        input.isActive,
      ],
    );

    return result.rows[0] ?? null;
  }

  async delete(storeId: string, categoryId: string): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM categories
        WHERE store_id = $1
          AND id = $2
      `,
      [storeId, categoryId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async hasChildren(storeId: string, categoryId: string): Promise<boolean> {
    const result = await this.databaseService.db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM categories
          WHERE store_id = $1
            AND parent_id = $2
        ) AS exists
      `,
      [storeId, categoryId],
    );

    return Boolean(result.rows[0]?.exists);
  }

  async hasProducts(storeId: string, categoryId: string): Promise<boolean> {
    const result = await this.databaseService.db.query<{ exists: boolean }>(
      `
        SELECT EXISTS(
          SELECT 1
          FROM products
          WHERE store_id = $1
            AND category_id = $2
        ) AS exists
      `,
      [storeId, categoryId],
    );

    return Boolean(result.rows[0]?.exists);
  }
}
