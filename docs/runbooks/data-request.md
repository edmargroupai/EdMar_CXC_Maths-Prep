# Data subject request runbook

## Export
- Student: `GET /api/account/export` (authenticated) or `fn_get_account_export`.
- Support: verify identity, then run export RPC as service role for the student id.

## Deletion
- Student: Account → delete flow calls `fn_delete_own_account(true)` via `POST /api/account/delete`.
- Confirm `profiles.deleted_at` is set and session is cleared.

## Retention
- Billing records may be retained where law requires; anonymise profile PII where possible.
