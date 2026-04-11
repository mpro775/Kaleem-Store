# Storefront Phase 4 - Visual Builder Implementation

## Objective

Deliver a full visual editor experience for merchants including drag-and-drop section tree, schema-driven properties panel, live preview, undo/redo, autosave, and publish summary.

## Implemented

- Rebuilt theme editor panel in `apps/admin/src/features/merchant/panels/themes-panel.tsx`.
- Introduced editor state engine with:
  - Snapshot history
  - Undo/redo reducer actions
  - Dirty-state tracking
  - Autosave debounce flow
- Added drag-and-drop section tree with:
  - Reordering
  - Section visibility toggle
  - Duplicate section
  - Delete section
  - Add section from catalog
- Added dynamic section properties panel generated from in-file section schemas:
  - Variant selection
  - Dynamic fields by type (text/textarea/number/switch/select)
  - Block collection editor for block-enabled sections
- Added live preview canvas reflecting current draft instantly.
- Added publish summary dialog that compares draft and published snapshots before final publish.
- Preserved preview link generation and current publish pipeline.

## UX/Operational Enhancements

- Save status badges (dirty, autosaving, last saved time).
- Manual save and reload controls retained.
- Publish flow now includes change summary checkpoint.

## Quality Verification

- Admin typecheck passed.
- API typecheck passed.
- Storefront typecheck passed.
