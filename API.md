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
- `GET/POST /offers` for customer offers; admin can review with `GET /admin/offers` and change status with `PATCH /admin/offers/:id/status`
- `POST /notifications/push-token` to register a device; admins send “Offers just for you” alerts with `POST /notifications/admin/send`
- `GET /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:id`
- `POST /checkout/payment-intent`
- `GET /orders`, `GET /orders/:orderNumber`

## Admin

- `GET/POST/PATCH /admin/products` (create accepts `brandName` and `categoryName` and can be followed by image and variant creation)
- `PATCH /admin/products/:id/stock`
- `GET /admin/orders`, `PATCH /admin/orders/:id/status`
- `GET /admin/users`

Admin login uses the normal `POST /auth/login` endpoint and requires the returned user role to be `ADMIN`. The seeded development admin is documented in `SETUP.md` and must be replaced before production.

## Stripe

- `POST /payments/webhook` requires the raw request body and a valid Stripe signature. Event IDs are unique and processed transactionally.

List products accepts `q`, `brand`, `category`, `size`, `minPrice`, `maxPrice`, `inStock`, `sort`, `page`, and `limit`.
