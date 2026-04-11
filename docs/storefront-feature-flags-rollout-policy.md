# Storefront Feature Flags and Rollout Policy

## Purpose

Control risk during rollout of enterprise storefront capabilities using staged flags, owner accountability, and rollback discipline.

## Flag Design Principles

- Every major capability is behind a named flag.
- Flags are tenant-aware and cohort-aware.
- Flags include default state, owner, and expiry policy.
- No permanent "temporary" flags beyond stabilization window.

## Flag Catalog (Phase 0 Baseline)

1. `sf_theme_v2_enabled`
   - Scope: Merchant/store
   - Enables ThemeConfig v2 runtime path
2. `sf_visual_builder_enabled`
   - Scope: Merchant user roles
   - Enables new admin visual editor
3. `sf_section_blocks_enabled`
   - Scope: Merchant/store
   - Enables block-based section rendering
4. `sf_checkout_v2_enabled`
   - Scope: Merchant/store
   - Enables upgraded cart/checkout UX flow
5. `sf_experiments_enabled`
   - Scope: Merchant/store
   - Enables A/B experimentation hooks

## Rollout Stages

- Stage A: Internal test stores only.
- Stage B: Pilot merchants (small cohort).
- Stage C: Expanded cohort with daily monitoring.
- Stage D: General Availability.

## Release Gates per Stage

- No Sev-1 defects open.
- Error rates within agreed threshold.
- Performance metrics stable relative to baseline.
- On-call runbook validated.

## Rollback Policy

- Any Sev-1 production incident triggers immediate flag rollback.
- If conversion drops beyond threshold for 24h, revert to previous stable config.
- Rollback decisions and rationale are logged in incident channel and postmortem.

## Ownership and SLA

- Product owner: rollout schedule and cohort approvals.
- Engineering owner: implementation integrity and mitigation actions.
- SRE owner: observability and alerting integrity.
