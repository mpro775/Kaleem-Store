# ADR-002: Theme Preview Architecture and Cache Invalidation

- Status: Accepted
- Date: 2026-03-27
- Decision Type: Architecture

## Context

Theme draft preview must be fast and isolated from public traffic. Cached published content must never leak draft data. Publish operations must invalidate stale content safely.

## Decision

Implement tokenized preview and explicit cache control:

- Preview access uses expiring `previewToken` tied to store identity.
- Preview responses bypass published cache strategy.
- Published mode continues using cache with revalidation.
- Publish operation triggers explicit cache invalidation hooks.

## Decision Details

1. Modes:
   - `published`: cache-friendly, public-safe.
   - `preview`: token-required, uncached or short TTL.
2. Token behavior:
   - Random high-entropy token.
   - Expiration enforced server-side.
   - Store-scoped validation.
3. Invalidation:
   - On publish event, invalidate storefront routes and theme endpoints for target store.
4. Observability:
   - Emit logs/metrics for preview token creation and validation failures.

## Alternatives Considered

- Cookie-only preview session: rejected for weak shareability and multi-user constraints.
- Shared cache key with mode parameter only: rejected for leak risk if misconfigured.

## Consequences

### Positive

- Strong separation between draft and published experiences.
- Better operational confidence for merchant previews.

### Negative

- Slight complexity in caching and route invalidation workflows.

## Follow-up Actions

- Add publish-triggered invalidation runbook updates.
- Add alerting for abnormal preview token error rates.
