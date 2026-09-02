# ADR-023 — Mastery cycle, inventory health, and AI cost control

**Status:** Accepted and implemented (migrations 0014–0016, selection/cycle wiring, templates package, admin inventory view).  
**Date:** 2 September 2026  
**Amends:** Blueprint §E, §J, §K; Spec §9, §14, §21, §29; Invariants I-1, I-6  

## Context

EdMar already has:

- Continuous skill/topic mastery (§9.11 EWMA) computed in Postgres
- Deterministic practice selection (`fn_create_practice_session`) with time-based cooldown
- Mark-impact weak areas and recommendations (§9.12 / `fn_weak_areas`)
- Offline AI content pipeline with no auto-publish (I-1, B-14)
- `@edmar/answer-core` as the only answer judge
- Per-topic Gate 1 inventory targets from Paper 01 weights (§29.6)

Product amendment requires an explicit **code-first / template-second / AI-only-when-necessary** content path, a configurable **topic mastery assessment cycle** (default 20 questions / 90% accuracy + coverage gates), remediation bands, inventory health floors, and stronger AI cost metrics — without redesigning the product or putting AI on the student path.

## Decision

### D-23.1 Content generation order (invariant)

```
CODE / DETERMINISTIC SELECTOR
  → APPROVED QUESTION BANK
TEMPLATE GENERATION (offline, when inventory short)
  → AI GENERATION ONLY WHEN TEMPLATES ARE INADEQUATE (offline)
  → VALIDATE → REVIEW → PUBLISH
```

There is **no** path `STUDENT → AI → NEW QUESTION`.  
A student request for the next question **never** synchronously calls an LLM.  
This strengthens I-1; it does not replace it.

### D-23.2 Continuous mastery remains authoritative

`fn_update_skill_mastery` / `fn_update_topic_mastery` (§9.11) remain the durable mastery scores for progress, readiness inputs, and the Mastered band (90–100).

They are **not** replaced by `correct_count >= 18`.

### D-23.3 Topic mastery assessment cycle (new practice overlay)

A configurable **topic mastery cycle** may gate “cycle complete / remediation / prerequisite support” for topic-scoped practice:

| Config key | Default | Meaning |
|------------|---------|---------|
| `mastery_question_target` | `20` | Questions in a default cycle |
| `mastery_accuracy_threshold` | `0.90` | Minimum overall accuracy |
| `mastery_cycle_enabled` | `true` | Feature flag |

Cycle mastery requires **all** of:

1. `overall_accuracy >= mastery_accuracy_threshold`
2. `required_skill_coverage_met` (configurable; uses existing skills / objectives taxonomy)
3. `critical_prerequisite_requirements_met` (uses existing `skill_prerequisites`)

Topic-specific overrides may live in `app_config` or a future `topic_mastery_config` table without redeploy.

**Relationship to §9.11:** cycle outcomes update attempt evidence that feeds continuous mastery; the cycle verdict is an assessment-mode result, not a second score store that diverges permanently from §9.11.

### D-23.4 Remediation bands (configurable)

Default bands after a cycle (override via `app_config`):

| Band key | Default | Behaviour |
|----------|---------|-----------|
| `remediation_band_near` | 15–17 correct of 20 | 5 targeted remediation questions |
| `remediation_band_mid` | 10–14 | 10 targeted remediation questions |
| `remediation_band_low` | 0–9 | Prerequisite review + ~10 targeted + reassess |

Remediation **selection** remains code-driven and should reuse `fn_weak_areas` / mark-impact logic (§J.7), not AI analysis of each attempt.

### D-23.5 Cooldown: keep time-based; add ID window preference

| Mechanism | Status | Config |
|-----------|--------|--------|
| Time cooldown 30d correct / 7d incorrect | **Keep** (§9.3) | `cooldown_days_*` |
| Recent-ID window | **Add** as selection preference | `cooldown_recent_ids` default `40` (range 30–50) |

Selector preference order: unseen → outside ID window → outside time cooldown → least-recent → never sync AI.

### D-23.6 Inventory health (alongside §29.6)

§29.6 Paper 01 weight targets remain Gate 1 composition goals.

Additional **health floors** (configurable):

| Key | Default |
|-----|---------|
| `inventory_min_approved_per_topic` | `40` |
| `inventory_preferred_per_topic` | `60` |
| `inventory_reserve_warn` | `15` suitable alternatives after cooldown rules |

“Unused” is **per-student** (cooldown / attempts), never global.

Statuses remain existing `content_status` — no duplicate vocabulary.

### D-23.7 Template-first, AI second (P20+)

Offline replenishment order:

1. Inventory monitor detects shortage / coverage hole  
2. Deterministic **question templates** where suitable  
3. AI draft only when templates inadequate  
4. Schema + math + dedupe + taxonomy validation  
5. Human review — **never auto-publish**  
6. Publish into approved bank  

Students keep practising on existing approved inventory during refill.

### D-23.8 Fail-safe

AI outage, budget exhaustion, or queue failure **must not** block login, practice, answer checking, mastery calculation, diagnostic, simulation, or progress.

### D-23.9 Exam simulation unchanged

Paper/blueprint simulation (§41.3) is **not** governed by the 20-question topic mastery cycle.

### D-23.10 Answer validation unchanged

`@edmar/answer-core` / `fn_validate_answer` remain the only graders for supported types. No LLM grading.

## Consequences

- **Docs:** Spec §9.13 / §14.10 / §21.x inventory health; Blueprint amendment notice; this ADR.  
- **Schema now:** `app_config` seeds only (`0014_mastery_inventory_ai_config.sql`).  
- **Code later:** selection coverage gates, cycle evaluator, template engine, admin inventory health, replenishment jobs — implement in the phase that owns each (see Impact).  
- **Conflicts resolved** by coexistence rules above; not by deleting §9.11 or time cooldown.

## Phase impact

| Concern | Phase |
|---------|-------|
| Config seeds | Now (migration 0014) |
| Cycle evaluator + remediation wiring | Extend **P17** / post-P17 practice hardening |
| Selection coverage + ID cooldown | **P09/P15** selection — amend `fn_create_practice_session` when implementing |
| Template engine | **P20** pipeline |
| Inventory health admin UI | **P19** admin |
| AI cost dashboards | **P20** / admin ops |
| Tests in §20 of amendment | With each implementation slice |

## Rejected alternatives

- Replacing §9.11 with a pure 18/20 counter  
- Synchronous AI generation when the bank is thin  
- Global “unused question” inventory accounting  
- New content_status values parallel to published/approved  
