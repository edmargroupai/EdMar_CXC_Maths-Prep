# Security incident runbook

## Severity 1 (active breach)
1. Rotate `SUPABASE_SERVICE_ROLE_KEY` and all AI provider keys.
2. Enable Vercel Attack Mode if web abuse detected.
3. Preserve `audit_log` and `subscription_events` — do not truncate.
4. Notify founder and document timeline.

## Severity 2 (suspected leak)
1. Run `pnpm check:invariants` and `scripts/check-no-secrets.mjs` on latest deploy artifact.
2. Review recent admin `service-client` access logs.
3. Force session refresh for staff accounts if JWT exposure suspected.
