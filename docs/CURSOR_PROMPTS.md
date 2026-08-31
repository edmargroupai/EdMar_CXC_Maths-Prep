# EdMar — Cursor Prompt Pack (Revision 2)

Four things in this file:

1. **Session Zero** — the prompt to paste first. It does *not* write code.
2. **`.cursor/rules/edmar.mdc`** — persistent project rules, so every session inherits the invariants instead of you re-pasting them.
3. **Per-phase template** — the prompt shape for every phase after Session Zero.
4. **The first three phases, filled in.**

Use them in that order.

---

## 1 · SESSION ZERO — paste this first

> **Do not write any application code in this session.** Your only output is an audit document and a plan. If you find yourself editing a file under `apps/` or `packages/`, stop.
>
> **Context.** This repository is a complete implementation of EdMar CXC Mathematics against **Revision 1** of its specification. Phases P01–P22 all have a pass. The specification has since been revised to **Revision 2**, and the product changed. Your job this session is to tell me, precisely and honestly, what the existing code means for the new plan.
>
> **Read these, in this order, in full:**
>
> 1. `docs/REVISION_02_CHANGELOG.md` — what changed and why
> 2. `docs/PROJECT_INSTRUCTIONS.md` — start with the ⚠ REVISION 2 notice at the top, before the historical phase notes
> 3. `docs/MASTER_BLUEPRINT.md` §0.5 (the change table), §1.1, §1.7, §2.2, §2.4, §G.11, §J.7, §J.9, §J.11, §J.12, §J.13, §P, §T
> 4. `docs/TECHNICAL_BUILD_SPEC.md` §0.4, §0.6 (especially D-16…D-22), §2, §3.5, §3.7, §3.20, §3.25–3.28, §11, §17, §18, §19, §20, §23, §32, §36 (AT-16…AT-23), §38, §39, §40, §41, §42
>
> **Three reversals to internalise, because the existing code and its comments still encode the old rules and will mislead you:**
>
> | Rev 1 said | Rev 2 says |
> | --- | --- |
> | "Never display a predicted CSEC grade" | Display a **band + confidence**, behind an evidence gate, with a disclosure and a back-test (spec §42). The *unqualified single grade* is still forbidden. |
> | React Native / Android first | **`apps/web` (Next.js App Router, PWA) is the MVP client.** `apps/mobile` is paused at V2 — do not delete it, do not extend it. |
> | Diagnostic and exam mode are V1 | Both are **MVP**, and readiness + projection are new MVP capabilities. |
>
> **Produce `docs/rev2/GAP_AUDIT.md` containing, and nothing else:**
>
> **A. Inventory with a verdict per unit.** Every workspace under `apps/` and `packages/`, and every migration under `supabase/migrations/`, classified as: `REUSE_AS_IS` · `EXTEND` · `PAUSE` · `NEW`. One sentence of justification each, citing the spec section that decides it. Do not guess — read the code.
>
> **B. Schema delta.** Exactly which columns, tables, enums, constraints, triggers and functions Rev 2 adds, against what migrations 0001–0006 actually created. Name the migration files you propose (`0007_…` onward) and the order they must apply in. Flag anything in Rev 2 that **conflicts** with an existing object rather than adding to it — I expect very few, and I want to know about every one.
>
> **C. Content debt, quantified.** Query the schema (not the docs) for how many published `question_versions` exist and how many of Rev 2's newly-required fields each is missing. Report it as: rows affected × fields missing = authoring units. This is the number that decides the launch date, so do not estimate it — count it.
>
> **D. Contradictions you found.** Any place where existing code, a comment, a test, a CI script, or a doc still asserts a Rev 1 rule that Rev 2 reversed. Give file and line. I expect hits in `scripts/check-no-ai-in-*.sh`, anything mentioning predicted grades, and anything assuming `apps/mobile` is the student client.
>
> **E. Proposed phase order**, with your reasoning, cross-checked against spec §32.1. State explicitly whether you agree with P17c depending on both P17a and P17b, and why.
>
> **F. The questions you cannot answer from the documents.** Number them. Be specific — "which processor?" is useless, "spec U-07 leaves the processor open and P18's webhook handler cannot be written without it; may I scaffold against Stripe's API shape and isolate it behind an interface?" is useful.
>
> **Rules for this session:** cite spec sections by number for every claim. Where the code disagrees with the spec, the spec wins and you flag it — you do not silently reconcile. Where the spec is silent, it goes in section F; you do not invent. If any part of the audit would be a guess, say so in that sentence rather than writing a confident sentence.

---

## 2 · PERSISTENT RULES — save as `.cursor/rules/edmar.mdc`

Save this in the repo. Cursor loads it into every session automatically, which is far more reliable than remembering to re-paste constraints.

