# Content defect runbook (§12.12)

## Triage
1. Confirm report via `question_reports` or student report.
2. If ≥5 open reports in 24h, question may be auto-suspended — verify in admin review queue.

## Fix path
1. Never edit a published `question_version` — create a new version (I-4).
2. Draft correction → validate → human review → publish.
3. Record `audit_log` entry with defect class and fix reference.

## Student communication
- Do not email predicted grades.
- In-app: affected students see updated content on next session fetch (cache invalidation via `content_version`).
