# Storefront KPI Dashboard Definition

## Objective

Define measurable KPIs for storefront customization quality, conversion health, and technical performance.

## Dashboard Domains

## 1) Business and Conversion

- `storefront_sessions`
- `product_view_rate`
- `add_to_cart_rate`
- `checkout_start_rate`
- `checkout_completion_rate`
- `cart_abandonment_rate`
- `conversion_rate`

## 2) Funnel Step Metrics

- PDP to cart drop-off
- Cart to checkout drop-off
- Checkout step completion rate by step
- Payment method completion split

## 3) Merchant Customization Metrics

- Draft saves per merchant
- Publish frequency per merchant
- Time from first draft to first publish
- Section usage distribution
- Theme preset adoption rate

## 4) Platform Reliability

- Theme publish failure rate
- Preview token failure rate
- Theme validation error count
- Storefront renderer runtime errors

## 5) Performance and Experience

- LCP p75
- CLS p75
- INP p75
- TTFB p75
- Hydration/render warning rates

## KPI Targets (Initial)

- Checkout completion: +10% vs baseline after rollout.
- Cart abandonment: -8% vs baseline after rollout.
- LCP p75: < 2.5s on core storefront pages.
- CLS p75: < 0.1.
- INP p75: < 200ms.
- Theme publish failure: < 1%.

## Segmentation Requirements

- By device type: mobile/desktop.
- By merchant cohort: control/pilot/general.
- By template/theme variant.
- By traffic source where available.

## Reporting Cadence

- Daily operational dashboard.
- Weekly product review.
- Monthly executive summary with trend deltas.
