# Build Verification Runbook

## Goal

Provide a repeatable verification flow that confirms the monorepo is ready for release from a build and smoke test perspective.

## Prerequisites

- Node.js 20+
- Fresh dependency install permissions

## Verification Pipeline (Local)

Run from the repository root:

```bash
npm ci
npm run typecheck
npm run build
npm run smoke:e2e
```

## What Each Step Validates

- `npm ci`
  - Uses the lockfile and ensures reproducible dependency installation.
- `npm run typecheck`
  - Runs TypeScript checks with `--noEmit` across workspaces.
- `npm run build`
  - Produces production builds for shared types, API, admin, and storefront.
- `npm run smoke:e2e`
  - Runs the API sprint smoke/e2e suites:
    - sprint4-smoke
    - sprint5-themes-domains
    - sprint6-saas-platform
    - sprint7-attributes-filters
    - sprint8-inventory-reservations

## Pass Criteria

All four commands complete without errors.

## Failure Handling

1. If `npm ci` fails:
   - Verify Node.js version and lockfile consistency.
2. If `typecheck` fails:
   - Fix TS typing and configuration issues first.
3. If `build` fails:
   - Resolve compile or bundling failures before running tests.
4. If `smoke:e2e` fails:
   - Investigate regression in impacted module and rerun the same suite after fixes.

## CI Alignment

The GitHub Actions workflow at `.github/workflows/ci.yml` runs the same core gate sequence:

1. Install dependencies
2. Typecheck
3. Build
4. Smoke E2E

This keeps local and CI verification behavior consistent.
