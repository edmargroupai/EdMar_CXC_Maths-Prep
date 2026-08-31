"""SymPy authority for generated answers (§27.8 case 1)."""

from __future__ import annotations

from sympy import simplify
from sympy.parsing.sympy_parser import parse_expr


def sympy_agrees(llm_answer: str, verified_answer: str) -> bool:
    try:
        diff = simplify(parse_expr(llm_answer) - parse_expr(verified_answer))
        return diff == 0
    except Exception:
        return False
