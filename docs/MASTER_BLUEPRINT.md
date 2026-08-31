# EdMar CXC Mathematics — MASTER BLUEPRINT

**Document type:** Product & System Master Blueprint (pre-implementation)
**Phase:** Blueprint / Architecture. **No application code is contained in this document.**
**Prepared for:** EdMar Group
**Version:** 2.0 — *Revision 2: assessment-led, web-first*
**Date:** 30 August 2026 (Rev 1: 19 August 2026)
**Downstream consumer:** An engineering agent that will convert this into a Technical Build Specification, then implement in Cursor.

> **REVISION 2 NOTICE.** This revision changes the product's centre of gravity and its launch platform. Rev 1 described a practice engine that happened to record progress. Rev 2 describes an **examination-readiness system** whose five load-bearing capabilities are **diagnostic assessment, continuous monitoring, examination simulation, readiness analysis with a banded grade projection, and weak-area identification** — with practice as the instrument that feeds them. The first client is a **responsive web application (PWA)**; the React Native mobile app follows it. Rev 1's blanket refusal of grade prediction (§D.7, §J.1, §V R-09) is **superseded and replaced by a governed banded projection** — see §J.12 and the rewritten R-09. Every changed section is listed in `REVISION_02_CHANGELOG.md`.

---

## 0. HOW TO READ THIS DOCUMENT

### 0.1 Required-output cross-reference

The brief requested seventeen final outputs and twenty-three lettered sections. They are the same material organised two ways. This table maps one onto the other so nothing is assumed missing.

| #   | Required final output          | Where it lives             |
| --- | ------------------------------ | -------------------------- |
| 1   | Executive Summary              | §1                         |
| 2   | Complete Product Blueprint     | §A–§W (the whole document) |
| 3   | System Conceptual Architecture | §2                         |
| 4   | Feature Matrix                 | §D.6                       |
| 5   | User Journeys                  | §C                         |
| 6   | Question Engine Architecture   | §E                         |
| 7   | Content Architecture           | §F, §G, §H                 |
| 8   | AI Architecture                | §K, §L                     |
| 9   | Admin Architecture             | §M                         |
| 10  | Subscription Architecture      | §N                         |
| 11  | Security Architecture          | §O                         |
| 12  | Analytics Architecture         | §Q                         |
| 13  | MVP Scope                      | §T                         |
| 14  | Development Roadmap            | §S                         |
| 15  | Risk Register                  | §V                         |
| 16  | Definition of Done             | §W                         |
| 17  | Recommended next steps         | §X                         |

### 0.2 Status of source material

The brief refers to an existing JSON knowledge base of CSEC Mathematics past-paper content and to supplied CXC curriculum material. **Neither was available to this session.** No files were attached and no folder was connected.

The blueprint therefore proceeds on the basis agreed with the product owner: design against the _published, verifiable_ CXC syllabus structure (retrieved and cited below), and design the content model so the existing JSON can be migrated into it once inspected. Places where the real JSON must be examined before a decision is finalised are marked **[VERIFY-JSON]** inline, and the full list of fourteen specific things to check is collected in §X.2 as a single Phase 0 work item.

This is a design constraint, not a defect. The canonical model in §G is deliberately specified as a _target_ schema with an explicit migration contract (§G.9), which is the correct shape regardless of what the legacy JSON turns out to contain.

### 0.3 Assumptions register

Every non-obvious assumption is listed here. An assumption that later proves wrong should be traced back to this table rather than discovered in code.

| ID   | Assumption                                                                                                                             | Confidence       | Impact if wrong                                            | Verify by                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| A-01 | EdMar has, or can obtain, a lawful basis to reproduce CXC past-paper questions, **or** will pivot to original past-paper-_style_ items | Low — unresolved | Existential. See R-01                                      | Legal opinion / CXC licensing enquiry, before any content publication |
| A-02 | The legacy JSON contains per-question worked solutions in LaTeX of usable quality                                                      | Medium           | Rework of ingestion pipeline; higher AI spend              | [VERIFY-JSON]                                                         |
| A-03 | Target students have Android devices with intermittent but real connectivity                                                           | High             | Offline architecture (§E.9) becomes more or less important | Market research in Phase 0                                            |
| A-04 | US$4/month is payable — web card/wallet billing at MVP; Google Play billing from V2 — in target territories                                                                    | Medium           | Payment architecture changes materially                    | Google Play merchant availability check per territory                 |
| A-05 | Initial market is Jamaica, then wider CARICOM                                                                                          | High             | Localisation and currency assumptions                      | Product owner confirmation                                            |
| A-06 | EdMar has an existing brand direction (logo, palette, type)                                                                            | Medium           | §P.9 must be re-specified                                  | Request brand assets                                                  |
| A-07 | No student under 13 will be accepted without parental consent flow                                                                     | High             | Legal exposure; app-store rejection                        | Policy decision in Phase 0                                            |
| A-08 | Content authoring capacity of at least one qualified CSEC Mathematics teacher-reviewer is available                                    | High             | The whole human-review gate (§K.7) is unstaffable          | Hiring / contracting decision                                         |

### 0.4 Verified CXC facts used in this blueprint

These were retrieved from CXC's own published syllabus documents during preparation. They are cited so the engineering agent does not re-derive them, and so that anything CXC changes can be re-checked against a known baseline.

**There are two live syllabus versions. This is the single most important content-architecture fact in this document.**

**Syllabus V2018** — _effective for examinations from May–June 2018_. Governs examinations up to and including 2026. Nine sections, in order:

1. Number Theory and Computation
2. Consumer Arithmetic
3. Sets
4. Measurement
5. Statistics
6. Algebra
7. Relations, Functions and Graphs
8. Geometry and Trigonometry
9. Vectors and Matrices

Assessment: Paper 01 — 60 multiple-choice items, 1 hour 30 minutes, 60 marks, 30% of total. Paper 02 — 10 compulsory structured questions including one investigation question, 2 hours 40 minutes, 100 marks, 50%. Paper 03/1 — School-Based Assessment project, 20 marks, 20%. Paper 03/2 — alternative for private candidates, 1 hour, 2 compulsory questions, 20 marks.

**Syllabus V2027** — _effective for examinations from May–June 2027_. A structural redesign into three modules:

- **Module 1 — Fundamentals of Secondary Level Mathematics:** Number Theory and Computation; Consumer Arithmetic; Sets; Measurement; Algebra 1; Introduction to Graphs
- **Module 2 — Intermediate Secondary Level Mathematics:** Statistics 1; Algebra 2; Relations, Functions and Graphs 1; Geometry and Trigonometry 1; Vectors and Matrices 1
- **Module 3 — Higher Concepts in Secondary Level Mathematics:** Statistics 2; Relations, Functions and Graphs 2; Geometry and Trigonometry 2; Vectors and Matrices 2

Assessment: Paper 01 — 60 multiple-choice questions, 20 per module, 1 hour 30 minutes. Paper 02 — nine compulsory structured questions, three per module, 2 hours 30 minutes. Paper 031 — School-Based Assessment project (groups of no more than six candidates). Paper 032 — alternative for private candidates, 1 hour, three optional questions, one per module. Modular entry options exist for candidates sitting one or two modules.

Profile dimensions (both versions, reported per candidate): **Conceptual Knowledge (CK) 30%**, **Algorithmic Knowledge (AK) 40%**, **Reasoning (R) 30%**. The V2018 document labels the first two "Knowledge" and "Comprehension" in its weighting grid; the V2027 document uses CK/AK/R throughout.

Each syllabus section is internally structured as: General Objectives → Specific Objectives → Content/Explanatory Notes → Suggested Teaching and Learning Activities. **The Specific Objective is the atomic, officially-numbered unit of the CXC curriculum, and it is the anchor point for EdMar's entire taxonomy (§F).**

> **Note on exact mark weightings.** The published weighting grids were read via automated extraction and returned mutually inconsistent weighted-mark totals for Paper 01 (30 vs 90 weighted marks against a 300-mark total). The _percentages_ (30/50/20) are consistent across sources and are what the product needs. Before any feature displays weighted marks to a student, a human must read the assessment grid in the official PDF directly. Marked **[VERIFY-CXC-01]**.

> **Non-affiliation.** CXC®, CSEC® and CAPE® are trade marks of the Caribbean Examinations Council. EdMar is not affiliated with, endorsed by, or approved by CXC. Every surface of the product — store listing, splash, about screen, marketing site — must carry a non-affiliation disclaimer. See §V R-02.

---

### 0.5 What Revision 2 changed

A reader who knows Rev 1 can navigate the change from this table. Everything else is unchanged.

| Area                          | Sections rewritten or added                                              | Nature of the change                                                                    |
| ----------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| Product positioning           | §1.1, §1.5, §1.6, **§1.7 (new)**, §A.2, §A.6, §A.9, §T.1                 | Practice engine → examination-readiness system                                          |
| Platform                      | §1.7, §2.1, §D.2, §D.6, §N.6, §P (all), §S, §T.2, §W.4                   | Mobile-first → web-first; mobile app to V2                                              |
| Architecture invariants       | §2.2 (**I-6, I-7, I-8 new**), **§2.4 (new)**                            | Determinism, evidence gating, web as reference client; the assessment loop              |
| Question presentation         | **§G.11 (new)**, §C.9–C.11, §P.4–P.6, §M.4                              | The ten-block model from the reference interface, enforced at publication               |
| Diagnostic                    | §J.9, §C.14, §D.2                                                        | V1 → **MVP**                                                                            |
| Examination simulation        | §H (all), §C.15, §D.2                                                    | V1 → **MVP** for Paper 01; simulation separated from the past-paper rights question     |
| Readiness analysis            | **§J.11 (new)**, §C.16, §P.8                                            | New capability                                                                          |
| Grade projection              | **§J.12 (new)**, §D.7, §V R-09, **§V R-17 (new)**                       | **Reversed decision** — refused in Rev 1, built under eight governance rules in Rev 2   |
| Weak-area analysis            | §J.7, §J.8                                                               | Ranked by **mark impact** rather than by low score                                      |
| Monitoring                    | **§J.13 (new)**, §M.10, §Q.2, §Q.3                                      | Student self-monitoring and EdMar cohort monitoring; teacher/parent remain V2           |
| Commercials                   | §N.3, §N.4, §N.6, §1.4                                                   | Live web billing at MVP; diagnostic free, projection and simulation premium             |
| Risk                          | §V R-09 (rewritten), R-10 (downgraded), **R-17, R-18 (new)**            | The register's centre of gravity moves to the honesty of the numbers                    |
| Delivery                      | §S (all), §T (all), §W (all)                                             | Re-sequenced; **two** MVP gates instead of one                                          |

The full change log, with reasoning for each reversal, is `REVISION_02_CHANGELOG.md`.

---

## 1. EXECUTIVE SUMMARY

### 1.1 What is being built

EdMar CXC Mathematics is an **examination-readiness system** for Caribbean secondary students sitting CSEC Mathematics. It ships first as a **responsive web application**; a mobile application follows on the same data model and the same shared packages (§1.7).

It is not a chatbot, and — the change that defines this revision — it is not merely a practice app. A practice app answers one question: *give me something to work on*. This product answers five, continuously:

1. **What do you actually know?** — a structured **diagnostic** that maps the student against the syllabus before they have wasted a month revising what they can already do (§J.9).
2. **What is happening to that picture over time?** — continuous **monitoring** of mastery, accuracy, error patterns, decay and effort, for the student and for EdMar's own quality and support functions (§J.13).
3. **How would you perform in the examination as it is actually set?** — **examination simulation** under real CXC structure, timing and mark allocation (§H).
4. **How ready are you, and what does that mean?** — a **readiness index** and a **banded grade projection** with an explicit confidence level and stated evidence (§J.11, §J.12).
5. **What should you fix first?** — **weak-area identification** ranked by mark impact, not merely by low score (§J.7, §J.8).

Practice is the **instrument**, not the product. A student picks a topic or accepts a recommendation, receives a syllabus-aligned question, works it out themselves, and submits an answer. They immediately receive a verdict and a complete ten-block teaching response (§G.11): the concepts the question required, the strategy, a guided solution with the result of each step, the final answer, why the method works, the common mistakes on this question type, an examination tip, a quick transfer check, and the item's own validation metadata. Every attempt is evidence, and every piece of evidence updates the diagnostic picture, the readiness index and the projection.

The distinction is commercially load-bearing. Practice is a commodity that free PDFs supply badly and competitors supply adequately. **An honest, specific, continuously-updated answer to "am I ready, and what will cost me marks?" is what a student and a paying parent cannot get anywhere else** — and it is what makes the subscription renew in the months when the student is not practising much.

### 1.2 The central architectural decision

**AI is a factory, not a fixture.**

All artificial intelligence in this system operates _behind the product_, in batch, at content-build time — extracting questions from source documents, classifying them against the syllabus, drafting worked solutions and explanations, proposing question variants, and flagging duplicates. Every AI output passes through deterministic mathematical validation and then a human subject-matter reviewer before it is ever published.

At runtime, when a student taps CHECK ANSWER, **no AI is invoked**. The answer is validated deterministically against a pre-computed accepted-answer specification stored with the question. The solution and explanation are pre-written text already sitting in the database. The response is instant, works on a poor connection, is identical for every student who sees that question, and costs nothing per attempt.

This is not merely a cost optimisation, though the economics are decisive (§1.4). It is a _correctness_ decision. Mathematics has right answers. A system that regenerates an explanation on every attempt is a system that can produce a different — and sometimes wrong — explanation on every attempt, with no reviewable audit trail. A system that serves a reviewed, frozen, human-approved explanation is one whose quality can be measured, corrected, and guaranteed.

### 1.3 The content problem is the real problem

Software for this product is well-understood: Next.js, Supabase, Postgres, standard authentication, standard subscriptions, and — later — React Native. None of it is hard. **The difficulty, the cost, the risk and the defensibility all live in the question bank.**

A CSEC Mathematics practice app is only as good as the accuracy of its worked solutions and the fidelity of its syllabus mapping. A single wrong worked solution, screenshotted and shared in a WhatsApp group of Fifth Formers, does more reputational damage than a month of downtime. Accordingly, this blueprint devotes its centre of gravity — §E, §F, §G, §I, §K — to how questions are modelled, mapped, validated, reviewed and retired, and treats the app itself as the comparatively simple delivery layer that it is.

### 1.4 Why the economics work

At US$4/month on web billing, a card processor takes roughly 3% plus a fixed per-transaction amount, so net revenue per subscriber is approximately US$3.55–3.70/month before local taxes — somewhat better than the US$3.40 a 15% store commission would leave, which is a secondary but real benefit of launching on the web. The store commission returns for subscriptions bought in the mobile app at V2.

The load-bearing question is whether _per-student marginal cost_ stays near zero. Under this architecture it does: a student attempt is one database write and one cached read. Fixed infrastructure (Supabase Pro, Vercel, storage/CDN) is roughly US$50–150/month across the whole service until well past 10,000 students.

The counterfactual is instructive. If the product instead called a language model once per attempt at a conservative US$0.01, an ordinary student doing 5 questions a day would incur about US$1.50/month in AI cost — roughly **44% of net revenue**, consumed by a variable cost that grows precisely in line with the engagement the business wants to encourage. That architecture cannot be made to work at this price point. The one specified here can: gross margin above 90% is achievable from a few hundred subscribers upward.

AI spend becomes, in effect, a capital expenditure on the content library: a one-time-per-question cost, amortised across every student who ever sees that question, and falling toward zero per student as the base grows.

### 1.5 What must be true for this to succeed

Four things, in order of how likely they are to kill the product:

1. **Content rights are resolved.** CXC past papers are copyrighted. Reproducing them verbatim at commercial scale without a licence is infringement, and it is the risk most likely to end this product. §V R-01 sets out the decision and the fallback (original syllabus-aligned items).
2. **Mathematical accuracy is systematically enforced**, not hoped for. §I and §K.6 specify the deterministic validation gates.
3. **Dual-syllabus support is built in from day one.** A student sitting in 2026 needs V2018; a student sitting in 2027 needs V2027's modular structure. Retrofitting this later means re-tagging the entire question bank. §F.6.
4. **Students actually return.** A readiness system is worthless if it is opened twice. §J's mastery loop, the readiness index and §D's retention features exist for this reason, and §Q measures it honestly.
5. **The projection is honest and it is defensible.** Rev 2 makes a claim about a student's likely examination outcome. That claim must be banded, confidence-qualified, evidence-gated, deterministic, reproducible, and continuously back-tested against real results as they arrive. §J.12 specifies the governance; R-09 and R-17 hold the risk. A projection that flatters students is a product defect and a legal exposure, in that order of frequency and the reverse order of cost.

### 1.6 MVP in one paragraph

**Web first.** A responsive Next.js application, installable as a PWA, working on a phone browser and on a school laptop. Email and Google sign-in. The V2027 syllabus taxonomy (V2018 structurally supported, populated later — spec U-02). A reviewed bank of at least 1,200 questions, each carrying the full ten-block presentation model. A **20–25 item diagnostic** that produces a coverage map on day one. Topic practice in 5/10/20-question sessions. Deterministic answer checking for multiple-choice and numeric/fraction answers. The ten-block solution response. **One examination simulation** — a full Paper 01 (60 items, 90 minutes) under real timing, with a per-module and per-profile-dimension breakdown. A **readiness index** and a **banded grade projection** with confidence, both evidence-gated. Weak areas ranked by mark impact. Session results and a monitoring view. Free tier limited by daily question count; premium unlocks the bank, the simulations and the projection. Admin console for question review, publication and cohort monitoring. Nothing else. §T draws the boundary precisely, including an explicit exclusion list.

### 1.7 Platform sequence and why web is first

Rev 1 specified Android-first. Rev 2 reverses that, for four reasons that are specific to what this product has become:

1. **The analytical surfaces need width.** A coverage map across 15 topics, a readiness breakdown by paper and profile dimension, an examination review screen with 60 items — these are legible on a 1280px viewport and cramped on a 360px one. The product's differentiating screens are the ones that most want a browser.
2. **Examination simulation wants a keyboard and a big screen.** A 90-minute Paper 01 sat on a phone is a worse rehearsal than one sat on a laptop, and rehearsal fidelity is the point.
3. **Distribution and iteration.** No store review, no release train, no minimum-version tail. A content or scoring correction reaches every student on their next page load — which matters acutely for a product that makes projections. Google Play merchant availability (spec U-04) also stops being a launch blocker, because web billing is available immediately.
4. **Acquisition.** A URL can be pasted into a class WhatsApp group by a teacher. An app install cannot.

The mobile application is **not cancelled and not deferred indefinitely** — it is sequenced second, and the architecture protects it: all answer validation, all typing, all API access and all design tokens live in shared packages that React Native consumes unchanged (§2.1). The web client is the **reference implementation**; where the two ever differ, the web behaviour is correct and the mobile behaviour is the bug (I-8).

The one thing genuinely given up is offline practice on a metered connection, which Rev 1 valued highly and correctly. The PWA mitigation — service-worker caching of the active session's payloads and a background attempt-sync queue — recovers most of it, and §E.9 is rewritten accordingly.

---

---

## 2. SYSTEM CONCEPTUAL ARCHITECTURE

### 2.1 The three planes

The system separates cleanly into three planes with deliberately narrow interfaces. Understanding this separation is sufficient to understand the whole architecture.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  PLANE 1 — CONTENT FACTORY          (offline · batch · AI-heavy)         │
│                                                                          │
│   Source documents ──► Extraction ──► Question candidates                │
│        │                                     │                           │
│        │                                     ▼                           │
│        │                            Classification &                     │
│        │                            curriculum mapping                   │
│        │                                     │                           │
│        │                                     ▼                           │
│        │                        Solution + explanation drafting          │
│        │                                     │                           │
│        │                                     ▼                           │
│        │                     ┌───────────────────────────┐               │
│        │                     │ DETERMINISTIC VALIDATION  │  (no AI)      │
│        │                     │ CAS · numeric · LaTeX     │               │
│        │                     │ lint · schema · duplicate │               │
│        │                     └───────────────────────────┘               │
│        │                                     │                           │
│        │                                     ▼                           │
│        │                     ┌───────────────────────────┐               │
│        └────────────────────►│   HUMAN REVIEW GATE       │               │
│           (audit trail)      │   qualified SME approval  │               │
│                              └───────────────────────────┘               │
│                                              │                           │
│                                       APPROVED / PUBLISHED               │
└──────────────────────────────────────────────┼───────────────────────────┘
                                               │
                                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  PLANE 2 — CANONICAL STORE          (Supabase · Postgres · Storage)      │
│                                                                          │
│   curriculum taxonomy · question bank · accepted-answer specs ·          │
│   worked solutions · explanations · diagrams · papers ·                  │
│   student identities · attempts · mastery state · entitlements ·         │
│   audit log                                                              │
│                                                                          │
│   Row Level Security is the primary authorisation boundary.              │
└──────────────────────────────────────────────┬───────────────────────────┘
                                               │
                       ┌───────────────────────┴────────────────────┐
                       ▼                                            ▼
┌────────────────────────────────────────┐   ┌────────────────────────────────┐
│  PLANE 3a — STUDENT WEB APP  ★FIRST★   │   │  PLANE 3b — ADMIN CONSOLE      │
│  Next.js · TypeScript · Vercel · PWA   │   │  Next.js · TypeScript · Vercel │
│                                        │   │                                │
│  · Reads published content only        │   │  · Review queue                │
│  · Writes attempts only                │   │  · Question editor             │
│  · DETERMINISTIC answer checking       │   │  · Curriculum management       │
│    IN THE BROWSER — no round trip      │   │  · Publication control         │
│  · Service-worker cache of the         │   │  · Cohort monitoring (§J.13)   │
│    active session + sync queue         │   │  · Projection calibration      │
│  · Diagnostic · simulation · readiness │   │  · Analytics · audit           │
│  · NO AI CALLS. EVER.                  │   │  · Triggers factory batches    │
└────────────────────────────────────────┘   └────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────┐
│  PLANE 3c — MOBILE APP        (V2)     │
│  React Native · Expo · TypeScript      │
│  Consumes the SAME shared packages:    │
│  @edmar/answer-core · types ·          │
│  api-client · assessment-core · design │
│  Web is the reference behaviour (I-8)  │
└────────────────────────────────────────┘
```

### 2.2 The rules that hold the architecture together

Five invariants. An engineering agent should treat a violation of any of them as a design bug, not a trade-off.

**I-1 — No AI on the student path.** No screen a student can reach may cause a language-model call, directly or transitively. Enforced by network policy (the mobile client holds no AI credentials and no route to one) and by a CI check that the mobile bundle imports no AI SDK.

**I-2 — Nothing reaches a student unapproved.** The student app reads only rows whose status is `published`. Enforced in Row Level Security, not application logic, so that a client bug cannot leak draft or AI-unreviewed content.

**I-3 — Answer checking is deterministic and local.** Correctness is decided by evaluating the student's input against a pre-computed accepted-answer specification (§I). It runs in the client — the browser today, the mobile runtime later — from one shared package, so it tolerates a lost connection and returns in milliseconds. The server re-derives correctness when the attempt syncs, and the server value is authoritative for progress.

**I-4 — Content is immutable once published; corrections are versions.** A published question is never edited in place. A correction creates a new version and retires the old one, preserving the attempt history's meaning. §E.11.

**I-5 — Every AI-touched artefact carries provenance.** Which model, which prompt version, which run, which reviewer approved it, and when. Non-negotiable for quality forensics and for the "was this written by a machine" question that schools and parents will eventually ask.

**I-6 — All assessment output is deterministic and recomputable.** Diagnostic results, mastery, the readiness index, the weak-area ranking and the grade projection are produced by explicit, versioned, rule-based computation over the immutable attempt log. The same attempt log must produce the same numbers on any machine at any time, and every number must be reproducible from first principles on demand. No model, no learned weights that cannot be re-derived, and — as everywhere else — no AI. A number a student is told about their future that cannot be recomputed and explained is not defensible.

**I-7 — No projection without evidence.** The readiness index and the grade projection are **withheld entirely** below the evidence floor (§J.11), are always expressed as a **band with a confidence level**, always state what evidence they rest on, and never appear without the standing qualification that they are a projection from practice, not a CXC result. Any interface that shows a projection must show its confidence in the same visual unit. Violation of this invariant is the single most likely route to the reputational and consumer-protection damage described in R-09.

**I-8 — The web client is the reference implementation.** Where the mobile client and the web client differ in scoring, validation, presentation order or wording of any assessment output, the web behaviour is correct by definition and the mobile behaviour is a defect. Both consume the same shared packages precisely so that this rarely arises.

### 2.3 Request paths in words

**Student practises a topic.** App requests a practice session for a skill set → selection service (a Postgres function, §E.4) returns N question IDs honouring cooldown, difficulty targeting and entitlement → app fetches those question payloads, cached where already held → student answers → device evaluates against accepted-answer spec → verdict shown instantly with the stored solution and explanation → attempt queued locally → synced → server recomputes mastery.

**Admin publishes a question.** Admin opens the review queue → sees the item with its AI provenance, its validation report and its proposed curriculum mapping → edits if necessary → approves → status transitions to `published` → the change is written to the audit log → the content version counter increments, which is how clients know their cache is stale.

**Content batch runs.** Admin uploads a source document → a background job (Edge Function or scheduled worker) extracts candidates → classification and drafting run against the AI provider → deterministic validators run → duplicate detection runs → survivors land in the review queue as `pending_review`. No student is affected at any point in this process.

**Student takes the diagnostic.** App requests a diagnostic → the blueprint function selects a fixed-coverage, difficulty-walking item set spanning every module (§J.9) → the student works through it without per-item feedback → on submission the server computes provisional mastery for every skill touched, marks untouched skills `unknown`, and returns a coverage map → the readiness index becomes computable and the first recommendation becomes meaningful.

**Student sits an examination simulation.** App requests a simulation of a given paper form → the server materialises the item set to the real CXC blueprint (§H.6), anchors the timer server-side, and returns the payloads → the student works under timing → on submission, deterministic marking runs, marks are attributed per module and per profile dimension (CK/AK/R), the attempt log is written, and the readiness index and projection are recomputed → the review screen exposes the full ten-block response for every item.

**Readiness is recomputed.** Any attempt, in any context, enqueues a recomputation of that student's skill mastery, topic rollups, readiness index and grade projection. The computation is deterministic (I-6), runs in the database, and writes a **snapshot** row so that the student's readiness history is itself an observable series rather than only a current value.

### 2.4 The assessment loop

The five capabilities in §1.1 are not five features bolted together; they are one loop, and the order matters.

```
      ┌──────────────┐
      │  DIAGNOSTIC  │  establishes the initial map — what is unknown,
      │   (§J.9)     │  not merely what is weak
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │   PRACTICE   │  the instrument: every attempt is evidence
      │  (§C, §E)    │  (ten-block response, §G.11)
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │  MONITORING  │  mastery · accuracy · error patterns · decay ·
      │   (§J.13)    │  effort — for the student and for EdMar
      └──────┬───────┘
             ▼
      ┌──────────────┐
      │  SIMULATION  │  performance under real structure and timing —
      │    (§H)      │  the only unbiased evidence in the system
      └──────┬───────┘
             ▼
      ┌──────────────────────────────┐
      │  READINESS + PROJECTION      │  index (§J.11), banded grade with
      │  (§J.11, §J.12)              │  confidence (§J.12)
      └──────┬───────────────────────┘
             ▼
      ┌──────────────┐
      │  WEAK AREAS  │  ranked by MARK IMPACT, not by low score —
      │ (§J.7, §J.8) │  which returns the student to practice
      └──────┬───────┘
             └────────────────► back to PRACTICE
