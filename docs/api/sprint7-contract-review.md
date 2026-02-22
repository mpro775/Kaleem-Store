# Sprint 7 API Contract Review

This review covers attributes management and storefront attribute filters.

## Scope

- Attributes admin:
  - `GET /attributes`
  - `POST /attributes`
  - `GET /attributes/:attributeId`
  - `PUT /attributes/:attributeId`
  - `DELETE /attributes/:attributeId`
  - `GET /attributes/:attributeId/values`
  - `POST /attributes/:attributeId/values`
  - `PUT /attributes/:attributeId/values/:valueId`
  - `DELETE /attributes/:attributeId/values/:valueId`
  - `GET /attributes/categories/:categoryId/attributes`
  - `PUT /attributes/categories/:categoryId/attributes`
- Products:
  - `POST /products/:productId/variants` supports `attributeValueIds`
  - `PUT /products/:productId/variants/:variantId/attributes`
- Storefront:
  - `GET /sf/filters`
  - `GET /sf/products` supports `attrs[...]` filters

## Contract Highlights

- Attribute and value slugs are tenant-scoped and normalized for consistent filtering.
- Category assignments determine which filters appear on `GET /sf/filters`.
- Variant attribute values are persisted in dedicated mappings and mirrored into variant payload.
- Storefront products endpoint accepts both query styles:
  - Bracket keys: `attrs[color]=red`
  - Nested/array values under `attrs`
- Filtering semantics:
  - Multiple values for the same attribute are OR.
  - Multiple attributes in one request are AND.

## Data Model Additions

- `category_attributes`
- `variant_attribute_values`
- supporting indexes for `(store_id, category_id, attribute_id)` and `(store_id, variant_id, attribute_value_id)`

## Security and Tenancy

- Admin attribute endpoints are protected by:
  - Access token guard
  - Tenant guard
  - Permissions guard
- New permissions:
  - `attributes:read`
  - `attributes:write`
- Storefront filters and products remain public and resolve store by host/custom domain.

## OpenAPI

- Regenerate with:
  - `npm run openapi:generate`
- Output file:
  - `docs/api/openapi.json`
