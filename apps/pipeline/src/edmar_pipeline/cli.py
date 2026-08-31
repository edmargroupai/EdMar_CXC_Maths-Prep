"""CLI entrypoint for local pipeline runs."""

from __future__ import annotations

import argparse
import json
import sys

from edmar_pipeline.cost import estimate_job_cost_usd
from edmar_pipeline.stages.registry import run_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(description="EdMar content pipeline")
    parser.add_argument("--pages", type=int, default=20, help="Workbook page slice size")
    parser.add_argument("--dry-run", action="store_true", help="Estimate cost only")
    parser.add_argument("--through", type=str, default=None, help="Stop after stage")
    args = parser.parse_args()

    estimate = estimate_job_cost_usd(args.pages)
    if args.dry_run:
        print(json.dumps({"estimated_cost_usd": estimate, "pages": args.pages}))
        return

    ctx = run_pipeline({"pages": args.pages, "source": "workbook_slice"}, through=args.through)
    ctx["estimated_cost_usd"] = estimate
    print(json.dumps(ctx, indent=2))


if __name__ == "__main__":
    main()
