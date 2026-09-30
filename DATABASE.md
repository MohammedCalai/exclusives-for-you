# Database

PostgreSQL is managed through Prisma. The schema covers users, external identities, verification/reset/refresh tokens, addresses, brands, categories, products, images, variants, inventory, favourites, carts, cart items, orders, order items, payments, and processed Stripe events.

Money is stored as integer pence. Order items snapshot names, SKUs, size, and price so historical receipts do not change when catalogue data changes. Addresses are copied into an order-specific JSON snapshot at checkout. Uniqueness and indexes protect common lookups and idempotency.

Commands:

- `npm run db:generate`: generate Prisma Client.
- `npm run db:migrate`: create/apply a development migration.
- `npm run db:seed`: load realistic sample products and an optional development admin.
- Production should use `prisma migrate deploy` in a controlled release job.
