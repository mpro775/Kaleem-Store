export const PAYMENT_METHODS = ['cod', 'transfer'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
