from __future__ import annotations

ALLOWED_DIET_KEYS: frozenset[str] = frozenset({
  "vegetarian",
  "vegan",
  "gluten_free",
  "dairy_free",
  "nut_free",
  "keto",
  "paleo",
  "low_carb",
})

# Explicit alias map — covers every variant seen in seed data + reasonable future entries.
# Keys are post-lowercase-stripped tokens; values are the canonical ALLOWED_DIET_KEYS entry.
_ALIAS_MAP: dict[str, str] = {
  "vegetarian": "vegetarian",
  "vegan": "vegan",
  "keto": "keto",
  "paleo": "paleo",
  "low carb": "low_carb",
  "low_carb": "low_carb",
  "gluten free": "gluten_free",
  "gluten_free": "gluten_free",
  "dairy free": "dairy_free",
  "dairy_free": "dairy_free",
  "nut free": "nut_free",
  "nut_free": "nut_free",
}


def normalize_dietary_tags(raw: list[str]) -> list[str]:
  """
  Normalize a raw list of dietary tag strings to the canonical ALLOWED_DIET_KEYS set.

  Rules:
  - Each entry is split on commas (handles malformed "Keto, Lunch" → ["Keto", "Lunch"]).
  - Tokens are stripped, lowercased, and looked up in _ALIAS_MAP.
  - Tokens not in the alias map (e.g. "regular", "lunch", "dinner", "breakfast", "pesca") are dropped.
  - Duplicates are removed; input order of first occurrence is preserved.

  Args:
    raw: List of raw tag strings, possibly malformed.

  Returns:
    De-duplicated list of canonical diet keys, all members of ALLOWED_DIET_KEYS.
  """
  seen: set[str] = set()
  result: list[str] = []
  for entry in raw:
    for token in entry.split(","):
      normalized: str | None = _ALIAS_MAP.get(token.strip().lower())
      if normalized is not None and normalized not in seen:
        seen.add(normalized)
        result.append(normalized)
  return result
