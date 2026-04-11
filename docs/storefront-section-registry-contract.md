# Storefront Section Registry Contract (Phase 0)

## Purpose

Define a shared contract for section metadata used by both storefront renderer and admin visual builder.

## Contract Goals

- Single source of truth for section capabilities.
- Schema-driven editor controls.
- Safe rendering with fallback behavior.

## Registry Record Shape

```ts
type SectionRegistryEntry = {
  type: string;
  label: string;
  category: 'structure' | 'content' | 'commerce' | 'trust' | 'footer';
  icon: string;
  maxPerPage?: number;
  supportsBlocks: boolean;
  defaultEnabled: boolean;
  settingsSchemaRef: string;
  blockSchemaRef?: string;
  variants: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
};
```

## Required Runtime Behavior

- Unknown `type` values must not crash rendering.
- Disabled sections are skipped.
- Invalid settings must use safe defaults and report telemetry.

## Initial Section Types

- `announcement_bar`
- `header`
- `hero`
- `categories_grid`
- `featured_products`
- `rich_text`
- `testimonials`
- `newsletter_signup`
- `offers_banner`
- `faq`
- `trust_badges`
- `footer`

## Editor Integration Rules

- Editor control panel is generated from `settingsSchemaRef`.
- Variant selector is shown when `variants.length > 1`.
- Reordering and duplication follow `maxPerPage` constraints.

## Validation Expectations

- API validator enforces section type and settings schema compatibility.
- Block data is validated against section-specific block schema.

## Versioning

- Registry is versioned alongside ThemeConfig schema major versions.
- Section deprecations require migration notes and fallback mapping.
