# Storefront Phase 7 - Analytics and Experimentation Foundations

## Objective

Implement complete storefront event taxonomy capture, client-side event hooks, and analytics API readiness for dashboarding and experimentation.

## Implemented

## 1) Unified Event Taxonomy (API + Storefront)

- Extended storefront event constants in:
  - `apps/api/src/storefront/constants/storefront-event.constants.ts`
- Added explicit analytics event names:
  - `sf_home_viewed`
  - `sf_category_viewed`
  - `sf_product_viewed`
  - `sf_section_clicked`
  - `sf_add_to_cart_clicked`
  - `sf_cart_viewed`
  - `sf_cart_item_updated`
  - `sf_checkout_started`
  - `sf_checkout_step_completed`
  - `sf_checkout_submitted`
  - `sf_checkout_completed`
  - `sf_order_tracking_viewed`

## 2) Public Tracking Endpoint

- Added DTO for tracking payload validation:
  - `apps/api/src/storefront/dto/track-storefront-event.dto.ts`
- Added public endpoint:
  - `POST /sf/events`
  - implemented in `apps/api/src/storefront/storefront.controller.ts`
- Added service handling and normalized base event mapping:
  - `apps/api/src/storefront/storefront.service.ts`

## 3) Client Analytics SDK

- Added storefront analytics utility:
  - `apps/storefront/lib/storefront-analytics.ts`
- Includes:
  - persistent session id generation
  - `sendBeacon` + `fetch keepalive` fallback
  - typed event names

## 4) Event Hooks Across Funnel

- Added page view tracker component:
  - `apps/storefront/components/analytics-page-view.tsx`
- Wired funnel events in storefront pages/components:
  - Home page view: `apps/storefront/app/page.tsx`
  - Categories page view: `apps/storefront/app/categories/page.tsx`
  - Product page view: `apps/storefront/app/products/[slug]/page.tsx`
  - Add to cart click: `apps/storefront/components/product-purchase-card.tsx`
  - Cart viewed + cart item updated: `apps/storefront/components/cart-page-client.tsx`
  - Checkout started, step changes, submit, complete:
    `apps/storefront/components/checkout-page-client.tsx`
  - Order tracking page view: `apps/storefront/components/track-order-client.tsx`
  - Section CTA click tracking via tracked links:
    `apps/storefront/components/tracked-link.tsx`,
    `apps/storefront/components/theme-sections.tsx`

## 5) Dashboard Readiness (Analytics API)

- Added repository aggregation for event taxonomy:
  - `apps/api/src/analytics/analytics.repository.ts`
- Added service response + business mapping:
  - `apps/api/src/analytics/analytics.service.ts`
- Added analytics endpoint:
  - `GET /analytics/funnel/event-taxonomy`
  - `apps/api/src/analytics/analytics.controller.ts`
- Added admin typing contract:
  - `apps/admin/src/features/merchant/types.ts` (`AnalyticsEventTaxonomy`)

## Verification

- API typecheck passed.
- Storefront typecheck passed.
- Admin typecheck passed.
