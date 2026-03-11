# Go-Live Checklist

## Objective

Ship a stable release with explicit verification gates, rollback readiness, and incident ownership.

## T-48h

- Freeze schema changes except approved release migrations.
- Confirm latest backup policy for database and object storage.
- Confirm release owner, on-call owner, and communication channel.
- Verify production env vars for domains, storage, SaaS, and observability.

## T-24h

- Run full gate locally and in CI:
  - `npm run typecheck`
  - `npm run build`
  - `npm run smoke:e2e`
  - `npm run test`
- Run migrations on staging and validate:
  - domains SSL lifecycle
  - webhooks dispatch/retries
  - policies pages rendering
  - payment receipt review flow
- Confirm no open P0/P1 issues.

## T-2h

- Announce release window in engineering and support channels.
- Create deployment checkpoint (tag/commit id).
- Prepare rollback command set and responsible approver.
- Verify health probes:
  - `/health/ready`
  - `/health/component/storage`

## During Release

- Deploy API, admin, storefront in defined order.
- Apply pending migrations.
- Run post-deploy checks:
  - domain activation + SSL sync
  - webhook test event + delivery log
  - checkout + payment receipt upload + approval
  - storefront policies pages (`/policies/*`)

## Exit Criteria

- Error rate stable and below agreed threshold.
- No critical alerts firing for 30+ minutes.
- Synthetic smoke checks green.
- Release report posted with version + timestamp + known issues (if any).