```

Two properties of this loop are worth stating explicitly because they constrain the build:

**Simulation evidence outranks practice evidence.** Practice is self-selected, untimed, and immediately followed by the answer; simulation is structured, timed and blind. The readiness index therefore weights simulation attempts substantially more heavily than practice attempts, and a projection made without any simulation evidence carries a lower confidence ceiling regardless of practice volume (§J.12). This is the mechanism that stops a student grinding easy topics to a flattering number.

**Every capability degrades gracefully to "not enough evidence".** Each of the five must have a defined, honest, non-empty behaviour on day one, when the student has answered three questions. "Not enough evidence yet, here is what would change that" is a valid and required state everywhere in §J, and it is specified per screen rather than left to implementation (§P).

---

## SECTION A — PRODUCT VISION

### A.1 Product name

Working name: **EdMar Maths** (store listing: _EdMar Maths — CSEC Mathematics Practice_).

Naming constraints that must be respected: the name must not imply CXC endorsement, must not use "CXC" or "CSEC" as the _leading_ element of the app name (trade-mark exposure), and should read naturally to a Caribbean fifteen-year-old. Descriptive use of "CSEC Mathematics" in the subtitle is defensible; "CSEC Maths Official" is not. Final name is a Phase 0 decision. Placeholder used throughout this document: **EdMar Maths**.

### A.2 Purpose

To tell every Caribbean student sitting CSEC Mathematics **exactly where they stand, exactly what will cost them marks, and exactly what to do about it** — and to give them the correctly-worked, syllabus-aligned practice and full examination rehearsal needed to close the gap, at a price a student can pay themselves.

The shorter form, which is the one that goes on the site: *know where you stand, and what to fix.*

### A.3 The problem

CSEC Mathematics is a gatekeeper subject across the Caribbean. It is required for matriculation into most tertiary programmes and for a large share of entry-level employment. Regional pass rates have long been a subject of public concern, and the constraint is rarely that students do not work — it is the structure of the help available to them:

- **Practice without feedback.** A student can obtain past papers easily. What is scarce is a _correct worked solution_ at the moment of not understanding. Mark schemes give the answer, not the method. A student who gets 14 wrong and cannot see why has learned that they are bad at mathematics, which is the opposite of what was intended.
- **Feedback is priced as a scarce human service.** Private tuition in the region typically runs from roughly US$10 to US$30 per hour. A student needing sustained support needs many hours. Most families cannot buy them, and the students who most need help are systematically the ones least able to.
- **Free material is unstructured.** YouTube and shared PDFs exist in abundance but are not mapped to the syllabus, not sequenced, and not responsive to what a given student keeps getting wrong. The student must already know what they don't know in order to search for it — a well-known bootstrapping failure.
- **Nothing keeps score.** Almost nothing in a student's revision tells them, concretely, _"you are strong on Consumer Arithmetic and weak on Vectors, and here are twelve questions on the specific thing you keep missing."_
- **A syllabus change is arriving.** The V2027 syllabus restructures the subject into three modules with modular entry options. Existing material, teacher notes and revision books will lag. This is a genuine opening for a product whose taxonomy is version-aware from the start.

### A.4 Target users

**Primary user — the CSEC Mathematics candidate.** Typically 14–18, in Fourth or Fifth Form, sitting the examination in May–June (with a smaller January cohort). Owns or shares an Android phone. Data is metered and sometimes tight. Studies in bursts, heavily concentrated in the ten weeks before the examination. Motivated by a grade, not by mathematics. Has limited patience for anything that is slow, confusing, or feels like a toy.

A secondary strand of the same user: the **resit candidate** — often older, often out of school, often self-funding, frequently the most motivated user in the base and the most willing to pay. Do not design them out.

**Secondary users:**

- **Parents and guardians**, who in practice are the payer for a meaningful share of subscriptions and who need a reason to believe the money is doing something. They are not a _user_ of the practice loop in MVP but are a purchaser and a churn factor.
- **Teachers**, who influence adoption enormously — a teacher recommending an app to a class of thirty is the highest-leverage acquisition channel available — and who become a direct user in V2 via class/school features.
- **Schools**, as a licensing customer in the future roadmap (§U), not in MVP.
- **EdMar content administrators and reviewers**, who are internal users of the admin console (§M) and whose throughput is the binding constraint on content growth.

### A.5 Geographic market and expansion

**Phase 1 — Jamaica.** Largest single CSEC candidate cohort, English-speaking, high Android penetration, and EdMar's home market. Launch here, learn here.

**Phase 2 — the wider CARICOM CSEC market:** Trinidad and Tobago, Barbados, Guyana, and the OECS territories (Antigua and Barbuda, Dominica, Grenada, St Kitts and Nevis, Saint Lucia, St Vincent and the Grenadines), plus Belize, The Bahamas, Suriname's anglophone cohort and the British Overseas Territories that sit CSEC.

**Why expansion is architecturally cheap here:** CSEC is a _regional_ examination. The syllabus is identical across territories. Unlike a national-curriculum product, EdMar does not need to rebuild its content library per market. What changes per territory is: currency presentation, payment rails, examination-session calendar, and marketing. That is a thin layer.

**What must be built now to make it cheap later:** a `territory` attribute on the student profile from day one (cheap now, painful to backfill); currency display driven by locale rather than hard-coded to JMD or USD; and no assumption anywhere in the codebase that there is exactly one examination sitting per year.

**Diaspora.** A non-trivial number of candidates sit CSEC from the US, Canada and the UK. They pay in hard currency, and they are reachable through the same store listing at zero marginal cost. Do not geo-restrict.

### A.6 Value proposition

> _Know exactly where you stand in CSEC Maths, exactly what will cost you marks, and exactly what to do about it — for less than the price of a patty a week._

For the student: a diagnostic that maps them against the syllabus in twenty minutes, full examination rehearsals under real timing, an honest readiness reading with a projected grade band, weak areas ranked by what they will actually cost in the examination, and unlimited practice with a complete worked teaching response for every single question.

For the parent: a defensible, cheap, visible intervention — with a readiness reading and a trend they can see, stated honestly rather than sold.

For the teacher: a way to set structured practice and a mock paper without marking either.

**What is being sold, stated plainly.** Practice is the commodity; the readiness answer is the product. Any competitor can ship questions. The asset here is a verified bank *plus* a deterministic, explainable, continuously-back-tested assessment engine on top of it — and the second half is what a student still opens in the week they have not practised.

### A.7 Competitive positioning

The realistic competitive set, and where EdMar sits against each:

| Competitor type                              | What they do well              | Where they fail the CSEC student                                                                                                                         | EdMar's position                                                                        |
| -------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Free PDFs / past paper sites                 | Free, abundant, authentic      | No solutions, no structure, no feedback, no tracking                                                                                                     | EdMar supplies exactly what is missing: the worked solution and the tracking            |
| YouTube tutors                               | Free, human, often excellent   | Passive, unsearchable by weakness, no practice, no record                                                                                                | EdMar is active practice, not watching                                                  |
| General AI chatbots                          | Free or cheap, answer anything | Confidently wrong on mathematics; not syllabus-mapped; teach the student to ask rather than to work; no progress model                                   | EdMar is reviewed, syllabus-mapped, and deliberately makes the student attempt first    |
| International EdTech (Khan, Photomath, etc.) | Polished, well-funded          | Not CSEC-aligned; wrong curriculum, wrong notation conventions, wrong exam technique; Photomath in particular _removes_ the work rather than teaching it | EdMar is regionally specific — the thing global platforms structurally will not build   |
| Private tutors                               | Highest quality, personal      | US$10–30/hour; unavailable at 11pm the night before                                                                                                      | EdMar is not a substitute for a good tutor; it is the practice a tutor cannot supervise |
| Regional CSEC apps                           | Same market, same alignment    | Typically thin content, unreviewed solutions, poor mathematical typesetting, abandoned                                                                   | EdMar's moat is content depth and _verified_ accuracy — see A.9                         |

**The honest strategic read:** the barrier to entry on the _software_ is near zero. Anyone can ship a quiz app. The barrier on a **reviewed, syllabus-mapped, mathematically-verified question bank with worked solutions** is high, slow and compounding. That is the asset. Build the app to be adequate and the bank to be excellent.

### A.8 Why a student pays US$4/month

Four reasons, in descending order of persuasiveness:

1. **Price anchoring against tuition.** One hour of tuition costs two to seven months of EdMar. The comparison makes itself.
2. **The unlock is specific and immediate.** The free tier gives real value but rations it. A student in April who has hit the daily limit and has an examination in six weeks converts readily, because the thing being withheld is the thing they need right now.
3. **It is a self-purchasable amount.** US$4 is inside a student's own discretionary range in much of the region. Products priced at US$15 require a parental conversation; products at US$4 often do not. This materially raises conversion.
4. **The progress screen creates ownership.** A student who has built up 60% mastery across eleven topics has a sunk investment they can see. This is the retention mechanism, and it is why §J is a core section rather than a nice-to-have.

**Where the objection will come from:** seasonality. Students churn hard in July after the examination. Plan for it (§N.7) — do not treat it as a failure.

### A.9 Core differentiators

1. **An honest readiness answer.** A diagnostic, a readiness index, a banded grade projection with a stated confidence, and weak areas ranked by mark impact — all deterministic, all explainable to a sixteen-year-old, all back-tested against real results. Competitors in this market either do not attempt this or attempt it dishonestly with an unqualified number. Doing it *honestly* is the differentiator; doing it at all is not.
2. **Examination simulation at real fidelity.** The actual CXC paper structure, item counts, timing and mark allocation (§H), with results broken down per module and per profile dimension (CK/AK/R) — the same axes the examination itself is built on.
3. **Verified mathematical accuracy.** Every published solution has passed deterministic validation and human SME approval, with an audit trail. This is a claim EdMar can make truthfully and competitors mostly cannot.
4. **A complete teaching response per question, not just an answer.** The ten-block model (§G.11) — concepts required, strategy, guided solution, why it works, common mistakes, examination tip, quick transfer check — is what a tutor gives and what every competitor's "solution" screen omits.
5. **True syllabus mapping to the Specific Objective.** Not "Algebra" — _Section 6, Specific Objective 12_. This is what makes recommendation meaningful and what makes teacher adoption possible.
6. **Dual-syllabus readiness (V2018 and V2027).** A structural advantage over every incumbent's back catalogue for the next two years.
7. **Explanation quality as the product.** Most competitors treat the explanation as an afterthought to the answer. Here, the explanation _is_ the thing being sold; the question is just the delivery vehicle.
8. **Speed and connection tolerance.** Instant in-browser answer checking; the active session is service-worker cached and attempts sync when the connection returns. In this market that is a feature, not polish.
9. **No install required.** A teacher can paste a link into a class group and thirty students are practising in ninety seconds. This is the cheapest acquisition channel in the market and it is unavailable to an app-only competitor.
10. **Cost structure.** The margin profile allows EdMar to sustain a US$4 price indefinitely, which a per-attempt-AI competitor cannot match without either raising price or degrading quality.

---

## SECTION B — PRODUCT PRINCIPLES

These are decision rules, not values statements. Each is written so that it can actually settle an argument. Where two principles conflict, the lower-numbered one wins.

**B-1 · CXC-first.** If it is not on the CXC syllabus, it is not in the product. Every question maps to a Specific Objective. Interesting mathematics that is not examinable is a distraction from the one thing the student is paying for.

**B-2 · Mathematically correct, or absent.** A wrong solution is worse than no solution. When in doubt, unpublish. There is no acceptable error rate that can be traded against velocity.

**B-3 · The student does the work.** The product never solves the question before the student has attempted it. No hints before the attempt in MVP; no answer-reveal shortcut; no photograph-the-question-and-get-the-answer. This is a pedagogical commitment and it is also what distinguishes EdMar from tools that damage the students who use them.

**B-4 · Explanation over verdict.** "Incorrect" is worthless on its own. Every wrong answer is an opportunity to teach, and the interface should devote more space to the _why_ than to the mark.

**B-5 · Deterministic by default.** If a task can be done with arithmetic, a rule, or a lookup, it must not be done with a model. AI is permitted only where genuine natural-language generation or classification is required, and only offline. (§L)

**B-6 · No AI on the student path.** Restated as a principle because it will be under pressure from every future feature request. The answer is no. If a feature requires runtime AI, it needs to be redesigned or costed as a separate premium tier.

**B-7 · Fast beats featureful.** Target: question renders in under 400ms from tap on a mid-range Android device over 3G; answer verdict is instantaneous because it is local. A student in a revision session will tolerate a plain interface; they will not tolerate a spinner.

**B-8 · Mobile-first, small-screen-first, low-data-first.** Design for a 5.5" screen, one hand, and a metered connection. The admin console is the only place where a desktop assumption is permitted.

**B-9 · Content is versioned, never overwritten.** Published content is immutable. Corrections create versions. History must remain interpretable, because a student's past attempt was against a specific version of a question.

**B-10 · Low fixed cost, near-zero marginal cost.** Every architectural decision is checked against the question "what does this cost at 50,000 students?" A design whose cost scales linearly with attempts is rejected by default.

**B-11 · Least data.** Collect what the product needs to function and improve; nothing more. Students are minors. Every additional field is a liability, a consent obligation, and an app-store review question. (§Q.9)

**B-12 · Security at the data layer.** Authorisation lives in Row Level Security policies, not in client code and not solely in API handlers. Assume the client is hostile; assume the API surface will be called directly.

**B-13 · Build the boring version first.** Prefer the well-understood solution. Novel infrastructure is a tax paid in incidents. Deviations from the stack in §4 of the brief require written justification.

**B-14 · The review gate is sacred.** No mechanism, however convenient, may publish content that a qualified human has not approved. This includes future "high-confidence auto-approve" proposals, which will be raised and must be refused until there is measured evidence over thousands of items.

**B-15 · Measure retention honestly.** Vanity metrics (downloads, registrations, questions in the bank) are reported but never used for decisions. The decision metrics are weekly active practice, questions per active student, and subscription retention. (§Q)

**B-16 · Design for the syllabus change.** Anything that hard-codes the V2018 nine-section structure is a defect. (§F.6)

**B-17 · Accessible enough to be usable.** Minimum: legible type at default size, 4.5:1 contrast on text, touch targets ≥44pt, and — specific to this product — mathematical content that does not rely on colour alone to convey meaning. Full screen-reader support for LaTeX is a known hard problem and is explicitly deferred (§U), but the rest of the interface should not be gratuitously inaccessible.

**B-18 · Ship the smallest thing that is genuinely useful.** Scope creep is the named enemy of this project. §T's exclusion list is binding.

---

## SECTION C — STUDENT EXPERIENCE

The complete journey, stage by stage. For each stage: what the student sees, what the system does, what is decided, and what is deliberately _not_ there.

### C.1 First launch and onboarding

**Goal: get to a first solved question in under 90 seconds, with no account — then to a diagnostic within the first week.**

The largest drop-off in education products is a registration wall in front of an unproven product; the second largest is a twenty-minute test in front of one. EdMar avoids both by ordering them correctly: **taste first, map second.**

- **Screen 1 — Value, once.** Three cards, skippable: _Find out exactly where you stand_ / _See every step of the working_ / _Rehearse the real exam_. No sign-up prompt.
- **Screen 2 — Exam target.** "When are you sitting CSEC Maths?" — May–June 2027, January 2027, May–June 2028, Not sure yet. This determines the syllabus version (§F.6), anchors the readiness timeline (§J.11), and is the most valuable single field collected anywhere in the product. It is asked first because it is genuinely used.
- **Screen 3 — Starting point (optional, skippable).** "Which topics do you want to work on?" Used only to order the topic list.
- **Screen 4 — Straight into a question.** Not a dashboard. A real question at accessible difficulty, with the full ten-block response (§G.11) after the student answers. This is the product demonstrating itself.

_Not present at first launch:_ the diagnostic. It is offered — prominently, as the primary home card — **after the student has completed a first practice session**, at which point they have seen what a question and a solution look like and the twenty-minute investment is legible. This is a change from Rev 1, which deferred the diagnostic to V1 entirely; Rev 2 makes it an MVP capability but keeps it out of the cold-start path. See §J.9.

### C.2 Account creation

**Trigger:** after the third question, or when the student taps anything that needs persistence (progress, the diagnostic, a simulation), or when they hit the free daily limit.

- Email + password, and Google sign-in.
- Requested at sign-up: display name (or nickname), territory, exam sitting (pre-filled from onboarding). **Not** requested: date of birth beyond an age-band check, school, address, phone number, photograph. (B-11)
- **Age handling.** Minimum age 13, enforced at sign-up (spec U-05). This removes the parental-consent surface entirely; students under 13 are not the CSEC cohort. (§O.9)
- Anonymous progress from C.1 is migrated into the new account on creation.

### C.3 Home

The home screen answers one question: _what should I do right now?_ It is not a dashboard — but in Rev 2 it does carry one standing number, because that number is the product.

- **Readiness strip** — the readiness index and, once earned, the projected grade band with its confidence (§J.11–J.12). Below the evidence floor it reads _"Not enough evidence yet — take the diagnostic to get your first reading"_, which is a call to action rather than an empty state. It is one strip, never a wall of gauges.
- **Continue** — resumes the last unfinished session or simulation. Primary action.
- **Recommended practice** — one card, from the mastery and mark-impact model (§J.8), with its reason in one sentence: _"Simultaneous equations — you missed 4 of your last 5, and this is worth about 9 marks on Paper 02."_ One recommendation, not five.
- **Take the diagnostic** — promoted until it is done; afterwards a quiet _re-diagnose_ offer once mastery has moved materially or 60 days have passed.
- **Sit a mock paper** — entry to examination simulation (§H), promoted as the exam date approaches.
- **Practice by topic** — entry to the topic list.
- **Practice days this week** — small, honest, non-manipulative. Not a punitive streak.
- Free-tier students see remaining questions today, stated plainly, without a countdown-timer aesthetic.

### C.4 Topic selection

- Syllabus modules and topics listed in official order, each showing: name, question count available, mastery, and — new in Rev 2 — **examination weight**, because a student choosing where to spend an hour deserves to know what the topic is worth. Mastery is shown as a proportion filled, not a percentage figure, until enough attempts exist for the number to be meaningful (§J.6).
- Expanding a topic shows subtopics / Specific Objective groupings, each independently practisable, each with its own mastery state including the honest _not started_.
- Locked (premium) content is visible but marked, never hidden.
- Search across topic and subtopic names. Not full-text question search in MVP — that invites answer-hunting (B-3).

### C.5 Practice setup

Deliberately minimal. Two controls, sensible defaults, one large button.

- **Number of questions:** 5 / 10 / 20, default 10.
- **Difficulty:** Mixed (default) / Building up / Challenge — mapped to the difficulty bands in §E.5 and shown as a chip in the session header, as in the reference interface.
- Everything else — selection, spacing, avoiding repeats — is the engine's job and is not exposed. (B-7)
- **Start practice.**

### C.6 The question screen

The most important screen in the product. Its layout is specified in §P.4 and is illustrated by the reference interface: on a wide viewport, a **persistent left navigation**, a **question pane** and a **response pane** side by side; on a narrow viewport, the question with the response blocks collapsed beneath it as an accordion. The response pane is empty — genuinely empty, not blurred or teasing — until the student has answered or explicitly skipped. (B-3)

- **Top bar:** paper/session identity (e.g. _May/June 2024 · Paper 02 · General Proficiency_), difficulty chip, session timer, pause, end session, account. In **practice** the timer is a neutral elapsed count and is dismissible; in **simulation** it is a countdown and is not (§H.6).
- **Question pane:** question number and mark value, rendered mathematics (§G.8), a diagram where present with _tap to zoom_, and the answer input for the question's answer type (§I).
- **Question navigator:** a numbered strip (1…N) with previous/next, so a student can move within a session rather than being marched through it. State per item — unanswered, answered, flagged — is visible.
- **Bookmark** on the question itself.
- **CHECK ANSWER** — persistent and always reachable; disabled until an answer is entered.
- **Skip** — available, and recorded as a distinct outcome from a wrong answer. A skipped question means "I don't know where to start", which is different evidence from an error, and §J treats it differently.

_Not present:_ hints before the attempt, a "show answer" button before an answer or explicit skip, any AI affordance, adverts, or social features.

### C.7 Answer

The student enters or selects an answer. Input is normalised as they type (§I.3) — a student typing `1/2`, `0.5`, or `.50` is not failed on formatting. Invalid _input_ (letters in a numeric field) is prevented at the input rather than punished at submission.

### C.8 Check

Tap CHECK ANSWER. The browser evaluates the input against the question's accepted-answer specification (§I.4). Local, deterministic, instantaneous. No network call and no loading state — a loading state at this moment is the single most frustrating thing the product could do.

The attempt is written to the local queue immediately and synced opportunistically.

### C.9 Result and the ten-block response

The verdict appears **in place**, keeping the student's answer visible beside it; the full teaching response then occupies the response pane (wide) or expands beneath (narrow). The response is the **ten-block model specified in §G.11**, in this fixed order:

| #   | Block                 | What it does                                                                                                  |
| --- | --------------------- | ------------------------------------------------------------------------------------------------------------- |
| 1   | **Question**          | The stem, diagram and mark value, still visible beside the response                                            |
| 2   | **Concepts required** | The named syllabus concepts this item tests — the bridge from "I got it wrong" to "I need to revise *this*"    |
| 3   | **Strategy**          | The approach in one or two sentences, *before* any algebra — the step students most often cannot do themselves |
| 4   | **Guided solution**   | Numbered steps, each with its working, a one-line statement of what is being done and why, and its result      |
| 5   | **Final answer**      | Stated once, unambiguously, visually distinct                                                                  |
| 6   | **Why this works**    | The underlying principle, in plain student-directed English                                                    |
| 7   | **Common mistakes**   | The specific errors made on this item type — with the student's own matched error called out first if it hit   |
| 8   | **Exam tip**          | Technique: what to identify first, how marks are earned, what to write down                                    |
| 9   | **Quick check**       | A small transfer item with its own answer — tests whether the method landed, not whether the answer was read   |
| 10  | **Answer validation** | Marks, syllabus code, cognitive level, difficulty, method, accuracy rule, verification status, ambiguity note  |

**Correct answer:** restrained affirmative; the full response is still shown, because a student who guessed correctly needs the method more than one who reasoned to a wrong answer.

**Incorrect answer:** neutral verdict ("Not quite"), the student's answer beside the correct one, and — where the student's wrong answer matches a recorded common error (§G.5) — that specific misconception named in block 7 and surfaced at the top: _"You've taken 20% of the profit rather than 20% of the cost price. This is the most common slip on this type."_ This is the highest-value feedback in the product, it costs nothing at runtime because it is precomputed, and it is what the monitoring layer aggregates into a misconception profile (§J.13).

**Block 10 is shown to students, deliberately.** Rev 1 treated validation metadata as internal. Rev 2 surfaces it, because the product's central claim is honesty about standing: a student who can see that an item is *GTR 2.5, Reasoning, 1 mark, verified* learns the syllabus's own shape, and a visible verification status is the most economical possible answer to "how do I know this is right?".

### C.10 Progressive reveal and its limits

Blocks 4 and 9 reveal progressively — steps one at a time with a _show all_, and the quick check's answer only after an attempt. Everything else is shown at once. Rev 1 made progressive reveal the default for the whole solution; in practice a student who has already been marked wrong wants the strategy and the reason immediately, and staging those is friction dressed as pedagogy.

### C.11 Notes

The response pane carries a **Notes** tab, per question, saved to the account. This is a small feature with a disproportionate retention effect: it converts the product from something a student consumes into something a student builds, and the notes are the first thing they open the week before the examination.

### C.12 Next question

A single forward action. A student should be able to complete a ten-question session without their hand leaving the keyboard on desktop or their thumb on mobile. Rhythm is a real determinant of session completion.

### C.13 Session results

- Score, time taken, and a per-question strip that can be tapped to revisit any question and its full response.
- **What changed:** the mastery movement caused by this session, stated concretely — _"Consumer Arithmetic: 38% → 47%"_ — and, where the session moved it, the readiness index.
- **One next action:** either _Practise the two you missed_ or _Next topic_. Not a menu.
- Free-tier students at their limit see the upgrade prompt here — at the moment of demonstrated value and demonstrated appetite, which is the only moment it converts.

### C.14 Diagnostic

Offered after the first completed session, and re-offered on material change or after 60 days. 20–25 items spanning every module, difficulty walking up and down per module in response to performance (§J.9). **No per-item feedback during the diagnostic** — feedback would change behaviour and contaminate the measurement; full responses are available in review afterwards.

The output is a **coverage map**, not a score: every topic in one of _not started · needs work · developing · competent · strong_, with untouched areas explicitly marked unknown rather than zero. It is framed as a starting point, and its first sentence is what the student should do next.

### C.15 Examination simulation

The rehearsal capability (§H). The student chooses a paper form — Paper 01 (60 items, 90 minutes) in MVP, Paper 02 and modular forms thereafter — and sits it under real timing with a server-anchored countdown, a question navigator, flagging, and no solutions until submission.

Results present as: overall mark and percentage; **per-module** breakdown against the real weighting; **per-profile-dimension** breakdown (Conceptual Knowledge / Algorithmic Knowledge / Reasoning); time per question against the mark value; the items lost and what they had in common. Review mode then exposes the full ten-block response for every item.

Simulation results are the highest-weighted evidence in the readiness model (§2.4), and the interface says so — a student who has sat two mocks is told that their reading is now materially more trustworthy than it was.

### C.16 Readiness and monitoring

- **Readiness index** (§J.11) — a 0–100 reading of preparedness against the examination as weighted, with the date it is measured against, its confidence, and its history as a line rather than a single number.
- **Projected grade band** (§J.12) — e.g. _"Grade 2–3, moderate confidence"_ — always with its confidence, always with the standing note that it is a projection from practice and simulation and not a CXC result, and **absent entirely** below the evidence floor.
- **Weak areas** ranked by *mark impact* — low mastery weighted by examination weight and by items remaining — named at Specific Objective level, each with a one-line reason and a button that starts practice on it.
- **Strong areas**, shown too. A student who only sees failures stops opening the product.
- **Trend** — accuracy, effort and readiness over time; activity; total questions.
- **Question history**, filterable to _questions I got wrong_ — the most-used view in any product like this — and to _my repeated misconceptions_, which is new in Rev 2 and is the most actionable view the data supports.

### C.17 Recommended practice

The output of §J.8: a short ordered list, each item explaining _why_ it was chosen and what it is worth. An unexplained recommendation is ignored; an explained one is followed.

### C.18 The journey in one line

```
OPEN LINK → onboarding (exam target) → FIRST QUESTION (no account)
   → ten-block response → 2 more questions → SIGN UP
   → DIAGNOSTIC → coverage map → first READINESS reading
   → HOME → recommendation → [ question → answer → check
        → ten-block response → next ] ×10 → session results
   → mastery + readiness updated → weak areas by mark impact
   → targeted practice → EXAM SIMULATION → per-module + CK/AK/R breakdown
   → readiness re-read, PROJECTED BAND earned → fix the top weakness
   → repeat → EXAM
