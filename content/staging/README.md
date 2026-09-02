# Question staging (author upload prep)

Place **one JSON file per question** in this folder (not in `templates/` — those are copy-only).

## From workbook batch

`from-workbook/` holds questions converted from `questions_with_solutions.json`:

```bash
pnpm convert:workbook
pnpm validate:staging
```

- **523** draft questions with full ten-block solutions (what students see after an attempt)
- **25** source rows skipped (`BLOCKED_INSUFFICIENT_SOURCE`)
- Status is always `draft`; `answerValidation.verification` is `unverified` until human review
- Guided solutions → `solutionSteps`; strategy / why / mistakes / exam tip / quick check map to the other response blocks

## Templates

| File | Use when |
|------|----------|
| `templates/mcq-no-diagram.json` | Multiple choice, text/math only |
| `templates/mcq-with-diagram.json` | MCQ with a figure in the stem |
| `templates/structured-no-diagram.json` | Multi-part (a), (b) — numeric parts |
| `templates/structured-with-diagram.json` | Shared diagram + parts (a), (b) |

Copy a template, rename (e.g. `M1-T1-001-mcq.json`), replace every `REPLACE_…` placeholder.

## Validate

```bash
pnpm validate:staging
```

## Status workflow

`draft` → `pending_validation` → `pending_review` → `approved` → `published` (admin only; never set `published` in your JSON files).
