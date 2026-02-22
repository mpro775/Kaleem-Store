# Sprint 7 Endpoint Examples

Assumptions:

- API base URL: `http://localhost:3000`
- Merchant access token in `ADMIN_TOKEN`
- Tenant id in `STORE_ID`
- One category id in `CATEGORY_ID`
- One product id in `PRODUCT_ID`
- One variant id in `VARIANT_ID`

## 1) Create Attribute

```bash
curl -X POST "http://localhost:3000/attributes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Color",
    "slug": "color"
  }'
```

## 2) Create Attribute Value

```bash
curl -X POST "http://localhost:3000/attributes/<attributeId>/values" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "value": "Red",
    "slug": "red"
  }'
```

## 3) Assign Attributes to Category

```bash
curl -X PUT "http://localhost:3000/attributes/categories/${CATEGORY_ID}/attributes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "attributeIds": ["<colorAttributeId>", "<sizeAttributeId>"]
  }'
```

## 4) Add Variant with Attribute Values

```bash
curl -X POST "http://localhost:3000/products/${PRODUCT_ID}/variants" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "TSHIRT-RED-L",
    "price": 79.9,
    "stock": 15,
    "attributeValueIds": ["<redValueId>", "<largeValueId>"]
  }'
```

## 5) Replace Variant Attribute Values

```bash
curl -X PUT "http://localhost:3000/products/${PRODUCT_ID}/variants/${VARIANT_ID}/attributes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "x-store-id: ${STORE_ID}" \
  -H "Content-Type: application/json" \
  -d '{
    "attributeValueIds": ["<blueValueId>", "<mediumValueId>"]
  }'
```

## 6) Read Storefront Filter Metadata

```bash
curl "http://localhost:3000/sf/filters?categorySlug=t-shirts" \
  -H "Host: demo.localhost"
```

## 7) Filter Storefront Products (Bracket Query)

```bash
curl "http://localhost:3000/sf/products?categorySlug=t-shirts&attrs[color]=red&attrs[size]=large" \
  -H "Host: demo.localhost"
```

## 8) Filter Storefront Products (Nested Query)

```bash
curl "http://localhost:3000/sf/products?categorySlug=t-shirts&attrs[color]=red&attrs[color]=blue" \
  -H "Host: demo.localhost"
```

## 9) Error Example: Invalid Attribute Slug

Expected response (`400`):

```json
{
  "statusCode": 400,
  "message": "Invalid attribute filter slug"
}
```
