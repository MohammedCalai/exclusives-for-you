# API

Base path: `/api/v1`. Success responses use `{ data, meta? }`; errors use Nest's HTTP status with a normalized `{ statusCode, code, message, path, timestamp }` body.

## Public

- `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- `POST /auth/forgot-password`, `/auth/reset-password`, `/auth/verify-email`
- `GET /products`, `GET /products/:slug`
- `GET /brands`, `GET /categories`

## Customer (Bearer token)

- `GET/PATCH /users/me`
- `GET/POST/DELETE /favourites`
- `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:id`
- `POST /checkout/payment-intent`
- `GET /orders`, `GET /orders/:orderNumber`

## Admin

- `POST/PATCH /admin/products`
- `PATCH /admin/products/:id/stock`
- `GET /admin/orders`, `PATCH /admin/orders/:id/status`
- `GET /admin/users`

## Stripe

- `POST /payments/webhook` requires the raw request body and a valid Stripe signature. Event IDs are unique and processed transactionally.

List products accepts `q`, `brand`, `category`, `size`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, and `limit`.
