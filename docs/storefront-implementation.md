# Storefront MVP Implementation

## Host-Based Resolution

- Endpoint: `GET /public/store/resolve`
- Resolver source:
  1. `x-forwarded-host` (first value)
  2. `Host` header
- For localhost testing, pass `?store=<store-slug>`.

## Public Storefront Endpoints

- `GET /sf/store`
- `GET /sf/theme`
- `GET /sf/categories`
- `GET /sf/products`
- `GET /sf/products/:slug`
- `POST /sf/cart/items`
- `GET /sf/cart/:cartId`
- `PUT /sf/cart/:cartId/items/:variantId`
- `DELETE /sf/cart/:cartId/items/:variantId`
- `GET /sf/shipping-zones`
- `POST /sf/checkout`
- `GET /sf/orders/:orderCode/track?phone=...`

## Next.js Pages

- `/` Home with theme section registry rendering
- `/categories` category and search filters with pagination
- `/products/[slug]` product details and add-to-cart
- `/cart` cart management
- `/checkout` checkout form and shipping/payment selection
- `/track-order` order tracking
