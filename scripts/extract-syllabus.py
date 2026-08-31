#!/usr/bin/env python3
"""P04 · Extract CSEC V2027 taxonomy from the official syllabus PDF.

Writes content/taxonomy/csec_2027_taxonomy_seed.json for scripts/gen-taxonomy-seed.mjs.

Usage:
  python scripts/extract-syllabus.py \\
    --pdf data/curriculum/jamaica/CSEC_Mathematics_Syllabus_2027.pdf \\
    --out content/taxonomy/csec_2027_taxonomy_seed.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Official V2027 topic structure (TECHNICAL_BUILD_SPEC.md §0.3).
# paper02_marks is None when the syllabus only states a shared group total
# that does not divide evenly (CXC-DISCREPANCY-02).
TOPICS_BY_MODULE: dict[int, list[dict]] = {
    1: [
        {
            "topic_no": 1,
            "code": "M1-T1",
            "name": "Number Theory and Computation",
            "sequence": 1,
            "paper01_items": 4,
            "paper02_marks_group": "Number Theory and Computation / Consumer Arithmetic",
            "paper02_marks": None,
            "expected_objectives": 19,
            "heading_aliases": ["NUMBER THEORY AND COMPUTATION"],
        },
        {
            "topic_no": 2,
            "code": "M1-T2",
            "name": "Consumer Arithmetic",
            "sequence": 2,
            "paper01_items": 4,
            "paper02_marks_group": "Number Theory and Computation / Consumer Arithmetic",
            "paper02_marks": None,
            "expected_objectives": 10,
            "heading_aliases": ["CONSUMER ARITHMETIC"],
        },
        {
            "topic_no": 3,
            "code": "M1-T3",
            "name": "Sets",
            "sequence": 3,
            "paper01_items": 3,
            "paper02_marks_group": "Graphs, Sets, Measurement, Algebra 1",
            "paper02_marks": 3,
            "expected_objectives": 8,
            "heading_aliases": ["SETS"],
        },
        {
            "topic_no": 4,
            "code": "M1-T4",
            "name": "Measurement",
            "sequence": 4,
            "paper01_items": 4,
            "paper02_marks_group": "Graphs, Sets, Measurement, Algebra 1",
            "paper02_marks": 3,
            "expected_objectives": 13,
            "heading_aliases": ["MEASUREMENT", "MEASUREMENTS"],
        },
        {
            "topic_no": 5,
            "code": "M1-T5",
            "name": "Algebra 1",
            "sequence": 5,
            "paper01_items": 3,
            "paper02_marks_group": "Graphs, Sets, Measurement, Algebra 1",
            "paper02_marks": 3,
            "expected_objectives": 15,
            "heading_aliases": ["ALGEBRA 1"],
        },
        {
            "topic_no": 6,
            "code": "M1-T6",
            "name": "Introduction to Graphs",
            "sequence": 6,
            "paper01_items": 2,
            "paper02_marks_group": "Graphs, Sets, Measurement, Algebra 1",
            "paper02_marks": 3,
            "expected_objectives": 3,
            "heading_aliases": ["INTRODUCTION TO GRAPHS"],
        },
    ],
    2: [
        {
            "topic_no": 1,
            "code": "M2-T1",
            "name": "Statistics 1",
            "sequence": 1,
            "paper01_items": 4,
            "paper02_marks_group": "Statistics 1",
            "paper02_marks": 6,
            "expected_objectives": 11,
            "heading_aliases": ["STATISTICS 1"],
        },
        {
            "topic_no": 2,
            "code": "M2-T2",
            "name": "Algebra 2",
            "sequence": 2,
            "paper01_items": 4,
            "paper02_marks_group": "Algebra 2 / Relations, Functions and Graphs 1",
            "paper02_marks": 6,
            "expected_objectives": 9,
            "heading_aliases": ["ALGEBRA 2"],
        },
        {
            "topic_no": 3,
            "code": "M2-T3",
            "name": "Relations, Functions and Graphs 1",
            "sequence": 3,
            "paper01_items": 4,
            "paper02_marks_group": "Algebra 2 / Relations, Functions and Graphs 1",
            "paper02_marks": 6,
            "expected_objectives": 20,
            "heading_aliases": [
                "RELATIONS, FUNCTIONS AND GRAPHS 1",
                "RELATIONS, FUNCTIONS AND GRAPHS1",
            ],
        },
        {
            "topic_no": 4,
            "code": "M2-T4",
            "name": "Geometry and Trigonometry 1",
            "sequence": 4,
            "paper01_items": 4,
            "paper02_marks_group": "Geometry and Trigonometry 1",
            "paper02_marks": 9,
            "expected_objectives": 10,
            "heading_aliases": ["GEOMETRY AND TRIGONOMETRY 1"],
        },
        {
            "topic_no": 5,
            "code": "M2-T5",
            "name": "Vectors and Matrices 1",
            "sequence": 5,
            "paper01_items": 4,
            "paper02_marks_group": "Vectors and Matrices 1",
            "paper02_marks": 3,
            "expected_objectives": 5,
            "heading_aliases": ["VECTORS AND MATRICES 1"],
        },
    ],
    3: [
        {
            "topic_no": 1,
            "code": "M3-T1",
            "name": "Statistics 2",
            "sequence": 1,
            "paper01_items": 4,
            "paper02_marks_group": "Statistics 2",
            "paper02_marks": 6,
            "expected_objectives": 11,
            "heading_aliases": ["STATISTICS 2"],
        },
        {
            "topic_no": 2,
            "code": "M3-T2",
            "name": "Relations, Functions and Graphs 2",
            "sequence": 2,
            "paper01_items": 6,
            "paper02_marks_group": "Relations, Functions and Graphs 2",
            "paper02_marks": 6,
            "expected_objectives": 6,
            "heading_aliases": [
                "RELATIONS, FUNCTIONS AND GRAPHS 2",
                "RELATIONS, FUNCTIONS AND GRAPHS2",
            ],
        },
        {
            "topic_no": 3,
            "code": "M3-T3",
            "name": "Geometry and Trigonometry 2",
            "sequence": 3,
            "paper01_items": 6,
            "paper02_marks_group": "Geometry and Trigonometry 2",
            "paper02_marks": 9,
            "expected_objectives": 10,
            "heading_aliases": ["GEOMETRY AND TRIGONOMETRY 2"],
        },
        {
            "topic_no": 4,
            "code": "M3-T4",
            "name": "Vectors and Matrices 2",
            "sequence": 4,
            "paper01_items": 4,
            "paper02_marks_group": "Vectors and Matrices 2",
            "paper02_marks": 9,
            "expected_objectives": 9,
            "heading_aliases": ["VECTORS AND MATRICES 2"],
        },
    ],
}

MODULES = {
    1: {
        "module_no": 1,
        "name": "Fundamentals of Secondary Level Mathematics",
        "paper01_items": 20,
        "paper02_marks": 30,
        "weighted_marks": 100,
        "duration_hours": 65,
    },
    2: {
        "module_no": 2,
        "name": "Intermediate Secondary Level Mathematics",
        "paper01_items": 20,
        "paper02_marks": 30,
        "weighted_marks": 100,
        "duration_hours": 65,
    },
    3: {
        "module_no": 3,
        "name": "Higher Concepts in Secondary Level Mathematics",
        "paper01_items": 20,
        "paper02_marks": 30,
        "weighted_marks": 100,
        "duration_hours": 65,
    },
}

MODULE_RE = re.compile(
    r"MODULE\s+([123])\s*:\s*(FUNDAMENTALS|INTERMEDIATE|HIGHER)",
    re.IGNORECASE,
)
OBJ_START_RE = re.compile(r"(?m)^(\d+)\.(\d+)\s+")
BLEED_HINTS = (
    "for example",
    "including",
    "concept of",
    "examples and",
    "representation of",
    "finding the",
    "conversion of",
    "properties of",
    "pie charts",
    "bar charts",
    "vector algebra",
    "equations of the type",
)


def clean_text(text: str) -> str:
    text = text.replace("\uf0a8", " ")
    text = text.replace("\u00ad", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def extract_pages(pdf_path: Path) -> list[tuple[int, str]]:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise SystemExit(
            "pypdf is required. Install with: pip install pypdf"
        ) from exc

    reader = PdfReader(str(pdf_path))
    pages: list[tuple[int, str]] = []
    for i, page in enumerate(reader.pages):
        raw = page.extract_text() or ""
        pages.append((i + 1, clean_text(raw)))
    return pages


def find_topic_meta(module_no: int, heading: str) -> dict | None:
    heading_u = re.sub(r"\s+", " ", heading.upper()).strip()
    heading_u = re.sub(r"\s*\(CONT.?D\)\s*$", "", heading_u)
    for topic in TOPICS_BY_MODULE[module_no]:
        for alias in topic["heading_aliases"]:
            if heading_u.startswith(alias) or alias in heading_u:
                return topic
    return None


def looks_like_bleed(statement: str, content_notes: str | None) -> bool:
    if content_notes and len(content_notes) > 20:
        return True
    lower = statement.lower()
    if len(statement) > 220:
        return True
    return any(h in lower for h in BLEED_HINTS if h != "including") and ";" not in statement[:40]


def split_statement_and_notes(block: str) -> tuple[str, str | None]:
    """Best-effort separation of left-column objective from right-column notes."""
    lines = [ln.strip() for ln in block.splitlines() if ln.strip()]
    if not lines:
        return "", None

    # Drop leading objective number already consumed by caller; block starts after "N.N ".
    joined = " ".join(lines)
    joined = re.sub(r"\s+", " ", joined).strip()

    # Heuristic: content notes often start mid-line after a semicolon ending the objective.
    # Prefer splitting at ".  " followed by a capitalised note that looks explanatory.
    m = re.match(
        r"^(.+?[.;:])\s+((?:Including|Examples?|For example|Concept|Finding|Conversion|"
        r"Properties|Representation|Identifying|Pie charts|Vector|Equations|Positive|"
        r"Highest|Place value|Scientific|Comparing|Rearranging|Ratio|Raw data|"
        r"Set of|Composition|Relative).+)$",
        joined,
        re.IGNORECASE,
    )
    if m:
        statement = m.group(1).strip()
        notes = m.group(2).strip()
        return statement, notes or None

    # Multi-line: first line(s) until we hit a notes-looking continuation after a complete clause
    statement_parts: list[str] = []
    note_parts: list[str] = []
    in_notes = False
    for i, line in enumerate(lines):
        if not in_notes and i > 0:
            if re.match(
                r"^(Including|Examples?|For example|Concept|Finding|Conversion|Properties|"
                r"Representation|Identifying|Pie charts|Vector|Equations|Positive|Highest|"
                r"Place value|Scientific|Comparing|Rearranging|Ratio|Raw data|Set of|"
                r"Composition|Relative|1, 2 or 3|0, 1, 2)",
                line,
                re.IGNORECASE,
            ):
                in_notes = True
        if in_notes:
            note_parts.append(line)
        else:
            statement_parts.append(line)

    statement = " ".join(statement_parts)
    statement = re.sub(r"\s+", " ", statement).strip()
    notes = " ".join(note_parts).strip() if note_parts else None
    return statement, notes or None


def parse_objectives(pages: list[tuple[int, str]]) -> dict[tuple[int, int, int], dict]:
    """Return map (module, topic_no, objective_no) -> objective dict."""
    # Keep only pages that mention SPECIFIC OBJECTIVES or numbered objectives in curriculum.
    corpus_parts: list[str] = []
    current_module = 0
    for page_no, text in pages:
        if "SPECIFIC OBJECTIVES" in text.upper() or MODULE_RE.search(text):
            # Skip early TOC / assessment pages before module 1 curriculum (~page 20+)
            if page_no < 20:
                continue
            # Stop at suggested teaching / specimen / glossary sections after module 3
            if page_no > 55 and "MODULE 3" not in text.upper() and current_module == 3:
                if "SUGGESTED" in text.upper() or "GLOSSARY" in text.upper():
                    break
            m = MODULE_RE.search(text)
            if m:
                current_module = int(m.group(1))
            corpus_parts.append(f"\n<<<PAGE {page_no}>>>\n{text}\n")

    corpus = "\n".join(corpus_parts)

    # Walk line by line for headings + objective starts
    objectives: dict[tuple[int, int, int], dict] = {}
    module_no = 0
    topic_meta: dict | None = None
    lines = corpus.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        mm = MODULE_RE.search(line)
        if mm:
            module_no = int(mm.group(1))
            topic_meta = None
            i += 1
            continue

        if module_no:
            # Topic heading: ALL CAPS name, optionally (cont'd)
            if re.match(r"^[A-Z0-9 ,/&'\-]{4,}(\s*\(cont.?d\))?\.?$", line, re.IGNORECASE):
                meta = find_topic_meta(module_no, line)
                if meta:
                    topic_meta = meta
                    i += 1
                    continue
            # Numbered topic title: "1. NUMBER THEORY AND COMPUTATION"
            mnum = re.match(r"^(\d+)\.\s+([A-Z].+)$", line)
            if mnum:
                meta = find_topic_meta(module_no, mnum.group(2))
                if meta:
                    topic_meta = meta
                    i += 1
                    continue

        obj_m = OBJ_START_RE.match(line)
        if obj_m and module_no and topic_meta:
            topic_local = int(obj_m.group(1))
            obj_no = int(obj_m.group(2))
            # Ensure topic_no matches heading topic_no; PDF uses local numbering within topic
            if topic_local != topic_meta["topic_no"]:
                # Sometimes heading lags; try to find topic by local number
                for t in TOPICS_BY_MODULE[module_no]:
                    if t["topic_no"] == topic_local:
                        topic_meta = t
                        break

            rest = line[obj_m.end() :]
            block_lines = [rest] if rest else []
            j = i + 1
            while j < len(lines):
                nxt = lines[j].strip()
                if not nxt:
                    j += 1
                    # allow blank lines inside an objective
                    if j < len(lines) and OBJ_START_RE.match(lines[j].strip() or ""):
                        break
                    continue
                if OBJ_START_RE.match(nxt):
                    break
                if MODULE_RE.search(nxt):
                    break
                if re.match(r"^<<<PAGE ", nxt):
                    j += 1
                    continue
                if "SPECIFIC OBJECTIVES" in nxt.upper():
                    j += 1
                    continue
                if nxt.startswith("Students should be able"):
                    j += 1
                    continue
                if re.match(r"^CXC 05/", nxt) or "www.cxc.org" in nxt:
                    j += 1
                    continue
                if re.match(r"^MODULE\s+[123]", nxt, re.IGNORECASE):
                    break
                # New topic heading
                if re.match(r"^[A-Z0-9 ,/&'\-]{8,}(\s*\(cont.?d\))?\.?$", nxt) and find_topic_meta(
                    module_no, nxt
                ):
                    break
                if re.match(r"^\d+\.\s+[A-Z]", nxt) and find_topic_meta(
                    module_no, re.sub(r"^\d+\.\s+", "", nxt)
                ):
                    break
                block_lines.append(nxt)
                j += 1

            block = "\n".join(block_lines)
            statement, notes = split_statement_and_notes(block)
            # Trim trailing "and," artifacts
            statement = re.sub(r"\s+", " ", statement).strip()
            statement = statement.rstrip(";")
            if statement and not statement.endswith((".", ":", ")")):
                # keep as-is; many end with ; which we stripped
                pass
            if statement and not re.search(r"[.!?]$", statement):
                statement = statement.rstrip(",") + "."

            needs_review = looks_like_bleed(statement, notes)
            # If statement still contains obvious notes bleed mid-sentence after a short clause
            if notes is None and len(statement) > 160:
                needs_review = True

            key = (module_no, topic_meta["topic_no"], obj_no)
            code = f"M{module_no}-{topic_meta['topic_no']}.{obj_no}"
            objectives[key] = {
                "code": code,
                "objective_no": obj_no,
                "statement": statement,
                "content_notes": notes,
                "needs_human_review": needs_review,
                "sequence": obj_no,
            }
            i = j
            continue

        i += 1

    return objectives


def build_seed(objectives: dict[tuple[int, int, int], dict]) -> dict:
    modules_out = []
    for module_no in (1, 2, 3):
        mod = dict(MODULES[module_no])
        topics_out = []
        for topic in TOPICS_BY_MODULE[module_no]:
            objs = []
            expected = topic["expected_objectives"]
            for obj_no in range(1, expected + 1):
                key = (module_no, topic["topic_no"], obj_no)
                if key in objectives:
                    objs.append(objectives[key])
                else:
                    objs.append(
                        {
                            "code": f"M{module_no}-{topic['topic_no']}.{obj_no}",
                            "objective_no": obj_no,
                            "statement": f"[MISSING — verify from syllabus] Objective {obj_no}",
                            "content_notes": None,
                            "needs_human_review": True,
                            "sequence": obj_no,
                        }
                    )
            topics_out.append(
                {
                    "topic_no": topic["topic_no"],
                    "code": topic["code"],
                    "name": topic["name"],
                    "sequence": topic["sequence"],
                    "paper01_items": topic["paper01_items"],
                    "paper02_marks_group": topic["paper02_marks_group"],
                    "paper02_marks": topic["paper02_marks"],
                    "is_active": True,
                    "objectives": objs,
                }
            )
        mod["topics"] = topics_out
        modules_out.append(mod)

    return {
        "subject": {
            "code": "CSEC_MATH",
            "name": "CSEC Mathematics",
            "is_active": True,
            "sequence": 0,
        },
        "syllabus": {
            "code": "V2027",
            "official_code": "CXC 05/G/SYLL 16",
            "effective_from_year": 2027,
            "effective_from_month": "may_june",
            "has_modules": True,
            "is_default": True,
            "source_document": "CSEC_Mathematics_Syllabus_2027.pdf",
        },
        "modules": modules_out,
        "skills": [],
        "skill_prerequisites": [],
        "skill_objectives": [],
    }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract V2027 taxonomy seed from CXC syllabus PDF"
    )
    parser.add_argument(
        "--pdf",
        type=Path,
        default=Path("data/curriculum/jamaica/CSEC_Mathematics_Syllabus_2027.pdf"),
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("content/taxonomy/csec_2027_taxonomy_seed.json"),
    )
    args = parser.parse_args()

    if not args.pdf.is_file():
        print(f"PDF not found: {args.pdf}", file=sys.stderr)
        return 1

    print(f"Reading {args.pdf} …")
    pages = extract_pages(args.pdf)
    print(f"Extracted {len(pages)} pages")
    objectives = parse_objectives(pages)
    print(f"Parsed {len(objectives)} objective statements from PDF")

    seed = build_seed(objectives)
    total = sum(
        len(t["objectives"]) for m in seed["modules"] for t in m["topics"]
    )
    flagged = sum(
        1
        for m in seed["modules"]
        for t in m["topics"]
        for o in t["objectives"]
        if o["needs_human_review"]
    )
    missing = sum(
        1
        for m in seed["modules"]
        for t in m["topics"]
        for o in t["objectives"]
        if o["statement"].startswith("[MISSING")
    )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(seed, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {args.out}")
    print(f"Totals: {len(seed['modules'])} modules, "
          f"{sum(len(m['topics']) for m in seed['modules'])} topics, "
          f"{total} objectives")
    print(f"needs_human_review={flagged}, missing_from_pdf={missing}")

    if total != 159:
        print(f"ERROR: expected 159 objectives, got {total}", file=sys.stderr)
        return 1
    if missing:
        print(f"WARNING: {missing} objectives missing from PDF parse — flagged for review",
              file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
