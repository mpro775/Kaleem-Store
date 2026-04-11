# Storefront KPI Instrumentation Map

## Purpose

Define event names, trigger points, and payload contracts required to compute Phase 0 KPI dashboards.

## Event Naming Convention

- Prefix: `sf_`
- Pattern: `sf_<domain>_<action>`
- Example: `sf_checkout_step_completed`

## Event Catalog

## 1) Discovery and PDP

- `sf_home_viewed`
  - Trigger: homepage render
  - Payload: `storeId`, `themeVersion`, `deviceType`
- `sf_section_clicked`
  - Trigger: CTA click inside dynamic section
  - Payload: `sectionType`, `sectionId`, `variantId`
- `sf_product_viewed`
  - Trigger: PDP view
  - Payload: `productId`, `categoryId`, `priceFrom`

## 2) Cart

- `sf_add_to_cart_clicked`
  - Trigger: add-to-cart action
  - Payload: `productId`, `variantId`, `quantity`
- `sf_cart_viewed`
  - Trigger: cart page view
  - Payload: `cartId`, `itemCount`, `subtotal`
- `sf_cart_item_updated`
  - Trigger: quantity update/remove
  - Payload: `cartId`, `variantId`, `newQuantity`

## 3) Checkout

- `sf_checkout_started`
  - Trigger: checkout entry
  - Payload: `cartId`, `itemCount`, `subtotal`
- `sf_checkout_step_completed`
  - Trigger: step completion
  - Payload: `stepName`, `cartId`, `hasValidationError`
- `sf_checkout_submitted`
  - Trigger: order submit attempt
  - Payload: `cartId`, `paymentMethod`
- `sf_checkout_completed`
  - Trigger: successful order
  - Payload: `orderId`, `orderCode`, `total`, `currencyCode`

## 4) Theme Builder

- `sf_theme_editor_opened`
  - Trigger: editor loaded
  - Payload: `merchantId`, `storeId`
- `sf_theme_draft_saved`
  - Trigger: draft save success
  - Payload: `storeId`, `themeVersion`, `sectionCount`
- `sf_theme_published`
  - Trigger: publish success
  - Payload: `storeId`, `themeVersion`
- `sf_theme_preview_token_created`
  - Trigger: preview token creation
  - Payload: `storeId`, `expiresInMinutes`

## 5) Error Events

- `sf_theme_validation_failed`
  - Trigger: validator rejection
  - Payload: `storeId`, `errorCode`, `sectionType?`
- `sf_storefront_render_fallback`
  - Trigger: renderer fallback path
  - Payload: `storeId`, `sectionType`, `reason`

## Common Payload Fields

- `timestamp`
- `requestId`
- `storeId`
- `sessionId`
- `deviceType`
- `locale`

## Data Quality Rules

- Event payloads must pass schema validation before ingest.
- No PII in analytics payload unless explicitly approved and masked.
- Event delivery failures are retried with bounded policy.
