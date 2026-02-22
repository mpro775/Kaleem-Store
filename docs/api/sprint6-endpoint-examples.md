# Sprint 6 Endpoint Examples

Assumptions:
- API base URL: `http://localhost:3000`
- Merchant token in `ADMIN_TOKEN`
- Store id in `STORE_ID`
- Platform secret in `PLATFORM_SECRET`

## 1) Merchant Subscription Snapshot

```bash
curl "http://localhost:3000/billing/subscription" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 2) Create Platform Plan

```bash
curl -X POST "http://localhost:3000/platform/plans" \
  -H "x-platform-admin-secret: ${PLATFORM_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "starter-plus",
    "name": "Starter Plus",
    "description": "Starter plan with larger limits",
    "isActive": true,
    "limits": [
      {"metricKey": "products.total", "metricLimit": 250, "resetPeriod": "lifetime"},
      {"metricKey": "orders.monthly", "metricLimit": 400, "resetPeriod": "monthly"},
      {"metricKey": "staff.total", "metricLimit": 2, "resetPeriod": "lifetime"}
    ]
  }'
```

## 3) Assign Plan to Store

```bash
curl -X POST "http://localhost:3000/platform/stores/${STORE_ID}/subscription" \
  -H "x-platform-admin-secret: ${PLATFORM_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "planCode": "starter-plus",
    "status": "active"
  }'
```

## 4) List Platform Stores

```bash
curl "http://localhost:3000/platform/stores?page=1&limit=20" \
  -H "x-platform-admin-secret: ${PLATFORM_SECRET}"
```

## 5) Suspend Store

```bash
curl -X PATCH "http://localhost:3000/platform/stores/${STORE_ID}/suspension" \
  -H "x-platform-admin-secret: ${PLATFORM_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{
    "isSuspended": true,
    "reason": "Policy review"
  }'
```

## 6) List Platform Domain Statuses

```bash
curl "http://localhost:3000/platform/domains" \
  -H "x-platform-admin-secret: ${PLATFORM_SECRET}"
```

## 7) Error Example: Missing Platform Secret

Expected response (`401`):

```json
{
  "statusCode": 401,
  "message": "Invalid platform admin secret"
}
```
