# Sprint 8 Endpoint Examples

Assumptions:

- API base URL: `http://localhost:3000`
- Merchant access token in `ADMIN_TOKEN`
- Tenant id in `STORE_ID`
- One variant id in `VARIANT_ID`
- One order id in `ORDER_ID`

## 1) Checkout Creates Inventory Reservations

```bash
curl -X POST "http://localhost:3000/sf/checkout" \
  -H "Content-Type: application/json" \
  -H "Host: demo.localhost" \
  -d '{
    "cartId": "<cartId>",
    "customerName": "Ahmad Saleh",
    "customerPhone": "+966500000000",
    "customerEmail": "ahmad@example.com",
    "addressLine": "Main Street 1",
    "city": "Riyadh",
    "area": "North",
    "paymentMethod": "cod"
  }'
```

## 2) Confirm Order (Consumes Reservation + Sale Movement)

```bash
curl -X PATCH "http://localhost:3000/orders/${ORDER_ID}/status" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```

## 3) Cancel New Order (Releases Reservation)

```bash
curl -X PATCH "http://localhost:3000/orders/${ORDER_ID}/status" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled",
    "note": "Customer requested cancellation"
  }'
```

## 4) Manual Inventory Adjustment

```bash
curl -X POST "http://localhost:3000/inventory/variants/${VARIANT_ID}/adjustments" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "quantityDelta": 15,
    "note": "Warehouse restock"
  }'
```

Use negative `quantityDelta` for stock deduction adjustments.

## 5) Update Low-Stock Threshold

```bash
curl -X PUT "http://localhost:3000/inventory/variants/${VARIANT_ID}/threshold" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{"lowStockThreshold": 8}'
```

## 6) List Inventory Reservations

```bash
curl "http://localhost:3000/inventory/reservations?status=reserved&page=1&limit=20" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 7) List Inventory Movements

```bash
curl "http://localhost:3000/inventory/movements?movementType=sale&page=1&limit=20" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 8) List Low-Stock Alerts

```bash
curl "http://localhost:3000/inventory/alerts/low-stock" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}"
```

## 9) Error Example: Confirm Without Active Reservation

Expected response (`422`):

```json
{
  "statusCode": 422,
  "message": "Reservation missing or expired for SKU TS-RED-M"
}
```
