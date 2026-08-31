# P22 · Production release checklist (§37)

## Pre-release
- [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm test:db && pnpm check:invariants`
- [ ] `pnpm validate:content` passes
- [ ] `cd apps/pipeline && pip install -e ".[dev]" && pytest` passes
- [ ] Migrations `0011`–`0013` applied to production Supabase (`supabase db push`)
- [ ] Environment variables set on Vercel (web + admin): Supabase URL/keys, Stripe webhook secret
- [ ] `projection_withdrawn` is `false` in production `app_config`
- [ ] Privacy (`/privacy`) and terms (`/terms`) deployed and linked from footer
- [ ] Account export (`/api/account/export`) and delete (`/api/account/delete`) tested on staging
- [ ] `(app)` routes return `noindex` (layout metadata + crawl verification)
- [ ] Production crawl returns **no question stems** on public URLs

## Deploy
- [ ] Vercel production deploy from `main`
- [ ] Admin app deployed separately (`apps/admin`, port 3001 / admin subdomain)
- [ ] Custom domain + TLS verified
- [ ] Staged rollout: 10% → 50% → 100% with error-rate watch

## Post-release
- [ ] Walk through `docs/runbooks/projection-withdrawal.md` once on staging
- [ ] Sentry (or equivalent) receiving errors from web
- [ ] Monitor `subscription_events` for webhook failures
- [ ] Tag `v1.0.0`

## Known environment limits (this repo)
- Workbook PDF extraction (P20 full accept) requires `EdMar_CXC_Mathematics_Workbook_2026.pdf` + rights verification (VERIFY-RIGHTS-01)
- Live Stripe checkout requires processor account (U-07)
- Core Web Vitals gates require production field data or Lighthouse CI against deployed URL
