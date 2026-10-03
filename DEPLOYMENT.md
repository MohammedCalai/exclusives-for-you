# Production deployment

The production system has four independently scalable parts:

1. `apps/mobile` — the customer iOS application.
2. `apps/admin` — the private browser-based product studio.
3. `apps/api` — authentication, catalogue, inventory, orders, payments and image-upload authorization.
4. PostgreSQL plus an S3-compatible object-storage bucket and public image CDN/domain.

## Required services

- A managed PostgreSQL database with automated backups.
- A container or Node.js host for `apps/api`.
- Static hosting for `apps/admin`.
- An S3-compatible private-write/public-read image bucket. AWS S3, Cloudflare R2 and other compatible services can use the same adapter.
- A custom API domain with HTTPS, for example `api.example.com`.
- A private admin domain with HTTPS, for example `studio.example.com`.

Do not store image binaries in PostgreSQL. The API creates a five-minute upload URL, the browser uploads directly to object storage, and only the resulting public URL and storage key are saved with the product.

## API configuration

Set the variables documented in `.env.example`. In production, the important additions are:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=<long-random-secret>
JWT_REFRESH_SECRET=<different-long-random-secret>
CORS_ORIGINS=https://studio.example.com
STORAGE_BUCKET=<bucket>
STORAGE_REGION=<region-or-auto>
STORAGE_ENDPOINT=<s3-compatible-endpoint>
STORAGE_ACCESS_KEY_ID=<key>
STORAGE_SECRET_ACCESS_KEY=<secret>
STORAGE_PUBLIC_URL=https://images.example.com
```

The API image policy permits JPEG, PNG, WebP and AVIF files up to 10 MB. The admin portal permits eight images per product. Provider storage and transfer quotas determine the overall catalogue capacity; there is no application-wide product limit.

Allow browser `PUT` requests from the admin domain in the bucket's CORS policy. Only `GET` and `HEAD` need to be public through the image domain; listing and deletion should remain private.

The API exposes `GET /api/v1/health` for hosting health checks. The Docker image applies pending Prisma migrations before starting.

## Admin portal configuration

Build the admin site with the public API address:

```env
VITE_API_URL=https://api.example.com/api/v1
```

Only a valid `ADMIN` account can access product or upload endpoints. The access token is held in browser session storage and disappears when the browser session is closed.

## Create production accounts

Run the account command in the API hosting environment. Supply secrets using the host's environment-secret interface rather than putting them in shell history or source control.

Required values are `ACCOUNT_EMAIL`, `ACCOUNT_PASSWORD`, `ACCOUNT_ROLE`, `ACCOUNT_FIRST_NAME` and `ACCOUNT_LAST_NAME`, followed by:

```sh
npm run account:upsert
```

Create one `CUSTOMER` account for App Review and a different `ADMIN` account for the store owner. Passwords must be at least ten characters and include uppercase, lowercase and numeric characters.

## Mobile production build

Set these EAS production environment variables before the replacement TestFlight build:

```env
EXPO_PUBLIC_API_URL=https://api.example.com/api/v1
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_test_value
```

After the live customer account exists, update App Store Connect's Beta App Review credentials to match it. Never use the administrator account for App Review.
