export const WEBHOOK_EVENTS = [
  'product.created',
  'product.updated',
  'order.created',
  'order.updated',
  'inventory.updated',
  'coupon.updated',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];
