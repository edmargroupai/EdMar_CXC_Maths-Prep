# EdMar content pipeline (P20)

Offline batch content factory — extraction, AI drafting, SymPy validation, dedupe (§13).

## Local usage

```bash
pip install -e "./apps/pipeline[dev]"
edmar-pipeline --dry-run --pages 20
pytest apps/pipeline/tests -q
```

## Dispatch

`supabase/functions/pipeline-dispatch` estimates cost, enforces the 80% AI budget circuit breaker, and enqueues `content_jobs`.

Worker URL is optional (`PIPELINE_WORKER_URL`); jobs stay `queued` until the container worker drains them.

## Rights gate

Do not run workbook extraction until **VERIFY-RIGHTS-01** is signed (`EdMar_CXC_Mathematics_Workbook_2026.pdf`).
