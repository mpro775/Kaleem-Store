import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  AttributesService,
  type StorefrontFilterAttributeResponse,
} from '../attributes/attributes.service';
import { CategoriesRepository } from '../categories/categories.repository';
import { CustomersService } from '../customers/customers.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { InventoryService } from '../inventory/inventory.service';
import { OutboxService } from '../messaging/outbox.service';
import {
  ProductsRepository,
  type ProductImageRecord,
  type ProductRecord,
  type ProductVariantRecord,
} from '../products/products.repository';
import type { PaymentMethod } from '../orders/constants/payment.constants';
import {
  OrdersRepository,
  type CartItemSnapshot,
  type OrderRecord,
  type OrderStatusHistoryRecord,
} from '../orders/orders.repository';
import {
  PromotionsService,
  type PromotionComputationInput,
  type PromotionComputationResult,
} from '../promotions/promotions.service';
import { SaasService } from '../saas/saas.service';
import { ShippingRepository, type ShippingZoneRecord } from '../shipping/shipping.repository';
import { ThemesService } from '../themes/themes.service';
import { StoresRepository } from '../stores/stores.repository';
import { WebhooksService } from '../webhooks/webhooks.service';
import { StoreResolverService } from './store-resolver.service';
import { StorefrontTrackingService } from './storefront-tracking.service';
import type { AddCartItemDto } from './dto/add-cart-item.dto';
import type { CheckoutDto } from './dto/checkout.dto';
import type { ListStorefrontFiltersQueryDto } from './dto/list-storefront-filters-query.dto';
import type { ThemeQueryDto } from './dto/theme-query.dto';

export interface StorefrontProductResponse {
  id: string;
  title: string;
  titleAr: string | null;
  titleEn: string | null;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  categoryId: string | null;
  primaryImageUrl: string | null;
  priceFrom: number | null;
  brand: string | null;
  weight: number | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  seoTitle: string | null;
  seoDescription: string | null;
  tags: string[];
  isFeatured: boolean;
  isTaxable: boolean;
  taxRate: number;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  ratingAvg: number;
  ratingCount: number;
}

export interface StorefrontCategoryResponse {
  id: string;
  name: string;
  nameAr: string | null;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  parentId: string | null;
}

export interface StorefrontShippingZoneResponse {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  fee: number;
}

export interface PublicStoreResolveResponse {
  storeId: string;
  storeSlug: string;
  storeSettings: {
    name: string;
    logoUrl: string | null;
    currencyCode: string;
  };
  publishedThemeSummary: {
    version: number;
    sections: Array<{ id: string; type: string; enabled: boolean }>;
  };
}

export interface StorefrontPoliciesResponse {
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsAndConditions: string | null;
}

