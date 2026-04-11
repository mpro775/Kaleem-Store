# ADR-003: Design Token Pipeline for Storefront Theming

- Status: Accepted
- Date: 2026-03-27
- Decision Type: Architecture

## Context

Storefront styles currently include many static values. This blocks deep merchant branding and increases design inconsistency.

## Decision

Adopt a design-token pipeline where theme globals become runtime CSS variables and all storefront primitives consume token roles, not hardcoded values.

## Decision Details

1. Token layers:
   - Semantic tokens: `--color-bg`, `--color-text`, `--color-primary`, etc.
   - Typographic tokens: families, sizes, weights, line-height.
   - Spacing/radius/elevation/motion tokens.
2. Runtime application:
   - Theme resolver maps config globals to CSS variables at layout/root level.
3. Component contract:
   - Reusable components read token variables only.
4. Accessibility:
   - Contrast guardrails validated in editor and backend where feasible.

## Alternatives Considered

- Inline style injection per component: rejected for maintainability and drift.
- Theme-specific CSS bundles only: rejected due to reduced flexibility.

## Consequences

### Positive

- Strong visual consistency and easy re-skinning.
- Cleaner separation between product logic and presentation.

### Negative

- Initial refactor effort across existing storefront styles.

## Follow-up Actions

- Define token naming standard and linting checks.
- Add visual regression tests for token changes.
