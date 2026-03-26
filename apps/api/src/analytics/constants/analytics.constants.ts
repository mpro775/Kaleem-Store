export const ANALYTICS_WINDOWS = [7, 30, 90] as const;
export type AnalyticsWindow = (typeof ANALYTICS_WINDOWS)[number];

export const ANALYTICS_ORDER_STATUSES = [
  'new',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'completed',
  'cancelled',
  'returned',
] as const;

export type AnalyticsOrderStatus = (typeof ANALYTICS_ORDER_STATUSES)[number];
