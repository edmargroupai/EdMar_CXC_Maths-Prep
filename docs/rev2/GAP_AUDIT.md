# Rev 2 gap audit — Session Zero

**Date:** 30 August 2026  
**Repo audited:** this workspace (`EdMar_CXC_Maths Prep`), plus the linked Supabase project `vrafxpxaeoxhpwtixggc`.  
**Documents read (in the order Session Zero required):** `REVISION_02_CHANGELOG.md`, `PROJECT_INSTRUCTIONS.md` (Rev 2 notice first), `MASTER_BLUEPRINT.md` §0.5, §1.1, §1.7, §2.2, §2.4, §G.11, §J.7, §J.9, §J.11, §J.12, §J.13, §P, §T, `TECHNICAL_BUILD_SPEC.md` §0.4, §0.6 (D-16…D-22), §2, §3.5, §3.7, §3.20, §3.25–3.28, §11, §17, §18, §19, §20, §23, §32, §36 AT-16…AT-23, §38, §39, §40, §41, §42.

**Where those files actually live.** Session Zero and spec §2 name them under `docs/`. In this repo they sit at the **repository root** (`MASTER_BLUEPRINT.md`, `TECHNICAL_BUILD_SPEC.md`, `PROJECT_INSTRUCTIONS.md`, `REVISION_02_CHANGELOG.md`, `CURSOR_PROMPTS.md`). This audit is the first file under `docs/`. That path mismatch is recorded in **D** and **F**; it is not silently “fixed” here.

**The premise of Session Zero does not hold in this tree.** The prompt says this repository is a complete Rev 1 implementation (P01–P22). After reading the tree, that is false. There is no `apps/`, no `packages/`, no `supabase/migrations/`, no `scripts/check-no-ai-in-*.sh`, and no published question bank. `PROJECT_INSTRUCTIONS.md` (historical notes from line 53) describes a Rev 1 monorepo that is **not present here**. I did not invent that missing tree. I did not classify files I have not read.

---

## A. Inventory with a verdict per unit

Verdicts used: `REUSE_AS_IS` · `EXTEND` · `PAUSE` · `NEW`.  
Rule: one sentence, spec citation, no guess about code that is not here.

### A.1 Units that exist in this repository

| Unit | Verdict | Justification |
| --- | --- | --- |
| `supabase/config.toml` | `EXTEND` | Local Supabase is initialised and linked to `vrafxpxaeoxhpwtixggc`, but spec §2 / P03 require migrations 0001+ and `supabase db reset` — none of that schema exists yet. |
| Root Next.js app (`src/app/*`, `package.json` name `edmar-cxc-maths-prep`) | `EXTEND` | A connection scaffold from the GitHub/Vercel/Supabase wiring session. Spec §2 and D-16 require the student client at **`apps/web`**, not the repo root; D-04 requires pnpm workspaces + Turborepo. This app must be absorbed into `apps/web` in P01/P13, not grown as the product. |
| `src/lib/supabase/{client,server,env}.ts` | `EXTEND` | Cookie-oriented `@supabase/ssr` clients are the right *shape* for spec §20 / P13 (httpOnly session), but they are not in `apps/web` and have no anonymous→permanent migration, age gate, or onboarding. |
| `.env.example` | `EXTEND` | Placeholder public Supabase keys only. Spec §26 is the authoritative env list (admin, pipeline, billing, server-only). |
| Spec markdown at repo root | `REUSE_AS_IS` | These *are* Rev 2 v2.0. They are the source of truth (spec > code). They should live under `docs/` per spec §2 — a path move, not a rewrite. See **F-01**. |
| `.cursor/rules/edmar.mdc` | `REUSE_AS_IS` | Written this session from `CURSOR_PROMPTS.md` §2. Binding rules; not application code. |

### A.2 Spec workspaces that are absent

None of the following directories exist. Verdicts are therefore “what the spec requires when they are created,” not a reading of code.