```

---

## SECTION D — COMPLETE FEATURE INVENTORY

### D.1 How to read this section

Features are classified MoSCoW _within a release_, and assigned to a release. A "Must" in V2 is not a "Must" in MVP. The binding rule (B-18) is that nothing outside the MVP Must list is built before launch, regardless of how cheap it looks.

Release definitions:

- **MVP** — the smallest launchable, chargeable product. Target: internal + closed beta.
- **V1** — public web launch at depth, with paid subscriptions and the full simulation range.
- **V2** — the retention and depth release, roughly 4–6 months post-launch.
- **V3+/Future** — directional; see §U.

### D.2 MVP features

**MUST HAVE**

| Feature                                                                     | Notes                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Responsive web application (Next.js), installable as a PWA**              | The MVP client. §1.7                                     |
| Anonymous first-run practice                                                | 3 questions before account required (§C.1)               |
| Email + Google authentication                                               | Supabase Auth                                            |
| Minimum age 13 enforced at sign-up                                          | Replaces Rev 1's under-13 consent flow (spec U-05)       |
| Student profile: name, territory, exam sitting                              | Exam sitting anchors the readiness timeline              |
| Curriculum taxonomy (V2027 populated; V2018 structurally supported)         | §F, spec U-02                                            |
| Question bank ≥1,200 published, reviewed questions                          | The real MVP gate; see §T.4                              |
| **Ten-block presentation model on every published question**                | §G.11 — the reference interface. A question without all ten blocks is not publishable |
| Topic and subtopic browsing with availability counts **and exam weight**    | §C.4                                                     |
| Practice session setup (count, difficulty)                                  | §C.5                                                     |
| Question engine: selection, cooldown, difficulty targeting                  | §E.4                                                     |
| Multiple-choice answer handling                                             | §I.5                                                     |
| Numeric / decimal / fraction answer handling with tolerance and equivalence | §I.6–I.8                                                 |
| Deterministic in-browser answer validation                                  | I-3                                                      |
| Mathematics rendering (pre-rendered SVG)                                    | §G.8                                                     |
| Diagram rendering with zoom                                                 | §G.6                                                     |
| Guided solution with progressive step reveal and per-step results           | Block 4, §C.9                                            |
| Concepts required · Strategy · Why this works · Exam tip                    | Blocks 2, 3, 6, 8                                        |
| Common-mistakes block with matched-error call-out                           | Block 7 — high value, precomputed, cheap                 |
| Quick check (transfer item)                                                 | Block 9                                                  |
| Answer-validation metadata surfaced to the student                          | Block 10 — verification status is the honesty claim made visible |
| Per-question notes                                                          | §C.11                                                    |
| Question navigator within a session, bookmarking, flagging                  | §C.6                                                     |
| Attempt recording with an offline queue and sync                            | §E.9                                                     |
| Mastery model per skill and topic                                           | §J                                                       |
| **Diagnostic assessment (20–25 items, coverage map)**                       | §J.9 — promoted from V1. The entry point to the whole loop |
| **Examination simulation — Paper 01, real timing and structure**            | §H — promoted from V1                                    |
| **Simulation results: per-module and per-profile-dimension (CK/AK/R)**      | §H.7                                                     |
| **Readiness index with confidence and history**                             | §J.11 — new in Rev 2                                     |
| **Projected grade band with confidence, evidence-gated**                    | §J.12 — new in Rev 2; supersedes Rev 1's refusal          |
| **Weak-area identification ranked by mark impact**                          | §J.7 — the ranking, not just the list                    |
| **Student monitoring view: trend, misconception profile, effort**           | §J.13                                                    |
| Session results with mastery delta                                          | §C.13                                                    |
| Recommended practice (single recommendation, with its reason)               | §J.8                                                     |
| Free tier with daily question limit                                         | §N.3                                                     |
| Premium entitlement architecture (enforced)                                 | §N.5                                                     |
| **Web subscription billing (Stripe or equivalent), live at MVP**            | §N.6 — web-first removes the store dependency, so billing need not be stubbed |
| Upgrade screen and paywall placement                                        | §C.13                                                    |
| Admin: authentication and role separation                                   | §O.4                                                     |
| Admin: question CRUD and editor with preview of all ten blocks              | §M.3–M.4                                                 |
| Admin: review queue and publish/unpublish                                   | §M.5                                                     |
| Admin: curriculum management                                                | §M.7                                                     |
| **Admin: cohort monitoring and projection-calibration view**                | §M.10, §J.12 — the back-test cannot be optional          |
| Content ingestion pipeline (batch, offline)                                 | §K                                                       |
| Deterministic validation suite for content                                  | §K.6                                                     |
| Duplicate detection                                                         | §E.10                                                    |
| Audit logging of all content and role changes                               | §O.11                                                    |
| Row Level Security on every table                                           | §O.3                                                     |
| Crash and error reporting                                                   | §Q.7                                                     |
| Basic product analytics events                                              | §Q.2                                                     |

**SHOULD HAVE (MVP if cheap, else V1)**

| Feature                                                      | Notes                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Password reset                                               | Nearly Must; include unless it genuinely slips                         |
| Report a problem with a question                             | High value for content quality — a free QA channel from 1,000 students |
| Session pause and resume                                     | Shown in the reference interface; cheap                                |
| Dark mode                                                    | Students revise at night; cheaper to build now than retrofit           |
| Question count and "last updated" transparency on topic list | Builds trust in a new product                                          |
| Readiness explainer ("what is this number?")                 | Directly reduces the R-09 risk surface; ~half a day of work            |
| Printable / exportable weak-area summary                     | The artefact a parent actually wants                                   |

**COULD HAVE**

| Feature                        | Notes                         |
| ------------------------------ | ----------------------------- |
| On-screen scratch pad          | Nice; paper works             |
| Weekly practice-days indicator | Restrained gamification only  |
| Share a result card            | Organic acquisition, low cost |

**NOT IN MVP** — see §T.3 for the full binding exclusion list.

### D.3 V1 features (public launch)

**MUST HAVE**

| Feature                                                        | Notes                                     |
| -------------------------------------------------------------- | ----------------------------------------- |
| Paper 02 and modular simulation forms                          | §H.6                                      |
| Full past paper library                                        | §H — gated on the R-01 rights decision    |
| Question bank ≥3,000 published questions                       | Depth becomes the retention driver        |
| Full coverage of all topics at usable depth                    | No empty topics; no topic without a readiness contribution |
| **Projection back-test v1 against a real sitting**             | §J.12 — the first honest accuracy figure  |
| Improved recommendation with spaced repetition of past errors  | §J.8                                      |
| Structured multi-part answers                                  | §I.10 — required for Paper 02 fidelity    |
| Email notifications (opt-in, low frequency)                    | Readiness digest, exam countdown          |
| In-app content update / cache invalidation                     | §E.12                                     |
| Admin analytics dashboard                                      | §M.10                                     |
| Admin AI-generated content review workflow, fully instrumented | §M.6                                      |
| Account deletion, data export                                  | Legal requirement                         |
| Terms, privacy policy, non-affiliation disclaimer, **projection disclosure** | §V R-02, R-09              |

**SHOULD HAVE:** annual plan (US$40); referral mechanism; topic-level exam-technique notes; "questions I got wrong" dedicated practice mode; V2027 modular entry paths as a first-class mode; readiness comparison against the student's own past self.

**COULD HAVE:** offline pack download for a whole topic; light achievement system; teacher share-a-practice-link.

### D.4 V2 features

**MUST HAVE:** **the React Native mobile application** (Android then iOS), consuming the shared packages and conforming to web behaviour (I-8); Google Play Billing alongside web billing; full V2027 modular entry paths; adaptive practice using the enhanced mastery model (§J.10); item calibration from response data feeding the projection (§J.12); content freshness process for new past papers.

**SHOULD HAVE:** class/teacher accounts (teacher creates a class, sets a diagnostic or a mock, sees aggregate readiness — not individual surveillance); parent readiness summary by email; question variant generation at scale (§K.5); step-level solution interactivity ("I'm stuck at step 3").

**COULD HAVE:** leaderboards within a class only (never global — see D.7); certificates of topic mastery; printable worksheets.

### D.5 Future

See §U. Additional CXC subjects, CAPE, Additional Mathematics, school licensing, competitions.

### D.6 Feature matrix

Legend: ● built · ◐ partial · ○ not present

| Capability                                    |  MVP  |  V1   |   V2   | Future  |
| --------------------------------------------- | :---: | :---: | :----: | :-----: |
| **Platform**                                  |       |       |        |         |
| Responsive web app (PWA)                      |   ●   |   ●   |   ●    |    ●    |
| React Native mobile app                       |   ○   |   ○   |   ●    |    ●    |
| iOS                                           |   ○   |   ○   |   ◐    |    ●    |
| **Access & identity**                         |       |       |        |         |
| Anonymous trial practice                      |   ●   |   ●   |   ●    |    ●    |
| Email / Google auth                           |   ●   |   ●   |   ●    |    ●    |
| Minimum-age enforcement                       |   ●   |   ●   |   ●    |    ●    |
| Account deletion & export                     |   ◐   |   ●   |   ●    |    ●    |
| **Content**                                   |       |       |        |         |
| V2027 taxonomy                                |   ●   |   ●   |   ●    |    ●    |
| V2018 taxonomy populated                      |   ○   |   ◐   |   ●    |    ●    |
| Published question bank                       | 1,200 | 3,000 | 6,000+ | 10,000+ |
| Ten-block presentation on every question      |   ●   |   ●   |   ●    |    ●    |
| Common-error distractors                      |   ●   |   ●   |   ●    |    ●    |
| Diagrams                                      |   ●   |   ●   |   ●    |    ●    |
| Past paper library                            |   ◐   |   ●   |   ●    |    ●    |
| **Practice**                                  |       |       |        |         |
| Topic practice sessions                       |   ●   |   ●   |   ●    |    ●    |
| Difficulty selection                          |   ●   |   ●   |   ●    |    ●    |
| Multiple choice                                |   ●   |   ●   |   ●    |    ●    |
| Numeric / fraction / decimal                  |   ●   |   ●   |   ●    |    ●    |
| Algebraic expression answers                  |   ◐   |   ●   |   ●    |    ●    |
| Structured multi-part answers                 |   ○   |   ●   |   ●    |    ●    |
| Per-question notes                            |   ●   |   ●   |   ●    |    ●    |
| Adaptive practice                             |   ○   |   ◐   |   ●    |    ●    |
| Spaced repetition of errors                   |   ○   |   ●   |   ●    |    ●    |
| Offline practice                              |   ◐   |   ●   |   ●    |    ●    |
| **Assessment (the core of Rev 2)**            |       |       |        |         |
| Diagnostic assessment                         |   ●   |   ●   |   ●    |    ●    |
| Re-diagnosis on material change               |   ◐   |   ●   |   ●    |    ●    |
| Exam simulation — Paper 01                    |   ●   |   ●   |   ●    |    ●    |
| Exam simulation — Paper 02 & modular forms    |   ○   |   ●   |   ●    |    ●    |
| Per-module results breakdown                  |   ●   |   ●   |   ●    |    ●    |
| Profile-dimension results (CK/AK/R)           |   ●   |   ●   |   ●    |    ●    |
| Readiness index with confidence               |   ●   |   ●   |   ●    |    ●    |
| Readiness history / trend                     |   ●   |   ●   |   ●    |    ●    |
| Projected grade band with confidence          |   ●   |   ●   |   ●    |    ●    |
| Projection back-test against real results     |   ○   |   ●   |   ●    |    ●    |
| Item calibration feeding the projection       |   ○   |   ○   |   ●    |    ●    |
| **Monitoring**                                |       |       |        |         |
| Attempt history                               |   ●   |   ●   |   ●    |    ●    |
| Per-topic / per-skill mastery                 |   ●   |   ●   |   ●    |    ●    |
| Weak areas ranked by mark impact              |   ●   |   ●   |   ●    |    ●    |
| Misconception profile                         |   ●   |   ●   |   ●    |    ●    |
| Effort and trend monitoring (student)         |   ●   |   ●   |   ●    |    ●    |
| Cohort monitoring (EdMar admin)               |   ●   |   ●   |   ●    |    ●    |
| Teacher / class monitoring                    |   ○   |   ○   |   ●    |    ●    |
| Parent summary                                |   ○   |   ○   |   ◐    |    ●    |
| **Monetisation**                              |       |       |        |         |
| Entitlement architecture                      |   ●   |   ●   |   ●    |    ●    |
| Free tier limits                              |   ●   |   ●   |   ●    |    ●    |
| Web billing (Stripe or equivalent)            |   ●   |   ●   |   ●    |    ●    |
| Google Play Billing                           |   ○   |   ○   |   ●    |    ●    |
| Annual plan                                   |   ○   |   ◐   |   ●    |    ●    |
| School licensing                              |   ○   |   ○   |   ○    |    ●    |
| **Admin**                                     |       |       |        |         |
| Question editor (all ten blocks)              |   ●   |   ●   |   ●    |    ●    |
| Review queue                                  |   ●   |   ●   |   ●    |    ●    |
| AI content review workflow                    |   ●   |   ●   |   ●    |    ●    |
| Curriculum management                         |   ●   |   ●   |   ●    |    ●    |
| Projection calibration view                   |   ●   |   ●   |   ●    |    ●    |
| User management                               |   ◐   |   ●   |   ●    |    ●    |
| Subscription admin                            |   ◐   |   ●   |   ●    |    ●    |
| Analytics dashboard                           |   ◐   |   ●   |   ●    |    ●    |
| Audit log viewer                              |   ◐   |   ●   |   ●    |    ●    |
| **AI (offline only)**                         |       |       |        |         |
| Document extraction                           |   ●   |   ●   |   ●    |    ●    |
| Classification & mapping                      |   ●   |   ●   |   ●    |    ●    |
| Ten-block content drafting                    |   ●   |   ●   |   ●    |    ●    |
| Variant generation                            |   ○   |   ◐   |   ●    |    ●    |
| Duplicate detection                           |   ●   |   ●   |   ●    |    ●    |
| **AI on the student path**                    |   ○   |   ○   |   ○    |    ○    |
| **AI anywhere in scoring, readiness or projection** | ○ |   ○   |   ○    |    ○    |

The final two rows are the most important rows in the table, and they are intended to remain unchanged permanently. Rev 2 adds the second: making a claim about a student's likely grade *raises* rather than lowers the requirement that the computation be deterministic and explainable (I-6).

### D.7 Features deliberately refused, and why

Recording these prevents them being re-proposed every quarter.

- **Student-facing AI chat / "ask a question".** Violates B-3, B-6 and the cost model. It is also the feature most likely to produce a confidently wrong mathematical claim attributed to EdMar.
- **Photo-solve (point camera at homework).** Directly undermines the pedagogical premise, carries the highest per-use cost in the product, and attracts exactly the users least likely to pay.
- **Global leaderboards.** In a cohort where a bad grade is a life event, ranking a struggling student publicly against strangers is harmful and drives churn among the students who most need the product. Class-scoped leaderboards in V2 are acceptable because the comparison group is real and consensual.
- **Aggressive streak mechanics with loss aversion.** Punishing a student for missing a day during examination season is counterproductive. A gentle weekly indicator only.
- **Social feed / friends / messaging.** Enormous moderation and child-safety liability for negligible learning value.
- **Adverts.** Incompatible with a paid product for minors, and destroys the concentration the question screen depends on.
- **An unqualified single predicted grade.** ~~Rev 1 refused grade prediction outright.~~ **Rev 2 supersedes that:** a **banded** projection with an explicit confidence level, an evidence gate, a standing disclosure and a published back-test is built (§J.12). What remains refused is the thing that actually causes the harm in R-09 — a bare number ("You will get a Grade 2") presented without band, without confidence, without evidence, or in marketing. That form is prohibited in the product, in the store listing, and in every piece of collateral. The distinction is not cosmetic: one is a measurement with stated uncertainty, the other is a promise.
- **Proctoring, lockdown or webcam monitoring during simulations.** Disproportionate surveillance of minors, unenforceable in a browser, and destructive of the trust the product depends on. Simulation integrity is handled by server-anchored timing and by treating simulation data as evidence rather than as an examination.

---

## SECTION E — QUESTION ENGINE

The question engine is the part of the system that decides _which question a student sees next_ and guarantees that it is a legitimate, published, appropriate question they have not just seen. It is deliberately deterministic and cheap.

### E.1 Design stance

Three commitments shape every decision below.

1. **Selection is a database operation, not a service.** Question selection is implemented as a parameterised Postgres function invoked over Supabase RPC. This keeps selection logic beside the data (no N+1 round trips), keeps it inside the RLS boundary, and keeps it fast enough that no caching layer is needed at the scales in §R.
2. **Selection is seeded and reproducible.** Randomisation uses a seed derived from `(student_id, session_id)`. The same session regenerates identically — essential for debugging a support complaint, for resuming an interrupted session, and for reproducing a reported problem.
3. **Selection never blocks on the network being good.** Sessions are materialised up front (all N question IDs and payloads fetched at session start), so a student who loses signal mid-session finishes it.

### E.2 How questions are stored

Conceptually — the field-level model is §G:

- The **question** is the stable identity: its stem, its type, its assets, its curriculum mapping, its difficulty, its provenance, its status.
- The **question version** carries the actual content. Publishing creates a version; correcting creates the next. Attempts reference the version they were answered against (B-9, I-4). This is what makes historical accuracy analysis possible.
- The **answer specification** is a structured object attached to the version, describing exactly how a response is judged (§I.4). It is precomputed at authoring time so runtime checking is trivial.
- The **solution** is an ordered list of steps, each with LaTeX and prose and an optional mark allocation.
- The **explanation** is short prose keyed to the version.
- **Distractors / common errors** are recorded values with the misconception each represents (§G.5).
- **Assets** (diagrams) live in Supabase Storage, referenced by stable path, served via CDN, immutable once published.
- **Curriculum links** are many-to-many: a question may legitimately assess more than one Specific Objective, and must be tagged against both syllabus versions (§F.6).

Content is denormalised into a single read-optimised payload per published version — one row, one round trip, no joins on the student path. Assembling that payload is a publish-time job, not a request-time job. This is the main reason the read path stays flat as the bank grows.

### E.3 How questions are classified

Every published question carries:

**Curriculum** — syllabus version, section, subtopic, one or more Specific Objectives, and derived skill tags (§F.4).

**Cognitive** — profile dimension (CK / AK / R), aligned to CXC's own reporting dimensions. Tagging this from the start costs almost nothing and unlocks a genuinely differentiated V2 analytic ("you lose marks on Reasoning, not on method").

**Format** — question type (multiple choice, numeric, expression, structured multi-part), answer type, whether a diagram is required, whether a calculator is assumed.

**Difficulty** — see E.5.

**Provenance** — `past_paper` | `past_paper_adapted` | `original_authored` | `ai_variant`. Legally and pedagogically load-bearing (§E.7, §V R-01).

**Operational** — status, version, review state, quality metrics, retirement flag.

Classification is proposed by AI during ingestion and **confirmed by a human reviewer**. AI-proposed mapping is a labour-saving device, never an authority. Mis-mapped questions are the most insidious content defect available: they are individually invisible and they silently corrupt every mastery score and recommendation downstream.

### E.4 How questions are selected

The selection function takes: student, target skill/objective set, count, difficulty mode, syllabus version, entitlement, and seed. It applies a filter chain, each stage of which is a plain predicate:

1. **Eligibility** — status is `published`, not retired, version is current, matches requested syllabus version.
2. **Curriculum match** — question links to at least one requested Specific Objective (or the requested subtopic/section, resolved downward).
3. **Entitlement** — free-tier students are restricted to the free question pool and to their remaining daily allowance (§N.3).
4. **Cooldown** — exclude questions attempted by this student within a cooldown window. Default 30 days, shortened to 7 days for questions previously answered _incorrectly_ (deliberate: errors should come back sooner). If the filter would leave too few questions, the cooldown relaxes progressively rather than failing — and the student is told, quietly, when they are seeing repeats.
5. **Difficulty targeting** — see E.5.
6. **Diversity** — avoid returning many near-identical questions in one session by spreading across Specific Objectives and, where available, across question "families" (variant groups, §E.10).
7. **Weighted random ordering** — seeded; weights favour questions with fewer total attempts (so new content gets exposure and accumulates quality data) and, in recommendation contexts, questions targeting the student's recorded misconceptions.
8. **Materialise** — return N; if fewer than N are available, return what exists and tell the student honestly rather than padding with repeats.

**The starvation case matters.** Early on, some subtopics will have twelve questions. A student who does three sessions there exhausts them. The engine must degrade gracefully: relax cooldown, then explicitly surface _"You've worked through everything we have here — try [adjacent topic]"_. Silently recycling questions makes the product feel broken and inflates mastery scores dishonestly.

### E.5 How difficulty works

Difficulty is a 1–5 integer band, with defined meanings so that different authors and reviewers assign it consistently:

| Band | Meaning                                                        | Typical                                |
| ---- | -------------------------------------------------------------- | -------------------------------------- |
| 1    | Direct recall or single-step application of one objective      | Early Paper 01 items                   |
| 2    | Routine two-step, familiar presentation                        | Typical Paper 01                       |
| 3    | Multi-step, or requires selecting the right method             | Harder Paper 01 / early Paper 02 parts |
| 4    | Combines two objectives, or non-obvious set-up                 | Later Paper 02 parts                   |
| 5    | Extended reasoning, unfamiliar context, or investigation-style | Investigation / hardest parts          |

**Initial assignment** is by author/reviewer judgement, informed by source (a Paper 02 part (c) is rarely a 1). **Subsequent calibration is empirical:** once a question has ≥30 attempts from ≥20 distinct students, its observed accuracy is compared against its band's expected range. Persistent outliers are flagged to admin for re-banding — flagged, not auto-adjusted, because a low accuracy can equally indicate a _wrong solution_ rather than a hard question, and that distinction requires a human. (§E.13)

Difficulty modes in practice:

- **Mixed (default)** — a fixed spread, roughly 20/30/30/15/5 across bands 1–5, which approximates a real paper.
- **Building up** — starts at one band below the student's demonstrated level for that skill and climbs. Good for a student rebuilding confidence.
- **Challenge** — bands 4–5 only.

The student's demonstrated level per skill comes from the mastery model (§J) and is a lookup, not a computation, at selection time.

### E.6 Topic, subtopic and skill filtering

Filtering resolves downward through the taxonomy (§F). A request for a section expands to all its subtopics, then to all their Specific Objectives; a request for a Specific Objective is used directly. This is implemented as a recursive resolution in the selection function so that callers never need to know the depth of the tree — important because the V2027 structure adds a module level above section.

Skill tags (§F.4) cut _across_ the tree — "solving linear equations" appears under more than one objective — and are filterable independently. This is what makes targeted remediation possible: a student's weakness is usually a skill, not a syllabus section.

### E.7 Identifying past-paper questions

Every question declares its provenance explicitly, and past-paper-derived questions additionally carry the sitting (year, month), paper (01 / 02 / 032), question number and part label, and the syllabus version in force at that sitting.

Two reasons this must be first-class rather than a note in a text field:

1. **Students specifically want authentic past-paper practice**, and being able to say "this is 2019 Paper 02 Q4(b)" is a genuine selling point.
2. **The rights position differs by provenance.** If the licensing question (§V R-01) resolves badly, EdMar must be able to identify and withdraw every affected item in one operation. A provenance field makes that a query; a free-text note makes it an archaeology project.

`past_paper_adapted` is a distinct value and is important: a question whose numbers and context have been changed but whose structure derives from a past paper is _not_ the same rights object as a verbatim reproduction, and it is not the same pedagogical object either. The distinction must be recorded honestly at authoring time.

### E.8 Identifying generated questions

AI-originated items carry provenance `ai_variant` or `ai_authored`, plus: source question (if a variant), model identifier, prompt template version, generation run ID, validation report, and the reviewer who approved them.

**Students are not shown AI provenance in MVP** — it is not information they can act on, and it invites unwarranted distrust of items that have passed the same human review as everything else. But it is retained, queryable, and disclosable. If EdMar is ever asked "how much of this is AI-written?", the answer must be a number, not a shrug. Consider surfacing an aggregate statement in the app's About screen; that is a positioning decision, not an architectural one.

**A hard constraint:** an AI-generated _variant_ must never be published into the same practice pool as its source question without a human confirming they are not effectively identical. Variant families are tracked (§E.10) and the engine will not serve two members of the same family in one session.

### E.9 Randomisation, sessions and connection tolerance

Sessions are seeded (E.1) and fully materialised at start. The client caches the session, its questions, their answer specifications and — once revealed — their ten-block responses. On the web this is a **service worker plus IndexedDB**; in the future mobile client it is the same contract over local storage. Consequences:

- The student can complete a session through a dropped connection, which is the common case on a school network or a bus, and — with the PWA installed — through a fully offline period.
- Answer checking is local and instant (I-3).
- Attempts queue locally with client timestamps and sync when connectivity returns; the server is authoritative for mastery, readiness and projection recomputation, and resolves duplicates idempotently by attempt ID.
- A student who clears their browser data loses queued unsynced attempts only.

**Timed simulations are the exception and must behave differently.** The countdown is anchored to a server-issued start timestamp (§H.6), so a student who loses connectivity mid-simulation continues against real elapsed time rather than gaining free minutes, and a submission that arrives after expiry is accepted but recorded with its true elapsed time. Rev 1 did not need this distinction because timed mode was V1; Rev 2 does, because simulation results carry the heaviest weight in the readiness model and an ungoverned timer would corrupt exactly the evidence the product most depends on.

Anti-cheat is not a serious concern here — the student is the beneficiary of their own honesty and there is no external score to game — so the client is trusted with correctness for _display_, while the server independently re-derives correctness on sync for _record_. If they disagree, the server wins and the discrepancy is logged, because a systematic disagreement indicates a genuine bug in an answer specification.

### E.10 Duplicate prevention

Duplicates are the characteristic failure mode of an AI-assisted content pipeline. Three layers:

**Layer 1 — exact/near-exact (deterministic, cheap).** Normalise the stem: strip whitespace, normalise LaTeX to a canonical form, lowercase prose, replace numerals with placeholders. Hash. Identical hashes are duplicates. Catches re-ingestion of the same source document, which is the most common case by far.

**Layer 2 — structural similarity (deterministic).** Compare normalised stems by trigram/edit-distance similarity, and compare answer specifications. Two questions with the same structure and the same answer, differing only in surface wording, are duplicates. Two questions with the same structure and _different_ numbers are **variants**, not duplicates — they are legitimate and desirable, and they are grouped into a variant family so the engine does not serve both in one session.

**Layer 3 — semantic similarity (embeddings, offline).** Embed stems; flag high-cosine-similarity pairs above a tuned threshold for human adjudication. Runs as a batch job at ingestion, never at runtime. Embedding cost is negligible and one-time. Store the embedding so re-checks are free.

Nothing here auto-deletes. Layers 1 and 2 can auto-reject _at ingestion_, before human time is spent. Layer 3 only flags.

### E.11 Retirement and correction

A published question leaves circulation by one of three routes, all reversible except the first:

- **Retired** — no longer served, history preserved, attempts still count toward past mastery. Reasons: superseded by syllabus change, rights withdrawal, persistent quality flags, or duplication discovered late.
- **Suspended** — temporarily withheld pending investigation (e.g. a student report of a wrong answer). Fast, one-click, no approval needed. **The bias must be toward suspending quickly**: a wrong solution serving 500 students an hour is worse than a temporarily missing question.
- **Corrected** — a new version is published and the previous version retired. Attempts against the old version retain their meaning. Where a correction changes the _correct answer_, affected students' attempts must be identified and their mastery recomputed; students who were marked wrong on the old (incorrect) answer should be notified. This is rare and it is exactly the situation that justifies versioning.

### E.12 Content freshness on the client

A global `content_version` counter increments on any publish, correction or retirement. The client checks it cheaply on launch and on resume, and invalidates only the affected caches. This avoids both stale content and gratuitous re-downloading on a metered connection.

### E.13 Quality maintenance

Quality is a continuous process with four inputs:

1. **Pre-publication:** deterministic validation (§K.6) and human review (§K.7). Nothing published without both.
2. **Empirical monitoring:** per-question accuracy, mean time-to-answer, skip rate, and — the most diagnostic single signal — **the proportion of wrong answers that cluster on one specific value**. If 60% of students give the same wrong answer, either that is a well-understood misconception worth recording as a distractor, or the stated correct answer is wrong. Both are actionable; both need a human.
3. **Student reports.** An in-app "something's wrong with this question" control, routed to an admin queue with the student's answer and the question version attached. A thousand students are a better QA department than any test suite, and this is close to free.
4. **Scheduled audit.** A rolling sample of published questions re-reviewed each month, weighted toward high-traffic and AI-originated items.

**Quality metrics tracked per question:** total attempts, accuracy, wrong-answer distribution, skip rate, mean duration, report count, last review date, reviewer.

---

## SECTION F — CXC CURRICULUM ARCHITECTURE

### F.1 Principle

The taxonomy mirrors CXC's own published structure and does not invent terminology. Where EdMar needs a concept CXC does not name — a "skill" that cuts across objectives — it is clearly marked as an EdMar construct so that no one later mistakes it for official CXC vocabulary.

The **Specific Objective is the atomic official unit** and is the anchor of the entire system. Every question maps to at least one. Every mastery number rolls up from them. Every recommendation names one.

### F.2 The hierarchy

```
SUBJECT                     CSEC Mathematics
   │
   └── SYLLABUS VERSION     V2018 (exams to 2026) | V2027 (exams from 2027)
          │
          └── MODULE        [V2027 only] Module 1 / 2 / 3
                 │
                 └── SECTION          e.g. "Consumer Arithmetic"
                        │
                        └── SUBTOPIC          [EdMar construct — see F.3]
                               │
                               └── SPECIFIC OBJECTIVE   [official, numbered]
                                      │
                                      ├── SKILL          [EdMar construct]
                                      │
                                      └── QUESTION
