# EdMar CXC Mathematics — Revision 02 Change Log

**Date:** 30 August 2026
**Applies to:** `MASTER_BLUEPRINT.md` v1.0 → **v2.0**, `TECHNICAL_BUILD_SPEC.md` v1.0 → **v2.0**, `PROJECT_INSTRUCTIONS.md`
**Reason for revision:** a change of product intent — from a practice engine to an examination-readiness system — and a change of launch platform, from Android-first to web-first.

---

## 1. What you asked for, and what it implied

The instruction was: *the main goal of this app is to run diagnostics, monitor students, exam simulation, readiness analysis, grade prediction, identify weak areas; questions are to be presented and displayed according to the reference interface; web app first, then mobile.*

Four of those six goals were already in the blueprint but positioned as supporting features, mostly in V1 or V2. Two were **not in the product at all** — readiness analysis, and grade prediction, the latter explicitly refused in three separate places. And the platform instruction reversed the central delivery decision. So this is not a set of additions to a plan; it is a re-centring of it, and the documents now say so plainly rather than carrying the old emphasis in their bones.

| Your goal                    | Rev 1 status                                  | Rev 2 status                                             |
| ---------------------------- | --------------------------------------------- | -------------------------------------------------------- |
| Run diagnostics              | V1 feature, "offered to engaged students"     | **MVP capability**, the entry point to the whole loop     |
| Monitor students             | A progress screen                             | **MVP capability** — student self-monitoring + EdMar cohort monitoring |
| Exam simulation              | V1, and gated behind the past-paper rights risk | **MVP capability** for Paper 01, *separated* from the rights question |
| Readiness analysis           | **Absent** (explicitly "not a prediction")    | **New MVP capability** — a readiness index with confidence and trend |
| Grade prediction             | **Refused** in §D.7, §J.1 and §V R-09         | **Built, under eight binding governance rules**           |
| Identify weak areas          | Present, ranked by low mastery                | Re-specified: ranked by **mark impact**                   |
| Question presentation        | Question → solution → explanation             | **A ten-block model**, enforced at publication            |
| Web first, then mobile       | Android-first; web was admin-only             | **`apps/web` is the MVP client**; mobile moves to V2      |

---

## 2. The three reversals, and the reasoning

These are the changes where Rev 2 contradicts a considered Rev 1 decision rather than extending it. Each is called out in the documents themselves so nobody re-litigates it from memory.

### 2.1 Grade prediction: refused → built, with governance

**Rev 1's position** (§D.7, §J.1, §V R-09) was that a predicted grade is an unsubstantiable claim EdMar would be held to publicly, with consumer-protection exposure. That reasoning was sound and it has not been discarded.

**Rev 2 builds the feature anyway**, because the alternative to answering *"am I going to pass?"* is not silence — it is the student inferring a worse answer from a raw percentage, unaided. What makes it defensible is not the model but the governance around it. Eight rules, now binding (blueprint §J.12):

1. **Bands, never points** — "Grade 2–3", never "Grade 2".
2. **Confidence is part of the output**, displayed in the same visual unit as the band.
3. **An evidence gate**, including at least one completed **timed simulation**. A projection from practice alone is systematically optimistic.
4. **Deterministic and reproducible** — a versioned rule set over the immutable attempt log.
5. **Explainable in one screen** — a real route, not a tooltip.
6. **A standing in-product disclosure** in plain words.
7. **Back-tested every sitting, with a pre-committed withdrawal criterion** — a projection that cannot be shown accurate is *removed*, not disclaimed.
8. **Never in marketing** — not in the store listing, the site, or any acquisition material.

Rule 3 is the one most likely to be argued away under commercial pressure, and it is the one doing the most work. Rule 7 needs a **named owner before launch**; that is now an open item in spec Appendix B.

R-09 was rewritten rather than deleted: its impact rating went *up* (I4 → I5), its likelihood management moved from avoidance to mitigation, and its residual risk is recorded as **MEDIUM after mitigation** — it cannot be driven low while the feature exists, and Rev 2 makes that trade knowingly. A new risk **R-17 (projection miscalibration)** was added for the distinct problem of *being wrong* as opposed to *claiming*, with asymmetric costs noted: optimistic misses are the reputational catastrophe, pessimistic misses are merely expensive.

