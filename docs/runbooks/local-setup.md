# Local Setup Runbook

## Prerequisites

- Node.js 20+
- Docker + Docker Compose

## Bootstrap

```bash
npm install
npm run dev:infra
npm run migrate:up
npm run seed:run
```

## API Development

```bash
npm run dev --workspace @kaleem/api
```

## Storefront Development (Phase 2)

```bash
npm run dev --workspace @kaleem/storefront
```

- Storefront URL: `http://localhost:3001`
- API URL (default): `http://localhost:3000`
- Public host resolution endpoint: `GET /public/store/resolve`
- For localhost tenant resolution during manual testing, use `?store=<store-slug>`.

## Custom Domains + SSL (Phase 4, Cloudflare)

- Domain flow endpoints:
  - `POST /domains`
  - `POST /domains/:domainId/verify`
  - `POST /domains/:domainId/activate`
- API env settings:
  - `DOMAIN_VERIFY_TXT_PREFIX=_kaleem-verify`
  - `DOMAIN_CNAME_TARGET=stores.example.com`
  - `DOMAIN_SSL_PROVIDER=manual|cloudflare`
  - `DOMAIN_SSL_MODE=full_strict`
  - `CLOUDFLARE_API_TOKEN=<token>` (required for cloudflare mode)
  - `CLOUDFLARE_ZONE_ID=<zone-id>` (required for cloudflare mode)
- Full production guide:
  - `docs/custom-domains-ssl.md`

## Worker Processes (Sprint 4)

Run each worker in a dedicated terminal:

```bash
npm run worker:outbox --workspace @kaleem/api
```

```bash
npm run worker:notifications --workspace @kaleem/api
```

## Contract Generation

```bash
npm run openapi:generate
```

## Build Verification Gate

From repository root:

```bash
npm ci
npm run typecheck
npm run build
npm run smoke:e2e
```

- Detailed runbook: `docs/runbooks/build-verification.md`

## Platform Admin Secret

- Set `PLATFORM_ADMIN_SECRET` in `apps/api/.env` for `/platform/*` APIs.
- Send header on platform calls:
  - `x-platform-admin-secret: <your-secret>`

## Health Checks

- Live: `http://localhost:3000/health/live`
- Ready: `http://localhost:3000/health/ready`
- RabbitMQ UI: `http://localhost:15672`
- MinIO API: `http://localhost:9000`
- MinIO Console: `http://localhost:9001`
- Queue health script: `npm run queue:health`

## Media and Storage (Phase 1)

- The API uses S3-compatible storage for media uploads (MinIO locally, R2/S3 in production).
- Local defaults in `apps/api/.env.example`:
  - `S3_ENDPOINT=http://localhost:9000`
  - `S3_BUCKET=kaleem-media`
  - `S3_ACCESS_KEY=minio`
  - `S3_SECRET_KEY=minio123`
  - `S3_FORCE_PATH_STYLE=true`
  - `S3_PUBLIC_BASE_URL=http://localhost:9000/kaleem-media`
- Upload flow:
  1. `POST /media/presign-upload`
  2. Upload directly to the returned presigned URL
  3. `POST /media/confirm`
  4. Attach returned media id to product via `POST /products/:productId/images`

## Optional Queue Threshold Check Env

- `RABBITMQ_MANAGEMENT_URL=http://localhost:15672`
- `RABBITMQ_MANAGEMENT_USER=guest`
- `RABBITMQ_MANAGEMENT_PASSWORD=guest`
- `NOTIFICATIONS_MAIN_QUEUE_MAX_MESSAGES=200`
- `NOTIFICATIONS_DLQ_QUEUE_MAX_MESSAGES=0`

## Inventory Reservations (Phase 6)

- Checkout creates short-lived stock reservations before order confirmation.
- Default reservation TTL env:
  - `INVENTORY_RESERVATION_TTL_MINUTES=15`
