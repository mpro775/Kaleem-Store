export const STOREFRONT_EVENT_TYPES = [
  'store_visit',
  'product_view',
  'add_to_cart',
  'checkout_start',
  'checkout_complete',
  'coupon_apply',
] as const;

export type StorefrontEventType = (typeof STOREFRONT_EVENT_TYPES)[number];
