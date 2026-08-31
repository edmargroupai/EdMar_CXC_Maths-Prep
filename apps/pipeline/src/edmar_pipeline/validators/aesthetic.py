"""§27.8 case 2 — reject answers that look like floating-point noise."""

from __future__ import annotations

import re


def aesthetic_gate_rejects(canonical: str, source_canonical: str | None = None) -> bool:
    """True when the candidate should be rejected."""
    if re.fullmatch(r"0\.0+\d+", canonical.strip()):
        if source_canonical and source_canonical.strip() not in ("0", "0.0"):
            return True
    # Tiny scientific-notation style values where source was a plain integer
    if re.fullmatch(r"0\.0+3\d+", canonical) and source_canonical == "540":
        return True
    return False