```markdown
---
description: EdMar CXC Mathematics — binding architecture rules (Revision 2)
alwaysApply: true
---

# EdMar — non-negotiable rules

Source of truth, in precedence order:
`docs/TECHNICAL_BUILD_SPEC.md` (v2.0) > `docs/MASTER_BLUEPRINT.md` (v2.0) > this file > the code.
If the spec and the code disagree, the spec wins — raise it, never silently reconcile.
If the spec is silent, ask one specific question. Never invent.

## Platform
- `apps/web` (Next.js App Router, PWA) is the MVP student client and the reference implementation.
- `apps/mobile` is PAUSED at V2. Do not extend it, do not delete it, do not port to it.
- `apps/admin` and `apps/pipeline` continue. `packages/*` are shared by all clients.

## The eight invariants
- I-1 No AI on the student path. No client bundle may import an AI SDK. CI-enforced.
- I-2 Nothing reaches a student unapproved — enforced in RLS, never in application logic.
- I-3 Answer checking is deterministic and local, from `@edmar/answer-core`, in the client.
- I-4 Published content is immutable. Corrections are new versions.
- I-5 Every AI-touched artefact carries provenance.
- I-6 All assessment output is deterministic and recomputable, computed in Postgres.
- I-7 No projection without evidence — withheld below the gate, always banded, always with confidence.
- I-8 Web is the reference implementation. Mobile conforms to it, not the reverse.

## Assessment — the rules most likely to be violated by well-meaning code
- NEVER compute readiness, mastery rollups or a grade band in TypeScript. Computation lives in
  Postgres functions (D-18). `packages/assessment-core` holds types, band labels, gate constants
  and user-facing strings ONLY — no arithmetic on assessment values. CI greps for this.
- NEVER let a client construct a band. `fn_get_grade_projection` returns `withheld` with a
  machine-readable reason, and the gate lives in the function, not the interface (D-20).
- NEVER issue a projection without both bounds, a confidence, a model_version and a
  disclosure_version. The `issued_has_band` constraint enforces it at the database too.
- NEVER show a band to a non-entitled student, or put one in a notification, email, or any
  marketing surface. CI band-vocabulary check covers marketing routes and templates.
- NEVER cache readiness, a projection, or entitlement. Network-only. A stale confident number is
  the one failure this product cannot afford.
- NEVER read the clock inside an assessment function. `p_as_of` is an explicit argument.
- NEVER let a simulation with `blueprint_ok = false` feed readiness.
- NEVER trust a client-supplied timer value. Simulation timing is server-anchored (D-22).

## Content
- Every published question carries all ten presentation blocks (spec §40). Publication is refused
  without them. Do NOT add default or empty values to make old questions publishable — the gate is
  the point.
- Response blocks 2–10 never reach a client before that student has answered or skipped. Three
  layers enforce it: the payload, `fn_reveal_response`, and the service worker. Do not weaken any
  of them for a loading-performance win.
- Never invent CXC curriculum, and never invent a mathematical answer.
- Never auto-publish AI-generated content. No confidence threshold, no exception.

## Other standing rules
- No secret in client code. No service-role key outside `apps/admin` server code.
- No hard-coded question data in a component. No premium logic outside
  `useEntitlement()` / `<PremiumGate>`.
- Never widen a tolerance or disable a test to make it pass.
- Use the spec's exact names for tables, columns, routes, functions, types and files.
- One phase per session. No unrelated changes in a phase's diff.

## Working agreement
1. Restate the phase objective, files to touch, and acceptance criteria BEFORE writing code.
2. Write the test first wherever the phase defines acceptance criteria.
3. `pnpm lint && pnpm typecheck && pnpm test` (+ `pnpm test:db`, + `pnpm check:invariants`).
4. Review the diff for: secrets, AI imports, service-role leakage, hard-coded content, premium
   logic outside the two permitted files, assessment arithmetic in TypeScript, cached readiness,
   response blocks reaching a client before an attempt exists.
5. Conventional Commit scoped to the phase.
6. Restate each acceptance criterion and how you verified it. If any is unmet, STOP and report.
```

---

## 3 · PER-PHASE TEMPLATE

Fill the four bracketed slots. Everything else stays fixed.

> **Phase [ID] — [name].** Implement this phase only. Nothing outside it.
>
> **Read first:** `docs/PROJECT_INSTRUCTIONS.md` (the Rev 2 notice), then spec **[sections]**, then the existing code this phase touches.
>
> **Objective:** [one sentence, copied from spec §32]
>
> **Acceptance criteria** — these are the spec's, verbatim; do not paraphrase or soften them:
> [paste the **Accept:** block from spec §32 for this phase]
>
> **Before you write code**, state back to me: the objective in your own words, the exact files you will create or modify, the acceptance criteria and how each will be verified, and anything ambiguous. Wait for my go-ahead.
>
> **Then:** write the tests first where the criteria allow it, implement, run `pnpm lint && pnpm typecheck && pnpm test` (plus `pnpm test:db` if this phase touches the database, plus `pnpm check:invariants`), fix until green — never by disabling a test or widening a tolerance — and review the full diff against the checklist in `.cursor/rules/edmar.mdc`.
>
> **Finish by** restating each acceptance criterion with the evidence that it passed. If any is unmet, stop and tell me rather than moving on.

---

## 4 · THE FIRST THREE PHASES

### P13-web — Authentication and onboarding on the web client

> **Phase P13 (web) — Authentication and profile.** Implement this phase only.
>
> **Read first:** `docs/PROJECT_INSTRUCTIONS.md` (Rev 2 notice), spec §2 (repo structure, `apps/web`), §17.1, §19, §20, §39.1, §39.4, §25. Then read `apps/mobile/app/(auth)/*` and `app/(onboarding)/*` — the Rev 1 implementation is a correct reference for *behaviour*, and you are re-implementing it on Next.js, not porting it.
>
> **Objective:** anonymous sessions, sign-up with the 13+ control, sign-in, Google, password reset, and anonymous→permanent migration, in `apps/web`.
>
> **Acceptance criteria:**
> - an anonymous visitor completes 3 questions and their attempts survive registration;
> - a `false` age answer prevents account creation;
> - **the session lives in an httpOnly cookie and no token appears in `localStorage` or `sessionStorage`** — asserted by a browser test, not by inspection.
>
> **Note the deliberate difference from Rev 1:** minimum age is 13, enforced at sign-up, with **no** parental-consent flow (spec U-05). If you find consent-flow code in `apps/mobile`, do not port it.
>
> [+ the fixed tail from the template above]

### P14 — Web shell

> **Phase P14 — Web shell.** Implement this phase only.
>
> **Read first:** spec §19 (routes), §39.2 (the responsive contract), §18.2 (rendering), §P of the blueprint (the reference interface), §20.5 (service worker). Then `packages/design`.
>
> **Objective:** the `(app)` shell with its persistent sidebar and session strip, design tokens, `MathSvg`, the block renderer, the four responsive layouts, and the empty/error/offline components.
>
> **Acceptance criteria:**
> - every route in spec §19 navigates;
> - the block renderer displays a golden question **pixel-identically to the admin preview**, compared by screenshot at three viewports;
> - dark mode works;
> - **CLS < 0.1 on a golden question at all four breakpoints.**
>
> **The CLS criterion is the one that will bite you.** Inline SVG must carry its intrinsic dimensions from the payload's `widthEx`/`heightEx`/`depthEx` before paint, and diagrams must carry explicit width and height. An unsized expression reflows the whole question when it lays out, and text that jumps as mathematics settles reads as unreliable — which is fatal for a product whose entire claim is accuracy.
>
> [+ the fixed tail]

### P15 — Practice flow with the ten-block response

> **Phase P15 — Question engine and practice flow, with the ten-block response.** Implement this phase only.
>
> **Read first:** spec §18 (all of it — the state machine changed), §40 (the ten-block model, especially §40.4 the reveal policy and §40.5 the component mapping), §10 (`@edmar/answer-core`, unchanged and reused), blueprint §C.9 and §P.4.
>
> **Objective:** the §18 state machine including the new `revealing` phase; all MVP input types; local validation; the result panel; the full ten-block response in both the tab layout and the accordion layout; quick-check attempts; per-question notes; the question navigator; common-error matching.
>
> **Acceptance criteria:**
> - a 10-question session completes;
> - verdicts are instant — under 50 ms, measured, with **no spinner between CHECK and the verdict**;
> - the matched common-error note appears on a wrong answer;
> - **blocks 2–10 are absent from every network response and from the DOM until an answer or an explicit skip** — assert this against the payload, not the rendered output;
> - all ten layout invariants in spec §18.3 hold at all four viewports.
>
> **The reveal criterion is the pedagogical premise of the product, not a UI detail.** The payload contains block 1 and the answer spec only; blocks 2–10 come from `fn_reveal_response` after an attempt exists. A student who can read the answer out of the network tab has been handed the one thing the product exists to withhold — and in this audience that is not a theoretical attacker.
>
> [+ the fixed tail]

---

## Using this pack

Run Session Zero first and **read its output before authorising any code**. The audit is where you find out whether Rev 2 is three weeks of work or eight, and the content-debt count in section C is the number that actually decides your launch date.

After that, one phase per Cursor session, in the spec §32 order. Resist starting with P17c — it is the interesting one, and building it before the diagnostic and simulation exist produces a readiness number that looks finished and cannot be defended.