```

Two structural notes:

- **MODULE exists only in V2027.** Rather than modelling two different trees, the module level is present in the schema always and simply null for V2018 sections. Cleaner than a polymorphic tree, and it means a V2018 question can carry a V2027 module tag for forward compatibility.
- **SUBTOPIC is an EdMar grouping**, not an official CXC level. The syllabus goes Section → General Objectives → Specific Objectives directly. But a section like Geometry and Trigonometry contains dozens of Specific Objectives, and presenting a student with a flat list of forty is a usability failure. Subtopics are a _presentation_ grouping over Specific Objectives, editable in admin, and they must never be treated as authoritative CXC structure. **[VERIFY-JSON]**: the existing dataset's "topics" field most likely corresponds to this level and should be reconciled against it.

### F.3 What is official and what is EdMar's

This distinction must survive into the database, the admin UI and the student-facing copy.

| Level                       | Source           | Notes                                            |
| --------------------------- | ---------------- | ------------------------------------------------ |
| Subject                     | CXC              | "Mathematics" (CSEC)                             |
| Syllabus version            | CXC              | Effective-from examination sitting               |
| Module                      | CXC (V2027 only) | Three named modules                              |
| Section                     | CXC              | Named and ordered exactly as published           |
| General Objective           | CXC              | Stored for reference; not used for filtering     |
| Specific Objective          | CXC              | **The anchor.** Officially numbered              |
| Content / Explanatory Note  | CXC              | Stored; useful context for authors and reviewers |
| **Subtopic**                | **EdMar**        | Presentation grouping only                       |
| **Skill**                   | **EdMar**        | Cross-cutting capability tag                     |
| **Difficulty band**         | **EdMar**        | 1–5, §E.5                                        |
| Profile dimension (CK/AK/R) | CXC              | Official reporting dimensions                    |

Anything in the EdMar rows must be visually distinguishable in the admin console and must never appear in student copy in a way that implies CXC authorship.

### F.4 Skills — the cross-cutting layer

A **skill** is a specific, teachable capability that a question exercises: _"solve a linear equation in one variable"_, _"convert between percentage and decimal"_, _"apply Pythagoras' theorem"_, _"read a value from a cumulative frequency curve"_.

Why this layer exists rather than relying on Specific Objectives alone:

- Students fail at the level of skills, not objectives. "You are weak on Section 6" is not actionable. "You keep making sign errors when expanding brackets" is.
- Skills recur across sections. Rearranging a formula appears in Algebra, Measurement and Geometry. A student weak at it is weak at it everywhere, and their mastery evidence should pool.
- Recommendation quality depends on it (§J.8).

Constraints: skills are a controlled vocabulary managed in admin (not free tags), each is linked to the Specific Objectives it serves, and a question carries 1–3 of them. Allowing uncontrolled skill tags produces a hundred near-synonyms within a month and destroys the mastery model — this is a known failure mode and the controlled vocabulary is the mitigation.

**Target scale:** roughly 150–250 skills across the whole syllabus. Fewer than 100 is too coarse to be actionable; more than 400 fragments the evidence so badly that no student ever accumulates enough attempts per skill for mastery to be meaningful (§J.6).

### F.5 Learning objectives

The brief's hierarchy includes a learning-objective level between skill and question. In this design that is served by the CXC **Specific Objective** itself, which _is_ a learning objective and is officially worded. Introducing a second, EdMar-authored learning-objective level would duplicate it and create two competing sources of truth. Where an author needs finer granularity than a Specific Objective, the **skill** provides it.

This is a deliberate simplification of the requested structure and is flagged as such for the product owner's confirmation.

### F.6 Dual-syllabus support — the critical design point

This is the most consequential single decision in the content architecture, and getting it wrong means re-tagging the entire question bank later.

**The situation.** A student sitting in May–June 2026 is examined on V2018. A student sitting from May–June 2027 is examined on V2027, which reorganises content into three modules, splits several sections into numbered parts (Algebra 1/2, Statistics 1/2, Relations Functions and Graphs 1/2, Geometry and Trigonometry 1/2, Vectors and Matrices 1/2), introduces "Introduction to Graphs", and adds modular entry options.

**The design.**

1. **Curriculum nodes are versioned.** Sections and Specific Objectives belong to a syllabus version. V2018 and V2027 trees coexist.
2. **A mapping table relates them.** Each V2018 Specific Objective maps to zero, one or many V2027 Specific Objectives, and vice versa, with a relationship qualifier (`identical` / `partial` / `moved` / `removed` / `new`). This is a one-time human effort of perhaps two to three days by a qualified teacher, and it is _enormously_ cheaper than re-tagging thousands of questions.
3. **Questions map to objectives, not sections.** Because the mapping table exists, a question tagged to a V2018 objective is automatically reachable from the corresponding V2027 objective, at whatever fidelity the qualifier declares. Questions whose objective is `removed` in V2027 are excluded from V2027 practice automatically.
4. **The student's exam sitting selects the tree.** Captured at onboarding (§C.1), changeable in profile. Everything the student sees — topic list, progress, recommendations — is rendered against their tree.
5. **New content is authored against V2027 by default** from the point the mapping exists, and back-mapped to V2018 while V2018 still matters.

**What this buys:** in 2027, when V2018 becomes irrelevant, EdMar switches default trees and retires V2018 presentation with no content migration. Competitors relying on flat "topic" strings will be re-tagging by hand.

**[VERIFY-CXC-02]:** the V2027 Specific Objective list must be transcribed from the official PDF by a human. It is the foundation of the taxonomy and must not be paraphrased, inferred, or generated.

### F.7 Extensibility to other subjects

The taxonomy is rooted at SUBJECT rather than assuming Mathematics, and no level below it is Mathematics-specific except the answer-type vocabulary in §I. Adding CSEC Additional Mathematics, CAPE Mathematics, or a non-mathematical subject requires new curriculum rows and (for non-mathematical subjects) new answer types — not a schema change. This is close to free now and expensive to retrofit, which is the definition of a decision worth making early.

### F.8 Curriculum data management

The taxonomy is reference data: low-volume, high-importance, rarely changed, and catastrophic if corrupted. Accordingly it is: version-controlled as seed files in the repository (so changes are reviewable in a pull request), applied by migration, editable in admin only by a `curriculum_admin` role, and fully audit-logged. It is never bulk-edited directly against the production database.

---

## SECTION G — QUESTION CONTENT MODEL

This section defines the _conceptual_ content model. It is not a schema listing; the engineering agent will derive tables from it. Field names are indicative.

### G.1 Model overview

```
QUESTION (stable identity)
  ├── provenance, type, calculator flag, status, retirement
  ├── QUESTION_VERSION (content; immutable once published)  ← attempts reference this
  │     ├── stem (LaTeX + prose)
  │     ├── ANSWER_SPEC        (how to judge a response — §I.4)
  │     ├── OPTION[]           (multiple choice only)
  │     ├── SOLUTION_STEP[]    (ordered; LaTeX + prose + marks)
  │     ├── EXPLANATION        (short prose)
  │     ├── COMMON_ERROR[]     (wrong value + misconception + corrective note)
  │     ├── ASSET[]            (diagrams; Storage refs)
  │     └── PART[]             (structured multi-part questions)
  ├── CURRICULUM_LINK[]        (→ specific objectives, per syllabus version)
  ├── SKILL_LINK[]             (→ skills)
  ├── SOURCE                   (paper metadata, where applicable)
  ├── AI_PROVENANCE            (model, prompt version, run, validation report)
  ├── REVIEW_EVENT[]           (who, when, what decision, what changed)
  └── QUALITY_METRICS          (rolled up from attempts)
```

### G.2 Question

| Concept              | Purpose                                                                                                               | Notes                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                 | Stable identity across versions                                                                                       |                                                                                                                                      |
| `type`               | `multiple_choice` \| `numeric` \| `expression` \| `structured` \| `multi_select` \| `true_false`                      | Drives input UI and validation strategy                                                                                              |
| `provenance`         | `past_paper` \| `past_paper_adapted` \| `original_authored` \| `ai_variant` \| `ai_authored`                          | §E.7, §E.8 — rights-critical                                                                                                         |
| `calculator_allowed` | Boolean                                                                                                               | CSEC permits a calculator in both papers; some items are designed to be done without one, and this affects difficulty interpretation |
| `status`             | `draft` \| `pending_validation` \| `pending_review` \| `changes_requested` \| `published` \| `suspended` \| `retired` | The only status the student app may read is `published` (I-2)                                                                        |
| `variant_family_id`  | Groups a source question with its variants                                                                            | Prevents serving near-identical items together (§E.10)                                                                               |
| `current_version_id` | Pointer to the live version                                                                                           |                                                                                                                                      |
| `is_free`            | Available to free tier                                                                                                | §N.3                                                                                                                                 |

### G.3 Question version and stem

The version holds all content. Publishing a correction creates a new version and repoints `current_version_id`.

The **stem** is stored as structured content, not a single blob: an ordered list of blocks, each either prose, a display-mathematics expression, an inline-mixed line, an asset reference, or a table. Reasons: it renders reliably across screen sizes, it allows diagrams to sit correctly between paragraphs, and it makes the LaTeX validator's job tractable (§G.8). A single "markdown with dollar signs" text field is much easier to build and it will produce layout defects on small screens for the life of the product.

Also on the version: `version_number`, `created_by`, `published_at`, `change_note`, and the validation report from §K.6.

### G.4 Options, correct answer and answer specification

For multiple choice: an ordered list of options, each with content (LaTeX/prose), a correctness flag, and — importantly — an optional link to the **common error** it embodies. Well-constructed CSEC distractors are not random; each is the answer a student gets by making a specific mistake. Capturing that mapping is what makes §C.9's targeted feedback possible, and it is the cheapest high-value feature in the product.

Option order is randomised at presentation time by default (seeded per session), with an `preserve_order` flag for items where order is semantically meaningful ("Which of the following is _first_…", or options that are themselves ordered values).

For everything else, correctness is defined by the **answer specification** (§I.4): a structured object stating the answer type, the canonical value, accepted equivalent forms, tolerance, required units, and any normalisation rules. This is the single most important object in the content model for correctness, and it is computed and validated at authoring time so that runtime checking is a pure function with no ambiguity.

### G.5 Common errors

An explicit, first-class list per version. Each entry: the wrong value or form, the misconception it indicates (e.g. _"subtracted before multiplying — order of operations"_), a short corrective note shown to the student, and a link to the skill the student is missing.

This structure earns its keep three times: in immediate feedback (§C.9), in diagnostics (a student who repeatedly triggers the same misconception across questions has an identifiable, nameable gap), and in recommendation (§J.8 can target the skill behind the misconception rather than the topic).

**[VERIFY-JSON]**: the legacy dataset reportedly contains "common-error warnings". These are likely prose rather than value-keyed. Migration should preserve the prose while a follow-up pass adds the value keys, which are what make matching possible.

### G.6 Diagrams and assets

- Preferred format **SVG**, with a rasterised PNG fallback generated at publish time for renderer edge cases. SVG scales on every screen, is small over a metered connection, and stays legible when zoomed.
- Stored in Supabase Storage under a deterministic, immutable path keyed by question version. Never mutated in place.
- Each asset carries: role (`question_figure`, `solution_figure`, `option_figure`), alt text (mandatory — a diagram with no alt text fails validation), intrinsic dimensions, and a `requires_colour` flag for accessibility checking.
- Public read via CDN for published assets; private otherwise. Assets for unpublished questions must not be publicly reachable, since asset URLs are a well-known way to leak draft content.
- **[VERIFY-JSON]**: the legacy dataset contains "diagram information". Whether this is images, descriptions, or generation instructions materially changes the migration effort and is a top-priority inspection item.

### G.7 Marks, source and metadata

Marks are recorded per question and per solution step where the source supports it. Displaying the mark allocation alongside the working teaches examination technique — where marks are actually awarded — which is a genuine gap in most revision material.

Source metadata for past-paper-derived items: sitting year, sitting month (January / May–June), paper (`01` / `02` / `031` / `032`), question number, part label, and syllabus version in force. These are separate typed fields, never a concatenated string, because they must be filterable, and because a rights withdrawal must be executable as a query (§E.7).

### G.8 LaTeX handling

Mathematical typesetting is the highest-risk _technical_ area in the client. It is also where a cheap approach produces a product that looks broken.

**Storage.** Store LaTeX as authored, in a **restricted, whitelisted subset**. Maintain an explicit allowlist of commands and environments (fractions, roots, exponents/subscripts, common operators and relations, Greek letters, matrices, vectors, degrees, the standard trigonometric and logarithmic functions, aligned environments, simple arrays). Anything outside the allowlist fails validation and cannot be published.

The allowlist is not bureaucracy. It is what makes the following possible: reliable client-side rendering, safe normalisation for duplicate detection, deterministic conversion into an alternative representation later, and confidence that an AI-generated expression cannot inject something the renderer chokes on. An unrestricted LaTeX field is an unbounded compatibility surface.

**Validation at authoring time.** Every expression is parsed and rendered headlessly in CI/ingestion. If it does not render, it does not publish. Ever. A `$` that never closes is the classic content defect and it is trivially preventable.

**Rendering.** Mathematics is **pre-rendered to SVG at publish time** and the client ships no maths engine (spec D-01). On the web this is decisive for two reasons beyond speed: it eliminates layout shift as a maths engine loads and re-lays-out (the CLS target in §P.11), and it removes a substantial JavaScript payload from the question route. The same pre-rendered SVG serves the future mobile client unchanged, which is one of the reasons the web-first sequence costs the mobile app so little. **Phase 1 spike:** render a corpus of 200 real expressions and measure render latency, layout stability and text-scaling behaviour at 200% browser zoom.

**The safety net.** For any expression that fails to render client-side, the publish pipeline holds a **pre-rendered SVG** in Storage. The client falls back to the image. This guarantees a student never sees raw LaTeX source, which is the worst possible failure and instantly signals amateurism.

**Normalisation.** A canonical form (whitespace, equivalent command spellings, brace usage) is computed at publish time and stored alongside. Used for duplicate detection (§E.10) and for answer matching where an expression answer is compared structurally (§I.9).

**Mixed content.** Prose and mathematics interleave constantly. The block model in §G.3 handles this; the renderer must handle inline mathematics inside a sentence without breaking line-wrapping on a narrow screen — a specific, testable requirement.

### G.9 Migration contract for the legacy JSON

The existing dataset is a valuable seed and a poor schema. Both things are true, and the migration should treat it accordingly.

**Preserve without question:** worked solutions, final answers, LaTeX expressions, paper/year/question-number metadata, concepts, diagram information, common-error notes. This is real intellectual work and it is the reason the project starts from a running start rather than zero.

**Do not preserve:** the schema shape itself. A flat per-question JSON document with embedded topic strings cannot support versioning, cross-syllabus mapping, controlled skill vocabularies, answer specifications, or review history — all of which this blueprint requires.

**Anticipated weaknesses to check for [VERIFY-JSON]:**

1. Topic labels as free text rather than references — will need mapping to the taxonomy, probably semi-automatically with human confirmation.
2. No Specific Objective mapping at all. This is the largest expected gap and the largest piece of migration work.
3. Answers stored as display strings ("x = 3.5 cm") rather than structured values with units — cannot be used for validation as-is; needs parsing into answer specifications.
4. Worked solutions as a single prose/LaTeX blob rather than ordered steps — needs splitting, which AI can propose and a human must confirm.
5. Inconsistent LaTeX conventions across records, especially if assembled over time or from multiple sources.
6. No difficulty rating, or an inconsistent one.
7. No provenance or rights status.
8. No versioning or review history.
9. Diagram references that may be missing, broken, or textual descriptions rather than assets.
10. Possible duplicates within the dataset itself.
11. Possible OCR-origin errors in mathematics (a classic: `5` vs `S`, minus signs lost, exponents flattened) — **this is the highest-risk category and requires a full human read of a sample before trusting the set**.
12. No profile-dimension (CK/AK/R) tagging.

**Migration approach.** A one-way, re-runnable, idempotent import into a staging area, never directly into published content. Each legacy record becomes a `draft` question with its legacy ID retained for traceability. Automated validators run. AI proposes taxonomy mapping, step splitting and answer-spec extraction. Every record then passes human review before publication. **No legacy record is published without a human having read it.** Given a realistic reviewer throughput of 30–60 questions per day, this is the actual critical path to MVP (§S Phase 2, §T.4) and it should be resourced accordingly from day one rather than discovered in month three.

### G.10 Review history

Every review event is retained: reviewer, timestamp, decision (`approved` / `changes_requested` / `rejected` / `suspended`), free-text note, and a diff of what changed. This supports accountability, reviewer quality measurement, and the forensic question "who approved this, and what did they see?" — which will be asked the first time a wrong solution reaches students.

### G.11 The presentation model — ten blocks

**New in Rev 2, and binding.** Every published question carries a fixed, ordered set of ten presentation blocks. This is the content contract behind the reference interface (§P.4) and it is enforced at publication: a question missing a required block cannot reach `published` status.

| #   | Block                 | Required | Content                                                                                                                      |
| --- | --------------------- | :------: | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | `question`            |    ✓     | Stem blocks, diagram reference, mark value, part label. Already modelled in §G.3                                             |
| 2   | `concepts_required`   |    ✓     | 1–4 named concepts, each linked to a Specific Objective. Not free text — a controlled reference, so it can drive practice    |
| 3   | `strategy`            |    ✓     | 1–3 sentences: the approach, before any algebra. What to identify, in what order                                             |
| 4   | `guided_solution`     |    ✓     | Ordered steps. Each: instruction, optional sub-note ("from step 1"), the mathematical result of that step, optional marks     |
| 5   | `final_answer`        |    ✓     | The answer, once, unambiguously, with units where applicable. Must equal the answer spec's canonical value — validated       |
| 6   | `why_this_works`      |    ✓     | 2–4 sentences on the underlying principle. Not a restatement of the steps                                                    |
| 7   | `common_mistakes`     |    ✓     | 2–4 specific errors, each optionally keyed to a distractor or a wrong-answer pattern so it can be matched at runtime (§G.5)  |
| 8   | `exam_tip`            |    ✓     | Technique specific to this item type: what to write down, where marks are earned, what examiners look for                     |
| 9   | `quick_check`         |    ✓     | A small transfer item: prompt, answer, optional diagram. Tests the method, not recall of this item's answer                   |
| 10  | `answer_validation`   |    ✓     | Marks · syllabus code · cognitive level (CK/AK/R) · difficulty · method class · accuracy rule (exact / tolerance / equivalent) · verification status · ambiguity note |

**Why the ten blocks are a schema rather than a layout.** Three reasons, and each has cost consequences.

1. **They are what makes the assessment engine possible.** Block 2 is what turns "you got this wrong" into "you are weak on *this Specific Objective*". Block 10's cognitive level is what makes the CK/AK/R breakdown in §H.7 computable. Block 7's keyed errors are what make the misconception profile in §J.13 exist. The presentation model and the analytics model are the same model.
2. **They are what the AI factory is actually asked to draft.** §K's prompts produce ten blocks, §K.6 validates ten blocks, and §M.4's editor edits ten blocks. Drafting them together is far cheaper than adding them later, and retrofitting blocks 2, 8 and 9 across a 3,000-question bank would be a second content project.
3. **They fix the content quality floor.** A bank where every item has a strategy, an exam tip and a transfer check is qualitatively different from one with an answer and some working. This is the difference a student notices in the first ten minutes, and it is not something a competitor can add cheaply.

**Reveal policy (B-3 preserved).** Blocks 2–10 are not delivered to the client until the student has submitted an answer or explicitly skipped. This is enforced server-side in the payload, not by hiding them in the interface — a blurred panel with the answer in the DOM is not a pedagogical gate.

**Block 9 is a question, not prose.** The quick check has its own answer specification and its own attempt record, weighted lower than a full item but recorded, because "could they transfer the method" is the single most informative cheap signal available about whether the teaching landed.

**Validation rules.** Block 5 must agree with the answer specification (§I.4) — a published question whose stated final answer disagrees with its accepted answer is the exact defect class §K.6 exists to prevent. Block 10's verification status may only read `verified` when both the deterministic validators and a human reviewer have passed the item; anything else displays as `unverified` and, in MVP, cannot be published.

---

## SECTION H — EXAMINATION SIMULATION AND PAST PAPERS

_**Rev 2: promoted to MVP.** Examination simulation is one of the five core capabilities (§1.1) and the highest-weighted evidence source in the readiness model (§2.4). Paper 01 simulation ships in MVP; Paper 02 and modular forms follow in V1. The **past paper library** — real CXC papers, as opposed to simulations built to their specification — remains gated on the rights decision (§V R-01) and is V1 at the earliest._

### H.1 Position and dependency

Two things are separable here, and Rev 1 conflated them:

- **Examination simulation** is a *structure*: 60 Paper 01 items in 90 minutes, drawn to the official per-module allocation and the official CK/AK/R profile split, marked to the official weighting. It needs **no third-party content whatsoever** — EdMar-owned items assembled to the published blueprint. It carries no rights risk and it is therefore in MVP.
- **The past paper library** is *specific copyrighted content* — the actual May/June 2024 Paper 02. It is the most requested feature in this category and the one with the greatest legal exposure (§V R-01). **It must not be exposed before the rights position is resolved.**

The distinction matters commercially as well as legally: the readiness capability that students pay for depends on the *structure*, not on the provenance of the items. **EdMar Practice Papers** — original papers built to the authentic specification — deliver the entire rehearsal and readiness value with zero rights exposure, and several successful revision publishers operate exactly this way.

### H.2 Paper library

Browsable by year and sitting, with per-paper status: not started / in progress / completed, and best score. Filterable by syllabus version — a student sitting V2027 should not be shown V2018 papers by default, though they remain available as extra practice with a clear label explaining the structural difference.

### H.3 Paper metadata

Sitting year, sitting month, paper code, syllabus version, total marks, official duration, question count, section/module coverage summary, and rights status. Rights status is a real field with real behaviour: `licensed`, `original`, `adapted`, `unavailable`. An `unavailable` paper is invisible to students regardless of any other state.

### H.4 Paper questions

Papers reference questions by ordered position, with their original numbering and part labels preserved. A question can belong to a paper _and_ appear in topic practice — the same content object, two access paths. This is why questions are not stored inside papers.

Multi-part structured questions (2(a), 2(b)(i), 2(b)(ii)) are modelled as a parent question with ordered parts, each with its own answer specification, marks and solution steps (§I.10).

### H.5 Navigation

Within a paper: question list with answered/unanswered/flagged state, direct jump to any question, flag-for-review, next/previous. This mirrors real examination behaviour — students skip and return — and a linear-only navigation makes paper mode feel unlike an examination, which defeats its purpose.

### H.6 Simulation forms and modes

**The forms, from the official assessment structure (spec §0.3):**

| Form                       | Structure                                    | Duration | Release |
| -------------------------- | -------------------------------------------- | -------- | ------- |
| Paper 01 (regular)         | 60 multiple-choice items, 20 per module      | 1h30     | **MVP** |
| Paper 02 (regular)         | 9 structured questions, 90 raw marks         | 2h30     | V1      |
| Paper 01 modular, 1 module | 20 items                                     | 30 min   | V1      |
| Paper 02 modular, 1 module | 3 structured questions                       | 50 min   | V1      |
| Paper 01/02 modular, 2 mod | 40 items / 6 questions                       | 1h / 1h40| V1      |

Item selection for a simulation honours the official blueprint: the per-module item allocation, the per-topic Paper 01 item counts, and the CK/AK/R profile split (30/40/30 per module). A simulation that does not match the blueprint is not a rehearsal and must not feed the readiness model — this is a hard precondition, checked at materialisation, not a quality aspiration.

**Practice paper mode:** work through at leisure, check answers as you go, the full ten-block response available immediately. This is learning.

**Timed simulation mode:** the official duration, a visible countdown, **no responses until submission**, no answer checking during the attempt, and automatic submission at expiry with everything answered so far. This is rehearsal, and its value depends entirely on the constraints being real. Only timed simulations count as simulation evidence in the readiness model.

The timer is anchored to a **server-issued start timestamp**, never to client uptime, and survives a closed tab, a reload, a lost connection or a phone call. Getting this wrong ruins the feature and corrupts the evidence base at the same time.

_Not present:_ proctoring, lockdown, webcam or tab-focus monitoring (§D.7). A student who cheats a simulation degrades only their own readiness reading, and the model's confidence machinery already discounts a result that is wildly out of line with their practice history (§J.12).

### H.7 Results

Total score, per-question marks (for structured papers, marks awarded per part), time taken versus allowed, and a breakdown by syllabus section and by profile dimension. The section breakdown is the analytically valuable output: _"You lost 18 of your 34 dropped marks in Geometry and Trigonometry."_

**Marking honesty.** Automated marking of structured questions can only award marks for answers the answer specification can judge. Method marks — a substantial share of Paper 02 marks in reality — cannot be awarded automatically without either AI (prohibited, §B-6) or human marking. **The product must say so plainly**: report an "answer-mark score" and be explicit that a real examiner awards method marks the app cannot see. Overstating marking fidelity is a trust failure waiting to happen and would be seized on by any teacher evaluating the product.

### H.8 Review mode

After submission: every question with the student's answer, the correct answer, the full worked solution and the explanation. Filterable to incorrect only. Directly actionable — _"practise this topic"_ from any missed question, which converts a post-mortem into practice, the single most valuable transition in the product.

### H.9 How simulation feeds the assessment engine

Simulation attempts feed the same mastery model as topic practice (§J), but they are **weighted substantially higher** — they are timed, blind, self-unselected and structurally representative, which makes them the only unbiased evidence in the system (§2.4).

Three specific couplings, all of which are requirements rather than enhancements:

1. **Readiness.** A simulation result updates the readiness index directly, and the *absence* of any simulation caps the confidence of the projection regardless of practice volume (§J.12).
2. **Weak areas by mark impact.** Per-paper analysis is expressed in the currency the student cares about — marks — with a direct route into targeted practice for the worst two: _"You lost 18 of your 34 dropped marks in Geometry and Trigonometry."_
3. **Profile dimensions.** The CK/AK/R breakdown is diagnostic in a way topic breakdowns are not. A student weak in R across every topic has a reasoning problem, not fourteen topic problems, and the recommendation engine must be able to say so.

---

## SECTION I — STUDENT ANSWER SYSTEM

### I.1 The governing rule

**Answer validation is deterministic. AI is never used to judge a student's answer.**

This is not merely cost. It is:

- **Correctness** — a language model asked "is `0.667` an acceptable answer to a question whose answer is `2/3`?" will usually be right and occasionally not, and it will not be consistent across students. Deterministic rules are consistent by construction.
- **Speed** — local evaluation returns in single-digit milliseconds.
- **Availability** — works offline.
- **Auditability** — when a student disputes a marking, there is a rule to point at.
- **Cost** — zero marginal cost per attempt.

The intellectual work is moved to authoring time: deciding what counts as correct is a _content_ decision made once, by a human, and recorded in the answer specification. This is the right place for it.

### I.2 Answer types

| Type                        | Example               | Validation                                                   |
| --------------------------- | --------------------- | ------------------------------------------------------------ |
| `multiple_choice`           | Select one of A–D     | Exact option-ID match                                        |
| `multi_select`              | Select all that apply | Set equality                                                 |
| `true_false`                |                       | Exact match                                                  |
| `numeric_exact`             | `36`                  | Exact after normalisation                                    |
| `numeric_tolerance`         | `3.14` (±0.005)       | Absolute or relative tolerance                               |
| `numeric_sf` / `numeric_dp` | "to 2 decimal places" | Value _and_ precision both checked                           |
| `fraction`                  | `3/4`                 | Rational equality, optionally requiring lowest terms         |
| `mixed_number`              | `1 1/2`               | Rational equality                                            |
| `ratio`                     | `3:5`                 | Proportional equality, optionally requiring simplest form    |
| `currency`                  | `$45.50`              | Numeric with 2dp and currency handling                       |
| `with_units`                | `12 cm²`              | Value + unit, with unit conversion where declared acceptable |
| `expression`                | `2x + 3`              | Structural/symbolic equivalence (§I.9)                       |
| `coordinate`                | `(3, -2)`             | Componentwise numeric                                        |
| `set`                       | `{2, 3, 5}`           | Set equality, order-independent                              |
| `interval` / `inequality`   | `x > 4`               | Normalised comparison                                        |
| `matrix` / `vector`         |                       | Elementwise numeric                                          |
| `structured`                | Multi-part            | Each part validated independently (§I.10)                    |

### I.3 Input normalisation

Applied before comparison, and applied identically on client and server. A student must never be marked wrong for formatting.

Strip whitespace and thousands separators. Accept `,` or `.` as decimal separator where unambiguous by locale. Normalise unicode minus, en-dash and hyphen to a single minus. Normalise `×`, `*`, `x` (in numeric contexts) and implicit multiplication. Accept `^` and superscript digits for exponents. Normalise unit spellings and casing against a controlled unit vocabulary (`cm2`, `cm^2`, `cm²`, `sq cm` → the same unit). Trim leading `+`. Accept a leading `=` or restatement (`x = 5` where `5` was expected) when the specification permits it — students do this constantly and failing them for it is indefensible.

**Normalisation is shared code between the mobile client and the server validator.** Divergence between them produces the worst class of bug in this system: a student who is told they are right and recorded as wrong. Single source, shared package, property-tested against each other in CI.

### I.4 The answer specification

The object attached to each question version that fully determines correctness:

- **Answer type** (from I.2)
- **Canonical value** — the machine-comparable form
- **Display value** — the human-readable correct answer shown in the result screen
- **Accepted alternative forms** — an explicit list of other correct representations
- **Tolerance** — absolute or relative, where applicable
- **Precision requirement** — significant figures or decimal places, and whether precision is _required_ or merely _accepted_
- **Unit requirement** — required / optional / must-match / convertible-set
- **Form requirement** — e.g. fraction must be in lowest terms, ratio in simplest form, surd simplified
- **Case sensitivity** — for the rare text answer
- **Normalisation profile** — which of I.3's rules apply
- **Common-error values** — the wrong answers to recognise (§G.5)

**Critically: the accepted-forms list is generated once, at authoring time, with computer algebra assistance and human confirmation.** For a question whose answer is `3/4`, the pipeline pre-computes and stores `0.75`, `.75`, `75%` (if the specification allows percentage form), `6/8` (accepted only if lowest terms are not required), and so on. The runtime then does nothing cleverer than a normalised lookup.

This single decision is what allows sophisticated equivalence handling with zero runtime cost and zero runtime ambiguity — and it is the pattern that should be reached for whenever "we'll need AI to judge this" is proposed.

### I.5 Multiple choice

Exact match on option ID, not on option text — text can be edited without invalidating history. Options are presented in a seeded random order unless `preserve_order` is set. A wrong selection is matched against the option's linked common error to produce targeted feedback.

### I.6 Numerical and decimal answers

Compare canonical numeric values within the specified tolerance. Where the question demands a precision ("give your answer to 3 significant figures"), **both value and precision are checked**, and a right value at the wrong precision produces a distinct, specific message — _"Correct value, but the question asked for 3 significant figures"_ — which is a real CSEC mark-loser and worth teaching directly.

Guidance for authors: prefer explicit tolerances over relying on defaults; a tolerance that is too tight fails honest students who rounded at a different stage, and one too loose accepts wrong work. Where a question involves intermediate rounding, the answer specification should accept the range produced by rounding at any reasonable stage, with those bounds computed at authoring time.

### I.7 Fractions

Parse into a rational, reduce, compare. Handle mixed numbers, improper fractions, negatives (`-3/4`, `3/-4`, `-(3/4)`). Where the question requires lowest terms, an unreduced but numerically-equal answer is judged _correct with a note_ rather than wrong, unless the objective being assessed is specifically simplification — in which case it is wrong and the message says why. This distinction is a content decision recorded in the specification, not a global rule.

### I.8 Equivalent answers

The general principle: **equivalence is enumerated at authoring time, not decided at runtime.** The accepted-forms list plus normalisation covers the overwhelming majority of cases. Where an answer genuinely has an unbounded set of equivalent forms, the answer type must be `expression` and §I.9 applies.

### I.9 Algebraic expressions

The hardest case, handled in three tiers:

- **Tier 1 (MVP)** — canonical-form comparison. Normalise the student's input into a canonical algebraic form (ordered terms, collected like terms, standard spacing) and compare against the stored canonical form and its accepted variants. Handles `2x+3`, `3+2x`, `2*x + 3` correctly. Fails on genuinely different but equivalent forms such as `(x+1)(x+2)` versus `x²+3x+2`.
- **Tier 2 (V1)** — structural equivalence via a lightweight client-side computer algebra library, comparing expanded/simplified normal forms. Handles the factorisation case. Runs in the client, still deterministic, still free.
- **Tier 3 (authoring-time, all releases)** — a full CAS in the content pipeline enumerates the expected equivalent forms and stores them. Wherever the expected answer space is finite and small, this reduces the runtime problem to Tier 1.

**Where genuine ambiguity remains, the answer specification must instead demand a specific form** ("give your answer in the form `ax² + bx + c`") — which is standard CSEC phrasing anyway, so this is a constraint the examination itself already applies. Prefer this to building a general algebraic equivalence engine.

### I.10 Structured multi-part answers

Each part carries its own answer specification, marks, solution steps and explanation. Parts are answered and validated independently. Reported per-part and in aggregate.

**Follow-through (error carried forward)** is worth stating explicitly because CSEC examiners apply it: a student who gets part (a) wrong and then uses their wrong value correctly in part (b) earns marks in a real examination. Full automated follow-through is out of scope for MVP and V1 — it requires re-deriving part (b) from the student's part (a) value. Two mitigations: (1) where the dependency is simple and the derivation is a stored formula, the answer specification may declare a follow-through rule; (2) otherwise, the results screen states plainly that method and follow-through marks are not modelled. Do not silently under-mark students and let them conclude they are worse than they are. This is a specific, foreseeable trust failure.

### I.11 Where AI is permitted in the answer system

Exactly one place: **offline, at authoring time**, to _propose_ accepted alternative forms and likely common errors for human confirmation. Its output is never used unreviewed, and it never runs while a student is waiting.

---

## SECTION J — ASSESSMENT ENGINE: DIAGNOSTIC, MONITORING, READINESS AND PROJECTION

### J.1 What this system is for

**Rev 2 rewrites this section's purpose.** In Rev 1 this was a progress tracker that supported a practice app. In Rev 2 it is the product, and it has five jobs:

1. **Map the student against the syllabus** — including what they have *not* touched, which is the part every competitor omits (§J.9).
2. **Tell them the truth about where they stand** — specifically enough to act on (§J.3–J.7).
3. **Tell them how ready they are for the examination** — as a readiness index against their actual sitting date, with its confidence (§J.11).
4. **Tell them the likely outcome** — as a grade band with a stated confidence and stated evidence, or, honestly, that there is not yet enough evidence to say (§J.12).
5. **Decide what they should do next** — ranked by mark impact, so they do not have to (§J.7–J.8).

A sixth, commercial job follows from doing those well: a visible, moving readiness reading is the primary retention mechanism in this product, and it works in the weeks when practice volume does not.

What it is explicitly _not_ for: ranking students against each other, generating engagement pressure, or making a promise. §J.12's governance is what keeps job 4 on the right side of that last line — and every number in this section is deterministic, versioned and recomputable from the attempt log (I-6).

### J.2 Attempts — the atomic record

Every attempt records: student, question, question version, session, whether it was correct, the raw answer given, the normalised answer, the matched common error (if any), time taken, whether it was skipped, whether a solution was viewed before answering (should be impossible, but recorded as a guard), the difficulty band, the skills exercised, the specific objectives, the **cognitive level (CK/AK/R)**, the **assessment context** — `topic_practice` · `recommended` · `diagnostic` · `simulation_practice` · `simulation_timed` · `quick_check` — and both client and server timestamps. The context field is load-bearing rather than descriptive: it is what lets §J.11 weight timed simulation evidence above self-selected practice, and what lets the diagnostic's low-confidence evidence be superseded cleanly.

Attempts are **append-only and immutable**. Everything else in this section is derived from them and can be fully recomputed. This matters: mastery algorithms _will_ be tuned, and a recomputable derived state means tuning is a migration rather than a data loss.

### J.3 Accuracy

Reported at several scopes (overall, section, subtopic, objective, skill, difficulty band) and over several windows (all time, last 30 days, last 20 attempts). The recent window is what the student cares about; the all-time figure is what makes the recent one meaningful.

Skipped questions are excluded from accuracy but recorded separately, because skip rate is an independent and useful signal — a high skip rate on a topic means "I don't know where to start", which is different from "I make errors".

### J.4 Mastery — conceptual algorithm

**Design requirements**, in priority order:

1. **Explainable.** A student must be able to understand why their number moved. This rules out anything opaque.
2. **Recomputable and cheap.** Updated incrementally per attempt, fully recomputable from the attempt log.
3. **Honest about uncertainty.** Two attempts must not produce a confident number.
4. **Difficulty-aware.** Getting a band-5 question right is worth more than a band-1.
5. **Recency-weighted.** A student improves; evidence from three months ago should not anchor them.

**The model.** For each _skill_, mastery is a 0–100 score built from three components:

**(a) Recency-weighted, difficulty-adjusted performance.** Each attempt contributes evidence weighted by (i) an exponential recency decay — recent attempts weigh more, with a half-life of roughly 20 attempts or 30 days, whichever comes first — and (ii) a difficulty weight, so that a correct answer on a harder question contributes more credit and an incorrect answer on an easier question contributes more penalty. Conceptually this is an exponentially-weighted moving average of difficulty-adjusted outcomes.

**(b) A confidence factor.** Evidence accumulates with attempts and with the number of _distinct questions_ attempted (five attempts at one question is much weaker evidence than five attempts at five questions). Below a floor of roughly 5 distinct questions, mastery is not reported as a number at all — it is shown as "getting started" (§J.6). Between 5 and 15, the score is shrunk toward a neutral prior, so it moves conservatively. Above 15 it is reported at full weight.

**(c) A coverage factor.** A skill assessed at only one difficulty band, or through only one question type, cannot be described as mastered. Coverage caps the achievable score: a student who has only ever answered band-1 and band-2 questions on a skill is capped below the top range regardless of accuracy. This prevents the single most damaging failure of naive mastery systems — a student shown 95% who is then destroyed by the examination.

**Rolling up.** Skill → Specific Objective → subtopic → section → overall, each level a coverage-weighted mean of its children, weighted by how many questions exist at that level and, for the top-level figure, by the examination weighting of each section. A section with no attempts is _unknown_, not zero — a crucial distinction, since displaying 0% for untouched topics tells a student they are failing at something they have simply not started.

**Deliberately not in MVP:** Bayesian Knowledge Tracing, Item Response Theory, or a learned model. They are better in principle, they require per-item parameters that need thousands of attempts to estimate, and they are not explainable to a sixteen-year-old. Revisit at V2 with real data (§J.10). The design above is deliberately the _boring_ one (B-13), and it is recomputable, so upgrading later is safe.

### J.5 Mastery bands

Presented in words, with the number secondary:

| Score  | Label           | Meaning to the student                           |
| ------ | --------------- | ------------------------------------------------ |
| —      | Not started     | No attempts                                      |
| —      | Getting started | Fewer than 5 distinct questions; no score shown  |
| 0–39   | Needs work      |                                                  |
| 40–59  | Developing      |                                                  |
| 60–74  | Competent       |                                                  |
| 75–89  | Strong          |                                                  |
| 90–100 | Mastered        | Capped by coverage — unreachable without breadth |

### J.6 Honesty rules

These exist because a progress system that flatters students is worse than none.

- No numeric score below the evidence floor.
- Untouched content is "not started", never 0%.
- A guessed correct answer on a multiple-choice question is worth less credit than a correct constructed answer — multiple choice carries a guessing discount in the evidence weighting proportional to the number of options.
- Mastery **decays** with disuse: a skill untouched for 60+ days drifts down slowly toward the confidence-shrunk value. Framed constructively ("time for a refresher"), never punitively.
- **Readiness and projection are separate numbers and are never conflated.** The readiness index (§J.11) measures preparedness; the projection (§J.12) states a likely grade band. Both are withheld below their evidence floors, both always carry a confidence, and neither is ever displayed without the standing disclosure that it is derived from practice and simulation rather than from CXC (I-7).
- **The system must be willing to deliver bad news.** A model that never projects a Grade 4 is not calibrated, it is flattering, and the student finds out in June. Every calibration review (§J.12) explicitly checks the distribution of projections against the distribution of real outcomes, in both directions.

### J.7 Weak areas — ranked by mark impact

Rev 1 ranked weak areas by "low mastery, high examination weighting, sufficient evidence". Rev 2 makes that explicit and gives it a name and a unit, because the ranking *is* the feature and a list sorted by lowest score is the naive version of it.

**Mark impact** for a topic or objective is, conceptually:

```
mark_impact  =  examination_marks_at_stake
                × (1 − mastery)
                × confidence_in_that_mastery
                × recoverability