| Unit | Verdict | Justification |
| --- | --- | --- |
| `apps/web` | `NEW` | D-16, spec §2, §17, §19: MVP student client and reference implementation (I-8). |
| `apps/admin` | `NEW` | Spec §2, §21, P19. Not present. Do not put a service-role key in the student app. |
| `apps/pipeline` | `NEW` | Spec §2, §13, P20. Content factory only. |
| `apps/mobile` | `PAUSE` | D-16, I-8, blueprint §1.7: V2, not built in P01–P24. There is nothing to pause or delete. **Do not scaffold it** to satisfy the old “don’t delete mobile” rule. |
| `packages/types` | `NEW` | Spec §2, P02. |
| `packages/answer-core` | `NEW` | Spec §10, P08, I-3. Changelog §4 called this reusable; that assumes Rev 1 code. It is not in this tree. |
| `packages/assessment-core` | `NEW` | Spec §2, D-18, P17c. Types, band labels, gate constants, strings **only** — no arithmetic. |
| `packages/content-schema` | `NEW` | Spec §11, P10. Schema 2.0.0 includes the ten blocks (§11.5). |
| `packages/api-client` | `NEW` | Spec §2, D-15. |
| `packages/design` | `NEW` | Spec §2, P02/P14. |
| `packages/config` | `NEW` | Spec §2, P01. |
| `supabase/migrations/` | `NEW` | Directory does not exist. Linked DB has **0** public tables (queried — see **C**). All of 0001–0009 are new work. |
| `supabase/functions/*` | `NEW` | Spec §8. None present. |
| `supabase/seed/*` | `NEW` | Spec §2, P04. |
| `supabase/tests/*` | `NEW` | Spec §27.4, P07. |
| `scripts/check-no-ai-in-client.sh` (and the rest of §25.10) | `NEW` | Spec §25.10, P01. Expected Rev 1 hits are **absent**. |
| `content/`, `tests/`, `.github/workflows/` | `NEW` | Spec §2. |
| `pnpm-workspace.yaml`, `turbo.json` | `NEW` | D-04, P01. Current root is npm + a single Next app. |

---

## B. Schema delta

### B.1 What is actually on the linked project

Queried against the linked remote (`supabase db query --linked`):

```text
to_regclass('public.question_versions') = null
to_regclass('public.questions')         = null
public_table_count                      = 0
```

There are **no** migrations 0001–0006 to diff against. Rev 2 does not conflict with existing objects, because there are no existing objects. The “very few conflicts” Session Zero expected are **zero in the database**. The conflicts that do exist are **in the spec’s own migration numbering** (below).

### B.2 Rev 2 additions (from the spec, not from existing SQL)

These are what Rev 2 adds to the *specified* Rev 1 schema (TECHNICAL_BUILD_SPEC §3, changelog §3.2). They have not been applied anywhere in this project.

**New enum types (spec §3.0 — “eight new enum types”):** include at least `simulation_form`, `confidence_level`, `withheld_reason`, `projection_state`, `accuracy_rule`, `verification_status`, `profile_dimension`, `sitting_month` (exact value lists must be copied from §3.0 when P03 is written — I have not pasted the full value lists here to avoid inventing a subset).

**`question_versions` columns added in Rev 2 (§3.5, D-17):**  
`concepts_required`, `strategy_blocks`, `final_answer_blocks`, `why_this_works`, `exam_tip`, `quick_check`, `cognitive_level`, `method_class`, `accuracy_rule`, `verification`, `ambiguity_note`.  
Publication preconditions 8–11 on `fn_publish_question` (ten-block completeness, ≥2 `common_errors`, ≥1 `solution_steps`, `verification = verified`). No empty-string defaults to make old rows publishable (changelog §4; D-17).

**`solution_steps` (§3.7):** `result_blocks jsonb not null default '[]'`.

