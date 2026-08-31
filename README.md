# EdMar CXC Maths Prep

Examination-readiness system for CSEC Mathematics. Spec: `docs/TECHNICAL_BUILD_SPEC.md` (v2.0).

## Workspace

pnpm + Turborepo.

- `apps/web` — MVP student client (Next.js)
- `apps/admin` — not started (P19)
- `apps/pipeline` — not started (P20)
- `apps/mobile` — paused at V2; do not extend
- `packages/config` — shared eslint / tsconfig / prettier presets

## Local

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm check:invariants
cp .env.example .env.local
```

`apps/web` is the only runnable app in P01. Product phases start at P13 on that app.

## Docs

- `docs/PROJECT_INSTRUCTIONS.md`
- `docs/MASTER_BLUEPRINT.md`
- `docs/rev2/GAP_AUDIT.md`
