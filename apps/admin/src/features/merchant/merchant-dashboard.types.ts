import type { ReactElement } from 'react';
import type { MerchantRequestOptions } from './api-client';
import type { MerchantSession } from './types';

export type MerchantTabKey =
  | 'overview'
  | 'store'
  | 'products'
  | 'inventory'
  | 'attributes'
  | 'categories'
  | 'orders'
  | 'payments'
  | 'shipping'
  | 'promotions'
  | 'themes'
  | 'domains'
  | 'staff'
  | 'webhooks';

export type MerchantRequester = <T>(
  path: string,
  init?: RequestInit,
  options?: MerchantRequestOptions,
) => Promise<T | null>;

export interface MerchantPanelProps {
  session: MerchantSession;
  request: MerchantRequester;
}

export interface MerchantNavItem {
  key: MerchantTabKey;
  label: string;
  icon: ReactElement;
}
