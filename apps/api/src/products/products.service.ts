import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  AttributesService,
  type ResolvedVariantAttributes,
} from '../attributes/attributes.service';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CategoriesRepository } from '../categories/categories.repository';
import type { RequestContextData } from '../common/utils/request-context.util';
import { slugify } from '../common/utils/slug.util';
import { SaasService } from '../saas/saas.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import type { AttachProductImageDto } from './dto/attach-product-image.dto';
import type { CreateProductDto } from './dto/create-product.dto';
import type { CreateVariantDto } from './dto/create-variant.dto';
import type { ListProductsQueryDto } from './dto/list-products-query.dto';
import type { UpdateProductDto } from './dto/update-product.dto';
import type { ProductStatus } from './constants/product-status.constants';
import {
  ProductsRepository,
  type ProductImageRecord,
  type ProductRecord,
  type ProductVariantRecord,
} from './products.repository';

export interface ProductVariantResponse {
  id: string;
  productId: string;
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
  attributeValueIds: string[];
  isDefault: boolean;
}

export interface ProductImageResponse {
  id: string;
  productId: string;
  variantId: string | null;
  mediaAssetId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductResponse {
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
  variants?: ProductVariantResponse[];
  images?: ProductImageResponse[];
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
  publishedAt: string | null;
  ratingAvg: number;
  ratingCount: number;
}

export interface ProductListResponse {
  items: ProductResponse[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly attributesService: AttributesService,
    private readonly auditService: AuditService,
    private readonly saasService: SaasService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async create(
    currentUser: AuthUser,
    input: CreateProductDto,
    context: RequestContextData,
  ): Promise<ProductResponse> {
    await this.saasService.assertMetricCanGrow(currentUser.storeId, 'products.total', 1);

    const primaryArabicTitle = this.resolvePrimaryArabicTitle(input.title, input.titleAr);
    const slug = this.resolveSlug(primaryArabicTitle, input.slug);
    await this.ensureProductSlugAvailable(currentUser.storeId, slug);
    await this.validateCategory(currentUser.storeId, input.categoryId ?? null);

    const product = await this.productsRepository.create({
      id: uuidv4(),
      storeId: currentUser.storeId,
      categoryId: input.categoryId ?? null,
      title: primaryArabicTitle,
      titleAr: primaryArabicTitle,
      titleEn: input.titleEn ?? null,
      slug,
      description: input.description?.trim() ?? null,
      descriptionAr: input.descriptionAr ?? null,
      descriptionEn: input.descriptionEn ?? null,
      status: input.status ?? 'draft',
      brand: input.brand?.trim() ?? null,
      weight: input.weight ?? null,
      dimensions: input.dimensions ?? null,
      costPrice: input.costPrice ?? null,
      seoTitle: input.seoTitle?.trim() ?? null,
      seoDescription: input.seoDescription?.trim() ?? null,
      tags: input.tags ?? [],
      isFeatured: input.isFeatured ?? false,
      isTaxable: input.isTaxable ?? true,
      taxRate: input.taxRate ?? 0,
      minOrderQuantity: input.minOrderQuantity ?? 1,
      maxOrderQuantity: input.maxOrderQuantity ?? null,
    });

    await this.logProductAction('products.created', currentUser, product.id, context);
    await this.webhooksService.dispatchEvent(currentUser.storeId, 'product.created', {
      productId: product.id,
      title: product.title,
      slug: product.slug,
      status: product.status,
    });
    return this.toProductResponse(product);
  }

  async list(currentUser: AuthUser, query: ListProductsQueryDto): Promise<ProductListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;

    const data = await this.productsRepository.list({
      storeId: currentUser.storeId,
      q: query.q?.trim(),
      status: query.status,
      categoryId: query.categoryId,
      limit,
      offset,
    });

    return {
      items: data.rows.map((record) => this.toProductResponse(record)),
      total: data.total,
      page,
      limit,
    };
  }

  async getById(currentUser: AuthUser, productId: string): Promise<ProductResponse> {
    const product = await this.requireProduct(currentUser.storeId, productId);
    const [variants, images] = await Promise.all([
      this.productsRepository.listVariants(currentUser.storeId, productId),
      this.productsRepository.listProductImages(currentUser.storeId, productId),
    ]);
    const variantAttributeState = await this.attributesService.listVariantAttributeState(
      currentUser.storeId,
      variants.map((variant) => variant.id),
    );

    return {
      ...this.toProductResponse(product),
      variants: variants.map((variant) =>
        this.toVariantResponse(variant, variantAttributeState.get(variant.id)?.valueIds ?? []),
      ),
      images: images.map((image) => this.toImageResponse(image)),
    };
  }

