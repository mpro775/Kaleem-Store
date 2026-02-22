# SaaS Controls Runbook

## Overview
Sprint 6 introduces platform-level controls for plan management and tenant governance.

## Configuration
- `PLATFORM_ADMIN_SECRET`: required for `/platform/*` APIs.

## Default Subscription
- New stores are automatically assigned the `free` plan.
- If no current subscription exists, billing snapshot flow self-heals by assigning default subscription.

## Enforced Limits
- `products.total` checked before creating products.
- `orders.monthly` checked before storefront checkout.
- `usage_events` records metering events for order creation.

## Suspension
- Platform admin can suspend store via:
  - `PATCH /platform/stores/:storeId/suspension`
- Effects:
  - Authenticated tenant APIs are blocked by tenant guard.
  - Storefront host resolution blocks suspended stores.

## Operational SQL
- Current subscriptions:
  - `SELECT store_id, status, plan_id FROM store_subscriptions WHERE is_current = TRUE;`
- Plan limits:
  - `SELECT p.code, l.metric_key, l.metric_limit, l.reset_period FROM plan_limits l JOIN plans p ON p.id = l.plan_id ORDER BY p.code, l.metric_key;`
- Suspended stores:
  - `SELECT id, slug, is_suspended, suspension_reason, suspended_at FROM stores WHERE is_suspended = TRUE;`
