import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type { ProductStatus } from './constants/product-status.constants';

export interface ProductRecord {
  id: string;
  store_id: string;
  category_id: string | null;
  title: string;
  title_ar: string | null;
  title_en: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  description_en: string | null;
  status: ProductStatus;
  brand: string | null;
  weight: string | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  cost_price: string | null;
  seo_title: string | null;
  seo_description: string | null;
  tags: string[];
  is_featured: boolean;
  is_taxable: boolean;
  tax_rate: string;
  min_order_quantity: number;
  max_order_quantity: number | null;
  published_at: string | null;
  rating_avg: string;
  rating_count: number;
}

export interface ProductVariantRecord {
  id: string;
  product_id: string;
  store_id: string;
  title: string;
  title_ar: string | null;
  title_en: string | null;
  sku: string;
  barcode: string | null;
  price: string;
  compare_at_price: string | null;
  stock_quantity: number;
  low_stock_threshold: number;
  attributes: Record<string, string>;
  is_default: boolean;
}

export interface ProductImageRecord {
  id: string;
  product_id: string;
  variant_id: string | null;
  media_asset_id: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface MediaAssetRecord {
  id: string;
  store_id: string;
  public_url: string;
  mime_type: string;
  file_size_bytes: number;
}

const PRODUCT_COLUMNS = `id, store_id, category_id, title, title_ar, title_en, slug, description, description_ar, description_en, status, brand, weight, dimensions, cost_price, seo_title, seo_description, tags, is_featured, is_taxable, tax_rate, min_order_quantity, max_order_quantity, published_at, rating_avg, rating_count`;

export interface ProductListAttributeFilter {
  attributeSlug: string;
  valueSlugs: string[];
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async findById(storeId: string, productId: string): Promise<ProductRecord | null> {
    const result = await this.databaseService.db.query<ProductRecord>(
      `
        SELECT ${PRODUCT_COLUMNS}
        FROM products
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, productId],
    );
    return result.rows[0] ?? null;
  }

  async findBySlug(storeId: string, slug: string): Promise<ProductRecord | null> {
    const result = await this.databaseService.db.query<ProductRecord>(
      `
        SELECT ${PRODUCT_COLUMNS}
        FROM products
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
    categoryId: string | null;
    title: string;
    titleAr: string | null;
    titleEn: string | null;
    slug: string;
    description: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    status: ProductStatus;
    brand: string | null;
    weight: number | null;
    dimensions: { length?: number; width?: number; height?: number } | null;
    costPrice: number | null;
    seoTitle: string | null;
    seoDescription: string | null;
    tags: string[];
    isFeatured: boolean;
    isTaxable: boolean;
    taxRate: number;
    minOrderQuantity: number;
    maxOrderQuantity: number | null;
  }): Promise<ProductRecord> {
    const result = await this.databaseService.db.query<ProductRecord>(
      `
        INSERT INTO products (id, store_id, category_id, title, title_ar, title_en, slug, description, description_ar, description_en, status, brand, weight, dimensions, cost_price, seo_title, seo_description, tags, is_featured, is_taxable, tax_rate, min_order_quantity, max_order_quantity)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING ${PRODUCT_COLUMNS}
      `,
      [
        input.id,
        input.storeId,
        input.categoryId,
        input.title,
        input.titleAr,
        input.titleEn,
        input.slug,
        input.description,
        input.descriptionAr,
        input.descriptionEn,
        input.status,
        input.brand,
        input.weight,
        input.dimensions ? JSON.stringify(input.dimensions) : null,
        input.costPrice,
        input.seoTitle,
        input.seoDescription,
        input.tags,
        input.isFeatured,
        input.isTaxable,
        input.taxRate,
        input.minOrderQuantity,
        input.maxOrderQuantity,
      ],
    );
    return result.rows[0] as ProductRecord;
  }

