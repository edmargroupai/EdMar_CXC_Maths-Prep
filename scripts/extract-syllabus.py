#!/usr/bin/env python3
"""P04 · Extract CSEC V2027 taxonomy from the official syllabus PDF.

Writes content/taxonomy/csec_2027_taxonomy_seed.json. Run gen-taxonomy-seed.js after
human review of objectives flagged needs_human_review.

Usage:
  python scripts/extract-syllabus.py \\
    --pdf data/curriculum/jamaica/CSEC_Mathematics_Syllabus_2027.pdf \\
    --out content/taxonomy/csec_2027_taxonomy_seed.json
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract V2027 taxonomy seed from CXC syllabus PDF")
    parser.add_argument("--pdf", required=True, type=Path, help="Path to CSEC_Mathematics_Syllabus_2027.pdf")
    parser.add_argument(
        "--out",
        default=Path("content/taxonomy/csec_2027_taxonomy_seed.json"),
        type=Path,
        help="Output JSON path",
    )
    args = parser.parse_args()

    if not args.pdf.is_file():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        print(
            "Place the official syllabus at data/curriculum/jamaica/CSEC_Mathematics_Syllabus_2027.pdf",
            file=sys.stderr,
        )
        return 1

    print(
        "extract-syllabus.py is not yet implemented in this repo.",
        file=sys.stderr,
    )
    print(
        "Provide content/taxonomy/csec_2027_taxonomy_seed.json from the spec deliverable "
        "or implement PDF extraction per TECHNICAL_BUILD_SPEC.md §0.3.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