export interface StorefrontCartResponse {
  cartId: string;
  currencyCode: string;
  subtotal: number;
  totalItems: number;
  items: Array<{
    productId: string;
    variantId: string;
    title: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface CheckoutResponse {
  orderId: string;
  orderCode: string;
  status: string;
  total: number;
  currencyCode: string;
  shippingFee: number;
  discountTotal: number;
}

type QueryRunner = {
  query: <T = unknown>(
    queryText: string,
    values?: unknown[],
  ) => Promise<{ rows: T[]; rowCount: number | null }>;
};

interface CheckoutData {
  cart: { id: string; currency_code: string };
  items: CartItemSnapshot[];
  subtotal: number;
  shippingZone: ShippingZoneRecord | null;
  promotion: PromotionComputationResult;
  total: number;
}

interface StorefrontCategoryFilterInput {
  categoryId?: string;
  categorySlug?: string;
}

interface ParsedProductsQuery extends StorefrontCategoryFilterInput {
  page: number;
  limit: number;
  q?: string;
  attrs?: Record<string, string[]>;
  isFeatured?: boolean;
}

@Injectable()
export class StorefrontService {
  constructor(
    private readonly storeResolverService: StoreResolverService,
    private readonly categoriesRepository: CategoriesRepository,
    private readonly attributesService: AttributesService,
    private readonly idempotencyService: IdempotencyService,
    private readonly inventoryService: InventoryService,
    private readonly productsRepository: ProductsRepository,
    private readonly ordersRepository: OrdersRepository,
    private readonly shippingRepository: ShippingRepository,
    private readonly promotionsService: PromotionsService,
    private readonly saasService: SaasService,
    private readonly themesService: ThemesService,
    private readonly outboxService: OutboxService,
    private readonly storesRepository: StoresRepository,
    private readonly webhooksService: WebhooksService,
    private readonly customersService: CustomersService,
    private readonly storefrontTrackingService: StorefrontTrackingService,
  ) {}

  async getStore(request: Request) {
    const store = await this.storeResolverService.resolve(request);
    await this.storefrontTrackingService.trackEvent(request, {
      storeId: store.id,
      eventType: 'store_visit',
    });

    return {
      id: store.id,
      name: store.name,
      slug: store.slug,
      logoUrl: store.logo_url,
      currencyCode: store.currency_code,
    };
  }

  async resolvePublicStore(request: Request): Promise<PublicStoreResolveResponse> {
    const store = await this.storeResolverService.resolve(request);
    const publishedTheme = await this.themesService.getStorefrontTheme(store.id);

    return {
      storeId: store.id,
      storeSlug: store.slug,
      storeSettings: {
        name: store.name,
        logoUrl: store.logo_url,
        currencyCode: store.currency_code,
      },
      publishedThemeSummary: {
        version: publishedTheme.version,
        sections: this.extractPublishedSectionSummary(publishedTheme.config),
      },
    };
  }

  async listCategories(request: Request): Promise<StorefrontCategoryResponse[]> {
    const store = await this.storeResolverService.resolve(request);
    const categories = await this.categoriesRepository.listActive(store.id);

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      nameAr: category.name_ar,
      nameEn: category.name_en,
      slug: category.slug,
      description: category.description,
      descriptionAr: category.description_ar,
      descriptionEn: category.description_en,
      imageUrl: category.image_url,
      parentId: category.parent_id,
    }));
  }

  async listShippingZones(request: Request): Promise<StorefrontShippingZoneResponse[]> {
    const store = await this.storeResolverService.resolve(request);
    const zones = await this.shippingRepository.list(store.id);

    return zones
      .filter((zone) => zone.is_active)
      .map((zone) => ({
        id: zone.id,
        name: zone.name,
        city: zone.city,
        area: zone.area,
        fee: Number(zone.fee),
      }));
  }

  async listFilters(
    request: Request,
    query: ListStorefrontFiltersQueryDto,
  ): Promise<StorefrontFilterAttributeResponse[]> {
    const store = await this.storeResolverService.resolve(request);
    const categoryId = await this.resolveStorefrontCategoryId(store.id, query);
    return this.attributesService.listStorefrontFilterAttributes(store.id, categoryId);
  }

  async listProducts(request: Request) {
    const query = this.parseProductsQuery(request);
    const store = await this.storeResolverService.resolve(request);
    const page = query.page;
    const limit = query.limit;
    const categoryId = await this.resolveStorefrontCategoryId(store.id, query);
    const attributeFilters = this.resolveAttributeFilters(query.attrs);

    const result = await this.productsRepository.list({
      storeId: store.id,
      q: query.q?.trim(),
      categoryId,
      status: 'active',
      isFeatured: query.isFeatured,
      attributeFilters,
      limit,
      offset: (page - 1) * limit,
    });

    const items = await Promise.all(
      result.rows.map(async (row) => {
        const listingMeta = await this.getProductListingMeta(store.id, row.id);
        return this.mapProduct(row, listingMeta);
      }),
    );

    return {
      items,
      total: result.total,
      page,
      limit,
    };
  }

  async getProductDetails(request: Request, slug: string) {
    const store = await this.storeResolverService.resolve(request);
    const product = await this.productsRepository.findBySlug(store.id, slug);
    if (!product || product.status !== 'active') {
      throw new NotFoundException('Product not found');
    }

    const [variants, images] = await Promise.all([
      this.productsRepository.listVariants(store.id, product.id),
      this.productsRepository.listProductImages(store.id, product.id),
    ]);

    const listingMeta = this.computeProductListingMeta(variants, images);

    await this.storefrontTrackingService.trackEvent(request, {
      storeId: store.id,
      eventType: 'product_view',
      productId: product.id,
      metadata: {
        productSlug: slug,
      },
    });

    return {
      ...this.mapProduct(product, listingMeta),
      variants: variants.map((variant) => this.mapVariant(variant)),
      images: images.map((image) => this.mapImage(image)),
    };
  }

  async getTheme(request: Request, query: ThemeQueryDto) {
    const store = await this.storeResolverService.resolve(request);
    const theme = await this.themesService.getStorefrontTheme(store.id, query.previewToken);

    return {
      storeId: store.id,
      mode: theme.mode,
      version: theme.version,
      config: theme.config,
    };
  }

  async getPolicies(request: Request): Promise<StorefrontPoliciesResponse> {
    const store = await this.storeResolverService.resolve(request);
    const storeSettings = await this.storesRepository.findById(store.id);
    if (!storeSettings) {
      throw new NotFoundException('Store not found');
    }

    return {
      shippingPolicy: storeSettings.shipping_policy,
      returnPolicy: storeSettings.return_policy,
      privacyPolicy: storeSettings.privacy_policy,
      termsAndConditions: storeSettings.terms_of_service,
    };
  }

  async addCartItem(request: Request, input: AddCartItemDto): Promise<StorefrontCartResponse> {
    const store = await this.storeResolverService.resolve(request);
    await this.inventoryService.releaseExpiredReservations(store.id);
    const variant = await this.requireVariant(store.id, input.variantId);
    const cart = await this.resolveCart(store.id, store.currency_code, input.cartId);
    const availableStock = await this.inventoryService.getAvailableStock(
      store.id,
      variant.variant_id,
    );
    this.ensureStockAvailable(availableStock ?? 0, input.quantity);

    await this.ordersRepository.addOrIncrementCartItem({
      cartId: cart.id,
      storeId: store.id,
      productId: variant.product_id,
      variantId: variant.variant_id,
      quantity: input.quantity,
      unitPrice: Number(variant.price),
    });

    const items = await this.ordersRepository.listCartItems(store.id, cart.id);
    await this.storefrontTrackingService.trackEvent(request, {
      storeId: store.id,
      eventType: 'add_to_cart',
      cartId: cart.id,
      productId: variant.product_id,
      variantId: variant.variant_id,
      metadata: {
        quantity: input.quantity,
      },
    });

    return this.mapCart(cart.id, store.currency_code, items);
  }

  async getCart(request: Request, cartId: string): Promise<StorefrontCartResponse> {
    const store = await this.storeResolverService.resolve(request);
    const cart = await this.ordersRepository.findOpenCartById(store.id, cartId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    const items = await this.ordersRepository.listCartItems(store.id, cart.id);
    return this.mapCart(cart.id, store.currency_code, items);
  }

  async updateCartItemQuantity(
    request: Request,
    cartId: string,
    variantId: string,
    quantity: number,
  ): Promise<StorefrontCartResponse> {
    if (quantity <= 0) {
      return this.removeCartItem(request, cartId, variantId);
    }

    const store = await this.storeResolverService.resolve(request);
    await this.inventoryService.releaseExpiredReservations(store.id);
    const cart = await this.requireOpenCart(store.id, cartId);
    const variant = await this.requireVariant(store.id, variantId);
    const availableStock = await this.inventoryService.getAvailableStock(
      store.id,
      variant.variant_id,
    );
    this.ensureStockAvailable(availableStock ?? 0, quantity);

    const updated = await this.ordersRepository.updateCartItemQuantity({
      storeId: store.id,
      cartId: cart.id,
      variantId,
      quantity,
    });

    if (!updated) {
      throw new NotFoundException('Cart item not found');
    }

    return this.getCart(request, cart.id);
  }

  async removeCartItem(
    request: Request,
    cartId: string,
    variantId: string,
  ): Promise<StorefrontCartResponse> {
    const store = await this.storeResolverService.resolve(request);
    const cart = await this.requireOpenCart(store.id, cartId);

    const removed = await this.ordersRepository.removeCartItem({
      storeId: store.id,
      cartId: cart.id,
      variantId,
    });

    if (!removed) {
      throw new NotFoundException('Cart item not found');
    }

    return this.getCart(request, cart.id);
  }

  async checkout(
    request: Request,
    input: CheckoutDto,
    idempotencyKey?: string,
  ): Promise<CheckoutResponse> {
    const store = await this.storeResolverService.resolve(request);

    await this.storefrontTrackingService.trackEvent(request, {
      storeId: store.id,
      eventType: 'checkout_start',
      cartId: input.cartId,
      metadata: {
        paymentMethod: input.paymentMethod,
        hasCoupon: Boolean(input.couponCode?.trim()),
      },
    });

    if (idempotencyKey) {
      const cachedResult = await this.idempotencyService.checkOrPrepare({
        storeId: store.id,
        key: idempotencyKey,
        requestBody: input,
      });

      if (cachedResult.isCached && cachedResult.record) {
        return cachedResult.record.response as unknown as CheckoutResponse;
      }
    }

    await this.saasService.assertMetricCanGrow(store.id, 'orders.monthly', 1);

    const checkoutData = await this.prepareCheckoutData(store.id, input);
    const orderId = uuidv4();
    const orderCode = this.generateOrderCode();

    const order = await this.executeCheckoutTransaction(
      store.id,
      input,
      checkoutData,
      orderId,
      orderCode,
    );

    await this.publishOrderCreated(order, store.id);
    await this.webhooksService.dispatchEvent(store.id, 'order.created', {
      orderId: order.id,
      orderCode: order.order_code,
      status: order.status,
      total: Number(order.total),
      currencyCode: order.currency_code,
    });
    await this.saasService.recordUsageEvent(store.id, 'orders.monthly', 1, {
      orderId: order.id,
      orderCode: order.order_code,
    });

    const response = this.mapCheckoutResponse(order);

    await this.storefrontTrackingService.trackEvent(request, {
      storeId: store.id,
      eventType: 'checkout_complete',
      cartId: input.cartId,
      orderId: order.id,
      metadata: {
        paymentMethod: input.paymentMethod,
        total: response.total,
        currencyCode: response.currencyCode,
      },
    });

    if (checkoutData.promotion.couponCode) {
      await this.storefrontTrackingService.trackEvent(request, {
        storeId: store.id,
        eventType: 'coupon_apply',
        cartId: input.cartId,
        orderId: order.id,
        metadata: {
          couponCode: checkoutData.promotion.couponCode,
          discountTotal: checkoutData.promotion.totalDiscount,
          total: response.total,
          currencyCode: response.currencyCode,
        },
      });
    }

    if (idempotencyKey) {
      await this.idempotencyService.storeResponse(
        store.id,
        idempotencyKey,
        input,
        response as unknown as Record<string, unknown>,
        order.id,
      );
    }

    return response;
  }

  async trackOrder(request: Request, orderCode: string, phone?: string) {
    const store = await this.storeResolverService.resolve(request);
    const order = await this.ordersRepository.findOrderByCode(store.id, orderCode);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.assertTrackOrderPhone(order.id, phone);

    const history = await this.ordersRepository.listOrderStatusHistory(order.id);
    return {
      orderCode: order.order_code,
      status: order.status,
      total: Number(order.total),
      currencyCode: order.currency_code,
      timeline: history.map((entry) => this.mapStatusHistory(entry)),
      updatedAt: order.updated_at,
    };
  }

  private mapProduct(
    row: ProductRecord,
    listingMeta: { primaryImageUrl: string | null; priceFrom: number | null },
  ): StorefrontProductResponse {
    return {
      id: row.id,
      title: row.title,
      titleAr: row.title_ar,
      titleEn: row.title_en,
      slug: row.slug,
      description: row.description,
      descriptionAr: row.description_ar,
      descriptionEn: row.description_en,
      categoryId: row.category_id,
      primaryImageUrl: listingMeta.primaryImageUrl,
      priceFrom: listingMeta.priceFrom,
      brand: row.brand,
      weight: row.weight ? Number(row.weight) : null,
      dimensions: row.dimensions,
      seoTitle: row.seo_title,
      seoDescription: row.seo_description,
      tags: row.tags,
      isFeatured: row.is_featured,
      isTaxable: row.is_taxable,
      taxRate: Number(row.tax_rate),
      minOrderQuantity: row.min_order_quantity,
      maxOrderQuantity: row.max_order_quantity,
      ratingAvg: Number(row.rating_avg),
      ratingCount: row.rating_count,
    };
  }

  private mapVariant(variant: ProductVariantRecord) {
    return {
      id: variant.id,
      title: variant.title,
      titleAr: variant.title_ar,
      titleEn: variant.title_en,
      sku: variant.sku,
      price: Number(variant.price),
      compareAtPrice: variant.compare_at_price ? Number(variant.compare_at_price) : null,
      stockQuantity: variant.stock_quantity,
      isDefault: variant.is_default,
      attributes: variant.attributes,
    };
  }

  private mapImage(image: ProductImageRecord) {
    return {
      id: image.id,
      url: image.public_url,
      altText: image.alt_text,
      sortOrder: image.sort_order,
      variantId: image.variant_id,
    };
  }

  private extractPublishedSectionSummary(
    config: Record<string, unknown>,
  ): Array<{ id: string; type: string; enabled: boolean }> {
    const sections = Array.isArray(config.sections) ? config.sections : [];
    return sections
      .filter((section): section is Record<string, unknown> => this.isRecord(section))
      .map((section) => ({
        id: typeof section.id === 'string' ? section.id : 'unknown-section',
        type: typeof section.type === 'string' ? section.type : 'unknown',
        enabled: section.enabled !== false,
      }));
  }

  private async resolveStorefrontCategoryId(
    storeId: string,
    query: StorefrontCategoryFilterInput,
  ): Promise<string | undefined> {
    if (query.categoryId) {
      return query.categoryId;
    }

    const categorySlug = query.categorySlug?.trim();
    if (!categorySlug) {
      return undefined;
    }

    const category = await this.categoriesRepository.findBySlug(storeId, categorySlug);
    if (!category || !category.is_active) {
      throw new NotFoundException('Category not found');
    }

    return category.id;
  }

  private parseProductsQuery(request: Request): ParsedProductsQuery {
    const page = this.parseQueryNumber(
      this.readSingleQueryString(request, 'page'),
      1,
      1,
      10_000,
      'page',
    );
    const limit = this.parseQueryNumber(
      this.readSingleQueryString(request, 'limit'),
      20,
      1,
      100,
      'limit',
    );
    const q = this.readSingleQueryString(request, 'q');
    const categoryId = this.readSingleQueryString(request, 'categoryId');
    const categorySlug = this.readSingleQueryString(request, 'categorySlug');
    const isFeaturedRaw = this.readSingleQueryString(request, 'isFeatured');

    if (categoryId && !this.isUuidV4(categoryId)) {
      throw new BadRequestException('categoryId must be a valid UUID');
    }
    if (categorySlug && !this.isSlug(categorySlug)) {
      throw new BadRequestException('categorySlug is invalid');
    }

    let isFeatured: boolean | undefined;
    if (isFeaturedRaw === 'true') {
      isFeatured = true;
    } else if (isFeaturedRaw === 'false') {
      isFeatured = false;
    }

    const attrs = this.mergeAttributeFilterSources(
      this.extractNestedAttributeFilters(request),
      this.extractBracketAttributeFilters(request),
    );

    return {
      page,
      limit,
      ...(q ? { q } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(categorySlug ? { categorySlug } : {}),
      ...(isFeatured !== undefined ? { isFeatured } : {}),
      ...(attrs ? { attrs } : {}),
    };
  }

  private readSingleQueryString(request: Request, key: string): string | undefined {
    const value = request.query[key];
    if (Array.isArray(value)) {
      const first = value[0];
      return typeof first === 'string' ? first.trim() : undefined;
    }

    return typeof value === 'string' ? value.trim() : undefined;
  }

  private parseQueryNumber(
    value: string | undefined,
    fallback: number,
    min: number,
    max: number,
    key: string,
  ): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
      throw new BadRequestException(`${key} must be an integer between ${min} and ${max}`);
    }

    return parsed;
  }

  private extractNestedAttributeFilters(request: Request): Record<string, string[]> | undefined {
    const attrs = request.query.attrs;
    if (!this.isRecord(attrs)) {
      return undefined;
    }

    const filters: Record<string, string[]> = {};
    for (const [attributeSlug, rawValue] of Object.entries(attrs)) {
      const values = this.normalizeRawQueryValue(rawValue);
      if (values.length === 0) {
        continue;
      }

      filters[attributeSlug.toLowerCase()] = [...new Set(values)];
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private resolveAttributeFilters(attrs: Record<string, string[]> | undefined) {
    if (!attrs) {
      return undefined;
    }

    const filters = Object.entries(attrs)
      .map(([attributeSlug, valueSlugs]) => ({
        attributeSlug: attributeSlug.trim().toLowerCase(),
        valueSlugs: valueSlugs.map((value) => value.trim().toLowerCase()).filter(Boolean),
      }))
      .filter((filter) => filter.attributeSlug.length > 0 && filter.valueSlugs.length > 0)
      .map((filter) => ({
        attributeSlug: filter.attributeSlug,
        valueSlugs: [...new Set(filter.valueSlugs)],
      }));

    this.assertValidAttributeFilters(filters);
    return filters.length > 0 ? filters : undefined;
  }

  private extractBracketAttributeFilters(request: Request): Record<string, string[]> | undefined {
    const filters: Record<string, string[]> = {};

    for (const [key, rawValue] of Object.entries(request.query)) {
      const match = /^attrs\[([a-z0-9]+(?:-[a-z0-9]+)*)\]$/i.exec(key);
      if (!match) {
        continue;
      }

      const values = this.normalizeRawQueryValue(rawValue);
      if (values.length === 0) {
        continue;
      }

      filters[match[1]!.toLowerCase()] = [...new Set(values)];
    }

    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  private normalizeRawQueryValue(value: unknown): string[] {
    const values = Array.isArray(value) ? value : [value];
    return values
      .map((entry) => String(entry).trim().toLowerCase())
      .filter((entry) => entry.length > 0);
  }

  private mergeAttributeFilterSources(
    sourceA: Record<string, string[]> | undefined,
    sourceB: Record<string, string[]> | undefined,
  ): Record<string, string[]> | undefined {
    const merged: Record<string, string[]> = {};

    for (const source of [sourceA, sourceB]) {
      if (!source) {
        continue;
      }

      for (const [attributeSlug, values] of Object.entries(source)) {
        const existing = merged[attributeSlug] ?? [];
        merged[attributeSlug] = [...new Set([...existing, ...values])];
      }
    }

    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  private assertValidAttributeFilters(
    filters: Array<{ attributeSlug: string; valueSlugs: string[] }>,
  ): void {
    for (const filter of filters) {
      if (!this.isSlug(filter.attributeSlug)) {
        throw new BadRequestException('Invalid attribute filter slug');
      }

      for (const valueSlug of filter.valueSlugs) {
        if (!this.isSlug(valueSlug)) {
          throw new BadRequestException('Invalid attribute filter value');
        }
      }
    }
  }

  private async getProductListingMeta(
    storeId: string,
    productId: string,
  ): Promise<{ primaryImageUrl: string | null; priceFrom: number | null }> {
    const [variants, images] = await Promise.all([
      this.productsRepository.listVariants(storeId, productId),
      this.productsRepository.listProductImages(storeId, productId),
    ]);

    return this.computeProductListingMeta(variants, images);
  }

  private computeProductListingMeta(
    variants: ProductVariantRecord[],
    images: ProductImageRecord[],
  ): { primaryImageUrl: string | null; priceFrom: number | null } {
    const sortedPrices = variants.map((variant) => Number(variant.price)).sort((a, b) => a - b);
    return {
      primaryImageUrl: images[0]?.public_url ?? null,
      priceFrom: sortedPrices[0] ?? null,
    };
  }

  private async requireOpenCart(storeId: string, cartId: string) {
    const cart = await this.ordersRepository.findOpenCartById(storeId, cartId);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    return cart;
  }

  private async assertTrackOrderPhone(orderId: string, phone: string | undefined): Promise<void> {
    const normalizedPhone = phone?.trim();
    if (!normalizedPhone) {
      return;
    }

    const customerPhone = await this.ordersRepository.findCustomerPhoneByOrderId(orderId);
    if (!customerPhone || customerPhone.trim() !== normalizedPhone) {
      throw new NotFoundException('Order not found');
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isSlug(value: string): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
  }

  private isUuidV4(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async requireVariant(storeId: string, variantId: string) {
    const variant = await this.ordersRepository.findVariantForStore(storeId, variantId);
    if (!variant || variant.product_status !== 'active') {
      throw new NotFoundException('Variant not found or inactive');
    }
    return variant;
  }

  private async resolveCart(storeId: string, currencyCode: string, cartId?: string) {
    if (!cartId) {
      return this.ordersRepository.createCart(storeId, currencyCode);
    }

    const cart = await this.ordersRepository.findOpenCartById(storeId, cartId);
    if (!cart) {
      throw new BadRequestException('Invalid cart id');
    }
    return cart;
  }

  private ensureStockAvailable(stockQuantity: number, requestedQuantity: number): void {
    if (stockQuantity < requestedQuantity) {
      throw new UnprocessableEntityException('Requested quantity exceeds available stock');
    }
  }

  private mapCart(
    cartId: string,
    currencyCode: string,
    items: CartItemSnapshot[],
  ): StorefrontCartResponse {
    const mappedItems = items.map((item) => this.mapCartItem(item));
    const subtotal = mappedItems.reduce((sum, item) => sum + item.lineTotal, 0);
    const totalItems = mappedItems.reduce((sum, item) => sum + item.quantity, 0);
    return { cartId, currencyCode, subtotal, totalItems, items: mappedItems };
  }

  private mapCartItem(item: CartItemSnapshot) {
    const unitPrice = Number(item.unit_price);
    return {
      productId: item.product_id,
      variantId: item.variant_id,
      title: item.product_title,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    };
  }

  private async validateCartStock(storeId: string, items: CartItemSnapshot[]): Promise<void> {
    for (const item of items) {
      const availableStock = await this.inventoryService.getAvailableStock(
        storeId,
        item.variant_id,
      );
      if (availableStock === null || item.quantity > availableStock) {
        throw new UnprocessableEntityException(`Variant ${item.sku} is out of stock`);
      }
    }
  }

  private calculateTotals(items: CartItemSnapshot[]) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.unit_price) * item.quantity, 0);
    return { subtotal };
  }

  private async prepareCheckoutData(storeId: string, input: CheckoutDto): Promise<CheckoutData> {
    const cart = await this.ordersRepository.findOpenCartById(storeId, input.cartId);
    if (!cart) {
      throw new BadRequestException('Cart not found or already checked out');
    }

    const items = await this.ordersRepository.listCartItems(storeId, cart.id);
    if (items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    await this.inventoryService.releaseExpiredReservations(storeId);
    await this.validateCartStock(storeId, items);
    const subtotal = this.calculateTotals(items).subtotal;
    const shippingZone = await this.resolveShippingZone(storeId, input.shippingZoneId);
    const promotion = await this.promotionsService.computeCheckoutDiscount(
      storeId,
      this.buildPromotionInput(subtotal, items, input.couponCode),
    );
    const total = this.calculateTotal(
      subtotal,
      shippingZone?.fee ? Number(shippingZone.fee) : 0,
      promotion.totalDiscount,
    );

    return {
      cart,
      items,
      subtotal,
      shippingZone,
      promotion,
      total,
    };
  }

  private async executeCheckoutTransaction(
    storeId: string,
    input: CheckoutDto,
    checkoutData: CheckoutData,
    orderId: string,
    orderCode: string,
  ): Promise<OrderRecord> {
    return this.ordersRepository.withTransaction(async (db) =>
      this.persistCheckoutTransaction(db, storeId, input, checkoutData, orderId, orderCode),
    );
  }

  private async persistCheckoutTransaction(
    db: QueryRunner,
    storeId: string,
    input: CheckoutDto,
    checkoutData: CheckoutData,
    orderId: string,
    orderCode: string,
  ): Promise<OrderRecord> {
    const customerId = await this.findOrCreateCheckoutCustomer(db, storeId, input);
    await this.saveCheckoutAddress(db, storeId, customerId, input);

    const order = await this.ordersRepository.createOrder(db, {
      id: orderId,
      storeId,
      customerId,
      orderCode,
      subtotal: checkoutData.subtotal,
      total: checkoutData.total,
      shippingZoneId: checkoutData.shippingZone?.id ?? null,
      shippingFee: checkoutData.shippingZone?.fee ? Number(checkoutData.shippingZone.fee) : 0,
      discountTotal: checkoutData.promotion.totalDiscount,
      couponCode: checkoutData.promotion.couponCode,
      currencyCode: checkoutData.cart.currency_code,
      note: input.note?.trim() ?? null,
      shippingAddress: this.buildShippingAddress(input),
    });

    await this.completeCheckoutArtifacts(db, storeId, orderId, input.paymentMethod, checkoutData);
    return order;
  }

  private async findOrCreateCheckoutCustomer(
    db: QueryRunner,
    storeId: string,
    input: CheckoutDto,
  ): Promise<string> {
    // If customer is logged in, use their customer_id from the session
    if (input.customerAccessToken) {
      try {
        const payload = await this.customersService.verifyAccessToken(input.customerAccessToken);
        if (payload.storeId === storeId) {
          return payload.sub; // Return customer_id from token
        }
      } catch {
        // Token invalid or expired, fall through to guest checkout
      }
    }

    // Guest checkout: find or create by phone
    return this.ordersRepository.findOrCreateCustomer(db, {
      storeId,
      fullName: input.customerName.trim(),
      phone: input.customerPhone.trim(),
      email: input.customerEmail?.trim() ?? null,
    });
  }

  private async saveCheckoutAddress(
    db: QueryRunner,
    storeId: string,
    customerId: string,
    input: CheckoutDto,
  ): Promise<void> {
    await this.ordersRepository.insertCustomerAddress(db, {
      storeId,
      customerId,
      addressLine: input.addressLine.trim(),
      city: input.city?.trim() ?? null,
      area: input.area?.trim() ?? null,
      notes: input.note?.trim() ?? null,
    });
  }

  private async completeCheckoutArtifacts(
    db: QueryRunner,
    storeId: string,
    orderId: string,
    paymentMethod: PaymentMethod,
    checkoutData: CheckoutData,
  ): Promise<void> {
    await this.persistOrderItems(db, storeId, orderId, checkoutData.items);
    await this.inventoryService.reserveOrderItems(db, {
      storeId,
      orderId,
      expiresAt: this.buildReservationExpiryDate(),
      items: this.mapCheckoutItemsToInventoryInput(checkoutData.items),
      metadata: {
        source: 'storefront.checkout',
      },
    });
    await this.createPayment(db, storeId, orderId, paymentMethod, checkoutData.total);
    if (checkoutData.promotion.couponId) {
      await this.promotionsService.increaseCouponUsageInTransaction(
        db,
        storeId,
        checkoutData.promotion.couponId,
      );
    }
    await this.ordersRepository.insertOrderStatusHistory(db, {
      storeId,
      orderId,
      oldStatus: null,
      newStatus: 'new',
      changedBy: null,
      note: 'Order created via storefront checkout',
    });
    await this.ordersRepository.markCartCheckedOut(db, checkoutData.cart.id);
  }

  private async publishOrderCreated(order: OrderRecord, storeId: string): Promise<void> {
    await this.outboxService.enqueue({
      aggregateType: 'order',
      aggregateId: order.id,
      eventType: 'order.created',
      payload: {
        orderId: order.id,
        orderCode: order.order_code,
        storeId,
        total: Number(order.total),
        currencyCode: order.currency_code,
      },
    });
  }

  private mapCheckoutResponse(order: OrderRecord): CheckoutResponse {
    return {
      orderId: order.id,
      orderCode: order.order_code,
      status: order.status,
      total: Number(order.total),
      currencyCode: order.currency_code,
      shippingFee: Number(order.shipping_fee),
      discountTotal: Number(order.discount_total),
    };
  }

  private async resolveShippingZone(
    storeId: string,
    shippingZoneId?: string,
  ): Promise<ShippingZoneRecord | null> {
    if (!shippingZoneId) {
      return null;
    }

    const zone = await this.shippingRepository.findActiveById(storeId, shippingZoneId);
    if (!zone) {
      throw new BadRequestException('Shipping zone not found or inactive');
    }

    return zone;
  }

  private calculateTotal(subtotal: number, shippingFee: number, totalDiscount: number): number {
    const total = Number((subtotal + shippingFee - totalDiscount).toFixed(2));
    if (total < 0) {
      throw new BadRequestException('Computed total cannot be negative');
    }
    return total;
  }

  private buildPromotionInput(
    subtotal: number,
    items: CartItemSnapshot[],
    couponCode?: string,
  ): PromotionComputationInput {
    const normalizedCouponCode = couponCode?.trim();

    return {
      subtotal,
      items,
      at: new Date(),
      ...(normalizedCouponCode ? { couponCode: normalizedCouponCode } : {}),
    };
  }

  private generateOrderCode(): string {
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `KS-${random}`;
  }

  private mapCheckoutItemsToInventoryInput(items: CartItemSnapshot[]) {
    return items.map((item) => ({
      variantId: item.variant_id,
      quantity: item.quantity,
      sku: item.sku,
    }));
  }

  private buildReservationExpiryDate(referenceDate: Date = new Date()): Date {
    const ttlMinutes = this.getReservationTtlMinutes();
    return new Date(referenceDate.getTime() + ttlMinutes * 60_000);
  }

  private getReservationTtlMinutes(): number {
    const raw = Number(process.env.INVENTORY_RESERVATION_TTL_MINUTES ?? '15');
    if (!Number.isInteger(raw) || raw < 1 || raw > 120) {
      return 15;
    }
    return raw;
  }

  private buildShippingAddress(input: CheckoutDto): Record<string, unknown> {
    return {
      fullName: input.customerName.trim(),
      phone: input.customerPhone.trim(),
      addressLine: input.addressLine.trim(),
      city: input.city?.trim() ?? null,
      area: input.area?.trim() ?? null,
      note: input.note?.trim() ?? null,
    };
  }

  private async persistOrderItems(
    db: QueryRunner,
    storeId: string,
    orderId: string,
    items: CartItemSnapshot[],
  ): Promise<void> {
    for (const item of items) {
      await this.ordersRepository.insertOrderItem(db, {
        orderId,
        storeId,
        productId: item.product_id,
        variantId: item.variant_id,
        title: item.product_title,
        sku: item.sku,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        lineTotal: Number(item.unit_price) * item.quantity,
        attributes: item.attributes,
      });
    }
  }

  private async createPayment(
    db: QueryRunner,
    storeId: string,
    orderId: string,
    method: PaymentMethod,
    amount: number,
  ): Promise<void> {
    await this.ordersRepository.createPayment(db, {
      storeId,
      orderId,
      method,
      amount,
    });
  }

  private mapStatusHistory(entry: OrderStatusHistoryRecord) {
    return {
      from: entry.old_status,
      to: entry.new_status,
      note: entry.note,
      createdAt: entry.created_at,
    };
  }
}