  async list(input: {
    storeId: string;
    q?: string | undefined;
    status?: ProductStatus | undefined;
    categoryId?: string | undefined;
    isFeatured?: boolean | undefined;
    brand?: string | undefined;
    attributeFilters?: ProductListAttributeFilter[] | undefined;
    limit: number;
    offset: number;
  }): Promise<{ rows: ProductRecord[]; total: number }> {
    const listQuery = this.buildListQuery(input);

    const rowsResult = await this.databaseService.db.query<ProductRecord>(
      `
        SELECT ${PRODUCT_COLUMNS}
        FROM products p
        WHERE ${listQuery.whereClause}
        ORDER BY created_at DESC
        LIMIT $${listQuery.nextParam} OFFSET $${listQuery.nextParam + 1}
      `,
      [...listQuery.values, input.limit, input.offset],
    );

    const countResult = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM products p
        WHERE ${listQuery.whereClause}
      `,
      listQuery.values,
    );

    return {
      rows: rowsResult.rows,
      total: Number(countResult.rows[0]?.total ?? '0'),
    };
  }

  async updateVariantAttributes(input: {
    storeId: string;
    variantId: string;
    attributes: Record<string, string>;
  }): Promise<ProductVariantRecord | null> {
    const result = await this.databaseService.db.query<ProductVariantRecord>(
      `
        UPDATE product_variants
        SET attributes = $3::jsonb,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING id, product_id, store_id, title, title_ar, title_en, sku, barcode, price, compare_at_price, stock_quantity, low_stock_threshold, attributes, is_default
      `,
      [input.storeId, input.variantId, JSON.stringify(input.attributes)],
    );

    return result.rows[0] ?? null;
  }

  async update(input: {
    storeId: string;
    productId: string;
    categoryId: string | null;
    title: string;
    titleAr: string | null;
    titleEn: string | null;
    slug: string;
    description: string | null;
    descriptionAr: string | null;
    descriptionEn: string | null;
    status: ProductStatus;
    brand: string | null;
    weight: number | null;
    dimensions: { length?: number; width?: number; height?: number } | null;
    costPrice: number | null;
    seoTitle: string | null;
    seoDescription: string | null;
    tags: string[];
    isFeatured: boolean;
    isTaxable: boolean;
    taxRate: number;
    minOrderQuantity: number;
    maxOrderQuantity: number | null;
  }): Promise<ProductRecord | null> {
    const result = await this.databaseService.db.query<ProductRecord>(
      `
        UPDATE products
        SET category_id = $3,
            title = $4,
            title_ar = $5,
            title_en = $6,
            slug = $7,
            description = $8,
            description_ar = $9,
            description_en = $10,
            status = $11,
            brand = $12,
            weight = $13,
            dimensions = $14::jsonb,
            cost_price = $15,
            seo_title = $16,
            seo_description = $17,
            tags = $18,
            is_featured = $19,
            is_taxable = $20,
            tax_rate = $21,
            min_order_quantity = $22,
            max_order_quantity = $23,
            updated_at = NOW()
        WHERE store_id = $1
          AND id = $2
        RETURNING ${PRODUCT_COLUMNS}
      `,
      [
        input.storeId,
        input.productId,
        input.categoryId,
        input.title,
        input.titleAr,
        input.titleEn,
        input.slug,
        input.description,
        input.descriptionAr,
        input.descriptionEn,
        input.status,
        input.brand,
        input.weight,
        input.dimensions ? JSON.stringify(input.dimensions) : null,
        input.costPrice,
        input.seoTitle,
        input.seoDescription,
        input.tags,
        input.isFeatured,
        input.isTaxable,
        input.taxRate,
        input.minOrderQuantity,
        input.maxOrderQuantity,
      ],
    );

    return result.rows[0] ?? null;
  }

  async delete(storeId: string, productId: string): Promise<boolean> {
    const result = await this.databaseService.db.query(
      `
        DELETE FROM products
        WHERE store_id = $1
          AND id = $2
      `,
      [storeId, productId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async createVariant(input: {
    id?: string;
    productId: string;
    storeId: string;
    title: string;
    titleAr: string | null;
    titleEn: string | null;
    sku: string;
    barcode: string | null;
    price: number;
    compareAtPrice: number | null;
    stockQuantity: number;
    lowStockThreshold: number;
    attributes: Record<string, string>;
    isDefault: boolean;
  }): Promise<ProductVariantRecord> {
    const result = await this.databaseService.db.query<ProductVariantRecord>(
      `
        INSERT INTO product_variants (
          id,
          product_id,
          store_id,
          title,
          title_ar,
          title_en,
          sku,
          barcode,
          price,
          compare_at_price,
          stock_quantity,
          low_stock_threshold,
          attributes,
          is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14)
        RETURNING id, product_id, store_id, title, title_ar, title_en, sku, barcode, price, compare_at_price, stock_quantity, low_stock_threshold, attributes, is_default
      `,
      [
        input.id ?? uuidv4(),
        input.productId,
        input.storeId,
        input.title,
        input.titleAr,
        input.titleEn,
        input.sku,
        input.barcode,
        input.price,
        input.compareAtPrice,
        input.stockQuantity,
        input.lowStockThreshold,
        JSON.stringify(input.attributes),
        input.isDefault,
      ],
    );

    return result.rows[0] as ProductVariantRecord;
  }

  async unsetDefaultVariants(
    storeId: string,
    productId: string,
    exceptVariantId: string,
  ): Promise<void> {
    await this.databaseService.db.query(
      `
        UPDATE product_variants
        SET is_default = FALSE,
            updated_at = NOW()
        WHERE store_id = $1
          AND product_id = $2
          AND id <> $3
      `,
      [storeId, productId, exceptVariantId],
    );
  }

  async listVariants(storeId: string, productId: string): Promise<ProductVariantRecord[]> {
    const result = await this.databaseService.db.query<ProductVariantRecord>(
      `
        SELECT id, product_id, store_id, title, title_ar, title_en, sku, barcode, price, compare_at_price, stock_quantity, low_stock_threshold, attributes, is_default
        FROM product_variants
        WHERE store_id = $1
          AND product_id = $2
        ORDER BY is_default DESC, created_at ASC
      `,
      [storeId, productId],
    );
    return result.rows;
  }

  async findVariantById(storeId: string, variantId: string): Promise<ProductVariantRecord | null> {
    const result = await this.databaseService.db.query<ProductVariantRecord>(
      `
        SELECT id, product_id, store_id, title, title_ar, title_en, sku, barcode, price, compare_at_price, stock_quantity, low_stock_threshold, attributes, is_default
        FROM product_variants
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, variantId],
    );
    return result.rows[0] ?? null;
  }

  async findVariantBySku(storeId: string, sku: string): Promise<ProductVariantRecord | null> {
    const result = await this.databaseService.db.query<ProductVariantRecord>(
      `
        SELECT id, product_id, store_id, title, title_ar, title_en, sku, barcode, price, compare_at_price, stock_quantity, low_stock_threshold, attributes, is_default
        FROM product_variants
        WHERE store_id = $1
          AND LOWER(sku) = LOWER($2)
        LIMIT 1
      `,
      [storeId, sku],
    );
    return result.rows[0] ?? null;
  }

  async countVariants(storeId: string, productId: string): Promise<number> {
    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM product_variants
        WHERE store_id = $1
          AND product_id = $2
      `,
      [storeId, productId],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async attachImage(input: {
    storeId: string;
    productId: string;
    variantId: string | null;
    mediaAssetId: string;
    altText: string | null;
    sortOrder: number;
    isPrimary: boolean;
  }): Promise<ProductImageRecord> {
    if (input.isPrimary) {
      await this.clearPrimaryImage(input.storeId, input.productId);
    }

    const result = await this.databaseService.db.query<ProductImageRecord>(
      `
        INSERT INTO product_images (
          id,
          store_id,
          product_id,
          variant_id,
          media_asset_id,
          alt_text,
          sort_order,
          is_primary
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, product_id, variant_id, media_asset_id, alt_text, sort_order, is_primary,
          (SELECT public_url FROM media_assets WHERE id = $5) AS public_url
      `,
      [
        uuidv4(),
        input.storeId,
        input.productId,
        input.variantId,
        input.mediaAssetId,
        input.altText,
        input.sortOrder,
        input.isPrimary,
      ],
    );
    return result.rows[0] as ProductImageRecord;
  }

  async listProductImages(storeId: string, productId: string): Promise<ProductImageRecord[]> {
    const result = await this.databaseService.db.query<ProductImageRecord>(
      `
        SELECT
          pi.id,
          pi.product_id,
          pi.variant_id,
          pi.media_asset_id,
          ma.public_url,
          pi.alt_text,
          pi.sort_order,
          pi.is_primary
        FROM product_images pi
        INNER JOIN media_assets ma ON ma.id = pi.media_asset_id
        WHERE pi.store_id = $1
          AND pi.product_id = $2
        ORDER BY pi.is_primary DESC, pi.sort_order ASC, pi.created_at ASC
      `,
      [storeId, productId],
    );
    return result.rows;
  }

  async findMediaAssetById(
    storeId: string,
    mediaAssetId: string,
  ): Promise<MediaAssetRecord | null> {
    const result = await this.databaseService.db.query<MediaAssetRecord>(
      `
        SELECT id, store_id, public_url, mime_type, file_size_bytes
        FROM media_assets
        WHERE store_id = $1
          AND id = $2
        LIMIT 1
      `,
      [storeId, mediaAssetId],
    );
    return result.rows[0] ?? null;
  }

  async countProductImages(storeId: string, productId: string): Promise<number> {
    const result = await this.databaseService.db.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM product_images
        WHERE store_id = $1
          AND product_id = $2
      `,
      [storeId, productId],
    );
    return Number(result.rows[0]?.total ?? '0');
  }

  async clearPrimaryImage(storeId: string, productId: string): Promise<void> {
    await this.databaseService.db.query(
      `
        UPDATE product_images
        SET is_primary = FALSE,
            updated_at = NOW()
        WHERE store_id = $1
          AND product_id = $2
          AND is_primary = TRUE
      `,
      [storeId, productId],
    );
  }

  private buildListQuery(input: {
    storeId: string;
    q?: string | undefined;
    status?: ProductStatus | undefined;
    categoryId?: string | undefined;
    isFeatured?: boolean | undefined;
    brand?: string | undefined;
    attributeFilters?: ProductListAttributeFilter[] | undefined;
  }): { whereClause: string; values: unknown[]; nextParam: number } {
    const conditions: string[] = ['p.store_id = $1'];
    const values: unknown[] = [input.storeId];
    let nextParam = 2;

    if (input.status) {
      conditions.push(`p.status = $${nextParam}`);
      values.push(input.status);
      nextParam += 1;
    }

    if (input.categoryId) {
      conditions.push(`p.category_id = $${nextParam}`);
      values.push(input.categoryId);
      nextParam += 1;
    }

    if (input.isFeatured !== undefined) {
      conditions.push(`p.is_featured = $${nextParam}`);
      values.push(input.isFeatured);
      nextParam += 1;
    }

    if (input.brand) {
      conditions.push(`p.brand = $${nextParam}`);
      values.push(input.brand);
      nextParam += 1;
    }

    if (input.q) {
      conditions.push(
        `(p.title ILIKE '%' || $${nextParam} || '%' OR p.title_ar ILIKE '%' || $${nextParam} || '%' OR p.title_en ILIKE '%' || $${nextParam} || '%' OR p.slug ILIKE '%' || $${nextParam} || '%')`,
      );
      values.push(input.q);
      nextParam += 1;
    }

    const filters = input.attributeFilters ?? [];
    for (const filter of filters) {
      conditions.push(this.buildAttributeFilterClause(nextParam, nextParam + 1));
      values.push(filter.attributeSlug, filter.valueSlugs);
      nextParam += 2;
    }

    return {
      whereClause: conditions.join(' AND '),
      values,
      nextParam,
    };
  }

  private buildAttributeFilterClause(attributeSlugParam: number, valueSlugsParam: number): string {
    return `EXISTS (
      SELECT 1
      FROM product_variants pv
      INNER JOIN variant_attribute_values vav
        ON vav.variant_id = pv.id
       AND vav.store_id = pv.store_id
      INNER JOIN attributes a
        ON a.id = vav.attribute_id
       AND a.store_id = pv.store_id
      INNER JOIN attribute_values av
        ON av.id = vav.attribute_value_id
       AND av.store_id = pv.store_id
      WHERE pv.store_id = p.store_id
        AND pv.product_id = p.id
        AND a.slug = $${attributeSlugParam}
        AND av.slug = ANY($${valueSlugsParam}::text[])
    )`;
  }

  async setPublishedAt(storeId: string, productId: string): Promise<void> {
    await this.databaseService.db.query(
      `UPDATE products SET published_at = COALESCE(published_at, NOW()), updated_at = NOW() WHERE store_id = $1 AND id = $2`,
      [storeId, productId],
    );
  }

  async updateRating(storeId: string, productId: string, avg: number, count: number): Promise<void> {
    await this.databaseService.db.query(
      `UPDATE products SET rating_avg = $3, rating_count = $4, updated_at = NOW() WHERE store_id = $1 AND id = $2`,
      [storeId, productId, avg, count],
    );
  }
}