  async update(
    currentUser: AuthUser,
    productId: string,
    input: UpdateProductDto,
    context: RequestContextData,
  ): Promise<ProductResponse> {
    const existing = await this.requireProduct(currentUser.storeId, productId);
    const slug = this.getNextSlug(existing, input);
    const primaryArabicTitle = this.resolvePrimaryArabicTitle(
      input.title ?? existing.title,
      input.titleAr ?? existing.title_ar,
    );
    if (slug !== existing.slug) {
      await this.ensureProductSlugAvailable(currentUser.storeId, slug, productId);
    }

    const categoryId = input.categoryId ?? existing.category_id;
    await this.validateCategory(currentUser.storeId, categoryId);

    const updated = await this.productsRepository.update({
      storeId: currentUser.storeId,
      productId,
      categoryId,
      title: primaryArabicTitle,
      titleAr: primaryArabicTitle,
      titleEn: input.titleEn ?? existing.title_en,
      slug,
      description: input.description?.trim() ?? existing.description,
      descriptionAr: input.descriptionAr ?? existing.description_ar,
      descriptionEn: input.descriptionEn ?? existing.description_en,
      status: input.status ?? existing.status,
      brand: input.brand?.trim() ?? existing.brand,
      weight: input.weight ?? (existing.weight ? Number(existing.weight) : null),
      dimensions: input.dimensions ?? existing.dimensions,
      costPrice: input.costPrice ?? (existing.cost_price ? Number(existing.cost_price) : null),
      seoTitle: input.seoTitle?.trim() ?? existing.seo_title,
      seoDescription: input.seoDescription?.trim() ?? existing.seo_description,
      tags: input.tags ?? existing.tags,
      isFeatured: input.isFeatured ?? existing.is_featured,
      isTaxable: input.isTaxable ?? existing.is_taxable,
      taxRate: input.taxRate ?? Number(existing.tax_rate),
      minOrderQuantity: input.minOrderQuantity ?? existing.min_order_quantity,
      maxOrderQuantity: input.maxOrderQuantity ?? existing.max_order_quantity,
    });

    if (!updated) {
      throw new NotFoundException('Product not found');
    }

    if (input.status === 'active' && existing.status !== 'active') {
      await this.productsRepository.setPublishedAt(currentUser.storeId, productId);
    }

    await this.logProductAction('products.updated', currentUser, productId, context);
    await this.webhooksService.dispatchEvent(currentUser.storeId, 'product.updated', {
      productId: updated.id,
      title: updated.title,
      slug: updated.slug,
      status: updated.status,
    });
    return this.toProductResponse(updated);
  }

  async delete(
    currentUser: AuthUser,
    productId: string,
    context: RequestContextData,
  ): Promise<void> {
    await this.requireProduct(currentUser.storeId, productId);
    await this.productsRepository.delete(currentUser.storeId, productId);
    await this.logProductAction('products.deleted', currentUser, productId, context);
  }

  async addVariant(
    currentUser: AuthUser,
    productId: string,
    input: CreateVariantDto,
    context: RequestContextData,
  ): Promise<ProductVariantResponse> {
    const product = await this.requireProduct(currentUser.storeId, productId);
    this.validateVariantPrices(input);
    await this.ensureSkuAvailable(currentUser.storeId, input.sku);
    const selectedAttributes = await this.resolveVariantAttributes(
      currentUser.storeId,
      input.attributeValueIds ?? [],
      product.category_id,
    );
    const variantCount = await this.productsRepository.countVariants(
      currentUser.storeId,
      productId,
    );
    const isDefault = input.isDefault ?? variantCount === 0;
    const mergedAttributes = this.mergeVariantAttributes(
      input.attributes ?? {},
      selectedAttributes.attributesMap,
    );
    const variant = await this.createVariantWithAssignments({
      storeId: currentUser.storeId,
      productId,
      payload: input,
      mergedAttributes,
      isDefault,
      selectedAttributes,
    });
    await this.logProductAction('products.variant_created', currentUser, productId, context);
    return this.toVariantResponse(variant, selectedAttributes.attributeValueIds);
  }

  private resolveVariantAttributes(
    storeId: string,
    attributeValueIds: string[],
    categoryId: string | null,
  ) {
    return this.attributesService.resolveVariantAttributes(storeId, attributeValueIds, categoryId);
  }

  private mergeVariantAttributes(
    inputAttributes: Record<string, string>,
    selectedAttributesMap: Record<string, string>,
  ): Record<string, string> {
    return {
      ...this.normalizeAttributes(inputAttributes),
      ...selectedAttributesMap,
    };
  }