**`exam_sessions` (§3.20):** `form`, `blueprint_ok`, `marks_by_module`, `marks_by_profile`, `seconds_by_item`, `submitted_late_by`. Still **no** `predicted_grade` column (deliberate; §3.20 note, §3.24).

**New tables (§3.25–3.28):**

| Table | Role |
| --- | --- |
| `diagnostic_sessions` | Satellite on a `practice_sessions` row with `mode = 'diagnostic'`; `walk_log`, `coverage_map` |
| `readiness_snapshots` | Append-only (D-19); `index_value` nullable when withheld |
| `grade_projections` | Append-only; `issued_has_band` constraint; `disclosure_version` |
| `student_outcomes` | Back-test; strictest RLS |

**New / extended functions (spec §42, D-18, D-20):**  
`fn_compute_readiness`, `fn_get_readiness`, `fn_compute_grade_projection`, `fn_get_grade_projection` (gate **inside** the function), plus diagnostic/simulation functions named in §41 (`fn_create_simulation`, reveal: `fn_reveal_response`). Exact signatures must be taken from §41–§42 at implementation time — not invented here.

**Deliberately not created (§3.24, §0.4):** `students.predicted_csec_grade`, `exam_sessions.predicted_grade`, `readiness_current`, coach/XP/leaderboard tables.

### B.3 Proposed migration files and apply order

Until **F-02** is answered, the **spec §32 names** are:

| Order | File (as named in spec §32) | Phase | Contents |
| --- | --- | --- | --- |
| 1 | `0001_enums_and_helpers.sql` | P03 | §3.0 enums + `trg_set_updated_at` |
| 2 | `0002_curriculum.sql` | P04 | Taxonomy |
| 3 | `0003_content.sql` | P05 | Questions; include Rev 2 §3.5 / §3.7 columns in this file (there is no prior 0003 to alter) |
| 4 | `0004_student.sql` | P06 | Profiles, attempts, `exam_sessions` **with** Rev 2 §3.20 columns |
| 5 | `0005_rls.sql` | P07 | §5 — re-run catalogue query after later tables |
| 6 | `0006_functions.sql` | P09 | §6 core functions; `fn_publish_question` with ten-block preconditions |
| 7 | `0007_diagnostic.sql` | P17a | §3.25 + diagnostic RPCs |
| 8 | `0008_simulation.sql` | P17b | §3.20 extras if not already in 0004; `fn_create_simulation`; D-22 timing |
| 9 | `0009_readiness.sql` | P17c | §3.26–3.28 + §42 functions |

**Conflict (spec vs spec, not spec vs code):**  
`TECHNICAL_BUILD_SPEC.md` §32 P17a names `0007_diagnostic.sql`.  
`TECHNICAL_BUILD_SPEC.md` §33 file map names `0007_cron.sql` for §6.14 scheduled jobs.  
Those cannot both be `0007_`. I have **not** renamed either. See **F-02**. Cron still needs a home; I will not invent `0010_cron.sql` until you pick.

**P07 reminder (spec §32):** RLS “completes when the catalogue query proves no table was missed” — that query must be re-run after P17a–P17c add tables.

---

## C. Content debt, quantified

**Method:** query the live schema, not the documents.

```text
public.question_versions does not exist
published question_versions = 0
```

Rev 2 newly-required authored fields on a published version (spec §3.5, §G.11, D-17), used for the “fields missing” product:

| Field / related rows | Block |
| --- | --- |
| `concepts_required` (≥1) | 2 |
| `strategy_blocks` | 3 |
| `solution_steps` (≥1) + `result_blocks` | 4 |
| `final_answer_blocks` | 5 |
| `why_this_works` | 6 |
| `common_errors` (≥2) | 7 |
| `exam_tip` | 8 |
| `quick_check` | 9 |
| `cognitive_level` (+ block-10 companions) | 10 |

**Count:**

```text
rows affected × fields missing = authoring units
0 published versions × (not applicable) = 0 retrofit units
```

