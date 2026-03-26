# Merchant Analytics Roadmap (Phased Plan)

## 1) Objective

Build a merchant-focused analytics system that is:

- Accurate (clear KPI definitions and consistent calculations)
- Actionable (helps merchants decide pricing, operations, stock, and marketing)
- Incremental (quick value in early phases, advanced insights later)

This plan excludes platform-wide admin analytics and focuses on store-level merchant value.

## 2) Current State (Based on Repo)

- Merchant dashboard overview cards are currently static placeholders (zero values) in `apps/admin/src/features/merchant/merchant-dashboard.tsx`.
- Core data needed for merchant analytics already exists in orders, order items, payments, inventory, coupons/offers, reviews, and wishlist tables.
- Some data consistency gaps must be closed before trusting KPI outputs.

## 3) High-Value KPIs We Can Deliver Now

These can be implemented without major tracking architecture changes:

1. Total sales (GMV) and net sales
2. Orders count and orders by status
3. Average order value (AOV)
4. Cancellation rate and return rate
5. Payment approval/rejection/refund rates
6. Top-selling products (by quantity)
7. Top-revenue products (by line total)
8. Coupon and discount impact
9. Low-stock and stockout-risk indicators
10. Fulfillment speed by status transition timestamps

## 4) Competitive Differentiators (Merchant-First)

Recommended differentiator metrics that can make the product stand out:

1. **Top Products Momentum** (fastest-growing SKUs in last 7/14 days)
2. **Return-Prone SKU Index** (products with high return tendency)
3. **Zone Profitability Map** (net outcome by city/area after shipping and discounts)
4. **Payment Risk Score** (collection risk by method and behavior)
5. **Fulfillment SLA Percentiles (P50/P90)** (operations quality, not just averages)
6. **Discount Efficiency** (discount spend vs incremental revenue)
7. **Stockout Impact Estimator** (lost-sales risk from low inventory)
8. **Reorder Propensity (RFM-lite)** (customer repeat purchase likelihood)

## 5) Data Accuracy Prerequisites (Must-Fix)

Before production-grade analytics, complete these fixes:

1. **Payment status consistency**
   - Align DB check constraints and application status enums/transitions.
   - Prevent mixed semantics (e.g., `paid/failed` vs `approved/rejected`).

2. **Timezone normalization**
   - Use store timezone for day/week/month KPI boundaries.
   - Avoid UTC boundary drift in merchant-facing charts.

3. **Review schema alignment**
   - Resolve duplicated/overlapping `product_reviews` definitions across migrations.

4. **Order lifecycle consistency checks**
   - Ensure transitions and reporting dimensions are consistent with actual workflow.

5. **KPI contract document**
   - Write and freeze canonical formulas for each KPI.

## 6) Phased Execution Plan

## Phase 0 - Foundations and KPI Contract

**Goal:** establish trust in data.

### Deliverables

- Canonical KPI specification (definitions, included statuses, exclusions)
- Data consistency fixes (payment statuses, schema cleanup)
- Timezone policy for all date-window analytics
- SQL validation queries and baseline snapshots

### Exit Criteria

- Every KPI has a written formula and test query
- No known status mismatch affecting KPI output

---

## Phase 1 - Merchant Analytics MVP

**Goal:** ship immediate merchant value in dashboard overview.

### MVP KPIs

- Sales today / 7d / 30d
- Orders today / 7d / 30d
- AOV
- Orders by status
- Top-selling products (quantity + revenue)

### API Endpoints (suggested)

- `GET /analytics/overview?range=7d|30d|custom`
- `GET /analytics/orders/status-breakdown?range=...`
- `GET /analytics/products/top-selling?range=...&limit=...`

### Admin UI Scope

- Replace static overview cards with real API data
- Add Top Products table on overview
- Add loading, empty, and error states

### Exit Criteria

- Overview tab fully data-driven
- KPI values validated with SQL spot-checks

---

## Phase 2 - Operations and Profitability Layer

**Goal:** help merchants optimize fulfillment and cash collection.

### KPIs

- Fulfillment lead time per transition (`new->confirmed`, `confirmed->preparing`, etc.)
- SLA percentiles (P50/P90)
- Payment review latency
- Payment outcome rates by method
- Discount efficiency (discount-to-revenue contribution)

### API Endpoints (suggested)

- `GET /analytics/operations/fulfillment-sla?range=...`
- `GET /analytics/payments/performance?range=...`
- `GET /analytics/promotions/efficiency?range=...`

### Exit Criteria

- Merchant can identify operational bottlenecks from dashboard alone

---

## Phase 3 - Inventory and Customer Intelligence

**Goal:** reduce stockouts and improve retention.

### KPIs

- Low-stock severity board
- Stockout impact estimator
- Slow-moving SKUs
- New vs returning customers
- Repeat purchase and reorder propensity

### API Endpoints (suggested)

- `GET /analytics/inventory/health?range=...`
- `GET /analytics/inventory/stockout-risk?range=...`
- `GET /analytics/customers/retention?range=...`

### Exit Criteria

- Merchant can prioritize purchase orders and retention actions using insights

---

## Phase 4 - Behavioral Tracking and Conversion Funnel

**Goal:** unlock traffic and conversion analytics (requires event tracking).

### New Tracking Events

- `store_visit`
- `product_view`
- `add_to_cart`
- `checkout_start`
- `checkout_complete`
- `coupon_view` / `coupon_apply`

### KPIs

- Funnel conversion rates per stage
- Drop-off reasons by step
- Traffic source and campaign attribution
- Product view-to-purchase conversion

### Exit Criteria

- Funnel and source analytics available per merchant store

---

## Phase 5 - Reliability, Governance, and Scale

**Goal:** keep analytics trustworthy as data volume grows.

### Deliverables

- KPI regression tests (snapshot + deterministic fixtures)
- Data quality monitors (missing data, anomaly alerts)
- Performance optimization (indexes/materialized views as needed)
- Versioned KPI contract

### Exit Criteria

- Analytics endpoints meet performance and correctness SLAs

## 7) Top-Selling Products Logic (Requested Item)

### Core Definition

- **Top-selling by quantity:** rank products by `SUM(order_items.quantity)`
- **Top-selling by revenue:** rank products by `SUM(order_items.line_total)`

### Recommended Filters

- Include only finalized order outcomes (`completed`, optionally `out_for_delivery` if business accepts)
- Exclude `cancelled` and `returned` from final sales leaderboard
- Always scope by `store_id`
- Apply time window in store timezone

### Output Fields

- Product ID
- Product title
- Units sold
- Revenue generated
- Share of total sales (%)
- Trend vs previous period

## 8) Technical Workstreams

1. **Backend analytics module** (controller/service/repository)
2. **SQL query set + indexes** for KPI endpoints
3. **Merchant dashboard integration** in overview tab
4. **KPI test suite** (unit + integration SQL validation)
5. **Observability** (latency, error rates, stale-data checks)

## 9) Suggested Milestone Sequence

- Milestone A: Phase 0 complete (data contract and consistency)
- Milestone B: Phase 1 live (overview + top products)
- Milestone C: Phase 2 live (ops + payments + discounts)
- Milestone D: Phase 3 live (inventory + customers)
- Milestone E: Phase 4 live (funnel tracking)
- Milestone F: Phase 5 hardening complete

## 10) Immediate Next Step

Start with **Phase 0 + Phase 1** in one implementation track:

1. Freeze KPI definitions
2. Implement `overview` and `top-selling products` endpoints
3. Replace static merchant overview cards with real data
4. Add SQL-backed verification checks before release
