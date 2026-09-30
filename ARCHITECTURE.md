# Architecture

## Repository layout

- `apps/mobile`: Expo Router React Native application for iOS and Android.
- `apps/api`: NestJS REST API mounted at `/api/v1`.
- `apps/api/prisma`: PostgreSQL schema, migration, and development seed.
- `packages/contracts`: shared API-facing enums and data shapes.

## Runtime boundaries

The mobile app contains presentation and local session/basket coordination only. Prices, availability, discounts, totals, permissions, order transitions, and payment truth belong to the API. The API is the only process with database and Stripe secret access.

Authentication uses short-lived JWT access tokens and rotated, hashed refresh tokens. The data model leaves room for Apple and Google identities without weakening password login. Customer and admin permissions are enforced independently of navigation visibility.

Checkout re-reads prices and locks inventory rows inside a serializable database transaction. Stock is decremented only after every requested variant has been validated. Stripe webhook event IDs are uniquely persisted, making repeated events safe.

Product media is represented by provider/key/URL metadata. `StorageService` is an interface so local development, S3, or R2 adapters can be selected by environment later.

## Environments

Development, staging, and production use the same immutable application code with separate environment variables and isolated databases, Stripe accounts/webhook secrets, storage buckets, domains, and signing secrets. Nothing in this foundation deploys production infrastructure.
