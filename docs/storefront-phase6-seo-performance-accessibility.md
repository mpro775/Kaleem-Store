# Storefront Phase 6 - SEO, Performance, Accessibility Hardening

## Objective

Raise storefront technical quality through strong metadata/SEO, crawl controls, structured data, and practical accessibility/performance improvements.

## Implemented Changes

## 1) Global SEO Metadata Baseline

- Updated `apps/storefront/app/layout.tsx`:
  - Switched to async `generateMetadata()`.
  - Added dynamic `metadataBase` from runtime host.
  - Added canonical baseline, Open Graph, Twitter, and robots defaults.

## 2) SEO Utility Layer

- Added `apps/storefront/lib/seo.ts`:
  - Site origin resolution from forwarded headers.
  - Absolute URL builder.
  - Text sanitizer helper for metadata/schema.

## 3) Page-Level Metadata + Structured Data

- Updated `apps/storefront/app/page.tsx`:
  - Added metadata generator.
  - Added JSON-LD `WebSite` schema with search action.

- Updated `apps/storefront/app/categories/page.tsx`:
  - Added metadata generator with canonical handling for category/search state.
  - Added JSON-LD `CollectionPage` + `BreadcrumbList`.

- Updated `apps/storefront/app/products/[slug]/page.tsx`:
  - Expanded metadata (canonical, OG, Twitter).
  - Added JSON-LD `Product` schema with offers and aggregate rating.

## 4) Crawl and Indexing Controls

- Added `apps/storefront/app/robots.ts`:
  - Public crawling allowed for catalog pages.
  - Sensitive flow pages disallowed (`/checkout`, `/cart`, `/account`, `/customers`).

- Added `apps/storefront/app/sitemap.ts`:
  - Dynamic sitemap entries for home, categories, track-order, category filters, and product pages.

- Updated noindex handling for transactional pages:
  - `apps/storefront/app/cart/page.tsx`
  - `apps/storefront/app/checkout/page.tsx`
  - `apps/storefront/app/track-order/page.tsx`

## 5) Accessibility Hardening

- Updated `apps/storefront/app/globals.css`:
  - Added clear `:focus-visible` outline style.
  - Added reduced-motion fallback via `prefers-reduced-motion` media query.

- Updated form controls with explicit accessibility labels:
  - `apps/storefront/components/checkout-page-client.tsx`
  - `apps/storefront/components/cart-page-client.tsx`
  - Search and pagination semantics improved in `apps/storefront/app/categories/page.tsx`.

## 6) Performance-Oriented Tweaks

- Added explicit lazy loading on product thumbnails in PDP.
- Preserved server-side cached fetch strategy for catalog/theme endpoints.
- Kept critical image priority only for hero product image.

## Verification

- Storefront typecheck passed.
- API typecheck passed.
- Admin typecheck passed.
