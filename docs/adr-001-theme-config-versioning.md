# ADR-001: Theme Config Versioning and Migration

- Status: Accepted
- Date: 2026-03-27
- Decision Type: Architecture

## Context

Theme configuration currently evolves without explicit versioning. As section complexity increases, backward compatibility and safe rollout require deterministic schema evolution.

## Decision

Adopt explicit versioning with migration pipeline:

- Every theme config includes `schemaVersion`.
- New target baseline is `schemaVersion = 2`.
- Legacy configs are migrated on read/write paths through pure migration functions.
- Validation is performed after migration, before persistence/publish.

## Decision Details

1. Data model:
   - `schemaVersion: number` at config root.
2. Migration strategy:
   - `v1 -> v2` migrator is deterministic and idempotent.
   - Future versions follow linear migration chain.
3. Runtime safety:
   - If migration or validation fails, system serves safe default published config and records diagnostics.
4. Testing:
   - Snapshot tests for representative legacy payloads.
   - Contract tests for validator and migration outputs.

## Alternatives Considered

- No explicit versioning: rejected due to hidden break risk.
- Branch-per-version rendering logic: rejected due to long-term maintenance cost.

## Consequences

### Positive

- Predictable evolution and safer releases.
- Easier rollback and incident diagnosis.

### Negative

- Additional migration code and test surface.

## Follow-up Actions

- Add `schemaVersion` support in backend validator and service.
- Add migration utility package for themes.
