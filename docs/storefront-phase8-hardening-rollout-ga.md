# Storefront Phase 8 - Hardening, Rollout, and GA Controls

## Objective

Complete launch hardening by adding anti-abuse controls, rollout gates, security headers, and explicit GA readiness checks.

## Implemented

## 1) Event Ingestion Hardening

- Updated `apps/api/src/storefront/storefront-tracking.service.ts`:
  - Added per-session rate limiting for tracking ingestion (`120 events / minute`), Redis-backed.
  - Added metadata sanitization:
    - max key count
    - max key length
    - max string length
    - depth and array/object bounds
  - Ensures analytics pipeline is resilient against payload abuse and noisy clients.

## 2) Rollout Stage Controls (Admin)

- Updated `apps/admin/src/features/merchant/panels/themes-panel.tsx`:
  - Added env-driven feature gate:
    - `VITE_SF_VISUAL_BUILDER_ENABLED`
  - Added rollout stage marker:
    - `VITE_SF_ROLLOUT_STAGE`
  - Provides explicit internal/pilot/GA control from deployment environment.

## 3) Storefront Security Header Baseline

- Added `apps/storefront/middleware.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - restrictive `Permissions-Policy`
  - no-store cache for track-order route

## 4) GA Gate Automation Script

- Added `scripts/storefront-ga-readiness.mjs`.
- Added root script command in `package.json`:
  - `npm run storefront:ga:readiness`
- Script validates:
  - Required phase docs present
  - Required storefront env vars exist
- Outputs pass/fail signal for release gate reviews.

## Recommended Rollout Stages

1. Internal stores only (`VITE_SF_ROLLOUT_STAGE=internal`)
2. Pilot cohort (`VITE_SF_ROLLOUT_STAGE=pilot`)
3. Expanded cohort with daily quality monitoring
4. General Availability (`VITE_SF_ROLLOUT_STAGE=ga`)

## Verification

- API typecheck passed
- Admin typecheck passed
- Storefront typecheck passed