  private async createVariantWithAssignments(input: {
    storeId: string;
    productId: string;
    payload: CreateVariantDto;
    mergedAttributes: Record<string, string>;
    isDefault: boolean;
    selectedAttributes: ResolvedVariantAttributes;
  }): Promise<ProductVariantRecord> {
    const primaryArabicTitle = this.resolvePrimaryArabicTitle(
      input.payload.title,
      input.payload.titleAr,
    );

    const variant = await this.productsRepository.createVariant({
      productId: input.productId,
      storeId: input.storeId,
      title: primaryArabicTitle,
      titleAr: primaryArabicTitle,
      titleEn: input.payload.titleEn ?? null,
      sku: input.payload.sku.trim(),
      barcode: input.payload.barcode?.trim() ?? null,
      price: input.payload.price,
      compareAtPrice: input.payload.compareAtPrice ?? null,
      stockQuantity: input.payload.stockQuantity ?? 0,
      lowStockThreshold: input.payload.lowStockThreshold ?? 0,
      attributes: input.mergedAttributes,
      isDefault: input.isDefault,
    });

    await this.attributesService.replaceVariantAttributeValues(
      input.storeId,
      variant.id,
      input.selectedAttributes.assignments,
    );
    if (variant.is_default) {
      await this.productsRepository.unsetDefaultVariants(
        input.storeId,
        input.productId,
        variant.id,
      );
    }

    return variant;
  }

  async updateVariantAttributes(
    currentUser: AuthUser,
    productId: string,
    variantId: string,
    attributeValueIds: string[],
    context: RequestContextData,
  ): Promise<ProductVariantResponse> {
    const product = await this.requireProduct(currentUser.storeId, productId);
    const variant = await this.productsRepository.findVariantById(currentUser.storeId, variantId);
    if (!variant || variant.product_id !== productId) {
      throw new NotFoundException('Variant not found');
    }

    const selectedAttributes = await this.attributesService.resolveVariantAttributes(
      currentUser.storeId,
      attributeValueIds,
      product.category_id,
    );
    const currentState = await this.attributesService.listVariantAttributeState(
      currentUser.storeId,
      [variantId],
    );
    const preservedAttributes = this.omitKeys(
      variant.attributes,
      currentState.get(variantId)?.attributeSlugs ?? [],
    );

    const updated = await this.productsRepository.updateVariantAttributes({
      storeId: currentUser.storeId,
      variantId,
      attributes: {
        ...preservedAttributes,
        ...selectedAttributes.attributesMap,
      },
    });

    if (!updated) {
      throw new NotFoundException('Variant not found');
    }

    await this.attributesService.replaceVariantAttributeValues(
      currentUser.storeId,
      variantId,
      selectedAttributes.assignments,
    );
    await this.logProductAction(
      'products.variant_attributes_updated',
      currentUser,
      productId,
      context,
    );

    return this.toVariantResponse(updated, selectedAttributes.attributeValueIds);
  }

  async attachImage(
    currentUser: AuthUser,
    productId: string,
    input: AttachProductImageDto,
    context: RequestContextData,
  ): Promise<ProductImageResponse> {
    await this.requireProduct(currentUser.storeId, productId);
    await this.validateVariantOwnership(currentUser.storeId, productId, input.variantId ?? null);
    await this.validateMediaAsset(currentUser.storeId, input.mediaAssetId);

    const imageCount = await this.productsRepository.countProductImages(currentUser.storeId, productId);
    const shouldSetPrimary = input.isPrimary ?? imageCount === 0;

    const image = await this.productsRepository.attachImage({
      storeId: currentUser.storeId,
      productId,
      variantId: input.variantId ?? null,
      mediaAssetId: input.mediaAssetId,
      altText: input.altText?.trim() ?? null,
      sortOrder: input.sortOrder ?? 0,
      isPrimary: shouldSetPrimary,
    });

    await this.logProductAction('products.image_attached', currentUser, productId, context);
    return this.toImageResponse(image);
  }

