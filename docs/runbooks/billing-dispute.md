# Billing dispute runbook (§23)

## Student claims incorrect charge
1. Locate `subscription_events` by `purchase_token` / Stripe event id.
2. Compare `entitlements.status` and `current_period_end` with processor dashboard.
3. If grace period applies (`invoice.payment_failed`), confirm access until `grace_until`.

## Resolution
- Refund: process in Stripe; webhook updates entitlement on `customer.subscription.deleted`.
- Goodwill extension: support updates `entitlements` with `source = manual` and `grant_reason`.

## Never
- Trust client-reported payment status without webhook verification.
