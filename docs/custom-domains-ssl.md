# Custom Domains + SSL (Cloudflare Option A)

This runbook documents the production path for custom domains using Cloudflare as the SSL edge.

## Architecture

- Merchant domain stays on Cloudflare DNS.
- Merchant hostname (for example `shop.example.com`) points to the platform ingress host via CNAME.
- Cloudflare terminates HTTPS at the edge.
- API storefront resolution uses `Host` / `x-forwarded-host` and maps active domains from `store_domains`.

## Required API Environment

Set these in `apps/api/.env`:

- `DOMAIN_VERIFY_TXT_PREFIX` (default: `_kaleem-verify`)
- `DOMAIN_CNAME_TARGET` (example: `stores.your-platform.com`)
- `DOMAIN_SSL_MODE` (`full` or `full_strict`, default: `full_strict`)

## Merchant Flow (Admin)

1. Add domain: `POST /domains`
2. Create TXT record for ownership verification:
   - Host: `<DOMAIN_VERIFY_TXT_PREFIX>.<hostname>`
   - Value: `verificationToken` from API response
3. Verify domain: `POST /domains/:domainId/verify`
4. Create routing CNAME:
   - Host: `<hostname>`
   - Target: `routingTarget` from API response (`DOMAIN_CNAME_TARGET`)
5. Activate domain: `POST /domains/:domainId/activate`

On activation, status transitions to:

- `status: active`
- `sslStatus: issued`

## Cloudflare Settings

Recommended per-domain settings:

- Proxy status: Proxied (orange cloud)
- SSL/TLS encryption mode: Full (strict)
- Always Use HTTPS: On

## Operational Checks

- Domain records in DB:
  - `SELECT hostname, status, ssl_status, updated_at FROM store_domains ORDER BY updated_at DESC;`
- Public host resolution:
  - `GET /public/store/resolve` with `Host: <custom-domain>`
- Storefront route test:
  - `GET /sf/store` with `Host: <custom-domain>`

## Troubleshooting

- `verify` fails:
  - TXT record is missing, wrong host, or DNS propagation not complete.
- `store not found for current host`:
  - domain not activated, or request host does not match active hostname.
- SSL browser warnings after activation:
  - wait for DNS/certificate propagation in Cloudflare and re-test.