**What is still refused:** a single unqualified grade, a band without confidence, a band without the gate, a band to a non-entitled student, and a band anywhere in marketing. Spec §38.1 rule 16 was rewritten rather than removed, because an engineer reading "never display a predicted grade" and finding a projection in the code would reasonably conclude the rule had simply been ignored.

### 2.2 Platform: Android-first → web-first

Four reasons, in the order they actually matter (blueprint §1.7): the new analytical surfaces need width; a 90-minute Paper 01 is a better rehearsal on a laptop; a scoring or content correction must reach every student on their next page load rather than through a release train — which matters acutely for a product that now makes projections; and a URL can be pasted into a class WhatsApp group by a teacher, which an install cannot.

Two secondary benefits fell out: Google Play merchant availability (spec U-04) leaves the launch critical path entirely, so **billing is live at MVP rather than stubbed**; and net revenue per subscriber improves slightly (≈US$3.55–3.70 on a card processor versus ≈US$3.40 after a 15% store commission).

**The honest cost:** true offline practice on a metered connection, which Rev 1 valued and valued correctly. The PWA mitigation — service-worker caching of the active session, an IndexedDB attempt queue — recovers most of it, and §E.9 was rewritten rather than quietly softened. A second cost is a wider variability surface (browsers instead of a curated device matrix) and easier content extraction, both captured in the new risk **R-18**.

**Mobile is paused, not cancelled.** All validation, typing, API access and design tokens live in shared packages that React Native consumes unchanged, and the new invariant **I-8** makes web the reference implementation so the eventual port is a rendering exercise rather than a second source of truth.

### 2.3 Simulation separated from the past-paper rights question

Rev 1 conflated two things and consequently put both behind the R-01 legal decision. Rev 2 separates them (blueprint §H.1):

- **Examination simulation is a structure** — 60 items, 90 minutes, official per-module and CK/AK/R allocation. It needs no third-party content and carries **no rights risk**, so it is in MVP.
- **The past paper library is specific copyrighted content** and stays gated on R-01.

This is the single change that recovers the most product value for the least legal exposure, and it was available in Rev 1 — it was simply obscured by the two ideas sharing a section.

---

## 3. Changes by document

### 3.1 `MASTER_BLUEPRINT.md` (v1.0 → v2.0, 2,598 → ~3,000 lines)

| Section | Change |
| ------- | ------ |
| Header, **§0.5 (new)** | Revision notice; a navigation table of every changed section |
| **§1.1** | Rewritten: practice engine → examination-readiness system, with the five capabilities named |
| §1.3, §1.4, §1.5 | Stack sentence updated; economics recomputed for web billing; a fifth "must be true" added — the projection must be honest and defensible |
| **§1.6** | MVP paragraph rewritten around web, diagnostic, simulation, readiness and projection |
| **§1.7 (new)** | Platform sequence, the four reasons, and the honest cost |
| **§2.1** | Plane 3a is now the web app; Plane 3c (mobile, V2) added |
| **§2.2** | **I-6** (determinism), **I-7** (no projection without evidence), **I-8** (web is reference) added |
| §2.3 | Request paths added for diagnostic, simulation and readiness recomputation |
| **§2.4 (new)** | The assessment loop, and the two properties that constrain the build |
| §A.2, §A.6, §A.9 | Purpose, value proposition and differentiators re-centred on the readiness answer |
| **§C (all)** | Rewritten. Diagnostic in onboarding; the question screen per the reference interface; **§C.9 ten-block response**; §C.14 diagnostic, §C.15 simulation, §C.16 readiness and monitoring |
| **§D.2–D.7** | Feature inventory re-cut. Diagnostic, simulation, readiness, projection, mark-impact weak areas and monitoring all move into MVP; matrix rewritten; **D.7's predicted-grade refusal replaced** by the governed form; proctoring newly refused |
| §E.9 | Connection tolerance rewritten for PWA; timed-simulation timing carved out as the exception |
| §G.8 | Rendering recommendation replaced by pre-rendered SVG, with the CLS reasoning |
| **§G.11 (new)** | The ten-block presentation model, why it is a schema, the reveal policy, validation rules |
| **§H (all)** | Retitled *Examination Simulation and Past Papers*; simulation promoted to MVP and separated from rights; §H.6 forms table; §H.9 rewritten as how simulation feeds the engine |
| **§J (all)** | Retitled *Assessment Engine*. §J.1 rewritten (five jobs); §J.2 adds assessment context and cognitive level; §J.7 **mark impact**; §J.8 recommendation carries value; §J.9 diagnostic **promoted to MVP**; **§J.11 readiness index (new)**; **§J.12 projected grade band (new)**; **§J.13 monitoring (new)**; §J.14 evolution path extended to the projection |
| §M.4, §M.10 | Editor previews all ten blocks; admin analytics becomes analytics + cohort monitoring + **projection calibration** |
| §N.3, §N.4, §N.6 | Free tier includes the diagnostic and a weekly readiness refresh; premium adds simulation and the projection; **billing live at MVP via a web processor** |
| §O.9 | Minimum age 13 replaces the under-13 consent flow; readiness and projection named as among the most sensitive fields held |
| **§P (all)** | Rewritten web-first: responsive structure, route hierarchy, the three-pane question screen, the response pane, a component inventory including the assessment components, WCAG 2.1 AA with keyboard operability, Core Web Vitals targets |
| §Q.2, §Q.3 | Assessment metrics added; quick-check pass rate and note-taking rate added as content-quality signals |
| **§S (all)** | Re-sequenced. Phase 0 now includes writing and having reviewed the readiness/projection rule set; Phase 4 extended to four weeks; Phase 5 adds teacher review of real projections; Phase 7 carries the mobile app |
| **§T (all)** | MVP redefined; **two gates instead of one** — content volume *and* an honest assessment engine |
| §V | **R-09 rewritten**; **R-17, R-18 new**; R-10 downgraded off the launch path; §V.1 summary note |
| **§W (all)** | Definition of done extended: determinism tests, the evidence-gate test, projection governance, accessibility, web launch criteria replacing Play criteria |
| §X | Next steps and the engineering handoff updated |

