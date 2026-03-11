# Sprint 5 Endpoint Examples

Assumptions:

- API base URL: `http://localhost:3000`
- Merchant access token in `ADMIN_TOKEN`
- Tenant id in `STORE_ID`

## 1) Get Theme Draft State

```bash
curl "http://localhost:3000/themes/draft" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 2) Update Theme Draft

```bash
curl -X PUT "http://localhost:3000/themes/draft" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "globals": {
        "primaryColor": "#1f4f46",
        "accentColor": "#c86f31"
      },
      "sections": [
        {"id": "header-main", "type": "header", "enabled": true, "settings": {}},
        {"id": "hero-main", "type": "hero", "enabled": true, "settings": {"headline": "New Season"}}
      ]
    }
  }'
```

## 3) Publish Theme Draft

```bash
curl -X POST "http://localhost:3000/themes/publish" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 4) Create Theme Preview Token

```bash
curl -X POST "http://localhost:3000/themes/preview-token" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{"expiresInMinutes": 30}'
```

## 5) Preview Theme on Storefront

```bash
curl "http://localhost:3000/sf/theme?previewToken=<token>" \
  -H "Host: demo.localhost"
```

## 6) Register Custom Domain

```bash
curl -X POST "http://localhost:3000/domains" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{"hostname": "shop.example.com"}'
```

Create CNAME record after registration:

- Host: `shop.example.com`
- Value: `<routingTarget-from-create-response>`

## 7) Verify Domain by DNS TXT

Create TXT record:

- Host: `_kaleem-verify.shop.example.com`
- Value: `<verificationToken-from-create-response>`

Then call:

```bash
curl -X POST "http://localhost:3000/domains/<domainId>/verify" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 8) Activate Domain (Operational SSL)

```bash
curl -X POST "http://localhost:3000/domains/<domainId>/activate" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

Expected status fields after activation:

- `status: "active"`
- `sslStatus: "requested" | "issued" | "error"`

## 9) Sync SSL State From Provider

```bash
curl -X POST "http://localhost:3000/domains/<domainId>/sync-ssl" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

Use this endpoint after activation to refresh SSL status when provider issuance is still pending.

## 10) Error Example: Activate Before Verify

Expected response (`400`):

```json
{
  "statusCode": 400,
  "message": "Domain must be verified before activation"
}
```
