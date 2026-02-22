# Kaleem Store Monorepo

Implementation repo for Kaleem Store SaaS platform (Sprints 0-8 in progress).

## Workspaces

- `apps/api` - NestJS backend API
- `apps/admin` - Merchant admin dashboard (React + Vite)
- `apps/storefront` - Customer storefront (Next.js)
- `packages/shared-types` - Shared contracts

## Quick Start

```bash
npm install
npm run dev:infra
npm run migrate:up
npm run seed:run
npm run dev --workspace @kaleem/api
npm run dev --workspace @kaleem/storefront
```

## Worker Commands

- Outbox publisher: `npm run worker:outbox --workspace @kaleem/api`
- Notifications consumer: `npm run worker:notifications --workspace @kaleem/api`

## API and Runbooks

- OpenAPI: `docs/api/openapi.json`
- Sprint 4 contract review: `docs/api/sprint4-contract-review.md`
- Sprint 4 endpoint examples: `docs/api/sprint4-endpoint-examples.md`
- Sprint 4 closure checklist: `docs/api/sprint4-closure-checklist.md`
- Sprint 5 contract review: `docs/api/sprint5-contract-review.md`
- Sprint 5 endpoint examples: `docs/api/sprint5-endpoint-examples.md`
- Sprint 6 contract review: `docs/api/sprint6-contract-review.md`
- Sprint 6 endpoint examples: `docs/api/sprint6-endpoint-examples.md`
- Sprint 7 contract review: `docs/api/sprint7-contract-review.md`
- Sprint 7 endpoint examples: `docs/api/sprint7-endpoint-examples.md`
- Sprint 8 contract review: `docs/api/sprint8-contract-review.md`
- Sprint 8 endpoint examples: `docs/api/sprint8-endpoint-examples.md`
- Local setup: `docs/runbooks/local-setup.md`
- Storage and media: `docs/storage-media.md`
- Storefront implementation: `docs/storefront-implementation.md`
- Custom domains and SSL: `docs/custom-domains-ssl.md`
- Messaging: `docs/runbooks/messaging.md`
- Themes and domains: `docs/runbooks/themes-domains.md`
- SaaS controls: `docs/runbooks/saas-controls.md`