### 3.2 `TECHNICAL_BUILD_SPEC.md` (v1.0 → v2.0, 6,403 → ~7,250 lines)

| Section | Change |
| ------- | ------ |
| Header | Revision notice naming the four propagating changes |
| **§0.4** | Conflict 1 **reversed** — the projection is built, but as `grade_projections`, not as the prototype's mutable column |
| **§0.6** | D-01, D-10, D-11 amended; **D-16…D-22 added** (web-first, ten blocks, assessment-in-Postgres, append-only snapshots, gate-in-function, web billing, server-anchored timing) |
| §0.7 | U-04 downgraded; **U-07, U-08, U-09 added** |
| §1.1–1.3 | Component map: `apps/web` primary, `apps/mobile` V2; the assessment plane described; two Vercel projects |
| §2 | Repo structure: `apps/web` added in full; `packages/assessment-core` added with a hard no-computation rule; dependency rules extended |
| §3.0 | Eight new enum types |
| **§3.5** | `question_versions` gains the ten-block columns; publication preconditions extended |
| **§3.7** | `solution_steps` gains `result_blocks` — the per-step result chip |
| §3.20 | `exam_sessions` gains `form`, `blueprint_ok`, per-module and per-profile marks, per-item seconds, `submitted_late_by`; the R-09 note rewritten |
| **§3.25–3.28 (new)** | `diagnostic_sessions`, `readiness_snapshots`, `grade_projections`, `student_outcomes` |
| §3.24 | Three additions to the deliberately-not-created list, including a predicted-grade column and a materialised current-readiness value |
| **§11** | Schema to **2.0.0** — eight new required properties; §11.5 explains why no defaults |
| §17 | Retitled; web stack and browser matrix; mobile stack retained for V2 |
| **§18** | `revealing` phase added to the state machine; SVG sizing for CLS; ten layout invariants, all testable |
| **§19** | Next.js route tree; six navigation rules; the mobile tree retained for V2 |
| §20 | State allocation for web; §20.5 the service worker table — with **readiness, projection and entitlement as network-only** |
| §22 | Editor gains eleven new fields covering the ten blocks |
| §23 | Products, entitlement matrix and the conversion hypothesis; billing live at MVP |
| §24 | Twenty-one new analytics events, and an absolute rule that **no event carries a band, an index value or a reported grade** |
| §28.1 | Web performance gates including CLS, INP, LCP, JS budget, readiness recompute latency |
| **§32** | Phases re-planned: P13–P16 on web; **P17a, P17b, P17c added**; P18 with live billing; P19/P20 extended to ten blocks; dependency graph updated with the reasoning for P17c's ordering |
| §36 | **AT-16…AT-23 added** — publication gate, final-answer agreement, diagnostic, simulation conformance and timing, readiness determinism, projection governance, mark-impact ranking, marketing leak check |
| §38 | Rule 16 rewritten plus 16a–16e; three new "always" rules |
| **§39 (new)** | Web rendering strategy, responsive contract, PWA, web-specific security |
| **§40 (new)** | The ten-block model: storage, shapes, the three-layer reveal policy, component mapping, validation rules |
| **§41 (new)** | Diagnostic and simulation engines, including blueprint conformance and marking honesty |
| **§42 (new)** | Readiness and projection engine: function inventory, computation, gates, seven hard rules, calibration and back-test, the explainer route |
| Appendix B | Six new open items, including the named owner of the withdrawal decision |

