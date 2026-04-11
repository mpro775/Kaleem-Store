# Storefront Phase 2 - Token System Implementation

## Objective

Establish a semantic design token system and wire storefront UI to token-driven styling so merchant theme settings can shape the storefront without hardcoded visual values.

## Implemented Scope

## 1) Runtime Token Resolver

- Added runtime token resolver: `apps/storefront/lib/theme-runtime.ts`
- Resolver reads `theme.config` and exposes CSS custom properties for:
  - Core semantic colors
  - Surface overlays
  - State colors (success/info/warning/danger)
  - Typography tokens
  - Radius and layout width

## 2) Theme Application at Layout Root

- Updated root layout to load published theme and inject runtime CSS variables at `<body>`:
  - `apps/storefront/app/layout.tsx`

## 3) Semantic Token Adoption in Storefront CSS

- Refactored storefront global styles to use semantic tokens instead of hardcoded values:
  - `apps/storefront/app/globals.css`
- Introduced semantic variable namespace:
  - `--color-*`
  - `--surface-overlay-*`
  - `--font-*`
  - `--page-max-width`
- Preserved legacy aliases for backward compatibility during transition.

## 4) Compatibility Guarantees

- Runtime resolver supports both legacy and v2 global keys where relevant.
- Existing components continue to render while consuming tokenized variables.

## Quality Verification

- API typecheck passed.
- Admin typecheck passed.
- Storefront typecheck passed.

## Notes

- This phase focused on token infrastructure and global adoption.
- Next phase should complete section-level variant styling and block-based visual language expansion.
