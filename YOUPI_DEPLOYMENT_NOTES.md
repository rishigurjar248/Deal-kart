# DealKart + YouPI deployment notes

## Vercel server environment variables
Set these in Vercel Project Settings -> Environment Variables (Production and Preview as appropriate). Do not prefix these with `VITE_` and never commit real values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `YOUPI_API_URL` — public HTTPS origin for the YouPI Payment API (the service listening on port 6100), without a path suffix.
- `YOUPI_MERCHANT_ID` — the DealKart merchant UUID shown by YouPI, not the VPA.
- `YOUPI_MERCHANT_API_KEY` — the DealKart merchant API key.
- `YOUPI_WEBHOOK_SECRET` — the DealKart merchant webhook secret.
- `DEALKART_PUBLIC_URL` — the deployed DealKart origin, e.g. `https://dealkart-flax.vercel.app`.

The merchant API key is sent only from the Vercel serverless function to YouPI. It is never sent to the browser.

## Supabase SQL
Run the updated `YOUPI_SETUP.sql` in Supabase SQL Editor. It creates the payment tables if missing and updates the allowed order/event status constraints for the reconciliation lifecycle. Keep RLS enabled and do not add public policies for these tables.

## Webhook URL
Configure the YouPI merchant webhook destination as:

`https://YOUR-DEALKART-DOMAIN/api/youpi-webhook`

Use the exact webhook secret configured for the DealKart merchant. YouPI retries deliveries, so webhook delivery IDs are stored for idempotency.

## Payment status policy
- `SUCCESS` (`NOT_BANK_SETTLEMENT`) and `OBSERVED_SUCCESS` (`NOT_RECONCILED`) are recorded as `observed_success`, not paid.
- `MANUAL_REVIEW` remains unpaid and requires manual review.
- Only `RECONCILED` with `settlementState: RECONCILED`, matching order ID, payment ID and exact amount is allowed to mark the order paid.
- Failed/expired/cancelled events never overwrite an order already marked paid.

## Testing and operational warning
A Cloudflare Quick Tunnel URL is temporary and changes when restarted. Keep the YouPI payment API, observer/verification components required by your deployment, and tunnel running during tests. Do not expose YouPI admin, control, or observer-management ports publicly. A local PC plus Quick Tunnel is not reliable production hosting.

YouPI's own state machine distinguishes observed success from bank-statement reconciliation. Treat this integration as a test integration until you have completed end-to-end reconciliation tests and independently confirmed settlements against the bank statement. Do not fulfill an order based only on a browser return or `SUCCESS` webhook.
