"""Shared helpers for comparing recipe names against external strings."""
from __future__ import annotations

import re


def normalize(s: str) -> str:
    """Lowercase and strip non-alphanumeric chars for fuzzy comparison."""
    return re.sub(r"[^a-z0-9]", "", s.lower())