```

- **`examination_marks_at_stake`** comes from the official blueprint (spec §0.3): Paper 01 item counts and Paper 02 mark allocations per topic. This is not EdMar's opinion; it is published.
- **`(1 − mastery)`** is the headroom.
- **`confidence`** prevents a topic with three attempts outranking one with forty.
- **`recoverability`** discounts topics the student cannot realistically fix in the time remaining before their sitting, and *promotes* topics that are cheap to fix — high-yield, low-difficulty objectives with content available. A student six weeks out should not be sent to the hardest topic in the syllabus.

The output is expressed in the student's currency: _"Geometry & Trigonometry 1 — about 9 marks at stake, and you are at 34%. This is the biggest single gain available to you."_ A percentage alone does not motivate; a number of marks does.

**Strong areas are shown too**, and matter more than they appear: a student who only ever sees their failures stops opening the product. They also carry a decay warning where relevant — a strong area untouched for two months is a future weak area.

### J.8 Recommended practice

The recommendation engine is deterministic, rule-based, and explainable. No AI. It scores candidate practice targets on:

- **Mark impact (§J.7)** — the primary term in Rev 2, not one input among many
- Mastery deficit (low mastery scores higher)
- Examination weight of the containing section
- Recency of failure (recent errors score higher)
- Spaced repetition due-ness — a previously-failed question or skill becoming due for re-testing on an expanding interval (1, 3, 7, 21 days)
- Repeated misconceptions (§G.5) — three triggers of the same common error is a strong, specific target
- Content availability (never recommend a topic with too few unseen questions)
- Staleness of decayed skills
- A diversity penalty so the student is not sent to the same topic four sessions running

- **Profile-dimension weakness** — a student weak in Reasoning across every topic needs reasoning practice, not fourteen topic sessions (§H.9)
- **Time remaining before the sitting**, which changes the answer: eight weeks out, fix the biggest gap; eight days out, secure the marks that are nearly secured

The top-scoring target becomes the single home-screen recommendation, **with its reason and its value stated in one sentence**: _"Simultaneous equations — you missed 4 of your last 5, and it is worth about 9 marks on Paper 02."_ The reason is not decoration; an unexplained recommendation is ignored, and a recommendation that cannot state what it is worth has not used the data the product now has.

### J.9 Diagnostic assessment — **MVP**

**Promoted from V1 in Rev 2.** The diagnostic is the entry point to the entire loop: without it, every other number in this section spends the student's first fortnight saying "not enough evidence".

**Shape.** 20–25 items spanning every module and every topic that carries examination weight. Difficulty walks up and down per module in response to running performance — a student answering the first two Module 1 items correctly is moved up rather than being marched through six easy ones. This is adaptive item *selection*, not an adaptive *model*: the walk is a deterministic rule (I-6), not an inference.

**Constraints that make it honest:**

- **No per-item feedback during the diagnostic.** Feedback changes behaviour, and behaviour change during measurement destroys the measurement. Full ten-block responses are available in review immediately afterwards.
- **It is not offered at first launch** (§C.1). It is offered after the first completed practice session, when the student knows what they are agreeing to.
- **Coverage before precision.** Its job is to replace *unknown* with *provisional* across the whole syllabus, not to produce a precise score anywhere. Its outputs therefore enter the mastery model at low confidence and are superseded by ordinary practice evidence as that accumulates.
- **It can be abandoned and resumed.** A twenty-minute commitment that must be done in one sitting will be abandoned by a large share of students; the partial evidence is still worth having.

**Output.** A coverage map — every topic in one of `not started · needs work · developing · competent · strong` — plus the first readiness reading (at low confidence), the top three weak areas by mark impact, and one recommended action. Framed as a starting point, never as a verdict, and the copy says so in its first line.

**Re-diagnosis.** Offered when mastery has moved materially across several topics, or after 60 days, or when the student asks. A second diagnostic is also the cleanest possible evidence of progress — the same instrument, twice — and it is presented that way.

### J.10 Evolution path — *moved*

Rev 1's §J.10 (the path to item calibration and knowledge tracing) is now **§J.14**, at the end of this section, so that the three new capabilities read in the order a student meets them. The number is left in place rather than reused, because §J.10 is cited in the technical specification and in the phase plan.

### J.11 Readiness index — **new in Rev 2**

**What it is.** A single 0–100 reading of how prepared the student is for the examination *as it is actually weighted*, measured against their stated sitting date.

**How it is composed**, conceptually — the exact coefficients are a versioned parameter set, not a constant buried in code:

```
readiness  =  Σ over topics [ mastery(topic)
                              × examination_weight(topic)
                              × coverage(topic) ]
              × simulation_adjustment
              × recency_adjustment
```

- **`examination_weight`** from the official assessment grid (spec §0.3). A student strong in everything worth 6 marks and weak in everything worth 12 is not 50% ready, and a straight average would say they were.
- **`coverage`** caps the contribution of a topic assessed too narrowly — same principle as §J.4(c), applied at the readiness level. Breadth is not optional in an examination that samples the whole syllabus.
- **`simulation_adjustment`** pulls the index toward observed simulation performance, which is the only unbiased evidence available (§2.4). Where practice and simulation disagree, simulation wins and the gap itself is reported to the student, because that gap is usually about examination technique or timing rather than mathematics — and that is a fixable, teachable finding.
- **`recency_adjustment`** applies the same decay as mastery (§J.6).

**Confidence** is reported alongside it, always, derived from evidence volume, breadth of coverage, number of timed simulations, and recency. Below the evidence floor — conceptually, meaningful coverage of a majority of examination weight plus either a diagnostic or a simulation — the index is **not shown at all**, and the interface says what would produce one.

**Presented as a trend, not a number.** A single reading invites the wrong reaction in both directions. The line over time is the honest artefact, and it is also the retention mechanism.

**What it is explicitly not.** It is not a percentage of marks the student will score, and it must never be worded as one. It is a preparedness reading on EdMar's own scale, and the explainer screen says exactly that in plain words.

### J.12 Projected grade band — **new in Rev 2, and governed**

This is the capability Rev 1 refused outright. Rev 2 builds it, because a student asking "am I going to pass?" deserves EdMar's best honest answer rather than a change of subject — and because the alternative is that they infer a worse answer from a raw percentage anyway. What makes it defensible is not the model; it is the governance around it.

**The eight binding rules.** Each exists to remove one specific way this feature causes harm. A build that omits any of them has not built this feature; it has built R-09.

1. **Bands, never points.** Output is a range of adjacent CSEC grades — _"Grade 2–3"_ — never a single grade. The band widens as confidence falls; at low confidence it may be _"Grade 1–3"_, which is a less useful and more honest statement.
2. **Confidence is part of the output.** `low` / `moderate` / `high`, displayed in the same visual unit as the band, never in a footnote. A band without its confidence is a different and worse feature (I-7).
3. **An evidence gate.** No projection at all until: a diagnostic or equivalent coverage, a minimum attempt volume across a majority of examination weight, **and at least one completed timed simulation**. Before that the surface reads _"Not enough evidence yet — here is what would change that."_ The simulation requirement is deliberate: a projection from practice alone is systematically optimistic.
4. **Deterministic and reproducible.** A versioned rule set over the immutable attempt log (I-6). Given the same attempts, any machine at any time produces the same band. Every projection stores the model version that produced it.
5. **Explainable in one screen.** The student can see what the projection rests on: coverage, simulation results, weighted mastery, and how far out their sitting is. A projection nobody can interrogate cannot be defended when challenged by a teacher or a parent — and it will be.
6. **A standing disclosure, in the product.** Wherever a band appears: *a projection from your practice and mock results, not a CXC result or a guarantee.* Plain words, not a legal paragraph, not a hover state.
7. **Back-tested, and the accuracy published internally.** Every sitting, projections made 8 weeks out are compared against actual results volunteered by students. Band-hit rate, directional bias and calibration by cohort are reviewed. If the model is optimistic, it is corrected before the next sitting — and if it cannot be made accurate, **the feature is withdrawn rather than kept and disclaimed**. That decision is pre-committed here so it is not re-argued under commercial pressure later.
8. **Never in marketing.** The projection may not appear in the store listing, on the marketing site, in advertising, or in any claim about outcomes. It is a private reading for a paying student, not a sales device. This single rule removes most of the consumer-protection exposure in R-09.

**How it is computed, conceptually.** Readiness (§J.11) is mapped onto grade boundaries derived from the published assessment structure, then adjusted for time remaining until the sitting, for the trajectory of the readiness line, and for the spread between practice and simulation evidence. Confidence follows evidence volume, coverage breadth, simulation count and the stability of recent readings. Wide disagreement between evidence sources widens the band rather than being averaged away — that is the honest response to conflicting evidence, and it is the behaviour a naive model gets wrong.

**Calibration in the absence of real outcomes.** At MVP, EdMar has no back-test data. Two consequences, and they are binding: the initial mapping is deliberately **conservative** — it does not project a top band on thin evidence — and the MVP projection ships with an explicit internal accuracy of *unknown*, reviewed at the first sitting. §M.10's admin calibration view exists from day one for exactly this reason, and the first cohort's back-test is a V1 Must (§D.3).

**Two things this feature must never become:** a number in a push notification, and a reason to upsell. Both are available, both would work commercially in the short term, and both would earn the reputation R-09 describes.

### J.13 Monitoring — **new in Rev 2**

Two audiences in MVP, deliberately not four: the **student** monitoring themselves, and **EdMar** monitoring the service. Teacher and parent monitoring are V2 (§D.4), and pushing them out is what keeps the MVP's authorisation model simple.

**Student-facing monitoring** answers "what is happening to me over time?":

- readiness trend, accuracy trend, and effort (questions and minutes) as three lines that can be read together — a flat readiness line with rising effort is the single most important pattern the product can surface, because it means the practice is not working and the strategy needs to change;
- the **misconception profile** — repeated common errors across topics, from block 7 matches (§G.11). Three triggers of the same misconception is a specific, nameable, fixable finding, and it is the most actionable output in the system;
- **skip-rate by topic**, which is different evidence from error rate: a skip means "I don't know where to start";
- **decay warnings** on strong areas going stale;
- **pace against the sitting date** — coverage remaining versus weeks remaining, stated as a rate rather than a countdown.

**EdMar-facing monitoring** (§M.10) answers "is the service working, and for whom?":

- cohort readiness distribution, and its movement;
- **projection calibration** — the back-test in §J.12(7), which is an operational instrument, not a report;
- at-risk detection at cohort level: students whose readiness is flat or falling with the sitting approaching. In MVP this drives **content and product decisions** (which topics are failing everyone) and, at most, an opt-in email; it does not create an individual intervention workflow, which is a support function EdMar does not yet staff;
- question-level quality signals — items with anomalous wrong-answer rates, high report rates, or a distractor nobody selects (§Q.3);
- funnel and retention by cohort (§Q.5).

**The privacy boundary, stated once.** Monitoring means aggregate service quality and the student's own view of themselves. It does not mean surveillance: no per-keystroke capture, no tab-focus tracking, no location, no third-party advertising identifiers, and no sharing of an individual student's readiness or projection with anyone — school, teacher or parent — without that student's own consent (§O.9, §Q.9). The V2 teacher features are designed against this constraint rather than around it.

### J.14 Evolution path

With 100,000+ attempts, the empirical data supports genuine item calibration: per-question difficulty parameters estimated from response data, then a proper knowledge-tracing model. Because attempts are immutable and mastery is derived, this can be introduced by recomputation and validated against the existing model before switchover. Design for it now by keeping the attempt record rich (J.2); build it in V2 at the earliest.

**The same path applies to the projection (§J.12), with one added constraint:** any calibrated or learned successor must remain deterministic and reproducible (I-6) and must beat the incumbent rule set on the back-test *before* it is switched on, not after. The switchover is therefore a comparison, run on stored attempt logs, with both models' outputs recorded for a full sitting before the new one is shown to a single student.

---

## SECTION K — AI CONTENT PIPELINE

### K.1 Position

AI is the content factory (§2.1, Plane 1). It runs offline, in batch, triggered by administrators, and its every output is validated deterministically and approved by a human before it can reach a student. Nothing in this section runs while a student is waiting.

### K.2 The pipeline

```
  SOURCE DOCUMENT (PDF / DOCX / legacy JSON)
        │
   [1]  ▼  EXTRACTION                    ── AI + OCR ──
        │  text, mathematics, diagrams, structure
        │
   [2]  ▼  QUESTION IDENTIFICATION       ── AI ──
        │  segment into discrete questions and parts
        │
   [3]  ▼  NORMALISATION                 ── deterministic ──
        │  LaTeX canonicalisation, block structuring, asset extraction
        │
   [4]  ▼  CLASSIFICATION                ── AI, human-confirmed ──
        │  type, difficulty, profile dimension, skills
        │
   [5]  ▼  CURRICULUM MAPPING            ── AI, human-confirmed ──
        │  → Specific Objectives, both syllabus versions
        │
   [6]  ▼  ANSWER SPEC EXTRACTION        ── AI + CAS, human-confirmed ──
        │  canonical value, accepted forms, tolerance, units
        │
   [7]  ▼  SOLUTION DRAFTING             ── AI ──
        │  ordered steps, LaTeX + prose, marks
        │
   [8]  ▼  EXPLANATION DRAFTING          ── AI ──
        │  concept, trap, recognition cue
        │
   [9]  ▼  COMMON ERROR DERIVATION       ── AI + CAS ──
        │  wrong values and the misconceptions behind them
        │
  [10]  ▼  DETERMINISTIC VALIDATION      ── NO AI ──
        │  ┌────────────────────────────────────────────┐
        │  │ schema · LaTeX render · CAS verification of │
        │  │ the final answer · step continuity · unit   │
        │  │ consistency · asset presence · alt text ·   │
        │  │ curriculum reference integrity              │
        │  └────────────────────────────────────────────┘
        │  FAIL ──► rejected or returned for regeneration
        │
  [11]  ▼  DUPLICATE DETECTION           ── deterministic + embeddings ──
        │  §E.10, three layers
        │
  [12]  ▼  HUMAN REVIEW                  ── QUALIFIED SME ──
        │  approve / edit / request changes / reject
        │
  [13]  ▼  PUBLICATION                   ── admin action ──
        │  status → published, content_version++, audit logged
        │
        ▼  SUPABASE ──► STUDENT APP
