import type { ReactElement } from 'react';
import type { MerchantRequestOptions } from './api-client';
import type { MerchantSession } from './types';

export type MerchantTabKey =
  | 'overview'
  | 'analyticsGeneral'
  | 'analyticsLive'
  | 'analyticsProducts'
  | 'analyticsOperations'
  | 'analyticsPayments'
  | 'analyticsFinancial'
  | 'analyticsShipments'
  | 'reportsCustomers'
  | 'reportsSales'
  | 'reportsInventory'
  | 'store'
  | 'products'
  | 'inventory'
  | 'warehouses'
  | 'attributes'
  | 'filters'
  | 'categories'
  | 'brands'
  | 'customers'
  | 'customerReviews'
  | 'customerQuestions'
  | 'abandonedCarts'
  | 'restockAlerts'
  | 'orders'
  | 'payments'
  | 'shipping'
  | 'promotions'
  | 'advancedPromotions'
  | 'coupons'
  | 'affiliates'
  | 'loyalty'
  | 'themes'
  | 'domains'
  | 'staff'
  | 'webhooks'
  | 'billing';

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
  key: MerchantTabKey | string;
  label: string;
  icon?: ReactElement;
  children?: { key: MerchantTabKey; label: string; icon?: ReactElement }[];
}
