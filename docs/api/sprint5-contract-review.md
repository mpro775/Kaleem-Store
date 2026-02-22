# Sprint 5 API Contract Review

This review covers Themes and Custom Domains MVP contracts.

## Scope

- `GET /themes/draft`
- `PUT /themes/draft`
- `POST /themes/publish`
- `POST /themes/preview-token`
- `POST /domains`
- `GET /domains`
- `POST /domains/:domainId/verify`
- `POST /domains/:domainId/activate`
- `DELETE /domains/:domainId`
- `GET /sf/theme`

## Contract Highlights

- Theme draft and published configs are returned together for editor state sync.
- Theme publish increments `version` and emits `theme.published` via outbox.
- Preview tokens are short-lived and can be used by storefront theme endpoint.
- Domain creation returns DNS TXT verification data plus CNAME routing target.
- Domain lifecycle is enforced:
  - `pending -> verified -> active`
- Domain activation sets `sslStatus = issued` for Cloudflare edge SSL path.
- Domain verify/activate emit outbox events:
  - `domain.verified`
  - `domain.activated`

## Security and Tenancy

- All themes/domains admin endpoints are protected with:
  - Access token guard
  - Tenant guard
  - Permissions guard
- New permissions:
  - `themes:read`, `themes:write`
  - `domains:read`, `domains:write`
- Storefront theme endpoint remains public and resolves store by host/custom domain.

## Data Model Additions

- `store_themes`
- `theme_preview_tokens`
- `store_domains`

## OpenAPI

- Regenerate with:
  - `npm run openapi:generate`
- Output file:
  - `docs/api/openapi.json`