```

### K.3 Extraction (steps 1–3)

The hardest technical step, and the one most likely to be underestimated. Mathematical PDFs are hostile: multi-column layouts, mathematics as vector graphics or images, diagrams interleaved with text, question numbering that resets, and parts that span page breaks.

Approach: use a document-understanding model with vision capability rather than plain text extraction, since mathematical notation is frequently lost or mangled by text-layer extraction. Output structured candidates, not prose. Extract diagrams as image regions for later human replacement with clean SVG — **auto-extracted diagram crops are acceptable for review but should not be published**; they look poor and often carry source branding.

**Assume a meaningful failure rate and design the review queue for it.** Extraction quality is the single largest driver of downstream human review time, and improving the extraction prompt is far cheaper than paying reviewers to fix its output. Budget a tuning cycle.

### K.4 Classification and mapping (steps 4–5)

AI proposes; humans confirm. The reviewer sees the proposal with the AI's stated reasoning and the relevant syllabus text side by side, so confirming is a two-second action and correcting is a two-click one. Getting this interaction right is the difference between 30 and 60 reviewed questions per reviewer-day, which is the difference between a three-month and a six-week content ramp.

Confidence is recorded. Low-confidence mappings are routed to a stricter review path. Mis-mapping silently corrupts mastery and recommendations (§E.3), so this is worth the extra step.

### K.5 Generation (steps 6–9) and variants

For questions from source documents, solutions may already exist and AI's job is structuring rather than solving. For original and variant questions, AI drafts genuinely new content.

**Variant generation** is the highest-leverage AI operation in the product: take an approved question and produce structurally identical items with different numbers and contexts. It multiplies a reviewed question into a family, addresses content starvation (§E.4), and reduces the chance that two students share answers.

Constraints, all of which matter:

- Variants are generated only from **already-approved** source questions.
- The numbers must be chosen so that the answer remains reasonable (no answers of `0.0000317` where the original was `12`); the pipeline verifies this with a CAS and rejects variants that produce ugly or degenerate answers.
- Each variant is solved independently by CAS and the AI's stated answer is checked against it. Disagreement is an automatic rejection.
- Variants join the source's variant family (§E.10) and are never served alongside it.
- **Variants still require human review**, though review is fast because the reviewer is checking a known structure with new numbers.

### K.6 Deterministic validation (step 10) — the quality backbone

Every item, whatever its origin, must pass all of the following before a human ever sees it. **No AI participates in this gate**, which is the entire point of it.

| Check                       | Rejects                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema completeness         | Missing stem, answer spec, solution, explanation, curriculum link                                                                                                                                             |
| LaTeX allowlist             | Commands outside the permitted subset (§G.8)                                                                                                                                                                  |
| LaTeX render                | Anything that fails headless rendering                                                                                                                                                                        |
| **CAS answer verification** | Where the question is symbolically tractable, the CAS independently derives the answer and compares to the stated one. **A mismatch is an automatic reject.** This is the highest-value check in the pipeline |
| Step continuity             | A solution step whose result does not follow from the previous one, where checkable                                                                                                                           |
| Numeric sanity              | Answers with absurd magnitude, precision, or sign for the context                                                                                                                                             |
| Unit consistency            | Dimensional analysis across the solution; area answers in cm not cm²                                                                                                                                          |
| Answer-spec coherence       | Canonical value parses as its declared type; tolerance is sane; accepted forms are genuinely equal                                                                                                            |
| Distractor validity         | No distractor equals the correct answer; distractors are distinct                                                                                                                                             |
| Option balance              | Multiple choice has the right number of options; no "all of the above" unless the source has it                                                                                                               |
| Asset integrity             | Referenced assets exist; every asset has alt text                                                                                                                                                             |
| Curriculum integrity        | Objective references resolve in the declared syllabus version                                                                                                                                                 |
| Duplicate hash              | §E.10 layers 1–2                                                                                                                                                                                              |
| Reading level               | Explanation prose within a target readability band — it is written for a 15-year-old                                                                                                                          |
| Prohibited content          | Names, contact details, source watermarks, third-party branding                                                                                                                                               |

A failing item is either auto-rejected or returned for a single bounded regeneration attempt. **It is never sent to human review in a known-broken state**, because the fastest way to destroy reviewer throughput is to make them do the validator's job.

### K.7 Human review (step 12) — the gate that cannot be automated

**Reviewers must be qualified in CSEC Mathematics.** This is not a general content-moderation task; a reviewer who cannot independently solve the question cannot verify the solution, and a review process staffed by unqualified reviewers is theatre.

The reviewer sees, on one screen: the rendered question exactly as a student would; the answer specification with its accepted forms; the full worked solution; the explanation; the proposed curriculum mapping with the syllabus text alongside; the AI provenance; the validation report; and any duplicate candidates. They can edit anything inline before approving.

Decisions: **approve** (publishable), **approve with edits** (recorded as a diff), **request changes** (back to the pipeline with a note), **reject** (discarded with a reason, which feeds prompt improvement), **escalate** (second reviewer for genuinely ambiguous items).

**Throughput planning.** A qualified reviewer sustainably handles roughly 30–60 items per day depending on complexity and the quality of the incoming batch. To reach 1,200 published questions for MVP: approximately 20–40 reviewer-days. **This is the critical path** (§S, §T.4) and it is the thing most likely to be underestimated when the software looks nearly finished.

**Reviewer quality is itself measured:** approval rates, subsequent student-report rates on items each reviewer approved, and periodic double-review of a random sample. A reviewer who approves fast and generates complaints is a bigger problem than a slow one.

### K.8 AI-generated versus human-approved — the essential distinction

|                     | AI-generated                                                   | Human-approved                                           |
| ------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| Definition          | Any artefact produced by a model                               | An artefact a qualified reviewer has explicitly approved |
| Visible to students | **Never** in that state                                        | Yes, when published                                      |
| Stored              | Yes, with full provenance                                      | Yes, with review event and diff                          |
| Can be published    | No                                                             | Yes                                                      |
| Overlap             | An item is almost always both: AI-drafted _and_ human-approved |                                                          |

The system must never conflate "produced by AI" with "unreliable" or "human-approved" with "not AI-touched". The meaningful line is **approval**, and it is enforced by status, by RLS (I-2), and by the audit log.

### K.9 Prompt and model management

Prompts are versioned artefacts in the repository, reviewed like code. Every AI output records the prompt version that produced it, which makes it possible to answer "did the quality drop when we changed the classification prompt?" — a question that will be asked.

Model selection is per pipeline stage and configurable, not hard-coded: a strong reasoning model for solution drafting where accuracy dominates; a cheap fast model for classification where a human confirms anyway; an embedding model for duplicates. Deliberately mixed, because using an expensive model for classification is the most common avoidable overspend in pipelines like this.

A **golden set** of 50–100 fully human-verified questions is kept as a regression suite. Any prompt or model change is run against it and the outputs diffed before the change is adopted. This is what prevents a silent quality regression from reaching students.

---

## SECTION L — AI COST-CONTROL STRATEGY

### L.1 The core insight

AI cost in this product is **capital expenditure on a durable asset**, not cost of goods sold.

A question is processed once and served to every student who ever practises that topic. A question costing US$0.20 in AI to produce and serve to 5,000 students over three years costs US$0.00004 per student-view. The same question generated per-attempt would cost thousands of dollars over the same period and deliver a worse, less consistent product.

Every decision in this section follows from moving work from the per-attempt axis to the per-question axis.

### L.2 Operations that require AI

Exclusively in the content factory, exclusively in batch:

| Operation               | Frequency           | Why AI                                                      |
| ----------------------- | ------------------- | ----------------------------------------------------------- |
| Document extraction     | Per source document | Vision + layout understanding; no deterministic alternative |
| Question segmentation   | Per document        | Structural judgement                                        |
| Classification          | Per question, once  | Language understanding; human-confirmed                     |
| Curriculum mapping      | Per question, once  | Semantic matching to syllabus text; human-confirmed         |
| Solution drafting       | Per question, once  | Natural-language generation                                 |
| Explanation drafting    | Per question, once  | Natural-language generation, pitched for a student          |
| Common-error derivation | Per question, once  | Pedagogical judgement about likely misconceptions           |
| Variant generation      | Per variant, once   | Generation                                                  |
| Duplicate embeddings    | Per question, once  | Semantic similarity                                         |
| Admin review assistance | On demand           | Optional convenience for reviewers                          |

### L.3 Operations that must never use AI

| Operation                                    | Instead                                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Judging a student's answer**               | Deterministic evaluation against the answer specification (§I)                                                   |
| **Serving a solution or explanation**        | Stored, reviewed text                                                                                            |
| **Selecting the next question**              | Postgres selection function (§E.4)                                                                               |
| **Computing mastery**                        | Deterministic algorithm (§J.4)                                                                                   |
| **Generating recommendations**               | Deterministic rules (§J.8)                                                                                       |
| **Marking a paper**                          | Answer specifications per part (§H.7)                                                                            |
| **Any student-initiated request whatsoever** | There is no student action that reaches a model                                                                  |
| **Content validation**                       | CAS and rule checks (§K.6) — validation by the same class of system that generated the content is not validation |

That last row deserves emphasis: using AI to check AI is a correlated-failure design. The check must be of a different kind, which is why the validation gate is deterministic.

### L.4 Caching and permanent storage

Everything AI produces is stored permanently and never regenerated:

- Solutions, explanations, common errors, classifications, mappings — stored on the question version, immutable, reused forever.
- Accepted answer forms — computed once, stored, used at every attempt.
- Embeddings — stored, reused for every future duplicate check.
- Extraction outputs — retained, so a pipeline change does not require re-processing (and re-paying for) the source document.
- Pre-rendered LaTeX SVG fallbacks — generated at publish, served from CDN.

**Rule: if a model produced it, it is written to the database and never asked for again.**

### L.5 Batch and offline execution

All AI work runs as background jobs against a queue, initiated by an administrator or a schedule. Nothing is synchronous with a user action, which means: batch APIs and their discounts are available; failures are retried without anyone waiting; jobs can be run in off-peak windows; a provider outage delays content work and does not affect a single student.

### L.6 Rate limiting and spend control

- **Hard monthly spend cap** at the provider account level. Not a target — a cap.
- **Per-job budget estimate before execution.** An admin uploading a 40-page document sees an estimated cost and must confirm. The scenario this prevents is a well-meaning admin queueing 200 documents on a Friday.
- **Per-stage token limits**, so a malformed input cannot produce an unbounded generation.
- **Concurrency limits** on the job queue.
- **Daily spend alerting** with a threshold that triggers a human, and a circuit breaker that pauses the queue at 80% of monthly cap.
- **Model tiering by stage** (§K.9) — cheap models where a human confirms anyway.
- **No AI credentials anywhere near the student app.** Keys live in server-side secrets, reachable only by the job runner. The mobile bundle cannot call a model even if someone tries to make it (I-1, §O.7).

### L.7 Illustrative economics

Figures are indicative, for shaping decisions rather than for budgeting; real numbers depend on provider pricing and document quality, and should be measured on a 50-question pilot batch in Phase 1.

**Content build, one-off:**

| Item                       | Assumption                      | Cost                |
| -------------------------- | ------------------------------- | ------------------- |
| Full pipeline per question | ~US$0.10–0.30 including retries |                     |
| 1,200 questions (MVP)      |                                 | **~US$120–360**     |
| 3,000 questions (V1)       |                                 | **~US$300–900**     |
| 10,000 questions (mature)  |                                 | **~US$1,000–3,000** |
| Ongoing content additions  | ~300 questions/month            | ~US$30–90/month     |

**Runtime, per student:** US$0.00. There is no per-attempt AI call.

**Fixed infrastructure:** Supabase Pro from ~US$25/month, Vercel ~US$0–20/month, storage and CDN ~US$5–25/month. Call it **US$50–150/month** across the whole service to well past 10,000 students.

**Unit economics at 1,000 subscribers:**

| Line                                         | Amount                                           |
| -------------------------------------------- | ------------------------------------------------ |
| Gross revenue                                | US$4,000/month                                   |
| Less store commission (15%)                  | −US$600                                          |
| Net revenue                                  | US$3,400                                         |
| Less infrastructure                          | −US$100                                          |
| Less ongoing AI content                      | −US$60                                           |
| **Contribution before people and marketing** | **~US$3,240 — 95% of net revenue, 81% of gross** |

**The counterfactual, for contrast.** With one model call per attempt at US$0.01 and a student doing 5 questions a day: US$1.50 per student per month, or roughly **44% of net revenue**, scaling directly with engagement. At 1,000 subscribers that is US$1,500/month against US$160 — a difference of an order of magnitude, growing.

The dominant real costs in this business are **content review labour** and **customer acquisition**, not compute. Which is the correct place for the costs to sit, because both buy durable assets.

### L.8 Cost-control review rules

Any proposed feature must answer: _does this add per-student marginal cost?_ If yes, it needs an explicit economic justification and a cap, and it should probably be redesigned. The pattern to reach for is always the same one used for answer specifications (§I.4): **move the expensive computation to authoring time, store the result, make the runtime a lookup.**

---

## SECTION M — ADMIN SYSTEM

### M.1 Position and users

A Next.js application on Vercel, desktop-first, authenticated through the same Supabase Auth instance as the student app but gated on role. It is an internal tool for a small team, so it should be optimised for **throughput of the review queue** rather than for visual polish. Content review speed is the business's rate limiter (§K.7); every second saved per item compounds across thousands of items.

Roles:

| Role               | Can                                                                                |
| ------------------ | ---------------------------------------------------------------------------------- |
| `viewer`           | Read content and analytics                                                         |
| `reviewer`         | Review and approve/reject questions; edit content                                  |
| `curriculum_admin` | Everything above, plus edit the taxonomy and skill vocabulary                      |
| `content_admin`    | Everything above, plus publish, retire, run pipeline jobs                          |
| `support`          | View student accounts, manage entitlements, handle reports — **no content rights** |
| `super_admin`      | Everything, plus role assignment                                                   |

Role separation is enforced in RLS (§O.4), not only in the UI.

### M.2 Dashboard

The landing view answers "what needs my attention?":

- Review queue depth, with age of the oldest item — a queue growing faster than it is drained is the single most important operational signal in the business.
- Items awaiting a second review (escalations).
- Open student problem reports on published questions, sorted by traffic on the affected question.
- Questions flagged by empirical quality monitoring (§E.13).
- Running and failed pipeline jobs, with spend to date this month against cap.
- Published question counts by section and by syllabus version, with gaps highlighted — the "which topics are thin" view that drives content planning.
- Yesterday's active students, attempts, and new subscriptions.

### M.3 Question management

List and search across the whole bank, filterable by every classification axis in §E.3 plus status, provenance, reviewer, date, and quality flags. Bulk operations on selections: assign to reviewer, change status, retire, re-run validation, export.

The list must be genuinely fast at 10,000+ rows with server-side pagination and indexed filters. An admin tool that takes four seconds per page is an admin tool people stop using.

### M.4 Question editor

The most-used screen in the system. Requirements:

- **Split view:** editing on the left, live student-accurate preview on the right, **showing all ten blocks in the order and grouping the student sees** (§G.11). The preview must render exactly as the web app does — same pre-rendered SVG, same block model, same width constraint, and a viewport toggle for the narrow-screen accordion — because "it looked fine in admin" is a defect class that reaches students.
- **Structured editing** of stem blocks, options, solution steps, explanation and common errors — not a single text area.
- **LaTeX assistance:** a palette of common CSEC notation, inline render-error highlighting against the allowlist, and immediate feedback rather than a save-time failure.
- **Answer specification builder** with a test harness: the reviewer types candidate student answers and sees immediately whether they would be judged correct. This is the fastest way to catch a too-tight tolerance or a missing accepted form, and it should be prominent.
- **Curriculum mapping** with syllabus text visible alongside, and both syllabus versions handled in one interaction (§F.6).
- **Asset management:** upload, replace, alt-text editing, with alt text enforced before publish.
- **Validation panel** showing the §K.6 report inline, so a reviewer never has to guess why an item is blocked.
- **Version history** with diffs, and a one-click revert to a previous version.

### M.5 Review queue

Optimised for sustained throughput:

- Queue with filters (batch, provenance, confidence, section, reviewer assignment) and a clear "next item" flow. A reviewer should never have to choose what to work on.
- Keyboard shortcuts for approve / request changes / reject / next. This is not a luxury — at 40 items a day, mouse travel is measurable.
- Everything needed to decide, on one screen (§K.7). No tab-switching to check the syllabus.
- Approve-with-edits captures the diff automatically.
- Rejection requires a reason from a controlled list plus optional free text; reasons aggregate into the prompt-improvement loop (§K.9).
- Per-reviewer throughput and quality statistics, visible to the reviewer themselves as well as to admins.

### M.6 AI content review

The same queue with AI-specific affordances: model and prompt version shown, confidence scores per proposed field, the CAS verification result displayed prominently, the source question shown side by side for variants, and batch-level statistics (approval rate for this run, common rejection reasons). A run with an unusually low approval rate should be stoppable in one click, and the remaining items requeued after a prompt fix rather than reviewed one by one.

### M.7 Curriculum management

Manage sections, subtopics, Specific Objectives and skills, per syllabus version; manage the V2018↔V2027 mapping table (§F.6) with a side-by-side interface; view question counts per node to find coverage gaps.

Because the taxonomy is version-controlled seed data (§F.8), the admin UI writes changes as proposed migrations rather than direct edits in production, or at minimum records every change in the audit log with a full before/after. Accidental deletion of a Specific Objective with 300 questions attached must be impossible, not merely discouraged: referential integrity plus a soft-delete with a dependency check.

### M.8 Past paper management

Create papers, define metadata (§H.3), assemble questions in order, set rights status, preview as a student sees it, publish or withhold. A one-action "withdraw this paper and all its questions from student view" control exists specifically for the rights scenario in §V R-01, and it must be tested.

### M.9 User and subscription management

For support staff: find a student by email, view their profile, subscription state and recent activity; grant, extend or revoke entitlement (fully audit-logged); process account deletion and data export requests; view and respond to their problem reports.

**Explicit constraint:** support staff can see account and subscription state and aggregate activity. They do not have a general ability to browse an individual minor's detailed answer history without a recorded support reason. This is a privacy design decision and it should be enforced, not assumed.

### M.10 Analytics, cohort monitoring and projection calibration

Three things, and the third is new in Rev 2 and is not optional.

**Service analytics** — the admin-facing views of §Q: student growth and retention cohorts; practice volume; conversion funnel; content coverage and gaps; question quality outliers; AI spend against budget; pipeline throughput. Sourced from materialised views refreshed on a schedule rather than computed live, so the dashboard cannot degrade the student-facing database.

**Cohort monitoring** (§J.13) — readiness distribution across the active cohort and its movement over time; diagnostic and simulation completion rates; topics where the cohort as a whole is failing, which is a *content* signal before it is a student signal; and flat-or-falling readiness with the sitting approaching, used to drive product and content decisions rather than individual intervention.

**Projection calibration** (§J.12 rule 7) — the back-test instrument. It must exist from MVP even though it has nothing real to measure yet, because building it later means the first sitting passes uninstrumented and a year is lost. It reports: band-hit rate, **directional bias** (the number that matters — a model that misses evenly is fixable, one that misses upward is dangerous), calibration by confidence level, calibration by cohort and by weeks-out-from-sitting, and the distribution of projected bands against the distribution of actual grades. Outcomes are collected only from students who volunteer them, with consent, and that consent flow is designed as part of this feature rather than bolted on.

**Access to individual student readiness and projections is restricted to the narrowest admin role that can do the job**, is logged in the audit trail like any other privileged read (§M.11, §O.11), and exists for support and defect investigation — not for browsing.

### M.11 Audit log

Every content state change, taxonomy change, role change, entitlement change and support action, with actor, timestamp, before/after, and reason where applicable. Append-only, not editable by any role including `super_admin`, searchable and exportable. This is the record that answers every "how did that happen?" question the business will ever have.

---

## SECTION N — SUBSCRIPTION MODEL

### N.1 Structure

Two tiers. Resist the temptation to add a third — a middle tier at this price point adds decision friction that costs more conversions than it earns revenue.

### N.2 Design intent

The free tier must be **genuinely useful and clearly insufficient**. A free tier that is useless produces uninstalls; one that is sufficient produces no revenue. The right shape here is a **daily volume limit on full-quality content** — the student experiences the real product, including worked solutions and explanations, and simply runs out. This converts far better than withholding quality, and it is honest.

### N.3 Free tier

| Included                          | Limit                                                            |
| --------------------------------- | ---------------------------------------------------------------- |
| Practice questions                | 10 per day, resetting at local midnight                          |
| Worked solutions and explanations | Full quality, no restriction                                     |
| Topics                            | All sections browsable; a defined free question pool within each |
| Progress tracking                 | Full                                                             |
| Recommended practice              | Yes                                                              |
| Past papers                       | One sample paper (V1)                                            |
| **Diagnostic**                    | **Yes — once.** It is the hook, not the upsell                   |
| **Coverage map and weak areas**   | Yes                                                              |
| **Readiness index**               | Yes, at reduced refresh (weekly rather than per attempt)         |
| **Projected grade band**          | No — premium                                                     |
| **Exam simulation**               | No — premium                                                     |
| Ten-block response on every question | Full quality, no restriction                                  |

The daily limit is a configurable server-side value, not a constant in the client. It will need tuning against conversion data, and — a web-first benefit — it is tunable without any release at all. It is also the natural lever for promotional periods ("unlimited practice week before exams").

**Why the diagnostic is free and the projection is not.** The diagnostic is the moment the student learns that the product knows something about them that they did not know themselves; giving it away is the cheapest possible demonstration of the whole proposition. The projected band and the simulations are the things they will pay to keep watching. This split is the central conversion hypothesis of Rev 2, it is testable within weeks of beta, and §Q.5 must measure it explicitly rather than inferring it.

### N.4 Premium

US$4/month; US$40/year at V1+ (a 17% discount, and a strong option for a student sitting an examination eight months away).

Unlimited questions; the full bank; **examination simulations** (all available forms); **the projected grade band with confidence and its explainer**; live readiness refresh; re-diagnosis on demand; full monitoring including the misconception profile and trend history; all past papers (V1, rights permitting); offline packs (V1); priority on problem reports.

### N.5 Entitlement architecture

**Built in MVP even though billing is not.** This is the decision that prevents a painful retrofit.

- An `entitlement` record per student: tier, source (`trial` / `google_play` / `promo` / `school` / `manual`), current period start and end, status (`active` / `grace` / `expired` / `cancelled`), and the platform transaction reference.
- **Entitlement is checked server-side and enforced in RLS.** The client's belief about the student's tier is a display convenience only. A client-side paywall is not a paywall.
- The daily free-question counter is a server-authoritative record, not a device counter, or it is defeated by reinstalling.
- Entitlement checks are a single cheap lookup on the student row, cached in the session, so this adds no meaningful latency.
- The entitlement model is deliberately **source-agnostic**: Google Play, Apple, a future direct payment rail, a school licence, or a manual grant all produce the same entitlement shape. This is what makes school licensing (§U) a business-logic change rather than an architecture change.

### N.6 Billing — **web billing at MVP** (Rev 2 change)

Rev 1 put real billing in V1 because a mobile-first product must use Google Play Billing, and that dependency dragged merchant availability (spec U-04) onto the critical path. **Web-first removes the dependency**, so billing is live at MVP.

**MVP — web checkout.** A card-and-wallet processor (Stripe or an equivalent with reliable Caribbean coverage — the choice is a Phase 0 decision, and coverage in Jamaica, Trinidad and Tobago, Barbados and Guyana is the deciding criterion, not fee schedule). Requirements: server-side verification of every payment event — never trust the client; webhooks handled for payment success, renewal, failure, cancellation, refund and dispute; a grace period on failed payment, because a student whose parent's card fails should not lose access in the week before a mock; clear disclosure of price, period and cancellation before purchase; and self-serve cancellation that takes no more than two clicks and no email.

Fees are typically ~3% plus a fixed amount per transaction. At US$4/month the fixed component is material and it is the reason the annual plan matters commercially rather than only for retention — a US$40 annual payment loses a fraction of what twelve monthly payments lose.

**V2 — store billing alongside.** When the mobile app ships, a digital subscription consumed in-app must use Google Play Billing (15% on the first US$1M annually). §N.5's source-agnostic entitlement model already absorbs this: a student who subscribed on the web and installs the app keeps their entitlement, and the app must not offer them a second one. **This is the single most common billing defect in cross-platform subscription products and it must be an explicit test case.**

**[VERIFY-A-04] is downgraded, not closed.** Play merchant support per territory still needs confirming before the mobile release, but it no longer gates launch.

### N.7 Seasonality

CSEC is examined in May–June with a January sitting. Expect a heavy subscription cycle: sign-ups building from January, peaking April–May, and a sharp churn in June–July.

This is normal and must not be misread as failure. Responses: promote the annual plan hard in January–February (it converts the seasonal user into a retained one and pulls revenue forward); accept July–August as a trough; use it for content build; consider a low-cost "keep your progress" dormant state rather than fighting churn from students who have finished the examination. Retention should be measured **within cohort by exam sitting**, not as a flat monthly figure, or the numbers will be meaningless (§Q.5).

### N.8 Pricing notes

- US$4/month is a strong price for the region and the value delivered, and it is defensible against the tuition anchor.
- Local-currency display should follow territory. Play handles the mechanics; the product should present a familiar figure rather than a converted one where possible.
- Resist discounting below this level. The cost structure (§L.7) does not require it, and a lower price signals lower quality in an examination-preparation category where students associate cheapness with unreliability.
- A referral mechanism (free weeks for both parties) is a better growth lever than a discount, and preserves the price anchor.

---

## SECTION O — SECURITY ARCHITECTURE

### O.1 Threat model

Worth stating plainly, because it shapes what matters:

| Asset                     | Threat                                  | Severity                             |
| ------------------------- | --------------------------------------- | ------------------------------------ |
| The question bank         | Bulk extraction by a competitor         | **High** — it is the entire moat     |
| Student personal data     | Breach; and these are minors            | **High** — legal and reputational    |
| Unpublished content       | Leakage of draft or unreviewed material | Medium                               |
| AI provider credentials   | Theft and abuse                         | **High** — direct financial loss     |
| Service-role database key | Theft — total compromise                | **Critical**                         |
| Entitlement state         | Manipulation for free access            | Medium — revenue, not safety         |
| Admin accounts            | Compromise → content corruption         | **High**                             |
| Attempt data              | Manipulation                            | Low — students only cheat themselves |

Note the asymmetry: paywall circumvention is a _revenue_ problem and should not be defended so aggressively that it degrades the experience for honest students. Bulk content extraction and minors' data are the serious ones.

### O.2 Authentication

Supabase Auth. Email/password with verification; Google OAuth; Apple sign-in when iOS ships. Sensible password policy, rate-limited sign-in with exponential backoff, secure token storage in the platform keychain (never in plain storage), short-lived access tokens with refresh rotation, and session revocation on password change. MFA for all admin accounts — mandatory, not optional.

### O.3 Authorisation and RLS

**Row Level Security is the primary authorisation boundary** (B-12). Every table has RLS enabled; there is no table where RLS is "not needed". The governing policies:

- A student may read **only** content rows whose status is `published` (I-2). Draft, pending and retired content is invisible at the database level, so no client bug or direct API call can expose it.
- A student may read and write **only their own** attempts, sessions, progress and profile.
- A student may never write to any content table.
- Premium-only content is filtered by an entitlement check inside the policy, so the paywall is enforced in the database.
- Admin roles are checked against a role table via a security-definer helper, never against a client-supplied claim.
- The audit log is insert-only for everyone and updatable by no one.

**Testing requirement:** RLS policies are tested as code — a test suite that attempts, as each role, every operation that should fail and asserts that it does. RLS is easy to get subtly wrong and impossible to verify by inspection.

### O.4 Admin permissions

Roles per §M.1, stored server-side, assignable only by `super_admin`, every change audit-logged. Principle of least privilege: support staff cannot touch content; reviewers cannot publish; nobody has standing production database access for routine work. Admin sessions are shorter-lived than student sessions. All admin actions are logged with actor and reason.

### O.5 Student permissions

Read published content; create attempts and sessions; read and update their own profile; delete their own account. Nothing else. In particular a student cannot read another student's anything, cannot enumerate the question bank outside a practice session, and cannot write their own entitlement.

### O.6 API and content-extraction defence

The realistic attack is a competitor scripting the API to pull the bank. Mitigations, in order of value:

- **Sessions are the only route to questions.** There is no "list all questions" endpoint for students. Questions arrive only as materialised practice sessions of bounded size (§E.4).
- **Rate limiting** per user and per IP on session creation and content fetch, tuned generously enough not to affect real students.
- **Anomaly detection** on volume: a student requesting 400 questions an hour is not a student. Flag, throttle, and review rather than auto-ban, since false positives on a paying customer are costly.
- **Free-tier limits** are themselves a strong extraction defence, which is a useful side effect.
- Accept that a determined competitor can extract content slowly. The mitigation for that is not technical — it is that the bank keeps growing and is verified, which a copy is not. Do not over-invest here at the expense of the student experience.

### O.7 AI credential protection

AI API keys exist only in server-side secret storage, accessible only to the content pipeline job runner. They are never in the mobile bundle, never in the admin client bundle, never in the repository, and never in a client-reachable environment variable. Rotation is scheduled. Provider spend caps (§L.6) mean that even a compromise is bounded. Access to the pipeline runner is restricted to `content_admin` and above, and every job execution is logged with its actor and cost.

### O.8 Service-role key protection

The Supabase service-role key bypasses RLS entirely and is the highest-value secret in the system. It exists only in server-side contexts — Edge Functions and the admin server runtime. It is never in any client bundle of either application. It is stored in the platform secret manager, rotated on a schedule and immediately on any suspicion, and its use is confined to a small number of clearly-identified server modules.

A specific, common and severe mistake to prevent: using the service-role key in a Next.js **client** component or in an API route that forwards unvalidated user input. A CI check should scan both bundles for the key pattern and for the anon/service key names, and fail the build on any match.

### O.9 Data privacy and minors

- **Data minimisation** (B-11): name/nickname, email, territory, exam sitting, age band. No date of birth beyond the band, no school, no address, no phone number, no photograph, no precise location, no contacts.
- **Minimum age 13, enforced at sign-up** (spec U-05, Rev 2). Accounts are refused below it. This removes the verifiable-parental-consent surface entirely, and students under 13 are not the CSEC cohort. If the mobile app later brings Google Play's Families policy into scope, the same minimum keeps EdMar outside it. **New in Rev 2:** because the product now stores a readiness reading and a projected grade band about a minor, §O.9's data-minimisation and access rules cover those too — they are among the most sensitive fields in the database, they are never shared with a third party without the student's own consent, and they are included in export and deletion.
- **No advertising identifiers, no third-party ad SDKs, no data sale.** Ever. This should be stated in the privacy policy as a commitment, because it is a genuine differentiator with parents and schools.
- **Analytics is privacy-preserving:** aggregate behavioural data, pseudonymous identifiers, no third-party analytics SDK that builds cross-app profiles of minors.
- **Rights honoured:** access, export, correction and deletion, with deletion actually deleting (attempt data anonymised or removed, not merely flagged).
- **Data residency** and applicable law across Caribbean territories, plus GDPR/UK-GDPR exposure from diaspora users, need a legal review in Phase 0.
- **Retention:** attempt data retained while the account is active and for a defined period after; audit logs longer; nothing retained indefinitely without a stated reason.

### O.10 Storage security

Published assets are public-read via CDN, which is correct and necessary for performance. **Unpublished assets are private**, because asset URLs are a classic draft-content leak. Upload paths are validated and content-typed; file size limits are enforced; uploaded SVGs are sanitised (SVG can carry script — this is a real vector and a common oversight). Storage bucket policies mirror the content status model.

### O.11 Audit logging

Per §M.11. Append-only, immutable, covering all content, taxonomy, role, entitlement and support actions. Retained beyond the operational window. Reviewable by `super_admin` only.

### O.12 Abuse prevention

Account sharing (a single subscription used by a class of thirty) is the realistic abuse case. Detect via concurrent-device and impossible-travel heuristics, respond with a soft device limit and a gentle message rather than a ban. Note that this abuse is also a _signal_: heavy sharing in a school is a school-licensing sales lead (§U).

Also covered: sign-up abuse (email verification, rate limits), report-feature abuse (rate limit, deprioritise repeat false reporters), and free-tier reset gaming (server-authoritative counters, §N.5).

### O.13 Operational security

Dependency scanning in CI; secret scanning on every commit; Supabase database backups with a tested restore procedure (an untested backup is not a backup); staging environment with synthetic data, never a copy of production student data; a written incident response process including a content-defect path (suspend the question first, investigate second); and annual penetration testing once the product carries meaningful subscriber data.

---

## SECTION P — UX / UI ARCHITECTURE

_Rev 2: rewritten for a web-first, responsive product, and aligned to the reference interface supplied by EdMar (the desktop three-pane practice screen and its phone/tablet counterparts). Where this section and the reference designs differ, the reference designs are the intent and this section is the specification of it._

### P.1 Design stance

The interface has one job: get out of the way of the mathematics. Every pixel competes with the question the student is trying to think about.

The tone is **serious tool, not toy**. The user is fifteen or sixteen, preparing for an examination that will shape their next five years. They are past cartoon mascots and confetti, and they notice being patronised. The reference points are a well-made professional utility — which is exactly what the reference designs are.

One addition in Rev 2: **the product now tells students things they may not want to hear.** A readiness reading, a projected band, a weak area worth nine marks. The interface's job around those numbers is to be calm, specific and actionable — never dramatic, never gamified, never softened into meaninglessness. A red gauge is the wrong answer; so is hiding a Grade 4 projection behind encouragement.

### P.2 Navigation and responsive structure

**Desktop and large tablet (≥1024px) — persistent left sidebar**, as in the reference design:

```
┌──────────┬──────────────────────────────────────────────────────┐
│  EdMar   │  May/June 2024 · Paper 02 · General Proficiency      │
│  CXC     │  [BUILDING UP]        ⏱ 01:24:38   ⏸ Pause  ⎋ End    │
│  MATHS   ├──────────────────────────────────────────────────────┤
│          │                                                      │
│ ▸ Home   │   ┌──────────────────┐  ┌────────────────────────┐   │
│ ▸ Practice│  │  QUESTION PANE   │  │  RESPONSE PANE         │   │
│ ▸ Papers │   │                  │  │  [Solution][Concepts]  │   │
│ ▸ Topics │   │  stem            │  │  [Quick Check][Notes]  │   │
│ ▸ Progress│  │  diagram         │  │                        │   │
│ ▸ Bookmarks│ │  answer input    │  │  the ten blocks        │   │
│ ▸ Notes  │   │                  │  │  (§G.11)               │   │
│          │   │  ◂ Prev  1..10 ▸ │  │                        │   │
│ SESSION  │   └──────────────────┘  └────────────────────────┘   │
│ 10 · 0 · │                                                      │
│ 0%       │                                                      │
│ Exit     │                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

**Tablet (768–1023px):** sidebar collapses to icons; the two panes remain side by side with the response pane narrower.

**Phone (<768px):** sidebar becomes a drawer behind a menu control; the panes stack. The question is the whole screen until the student answers; the ten blocks then appear beneath it as a **numbered accordion** — `1 QUESTION · 2 CONCEPTS REQUIRED · 3 STRATEGY · 4 GUIDED SOLUTION · 5 FINAL ANSWER · 6 WHY THIS WORKS · 7 COMMON MISTAKES · 8 EXAM TIP · 9 QUICK CHECK · 10 ANSWER VALIDATION` — with block 4 expanded by default and the rest collapsed, exactly as in the reference phone design.

The numbering is not decoration: it is the same order everywhere, so a student who learns the shape on a laptop finds it unchanged on a phone, and a teacher can say "look at block 8".

**Persistent session context.** The session strip — questions, completed, left, progress — lives in the sidebar on wide viewports and in a compact header row on narrow ones. It is never absent, because a student who cannot see how much is left does not finish.

### P.3 Screen hierarchy (routes)

