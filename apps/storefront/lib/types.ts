export interface PublicStoreResolveResponse {
  storeId: string;
  storeSlug: string;
  storeSettings: {
    name: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    currencyCode: string;
  };
  publishedThemeSummary: {
    version: number;
    sections: Array<{ id: string; type: string; enabled: boolean }>;
  };
}

export interface StorefrontThemeResponse {
  storeId: string;
  mode: 'published' | 'preview';
  version: number;
  config: Record<string, unknown>;
}

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  nameAr: string | null;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  imageAltAr: string | null;
  imageAltEn: string | null;
  backgroundImageUrl: string | null;
  seoTitleAr: string | null;
  seoTitleEn: string | null;
  seoDescriptionAr: string | null;
  seoDescriptionEn: string | null;
}

export interface StorefrontFilterAttribute {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  type: 'checkbox' | 'radio' | 'color' | 'range';
  sortOrder: number;
  isActive: boolean;
  values: Array<{
    id: string;
    valueAr: string;
    valueEn: string;
    slug: string;
    colorHex: string | null;
    sortOrder: number;
    isActive: boolean;
  }>;
}

export interface StorefrontProduct {
  id: string;
  productType: 'single' | 'bundled' | 'digital';
  isVisible: boolean;
  stockUnlimited: boolean;
  questionsEnabled: boolean;
  title: string;
  slug: string;
  description: string | null;
  shortDescriptionAr: string | null;
  shortDescriptionEn: string | null;
  detailedDescriptionAr: string | null;
  detailedDescriptionEn: string | null;
  categoryId: string | null;
  primaryImageUrl: string | null;
  priceFrom: number | null;
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  brand: string | null;
  weight: number | null;
  weightUnit: string | null;
  dimensions: { length?: number; width?: number; height?: number } | null;
  productLabel: string | null;
  youtubeUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoTitleAr: string | null;
  seoTitleEn: string | null;
  seoDescriptionAr: string | null;
  seoDescriptionEn: string | null;
  tags: string[];
  isFeatured: boolean;
  isTaxable: boolean;
  taxRate: number;
  minOrderQuantity: number;
  maxOrderQuantity: number | null;
  ratingAvg: number;
  ratingCount: number;
}

export interface StorefrontProductsResponse {
  items: StorefrontProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductVariant {
  id: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  isDefault: boolean;
  attributes: Record<string, string>;
  titleAr: string | null;
  titleEn: string | null;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  variantId: string | null;
}

export interface StorefrontProductDetail extends StorefrontProduct {
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface StorefrontCart {
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

export interface ShippingZone {
  id: string;
  name: string;
  city: string | null;
  area: string | null;
  description: string | null;
  fee: number;
}

export interface ShippingMethodQuote {
  id: string;
  zoneId: string;
  type: string;
  displayName: string;
  description: string | null;
  cost: number;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  isActive: boolean;
  sortOrder: number;
}

export interface CheckoutResponse {
  orderId: string;
  orderCode: string;
  status: string;
  total: number;
  currencyCode: string;
  shippingFee: number;
  discountTotal: number;
  pointsRedeemed: number;
  pointsDiscountAmount: number;
  pointsEarned: number;
}

export interface CheckoutQuoteResponse {
  subtotal: number;
  shippingFee: number;
  availableShippingMethods: ShippingMethodQuote[];
  selectedShippingMethodId: string | null;
  promotionDiscount: number;
  pointsDiscount: number;
  total: number;
  currencyCode: string;
  pointsToRedeemApplied: number;
  potentialEarnPoints: number;
  availablePoints: number;
}

export interface TrackOrderResponse {
  orderCode: string;
  status: string;
  total: number;
  currencyCode: string;
  timeline: Array<{
    from: string | null;
    to: string;
    note: string | null;
    createdAt: string;
  }>;
  updatedAt: string;
}

export interface StorefrontPolicies {
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsAndConditions: string | null;
  loyaltyPolicy: string | null;
}