### 3.3 `PROJECT_INSTRUCTIONS.md`

A Revision 2 notice at the top, ahead of the Rev 1 phase notes, stating what changed, which three reversals contradict habits the existing codebase encodes, what happens to the existing build, and the Rev 2 work queue. Invariants go from five to eight; decisions from fifteen to twenty-two; forbidden rule 16 rewritten with 16a–16e added; three additions to the "always" list; the diff-review step extended with the assessment-specific checks.

---

## 4. What this means for the code you already have

The Rev 1 build reached P22. Rev 2 is a re-sequence, not a restart, and the split is fairly clean:

**Reusable essentially unchanged** — `packages/types`, `packages/answer-core`, `packages/api-client`, `packages/content-schema`, `packages/design`; all of `supabase/` (migrations are additive); `apps/pipeline`'s architecture; `apps/admin`'s shell, auth, review queue and curriculum editor.

**Extended** — the content schema and pipeline prompts (six new authored fields per question), the admin editor and preview, `fn_publish_question`'s preconditions, and the database with four new tables and roughly a dozen new columns.

**Paused** — `apps/mobile`. It keeps its code and its history; it resumes at V2 and conforms to web behaviour under I-8.

**New** — `apps/web`, `packages/assessment-core`, and the four assessment migrations behind P17a–P17c.

**The largest single piece of catch-up work is content, not code.** Every published question needs six new authored blocks — concepts required, strategy, why this works, exam tip, quick check, and per-step results — plus a cognitive level and a second common error where only one exists. That is authoring and review, at roughly the same per-question cost as the original write, and spec U-09 flags it as measured rather than assumed. The pipeline can draft all of it; the review gate cannot be skipped, and Rev 2 explicitly refuses the tempting response of defaulting the new fields to empty strings so that old questions still publish.

---

## 5. Decisions still open, with owners

| # | Item | Owner | Needed by |
| - | ---- | ----- | --------- |
| 1 | **Named owner of the projection withdrawal decision** (blueprint §J.12 rule 7) | founder | before launch |
| 2 | Web payment processor, chosen on territory coverage (spec U-07) | founder | Phase 0 — gates P18 |
| 3 | Initial readiness→band mapping, reviewed and signed by a mathematics educator (U-08) | founder + SME | Phase 0 — gates P17c |
| 4 | Ten-block authoring throughput at 30/reviewer-day (U-09) | content lead | measured in P20 |
| 5 | Consent wording for collecting real grades into `student_outcomes` | founder + legal | before the first sitting |
| 6 | Whether the free tier's weekly readiness refresh is the right conversion split | product | tested in beta |

Items 1 and 3 are the two that would be cheapest to skip and most expensive to have skipped.

---

## 6. One thing worth restating

Rev 2 makes EdMar a product that tells a sixteen-year-old what grade it thinks they are heading for. That is a considerably more valuable product than a practice app, and a considerably more dangerous one. Nearly every rule added in this revision — the evidence gate, the bands, the confidence, the determinism requirement, the back-test, the marketing prohibition, the withdrawal criterion — exists to keep the second thing from consuming the first.

The single most important of them is the **pre-committed withdrawal criterion**: if the projection cannot be shown to be accurate, it is removed rather than kept and disclaimed. It is written into the blueprint, the spec, and an implemented config flag precisely because it will be argued against at the moment it matters most.
