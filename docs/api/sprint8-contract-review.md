# Sprint 8 API Contract Review

This review covers inventory reservations, movement auditing, and low-stock alerting.

## Scope

- Inventory admin APIs:
  - `GET /inventory/movements`
  - `GET /inventory/reservations`
  - `GET /inventory/alerts/low-stock`
  - `POST /inventory/variants/:variantId/adjustments`
  - `PUT /inventory/variants/:variantId/threshold`
- Storefront + orders behavior:
  - `POST /sf/checkout` creates short-lived stock reservations
  - `PATCH /orders/:orderId/status` transitions inventory based on status flow

## Contract Highlights

- Checkout reserves quantity per variant for a short TTL (`INVENTORY_RESERVATION_TTL_MINUTES`).
- Confirming `new -> confirmed`:
  - consumes active reservation,
  - deducts stock,
  - writes `sale` movement.
- Cancelling `new -> cancelled` releases active reservations.
- Cancelling after confirmation (`confirmed/preparing -> cancelled`) and delivery return (`out_for_delivery -> returned`) write positive `return` stock movements.
- Manual stock updates produce movement history with one of:
  - `adjustment`
  - `restock`
  - `sale`
  - `return`

## Data Model Additions

- `inventory_reservations`
  - status lifecycle: `reserved -> consumed|released`
  - `expires_at` supports automatic release behavior
- `inventory_movements`
  - immutable stock delta records linked to variant/order
- `product_variants`
  - `low_stock_threshold` integer column

## Alerts

- Low-stock notifications are emitted as outbox events (`inventory.low_stock`) when stock crosses below threshold.
- Notification worker classifies this event to merchant channel.

## Security and Tenancy

- Inventory endpoints are protected by:
  - Access token guard
  - Tenant guard
  - Permissions guard
- New permissions:
  - `inventory:read`
  - `inventory:write`

## OpenAPI

- Regenerate with:
  - `npm run openapi:generate`
- Output file:
  - `docs/api/openapi.json`