  private async requireProduct(storeId: string, productId: string): Promise<ProductRecord> {
    const product = await this.productsRepository.findById(storeId, productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  private getNextSlug(existing: ProductRecord, input: UpdateProductDto): string {
    if (!input.slug && !input.title && !input.titleAr) {
      return existing.slug;
    }

    const nextTitleForSlug = this.resolvePrimaryArabicTitle(
      input.title ?? existing.title,
      input.titleAr ?? existing.title_ar,
    );
    return this.resolveSlug(nextTitleForSlug, input.slug);
  }

  private resolveSlug(title: string, slug?: string): string {
    const value = slugify(slug ?? title);
    if (!value) {
      throw new BadRequestException('Product slug is invalid');
    }
    return value;
  }

  private resolvePrimaryArabicTitle(baseTitle: string, arabicTitle?: string | null): string {
    const normalizedArabicTitle = arabicTitle?.trim();
    if (normalizedArabicTitle) {
      return normalizedArabicTitle;
    }

    const normalizedBaseTitle = baseTitle.trim();
    if (!normalizedBaseTitle) {
      throw new BadRequestException('Product title is invalid');
    }

    return normalizedBaseTitle;
  }

  private async ensureProductSlugAvailable(
    storeId: string,
    slug: string,
    exceptProductId?: string,
  ): Promise<void> {
    const existing = await this.productsRepository.findBySlug(storeId, slug);
    if (!existing || existing.id === exceptProductId) {
      return;
    }
    throw new ConflictException('Product slug already in use');
  }

  private async validateCategory(storeId: string, categoryId: string | null): Promise<void> {
    if (!categoryId) {
      return;
    }

    const category = await this.categoriesRepository.findById(storeId, categoryId);
    if (!category) {
      throw new BadRequestException('Category not found in this store');
    }
  }

  private validateVariantPrices(input: CreateVariantDto): void {
    if (input.compareAtPrice !== undefined && input.compareAtPrice < input.price) {
      throw new BadRequestException('compareAtPrice must be greater than or equal to price');
    }
  }

  private async ensureSkuAvailable(storeId: string, sku: string): Promise<void> {
    const existing = await this.productsRepository.findVariantBySku(storeId, sku.trim());
    if (existing) {
      throw new ConflictException('Variant SKU already in use');
    }
  }

  private async validateVariantOwnership(
    storeId: string,
    productId: string,
    variantId: string | null,
  ): Promise<void> {
    if (!variantId) {
      return;
    }

    const variant = await this.productsRepository.findVariantById(storeId, variantId);
    if (!variant || variant.product_id !== productId) {
      throw new BadRequestException('Variant does not belong to this product');
    }
  }

  private async validateMediaAsset(storeId: string, mediaAssetId: string): Promise<void> {
    const media = await this.productsRepository.findMediaAssetById(storeId, mediaAssetId);
    if (!media) {
      throw new BadRequestException('Media asset not found in this store');
    }
  }

  private async logProductAction(
    action: string,
    currentUser: AuthUser,
    productId: string,
    context: RequestContextData,
  ): Promise<void> {
    await this.auditService.log({
      action,
      storeId: currentUser.storeId,
      storeUserId: currentUser.id,
      targetType: 'product',
      targetId: productId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: context.requestId ? { requestId: context.requestId } : {},
    });
  }

  private toProductResponse(record: ProductRecord): ProductResponse {
    return {
      id: record.id,
      storeId: record.store_id,
      categoryId: record.category_id,
      title: record.title,
      titleAr: record.title_ar,
      titleEn: record.title_en,
      slug: record.slug,
      description: record.description,
      descriptionAr: record.description_ar,
      descriptionEn: record.description_en,
      status: record.status,
      brand: record.brand,
      weight: record.weight ? Number(record.weight) : null,
      dimensions: record.dimensions,
      costPrice: record.cost_price ? Number(record.cost_price) : null,
      seoTitle: record.seo_title,
      seoDescription: record.seo_description,
      tags: record.tags,
      isFeatured: record.is_featured,
      isTaxable: record.is_taxable,
      taxRate: Number(record.tax_rate),
      minOrderQuantity: record.min_order_quantity,
      maxOrderQuantity: record.max_order_quantity,
      publishedAt: record.published_at,
      ratingAvg: Number(record.rating_avg),
      ratingCount: record.rating_count,
    };
  }

  private toVariantResponse(
    record: ProductVariantRecord,
    attributeValueIds: string[],
  ): ProductVariantResponse {
    return {
      id: record.id,
      productId: record.product_id,
      title: record.title,
      titleAr: record.title_ar,
      titleEn: record.title_en,
      sku: record.sku,
      barcode: record.barcode,
      price: Number(record.price),
      compareAtPrice: record.compare_at_price ? Number(record.compare_at_price) : null,
      stockQuantity: record.stock_quantity,
      lowStockThreshold: record.low_stock_threshold,
      attributes: record.attributes,
      attributeValueIds,
      isDefault: record.is_default,
    };
  }

  private normalizeAttributes(input: Record<string, string>): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      const normalizedKey = String(key).trim();
      const normalizedValue = String(value).trim();
      if (!normalizedKey || !normalizedValue) {
        continue;
      }

      normalized[normalizedKey] = normalizedValue;
    }

    return normalized;
  }

  private omitKeys(input: Record<string, string>, keys: string[]): Record<string, string> {
    const next = { ...input };
    for (const key of keys) {
      delete next[key];
    }
    return next;
  }

  private toImageResponse(record: ProductImageRecord): ProductImageResponse {
    return {
      id: record.id,
      productId: record.product_id,
      variantId: record.variant_id,
      mediaAssetId: record.media_asset_id,
      url: record.public_url,
      altText: record.alt_text,
      sortOrder: record.sort_order,
      isPrimary: record.is_primary,
    };
  }
}