This is a count, not an estimate. It is **not** good news for launch. Gate 1 (blueprint §T.4) is **≥1,200 published ten-block questions**. There is no Rev 1 bank to retrofit. The launch-date number is **1,200 greenfield authoring units** (plus review), not “existing rows × six new blocks.” Changelog §4’s “largest catch-up is content” assumed a Rev 1 bank; that bank is not in this project or this database.

U-09 (throughput 30/reviewer-day against the ten-block standard) is still the measurement that decides whether Gate 1 is weeks or months. I have not measured it. I have not assumed 30/day.

---

## D. Contradictions (Rev 1 rule still asserted after Rev 2 reversed it)

I only list places I opened. I do not cite scripts that do not exist.

| Location | What it still says | Rev 2 |
| --- | --- | --- |
| `CURSOR_PROMPTS.md` lines 18–19 | “This repository is a complete implementation … Phases P01–P22 all have a pass.” | False for this tree. The audit premise is wrong; the *product* rules in the same file still stand. |
| `PROJECT_INSTRUCTIONS.md` lines 53–84 | “All 22 phases now have a pass — P22 is the last one”; describes `apps/mobile`, Maestro, EAS, admin routes as built. | Historical Rev 1 notes. The ⚠ notice (lines 12–49) is correct. The historical block will mislead any session that skips the notice. **The described code is not in this repo.** |
| `MASTER_BLUEPRINT.md` §2.2 I-1, lines 278–278 | Enforcement framed as “the **mobile** client holds no AI credentials” and “the **mobile** bundle imports no AI SDK.” | D-16 / spec §25.10: the check runs on **`apps/web`** (and its service worker and `api/` handlers). Mobile is V2. |
| `TECHNICAL_BUILD_SPEC.md` §9.11, line 2271 | “Overall readiness: … **Never labelled as a predicted grade** (blueprint R-09).” | Rev 2 still forbids an *unqualified* grade (§38.1 rule 16). Readiness is not a grade. This leftover wording can be read as “never show §J.12,” which is the reversed rule. Spec wins: readiness ≠ projection; projection is banded and gated (§42). |
| `TECHNICAL_BUILD_SPEC.md` §17.3 S-14, line 4178 | Path `app/(tabs)/progress/index.tsx`; “never a predicted grade”; **Error: cached render.** | §19 is the Next.js tree (`(app)/progress`). Caching a current-looking readiness is forbidden (D-11/§20.5, rule 16b). “Cached render” on progress contradicts “network-only.” |
| `TECHNICAL_BUILD_SPEC.md` §17.3 S-15, line 4182 | Papers as Expo `(tabs)/papers` and V1-only. | Simulation is **MVP** (blueprint §H, P17b). Past-paper *library* stays rights-gated. S-15 still encodes the Rev 1 conflation §H.1 reversed. |
| `TECHNICAL_BUILD_SPEC.md` §1.3, line 280 | Environments table still lists mobile EAS channels as if on the MVP path. | D-16: mobile not built in P01–P24. Two Vercel projects (`edmar-web`, `edmar-admin`) are the MVP deploy story. This repo currently has one Vercel project (`edmar-cxc-maths-prep`) pointing at the root app. |
| Spec §2 vs this repo | Docs under `docs/`; apps under `apps/`. | Docs at root; student app at root. Spec wins; raise, don’t silently reconcile. |

**Expected hits that are simply missing (no file/line):** `scripts/check-no-ai-in-*.sh`, any test that assumes `apps/mobile` is the student client, any CI band-vocabulary check. They must be **created** in P01 / later phases, targeting `apps/web`.

---

## E. Proposed phase order

Cross-checked against spec §32.1.

```
P01 → P02 → P03 → P04 → P05 → P06 → P07 ─┬─► P09
                              │           │
                              └─► P08 ────┘
P10 → P11 → P12
P07 + P08 → P13 (web) → P14 → P15 → P16 → P17 ─┬─► P17a ─┐
                                               ├─► P17b ─┼─► P17c → P18
P09 + P10 + P11 → P19 → P20 ────────────────────────────┘
all → P21 → P22
```

