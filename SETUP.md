# Setup

## Local development

Use Node.js 20 or newer. Copy `.env.example` to `.env`; create long random JWT secrets and keep the file uncommitted. Start PostgreSQL with `docker compose up -d`, then install packages and migrate/seed the database using the root scripts.

Run the API with `npm run dev`. The Swagger UI is at `http://localhost:4000/docs` in development. Run Expo with `npm run mobile`; press `i` for iOS Simulator, `a` for Android, or scan with Expo Go. A physical phone must use the computer's LAN address for `EXPO_PUBLIC_API_URL`.

## Stripe test mode

Create a separate Stripe test account/configuration for this project. Put only the publishable test key in the mobile environment. Put the test secret and webhook signing secret in the API environment. Forward test events to `/api/v1/payments/webhook`. Do not mark orders paid from a mobile redirect; only the verified webhook performs that transition.

## Admin studio, email and offers

The development seed creates `admin@exclusivesforyou.local` with password `ChangeMe_123!`; change it immediately outside development. Sign in from the mobile Admin Studio route to publish products, review orders, update offer statuses, and send “Offers just for you” alerts.

Set `RESEND_API_KEY`, `EMAIL_FROM`, and `ORDER_ALERT_EMAIL` to send an automatic order email to the customer and store inbox after checkout creates the Stripe payment intent. Push alerts use Expo’s push service after a customer grants notification permission and registers a device token.

## Environment separation

Create independent `.env.development`, `.env.staging`, and production secret-store values outside Git. Each environment needs its own PostgreSQL database, JWT secrets, Stripe webhook endpoint, storage bucket, and API URL.

## Current limitations

Storage has an abstraction but no cloud adapter. Apple/Google login and production push credentials remain optional. Stripe code is active when valid test credentials are supplied; otherwise checkout returns a configuration error. Production deployment, compliance review, analytics, and a web admin UI are Phase 2 work.
