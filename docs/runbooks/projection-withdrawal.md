# Projection withdrawal runbook (§42.6)

## When to use
- Educator or compliance review finds systematic bias in issued projections
- Legal or reputational risk requires immediate cessation of grade-band display

## Steps
1. Sign in to Supabase dashboard (or run SQL as superuser).
2. Set withdrawal flag:
   ```sql
   update public.app_config
   set value = 'true'::jsonb
   where key = 'projection_withdrawn';
   ```
3. Verify: call `fn_get_grade_projection` for a Premium test student — expect `withheld_reason = withdrawn`.
4. Notify support: projections are withheld; readiness index may still display where evidence allows.
5. Post-mortem: record model_version, date range affected, and corrective action in `audit_log`.

## Rollback
```sql
update public.app_config set value = 'false'::jsonb where key = 'projection_withdrawn';
```
Recompute projections only after educator sign-off on parameter set (U-08).