**I agree that P17c depends on both P17a and P17b.** Spec §32.1 is explicit: readiness without diagnostic coverage and without a conformant timed simulation is a dressed-up practice average; the projection’s `no_simulation` gate cannot be tested until simulations exist. Building P17c first produces a number that looks finished and is not defensible (I-7, §J.12 rule 3, AT-21). I will not start P17c next.

**This repo’s extra constraint:** P01 is not optional. There is no monorepo. Starting at “P13-web” as the prompt pack’s first filled phase would put auth on the accidental root app and skip the entire store, packages, and schema. Session Zero’s own “do not start with P17c” still applies; **do not start with P13 either** until P01–P12 (or a documented subset you approve) exist.

**P04 human task** (44 `needs_human_review` objectives) is on the critical path and has no software substitute (§32.1). It cannot start until the taxonomy seed exists.

**Do not create `apps/mobile` in any of these phases** (D-16).

---

## F. Questions I cannot answer from the documents

1. **Doc paths.** Spec §2 and Session Zero require `docs/MASTER_BLUEPRINT.md` etc. The files are at the repo root. May I move them under `docs/` in P01 (paths only, no edits), or must they stay put?

2. **`0007_` collision.** Spec §32 P17a = `0007_diagnostic.sql`. Spec §33 = `0007_cron.sql`. Which filename wins, and where do §6.14 cron jobs live?

3. **Rev 1 tree.** `PROJECT_INSTRUCTIONS.md` describes a finished P22 mobile/admin/pipeline monorepo. It is not in this workspace or in any `package.json` on this Desktop that I could find. Is that tree in another repo/machine we should import, or is this project a **greenfield Rev 2 build**? This single answer changes whether P08/P10 are `NEW` or `REUSE_AS_IS`.

4. **U-07 / P18.** Spec U-07 leaves the web processor open. P18’s webhook cannot be written without a provider. May later work scaffold against Stripe’s API shape behind an interface (`entitlement_source` is already source-agnostic, D-21 / §23.3), or do you want a named processor before P18 starts?

5. **U-08.** The initial readiness→band mapping must be reviewed and signed by a mathematics educator in Phase 0, and it gates P17c. Who is the signer, and where should the signed parameter set live (`app_config` key name is not given)?

6. **Projection withdrawal owner.** Blueprint §J.12 rule 7 / changelog §5 item 1: named owner before launch. Who is it? I will not invent a name.

7. **Vercel project shape.** Spec §1.3 wants two projects (`edmar-web`, `edmar-admin`). This repo is already linked to one project, `edmar-cxc-maths-prep`, with the student scaffold at the root. When P01 creates `apps/web`, should that existing project set `rootDirectory` to `apps/web`, or should we create the two named projects?

8. **P11 accept criterion** includes “a rendered SVG displays correctly in `react-native-svg` on a device.” Mobile is paused (D-16). For this repo, is a web SVG assertion enough for P11, or is that criterion deferred to V2?

9. **Taxonomy seed.** P04 accepts “3 modules, 15 topics, 159 objectives” from `content/taxonomy/csec_2027_taxonomy_seed.json`. That file is not in the repo. Is there an extracted seed elsewhere, or does P04 include running `scripts/extract-syllabus.py` against a PDF we do not yet have?

---

## Session Zero close

No file under `apps/` or `packages/` was created or edited (those directories do not exist).  
Application code was not written.  
Persistent rules were saved to `.cursor/rules/edmar.mdc` as required by `CURSOR_PROMPTS.md` §2.

**Do not authorise P13–P17c until you have read this audit.** The prompt pack is explicit: the audit is where you find out whether Rev 2 is three weeks or eight. For *this* repository the honest reading is: **the software is a greenfield monorepo (P01 onward), and Gate 1 is 1,200 new ten-block questions, not a retrofit.**
