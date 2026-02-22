# Themes and Domains Runbook

## Theme Workflow (MVP)

- Draft state is stored in `store_themes.draft_config`.
- Published state is stored in `store_themes.published_config`.
- Publish action:
  - Copies draft to published config.
  - Increments `version`.
  - Emits `theme.published` through outbox.

## Theme Preview

- Generate token from `POST /themes/preview-token`.
- Use token with storefront endpoint:
  - `GET /sf/theme?previewToken=<token>`
- Token expiry is controlled by:
  - `THEME_PREVIEW_TOKEN_TTL_MINUTES`

## Domain Workflow (MVP)

- Add domain via `POST /domains`.
- Status transitions:
  - `pending -> verified -> active`
- Verify action checks DNS TXT:
  - Host format: `_kaleem-verify.<hostname>` (prefix configurable).
  - Token value equals `verificationToken` from domain registration.

## SSL Path (Cloudflare Option A)

- On activation (`POST /domains/:domainId/activate`):
  - Domain status becomes `active`.
  - `ssl_status` becomes `issued`.
- API response includes routing metadata for DNS setup:
  - `routingType` (`cname`)
  - `routingHost` (custom hostname)
  - `routingTarget` (configured from `DOMAIN_CNAME_TARGET`)
  - `sslProvider` (`cloudflare`)
  - `sslMode` (`full` or `full_strict`)
- Certificate lifecycle is handled by Cloudflare edge.
- API still emits `domain.activated` for downstream auditing/integrations.

## Events

- `theme.published`
- `domain.verified`
- `domain.activated`

## Operational SQL Checks

- Theme versions:
  - `SELECT store_id, version, updated_at FROM store_themes ORDER BY updated_at DESC;`
- Domain statuses:
  - `SELECT hostname, status, ssl_status, updated_at FROM store_domains ORDER BY updated_at DESC;`
