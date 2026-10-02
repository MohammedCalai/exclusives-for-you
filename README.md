# Exclusives for You

Foundation for a premium UK fashion commerce application. This repository is standalone and contains an Expo mobile app, a NestJS API, shared contracts, and a PostgreSQL database managed by Prisma.

## Quick start

1. Install Node.js 20+, npm 10+, Docker, Expo Go, and a mobile simulator if desired.
2. Copy `.env.example` to `.env` and replace development secrets.
3. Run `docker compose up -d`.
4. Run `npm install`.
5. Run `npm run db:generate && npm run db:migrate && npm run db:seed`.
6. Run `npm run dev` for the API and `npm run mobile` in a second terminal.

See [SETUP.md](./SETUP.md) for platform notes and [ARCHITECTURE.md](./ARCHITECTURE.md) for system boundaries.

## Phase 1 status

Implemented foundations include strict TypeScript workspaces, schema and seed data, JWT authentication, product discovery, favourites, saved order history, server-priced basket, Buy Now and Make an Offer flows, checkout intent creation, idempotent Stripe webhooks, orders, inventory-safe checkout transactions, protected admin product/order/offer endpoints, admin publishing and notification studio screens, and a premium Expo UI with push notification registration.

Resend email delivery, Expo push delivery, object storage, production payment credentials, social login, and production deployment require environment configuration. Order emails are sent after an order is created when `RESEND_API_KEY`, `EMAIL_FROM`, and `ORDER_ALERT_EMAIL` are set. Development screens use the API and include a sample-data fallback only when the local API is unavailable.