```
/                        Home — readiness strip, continue, recommendation,
                         diagnostic / mock prompts, practice days
/onboarding              value → sitting → interests → first question
/auth                    sign in · sign up · reset
/practice                Module → topic → subtopic browsing, with weight + mastery
/practice/setup          count · difficulty → start
/session/[id]            THE QUESTION SCREEN (§P.4) — practice
/session/[id]/results    session results, mastery delta
/diagnostic              intro → items → coverage map (§J.9)
/diagnostic/results      coverage map, first readiness reading, top 3 by mark impact
/simulate                simulation library: forms, past attempts, best marks
/simulate/[id]           timed simulation runner (server-anchored timer, navigator)
/simulate/[id]/results   overall · per module · per CK/AK/R · time per mark
/simulate/[id]/review    every item with its full ten-block response
/progress                readiness index + trend, projected band + confidence,
                         weak areas by mark impact, strong areas, misconceptions
/progress/topic/[id]     topic detail → objective detail
/progress/history        attempt history; filters: incorrect · misconceptions · skipped
/readiness/explainer     "what is this number, and what is it not" (§J.11, §J.12)
/bookmarks  /notes       saved items and per-question notes
/account                 profile · sitting · subscription · settings · data · about
```

Admin console routes are unchanged (§M) and remain a separate application.

### P.4 The question screen — detailed

The most important screen in the product; everything else can be adequate if this one is right. The reference design is normative. Wide viewport:

```
┌───────────────────────────────────────────┬─────────────────────────────────────────┐
│  Question 9(a)(ii)             1 mark  🔖 │  [Solution] Concepts  Quick Check  Notes│
├───────────────────────────────────────────┼─────────────────────────────────────────┤
│  The diagram shows a circle with centre O.│  ① Find ∠KOL.              ∠KOL = 96°   │
│  Points K, L and M lie on the circle.     │     Given in the question.              │
│  Angle KÔL = 96°.                         │                                          │
│  Find ∠LMN.                               │  ② Use the theorem: angle at the centre │
│                                           │     is twice the angle at the           │
│            ╭───────────╮                  │     circumference on the same arc.      │
│            │  [figure] │                  │     ∠LMN is subtended by arc KL.        │
│            ╰───────────╯                  │                            ∠KOL = 2∠LMN │
│      (Diagram NOT accurately drawn)       │                                          │
│                                           │  ③ Substitute.              96° = 2∠LMN │
│            [ Tap to zoom ]                │  ④ Solve. Divide by 2.      ∠LMN = 48°  │
│                                           │  ─────────────────────────────────────  │
│   ┌─────────────────────────────────┐     │  ✓ FINAL ANSWER             ∠LMN = 48°  │
│   │  answer input (type-appropriate)│     │  ─────────────────────────────────────  │
│   └─────────────────────────────────┘     │  ┌──────────────┐ ┌──────────────────┐  │
│                                           │  │ WHY THIS     │ │ COMMON MISTAKES  │  │
│   Work it out on paper first.             │  │ WORKS        │ │ ✗ … ✗ … ✗ …      │  │
│                                           │  └──────────────┘ └──────────────────┘  │
│   ◂ Previous   Question 9 of 10   Next ▸  │  ┌──────────────┐ ┌──────────────────┐  │
│   ① ② ③ ④ ⑤ ⑥ ⑦ ⑧ ⑨ ⑩                    │  │ EXAM TIP     │ │ QUICK CHECK      │  │
│                                           │  └──────────────┘ └──────────────────┘  │
│   Skip            [  CHECK ANSWER  ]      │  ANSWER VALIDATION      ✓ VERIFIED      │
│                                           │  Marks 1 · GTR 2.5 · Reasoning · Medium │
└───────────────────────────────────────────┴─────────────────────────────────────────┘
```

**Non-negotiables on this screen:**

1. The question is never scrolled out of reach of the answer input, at any viewport width.
2. Mathematics renders legibly without zooming, and scales with the browser's text-size setting without breaking layout.
3. `CHECK ANSWER` is always reachable — bottom-right on desktop, in the thumb zone on a phone — and is disabled until input is non-empty.
4. **The response pane is genuinely empty before an answer or an explicit skip.** Not blurred, not collapsed-with-a-teaser, and not present in the DOM (§G.11 reveal policy).
5. **In practice, the timer is neutral and dismissible.** It shows elapsed session time, never a countdown, and a student can hide it. In **simulation** it is a countdown, prominent, and not dismissible — the difference between the two modes must be unmistakable at a glance, because the two modes mean different things about the student's data.
6. The question navigator is always available in a session; a student may move freely between items and return.
7. No hint before the attempt, no "show answer", no AI affordance, no advert.

**The four response tabs** on wide viewports — Solution · Concepts · Quick Check · Notes — are a re-grouping of the ten blocks, not a different model: *Solution* carries blocks 4–8 and 10, *Concepts* carries blocks 2–3, *Quick Check* is block 9, *Notes* is the student's own. On narrow viewports the same content is the numbered accordion (§P.2). One content model, two presentations.

### P.5 Result and the response pane

The verdict appears **in place**, below the answer input, keeping the student's answer visible beside the correct one — that adjacency is what makes the comparison meaningful. The response pane then populates.

```
┌────────────────────────────────────────────┐
│  Not quite                                 │   neutral, never harsh
│                                            │
│  Your answer      $470.00                  │
│  Correct answer   $540.00                  │
│                                            │
│  ⚠ You added 20% of the profit rather      │   matched common error —
│    than 20% of the cost price. This is     │   surfaced first, because
│    the most common slip on this type.      │   it is the highest-value
│                                            │   feedback in the product
└────────────────────────────────────────────┘
```

Guided-solution steps reveal one at a time with a _show all_; every other block is shown at once (§C.10). Each step carries its **result chip** on the right — the reference design's most quietly effective element, because it lets a student find the step where their own working diverged without reading the prose.

### P.6 Component inventory

| Component            | Notes                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `MathSvg`            | Renders pre-rendered SVG mathematics inline with text. The single most important component         |
| `QuestionPane`       | Stem, diagram, mark value, bookmark, navigator                                                     |
| `AnswerInput`        | Polymorphic by answer type                                                                         |
| `MathKeypad`         | On-screen keypad for touch; on desktop the physical keyboard plus a symbol palette                 |
| `FractionInput`      | Numerator/denominator, mixed-number support                                                        |
| `OptionList`         | Multiple choice, seeded order, selection state                                                     |
| `ResultPanel`        | Verdict, comparison, matched common-error note                                                     |
| `ResponsePane`       | Tabbed on wide viewports, accordion on narrow — one content model (§P.4)                           |
| `SolutionSteps`      | Progressive reveal, per-step result chips, marks                                                   |
| `ConceptChips`       | Block 2 — each chip links to practice on that objective                                            |
| `CommonMistakesCard` | Block 7, with the student's matched error promoted                                                 |
| `ExamTipCard`        | Block 8                                                                                            |
| `QuickCheck`         | Block 9 — a real input with its own validation, not a text card                                    |
| `ValidationStrip`    | Block 10 — marks · syllabus code · cognitive level · difficulty · verification badge               |
| `NotesPanel`         | Per-question notes, autosaved                                                                      |
| `QuestionNavigator`  | Numbered strip with answered/flagged state                                                         |
| `SessionTimer`       | Two modes: neutral elapsed (practice) and countdown (simulation). Server-anchored in simulation    |
| `ReadinessGauge`     | Index + confidence + trend line; **must render the "not enough evidence" state as its first-class default** |
| `GradeBandCard`      | Band + confidence + standing disclosure + link to the explainer. Cannot render without confidence  |
| `MarkImpactList`     | Weak areas with marks at stake and a start-practice action                                         |
| `CoverageMap`        | Diagnostic output; `unknown` is a distinct visual state from `weak`                                |
| `ProfileSplitChart`  | CK/AK/R breakdown for simulations                                                                  |
| `MasteryBar`         | Handles "not started" and "getting started" correctly (§J.6)                                       |
| `TopicRow`           | Name, count, exam weight, mastery, lock state                                                      |
| `DiagramView`        | Zoomable, alt-text aware                                                                           |
| `PaywallSheet`       | Contextual upgrade prompt                                                                          |
| `EmptyState`         | Including the content-starvation case (§E.4) and every evidence-floor case in §J                   |
| `OfflineBanner`      | Non-alarming, states what still works                                                              |

Two of these — `ReadinessGauge` and `GradeBandCard` — are the only components in the product whose *empty* state is more important than their populated one, because that is the state most students see for their first fortnight. They are specified accordingly and reviewed as such.

### P.7 Visual language

- **Type:** one clean, highly legible sans-serif family. Mathematics uses the MathJax serif face, which correctly signals "this is mathematics" and matches examination typography. Question text at a comfortable reading size, never below 16px.
- **Colour:** restrained, and semantic. The reference design's palette — a single blue brand accent for primary actions and active navigation; green for correct, verified and final answers; amber for tips; a muted red reserved for the *common mistakes* block rather than for the student's own wrong answer; neutral greys for structure. **Never colour alone** to convey meaning (B-17).
- **Space:** generous. Dense screens are unreadable for mathematics.
- **Motion:** minimal and fast. Transitions under 200ms. No decorative animation in the question flow.
- **Dark mode:** first-class. Students revise at night, and this is a real request.
- **Numbered blocks:** the ten-block numbering is part of the visual language, consistent across viewports and across the admin editor's preview.

### P.8 Key screens summarised

- **Home** — one readiness strip, one primary action, one recommendation. Not a dashboard.
- **Question screen** — §P.4. Everything else can be adequate if this is right.
- **Diagnostic results** — a coverage map, three named weaknesses with marks at stake, one action.
- **Simulation results** — overall, per module, per CK/AK/R, time per mark, and the marking-honesty note (§H.7).
- **Progress / readiness** — trend first, single numbers second; projected band with confidence; weak areas by mark impact; misconception profile.
- **Readiness explainer** — a real screen, not a tooltip. It is the product's honesty made legible, and it is linked from every surface that shows a number.
- **Topic list** — scannable, exam weight and mastery visible, locked items visible but marked.
- **Account / subscription** — plain, honest, cancellation clearly available.

### P.9 Brand

**[A-06]** EdMar's brand assets are now partly established by the reference designs: the EdMar wordmark with a "CXC MATHS" lockup in the sidebar, a blue primary accent, and a restrained professional register. A **design token layer** (colour, type scale, spacing, radii) must be defined once in `@edmar/design` and consumed by the web app, the admin console and the future mobile app, so that finalising the brand is a token change rather than a refactor.

Copy is written in standard Caribbean English, direct and never patronising. The EdMar mark is present in the sidebar and on About; it is absent from the question pane itself.

### P.10 Accessibility

Minimum bar (B-17): WCAG 2.1 AA — 4.5:1 contrast on all text; visible keyboard focus on every interactive element; **full keyboard operability of the question screen**, which on a web-first product is a real requirement rather than an aspiration (tab to the input, Enter to check, arrow keys through the navigator); touch targets ≥44px; respects browser text scaling to 200% without breaking layout, including mathematical layout, which is the hard part and needs explicit testing; no meaning conveyed by colour alone; alt text on every diagram; ARIA labelling on all controls; the accordion and tab patterns implemented to the WAI-ARIA authoring practices rather than approximated.

**Honestly stated limitation:** full screen-reader support for rendered mathematics remains a hard problem. Pre-rendered SVG with a LaTeX-derived label and a human-authored text description for complex expressions is the pragmatic mitigation; MathML output is a candidate improvement that the SVG pipeline can add later. A properly accessible mathematics experience is a deliberate future project (§U), not something to claim prematurely.

### P.11 Performance targets

Web targets, measured on a mid-range Android phone over 3G and on a school laptop:

| Metric                                        | Target                                          |
| --------------------------------------------- | ----------------------------------------------- |
| Largest Contentful Paint (home, cold)         | < 2.5s on mid-range mobile / 3G                 |
| Interaction to Next Paint                     | < 200ms                                         |
| Cumulative Layout Shift                       | < 0.1 — critical: mathematics must not reflow   |
| Question render                               | < 400ms from navigation                         |
| Answer verdict                                | < 50ms (local, §I) — no spinner, ever           |
| Session start (10 questions materialised)     | < 1.5s on 3G                                    |
| Practice session payload                      | < 500KB for 10 questions including assets       |
| Simulation start (60 items materialised)      | < 3s                                            |
| Readiness recomputation (server, per attempt) | < 250ms p95                                     |
| JS shipped on the question route              | < 250KB gzipped                                 |
| Error-free sessions                           | > 99.5%                                         |

The 400ms question render is the one that determines whether the product feels good, and CLS is the one that determines whether the mathematics feels trustworthy. Both are release gates rather than aspirations.

---

## SECTION Q — ANALYTICS ARCHITECTURE

### Q.1 Principles

Measure what informs a decision. Collect the minimum personal data necessary (B-11). Prefer aggregates to individual traces. Never use a third-party SDK that profiles minors across applications.

### Q.2 Student metrics

Activation: install → first question completed → account created → third session. Engagement: DAU/WAU/MAU, sessions per active student per week, questions per session, session completion rate, days active per week. Learning: questions attempted, accuracy trend, mastery movement per week, topics covered, weak areas resolved. **Assessment (new in Rev 2):** diagnostic start and completion rate and time-to-complete; simulation start, completion and abandonment; readiness index distribution and per-student movement; time from first session to first readiness reading; **projection issuance rate and confidence mix**; and the rate at which the evidence gate withholds a reading — a gate that never withholds is a gate that is not working. Retention: D1/D7/D30, and — the one that matters here — **week-N retention within an exam-sitting cohort** (§N.7).

### Q.3 Question metrics

Per question: attempts, unique students, accuracy, mean and median time, skip rate, wrong-answer distribution, common-error match rate, report count, bookmark count, **quick-check pass rate** (block 9 — the cheapest available signal that the teaching landed, and the one that identifies a question whose explanation is weak even though its answer is right), and **note-taking rate** (students writing their own note on an item is a strong signal that the item is hard or its explanation is unclear). These feed §E.13's quality loop and §E.5's difficulty calibration. The wrong-answer distribution is the single most diagnostic content metric available and should be visible in admin per question.

### Q.4 Topic and content metrics

Coverage (published questions per objective, per difficulty band, per syllabus version) with gaps ranked by examination weight — this is the content roadmap, generated rather than guessed. Also: practice volume by topic, mean mastery by topic across the base (a topic where everyone is weak may indicate a teaching gap or a content defect), and content freshness.

### Q.5 Revenue and retention metrics

MRR, ARR, paying subscribers, ARPU, free→paid conversion rate and time-to-convert, trial-to-paid, churn (monthly and by cohort), LTV, and — critically — **cohort retention indexed to exam sitting rather than calendar month**. A flat monthly churn figure for a seasonal examination product is not merely uninformative; it is actively misleading, and it will cause bad decisions if reported.

Conversion funnel: install → first question → account → limit reached → paywall viewed → purchase initiated → purchase completed. The step with the largest drop is the roadmap.

### Q.6 Practice and AI metrics

Practice: sessions started/completed, questions per session, recommendation acceptance rate (do students follow it?), paper attempts, timed mode usage.

AI/pipeline: spend by stage and by month against cap, cost per published question, pipeline throughput, validation pass rate, human approval rate by batch and by prompt version, review time per item, reviewer throughput and quality. **Cost per published question is the number that tells EdMar whether the content engine is working.**

### Q.7 Technical metrics

Crash-free rate, cold start, screen render times, API latency percentiles, sync failure and offline attempt rates, error rates by endpoint, database query performance against the §R budgets.

### Q.8 Implementation

Events are defined in a single versioned schema shared by both applications — an event taxonomy that drifts between platforms produces analytics nobody trusts. Events are written to Postgres and aggregated by scheduled materialised views; the admin dashboard reads views, never raw events, so analytics load cannot degrade the student experience. Raw events are retained for a bounded window; aggregates are retained long-term.

At the scales in §R this needs no external analytics infrastructure. Revisit only if a genuine need appears.

### Q.9 What is deliberately not collected

No precise location. No contacts, calendar or device inventory. No advertising identifiers. No third-party ad or profiling SDKs. No free-text student input beyond problem reports. No school or class affiliation until class features exist and are consented to. No date of birth beyond the age band. No behavioural data sold or shared, ever.

---

## SECTION R — SCALABILITY

### R.1 Scale tiers and what changes

| Students | Stage       | Infra                                                          | Monthly infra cost | The real constraint                                |
| -------- | ----------- | -------------------------------------------------------------- | ------------------ | -------------------------------------------------- |
| 100      | Closed beta | Supabase Free/Pro, Vercel Hobby                                | ~US$25             | Content volume                                     |
| 1,000    | Launch      | Supabase Pro, Vercel Pro                                       | ~US$50–75          | Content volume and review throughput               |
| 10,000   | Growth      | Supabase Pro + compute add-on, read replica optional           | ~US$150–400        | Query tuning, support load                         |
| 50,000+  | Scale       | Larger compute, read replica, CDN tuning, partitioned attempts | ~US$800–2,000      | Support and content operations, not infrastructure |

The consistent theme: **infrastructure is never the binding constraint on this product.** Content and people are. At 50,000 students the infrastructure bill is roughly 1% of revenue.

### R.2 Load characteristics

The read/write ratio is heavily read-dominated and the read set is small, highly cacheable, and identical for every student — the same 3,000 questions served repeatedly. Writes are small, append-only attempt rows. This is close to the easiest possible workload for Postgres.

Traffic is _extremely_ peaky by season, and peaky by hour within a day (evenings). Peak-to-trough across the year may be 10:1. Provision for the April–May peak; do not right-size for the August trough.

Estimating at 50,000 students, 20% daily active, 20 questions each: 200,000 attempt writes per day, concentrated into perhaps six evening hours — roughly 10 writes per second average, with peaks well inside what a single well-indexed Postgres instance handles comfortably.

### R.3 Database scaling

- **Index deliberately** for the selection function's filter chain (§E.4) — status, curriculum links, difficulty, and the student's recent-attempt lookup are the hot paths.
- **Denormalised question payloads** (§E.2) so the read path is a single indexed row fetch, not a multi-table join.
- **Partition the attempts table** by time once it passes tens of millions of rows. Plan the partition key now; implement when needed.
- **Materialised views** for all analytics and for mastery rollups above skill level, refreshed on a schedule rather than computed per request.
- **Incremental mastery updates** on attempt write (§J.4), with a scheduled full recomputation available for algorithm changes.
- **Connection pooling** via Supabase's pooler from the outset — a mobile client base opens far more connections than a web app, and this is the most common way a Supabase-backed mobile product falls over.
- **Read replica** at the 10,000+ tier if analytics or admin load becomes visible in student latency. Probably unnecessary before then.

### R.4 Content and CDN scaling

Diagrams are static, immutable and CDN-cached with long TTLs — the cache hit rate should approach 100% and bandwidth cost stays trivial. Pre-rendered LaTeX SVGs likewise. Service-worker caching of practice content in the browser means a returning student re-downloads almost nothing, which matters on metered connections as much as it does for cost.

### R.5 Client scaling

Practice payloads are materialised and cached per session; the client keeps recently-used topics locally and invalidates by `content_version` (§E.12). Attempts queue offline and sync in batches. As the bank grows, nothing about the client's working set grows — it only ever holds the current topic.

### R.6 AI cost scaling

**AI cost does not scale with students at all** (§L). It scales with content volume, which is a business decision under direct control. At 50,000 students the AI line is the same as at 100.

### R.7 Operational scaling

The things that actually get harder:

- **Support volume** grows linearly. Plan for self-service help, a good problem-report flow, and a support role in admin (§M.9) before it becomes urgent.
- **Content review** is the permanent constraint (§K.7). Scaling means more qualified reviewers and better tooling, and the tooling investment has better returns.
- **Content freshness** — each new sitting produces new past papers; each syllabus change produces re-mapping work.
- **Territory expansion** brings payment, currency and calendar variation (§A.5).

### R.8 What would need re-architecting, and when

Honestly: very little, and not soon.

- Beyond ~200,000 students, consider separating analytics into a dedicated store.
- If real-time class features arrive (V2+), evaluate Supabase Realtime capacity properly rather than assuming.
- If AI ever moves onto the student path — which this blueprint recommends against — the entire cost model changes and would need rebuilding. This is the strongest practical argument for holding the line on B-6.

---

## SECTION S — DEVELOPMENT ROADMAP

_Rev 2: re-sequenced for web-first delivery with the assessment engine in MVP. Eight phases. Phases 0–4 deliver MVP; 5–6 deliver V1; 7 is V2 and includes the mobile application. Durations assume a small team (1–2 engineers, 1 designer part-time, 1–2 qualified content reviewers) and are indicative._

### Phase 0 — Foundation and decisions _(2 weeks)_

**Objective:** eliminate the unknowns that could invalidate the build.

**Work:** resolve the content-rights position (§V R-01) with legal input — _this gates the past-paper library, though no longer the simulation capability (§H.1)_; confirm EdMar's copyright in the 2026 workbook (spec U-01); choose and verify the **web payment processor** for the launch territories (§N.6); verify the V2027 taxonomy extract, including the 44 objectives flagged for human review (spec §0.3) — _this is on the critical path from day one_; **write the readiness and projection rule sets, v1, on paper, and have them reviewed by a qualified mathematics educator before any code exists** (§J.11–J.12); confirm the minimum-age decision (spec U-05); secure reviewer capacity; set up repository, environments, CI and secret management.

**Deliverables:** rights decision memo; processor decision; verified taxonomy; **a written, reviewed, versioned readiness and projection specification**; environment and CI skeleton; confirmed assumptions register.

**Completion criteria:** every assumption in §0.3 is either confirmed or has an owned mitigation, and the projection rule set exists as a document that a mathematics educator has signed. **No code before this phase completes.**

### Phase 1 — Data foundation and spikes _(3 weeks)_

**Objective:** the schema and the risky unknowns.

**Work:** implement the full data model (§F, §G including the ten-block model, §J.2) with migrations; RLS policies for every table plus the RLS test suite (§O.3); seed the V2027 taxonomy with examination weights per topic — _the weights are load-bearing for §J.7 and §J.11, not decoration_; **spike: mathematics rendering in the browser** against 200 real expressions, including CLS measurement; **spike: deterministic answer validation** in the shared package with cross-environment property tests (§I.3); **spike: the readiness and projection computation** against a synthetic attempt log, tested for determinism and for the withholding behaviour; pilot the content pipeline on 50 real questions **through all ten blocks** and measure actual per-question AI cost (§L.7).

**Completion criteria:** a question can be created, validated, reviewed, published and read by a student-role client entirely through the database with correct authorisation; the three spikes have written answers; **the same synthetic attempt log produces identical readiness output on two clean databases**.

### Phase 2 — Content pipeline and admin _(4 weeks, overlapping Phase 3)_

**Objective:** the machine that makes the product's value, and enough tooling to run it at throughput.

**Work:** ingestion and extraction (§K.3); classification and mapping with human confirmation (§K.4); **ten-block drafting** (§K.5); the full deterministic validation suite (§K.6) including CAS verification and the block-5-versus-answer-spec check; duplicate detection (§E.10); admin authentication and roles; question editor with live preview **of all ten blocks as the student will see them** (§M.4); review queue with keyboard flow (§M.5); curriculum management including examination weights (§M.7); audit logging (§M.11).

**Completion criteria:** a reviewer sustainably reviews 30+ questions per day — **against the ten-block standard**, which is a harder bar than Rev 1's and must be measured against it, not against Rev 1's. If the ten-block standard cannot reach 30/day, the pipeline is not good enough yet; lowering the standard is not the available response.

### Phase 3 — Web application core _(5 weeks)_

**Objective:** the practice loop, complete and fast, in the browser.

**Work:** Next.js app scaffolding, routing (§P.3), design tokens; authentication and onboarding through to first question (§C.1); topic browsing with weights; practice setup; **the question screen** (§P.4) — responsive three-pane and accordion, all MVP answer types, local validation, result with matched common errors, the full ten-block response pane, notes, navigator; session results; PWA service-worker caching and the attempt sync queue (§E.9); the selection function (§E.4).

**Completion criteria:** a student completes a 10-question session, loses their connection mid-session, finishes, and sees correct mastery on reconnection — on a phone browser and on a laptop.

### Phase 4 — Assessment engine, entitlement, MVP close _(4 weeks — one week longer than Rev 1)_

**Objective:** the capabilities that make this product what Rev 2 says it is.

**Work:** mastery computation (§J.4) with incremental update and full recompute; **the diagnostic** (§J.9) end to end including the coverage map; **Paper 01 simulation** (§H.6) with server-anchored timing, navigator, flagging, auto-submit, and per-module and CK/AK/R results (§H.7); **the readiness index** with its evidence gate, confidence and trend (§J.11); **the projected grade band** with all eight governance rules and its explainer screen (§J.12); **weak areas by mark impact** (§J.7); the monitoring view (§J.13); recommendation (§J.8); entitlement and server-authoritative free-tier limits (§N.5); **live web billing** (§N.6); paywall placement; the admin calibration view (§M.10); bookmarks; problem reporting; error reporting and analytics (§Q.8).

**Completion criteria:** §W.1 satisfied, **≥1,200 published ten-block questions with coverage sufficient to materialise a blueprint-conformant Paper 01**, and a fresh account that answers three questions is correctly told it does not yet have enough evidence for a reading.

### Phase 5 — Beta _(4 weeks)_

**Objective:** find out what is actually wrong — including whether the numbers are believable.

**Work:** closed beta with 50–100 real students, ideally through one or two schools; instrument everything; daily triage; content correction driven by real wrong-answer distributions (§Q.3); performance tuning on real devices and networks; iterate on the paywall and the free limit; **and, specifically, test the readiness and projection surfaces against teachers** — a mathematics teacher looking at a student's projected band and saying "that is about right" or "that is nonsense" is the only calibration signal available before a real sitting, and it is worth more than any amount of internal review.

**Completion criteria:** §W.2. Plus: no unresolved mathematical accuracy defect; ≥60% of beta students completing three or more sessions unprompted; ≥50% completing the diagnostic; and no teacher-flagged projection that the team cannot explain from the evidence.

### Phase 6 — V1 launch _(6 weeks)_

**Objective:** a paid public product.

**Work:** Paper 02 and modular simulation forms; structured multi-part answers (§I.10); past paper library _if and only if rights permit_; expand the bank to ≥3,000; **the first real back-test of the projection against a completed sitting** (§J.12 rule 7) — which may fall after launch depending on the calendar, and if so is a hard-dated commitment rather than a backlog item; email notifications; account deletion and data export; admin analytics; terms, privacy policy, non-affiliation and projection disclosures.

**Completion criteria:** §W.3–§W.5.

### Phase 7 — V2 _(ongoing, 4–6 months post-launch)_

**The React Native mobile application**, consuming the shared packages and conforming to web behaviour (I-8); Google Play Billing alongside web billing with the cross-platform entitlement test (§N.6); iOS; full V2027 modular entry paths; adaptive practice and item calibration (§J.10, §J.14); calibrated projection successor validated by comparison before switchover; class/teacher accounts; variant generation at scale; continued content growth toward 6,000+.

### S.1 Critical path

```
Rights decision ──────────► Past-paper library only (NOT simulation)

Taxonomy verification ───► Content pipeline ──► REVIEWED TEN-BLOCK CONTENT VOLUME ──► Launch
                                │                         │
Readiness/projection spec ──────┤                         │
   (written, reviewed, Ph 0)    │                         │
                                │                         │
   Web app development ─────────┘  (parallel; finishes earlier)
                                                          │
                                    Blueprint-conformant simulation
                                    requires the right MIX of items,
                                    not only the right volume ────────┘
```

**The application will be finished before the content is.** This remains the single most important scheduling insight in this document, and Rev 2 sharpens it in two ways. First, the ten-block standard raises the per-question authoring and review cost, so content is *further* along the critical path than it was in Rev 1 — this is a deliberate trade of speed for a quality floor competitors cannot cheaply match. Second, examination simulation needs a specific *composition* of items — per module, per topic, per profile dimension — so content planning must track the blueprint's mix from the first day of review, not discover the gap at Phase 4. Track coverage against the blueprint weekly from Phase 2 onward.

---

## SECTION T — MVP DEFINITION

### T.1 The MVP question

_What is the smallest thing that a Fifth Form student would pay US$4/month for?_

**Rev 2's answer:** an honest, specific, continuously-updated answer to *"where do I stand, what will cost me marks, and what do I do about it"* — backed by enough correctly-worked practice, a real diagnostic and a real mock paper to make that answer trustworthy.

Rev 1's answer was "enough correctly-worked practice questions". That is now the *substrate*, not the product. The distinction is the whole of this revision.

### T.2 In scope

**Web only** (responsive, PWA-installable). Anonymous first-run practice; email and Google authentication with minimum-age enforcement. The V2027 taxonomy with examination weights, V2018 structurally supported. Topic and subtopic browsing. Practice sessions of 5/10/20 with difficulty selection. Multiple-choice, numeric, decimal and fraction answers with deterministic in-browser validation. **The full ten-block response on every question** (§G.11), including the quick check and the visible validation strip. Per-question notes. **The diagnostic** with its coverage map. **Paper 01 examination simulation** with server-anchored timing and per-module and CK/AK/R results. **The readiness index** with confidence, evidence gate and trend. **The projected grade band** with all eight governance rules and its explainer. **Weak areas ranked by mark impact.** The student monitoring view including the misconception profile. Attempt recording with offline queue and sync. Per-skill and per-topic mastery. Session results with mastery delta. Single recommended practice with its reason and value. Free tier with a daily limit; premium entitlement enforced; **live web billing**. Admin console: editor with ten-block preview, review queue, curriculum, publish, audit, cohort monitoring and projection calibration. Content pipeline with deterministic validation and human review. **≥1,200 published ten-block questions, composed to support a blueprint-conformant Paper 01.**

### T.3 Out of scope — binding

