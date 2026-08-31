"""LaTeX allowlist (§13.7 check 2)."""

from __future__ import annotations

import re

ALLOWED_COMMANDS = frozenset(
    {
        "frac",
        "sqrt",
        "times",
        "div",
        "cdot",
        "pi",
        "theta",
        "alpha",
        "beta",
        "left",
        "right",
        "text",
    }
)

FORBIDDEN = re.compile(r"\\(input|include|href|write|def|newcommand)")


def latex_allowlist_ok(text: str) -> bool:
    if FORBIDDEN.search(text):
        return False
    for match in re.finditer(r"\\([a-zA-Z]+)", text):
        if match.group(1) not in ALLOWED_COMMANDS:
            return False
    return True
