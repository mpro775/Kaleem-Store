# Custom Domains + SSL (Operational)

This runbook documents the operational production path for custom domains with two modes:

- `manual` mode (default): DNS + edge SSL managed externally.
- `cloudflare` mode: API integrates with Cloudflare Custom Hostnames for SSL lifecycle.

## Architecture

- Merchant domain stays on Cloudflare DNS.
- Merchant hostname (for example `shop.example.com`) points to the platform ingress host via CNAME.
- Cloudflare terminates HTTPS at the edge.
- API storefront resolution uses `Host` / `x-forwarded-host` and maps active domains from `store_domains`.

## Required API Environment

Set these in `apps/api/.env`:

- `DOMAIN_VERIFY_TXT_PREFIX` (default: `_kaleem-verify`)
- `DOMAIN_CNAME_TARGET` (example: `stores.your-platform.com`)
- `DOMAIN_SSL_PROVIDER` (`manual` or `cloudflare`)
- `DOMAIN_SSL_MODE` (`full` or `full_strict`, default: `full_strict`)

Cloudflare mode requires:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ZONE_ID`
- `CLOUDFLARE_API_BASE_URL` (default: `https://api.cloudflare.com/client/v4`)
- `CLOUDFLARE_SSL_VALIDATION_METHOD` (`txt` or `http`)
- `CLOUDFLARE_MIN_TLS_VERSION` (`1.2` or `1.3`)

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
   - API validates routing CNAME (`hostname -> DOMAIN_CNAME_TARGET`) before activation.
   - In `cloudflare` mode, API creates/links a Cloudflare custom hostname and tracks SSL status.
6. Sync SSL state any time: `POST /domains/:domainId/sync-ssl`

On activation, status transitions to:

- `status: active`
- `sslStatus: requested|issued|error`

If `sslStatus` is `requested`, keep DNS/proxy settings in place and call `sync-ssl` until `issued`.

## Cloudflare Settings

Recommended per-domain settings:

- Proxy status: Proxied (orange cloud)
- SSL/TLS encryption mode: Full (strict)
- Always Use HTTPS: On

## Reverse Proxy / Ingress Requirement

Platform ingress must route custom hostnames to the storefront/API edge host configured in:

- `DOMAIN_CNAME_TARGET`

Without this routing, activation fails with CNAME validation error.

## Operational Checks

- Domain records in DB:
  - `SELECT hostname, status, ssl_status, ssl_provider, ssl_error, updated_at FROM store_domains ORDER BY updated_at DESC;`
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
  - wait for DNS/certificate propagation in Cloudflare and call `POST /domains/:domainId/sync-ssl`.
