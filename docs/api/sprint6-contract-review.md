# Sprint 6 API Contract Review

This review covers SaaS controls: plans, subscriptions, usage limits, and platform admin APIs.

## Scope
- Merchant billing:
  - `GET /billing/subscription`
- Platform admin:
  - `GET /platform/plans`
  - `POST /platform/plans`
  - `PUT /platform/plans/:planId`
  - `POST /platform/stores/:storeId/subscription`
  - `GET /platform/subscriptions`
  - `GET /platform/stores`
  - `PATCH /platform/stores/:storeId/suspension`
  - `GET /platform/domains`

## Data Model
- `plans`
- `plan_limits`
- `store_subscriptions`
- `usage_events`
- `stores` extended with:
  - `is_suspended`
  - `suspension_reason`
  - `suspended_at`

## Contract Highlights
- Stores receive default `free` subscription on owner registration.
- Plan limits support both:
  - `lifetime`
  - `monthly`
- Enforced metering in business flow:
  - `products.total` checked on product creation.
  - `orders.monthly` checked before storefront checkout.
- Checkout records `usage_events` for `orders.monthly`.
- Suspension behavior:
  - Platform admin can suspend a store.
  - Tenant guard blocks authenticated endpoints for suspended stores.
  - Storefront host resolution also blocks suspended stores.

## Security
- Platform admin APIs are protected by `x-platform-admin-secret` via `PlatformAdminGuard`.
- Secret config key:
  - `PLATFORM_ADMIN_SECRET`

## OpenAPI
- Regenerate with:
  - `npm run openapi:generate`
- Output file:
  - `docs/api/openapi.json`
