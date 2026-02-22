# Sprint 4 Endpoint Examples

Assumptions:
- API base URL: `http://localhost:3000`
- Merchant access token is available in `ADMIN_TOKEN`
- Tenant id is available in `STORE_ID`
- Public storefront requests include host header for store resolution

## 1) Create Shipping Zone

```bash
curl -X POST "http://localhost:3000/shipping-zones" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Riyadh Express",
    "city": "Riyadh",
    "area": "North",
    "fee": 25,
    "isActive": true
  }'
```

## 2) Create Coupon

```bash
curl -X POST "http://localhost:3000/promotions/coupons" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "discountType": "percent",
    "discountValue": 10,
    "minOrderAmount": 100,
    "maxUses": 500
  }'
```

## 3) Create Cart-Level Offer

```bash
curl -X POST "http://localhost:3000/promotions/offers" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cart 5 Off",
    "targetType": "cart",
    "discountType": "fixed",
    "discountValue": 5
  }'
```

## 4) Validate Coupon (Admin)

```bash
curl -X POST "http://localhost:3000/promotions/coupons/apply" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "WELCOME10",
    "subtotal": 220
  }'
```

## 5) Add Item to Storefront Cart (Public)

```bash
curl -X POST "http://localhost:3000/sf/cart/items" \
  -H "Host: demo.localhost" \
  -H "Content-Type: application/json" \
  -d '{
    "variantId": "1f8f1b35-0bd7-4d54-a7f3-6d3e7e4e6ac1",
    "quantity": 2
  }'
```

## 6) Checkout with Shipping Zone + Coupon (Public)

```bash
curl -X POST "http://localhost:3000/sf/checkout" \
  -H "Host: demo.localhost" \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "0b2cc32f-b97f-4d84-8b53-0a162f17c0fc",
    "customerName": "Ahmed Saleh",
    "customerPhone": "+966500000000",
    "customerEmail": "ahmed@example.com",
    "addressLine": "Olaya Street 22",
    "city": "Riyadh",
    "area": "North",
    "shippingZoneId": "9d2d2c4a-58e4-4de5-8961-6058c2af98d6",
    "couponCode": "WELCOME10",
    "paymentMethod": "cod",
    "note": "Call before delivery"
  }'
```

## 7) Track Order (Public)

```bash
curl "http://localhost:3000/sf/orders/KS-ABC123/track" \
  -H "Host: demo.localhost"
```

## 8) Inspect Notification Delivery Records

```sql
SELECT id, event_type, channel, status, attempts, created_at
FROM notification_deliveries
ORDER BY created_at DESC
LIMIT 20;
```

## 9) Error Example: Apply Missing Coupon

```bash
curl -X POST "http://localhost:3000/promotions/coupons/apply" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "NOPE99",
    "subtotal": 200
  }'
```

Expected response (`404`):

```json
{
  "statusCode": 404,
  "message": "Coupon not found"
}
```

## 10) Error Example: Checkout with Inactive Shipping Zone

```bash
curl -X POST "http://localhost:3000/sf/checkout" \
  -H "Host: demo.localhost" \
  -H "Content-Type: application/json" \
  -d '{
    "cartId": "0b2cc32f-b97f-4d84-8b53-0a162f17c0fc",
    "customerName": "Ahmed Saleh",
    "customerPhone": "+966500000000",
    "addressLine": "Olaya Street 22",
    "shippingZoneId": "9d2d2c4a-58e4-4de5-8961-6058c2af98d6",
    "paymentMethod": "cod"
  }'
```

Expected response (`400`):

```json
{
  "statusCode": 400,
  "message": "Shipping zone not found or inactive"
}
```

## 11) Error Example: Checkout with Empty Cart

```json
{
  "statusCode": 400,
  "message": "Cart is empty"
}
```
