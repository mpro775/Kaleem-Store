export type StoreRole = 'owner' | 'staff';

export interface MerchantUser {
  id: string;
  storeId: string;
  email: string;
  fullName: string;
  role: StoreRole;
  permissions: string[];
  sessionId: string;
}

export interface MerchantSession {
  apiBaseUrl: string;
  accessToken: string;
  refreshToken: string;
  user: MerchantUser;
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: MerchantUser;
}

export interface StoreSettings {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  currencyCode: string;
  timezone: string;
  shippingPolicy: string | null;
  returnPolicy: string | null;
  privacyPolicy: string | null;
  termsAndConditions: string | null;
}

export interface Category {
  id: string;
  storeId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  nameAr: string | null;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
  mediaAssetId: string | null;
  imageUrl: string | null;
}

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku: string;
  barcode: string | null;
  price: number;
  compareAtPrice: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  attributes: Record<string, string>;
  attributeValueIds: string[];
  isDefault: boolean;
  titleAr: string | null;
  titleEn: string | null;
}

export type InventoryMovementType = 'adjustment' | 'sale' | 'return' | 'restock';
export type InventoryReservationStatus = 'reserved' | 'released' | 'consumed';

export interface InventoryMovement {
  id: string;
  variantId: string;
  orderId: string | null;
  movementType: InventoryMovementType;
  qtyDelta: number;
  note: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
}

export interface InventoryReservation {
  id: string;
  orderId: string;
  variantId: string;
  quantity: number;
  status: InventoryReservationStatus;
  reservedAt: string;
  expiresAt: string;
  releasedAt: string | null;
  consumedAt: string | null;
  releaseReason: string | null;
  metadata: Record<string, unknown>;
  updatedAt: string;
  productId: string;
  productTitle: string;
  variantTitle: string;
  sku: string;
}

export interface InventoryVariantSnapshot {
  variantId: string;
  productId: string;
  sku: string;
  productTitle: string;
  variantTitle: string;
  stockQuantity: number;
  lowStockThreshold: number;
  reservedQuantity: number;
  availableQuantity: number;
}

export interface PaginatedInventoryMovements {
  items: InventoryMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface PaginatedInventoryReservations {
  items: InventoryReservation[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId: string | null;
  mediaAssetId: string;
  url: string;
  altText: string | null;
  sortOrder: number;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId: string | null;
  title: string;
  slug: string;
  description: string | null;
  status: ProductStatus;
  variants?: ProductVariant[];
  images?: ProductImage[];
  titleAr: string | null;
  titleEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
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
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface MediaAsset {
  id: string;
  storeId: string;
  bucketName: string | null;
  objectKey: string;
  url: string;
  etag: string | null;
  mimeType: string;
  fileSizeBytes: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  downloadUrl?: string;
  downloadUrlExpiresAt?: string;
}

export interface PresignedMediaUpload {
  objectKey: string;
  uploadUrl: string;
  uploadHeaders: Record<string, string>;
  expiresAt: string;
  maxFileSizeBytes: number;
}

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'preparing'
  | 'out_for_delivery'
  | 'completed'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 'cod' | 'transfer';
export type PaymentStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'refunded';

export interface Payment {
  id: string;
  storeId: string;
  orderId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  receiptUrl: string | null;
  receiptMediaAssetId: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  customerUploadedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentWithOrder extends Payment {
  orderCode: string;
  orderStatus: string;
  orderTotal: number;
}

export interface Order {
  id: string;
  orderCode: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  currencyCode: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderDetail extends Order {
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    title: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  timeline: Array<{
    from: string | null;
    to: string;
    note: string | null;
    createdAt: string;
  }>;
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    receiptUrl: string | null;
  } | null;
}

export interface PaginatedOrders {
  items: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface ShippingZone {
  id: string;
  storeId: string;
  name: string;
  city: string | null;
  area: string | null;
  fee: number;
  isActive: boolean;
  nameAr: string | null;
  nameEn: string | null;
  cityAr: string | null;
  cityEn: string | null;
  areaAr: string | null;
  areaEn: string | null;
}

export type DiscountType = 'percent' | 'fixed';
export type OfferTargetType = 'product' | 'category' | 'cart';

export interface Coupon {
  id: string;
  storeId: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  startsAt: string | null;
  endsAt: string | null;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
}

export interface Offer {
  id: string;
  storeId: string;
  name: string;
  targetType: OfferTargetType;
  targetProductId: string | null;
  targetCategoryId: string | null;
  discountType: DiscountType;
  discountValue: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  nameAr: string | null;
  nameEn: string | null;
}

export type AdvancedOfferType = 'bxgy' | 'bundle' | 'tiered_discount';

export interface AdvancedOffer {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  offerType: AdvancedOfferType;
  config: Record<string, unknown>;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  priority: number;
  nameAr: string | null;
  nameEn: string | null;
  descriptionAr: string | null;
  descriptionEn: string | null;
}

export interface ThemeState {
  storeId: string;
  version: number;
  draftConfig: Record<string, unknown>;
  publishedConfig: Record<string, unknown>;
}

export interface PreviewTokenResponse {
  previewToken: string;
  expiresAt: string;
}

export type DomainStatus = 'pending' | 'verified' | 'active';
export type DomainSslStatus = 'pending' | 'requested' | 'issued' | 'error';

export interface Domain {
  id: string;
  storeId: string;
  hostname: string;
  routingType?: 'cname';
  routingHost?: string;
  routingTarget?: string;
  status: DomainStatus;
  sslStatus: DomainSslStatus;
  sslProvider?: 'manual' | 'cloudflare';
  sslMode?: 'full' | 'full_strict';
  sslLastCheckedAt?: string | null;
  sslError?: string | null;
  verificationToken: string;
  verificationDnsHost: string;
  verifiedAt: string | null;
  activatedAt: string | null;
}

export interface UserProfile {
  id: string;
  storeId: string;
  email: string;
  fullName: string;
  role: StoreRole;
  permissions: string[];
  isActive?: boolean;
}

export interface StaffInvite {
  id: string;
  email: string;
  fullName: string;
  role: StoreRole;
  expiresAt: string;
  inviteToken?: string;
}

export interface InviteValidation {
  valid: boolean;
  email: string;
  fullName: string;
  storeName?: string;
}

export interface AttributeValue {
  id: string;
  storeId: string;
  attributeId: string;
  value: string;
  slug: string;
  valueAr: string | null;
  valueEn: string | null;
}

export interface Attribute {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  values?: AttributeValue[];
  nameAr: string | null;
  nameEn: string | null;
}

export interface CategoryAttributes {
  categoryId: string;
  attributeIds: string[];
}

export interface WebhookEndpoint {
  id: string;
  storeId: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDelivery {
  id: string;
  storeId: string;
  endpointId: string;
  eventType: string;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  attemptNumber: number;
  deliveredAt: string | null;
  nextRetryAt: string | null;
  errorMessage: string | null;
  createdAt: string;
}
