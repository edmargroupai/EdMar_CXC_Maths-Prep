# EdMar CXC Mathematics — TECHNICAL BUILD SPECIFICATION

**Version:** 2.0 — *Revision 2: assessment-led, web-first*
**Date:** 30 August 2026 (Rev 1: 19 August 2026)
**Status:** Implementation-ready
**Upstream:** EdMar CXC Mathematics Master Blueprint **v2.0**
**Downstream:** Cursor + Claude, phase-by-phase implementation

> **REVISION 2 NOTICE — read before implementing anything.** Blueprint v2.0 changes what this product is and what it ships on. Four changes propagate through this specification, and an implementer must not work from Rev 1 memory:
>
> 1. **The first client is a Next.js web application (PWA)**, not React Native. `apps/web` is the MVP client; `apps/mobile` is V2 and is not built in the phases below. See D-16, §2, §17, §39.
> 2. **Every question carries ten presentation blocks** (blueprint §G.11), which changes the content schema, the payload, the pipeline, the editor and the question screen. See D-17, §11.5, §40.
> 3. **Diagnostic assessment, Paper 01 examination simulation, a readiness index and a banded grade projection are MVP capabilities**, with new tables, new functions and new determinism tests. See D-18 through D-20, §3.25–3.28, §41, §42.
> 4. **The predicted-grade prohibition in Rev 1 §0.4 conflict 1 is reversed** and replaced by a governed banded projection under the eight rules in blueprint §J.12. Reversed deliberately, with governance; see §0.4 and §42.
>
> Sections not named in the Rev 2 change list (`REVISION_02_CHANGELOG.md`) are unchanged from Rev 1 and remain authoritative.

> **This document contains no application code.** It contains schema DDL, JSON Schema, prompt templates, pseudocode and contracts — the artefacts an implementer needs. Application source is written in the implementation phases (§32).

---

## 0. SOURCE OF TRUTH, FINDINGS AND DECISIONS

### 0.1 What was inspected

Unlike the blueprint phase, the real project files were available for this specification. The following were read directly from `C:\Users\kemar\Projects\EdMar-AI\edmar_work\EdMar-AI-phase10\`:

| Path                                                         | Bytes     | What it is                                                                       |
| ------------------------------------------------------------ | --------- | -------------------------------------------------------------------------------- |
| `data/diagnostic_bank_phase3.json`                           | 7,318     | 17 MCQ items with options, answers, explanations, wrong-answer→misconception map |
| `data/question_tagger_sample_bank.json`                      | 1,063     | 1 record in the 19-field tagger schema                                           |
| `data/question_tagger_schema.json`                           | 750       | Field list + difficulty scale + diagnostic-use vocabulary                        |
| `data/bulk_tagger_sample_bank.json`                          | 477       | 2 untagged question stems                                                        |
| `data/bulk_tagger_schema.json`                               | 564       | Bulk tagger I/O contract                                                         |
| `data/csec_skill_map_phase3.json`                            | 3,592     | 17 skills, module-scoped, with prerequisites and teaching month                  |
| `data/skill_map.json`                                        | 1,010     | The three-module structure and topic lists                                       |
| `data/lesson_bank_phase4.json`                               | 5,441     | 2 lessons with worked examples, guided/independent practice, quizzes             |
| `data/reasoning_bank_phase7.json`                            | 2,741     | 5 proof/justify prompts with success criteria                                    |
| `data/mastery_rules.json`                                    | 480       | Four-band mastery thresholds                                                     |
| `data/subscription_plans_phase9.json`                        | 725       | 5 plans, US$25–220                                                               |
| `data/curriculum_manifest.json`                              | 7,304     | Country/grade/subject/resource manifest, Jamaica + USA                           |
| `data/admin_portal_sample_data.json`                         | 648       | Admin capability list                                                            |
| `database/supabase_schema.sql`                               | 5,523     | Prototype v0.5 schema, 20 tables                                                 |
| `database/phase10_authoring_exam_schema.sql`                 | 2,493     | Authoring + exam tables                                                          |
| `database/phase11_question_tagger_schema.sql`                | 1,144     | `question_tags` table                                                            |
| `backend/src/lib/questionClassifier.js`                      | 2,659     | Heuristic regex classifier                                                       |
| `data/curriculum/jamaica/CSEC_Mathematics_Syllabus_2027.pdf` | 8,034,637 | **The official CXC syllabus, CXC 05/G/SYLL 16**                                  |

### 0.2 Finding 1 — the "JSON knowledge base" is not what the blueprint assumed

**The blueprint's assumption A-02 is falsified.** There is no large JSON knowledge base of CSEC past-paper content with LaTeX worked solutions. What exists is **20 question-like records** across three files (17 diagnostic MCQs, 1 tagged record, 2 untagged stems), plus 2 lessons whose quizzes yield a further 8 items, and 5 reasoning prompts. Total question-bearing JSON is under 20 KB.

Three consequences, all of which change the build:

1. **There is no LaTeX anywhere in the existing data.** Mathematics is stored as plain Unicode strings: `"Evaluate 3/4 + 2/5."`, `"a² + b² = c²"`, `"[1 0; 0 -1]"`, `"n(A ∪ B)"`. The migration must therefore include a **Unicode-mathematics → LaTeX normalisation stage** (§12.5) that the blueprint did not anticipate. This is additional work and it is unavoidable.
2. **The content bank must be built almost from scratch.** The 1,200-question MVP gate in the blueprint (§T.4) is a build target, not a migration target. The real seed corpus is the PDF library in `data/curriculum/jamaica/` — in particular `CSEC_Mathematics_Past_Papers_By_Topic.pdf` (5.0 MB) and `EdMar_CXC_Mathematics_Workbook_2026.pdf` (13.6 MB). **The EdMar workbook is EdMar's own copyright and is therefore the safest high-volume source** — see §0.5.
3. **What the existing data _is_ good for is the taxonomy and the misconception model**, both of which are genuinely valuable and are preserved in full (§12).

### 0.3 Finding 2 — the official 2027 syllabus was extracted

`CSEC_Mathematics_Syllabus_2027.pdf` is the authentic CXC document (`CXC 05/G/SYLL 16`, ©2025 Caribbean Examinations Council, effective May–June 2027). Machine extraction produced a taxonomy seed containing:

- **3 modules**, **15 topics**, **159 Specific Objectives** with their official numbering
- The complete assessment grid
- The Paper 01 item allocation and Paper 02 mark allocation, per topic

This resolves blueprint item **[VERIFY-CXC-01]** and substantially advances **[VERIFY-CXC-02]**. The extract ships alongside this document as `content/taxonomy/csec_2027_taxonomy_seed.json`. **115 of 159 objective texts extracted cleanly; 44 are flagged `needs_human_review: true`** because two-column PDF extraction bled the CONTENT/EXPLANATORY NOTES column into the objective text. The objective **codes and numbering are reliable**; the **prose must be human-verified** before the seed is applied to production (§32 Phase 4).

**Official topic structure (V2027), verbatim from the syllabus:**

| Module                                             | #   | Topic                             | Paper 01 items | Paper 02 marks                            |
| -------------------------------------------------- | --- | --------------------------------- | -------------- | ----------------------------------------- |
| 1 — Fundamentals of Secondary Level Mathematics    | 1   | Number Theory and Computation     | 4              | 9 (with Consumer Arithmetic)              |
|                                                    | 2   | Consumer Arithmetic               | 4              | ↑                                         |
|                                                    | 3   | Sets                              | 3              | 12 (Graphs, Sets, Measurement, Algebra 1) |
|                                                    | 4   | Measurement                       | 4              | ↑                                         |
|                                                    | 5   | Algebra 1                         | 3              | ↑                                         |
|                                                    | 6   | Introduction to Graphs            | 2              | ↑                                         |
|                                                    |     | _Investigation_                   | —              | 9                                         |
|                                                    |     | **Module 1 total**                | **20**         | **30**                                    |
| 2 — Intermediate Secondary Level Mathematics       | 1   | Statistics 1                      | 4              | 6                                         |
|                                                    | 2   | Algebra 2                         | 4              | 12 (with RFG 1)                           |
|                                                    | 3   | Relations, Functions and Graphs 1 | 4              | ↑                                         |
|                                                    | 4   | Geometry and Trigonometry 1       | 4              | 9                                         |
|                                                    | 5   | Vectors and Matrices 1            | 4              | 3                                         |
|                                                    |     | **Module 2 total**                | **20**         | **30**                                    |
| 3 — Higher Concepts in Secondary Level Mathematics | 1   | Statistics 2                      | 4              | 6                                         |
|                                                    | 2   | Relations, Functions and Graphs 2 | 6              | 6                                         |
|                                                    | 3   | Geometry and Trigonometry 2       | 6              | 9                                         |
|                                                    | 4   | Vectors and Matrices 2            | 4              | 9                                         |
|                                                    |     | **Module 3 total**                | **20**         | **30**                                    |
|                                                    |     | **TOTAL**                         | **60**         | **90 raw**                                |

**Objective counts per topic** (drives content coverage planning, §29.6):

`M1`: NTC 19 · Consumer Arithmetic 10 · Sets 8 · Measurement 13 · Algebra 1 15 · Introduction to Graphs 3 → **68**
`M2`: Statistics 1 11 · Algebra 2 9 · RFG 1 20 · G&T 1 10 · V&M 1 5 → **55**
`M3`: Statistics 2 11 · RFG 2 6 · G&T 2 10 · V&M 2 9 → **36**
**Total: 159**

**Assessment grid (Grid A, regular sitting) — resolves [VERIFY-CXC-01]:**

| Paper            | Module 1 | Module 2 | Module 3 | Total weighted | %       |
| ---------------- | -------- | -------- | -------- | -------------- | ------- |
| Paper 01         | 30       | 30       | 30       | 90             | 30      |
| Paper 02         | 50       | 50       | 50       | 150            | 50      |
| Paper 031 or 032 | 20       | 20       | 20       | 60             | 20      |
| **Total**        | **100**  | **100**  | **100**  | **300**        | **100** |

**Grid B, per module, by profile dimension:**

| Paper         | CK         | AK          | R          | Total   |
| ------------- | ---------- | ----------- | ---------- | ------- |
| Paper 01      | 9 (6 raw)  | 12 (8 raw)  | 9 (6 raw)  | 30      |
| Paper 02      | 15 (9 raw) | 20 (12 raw) | 15 (9 raw) | 50      |
| Paper 031/032 | 6 (9 raw)  | 8 (12 raw)  | 6 (9 raw)  | 20      |
| **Total**     | **30**     | **40**      | **30**     | **100** |

> **Note a contradiction in the source.** The narrative section of the syllabus states "Paper 031 (30 per cent of Total Assessment)" while Assessment Grid A assigns Paper 031/032 **20%**. **The Assessment Grid is authoritative for this build** (it is the normative table and it sums to 100). Recorded as **[CXC-DISCREPANCY-01]**; do not display an SBA percentage to students until CXC clarifies.

**Paper timings and options:** Regular — Paper 01 1h30 (60 items), Paper 02 2h30 (9 questions). Modular, one module — Paper 01 30 min (20 items), Paper 02 50 min (3 questions). Modular, two modules — Paper 01 1h (40 items), Paper 02 1h40 (6 questions). Paper 032 — 1h, three optional questions one per module, candidate answers one, 20 marks.

### 0.4 Finding 3 — the prototype conflicts with the blueprint in four places

The existing `EdMar-AI-phase10` prototype is a **different product**: an AI teacher assistant with coaches, XP, coins, streaks, leaderboards and a teacher portal. It is not a subset of the product this specification builds. Four specific conflicts must be resolved by decision, not by merge:

| #   | Prototype                                                        | Blueprint / this spec                    | Resolution                                                                       |
| --- | ---------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `students.predicted_csec_grade`, `exam_sessions.predicted_grade` — an ungoverned point estimate on a mutable row | Blueprint **v2.0** §J.12 specifies a governed **banded** projection | **Rebuilt, not adopted** _(Rev 2 reversal)_. Rev 2 builds `grade_projections` (§3.27): an append-only series of **bands** with confidence, evidence counts, inputs and `model_version`. The prototype's columns are still not migrated — they encode precisely the design (point estimate, overwritten in place, no evidence trail, no version) that §J.12 rules 1, 2 and 4 prohibit |
| 2   | Subscription plans at US$25/mo, US$220/yr, teacher US$35         | US$4/mo, US$40/yr                        | **US$4 / US$40.** §23. Prototype plans are not migrated                          |
| 3   | `ai_coaches` table, coach personalities, runtime AI tutoring     | Blueprint B-6: no AI on the student path | **Not built.** No coach tables, no runtime AI                                    |
| 4   | XP, coins, streak_days, leaderboards                             | Blueprint D.7 refuses these              | **Not built** in MVP/V1. Weekly practice-days indicator only                     |

The prototype's _data_ is migrated (§12). The prototype's _schema_ is not — it is superseded entirely by §3.

### 0.5 Finding 4 — the content-rights position now has a concrete answer

Blueprint risk R-01 (CXC past-paper copyright) remains the top risk, but the file inventory changes the mitigation from theoretical to practical. `EdMar_CXC_Mathematics_Workbook_2026.pdf` (13.6 MB) is **EdMar's own publication**. Assuming EdMar holds its copyright — **[VERIFY-RIGHTS-01]**, confirm before Phase 5 — it is a lawful, high-volume, syllabus-aligned seed corpus that requires no licence.

**Therefore the content pipeline (§13) processes sources in this priority order:**

1. `EdMar_CXC_Mathematics_Workbook_2026.pdf` — EdMar copyright, no rights risk, **primary MVP source**
2. `EdMar_Additional_Mathematics_Workbook.pdf` — EdMar copyright, future subject
3. AI-generated variants of approved items (§15) — EdMar copyright by construction
4. `CSEC_Mathematics_Past_Papers_By_Topic.pdf` — **third-party copyright, gated on the R-01 legal decision. Ingest last, behind a feature flag, and never publish until rights are confirmed.**

Every question row carries `rights_status` (§3.4) and the admin console has a single-action withdrawal by rights status (§21.9).

### 0.6 Architectural decisions register

Decisions this specification makes that Cursor must not re-litigate. Each has a rationale; each is reversible only by an explicit decision record.

| ID       | Decision                                                                                                                                                                                                                                                                                            | Rationale                                                                                                                                                                                                                                                                    |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D-01** | **Mathematics is pre-rendered to SVG at publish time** by MathJax v3 in the pipeline; the client inlines the SVG and ships **no math engine**. _Rev 2: unchanged in substance, stronger on web_ | Deterministic, <16ms render, no runtime engine, no layout surprises. On web it additionally removes a maths engine from the question route and — decisively — eliminates the layout shift of that engine re-laying-out after paint, which is the CLS release gate in blueprint §P.11. The same asset serves the V2 mobile client via `react-native-svg` unchanged |
| **D-02** | LaTeX source is **retained alongside** every render, in a restricted allowlist                                                                                                                                                                                                                      | Required for accessibility labels, re-rendering at new sizes, duplicate detection, and future formats                                                                                                                                                                        |
| **D-03** | Rendered math is stored in a **content-addressed `math_renders` table** keyed by `sha256(latex + style)`                                                                                                                                                                                            | Identical expressions across thousands of questions share one render. Storage and pipeline cost collapse                                                                                                                                                                     |
| **D-04** | **Monorepo: pnpm workspaces + Turborepo**                                                                                                                                                                                                                                                           | Shared answer-validation code between mobile and server is the whole point; a polyrepo would fork it                                                                                                                                                                         |
| **D-05** | **Question selection is a Postgres `SECURITY DEFINER` function** called over Supabase RPC, not an API route. It must read `entitlements` and write `student_daily_usage`, so it cannot be invoker; it therefore performs its own ownership assertion (`caller = auth.uid()`) as its first statement | Single round trip, no server to scale, entitlement enforced where the data is. Read-only helpers such as `fn_resolve_scope` remain `STABLE`/invoker                                                                                                                          |
| **D-06** | **Answer validation runs identically on device and server** from one package, `@edmar/answer-core`, with cross-checked property tests                                                                                                                                                               | Divergence causes the worst bug class in this product: told right, recorded wrong                                                                                                                                                                                            |
| **D-07** | **Symbolic verification uses SymPy (Python) in the pipeline** and **mathjs (TypeScript) on the client**                                                                                                                                                                                             | SymPy is the strongest available CAS and the pipeline is Python-friendly; mathjs is small enough to ship and sufficient for Tier-2 equivalence                                                                                                                               |
| **D-08** | **Entitlement is enforced inside RLS**, via a `SECURITY DEFINER` helper                                                                                                                                                                                                                             | A client-side paywall is not a paywall                                                                                                                                                                                                                                       |
| **D-09** | **Free-tier daily counters are server-authoritative rows**, not device counters                                                                                                                                                                                                                     | Reinstall defeats a device counter                                                                                                                                                                                                                                           |
| **D-10** | **Next.js App Router** for **both** the student web app and the admin console. Expo Router returns for `apps/mobile` at V2 _(Rev 2 change)_ | One router, one rendering model, one deployment target for MVP. The student app is a separate Next.js application rather than routes inside admin: different auth surface, different bundle, different threat model (§25) |
| **D-11** | **TanStack Query** for server state, **Zustand** for ephemeral session state; on web the content cache is a **service worker + IndexedDB** and the session is Supabase's cookie-based auth. MMKV and `expo-secure-store` return for mobile at V2 _(Rev 2 change)_ | §20. The state *shape* is identical across clients; only the persistence adapter differs, which is what keeps the V2 mobile port a client project rather than a rebuild |
| **D-12** | **No GraphQL, no custom API gateway, no Redis, no separate queue service** in V1                                                                                                                                                                                                                    | Postgres + `pg_cron` + a jobs table is sufficient to 50,000 students and removes three failure domains                                                                                                                                                                       |
| **D-13** | **Attempts are append-only and immutable**; all progress is derived and recomputable                                                                                                                                                                                                                | Allows the mastery algorithm to be tuned after launch by recomputation                                                                                                                                                                                                       |
| **D-14** | **Content published to students is a single denormalised JSONB payload** assembled at publish time                                                                                                                                                                                                  | One indexed row read per question; no joins on the student path                                                                                                                                                                                                              |
| **D-15** | Database identifiers are `snake_case`, TypeScript is `camelCase`, conversion happens in **one** place (`packages/api-client`)                                                                                                                                                                       | Prevents the most common source of silent field mismatch                                                                                                                                                                                                                     |
| **D-16** | **Web first.** `apps/web` (Next.js App Router, PWA) is the MVP student client and the **reference implementation** (blueprint I-8). `apps/mobile` is V2 and is not built in phases P01–P24 | Blueprint §1.7. The analytical surfaces need width, simulation wants a keyboard, and a scoring correction must reach every student on the next page load rather than through a release train |
| **D-17** | **The ten presentation blocks are a schema, not a layout.** Every published question stores all ten; `fn_publish_question` refuses without them; one block set drives the web accordion, the desktop tab grouping, the admin preview and the pipeline prompts | Blueprint §G.11. Block 2 drives objective-level weakness, block 10's cognitive level drives the CK/AK/R breakdown, block 7's keys drive the misconception profile. The presentation model *is* the analytics model; retrofitting blocks later is a second content project |
| **D-18** | **Assessment computation lives in Postgres**, in versioned `SECURITY DEFINER` functions, and is **pure**: same attempt log → same output, with no clock-dependent behaviour except an explicit `p_as_of` argument | Blueprint I-6. Determinism is testable only with one home and no hidden inputs. It also keeps the readiness recompute in the same transaction as the attempt, so there is no worker to fall behind and no eventual-consistency window in which a student sees a stale reading |
| **D-19** | **Readiness and projection outputs are append-only snapshots** (`readiness_snapshots`, `grade_projections`) carrying inputs, evidence counts, confidence and `model_version` — never mutable columns on `profiles` | Makes the trend a first-class artefact, makes the §42.6 back-test possible at all, and makes a recalibration evaluable retrospectively against stored history. A mutable column destroys the evidence needed to defend the feature |
| **D-20** | **The projection evidence gate lives in the function, not the interface.** `fn_get_grade_projection` returns `withheld` with a machine-readable reason; no client can construct a band | Blueprint I-7. A gate implemented in a component is one refactor away from removal, and this is the one gate whose removal creates legal exposure (§V R-09) |
| **D-21** | **Web billing (Stripe or equivalent) at MVP**, behind the existing source-agnostic entitlement model; Google Play Billing added at V2 with no schema change | Blueprint §N.6. §23.3 already made entitlement source-agnostic, so this costs nothing structurally and removes store-merchant availability from the launch path |
| **D-22** | **Simulation timing is server-anchored and server-adjudicated.** `server_started_at` + `expires_at` are authoritative; a late submission is accepted and recorded with its true elapsed time rather than rejected | Simulation results carry the heaviest weight in readiness (blueprint §2.4). A client-trusted timer corrupts the product's most important evidence; rejecting late work discards evidence that is still valid, merely flagged |

### 0.7 Uncertainties requiring a human decision

Flagged rather than silently guessed, per the brief.

| ID       | Uncertainty                                                                                                           | Recommendation                                                                                                                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **U-01** | Does EdMar own copyright in `EdMar_CXC_Mathematics_Workbook_2026.pdf`?                                                | Confirm in writing before Phase 5. If yes, it is the MVP content spine                                                                                                                                                                                                                   |
| **U-02** | V2018 syllabus support — is it needed at all? The May–June 2026 sitting has passed; January 2027 candidates sit V2018 | **Recommend: build V2027 only for MVP**, keep `syllabus_version` on every taxonomy row so V2018 can be added without migration. The blueprint's dual-tree design is preserved structurally but only one tree is populated. This removes ~2 weeks of taxonomy work from the critical path |
| **U-03** | SBA percentage discrepancy (`[CXC-DISCREPANCY-01]`)                                                                   | Use Grid A (20%). Do not display until clarified                                                                                                                                                                                                                                         |
| **U-04** | Google Play merchant availability in Jamaica | **Downgraded in Rev 2** — no longer on the launch path (D-21). Verify before the V2 mobile release |
| **U-07** | **Which web payment processor** (Stripe or a regional alternative) for Jamaica, T&T, Barbados and Guyana | **Phase 0 decision, on card/wallet coverage and local settlement — not on fee schedule.** A US$4 price is fixed-fee sensitive, which is an argument for promoting the annual plan, not for a processor that cannot settle locally |
| **U-08** | **The initial readiness→grade-band mapping.** No back-test data exists at MVP | Construct conservatively from the published assessment structure; have it reviewed and signed by a qualified mathematics educator in Phase 0; ship with internal accuracy recorded as *unknown*; back-test at the first sitting (§42.6). The withdrawal criterion (blueprint §J.12 rule 7) needs a named owner before launch |
| **U-09** | **Whether 1,200 questions can be authored to the ten-block standard at 30/reviewer-day** | Measure in Phase 2 against the ten-block standard, not Rev 1's. If throughput falls short the response is more reviewer capacity or fewer launch topics — **not** a reduced block set (D-17) |
| **U-05** | Under-13 policy                                                                                                       | **Recommend: minimum age 13, enforced at sign-up**, no parental-consent flow in V1. It removes a large compliance surface. Students under 13 are not the CSEC cohort                                                                                                                     |
| **U-06** | Should EdMar's existing Additional Mathematics and CAPE assets be in scope?                                           | **No.** §32 builds CSEC Mathematics only. The taxonomy is subject-rooted so they cost nothing later                                                                                                                                                                                      |

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Component map

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ CONTENT FACTORY (offline, batch, AI-heavy) — apps/pipeline (Python + Node)   │
│                                                                              │
│  PDF/JSON sources ─► extract ─► segment ─► classify ─► map ─► draft          │
│                                                            │                 │
│                                    ┌───────────────────────▼──────────────┐  │
│                                    │ DETERMINISTIC VALIDATION (no AI)     │  │
│                                    │ jsonschema · MathJax render · SymPy  │  │
│                                    │ CAS answer check · units · dup hash  │  │
│                                    └───────────────────────┬──────────────┘  │
│                                                            ▼                 │
│                                              content_jobs / review queue     │
└────────────────────────────────────────────────────────────┬─────────────────┘
                                                             │ (service role)
┌────────────────────────────────────────────────────────────▼─────────────────┐
│ SUPABASE                                                                     │
│                                                                              │
│  PostgreSQL 15  ── 49 tables · RLS on every table · 29 functions             │
│  Auth           ── email+password, Google OAuth, JWT                        │
│  Storage        ── 3 buckets: question-assets (public), draft-assets         │
│                    (private), source-documents (private)                     │
│  Edge Functions ── 6 functions (§8)                                          │
│  pg_cron        ── 6 scheduled jobs (§6.14)                                  │
└──────┬──────────────────────────────────────────────┬────────────────────────┘
       │ anon key + RLS                               │ anon key + RLS + role
       ▼                                              ▼
┌──────────────────────────┐              ┌───────────────────────────────────┐
│ apps/web        ★ MVP ★  │              │ apps/admin                        │
│ Next.js 14 App Router    │              │ Next.js 14 App Router · Vercel    │
│ TypeScript · Vercel · PWA│              │ TypeScript · RSC + server actions │
│                          │              │                                   │
│ · reads published only   │              │ · review queue · editor (10 blocks)│
│ · writes attempts only   │              │ · curriculum · papers             │
│ · @edmar/answer-core     │              │ · cohort monitoring               │
│   validates in-browser   │              │ · projection calibration (§42.6)  │
│ · inline pre-rendered SVG│              │ · service role in server only     │
│ · service worker cache   │              │                                   │
│ · NO AI SDK (CI-enforced)│              │                                   │
└──────────────────────────┘              └───────────────────────────────────┘
             │
             ▼
┌──────────────────────────┐
│ apps/mobile        (V2)  │   not built in P01–P24.
│ React Native · Expo      │   Consumes the same packages:
│ Expo Router · MMKV       │   types · answer-core · assessment-core
│ react-native-svg maths   │   api-client · content-schema · design
│ Web is reference (I-8)   │
└──────────────────────────┘
```

**The assessment plane (new in Rev 2).** Diagnostic, simulation, readiness and projection are **not** client features with server storage; they are Postgres functions (D-18) that the clients call and render. `apps/web` contains no scoring logic of any kind beyond `@edmar/answer-core`'s per-item validation. This is what makes blueprint I-6 (determinism) testable and what makes the V2 mobile client a rendering exercise rather than a reimplementation.

### 1.2 Data flow — student answers a question

```
1. app     RPC  fn_create_practice_session(p_scope, p_count, p_difficulty_mode)
2. db           → resolves taxonomy scope, applies entitlement + cooldown + difficulty
                → inserts practice_sessions + practice_session_items
                → returns session_id + ordered question_version_ids
3. app     SELECT question_payloads WHERE question_version_id IN (...)   [1 query]
                → payload contains blocks 1 and the answer spec ONLY.
                  Blocks 2–10 are NOT in this payload (§40.4 reveal policy).
4. app          caches payloads (service worker + IndexedDB); renders from payload.stem_blocks
5. student      types answer
6. app          @edmar/answer-core.validate(input, payload.answer_spec)  [local, <10ms]
7. app     RPC  fn_reveal_response(question_version_id, attempt_ref)
                → returns blocks 2–10 for a question this student has now answered/skipped
8. app          renders the ten-block response pane (§40)
9. app     RPC  fn_record_attempt(...)  — queued locally, sent when online
10. db          re-validates server-side, inserts attempts (idempotent on client_attempt_id)
                → trigger updates student_skill_mastery incrementally
                → trigger enqueues readiness recomputation (same transaction, §42.3)
11. app    RPC  fn_complete_session(session_id) → returns mastery deltas + readiness delta
```

**No AI call occurs at any step.** No server-side compute beyond Postgres occurs at any step.

### 1.3 Environments

| Environment  | Supabase project     | Vercel (web + admin) | Mobile (V2)              | Data                                  |
| ------------ | -------------------- | -------------------- | ------------------------ | ------------------------------------- |
| `local`      | Supabase CLI, Docker | `next dev` × 2       | Expo Go / dev client     | Seed fixtures                         |
| `staging`    | `edmar-staging`      | Preview deployments  | EAS `preview` channel    | Synthetic students, real content copy |
| `production` | `edmar-prod`         | Production           | EAS `production` channel | Live                                  |

Two Vercel projects from one repository: `edmar-web` (students) and `edmar-admin`. They share no runtime, no cookies and no environment variables beyond the Supabase URL and anon key — the admin project is the only one holding a service-role key, and it holds it server-side only (§25).

Never copy production student data to staging (§25.11).

---

## 2. REPOSITORY STRUCTURE

Single repository, `edmar-cxc-maths`, pnpm workspaces + Turborepo.

```
edmar-cxc-maths/
├── apps/
│   ├── web/                       ★ MVP student client — Next.js 14 App Router
│   │   ├── app/                   routes (§19)
│   │   │   ├── (marketing)/       public: landing, pricing, about — indexed
│   │   │   ├── (auth)/            sign-in, sign-up, reset
│   │   │   ├── (onboarding)/      value, sitting, interests, first-question
│   │   │   ├── (app)/             authenticated shell — sidebar layout
│   │   │   │   ├── home/          readiness strip, continue, recommendation
│   │   │   │   ├── practice/      browse, setup
│   │   │   │   ├── session/[id]/  THE QUESTION SCREEN (§18) + results
│   │   │   │   ├── diagnostic/    intro, runner, results (§41.2)
│   │   │   │   ├── simulate/      library, runner, results, review (§41.3)
│   │   │   │   ├── progress/      readiness, projection, weak areas, history
│   │   │   │   ├── readiness/     explainer (§42.7)
│   │   │   │   ├── bookmarks/  notes/
│   │   │   │   └── account/       profile, subscription, settings, data
│   │   │   ├── api/               route handlers: billing webhooks ONLY (§23)
│   │   │   └── layout.tsx         root providers
│   │   ├── src/
│   │   │   ├── components/        UI components (§17.3, §40.5)
│   │   │   ├── features/          practice · diagnostic · simulation ·
│   │   │   │                      readiness · progress
│   │   │   ├── hooks/             TanStack Query hooks
│   │   │   ├── stores/            Zustand stores (§20.3)
│   │   │   ├── lib/               supabase client, idb cache, sync queue
│   │   │   └── theme/             design tokens consumed from @edmar/design
│   │   ├── public/                manifest.webmanifest, icons
│   │   ├── worker/                service worker: session cache + sync (§20.5)
│   │   ├── next.config.mjs
│   │   └── package.json
│   │
│   ├── mobile/                    React Native + Expo — **V2, not built in P01–P24**
│   │   └── (Expo Router structure retained from Rev 1 §2 for the V2 phase;
│   │        consumes the same packages and conforms to web behaviour, I-8)
│   │
│   ├── admin/                     Next.js 14 admin console
│   │   ├── app/
│   │   │   ├── (auth)/            sign-in, MFA
│   │   │   ├── (dash)/            dashboard, questions, review, curriculum,
│   │   │   │                      papers, users, analytics, audit, jobs
│   │   │   └── api/               route handlers (§7.6) — server-only secrets
│   │   ├── src/components/        tables, editor, preview, filters
│   │   ├── src/server/            service-role clients, server actions
│   │   └── package.json
│   │
│   └── pipeline/                  Content factory. NOT deployed with the apps
│       ├── src/
│       │   ├── stages/            01_extract … 15_publish (§13.2)
│       │   ├── prompts/           versioned prompt templates (§16)
│       │   ├── validators/        deterministic validators (§13.7)
│       │   ├── cas/               SymPy wrappers
│       │   ├── render/            MathJax → SVG (Node subprocess)
│       │   └── cli.py             `edmar-pipeline <stage> --job <id>`
│       ├── tests/
│       ├── pyproject.toml
│       └── package.json           (Node side: mathjax-full renderer)
│
├── packages/
│   ├── types/                     @edmar/types — shared TS types (§35)
│   │   └── src/{db.generated.ts, domain.ts, api.ts, index.ts}
│   ├── answer-core/               @edmar/answer-core — THE validation engine (§10)
│   │   └── src/{normalise,validators,parse,units,equivalence,index}.ts
│   ├── assessment-core/           @edmar/assessment-core — types, band labels,
│   │                              confidence vocabulary, evidence-gate constants
│   │                              and the ONE canonical copy of every user-facing
│   │                              readiness/projection string. NO computation:
│   │                              computation is in Postgres (D-18). This package
│   │                              exists so the gate's wording and the band labels
│   │                              cannot drift between web, admin and mobile
│   │   └── src/{bands,confidence,gates,strings,types}.ts
│   ├── content-schema/            @edmar/content-schema — canonical JSON Schema (§11)
│   │   ├── schemas/               *.schema.json
│   │   └── src/validate.ts        ajv-compiled validators
│   ├── api-client/                @edmar/api-client — typed Supabase wrapper,
│   │                              snake_case ↔ camelCase boundary (D-15)
│   ├── design/                    @edmar/design — tokens, shared primitives
│   └── config/                    @edmar/config — eslint, tsconfig, prettier presets
│
├── supabase/
│   ├── migrations/                NNNN_description.sql — the only way schema changes
│   ├── functions/                 Edge Functions, one directory each (§8)
│   │   ├── play-rtdn/
│   │   ├── verify-purchase/
│   │   ├── pipeline-dispatch/
│   │   ├── publish-question/
│   │   ├── report-question/
│   │   ├── account-export/
│   │   └── _shared/
│   ├── seed/                      seed data applied after migrations
│   │   ├── 01_syllabus_v2027.sql
│   │   ├── 02_topics.sql
│   │   ├── 03_specific_objectives.sql
│   │   ├── 04_skills.sql
│   │   └── 05_dev_fixtures.sql    local/staging only
│   ├── tests/                     pgTAP — schema, functions, and RLS (§27.4)
│   └── config.toml
│
├── content/
│   ├── taxonomy/
│   │   ├── csec_2027_taxonomy_seed.json    ← extracted, human-verified
│   │   └── skills.json                     ← controlled skill vocabulary
│   ├── legacy/                    snapshots of the EdMar-AI-phase10 JSON inputs
│   ├── sources/                   source PDFs (git-lfs; large binaries)
│   └── golden/                    50–100 hand-verified questions (§14.8)
│
├── scripts/
│   ├── import-legacy.ts           §12 importer
│   ├── extract-syllabus.py        §0.3 PDF → taxonomy seed
│   ├── validate-content.ts        run §13.7 validators over a directory
│   ├── render-math.ts             MathJax batch renderer
│   ├── gen-db-types.sh            supabase gen types → packages/types
│   ├── check-no-secrets.sh        CI secret scan (§25.9)
│   └── check-no-ai-in-client.sh   CI invariant I-1 (§25.10)
│
├── docs/
│   ├── MASTER_BLUEPRINT.md
│   ├── TECHNICAL_BUILD_SPEC.md    (this document)
│   ├── PROJECT_INSTRUCTIONS.md    what Cursor reads first (§31.2)
│   ├── decisions/                 ADR-0001.md … (D-01…D-15 and later)
│   └── runbooks/                  incident, content-defect, release
│
├── tests/
│   ├── e2e-mobile/                Maestro flows
│   ├── e2e-admin/                 Playwright
│   └── fixtures/                  shared test data
│
├── .github/workflows/             ci.yml, migrate.yml, release-mobile.yml
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .env.example                   (§26)
```

### 2.1 Directory purposes — the questions the brief asked

| Question            | Answer                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Student web code**| **`apps/web/` — the MVP client**                                                                                  |
| Mobile code         | `apps/mobile/` — **V2, not built in P01–P24**                                                                     |
| Assessment logic    | `supabase/migrations/` (the computation, D-18) + `packages/assessment-core/` (labels, gates, strings only)         |
| Admin code          | `apps/admin/`                                                                                                     |
| Shared types        | `packages/types/` (`@edmar/types`)                                                                                |
| Database migrations | `supabase/migrations/` — **the only place schema is changed**                                                     |
| Edge Functions      | `supabase/functions/<name>/`                                                                                      |
| Content schemas     | `packages/content-schema/schemas/` (JSON Schema)                                                                  |
| Import scripts      | `scripts/import-legacy.ts`, `apps/pipeline/src/stages/`                                                           |
| Validation scripts  | `packages/answer-core/` (answers), `apps/pipeline/src/validators/` (content), `scripts/validate-content.ts` (CLI) |
| Tests               | Unit/integration co-located as `*.test.ts`; database in `supabase/tests/`; E2E in `tests/`                        |

### 2.2 Dependency rules (enforced by `eslint-plugin-boundaries`)

- `apps/*` may depend on `packages/*`. **`packages/*` may never depend on `apps/*`.**
- `apps/web` may depend on: `types`, `answer-core`, `assessment-core`, `api-client`, `design`, `content-schema`. **Nothing else.** Same list for `apps/mobile` at V2.
- `apps/web` and `apps/mobile` may **never** depend on any AI SDK, `mathjax`, `sympy`, or anything importing the service-role key. CI-enforced (§25.10) — and in Rev 2 the check runs against `apps/web` as well, including its service worker and its `api/` route handlers.
- **`packages/assessment-core` may contain no scoring, weighting or band-derivation logic** — only types, constants and strings. A CI check greps it for arithmetic on mastery or readiness values. If assessment maths appears in TypeScript, D-18 has been violated and determinism is no longer testable.
- `apps/pipeline` is not bundled into either app and may depend on anything.

---

## 3. DATABASE SPECIFICATION

PostgreSQL 15 on Supabase. **49 tables** — the 45 specified in Rev 1 plus `diagnostic_sessions`, `readiness_snapshots`, `grade_projections` and `student_outcomes` (§3.25–3.28). Every table has RLS enabled (§5). All timestamps are `timestamptz`. All primary keys are `uuid` with `gen_random_uuid()` except taxonomy tables that use stable text codes, and `attempts` which uses `bigint identity` for insert throughput.

Conventions: `snake_case`; `_id` suffix for FKs; `_at` suffix for timestamps; tables whose rows are edited after creation carry `created_at` and `updated_at`, maintained by the shared trigger `trg_set_updated_at`; append-only, join and reference tables carry `created_at` only, or neither where the row's existence is itself the fact. The column list per table below is authoritative — the trigger is attached exactly where an `updated_at` column is defined.

### 3.0 Enumerated types

```sql
create type app_role            as enum ('student','viewer','reviewer','curriculum_admin','content_admin','support','super_admin');
create type syllabus_code       as enum ('V2018','V2027');
create type question_type       as enum ('multiple_choice','multi_select','true_false','numeric','expression','structured');
create type answer_type         as enum ('option_id','option_set','boolean','numeric_exact','numeric_tolerance',
                                         'numeric_sf','numeric_dp','fraction','mixed_number','ratio','currency',
                                         'with_units','expression','coordinate','set','interval','matrix','vector','text');
create type provenance_type     as enum ('past_paper','past_paper_adapted','original_authored','ai_variant','ai_authored','legacy_import');
create type rights_status       as enum ('edmar_owned','licensed','public_domain','third_party_unlicensed','unknown');
create type content_status      as enum ('draft','pending_validation','validating','pending_review','changes_requested',
                                         'approved','published','suspended','retired','rejected','archived');
create type review_decision     as enum ('approved','changes_requested','rejected','suspended','escalated');
create type profile_dimension   as enum ('CK','AK','R');
create type paper_code          as enum ('01','02','031','032');
create type sitting_month       as enum ('january','may_june');
create type practice_mode       as enum ('topic','recommended','weak_areas','diagnostic','bookmarks','incorrect','misconceptions');
create type session_status      as enum ('in_progress','completed','abandoned','expired');
create type exam_mode           as enum ('practice','timed');
-- ── Rev 2 additions ──────────────────────────────────────────────────────────
create type assessment_context  as enum ('topic_practice','recommended','diagnostic',
                                         'simulation_practice','simulation_timed','quick_check');
create type simulation_form     as enum ('p01_regular','p02_regular','p01_modular_1','p02_modular_1',
                                         'p01_modular_2','p02_modular_2','p032');
create type mastery_band        as enum ('not_started','getting_started','needs_work','developing',
                                         'competent','strong','mastered');
create type confidence_level    as enum ('none','low','moderate','high');
create type projection_state    as enum ('withheld','issued');
create type withheld_reason     as enum ('insufficient_attempts','insufficient_coverage',
                                         'no_simulation','stale_evidence','not_entitled');
create type accuracy_rule       as enum ('exact','tolerance','significant_figures','decimal_places',
                                         'equivalent_form','symbolic');
create type verification_status as enum ('unverified','machine_verified','verified','disputed');
create type entitlement_tier    as enum ('free','premium');
create type entitlement_source  as enum ('default','web_stripe','google_play','apple','promo','school','manual');
create type entitlement_status  as enum ('active','grace','on_hold','expired','cancelled','refunded');
create type job_status          as enum ('queued','running','succeeded','failed','cancelled');
create type asset_role          as enum ('question_figure','solution_figure','option_figure');
```

### 3.1 `profiles` — one row per authenticated user

Purpose: the application-side identity record. Extends `auth.users`, which Supabase owns.

| Column                    | Type            | Null | Default     | Constraints                                             |
| ------------------------- | --------------- | ---- | ----------- | ------------------------------------------------------- |
| `id`                      | `uuid`          | no   | —           | **PK**, **FK → `auth.users(id)` ON DELETE CASCADE**     |
| `display_name`            | `text`          | yes  | —           | `check (char_length(display_name) between 1 and 40)`    |
| `email`                   | `citext`        | no   | —           | **unique**                                              |
| `role`                    | `app_role`      | no   | `'student'` |                                                         |
| `territory`               | `text`          | yes  | `'JM'`      | `check (territory ~ '^[A-Z]{2}$')` ISO 3166-1 alpha-2   |
| `syllabus_version`        | `syllabus_code` | no   | `'V2027'`   | which taxonomy tree this user sees                      |
| `exam_sitting_year`       | `smallint`      | yes  | —           | `check (exam_sitting_year between 2026 and 2035)`       |
| `exam_sitting_month`      | `sitting_month` | yes  | —           |                                                         |
| `age_confirmed_13_plus`   | `boolean`       | no   | `false`     | U-05                                                    |
| `onboarding_completed_at` | `timestamptz`   | yes  | —           |                                                         |
| `locale`                  | `text`          | no   | `'en-JM'`   |                                                         |
| `theme_preference`        | `text`          | no   | `'system'`  | `check (theme_preference in ('system','light','dark'))` |
| `notifications_opt_in`    | `boolean`       | no   | `false`     |                                                         |
| `deleted_at`              | `timestamptz`   | yes  | —           | soft delete; hard purge job at 30 days                  |
| `created_at`              | `timestamptz`   | no   | `now()`     |                                                         |
| `updated_at`              | `timestamptz`   | no   | `now()`     |                                                         |

Indexes: `idx_profiles_role (role) where role <> 'student'`; `idx_profiles_deleted (deleted_at) where deleted_at is not null`.

> **No `predicted_csec_grade` column exists, by decision (§0.4 conflict 1).** No date of birth, school, address or phone number is stored (blueprint B-11).

### 3.2 `admin_role_grants` — auditable role assignment

Purpose: role changes must be explicit, attributable and revocable. `profiles.role` is the effective value; this table is the history and the authority.

| Column       | Type          | Null | Default             | Constraints                           |
| ------------ | ------------- | ---- | ------------------- | ------------------------------------- |
| `id`         | `uuid`        | no   | `gen_random_uuid()` | PK                                    |
| `profile_id` | `uuid`        | no   | —                   | FK → `profiles(id)` ON DELETE CASCADE |
| `role`       | `app_role`    | no   | —                   |                                       |
| `granted_by` | `uuid`        | no   | —                   | FK → `profiles(id)`                   |
| `granted_at` | `timestamptz` | no   | `now()`             |                                       |
| `revoked_by` | `uuid`        | yes  | —                   | FK → `profiles(id)`                   |
| `revoked_at` | `timestamptz` | yes  | —                   |                                       |
| `reason`     | `text`        | no   | —                   | `check (char_length(reason) >= 5)`    |

Unique: `(profile_id, role) where revoked_at is null`. Index: `idx_arg_profile (profile_id)`.

### 3.3 Curriculum tables

#### `subjects`

| Column      | Type       | Null | Default | Constraints                |
| ----------- | ---------- | ---- | ------- | -------------------------- |
| `code`      | `text`     | no   | —       | **PK**, e.g. `'CSEC_MATH'` |
| `name`      | `text`     | no   | —       | `'CSEC Mathematics'`       |
| `is_active` | `boolean`  | no   | `true`  |                            |
| `sequence`  | `smallint` | no   | `0`     |                            |

Seed: one row, `CSEC_MATH`.

#### `syllabus_versions`

| Column                 | Type            | Null | Default | Constraints                             |
| ---------------------- | --------------- | ---- | ------- | --------------------------------------- |
| `code`                 | `syllabus_code` | no   | —       | **PK**                                  |
| `subject_code`         | `text`          | no   | —       | FK → `subjects(code)`                   |
| `official_code`        | `text`          | yes  | —       | `'CXC 05/G/SYLL 16'`                    |
| `effective_from_year`  | `smallint`      | no   | —       | `2027`                                  |
| `effective_from_month` | `sitting_month` | no   | —       | `'may_june'`                            |
| `has_modules`          | `boolean`       | no   | `false` | `true` for V2027                        |
| `is_default`           | `boolean`       | no   | `false` | exactly one true — partial unique index |
| `source_document`      | `text`          | yes  | —       | filename of the syllabus PDF            |

Unique: `create unique index uq_syllabus_default on syllabus_versions ((true)) where is_default;`

#### `modules` — V2027 only; empty for V2018

| Column           | Type            | Null | Default             | Constraints                                          |
| ---------------- | --------------- | ---- | ------------------- | ---------------------------------------------------- |
| `id`             | `uuid`          | no   | `gen_random_uuid()` | PK                                                   |
| `syllabus_code`  | `syllabus_code` | no   | —                   | FK → `syllabus_versions(code)`                       |
| `module_no`      | `smallint`      | no   | —                   | `check (module_no between 1 and 3)`                  |
| `name`           | `text`          | no   | —                   | e.g. `'Fundamentals of Secondary Level Mathematics'` |
| `paper01_items`  | `smallint`      | no   | `20`                | from the official grid                               |
| `paper02_marks`  | `smallint`      | no   | `30`                |                                                      |
| `weighted_marks` | `smallint`      | no   | `100`               |                                                      |
| `duration_hours` | `smallint`      | no   | `65`                |                                                      |

Unique: `(syllabus_code, module_no)`.

#### `topics`

| Column                | Type            | Null | Default             | Constraints                                                                                                                                                                                                                              |
| --------------------- | --------------- | ---- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | `uuid`          | no   | `gen_random_uuid()` | PK                                                                                                                                                                                                                                       |
| `syllabus_code`       | `syllabus_code` | no   | —                   | FK → `syllabus_versions(code)`                                                                                                                                                                                                           |
| `module_id`           | `uuid`          | yes  | —                   | FK → `modules(id)`; null when the syllabus has no modules                                                                                                                                                                                |
| `topic_no`            | `smallint`      | no   | —                   | official number within module/syllabus                                                                                                                                                                                                   |
| `code`                | `text`          | no   | —                   | stable slug, e.g. `'M1-T2'`                                                                                                                                                                                                              |
| `name`                | `text`          | no   | —                   | verbatim from the syllabus, title-cased                                                                                                                                                                                                  |
| `sequence`            | `smallint`      | no   | —                   | display order                                                                                                                                                                                                                            |
| `paper01_items`       | `smallint`      | yes  | —                   | e.g. Consumer Arithmetic = 4                                                                                                                                                                                                             |
| `paper02_marks_group` | `text`          | yes  | —                   | label of the Paper 02 marks group this topic shares, verbatim from the syllabus                                                                                                                                                          |
| `paper02_marks`       | `smallint`      | yes  | —                   | this topic's share of its module's 30 Paper 02 marks; where the syllabus groups topics, the group total is divided evenly and the group label is kept in `paper02_marks_group`. **This is the numeric column §9.11 and §9.12 weight by** |
| `is_active`           | `boolean`       | no   | `true`              |                                                                                                                                                                                                                                          |

Unique: `(syllabus_code, code)`, `(syllabus_code, module_id, topic_no)`. Index: `idx_topics_syllabus (syllabus_code, sequence)`.

#### `subtopics` — **EdMar construct, not official CXC**

Presentation grouping over specific objectives. Must be visually marked as EdMar-authored in admin.

| Column               | Type       | Null | Default             | Constraints                                                     |
| -------------------- | ---------- | ---- | ------------------- | --------------------------------------------------------------- |
| `id`                 | `uuid`     | no   | `gen_random_uuid()` | PK                                                              |
| `topic_id`           | `uuid`     | no   | —                   | FK → `topics(id)` ON DELETE RESTRICT                            |
| `code`               | `text`     | no   | —                   | slug                                                            |
| `name`               | `text`     | no   | —                   |                                                                 |
| `sequence`           | `smallint` | no   | `0`                 |                                                                 |
| `is_edmar_construct` | `boolean`  | no   | `true`              | `check (is_edmar_construct)` — documents provenance permanently |
| `is_active`          | `boolean`  | no   | `true`              |                                                                 |

Unique: `(topic_id, code)`.

#### `specific_objectives` — **the anchor of the whole system**

| Column               | Type            | Null | Default             | Constraints                                             |
| -------------------- | --------------- | ---- | ------------------- | ------------------------------------------------------- |
| `id`                 | `uuid`          | no   | `gen_random_uuid()` | PK                                                      |
| `syllabus_code`      | `syllabus_code` | no   | —                   | FK → `syllabus_versions(code)`                          |
| `topic_id`           | `uuid`          | no   | —                   | FK → `topics(id)` ON DELETE RESTRICT                    |
| `subtopic_id`        | `uuid`          | yes  | —                   | FK → `subtopics(id)` ON DELETE SET NULL                 |
| `code`               | `text`          | no   | —                   | official code, e.g. `'M1-1.4'`                          |
| `objective_no`       | `smallint`      | no   | —                   | the `.4`                                                |
| `statement`          | `text`          | no   | —                   | verbatim CXC wording                                    |
| `content_notes`      | `text`          | yes  | —                   | CONTENT/EXPLANATORY NOTES column                        |
| `needs_human_review` | `boolean`       | no   | `false`             | set true by the extractor; must be false before publish |
| `sequence`           | `smallint`      | no   | `0`                 |                                                         |
| `is_active`          | `boolean`       | no   | `true`              |                                                         |

Unique: `(syllabus_code, code)`. Indexes: `idx_so_topic (topic_id, sequence)`; `idx_so_review (needs_human_review) where needs_human_review`.

Seed: 159 rows for V2027 from `content/taxonomy/csec_2027_taxonomy_seed.json`.

#### `skills` — **EdMar construct**, controlled vocabulary

| Column                      | Type          | Null | Default             | Constraints                                                         |
| --------------------------- | ------------- | ---- | ------------------- | ------------------------------------------------------------------- |
| `id`                        | `uuid`        | no   | `gen_random_uuid()` | PK                                                                  |
| `code`                      | `text`        | no   | —                   | **unique**, e.g. `'M1_NTC_FRACTIONS'` (legacy codes preserved, §12) |
| `name`                      | `text`        | no   | —                   | `'Operations with fractions'`                                       |
| `description`               | `text`        | yes  | —                   |                                                                     |
| `is_active`                 | `boolean`     | no   | `true`              |                                                                     |
| `created_at` / `updated_at` | `timestamptz` | no   | `now()`             |                                                                     |

Index: `idx_skills_active (is_active) where is_active`.

> Target vocabulary size 150–250 (blueprint §F.4). A hard cap is enforced in admin, not in the database: creating a skill requires `curriculum_admin`.

#### `skill_prerequisites`

| Column                  | Type   | Null | Constraints                         |
| ----------------------- | ------ | ---- | ----------------------------------- |
| `skill_id`              | `uuid` | no   | FK → `skills(id)` ON DELETE CASCADE |
| `prerequisite_skill_id` | `uuid` | no   | FK → `skills(id)` ON DELETE CASCADE |

PK `(skill_id, prerequisite_skill_id)`. `check (skill_id <> prerequisite_skill_id)`. Cycle prevention is a trigger, `trg_skill_prereq_acyclic`, using a recursive CTE.

#### `skill_objectives` — many-to-many skill ↔ specific objective

| Column                  | Type   | Null | Constraints                                      |
| ----------------------- | ------ | ---- | ------------------------------------------------ |
| `skill_id`              | `uuid` | no   | FK → `skills(id)` ON DELETE CASCADE              |
| `specific_objective_id` | `uuid` | no   | FK → `specific_objectives(id)` ON DELETE CASCADE |

PK `(skill_id, specific_objective_id)`. Index on `(specific_objective_id)`.

#### `objective_mappings` — V2018 ↔ V2027 bridge

Populated only if U-02 resolves toward dual-syllabus support. The table exists from migration 1 regardless, so adding V2018 later needs no schema change.

| Column              | Type   | Null | Constraints                                                                |
| ------------------- | ------ | ---- | -------------------------------------------------------------------------- |
| `from_objective_id` | `uuid` | no   | FK → `specific_objectives(id)`                                             |
| `to_objective_id`   | `uuid` | no   | FK → `specific_objectives(id)`                                             |
| `relationship`      | `text` | no   | `check (relationship in ('identical','partial','moved','split','merged'))` |
| `note`              | `text` | yes  |                                                                            |

PK `(from_objective_id, to_objective_id)`.

### 3.4 `questions` — stable identity

| Column                      | Type                | Null | Default             | Constraints                                                |
| --------------------------- | ------------------- | ---- | ------------------- | ---------------------------------------------------------- |
| `id`                        | `uuid`              | no   | `gen_random_uuid()` | PK                                                         |
| `subject_code`              | `text`              | no   | `'CSEC_MATH'`       | FK → `subjects(code)`                                      |
| `question_type`             | `question_type`     | no   | —                   |                                                            |
| `provenance`                | `provenance_type`   | no   | —                   |                                                            |
| `rights_status`             | `rights_status`     | no   | `'unknown'`         | **§0.5**                                                   |
| `status`                    | `content_status`    | no   | `'draft'`           |                                                            |
| `current_version_id`        | `uuid`              | yes  | —                   | FK → `question_versions(id)` DEFERRABLE INITIALLY DEFERRED |
| `variant_family_id`         | `uuid`              | yes  | —                   | groups a source question with its variants                 |
| `source_question_id`        | `uuid`              | yes  | —                   | FK → `questions(id)`; set on variants                      |
| `calculator_allowed`        | `boolean`           | no   | `true`              |                                                            |
| `difficulty_band`           | `smallint`          | no   | —                   | `check (difficulty_band between 1 and 5)`                  |
| `profile_dimension`         | `profile_dimension` | yes  | —                   | CK / AK / R                                                |
| `is_free`                   | `boolean`           | no   | `false`             | free-tier pool membership                                  |
| `legacy_id`                 | `text`              | yes  | —                   | **unique**, traceability to the imported record (§12)      |
| `retired_at`                | `timestamptz`       | yes  | —                   |                                                            |
| `retired_reason`            | `text`              | yes  | —                   |                                                            |
| `created_by`                | `uuid`              | yes  | —                   | FK → `profiles(id)`                                        |
| `created_at` / `updated_at` | `timestamptz`       | no   | `now()`             |                                                            |

Indexes:

```sql
create index idx_q_published        on questions (status) where status = 'published';
create index idx_q_difficulty       on questions (difficulty_band) where status = 'published';
create index idx_q_variant_family   on questions (variant_family_id) where variant_family_id is not null;
create index idx_q_provenance       on questions (provenance, rights_status);
create index idx_q_free             on questions (is_free) where is_free and status = 'published';
create unique index uq_q_legacy     on questions (legacy_id) where legacy_id is not null;
```

`check (status <> 'published' or current_version_id is not null)` — a published question must have a version.

### 3.5 `question_versions` — immutable content

| Column               | Type           | Null | Default             | Constraints                                                                |
| -------------------- | -------------- | ---- | ------------------- | -------------------------------------------------------------------------- |
| `id`                 | `uuid`         | no   | `gen_random_uuid()` | PK                                                                         |
| `question_id`        | `uuid`         | no   | —                   | FK → `questions(id)` ON DELETE CASCADE                                     |
| `version_no`         | `integer`      | no   | —                   | `check (version_no >= 1)`                                                  |
| `stem_blocks`        | `jsonb`        | no   | —                   | ordered block array (§11.4); `check (jsonb_typeof(stem_blocks) = 'array')` |
| `stem_plain`         | `text`         | no   | —                   | plaintext projection, for search and duplicate hashing                     |
| `answer_spec`        | `jsonb`        | no   | —                   | §10.4; validated against JSON Schema by trigger                            |
| `explanation`        | `text`         | yes  | —                   | legacy field, retained; superseded by `why_this_works` (Rev 2)             |
| `explanation_blocks` | `jsonb`        | yes  | —                   | when the explanation contains mathematics                                  |
| `concepts_required`  | `jsonb`        | no   | `'[]'`              | **block 2** — array of `{objectiveId, label}`, 1–4 entries (§40.2)         |
| `strategy_blocks`    | `jsonb`        | no   | `'[]'`              | **block 3** — ordered block array, 1–3 sentences                           |
| `final_answer_blocks`| `jsonb`        | no   | `'[]'`              | **block 5** — must agree with `answer_spec`, checked by trigger (§40.6)    |
| `why_this_works`     | `jsonb`        | no   | `'[]'`              | **block 6** — ordered block array, 2–4 sentences                           |
| `exam_tip`           | `jsonb`        | no   | `'[]'`              | **block 8** — ordered block array                                          |
| `quick_check`        | `jsonb`        | yes  | —                   | **block 9** — `{promptBlocks, answerSpec, assetId?}` (§40.3)               |
| `cognitive_level`    | `profile_dimension` | no | —                | **block 10** — CK / AK / R. Drives the simulation profile split (§41.3)    |
| `method_class`       | `text`         | yes  | —                   | **block 10** — e.g. `theorem_based (circle geometry)`                      |
| `accuracy_rule`      | `accuracy_rule`| no   | `'exact'`           | **block 10** — must be consistent with `answer_spec.tolerance`             |
| `verification`       | `verification_status` | no | `'unverified'` | **block 10** — `verified` requires validators **and** a human review pass  |
| `ambiguity_note`     | `text`         | yes  | —                   | **block 10** — null renders as "None"                                      |
| `marks`              | `smallint`     | yes  | —                   | `check (marks between 1 and 20)`                                           |
| `estimated_seconds`  | `smallint`     | yes  | —                   |                                                                            |
| `hint`               | `text`         | yes  | —                   | shown only after a wrong attempt                                           |
| `normalised_hash`    | `text`         | no   | —                   | sha256 of canonicalised stem, duplicate layer 1 (§9.8)                     |
| `embedding`          | `vector(1536)` | yes  | —                   | pgvector, duplicate layer 3                                                |
| `validation_report`  | `jsonb`        | yes  | —                   | output of §13.7                                                            |
| `change_note`        | `text`         | yes  | —                   |                                                                            |
| `created_by`         | `uuid`         | yes  | —                   | FK → `profiles(id)`                                                        |
| `published_at`       | `timestamptz`  | yes  | —                   |                                                                            |
| `created_at`         | `timestamptz`  | no   | `now()`             |                                                                            |

Unique: `(question_id, version_no)`. Indexes: `idx_qv_hash (normalised_hash)`; `idx_qv_embedding using ivfflat (embedding vector_cosine_ops)`; `idx_qv_question (question_id, version_no desc)`; `idx_qv_cognitive (cognitive_level)` — needed by simulation materialisation (§41.3).

**Immutability:** trigger `trg_qv_immutable` raises on any `UPDATE` to a row where `published_at is not null`, except to `embedding` and `validation_report`.

**Rev 2 — the ten-block completeness constraint (D-17).** `fn_publish_question` refuses any version where any of `concepts_required` (≥1 entry), `strategy_blocks`, `final_answer_blocks`, `why_this_works`, `exam_tip`, `quick_check`, `cognitive_level` is empty or null, where fewer than two `common_errors` rows exist (block 7), where fewer than one `solution_steps` row exists (block 4), or where `verification <> 'verified'`. These are preconditions 8–11 of `fn_publish_question` and they are the mechanism that makes blueprint §G.11 binding rather than aspirational — an interface check would be bypassed by the first bulk-publish script anyone writes.

> **Why there is no separate `explanations` table.** An explanation is 1:1 with a question version, is always fetched with it, and has no independent lifecycle. A separate table would add a join to the hottest read path for no benefit. Same reasoning excludes a separate `generated_questions` table: generation is an _attribute_ (`provenance` + `ai_generations` row), not a different kind of object, and splitting it would fork every query in the system.

### 3.6 `question_options` — multiple choice / multi-select

| Column                | Type       | Null | Default             | Constraints                                    |
| --------------------- | ---------- | ---- | ------------------- | ---------------------------------------------- |
| `id`                  | `uuid`     | no   | `gen_random_uuid()` | PK                                             |
| `question_version_id` | `uuid`     | no   | —                   | FK → `question_versions(id)` ON DELETE CASCADE |
| `option_key`          | `char(1)`  | no   | —                   | `check (option_key in ('A','B','C','D','E'))`  |
| `content_blocks`      | `jsonb`    | no   | —                   | block array                                    |
| `content_plain`       | `text`     | no   | —                   |                                                |
| `is_correct`          | `boolean`  | no   | `false`             |                                                |
| `common_error_id`     | `uuid`     | yes  | —                   | FK → `common_errors(id)` ON DELETE SET NULL    |
| `sequence`            | `smallint` | no   | —                   | authored order                                 |
| `preserve_order`      | `boolean`  | no   | `false`             | suppress presentation shuffling                |

Unique: `(question_version_id, option_key)`. Index: `idx_qo_version (question_version_id, sequence)`.

Constraint via trigger `trg_qo_exactly_one_correct`: for `multiple_choice`, exactly one `is_correct`; for `multi_select`, at least one.

### 3.7 `solution_steps`

**Block 4 of the presentation model.** One row per step, ordered.

```sql
create table solution_steps (
  id                  uuid primary key default gen_random_uuid(),
  question_version_id uuid not null references question_versions(id) on delete cascade,
  step_no             smallint not null check (step_no >= 1),
  instruction         text not null,              -- "Use the theorem: angle at the centre…"
  sub_note            text,                       -- "From Step 1." / "∠LMN is subtended by arc KL."
  working_blocks      jsonb not null default '[]',-- the mathematics of the step
  result_blocks       jsonb not null default '[]',-- Rev 2: the STEP RESULT CHIP, e.g. ∠KOL = 2∠LMN
  marks               smallint,                   -- mark allocation where the source is a paper
  created_at          timestamptz not null default now(),
  unique (question_version_id, step_no)
);
create index idx_ss_qv on solution_steps (question_version_id, step_no);
```

> **`result_blocks` is new in Rev 2 and is not cosmetic.** In the reference interface each step carries its result on the right-hand side, which is what lets a student scan for the step where their own working diverged without reading the prose. It is stored separately from `working_blocks` so it can be right-aligned, styled distinctly, and — in the narrow-viewport accordion — kept visible when the working is collapsed.

### 3.8 `common_errors`

| Column                | Type      | Null | Default             | Constraints                                         |
| --------------------- | --------- | ---- | ------------------- | --------------------------------------------------- |
| `id`                  | `uuid`    | no   | `gen_random_uuid()` | PK                                                  |
| `question_version_id` | `uuid`    | no   | —                   | FK → `question_versions(id)` ON DELETE CASCADE      |
| `part_key`            | `text`    | yes  | —                   |                                                     |
| `wrong_value`         | `text`    | yes  | —                   | the normalised wrong answer that triggers this      |
| `wrong_option_key`    | `char(1)` | yes  | —                   | for MCQ                                             |
| `misconception`       | `text`    | no   | —                   | "Applied the percentage to the selling price"       |
| `corrective_note`     | `text`    | no   | —                   | shown to the student                                |
| `skill_id`            | `uuid`    | yes  | —                   | FK → `skills(id)`; the skill the student is missing |

`check (wrong_value is not null or wrong_option_key is not null)`. Index: `idx_ce_version (question_version_id)`; `idx_ce_value (question_version_id, wrong_value)`.

### 3.9 `question_assets`

| Column                | Type         | Null | Default             | Constraints                                                           |
| --------------------- | ------------ | ---- | ------------------- | --------------------------------------------------------------------- |
| `id`                  | `uuid`       | no   | `gen_random_uuid()` | PK                                                                    |
| `question_version_id` | `uuid`       | no   | —                   | FK → `question_versions(id)` ON DELETE CASCADE                        |
| `role`                | `asset_role` | no   | `'question_figure'` |                                                                       |
| `part_key`            | `text`       | yes  | —                   |                                                                       |
| `storage_bucket`      | `text`       | no   | `'question-assets'` |                                                                       |
| `storage_path`        | `text`       | no   | —                   | **unique** with bucket                                                |
| `mime_type`           | `text`       | no   | —                   | `check (mime_type in ('image/svg+xml','image/png','image/webp'))`     |
| `width_px`            | `integer`    | yes  | —                   |                                                                       |
| `height_px`           | `integer`    | yes  | —                   |                                                                       |
| `alt_text`            | `text`       | no   | —                   | `check (char_length(alt_text) >= 10)` — **mandatory, blueprint P.10** |
| `requires_colour`     | `boolean`    | no   | `false`             | accessibility flag                                                    |
| `sequence`            | `smallint`   | no   | `0`                 |                                                                       |

Unique: `(storage_bucket, storage_path)`. Index: `idx_qa_version (question_version_id, sequence)`.

### 3.10 `math_renders` — content-addressed pre-rendered mathematics (D-01, D-03)

The reason the client ships no math engine.

| Column             | Type           | Null | Default     | Constraints                             |
| ------------------ | -------------- | ---- | ----------- | --------------------------------------- |
| `hash`             | `text`         | no   | —           | **PK**, `sha256(latex                   |     | '   | '   |     | style)` |
| `latex`            | `text`         | no   | —           | source, restricted allowlist            |
| `style`            | `text`         | no   | `'display'` | `check (style in ('inline','display'))` |
| `svg`              | `text`         | no   | —           | MathJax v3 SVG output                   |
| `width_ex`         | `numeric(8,3)` | no   | —           | intrinsic width in ex units             |
| `height_ex`        | `numeric(8,3)` | no   | —           |                                         |
| `depth_ex`         | `numeric(8,3)` | no   | `0`         | baseline depth, for inline alignment    |
| `renderer_version` | `text`         | no   | —           | e.g. `'mathjax-full@3.2.2'`             |
| `byte_size`        | `integer`      | no   | —           |                                         |
| `created_at`       | `timestamptz`  | no   | `now()`     |                                         |

Index: `idx_mr_created (created_at)`. Typical row 1–3 KB; expected 3,000–8,000 rows at 6,000 questions because expressions repeat heavily.

### 3.11 `question_objectives` and `question_skills`

```sql
create table question_objectives (
  question_id            uuid not null references questions(id) on delete cascade,
  specific_objective_id  uuid not null references specific_objectives(id) on delete restrict,
  is_primary             boolean not null default false,
  confidence             numeric(3,2),          -- AI proposal confidence, null once human-confirmed
  confirmed_by           uuid references profiles(id),
  confirmed_at           timestamptz,
  primary key (question_id, specific_objective_id)
);
create index idx_qo_objective on question_objectives (specific_objective_id);
create unique index uq_qo_primary on question_objectives (question_id) where is_primary;

create table question_skills (
  question_id uuid not null references questions(id) on delete cascade,
  skill_id    uuid not null references skills(id) on delete restrict,
  weight      numeric(3,2) not null default 1.00 check (weight > 0 and weight <= 1),
  primary key (question_id, skill_id)
);
create index idx_qs_skill on question_skills (skill_id);
```

A published question must have ≥1 objective and 1–3 skills — enforced by `fn_publish_question` (§6.7), not by a table constraint, because rows are inserted before publication.

### 3.12 `question_sources` — past-paper provenance

Separate from `questions` because a question may be original (no source) and because rights withdrawal must be a single indexed query.

| Column              | Type            | Null | Constraints                                                              |
| ------------------- | --------------- | ---- | ------------------------------------------------------------------------ |
| `question_id`       | `uuid`          | no   | **PK**, FK → `questions(id)` ON DELETE CASCADE                           |
| `source_kind`       | `text`          | no   | `check (source_kind in ('past_paper','workbook','textbook','authored'))` |
| `source_title`      | `text`          | yes  | e.g. `'EdMar CXC Mathematics Workbook 2026'`                             |
| `sitting_year`      | `smallint`      | yes  | `check (sitting_year between 1980 and 2040)`                             |
| `sitting_month`     | `sitting_month` | yes  |                                                                          |
| `paper`             | `paper_code`    | yes  |                                                                          |
| `question_no`       | `smallint`      | yes  |                                                                          |
| `part_label`        | `text`          | yes  | `'b(ii)'`                                                                |
| `syllabus_in_force` | `syllabus_code` | yes  |                                                                          |
| `page_ref`          | `text`          | yes  |                                                                          |

Indexes: `idx_qsrc_paper (sitting_year, sitting_month, paper, question_no)`; `idx_qsrc_kind (source_kind)`.

### 3.13 `question_payloads` — the denormalised student read (D-14)

**This is the only content table the student app reads.** One row per published question version. Assembled by `fn_build_question_payload` at publish time.

| Column                | Type          | Null | Constraints                                            |
| --------------------- | ------------- | ---- | ------------------------------------------------------ |
| `question_version_id` | `uuid`        | no   | **PK**, FK → `question_versions(id)` ON DELETE CASCADE |
| `question_id`         | `uuid`        | no   | FK → `questions(id)` ON DELETE CASCADE                 |
| `payload`             | `jsonb`       | no   | the complete client object (§34.3)                     |
| `payload_bytes`       | `integer`     | no   | `check (payload_bytes < 262144)` — 256 KB ceiling      |
| `content_version`     | `bigint`      | no   | global counter at build time                           |
| `is_free`             | `boolean`     | no   | denormalised from `questions` for RLS speed            |
| `built_at`            | `timestamptz` | no   | `default now()`                                        |

Indexes: `idx_qp_question (question_id)`; `idx_qp_free (is_free) where is_free`.

### 3.14 `question_reviews`

| Column                  | Type              | Null | Default             | Constraints                                     |
| ----------------------- | ----------------- | ---- | ------------------- | ----------------------------------------------- |
| `id`                    | `uuid`            | no   | `gen_random_uuid()` | PK                                              |
| `question_id`           | `uuid`            | no   | —                   | FK → `questions(id)` ON DELETE CASCADE          |
| `question_version_id`   | `uuid`            | no   | —                   | FK → `question_versions(id)` ON DELETE CASCADE  |
| `reviewer_id`           | `uuid`            | no   | —                   | FK → `profiles(id)`                             |
| `decision`              | `review_decision` | no   | —                   |                                                 |
| `note`                  | `text`            | yes  | —                   | required when decision ≠ `approved`             |
| `rejection_reason_code` | `text`            | yes  | —                   | controlled vocabulary, feeds prompt improvement |
| `diff`                  | `jsonb`           | yes  | —                   | what the reviewer changed                       |
| `review_seconds`        | `integer`         | yes  | —                   | throughput measurement                          |
| `created_at`            | `timestamptz`     | no   | `now()`             |                                                 |

Indexes: `idx_qr_question (question_id, created_at desc)`; `idx_qr_reviewer (reviewer_id, created_at desc)`.

### 3.15 `question_quality_metrics` — rolled up, refreshed hourly

| Column              | Type           | Null | Default                                        |
| ------------------- | -------------- | ---- | ---------------------------------------------- |
| `question_id`       | `uuid`         | no   | **PK**, FK → `questions(id)` ON DELETE CASCADE |
| `total_attempts`    | `integer`      | no   | `0`                                            |
| `distinct_students` | `integer`      | no   | `0`                                            |
| `correct_attempts`  | `integer`      | no   | `0`                                            |
| `accuracy`          | `numeric(5,4)` | yes  | —                                              |
| `skip_count`        | `integer`      | no   | `0`                                            |
| `mean_seconds`      | `numeric(8,2)` | yes  | —                                              |
| `median_seconds`    | `numeric(8,2)` | yes  | —                                              |
| `top_wrong_value`   | `text`         | yes  | —                                              |
| `top_wrong_share`   | `numeric(5,4)` | yes  | —                                              | **the most diagnostic single content metric** |
| `report_count`      | `integer`      | no   | `0`                                            |
| `flagged_reason`    | `text`         | yes  | —                                              |
| `last_computed_at`  | `timestamptz`  | no   | `now()`                                        |

Index: `idx_qqm_flagged (flagged_reason) where flagged_reason is not null`; `idx_qqm_accuracy (accuracy)`.

### 3.16 `question_reports` — student-reported problems

| Column                | Type          | Null | Default             | Constraints                                                                                                          |
| --------------------- | ------------- | ---- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`                  | `uuid`        | no   | `gen_random_uuid()` | PK                                                                                                                   |
| `question_id`         | `uuid`        | no   | —                   | FK → `questions(id)`                                                                                                 |
| `question_version_id` | `uuid`        | no   | —                   | FK → `question_versions(id)`                                                                                         |
| `reporter_id`         | `uuid`        | yes  | —                   | FK → `profiles(id)` ON DELETE SET NULL                                                                               |
| `reason_code`         | `text`        | no   | —                   | `check (reason_code in ('wrong_answer','wrong_solution','unclear','typo','diagram_missing','off_syllabus','other'))` |
| `detail`              | `text`        | yes  | —                   | `check (char_length(detail) <= 500)`                                                                                 |
| `student_answer`      | `text`        | yes  | —                   | captured automatically                                                                                               |
| `resolution`          | `text`        | yes  | —                   | `check (resolution in ('fixed','no_change','duplicate','invalid'))`                                                  |
| `resolved_by`         | `uuid`        | yes  | —                   | FK → `profiles(id)`                                                                                                  |
| `resolved_at`         | `timestamptz` | yes  | —                   |                                                                                                                      |
| `created_at`          | `timestamptz` | no   | `now()`             |                                                                                                                      |

Indexes: `idx_qrep_open (question_id) where resolved_at is null`; `idx_qrep_reporter (reporter_id, created_at desc)`.

### 3.17 `papers` and `paper_questions`

```sql
create table papers (
  id                 uuid primary key default gen_random_uuid(),
  syllabus_code      syllabus_code not null references syllabus_versions(code),
  title              text not null,
  paper              paper_code not null,
  sitting_year       smallint,
  sitting_month      sitting_month,
  is_original        boolean not null default false,   -- EdMar-authored practice paper
  module_scope       smallint[] not null default '{1,2,3}',
  total_marks        smallint not null,
  duration_minutes   smallint not null,
  rights_status      rights_status not null default 'unknown',
  status             content_status not null default 'draft',
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index uq_papers_sitting on papers (syllabus_code, paper, sitting_year, sitting_month)
  where sitting_year is not null;
create index idx_papers_published on papers (status, sitting_year desc) where status = 'published';

create table paper_questions (
  paper_id     uuid not null references papers(id) on delete cascade,
  question_id  uuid not null references questions(id) on delete restrict,
  position     smallint not null,
  display_no   text not null,              -- '4', '2(b)(ii)'
  marks        smallint not null,
  module_no    smallint,
  primary key (paper_id, question_id),
  unique (paper_id, position)
);
create index idx_pq_question on paper_questions (question_id);
```

### 3.18 `practice_sessions` and `practice_session_items`

```sql
create table practice_sessions (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references profiles(id) on delete cascade,
  mode               practice_mode not null,
  scope_kind         text not null check (scope_kind in ('topic','subtopic','objective','skill','module','mixed')),
  scope_ids          uuid[] not null default '{}',
  syllabus_code      syllabus_code not null,
  difficulty_mode    text not null default 'mixed'
                       check (difficulty_mode in ('mixed','building','challenge')),
  requested_count    smallint not null check (requested_count between 1 and 20),   -- app_config.session_max_questions
  delivered_count    smallint not null default 0,
  seed               bigint not null,                      -- reproducible ordering (§9.6)
  status             session_status not null default 'in_progress',
  correct_count      smallint not null default 0,
  answered_count     smallint not null default 0,
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  client_started_at  timestamptz,
  duration_seconds   integer
);
create index idx_ps_student on practice_sessions (student_id, started_at desc);
create index idx_ps_open    on practice_sessions (student_id) where status = 'in_progress';

create table practice_session_items (
  session_id           uuid not null references practice_sessions(id) on delete cascade,
  position             smallint not null,
  question_id          uuid not null references questions(id) on delete restrict,
  question_version_id  uuid not null references question_versions(id) on delete restrict,
  option_order         char(1)[],           -- seeded presentation order for MCQ
  answered             boolean not null default false,
  primary key (session_id, position),
  unique (session_id, question_id)
);
```

### 3.19 `attempts` — append-only, immutable (D-13)

The highest-volume table. `bigint identity` PK for insert locality; partitioned by month once past ~20 M rows (§28.7).

| Column                    | Type            | Null | Default                        | Constraints                                              |
| ------------------------- | --------------- | ---- | ------------------------------ | -------------------------------------------------------- |
| `id`                      | `bigint`        | no   | `generated always as identity` | PK                                                       |
| `client_attempt_id`       | `uuid`          | no   | —                              | **unique** — idempotency key for offline sync            |
| `student_id`              | `uuid`          | no   | —                              | FK → `profiles(id)` ON DELETE CASCADE                    |
| `question_id`             | `uuid`          | no   | —                              | FK → `questions(id)` ON DELETE RESTRICT                  |
| `question_version_id`     | `uuid`          | no   | —                              | FK → `question_versions(id)` ON DELETE RESTRICT          |
| `session_id`              | `uuid`          | yes  | —                              | FK → `practice_sessions(id)` ON DELETE SET NULL          |
| `exam_session_id`         | `uuid`          | yes  | —                              | FK → `exam_sessions(id)` ON DELETE SET NULL              |
| `context`                 | `practice_mode` | yes  | —                              |                                                          |
| `part_key`                | `text`          | yes  | —                              | structured questions                                     |
| `raw_answer`              | `text`          | yes  | —                              | exactly what the student typed/selected                  |
| `normalised_answer`       | `text`          | yes  | —                              | after `@edmar/answer-core` normalisation                 |
| `is_correct`              | `boolean`       | no   | —                              | **server-derived value; authoritative**                  |
| `client_is_correct`       | `boolean`       | yes  | —                              | what the device decided; mismatch is logged              |
| `matched_common_error_id` | `uuid`          | yes  | —                              | FK → `common_errors(id)` ON DELETE SET NULL              |
| `was_skipped`             | `boolean`       | no   | `false`                        |                                                          |
| `solution_viewed`         | `boolean`       | no   | `false`                        |                                                          |
| `difficulty_band`         | `smallint`      | no   | —                              | denormalised at insert — history must survive re-banding |
| `duration_ms`             | `integer`       | yes  | —                              | `check (duration_ms between 0 and 3600000)`              |
| `client_created_at`       | `timestamptz`   | yes  | —                              |                                                          |
| `created_at`              | `timestamptz`   | no   | `now()`                        |                                                          |

Indexes:

```sql
create unique index uq_at_client on attempts (client_attempt_id);
create index idx_at_student_time  on attempts (student_id, created_at desc);
create index idx_at_student_q     on attempts (student_id, question_id, created_at desc);  -- cooldown (§9.5)
create index idx_at_question      on attempts (question_id) include (is_correct, duration_ms);
create index idx_at_session       on attempts (session_id) where session_id is not null;
create index idx_at_wrong         on attempts (question_id, normalised_answer) where not is_correct;
```

Immutability: no `UPDATE` or `DELETE` policy exists for any role except a purge job under service role (§25.12).

`attempt_skills` denormalises the skills exercised, so mastery updates avoid a join:

```sql
create table attempt_skills (
  attempt_id bigint not null references attempts(id) on delete cascade,
  skill_id   uuid   not null references skills(id) on delete restrict,
  weight     numeric(3,2) not null default 1.00,
  primary key (attempt_id, skill_id)
);
create index idx_as_skill on attempt_skills (skill_id);
```

### 3.20 `exam_sessions` and `exam_responses`

```sql
create table exam_sessions (
  id                uuid primary key default gen_random_uuid(),
  student_id        uuid not null references profiles(id) on delete cascade,
  paper_id          uuid references papers(id) on delete restrict,   -- null for a generated simulation
  form              simulation_form not null default 'p01_regular',  -- Rev 2
  blueprint_ok      boolean not null default false,                  -- Rev 2: materialised to spec?
  mode              exam_mode not null default 'practice',
  duration_minutes  smallint not null,
  server_started_at timestamptz not null default now(),   -- timer anchor (§17.3 S-15; tested by §27.6 cases 4–5)
  expires_at        timestamptz not null,
  submitted_at      timestamptz,
  status            session_status not null default 'in_progress',
  answer_marks      smallint,          -- marks the answer spec can award
  max_answer_marks  smallint,
  total_paper_marks smallint,
  marks_by_module   jsonb not null default '{}',  -- Rev 2: {"M1":{"got":14,"max":20}, …}
  marks_by_profile  jsonb not null default '{}',  -- Rev 2: {"CK":…, "AK":…, "R":…}
  seconds_by_item   jsonb not null default '{}',  -- Rev 2: time per item, for pace analysis
  submitted_late_by smallint,                     -- Rev 2 (D-22): seconds past expiry, null if on time
  created_at        timestamptz not null default now()
);
create index idx_es_student on exam_sessions (student_id, server_started_at desc);
create index idx_es_open    on exam_sessions (student_id) where status = 'in_progress';

create table exam_responses (
  exam_session_id uuid not null references exam_sessions(id) on delete cascade,
  question_id     uuid not null references questions(id) on delete restrict,
  part_key        text not null default '',
  raw_answer      text,
  is_correct      boolean,
  marks_awarded   smallint not null default 0,
  max_marks       smallint not null,
  flagged         boolean not null default false,
  answered_at     timestamptz,
  primary key (exam_session_id, question_id, part_key)
);
```

> **Rev 2 note.** `exam_sessions` still carries **no `predicted_grade`** and **no `integrity_alerts` / `lockdown_log`**. The projection now exists, but it lives in `grade_projections` (§3.27) as an append-only, evidence-carrying, versioned series — not as a column on a session, which is the prototype's design and the one blueprint §J.12 rules 1, 2 and 4 prohibit. Lockdown and proctoring remain refused (blueprint §D.7): disproportionate surveillance of minors, unenforceable in a browser, and unnecessary because a student who games a simulation degrades only their own reading.
>
> **`blueprint_ok`** records whether the item set was materialised to the official structure — per-module counts, per-topic Paper 01 allocation, and the 30/40/30 CK/AK/R split. **A session with `blueprint_ok = false` is still usable practice but is excluded from the readiness model** (§42.2), because a non-conformant paper is not a rehearsal. Content starvation is the usual cause, and the exclusion is what stops a thin bank quietly producing flattering readiness.

### 3.21 Progress tables

```sql
create table student_skill_mastery (
  student_id        uuid not null references profiles(id) on delete cascade,
  skill_id          uuid not null references skills(id) on delete cascade,
  score             numeric(5,2),                 -- 0–100, null until evidence floor met
  raw_score         numeric(5,2) not null default 0,
  confidence        numeric(4,3) not null default 0,   -- 0–1 (§9.11)
  coverage_cap      numeric(5,2) not null default 100,
  attempts_count    integer not null default 0,
  distinct_questions integer not null default 0,
  correct_count     integer not null default 0,
  bands_seen        smallint[] not null default '{}',
  last_attempt_at   timestamptz,
  last_correct_at   timestamptz,
  decayed_at        timestamptz,
  updated_at        timestamptz not null default now(),
  primary key (student_id, skill_id)
);
create index idx_ssm_student_score on student_skill_mastery (student_id, score);
create index idx_ssm_stale on student_skill_mastery (last_attempt_at) where score is not null;

create table student_topic_mastery (          -- derived rollup, refreshed by trigger + nightly job
  student_id      uuid not null references profiles(id) on delete cascade,
  topic_id        uuid not null references topics(id) on delete cascade,
  score           numeric(5,2),
  confidence      numeric(4,3) not null default 0,
  attempts_count  integer not null default 0,
  skills_started  smallint not null default 0,
  skills_total    smallint not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (student_id, topic_id)
);

create table student_daily_usage (            -- server-authoritative free-tier counter (D-09)
  student_id        uuid not null references profiles(id) on delete cascade,
  usage_date        date not null,
  questions_served  smallint not null default 0,
  questions_answered smallint not null default 0,
  sessions_started  smallint not null default 0,
  primary key (student_id, usage_date)
);
create index idx_sdu_date on student_daily_usage (usage_date);

create table student_bookmarks (
  student_id  uuid not null references profiles(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (student_id, question_id)
);
```

### 3.22 Commerce tables

```sql
create table entitlements (
  id                    uuid primary key default gen_random_uuid(),
  student_id            uuid not null references profiles(id) on delete cascade,
  tier                  entitlement_tier not null default 'free',
  source                entitlement_source not null default 'default',
  status                entitlement_status not null default 'active',
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  grace_until           timestamptz,
  auto_renewing         boolean not null default false,
  platform_product_id   text,                       -- 'edmar_premium_monthly'
  platform_purchase_token text,
  platform_order_id     text,
  granted_by            uuid references profiles(id),
  grant_reason          text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create unique index uq_ent_active on entitlements (student_id) where status in ('active','grace','on_hold');
create unique index uq_ent_token  on entitlements (platform_purchase_token) where platform_purchase_token is not null;
create index idx_ent_expiring on entitlements (current_period_end) where status = 'active';

create table subscription_events (              -- immutable ledger of every store notification
  id                 bigint generated always as identity primary key,
  entitlement_id     uuid references entitlements(id) on delete set null,
  student_id         uuid references profiles(id) on delete set null,
  provider           text not null default 'google_play',
  event_type         text not null,             -- SUBSCRIPTION_PURCHASED, RENEWED, CANCELED, …
  purchase_token     text,
  raw_payload        jsonb not null,
  signature_verified boolean not null default false,
  processed_at       timestamptz,
  error              text,
  created_at         timestamptz not null default now()
);
create index idx_se_token on subscription_events (purchase_token);
create index idx_se_unprocessed on subscription_events (created_at) where processed_at is null;
```

### 3.23 Operations tables

```sql
create table audit_log (                        -- append-only; no UPDATE/DELETE policy exists
  id           bigint generated always as identity primary key,
  actor_id     uuid references profiles(id) on delete set null,
  actor_role   app_role,
  action       text not null,                   -- 'question.publish', 'role.grant', 'entitlement.manual'
  entity_type  text not null,
  entity_id    text not null,
  before       jsonb,
  after        jsonb,
  reason       text,
  ip_hash      text,                            -- sha256(ip + salt); never the raw address
  created_at   timestamptz not null default now()
);
create index idx_al_entity on audit_log (entity_type, entity_id, created_at desc);
create index idx_al_actor  on audit_log (actor_id, created_at desc);

create table analytics_events (
  id          bigint generated always as identity primary key,
  student_id  uuid references profiles(id) on delete cascade,
  session_id  uuid,
  event_name  text not null,
  event_props jsonb not null default '{}',
  app_version text,
  platform    text check (platform in ('android','ios','web')),
  occurred_at timestamptz not null,
  created_at  timestamptz not null default now()
);
create index idx_ae_name_time on analytics_events (event_name, occurred_at desc);
create index idx_ae_student   on analytics_events (student_id, occurred_at desc);

create table content_jobs (
  id             uuid primary key default gen_random_uuid(),
  job_type       text not null,     -- 'extract','classify','generate_variants','validate','embed','render_math','import_legacy'
  status         job_status not null default 'queued',
  params         jsonb not null default '{}',
  source_path    text,
  requested_by   uuid references profiles(id),
  estimated_cost_usd numeric(10,4),
  actual_cost_usd    numeric(10,4),
  items_total    integer not null default 0,
  items_done     integer not null default 0,
  items_failed   integer not null default 0,
  result         jsonb,
  error          text,
  started_at     timestamptz,
  finished_at    timestamptz,
  created_at     timestamptz not null default now()
);
create index idx_cj_status on content_jobs (status, created_at);

create table ai_generations (                   -- provenance for every AI-touched artefact (I-5)
  id                  uuid primary key default gen_random_uuid(),
  job_id              uuid references content_jobs(id) on delete set null,
  question_id         uuid references questions(id) on delete cascade,
  question_version_id uuid references question_versions(id) on delete cascade,
  stage               text not null,            -- 'extract','classify','map','solution','explanation','variant','duplicate'
  provider            text not null,
  model               text not null,
  prompt_name         text not null,
  prompt_version      text not null,
  input_tokens        integer,
  output_tokens       integer,
  cost_usd            numeric(10,6),
  confidence          numeric(3,2),
  raw_output          jsonb,
  accepted            boolean,
  created_at          timestamptz not null default now()
);
create index idx_ag_question on ai_generations (question_id);
create index idx_ag_prompt   on ai_generations (prompt_name, prompt_version, created_at desc);
create index idx_ag_cost     on ai_generations (created_at) include (cost_usd);

create table app_config (                       -- server-tunable values, no app release needed
  key          text primary key,
  value        jsonb not null,
  description  text,
  updated_by   uuid references profiles(id),
  updated_at   timestamptz not null default now()
);
```

Seeded `app_config` keys: `free_daily_question_limit` (default `10`), `cooldown_days_default` (`30`), `cooldown_days_incorrect` (`7`), `mastery_evidence_floor` (`5`), `mastery_full_weight_at` (`15`), `session_max_questions` (`20`), `content_version` (`1`), `ai_monthly_cap_usd` (`400`), `duplicate_cosine_threshold` (`0.92`).


### 3.25 `diagnostic_sessions` — **new in Rev 2**

The diagnostic is a `practice_sessions` row with `mode = 'diagnostic'` plus this satellite carrying the things a practice session has no reason to know.

```sql
create table diagnostic_sessions (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references profiles(id) on delete cascade,
  practice_session_id uuid not null references practice_sessions(id) on delete cascade,
  syllabus_id        uuid not null references syllabus_versions(id),
  target_items       smallint not null default 22 check (target_items between 15 and 30),
  items_served       smallint not null default 0,
  items_answered     smallint not null default 0,
  modules_covered    smallint not null default 0,
  topics_covered     smallint not null default 0,
  walk_log           jsonb not null default '[]',  -- deterministic record of the difficulty walk
  coverage_map       jsonb,                         -- {topicId: mastery_band}, written at completion
  status             session_status not null default 'in_progress',
  started_at         timestamptz not null default now(),
  completed_at       timestamptz,
  abandoned_at       timestamptz
);
create index idx_ds_student on diagnostic_sessions (student_id, started_at desc);
create unique index idx_ds_open on diagnostic_sessions (student_id) where status = 'in_progress';
```

`walk_log` is what makes the adaptive selection auditable: every decision the walk made, the running performance it made it on, and the band it moved to. Without it the diagnostic is a black box, and blueprint I-6 requires that it not be. It is also what allows a diagnostic to be **replayed** against a changed rule set during calibration work.

A diagnostic may be abandoned and resumed; partial evidence is recorded and used at reduced confidence, because a 20-minute commitment that must be completed in one sitting will be abandoned by a large share of students and that partial evidence is still worth having.

### 3.26 `readiness_snapshots` — **new in Rev 2** (append-only, D-19)

```sql
create table readiness_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references profiles(id) on delete cascade,
  computed_at         timestamptz not null default now(),
  as_of               date not null,                    -- the date the computation was anchored to
  sitting_year        smallint,                         -- the sitting the reading is measured against
  sitting_month       sitting_month,                    -- (from profiles.exam_sitting_*, copied at
                                                        --  computation time so history stays meaningful
                                                        --  if the student changes their target)
  index_value         numeric(5,2),                     -- 0–100, NULL when withheld
  confidence          confidence_level not null,
  withheld_reason     withheld_reason,                  -- non-null iff index_value is null
  weighted_mastery    numeric(5,2) not null default 0,
  coverage_ratio      numeric(5,4) not null default 0,  -- share of exam weight with evidence
  simulation_count    smallint not null default 0,
  simulation_delta    numeric(5,2),                     -- simulation minus practice, the honest gap
  attempts_considered integer not null default 0,
  distinct_questions  integer not null default 0,
  inputs              jsonb not null default '{}',      -- every term, for reproduction
  model_version       text not null,                    -- e.g. 'readiness-1.0.0'
  trigger_source      text not null                     -- 'attempt' | 'simulation' | 'nightly' | 'manual'
);
create index idx_rs_student on readiness_snapshots (student_id, computed_at desc);
create index idx_rs_model on readiness_snapshots (model_version, computed_at);
```

**Why append-only rather than a column on `profiles`.** Three reasons, all load-bearing: the trend is the artefact students actually read (blueprint §J.11), the back-test in §42.6 needs the reading *as it stood eight weeks out* rather than as it stands now, and a recalibration must be evaluable against history. A mutable column would destroy all three, and it is the design the prototype used.

Snapshots are written on every attempt — the computation is cheap and in-transaction (D-18) — with a coalescing rule: if the most recent snapshot for a student is under 60 seconds old **and** carries the same `model_version` and the same `index_value` to 2dp, it is updated in place rather than appended. This keeps a 60-question simulation from writing 60 near-identical rows without losing any real movement.

### 3.27 `grade_projections` — **new in Rev 2** (append-only, D-19, D-20)

```sql
create table grade_projections (
  id                 uuid primary key default gen_random_uuid(),
  student_id         uuid not null references profiles(id) on delete cascade,
  readiness_id       uuid not null references readiness_snapshots(id) on delete cascade,
  computed_at        timestamptz not null default now(),
  state              projection_state not null,
  band_low           smallint check (band_low between 1 and 6),   -- NULL when withheld
  band_high          smallint check (band_high between 1 and 6),  -- NULL when withheld
  confidence         confidence_level not null,
  withheld_reason    withheld_reason,
  weeks_to_sitting   smallint,
  evidence           jsonb not null default '{}',   -- counts + which gate conditions passed
  inputs             jsonb not null default '{}',   -- readiness, trend, sim delta, coverage
  model_version      text not null,                 -- e.g. 'projection-1.0.0'
  disclosure_version text not null,                 -- the wording shown with this band
  constraint band_order check (band_low is null or band_high is null or band_low <= band_high),
  constraint issued_has_band check (
    (state = 'issued'   and band_low is not null and band_high is not null
                        and confidence <> 'none' and withheld_reason is null) or
    (state = 'withheld' and band_low is null and band_high is null
                        and withheld_reason is not null)
  )
);
create index idx_gp_student on grade_projections (student_id, computed_at desc);
create index idx_gp_backtest on grade_projections (model_version, weeks_to_sitting)
  where state = 'issued';
```

**The `issued_has_band` constraint is the database's enforcement of blueprint I-7.** A projection cannot physically exist without both bounds and a confidence, and a withheld one cannot exist without a machine-readable reason. This is deliberate belt-and-braces alongside D-20: the function refuses to construct an ungated band, and the schema refuses to store one.

`disclosure_version` records which wording the student was shown, so that a change to the disclosure text is itself auditable — which matters the first time a projection is disputed.

### 3.28 `student_outcomes` — **new in Rev 2**, for the back-test

```sql
create table student_outcomes (
  student_id      uuid primary key references profiles(id) on delete cascade,   -- one sitting per student
  sitting_year    smallint not null,
  sitting_month   sitting_month not null,
  reported_grade  smallint not null check (reported_grade between 1 and 6),
  reported_at     timestamptz not null default now(),
  consent_version text not null,        -- consent captured at the point of reporting
  source          text not null default 'student_reported'
);
```

Self-reported, **volunteered, and consented at the point of reporting** — never inferred, never purchased, never solicited from schools. This table is small, slow to fill, and the single most valuable table in the database for the survival of the projection feature (§42.6). It is also the table with the strictest RLS: a student may insert and delete their own row and read it; no admin role may read an individual row, only aggregates through the calibration view (§42.6), because an individual's real grade is the most sensitive datum EdMar will ever hold.

### 3.24 Tables deliberately **not** created, and why

| Proposed                                       | Verdict     | Reason                                                                                                                                                                              |
| ---------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `explanations`                                 | Not created | 1:1 with `question_versions`, always co-fetched, no independent lifecycle. Adds a join to the hottest path                                                                          |
| `generated_questions`                          | Not created | Generation is an attribute (`provenance` + `ai_generations`), not a distinct entity. A separate table would fork every content query and every RLS policy                           |
| `answers` (separate from attempts)             | Not created | An answer has no existence apart from the attempt that produced it. Merging avoids a 1:1 join on the highest-volume table                                                           |
| `students` (separate from `profiles`)          | Not created | The prototype split these; it produces a mandatory join on every request and two identity sources. One `profiles` table with a `role` column is correct at this scale               |
| `subscriptions` (separate from `entitlements`) | Not created | Entitlement is what the application enforces; the store subscription is one _source_ of it. Keeping one table means school licences and manual grants need no new code path (§23.3) |
| `ai_coaches`, `coach_personalities`            | Not created | No runtime AI (§0.4 conflict 3)                                                                                                                                                     |
| `leaderboards`, `xp_ledger`, `streaks`         | Not created | Refused in blueprint D.7                                                                                                                                                            |
| `students.predicted_grade` (a column)          | Not created | **Rev 2:** the projection exists but as an append-only evidence-carrying series (`grade_projections`), never as a mutable point estimate on a row. See D-19                          |
| `readiness_current` (a materialised current value) | Not created | The latest `readiness_snapshots` row *is* the current value; a second copy is a cache-invalidation bug waiting to happen and would drift from the trend it is meant to summarise |
| `teacher_classes`, `class_members`             | Not created | Teacher/class monitoring is V2 (blueprint §D.4). Creating the tables early invites the RLS surface early, which is exactly what keeping MVP's authorisation model simple depends on |
| Separate `topics`/`subtopics` per subject      | Not created | The taxonomy is already subject-rooted; adding a subject adds rows, not tables (§F.7)                                                                                               |

---

## 4. DATABASE RELATIONSHIPS (ERD)

```mermaid
erDiagram
    auth_users            ||--|| profiles                  : "extends"
    profiles              ||--o{ admin_role_grants         : "granted"
    profiles              ||--o{ practice_sessions         : "starts"
    profiles              ||--o{ exam_sessions             : "starts"
    profiles              ||--o{ attempts                  : "creates"
    profiles              ||--o{ student_skill_mastery     : "accumulates"
    profiles              ||--o{ student_topic_mastery     : "accumulates"
    profiles              ||--o{ student_daily_usage       : "consumes"
    profiles              ||--o{ student_bookmarks         : "saves"
    profiles              ||--o{ entitlements              : "holds"
    profiles              ||--o{ question_reports          : "files"
    profiles              ||--o{ question_reviews          : "reviews"
    profiles              ||--o{ audit_log                 : "acts"

    subjects              ||--o{ syllabus_versions         : "has"
    syllabus_versions     ||--o{ modules                   : "contains"
    syllabus_versions     ||--o{ topics                    : "contains"
    syllabus_versions     ||--o{ specific_objectives       : "contains"
    modules               ||--o{ topics                    : "groups"
    topics                ||--o{ subtopics                 : "groups"
    topics                ||--o{ specific_objectives       : "defines"
    subtopics             ||--o{ specific_objectives       : "presents"
    specific_objectives   ||--o{ skill_objectives          : "served by"
    skills                ||--o{ skill_objectives          : "serves"
    skills                ||--o{ skill_prerequisites       : "requires"
    specific_objectives   ||--o{ objective_mappings        : "maps"

    questions             ||--o{ question_versions         : "versions"
    questions             ||--|| question_sources          : "originates"
    questions             ||--o{ question_objectives       : "assesses"
    questions             ||--o{ question_skills           : "exercises"
    questions             ||--o{ question_reviews          : "reviewed by"
    questions             ||--|| question_quality_metrics  : "measured by"
    questions             ||--o{ question_reports          : "reported in"
    questions             ||--o{ paper_questions           : "appears in"
    questions             ||--o{ attempts                  : "receives"
    questions             ||--o{ student_bookmarks         : "bookmarked"
    questions             ||--o{ practice_session_items    : "served in"
    questions             ||--o{ exam_responses            : "answered in"
    questions             ||--o{ questions                 : "variant of"

    specific_objectives   ||--o{ question_objectives       : "tagged by"
    skills                ||--o{ question_skills           : "tagged by"
    skills                ||--o{ common_errors             : "diagnosed by"
    skills                ||--o{ attempt_skills            : "evidenced by"
    skills                ||--o{ student_skill_mastery     : "scored in"

    question_versions     ||--o{ question_options          : "offers"
    question_versions     ||--o{ solution_steps            : "explains"
    question_versions     ||--o{ common_errors             : "anticipates"
    question_versions     ||--o{ question_assets           : "illustrates"
    question_versions     ||--|| question_payloads         : "denormalised as"
    question_versions     ||--o{ attempts                  : "answered as"
    question_versions     ||--o{ question_reviews          : "reviewed as"
    question_versions     ||--o{ ai_generations            : "produced by"
    question_options      }o--|| common_errors             : "embodies"

    papers                ||--o{ paper_questions           : "sequences"
    papers                ||--o{ exam_sessions             : "sat as"
    exam_sessions         ||--o{ exam_responses            : "records"
    exam_sessions         ||--o{ attempts                  : "produces"

    practice_sessions     ||--o{ practice_session_items    : "materialises"
    practice_sessions     ||--o{ attempts                  : "produces"
    attempts              ||--o{ attempt_skills            : "evidences"
    attempts              }o--o| common_errors             : "matches"

    entitlements          ||--o{ subscription_events       : "audited by"
    content_jobs          ||--o{ ai_generations            : "spawns"
    topics                ||--o{ student_topic_mastery     : "scored in"

    math_renders          ||--o{ question_payloads          : "embedded in"
    profiles              ||--o{ analytics_events           : "emits"
    app_config            ||--o{ practice_sessions          : "parameterises"
```

> The final three relationships are logical rather than declared foreign keys: `math_renders` is joined by content hash inside `fn_build_question_payload`, `app_config` is read by key inside functions, and `analytics_events.student_id` is nullable. They are shown so the diagram covers all 45 Rev 1 tables; the four Rev 2 assessment tables (§3.25–3.28) hang off `profiles` and, for `grade_projections`, off `readiness_snapshots`.

### 4.1 Cardinality notes that matter for implementation

- `questions → question_versions` is 1:N, but `questions.current_version_id` is a 1:1 pointer to the live one. Deferred FK, because publishing inserts the version and updates the pointer in one transaction.
- `questions → question_sources` is 1:0..1. Original questions have no row.
- `attempts.question_version_id` is **not** derivable from `question_id` — that is the whole point of versioning (D-13).
- `questions → questions` self-reference (`source_question_id`) forms variant families. `variant_family_id` is the denormalised group key so the engine can exclude siblings in one predicate (§9.8).
- `common_errors → question_options` is inverted in the ERD for readability: the FK lives on `question_options.common_error_id`.

---

## 5. ROW LEVEL SECURITY

RLS is enabled on **all 49 tables**. There is no table where RLS is "not needed". **`student_outcomes` (§3.28) carries the strictest policy in the system:** a student may insert, read and delete their own row; **no admin role may read an individual row**, only the aggregates `fn_projection_calibration` returns.

### 5.1 Helper functions (all `SECURITY DEFINER`, `search_path = public`)

```sql
-- current user's app role, from profiles; never from a client-supplied JWT claim
create or replace function auth_role() returns app_role
  language sql stable security definer set search_path = public as $$
    select coalesce((select role from profiles where id = auth.uid()), 'student'::app_role);
$$;

create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as $$
    select auth_role() in ('viewer','reviewer','curriculum_admin','content_admin','support','super_admin');
$$;

create or replace function has_role(min_role app_role) returns boolean
  language sql stable security definer set search_path = public as $$
    select array_position(
             array['student','viewer','reviewer','support','curriculum_admin','content_admin','super_admin']::app_role[],
             auth_role())
         >= array_position(
             array['student','viewer','reviewer','support','curriculum_admin','content_admin','super_admin']::app_role[],
             min_role);
$$;

-- D-08: entitlement is enforced in the database, not the client
create or replace function has_premium(uid uuid default auth.uid()) returns boolean
  language sql stable security definer set search_path = public as $$
    select exists (
      select 1 from entitlements e
      where e.student_id = uid
        and e.tier = 'premium'
        and e.status in ('active','grace')
        and (e.current_period_end is null or e.current_period_end > now()
             or (e.status = 'grace' and e.grace_until > now()))
    );
$$;
```

### 5.2 Policy matrix

`✓` = permitted, `✗` = denied, `own` = only rows belonging to the caller, `pub` = only rows whose status is `published`.

| Table                                                                    | Student S / I / U / D              | Staff (role) S / I / U / D                         | Service role  |
| ------------------------------------------------------------------------ | ---------------------------------- | -------------------------------------------------- | ------------- |
| `profiles`                                                               | own / ✗¹ / own / own²              | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `admin_role_grants`                                                      | ✗ / ✗ / ✗ / ✗                      | ✓ (super) / ✓ (super) / ✓ (super) / ✗              | full          |
| `subjects`, `syllabus_versions`, `modules`                               | ✓ (active) / ✗ / ✗ / ✗             | ✓ / ✓ (curr) / ✓ (curr) / ✗                        | full          |
| `topics`, `subtopics`, `specific_objectives`                             | ✓ (active) / ✗ / ✗ / ✗             | ✓ / ✓ (curr) / ✓ (curr) / ✗                        | full          |
| `skills`, `skill_prerequisites`, `skill_objectives`                      | ✓ (active) / ✗ / ✗ / ✗             | ✓ / ✓ (curr) / ✓ (curr) / ✓ (curr)³                | full          |
| `objective_mappings`                                                     | ✓ / ✗ / ✗ / ✗                      | ✓ / ✓ (curr) / ✓ (curr) / ✓ (curr)                 | full          |
| `questions`                                                              | **pub** / ✗ / ✗ / ✗                | ✓ / ✓ (rev) / ✓ (rev) / ✗                          | full          |
| `question_versions`                                                      | **pub⁴** / ✗ / ✗ / ✗               | ✓ / ✓ (rev) / ✓ (rev)⁵ / ✗                         | full          |
| `question_options`, `solution_steps`, `common_errors`, `question_assets` | **pub⁴** / ✗ / ✗ / ✗               | ✓ / ✓ (rev) / ✓ (rev) / ✓ (rev)                    | full          |
| `math_renders`                                                           | ✓ / ✗ / ✗ / ✗                      | ✓ / ✗ / ✗ / ✗                                      | full          |
| `question_objectives`, `question_skills`                                 | **pub⁴** / ✗ / ✗ / ✗               | ✓ / ✓ (rev) / ✓ (rev) / ✓ (rev)                    | full          |
| `question_sources`                                                       | **pub⁴** / ✗ / ✗ / ✗               | ✓ / ✓ (rev) / ✓ (rev) / ✗                          | full          |
| **`question_payloads`**                                                  | **pub + entitlement⁶** / ✗ / ✗ / ✗ | ✓ / ✗ / ✗ / ✗                                      | full          |
| `question_reviews`                                                       | ✗ / ✗ / ✗ / ✗                      | ✓ / ✓ (rev) / ✗ / ✗                                | full          |
| `question_quality_metrics`                                               | ✗ / ✗ / ✗ / ✗                      | ✓ / ✗ / ✗ / ✗                                      | full          |
| `question_reports`                                                       | own / own⁷ / ✗ / ✗                 | ✓ / ✗ / ✓ (rev) / ✗                                | full          |
| `papers`                                                                 | **pub** / ✗ / ✗ / ✗                | ✓ / ✓ (content) / ✓ (content) / ✗                  | full          |
| `paper_questions`                                                        | **pub⁸** / ✗ / ✗ / ✗               | ✓ / ✓ (content) / ✓ (content) / ✓ (content)        | full          |
| `practice_sessions`                                                      | own / ✗⁹ / own¹⁰ / ✗               | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `practice_session_items`                                                 | own⁸ / ✗ / ✗ / ✗                   | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| **`attempts`**                                                           | own / ✗⁹ / **✗** / **✗**           | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `attempt_skills`                                                         | own⁸ / ✗ / ✗ / ✗                   | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `exam_sessions`                                                          | own / ✗⁹ / own¹⁰ / ✗               | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `exam_responses`                                                         | own⁸ / own / own¹¹ / ✗             | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `student_skill_mastery`, `student_topic_mastery`                         | own / ✗ / ✗ / ✗                    | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `student_daily_usage`                                                    | own / ✗ / ✗ / ✗                    | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `student_bookmarks`                                                      | own / own / ✗ / own                | ✓ (support+) / ✗ / ✗ / ✗                           | full          |
| `entitlements`                                                           | own / ✗ / ✗ / ✗                    | ✓ (support+) / ✓ (support+)¹² / ✓ (support+)¹² / ✗ | full          |
| `subscription_events`                                                    | ✗ / ✗ / ✗ / ✗                      | ✓ (content+) / ✗ / ✗ / ✗                           | full          |
| **`audit_log`**                                                          | ✗ / ✗ / ✗ / ✗                      | ✓ (super) / ✗ / **✗** / **✗**                      | insert only¹³ |
| `analytics_events`                                                       | ✗ / own / ✗ / ✗                    | ✓ (content+) / ✗ / ✗ / ✗                           | full          |
| `content_jobs`                                                           | ✗ / ✗ / ✗ / ✗                      | ✓ / ✓ (content) / ✓ (content) / ✗                  | full          |
| `ai_generations`                                                         | ✗ / ✗ / ✗ / ✗                      | ✓ / ✗ / ✗ / ✗                                      | full          |
| `app_config`                                                             | ✓ (whitelist)¹⁴ / ✗ / ✗ / ✗        | ✓ / ✓ (super) / ✓ (super) / ✗                      | full          |

**Notes**

1. Profile insert happens in a trigger on `auth.users` under service role, not by the client.
2. Delete is a soft delete via `fn_delete_own_account`; the RLS policy allows `update` of `deleted_at` only.
3. Curriculum deletes are permitted only where no dependent rows exist — the FK is `ON DELETE RESTRICT`, which enforces it.
4. Reachable only through a published, non-retired parent question — expressed as `exists (select 1 from questions q where q.id = ... and q.status = 'published')`.
5. `question_versions` update by staff is blocked for published rows by `trg_qv_immutable` regardless of policy.
6. **The paywall.** See 5.3.
7. Rate-limited to 20/day by `fn_report_question`, which is the only insert path.
8. Scoped through the parent row's own policy.
9. Students never insert directly. All writes go through `SECURITY DEFINER` functions (§6), so validation and idempotency cannot be bypassed.
10. Update restricted to `status` transitions `in_progress → abandoned` only.
11. Update permitted only while the parent session is `in_progress` and not expired.
12. Support may grant/extend only `source = 'manual'` entitlements; store-sourced rows are service-role only.
13. `audit_log` has an `INSERT` policy for authenticated users so `SECURITY DEFINER` functions can write, and **no `UPDATE` or `DELETE` policy for any role, including `super_admin`**. It is append-only by construction.
14. `app_config` exposes a whitelist of client-relevant keys through the view `v_public_config`; the table itself is staff-only.

### 5.3 The paywall policy, written out

This is the single most important policy in the system.

```sql
alter table question_payloads enable row level security;

create policy qp_student_read on question_payloads
for select to authenticated
using (
  exists (
    select 1 from questions q
    where q.id = question_payloads.question_id
      and q.status = 'published'
      and q.retired_at is null
  )
  and (
    is_staff()                       -- staff preview
    or has_premium()                 -- premium sees everything
    or question_payloads.is_free     -- free tier sees the free pool
  )
);
```

The daily volume limit is **not** in this policy — a policy cannot count. It is enforced in `fn_create_practice_session` (§6.4), which is the only way a student obtains question IDs. The two together mean: a free student cannot obtain more than N questions per day, and cannot read a premium payload even if they somehow learn its ID.

### 5.4 Anonymous (pre-registration) access

Onboarding shows three questions before an account exists (blueprint §C.1). Implementation: Supabase **anonymous sign-in** creates a real `auth.users` row with `is_anonymous = true`, so the same policies apply with no special case. `fn_create_practice_session` caps anonymous users at 3 questions total via `student_daily_usage`. On registration, `fn_link_anonymous_account` migrates attempts to the permanent identity.

**Rejected alternative:** a public read policy for a "sample" question set. It creates an unauthenticated content-extraction endpoint (blueprint R-13) and a second code path.

### 5.5 RLS test requirement

Every row of the matrix above is a test case in `supabase/tests/rls/`. The suite asserts both directions — that permitted operations succeed _and_ that denied operations fail with `42501`. See §27.4.

---

## 6. DATABASE FUNCTIONS

**29 functions** — the 22 specified in Rev 1 plus the seven assessment functions in §42.1. All `SECURITY DEFINER` unless noted, all with `set search_path = public`, all validating their inputs, all asserting `caller = auth.uid()` where they act on student data.

### 6.1 `fn_handle_new_user()` — trigger

**Trigger:** `after insert on auth.users`. **Purpose:** create the `profiles` row and a default free `entitlements` row atomically. **Security:** definer. **Performance:** trivial.

### 6.2 `fn_resolve_scope(p_scope_kind text, p_scope_ids uuid[], p_syllabus syllabus_code) returns uuid[]`

**Purpose:** expand any taxonomy scope down to the set of `specific_objective_id`s it covers. `module → topics → objectives`; `topic → objectives`; `subtopic → objectives`; `skill → objectives via skill_objectives`; `objective → itself`.
**Security:** `STABLE`, invoker. **Validation:** raises `invalid_parameter_value` on unknown scope kind or empty result. **Performance:** recursive CTE over ≤159 rows; sub-millisecond, and the taxonomy is small enough to be permanently in cache.

### 6.3 `fn_check_daily_allowance(p_student uuid, p_requested smallint) returns smallint`

**Purpose:** return how many questions the student may still be served today. Premium → returns `p_requested`. Free → `least(p_requested, limit - questions_served)` where `limit` is `app_config.free_daily_question_limit`; anonymous → capped at 3 lifetime.
**Security:** definer (reads `entitlements`). **Performance:** two indexed point lookups.

### 6.4 `fn_create_practice_session(...) returns jsonb` — **the core selection function (D-05)**

```
Inputs
  p_mode              practice_mode
  p_scope_kind        text
  p_scope_ids         uuid[]
  p_count             smallint         1..20
  p_difficulty_mode   text             'mixed' | 'building' | 'challenge'
  p_client_seed       bigint           optional; server generates if null
Output (jsonb)
  { session_id, delivered_count, requested_count, allowance_remaining,
    starved: bool, items: [ { position, question_id, question_version_id, option_order } ] }
Errors
  P0001 'entitlement_exhausted'   allowance is 0
  P0002 'scope_empty'             scope resolves to no objectives
  P0003 'no_questions_available'  scope has zero eligible questions
```

**Purpose:** apply the full filter chain (§9.4), materialise the session and its items, increment `student_daily_usage`, return the ordered item list.
**Security:** definer — it must read `entitlements` and write `student_daily_usage`, neither of which the student may write directly.
**Validation:** `p_count` clamped to `app_config.session_max_questions`; scope validated by `fn_resolve_scope`; caller must equal `auth.uid()`.
**Performance:** single CTE chain, target **p95 < 120 ms** at 10,000 published questions. Indexes `idx_q_published`, `idx_qo_objective`, `idx_at_student_q` carry it. The cooldown anti-join is the expensive part; it is bounded by `created_at > now() - interval '30 days'`.
**Idempotency:** if an `in_progress` session exists with identical scope created in the last 60 seconds, it is returned rather than a new one created (protects against double-tap).

### 6.5 `fn_record_attempt(...) returns jsonb`

```
Inputs
  p_client_attempt_id uuid           idempotency key
  p_question_version_id uuid
  p_session_id        uuid           nullable
  p_exam_session_id   uuid           nullable
  p_part_key          text           nullable
  p_raw_answer        text           nullable
  p_was_skipped       boolean
  p_client_is_correct boolean        nullable — recorded, never trusted
  p_duration_ms       integer
  p_client_created_at timestamptz
Output
  { attempt_id, is_correct, matched_common_error_id, discrepancy: bool, replayed: bool }
```

**Purpose:** the single write path for an attempt. Re-derives correctness server-side by calling `fn_validate_answer` (§6.6), matches a common error, inserts `attempts` + `attempt_skills`, updates the session counters and `student_daily_usage`, and fires the mastery update.
**Security:** definer. Asserts `p_question_version_id` belongs to a published question the caller is entitled to, and that the session belongs to the caller.
**Idempotency:** `insert … on conflict (client_attempt_id) do nothing returning …`; a repeat returns the original row. **This is what makes offline sync safe.**
**Discrepancy logging:** if `p_client_is_correct is distinct from is_correct`, writes an `analytics_events` row `answer_validation_discrepancy` — a non-zero rate here is a `@edmar/answer-core` bug and is alerted on (§28.6).
**Performance:** target p95 < 60 ms including the mastery trigger.

### 6.6 `fn_validate_answer(p_answer_spec jsonb, p_raw_answer text, p_part_key text) returns jsonb`

**Purpose:** the server half of D-06. Implements the same rules as `@edmar/answer-core`, in PL/pgSQL + a small `plv8`-free SQL implementation for the numeric/fraction/option cases, and delegates `expression` comparison to the precomputed `accepted_forms` list.
**Security:** `IMMUTABLE`, invoker. Pure function — no table access. **This is deliberate**: an immutable pure function can be unit-tested exhaustively and cannot be affected by data drift.
**Output:** `{ is_correct, normalised, matched_form, reason }`.
**Constraint:** it must **never** call out to anything. If a future answer type cannot be validated in-database, the correct move is to precompute more forms at authoring time, not to add a network call.

> **Implementation note.** Expression equivalence beyond the stored `accepted_forms` is _not_ attempted server-side. §10.9 explains why this is sufficient: the pipeline enumerates equivalent forms with SymPy at authoring time.

### 6.7 `fn_publish_question(p_question_id uuid, p_version_id uuid, p_note text) returns void`

**Purpose:** the only way content becomes visible to students.
**Preconditions, all raising on failure:** caller has `content_admin`; the version has an `approved` review; ≥1 `question_objectives` row and 1–3 `question_skills`; `answer_spec` validates against the JSON Schema; every referenced asset exists and has alt text ≥10 chars; every LaTeX expression has a `math_renders` row; `validation_report.status = 'passed'`.
**Effects:** builds the payload via `fn_build_question_payload`, sets `questions.status = 'published'` and `current_version_id`, stamps `published_at`, increments `app_config.content_version`, writes `audit_log`.
**Security:** definer. **Performance:** ~10 ms; runs one question at a time.

### 6.8 `fn_build_question_payload(p_version_id uuid) returns jsonb`

**Purpose:** assemble the denormalised student payload (§34.3) from versions, options, steps, common errors, assets and math renders. Called by `fn_publish_question` and by the nightly rebuild job after a `math_renders` or asset change.
**Security:** definer, `VOLATILE`. **Performance:** ~15 ms; never on the student path.

### 6.9 `fn_update_skill_mastery(p_student uuid, p_skill uuid) returns void`

**Purpose:** recompute one `student_skill_mastery` row from the attempt history (§9.11 algorithm). Called by the `attempts` insert trigger for each exercised skill.
**Security:** definer, invoker-safe. **Performance:** bounded by the recency window — it reads at most the last 60 attempts for that `(student, skill)` pair, served by `idx_at_student_time` plus `attempt_skills`. Target < 15 ms.
**Idempotent and recomputable:** running it twice yields the same value. `fn_recompute_all_mastery(p_student)` exists for algorithm changes and support fixes.

### 6.10 `fn_get_recommendation(p_student uuid) returns jsonb`

**Purpose:** the deterministic recommendation engine (§9.12). Returns one target with its reason.
**Output:** `{ scope_kind, scope_id, label, reason, mastery, available_questions }` or `null` when nothing qualifies.
**Security:** definer, `STABLE`. **Performance:** target < 80 ms; reads `student_skill_mastery` (small per student) joined to content-availability counts held in the materialised view `mv_skill_question_counts`.

### 6.11 `fn_complete_session(p_session_id uuid) returns jsonb`

**Purpose:** close a practice session; return score, duration and the **mastery deltas** the results screen shows (blueprint §C.13). Captures a before/after snapshot of the affected skills.
**Security:** definer; asserts ownership.

### 6.12 `fn_start_exam_session(p_paper_id uuid) returns jsonb` / `fn_submit_exam_session(p_exam_session_id uuid) returns jsonb`

**Purpose:** start anchors `server_started_at` and `expires_at` **server-side** (§17.3 S-15; tested by §27.6 cases 4–5) — the timer must survive backgrounding and cannot be manipulated by device clock. Submit marks every response via `fn_validate_answer`, computes `answer_marks`, writes attempts, and returns the per-topic breakdown.
**Validation on submit:** responses received after `expires_at + 60s` grace are recorded but not marked.

### 6.13 Small student-facing functions

All `SECURITY DEFINER`, all asserting caller ownership, all rate-limited via the token-bucket table (§25.7), all writing `audit_log` where they change state.

| Function                         | Inputs                                                                          | Output                           | Purpose                                                                                                                                       | Notes                                                                                                                                                                          |
| -------------------------------- | ------------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `fn_abandon_session`             | `p_session_id uuid`                                                             | `void`                           | mark an open practice session `abandoned`                                                                                                     | no-op if already terminal                                                                                                                                                      |
| `fn_save_exam_response`          | `p_exam_session_id`, `p_question_id`, `p_part_key`, `p_raw_answer`, `p_flagged` | `void`                           | upsert one exam response mid-paper                                                                                                            | **does not mark**; rejects if the session is submitted or past `expires_at` + 60 s                                                                                             |
| `fn_toggle_bookmark`             | `p_question_id uuid`                                                            | `{ bookmarked bool }`            | add/remove `student_bookmarks`                                                                                                                | idempotent                                                                                                                                                                     |
| `fn_ingest_events`               | `p_events jsonb`                                                                | `{ accepted int, rejected int }` | batch-insert `analytics_events`                                                                                                               | caps the batch at 200; drops events whose `event_name` is outside the catalogue (§24.2) rather than failing the batch                                                          |
| `fn_recompute_affected_attempts` | `p_version_id uuid`                                                             | `{ attempts int, students int }` | after a correction that changes the correct answer (§9.10), re-derive `is_correct` on affected attempts and recompute those students' mastery | **`content_admin` only.** The single place an `attempts` row is ever updated, done under service authority with a full audit record — one `audit_log` row per affected student |
| `fn_recompute_all_mastery`       | `p_student uuid`                                                                | `void`                           | full mastery recompute from the attempt log                                                                                                   | used after an algorithm change and for support fixes; must equal the incremental value (§27.5 case 9)                                                                          |
| `fn_report_question`             | `p_question_id`, `p_reason_code`, `p_detail`                                    | `{ report_id uuid }`             | file a student problem report                                                                                                                 | 20/day, 3/min                                                                                                                                                                  |
| `fn_delete_own_account`          | `p_confirm boolean`                                                             | `void`                           | soft-delete the account                                                                                                                       | sets `profiles.deleted_at`, revokes sessions, enqueues a purge job. **Does not delete attempts synchronously** — that would lock the largest table on a user action            |
| `fn_link_anonymous_account`      | `p_anon_uid uuid`                                                               | `{ migrated_attempts int }`      | migrate onboarding attempts to the permanent identity                                                                                         | asserts the anonymous user has no permanent identity already                                                                                                                   |

### 6.14 Scheduled jobs (`pg_cron`)

| Schedule       | Job                               | Purpose                                                            |
| -------------- | --------------------------------- | ------------------------------------------------------------------ |
| `*/15 * * * *` | `job_process_subscription_events` | drain unprocessed `subscription_events`                            |
| `0 * * * *`    | `job_refresh_quality_metrics`     | rebuild `question_quality_metrics`, set `flagged_reason` (§9.13)   |
| `15 2 * * *`   | `job_decay_mastery`               | apply disuse decay to skills untouched 60+ days                    |
| `30 2 * * *`   | `job_refresh_materialised_views`  | `mv_skill_question_counts`, `mv_topic_coverage`, analytics rollups |
| `0 3 * * *`    | `job_purge_deleted_accounts`      | hard-delete accounts soft-deleted ≥30 days ago                     |
| `0 4 * * 0`    | `job_rebuild_stale_payloads`      | rebuild payloads whose asset or math render changed                |

### 6.15 Functions deliberately **not** created

- **`fn_calculate_exam_score` as a separate function** — folded into `fn_submit_exam_session`; a standalone version invites being called with an unsubmitted session.
- **`fn_check_premium`** — this is `has_premium()` in §5.1, used by both RLS and functions. One implementation only.
- **Any function that calls an external service.** Postgres functions must never make network calls; that is what Edge Functions are for (§8).

---

## 7. API SPECIFICATION

### 7.1 Shape of the API

There are three interfaces, and choosing correctly between them is a design rule, not a preference:

1. **PostgREST auto-generated REST** (`/rest/v1/<table>`) — for plain reads governed entirely by RLS. Used by the mobile app for taxonomy and payload reads. No hand-written code.
2. **Postgres RPC** (`/rest/v1/rpc/<function>`) — for every student **write** and every operation needing validation, entitlement or idempotency. This is the primary API surface.
3. **Edge Functions / Next.js route handlers** — only where a server-side secret, an external service, or a webhook is genuinely required (§8).

**There is no bespoke REST API server.** Adding one would mean re-implementing RLS in application code, which is exactly the failure this architecture avoids.

### 7.2 Authentication

All calls carry `apikey: <SUPABASE_ANON_KEY>` and `Authorization: Bearer <access_token>`. Tokens are 1-hour access + rotating refresh, stored in `expo-secure-store`. Anonymous sessions carry a real token with `is_anonymous = true`.

### 7.3 Standard error envelope

Every RPC and route handler returns errors in one shape:

```json
{
  "error": {
    "code": "entitlement_exhausted",
    "message": "Daily free question limit reached.",
    "details": { "limit": 10, "used": 10, "resets_at": "2026-08-20T05:00:00Z" }
  }
}
```

| HTTP | `code` values                                                     |
| ---- | ----------------------------------------------------------------- |
| 400  | `validation_failed`, `invalid_scope`, `invalid_answer_format`     |
| 401  | `not_authenticated`, `token_expired`                              |
| 403  | `not_authorised`, `entitlement_required`, `entitlement_exhausted` |
| 404  | `not_found`                                                       |
| 409  | `session_already_completed`, `exam_already_submitted`             |
| 422  | `no_questions_available`, `scope_empty`                           |
| 402  | `purchase_not_valid`                                              |
| 429  | `rate_limited` (with `Retry-After`)                               |
| 500  | `internal_error` (never leaks a Postgres message to the client)   |

### 7.4 Student endpoints — reads (PostgREST)

| Method | Route                            | Auth     | Query params                                              | Returns               |
| ------ | -------------------------------- | -------- | --------------------------------------------------------- | --------------------- |
| GET    | `/rest/v1/topics`                | required | `syllabus_code=eq.V2027&is_active=eq.true&order=sequence` | `Topic[]`             |
| GET    | `/rest/v1/subtopics`             | required | `topic_id=eq.<uuid>`                                      | `Subtopic[]`          |
| GET    | `/rest/v1/specific_objectives`   | required | `topic_id=eq.<uuid>`                                      | `SpecificObjective[]` |
| GET    | `/rest/v1/question_payloads`     | required | `question_version_id=in.(...)`                            | `QuestionPayload[]`   |
| GET    | `/rest/v1/student_skill_mastery` | required | `select=*,skills(name)`                                   | `SkillMastery[]`      |
| GET    | `/rest/v1/student_topic_mastery` | required | —                                                         | `TopicMastery[]`      |
| GET    | `/rest/v1/attempts`              | required | `order=created_at.desc&limit=50`                          | `Attempt[]`           |
| GET    | `/rest/v1/papers`                | required | `status=eq.published&order=sitting_year.desc`             | `Paper[]`             |
| GET    | `/rest/v1/student_bookmarks`     | required | `select=*,questions(*)`                                   | `Bookmark[]`          |
| GET    | `/rest/v1/v_public_config`       | required | —                                                         | `{ key, value }[]`    |

Rate limit: 120 req/min per user (§25.7), enforced at the edge.

### 7.5 Student endpoints — writes (RPC)

| Method | Route                                     | Auth               | Body                                                                                | Returns                  |
| ------ | ----------------------------------------- | ------------------ | ----------------------------------------------------------------------------------- | ------------------------ |
| POST   | `/rest/v1/rpc/fn_create_practice_session` | required           | `{ p_mode, p_scope_kind, p_scope_ids, p_count, p_difficulty_mode, p_client_seed? }` | `SessionCreated`         |
| POST   | `/rest/v1/rpc/fn_record_attempt`          | required           | see §6.5                                                                            | `AttemptResult`          |
| POST   | `/rest/v1/rpc/fn_complete_session`        | required           | `{ p_session_id }`                                                                  | `SessionSummary`         |
| POST   | `/rest/v1/rpc/fn_abandon_session`         | required           | `{ p_session_id }`                                                                  | `void`                   |
| POST   | `/rest/v1/rpc/fn_get_recommendation`      | required           | `{}`                                                                                | `Recommendation \| null` |
| POST   | `/rest/v1/rpc/fn_start_exam_session`      | required + premium | `{ p_paper_id, p_mode }`                                                            | `ExamSessionStarted`     |
| POST   | `/rest/v1/rpc/fn_save_exam_response`      | required           | `{ p_exam_session_id, p_question_id, p_part_key, p_raw_answer, p_flagged }`         | `void`                   |
| POST   | `/rest/v1/rpc/fn_submit_exam_session`     | required           | `{ p_exam_session_id }`                                                             | `ExamResult`             |
| POST   | `/rest/v1/rpc/fn_report_question`         | required           | `{ p_question_id, p_reason_code, p_detail? }`                                       | `{ report_id }`          |
| POST   | `/rest/v1/rpc/fn_toggle_bookmark`         | required           | `{ p_question_id }`                                                                 | `{ bookmarked }`         |
| POST   | `/rest/v1/rpc/fn_link_anonymous_account`  | required           | `{ p_anon_uid }`                                                                    | `{ migrated_attempts }`  |
| POST   | `/rest/v1/rpc/fn_delete_own_account`      | required           | `{ p_confirm: true }`                                                               | `void`                   |
| POST   | `/rest/v1/rpc/fn_ingest_events`           | required           | `{ p_events: AnalyticsEvent[] }`                                                    | `{ accepted }`           |

Rate limits: `fn_create_practice_session` 30/hour; `fn_record_attempt` 600/hour; `fn_report_question` 20/day; `fn_ingest_events` 240/hour with a 200-event batch cap.

### 7.6 Admin routes (Next.js route handlers, `apps/admin/app/api/`)

These exist because they need the service-role key or an external call. Everything else in admin uses the same PostgREST/RPC surface under the admin's own token, so RLS still applies.

| Method | Route                             | Min role           | Body / params                                                    | Returns                                     |
| ------ | --------------------------------- | ------------------ | ---------------------------------------------------------------- | ------------------------------------------- |
| POST   | `/api/questions/:id/publish`      | `content_admin`    | `{ versionId, note }`                                            | `{ ok, contentVersion }`                    |
| POST   | `/api/questions/:id/suspend`      | `reviewer`         | `{ reason }`                                                     | `{ ok }`                                    |
| POST   | `/api/questions/:id/retire`       | `content_admin`    | `{ reason }`                                                     | `{ ok }`                                    |
| POST   | `/api/questions/:id/versions`     | `reviewer`         | `QuestionDraft`                                                  | `{ versionId, validation }`                 |
| POST   | `/api/questions/validate`         | `reviewer`         | `QuestionDraft`                                                  | `ValidationReport`                          |
| POST   | `/api/questions/preview`          | `reviewer`         | `QuestionDraft`                                                  | `QuestionPayload` (unsaved)                 |
| POST   | `/api/math/render`                | `reviewer`         | `{ latex, style }`                                               | `{ hash, svg, widthEx, heightEx, depthEx }` |
| POST   | `/api/reviews`                    | `reviewer`         | `{ questionId, versionId, decision, note?, reasonCode?, diff? }` | `{ reviewId }`                              |
| POST   | `/api/jobs`                       | `content_admin`    | `{ jobType, params, sourcePath? }`                               | `{ jobId, estimatedCostUsd }`               |
| POST   | `/api/jobs/:id/cancel`            | `content_admin`    | —                                                                | `{ ok }`                                    |
| GET    | `/api/jobs/:id`                   | `viewer`           | —                                                                | `JobStatus`                                 |
| POST   | `/api/curriculum/import`          | `curriculum_admin` | taxonomy seed JSON                                               | `{ inserted, updated, skipped, errors[] }`  |
| POST   | `/api/papers/:id/publish`         | `content_admin`    | —                                                                | `{ ok }`                                    |
| POST   | `/api/content/withdraw-by-rights` | `super_admin`      | `{ rightsStatus, reason }`                                       | `{ withdrawn }`                             |
| GET    | `/api/analytics/overview`         | `viewer`           | `?from&to`                                                       | `AnalyticsOverview`                         |
| POST   | `/api/users/:id/entitlement`      | `support`          | `{ tier, until, reason }`                                        | `{ ok }`                                    |
| POST   | `/api/users/:id/export`           | `support`          | —                                                                | `{ downloadUrl }` (signed, 1 h)             |
| GET    | `/api/audit`                      | `super_admin`      | `?entityType&entityId&actorId&from&to`                           | `AuditEntry[]`                              |

All admin routes: validate the body with Zod, check the role **server-side** (never from a client claim), write `audit_log`, and return the §7.3 envelope on failure. Rate limit 300/min per admin.

### 7.7 What is deliberately not an endpoint

- **No `GET /questions` list for students.** Questions are reachable only through a materialised session (blueprint §O.6). This is the primary content-extraction defence.
- **No client-callable "check answer" endpoint.** Validation is local (D-06); `fn_record_attempt` re-derives it as a side effect of recording. A separate check endpoint would be a free oracle for scraping answers.
- **No AI endpoint of any kind reachable by the mobile app.**

---

## 8. SUPABASE EDGE FUNCTIONS

Six functions. The bar for creating one: _it needs a secret the client cannot hold, an external network call, or a webhook receiver._ Everything else is a database function.

### 8.1 `play-rtdn` — Google Play Real-Time Developer Notifications

| Field          | Value                                                                                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**    | HTTP POST from Google Cloud Pub/Sub push subscription                                                                                                                                 |
| **Auth**       | **No JWT** (`verify_jwt = false`). Authenticated by validating the Pub/Sub OIDC token against Google's certs **and** a shared secret in the path                                      |
| **Input**      | Pub/Sub envelope containing a base64 `RealTimeDeveloperNotification`                                                                                                                  |
| **Output**     | `204` always, after persisting. Never signals failure to Google in a way that stops redelivery of genuinely unprocessed events                                                        |
| **Secrets**    | `GOOGLE_SERVICE_ACCOUNT_JSON`, `PLAY_PACKAGE_NAME`, `RTDN_SHARED_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`                                                                                 |
| **External**   | Google Play Developer API (`purchases.subscriptionsv2.get`) to fetch authoritative state                                                                                              |
| **Logic**      | Insert raw into `subscription_events` → verify → fetch canonical subscription → upsert `entitlements` → mark processed. **Idempotent on `(purchase_token, event_type, occurred_at)`** |
| **Errors**     | Any failure leaves `processed_at` null; `job_process_subscription_events` retries with backoff. Poison messages alert after 5 attempts                                                |
| **Rate limit** | None (Google controls the rate); a 100 req/s circuit breaker guards against loops                                                                                                     |

### 8.2 `verify-purchase` — client-initiated purchase confirmation

| Field          | Value                                                                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**    | HTTPS from the mobile app immediately after Play Billing reports a purchase                                                                                                                                                               |
| **Auth**       | JWT required; acts on `auth.uid()` only                                                                                                                                                                                                   |
| **Input**      | `{ purchaseToken, productId }`                                                                                                                                                                                                            |
| **Output**     | `{ tier, status, currentPeriodEnd }`                                                                                                                                                                                                      |
| **Secrets**    | `GOOGLE_SERVICE_ACCOUNT_JSON`, `SUPABASE_SERVICE_ROLE_KEY`                                                                                                                                                                                |
| **Logic**      | Server-side verification against the Play Developer API. **The client's claim is never trusted.** Acknowledges the purchase, upserts the entitlement, writes `audit_log`. Exists so entitlement is immediate rather than waiting for RTDN |
| **Rate limit** | 10/hour per user                                                                                                                                                                                                                          |

### 8.3 `pipeline-dispatch` — start and supervise content jobs

| Field        | Value                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**  | HTTPS from the admin console; and `pg_cron` for the queue drain                                                                                                                     |
| **Auth**     | JWT + `content_admin`                                                                                                                                                               |
| **Input**    | `{ jobType, params, sourcePath? }`                                                                                                                                                  |
| **Output**   | `{ jobId, estimatedCostUsd, status }`                                                                                                                                               |
| **Secrets**  | `SUPABASE_SERVICE_ROLE_KEY`, `PIPELINE_WORKER_URL`, `PIPELINE_WORKER_TOKEN`                                                                                                         |
| **External** | The pipeline worker (a container, not an Edge Function — extraction and SymPy exceed Edge limits)                                                                                   |
| **Logic**    | Estimate cost → check `ai_monthly_cap_usd` and the 80 % circuit breaker → insert `content_jobs` → signal the worker → return. **Refuses to enqueue when the cap would be exceeded** |
| **Errors**   | Cap exceeded → `403 ai_budget_exceeded`. Worker unreachable → job stays `queued`                                                                                                    |

> **AI provider keys are not held by this function.** It only dispatches. The keys live with the worker, which has no inbound route from any client.

### 8.4 `publish-question` — transactional publish with side effects

| Field       | Value                                                                                                                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger** | HTTPS from the admin console                                                                                                                                                                         |
| **Auth**    | JWT + `content_admin`                                                                                                                                                                                |
| **Input**   | `{ questionId, versionId, note }`                                                                                                                                                                    |
| **Output**  | `{ ok, contentVersion }`                                                                                                                                                                             |
| **Logic**   | Calls `fn_publish_question`, then performs the non-transactional side effects Postgres should not do: copy assets from `draft-assets` to the public `question-assets` bucket, and purge the CDN path |
| **Secrets** | `SUPABASE_SERVICE_ROLE_KEY`                                                                                                                                                                          |

### 8.5 `report-question` — abuse-controlled report intake

| Field          | Value                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**    | HTTPS from the mobile app                                                                                                                                                   |
| **Auth**       | JWT                                                                                                                                                                         |
| **Input**      | `{ questionId, questionVersionId, reasonCode, detail?, studentAnswer? }`                                                                                                    |
| **Output**     | `{ reportId }`                                                                                                                                                              |
| **Logic**      | Calls `fn_report_question`; additionally, when a question crosses 5 open reports in 24 h, **auto-suspends it** and notifies admin. This is the fast path for blueprint R-03 |
| **Rate limit** | 20/day per user, 3/minute                                                                                                                                                   |

### 8.6 `account-export` — data export

| Field          | Value                                                                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Trigger**    | HTTPS from mobile (self-service) or admin (support request)                                                                                                             |
| **Auth**       | JWT; self only, or `support` role                                                                                                                                       |
| **Output**     | `{ downloadUrl }` — signed Storage URL, 1-hour expiry                                                                                                                   |
| **Logic**      | Assembles profile, attempts, mastery and entitlement history as JSON; writes to a private bucket; returns a signed URL. Required by Play policy and data-protection law |
| **Rate limit** | 2/day per user                                                                                                                                                          |

### 8.7 Rejected Edge Functions

| Proposed                 | Why not                                                           |
| ------------------------ | ----------------------------------------------------------------- |
| `get-practice-questions` | `fn_create_practice_session` does it inside RLS with no extra hop |
| `check-answer`           | Validation is local (D-06); an endpoint would be an answer oracle |
| `calculate-mastery`      | A database trigger, not a network call                            |
| `ai-explain` / `ai-hint` | Violates B-6. Precompute instead (blueprint §U, step-level help)  |
| `search-questions`       | Would create the bulk-read surface §7.7 exists to prevent         |

---

## 9. QUESTION ENGINE

### 9.1 Where the engine lives

Entirely in `fn_create_practice_session` (§6.4) plus three helpers. There is no engine code in any client and no engine service. The app sends a scope and receives an ordered list.

### 9.2 Inputs and their meanings

| Input                      | Source                       | Effect                          |
| -------------------------- | ---------------------------- | ------------------------------- |
| `student_id`               | `auth.uid()`                 | cooldown, mastery, entitlement  |
| `syllabus_code`            | `profiles.syllabus_version`  | which taxonomy tree             |
| `scope_kind` + `scope_ids` | screen the student came from | which objectives                |
| `count`                    | practice setup, 5/10/20      | how many                        |
| `difficulty_mode`          | practice setup               | band distribution               |
| `mode`                     | how the session was started  | affects weighting and analytics |
| `seed`                     | server-generated, stored     | reproducible ordering           |

### 9.3 Filter chain — pseudocode

```
function create_practice_session(student, scope_kind, scope_ids, count, difficulty_mode, mode, seed):

  # ── 0. entitlement gate ────────────────────────────────────────────────
  allowance = check_daily_allowance(student, count)
  if allowance == 0: raise entitlement_exhausted
  count = min(count, allowance)

  # ── 1. resolve scope to objectives ─────────────────────────────────────
  objective_ids = resolve_scope(scope_kind, scope_ids, student.syllabus_code)
  if objective_ids is empty: raise scope_empty

  # ── 2. eligibility ─────────────────────────────────────────────────────
  candidates = SELECT q.id, q.difficulty_band, q.variant_family_id,
                      q.current_version_id, qp.is_free
               FROM questions q
               JOIN question_payloads qp ON qp.question_version_id = q.current_version_id
               JOIN question_objectives qo ON qo.question_id = q.id
               WHERE q.status = 'published'
                 AND q.retired_at IS NULL
                 AND qo.specific_objective_id = ANY(objective_ids)

  # ── 3. entitlement filter (belt and braces; RLS also enforces it) ───────
  if not has_premium(student):
      candidates = candidates WHERE is_free

  if candidates is empty: raise no_questions_available

  # ── 4. cooldown ────────────────────────────────────────────────────────
  #    Wrong answers return sooner than right ones. Deliberate.
  cooldown_ok = candidates WHERE NOT EXISTS (
      SELECT 1 FROM attempts a
      WHERE a.student_id = student
        AND a.question_id = candidates.id
        AND a.created_at > now() - (CASE WHEN a.is_correct
                                         THEN cfg.cooldown_days_default      -- 30d
                                         ELSE cfg.cooldown_days_incorrect    -- 7d
                                    END) * interval '1 day')

  # ── 5. graceful degradation ────────────────────────────────────────────
  #    Never pad with repeats silently. Relax, then tell the truth.
  pool = cooldown_ok
  starved = false
  if size(pool) < count:
      pool = candidates                       # relax cooldown entirely
      starved = true                          # returned to the client, shown in UI

  # ── 6. difficulty targeting ────────────────────────────────────────────
  target = difficulty_distribution(difficulty_mode, student, objective_ids)
  selected = []
  for band, wanted in target:
      band_pool = pool WHERE difficulty_band = band
      selected += weighted_sample(band_pool, wanted, seed, weights_for(band_pool, student))
  # backfill from adjacent bands if a band is short
  selected = backfill(selected, pool, count, seed)

  # ── 7. diversity ───────────────────────────────────────────────────────
  selected = dedupe_by(selected, key = variant_family_id)   # never two of a family
  selected = spread_across(selected, key = primary_objective_id)
  selected = truncate(selected, count)

  # ── 8. materialise ─────────────────────────────────────────────────────
  session = INSERT practice_sessions(student, mode, scope_kind, scope_ids,
                                     difficulty_mode, count, size(selected), seed)
  for i, q in enumerate(shuffle(selected, seed)):
      INSERT practice_session_items(session.id, i, q.id, q.current_version_id,
                                    option_order = seeded_option_order(q, seed, i))
  UPSERT student_daily_usage(student, today) SET questions_served += size(selected)

  return { session_id, items, delivered_count, starved, allowance_remaining }
```

### 9.4 Difficulty distribution

```
function difficulty_distribution(mode, student, objective_ids):
    case mode:
      'mixed':      return { 1:20%, 2:30%, 3:30%, 4:15%, 5:5% }      # approximates a real paper
      'challenge':  return { 4:60%, 5:40% }
      'building':
          # centre on one band BELOW demonstrated level, then climb
          level = demonstrated_band(student, objective_ids)           # 1..5, default 2
          start = max(1, level - 1)
          return ramp(start, count)      # e.g. start 2 → [2,2,3,3,3,4,4,4,5,5]

function demonstrated_band(student, objective_ids):
    # highest band at which the student's recent accuracy across these
    # objectives' skills is >= 70%, from student_skill_mastery + attempts
    # Default 2 when there is no evidence.
```

### 9.5 Selection weights

Within a band, sampling is weighted, not uniform:

```
function weights_for(pool, student):
    for q in pool:
        w = 1.0
        w *= 1 + 2.0 / (1 + q.total_attempts)         # favour under-exposed questions
        if q.exercises_a_recent_misconception(student): w *= 2.5
        if q.never_attempted_by(student):               w *= 1.4
        if q.previously_incorrect_by(student):          w *= 1.8   # spaced return
        if q.quality_flagged:                           w *= 0.2   # de-emphasise, don't hide
        yield w
```

`total_attempts` comes from `question_quality_metrics`, which is refreshed hourly — stale by up to an hour, which is irrelevant for a weighting.

### 9.6 Randomisation and reproducibility

`seed = hash(student_id, session_id)` when not supplied. Every random choice — sampling, ordering, MCQ option order — derives from it via `setseed()` inside the function's transaction. Consequences: a support engineer can regenerate exactly what a student saw; a resumed session is identical; a bug report is reproducible.

MCQ option order is computed once at session creation and stored in `practice_session_items.option_order`, **not** recomputed on render. Otherwise a re-render after backgrounding would reshuffle the options under the student's finger.

### 9.7 Topic / subtopic / skill filtering

All resolve through `fn_resolve_scope` to a set of objective IDs, so the engine has exactly one filtering concept. Skills cut across the tree (`skill → skill_objectives → objectives`), which is what makes cross-topic remediation possible.

### 9.8 Duplicate prevention — three layers

| Layer             | When             | Method                                                                                                                                                                             | Action                                                                                      |
| ----------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **L1 exact**      | ingestion        | `normalised_hash = sha256(canonical(stem_plain))` where canonicalisation lowercases, collapses whitespace, normalises LaTeX to canonical form, and replaces every numeral with `#` | **auto-reject**                                                                             |
| **L2 structural** | ingestion        | trigram similarity on `stem_plain` ≥ 0.85 **and** identical `answer_spec.canonical_value`                                                                                          | **auto-reject**; if answers differ → mark as **variant**, assign shared `variant_family_id` |
| **L3 semantic**   | ingestion, batch | `pgvector` cosine similarity ≥ `duplicate_cosine_threshold` (0.92)                                                                                                                 | **flag for human adjudication**, never auto-reject                                          |

At serve time, duplicates are already impossible; what the engine prevents is **variant collision** — two members of one `variant_family_id` in a single session (step 7). This is a single `DISTINCT ON` and costs nothing.

### 9.9 Past-paper vs generated selection

`questions.provenance` supports an optional filter, exposed in V1 as _"Past paper questions only"_. It is a predicate on the candidate set. Because `rights_status` is a separate column, a rights withdrawal is:

```sql
update questions set status = 'retired', retired_at = now(), retired_reason = 'rights_withdrawal'
where rights_status = 'third_party_unlicensed';
-- payloads cascade out of student view via the RLS join on questions.status
```

One statement, immediate effect, fully audited. This is why the columns are separate (§3.12).

### 9.10 Retirement, suspension, correction

| Transition              | Who                                                    | Effect on students    | Effect on history                                 |
| ----------------------- | ------------------------------------------------------ | --------------------- | ------------------------------------------------- |
| `published → suspended` | any `reviewer`, one click, no approval                 | invisible immediately | preserved                                         |
| `suspended → published` | `content_admin`                                        | restored              | —                                                 |
| `published → retired`   | `content_admin`                                        | invisible, permanent  | preserved; past attempts still count              |
| correction              | `reviewer` edits → new version → `fn_publish_question` | new version served    | old version retained; attempts still reference it |

**Correction that changes the correct answer** additionally runs `fn_recompute_affected_attempts(p_version_id)`: identifies students marked wrong under the old (incorrect) spec, recomputes their mastery, and enqueues a notification. Rare, and exactly why versioning exists.

### 9.11 Mastery algorithm — exact specification

For skill `s` and student `u`, over attempts `A` on `s` ordered newest-first:

```
CONSTANTS (app_config)
  HALF_LIFE_ATTEMPTS = 20          # recency half-life in attempts
  HALF_LIFE_DAYS     = 30          # recency half-life in days
  EVIDENCE_FLOOR     = 5           # distinct questions before a score is shown
  FULL_WEIGHT_AT     = 15          # distinct questions for full confidence
  WINDOW             = 60          # max attempts read

STEP 1 — per-attempt weight
  for i, a in enumerate(A[:WINDOW]):
      recency_n = 0.5 ** (i / HALF_LIFE_ATTEMPTS)
      recency_t = 0.5 ** (days_since(a) / HALF_LIFE_DAYS)
      recency   = min(recency_n, recency_t)
      difficulty_credit  = 0.6 + 0.2 * a.difficulty_band     # band1=0.8 … band5=1.6
      difficulty_penalty = 1.8 - 0.2 * a.difficulty_band     # band1=1.6 … band5=0.8
      guess_discount     = 1 - (1 / n_options) if a.type == 'multiple_choice' else 1.0
                                                            # 4 options → 0.75
      if a.was_skipped:            credit = 0 ; weight = recency * 1.0
      elif a.is_correct:           credit = difficulty_credit * guess_discount
                                   weight = recency * difficulty_credit
      else:                        credit = 0
                                   weight = recency * difficulty_penalty

STEP 2 — raw score
  raw = 100 * Σ(credit_i * recency_i) / Σ(weight_i)          # 0..100

STEP 3 — confidence
  distinct_q = count(distinct question_id in A)
  confidence = clamp(distinct_q / FULL_WEIGHT_AT, 0, 1)

STEP 4 — shrink toward a neutral prior while evidence is thin
  PRIOR = 50
  score_shrunk = confidence * raw + (1 - confidence) * PRIOR

STEP 5 — coverage cap
  bands = distinct difficulty_band in A
  cap = 60  if max(bands) <= 2
        75  if max(bands) == 3
        89  if max(bands) == 4
        100 if 5 in bands
  # A student who has only ever seen easy questions cannot show as Mastered.

STEP 6 — decay (nightly job)
  if days_since(last_attempt) > 60:
      score = score - 0.25 * (days_since - 60)     # ~1 point per 4 days, floored at score_shrunk*0.6

STEP 7 — publish
  if distinct_q < EVIDENCE_FLOOR: score = NULL     # UI shows "Getting started"
  else: score = min(score_shrunk_after_decay, cap)
```

**Rollup to topic:** `student_topic_mastery.score` = confidence-weighted mean of the skills linked to that topic's objectives, over skills with `score is not null`; `skills_started / skills_total` conveys coverage separately. A topic with no attempted skills is **not started**, not 0.

**Overall readiness:** examination-weight-weighted mean of topic scores, using `topics.paper01_items + topics.paper02_marks` weights. **Never labelled as a predicted grade** (blueprint R-09).

### 9.12 Recommendation engine — exact specification

```
function get_recommendation(student):
  candidates = every skill with question availability > 5 unseen questions
               for this student, in the student's syllabus tree

  for c in candidates:
      score = 0
      score += 40 * (1 - (mastery(c) ?? 0.35))            # deficit; unknown skills score 0.65
      score += 25 * exam_weight_normalised(c)             # from topics.paper01_items etc.
      score += 20 * recent_failure_factor(c)              # wrong in last 10 attempts → up to 1.0
      score += 15 * spaced_repetition_due(c)              # 1,3,7,21-day expanding interval
      score += 30 * repeated_misconception(c)             # ≥3 hits on one common_error → 1.0
      score -=  5 * skills_practised_in_last_3_sessions(c)  # diversity penalty
      score -= 50 * (available_unseen(c) < 10)            # avoid starving topics

  best = argmax(score)
  return { scope_kind: 'skill', scope_id: best.id,
           label: best.name,
           reason: reason_string(best),      # the dominant term, in one sentence
           mastery: mastery(best),
           available_questions: available_unseen(best) }
```

`reason_string` maps the dominant scoring term to fixed copy: repeated misconception → _"You've made the same slip 3 times: {misconception}."_; recent failure → _"You missed 4 of the last 5 on {skill}."_; deficit → _"{skill} is your weakest area in {topic}."_; spaced → _"Time to revisit {skill} — you last practised it {n} days ago."_ **An unexplained recommendation is ignored, so the reason is not optional.**

### 9.13 Quality monitoring rules (hourly job)

A question is `flagged_reason`-set when any holds, with ≥30 attempts from ≥20 distinct students:

| Condition                                                    | `flagged_reason`             | Meaning                                                              |
| ------------------------------------------------------------ | ---------------------------- | -------------------------------------------------------------------- |
| `accuracy < 0.15`                                            | `suspiciously_hard`          | likely a wrong stated answer, not a hard question                    |
| `accuracy > 0.97` and `difficulty_band >= 4`                 | `mis_banded_easy`            |                                                                      |
| `top_wrong_share > 0.50`                                     | `possible_wrong_answer`      | **highest priority** — half the students agree on a different answer |
| `top_wrong_share > 0.30` and no matching `common_errors` row | `undocumented_misconception` | a distractor worth capturing                                         |
| `skip_rate > 0.40`                                           | `possibly_unclear`           |                                                                      |
| `report_count >= 3`                                          | `student_reported`           |                                                                      |
| `median_seconds > 3 × band_median`                           | `possibly_unclear`           |                                                                      |

Flagging never unpublishes. Auto-suspension happens only at 5 open reports in 24 h (§8.5), because that signal is human-generated and specific.

---

## 10. ANSWER VALIDATION ENGINE

### 10.1 The rule

**No LLM participates in judging a student's answer, at authoring time or runtime.** AI may _propose_ accepted forms and common errors for a human to confirm (§10.12); it never decides correctness.

### 10.2 Where the code lives

`packages/answer-core` — one TypeScript package, consumed by:

- `apps/mobile` — the authoritative-for-display, instant, offline check
- `apps/admin` — the answer-spec test harness in the editor (§22.6)
- `apps/pipeline` — validation of generated answer specs

and mirrored by `fn_validate_answer` in Postgres (§6.6), which is the authoritative-for-record check. The two are kept in agreement by a shared fixture corpus and a property-test harness that runs both over the same 5,000 generated cases in CI (§27.3). **A divergence fails the build.**

### 10.3 Public interface

```ts
// packages/answer-core/src/index.ts — signature only; implementation is Phase 6
export function validate(input: string | string[], spec: AnswerSpec): ValidationResult;
export function normalise(input: string, profile: NormalisationProfile): string;
export function parseNumeric(input: string): Rational | Decimal | null;

export interface ValidationResult {
  isCorrect: boolean;
  normalised: string;
  matchedForm?: string; // which accepted form matched
  matchedCommonErrorKey?: string;
  reason?:
    | "exact"
    | "tolerance"
    | "equivalent_form"
    | "wrong_precision"
    | "wrong_units"
    | "not_simplified"
    | "unparseable"
    | "incorrect";
}
```

### 10.4 The `AnswerSpec` object

Stored in `question_versions.answer_spec` (JSONB), validated against `answer-spec.schema.json` by a database trigger, and by CI.

```jsonc
{
  "answerType": "numeric_dp",
  "canonicalValue": "540.00",
  "displayValue": "$540.00",
  "acceptedForms": ["540", "540.0", "540.00", "$540", "$540.00"],
  "tolerance": { "kind": "absolute", "value": 0.005 },
  "precision": { "kind": "decimal_places", "value": 2, "required": true },
  "units": { "requirement": "optional", "canonical": null, "acceptedSet": [] },
  "form": { "lowestTerms": false, "simplifiedSurd": false, "specifiedForm": null },
  "normalisation": "currency_default",
  "caseSensitive": false,
  "commonErrorValues": [
    { "key": "pct_on_selling_price", "value": "470.00" },
    { "key": "forgot_to_add", "value": "90.00" },
  ],
}
```

For `structured` questions the object is `{ "parts": { "a": AnswerSpec, "b.i": AnswerSpec, … } }`.

**The `acceptedForms` array is generated at authoring time by SymPy and confirmed by a human.** This is the load-bearing design decision of the whole validation system: it converts an open-ended equivalence problem into a closed lookup (§10.9).

### 10.5 Normalisation profiles

Applied identically in TypeScript and PL/pgSQL, before any comparison.

| Step                 | Rule                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Whitespace           | trim; collapse internal runs to one space; remove all space inside a numeric token                  |
| Thousands separators | strip `,` and thin spaces when the token is otherwise numeric                                       |
| Decimal separator    | accept `.`; accept `,` **only** when no `.` is present and the locale permits                       |
| Minus signs          | `−` (U+2212), `–`, `—` → `-`                                                                        |
| Multiplication       | `×`, `·`, `*` → `*`; implicit `2x` preserved for expressions                                        |
| Exponents            | `²`,`³`,`ⁿ` and `^` → `^`; `**` → `^`                                                               |
| Leading `+`          | stripped                                                                                            |
| Restatement          | leading `x =`, `y =`, `answer =` stripped when `spec.normalisation` permits                         |
| Currency             | leading `$`, `J$`, `US$`, `TT$` stripped into a units token                                         |
| Units                | matched against the controlled unit vocabulary; `cm2`, `cm^2`, `cm²`, `sq cm`, `square cm` → `cm^2` |
| Percent              | trailing `%` becomes a unit token, not a character                                                  |
| Case                 | lowercased unless `caseSensitive`                                                                   |

Anything the profile cannot parse yields `reason: 'unparseable'` and `isCorrect: false` — **and is logged**, because a spike in unparseable inputs on one question means the input UI is wrong for that answer type.

### 10.6 Per-type strategies

| Type                        | Strategy                                                                                                                                         | Notes                                                                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `option_id`                 | exact match on `option_key`                                                                                                                      | never on option text (text is editable)                                                                                                                                |
| `option_set`                | set equality of keys                                                                                                                             | order-independent                                                                                                                                                      |
| `boolean`                   | exact                                                                                                                                            |                                                                                                                                                                        |
| `numeric_exact`             | parse to `Rational`; exact equality                                                                                                              | integers, exact decimals                                                                                                                                               |
| `numeric_tolerance`         | `abs(v - c) <= tol` (absolute) or `abs(v-c)/abs(c) <= tol` (relative)                                                                            | authors must set explicitly; **default is not "close enough"**                                                                                                         |
| `numeric_sf` / `numeric_dp` | value within tolerance **and** the _written form_ has the required precision                                                                     | a right value at the wrong precision returns `reason: 'wrong_precision'` and specific feedback                                                                         |
| `fraction`                  | parse `a/b`, reduce, compare as `Rational`; handles `-3/4`, `3/-4`, `-(3/4)`                                                                     | if `form.lowestTerms` and input is unreduced: correct **with a note**, unless the objective is simplification, in which case incorrect with `reason: 'not_simplified'` |
| `mixed_number`              | `a b/c` → improper `Rational`                                                                                                                    |                                                                                                                                                                        |
| `ratio`                     | split on `:`; compare as a normalised integer vector; `form` may require simplest terms                                                          | `3:5` ≡ `6:10` unless simplest form required                                                                                                                           |
| `currency`                  | numeric with 2 dp, currency symbol into units                                                                                                    |                                                                                                                                                                        |
| `with_units`                | value compared per numeric rules; unit compared against `canonical` or `acceptedSet`; conversion applied only when `requirement = 'convertible'` | `12 cm²` vs `1200 mm²` correct only if declared convertible                                                                                                            |
| `coordinate`                | `(a, b)` componentwise numeric                                                                                                                   |                                                                                                                                                                        |
| `set`                       | `{…}` parsed to a set; element-wise comparison; order-independent                                                                                |                                                                                                                                                                        |
| `interval` / `inequality`   | normalise to `(op, value)` or `(lo, hi, closedness)`                                                                                             | `x > 4` ≡ `4 < x`                                                                                                                                                      |
| `matrix` / `vector`         | `[a b; c d]` or LaTeX `pmatrix` → array; elementwise numeric                                                                                     |                                                                                                                                                                        |
| `expression`                | three tiers, §10.9                                                                                                                               |                                                                                                                                                                        |
| `text`                      | normalised string equality against `acceptedForms`                                                                                               | rare; used for "name the theorem" items                                                                                                                                |
| `structured`                | each part validated independently; §10.10                                                                                                        |                                                                                                                                                                        |

### 10.7 Tolerance rules — the exact policy

1. **Every numeric spec must declare a tolerance.** The schema requires it; a missing tolerance fails validation at publish. There is no implicit default, because an implicit default is how honest students get marked wrong.
2. **Default guidance for authors:** absolute `0.5 × 10^-d` where `d` is the required decimal places; relative `0.001` for values whose magnitude varies.
3. **Intermediate rounding.** Where a question involves rounding mid-solution, the pipeline computes the answer twice — rounding at each stage and rounding only at the end — and stores the enclosing interval as a `tolerance` of kind `range`. This is how students who round early stop being punished for it.
4. **Precision is separate from tolerance.** `numeric_dp` with `required: true` means the _presentation_ must have 2 dp. `540` fails against `540.00` with `reason: 'wrong_precision'` and the message _"Correct value — the question asked for 2 decimal places."_ That is a real CSEC mark-loser and teaching it is worth more than silently accepting.
5. **Never widen tolerance to make a failing test pass.** If students legitimately arrive at a different value, the question or the solution is wrong.

### 10.8 Equivalent answers

Equivalence is **enumerated at authoring time**, not decided at runtime. `acceptedForms` is generated by the pipeline (§13.6) using SymPy:

```
for a question whose canonical answer is 3/4 and whose spec permits decimal form:
  acceptedForms = ["3/4", "0.75", ".75", "6/8"?]        # 6/8 only if lowestTerms = false
  # percentages only if the spec's units allow a percent token
```

Runtime then does normalised membership testing — O(1), deterministic, explainable, offline.

### 10.9 Algebraic expressions — three tiers

| Tier             | Where                           | Method                                                                                                                        | Handles                                         | Ships in |
| ---------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | -------- |
| **T3 authoring** | `apps/pipeline`, SymPy          | `simplify(sympify(student_form) - sympify(canonical)) == 0` over a generated candidate set; results stored in `acceptedForms` | closed, enumerable answer spaces — the majority | MVP      |
| **T1 runtime**   | `@edmar/answer-core`            | canonical-form comparison: parse with `mathjs`, sort terms, collect like terms, normalise spacing, compare string             | `2x+3` ≡ `3+2x` ≡ `2*x + 3`                     | MVP      |
| **T2 runtime**   | `@edmar/answer-core` + `mathjs` | `simplify(parse(a) - parse(b))` evaluates to zero, plus numeric spot-check at 5 random points in the domain                   | `(x+1)(x+2)` ≡ `x²+3x+2`                        | V1       |

**The numeric spot-check is the safety net:** two expressions that `simplify` cannot prove equal are additionally evaluated at five pseudo-random points; agreement to within 1e-9 at all five is accepted. Disagreement at any point is a definite rejection. This catches `mathjs` simplification gaps without ever accepting a genuinely wrong answer.

**Where ambiguity is irreducible, constrain the question instead.** `spec.form.specifiedForm = "ax^2+bx+c"` with the stem saying _"Give your answer in the form ax² + bx + c"_ — which is standard CSEC phrasing anyway. Prefer this over building a general CAS on device.

### 10.10 Structured multi-part answers

Each part carries its own `AnswerSpec`, marks, solution steps and explanation. Parts validate independently and report independently.

**Follow-through (error carried forward).** CSEC examiners award it; this system cannot fully model it. Policy:

1. Where the dependency is a stored formula, `spec.parts["b"].followThrough = { dependsOn: "a", rule: "<expression in terms of part a>" }` lets the validator re-derive part (b)'s expected value from the student's part (a) answer and mark accordingly. Implemented for simple arithmetic dependencies in V1.
2. Where it is not modelled, the results screen states plainly: _"This shows marks for final answers. A real examiner also awards method marks that we can't see."_ **Silently under-marking students and letting them conclude they are worse than they are is not acceptable** (blueprint §H.7).

### 10.11 Worked examples of the validation contract

| Question                                | `answerType` | Student input | Result                                                                                    |
| --------------------------------------- | ------------ | ------------- | ----------------------------------------------------------------------------------------- |
| Selling price after 20 % profit on $450 | `currency`   | `540`         | ✅ exact                                                                                  |
| "                                       | "            | `$540.00`     | ✅ accepted form                                                                          |
| "                                       | "            | `540.`        | ✅ after normalisation                                                                    |
| "                                       | "            | `470`         | ❌ + common error `pct_on_selling_price`                                                  |
| `3/4 + 2/5`                             | `fraction`   | `23/20`       | ✅                                                                                        |
| "                                       | "            | `1 3/20`      | ✅ mixed number → same `Rational`                                                         |
| "                                       | "            | `1.15`        | ✅ only if `acceptedForms` includes it                                                    |
| "                                       | "            | `46/40`       | ✅ with note (not lowest terms) unless the objective is simplification                    |
| `58.736` to 3 s.f.                      | `numeric_sf` | `58.7`        | ✅                                                                                        |
| "                                       | "            | `58.74`       | ❌ `wrong_precision` — _"You've rounded to 2 decimal places, not 3 significant figures."_ |
| Area of rectangle 8×5 cm                | `with_units` | `40 cm²`      | ✅                                                                                        |
| "                                       | "            | `40`          | ✅ if `units.requirement = 'optional'`, ❌ `wrong_units` if `'required'`                  |
| "                                       | "            | `40 cm`       | ❌ `wrong_units` — _"Area is measured in square units."_                                  |
| Simplify `3a + 2b + 5a − b`             | `expression` | `8a + b`      | ✅ T1                                                                                     |
| "                                       | "            | `b + 8a`      | ✅ T1 (term-sorted)                                                                       |
| "                                       | "            | `8a+1b`       | ✅ T1 after coefficient normalisation                                                     |
| Factorise `x² + 3x + 2`                 | `expression` | `(x+1)(x+2)`  | ✅ T3 stored form                                                                         |
| "                                       | "            | `(x+2)(x+1)`  | ✅ T3 stored form                                                                         |
| "                                       | "            | `x^2+3x+2`    | ❌ — the question asked to factorise; `spec.form.specifiedForm = 'factorised'`            |

### 10.12 The one place AI touches answers

Offline, at authoring time, proposing candidate `acceptedForms` and `commonErrorValues` for human confirmation. Its output is written to a draft, never to a published spec, and never consulted at runtime. See §16.9.

---

## 11. CANONICAL QUESTION JSON SCHEMA

Draft 2020-12. Lives in `packages/content-schema/schemas/`. Compiled with `ajv` at build time and used by: the pipeline (every stage output), the admin editor (before save), the publish function (via a database trigger calling a validation of the same shape), and CI over `content/golden/`.

### 11.1 `edmar-question.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schema.edmar.ai/edmar-question.schema.json",
  "title": "EdMar Canonical Question",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schemaVersion",
    "questionType",
    "provenance",
    "rightsStatus",
    "difficultyBand",
    "stemBlocks",
    "answerSpec",
    "solutionSteps",
    "curriculum",
    "status",

    "conceptsRequired",
    "strategyBlocks",
    "finalAnswerBlocks",
    "whyThisWorks",
    "commonErrors",
    "examTip",
    "quickCheck",
    "answerValidation"
  ],
  "properties": {
    "schemaVersion": { "const": "2.0.0" },
    "id": { "type": "string", "format": "uuid" },
    "legacyId": { "type": "string", "maxLength": 128 },

    "questionType": {
      "enum": [
        "multiple_choice",
        "multi_select",
        "true_false",
        "numeric",
        "expression",
        "structured"
      ]
    },
    "conceptsRequired": {
      "type": "array", "minItems": 1, "maxItems": 4,
      "items": {
        "type": "object", "additionalProperties": false,
        "required": ["objectiveId", "code", "label"],
        "properties": {
          "objectiveId": { "type": "string", "format": "uuid" },
          "code":        { "type": "string", "maxLength": 24 },
          "label":       { "type": "string", "maxLength": 120 }
        }
      }
    },
    "strategyBlocks":    { "$ref": "#/$defs/blockArray" },
    "finalAnswerBlocks": { "$ref": "#/$defs/blockArray" },
    "whyThisWorks":      { "$ref": "#/$defs/blockArray" },
    "examTip":           { "$ref": "#/$defs/blockArray" },
    "quickCheck": {
      "type": "object", "additionalProperties": false,
      "required": ["promptBlocks", "answerSpec"],
      "properties": {
        "promptBlocks": { "$ref": "#/$defs/blockArray" },
        "answerSpec":   { "$ref": "https://schema.edmar.ai/edmar-answer-spec.schema.json" },
        "assetId":      { "type": ["string", "null"], "format": "uuid" },
        "solutionNote": { "type": "string", "maxLength": 240 }
      }
    },
    "answerValidation": {
      "type": "object", "additionalProperties": false,
      "required": ["cognitiveLevel", "accuracyRule", "verification"],
      "properties": {
        "cognitiveLevel": { "enum": ["CK", "AK", "R"] },
        "methodClass":    { "type": ["string", "null"], "maxLength": 80 },
        "accuracyRule":   { "enum": ["exact","tolerance","significant_figures",
                                     "decimal_places","equivalent_form","symbolic"] },
        "verification":   { "enum": ["unverified","machine_verified","verified","disputed"] },
        "ambiguityNote":  { "type": ["string", "null"], "maxLength": 240 }
      }
    },

    "provenance": {
      "enum": [
        "past_paper",
        "past_paper_adapted",
        "original_authored",
        "ai_variant",
        "ai_authored",
        "legacy_import"
      ]
    },
    "rightsStatus": {
      "enum": ["edmar_owned", "licensed", "public_domain", "third_party_unlicensed", "unknown"]
    },
    "status": {
      "enum": [
        "draft",
        "pending_validation",
        "validating",
        "pending_review",
        "changes_requested",
        "approved",
        "published",
        "suspended",
        "retired",
        "rejected",
        "archived"
      ]
    },

    "difficultyBand": { "type": "integer", "minimum": 1, "maximum": 5 },
    "profileDimension": { "enum": ["CK", "AK", "R"] },
    "calculatorAllowed": { "type": "boolean", "default": true },
    "marks": { "type": "integer", "minimum": 1, "maximum": 20 },
    "estimatedSeconds": { "type": "integer", "minimum": 10, "maximum": 3600 },
    "isFree": { "type": "boolean", "default": false },

    "stemBlocks": { "$ref": "#/$defs/blockArray" },
    "stemPlain": { "type": "string", "minLength": 5 },

    "options": {
      "type": "array",
      "minItems": 2,
      "maxItems": 5,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["optionKey", "contentBlocks", "isCorrect"],
        "properties": {
          "optionKey": { "enum": ["A", "B", "C", "D", "E"] },
          "contentBlocks": { "$ref": "#/$defs/blockArray" },
          "contentPlain": { "type": "string" },
          "isCorrect": { "type": "boolean" },
          "commonErrorKey": { "type": "string" },
          "preserveOrder": { "type": "boolean", "default": false }
        }
      }
    },

    "answerSpec": { "$ref": "edmar-answer-spec.schema.json" },

    "solutionSteps": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["stepNo", "instruction", "contentBlocks"],
        "properties": {
          "partKey": { "type": "string" },
          "stepNo": { "type": "integer", "minimum": 1 },
          "instruction": { "type": "string", "minLength": 3, "maxLength": 300 },
          "contentBlocks": { "$ref": "#/$defs/blockArray" },
          "contentPlain": { "type": "string" },
          "marks": { "type": "integer", "minimum": 0, "maximum": 10 },
          "note": { "type": "string", "maxLength": 400 }
        }
      }
    },

    "explanation": { "type": "string", "minLength": 40, "maxLength": 900 },
    "explanationBlocks": { "$ref": "#/$defs/blockArray" },
    "hint": { "type": "string", "maxLength": 300 },

    "commonErrors": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["key", "misconception", "correctiveNote"],
        "properties": {
          "key": { "type": "string", "pattern": "^[a-z0-9_]{3,60}$" },
          "partKey": { "type": "string" },
          "wrongValue": { "type": "string" },
          "wrongOptionKey": { "enum": ["A", "B", "C", "D", "E"] },
          "misconception": { "type": "string", "minLength": 10, "maxLength": 300 },
          "correctiveNote": { "type": "string", "minLength": 10, "maxLength": 400 },
          "skillCode": { "type": "string" }
        },
        "anyOf": [{ "required": ["wrongValue"] }, { "required": ["wrongOptionKey"] }]
      }
    },

    "assets": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["role", "storagePath", "mimeType", "altText"],
        "properties": {
          "role": { "enum": ["question_figure", "solution_figure", "option_figure"] },
          "partKey": { "type": "string" },
          "storagePath": { "type": "string", "minLength": 3 },
          "mimeType": { "enum": ["image/svg+xml", "image/png", "image/webp"] },
          "widthPx": { "type": "integer", "minimum": 1 },
          "heightPx": { "type": "integer", "minimum": 1 },
          "altText": { "type": "string", "minLength": 10, "maxLength": 500 },
          "requiresColour": { "type": "boolean", "default": false },
          "sequence": { "type": "integer", "minimum": 0 }
        }
      }
    },

    "parts": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["partKey", "stemBlocks", "answerSpec", "marks"],
        "properties": {
          "partKey": { "type": "string", "pattern": "^[a-z](\\.(i|ii|iii|iv|v))?$" },
          "stemBlocks": { "$ref": "#/$defs/blockArray" },
          "answerSpec": { "$ref": "edmar-answer-spec.schema.json" },
          "marks": { "type": "integer", "minimum": 1, "maximum": 10 },
          "sequence": { "type": "integer" }
        }
      }
    },

    "curriculum": {
      "type": "object",
      "additionalProperties": false,
      "required": ["syllabusCode", "objectiveCodes"],
      "properties": {
        "syllabusCode": { "enum": ["V2018", "V2027"] },
        "objectiveCodes": {
          "type": "array",
          "minItems": 1,
          "items": { "type": "string", "pattern": "^M[123]-\\d{1,2}\\.\\d{1,2}$" }
        },
        "primaryObjectiveCode": { "type": "string" },
        "skillCodes": {
          "type": "array",
          "minItems": 1,
          "maxItems": 3,
          "items": { "type": "string", "pattern": "^[A-Z0-9_]{3,60}$" }
        },
        "subtopicCode": { "type": "string" }
      }
    },

    "source": {
      "type": "object",
      "additionalProperties": false,
      "required": ["sourceKind"],
      "properties": {
        "sourceKind": { "enum": ["past_paper", "workbook", "textbook", "authored"] },
        "sourceTitle": { "type": "string" },
        "sittingYear": { "type": "integer", "minimum": 1980, "maximum": 2040 },
        "sittingMonth": { "enum": ["january", "may_june"] },
        "paper": { "enum": ["01", "02", "031", "032"] },
        "questionNo": { "type": "integer", "minimum": 1 },
        "partLabel": { "type": "string" },
        "syllabusInForce": { "enum": ["V2018", "V2027"] },
        "pageRef": { "type": "string" }
      }
    },

    "aiProvenance": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "generated": { "type": "boolean" },
        "sourceQuestionId": { "type": "string", "format": "uuid" },
        "stages": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["stage", "provider", "model", "promptName", "promptVersion"],
            "properties": {
              "stage": {
                "enum": [
                  "extract",
                  "classify",
                  "map",
                  "answer_spec",
                  "solution",
                  "explanation",
                  "common_errors",
                  "variant",
                  "duplicate"
                ]
              },
              "provider": { "type": "string" },
              "model": { "type": "string" },
              "promptName": { "type": "string" },
              "promptVersion": { "type": "string" },
              "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
              "costUsd": { "type": "number", "minimum": 0 }
            }
          }
        }
      }
    },

    "validation": {
      "type": "object",
      "required": ["status", "checks"],
      "properties": {
        "status": { "enum": ["passed", "failed", "not_run"] },
        "checks": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["name", "result"],
            "properties": {
              "name": { "type": "string" },
              "result": { "enum": ["pass", "fail", "skip", "warn"] },
              "detail": { "type": "string" }
            }
          }
        },
        "casVerified": { "type": "boolean" },
        "normalisedHash": { "type": "string", "pattern": "^[a-f0-9]{64}$" }
      }
    },

    "review": {
      "type": "object",
      "properties": {
        "history": {
          "type": "array",
          "items": {
            "type": "object",
            "required": ["reviewerId", "decision", "at"],
            "properties": {
              "reviewerId": { "type": "string", "format": "uuid" },
              "decision": {
                "enum": ["approved", "changes_requested", "rejected", "suspended", "escalated"]
              },
              "note": { "type": "string" },
              "reasonCode": { "type": "string" },
              "at": { "type": "string", "format": "date-time" },
              "reviewSeconds": { "type": "integer" }
            }
          }
        }
      }
    }
  },

  "$defs": {
    "blockArray": {
      "type": "array",
      "minItems": 1,
      "items": { "$ref": "#/$defs/block" }
    },
    "block": {
      "type": "object",
      "required": ["type"],
      "oneOf": [
        {
          "properties": {
            "type": { "const": "text" },
            "value": { "type": "string", "minLength": 1 }
          },
          "required": ["type", "value"],
          "additionalProperties": false
        },

        {
          "properties": {
            "type": { "const": "math" },
            "latex": { "type": "string", "minLength": 1, "maxLength": 2000 },
            "style": { "enum": ["inline", "display"] },
            "renderHash": { "type": "string", "pattern": "^[a-f0-9]{64}$" },
            "alt": { "type": "string" }
          },
          "required": ["type", "latex", "style"],
          "additionalProperties": false
        },

        {
          "properties": {
            "type": { "const": "mixed" },
            "runs": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/inlineRun" } }
          },
          "required": ["type", "runs"],
          "additionalProperties": false
        },

        {
          "properties": {
            "type": { "const": "asset" },
            "storagePath": { "type": "string" },
            "altText": { "type": "string", "minLength": 10 }
          },
          "required": ["type", "storagePath", "altText"],
          "additionalProperties": false
        },

        {
          "properties": {
            "type": { "const": "table" },
            "header": { "type": "array", "items": { "type": "string" } },
            "rows": {
              "type": "array",
              "items": { "type": "array", "items": { "type": "string" } }
            },
            "caption": { "type": "string" }
          },
          "required": ["type", "rows"],
          "additionalProperties": false
        },

        {
          "properties": {
            "type": { "const": "list" },
            "ordered": { "type": "boolean" },
            "items": { "type": "array", "minItems": 1, "items": { "$ref": "#/$defs/blockArray" } }
          },
          "required": ["type", "items"],
          "additionalProperties": false
        }
      ]
    },
    "inlineRun": {
      "oneOf": [
        {
          "type": "object",
          "required": ["type", "value"],
          "additionalProperties": false,
          "properties": { "type": { "const": "text" }, "value": { "type": "string" } }
        },
        {
          "type": "object",
          "required": ["type", "latex"],
          "additionalProperties": false,
          "properties": {
            "type": { "const": "math" },
            "latex": { "type": "string" },
            "renderHash": { "type": "string" }
          }
        }
      ]
    }
  },

  "allOf": [
    {
      "if": { "properties": { "questionType": { "const": "multiple_choice" } } },
      "then": { "required": ["options"] }
    },
    {
      "if": { "properties": { "questionType": { "const": "structured" } } },
      "then": { "required": ["parts"] }
    },
    {
      "if": { "properties": { "status": { "const": "published" } } },
      "then": {
        "required": ["explanation", "validation"],
        "properties": { "validation": { "properties": { "status": { "const": "passed" } } } }
      }
    }
  ]
}
```

### 11.2 `edmar-answer-spec.schema.json`

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://schema.edmar.ai/edmar-answer-spec.schema.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["answerType", "canonicalValue", "displayValue", "acceptedForms", "normalisation"],
  "properties": {
    "answerType": {
      "enum": [
        "option_id",
        "option_set",
        "boolean",
        "numeric_exact",
        "numeric_tolerance",
        "numeric_sf",
        "numeric_dp",
        "fraction",
        "mixed_number",
        "ratio",
        "currency",
        "with_units",
        "expression",
        "coordinate",
        "set",
        "interval",
        "matrix",
        "vector",
        "text"
      ]
    },
    "canonicalValue": { "type": ["string", "array"] },
    "displayValue": { "type": "string", "minLength": 1 },
    "acceptedForms": { "type": "array", "items": { "type": "string" }, "minItems": 1 },
    "tolerance": {
      "type": "object",
      "additionalProperties": false,
      "required": ["kind"],
      "properties": {
        "kind": { "enum": ["absolute", "relative", "range", "none"] },
        "value": { "type": "number", "minimum": 0 },
        "min": { "type": "number" },
        "max": { "type": "number" }
      }
    },
    "precision": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "kind": { "enum": ["significant_figures", "decimal_places", "none"] },
        "value": { "type": "integer", "minimum": 0, "maximum": 10 },
        "required": { "type": "boolean", "default": false }
      }
    },
    "units": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "requirement": { "enum": ["none", "optional", "required", "convertible"] },
        "canonical": { "type": ["string", "null"] },
        "acceptedSet": { "type": "array", "items": { "type": "string" } }
      }
    },
    "form": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "lowestTerms": { "type": "boolean", "default": false },
        "simplifiedSurd": { "type": "boolean", "default": false },
        "simplestRatio": { "type": "boolean", "default": false },
        "specifiedForm": { "type": ["string", "null"] }
      }
    },
    "followThrough": {
      "type": "object",
      "additionalProperties": false,
      "required": ["dependsOn", "rule"],
      "properties": {
        "dependsOn": { "type": "string" },
        "rule": { "type": "string" }
      }
    },
    "normalisation": {
      "enum": [
        "default",
        "numeric_default",
        "currency_default",
        "expression_default",
        "units_default",
        "text_default"
      ]
    },
    "caseSensitive": { "type": "boolean", "default": false },
    "commonErrorValues": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["key", "value"],
        "properties": { "key": { "type": "string" }, "value": { "type": "string" } }
      }
    },
    "parts": {
      "type": "object",
      "additionalProperties": { "$ref": "edmar-answer-spec.schema.json" }
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "answerType": {
            "enum": ["numeric_tolerance", "numeric_sf", "numeric_dp", "currency", "with_units"]
          }
        }
      },
      "then": { "required": ["tolerance"] }
    },
    {
      "if": { "properties": { "answerType": { "enum": ["numeric_sf", "numeric_dp"] } } },
      "then": { "required": ["precision"] }
    },
    {
      "if": { "properties": { "answerType": { "const": "with_units" } } },
      "then": { "required": ["units"] }
    }
  ]
}
```

### 11.3 LaTeX allowlist

Enforced by `validators/latex_allowlist.py` and by the admin editor. An expression using anything outside it fails validation and cannot be published.

**Permitted:** `\frac \dfrac \tfrac \sqrt \sqrt[n] \times \div \pm \mp \cdot \le \ge \ne \approx \equiv \propto \infty \pi \theta \alpha \beta \gamma \lambda \mu \sigma \Sigma \Delta \degree \circ \angle \triangle \parallel \perp \sin \cos \tan \sin^{-1} \cos^{-1} \tan^{-1} \log \ln \exp \sum \overline \vec \overrightarrow \hat \mathbf \text \mathrm \left \right ( ) [ ] \{ \} \| \begin{pmatrix} \begin{bmatrix} \begin{array} \begin{aligned} \\ & ^ _ \cup \cap \subset \subseteq \in \notin \emptyset \varnothing \therefore \because \%`

**Forbidden and rejected:** `\input \include \def \newcommand \renewcommand \usepackage \write \catcode \expandafter \csname`, anything with `\@`, raw HTML, `\href`, and any command not on the list.

**Rationale:** a bounded command set is what makes D-01's server-side rendering reliable, makes duplicate normalisation possible, and makes it impossible for a generated expression to break the renderer.

### 11.4 Why the block model rather than a markdown string

A single `"text with $latex$ inside"` field is easier to build and produces layout defects for the life of the product: it cannot express a diagram positioned between two paragraphs, cannot carry per-expression render hashes, cannot be reliably line-wrapped on a 5.5" screen, and cannot be validated command-by-command. The block model costs one afternoon of editor work and removes an entire defect class.

### 11.5 Schema version 2.0.0 — the ten blocks (Rev 2)

`schemaVersion` moves to `2.0.0`, and the eight new required properties above are why. This is a **breaking** schema change, and it is deliberate: a question that predates it cannot be published under Rev 2 rules, and the migration path is authoring, not defaulting.

**Do not add default values for the new blocks.** A defaulted `examTip` of `""` satisfies the schema and defeats D-17 — the whole point is that publication is refused until a human has written them. Legacy records imported under §12 land at `pending_review` with the new blocks empty and are completed by a reviewer, which is the intended cost and the intended quality floor.

---

## 12. EXISTING JSON MIGRATION SPECIFICATION

### 12.1 What is actually being migrated

Per §0.2, the corpus is small and its value is concentrated in the **taxonomy** and the **misconception model**, not in question volume. Migrating it is a one-day job, not a three-week one. Nothing in it is discarded.

| Source file                             | Records                                                         | Migrates to                                                                          | Priority |
| --------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| `data/skill_map.json`                   | 3 modules, 15 topic names                                       | `modules`, cross-check against `topics` seeded from the PDF                          | **1**    |
| `data/csec_skill_map_phase3.json`       | 17 skills + prerequisites                                       | `skills`, `skill_prerequisites`                                                      | **1**    |
| `data/diagnostic_bank_phase3.json`      | 17 MCQ questions                                                | `questions` + full version tree                                                      | **2**    |
| `data/lesson_bank_phase4.json`          | 2 lessons → 8 quiz items + 2 worked examples + 3 practice items | `questions` (quiz items); worked examples become `solution_steps` reference material | **3**    |
| `data/question_tagger_sample_bank.json` | 1 tagged record                                                 | `questions` (draft) + validates the tagger field mapping                             | **3**    |
| `data/bulk_tagger_sample_bank.json`     | 2 untagged stems                                                | `questions` (draft, needs classification)                                            | **4**    |
| `data/reasoning_bank_phase7.json`       | 5 proof prompts                                                 | **held**, not imported — see §12.13                                                  | —        |
| `data/mastery_rules.json`               | 4 bands                                                         | informs §9.11 band labels; **not** imported as data                                  | —        |
| `data/subscription_plans_phase9.json`   | 5 plans                                                         | **not migrated** (§0.4 conflict 2)                                                   | —        |
| `data/curriculum_manifest.json`         | resource manifest                                               | `content/sources/manifest.json`, pipeline input list                                 | **2**    |
| `data/admin_portal_sample_data.json`    | capability list                                                 | documentation only                                                                   | —        |
| `database/*.sql`                        | prototype schema                                                | **not migrated** — superseded by §3                                                  | —        |

Expected result: **~28 questions** in `draft`/`pending_review`, **17 skills**, **15 skill-prerequisite edges**, all traceable by `legacy_id`.

### 12.2 Input format — verified

`diagnostic_bank_phase3.json` — a JSON array; every record confirmed to have this exact shape:

```jsonc
{
  "id": "Q1",
  "skillId": "M1_NTC_FRACTIONS",
  "difficulty": 1,
  "type": "mcq",
  "question": "Evaluate 3/4 + 2/5.",
  "options": ["5/9", "23/20", "6/20", "1 1/5"],
  "answer": "23/20",
  "explanation": "Use a common denominator of 20: 15/20 + 8/20 = 23/20.",
  "mistakeTags": {
    "5/9": "Added numerators and denominators directly.",
    "6/20": "Multiplied fractions instead of adding.",
    "1 1/5": "Close mixed-number conversion error.",
  },
}
```

`csec_skill_map_phase3.json`:

```jsonc
{
  "id": "M1_NTC_DECIMALS",
  "module": 1,
  "topic": "Number Theory and Computation",
  "skill": "Decimals, rounding and significant figures",
  "prerequisites": ["M1_NTC_FRACTIONS"],
  "lesson": "Decimal calculation and approximation",
  "month": "September",
}
```

`question_tagger_sample_bank.json` — the 19-field record documented in `question_tagger_schema.json`.

### 12.3 Field mapping — `diagnostic_bank_phase3.json` → database

| Existing JSON field        | New database field                                  | Transformation                                                                                                                                                                                                               |
| -------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                       | `questions.legacy_id`                               | prefix: `'diag:' \|\| id` → `'diag:Q1'`                                                                                                                                                                                      |
| —                          | `questions.id`                                      | `gen_random_uuid()`                                                                                                                                                                                                          |
| —                          | `questions.subject_code`                            | constant `'CSEC_MATH'`                                                                                                                                                                                                       |
| `type: "mcq"`              | `questions.question_type`                           | `'mcq' → 'multiple_choice'`; any other value → import error                                                                                                                                                                  |
| —                          | `questions.provenance`                              | constant `'legacy_import'`                                                                                                                                                                                                   |
| —                          | `questions.rights_status`                           | constant `'edmar_owned'` (EdMar-authored prototype content)                                                                                                                                                                  |
| —                          | `questions.status`                                  | constant `'pending_review'` — **never `published`**                                                                                                                                                                          |
| `difficulty`               | `questions.difficulty_band`                         | direct; `check 1..5`                                                                                                                                                                                                         |
| —                          | `questions.profile_dimension`                       | **null** — proposed by AI in stage 4, human-confirmed                                                                                                                                                                        |
| —                          | `questions.calculator_allowed`                      | constant `true`                                                                                                                                                                                                              |
| —                          | `questions.is_free`                                 | `true` for the first 3 per topic, else `false` (seeds the free pool)                                                                                                                                                         |
| `question`                 | `question_versions.stem_plain`                      | trimmed                                                                                                                                                                                                                      |
| `question`                 | `question_versions.stem_blocks`                     | **Unicode-maths → LaTeX → block array**, §12.5                                                                                                                                                                               |
| `answer`                   | `question_versions.answer_spec.canonicalValue`      | parsed by type inference, §12.6                                                                                                                                                                                              |
| `answer`                   | `question_versions.answer_spec.displayValue`        | verbatim                                                                                                                                                                                                                     |
| `answer` + `options`       | `question_versions.answer_spec.answerType`          | `'option_id'` for MCQ; the _underlying_ type is additionally inferred and stored in `answer_spec.parts` for future conversion to free-entry                                                                                  |
| `options[i]`               | `question_options.content_blocks` / `content_plain` | §12.5 conversion; `option_key = 'ABCDE'[i]`; `sequence = i`                                                                                                                                                                  |
| `options[i] == answer`     | `question_options.is_correct`                       | string equality **after normalisation** — an exact-string comparison would fail on `"$360"` vs `"$ 360"`                                                                                                                     |
| `explanation`              | `question_versions.explanation`                     | verbatim if ≥40 chars; else flagged `explanation_too_short` for the reviewer to expand                                                                                                                                       |
| —                          | `solution_steps`                                    | **not present in the source.** One placeholder step is created from `explanation` with `note: 'AUTO-DERIVED FROM EXPLANATION — REVIEWER MUST EXPAND'`; the question cannot be published until a reviewer replaces it (§12.9) |
| `mistakeTags{k: v}`        | `common_errors` rows                                | one row per key: `wrong_value = normalise(k)`, `misconception = v`, `corrective_note = v` (reviewer refines), `wrong_option_key` resolved by matching `k` to an option                                                       |
| `mistakeTags` key ↔ option | `question_options.common_error_id`                  | linked after both inserts                                                                                                                                                                                                    |
| `skillId`                  | `question_skills.skill_id`                          | lookup `skills.code = skillId`; missing → import error, never silently dropped                                                                                                                                               |
| `skillId` → skill → topic  | `question_objectives`                               | **cannot be derived.** Left empty; stage 5 (AI mapping + human confirm) fills it. A question with no objective cannot be published (§6.7)                                                                                    |
| —                          | `questions.created_by`                              | the migration service account                                                                                                                                                                                                |
| —                          | `question_versions.version_no`                      | `1`                                                                                                                                                                                                                          |
| —                          | `question_versions.normalised_hash`                 | computed (§9.8)                                                                                                                                                                                                              |
| —                          | `question_versions.validation_report`               | populated by running §13.7 over the converted record                                                                                                                                                                         |

### 12.4 Field mapping — the other files

**`csec_skill_map_phase3.json` → `skills` + `skill_prerequisites`**

| Existing          | New                        | Transformation                                                                                                                                                                                                                                             |
| ----------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`              | `skills.code`              | verbatim — **legacy codes are preserved deliberately**, so `diagnostic_bank.skillId` resolves without a lookup table                                                                                                                                       |
| `skill`           | `skills.name`              | verbatim                                                                                                                                                                                                                                                   |
| `lesson`          | `skills.description`       | prefixed `'Lesson: '`                                                                                                                                                                                                                                      |
| `prerequisites[]` | `skill_prerequisites`      | one row each; unresolvable code → import error                                                                                                                                                                                                             |
| `module`, `topic` | _(not stored on `skills`)_ | used to derive `skill_objectives` in a second pass: match `topic` string to `topics.name` for the module, then link the skill to **all** objectives of that topic as a provisional mapping flagged `confidence = 0.30` for narrowing by a curriculum admin |
| `month`           | _(dropped)_                | September–June scheduling belongs to the prototype's teacher product, not to this one. Recorded in `content/legacy/` for reference                                                                                                                         |

**`question_tagger_sample_bank.json` → database**

| Existing                  | New                                                        | Transformation                                                                                                                  |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `id`                      | `questions.legacy_id`                                      | `'tagger:' \|\| id`                                                                                                             |
| `country`                 | _(dropped)_                                                | `profiles.territory` is a student attribute, not a question attribute                                                           |
| `curriculum`              | `questions.subject_code`                                   | `'CSEC Mathematics' → 'CSEC_MATH'`                                                                                              |
| `grade_level`             | _(dropped)_                                                | not modelled; CSEC is not grade-scoped in this product                                                                          |
| `source`                  | `question_sources.source_title` + `source_kind='workbook'` |                                                                                                                                 |
| `module`                  | _(validated, not stored)_                                  | must resolve via `topic`                                                                                                        |
| `topic`                   | `topics` lookup → `question_objectives` (provisional)      | string match against `topics.name`; failure → flagged                                                                           |
| `subtopic`                | `subtopics.name`                                           | created if absent, `is_edmar_construct = true`                                                                                  |
| `skill`                   | `skills.name` lookup                                       | no match → new skill proposed for `curriculum_admin` approval, **not auto-created** (vocabulary control, blueprint §F.4)        |
| `learning_objective`      | `specific_objectives` candidate                            | fed to stage 5 as a mapping hint; never written directly                                                                        |
| `prerequisites[]`         | `skill_prerequisites`                                      | resolved by name                                                                                                                |
| `difficulty`              | `questions.difficulty_band`                                | direct                                                                                                                          |
| `marks`                   | `question_versions.marks`                                  | direct                                                                                                                          |
| `estimated_time_minutes`  | `question_versions.estimated_seconds`                      | `× 60`                                                                                                                          |
| `diagnostic_use`          | _(dropped)_                                                | the controlled vocabulary is prototype-specific; diagnostic eligibility is derived from difficulty and coverage in this system  |
| `cognitive_level`         | `questions.profile_dimension`                              | `'Application' → 'AK'`; `'Recall'/'Knowledge' → 'CK'`; `'Analysis'/'Reasoning'/'Evaluation' → 'R'`; anything else → null + flag |
| `common_misconceptions[]` | `common_errors`                                            | one row each; `wrong_value` **null** (prose only) → flagged `common_error_missing_value`, §12.10                                |
| `ai_coaching_note`        | `question_versions.hint`                                   | truncated to 300 chars                                                                                                          |
| `recommended_next_action` | _(dropped)_                                                | superseded by the deterministic recommendation engine (§9.12)                                                                   |

**`lesson_bank_phase4.json` → `questions`**

Each `quiz[]` entry becomes a `multiple_choice` question: `question → stem`, `options → question_options`, `answer → correct`, `explanation → explanation`. `legacy_id = 'lesson:' || lesson.id || ':quiz:' || index`. Each `guidedPractice[]` / `independentPractice[]` entry becomes a `numeric` question with `hint` from the `hint` field. `workedExample.solution[]` is a **genuine ordered solution** and maps directly to `solution_steps` for a question created from `workedExample.question` — the only source in the corpus with real step data, so it is worth taking.

**`bulk_tagger_sample_bank.json`** → two `draft` questions with `stem_plain` only; everything else via the pipeline. `syllabus_objective` prose is passed to stage 5 as a hint.

### 12.5 LaTeX handling — the stage the blueprint did not anticipate

**There is no LaTeX in the source data.** Mathematics is Unicode text. A deterministic converter, `scripts/unicode-math-to-latex.ts`, runs on every text field before block construction.

Rules, applied in order:

| Pattern                              | Example in source   | LaTeX out                                                                 |
| ------------------------------------ | ------------------- | ------------------------------------------------------------------------- |
| Superscript digits                   | `a² + b² = c²`      | `a^{2} + b^{2} = c^{2}`                                                   |
| Subscript digits                     | `x₁`                | `x_{1}`                                                                   |
| Simple fraction `a/b` between digits | `3/4 + 2/5`         | `\frac{3}{4} + \frac{2}{5}`                                               |
| Mixed number `a b/c`                 | `1 1/5`             | `1\frac{1}{5}`                                                            |
| Set operators                        | `n(A ∪ B)`, `A ∩ B` | `n(A \cup B)`, `A \cap B`                                                 |
| Comparison                           | `≤ ≥ ≠ ≈`           | `\le \ge \ne \approx`                                                     |
| Multiplication / division            | `×` `÷` `·`         | `\times \div \cdot`                                                       |
| Degrees                              | `45°`               | `45^{\circ}`                                                              |
| Square root                          | `√2`                | `\sqrt{2}`                                                                |
| Greek                                | `π θ α`             | `\pi \theta \alpha`                                                       |
| Matrix bracket-semicolon             | `[1 0; 0 -1]`       | `\begin{pmatrix}1 & 0\\ 0 & -1\end{pmatrix}`                              |
| Ratio                                | `3:4:7`             | left as text — a ratio is not display mathematics                         |
| Currency                             | `$1,260`            | left as text; the `$` is stripped into a units token by the answer parser |

**Critical safety rule: `$` must never be treated as a math delimiter.** The source uses `$` for currency throughout (`"$1,260"`, `"$3,400"`). A naive markdown-style `$…$` parser would corrupt every Consumer Arithmetic question in the corpus. The converter never uses `$` as a delimiter; block boundaries come from the rules above and from explicit reviewer marking.

**Every converted expression is then:** validated against the allowlist (§11.3) → rendered by MathJax → stored in `math_renders` → referenced by `renderHash` in the block. **A conversion that fails to render blocks the record from import** and lands in the failed-records report, where a human converts it by hand.

The converter is conservative by design: when a fragment is ambiguous, it is left as `text` and the record is flagged `manual_latex_review`. Under-converting is recoverable in the editor; over-converting corrupts mathematics silently.

### 12.6 Answer mapping

For each source `answer` string, `scripts/infer-answer-spec.ts` produces a draft `AnswerSpec`:

```
infer_answer_spec(answer_string, options?):
  s = normalise(answer_string)
  if options present:            base = { answerType: 'option_id', canonicalValue: key_of(s) }
  # the underlying type is ALSO inferred, so these items can later be converted
  # to free-entry without re-authoring:
  if matches /^\$[\d,]+(\.\d{2})?$/      → currency,   tolerance absolute 0.005
  elif matches /^-?\d+\/-?\d+$/          → fraction,   form.lowestTerms inferred from reduction
  elif matches /^-?\d+ \d+\/\d+$/        → mixed_number
  elif matches /^-?\d+(\.\d+)?\s*[a-z°²³]+$/i → with_units, units.requirement 'required'
  elif matches /^-?\d+:\d+(:\d+)?$/      → ratio
  elif matches /^-?\d+(\.\d+)?$/         → numeric_exact if integer,
                                           else numeric_dp with precision = dp(s)
  elif matches /^\[.*\]$/                → matrix
  elif contains a variable letter        → expression
  else                                   → text
  acceptedForms = generate_forms(canonicalValue, type)      # §10.8, SymPy
  return base + inferred
```

**Every inferred spec is flagged `answer_spec_inferred: true` and must be confirmed by a reviewer before publication.** Inference is a labour saver, not an authority.

### 12.7 Topic mapping

Three passes, in order of confidence:

1. **Deterministic:** `skillId` → `skills.code` → `skill_objectives` → objectives. Confidence 1.0 where the skill already has confirmed objective links.
2. **String match:** `topic` strings (`"Consumer Arithmetic"`, `"Algebra 1"`) against `topics.name` for the declared module. Exact and normalised-case matches accepted; near-matches (Levenshtein ≤ 3) proposed, not accepted.
3. **AI proposal (stage 5):** the model receives the stem, the skill, and the full list of that topic's objectives **verbatim from the syllabus**, and returns 1–3 objective codes with confidence. Confirmed by a human in the review queue.

**No record is published on a pass-2 or pass-3 mapping without human confirmation.** A mis-mapped question silently corrupts every mastery score derived from it (§9.11).

### 12.8 Missing-field handling

| Missing                                   | Behaviour                                                                                                                                                          |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `solution_steps` (all diagnostic records) | placeholder step created, record blocked from publish, reviewer must author (§12.9)                                                                                |
| `specific_objective`                      | left empty, stage 5 proposes, human confirms; blocks publish                                                                                                       |
| `profile_dimension`                       | null; proposed by AI; **does not block publish** — it is analytics metadata, not correctness                                                                       |
| `marks`                                   | defaults to 1 for MCQ, null otherwise                                                                                                                              |
| `estimated_seconds`                       | null; back-filled empirically from `question_quality_metrics.median_seconds` after 30 attempts                                                                     |
| `assets`                                  | none in the corpus; questions requiring a diagram are flagged `diagram_referenced_but_missing` when the stem contains `"the diagram"`, `"figure"`, `"shown below"` |
| `explanation` shorter than 40 chars       | flagged `explanation_too_short`; blocks publish                                                                                                                    |
| `common_errors.wrong_value`               | flagged; prose retained (§12.10)                                                                                                                                   |

**No field is defaulted to a plausible-looking value.** A missing solution becomes a visible blocker, not an invented solution.

### 12.9 Why every legacy record is blocked from publish

The diagnostic bank has explanations but **no step-by-step worked solutions**, and worked solutions are the product's core value proposition (blueprint §A.6). Importing them as `published` with a one-line explanation standing in for a solution would ship exactly the thin experience the product exists to replace.

Therefore: **`status = 'pending_review'` for every legacy record, and `fn_publish_question` rejects any question whose only solution step carries the `AUTO-DERIVED` note.** A reviewer authors the real steps. For 28 records this is under a day's work.

### 12.10 Common-error mapping — the corpus's most valuable asset

`mistakeTags` is a **wrong-value → misconception map**, which is precisely the structure §3.8 wants and which is expensive to author from scratch. It maps directly:

```
"mistakeTags": { "5/9": "Added numerators and denominators directly." }
        ↓
common_errors {
  wrong_value:     normalise("5/9")   → "5/9"
  wrong_option_key: "A"               (resolved by matching the option list)
  misconception:   "Added numerators and denominators directly."
  corrective_note: "Added numerators and denominators directly."   ← reviewer rewrites
                                                                     in student-facing voice
  skill_id:        the question's skill
}
```

By contrast, `question_tagger`'s `common_misconceptions` is **prose without a wrong value** (`"Treating the sale price as the original price"`). It cannot drive answer matching. It is imported as `misconception` with `wrong_value = null`, flagged `common_error_missing_value`, and a stage-9 AI pass proposes the numeric value each misconception would produce — verified by SymPy and confirmed by a human.

### 12.11 Validation, duplicates, logging, failures

**Validation.** Every converted record passes the full §13.7 suite before insert. Failures do not enter the database at all; they go to the failed-records report.

**Duplicates.** Layers 1 and 2 (§9.8) run within the batch and against existing content. Expect the corpus to contain near-duplicates: `lesson_bank_phase4.json`'s ratio quiz (`"$2,400 shared in the ratio 5:3:4"`, three sub-questions) and `diagnostic_bank_phase3.json` Q3 (`"$1,260 in ratio 3:4:7"`) are structurally the same item — L2 assigns them a shared `variant_family_id` rather than rejecting either. Similarly `lesson_bank`'s simple-interest quiz duplicates `diagnostic_bank` Q5 almost exactly (`$12,000 at 10% for 18 months`) — **L1 or L2 will reject one of these; that is correct behaviour**, not a bug.

**Import logging.** One `content_jobs` row (`job_type = 'import_legacy'`) plus a per-record log written to `content/legacy/import-report-<timestamp>.json`:

```jsonc
{
  "jobId": "...",
  "sourceFile": "diagnostic_bank_phase3.json",
  "totals": {
    "read": 17,
    "converted": 17,
    "inserted": 16,
    "failed": 0,
    "rejected_duplicate": 1,
    "flagged": 17,
  },
  "records": [
    {
      "legacyId": "diag:Q1",
      "questionId": "…",
      "status": "inserted",
      "flags": ["solution_placeholder", "objective_unmapped", "answer_spec_inferred"],
      "latexConversions": 3,
      "mathRenders": 3,
    },
    {
      "legacyId": "diag:Q5",
      "status": "rejected_duplicate",
      "duplicateOf": "lesson:L-M1-CONSUMER-01:quiz:2",
      "layer": "L2",
    },
  ],
}
```

**Failed records.** Written to `content/legacy/failed/<legacyId>.json` with the full original record, the conversion attempt, and the failing check. **Never partially inserted.** The importer is idempotent and re-runnable: `on conflict (legacy_id) do nothing`, so a fixed record can be re-imported without touching successful ones.

### 12.12 Runbook

```bash
pnpm tsx scripts/import-legacy.ts \
  --source content/legacy/ \
  --env staging \
  --dry-run                    # produces the report, writes nothing

# inspect content/legacy/import-report-*.json, then:
pnpm tsx scripts/import-legacy.ts --source content/legacy/ --env staging --commit
```

Staging first, always. Production import runs only after the staging report is reviewed and the converted LaTeX has been eyeballed in the admin preview.

### 12.13 What is held rather than imported

`reasoning_bank_phase7.json` contains five `show_that` / `prove_that` / `justify` prompts with success criteria. These are genuinely good content and they are **not importable**, because their answers are free-form proofs that no deterministic validator can mark, and marking them with an LLM violates §10.1.

They are preserved in `content/legacy/reasoning/` and become relevant when the product adds Paper 02 investigation-style practice with self-assessment against the stated success criteria — a V2+ feature where the student marks their own reasoning against a rubric. Recorded so the work is not lost.

---

## 13. CONTENT PROCESSING PIPELINE

### 13.1 Where it runs

`apps/pipeline` is a **container**, not an Edge Function. Extraction, SymPy and MathJax exceed Edge runtime limits and memory. It runs on demand (a Cloud Run / Fly.io / Railway service, or locally during development), is triggered by `pipeline-dispatch` (§8.3), and reaches Supabase with the service-role key. **It has no inbound route from any client.**

### 13.2 Stage map

| #   | Stage           | Tech                                                                       | AI?             | Input                               | Output                                               | Failure mode                              |
| --- | --------------- | -------------------------------------------------------------------------- | --------------- | ----------------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| 1   | `extract`       | `pdfplumber` + `pypdfium2` for layout; vision LLM for mathematical regions | **yes**         | PDF page range                      | raw candidate blocks + image crops                   | page → `failed_pages[]`, continue         |
| 2   | `segment`       | LLM                                                                        | **yes**         | raw blocks                          | discrete question candidates with part structure     | candidate → quarantine                    |
| 3   | `normalise`     | TypeScript, `unicode-math-to-latex`                                        | no              | candidates                          | canonical blocks, `stem_plain`, extracted asset refs | record fails                              |
| 4   | `classify`      | LLM, structured output                                                     | **yes**         | stem + options                      | type, difficulty band, profile dimension, skills     | low confidence → stricter review path     |
| 5   | `map`           | LLM + retrieval over the 159 objectives                                    | **yes**         | stem + skill + topic objective list | 1–3 objective codes + confidence                     | unmapped → blocks publish                 |
| 6   | `answer_spec`   | LLM proposes, **SymPy decides**                                            | partial         | stem + stated answer                | `AnswerSpec` with `acceptedForms`                    | CAS disagreement → reject                 |
| 7   | `solution`      | LLM                                                                        | **yes**         | stem + verified answer              | ordered `solutionSteps` with marks                   | step-continuity failure → regenerate once |
| 8   | `explanation`   | LLM                                                                        | **yes**         | stem + solution                     | 2–4 sentence explanation                             | readability failure → regenerate once     |
| 9   | `common_errors` | LLM proposes, **SymPy computes values**                                    | partial         | stem + solution                     | `commonErrors[]` with wrong values                   | value not reproducible → drop that entry  |
| 10  | `render_math`   | `mathjax-full` v3, Node                                                    | no              | every LaTeX expression              | SVG → `math_renders`                                 | render failure → **record blocked**       |
| 11  | `validate`      | Python + TS validators                                                     | **no**          | complete candidate                  | `validation_report`                                  | fail → reject or one regeneration         |
| 12  | `dedupe`        | Postgres + `pgvector`                                                      | embeddings only | candidate                           | duplicate verdict                                    | L1/L2 auto-reject, L3 flag                |
| 13  | `stage`         | service role                                                               | no              | validated candidate                 | rows at `pending_review`                             | —                                         |
| 14  | `review`        | **human**                                                                  | **no**          | queue                               | approve / edit / reject                              | —                                         |
| 15  | `publish`       | `fn_publish_question`                                                      | no              | approved version                    | `question_payloads`, `content_version++`             | precondition failure → refuse             |

### 13.3 Stage 1 — extraction

```
edmar-pipeline extract --source content/sources/EdMar_CXC_Mathematics_Workbook_2026.pdf \
                       --pages 12-48 --job <uuid>
```

- `pdfplumber` gives text with coordinates and rules; `pypdfium2` renders each page at 200 dpi for the vision pass.
- Mathematical content in these PDFs is frequently vector graphics or embedded images; **text-layer extraction alone loses it**. Every page therefore gets both a text extraction and a vision pass, and the two are reconciled by the stage-2 prompt.
- Figures are cropped by bounding box into `draft-assets/<job>/<page>-<n>.png`. **Auto-extracted crops are review material only and are never published** — they carry source styling and often bleed neighbouring content. A reviewer replaces them with clean SVG.
- Output: `content/work/<job>/raw/page-<n>.json`.

Extraction quality is the largest single driver of downstream review cost. Budget one tuning cycle against a 20-page sample before processing the whole workbook.

### 13.4 Stage 3 — normalisation (deterministic)

Unicode-maths conversion (§12.5), block construction, `stem_plain` projection, `normalised_hash`, asset reference rewriting. No AI. Fully unit-tested.

### 13.5 Stage 5 — curriculum mapping

The prompt receives the **verbatim syllabus text of every objective in the candidate topic** (from `specific_objectives.statement` + `content_notes`), not a paraphrase. This matters: the model's job is matching, not recall, and giving it the authoritative text removes the failure mode where it invents a plausible objective code.

Output is constrained to codes that exist. A returned code failing `^M[123]-\d{1,2}\.\d{1,2}$` or absent from the database is a hard rejection of the response, and the stage retries once with the invalid code named.

### 13.6 Stage 6 — answer spec, where SymPy is the authority

```
1. LLM returns: statedAnswer, answerType, and candidate equivalent forms
2. SymPy independently solves the question where symbolically tractable
3. If sympy_answer is computable and != statedAnswer  →  REJECT the record entirely.
   Do not "prefer" one. A disagreement means the extraction or the source is wrong,
   and a human must look at it.
4. If sympy_answer is not computable (word problem, diagram-dependent),
   mark casVerified: false and route to the STRICT review path — a reviewer
   solves it independently before approving.
5. acceptedForms = SymPy-generated equivalents (decimal, fraction, percent,
   simplified/unsimplified) filtered by the spec's `form` requirements.
6. Tolerance: computed from the required precision; for multi-step questions,
   the enclosing interval from rounding early vs rounding late (§10.7 rule 3).
```

### 13.7 Stage 11 — the deterministic validation suite

**No AI participates.** Every check is a rule, a parse, or a computation. Run in this order; the first `fail` in a blocking check stops the record.

| #   | Check                       | Implementation                                                                                                          | Blocking          |
| --- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | JSON Schema conformance     | `ajv` against `edmar-question.schema.json`                                                                              | ✅                |
| 2   | LaTeX allowlist             | `validators/latex_allowlist.py`                                                                                         | ✅                |
| 3   | LaTeX renders               | `mathjax-full` headless; every expression                                                                               | ✅                |
| 4   | **CAS answer verification** | SymPy re-derives; compare to `canonicalValue`                                                                           | ✅ when tractable |
| 5   | Answer-spec coherence       | `canonicalValue` parses as `answerType`; tolerance sane; every `acceptedForm` validates as correct against its own spec | ✅                |
| 6   | Round-trip self-check       | `validate(displayValue, spec).isCorrect === true` — **the spec must accept its own answer**                             | ✅                |
| 7   | Distractor validity         | no distractor equals the correct answer after normalisation; distractors mutually distinct                              | ✅                |
| 8   | Option count and keys       | 4 options for MCQ (CSEC standard) unless the source shows otherwise; keys contiguous from A                             | ✅                |
| 9   | Step continuity             | each step's result is derivable from the previous where symbolically checkable                                          | ⚠️ warn           |
| 10  | Numeric sanity              | answer magnitude, sign and precision plausible for the context (e.g. a length is positive)                              | ⚠️ warn           |
| 11  | Unit consistency            | dimensional analysis across the solution; area answers carry squared units                                              | ✅                |
| 12  | Marks coherence             | `sum(solutionSteps.marks) == marks` when both present                                                                   | ⚠️ warn           |
| 13  | Asset integrity             | every referenced asset exists in Storage; every asset has `altText ≥ 10`                                                | ✅                |
| 14  | Curriculum integrity        | every `objectiveCode` resolves in the declared syllabus version; every `skillCode` exists                               | ✅                |
| 15  | Duplicate hash              | L1 + L2 (§9.8)                                                                                                          | ✅                |
| 16  | Readability                 | explanation Flesch–Kincaid grade ≤ 9 (written for a 15-year-old)                                                        | ⚠️ warn           |
| 17  | Prohibited content          | no personal names, contact details, source watermarks, third-party branding, URLs                                       | ✅                |
| 18  | Length bounds               | stem 5–1,500 chars; explanation 40–900; no step over 300                                                                | ✅                |

A blocking failure sends the record to **one** bounded regeneration attempt at the stage that produced the offending field, then to `rejected` with the failing check recorded. **A record never reaches a human reviewer in a known-broken state** — the fastest way to destroy review throughput is to make reviewers do the validator's job.

### 13.8 Stage 14 — human review

Enters the queue at `pending_review` with everything the reviewer needs on one screen (§21.5). Two paths:

- **Standard** — `casVerified: true`, mapping confidence ≥ 0.8, no warnings.
- **Strict** — `casVerified: false`, or mapping confidence < 0.8, or any warning, or `provenance = 'ai_variant'` first-of-batch. Requires the reviewer to record that they solved the question independently (a checkbox that is itself audited).

### 13.9 Cost estimation before execution

`pipeline-dispatch` estimates before enqueuing:

```
estimate = pages × page_cost(extract)
         + expected_questions × Σ(stage_cost for stages 2,4,5,6,7,8,9)
         + expected_questions × embedding_cost
```

Shown to the admin, who must confirm. Recorded in `content_jobs.estimated_cost_usd`; the actual is written on completion, and the ratio is monitored — a persistent underestimate means the estimator needs recalibrating, which is cheaper to notice early.

---

## 14. AI ARCHITECTURE

### 14.1 The boundary, stated once more as an implementation constraint

|                 | Offline / batch AI             | Runtime AI                                                                     |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Where           | `apps/pipeline` only           | **nowhere**                                                                    |
| Triggered by    | an administrator or a schedule | —                                                                              |
| Latency budget  | minutes                        | —                                                                              |
| Student-visible | only after human approval      | —                                                                              |
| Cost model      | per question, once, amortised  | —                                                                              |
| Enforcement     | it holds the keys              | CI check `check-no-ai-in-client.sh`; no client has a network route to a provider |

### 14.2 Model responsibilities and tiering

Deliberately mixed. Using a frontier model for classification a human will confirm anyway is the most common avoidable overspend in pipelines like this.

| Stage           | Tier               | Why                                                                 |
| --------------- | ------------------ | ------------------------------------------------------------------- |
| 1 extract       | **vision, strong** | layout and mathematical notation understanding; errors here cascade |
| 2 segment       | mid                | structural                                                          |
| 4 classify      | **cheap/fast**     | human confirms; a wrong guess costs one click                       |
| 5 map           | mid                | matching against supplied text, not recall                          |
| 6 answer_spec   | **strong**         | but SymPy is the authority, so the model is a proposer              |
| 7 solution      | **strong**         | accuracy dominates; this is the product                             |
| 8 explanation   | mid                | prose quality, low risk                                             |
| 9 common_errors | mid                | proposals, SymPy computes the values                                |
| 12 dedupe       | embedding model    |                                                                     |

Model identifiers live in `app_config` / pipeline config, never hard-coded, so a change is configuration rather than a deploy.

### 14.3 Structured outputs

**Every AI call requests structured JSON against a schema.** No free-text parsing anywhere in the pipeline. Where the provider supports native structured output or tool-calling, use it; otherwise validate with `ajv` and retry on failure.

A response that fails schema validation is retried **once** with the validation error appended, then the record is quarantined. There is no third attempt: a model that has failed a schema twice is not going to succeed on the third, and the retry loop is where runaway cost lives.

### 14.4 Retry and failure policy

| Failure                     | Policy                                               |
| --------------------------- | ---------------------------------------------------- |
| Network / 5xx               | exponential backoff, 3 attempts, jitter              |
| Rate limit                  | honour `Retry-After`, up to 5 attempts               |
| Schema invalid              | 1 retry with the error, then quarantine              |
| Validation blocking failure | 1 regeneration at the responsible stage, then reject |
| CAS disagreement            | **no retry.** Reject and flag for human inspection   |
| Token limit exceeded        | reduce the input window once; then reject            |

### 14.5 Caching and permanent storage

**Rule: if a model produced it, it is written to the database and never asked for again.**

| Artefact                                 | Stored in                                                       | Reused                                         |
| ---------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------- |
| Extraction output                        | `content/work/<job>/raw/` + `content_jobs.result`               | a pipeline change never re-pays for extraction |
| Classification / mapping                 | `questions`, `question_objectives`, `ai_generations.raw_output` | forever                                        |
| Solutions / explanations / common errors | `question_versions`, `solution_steps`, `common_errors`          | forever                                        |
| Accepted answer forms                    | `answer_spec.acceptedForms`                                     | every attempt, free                            |
| Embeddings                               | `question_versions.embedding`                                   | every future duplicate check                   |
| Math renders                             | `math_renders`, content-addressed                               | across all questions sharing the expression    |
| Full request/response                    | `ai_generations`                                                | forensics, prompt regression                   |

### 14.6 Cost controls

| Control                 | Mechanism                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| Monthly hard cap        | provider account cap **and** `app_config.ai_monthly_cap_usd`                                    |
| Circuit breaker         | `pipeline-dispatch` refuses new jobs at 80 % of cap; alerts                                     |
| Per-job estimate        | admin must confirm before enqueue (§13.9)                                                       |
| Per-stage token ceiling | max input and output tokens per stage; a malformed input cannot produce an unbounded generation |
| Concurrency             | worker pool ≤ 4 concurrent stage calls                                                          |
| Batch discounts         | all work is batch-eligible by construction                                                      |
| Model tiering           | §14.2                                                                                           |
| Daily spend alert       | `job_ai_spend_alert` compares rolling spend against the cap                                     |

### 14.7 Logging and observability

Every call writes `ai_generations`: job, stage, provider, model, prompt name **and version**, tokens in/out, cost, confidence, raw output, and whether it was ultimately accepted. This makes the questions the business will actually ask answerable: _what does a published question cost?_, _did quality drop when we changed the classify prompt?_, _which prompt version produced the rejects?_

### 14.8 Versioning and the golden set

Prompts are versioned files in `apps/pipeline/src/prompts/<name>.v<N>.md`, reviewed in pull requests like code. `promptVersion` is recorded on every generation.

`content/golden/` holds 50–100 fully human-verified questions with their expected classifications, mappings, answer specs and solutions. **Any prompt or model change runs the golden set and diffs the outputs.** A regression on the golden set blocks the change. This is what stops a silent quality drop reaching students.

---

## 15. AI QUESTION GENERATION

### 15.1 Variant generation — the highest-leverage AI operation

```
source question (status = 'published', human-approved)
   │
   ├─ 1. GENERATE VARIANT ────── LLM: same structure, new numbers/context
   │                             Constraints in the prompt:
   │                               · preserve the objective and the method exactly
   │                               · numbers chosen so the answer stays "clean"
   │                               · same difficulty band
   │                               · same answer type
   │
   ├─ 2. SOLVE INDEPENDENTLY ─── SymPy solves the variant from scratch.
   │                             The LLM's stated answer is NOT used as input here.
   │
   ├─ 3. COMPARE ──────────────── sympy_answer == llm_stated_answer ?
   │                                 NO  → REJECT the variant. No retry.
   │                                 YES → continue
   │
   ├─ 4. AESTHETIC GATE ───────── reject if the answer is degenerate or ugly:
   │                               · |answer| > 10^6 or < 10^-4 when the source's was O(1..10^4)
   │                               · non-terminating decimal where the source terminated
   │                               · negative where the context forbids it (a length, a price)
   │                               · zero or one when the source's answer was neither
   │
   ├─ 5. SOLUTION + EXPLANATION ─ generated for the variant's own numbers
   │
   ├─ 6. COMMON ERRORS ────────── the SOURCE's misconceptions applied to the new
   │                             numbers; each wrong value computed by SymPy,
   │                             not stated by the model
   │
   ├─ 7. VALIDATE ─────────────── the full §13.7 suite
   │
   ├─ 8. DEDUPE ───────────────── against the whole bank AND its own family
   │
   ├─ 9. FAMILY ASSIGNMENT ────── variant_family_id = source's family (created if absent)
   │                             source_question_id = source
   │
   └─ 10. HUMAN REVIEW ────────── fast path: the reviewer is checking a known
                                  structure with new numbers, ~15 s per item
```

**Hard constraints:**

- Variants are generated **only** from questions already at `status = 'published'`.
- A variant is **never** served in the same session as any family member (§9.3 step 7).
- Variants still require human review. B-14 admits no exception, including for "high-confidence" batches.
- Generation ratio is capped at **5 variants per source question** to prevent a bank that is broad but shallow.

### 15.2 The content state machine

```
                        ┌──────────┐
                        │  draft   │  created by import, editor, or pipeline stage 13
                        └────┬─────┘
                             │ submit
                        ┌────▼──────────────┐
                        │ pending_validation│
                        └────┬──────────────┘
                             │ pipeline picks up
                        ┌────▼───────┐
                        │ validating │ ── §13.7 running
                        └────┬───────┘
             fail (blocking) │ pass
              ┌──────────────┼───────────────┐
              │              │               │ 1 regeneration attempt
        ┌─────▼────┐   ┌─────▼──────────┐    │ available at the responsible
        │ rejected │   │ pending_review │◄───┘ stage; second failure → rejected
        └─────┬────┘   └─────┬──────────┘
              │              │
              │      ┌───────┼─────────────────┬──────────────┐
              │      │       │                 │              │
              │ changes_  approve          escalate        reject
              │ requested   │                 │              │
              │      │      │                 │              │
              │ ┌────▼───────────────┐  ┌─────▼──────────┐   │
              │ │ changes_requested  │  │ pending_review │   │
              │ │  (back to editor)  │  │ (2nd reviewer) │   │
              │ └────┬───────────────┘  └────────────────┘   │
              │      │ resubmit                              │
              │      └──────────► pending_validation         │
              │                                              │
              │                 ┌──────────┐                 │
              │                 │ approved │◄────────────────┘ (never; shown for shape)
              │                 └────┬─────┘
              │                      │ fn_publish_question (content_admin)
              │                 ┌────▼──────┐
              │                 │ published │
              │                 └────┬──────┘
              │            ┌─────────┼──────────┐
              │      suspend│         │correct   │retire
              │      ┌──────▼────┐    │     ┌────▼─────┐
              │      │ suspended │    │     │ retired  │
              │      └──────┬────┘    │     └──────────┘
              │             │ restore │ new version → pending_validation
              │             └─────────┘         (old version → retired)
              │
        ┌─────▼─────┐
        │ archived  │  rejected records kept 180 days, then archived with their
        └───────────┘  rejection reason (feeds prompt improvement, §16.11)
```

**Transition authority:**

| Transition                                                             | Minimum role                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `* → draft`, `draft → pending_validation`                              | `reviewer` (or pipeline service)                                    |
| `pending_review → approved / changes_requested / rejected / escalated` | `reviewer`                                                          |
| `approved → published`                                                 | `content_admin`                                                     |
| `published → suspended`                                                | **`reviewer`** — deliberately low, because suspending fast is right |
| `suspended → published`                                                | `content_admin`                                                     |
| `published → retired`                                                  | `content_admin`                                                     |
| `rejected → archived`                                                  | scheduled job                                                       |

Every transition writes `audit_log`. The state column is `questions.status`; the transition table is enforced by trigger `trg_question_status_transition`, which raises on any transition not in the map above.

---

## 16. AI PROMPT ARCHITECTURE

### 16.1 Conventions binding on all prompts

1. **Structured JSON output only.** Every prompt names its output schema; every response is validated by `ajv` before use.
2. **Never trusted.** Every output passes §13.7 and a human before publication.
3. **Verbatim reference material.** Where the model must match against the syllabus, the objective text is supplied verbatim from the database, never paraphrased and never left to recall.
4. **Refusal is a valid output.** Every schema includes an `"unableToComply"` path with a reason. A model that says "I can't read this page" is far more useful than one that invents a question.
5. **No chain-of-thought in the output.** Reasoning fields are permitted where they improve accuracy but are stored in `ai_generations.raw_output`, never surfaced to students.
6. **Versioned.** `prompts/<name>.v<N>.md`, PR-reviewed, recorded on every generation.

Templates below are abbreviated to their operative content: role, task, constraints, and output schema.

### 16.2 P1 · `extract_questions` (v1)

```
ROLE
You extract examination questions from a page of a mathematics textbook or past
paper. You transcribe. You never solve, correct, improve or invent.

INPUT
  page_image  : rendered page (200 dpi)
  page_text   : text-layer extraction, possibly incomplete or mis-ordered
  source_meta : { title, page_no, expected_paper?, expected_year? }

TASK
Identify every distinct question on the page. For each, transcribe the stem
exactly as printed, including all numbers, units and punctuation. Transcribe
options if present. Note the presence and bounding box of any figure.

CONSTRAINTS
- Transcribe, do not paraphrase. If a character is unreadable, use "⟨?⟩".
- Mathematics: transcribe as LaTeX using ONLY the allowlist supplied below.
- A "$" in the source is CURRENCY. Never treat it as a math delimiter.
- A question continuing from the previous page: set "continuesFromPrevious": true
  and transcribe what is present.
- Do NOT supply answers even if the page shows them; answers are extracted
  separately with their own provenance.
- If the page contains no questions, return an empty array. Do not invent.

OUTPUT SCHEMA  (extract-questions.schema.json)
{
  "pageNo": int,
  "questions": [{
    "localId": string,
    "displayNo": string|null,          // "4", "2(b)(ii)" as printed
    "stemLatex": string,               // blocks joined; \( \) for inline math
    "options": [{ "key": "A".."E", "text": string }] | null,
    "hasFigure": bool,
    "figureBBox": [x0,y0,x1,y1] | null,
    "marksShown": int|null,
    "continuesFromPrevious": bool,
    "transcriptionConfidence": 0..1,
    "unreadableRegions": [string]
  }],
  "unableToComply": { "reason": string } | null
}
```

### 16.3 P2 · `classify_question` (v1)

```
ROLE  You classify a CSEC Mathematics question. You do not solve it.

INPUT  stemLatex, options?, marksShown?, sourceMeta?

TASK   Determine questionType, difficultyBand, profileDimension, calculatorAllowed,
       estimatedSeconds, and 1–3 skill codes from the SUPPLIED vocabulary.

CONSTRAINTS
- skillCodes MUST come from the supplied list. Never invent a code.
  If nothing fits, return "skillCodes": [] and explain in "notes".
- difficultyBand definitions (use these exactly):
    1 direct recall or one-step application of a single objective
    2 routine two-step, familiar presentation
    3 multi-step, or requires choosing the method
    4 combines two objectives, or a non-obvious set-up
    5 extended reasoning, unfamiliar context, or investigation-style
- profileDimension: CK = recall/procedure; AK = apply a technique to a routine
  problem; R = non-routine, multi-algorithm, deduction, or justification.
- Return confidence per field. Low confidence is useful; false confidence is not.

OUTPUT  { questionType, difficultyBand, profileDimension, calculatorAllowed,
          estimatedSeconds, skillCodes[], confidence:{...}, notes, unableToComply }
```

### 16.4 P3 · `map_to_curriculum` (v1)

```
ROLE  You match a question to CXC CSEC Mathematics Specific Objectives.

INPUT
  stemLatex, skillCodes[], candidateTopicName
  objectives : [ { code, statement, contentNotes } ]   ← VERBATIM from the syllabus,
                                                          every objective in scope

TASK  Return 1–3 objective codes this question assesses, most central first.

CONSTRAINTS
- Return ONLY codes present in `objectives`. A code not in the list is a failure.
- Prefer the narrowest objective that fully covers what the question demands.
- If the question spans objectives in different topics, return codes from both.
- If no objective fits, return "objectiveCodes": [] with a reason. Do NOT force
  a match — a wrong mapping silently corrupts every mastery score downstream.

OUTPUT  { objectiveCodes: [string], primaryObjectiveCode: string|null,
          confidence: 0..1, reasoning: string, unableToComply }
```

### 16.5 P4 · `generate_solution` (v1)

```
ROLE  You are a CSEC Mathematics examiner writing a model worked solution
      for a Fifth Form student.

INPUT  stemLatex, verifiedAnswer (CAS-verified where possible), marks?, objectiveStatements[]

TASK  Produce an ordered list of solution steps.

CONSTRAINTS
- Every step: (a) one short instruction saying WHAT is being done, and
              (b) the mathematical line doing it, in allowlisted LaTeX.
- Each step must follow from the previous one. Show intermediate values.
- Use the method a CSEC candidate is taught, not the cleverest method.
- Use CSEC notation conventions. Keep units throughout.
- Where `marks` is supplied, allocate marks to steps and make them sum to `marks`.
- The final step's result MUST equal `verifiedAnswer`. If you cannot reach it,
  return unableToComply. DO NOT adjust the answer to fit your working.
- No step longer than 300 characters. No commentary outside the schema.

OUTPUT  { steps: [{ stepNo, instruction, latex, marks? }],
          finalAnswerLatex, methodName, unableToComply }
```

The last constraint is load-bearing: a model that silently "corrects" the verified answer to match its own working is the single most dangerous failure mode in the pipeline, and check 4 of §13.7 exists to catch it if the prompt does not.

### 16.6 P5 · `generate_explanation` (v1)

```
ROLE  You explain, to a 15-year-old preparing for CSEC Mathematics, WHY the
      method works and what to watch for. You are not writing a solution.

INPUT  stemLatex, solutionSteps[], objectiveStatements[], commonErrors[]?

TASK  Write 2–4 sentences covering, in order:
      1. the underlying idea in one sentence
      2. the mistake most students make here
      3. how to recognise this question type next time

CONSTRAINTS
- Reading level: Flesch–Kincaid grade 9 or below.
- Second person ("you"), warm, never condescending, never congratulatory.
- Standard Caribbean English. No American idiom. No forced dialect.
- 40–900 characters. No headings, no bullet points, no emoji.
- Do not restate the arithmetic — the solution already did that.

OUTPUT  { explanation: string, readingGradeEstimate: number, unableToComply }
```

### 16.7 P6 · `generate_question` (v1) — original authoring

```
ROLE  You are a CSEC Mathematics item writer producing an ORIGINAL question.

INPUT  objective { code, statement, contentNotes }, difficultyBand,
       questionType, existingStems[]  (to avoid re-writing what exists),
       contextGuidance (Caribbean-appropriate contexts)

CONSTRAINTS
- Assess the supplied objective and nothing beyond it.
- Contexts must be plausible for a Caribbean student: JMD/TTD/XCD currency,
  local goods and distances, no unfamiliar cultural references.
- Numbers chosen so the answer is clean at the target band.
- Do NOT reproduce, closely paraphrase, or lightly renumber any past examination
  question you may have seen. This is original authoring. If you cannot produce
  an original item, return unableToComply.
- Provide the answer you believe is correct; it will be independently verified
  and your item rejected if it disagrees.

OUTPUT  { stemLatex, options[]?, statedAnswer, answerType,
          suggestedMarks, contextNote, unableToComply }
```

### 16.8 P7 · `generate_variant` (v1)

```
ROLE  You produce a VARIANT of an approved question: same mathematics, new numbers.

INPUT  sourceStemLatex, sourceOptions[]?, sourceAnswer, sourceSolutionSteps[],
       sourceDifficultyBand, sourceObjectiveCodes[], variantIndex

CONSTRAINTS
- Identical mathematical structure and solution method. Same number of steps.
- Change only: the numeric values, the names, and the surface context.
- Keep the same difficulty band and the same answer type.
- Choose numbers so the answer is as "clean" as the source's answer:
  if the source answer was a whole number, yours must be; if it was 2 d.p.,
  yours must be.
- For MCQ, regenerate ALL distractors so that each still embodies the same
  misconception as the corresponding source distractor. State which.
- Never produce a variant numerically identical to the source or to any
  previously generated variant (variantIndex is supplied so you can differ).

OUTPUT  { stemLatex, options: [{ key, text, embodiesMisconceptionKey? }]?,
          statedAnswer, distractorRationale, unableToComply }
```

### 16.9 P8 · `propose_common_errors` (v1)

```
ROLE  You identify the specific mistakes CSEC students make on this question.

INPUT  stemLatex, solutionSteps[], correctAnswer, existingCommonErrors[]?

TASK  For each likely mistake, describe it AND describe the arithmetic that
      produces it, precisely enough that a computer algebra system can
      reproduce the wrong value.

CONSTRAINTS
- 2–4 entries. Real, common mistakes only — not exotic ones.
- "computation" must be an explicit expression using the question's own numbers,
  e.g. "450 * 0.20 + 20" — NOT a description.
- Do NOT state the wrong value yourself. SymPy computes it from your expression.
  If your expression is not evaluable, the entry is discarded.
- correctiveNote is addressed to the student, one sentence, non-judgemental.

OUTPUT  { commonErrors: [{ key, misconception, computation, correctiveNote,
                           skillCodeHint? }], unableToComply }
```

### 16.10 P9 · `detect_duplicate` (v1) — adjudication only

```
ROLE  You adjudicate whether two questions are duplicates, variants, or distinct.
      You are called ONLY for pairs that automated similarity has already flagged.

INPUT  questionA {stem, answer, objectives}, questionB {stem, answer, objectives},
       cosineSimilarity, trigramSimilarity

DEFINITIONS  (use exactly)
  duplicate — same mathematics, same numbers, same answer; differs only in wording
  variant   — same mathematics and method, DIFFERENT numbers or context
  distinct  — different method, different objective, or materially different demand

CONSTRAINTS
- When uncertain, return "uncertain". A false "duplicate" destroys good content;
  a false "distinct" leaves a duplicate in the bank. Uncertainty is cheaper than
  either, because it routes to a human.

OUTPUT  { verdict: "duplicate"|"variant"|"distinct"|"uncertain",
          confidence: 0..1, reasoning: string }
```

### 16.11 P10 · `quality_review` (v1) — reviewer assistance, never authority

```
ROLE  You pre-read a question for a human reviewer and list what to check.
      You do not approve, reject, or score. You surface concerns.

INPUT  the complete canonical question JSON, plus its validation report

TASK  List concrete concerns a qualified CSEC teacher should verify.

CONSTRAINTS
- Every concern must name a field and say what specifically to check.
- "Looks fine" is a valid and useful output — return an empty array.
- Do NOT recommend approval or rejection. That is the reviewer's decision,
  and framing it for them biases it.
- Flag in particular: an answer inconsistent with the working; a step that
  does not follow; units that change without conversion; an explanation that
  contradicts the solution; an objective mapping that looks wrong; a distractor
  that is arguably also correct.

OUTPUT  { concerns: [{ field, concern, severity: "high"|"medium"|"low" }],
          checkedFields: [string] }
```

### 16.12 Prompt regression discipline

Changing any prompt requires: a new version file, a golden-set run (§14.8), a diff review in the pull request, and — for P4, P6, P7 (the ones that produce mathematics) — a manual read of 10 outputs by a qualified reviewer. Prompts that produce mathematics are treated as production code, because they are.

---

## 17. STUDENT APPLICATION SPECIFICATION — WEB (MVP)

_Rev 2: this section specifies `apps/web`, the MVP client (D-16). The screen specifications below are client-agnostic in substance — purpose, data, calls and the five states are the same on any client — so they carry forward unchanged to `apps/mobile` at V2, where routes become Expo Router paths and components become their React Native equivalents. §39 covers the web-specific concerns (rendering strategy, PWA, responsive contracts) that have no Rev 1 counterpart._

### 17.1 Stack

**Web (MVP).** Next.js 14+ App Router, React 18, TypeScript strict, Tailwind + CSS variables from `@edmar/design`, `@tanstack/react-query` v5, `zustand` v4, `idb` for the content cache, a hand-written service worker (`worker/`, §20.5) — deliberately not a framework PWA plugin, because the caching rules here are specific and a generic plugin caches the wrong things. Mathematics is inline SVG from the payload; **no maths engine ships** (D-01). Auth is Supabase's cookie-based session with `@supabase/ssr`, so the session is available in server components and route handlers without a client round trip.

**Browser support matrix (tested in CI):** last two versions of Chrome, Safari, Firefox and Edge; Chrome on Android 10+; Safari on iOS 15+. This matrix is wider than Rev 1's curated Android device list and is a real cost of web-first (blueprint R-18) — it is paid in CI rather than in support tickets.

**Mobile (V2, not built in P01–P24).** Expo SDK 51+, React Native 0.74+, Expo Router v3, the same TanStack Query and Zustand versions, `react-native-mmkv`, `expo-secure-store`, `react-native-svg`, `expo-updates`. Android first, then iOS. Its behaviour conforms to the web client (blueprint I-8).

### 17.2 Screen specification format

Each screen below gives: route, purpose, components, data, calls, and the five states (loading / empty / error / premium / accessibility). Where a state is not reachable it is marked `n/a` rather than omitted, so an implementer can tell the difference between "no state" and "not specified".

### 17.3 Screens

---

**S-01 · Splash**

|                |                                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| **Route**      | `app/index.tsx` (redirects)                                                     |
| **Purpose**    | restore session, check `content_version`, route to onboarding / home            |
| **Components** | `EdMarMark`, `ProgressIndicator`                                                |
| **Data**       | secure-store session; `v_public_config`                                         |
| **Calls**      | `supabase.auth.getSession()`; `GET /rest/v1/v_public_config`                    |
| **Loading**    | brand mark, no spinner for the first 600 ms (avoids a flash)                    |
| **Empty**      | n/a                                                                             |
| **Error**      | offline → proceed with cached session and content; show `OfflineBanner` on Home |
| **Premium**    | n/a                                                                             |
| **A11y**       | `accessibilityLabel="EdMar Maths, loading"`                                     |
| **Nav**        | → `(onboarding)/value` if never onboarded; → `(tabs)/home` otherwise            |

---

**S-02 · Onboarding — value**

|                |                                                                                 |
| -------------- | ------------------------------------------------------------------------------- |
| **Route**      | `app/(onboarding)/value.tsx`                                                    |
| **Purpose**    | three swipeable cards; skippable; **no sign-up prompt**                         |
| **Components** | `ValueCarousel`, `PageDots`, `SkipButton`, `PrimaryButton`                      |
| **Data**       | static                                                                          |
| **States**     | loading n/a · empty n/a · error n/a · premium n/a                               |
| **A11y**       | cards are a single a11y region per page; Skip is reachable first in focus order |
| **Nav**        | → `sitting`                                                                     |

---

**S-03 · Onboarding — exam sitting** _(the most valuable data point collected)_

|                 |                                                                                   |
| --------------- | --------------------------------------------------------------------------------- |
| **Route**       | `app/(onboarding)/sitting.tsx`                                                    |
| **Purpose**     | capture `exam_sitting_year` + `exam_sitting_month`; determines `syllabus_version` |
| **Components**  | `OptionCardGroup` (May–June 2027 / January 2027 / May–June 2028 / Not sure yet)   |
| **Data**        | none                                                                              |
| **Calls**       | writes to the local onboarding store; persisted at account creation               |
| **Empty/Error** | n/a — offline safe                                                                |
| **A11y**        | radio semantics, `accessibilityState={{selected}}`                                |
| **Nav**         | → `interests`                                                                     |

---

**S-04 · Onboarding — topic interests (skippable)**

Route `app/(onboarding)/interests.tsx`. Multi-select over `topics`; defaults to none with a prominent _Show me everything_. Data: `GET /rest/v1/topics?syllabus_code=eq.V2027`. **Loading:** skeleton rows. **Error:** skip silently to the first question — this screen is optional and must never block onboarding. Nav → `first-question`.

---

**S-05 · Onboarding — first question** _(no account yet)_

|                |                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| **Route**      | `app/(onboarding)/first-question.tsx`                                                                          |
| **Purpose**    | deliver value before any registration wall                                                                     |
| **Components** | the full `QuestionScreen` (S-11) in `onboarding` mode                                                          |
| **Data**       | anonymous auth session; a session of 3 questions, band 1–2, from a commonly-taught topic                       |
| **Calls**      | `auth.signInAnonymously()` → `fn_create_practice_session({mode:'topic', count:3, difficulty_mode:'building'})` |
| **Loading**    | skeleton question; 400 ms budget                                                                               |
| **Empty**      | impossible by construction — the free pool is seeded; if it happens, route to sign-up with an apology          |
| **Error**      | offline → a bundled fallback question shipped with the app, so first-run always works                          |
| **Premium**    | n/a                                                                                                            |
| **Nav**        | after Q3 → `(auth)/sign-up` with progress preserved                                                            |

---

**S-06 · Sign in** — `app/(auth)/sign-in.tsx`. Email + password, Google. **Error states:** invalid credentials (inline, non-specific about which field, for enumeration resistance); rate limited (with the retry time); offline (explicit "you need a connection to sign in"). A11y: labelled inputs, `textContentType`, error text linked via `accessibilityLabelledBy`.

**S-07 · Sign up** — `app/(auth)/sign-up.tsx`. Email, password, display name, territory. **Age gate:** "Are you 13 or over?" — a `false` answer ends the flow with an explanatory screen (U-05). On success calls `fn_link_anonymous_account` to migrate onboarding attempts. **Error:** email already registered → offer sign-in; weak password → inline rules.

**S-08 · Reset password** — `app/(auth)/reset.tsx`. Always shows the same confirmation regardless of whether the email exists.

---

**S-09 · Home**

|                |                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Route**      | `app/(tabs)/home.tsx`                                                                                                                |
| **Purpose**    | answer "what should I do right now?" — one primary action                                                                            |
| **Components** | `ContinueCard`, `RecommendationCard`, `PracticeEntry`, `PapersEntry`, `WeeklyActivity`, `FreeAllowanceChip`, `OfflineBanner`         |
| **Data**       | open session; `fn_get_recommendation`; `student_daily_usage` today; last 7 days of attempts                                          |
| **Calls**      | `POST rpc/fn_get_recommendation`; `GET /rest/v1/practice_sessions?status=eq.in_progress`; `GET /rest/v1/student_daily_usage`         |
| **Loading**    | skeleton cards; cached data renders immediately and revalidates (`staleTime` 5 min)                                                  |
| **Empty**      | new student with no history → `RecommendationCard` shows a curated starter topic, never a blank screen                               |
| **Error**      | render from cache; a small non-blocking "couldn't refresh" chip. **Never a full-screen error on Home**                               |
| **Premium**    | free → `FreeAllowanceChip` "6 of 10 questions left today"; premium → chip absent entirely (not shown as "unlimited", which is noise) |
| **A11y**       | Continue is the first focusable element; `accessibilityRole="summary"` on the recommendation reason                                  |
| **Nav**        | → session, practice, papers, progress                                                                                                |

---

**S-10 · Topics / Subtopics / Practice setup**

`app/(tabs)/practice/index.tsx` — sections in official order with `MasteryBar` and available-question counts. **Locked (premium) rows are visible and marked, never hidden** — a student who cannot see what they'd get does not convert. **Empty:** a topic with 0 published questions shows "Coming soon" and is not tappable. **Loading:** skeleton rows, cached-first.

`app/(tabs)/practice/[topicId].tsx` — subtopics, same pattern.

`app/(tabs)/practice/setup.tsx` — two controls only: count (5 / **10, default** / 20) and difficulty (Mixed / Building up / Challenge). One large **Start practice**. **Premium state:** a free student selecting 20 when only 6 remain sees the count clamped with a one-line explanation and an upgrade link — clamped, not blocked.

---

**S-11 · Question** — see §18 for the full state machine.

**S-12 · Result / Solution / Explanation** — not separate routes. They are progressive disclosure _within_ S-11, because the student's answer must stay on screen next to the verdict (blueprint §P.5).

---

**S-13 · Session results**

|                |                                                                                                                           |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Route**      | `app/session/[sessionId]/results.tsx`                                                                                     |
| **Purpose**    | score, per-question strip, **mastery delta**, one next action                                                             |
| **Components** | `ScoreRing`, `QuestionStrip`, `MasteryDelta`, `NextActionButton`, `PaywallSheet`                                          |
| **Data**       | `fn_complete_session` result                                                                                              |
| **Loading**    | computed server-side; skeleton for < 500 ms                                                                               |
| **Empty**      | a session with 0 answered → "You didn't answer any questions" + resume                                                    |
| **Error**      | offline → compute the score locally from the queued attempts and show a "will sync" note; mastery delta shown as pending  |
| **Premium**    | free student who exhausted their allowance sees `PaywallSheet` **here** — at demonstrated value and demonstrated appetite |
| **A11y**       | the mastery delta is announced (`AccessibilityInfo.announceForAccessibility`)                                             |

---

**S-14 · Progress**

`app/(tabs)/progress/index.tsx`. Overall readiness (coverage framing, **never a predicted grade**), per-topic `MasteryBar`s, strongest/weakest named at objective level, activity chart, entry to history. **Empty:** fewer than 5 distinct questions → "Getting started" state with an explanation of what unlocks the numbers, not a zeroed chart. **Error:** cached render. `progress/[topicId].tsx` drills to subtopic and skill. `progress/history.tsx` — attempt list, **default filter "Incorrect"**, because that is what it is for.

---

**S-15 · Papers** _(V1)_

`app/(tabs)/papers/index.tsx` — library by sitting, status chip, best score. **Premium:** timed mode locked for free; the library is browsable. `papers/[paperId].tsx` — overview, mode choice, **the marking-honesty note** (§10.10). `app/paper/[examSessionId]/question/[position].tsx` — in-paper navigation grid, flag-for-review, no solutions in timed mode. `app/paper/[examSessionId]/results.tsx` — marks, per-topic breakdown, review entry.

---

**S-16 · Profile and subscription**

`app/profile/index.tsx` — account, exam sitting (editable; changing it changes the syllabus tree and warns that progress is re-presented), territory, theme, notifications, bookmarks, help, **About with the CXC non-affiliation notice**, sign out, delete account.

`app/profile/subscription.tsx` — current tier, renewal date, **cancellation clearly signposted** (hiding it is a store-policy risk and a trust failure), restore purchases, plan comparison. **Error:** billing unavailable → explain and offer retry; never leave the student unable to tell whether they are subscribed.

### 17.4 Cross-cutting state requirements

| State       | Rule                                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Loading** | Cached-first everywhere. A screen that has cached data never shows a spinner; it renders and revalidates. Skeletons only for genuinely first-load                                                    |
| **Empty**   | Every list has a designed empty state naming the reason and the action. "No data" is not acceptable copy                                                                                             |
| **Error**   | Never a full-screen error where cached content exists. Network errors are non-blocking chips. Only auth failure and a corrupt cache are full-screen                                                  |
| **Offline** | `OfflineBanner` states what still works ("You can keep practising — answers will sync"). Practice, checking, solutions and explanations all work offline for a materialised session                  |
| **Premium** | Entitlement is read from one hook, `useEntitlement()`. **No screen implements its own premium logic** (§23.6)                                                                                        |
| **A11y**    | Every interactive element has a label and a ≥44 pt target; text scales to 200 % without clipping; mathematics carries `accessibilityLabel` from the LaTeX source's `alt`; no meaning by colour alone |

---

## 18. QUESTION SCREEN SPECIFICATION

### 18.1 State machine

```
                         ┌──────────────┐
      session start ───► │   loading    │
                         └──────┬───────┘
                    payload ready│           error → error_state (retry / skip)
                         ┌──────▼─────────┐
                         │ question_loaded│  render stem, assets, input affordance
                         └──────┬─────────┘
                     first input│
                         ┌──────▼─────────┐
                    ┌───►│   answering    │  CHECK enabled once input is non-empty
                    │    └──────┬─────────┘
             edit   │           │ tap CHECK
                    └───────────┤
                         ┌──────▼─────────┐
                         │    checking    │  <10 ms, LOCAL. No spinner is rendered:
                         └──────┬─────────┘  a spinner here would be a lie.
                    ┌───────────┴──────────┐
              ┌─────▼─────┐          ┌─────▼──────┐
              │  correct  │          │ incorrect  │
              └─────┬─────┘          └─────┬──────┘
                    │                      │ common-error match → targeted note
                    └───────────┬──────────┘
                         ┌──────▼──────────┐
                         │ solution_visible│  steps revealed progressively
                         └──────┬──────────┘
                                │ + explanation always shown
                         ┌──────▼──────────┐
                         │  next_question  │  advance, or → session results
                         └─────────────────┘

  skipped: answering ──skip──► solution_visible (recorded as was_skipped = true)
```

Implemented as a discriminated union in a `useReducer`, not booleans:

```ts
type QuestionState =
  | { phase: "loading" }
  | { phase: "error"; error: AppError }
  | { phase: "question_loaded"; payload: QuestionPayload }
  | { phase: "answering"; payload: QuestionPayload; input: AnswerInput; dirty: boolean }
  | { phase: "checking"; payload: QuestionPayload; input: AnswerInput }
  | {
      phase: "revealing";                      // Rev 2: fetching blocks 2–10
      payload: QuestionPayload;
      input: AnswerInput;
      result: ValidationResult;
    }
  | {
      phase: "result";
      payload: QuestionPayload;
      input: AnswerInput;
      result: ValidationResult;
      response: ResponseBlocks;                // Rev 2: blocks 2–10, §40
      revealedSteps: number;
      quickCheck: QuickCheckState;             // Rev 2: block 9 has its own attempt
    }
  | { phase: "advancing" };
```

Boolean flags (`isChecked`, `isCorrect`, `showSolution`) permit impossible combinations and are the usual source of "solution visible before answering" bugs. The union makes those unrepresentable.

**Rev 2 — the `revealing` phase is not cosmetic.** Blocks 2–10 are not in the question payload at all (§40.4); they are fetched after the verdict. This is what makes the reveal policy a server guarantee rather than a rendering convention — the response cannot be read out of the DOM, out of the network tab, or out of the IndexedDB cache before an answer exists. The phase is short (a single indexed read) and the verdict is already on screen while it resolves, so it is invisible in practice; where the response is already cached from a previous attempt at the same question, it resolves synchronously.

**`checking` still renders no spinner.** Nor does `revealing` render one over the verdict — the verdict is instant and the response pane fills a moment later, which reads as fast rather than as loading.

### 18.2 Rendering

**Question stem** — `payload.stemBlocks` mapped to components: `text` → `<Text>`; `math` → `<MathSvg hash>` resolving `payload.mathRenders[hash]` (inline SVG XML in the payload, no network fetch); `mixed` → a `<Text>` with inline `<MathSvg>` children using `depthEx` for baseline alignment; `asset` → `<DiagramView>`; `table` → `<QuestionTable>`; `list` → `<QuestionList>`.

**Mathematics (D-01)** — the SVG is inlined into the document, sized in `ex` units against the current font size (an `ex` is ~0.5 em for the MathJax font) so it scales with browser text-size settings, which a fixed-size image would not. `aria-label` from `block.alt` or the LaTeX source; `role="img"`. **The SVG's intrinsic dimensions must be set from the payload's `widthEx`/`heightEx`/`depthEx` before paint** — this is the single measure that keeps CLS under the §28.1 gate, because an unsized inline SVG reflows the entire question when it lays out.

**Diagrams** — `next/image` with a long cache TTL, `object-fit: contain`, explicit width and height from the asset record (again for CLS), click or tap to open a zoomable dialog, `alt` from `altText`.

**The response pane (Rev 2, §40.5)** — blocks 2–10, rendered from `ResponseBlocks`. On viewports ≥1024px it is a sibling column with four tabs (Solution · Concepts · Quick Check · Notes); below that it is a numbered accordion beneath the question. **One component tree, two layouts, driven by a container query rather than a user-agent test** — the same student on the same device rotating a tablet must not get a different component instance and lose their revealed-step state.

**Answer input** — polymorphic on `payload.answerSpec.answerType`:

| Type                       | Component                      | Notes                                                                                 |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------- |
| `option_id`                | `OptionList`                   | order from `practice_session_items.option_order`; large tap targets; single selection |
| `option_set`               | `OptionList multi`             |                                                                                       |
| `numeric_*`, `currency`    | `NumericKeypad`                | **custom keypad, not the system keyboard** — needs `-`, `.`, and no autocorrect/emoji |
| `fraction`, `mixed_number` | `FractionInput`                | separate numerator/denominator fields with a whole-number slot                        |
| `ratio`                    | `RatioInput`                   | 2–3 segments with `:` separators                                                      |
| `with_units`               | `NumericKeypad` + `UnitPicker` | unit picker only when `units.requirement !== 'none'`                                  |
| `expression`               | `ExpressionInput`              | text field plus a symbol palette (`x`, `y`, `^`, `√`, `π`, brackets, `/`)             |
| `coordinate`               | `CoordinateInput`              | `( _ , _ )`                                                                           |
| `structured`               | `PartAccordion`                | one input per part, each independently checkable                                      |

### 18.3 Layout invariants (testable)

Each is an automated test, not a design note. Viewports tested: 360×640, 768×1024, 1280×800, 1920×1080.

1. The stem is **never** scrolled out of reach of the answer input at any tested viewport at default text size.
2. The on-screen keypad (touch) **never** covers the stem — the content area shrinks, it does not slide under.
3. `CHECK ANSWER` is always reachable without scrolling past the input, and is disabled until input is non-empty.
4. Mathematics renders at ≥16px equivalent and survives browser text scaling to 200% without horizontal overflow.
5. **Cumulative Layout Shift on the question route is < 0.1**, measured after maths and diagrams paint. This is the invariant most likely to be violated by a well-meaning change, and it is a release gate (§28.1).
6. **In practice, the timer shows elapsed time, is neutral, and is dismissible. In a timed simulation it is a countdown and cannot be dismissed.** The two must be visually unmistakable; a test asserts the countdown never renders on a practice route.
7. **Blocks 2–10 are absent from the DOM and from every network response until an answer or explicit skip is recorded** (§40.4). Tested by inspecting the payload, not the rendered output.
8. The question navigator is present and operable by keyboard: Tab reaches it, arrows move within it, Enter selects.
9. The whole screen is operable by keyboard alone: focus the input, type, Enter to check, Enter again to advance.
10. No hint, no "show answer", no AI affordance, no advertisement.

### 18.4 Behaviour details

- **CHECK** runs `@edmar/answer-core.validate()` synchronously, transitions to `result`, and enqueues the attempt. There is no `await` between the tap and the verdict.
- **Correct** — restrained affirmative, no confetti. Over-celebrating a routine correct answer is patronising to a sixteen-year-old.
- **Incorrect** — "Not quite", the student's answer beside the correct one, and if `result.matchedCommonErrorKey` resolves, the targeted misconception note. **Never red as the primary colour** — red is the marking pen.
- **Wrong precision** gets its own message, distinct from wrong value (§10.7).
- **Guided solution (block 4)** — steps revealed one at a time with a _Show all_; each step shows its `result_blocks` chip and its marks where present.
- **Blocks 2, 3, 6, 7, 8, 10 are shown at once** on reveal — a student already marked wrong wants the strategy and the reason immediately, and staging those is friction dressed as pedagogy (blueprint §C.10).
- **Quick check (block 9)** — a real input with its own validation, its own attempt row at reduced weight, and its answer revealed only after an attempt or an explicit reveal.
- **Notes** — autosaved with a 750ms debounce; a failed save retries and never silently discards typing.
- **Skip** — records `was_skipped`, transitions straight to `revealing`.
- **Back-out mid-session** — session stays `in_progress`; Home offers Continue.
- **Reload / restored tab** — the Zustand session store is persisted to IndexedDB on every phase change, so a reload resumes on the same question with the same option order and the same revealed-step count. **In a timed simulation the remaining time comes from the server on every mount** (D-22), never from persisted client state.

### 18.5 Progress indicator

`4 / 10` in the header, plus a thin bar. Correctness is **not** shown per item during the session — a running score turns practice into a test and changes how students behave on the questions they are least sure about.

---

## 19. NAVIGATION ARCHITECTURE

_Rev 2: Next.js App Router route tree for `apps/web`. The Expo Router tree from Rev 1 is retained for `apps/mobile` at V2 and is reproduced at the end of this section._

```
app/
├── layout.tsx                        Root providers: Query, Auth, Theme,
│                                     Entitlement, SyncQueue, ServiceWorker
├── (marketing)/                      PUBLIC, indexed, no auth, no app chrome
│   ├── page.tsx                      landing
│   ├── pricing/                      price, what free includes, what premium adds
│   └── about/                        incl. CXC non-affiliation notice
│
├── (onboarding)/                     No sidebar; linear; skippable where marked
│   ├── value/    sitting/    interests/
│   └── first-question/               → the question screen, anonymous
│
├── (auth)/                           sign-in · sign-up · reset
│                                     (the 13+ age control is inline on sign-up, S-07)
│
├── (app)/                            AUTHENTICATED SHELL — persistent sidebar (§P.2)
│   ├── layout.tsx                    sidebar + session strip + account menu
│   ├── home/
│   ├── practice/
│   │   ├── page.tsx                  modules → topics, with exam weight + mastery
│   │   ├── [topicId]/                subtopics / objectives
│   │   └── setup/                    count + difficulty
│   ├── session/[sessionId]/
│   │   ├── q/[position]/             THE QUESTION SCREEN (§18)
│   │   └── results/
│   ├── diagnostic/
│   │   ├── page.tsx                  intro: what it is, how long, what you get
│   │   ├── [sessionId]/q/[position]/ runner — NO per-item feedback (§41.2)
│   │   └── [sessionId]/results/      coverage map + first readiness reading
│   ├── simulate/
│   │   ├── page.tsx                  library: forms, past attempts, best marks
│   │   ├── [examSessionId]/q/[position]/   runner — server-anchored countdown
│   │   ├── [examSessionId]/overview/ navigation grid, flags, answered state
│   │   ├── [examSessionId]/results/  overall · per module · per CK/AK/R · pace
│   │   └── [examSessionId]/review/[position]/   full ten-block response per item
│   ├── progress/
│   │   ├── page.tsx                  readiness + trend, projection, weak areas
│   │   ├── topic/[topicId]/          topic → objective detail
│   │   └── history/                  filters: incorrect · misconceptions · skipped
│   ├── readiness/explainer/          "what this number is, and what it is not" (§42.7)
│   ├── bookmarks/    notes/
│   └── account/                      profile · sitting · subscription · settings ·
│                                     data export + deletion
│
└── api/
    ├── billing/webhook/              processor webhooks ONLY (§23.5)
    └── health/
```

**Rules.**

1. **`(app)` is the only authenticated shell**, and the sidebar is rendered once in its layout — never per page, or the session strip flickers on navigation.
2. **The question screen is a route, not a modal.** A student must be able to reload, bookmark, and use the browser back button inside a session without losing state (§20.4). Rev 1's "full screen, tab bar hidden" becomes "the sidebar collapses to icons on the session routes" — the session is focused, not chrome-less, because on a laptop removing all navigation is disorienting rather than immersive.
3. **`/simulate/[id]/q/[position]` reads its remaining time from the server, not the client** (D-22). A reload does not reset the clock; a restored tab shows true remaining time; an expired session redirects to results with what was answered.
4. **Marketing routes are the only indexed ones.** Everything under `(app)` sends `noindex` and requires auth — which is both a product decision and the first line of the bulk-extraction defence (§25, blueprint R-18).
5. **Browser back inside a session** does not prompt — it navigates within the session as expected, and the session stays `in_progress`. Leaving the session entirely is an explicit action.
6. **Deep links** are ordinary URLs, which is one of the quiet advantages of web-first: `/practice/[topicId]`, `/session/[id]`, `/simulate/[id]` all work when pasted into a class group, falling back to sign-in and then resuming the intended destination.

**Mobile route tree (V2).** The Expo Router structure specified in Rev 1 — `(onboarding)`, `(auth)`, `(tabs)` with home/practice/papers/progress, full-screen `session/` and `paper/` stacks, `profile/` stack and `modals/` — is retained unchanged for `apps/mobile`, with two additions from Rev 2: a `diagnostic/` stack and a `simulate/` stack replacing the reserved `papers` slot's ambiguity. The four-tab bar becomes **Home · Practice · Simulate · Progress**, since simulation is now a core capability rather than a V1 addition.

---

---

## 20. STATE MANAGEMENT

### 20.1 Allocation

| Kind of state               | Where                            | Library                             | Persisted?                  | Examples                                                          |
| --------------------------- | -------------------------------- | ----------------------------------- | --------------------------- | ----------------------------------------------------------------- |
| **Server state**            | query cache                      | TanStack Query v5                   | yes, to IndexedDB           | taxonomy, payloads, mastery, readiness, entitlement, history      |
| **Auth session**            | Supabase cookie session          | `@supabase/ssr`                     | httpOnly cookie             | access + refresh token — **never in `localStorage`** (§25)        |
| **Ephemeral session state** | Zustand                          | `zustand` + `persist` → IndexedDB   | yes                         | current question phase, input value, revealed steps, option order |
| **Response blocks 2–10**    | query cache, per question        | TanStack Query v5                   | yes, **after reveal only**  | the ten-block response (§40.4)                                    |
| **Onboarding draft**        | Zustand                          | `zustand`                           | yes, until account creation | exam sitting, selected interests                                  |
| **Offline write queue**     | Zustand + IndexedDB              | custom                              | yes                         | pending attempts, pending events                                  |
| **Simulation remaining time** | **not client state**           | server, per mount (D-22)            | **never**                   | remaining seconds — a persisted countdown is a defect             |
| **UI-local**                | `useState` / `useReducer`        | React                               | no                          | accordion open, modal visible, text field focus                   |
| **Theme**                   | Context                          | React                               | preference only             | resolved colour scheme                                            |

### 20.2 What is deliberately _not_ global

Question content is **not** in a global store. It lives in the query cache keyed by `questionVersionId`, and screens read it with `useQuestionPayload(id)`. Putting content in a global store is the mistake that leads to hard-coded question data in components (§38 forbidden item 5) and to cache invalidation being reimplemented by hand.

### 20.3 Zustand stores (exactly four)

```ts
// stores/sessionStore.ts    current practice session, persisted
{ sessionId, items[], position, phase, input, revealedSteps, results[],
  startedAt, actions: { start, setInput, check, reveal, next, abandon } }

// stores/syncStore.ts       offline write queue, persisted
{ pendingAttempts: QueuedAttempt[], pendingEvents: AnalyticsEvent[],
  isSyncing, lastSyncAt, actions: { enqueue, flush, clear } }

// stores/onboardingStore.ts pre-account draft, persisted
{ examSittingYear, examSittingMonth, interestTopicIds[], anonUserId }

// stores/uiStore.ts         cross-screen UI, NOT persisted
{ isOffline, activeBanner, paywallContext }
```

**Four stores, all justified.** Any fifth store proposal must state which of these it cannot live in — and Rev 2's new capabilities did not earn one: the diagnostic and simulation runners reuse `sessionStore` with a different `mode`, and readiness is server state in the query cache, not client state. **Readiness and projection values are never held in a Zustand store**, because a value a client can hold is a value a client can be tempted to compute (D-18, D-20).

### 20.5 Service worker and the offline contract (Rev 2, web)

Hand-written (`apps/web/worker/`), not a framework plugin, because the caching rules are specific:

| Asset                                | Strategy                | Rationale                                                                    |
| ------------------------------------ | ----------------------- | ---------------------------------------------------------------------------- |
| App shell, JS, CSS                   | stale-while-revalidate  | Instant repeat loads; updates arrive on the next navigation                  |
| Question payloads for the **active** session | cache-first, explicit precache at session start | This is what makes a dropped connection survivable |
| Response blocks 2–10                 | cache-first, **after reveal only** | Caching before reveal would defeat §40.4 at the cache layer          |
| Diagrams and SVG referenced by cached payloads | cache-first, long TTL | Immutable by construction                                          |
| Taxonomy                             | stale-while-revalidate  | Changes rarely; staleness is harmless                                        |
| Mastery, readiness, projection, entitlement | **network-only**  | A cached readiness reading or a cached band is a wrong number shown confidently — the one failure this product cannot afford |
| Attempt writes                       | queued in IndexedDB, replayed on `sync` | Idempotent on `client_attempt_id`                            |

**The network-only row is the important one.** Everything else can be stale for a while without harming anyone; a stale projection cannot. If the network is unavailable, the readiness surfaces show *"last read <n> days ago"* against the stored snapshot's timestamp — an explicitly dated historical value, never presented as current.

### 20.4 Query keys and cache policy

```ts
const qk = {
  topics: (syl: string) => ["topics", syl] as const,
  subtopics: (topicId: string) => ["subtopics", topicId] as const,
  payload: (vId: string) => ["payload", vId] as const,
  mastery: () => ["mastery"] as const,
  topicMastery: () => ["topicMastery"] as const,
  entitlement: () => ["entitlement"] as const,
  usage: (d: string) => ["usage", d] as const,
  recommendation: () => ["recommendation"] as const,
  history: (f: HistoryFilter) => ["history", f] as const,
  papers: () => ["papers"] as const,
};
```

| Key                       | `staleTime` | `gcTime` | Persist | Invalidated by                                       |
| ------------------------- | ----------- | -------- | ------- | ---------------------------------------------------- |
| `topics`, `subtopics`     | 24 h        | 7 d      | ✅      | `content_version` change                             |
| `payload`                 | `Infinity`  | 30 d     | ✅      | `content_version` change (immutable by construction) |
| `mastery`, `topicMastery` | 0           | 1 d      | ✅      | `fn_record_attempt`, `fn_complete_session`           |
| `entitlement`             | 5 min       | 1 d      | ✅      | `verify-purchase`, app foreground                    |
| `usage`                   | 1 min       | 1 d      | ✅      | every attempt                                        |
| `recommendation`          | 10 min      | 1 d      | ✅      | session completion                                   |
| `history`                 | 1 min       | 1 d      | ✅      | attempt sync                                         |

`content_version` is checked on launch and on foreground; a change invalidates `topics`, `subtopics` and any `payload` whose question changed — **not the whole cache**, which would force a re-download on a metered connection.

### 20.5 Offline sync

```
enqueue(attempt)          → MMKV immediately, before any UI transition
flush()                   → triggered on: connectivity regained, app foreground,
                            session completion, and a 30 s timer while pending > 0
                          → batches up to 50, calls fn_record_attempt per item
                          → on success: remove from queue
                          → on 4xx (not 429): remove and log — a permanently
                            invalid attempt must not block the queue forever
                          → on 5xx/429/network: exponential backoff, keep
maxAge                    → 30 days; older entries are dropped with an analytics event
```

Idempotency comes from `client_attempt_id` (§6.5), so a double-flush is harmless. **This is why the queue can retry aggressively without risk.**

---

## 21. ADMIN APPLICATION

### 21.1 Stack and access

Next.js 14 App Router, TypeScript strict, React Server Components by default, server actions for mutations, Tailwind + shadcn/ui, TanStack Table for grids, deployed to Vercel. Auth is Supabase with the **same** user pool; access is gated on `profiles.role != 'student'` in middleware **and** re-checked server-side in every action. **MFA mandatory for all admin accounts.**

### 21.2 Routes

```
app/(auth)/sign-in                    email + password + TOTP
app/(dash)/                           layout: role-aware sidebar
  ├── page.tsx                        Dashboard (§21.4)
  ├── questions/
  │   ├── page.tsx                    list, filters, bulk actions
  │   ├── new/page.tsx                create
  │   └── [id]/
  │       ├── page.tsx                editor (§22)
  │       ├── versions/page.tsx       history + diff + revert
  │       └── metrics/page.tsx        quality metrics, wrong-answer distribution
  ├── review/
  │   ├── page.tsx                    queue
  │   └── [id]/page.tsx               review workspace (§21.5)
  ├── curriculum/
  │   ├── page.tsx                    tree
  │   ├── objectives/page.tsx         specific objectives, needs_human_review filter
  │   ├── skills/page.tsx             controlled vocabulary
  │   └── mapping/page.tsx            V2018 ↔ V2027 side-by-side
  ├── papers/
  │   ├── page.tsx
  │   └── [id]/page.tsx               assemble, preview, publish, withdraw
  ├── jobs/
  │   ├── page.tsx                    pipeline runs, cost, throughput
  │   └── [id]/page.tsx               per-item log
  ├── reports/page.tsx                student problem reports triage
  ├── users/
  │   ├── page.tsx
  │   └── [id]/page.tsx               profile, entitlement, activity, export
  ├── analytics/page.tsx
  └── audit/page.tsx                  super_admin only
```

### 21.3 Roles

| Role               | Sees                         | Can                                                                                     |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------- |
| `viewer`           | content, analytics           | nothing                                                                                 |
| `reviewer`         | + review workspace           | edit questions, approve/reject, **suspend published**                                   |
| `curriculum_admin` | + curriculum                 | edit taxonomy, skills, mappings                                                         |
| `content_admin`    | + jobs, papers               | **publish**, retire, run pipeline jobs                                                  |
| `support`          | users, reports, entitlements | grant manual entitlement, handle reports, export/delete accounts. **No content rights** |
| `super_admin`      | everything                   | grant roles, view audit, rights withdrawal                                              |

Sidebar items are hidden by role, **and** every server action re-checks — hiding a button is not authorisation.

### 21.4 Dashboard

Ordered by what actually needs attention: review-queue depth **with the age of the oldest item** (a queue growing faster than it drains is the most important operational signal in the business); escalations; open student reports sorted by traffic on the affected question; quality-flagged questions; running/failed jobs with month-to-date AI spend against cap; published counts by topic with coverage gaps highlighted against the official Paper 01 item weights (§0.3); yesterday's actives, attempts and new subscriptions.

### 21.5 Review workspace — optimised for throughput

Everything on one screen, no tab switching:

- Left: the question **rendered exactly as the student sees it** — same block renderer, same MathJax SVGs, same 375 pt width constraint. "It looked fine in admin" is a defect class this eliminates.
- Right, stacked: answer spec + **live test harness** (§22.6); solution steps; explanation; proposed curriculum mapping **with the syllabus objective text alongside**; AI provenance (model, prompt version, confidence, cost); the validation report; duplicate candidates; the P10 concern list.
- Actions: Approve · Approve with edits · Request changes · Reject (reason required, controlled list) · Escalate.
- **Keyboard shortcuts**: `A` approve, `E` edit, `C` request changes, `R` reject, `J`/`K` next/previous, `?` help. At 40 items/day mouse travel is measurable.
- Review timer runs automatically and writes `question_reviews.review_seconds`.
- Strict-path items (§13.8) show a mandatory "I solved this independently" checkbox before Approve enables.

### 21.6 Question list

Server-side pagination, filters on every classification axis plus status, provenance, rights status, reviewer, date, flags. Full-text search on `stem_plain`. Bulk: assign reviewer, change status, retire, re-validate, export. **Must stay under 300 ms per page at 10,000 rows** — an admin tool that takes four seconds a page is an admin tool people stop using.

### 21.7 Curriculum editor

Tree of syllabus → module → topic → subtopic → objective, with question counts per node. Objectives filtered by `needs_human_review` for the Phase-4 verification pass (§0.3). Skills managed as a controlled vocabulary with a visible count against the 150–250 target. Deletion is blocked by `ON DELETE RESTRICT` and surfaces the dependent count instead of failing opaquely. **EdMar-construct nodes (subtopics, skills) are visually badged** so nobody mistakes them for CXC structure.

### 21.8 Paper management

Create, set metadata, assemble in order with drag-reorder, set marks per position, preview as a student, publish. Blueprint calls for a rights-withdrawal control; here it is `POST /api/content/withdraw-by-rights` — one action, `super_admin` only, fully audited, **and it has a test** (§27.9).

### 21.9 Users, reports, analytics, audit

Users: find by email, view profile/entitlement/activity summary, grant manual entitlement (audited, `source='manual'` only), handle export and deletion. **Support cannot browse a minor's detailed answer history without recording a support reason** — the detail view requires a reason string that is written to `audit_log`.

Reports: triage queue, jump to the question, one-click suspend, resolve with an outcome.

Analytics: reads materialised views only, never live aggregates over `attempts`.

Audit: searchable, exportable, read-only for everyone including `super_admin`.

---

## 22. ADMIN QUESTION EDITOR

### 22.1 Layout

> **Rev 2:** the editor covers **all ten presentation blocks** (§40) and its preview renders them in the student's grouping — the four-tab layout at ≥1024px and the numbered accordion below it, switchable by a viewport toggle. A reviewer approving a question must be able to see exactly what a student on a phone will see, because that is where most of them are.


Split view. Left = structured editing. Right = live student-accurate preview at a 375 pt frame. The preview uses the **same** `packages/design` block renderer as the mobile app, imported directly — not a reimplementation.

### 22.2 Editable fields and validation rules

| Field                  | Control                                           | Validation                                                                                                                            | Blocks publish     |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| Question type          | select                                            | must match the presence of `options` / `parts`                                                                                        | ✅                 |
| Provenance             | select                                            | —                                                                                                                                     | ✅ if `unknown`    |
| Rights status          | select                                            | **`third_party_unlicensed` blocks publish outright**                                                                                  | ✅                 |
| Stem blocks            | block editor (text / math / asset / table / list) | ≥1 block; total plain length 5–1,500                                                                                                  | ✅                 |
| LaTeX (per math block) | inline editor + palette                           | allowlist (§11.3); must render                                                                                                        | ✅                 |
| Options                | repeatable rows                                   | 2–5; keys contiguous from A; exactly one correct for MCQ; no duplicate content; no distractor equal to the answer after normalisation | ✅                 |
| Answer spec            | structured form + **test harness**                | schema-valid; round-trip self-check passes (§13.7 check 6); tolerance present for numeric types                                       | ✅                 |
| Solution steps         | ordered repeatable                                | ≥1 step; no `AUTO-DERIVED` note remaining; marks sum to `marks` when both set                                                         | ✅ (warn on marks) |
| Explanation            | textarea + reading-level meter                    | 40–900 chars; grade ≤ 9 (warn)                                                                                                        | ✅ on length       |
| Common errors          | repeatable                                        | key pattern; `wrongValue` or `wrongOptionKey` present; misconception ≥10 chars; **≥2 rows required in Rev 2**                          | ✅ _(Rev 2)_        |
| Curriculum mapping     | objective picker with syllabus text               | ≥1 objective in the declared syllabus                                                                                                 | ✅                 |
| Skills                 | multi-select from vocabulary                      | 1–3; from the controlled list only                                                                                                    | ✅                 |
| Subtopic               | select / create                                   | —                                                                                                                                     | ✗                  |
| Difficulty band        | 1–5 selector with the band definitions shown      | required                                                                                                                              | ✅                 |
| **Concepts required**  | objective picker, 1–4 chips                       | every chip resolves to a real Specific Objective in the declared syllabus                                                              | ✅ _(Rev 2)_        |
| **Strategy**           | block editor                                      | 1–3 sentences; must not restate the first solution step verbatim                                                                      | ✅ _(Rev 2)_        |
| **Final answer**       | block editor                                      | **CAS-checked against the answer spec's canonical value** (§40.6)                                                                      | ✅ _(Rev 2)_        |
| **Why this works**     | block editor + reading-level meter                | 2–4 sentences; grade ≤ 9 (warn)                                                                                                       | ✅ _(Rev 2)_        |
| **Exam tip**           | block editor                                      | non-empty; similarity to *why this works* < 0.9 (warn)                                                                                | ✅ _(Rev 2)_        |
| **Quick check**        | prompt block editor + its own answer-spec harness | schema-valid answer spec; **must not be identical to the parent item**; its answer verifies                                            | ✅ _(Rev 2)_        |
| **Step results**       | per-step block editor                             | every solution step has a `result_blocks` chip                                                                                        | ✅ _(Rev 2)_        |
| Profile dimension / **cognitive level** | CK/AK/R                          | **required in Rev 2** — drives the simulation profile split (§41.3)                                                                   | ✅ _(Rev 2)_        |
| **Accuracy rule**      | select                                            | consistent with the answer spec's tolerance                                                                                           | ✅ _(Rev 2)_        |
| **Verification**       | derived, read-only                                | `verified` only when validators pass **and** a human review is recorded                                                               | ✅ _(Rev 2)_        |
| **Ambiguity note**     | textarea                                          | optional; renders as "None" when empty                                                                                                | ✗                  |
| Marks                  | number                                            | 1–20                                                                                                                                  | ✗                  |
| Source metadata        | year, month, paper, question no, part             | typed fields, never a concatenated string                                                                                             | ✗                  |
| Assets                 | upload + alt text                                 | **alt text ≥10 chars mandatory**; SVG sanitised on upload                                                                             | ✅                 |
| Calculator allowed     | toggle                                            | —                                                                                                                                     | ✗                  |
| Is free                | toggle                                            | —                                                                                                                                     | ✗                  |
| Status                 | read-only                                         | changed only via workflow actions                                                                                                     | —                  |

### 22.3 LaTeX editing

A palette of common CSEC notation (fractions, roots, powers, trig, degrees, matrices, vectors, set operators). Inline error highlighting against the allowlist as you type. `POST /api/math/render` debounced at 400 ms returns the SVG for preview and warms `math_renders`. **Validation is immediate, not deferred to save** — a save-time failure after ten minutes of editing is the worst possible feedback timing.

### 22.4 Asset management

Upload to `draft-assets`, promoted to `question-assets` on publish. SVG is **sanitised** on upload (scripts, external references and event handlers stripped — SVG is an executable format and this is a real vector). Alt text is required before the field can be saved, not merely before publish.

### 22.5 Version history

Every version listed with author, date, change note, and a field-level diff. One-click revert creates a **new** version restoring the old content — it never mutates history.

### 22.6 The answer-spec test harness

Prominent, because it is the fastest way to catch a too-tight tolerance or a missing accepted form. The reviewer types candidate student answers into a box and sees, live, what `@edmar/answer-core` decides:

```
Correct answer: $540.00        Type: currency   Tolerance: ±0.005   Precision: 2 dp

  540           ✅ correct   (exact)
  $540.00       ✅ correct   (accepted form)
  540.0         ✅ correct   (normalised)
  539.99        ❌ incorrect (outside tolerance)
  470           ❌ incorrect → matches common error "pct_on_selling_price"
  five forty    ❌ unparseable
```

The harness runs the real package in the browser, so what the reviewer sees is exactly what the student will get.

---

## 23. SUBSCRIPTION ARCHITECTURE

### 23.1 Products

| Product ID              | Tier      | Price        | Period  | Release | Rail                       |
| ----------------------- | --------- | ------------ | ------- | ------- | -------------------------- |
| —                       | `free`    | US$0         | —       | MVP     | —                          |
| `edmar_premium_monthly` | `premium` | **US$4.00**  | monthly | **MVP** | web processor (D-21)       |
| `edmar_premium_annual`  | `premium` | **US$40.00** | annual  | V1      | web processor              |
| _(same IDs)_            | `premium` | as above     | —       | V2      | Google Play Billing        |

Prototype plans (US$25/US$220/US$35) are **not** carried over (§0.4 conflict 2).

**Rev 2: billing is live at MVP** (D-21), not stubbed. Web-first removes the store dependency, so there is no reason to defer revenue — and a stubbed paywall teaches you nothing about conversion, which is the number MVP most needs to learn. **The fixed per-transaction fee is material at US$4**: roughly 3% + a fixed amount takes a larger proportionate bite than a 15% store commission does at the annual price point, which is a commercial argument for promoting the annual plan early rather than a reason to raise the price.

### 23.2 Entitlement matrix

| Capability                        | Free                                                        | Premium       |
| --------------------------------- | ----------------------------------------------------------- | ------------- |
| Questions per day                 | `app_config.free_daily_question_limit` (10, server-tunable) | unlimited     |
| Question pool                     | `questions.is_free = true`                                  | all published |
| Worked solutions and explanations | **full quality, no restriction**                            | full          |
| Progress and mastery              | full                                                        | full          |
| Recommended practice              | yes                                                         | yes           |
| **Ten-block response**            | **full quality, no restriction**                            | full          |
| **Diagnostic assessment**         | **✓ once** (Rev 2 — it is the hook)                        | ✓ on demand   |
| **Coverage map and weak areas**   | ✓                                                           | ✓             |
| **Readiness index**               | ✓, refreshed **weekly**                                     | ✓, live       |
| **Projected grade band**          | ✗                                                           | ✓             |
| **Exam simulation**               | ✗                                                           | ✓             |
| **Misconception profile / trend** | ✗                                                           | ✓             |
| Past papers _(V1)_                | 1 sample paper                                              | all           |
| Offline packs (V1)                | ✗                                                           | ✓             |

The free tier withholds **volume and depth of insight**, not **quality**. A free student experiences the real product and runs out — which converts far better than withholding the thing being sold, and is honest.

**The Rev 2 conversion hypothesis, stated so it can be tested rather than assumed:** the diagnostic is given away because it is the moment a student learns the product knows something about them they did not know themselves; the projection and the simulations are what they pay to keep watching. §24 must measure this split explicitly — diagnostic completion → paywall view → conversion — rather than inferring it from aggregate funnel numbers.

**Enforcement note.** The projection is entitlement-gated **inside `fn_get_grade_projection`**, which returns `withheld` with reason `not_entitled` for a free student (D-20). It is not filtered in the client, and the band is never sent to a client that is not entitled to it.

### 23.3 Source-agnostic design

`entitlements.source` is `default | google_play | apple | promo | school | manual`. Every source produces the same entitlement shape, so a school licence (§U) or a promotional grant is business logic, not architecture. **`has_premium()` never inspects the source.**

### 23.4 Lifecycle

```
install ──► entitlements{tier:free, source:default, status:active}  (created by fn_handle_new_user)
   │
   │ purchase
   ▼
Play Billing success ──► verify-purchase (§8.2) ──► Play Developer API verification
                                                          │
                              ┌───────────────────────────┘
                              ▼
                    entitlements{tier:premium, source:google_play, status:active,
                                 current_period_end, auto_renewing, purchase_token}
                              │
   ┌──────────────────────────┼───────────────────────────┬─────────────────┐
   │ renewal                  │ payment failure           │ cancel          │ refund
   ▼                          ▼                           ▼                 ▼
status:active               status:grace                status:cancelled   status:refunded
period_end extended         grace_until = +3d           active until       access ends
                            ACCESS RETAINED             period_end         immediately
                              │
                     ┌────────┴────────┐
                  recovered          expired
                     ▼                 ▼
                 status:active     status:expired → free
```

**Grace period retains access.** A student whose card failed mid-revision should not lose the product; that is a churn event manufactured by the payment system, not by the student.

### 23.5 Receipt verification

**Never trust the client.** `verify-purchase` calls `purchases.subscriptionsv2.get` with a service account and acts only on the response. RTDN (§8.1) is the authoritative ongoing channel; `verify-purchase` exists only so entitlement is immediate rather than waiting for the notification. Both paths converge on the same upsert, idempotent on `purchase_token`.

`subscription_events` is an immutable ledger of every notification, verified or not, so a billing dispute can be reconstructed.

### 23.6 Enforcement — three layers, no screen logic

```
Layer 1  DATABASE   RLS on question_payloads (§5.3) + fn_check_daily_allowance (§6.3)
                    ← the actual paywall. Everything else is UX.
Layer 2  HOOK       useEntitlement() → { tier, status, isPremium, daysRemaining,
                                          allowanceRemaining }
Layer 3  UI         <PremiumGate feature="timed_exam"> wraps gated affordances
```

**No screen implements its own premium check.** A grep for `tier === 'premium'` outside `useEntitlement.ts` and `PremiumGate.tsx` must return nothing; this is a CI check (§25.10). Hard-coding premium logic per screen is how a paywall develops holes.

### 23.7 Restore, multi-device, and cancellation

Restore purchases queries Play for active subscriptions on the account and re-verifies server-side. Entitlement follows the **EdMar account**, not the device, so a student signing in on a second device has premium immediately. Cancellation is deep-linked to the Play subscription centre and is prominently placed — hiding it is a store-policy risk and a trust failure.

### 23.8 MVP behaviour

Entitlement architecture is built in MVP with billing stubbed: an admin can grant `source='manual'` premium, and free limits are enforced for real. This means the paywall is exercised end-to-end in beta, and V1 adds only the Play integration — not the enforcement model.

---

## 24. ANALYTICS

### 24.1 Approach

Events → `analytics_events` (Postgres) → scheduled materialised views → admin dashboard. **No third-party analytics SDK**, because the users are minors and cross-app profiling is not acceptable (blueprint B-11, §O.9). At the scales in §28 this needs no external infrastructure.

Events batch on device (up to 200, flushed every 60 s or on background) and post through `fn_ingest_events`.

### 24.2 Event catalogue

Names are `snake_case`, past tense, defined once in `packages/types/src/analytics.ts` and shared by both apps. **An event not in this catalogue cannot be emitted** — the union type prevents it.

**Rev 2 rule, and it is absolute: no analytics event may carry a student's projected band, their readiness index value, or a reported grade.** `projection_shown` carries the confidence and the band's *width*; `outcome_reported` carries only that a report happened. Analytics pipelines end up in third-party tools, in exports, and in support tickets; a student's projected grade must never travel that way. Aggregate analysis of projections happens in `fn_projection_calibration` (§42.6), inside the database, under audit.

| Event                           | Props                                                                     |
| ------------------------------- | ------------------------------------------------------------------------- |
| `app_opened`                    | `{ cold: boolean, app_version }`                                          |
| `onboarding_started`            | `{}`                                                                      |
| `onboarding_sitting_selected`   | `{ year, month }`                                                         |
| `onboarding_completed`          | `{ skipped_interests: boolean, seconds }`                                 |
| `account_created`               | `{ method: 'email'\|'google', from_anonymous: boolean }`                  |
| `topic_opened`                  | `{ topic_id }`                                                            |
| `practice_started`              | `{ session_id, mode, scope_kind, count, difficulty_mode }`                |
| `question_started`              | `{ session_id, question_id, position, difficulty_band }`                  |
| `answer_submitted`              | `{ session_id, question_id, answer_type, duration_ms }`                   |
| `answer_correct`                | `{ question_id, difficulty_band, attempt_no }`                            |
| `answer_incorrect`              | `{ question_id, difficulty_band, matched_common_error: boolean }`         |
| `question_skipped`              | `{ question_id, position }`                                               |
| `solution_viewed`               | `{ question_id, steps_revealed, revealed_all: boolean }`                  |
| `explanation_viewed`            | `{ question_id }`                                                         |
| `response_block_opened`         | `{ question_id, block_no }` — which of the ten blocks students actually read |
| `quick_check_attempted`         | `{ question_id, correct: boolean }`                                       |
| `note_saved`                    | `{ question_id, length }`                                                 |
| `diagnostic_started`            | `{ diagnostic_id }`                                                       |
| `diagnostic_abandoned`          | `{ diagnostic_id, items_answered, target_items }`                         |
| `diagnostic_completed`          | `{ diagnostic_id, items_answered, topics_covered, duration_s }`           |
| `coverage_map_viewed`           | `{ diagnostic_id }`                                                       |
| `simulation_started`            | `{ exam_session_id, form, blueprint_ok, mode }`                           |
| `simulation_abandoned`          | `{ exam_session_id, answered, total, seconds_remaining }`                 |
| `simulation_completed`          | `{ exam_session_id, form, marks, max_marks, late_by_s }`                  |
| `simulation_review_opened`      | `{ exam_session_id, filter }`                                             |
| `readiness_viewed`              | `{ has_index: boolean, confidence, withheld_reason }`                     |
| `readiness_withheld_shown`      | `{ withheld_reason }` — how often the gate fires, and why                 |
| `projection_shown`              | `{ confidence, band_width, weeks_to_sitting }` — **never the band itself** |
| `projection_withheld_shown`     | `{ withheld_reason }`                                                     |
| `readiness_explainer_viewed`    | `{ from_surface }`                                                        |
| `weak_area_practice_started`    | `{ objective_id, marks_at_stake }`                                        |
| `outcome_reported`              | `{ consent_version }` — **never the grade itself**                        |
| `install_prompt_shown`          | `{ accepted: boolean }`                                                   |
| `practice_completed`            | `{ session_id, correct, total, duration_s }`                              |
| `practice_abandoned`            | `{ session_id, answered, total }`                                         |
| `recommendation_shown`          | `{ scope_id, reason_kind }`                                               |
| `recommendation_accepted`       | `{ scope_id }`                                                            |
| `progress_viewed`               | `{ tab }`                                                                 |
| `paper_started`                 | `{ paper_id, mode }`                                                      |
| `paper_completed`               | `{ paper_id, answer_marks, max_marks, duration_s }`                       |
| `paywall_shown`                 | `{ context: 'limit_reached'\|'timed_mode'\|'premium_topic'\|'settings' }` |
| `upgrade_tapped`                | `{ context, product_id }`                                                 |
| `subscription_started`          | `{ product_id, source }`                                                  |
| `subscription_renewed`          | `{ product_id }`                                                          |
| `subscription_cancelled`        | `{ product_id, days_active }`                                             |
| `question_reported`             | `{ question_id, reason_code }`                                            |
| `bookmark_toggled`              | `{ question_id, on: boolean }`                                            |
| `offline_session_completed`     | `{ queued_attempts }`                                                     |
| `sync_failed`                   | `{ reason, pending_count }`                                               |
| `answer_validation_discrepancy` | `{ question_id, client_result, server_result }`                           |
| `math_render_fallback`          | `{ question_id, render_hash }`                                            |
| `app_error`                     | `{ code, screen }`                                                        |

### 24.3 Materialised views

`mv_daily_active`, `mv_weekly_cohort_retention` (**indexed by exam sitting, not calendar month** — a flat monthly churn figure for a seasonal product is actively misleading), `mv_funnel_daily`, `mv_question_stats`, `mv_topic_coverage`, `mv_skill_question_counts`, `mv_ai_spend_daily`, `mv_review_throughput`. Refreshed by `job_refresh_materialised_views` at 02:30.

### 24.4 Not collected

No precise location. No contacts, calendar or device inventory. No advertising identifiers. No third-party ad or profiling SDK. No free-text student input except problem reports. No school or class affiliation. No date of birth beyond the 13+ boolean. Nothing sold or shared.

---

## 25. SECURITY

### 25.1 Authentication

Supabase Auth: email + password with verification, Google OAuth, anonymous sessions for onboarding. Password minimum 8 characters checked against a breached-password list. Sign-in rate limited with exponential backoff and a generic failure message (no account enumeration). Access tokens 1 h with refresh rotation; refresh reuse revokes the family. Tokens in `expo-secure-store` (Keystore/Keychain), **never** in AsyncStorage or MMKV. **MFA (TOTP) mandatory for every non-student role.**

### 25.2 Authorisation

RLS is the boundary (§5). Roles from `profiles.role`, resolved server-side by `auth_role()`, **never** from a client-supplied JWT claim. Admin server actions re-check role after the middleware check. Least privilege across the six staff roles.

### 25.3 API security

Zod validation on every route-handler body. Postgres functions validate and raise. Parameterised queries throughout — the only place raw SQL is composed is migrations, which are reviewed. Rate limits (§25.7). CORS on admin routes restricted to the admin origin. No stack traces or Postgres messages returned to clients (§7.3).

### 25.4 Secrets — the definitive list

**NEVER in GitHub, NEVER in any client bundle (web or mobile), NEVER in client-side code:**

```
SUPABASE_SERVICE_ROLE_KEY      ← bypasses all RLS. The highest-value secret.
ANTHROPIC_API_KEY / OPENAI_API_KEY / any AI provider key
GOOGLE_SERVICE_ACCOUNT_JSON    ← Play Developer API
PLAY_RTDN_SHARED_SECRET
SUPABASE_DB_PASSWORD
PIPELINE_WORKER_TOKEN
SENTRY_AUTH_TOKEN
EXPO_TOKEN / EAS credentials / Android upload keystore + password
```

**Safe to ship in the client** (public by design, protected by RLS): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_APP_ENV`.

**The anon key is public and that is correct.** It grants nothing beyond what RLS permits. Treating it as a secret produces false confidence; treating RLS as the boundary produces real security.

### 25.5 Storage security

Three buckets: `question-assets` (public read, service-role write — published only), `draft-assets` (private, staff read via signed URL), `source-documents` (private, `content_admin` only). SVG sanitised on upload. Size limits: 2 MB per asset, 50 MB per source PDF. Content-type validated server-side, not from the filename. **Unpublished assets are never publicly reachable** — asset URLs are a classic draft-content leak.

### 25.6 Input validation and injection

Client: input constrained by the keypad component per answer type. Server: Zod at every route; Postgres functions type-check and raise. XSS: React escapes by default; the block renderer never uses `dangerouslySetInnerHTML`; **SVG from `math_renders` is generated by our own MathJax pipeline from allowlisted LaTeX and is additionally sanitised before storage** — it is never arbitrary user input. SQL injection: no dynamic SQL composition outside reviewed migrations.

### 25.7 Rate limits

| Surface                      | Limit                                         |
| ---------------------------- | --------------------------------------------- |
| Sign-in                      | 10/hour/IP, 5/hour/email, exponential backoff |
| Sign-up                      | 5/hour/IP                                     |
| `fn_create_practice_session` | 30/hour/user                                  |
| `fn_record_attempt`          | 600/hour/user                                 |
| `fn_report_question`         | 20/day/user, 3/minute                         |
| `fn_ingest_events`           | 240/hour/user, 200 events/batch               |
| PostgREST reads              | 120/minute/user                               |
| Admin routes                 | 300/minute/admin                              |
| `verify-purchase`            | 10/hour/user                                  |
| `account-export`             | 2/day/user                                    |

Implemented as a Postgres token-bucket table checked inside the definer functions, plus Supabase's edge limits. **Tuned generously enough never to affect a real student** — a false positive on a paying customer is more costly than the abuse it prevents.

### 25.8 Abuse prevention

Content extraction: no bulk endpoint (§7.7); session-scoped delivery; volume anomaly detection flags >400 questions/hour for review rather than auto-banning. Account sharing: concurrent-device heuristic with a soft limit and a gentle message — and it is treated as a **school-licensing sales signal**, not just abuse. Free-tier reset gaming: server-authoritative counters (D-09).

### 25.9 CI secret scanning

`scripts/check-no-secrets.sh` runs on every commit and fails the build on: the literal strings `SUPABASE_SERVICE_ROLE_KEY`, `service_role`, `sk-ant-`, `sk-proj-`, `-----BEGIN PRIVATE KEY-----`, or a JWT with `"role":"service_role"` appearing anywhere outside `.env.example` and `supabase/functions/`. Plus `gitleaks` on the full history in the nightly job.

### 25.10 CI invariant checks

```
check-no-ai-in-client.sh   fails if apps/web OR apps/mobile depends on, or imports, any of:
                           @anthropic-ai/*, openai, @google/generative-ai,
                           mathjax*, sympy bindings, or any package matching /llm|gpt|claude/i
check-no-service-role.sh   fails if the string appears in apps/mobile or in any
                           apps/admin file NOT under app/api/ or src/server/
check-entitlement.sh       fails if `=== 'premium'` or `tier ===` appears outside
                           useEntitlement.ts and PremiumGate.tsx  (§23.6)
check-no-hardcoded-questions.sh  fails on question-shaped literals in components
```

These four scripts encode the four architectural invariants most likely to erode. They are cheap and they are the reason the invariants survive contact with feature pressure.

### 25.11 Environments and data

Staging never receives production student data. Seeds are synthetic. Production database access for humans is break-glass, time-boxed and audited.

### 25.12 Backups, retention, incident response

Supabase PITR on production; **a restore is tested quarterly** — an untested backup is not a backup. Retention: attempts kept while the account is active and 24 months after; `analytics_events` raw 90 days then aggregates only; `audit_log` 7 years; soft-deleted accounts purged at 30 days. Runbooks in `docs/runbooks/`: `content-defect.md` (**suspend first, investigate second**), `security-incident.md`, `billing-dispute.md`, `data-request.md`.

---

## 26. ENVIRONMENT VARIABLES

`.env.example` — committed. Real values never are.

```bash
# ══════════════════════════════════════════════════════════════════════════════
#  PUBLIC — shipped in the client bundle (web now, mobile at V2). Safe: protected by RLS, not by secrecy.
# ══════════════════════════════════════════════════════════════════════════════
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...            # anon role only
EXPO_PUBLIC_APP_ENV=development                        # development|staging|production
EXPO_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# ══════════════════════════════════════════════════════════════════════════════
#  ADMIN — public half
# ══════════════════════════════════════════════════════════════════════════════
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_APP_ENV=development

# ══════════════════════════════════════════════════════════════════════════════
#  SERVER-ONLY SECRETS
#  NEVER prefix these with EXPO_PUBLIC_ or NEXT_PUBLIC_.
#  NEVER commit. NEVER reference from a client component.
#  Storage: Vercel env vars (admin), Supabase secrets (edge fns),
#           GitHub Actions secrets (CI), the worker's secret manager (pipeline).
# ══════════════════════════════════════════════════════════════════════════════

# --- Supabase -----------------------------------------------------------------
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...     # ⛔ BYPASSES ALL RLS. Highest-value secret.
SUPABASE_DB_PASSWORD=                       # ⛔ migrations / CI only
SUPABASE_PROJECT_REF=xxxxxxxxxxxx
SUPABASE_ACCESS_TOKEN=                      # ⛔ CLI in CI

# --- AI providers (apps/pipeline ONLY — never admin, never mobile) -------------
ANTHROPIC_API_KEY=                          # ⛔
OPENAI_API_KEY=                             # ⛔ (embeddings)
AI_MONTHLY_CAP_USD=400
AI_MODEL_EXTRACT=
AI_MODEL_CLASSIFY=
AI_MODEL_MAP=
AI_MODEL_SOLUTION=
AI_MODEL_EXPLANATION=
AI_MODEL_EMBEDDING=

# --- Google Play (edge functions ONLY) ----------------------------------------
GOOGLE_SERVICE_ACCOUNT_JSON=                # ⛔ base64-encoded
PLAY_PACKAGE_NAME=ai.edmar.maths
PLAY_RTDN_SHARED_SECRET=                    # ⛔

# --- Pipeline worker ----------------------------------------------------------
PIPELINE_WORKER_URL=https://pipeline.internal.edmar.ai
PIPELINE_WORKER_TOKEN=                      # ⛔
MATHJAX_RENDERER_PATH=./node_modules/mathjax-full

# --- Observability / release --------------------------------------------------
SENTRY_AUTH_TOKEN=                          # ⛔
SENTRY_ORG=edmar
SENTRY_PROJECT_MOBILE=edmar-mobile
EXPO_TOKEN=                                 # ⛔ EAS builds in CI
ANDROID_KEYSTORE_BASE64=                    # ⛔
ANDROID_KEYSTORE_PASSWORD=                  # ⛔
```

**Rule enforced by `check-no-secrets.sh`:** any variable in the SERVER-ONLY block appearing in `apps/mobile/**` or in an `apps/admin` client component fails the build.

---

## 27. TESTING STRATEGY

### 27.1 Layers and tools

| Layer                 | Tool                                | Location                        | Runs                                         |
| --------------------- | ----------------------------------- | ------------------------------- | -------------------------------------------- |
| Unit (packages)       | Vitest                              | `packages/*/src/**/*.test.ts`   | every commit                                 |
| Unit (mobile)         | Jest + React Native Testing Library | `apps/mobile/src/**/*.test.tsx` | every commit                                 |
| Unit (admin)          | Vitest + RTL                        | `apps/admin/src/**/*.test.tsx`  | every commit                                 |
| Database + **RLS**    | pgTAP                               | `supabase/tests/**/*.sql`       | every commit, against a fresh local database |
| API / RPC integration | Vitest + `supabase-js`              | `apps/*/tests/integration/`     | every commit                                 |
| Pipeline              | pytest                              | `apps/pipeline/tests/`          | every commit                                 |
| AI validation         | pytest + golden set                 | `apps/pipeline/tests/golden/`   | on prompt/model change, and nightly          |
| E2E mobile            | Maestro                             | `tests/e2e-mobile/*.yaml`       | pre-release, nightly                         |
| E2E admin             | Playwright                          | `tests/e2e-admin/*.spec.ts`     | every PR                                     |
| Performance           | k6 (API), Reassure (RN render)      | `tests/perf/`                   | nightly                                      |

**Coverage gates:** `packages/answer-core` **100 % branch** — it decides correctness. `packages/content-schema` 95 %. Database functions 100 % of branches via pgTAP. Everything else 70 %.

### 27.2 `@edmar/answer-core` — the critical suite

Table-driven, one fixture file per answer type, each case `{ input, spec, expected }`. Minimum cases per the table below; the real suite will exceed them.

```
FIXTURE  numeric_dp / currency — "selling price = $540.00", tol ±0.005, 2 dp required
  ✅ "540" · "540.0" · "540.00" · "$540" · "$540.00" · " 540 " · "540." · "$ 540.00"
  ❌ "539.99" (outside tolerance) · "5400" · "" · "abc" · "540 cm" (spurious unit)
  ⚠️ "540.000" → correct, reason 'exact' (extra precision is not an error)
  🎯 "470"  → incorrect + matchedCommonErrorKey 'pct_on_selling_price'

FIXTURE  fraction — "23/20", lowestTerms not required
  ✅ "23/20" · "1 3/20" · "46/40" (with note) · "-(-23/20)" · "23 / 20"
  ❌ "20/23" · "1.15" unless in acceptedForms · "23\20"

FIXTURE  numeric_sf — "58.7" to 3 s.f.
  ✅ "58.7"
  ❌ "58.74" → reason 'wrong_precision'
  ❌ "58.73" → reason 'wrong_precision'
  ❌ "59"    → reason 'wrong_precision'

FIXTURE  with_units — "40 cm²", units required
  ✅ "40 cm²" · "40cm2" · "40 cm^2" · "40 sq cm" · "40 square cm"
  ❌ "40"     → reason 'wrong_units'
  ❌ "40 cm"  → reason 'wrong_units'
  ❌ "40 cm³" → reason 'wrong_units'
  convertible variant: ✅ "4000 mm²"  (only when units.requirement = 'convertible')

FIXTURE  expression — "8a + b"
  ✅ "8a + b" · "b + 8a" · "8*a+b" · "8a+1b" · " 8 a + b "
  ❌ "8ab" · "9a" · "8a - b"

FIXTURE  expression factorised — "(x+1)(x+2)", specifiedForm 'factorised'
  ✅ "(x+1)(x+2)" · "(x+2)(x+1)"
  ❌ "x^2+3x+2" → correct value, wrong form

FIXTURE  ratio — "3:5", simplest form required
  ✅ "3:5" · "3 : 5"
  ⚠️ "6:10" → incorrect, reason 'not_simplified'

FIXTURE  option_id
  ✅ correct key
  ❌ wrong key → matchedCommonErrorKey from the option's link
  ❌ null / empty
```

**Property test (the one that matters most):** 5,000 generated `(input, spec)` pairs are evaluated by `@edmar/answer-core` in Node and by `fn_validate_answer` in Postgres. **Any disagreement fails CI.** This is what enforces D-06, and without it the client and server will drift within a month.

### 27.3 Question-selection tests

| #   | Given                                                      | When                                          | Then                                                               |
| --- | ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------ |
| 1   | 50 published Algebra questions, student has attempted none | request 10                                    | 10 distinct returned, all Algebra, none repeated                   |
| 2   | student attempted 45 of 50 within 30 days                  | request 10                                    | 5 fresh + `starved: true`; cooldown relaxed, not silently repeated |
| 3   | student answered Q7 **incorrectly** 10 days ago            | request 10                                    | Q7 **is** eligible (7-day incorrect cooldown)                      |
| 4   | student answered Q8 **correctly** 10 days ago              | request 10                                    | Q8 is **not** eligible (30-day cooldown)                           |
| 5   | free student, 8 of 10 used today                           | request 10                                    | 2 returned, `allowance_remaining: 0`                               |
| 6   | free student, 10 of 10 used                                | request 5                                     | error `entitlement_exhausted`                                      |
| 7   | free student                                               | request from a topic with 3 free + 40 premium | only the 3 free are candidates                                     |
| 8   | premium student                                            | same                                          | all 43 are candidates                                              |
| 9   | question and 4 variants share a family                     | request 10                                    | at most one family member appears                                  |
| 10  | difficulty `challenge`                                     | request 10                                    | every returned question is band 4 or 5                             |
| 11  | difficulty `mixed`                                         | request 20                                    | distribution within ±1 of 20/30/30/15/5                            |
| 12  | same `(student, seed)`                                     | call twice                                    | identical ordering and identical MCQ option order                  |
| 13  | scope resolves to 0 objectives                             | request                                       | error `scope_empty`                                                |
| 14  | topic has 0 published questions                            | request                                       | error `no_questions_available`                                     |
| 15  | a question is `suspended`                                  | request                                       | it is never returned                                               |
| 16  | a question is `published` but its version is not current   | request                                       | the current version is returned                                    |

### 27.4 RLS tests (pgTAP) — both directions

Every cell of §5.2. Representative assertions:

```sql
-- student cannot read a draft question
select throws_ok(
  $$ set local role authenticated;
     select set_config('request.jwt.claims', '{"sub":"<student_uuid>"}', true);
     select * from questions where status = 'draft' $$,
  NULL, 'student sees zero draft questions');            -- returns 0 rows, not an error

-- free student cannot read a premium payload
select is_empty(
  $$ select 1 from question_payloads where question_id = '<premium_q>' $$,
  'free student cannot read a premium payload');

-- premium student CAN
select isnt_empty( ... , 'premium student can read a premium payload');

-- student cannot update their own attempt
select throws_ok( $$ update attempts set is_correct = true where student_id = '<me>' $$,
                  '42501', NULL, 'attempts are immutable to students');

-- student cannot read another student's attempts
select is_empty( $$ select 1 from attempts where student_id = '<other>' $$, ...);

-- student cannot write their own entitlement
select throws_ok( $$ update entitlements set tier = 'premium' where student_id = '<me>' $$,
                  '42501', NULL, 'students cannot grant themselves premium');

-- reviewer cannot publish
select throws_ok( $$ select fn_publish_question('<q>','<v>','note') $$,
                  'P0001', NULL, 'reviewer lacks publish authority');

-- SUPER_ADMIN cannot delete an audit entry
select throws_ok( $$ delete from audit_log where id = 1 $$,
                  '42501', NULL, 'audit log is append-only for everyone');

-- support cannot edit content
select throws_ok( $$ update question_versions set explanation = 'x' where id = '<v>' $$,
                  '42501', NULL, 'support has no content rights');
```

### 27.5 Progress and mastery tests

| #   | Given                                                 | Then                                                  |
| --- | ----------------------------------------------------- | ----------------------------------------------------- |
| 1   | 3 distinct questions attempted on a skill             | `score is null`; UI shows "Getting started"           |
| 2   | 5 distinct, all correct, all band 1                   | score capped at 60 (coverage cap)                     |
| 3   | 20 distinct across bands 1–5, 80 % correct            | score in the "Strong" band; `confidence = 1.0`        |
| 4   | 10 correct on band 1 vs 10 correct on band 5          | band-5 score strictly higher                          |
| 5   | correct MCQ (4 options) vs correct numeric, same band | numeric contributes more (guess discount)             |
| 6   | 10 wrong then 10 right                                | score higher than 10 right then 10 wrong (recency)    |
| 7   | no attempts for 70 days                               | decay applied, floored                                |
| 8   | topic with 0 attempted skills                         | `student_topic_mastery` is "not started", **not 0**   |
| 9   | mastery recomputed from scratch                       | equals the incrementally-maintained value **exactly** |
| 10  | a question's correct answer is corrected              | affected attempts recomputed; mastery changes         |

### 27.6 Exam scoring tests

| #   | Given                                           | Then                                                                             |
| --- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | 9-question Paper 02, 5 fully correct            | `answer_marks` = sum of those questions' marks                                   |
| 2   | structured question, part (a) right, (b) wrong  | part marks awarded independently                                                 |
| 3   | timed session, submit after `expires_at` + 90 s | responses recorded, **not marked**                                               |
| 4   | app backgrounded 20 minutes mid-paper           | timer reflects wall clock from `server_started_at`, not app uptime               |
| 5   | device clock moved forward 2 hours              | timer unaffected — the anchor is server-side                                     |
| 6   | submit twice                                    | second call returns the first result, `409` not thrown for an identical resubmit |
| 7   | results                                         | per-topic breakdown sums to `answer_marks`; the marking-honesty note is present  |

### 27.7 Entitlement and access tests

| #   | Case                                                                 | Expected                                                   |
| --- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | free student, 11th question of the day                               | `entitlement_exhausted` at the RPC, paywall shown          |
| 2   | free student requests a premium payload by ID directly via PostgREST | 0 rows (RLS)                                               |
| 3   | premium expires overnight                                            | next session request behaves as free                       |
| 4   | premium in `grace`                                                   | full access retained                                       |
| 5   | manual entitlement granted by support                                | premium immediately; audit row written                     |
| 6   | student edits the app's local entitlement cache                      | server still refuses; no premium content served            |
| 7   | RTDN cancellation                                                    | entitlement `cancelled`, access until `current_period_end` |
| 8   | RTDN refund                                                          | access ends immediately                                    |
| 9   | duplicate RTDN for the same event                                    | idempotent, one entitlement row                            |
| 10  | restore purchases on a new device                                    | premium available after re-verification                    |

### 27.8 AI-generated content validation tests

| #   | Given                                                            | Then                                                          |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| 1   | variant whose LLM answer disagrees with SymPy                    | rejected, no retry, logged                                    |
| 2   | variant whose answer is `0.0000317` where the source's was `540` | rejected by the aesthetic gate                                |
| 3   | generated question with LaTeX outside the allowlist              | validation check 2 fails, blocked                             |
| 4   | generated solution whose final step ≠ verified answer            | check 4 fails, one regeneration, then rejected                |
| 5   | generated explanation at reading grade 13                        | warn, routed to strict review                                 |
| 6   | generated question identical to an existing one                  | L1 auto-reject                                                |
| 7   | generated variant with the same numbers as its source            | L2 auto-reject                                                |
| 8   | AI-generated question with no human review                       | **`fn_publish_question` raises.** The gate cannot be bypassed |
| 9   | prompt version changed                                           | golden set diffed; regression blocks the PR                   |
| 10  | AI returns malformed JSON twice                                  | quarantined, not retried a third time                         |

### 27.9 Content-integrity tests

| #   | Case                                                  | Expected                                                              |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| 1   | publish a question with no objective                  | raises                                                                |
| 2   | publish with 4 skills                                 | raises (max 3)                                                        |
| 3   | publish with an asset lacking alt text                | raises                                                                |
| 4   | publish with an unrendered LaTeX expression           | raises                                                                |
| 5   | publish where `validate(displayValue, spec)` is false | raises (round-trip self-check)                                        |
| 6   | publish a `third_party_unlicensed` question           | raises                                                                |
| 7   | `withdraw-by-rights` on 40 affected questions         | all 40 leave student view in one transaction; 40 audit rows           |
| 8   | update a published `question_version`                 | trigger raises (immutability)                                         |
| 9   | suspend a question mid-session                        | students already holding the payload finish; no new session serves it |
| 10  | `content_version` increments on publish               | client invalidates only the affected caches                           |

### 27.10 E2E flows (Maestro)

`onboarding-to-first-answer.yaml` · `signup-and-migrate-anonymous.yaml` · `practice-10-questions.yaml` · `wrong-answer-shows-common-error.yaml` · `offline-session-and-sync.yaml` · `free-limit-to-paywall.yaml` · `progress-updates-after-session.yaml` · `report-a-question.yaml` · `paper-timed-mode-backgrounded.yaml` (V1) · `restore-purchase.yaml` (V1).

`offline-session-and-sync.yaml` is the highest-value E2E test in the suite: airplane mode on → complete 10 questions → verify verdicts, solutions and explanations all render → airplane mode off → verify all 10 attempts sync exactly once and mastery updates.

---

## 28. PERFORMANCE

### 28.1 Targets (release gates, not aspirations)

_Rev 2: web targets. Measured on a mid-range Android phone (Snapdragon 6-series, 4 GB) over throttled 3G **and** on a laptop over broadband; the worse of the two is the number that counts._

| Metric                                        | Target                        | Measured                                        |
| --------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| **LCP (home, cold, no cache)**                | **< 2.5 s**                   | mid-range Android / 3G, production build        |
| **INP**                                       | **< 200 ms**                  | field data once live, lab before                |
| **CLS (question route)**                      | **< 0.1**                     | after maths and diagrams paint — §18.3 inv. 5   |
| Repeat load (service worker warm)             | < 800 ms                      |                                                 |
| **Question render (navigation → visible)**    | **< 400 ms p90**              |                                                 |
| **Answer verdict**                            | **< 50 ms p99**               | local, no network                               |
| Response reveal (blocks 2–10)                 | < 250 ms p90                  | one indexed read; §40.4                         |
| Session creation (10 questions)               | < 1.5 s p90 on 3G             | end to end                                      |
| **Simulation materialisation (60 items)**     | **< 3 s p90**                 | includes blueprint conformance check (§41.3)    |
| **Readiness recompute (in-transaction)**      | **< 250 ms p95**              | at 100k attempts for the student's cohort       |
| Projection computation                        | < 100 ms p95                  | reads the latest snapshot; no scan              |
| Progress screen                               | < 1 s from cache, < 2 s cold  |                                                 |
| `fn_create_practice_session`                  | < 120 ms p95                  | at 10,000 published questions                   |
| `fn_record_attempt`                           | < 60 ms p95 **excluding** the readiness recompute; < 300 ms p95 including it | the recompute is in the same transaction (D-18) |
| PostgREST payload read (10)                   | < 150 ms p95                  |                                                 |
| Admin question list (page of 50)              | < 300 ms                      | at 10,000 rows                                  |
| Session payload size                          | < 500 KB for 10 questions     | including SVG and diagrams                      |
| **JS shipped on the question route**          | **< 250 KB gzipped**          | no maths engine (D-01) is most of why           |
| Error-free sessions                           | > 99.5 %                      |                                                 |

The 400 ms question render determines whether the product _feels_ good; **CLS determines whether the mathematics feels trustworthy** — text that jumps as an expression lays out reads as unreliable, which is fatal for a product whose claim is accuracy. Both are achievable because the payload is a single denormalised row (D-14) and the mathematics is pre-rendered, correctly-sized SVG (D-01), so rendering is layout, not computation.

**The `fn_record_attempt` row deserves a note.** Rev 2 puts a readiness recompute inside the attempt transaction (D-18), which is a deliberate latency trade: it costs up to ~240 ms on the write path in exchange for never showing a student a stale reading and never operating a queue that can fall behind. The write is already asynchronous from the student's point of view — the verdict rendered instantly and locally, and the attempt is queued — so this latency is invisible to the student and is spent where it buys correctness. If it ever exceeds the p95 gate at scale, the correct response is to make the recompute incremental, **not** to move it out of the transaction (§30 scale checkpoints).

### 28.2 Database

Indexes as specified per table in §3. The hot paths and their indexes:

| Query                                     | Index                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| candidate questions by objective + status | `idx_qo_objective`, `idx_q_published`                                      |
| cooldown anti-join                        | `idx_at_student_q` (`student_id, question_id, created_at desc`)            |
| payload fetch by version IDs              | `question_payloads` PK                                                     |
| mastery read                              | `student_skill_mastery` PK                                                 |
| history, incorrect only                   | `idx_at_student_time` + partial `idx_at_wrong`                             |
| daily usage                               | `student_daily_usage` PK                                                   |
| admin list                                | composite on `(status, difficulty_band, created_at)` + GIN on `stem_plain` |

`EXPLAIN ANALYZE` on the seven hot queries is a CI artefact: a plan regressing to a sequential scan on `attempts` or `questions` fails the build.

### 28.3 Caching

| Layer          | What                                       | TTL                                             |
| -------------- | ------------------------------------------ | ----------------------------------------------- |
| CDN            | `question-assets`, published SVG/PNG       | 1 year, immutable (paths are content-versioned) |
| MMKV           | question payloads, taxonomy, mastery       | until `content_version` change                  |
| React Query    | in-memory + persisted                      | §20.4                                           |
| Postgres       | materialised views for analytics           | refreshed 02:30                                 |
| `math_renders` | content-addressed, shared across questions | permanent                                       |

### 28.4 Mobile specifics

Hermes enabled. Payload rendering memoised per `questionVersionId`. `FlashList` for every long list. `expo-image` with disk cache for diagrams. SVG parsed once and memoised — parsing the same SVG on every re-render is the most likely performance regression in this app and is guarded by a Reassure test. No unnecessary re-render on keystroke: the answer input is uncontrolled with a debounced commit to the reducer.

### 28.5 Network

Session materialisation is **one** round trip for IDs and **one** for payloads. Payloads are `gzip`/`br` compressed by PostgREST. Cached payloads are never re-fetched. Attempts are batched. On a metered connection, a returning student re-downloads essentially nothing.

### 28.6 Alerting

Sentry for crashes and JS errors; Supabase logs and a scheduled `job_health_check` for the rest. An alert fires to the on-call owner when any of the following holds:

| Signal                                                              | Threshold                      | Why it matters                                                                         |
| ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------- |
| `answer_validation_discrepancy` events                              | > 0.1 % of attempts in an hour | client and server validators have diverged — the worst bug class in this system (D-06) |
| `math_render_fallback` events                                       | > 0.5 % of question views      | a `math_renders` row is missing or malformed                                           |
| `sync_failed` events                                                | > 2 % of sessions in an hour   | the offline queue is not draining                                                      |
| Crash-free sessions                                                 | < 99 % over 6 hours            |                                                                                        |
| `fn_create_practice_session` p95                                    | > 400 ms over 15 minutes       | the selection chain has lost an index                                                  |
| `fn_record_attempt` p95                                             | > 200 ms over 15 minutes       | the mastery trigger is degrading                                                       |
| Unprocessed `subscription_events`                                   | any row older than 30 minutes  | entitlements are drifting from Play                                                    |
| Review queue oldest item                                            | > 5 days                       | the content pipeline is outrunning review capacity                                     |
| AI month-to-date spend                                              | > 80 % of `ai_monthly_cap_usd` | circuit breaker about to trip                                                          |
| `question_quality_metrics.flagged_reason = 'possible_wrong_answer'` | any new row                    | a published answer may be wrong — highest-priority content alert                       |
| Open reports on one question                                        | ≥ 5 in 24 h                    | auto-suspension has fired (§8.5)                                                       |

The first and the last two are the ones that protect students rather than uptime, and they page immediately.

### 28.7 Scale checkpoints

| Students | Action                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| 1,000    | baseline; Supabase Pro                                                                                       |
| 10,000   | add compute; review the seven hot plans; consider a read replica if admin analytics shows in student latency |
| 50,000   | partition `attempts` by month; move analytics aggregation to a replica                                       |
| 200,000  | consider a separate analytics store                                                                          |

`attempts` partitioning is planned now (key = `created_at` monthly) and implemented when the table passes ~20 M rows. Doing it early costs complexity; not planning it costs a migration under load.

---

## 29. COST CONTROL

### 29.1 The invariant

**A student answering a normal question costs: one indexed row read (usually served from the device cache, so zero) and one small insert. Zero AI calls. Zero external service calls.**

### 29.2 AI

Per §14.6: monthly hard cap at the provider _and_ in `app_config`; circuit breaker at 80 %; per-job estimates confirmed by a human; per-stage token ceilings; concurrency ≤ 4; model tiering; permanent storage of every output so nothing is ever regenerated. Expected: **~US$120–360 one-off** for a 1,200-question MVP bank; **~US$30–90/month** ongoing at 300 new questions/month; **US$0.00 per student per month**.

### 29.3 Database and storage

Payload ceiling 256 KB (constraint on `question_payloads.payload_bytes`). Assets ≤ 2 MB, SVG preferred. `math_renders` deduplication is expected to reduce rendered-math storage by roughly an order of magnitude versus per-question storage. `analytics_events` raw retention 90 days. Attempts partitioned and, beyond 24 months, aggregated.

### 29.4 Vercel

Admin is low-traffic and mostly RSC. ISR/static where possible. **No student traffic goes through Vercel** — the mobile app talks to Supabase directly, which keeps admin hosting on the free or Pro tier indefinitely.

### 29.5 Expected monthly cost

| Students | Supabase | Vercel | Storage/CDN | AI  | Total     |
| -------- | -------- | ------ | ----------- | --- | --------- |
| 100      | $25      | $0     | $2          | $30 | **~$57**  |
| 1,000    | $25      | $20    | $10         | $60 | **~$115** |
| 10,000   | $110     | $20    | $40         | $60 | **~$230** |
| 50,000   | $600     | $20    | $150        | $90 | **~$860** |

At 1,000 subscribers (US$3,400 net revenue) infrastructure is ~3 % of net. At 50,000 it is ~0.5 %.

### 29.6 Content coverage as a cost decision

Coverage targets are derived from the official Paper 01 item allocation (§0.3), so effort goes where marks are. Minimum per topic for MVP:

`questions_target(topic) = 60 × (topic.paper01_items / 20) × module_weight`

with `module_weight = 1.0` for Modules 1 and 2 and `1.35` for Module 3 (its topics carry 6 Paper 01 items each in two cases and are the least-covered by existing material). That yields, per topic: Number Theory and Computation 80 · Consumer Arithmetic 80 · Sets 60 · Measurement 80 · Algebra 1 60 · Introduction to Graphs 40 — Module 1 **400**; each Module 2 topic 60 — Module 2 **300**; Statistics 2 80 · RFG 2 120 · G&T 2 120 · V&M 2 80 — Module 3 **400**. Total **1,100**, plus roughly 100 held for the free pool and for topics that prove thin in beta — arriving at the **1,200** MVP gate stated in §0.2 and §29.5.

---

## 30. GITHUB WORKFLOW

### 30.1 Branches

```
main          protected · production · deploys admin to Vercel prod, migrations to prod
development   protected · staging   · deploys admin preview, migrations to staging
feature/*     short-lived, branched from development
fix/*         bug fixes
content/*     content and taxonomy changes (seed files)
hotfix/*      branched from main, merged to both
```

`main` and `development` require: PR, 1 approval, all checks green, up-to-date branch, no force-push, signed commits.

### 30.2 Commits

Conventional Commits, enforced by `commitlint`:

```
feat(mobile): add fraction input component
fix(answer-core): normalise unicode minus before parsing
db(migration): add question_payloads and publish function
content(taxonomy): correct 12 V2027 objective statements after human review
chore(ci): add check-no-ai-in-client
```

Scopes: `mobile · admin · pipeline · answer-core · content-schema · types · api-client · design · db · ci · docs · content`.

### 30.3 Pull requests

Template requires: what changed, why, which phase (§32), migrations included, tests added, screenshots for UI, and an explicit **"invariants unaffected"** checkbox listing I-1…I-5 and D-01…D-15. A PR touching `packages/answer-core`, `supabase/migrations/`, or any RLS policy requires **two** approvals.

### 30.4 Migrations

```bash
supabase migration new add_question_payloads     # creates NNNN_add_question_payloads.sql
# edit; then locally:
supabase db reset                                 # rebuild from scratch + seed
pnpm test:db                                      # pgTAP incl. RLS
```

Rules: forward-only (a fix is a new migration, never an edit); every migration applies cleanly from an empty database; RLS policies ship in the same migration as the table they protect — never later; `supabase db reset` in CI proves the whole chain on every commit.

### 30.5 CI (`.github/workflows/ci.yml`)

```
on: [pull_request, push to development/main]

jobs:
  lint            → eslint, prettier, tsc --noEmit (all workspaces)
  invariants      → check-no-secrets · check-no-ai-in-client
                    check-no-service-role · check-entitlement
                    check-no-hardcoded-questions
  unit            → vitest (packages) + jest (mobile) + vitest (admin)
  database        → supabase start → db reset → pgTAP (schema, functions, RLS)
  crosscheck      → 5,000-case property test: answer-core (Node) vs
                    fn_validate_answer (Postgres). Disagreement = fail.
  content         → validate content/golden/ and content/taxonomy/ against JSON Schema
  pipeline        → pytest
  e2e-admin       → playwright
  build           → expo prebuild --no-install (dry run) + next build
  perf            → EXPLAIN ANALYZE the seven hot queries; fail on seq scan regression
```

Nightly additionally: Maestro E2E on a device farm, `gitleaks` over full history, golden-set AI regression, k6 load test against staging.

### 30.6 Deployment

| Target                | Trigger                                   | Mechanism                                                           |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| Admin staging         | merge to `development`                    | Vercel preview → staging alias                                      |
| Admin production      | merge to `main`                           | Vercel production                                                   |
| Migrations staging    | merge to `development`                    | `supabase db push` in CI                                            |
| Migrations production | merge to `main`, **manual approval gate** | `supabase db push`                                                  |
| Mobile internal       | manual                                    | `eas build --profile preview` → internal track                      |
| Mobile production     | tag `v*.*.*`                              | `eas build --profile production` → **staged rollout 5→20→50→100 %** |
| Mobile JS-only fix    | manual                                    | `eas update` (OTA) — **JS only, never a native or schema change**   |

Migrations to production are always **additive-first**: add the column, deploy code that writes both, backfill, then remove the old — so a rollback never strands data.

---

## 31. CURSOR + CLAUDE DEVELOPMENT WORKFLOW

### 31.1 The rule

**Claude implements one phase at a time and does not proceed until that phase's acceptance criteria pass.** Attempting the whole system in one operation produces a codebase nobody can review, with the invariants silently violated.

### 31.2 Per-session sequence

```
1. READ   docs/PROJECT_INSTRUCTIONS.md          ← always first, every session
2. READ   docs/MASTER_BLUEPRINT.md §§ relevant to this phase
3. READ   docs/TECHNICAL_BUILD_SPEC.md §§ named in the phase definition
4. READ   the existing code the phase touches (§33 file map)
5. PLAN   restate the phase objective, list files to create/modify,
          list the acceptance criteria. Ask if anything is ambiguous.
          DO NOT WRITE CODE UNTIL THE PLAN IS STATED.
6. IMPLEMENT   one phase only. Follow the spec's names exactly:
               table names, column names, route paths, function names,
               type names, file locations.
7. TEST   write tests first where the phase defines them; run:
              pnpm lint && pnpm typecheck && pnpm test
              pnpm test:db            (if the phase touches the database)
              pnpm check:invariants
8. FIX    iterate until green. Do not disable a test to make it pass.
          Do not widen a tolerance to make a test pass (§10.7 rule 5).
9. REVIEW git diff --stat, then read the full diff.
          Verify: no secrets, no AI import in mobile, no service-role key
          in a client bundle, no hard-coded question data, no premium
          logic outside useEntitlement/PremiumGate.
10. COMMIT  conventional message, scoped to the phase.
11. CHECK   restate the acceptance criteria and how each was verified.
            If any is unmet, STOP and report — do not move on.
12. NEXT    only then, begin the next phase.
```

### 31.3 `docs/PROJECT_INSTRUCTIONS.md` — contents

The file Cursor reads first. It contains, in this order: **the Revision 2 notice**; the eight invariants (I-1…I-8); the twenty-two decisions (D-01…D-22); the forbidden list (§38); the naming conventions (D-15); "if the spec and the code disagree, the spec wins — raise it, do not silently diverge"; "if the spec is silent, ask rather than invent"; and the current phase number.

### 31.4 Standing instructions

- **Never** change a table or column name from §3. Downstream sections depend on them.
- **Never** add a dependency not named in this spec without stating why.
- **Never** modify a file outside the current phase's scope. Unrelated changes hide real ones.
- **Never** skip a migration, a test, or a validation step because it is "obvious".
- **Never** invent CXC content, an objective code, or a mathematical answer. If content is needed, use `content/golden/` or ask.
- **Never** auto-publish AI-generated content.
- When a phase's spec is ambiguous, **ask one specific question** rather than choosing silently.

---

## 32. PHASED IMPLEMENTATION PLAN

22 phases. Each is a single commit-worthy unit with explicit acceptance criteria.

---

**P01 · Repository foundation**
Objective: a working monorepo. Files: `pnpm-workspace.yaml`, `turbo.json`, `packages/config/*`, root `package.json`, `.editorconfig`, `.gitignore`, `.env.example`, `docs/PROJECT_INSTRUCTIONS.md`, `.github/workflows/ci.yml` (lint + typecheck only). DB: none. Tests: CI green on an empty repo. Deps: none. **Accept:** `pnpm install && pnpm lint && pnpm typecheck` passes; the four invariant scripts (§25.10) plus `check-no-secrets.sh` exist and run (they pass trivially). **Commit:** `chore(repo): monorepo foundation`.

**P02 · Shared packages skeleton**
Objective: `@edmar/types`, `@edmar/config`, `@edmar/design` (tokens only) importable. Files: `packages/types/src/{domain,api,analytics,index}.ts`, `packages/design/src/tokens.ts`. **Accept:** `apps/*` can import `@edmar/types`; `eslint-plugin-boundaries` rejects a `packages → apps` import in a test fixture. **Commit:** `feat(types): shared domain types`.

**P03 · Supabase project and enums**
Objective: local Supabase running; migration 0001 with every enum from §3.0 and the `trg_set_updated_at` helper. Files: `supabase/config.toml`, `supabase/migrations/0001_enums_and_helpers.sql`. **Accept:** `supabase db reset` succeeds; pgTAP asserts every enum exists with its exact value list. **Commit:** `db(migration): enums and shared helpers`.

**P04 · Curriculum schema and taxonomy seed**
Objective: the taxonomy tables and the real V2027 data. Files: `0002_curriculum.sql`; `content/taxonomy/csec_2027_taxonomy_seed.json`; `supabase/seed/01–04`; `scripts/extract-syllabus.py`. DB: `subjects`, `syllabus_versions`, `modules`, `topics`, `subtopics`, `specific_objectives`, `skills`, `skill_prerequisites`, `skill_objectives`, `objective_mappings`. Tests: pgTAP for constraints; a seed test asserting **3 modules, 15 topics, 159 objectives**. **Human task in this phase: verify the 44 objectives flagged `needs_human_review` (§0.3).** **Accept:** seed applies; counts match; `needs_human_review` is false for every row **before P05 begins**. **Commit:** `db(migration): curriculum schema + V2027 taxonomy`.

**P05 · Content schema**
Objective: the question tables. Files: `0003_content.sql`. DB: `questions`, `question_versions`, `question_options`, `solution_steps`, `common_errors`, `question_assets`, `math_renders`, `question_objectives`, `question_skills`, `question_sources`, `question_payloads`, `question_reviews`, `question_quality_metrics`, `question_reports`, `papers`, `paper_questions`; triggers `trg_qv_immutable`, `trg_qo_exactly_one_correct`, `trg_question_status_transition`. **Accept:** every index in §3 exists; immutability trigger raises on a published-version update; the status-transition trigger rejects `draft → published`. **Commit:** `db(migration): content schema`.

**P06 · Student, progress and commerce schema**
Files: `0004_student.sql`. DB: `profiles`, `admin_role_grants`, `practice_sessions`, `practice_session_items`, `attempts`, `attempt_skills`, `exam_sessions`, `exam_responses`, `student_skill_mastery`, `student_topic_mastery`, `student_daily_usage`, `student_bookmarks`, `entitlements`, `subscription_events`, `audit_log`, `analytics_events`, `content_jobs`, `ai_generations`, `app_config` + config seeds. **Accept:** all 45 Rev 1 tables exist (the four assessment tables arrive in P17a–P17c); `fn_handle_new_user` creates a profile and a free entitlement on `auth.users` insert. **Commit:** `db(migration): student, progress and commerce schema`.

**P07 · RLS and the RLS test suite**
Files: `0005_rls.sql`, `supabase/tests/rls/*.sql`. Objective: every policy in §5.2, the helpers in §5.1, and a test for **both directions of every cell**. **Accept:** RLS enabled on every table then existing (asserted by a catalogue query that must be re-run after P17a–P17c add theirs); the full matrix passes; a student cannot read a draft, another student's attempts, or a premium payload. **This phase does not complete on "the tests I wrote pass" — it completes when the catalogue query proves no table was missed.** **Commit:** `db(migration): row level security + tests`.

**P08 · `@edmar/answer-core`**
Files: `packages/answer-core/src/*`, fixtures, tests. Objective: §10 in full for MVP types (`option_id`, `option_set`, `boolean`, numeric family, `fraction`, `mixed_number`, `ratio`, `currency`, `with_units`, `coordinate`, `expression` Tier 1). **Accept:** 100 % branch coverage; every case in §27.2 passes. **Commit:** `feat(answer-core): deterministic answer validation`.

**P09 · Database functions**
Files: `0006_functions.sql`, `supabase/tests/functions/*.sql`. Objective: all 22 functions from §6 including `fn_validate_answer`. **Accept:** every selection test in §27.3 passes; the **cross-check property test (§27.2)** passes with 5,000 cases; `fn_publish_question` refuses each of the seven preconditions. **Commit:** `db(migration): core functions`.

**P10 · Content schema package and validators**
Files: `packages/content-schema/*`, `scripts/validate-content.ts`. Objective: §11 JSON Schemas compiled with `ajv`; the round-trip self-check. **Accept:** `content/golden/` fixtures validate; malformed fixtures are rejected with a useful message. **Commit:** `feat(content-schema): canonical question schema`.

**P11 · Math rendering pipeline**
Files: `scripts/render-math.ts`, `apps/pipeline/src/render/*`, `apps/admin/app/api/math/render/route.ts`. Objective: D-01 — MathJax v3 → SVG → `math_renders`, content-addressed; the LaTeX allowlist validator. **Accept:** a corpus of **200 real CSEC expressions** renders; forbidden commands are rejected; identical expressions produce one row; a rendered SVG displays correctly in `react-native-svg` on a device. **Commit:** `feat(pipeline): MathJax SVG rendering`.

**P12 · Legacy import**
Files: `scripts/import-legacy.ts`, `scripts/unicode-math-to-latex.ts`, `scripts/infer-answer-spec.ts`, `content/legacy/*`. Objective: §12 in full. **Accept:** dry run produces the report; `--commit` on staging inserts ~28 questions at `pending_review`; **zero published**; every record has a `legacy_id`; the duplicate between `diag:Q5` and the lesson bank's interest quiz is detected; re-running changes nothing. **Commit:** `feat(scripts): legacy content import`.

**P13 · Authentication and profile** _(Rev 2: web)_
Files: `apps/web/app/(auth)/*`, `app/(onboarding)/*`, `src/lib/supabase.ts`, `src/stores/onboardingStore.ts`. Objective: anonymous sessions, sign-up with the 13+ control, sign-in, Google, reset, anonymous→permanent migration. **Accept:** an anonymous visitor completes 3 questions and their attempts survive registration; a `false` age answer prevents account creation; **the session is in an httpOnly cookie and no token appears in `localStorage` or `sessionStorage`** (asserted by a browser test, not by inspection). **Commit:** `feat(web): auth and onboarding`.

**P14 · Web shell**
Files: `app/layout.tsx`, `app/(app)/layout.tsx`, `src/components/*`, `src/theme/*`, providers, PWA manifest and service worker skeleton. Objective: §19 routes, the sidebar shell, design tokens, `MathSvg`, block renderer, empty/error/offline components, the four responsive layouts (§39.2). **Accept:** every route in §19 navigates; the block renderer displays a golden question **pixel-identically to the admin preview** (screenshot comparison at three viewports); dark mode works; **CLS < 0.1 on a golden question at all four breakpoints**. **Commit:** `feat(web): app shell and navigation`.

**P15 · Question engine + practice flow, with the ten-block response**
Files: `app/(app)/session/*`, `src/features/practice/*`, `src/stores/sessionStore.ts`, `src/hooks/*`, `ResponsePane` and the block components (§40.5). Objective: §18 state machine including `revealing`, all MVP input types, local validation, result, the full ten-block response in both tab and accordion layouts, quick-check attempts, notes, navigator, common-error matching. **Accept:** a 10-question session completes; verdicts are instant (< 50 ms, measured); the wrong-answer common-error note appears; **blocks 2–10 are absent from every network response and from the DOM until an answer or skip** (§18.3 inv. 7 — asserted against the payload); layout invariants §18.3 hold at all four viewports; **no spinner appears between CHECK and the verdict**. **Commit:** `feat(web): practice session and ten-block response`.

**P16 · Service worker, offline cache and sync**
Files: `worker/*`, `src/stores/syncStore.ts`, `src/lib/idb.ts`, query persistence. **Accept:** the `offline-session-and-sync` E2E passes in a real browser with the network disabled mid-session; a double flush produces exactly one attempt per `client_attempt_id`; a permanently-invalid attempt is dropped, not retried forever; **mastery, readiness, projection and entitlement are never served from cache** (§20.5) — asserted by a test that disables the network and confirms those surfaces show a dated historical value rather than a current-looking one. **Commit:** `feat(web): offline cache and sync queue`.

**P17 · Mastery, progress and recommendation**
Files: `app/(app)/progress/*`, mastery triggers, `fn_get_recommendation` and `fn_weak_areas` wiring. **Accept:** every case in §27.5 passes; incremental and recomputed mastery agree exactly; the recommendation always carries a reason string **and a marks-at-stake value**; weak areas are ordered by mark impact, not by ascending mastery — verified against a fixture where those two orderings differ. **Commit:** `feat(web): progress, weak areas and recommendations`.

**P17a · Diagnostic engine** _(new in Rev 2)_
Files: `0007_diagnostic.sql`, `app/(app)/diagnostic/*`, `src/features/diagnostic/*`. Objective: §41.2 in full — `diagnostic_sessions`, the difficulty walk with its `walk_log`, the runner with **no response pane mounted**, abandonment and resume, the coverage map. **Accept:** a diagnostic covers every module and every weighted topic; the same seed and the same answers reproduce the same item sequence; `not_started` is visually and structurally distinct from `needs_work` in the coverage map; an abandoned diagnostic resumes from its logged walk state; **no reveal call is made from any diagnostic route** (asserted at the network layer). **Commit:** `feat(assessment): diagnostic engine`.

**P17b · Simulation engine** _(new in Rev 2)_
Files: `0008_simulation.sql`, `app/(app)/simulate/*`, `src/features/simulation/*`. Objective: §41.3 — `fn_create_simulation` with blueprint conformance, server-anchored timing (D-22), navigator and flagging, auto-submit, deterministic marking, `marks_by_module`, `marks_by_profile`, `seconds_by_item`, results and review. **Accept:** a `p01_regular` materialises 60 items to the official allocation and sets `blueprint_ok = true` on a sufficient bank and `false` on a deliberately thinned one; **a non-conformant simulation is excluded from readiness and says so**; a reload mid-simulation shows true remaining time; a submission after expiry is accepted, marked to the deadline, and records `submitted_late_by`; closing the tab for ten minutes does not return ten free minutes. **Commit:** `feat(assessment): paper 01 simulation`.

**P17c · Readiness and projection engine** _(new in Rev 2 — the governance phase)_
Files: `0009_readiness.sql`, `packages/assessment-core/*`, `app/(app)/progress/*`, `app/(app)/readiness/explainer/*`. Objective: §42 in full — the seven functions, `readiness_snapshots`, `grade_projections`, the parameter set, the evidence gates, the explainer route. **Accept — and this phase does not complete on "it renders":**
  (a) the same attempt log produces byte-identical readiness and projection output on two clean databases (determinism, I-6);
  (b) a student with high practice accuracy and **no** simulation receives `withheld / no_simulation` — not a low-confidence band;
  (c) no issued projection can be stored without both bounds and a confidence (constraint test);
  (d) `packages/assessment-core` contains no arithmetic on readiness values (CI grep);
  (e) a free-tier student receives `withheld / not_entitled` and **the band is not present in the response payload**;
  (f) the explainer route reports this student's actual evidence counts;
  (g) the withdrawal flag turns every projection to `withheld` with no deploy.
  **Commit:** `feat(assessment): readiness index and governed grade projection`.

**P18 · Entitlement, paywall and live web billing** _(Rev 2: billing is not stubbed)_
Files: `src/hooks/useEntitlement.ts`, `src/components/PremiumGate.tsx`, `app/(app)/account/subscription/*`, `app/api/billing/webhook/*`. **Accept:** §27.7 cases 1–6 pass; `check-entitlement.sh` finds no premium logic outside the permitted files; the free limit is enforced **server-side** (verified by calling the RPC directly with a modified client); a real test-mode payment produces an active entitlement; a webhook replay is idempotent; a declined renewal produces `grace` and not immediate loss of access; **cancellation is two clicks and requires no email**. **Commit:** `feat(web): entitlement and web billing`.

**P19 · Admin console**
Files: `apps/admin/**`. Objective: §21 + §22 — auth with MFA, question list, **an editor covering all ten blocks with a live student-accurate preview at three viewports**, the answer-spec test harness, review queue with keyboard flow, curriculum editor including examination weights, publish with the §40.6 preconditions, audit, cohort monitoring, and the §42.6 calibration view. **Accept:** a reviewer completes a full draft → validate → review → publish cycle; publishing is **refused** on a question missing any block; the published question appears in the web app after a cache invalidation; the calibration view runs on synthetic outcomes and reports directional bias; **a reviewer sustains 30 items/hour against the ten-block standard in a timed trial** (the throughput gate — and if it cannot be met, U-09's response applies: more capacity or fewer topics, never fewer blocks). **Commit:** `feat(admin): review, publishing and calibration console`.

**P20 · Content pipeline**
Files: `apps/pipeline/**`, `supabase/functions/pipeline-dispatch/`. Objective: §13 stages 1–13, §16 prompts v1 **drafting all ten blocks**, §13.7 + §40.6 validators, dedupe. **Accept:** a 20-page slice of `EdMar_CXC_Mathematics_Workbook_2026.pdf` produces reviewable candidates; every §27.8 case passes; the cost estimate is within 30 % of actual; the circuit breaker refuses a job that would exceed the cap. **Commit:** `feat(pipeline): content extraction and generation`.

**P21 · Testing, performance, hardening**
Objective: fill coverage gaps, Playwright suite across the browser matrix (§17.1), k6, `EXPLAIN` gates, Core Web Vitals in CI, Sentry, runbooks, accessibility audit at WCAG 2.1 AA on the question and readiness screens. **Accept:** all §28.1 targets met on the reference phone over 3G **and** on a laptop; error-free > 99.5 % in internal use; every runbook exists and has been walked through once — including **the projection withdrawal runbook** (§42.6). **Commit:** `test: full suite and performance hardening`.

**P22 · Release**
Objective: production Vercel projects, custom domain and TLS, staged rollout by traffic percentage with automated abort on error-rate regression, tested rollback, privacy policy, terms, non-affiliation notice, projection disclosure, account deletion and export, `noindex` verified on every `(app)` route. **Accept:** §37 production checklist fully green; **a crawl of the production site returns no question content**. **Commit:** `chore(release): v1.0.0`.

**V1 additions (P23+):** Paper 02 and modular simulation forms · structured multi-part answers · past paper library (rights permitting) · **the first real projection back-test** · annual plan · email digests · admin analytics · variant generation at scale.

**V2 additions:** `apps/mobile` (P30+) · Google Play Billing with the cross-platform entitlement test · iOS · item calibration · teacher/class accounts.

### 32.1 Dependency graph

```
P01 → P02 → P03 → P04 → P05 → P06 → P07 ─┬─► P09 ─► P12
                              │           │
                              └─► P08 ────┘
P10 ─► P11 ─► P12
P07 + P08 ─► P13 ─► P14 ─► P15 ─► P16 ─► P17 ─┬─► P17a ─┐
                                               ├─► P17b ─┼─► P17c ─► P18
                                               │         │
P09 + P10 + P11 ─► P19 ─► P20 ──────────────────────────┘
all ─► P21 ─► P22
```

**P17c depends on both P17a and P17b, and that is not negotiable.** Readiness needs diagnostic coverage evidence *and* conformant simulation evidence to be anything other than a dressed-up practice average — and the projection's most important gate (`no_simulation`) cannot be tested until simulations exist. Building P17c first produces a number that looks finished and is not defensible, which is the worst possible order.

**P04's human verification of the 44 flagged objectives is on the critical path and has no software substitute.** Start it on day one of P04.

---

## 33. FILE-BY-FILE IMPLEMENTATION MAP

| Path                                                          | Purpose                                              | Feature           | Depends on          |
| ------------------------------------------------------------- | ---------------------------------------------------- | ----------------- | ------------------- |
| `pnpm-workspace.yaml`, `turbo.json`                           | workspace + task graph                               | build             | —                   |
| `docs/PROJECT_INSTRUCTIONS.md`                                | what Cursor reads first                              | process           | this spec           |
| `packages/types/src/domain.ts`                                | `Question`, `Attempt`, `Mastery`… (§35)              | all               | —                   |
| `packages/types/src/db.generated.ts`                          | generated from the database                          | all               | P06                 |
| `packages/types/src/api.ts`                                   | request/response contracts (§34)                     | all               | domain              |
| `packages/types/src/analytics.ts`                             | the event union (§24.2)                              | analytics         | —                   |
| `packages/answer-core/src/normalise.ts`                       | §10.5 normalisation profiles                         | validation        | —                   |
| `packages/answer-core/src/parse.ts`                           | `Rational`/`Decimal` parsing                         | validation        | normalise           |
| `packages/answer-core/src/units.ts`                           | unit vocabulary + conversion                         | validation        | parse               |
| `packages/answer-core/src/validators/*.ts`                    | one file per answer type                             | validation        | parse, units        |
| `packages/answer-core/src/equivalence.ts`                     | expression tiers 1–2                                 | validation        | mathjs              |
| `packages/answer-core/src/index.ts`                           | `validate()` entry point                             | validation        | all above           |
| `packages/content-schema/schemas/*.json`                      | §11 JSON Schemas                                     | content           | —                   |
| `packages/content-schema/src/validate.ts`                     | ajv compilation                                      | content, pipeline | schemas             |
| `packages/api-client/src/client.ts`                           | typed Supabase client                                | mobile, admin     | types               |
| `packages/api-client/src/case.ts`                             | **the single snake↔camel boundary (D-15)**           | mobile, admin     | —                   |
| `packages/design/src/tokens.ts`                               | colour, type, space, radii                           | UI                | —                   |
| `packages/design/src/blocks/*.tsx`                            | **shared block renderer — mobile and admin preview** | UI                | tokens, svg         |
| `supabase/migrations/0001_enums_and_helpers.sql`              | §3.0                                                 | schema            | —                   |
| `…/0002_curriculum.sql`                                       | §3.3                                                 | curriculum        | 0001                |
| `…/0003_content.sql`                                          | §3.4–3.17                                            | content           | 0002                |
| `…/0004_student.sql`                                          | §3.1–3.2 + §3.18–3.23                                | identity, student | 0003                |
| `…/0005_rls.sql`                                              | §5                                                   | security          | 0004                |
| `…/0006_functions.sql`                                        | §6                                                   | engine            | 0005                |
| `…/0007_cron.sql`                                             | §6.14                                                | ops               | 0006                |
| `supabase/seed/03_specific_objectives.sql`                    | the 159 objectives                                   | curriculum        | 0002                |
| `supabase/tests/rls/*.sql`                                    | §27.4                                                | security          | 0005                |
| `supabase/functions/play-rtdn/index.ts`                       | §8.1                                                 | billing           | 0006                |
| `supabase/functions/verify-purchase/index.ts`                 | §8.2                                                 | billing           | 0006                |
| `supabase/functions/pipeline-dispatch/index.ts`               | §8.3                                                 | pipeline          | 0006                |
| `supabase/functions/publish-question/index.ts`                | §8.4                                                 | content           | 0006                |
| `supabase/functions/report-question/index.ts`                 | §8.5                                                 | quality           | 0006                |
| `supabase/functions/account-export/index.ts`                  | §8.6                                                 | privacy           | 0006                |
| `apps/mobile/app/_layout.tsx`                                 | providers, deep links                                | shell             | api-client          |
| `apps/mobile/app/(onboarding)/sitting.tsx`                    | S-03                                                 | onboarding        | shell               |
| `apps/mobile/app/(tabs)/home.tsx`                             | S-09                                                 | home              | hooks               |
| `apps/mobile/app/session/[sessionId]/question/[position].tsx` | S-11, §18                                            | practice          | answer-core, design |
| `apps/mobile/src/components/MathSvg.tsx`                      | D-01 renderer                                        | UI                | react-native-svg    |
| `apps/mobile/src/components/AnswerInput/*.tsx`                | polymorphic input                                    | practice          | answer-core         |
| `apps/mobile/src/components/NumericKeypad.tsx`                | custom keypad                                        | practice          | design              |
| `apps/mobile/src/components/PremiumGate.tsx`                  | **the only place premium is checked in UI**          | entitlement       | useEntitlement      |
| `apps/mobile/src/hooks/useEntitlement.ts`                     | **the only entitlement source**                      | entitlement       | api-client          |
| `apps/mobile/src/hooks/useQuestionPayload.ts`                 | payload query + cache                                | practice          | api-client          |
| `apps/mobile/src/stores/sessionStore.ts`                      | §20.3                                                | practice          | mmkv                |
| `apps/mobile/src/stores/syncStore.ts`                         | §20.5                                                | offline           | mmkv                |
| `apps/mobile/src/lib/sync.ts`                                 | flush logic                                          | offline           | syncStore           |
| `apps/admin/app/(dash)/review/[id]/page.tsx`                  | §21.5 workspace                                      | review            | design/blocks       |
| `apps/admin/src/components/AnswerSpecHarness.tsx`             | §22.6                                                | editing           | answer-core         |
| `apps/admin/src/server/service-client.ts`                     | **service-role, server-only**                        | admin             | —                   |
| `apps/admin/app/api/questions/[id]/publish/route.ts`          | §7.6                                                 | publishing        | service-client      |
| `apps/pipeline/src/stages/01_extract.py`                      | §13.3                                                | pipeline          | —                   |
| `apps/pipeline/src/stages/06_answer_spec.py`                  | §13.6 SymPy authority                                | pipeline          | cas                 |
| `apps/pipeline/src/cas/sympy_solver.py`                       | CAS verification                                     | pipeline          | sympy               |
| `apps/pipeline/src/validators/*.py`                           | §13.7 suite                                          | pipeline          | content-schema      |
| `apps/pipeline/src/prompts/*.v1.md`                           | §16                                                  | pipeline          | —                   |
| `scripts/import-legacy.ts`                                    | §12                                                  | migration         | content-schema      |
| `scripts/unicode-math-to-latex.ts`                            | §12.5                                                | migration         | —                   |
| `scripts/check-no-ai-in-client.sh`                            | invariant I-1                                        | CI                | —                   |
| `scripts/check-entitlement.sh`                                | §23.6                                                | CI                | —                   |
| `tests/e2e-mobile/offline-session-and-sync.yaml`              | highest-value E2E                                    | QA                | P16                 |

---

## 34. API CONTRACTS

TypeScript-shaped. Every response is either the success shape or the §7.3 error envelope.

### 34.1 `POST /rest/v1/rpc/fn_create_practice_session`

```jsonc
// Request
{ "p_mode": "topic", "p_scope_kind": "topic",
  "p_scope_ids": ["7c1f…"], "p_count": 10,
  "p_difficulty_mode": "mixed", "p_client_seed": null }

// 200 Success
{ "sessionId": "3b9a…", "deliveredCount": 10, "requestedCount": 10,
  "allowanceRemaining": 0, "starved": false,
  "items": [ { "position": 0, "questionId": "…", "questionVersionId": "…",
               "optionOrder": ["C","A","D","B"] } ] }

// 200 Partial (content starvation — a success, honestly reported)
{ "sessionId": "…", "deliveredCount": 6, "requestedCount": 10,
  "allowanceRemaining": 4, "starved": true, "items": [ … ] }

// 400 validation_failed
{ "error": { "code": "validation_failed", "message": "p_count must be between 1 and 20",
             "details": { "field": "p_count", "received": 50 } } }

// 401 not_authenticated
{ "error": { "code": "not_authenticated", "message": "Sign in to practise." } }

// 403 entitlement_exhausted
{ "error": { "code": "entitlement_exhausted",
             "message": "You've used all 10 free questions today.",
             "details": { "limit": 10, "used": 10,
                          "resetsAt": "2026-08-20T05:00:00Z", "upgradeAvailable": true } } }

// 422 no_questions_available
{ "error": { "code": "no_questions_available",
             "message": "No questions available for this topic yet.",
             "details": { "topicId": "…", "publishedCount": 0 } } }

// 429 rate_limited        (header: Retry-After: 120)
{ "error": { "code": "rate_limited", "message": "Too many sessions started.",
             "details": { "retryAfterSeconds": 120 } } }

// 500 internal_error      (never leaks a Postgres message)
{ "error": { "code": "internal_error", "message": "Something went wrong.",
             "details": { "traceId": "01J…" } } }
```

### 34.2 `POST /rest/v1/rpc/fn_record_attempt`

```jsonc
// Request
{ "p_client_attempt_id": "b1e2…", "p_question_version_id": "…",
  "p_session_id": "3b9a…", "p_part_key": null, "p_raw_answer": "540",
  "p_was_skipped": false, "p_client_is_correct": true,
  "p_duration_ms": 41200, "p_client_created_at": "2026-08-19T14:02:11Z" }

// 200
{ "attemptId": 918273, "isCorrect": true, "matchedCommonErrorId": null,
  "discrepancy": false }

// 200 — incorrect with a matched misconception
{ "attemptId": 918274, "isCorrect": false,
  "matchedCommonErrorId": "9f3c…", "discrepancy": false }

// 200 — idempotent replay (offline queue flushed twice)
{ "attemptId": 918273, "isCorrect": true, "matchedCommonErrorId": null,
  "discrepancy": false, "replayed": true }

// 403 not_authorised — the session is not the caller's
{ "error": { "code": "not_authorised", "message": "That session isn't yours." } }

// 409 session_already_completed
{ "error": { "code": "session_already_completed", "message": "This session is finished." } }
```

### 34.3 `GET /rest/v1/question_payloads` — the payload shape (D-14)

```jsonc
{
  "questionVersionId": "…",
  "questionId": "…",
  "contentVersion": 4821,
  "payload": {
    "questionType": "numeric",
    "difficultyBand": 3,
    "calculatorAllowed": true,
    "marks": 2,
    "estimatedSeconds": 180,
    "stemBlocks": [
      {
        "type": "text",
        "value": "A shopkeeper buys an item for $450 and sells it at a profit of 20%.",
      },
      { "type": "text", "value": "Calculate the selling price." },
    ],
    "options": null,
    "answerSpec": {
      "answerType": "currency",
      "canonicalValue": "540.00",
      "displayValue": "$540.00",
      "acceptedForms": ["540", "540.0", "540.00", "$540", "$540.00"],
      "tolerance": { "kind": "absolute", "value": 0.005 },
      "precision": { "kind": "decimal_places", "value": 2, "required": false },
      "normalisation": "currency_default",
      "commonErrorValues": [{ "key": "pct_on_selling_price", "value": "470.00" }],
    },
    "solutionSteps": [
      {
        "stepNo": 1,
        "instruction": "Find the profit",
        "contentBlocks": [
          {
            "type": "math",
            "latex": "20\\% \\times 450 = 0.20 \\times 450 = 90",
            "style": "display",
            "renderHash": "a3f1…",
          },
        ],
        "marks": 1,
      },
      {
        "stepNo": 2,
        "instruction": "Add the profit to the cost price",
        "contentBlocks": [
          { "type": "math", "latex": "450 + 90 = 540", "style": "display", "renderHash": "b7c2…" },
        ],
        "marks": 1,
      },
    ],
    "explanation": "Profit percentage is always calculated on the cost price, not the selling price. Read carefully for which value the percentage refers to.",
    "commonErrors": [
      {
        "key": "pct_on_selling_price",
        "misconception": "Applied the percentage to the selling price instead of the cost price.",
        "correctiveNote": "You've worked out 20% of the wrong amount — profit is always a percentage of what the shopkeeper paid.",
      },
    ],
    "assets": [],
    "mathRenders": {
      "a3f1…": { "svg": "<svg …>", "widthEx": 24.3, "heightEx": 2.1, "depthEx": 0.6 },
      "b7c2…": { "svg": "<svg …>", "widthEx": 12.8, "heightEx": 1.8, "depthEx": 0.5 },
    },
    "topicName": "Consumer Arithmetic",
    "objectiveCodes": ["M1-2.4"],
  },
}
```

Note the SVGs are **inline in the payload**, not URLs — so a materialised session works fully offline with no asset fetch.

### 34.4 `POST /api/questions/:id/publish` (admin)

```jsonc
// Request  { "versionId": "…", "note": "Corrected step 2 arithmetic" }
// 200      { "ok": true, "contentVersion": 4822 }
// 403      { "error": { "code": "not_authorised",
//                       "message": "Publishing requires content_admin." } }
// 422      { "error": { "code": "validation_failed",
//                       "message": "Question cannot be published.",
//                       "details": { "failures": [
//                          "no_specific_objective",
//                          "asset_missing_alt_text",
//                          "solution_placeholder_present" ] } } }
```

### 34.5 `POST /functions/v1/verify-purchase`

```jsonc
// Request  { "purchaseToken": "abc…", "productId": "edmar_premium_monthly" }
// 200      { "tier": "premium", "status": "active",
//            "currentPeriodEnd": "2026-09-19T00:00:00Z", "autoRenewing": true }
// 400      { "error": { "code": "validation_failed", "message": "Unknown productId." } }
// 402      { "error": { "code": "purchase_not_valid",
//                       "message": "Google could not confirm this purchase.",
//                       "details": { "playState": "EXPIRED" } } }
```

---

## 35. TYPESCRIPT TYPES

`packages/types/src/domain.ts` — the canonical shared shapes. Database rows are `snake_case`; these are `camelCase`; conversion happens only in `packages/api-client/src/case.ts` (D-15).

```ts
// ── Identity ────────────────────────────────────────────────────────────────
export type AppRole =
  | "student"
  | "viewer"
  | "reviewer"
  | "curriculum_admin"
  | "content_admin"
  | "support"
  | "super_admin";
export type SyllabusCode = "V2018" | "V2027";
export type SittingMonth = "january" | "may_june";

export interface Profile {
  id: string;
  displayName: string | null;
  email: string;
  role: AppRole;
  territory: string;
  syllabusVersion: SyllabusCode;
  examSittingYear: number | null;
  examSittingMonth: SittingMonth | null;
  ageConfirmed13Plus: boolean;
  onboardingCompletedAt: string | null;
  locale: string;
  themePreference: "system" | "light" | "dark";
  notificationsOptIn: boolean;
  createdAt: string;
}

// ── Curriculum ──────────────────────────────────────────────────────────────
export interface Module {
  id: string;
  syllabusCode: SyllabusCode;
  moduleNo: 1 | 2 | 3;
  name: string;
  paper01Items: number;
  paper02Marks: number;
}
export interface Topic {
  id: string;
  syllabusCode: SyllabusCode;
  moduleId: string | null;
  topicNo: number;
  code: string;
  name: string;
  sequence: number;
  paper01Items: number | null;
  isActive: boolean;
}
export interface Subtopic {
  id: string;
  topicId: string;
  code: string;
  name: string;
  sequence: number;
  isEdmarConstruct: true;
}
export interface SpecificObjective {
  id: string;
  syllabusCode: SyllabusCode;
  topicId: string;
  subtopicId: string | null;
  code: string;
  objectiveNo: number;
  statement: string;
  contentNotes: string | null;
}
export interface Skill {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

// ── Content ─────────────────────────────────────────────────────────────────
export type QuestionType =
  "multiple_choice" | "multi_select" | "true_false" | "numeric" | "expression" | "structured";
export type AnswerType =
  | "option_id"
  | "option_set"
  | "boolean"
  | "numeric_exact"
  | "numeric_tolerance"
  | "numeric_sf"
  | "numeric_dp"
  | "fraction"
  | "mixed_number"
  | "ratio"
  | "currency"
  | "with_units"
  | "expression"
  | "coordinate"
  | "set"
  | "interval"
  | "matrix"
  | "vector"
  | "text";
export type ContentStatus =
  | "draft"
  | "pending_validation"
  | "validating"
  | "pending_review"
  | "changes_requested"
  | "approved"
  | "published"
  | "suspended"
  | "retired"
  | "rejected"
  | "archived";
export type ProfileDimension = "CK" | "AK" | "R";
export type DifficultyBand = 1 | 2 | 3 | 4 | 5;

export type Block =
  | { type: "text"; value: string }
  | { type: "math"; latex: string; style: "inline" | "display"; renderHash: string; alt?: string }
  | {
      type: "mixed";
      runs: Array<
        { type: "text"; value: string } | { type: "math"; latex: string; renderHash: string }
      >;
    }
  | { type: "asset"; storagePath: string; altText: string }
  | { type: "table"; header?: string[]; rows: string[][]; caption?: string }
  | { type: "list"; ordered?: boolean; items: Block[][] };

export interface AnswerSpec {
  answerType: AnswerType;
  canonicalValue: string | string[];
  displayValue: string;
  acceptedForms: string[];
  tolerance?: {
    kind: "absolute" | "relative" | "range" | "none";
    value?: number;
    min?: number;
    max?: number;
  };
  precision?: {
    kind: "significant_figures" | "decimal_places" | "none";
    value: number;
    required: boolean;
  };
  units?: {
    requirement: "none" | "optional" | "required" | "convertible";
    canonical: string | null;
    acceptedSet: string[];
  };
  form?: {
    lowestTerms?: boolean;
    simplifiedSurd?: boolean;
    simplestRatio?: boolean;
    specifiedForm?: string | null;
  };
  followThrough?: { dependsOn: string; rule: string };
  normalisation:
    | "default"
    | "numeric_default"
    | "currency_default"
    | "expression_default"
    | "units_default"
    | "text_default";
  caseSensitive?: boolean;
  commonErrorValues?: Array<{ key: string; value: string }>;
  parts?: Record<string, AnswerSpec>;
}

export interface QuestionOption {
  optionKey: "A" | "B" | "C" | "D" | "E";
  contentBlocks: Block[];
  isCorrect?: boolean;
  commonErrorKey?: string;
}
export interface SolutionStep {
  partKey?: string;
  stepNo: number;
  instruction: string;
  contentBlocks: Block[];
  marks?: number;
  note?: string;
}
export interface CommonError {
  key: string;
  partKey?: string;
  wrongValue?: string;
  wrongOptionKey?: string;
  misconception: string;
  correctiveNote: string;
  skillCode?: string;
}
export interface QuestionAsset {
  role: "question_figure" | "solution_figure" | "option_figure";
  storagePath: string;
  mimeType: string;
  widthPx?: number;
  heightPx?: number;
  altText: string;
  requiresColour?: boolean;
}
export interface MathRender {
  svg: string;
  widthEx: number;
  heightEx: number;
  depthEx: number;
}

/** The inner `payload` JSONB of a question_payloads row (§34.3). */
export interface QuestionPayloadBody {
  questionType: QuestionType;
  difficultyBand: DifficultyBand;
  calculatorAllowed: boolean;
  marks: number | null;
  estimatedSeconds: number | null;
  stemBlocks: Block[];
  options: QuestionOption[] | null;
  answerSpec: AnswerSpec;
  solutionSteps: SolutionStep[];
  explanation: string | null;
  commonErrors: CommonError[];
  assets: QuestionAsset[];
  mathRenders: Record<string, MathRender>;
  topicName: string;
  objectiveCodes: string[];
}

/** What the student app actually receives from GET /rest/v1/question_payloads.
 *  The three envelope fields are COLUMNS of the row (§3.13), siblings of
 *  `payload` — not members of it. */
export interface QuestionPayload {
  questionId: string;
  questionVersionId: string;
  contentVersion: number;
  payload: QuestionPayloadBody;
}

/** The full authoring object — admin and pipeline only, never sent to students. */
export interface Question {
  id: string;
  legacyId: string | null;
  questionType: QuestionType;
  provenance:
    | "past_paper"
    | "past_paper_adapted"
    | "original_authored"
    | "ai_variant"
    | "ai_authored"
    | "legacy_import";
  rightsStatus: "edmar_owned" | "licensed" | "public_domain" | "third_party_unlicensed" | "unknown";
  status: ContentStatus;
  currentVersionId: string | null;
  variantFamilyId: string | null;
  sourceQuestionId: string | null;
  calculatorAllowed: boolean;
  difficultyBand: DifficultyBand;
  profileDimension: ProfileDimension | null;
  isFree: boolean;
  retiredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Practice ────────────────────────────────────────────────────────────────
export type PracticeMode =
  "topic" | "recommended" | "weak_areas" | "diagnostic" | "bookmarks" | "incorrect";
export type DifficultyMode = "mixed" | "building" | "challenge";
export type SessionStatus = "in_progress" | "completed" | "abandoned" | "expired";

export interface PracticeSession {
  id: string;
  studentId: string;
  mode: PracticeMode;
  scopeKind: string;
  scopeIds: string[];
  difficultyMode: DifficultyMode;
  requestedCount: number;
  deliveredCount: number;
  status: SessionStatus;
  correctCount: number;
  answeredCount: number;
  startedAt: string;
  completedAt: string | null;
}

export interface PracticeSessionItem {
  position: number;
  questionId: string;
  questionVersionId: string;
  optionOrder: Array<"A" | "B" | "C" | "D" | "E"> | null;
  answered: boolean;
}

export interface Attempt {
  id: number;
  clientAttemptId: string;
  studentId: string;
  questionId: string;
  questionVersionId: string;
  sessionId: string | null;
  examSessionId: string | null;
  context: PracticeMode | null;
  partKey: string | null;
  rawAnswer: string | null;
  normalisedAnswer: string | null;
  isCorrect: boolean;
  matchedCommonErrorId: string | null;
  wasSkipped: boolean;
  solutionViewed: boolean;
  difficultyBand: DifficultyBand;
  durationMs: number | null;
  createdAt: string;
}

export interface ExamSession {
  id: string;
  studentId: string;
  paperId: string;
  mode: "practice" | "timed";
  durationMinutes: number;
  serverStartedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  status: SessionStatus;
  answerMarks: number | null;
  maxAnswerMarks: number | null;
}

// ── Progress ────────────────────────────────────────────────────────────────
export type MasteryBandLabel =
  | "not_started"
  | "getting_started"
  | "needs_work"
  | "developing"
  | "competent"
  | "strong"
  | "mastered";

export interface SkillMastery {
  skillId: string;
  skillName: string;
  score: number | null;
  confidence: number;
  coverageCap: number;
  attemptsCount: number;
  distinctQuestions: number;
  correctCount: number;
  bandsSeen: DifficultyBand[];
  lastAttemptAt: string | null;
  band: MasteryBandLabel;
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  score: number | null;
  confidence: number;
  attemptsCount: number;
  skillsStarted: number;
  skillsTotal: number;
  band: MasteryBandLabel;
}

export interface Recommendation {
  scopeKind: "skill" | "subtopic" | "topic";
  scopeId: string;
  label: string;
  reason: string;
  mastery: number | null;
  availableQuestions: number;
}

// ── Commerce ────────────────────────────────────────────────────────────────
export type EntitlementTier = "free" | "premium";
export type EntitlementSource = "default" | "google_play" | "apple" | "promo" | "school" | "manual";
export type EntitlementStatus =
  "active" | "grace" | "on_hold" | "expired" | "cancelled" | "refunded";

export interface Entitlement {
  tier: EntitlementTier;
  source: EntitlementSource;
  status: EntitlementStatus;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  graceUntil: string | null;
  autoRenewing: boolean;
  platformProductId: string | null;
}

/** Everything the UI needs to decide what to show. Nothing else may compute this. */
export interface EntitlementView {
  tier: EntitlementTier;
  isPremium: boolean;
  status: EntitlementStatus;
  daysRemaining: number | null;
  allowanceRemaining: number | null;
  dailyLimit: number | null;
  resetsAt: string | null;
}

// ── Validation ──────────────────────────────────────────────────────────────
export interface ValidationResult {
  isCorrect: boolean;
  normalised: string;
  matchedForm?: string;
  matchedCommonErrorKey?: string;
  reason?:
    | "exact"
    | "tolerance"
    | "equivalent_form"
    | "wrong_precision"
    | "wrong_units"
    | "not_simplified"
    | "unparseable"
    | "incorrect";
}

// ── Errors ──────────────────────────────────────────────────────────────────
export type ApiErrorCode =
  | "validation_failed"
  | "invalid_scope"
  | "invalid_answer_format"
  | "not_authenticated"
  | "token_expired"
  | "not_authorised"
  | "entitlement_required"
  | "entitlement_exhausted"
  | "not_found"
  | "session_already_completed"
  | "exam_already_submitted"
  | "no_questions_available"
  | "scope_empty"
  | "purchase_not_valid"
  | "rate_limited"
  | "internal_error";

export interface ApiError {
  error: { code: ApiErrorCode; message: string; details?: Record<string, unknown> };
}
```

---

## 36. ACCEPTANCE TESTS

Written in Given/When/Then, precise enough to automate. One block per major feature.

### AT-01 · Practice a topic

```
GIVEN  a signed-in student with a premium entitlement
  AND  the topic "Consumer Arithmetic" has 40 published questions
  AND  the student has attempted none of them

WHEN   the student opens Practice, selects Consumer Arithmetic,
       chooses 10 questions and difficulty "Mixed", and taps Start practice
THEN   a practice_sessions row is created with status 'in_progress'
  AND  exactly 10 practice_session_items are created
  AND  every returned question is published, not retired, and linked to a
       Consumer Arithmetic specific objective
  AND  no two returned questions share a variant_family_id
  AND  the first question renders in under 400 ms

WHEN   the student enters "540" and taps CHECK ANSWER
THEN   the verdict is displayed in under 50 ms
  AND  no network request is made to determine correctness
  AND  the correct answer "$540.00" is displayed beside the student's answer
  AND  the worked solution and the explanation are displayed from stored content
  AND  an attempt is enqueued locally with a client_attempt_id

WHEN   the attempt syncs
THEN   an attempts row exists with is_correct derived SERVER-side
  AND  attempt_skills rows exist for each of the question's skills
  AND  student_skill_mastery is updated for those skills
  AND  student_daily_usage.questions_answered is incremented

WHEN   the student completes all 10 and reaches Session results
THEN   the score, per-question strip and the mastery delta are shown
  AND  the mastery delta matches the difference between the before and after
       values of student_topic_mastery for that topic
```

### AT-02 · Wrong answer produces targeted feedback

```
GIVEN  a published question whose correct answer is "$540.00"
  AND  a common_errors row with wrong_value "470.00", misconception
       "Applied the percentage to the selling price"

WHEN   the student answers "470"
THEN   the verdict is "Not quite"
  AND  the corrective note for that misconception is displayed
  AND  the attempt records matched_common_error_id pointing to that row
  AND  the primary colour used is NOT red
```

### AT-03 · Equivalent answers are accepted

```
GIVEN  a question whose answer spec is
       { answerType: 'fraction', canonicalValue: '23/20',
         acceptedForms: ['23/20','1 3/20','1.15'] }

WHEN   the student answers "1 3/20"       THEN correct, reason 'equivalent_form'
WHEN   the student answers " 23 / 20 "    THEN correct, reason 'exact' after normalisation
WHEN   the student answers "46/40"        THEN correct with a not-lowest-terms note
                                               (form.lowestTerms = false)
WHEN   the student answers "20/23"        THEN incorrect
WHEN   the student answers "1.1"          THEN incorrect

AND    for every case, @edmar/answer-core (device) and fn_validate_answer (server)
       return the SAME isCorrect value
```

### AT-04 · Free-tier limits and the paywall

```
GIVEN  a free student and app_config.free_daily_question_limit = 10
  AND  the student has answered 8 questions today

WHEN   the student requests a 10-question session
THEN   the session is created with delivered_count 2
  AND  allowance_remaining is 0
  AND  the UI shows the clamp with a one-line explanation, not an error

WHEN   the student finishes those 2 and requests another session
THEN   the RPC returns 403 entitlement_exhausted
  AND  the paywall sheet is presented with context 'limit_reached'
  AND  a paywall_shown analytics event is emitted

WHEN   an attacker calls fn_create_practice_session directly with a modified client
THEN   the same 403 is returned — the limit is server-authoritative

WHEN   the free student requests a premium question payload by ID via PostgREST
THEN   zero rows are returned (RLS), not an error that reveals the row exists
```

### AT-05 · Premium access

```
GIVEN  a student whose entitlement is { tier: premium, status: active }
WHEN   they request 20 questions from any topic
THEN   20 are returned regardless of daily usage
  AND  premium-only questions are included
  AND  timed exam mode is available

GIVEN  the entitlement moves to status 'grace'
THEN   full premium access is RETAINED until grace_until

GIVEN  the entitlement expires
WHEN   the student next requests a session
THEN   free-tier rules apply immediately, with no app restart required
```

### AT-06 · Row Level Security

```
GIVEN  student A and student B, and a question in status 'draft'

WHEN   student A queries questions
THEN   the draft question is not returned

WHEN   student A queries attempts filtered to student B
THEN   zero rows are returned

WHEN   student A attempts to UPDATE their own attempts row
THEN   the operation fails with 42501

WHEN   student A attempts to UPDATE their own entitlements row
THEN   the operation fails with 42501

WHEN   a reviewer calls fn_publish_question
THEN   it raises — publishing requires content_admin

WHEN   a super_admin attempts to DELETE from audit_log
THEN   the operation fails with 42501
```

### AT-07 · Question selection honours cooldown

```
GIVEN  a student who answered Q7 INCORRECTLY 10 days ago
  AND  answered Q8 CORRECTLY 10 days ago
  AND  cooldown_days_default = 30, cooldown_days_incorrect = 7

WHEN   the student requests practice covering both questions' objectives
THEN   Q7 IS eligible for selection
  AND  Q8 is NOT eligible

GIVEN  the student has attempted 45 of the topic's 50 questions within 30 days
WHEN   they request 10
THEN   5 fresh questions are returned with starved = true
  AND  the UI states that they have worked through most of this topic
  AND  the response does NOT silently pad with repeats
```

### AT-08 · Progress and mastery

```
GIVEN  a student with 3 distinct questions attempted on skill S
THEN   student_skill_mastery.score is NULL
  AND  the UI shows "Getting started", not a percentage

GIVEN  the student reaches 5 distinct questions, all correct, all difficulty band 1
THEN   the score is at most 60 (coverage cap applies when max band seen <= 2)
  AND  the label is at most "Competent"

GIVEN  20 distinct questions across bands 1–5 with 80% accuracy
THEN   confidence is 1.0
  AND  the label is "Strong"

GIVEN  a topic in which no skill has been attempted
THEN   student_topic_mastery shows "not started", NOT 0%

GIVEN  any student
WHEN   fn_recompute_all_mastery is run
THEN   every value equals the incrementally-maintained value exactly
```

### AT-09 · Exam scoring

```
GIVEN  a published Paper 02 with 9 questions totalling 90 marks
  AND  a student in timed mode with duration 150 minutes

WHEN   the exam session starts
THEN   server_started_at and expires_at are set SERVER-side
  AND  no solutions are reachable from any screen in the session

WHEN   the app is backgrounded for 20 minutes and resumed
THEN   the remaining time reflects wall-clock elapsed since server_started_at

WHEN   the device clock is moved forward two hours
THEN   the remaining time is unaffected

WHEN   the student submits with 5 questions fully correct
THEN   answer_marks equals the sum of those questions' marks
  AND  the results screen shows a per-topic breakdown summing to answer_marks
  AND  the results screen states that method marks are not modelled

WHEN   the student submits a second time
THEN   the original result is returned, not a duplicate session
```

### AT-10 · AI-generated question validation

```
GIVEN  an approved published source question
WHEN   a variant is generated
THEN   SymPy independently solves the variant
  AND  if SymPy's answer differs from the model's stated answer,
       the variant is REJECTED with no retry
  AND  if the variant's answer is degenerate (per the aesthetic gate),
       it is REJECTED
  AND  the variant is assigned the source's variant_family_id
  AND  the variant's status is 'pending_review', never 'published'

WHEN   an administrator attempts to publish the variant without a review
THEN   fn_publish_question raises

WHEN   a session is generated covering the source's objectives
THEN   the source and the variant are never both returned
```

### AT-11 · Offline practice and sync

```
GIVEN  a student with a materialised 10-question session
WHEN   the device goes offline
THEN   every remaining question renders, including its mathematics and diagrams
  AND  CHECK ANSWER produces a verdict
  AND  the worked solution and explanation are shown
  AND  attempts accumulate in the local queue

WHEN   connectivity returns
THEN   every queued attempt is sent exactly once
  AND  duplicate flushes create no duplicate attempts (client_attempt_id)
  AND  mastery updates and the progress screen reflects them
  AND  an offline_session_completed event is recorded
```

### AT-12 · Content publication gate

```
GIVEN  a question with no question_objectives row
WHEN   fn_publish_question is called
THEN   it raises, naming 'no_specific_objective'

GIVEN  a question whose asset has alt_text of 4 characters
THEN   publish raises, naming 'asset_missing_alt_text'

GIVEN  a question whose only solution step carries the AUTO-DERIVED note
THEN   publish raises, naming 'solution_placeholder_present'

GIVEN  a question whose rights_status is 'third_party_unlicensed'
THEN   publish raises, naming 'rights_not_cleared'

GIVEN  a question whose answer spec fails the round-trip self-check
       (validate(displayValue, spec).isCorrect === false)
THEN   publish raises

GIVEN  a published question
WHEN   an UPDATE is attempted on its question_versions row
THEN   the immutability trigger raises
```

### AT-13 · Legacy import

```
GIVEN  content/legacy/diagnostic_bank_phase3.json with 17 records
WHEN   scripts/import-legacy.ts runs with --dry-run
THEN   a report is produced and NOTHING is written to the database

WHEN   it runs with --commit against staging
THEN   16 questions are inserted (1 rejected as a duplicate of the lesson bank)
  AND  every inserted question has status 'pending_review'
  AND  ZERO questions have status 'published'
  AND  every question has a legacy_id of the form 'diag:Q<n>'
  AND  every mistakeTags entry became a common_errors row with a wrong_value
  AND  every skillId resolved to an existing skills.code
  AND  every question is flagged 'solution_placeholder' and 'objective_unmapped'
  AND  every Unicode expression converted to LaTeX has a math_renders row

WHEN   the importer is run a second time
THEN   no rows change and the report shows 0 inserted
```

### AT-14 · Rights withdrawal

```
GIVEN  40 published questions with rights_status 'third_party_unlicensed'
       (imported behind the feature flag before the rights decision)
WHEN   a super_admin calls POST /api/content/withdraw-by-rights
THEN   all 40 move to status 'retired' in one transaction
  AND  no student session can serve them thereafter
  AND  40 audit_log rows are written with the actor and reason
  AND  existing attempts on those questions are preserved
  AND  affected students' mastery is unchanged (history remains valid)
```

### AT-16 · The ten-block publication gate _(Rev 2)_

```
GIVEN  a question version that passes every Rev 1 validator
  AND  it has no exam_tip and no quick_check

WHEN   a content_admin attempts to publish it
THEN   fn_publish_question raises with a message naming BOTH missing blocks
  AND  the question status is unchanged
  AND  no question_payloads row is written

WHEN   the reviewer authors both blocks and re-attempts
THEN   publication succeeds
  AND  the payload contains block 1 and the answer spec ONLY
  AND  fn_reveal_response returns blocks 2–10 for a student who has attempted it
  AND  fn_reveal_response returns nothing for a student who has not
```

### AT-17 · Final answer must agree with the answer spec _(Rev 2)_

```
GIVEN  a question whose answer_spec accepts 540
  AND  whose final_answer_blocks state "$470"

WHEN   validation runs
THEN   the CAS agreement check fails as BLOCKING
  AND  the failure message names both values
  AND  publication is impossible in any status path

RATIONALE  a student marked wrong while the solution shows their answer is the
           defect that destroys trust in a mathematics product outright.
```

### AT-18 · Diagnostic produces coverage, not a score _(Rev 2)_

```
GIVEN  a signed-in student with no attempts
WHEN   they complete a 22-item diagnostic
THEN   a coverage_map is written covering every weighted topic
  AND  topics with no item are 'not_started', NOT 0%
  AND  provisional mastery is inserted at LOW confidence
  AND  a readiness_snapshots row is written
  AND  NO per-item feedback was returned at any point during the run
       (asserted at the network layer: zero calls to fn_reveal_response)

WHEN   the same seed and the same answer sequence are replayed on a clean database
THEN   the item sequence is identical
  AND  the walk_log is identical
```

### AT-19 · Simulation conformance and timing _(Rev 2)_

```
GIVEN  a published bank sufficient for the Paper 01 blueprint
WHEN   a premium student starts a p01_regular simulation
THEN   60 items are materialised, 20 per module
  AND  each module's CK/AK/R mix is within ±2 of 6/8/6
  AND  blueprint_ok = true
  AND  server_started_at and expires_at are set server-side

WHEN   the student closes the tab for 10 minutes and returns
THEN   remaining time reflects true elapsed time, not paused time

WHEN   they submit 40 seconds after expiry
THEN   the submission is accepted
  AND  submitted_late_by = 40
  AND  only work recorded before expiry is marked
  AND  marks_by_module and marks_by_profile are populated

GIVEN  a deliberately thinned bank
WHEN   a simulation is materialised
THEN   blueprint_ok = false
  AND  the session is EXCLUDED from readiness computation
  AND  the results screen states that it will not change their readiness
```

### AT-20 · Readiness is deterministic and honestly withheld _(Rev 2)_

```
GIVEN  an attempt log exported from a real student
WHEN   it is replayed into two clean databases and readiness is computed with
       the same p_as_of and the same model_version
THEN   index_value, confidence and every value in `inputs` are identical

GIVEN  a student with 3 attempts
WHEN   they open the home screen
THEN   no readiness index is shown
  AND  withheld_reason = 'insufficient_coverage'
  AND  the surface states what would produce a reading

GIVEN  a student with 400 practice attempts, high accuracy, no simulation
WHEN   fn_get_grade_projection is called
THEN   state = 'withheld'
  AND  withheld_reason = 'no_simulation'
  AND  NO band appears anywhere in the response payload
```

### AT-21 · Projection governance _(Rev 2)_

```
GIVEN  a premium student who has passed every gate
WHEN   a projection is issued
THEN   band_low and band_high are both present and band_low <= band_high
  AND  confidence <> 'none'
  AND  model_version and disclosure_version are recorded
  AND  the rendered surface shows the confidence in the same visual unit
  AND  the standing disclosure is present in the DOM, not in a hover state

WHEN   an insert is attempted with state='issued' and confidence='none'
THEN   the issued_has_band constraint rejects it

GIVEN  a FREE student who otherwise passes every evidence gate
WHEN   fn_get_grade_projection is called
THEN   state = 'withheld' with reason 'not_entitled'
  AND  no band value is present in the payload

WHEN   the withdrawal flag is set in app_config
THEN   every projection surface returns 'withheld' with a plain-language reason
  AND  no deploy was required
  AND  readiness continues to function unaffected
```

### AT-22 · Weak areas rank by mark impact, not by score _(Rev 2)_

```
GIVEN  topic A at 30% mastery worth 3 marks
  AND  topic B at 45% mastery worth 12 marks
  AND  both with comparable confidence and content availability

WHEN   fn_weak_areas is called
THEN   topic B ranks ABOVE topic A
  AND  each row carries its marks-at-stake value
  AND  the recommendation reason names that value
```

### AT-23 · Projection never leaks into a notification or marketing surface _(Rev 2)_

```
WHEN   the CI band-vocabulary check runs over
       apps/web/app/(marketing)/**, notification templates and email templates
THEN   no band vocabulary ("Grade 1-2", "predicted", "projected grade") is found
  AND  the check fails the build if it is
```

### AT-15 · The invariants

```
I-1  WHEN any client bundle is built (apps/web now; apps/mobile at V2)
     THEN it contains no AI SDK, no provider key, and no code path that
          reaches an AI provider  (check-no-ai-in-client.sh — extended in Rev 2
          to cover apps/web including its service worker and api/ handlers)

I-2  WHEN a student queries any content table
     THEN only rows belonging to a published, non-retired question are returned,
          enforced by RLS rather than by client filtering

I-3  WHEN CHECK ANSWER is tapped
     THEN no network request is made before the verdict is displayed
          (asserted by a network-interceptor test)

I-4  WHEN a published question version is updated
     THEN the operation raises

I-5  WHEN any AI-touched artefact is inspected
     THEN ai_generations records the model, prompt name, prompt version,
          run and cost, and question_reviews records the approving human

I-6  WHEN the same attempt log is replayed into two clean databases with the
     same p_as_of and model_version
     THEN readiness and projection output are identical, field for field
          (and packages/assessment-core contains no readiness arithmetic)

I-7  WHEN any surface renders a projection
     THEN a band, a confidence and the standing disclosure are all present
     AND  WHEN the evidence gate is unmet, no band value exists in the payload

I-8  WHEN apps/mobile resumes at V2 and its behaviour differs from apps/web
     THEN the web behaviour is correct by definition and the difference is
          logged as a mobile defect
```

---

## 37. PRODUCTION CHECKLIST

### 37.1 Development

- [ ] `pnpm install && pnpm lint && pnpm typecheck && pnpm test` green from a clean clone
- [ ] All five CI guard scripts pass — the four in §25.10 plus `check-no-secrets.sh` (§25.9)
- [ ] `packages/answer-core` at 100 % branch coverage
- [ ] The 5,000-case client/server cross-check passes (§27.2)
- [ ] No `TODO`, `FIXME`, `@ts-ignore` or `eslint-disable` in `packages/answer-core` or `supabase/migrations/`
- [ ] `docs/PROJECT_INSTRUCTIONS.md` matches the shipped architecture
- [ ] The CI band-vocabulary check passes over marketing routes and notification templates (§42.5 rule 5)
- [ ] `packages/assessment-core` contains no arithmetic on readiness or band values (CI grep)
- [ ] Every ADR in `docs/decisions/` reflects the code

### 37.2 Database

- [ ] `supabase db reset` succeeds from empty on a fresh machine
- [ ] All 49 tables exist with the columns, constraints and indexes in §3 (45 from Rev 1 + the four in §3.25–3.28)
- [ ] RLS enabled on all 49 tables (proved by a `pg_class` catalogue query, not by inspection)
- [ ] `student_outcomes` RLS verified: a student reads and writes only their own row; **no admin role can read an individual row**
- [ ] The `issued_has_band` constraint rejects an issued projection lacking a bound or a confidence
- [ ] The determinism replay (AT-20) passes on two clean databases
- [ ] The full RLS matrix (§5.2) passes in both directions
- [ ] All 22 functions exist with the documented signatures and security contexts
- [ ] All 5 `pg_cron` jobs scheduled and observed to run
- [ ] Taxonomy seeded: 3 modules, 15 topics, **159 objectives**, `needs_human_review` false everywhere
- [ ] `EXPLAIN ANALYZE` on the seven hot queries shows index usage; captured as a CI artefact
- [ ] PITR enabled; **a restore has been performed and verified**
- [ ] Connection pooler configured for web client volume

### 37.3 Security

- [ ] `gitleaks` clean over full history
- [ ] Service-role key absent from both app bundles (automated check)
- [ ] No AI key anywhere outside the pipeline worker's secret store
- [ ] MFA enforced on every non-student account
- [ ] Storage bucket policies match §25.5; unpublished assets unreachable anonymously (verified by request)
- [ ] SVG sanitisation verified against a malicious-SVG fixture
- [ ] Rate limits active and verified on all ten surfaces in §25.7
- [ ] Penetration test scheduled (post-launch, before 10,000 students)
- [ ] Incident runbooks written and walked through once

### 37.4 AI and content

- [ ] Monthly spend cap set at the provider **and** in `app_config`
- [ ] Circuit breaker verified by attempting a job that would exceed the cap
- [ ] Every prompt versioned and committed
- [ ] Golden set of ≥50 questions in `content/golden/`, passing
- [ ] **Zero AI-generated questions published without a recorded human approval** (query-verified, not assumed)
- [ ] Every published question passes §13.7 validation
- [ ] Content coverage meets §29.6 targets per topic
- [ ] **`[VERIFY-RIGHTS-01]` resolved in writing** — EdMar's copyright in the workbook confirmed
- [ ] No question with `rights_status = 'third_party_unlicensed'` is published

### 37.5 Mobile

- [ ] All §28.1 targets met on the reference device, release build
- [ ] Crash-free sessions > 99.5 % over a 7-day internal period
- [ ] Offline flow verified end to end on a real device
- [ ] Text scaling to 200 % does not clip text or mathematics
- [ ] Every interactive element has an accessibility label and a ≥44 pt target
- [ ] Deep links work and fall back safely
- [ ] APK under 40 MB
- [ ] Tested on Android 8 through the current release, on 720p and 1080p
- [ ] `expo-updates` channel configured; OTA restricted to JS-only changes

### 37.6 Admin

- [ ] All six roles behave per §21.3, verified by test
- [ ] Question list under 300 ms at 10,000 rows
- [ ] Admin preview and mobile render are pixel-identical for the golden set
- [ ] Answer-spec test harness runs the real `@edmar/answer-core`
- [ ] Review keyboard flow works; **a reviewer sustained 30 items/hour in a timed trial**
- [ ] Audit log captures every content, role, entitlement and support action
- [ ] Rights-withdrawal action tested on staging with real volume

### 37.7 Subscription

- [ ] Products created in Play Console at US$4.00 / US$40.00
- [ ] Server-side receipt verification working; client claims never trusted
- [ ] RTDN endpoint receiving, verifying and processing; idempotent on replay
- [ ] Grace period retains access; verified
- [ ] Cancellation, refund and hold each produce the correct entitlement state
- [ ] Restore purchases works after reinstall and on a second device
- [ ] **Tested end to end with real purchases in a closed track, including the failure paths** — declined card, expiry, refund
- [ ] Price, period, renewal and cancellation disclosed before purchase
- [ ] Revenue reconciles against Play Console

### 37.8 Supabase / Vercel / GitHub

- [ ] Production and staging projects separate; no shared credentials
- [ ] Production migrations behind a manual approval gate
- [ ] Vercel env vars set per environment; no secret in a `NEXT_PUBLIC_` variable
- [ ] Admin CORS restricted to the admin origin
- [ ] Branch protection on `main` and `development`; signed commits
- [ ] CI required for merge; two approvals for `answer-core`, migrations and RLS
- [ ] Dependabot / Renovate enabled

### 37.9 Google Play

- [ ] Store listing accurate and substantiable — **no claim about grade improvement** (blueprint R-09)
- [ ] **CXC non-affiliation disclaimer in the listing, the About screen and the website**
- [ ] Content rating completed honestly
- [ ] **Data safety section matches actual behaviour** — a mismatch is a common rejection cause
- [ ] Families policy compliance confirmed; minimum age 13 enforced (U-05)
- [ ] Privacy policy and terms live at stable URLs
- [ ] **Account deletion available in-app and at a public web URL** (a Play requirement)
- [ ] Signed release build via EAS; keystore backed up in two places
- [ ] Staged rollout plan with abort criteria (crash rate, ANR rate, 1-star velocity)
- [ ] Support channel staffed with a stated response time

### 37.10 App Store (V2)

- [ ] Apple sign-in implemented (required where Google sign-in is offered)
- [ ] StoreKit 2 subscriptions with server-side verification
- [ ] App privacy details completed
- [ ] iOS-specific accessibility and layout verified

---

## 38. ENGINEERING RULES

### 38.1 Never

1. **Never build a student-facing chatbot.** No conversational surface, in any release. (B-3, B-6)
2. **Never use an LLM to check a student's answer.** Deterministic validation only. (§10.1)
3. **Never put a secret in client code.** The list in §25.4 is exhaustive and CI-enforced.
4. **Never bypass RLS.** No service-role key in a client bundle; no `security definer` function that skips an ownership check.
5. **Never hard-code question data in a React component.** Content comes from `question_payloads` via the query cache. (§20.2)
6. **Never hard-code premium permissions in a screen.** `useEntitlement()` and `<PremiumGate>` only. (§23.6)
7. **Never invent CXC curriculum.** Objective codes and statements come from the seeded taxonomy, which came from the official PDF. If a code is needed and absent, stop and ask.
8. **Never invent a mathematical answer.** If the CAS cannot verify it and no human has, it does not publish.
9. **Never auto-publish AI-generated content.** No confidence threshold, no batch approval, no exception. (B-14)
10. **Never store mathematics only as plain text.** Every expression is LaTeX in the allowlist, with a `math_renders` row. Plain text is a projection for search, never the source.
11. **Never destroy LaTeX or worked-solution content during migration.** §12 preserves everything; unconvertible records go to `failed/`, never to `/dev/null`.
12. **Never add a dependency not named in this spec** without recording why in `docs/decisions/`.
13. **Never make an unrelated change in a phase.** Unrelated diffs hide real ones.
14. **Never skip a test, a migration or a validation step.** A disabled test is a lie about coverage.
15. **Never widen a tolerance to make a test pass.** If students legitimately reach a different value, the question or the solution is wrong. (§10.7)
16. **Never display an unqualified predicted CSEC grade.** _(Rev 2 — this rule changed; read it carefully.)_ A **band with its confidence**, behind the evidence gate, with the standing disclosure, is now built (§42). What remains absolutely forbidden: a single grade; a band without its confidence; any band issued without the gate passing; a band shown to a non-entitled student; and a band in **any** notification, email, or marketing surface. (blueprint §J.12, R-09)
16a. **Never compute readiness or a projection outside Postgres.** No band arithmetic in TypeScript, ever, in any client or in `packages/assessment-core`. (D-18, §42.5)
16b. **Never cache a readiness value, a projection or an entitlement.** Network-only (§20.5). A stale confident number is the one failure this product cannot afford.
16c. **Never send blocks 2–10 to a client before that student has answered or skipped.** Three layers enforce it (§40.4); do not weaken any of them for a loading-performance win.
16d. **Never let a non-blueprint-conformant simulation feed readiness.** `blueprint_ok = false` means practice, and the interface must say so. (§41.3)
16e. **Never trust a client-supplied timer value in a simulation.** (D-22)
17. **Never mutate a published `question_version`.** Corrections are new versions. (I-4)
18. **Never return a raw Postgres error to a client.**
19. **Never copy production student data to staging.**
20. **Never publish a question whose `rights_status` is unresolved.**

### 38.2 Always

1. **Prefer deterministic logic.** If it can be a rule, a lookup or a computation, it is not a model call.
2. **Move expensive work to authoring time.** When a runtime feature looks expensive, precompute it and store the result. This is the pattern behind `acceptedForms` (§10.8), `math_renders` (D-03) and `question_payloads` (D-14), and it is the right first answer to almost every performance or cost question in this system.
3. **Use the exact names in this specification** — tables, columns, routes, functions, types, files. Cross-section consistency depends on it.
4. **Write the test first** where a phase defines acceptance criteria.
5. **Fail loudly and specifically.** A validation failure names the field and the rule.
6. **Make the invalid state unrepresentable** — discriminated unions over boolean flags (§18.1).
7. **Suspend a suspect question first, investigate second.** A wrong solution serving 500 students an hour is worse than a temporarily missing question.
8. **Record provenance for anything a model touched.** (I-5)
9. **Ask one specific question when the spec is silent.** Do not invent, and do not silently diverge.
10. **Make every assessment output reproducible.** Same attempt log, same numbers, on any machine, forever. If a computation cannot be replayed from stored data, it does not ship. (I-6, D-18)
11. **Withhold rather than guess.** Every assessment surface has a specified, honest, non-empty "not enough evidence yet" state, and it is the state most students see first. Build it before the populated one. (I-7)
12. **Treat the web client as the reference.** When mobile arrives at V2 and the two differ, web is right. (I-8)

---

## 39. WEB APPLICATION — RENDERING, PWA AND RESPONSIVE CONTRACT

_New in Rev 2. Covers what has no Rev 1 counterpart because Rev 1 had no web client._

### 39.1 Rendering strategy per route

| Route group      | Strategy                                   | Why                                                                                        |
| ---------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `(marketing)`    | Static, revalidated daily                  | Indexed, cacheable, no personal data                                                        |
| `(auth)`         | Static shell, client auth                  | No server state to fetch                                                                    |
| `(onboarding)`   | Client                                     | Purely interactive; nothing to render on the server                                        |
| `(app)` shell    | **Server component**, per-request           | Sidebar needs entitlement, sitting date and the latest readiness snapshot — one round trip |
| `session/q/[n]`  | **Client**, payload from the query cache    | Must work with no network and must never wait on a server render                           |
| `simulate/[id]/q`| **Client**, remaining time from the server on mount | D-22 — the clock is never client-derived                                          |
| `progress`, `readiness` | Server component, streamed             | Analytical reads; server-rendered so the first paint carries real numbers, not skeletons   |

**One rule governs the list:** anything a student can be in the middle of doing renders on the client and survives a lost connection; anything they are looking at renders on the server so it arrives complete.

### 39.2 The responsive contract

Three layouts, one component tree, driven by **container queries** rather than user-agent tests or viewport media queries alone (§18.2):

| Width      | Sidebar        | Question / response          | Response blocks        |
| ---------- | -------------- | ---------------------------- | ---------------------- |
| ≥1280px    | full, labelled | side by side, ~55/45         | four tabs              |
| 1024–1279  | full, labelled | side by side, ~60/40         | four tabs              |
| 768–1023   | icons only     | side by side, ~65/35         | four tabs, compact     |
| <768px     | drawer         | stacked                      | numbered accordion     |

**Invariants across all four:** the block numbering and order never change; revealed-step state survives a resize; no layout below 320px CSS width overflows horizontally; and text scaling to 200% degrades to the narrow layout rather than breaking the wide one.

### 39.3 PWA

`manifest.webmanifest` with maskable icons, `display: standalone`, portrait-primary on phones and any orientation on tablets. An install prompt is offered **once**, after the student's third completed session — not on first visit, which is the pattern users have learned to dismiss reflexively.

Offline capability is exactly what §20.5's table specifies and no more, and the offline banner states what still works rather than only that the connection is gone: *"You're offline. You can finish this session — your answers will save when you reconnect."*

### 39.4 Security posture specific to web

Additions to §25, all of them consequences of running in a browser (blueprint R-18):

- **CSP** with no `unsafe-inline` for scripts; nonce-based where Next.js requires inline; `frame-ancestors 'none'`.
- **Session in httpOnly cookies**, never `localStorage` — an XSS in a page that holds a token in `localStorage` is an account takeover, whereas one that holds an httpOnly cookie is not.
- **`noindex` on everything under `(app)`**, plus a `robots.txt` that disallows it. This is the first line of the bulk-extraction defence.
- **Per-account rate limiting on payload reads**, with anomaly alerting on a student fetching far more questions than they could be answering (§25). There is no bulk content endpoint and there must never be one.
- **No question content in server-rendered HTML for routes a crawler could reach**, since the practice routes are authenticated and must stay that way.
- **Webhook endpoints verify signatures** and are the only `api/` routes that accept unauthenticated requests (§23.5).

---

## 40. PRESENTATION-BLOCK MODEL (THE TEN BLOCKS)

_New in Rev 2. Implements blueprint §G.11 and D-17._

### 40.1 Where each block lives

| #  | Block               | Storage                                                          |
| -- | ------------------- | ---------------------------------------------------------------- |
| 1  | Question            | `question_versions.stem_blocks` + `question_assets` + `marks`     |
| 2  | Concepts required   | `question_versions.concepts_required` (jsonb) + `question_objectives` |
| 3  | Strategy            | `question_versions.strategy_blocks`                               |
| 4  | Guided solution     | `solution_steps` (with `result_blocks`, Rev 2)                    |
| 5  | Final answer        | `question_versions.final_answer_blocks`                           |
| 6  | Why this works      | `question_versions.why_this_works`                                |
| 7  | Common mistakes     | `common_errors` (≥2 rows required)                                |
| 8  | Exam tip            | `question_versions.exam_tip`                                      |
| 9  | Quick check         | `question_versions.quick_check` (prompt + its own answer spec)    |
| 10 | Answer validation   | `question_versions.{marks, cognitive_level, method_class, accuracy_rule, verification, ambiguity_note}` + the objective code |

### 40.2 `concepts_required` shape

```json
[
  { "objectiveId": "uuid", "code": "GTR 2.5", "label": "Angle at the centre theorem" },
  { "objectiveId": "uuid", "code": "GTR 2.1", "label": "Parts of a circle" }
]
```

**Not free text.** Each entry references a real Specific Objective, which is what makes a chip clickable into practice on that objective and what turns a wrong answer into objective-level weakness evidence. A concept without an `objectiveId` fails validation.

### 40.3 `quick_check` shape

```json
{
  "promptBlocks": [ /* block array */ ],
  "answerSpec":   { /* §11.2 answer spec — a real one */ },
  "assetId":      "uuid|null",
  "solutionNote": "one line, shown after the attempt"
}
```

The quick check is a **question**, not prose. It produces a real attempt row with `context = 'quick_check'`, weighted at roughly a third of a full item in the mastery model — enough to be informative, not enough for a student to farm.

### 40.4 The reveal policy — enforced in three places

Blocks 2–10 must not reach a client before that client's student has answered or explicitly skipped.

1. **The payload.** `question_payloads` (D-14) contains block 1 and the answer spec only. It contains no solution, no strategy, no final answer.
2. **The function.** `fn_reveal_response(p_question_version_id, p_client_attempt_id)` returns blocks 2–10 only if an attempt row exists for this student and this question version — or if the item was skipped, recorded as an attempt with `was_skipped = true`. `SECURITY DEFINER`, asserts `caller = auth.uid()` first.
3. **The cache.** The service worker caches response blocks only after a reveal (§20.5), so a student cannot prefetch a whole session's answers by loading it and going offline.

**This is a three-layer guard for one rule because the rule is the product's pedagogical premise** (blueprint B-3). An interface-only implementation is defeated by the browser's network tab, which in this audience is not a theoretical attacker.

### 40.5 Client component mapping

`ResponsePane` receives one `ResponseBlocks` object and renders either the four-tab grouping (≥1024px) or the numbered accordion (<1024px):

| Tab / accordion group | Blocks              |
| --------------------- | ------------------- |
| Solution              | 4, 5, 6, 7, 8, 10   |
| Concepts              | 2, 3                |
| Quick Check           | 9                   |
| Notes                 | student's own       |

The accordion presents all ten in order with block 4 expanded by default. **The grouping is a presentational choice made in one component**; the block set and its order are the schema and are identical everywhere, including the admin preview (§22) — which is what stops "it looked fine in admin" becoming a defect class that reaches students.

### 40.6 Validation rules (pipeline + publish)

Added to §13.7's deterministic validators:

| Check                                                                                  | Failure severity |
| -------------------------------------------------------------------------------------- | ---------------- |
| All ten blocks present and non-empty                                                    | blocking         |
| `concepts_required` has 1–4 entries, each resolving to a real Specific Objective        | blocking         |
| **`final_answer_blocks` agrees with `answer_spec`'s canonical value** (CAS-checked)     | **blocking**     |
| `common_errors` ≥ 2 rows, each with a distinct `error_key`                              | blocking         |
| `solution_steps` ≥ 1, contiguous `step_no`, every step has `result_blocks`              | blocking         |
| Sum of `solution_steps.marks` equals `question_versions.marks` where both are present   | blocking         |
| `quick_check.answerSpec` validates against the answer-spec schema and is **not** identical to the parent item's | blocking |
| `accuracy_rule` consistent with `answer_spec` (e.g. `exact` with a non-zero tolerance)  | blocking         |
| `cognitive_level` present                                                               | blocking         |
| `verification = 'verified'`                                                             | blocking at publish |
| `strategy_blocks` between 1 and 3 sentences; `why_this_works` between 2 and 4           | warning          |
| `exam_tip` does not merely restate `why_this_works` (cosine similarity < 0.9)           | warning          |

**The `final_answer` versus `answer_spec` check is the most important row in this table.** A published question whose stated final answer disagrees with the answer it accepts is precisely the defect that destroys trust in a mathematics product — a student marked wrong while the solution shows their answer. It is CAS-checked, it is blocking, and it has an acceptance test (§36).

---

## 41. DIAGNOSTIC AND SIMULATION ENGINES

_New in Rev 2. Implements blueprint §J.9 and §H._

### 41.1 Shared principles

Both are **deterministic given a seed** (blueprint I-6). Both record every selection decision so it can be audited and replayed. Neither uses AI in any form. Both are Postgres functions (D-18).

### 41.2 Diagnostic — `fn_create_diagnostic` / `fn_diagnostic_next_item` / `fn_complete_diagnostic`

**Selection.** Target 22 items across 3 modules and 15 topics, allocated by examination weight with a floor of one item per topic that carries weight. Difficulty walks per module: start at band 2; two consecutive correct moves up one band, two consecutive incorrect moves down one; the walk is capped at bands 1–5 and never repeats a question the student has seen in the last 90 days.

**Every decision is written to `diagnostic_sessions.walk_log`:**

```json
{ "seq": 7, "moduleId": "…", "topicId": "…", "bandBefore": 3, "runningCorrect": 2,
  "decision": "up", "bandAfter": 4, "questionVersionId": "…" }
```

**No feedback during the run.** `fn_diagnostic_next_item` returns block 1 and the answer spec; **it does not call the reveal path**, and the client's response pane is not mounted on diagnostic routes at all. Feedback would change behaviour, and behaviour change during measurement destroys the measurement.

**Completion** writes `coverage_map` — every topic in one `mastery_band` value, with `not_started` distinct from `needs_work` — inserts provisional mastery evidence at **low confidence**, and triggers the first readiness computation.

**Abandonment** is a first-class path: partial evidence is recorded at further-reduced confidence, and the student can resume the same session. A resumed session continues the walk from its logged state rather than restarting it.

### 41.3 Simulation — `fn_create_simulation` / `fn_submit_simulation`

**Materialisation to the blueprint.** For `p01_regular`: 60 items, 20 per module, allocated per topic to the official Paper 01 item counts (spec §0.3), and targeting the 30/40/30 CK/AK/R split within each module using `question_versions.cognitive_level`.

The function computes conformance and writes `exam_sessions.blueprint_ok`:

```
blueprint_ok = (every module has exactly its item count)
           AND (every topic is within ±1 of its official allocation)
           AND (each module's CK/AK/R mix is within ±2 items of 6/8/6)
```

**A non-conformant simulation is still served** — a student with a thin bank should still be able to rehearse — **but it is excluded from the readiness model** (§42.2) and the interface says so plainly: *"Practice mock — your bank doesn't yet have the right mix for a full exam-standard paper, so this one won't change your readiness."* Silently producing a flattering readiness from a lopsided paper is the failure this flag exists to prevent.

**Timing (D-22).** `server_started_at` and `expires_at` are set by the function. Every mount reads remaining time from the server. `fn_submit_simulation` accepts a late submission, records `submitted_late_by`, and marks everything answered by the deadline; work recorded after expiry is stored but excluded from the mark.

**Marking.** Deterministic, via `@edmar/answer-core` server-side. Marks are attributed to `marks_by_module` and `marks_by_profile` from each item's module and `cognitive_level`. `seconds_by_item` supports the pace analysis (time spent versus mark value), which is one of the most actionable outputs the simulation produces.

**Marking honesty (blueprint §H.7) is a data requirement, not a copy requirement.** For structured papers, `answer_marks` and `max_answer_marks` record what the answer specification could judge, separately from `total_paper_marks`. The interface must report the answer-mark score and state that a real examiner awards method marks the app cannot see. **A results screen that reports a percentage of total paper marks when only answer marks were judged is a defect**, not a rounding choice.

### 41.4 Review mode

`/simulate/[id]/review/[position]` exposes the full ten-block response for every item, filterable to incorrect. Every item offers *practise this objective*, which creates a practice session scoped to that item's Specific Objective — the single most valuable transition in the product, because it converts a post-mortem into practice in one click.

---

## 42. READINESS AND PROJECTION ENGINE

_New in Rev 2. Implements blueprint §J.11–J.12 under D-18, D-19 and D-20. **This section is the one an implementer is most likely to under-build, because most of its content is refusals.**_

### 42.1 Function inventory

| Function                       | Kind             | Returns                                                                 |
| ------------------------------ | ---------------- | ----------------------------------------------------------------------- |
| `fn_compute_readiness`         | SECURITY DEFINER | inserts a `readiness_snapshots` row; returns it                          |
| `fn_get_readiness`             | STABLE, invoker  | latest snapshot for the caller, or the withheld state                    |
| `fn_get_readiness_series`      | STABLE, invoker  | the trend, down-sampled to at most 60 points                             |
| `fn_compute_grade_projection`  | SECURITY DEFINER | inserts a `grade_projections` row (issued or withheld); returns it        |
| `fn_get_grade_projection`      | STABLE, invoker  | latest projection, **enforcing the evidence and entitlement gates**       |
| `fn_weak_areas`                | STABLE, invoker  | ranked by mark impact, with marks at stake per row                        |
| `fn_projection_calibration`    | SECURITY DEFINER | admin-only aggregate back-test (§42.6); **never returns individual rows** |

`p_as_of date` is an explicit argument on every computation function and defaults to `current_date`. **No assessment function may read the clock directly** — that is what makes a stored attempt log replayable and the determinism test possible (D-18).

### 42.2 Readiness computation

```
FOR each topic with examination weight:
    m  := topic mastery                    (student_topic_mastery)
    w  := examination weight               (taxonomy, from the official grid)
    c  := coverage factor 0..1             (distinct objectives touched / total)
    contribution := m * w * c

weighted_mastery := Σ contribution / Σ (w)                      -- 0..100

sim := marks % across CONFORMANT timed simulations,             -- blueprint_ok = true
       recency-weighted, last 3

IF sim IS NOT NULL:
    index := (1 - λ) * weighted_mastery + λ * sim               -- λ from the parameter set
    simulation_delta := sim - weighted_mastery
ELSE:
    index := weighted_mastery * practice_only_discount          -- < 1, from the parameter set
    simulation_delta := NULL

index := index * recency_adjustment(as_of)                      -- same decay as §J.6
```

**Every coefficient — λ, the discount, the decay half-life, the coverage floor — lives in a versioned parameter row, not in the function body**, and the parameter set's version is what `model_version` records. This is what allows a recalibration to be evaluated by replaying stored attempt logs (§42.6) rather than by shipping and hoping.

**The evidence gate for the index:** coverage ratio ≥ the configured floor over topics carrying a majority of examination weight, **and** at least one of (a completed diagnostic, a conformant timed simulation). Below it, `index_value` is null and `withheld_reason` is set. The confidence level is derived from evidence volume, coverage breadth, simulation count and reading stability, and is **never** `none` on an issued reading.

### 42.3 When it runs

- In the same transaction as `fn_record_attempt`, via trigger (D-18), with the coalescing rule in §3.26.
- On `fn_complete_diagnostic` and `fn_submit_simulation`, unconditionally and without coalescing — these are the readings students actually look at.
- Nightly for active students, to apply decay with `p_as_of = current_date`. **This is the only path that can move a reading downward without the student doing anything**, and it must be explained in-product when it happens ("time for a refresher") rather than appearing as an unexplained drop.

### 42.4 Projection computation

```
r := latest readiness snapshot

IF NOT gate_passed(r) THEN
    RETURN withheld(reason)                 -- insufficient_attempts | insufficient_coverage
                                            -- | no_simulation | stale_evidence | not_entitled
centre := map_readiness_to_grade(r.index_value, parameter_set)   -- conservative at MVP (U-08)
centre := adjust_for_trend(centre, readiness_slope)
centre := adjust_for_time(centre, weeks_to_sitting)

width  := base_width(r.confidence)                       -- low → wider
width  := width + disagreement_penalty(r.simulation_delta)

band_low  := clamp(centre - width, 1, 6)
band_high := clamp(centre + width, 1, 6)
RETURN issued(band_low, band_high, r.confidence)
```

**The gate is the feature.** `no_simulation` is a distinct withheld reason and is not a warning — a student with 4,000 practice attempts and no timed simulation gets **no band at all**, because a projection from self-selected untimed practice is systematically optimistic and that optimism is exactly the harm blueprint R-09 describes.

**Disagreement widens rather than averages.** Where practice and simulation evidence disagree strongly, the honest response is a wider band, not a confident midpoint. A naive implementation averages the two and reports moderate confidence; that is the single most likely way this feature ends up wrong in the dangerous direction.

### 42.5 Hard implementation rules

1. **No client may compute a band.** `packages/assessment-core` carries labels, gate constants and strings only; a CI check greps it for arithmetic on readiness values (§2.2).
2. **No projection without `confidence`.** Enforced by the `issued_has_band` constraint (§3.27) as well as by the function.
3. **Every issued projection records `model_version` and `disclosure_version`.**
4. **The projection is never sent to a non-entitled client** — the gate returns `not_entitled`, not a filtered payload.
5. **No projection in any notification, email, push or marketing surface.** A CI check greps the notification templates and the marketing routes for band vocabulary; blueprint §J.12 rule 8.
6. **No projection endpoint accepts a `student_id` other than the caller's**, except `fn_projection_calibration`, which returns aggregates only.
7. **Reading an individual student's projection from admin is audit-logged** like any other privileged read (§25).

### 42.6 Calibration and back-test

`fn_projection_calibration(p_model_version, p_weeks_out)` returns, over students in `student_outcomes`:

| Output                | Why it is there                                                                        |
| --------------------- | --------------------------------------------------------------------------------------- |
| Band-hit rate         | Did the real grade fall inside the projected band?                                       |
| **Directional bias**  | **Signed mean error. The number that matters** — even misses are fixable, upward misses are dangerous |
| Calibration by confidence | A `high`-confidence band should hit more often than a `low` one. If it does not, confidence is decorative |
| Distribution comparison | Projected band distribution against actual grade distribution — catches a model that never projects a 4 |
| Coverage              | Share of students who received any band at all — a gate that never withholds is not a gate |

Run at every sitting. **If the model cannot be made accurate, the feature is withdrawn rather than kept and disclaimed** (blueprint §J.12 rule 7). The withdrawal path must be *implemented*, not merely agreed: a config flag that turns every projection into `withheld` with a plain-language reason, testable in staging, with no deploy required.

**Replay, not guesswork.** Because attempts are immutable (D-13) and every snapshot stores its inputs and version (D-19), a candidate parameter set is evaluated by recomputing historical projections from stored attempt logs and comparing both models against the same outcomes. A new parameter set may only be promoted if it beats the incumbent on directional bias **and** does not lose band-hit rate.

### 42.7 The explainer route

`/readiness/explainer` is a real route with real content, linked from every surface that shows a number:

- what the readiness index is (a preparedness reading on EdMar's scale) and **what it is not** (a predicted mark percentage);
- what the band means, what the confidence means, and why it is a range;
- what evidence produced this student's current reading, in numbers — attempts, coverage, simulations;
- what would improve its confidence;
- the standing disclosure, in plain words.

**This route is part of the feature, not documentation of it.** A projection a student cannot interrogate cannot be defended when a teacher or a parent challenges it — and it will be challenged.

---

## APPENDIX A — DELIVERED ARTEFACTS

| File                                     | Contents                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EdMar_Technical_Build_Specification.md` | this document (v2.0)                                                                                                                                                |
| `REVISION_02_CHANGELOG.md`               | every Rev 2 change, where it landed, and the reasoning — including the three reversed decisions                                                                     |
| `csec_2027_taxonomy_seed.json`           | 3 modules, 15 topics, 159 Specific Objectives extracted from `CSEC_Mathematics_Syllabus_2027.pdf`, with `needs_human_review` flags on the 44 requiring verification |

## APPENDIX B — OPEN ITEMS CARRIED FORWARD

| ID                   | Item                                                                              | Owner               | Needed by                      |
| -------------------- | --------------------------------------------------------------------------------- | ------------------- | ------------------------------ |
| `VERIFY-RIGHTS-01`   | Confirm EdMar's copyright in `EdMar_CXC_Mathematics_Workbook_2026.pdf` in writing | founder / legal     | before P20                     |
| `VERIFY-CXC-02`      | Human verification of the 44 flagged objective statements                         | curriculum reviewer | **during P04 — critical path** |
| `CXC-DISCREPANCY-01` | SBA weighting: narrative says 30 %, Assessment Grid A says 20 %                   | curriculum reviewer | before any SBA display         |
| `U-01`               | Workbook rights                                                                   | founder             | P20                            |
| `U-02`               | Whether V2018 support is needed at all                                            | product owner       | P04                            |
| `U-04`               | Google Play merchant availability in Jamaica and next three territories           | founder             | **before the V2 mobile release** (downgraded) |
| `U-07`               | Web payment processor selection, on territory coverage                            | founder             | **P0 — gates P18**             |
| `U-08`               | Initial readiness→band mapping, reviewed and signed by a mathematics educator      | founder / SME       | **P0 — gates P17c**            |
| `U-09`               | Ten-block authoring throughput at 30/reviewer-day                                 | content lead        | measured in P20, decided by P21 |
| —                    | **Named owner of the projection withdrawal decision** (blueprint §J.12 rule 7)     | founder             | **before launch**              |
| —                    | Consent wording for `student_outcomes` collection                                 | founder / legal     | before the first sitting       |
| `U-05`               | Minimum age policy — recommendation is 13+ with no consent flow                   | founder / legal     | P13                            |
| `U-06`               | Additional Mathematics / CAPE scope — recommendation is out of scope              | product owner       | post-V1                        |
| —                    | Reviewer capacity: ≥2 qualified CSEC Mathematics teachers contracted              | founder             | before P12                     |
| —                    | EdMar brand assets for `packages/design/tokens.ts`                                | founder             | P14                            |

---

_End of Technical Build Specification v2.0 (Revision 2 — assessment-led, web-first). No application code is contained in this document._