The following are **not** built for MVP, and a request to add one is a scope change requiring an explicit decision, not a judgement call:

The mobile application (iOS or Android). Google Play Billing. Paper 02 and modular simulation forms. The past-paper library of real CXC papers. Structured multi-part answers. Algebraic-expression answers beyond Tier 1 (§I.9). Adaptive difficulty beyond the three modes. Spaced repetition. Item calibration. Teacher, class, school or parent accounts, in any form. Any sharing of an individual student's readiness or projection with a third party. Push notifications. Offline topic packs. Annual plan. Leaderboards, achievements, streaks beyond a simple weekly count. Social features. Certificates. Referrals. Multi-language. Proctoring or any monitoring of the student's device during a simulation. Variant generation at scale. Any student-facing AI, in any form. **Any AI anywhere in scoring, readiness or projection, in any form.**

### T.4 The two real MVP gates

Rev 1 had one gate. Rev 2 has two, and the second is new.

**Gate 1 — 1,200 published, human-reviewed, ten-block questions, composed to the blueprint.**

Not "the app works". A practice bank of 200 questions is a demonstration, not a product. Coverage matters as much as volume: 1,200 questions concentrated in three topics is worse than 900 spread properly. And in Rev 2 *composition* matters as much as coverage — a Paper 01 simulation needs 60 items at the right per-module, per-topic and per-profile-dimension mix, so the bank must be built against the blueprint from the start rather than sampled from at the end.

At 30–60 reviewed questions per reviewer-day *against the ten-block standard*, 1,200 questions is 20–40 reviewer-days. **Plan it, staff it, start it early** (§S.1).

**Gate 2 — the assessment engine is honest.**

Demonstrated, not asserted, by four checks:

1. A fresh account answering three questions is told, clearly, that there is not enough evidence for a reading — and is told what would produce one.
2. The same attempt log produces the same readiness index and the same projected band on a clean database, every time (I-6).
3. A student who has ground easy items to a high practice accuracy but has sat no simulation **cannot** receive a high-confidence projection (§J.12 rule 3).
4. Every surface showing a band shows its confidence and its disclosure (I-7), verified by an automated test rather than by inspection.

**A build that passes Gate 1 and fails Gate 2 must not launch.** It would be a practice app making a promise, which is precisely the product R-09 warns about.

### T.5 MVP success criteria

| Metric                                                    | Target           |
| --------------------------------------------------------- | ---------------- |
| Beta students completing 3+ sessions unprompted           | ≥60%             |
| Beta students completing the diagnostic                   | ≥50%             |
| Beta students completing ≥1 timed simulation              | ≥30%             |
| Questions per active student per week                     | ≥30              |
| Week-2 retention (beta cohort)                            | ≥40%             |
| Students who open the readiness screen more than once     | ≥50%             |
| Teacher-flagged projections the team cannot explain       | **0**            |
| Mathematical accuracy defects reaching students           | **0 unresolved** |
| Error-free sessions                                       | >99%             |
| Question render time                                      | <400ms (p90)     |
| Stated willingness to pay US$4/month (beta survey)        | ≥30%             |

Three rows carry a target of zero or near it, and they are the non-negotiable ones: accuracy defects, unexplainable projections, and — implicitly — any surface that shows a number without its confidence.

---

## SECTION U — FUTURE ROADMAP

Directional, deliberately uncommitted, and constrained by one rule: **nothing here may complicate MVP architecture.** Each item below is reachable from the architecture as specified without re-platforming, which is the test that was applied in choosing them.

**Additional CXC subjects.** The taxonomy is rooted at SUBJECT (§F.7) and the content model is subject-agnostic except for answer types. Physics, Chemistry, Biology and Additional Mathematics are the natural extensions — all quantitative, so the deterministic answer system carries over. Subjects with essay answers are a genuinely different product and should be treated as such.

**CSEC Additional Mathematics.** Smallest extension, most similar content, and a natural upsell to exactly the students most likely to already be subscribers.

**CAPE Mathematics (Units 1 and 2).** Follows the same students forward, extending lifetime value into the years after CSEC. Requires calculus notation in the LaTeX allowlist and richer expression validation, both of which are extensions rather than rewrites.

**Wider territory coverage.** Already architecturally supported (§A.5). Work is commercial and operational, not technical.

**School and class accounts.** A teacher creates a class, assigns practice, sees aggregate performance. Deliberately _aggregate_ — individual surveillance of students changes the product's relationship with its users and should be resisted. Requires class entities, invitation flows, and careful consent handling for minors.

**School licensing.** The entitlement model is already source-agnostic (§N.5), so a school licence is a new entitlement source rather than new architecture. Commercially attractive: higher contract value, lower churn, and the account-sharing signal in §O.12 is the lead-generation mechanism.

**Competitions and leaderboards.** Class- or school-scoped only, never global (§D.7). Time-bounded events rather than permanent rankings.

**Certificates.** Topic mastery certificates as a motivational artefact. Cheap; must not imply CXC accreditation, which would be both false and legally exposed.

**Sophisticated adaptive practice.** Item calibration and knowledge tracing (§J.10), enabled by accumulated attempt data. The data model already supports it.

**Step-level solution help.** "I'm stuck at step 3" — precomputed sub-explanations per solution step. Notably, this delivers most of what students want from an AI tutor while remaining fully precomputed and free at runtime. It is the right answer to the inevitable "why can't they just ask the AI?" pressure.

**Parent progress summaries.** Weekly email digest. Requires consent and careful framing — a report that reads as surveillance damages the student relationship.

**Accessible mathematics.** Proper screen-reader support for mathematical content (§P.10). Difficult, valuable, and honest to defer rather than half-do.

**Printable worksheets.** Teachers ask for these constantly. Low effort given the content model, high goodwill, and a genuine acquisition channel.

---

## SECTION V — RISK REGISTER

Scored as Likelihood (L) × Impact (I), each 1–5. Ordered by severity. Every risk has a named mitigation and an early-warning signal, because a risk without a detection mechanism is a surprise waiting to happen.

### R-01 · Copyright and licensing of CXC past papers — **L4 × I5 = 20 · CRITICAL**

**The risk.** CXC past papers, mark schemes and syllabus documents are the copyright of the Caribbean Examinations Council. Reproducing past-paper questions in a commercial product without a licence is infringement. Exposure includes takedown demands, removal from Google Play, damages, and the loss of a large share of the question bank — potentially after launch, when students have paid.

This is the risk most likely to end the product, and it is worth being blunt: the fact that many regional revision products do this anyway is not a defence, and a takedown after launch is far worse than a constraint before it.

**Mitigation, in order:**

1. **Obtain a written legal opinion in Phase 0, before building content.** This is the highest-value two weeks in the whole project.
2. **Approach CXC directly about licensing.** CXC does license content commercially. A licence would be a genuine competitive moat, not merely a compliance measure.
3. **Design the fallback now and make it good.** Original questions authored to the syllabus, in authentic CSEC style, correct format, correct difficulty distribution — a legitimate and well-established publishing model. §K.5's variant generation makes this economically viable at a scale that would have been impossible manually.
4. **Provenance is a first-class field** (§E.7) so that any affected content can be identified and withdrawn in a single query, and §M.8 provides the withdrawal control.
5. Never reproduce mark schemes, syllabus text verbatim beyond fair dealing, or CXC branding.

**Early warning:** any communication from CXC; a competitor receiving a takedown.

**Owner:** founder/legal. **Gate:** Phase 0 must not close without a decision.

### R-02 · Trade mark and implied endorsement — **L3 × I4 = 12 · HIGH**

CXC®, CSEC® and CAPE® are trade marks. Using them in a way suggesting affiliation invites action and may breach store policies.

**Mitigation:** descriptive nominative use only ("practice for CSEC Mathematics"), never as a leading brand element; a clear non-affiliation disclaimer on the store listing, About screen and website; no CXC logos, colours or document styling; legal review of the store listing before submission.

### R-03 · Mathematical inaccuracy reaching students — **L4 × I5 = 20 · CRITICAL**

A wrong answer or a flawed worked solution destroys trust disproportionately. One screenshot in a class WhatsApp group reaches three hundred students, and the correction never travels as far as the error.

**Mitigation:** the layered gates in §K.6 (deterministic validation, with independent CAS verification of the final answer as the highest-value single check) and §K.7 (qualified human review); wrong-answer-distribution monitoring (§Q.3) as the empirical detector; one-click suspension (§E.11) with a strong bias toward suspending immediately and investigating afterwards; in-app student reporting (§E.13); a rolling audit of published content; a golden-set regression suite for any prompt or model change (§K.9).

**Early warning:** a spike in reports on a question; an accuracy outlier; a wrong answer given by more than half of students.

**This is the risk that most justifies the architecture in this blueprint.** Precomputed, reviewed, versioned content is defensible; per-attempt generation is not.

### R-04 · AI-generated content quality and hallucination — **L4 × I4 = 16 · HIGH**

Models produce plausible, confident, wrong mathematics — including solutions whose steps look right and whose answer is not.

**Mitigation:** AI never publishes; validation is deterministic and of a _different kind_ than generation (§L.3); CAS-verified answers with automatic rejection on disagreement; bounded regeneration attempts; per-batch approval-rate monitoring with the ability to stop a bad run; prompt versioning and golden-set regression; reviewer quality measurement. Above all: **the review gate is never relaxed** (B-14), including for "high-confidence" items.

### R-05 · Content volume insufficient at launch — **L4 × I4 = 16 · HIGH**

A thin bank produces immediate churn among exactly the motivated students the product needs, and that churn is not recoverable.

**Mitigation:** treat 1,200 reviewed questions as the launch gate, not the app (§T.4); secure reviewer capacity in Phase 0; begin reviewing the moment the admin tool works, months before the app is ready (§S.1); measure reviewer throughput weekly against the plan; use variant generation to multiply approved questions; monitor coverage gaps continuously (§Q.4) and direct effort by examination weight.

**Early warning:** review queue draining slower than planned in any single week. Act on the first week, not the fourth.

### R-06 · Legacy JSON quality below expectation — **L3 × I4 = 12 · HIGH**

The seed dataset may contain OCR-mangled mathematics, wrong answers, inconsistent LaTeX, missing diagrams or duplicates (§G.9).

**Mitigation:** assess it in Phase 0 before planning around it; **have a human read a random sample of 50 records in full before any assumption of quality is made**; run every record through the same validation and review gates as new content — no exceptions for legacy data, however tempting given volume; keep legacy IDs for traceability; be prepared to discard records whose repair costs more than authoring fresh.

### R-07 · Syllabus transition (V2018 → V2027) mishandled — **L3 × I4 = 12 · HIGH**

Content mapped only to V2018 becomes progressively worthless from 2027; students sitting the new syllabus are mis-served, and re-tagging thousands of questions by hand is a project in itself.

**Mitigation:** the dual-version taxonomy and mapping table (§F.6), built in Phase 1 rather than retrofitted; exam sitting captured at onboarding; new content authored against V2027 by default once mapping exists; **[VERIFY-CXC-02]** transcription by a qualified human, never inference.

**Opportunity, not just risk:** being ready for V2027 before incumbents is a real, time-limited advantage.

### R-08 · Student engagement and retention below viability — **L4 × I4 = 16 · HIGH**

Students install, try it twice, and stop. The most common outcome for education apps.

**Mitigation:** value before registration (§C.1); the mastery loop as the return reason (§J); a single explained recommendation rather than a menu; a fast, rhythmic question flow (§P.11); restrained, non-manipulative engagement mechanics; measure honestly and by exam cohort (§Q.5); beta-gate on 60% of students completing three or more sessions unprompted (§T.5) — if that number is not met, the problem is the product, and shipping harder will not fix it.

### R-09 · Over-promising on outcomes — **L3 × I5 = 15 · HIGH** _(rewritten in Rev 2)_

Rev 1 held this risk to zero by refusing to make any outcome claim at all. Rev 2 builds a projected grade band, and therefore **accepts and manages** this risk rather than avoiding it. The exposure is real and it has three faces: a student who relied on a projection and was let down; a parent or consumer body treating a projection as a representation about a service outcome; and reputational damage if EdMar's projections are seen to be systematically flattering.

**Mitigation — the eight rules in §J.12, in full, are the mitigation.** Bands not points; confidence always displayed; an evidence gate including a timed simulation; deterministic and reproducible computation; a one-screen explanation; a standing in-product disclosure; a published internal back-test with a **pre-committed withdrawal criterion**; and an absolute prohibition on the projection appearing in any marketing or acquisition material. Additionally: legal review of the disclosure wording before public launch; the readiness explainer as a real screen rather than a tooltip; and marketing claims reviewed for substantiability with testimonials used only where genuine and attributable.

**Residual risk after mitigation: MEDIUM.** It cannot be driven to low while the feature exists, and that is the trade Rev 2 makes knowingly. The single most important control is rule 7's withdrawal criterion — the pre-commitment that a projection which cannot be shown to be accurate is removed rather than disclaimed. **That decision must have a named owner before launch**, because it will be argued against under commercial pressure at precisely the moment it matters.

### R-17 · Projection miscalibration — **L4 × I4 = 16 · HIGH** _(new in Rev 2)_

Distinct from R-09, which is about *claiming*; this is about *being wrong*. At MVP there is no back-test data at all, so the initial mapping from readiness to grade band is a reasoned construction, not a calibrated model. Two failure directions, with asymmetric costs: **optimistic** projections harm students who stop working and then fail, and are the reputational catastrophe; **pessimistic** projections demoralise students and cause churn, which is merely expensive.

**Mitigation:** a deliberately conservative initial mapping that does not project a top band on thin evidence; wide bands at low confidence rather than narrow bands with hedged language; the evidence gate, which withholds rather than guesses; teacher review of real students' projections during beta (§S Phase 5) as the only pre-sitting calibration signal available; a back-test at the first sitting with directional bias explicitly measured, not only hit rate; and the §J.12 withdrawal criterion. **Every projection stores the rule-set version that produced it**, so a recalibration can be evaluated retrospectively against stored attempt logs rather than only prospectively.

### R-18 · Web-platform exposure — **L3 × I3 = 9 · MEDIUM** _(new in Rev 2)_

Web-first trades store-policy risk for a different set: content extraction is easier from a browser than from a compiled app (§O.6); there is no store review, so a bad deploy reaches every student at once rather than through a staged rollout; payment fraud and chargebacks are EdMar's problem rather than the store's; and browser and device variability is wider than a curated Android matrix.

**Mitigation:** practice surfaces behind authentication and excluded from indexing; per-account rate limiting on question fetches with anomaly alerting (§O.6, §O.12); no bulk content endpoint, ever; staged rollout by traffic percentage with automated abort on error-rate regression; a tested rollback path; processor-side fraud tooling plus a chargeback procedure; and a defined browser support matrix tested in CI. Note that the same properties cut the other way — a content or scoring correction reaches every student on their next page load, which for a product that makes projections is a material *reduction* in risk relative to a mobile release train.

### R-10 · Google Play policy and payment availability — **L3 × I3 = 9 · MEDIUM** _(downgraded in Rev 2)_

Web-first removes this from the launch critical path; it returns with the mobile release in V2. Rejection or removal over: minors' data handling, subscription disclosure, misleading claims, or IP complaints. Separately, Play billing may not be workable in some target territories **[A-04]**. **New in Rev 2:** the projected grade band is exactly the kind of feature that attracts a "misleading claims" review, which is a further reason for §J.12 rule 8 — it must not appear in the store listing.

**Mitigation:** Families-policy compliance designed in from Phase 0 (§O.9); clear subscription disclosure and easy cancellation; no misleading claims (R-09); territory-by-territory billing verification in Phase 0; a fallback plan for payment where Play billing is unavailable; account deletion and data export built before submission, not after.

### R-11 · Subscription economics weaker than modelled — **L3 × I3 = 9 · MEDIUM**

Free-to-paid conversion below expectation, or seasonal churn steeper than planned.

**Mitigation:** free-tier limit tunable server-side without a release (§N.3); paywall placed at the moment of demonstrated need (§C.13); annual plan promoted in January–February to convert seasonal users; a cost structure with 95% contribution margin that tolerates a wide range of conversion outcomes (§L.7); cohort-based measurement so seasonality is not mistaken for failure.

### R-12 · Security breach involving minors' data — **L2 × I5 = 10 · MEDIUM–HIGH**

Low likelihood given data minimisation, severe impact given the population.

**Mitigation:** the whole of §O, with emphasis on data minimisation as the primary control — data not collected cannot be breached; RLS as the enforcement boundary with a dedicated test suite; service-role key discipline and CI secret scanning (§O.8); MFA on all admin accounts; tested backups; a written incident-response plan including notification obligations.

### R-13 · Bulk content extraction by a competitor — **L3 × I3 = 9 · MEDIUM**

**Mitigation:** no bulk endpoint exists (§O.6); session-scoped delivery; rate limiting and volume anomaly detection; free-tier limits. Accept partial exposure as unavoidable and compete on the growth and verification of the bank rather than on secrecy.

### R-14 · LaTeX rendering failure on real devices — **L3 × I3 = 9 · MEDIUM**

Mathematics that renders incorrectly, slowly, or as raw source makes the product look amateur instantly.

**Mitigation:** the Phase 1 spike against 200 real expressions on low-end hardware (§G.8); a restricted command allowlist; render-verification in CI for every published expression; **pre-rendered SVG fallback so raw LaTeX can never be shown to a student**; a device test matrix weighted toward low-end Android.

### R-15 · Scalability or cost surprise — **L2 × I3 = 6 · LOW–MEDIUM**

**Mitigation:** the architecture is read-dominated and cheap (§R); hard AI spend caps with a circuit breaker (§L.6); per-job cost estimates requiring confirmation; monthly cost review against §L.7's model; no per-student marginal AI cost by construction.

### R-16 · Key-person dependency on content reviewers — **L3 × I3 = 9 · MEDIUM**

A single qualified reviewer is a single point of failure for the product's core asset.

**Mitigation:** contract at least two from the start; document review standards so the role is transferable; measure and compare reviewer quality; build reviewer tooling that reduces the expertise required for routine confirmations while preserving it for judgement.

### V.1 Risk summary

_Rev 2 adds R-17 (projection miscalibration, HIGH) and R-18 (web-platform exposure, MEDIUM), rewrites R-09 upward in impact and downward in avoidability, and downgrades R-10 from the launch path. The risk register's centre of gravity has moved: in Rev 1 the top risks were rights and content accuracy; in Rev 2 they are rights, content accuracy **and the honesty of the numbers the product now reports**._


| Severity             | Risks                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Critical (16–25)** | R-01 rights · R-03 mathematical accuracy · R-04 AI quality · R-05 content volume · R-08 engagement                         |
| **High (10–15)**     | R-02 trade mark · R-06 legacy data · R-07 syllabus transition · R-09 over-promising · R-10 store policy · R-12 data breach |
| **Medium (6–9)**     | R-11 economics · R-13 extraction · R-14 rendering · R-15 cost · R-16 key person                                            |

Two of the five critical risks — R-01 and R-06 — are resolved by _investigation_ rather than by building, which is the argument for Phase 0 existing at all.

---

## SECTION W — DEFINITION OF DONE

Each gate is cumulative: nothing passes a later gate without having passed the earlier ones.

### W.1 Ready for internal testing

**Product:** the complete loop works end to end — onboarding, authentication, topic selection, session, all MVP answer types, result, **all ten response blocks**, session results, mastery update, progress screen. The diagnostic runs and produces a coverage map. A Paper 01 simulation runs with a server-anchored timer and produces per-module and CK/AK/R results. The readiness index computes, and correctly **withholds** itself below the evidence floor. Attempt sync works after a connection loss. The free-tier limit is enforced server-side.

**Content:** ≥300 published questions across at least five topics. Every one has passed deterministic validation and human review, **and carries all ten blocks**. Zero known mathematical errors in published content.

**Engineering:** all migrations apply cleanly from empty; RLS test suite passes with negative tests for every role; answer-validation suite passes including adversarial inputs; browser and server normalisation are property-tested against each other; **the readiness and projection computations are property-tested for determinism — same attempt log, same output, on a clean database**; the mathematics corpus renders without failure; CI green; no secrets in any client bundle (automated check).

**Operations:** staging environment with synthetic data; admin console usable by a reviewer; audit logging active; error reporting active.

### W.2 Ready for beta testing

Everything in W.1, plus:

**Product:** feature-complete against §T.2. Recommended practice works and states its reason *and its mark value*. The projected band renders, with confidence, behind its evidence gate, and its explainer screen exists. Problem reporting works and reaches admin. Paywall, upgrade flow and **live web billing in test mode** work with entitlement enforced.

**Content:** ≥1,200 published questions with ≥100 per major topic spanning difficulty bands 1–4, common-error data on all multiple-choice questions, and enough items at the right profile-dimension mix to materialise a blueprint-conformant Paper 01 simulation. **A simulation that cannot be built to the official blueprint is a content gap, and it is measured as one.**

**Quality:** performance targets met (§P.11) on a mid-range Android phone over 3G *and* on a laptop; error-free rate >99% in internal use; no critical or high defects open; end-to-end journey tests passing; **accessibility audit passed at WCAG 2.1 AA on the question screen and the readiness screens**.

**Compliance:** minimum-age enforcement implemented and tested; privacy policy and terms drafted; non-affiliation notice present; **the projection disclosure present on every surface that shows a band** (I-7), verified by an explicit test rather than by inspection.

**Governance:** the projection back-test instrument exists in the admin console and produces output on synthetic data, even though no real outcomes exist yet (§J.12).

**Operations:** beta cohort recruited; feedback channel live; daily triage scheduled; rollback procedure documented and tested.

### W.3 Ready for production

Everything in W.2, plus:

**Validated:** beta success criteria met (§T.5) — in particular ≥60% of beta students completing three or more sessions unprompted, ≥50% completing the diagnostic, ≥30% completing at least one simulation, and **zero unresolved mathematical accuracy defects**.

**Projection governance:** all eight rules in §J.12 verifiably implemented; the conservative initial mapping reviewed and signed off by a qualified reviewer; the withdrawal criterion written down and owned by a named person.

**Product:** all beta-identified critical and high defects resolved; free-tier limit tuned against observed conversion; onboarding refined against observed drop-off.

**Content:** ≥3,000 published questions for a V1 launch; coverage gaps closed against examination weighting; content correction backlog cleared.

**Engineering:** load tested at 10× expected launch traffic; database backups verified by a **tested restore**; monitoring and alerting on error rate, latency, crash rate, sync failure and AI spend; incident response documented with an on-call owner.

**Legal:** **rights position resolved and documented** (R-01); trade mark and disclaimer review complete; privacy policy and terms legally reviewed and published; data-protection obligations across launch territories confirmed.

### W.4 Ready for public web launch

Everything in W.3, plus:

Marketing site and product copy reviewed for substantiability — **no outcome claims, and no mention of the projected grade anywhere in acquisition material** (§J.12 rule 8). Privacy policy and terms live and linked from the footer and from sign-up. Account deletion and data export available in-app. Cookie and analytics disclosure accurate and matching actual behaviour. Custom domain, TLS, and a tested rollback of the deployed build. Staged rollout by traffic percentage with defined abort criteria. Error rate and Core Web Vitals within §P.11 thresholds on the production build over a week of real traffic. SEO basics for the marketing surfaces only — **the practice surfaces are behind auth and are not indexed**, which also protects the bank from bulk extraction (§O.6). Support channel staffed and responsive.

_Google Play launch criteria (store listing, content rating, data safety, families policy, signed build, ANR thresholds, in-app deletion route) move to the mobile release in V2 and are retained in §D.4._

### W.5 Ready for paid subscriptions

Everything in W.4, plus:

Web billing integrated with **server-side verification of every payment event** — never client-trusted. Webhooks handled for payment success, renewal, failure, cancellation, refund, dispute and chargeback. Entitlement enforced at the database layer, verified by test. Subscription state reconciled correctly after a network failure mid-purchase. Price, billing period, renewal terms and cancellation route clearly disclosed before purchase. **Cancellation is self-serve, two clicks, no email.** Refund policy stated and operable. Support tooling exists for entitlement issues (§M.9). Revenue reporting reconciles against the processor. **Tested end to end with real payments, including the failure paths** — a declined card, an expired subscription, a refund and a dispute, each verified to produce the correct entitlement state.

_When the mobile app ships (V2), add: Google Play Billing with server-side receipt validation, Real-Time Developer Notifications, restore-purchases, and — the test that matters most — **a web subscriber installing the app is recognised as premium and is never offered a second subscription**._

---

## SECTION X — RECOMMENDED NEXT STEPS

### X.1 The next two weeks (Phase 0), in order

1. **Commission a legal opinion on CXC past-paper usage** (R-01). Everything else is provisional until this returns. If the answer is unfavourable, the fallback in §H.1 and §K.5 is viable — but it must be chosen deliberately, not discovered.
2. **Open a licensing conversation with CXC.** Even an unsuccessful approach clarifies the position, and a successful one is a moat.
3. **Inspect the legacy JSON** and close the fourteen **[VERIFY-JSON]** items in §X.2. Include a full human read of 50 random records — automated statistics will not reveal OCR-mangled mathematics.
4. **Transcribe the V2027 Specific Objectives** from the official syllabus PDF, by a qualified human **[VERIFY-CXC-02]**, and confirm the assessment weighting grid **[VERIFY-CXC-01]**.
5. **Secure content reviewer capacity** — at least two qualified CSEC Mathematics teachers **[A-08]**. This is the critical path (§S.1) and it has a hiring lead time.
6. **Choose and verify the web payment processor** for Jamaica and the next three target territories, on coverage rather than fee schedule **[A-04]**. Play merchant availability moves to the V2 mobile release.
7. **Decide the under-13 policy** and the consent mechanism **[A-07]**.
8. **Gather EdMar brand assets** **[A-06]**.
9. **Confirm the product name** and check trade mark exposure (R-02).
10. **Stand up repository, environments, CI and secret management.**

### X.2 Open verification items

**[VERIFY-JSON] — inspect the legacy dataset and confirm:**

1. Record count, and how many are distinct questions versus parts.
2. Whether topic labels map cleanly onto CXC sections, or are ad hoc.
3. Whether any Specific Objective mapping exists (expected: none).
4. The form of stored answers — display strings or structured values.
5. Whether worked solutions are step-structured or single blobs.
6. LaTeX consistency and whether it fits a restrictable allowlist.
7. Whether difficulty ratings exist and are consistent.
8. What "diagram information" actually contains — assets, descriptions or references.
9. The form of "common-error warnings" — prose or value-keyed.
10. Internal duplicate rate.
11. **Mathematical accuracy on a 50-record human-read sample** — the highest-priority item in this list.
12. Provenance and rights status of each record, if recorded at all.
13. Whether "concepts" maps usefully onto the proposed skill vocabulary (§F.4).
14. Paper/year/question-number completeness and reliability.

**[VERIFY-CXC-01]** Assessment weighting grid, read from the official PDF by a human.
**[VERIFY-CXC-02]** Full V2027 Specific Objective list, transcribed not inferred.

### X.3 What to hand the engineering agent

For the Technical Build Specification, this document plus:

- The Phase 0 outputs (rights decision, legacy data assessment, complete taxonomy source).
- Brand assets and the design token definitions.
- The two Phase 1 spike briefs (LaTeX rendering; answer validation), which should be treated as the first engineering work and whose outcomes belong in the Build Specification rather than being assumed by it.

The Technical Build Specification should cover, at minimum: the concrete database schema with indexes and RLS policies; API and RPC contracts; the shared normalisation and validation package specification; the content pipeline job architecture; **the web application structure, routing and state management**; the admin application structure; **the diagnostic, simulation, readiness and projection engines as deterministic, versioned, testable specifications**; the CI/CD pipeline; the test strategy; and the environment and secret-management topology.

### X.4 Three things worth restating

**The application is the easy part.** The content bank is the product, the cost, the risk and the moat. Staff and schedule accordingly — the app will be finished long before the content is (§S.1), and the instinct to hire engineers first is the wrong one here.

**Hold the line on AI.** Every future feature request will push toward putting a model on the student path. The economics (§L.7), the correctness argument (§I.1) and the pedagogy (B-3) all point the same way, and the architecture's coherence depends on that boundary holding. When the pressure comes, the answer is usually a precomputed version of the requested feature — as §U's step-level solution help demonstrates.

**Resolve the rights question before building content.** It is two weeks of work that determines whether the other six months are viable. Doing it after the bank is built is the most expensive possible ordering.

---

## APPENDIX — SOURCES

CXC syllabus and assessment facts in §0.4 were retrieved from:

- CXC, _CSEC Mathematics Syllabus, effective for examinations from May–June 2027_ — https://www.cxc.org/wp-content/uploads/2018/11/CSEC-Mathematics-Syllabus_EffectiveforExamsfrom2027.pdf
- CXC, _CSEC Mathematics Syllabus (amended October 2025)_ — https://www.cxc.org/wp-content/uploads/2018/11/CSEC-Mathematics-AmendedOct2025.pdf
- CXC, _CSEC Mathematics Syllabus, effective for examinations from May–June 2018_ — https://www.csecmathtutor.com/uploads/1/1/4/4/11440199/csec_mathematics_syllabus_exam_2018__.pdf

All syllabus content must be confirmed against the official CXC documents by a qualified human before it is encoded into the product taxonomy (**[VERIFY-CXC-01]**, **[VERIFY-CXC-02]**).

---

_End of Master Blueprint v2.0 (Revision 2 — assessment-led, web-first). No application code is contained in this document._
