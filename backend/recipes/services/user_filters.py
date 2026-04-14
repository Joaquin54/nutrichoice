from __future__ import annotations

from typing import Any


def get_active_allergies(user: Any) -> list[str]:
  """
  Return non-empty, stripped allergy tokens from the user's profile.allergies list.

  Safe against a missing profile or non-string entries. An absent profile,
  a None allergies value, or an empty list all yield an empty result — no
  allergy filtering will be applied in those cases.

  Args:
    user: The authenticated request user. Expected to have a ``profile``
          relation with an ``allergies`` attribute (list[str]).

  Returns:
    A list of stripped, non-empty allergy token strings.
  """
  allergies: list[Any] = (
    getattr(getattr(user, "profile", None), "allergies", None) or []
  )
  return [a.strip() for a in allergies if isinstance(a, str) and a.strip()]
