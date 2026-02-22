# Sprint 4 API Contract Review

This review covers Shipping, Promotions, and Checkout contract updates introduced in Sprint 4.

## Scope Reviewed
- `POST /shipping-zones`, `GET /shipping-zones`, `PUT /shipping-zones/:zoneId`, `DELETE /shipping-zones/:zoneId`
- `POST /promotions/coupons`, `GET /promotions/coupons`, `PUT /promotions/coupons/:couponId`, `POST /promotions/coupons/apply`
- `POST /promotions/offers`, `GET /promotions/offers`, `PUT /promotions/offers/:offerId`
- `POST /sf/checkout` and related storefront flow
- Notification consumer behavior for `order.created` and `order.status.changed`

## Contract Decisions and Alignment
- Create endpoints now document `201 Created` in OpenAPI:
  - `POST /shipping-zones`
  - `POST /promotions/coupons`
  - `POST /promotions/offers`
- Action-style POST endpoints explicitly return `200 OK`:
  - `POST /promotions/coupons/apply`
  - `POST /sf/cart/items`
  - `POST /sf/checkout`
- Delete endpoint documents `204 No Content`:
  - `DELETE /shipping-zones/:zoneId`

## Validation and Security Checks
- Admin endpoints remain protected with `AccessTokenGuard`, `TenantGuard`, and `PermissionsGuard`.
- Shipping and promotion DTOs enforce types, max lengths, numeric ranges, and UUID format where required.
- Checkout DTO supports optional `shippingZoneId` and `couponCode`; service validates zone activity and coupon validity server-side.
- Tenant boundary remains enforced by `x-store-id` and route param checks against authenticated user store.

## Event and Reliability Contract
- `order.created` and `order.status.changed` are consumed by `worker:notifications`.
- Failed consumer attempts are retried through dedicated retry queues using TTL delay.
- Terminal failures are persisted to `notification_deliveries` with status `failed` and copied to DLQ.
- Successful processing is persisted to `notification_deliveries` with status `processed`.

## Data Contract Additions
- Orders now persist Sprint 4 pricing fields:
  - `shipping_zone_id`
  - `shipping_fee`
  - `discount_total`
  - `coupon_code`
- New domain tables introduced:
  - `shipping_zones`
  - `coupons`
  - `offers`
  - `notification_deliveries`

## OpenAPI
- Regenerate contract with:
  - `npm run openapi:generate`
- Generated artifact:
  - `docs/api/openapi.json`
