# VPS Deployment & Launch Plan (Temporary Production)

This runbook documents a practical, temporary production deployment for Kaleem Store backend on a single VPS.

## Scope

- Deploy on **Ubuntu 22.04 VPS** using Docker Compose
- Services included:
  - API (`@kaleem/api`)
  - Workers (`outbox`, `notifications`)
  - PostgreSQL
  - Redis
  - RabbitMQ (with management UI)
  - Nginx Proxy Manager (SSL + proxy management)
- Object storage via **Cloudflare R2** (not MinIO)

## Domains

- API: `api-temp.kaleemstores.com`
- RabbitMQ UI (temporary): `mq-temp.kaleemstores.com`
- Nginx Proxy Manager UI (temporary): `npm-temp.kaleemstores.com`

DNS records required:

- `A api-temp -> VPS_PUBLIC_IP`
- `A mq-temp -> VPS_PUBLIC_IP`
- `A npm-temp -> VPS_PUBLIC_IP`

## High-Level Architecture

- Public traffic enters through Nginx Proxy Manager (ports `80/443`)
- NPM forwards:
  - `api-temp.kaleemstores.com` -> `api:3000`
  - `mq-temp.kaleemstores.com` -> `rabbitmq:15672`
- API + workers connect internally to:
  - `postgres:5432`
  - `redis:6379`
  - `rabbitmq:5672`
- API stores media in Cloudflare R2 through S3-compatible endpoint

## Prerequisites

- Ubuntu 22.04 VPS
- SSH access with sudo
- Git access to this repository
- DNS records pointing to VPS IP
- Cloudflare R2 bucket and API credentials

## 1) Server Preparation

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu jammy stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Re-login SSH after group update.

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 81
sudo ufw --force enable
```

## 2) Pull Source Code

```bash
git clone <REPO_URL> /opt/kaleem-store
cd /opt/kaleem-store
```

## 3) Required Deployment Files

Create these files in repository root:

- `Dockerfile.api`
- `docker-compose.prod.yml`
- `.env.prod` (never commit secrets)

Quick bootstrap:

```bash
cp .env.prod.example .env.prod
# then edit .env.prod with real production values
```

### `Dockerfile.api` (recommended structure)

- Multi-stage build (`builder` + `runner`)
- Build shared package + API TypeScript output
- Use same image for API and workers with different runtime commands

### `docker-compose.prod.yml` (recommended services)

- `postgres`
- `redis`
- `rabbitmq`
- `api`
- `worker-outbox`
- `worker-notifications`
- `nginx-proxy-manager`

Important guidelines:

- Do **not** expose DB/Redis/RabbitMQ AMQP ports publicly
- Expose only NPM ports: `80`, `443`, `81`
- Mount persistent volumes for DB, Redis, RabbitMQ, and NPM

## 4) Production Environment Variables

Create `.env.prod` in project root.

Minimum required values:

```env
NODE_ENV=production
PORT=3000

POSTGRES_USER=kaleem
POSTGRES_PASSWORD=<STRONG_DB_PASSWORD>
POSTGRES_DB=kaleem_store

DATABASE_URL=postgres://kaleem:<STRONG_DB_PASSWORD>@postgres:5432/kaleem_store
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://<RABBIT_USER>:<RABBIT_PASS>@rabbitmq:5672

RABBITMQ_DEFAULT_USER=<RABBIT_USER>
RABBITMQ_DEFAULT_PASS=<RABBIT_PASS>

JWT_ACCESS_SECRET=<LONG_RANDOM_SECRET>
PLATFORM_ADMIN_SECRET=<LONG_RANDOM_SECRET>
WEBHOOK_SECRET=<LONG_RANDOM_SECRET>

ALLOWED_ORIGINS=https://kaleemstores.com,https://www.kaleemstores.com

S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<R2_BUCKET>
S3_ACCESS_KEY=<R2_ACCESS_KEY_ID>
S3_SECRET_KEY=<R2_SECRET_ACCESS_KEY>
S3_FORCE_PATH_STYLE=false
S3_PUBLIC_BASE_URL=<R2_PUBLIC_OR_CDN_URL>
```

Notes:

- Keep all secrets outside git history.
- Rotate secrets after initial deployment if shared insecurely.

## 5) Launch Services

From `/opt/kaleem-store`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --workdir /app api node scripts/migrate.mjs up
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Optional seed (only if needed):

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod run --rm --workdir /app api node scripts/seed.mjs
```

## 6) Configure Nginx Proxy Manager

Open:

- `http://npm-temp.kaleemstores.com:81`

Initial NPM credentials:

- Email: `admin@example.com`
- Password: `changeme`

Immediately change admin email/password.

Create Proxy Hosts:

1. `api-temp.kaleemstores.com`
   - Forward Hostname: `api`
   - Forward Port: `3000`
   - Enable Websockets
   - Request SSL certificate (Let's Encrypt)
   - Enable Force SSL

2. `mq-temp.kaleemstores.com`
   - Forward Hostname: `rabbitmq`
   - Forward Port: `15672`
   - Request SSL certificate
   - Enable Force SSL

## 7) Verification Checklist

- API liveness: `https://api-temp.kaleemstores.com/health/live`
- API readiness: `https://api-temp.kaleemstores.com/health/ready`
- API docs: `https://api-temp.kaleemstores.com/docs`
- RabbitMQ UI loads: `https://mq-temp.kaleemstores.com`
- Workers running:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs worker-outbox --tail=100
docker compose -f docker-compose.prod.yml --env-file .env.prod logs worker-notifications --tail=100
```

- API logs healthy:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod logs api --tail=100
```

## 8) Post-Launch Hardening (Recommended after temporary go-live)

- Add access control for `mq-temp` and `npm-temp` (basic auth + IP allowlist)
- Restrict port `81` to office IP (or close after setup)
- Enable regular backups for PostgreSQL and RabbitMQ definitions
- Add monitoring/alerts for API health and queue backlog
- Use non-default RabbitMQ admin credentials

## 9) Rollback Plan

- If new deployment fails:
  1. Inspect logs (`api`, workers)
  2. Revert to previous git commit/tag
  3. Rebuild and restart compose
  4. Re-run migrations only when needed and validated

Restart commands:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod down
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

---

Owner note: this runbook is intentionally temporary-first. Before full production, migrate to stricter network policies, secrets management, and least-privilege access.
