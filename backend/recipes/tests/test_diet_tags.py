"""
Unit tests for recipes.services.diet_tags.normalize_dietary_tags.

No database access is required — these tests exercise pure Python logic only.
"""
from __future__ import annotations

import unittest

from recipes.services.diet_tags import ALLOWED_DIET_KEYS, normalize_dietary_tags


class NormalizeDietaryTagsTest(unittest.TestCase):
  """Exhaustive tests for the normalize_dietary_tags normalizer."""

  # ------------------------------------------------------------------
  # Seed-data shapes — every malformed pattern seen in RECIPE_DATA
  # ------------------------------------------------------------------

  def test_meal_type_only_returns_empty(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Lunch"]), [])

  def test_keto_lunch_compound(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Keto, Lunch"]), ["keto"])

  def test_keto_dinner_compound(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Keto, Dinner"]), ["keto"])

  def test_keto_breakfast_compound(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Keto, Breakfast"]), ["keto"])

  def test_vegetarian_breakfast_compound(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Vegetarian, Breakfast"]), ["vegetarian"])

  def test_vegetarian_lunch_compound(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Vegetarian, Lunch"]), ["vegetarian"])

  def test_vegetarian_dinner_compound(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Vegetarian, Dinner"]), ["vegetarian"])

  def test_vegetarian_vegan_dinner_compound(self) -> None:
    self.assertEqual(
      normalize_dietary_tags(["Regular", "Vegetarian", "Vegan, Dinner"]),
      ["vegetarian", "vegan"],
    )

  def test_vegetarian_vegan_lunch_compound(self) -> None:
    self.assertEqual(
      normalize_dietary_tags(["Regular", "Vegetarian", "Vegan, Lunch"]),
      ["vegetarian", "vegan"],
    )

  def test_vegetarian_vegan_breakfast_compound(self) -> None:
    self.assertEqual(
      normalize_dietary_tags(["Regular", "Vegetarian", "Vegan, Breakfast"]),
      ["vegetarian", "vegan"],
    )

  def test_vegetarian_keto_breakfast_compound(self) -> None:
    self.assertEqual(
      normalize_dietary_tags(["Regular", "Vegetarian", "Keto, Breakfast"]),
      ["vegetarian", "keto"],
    )

  def test_pesca_lunch_compound_drops_entirely(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Pesca, Lunch"]), [])

  def test_pesca_dinner_compound_drops_entirely(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Pesca, Dinner"]), [])

  def test_pesca_breakfast_compound_drops_entirely(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Pesca, Breakfast"]), [])

  def test_pesc_typo_lunch_compound_drops_entirely(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Pesc, Lunch"]), [])

  def test_pesca_standalone_drops(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Pesca"]), [])

  def test_pesca_keto_combo(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Regular", "Pesca", "Keto, Lunch"]), ["keto"])

  # ------------------------------------------------------------------
  # Already-canonical inputs
  # ------------------------------------------------------------------

  def test_already_canonical_vegetarian(self) -> None:
    self.assertEqual(normalize_dietary_tags(["vegetarian"]), ["vegetarian"])

  def test_already_canonical_keto(self) -> None:
    self.assertEqual(normalize_dietary_tags(["keto"]), ["keto"])

  def test_all_eight_canonical_keys_pass_through(self) -> None:
    canonical: list[str] = sorted(ALLOWED_DIET_KEYS)
    result: list[str] = normalize_dietary_tags(canonical)
    self.assertEqual(sorted(result), canonical)

  # ------------------------------------------------------------------
  # De-duplication
  # ------------------------------------------------------------------

  def test_dedup_preserves_first_occurrence_order(self) -> None:
    self.assertEqual(
      normalize_dietary_tags(["keto", "vegan", "keto"]),
      ["keto", "vegan"],
    )

  def test_dedup_across_compound_tokens(self) -> None:
    # "Vegan, Lunch" expands to "vegan" — already seen as a plain entry
    self.assertEqual(
      normalize_dietary_tags(["vegan", "Vegan, Dinner"]),
      ["vegan"],
    )

  # ------------------------------------------------------------------
  # Edge cases
  # ------------------------------------------------------------------

  def test_empty_list(self) -> None:
    self.assertEqual(normalize_dietary_tags([]), [])

  def test_mixed_case_normalizes(self) -> None:
    self.assertEqual(normalize_dietary_tags(["Vegetarian"]), ["vegetarian"])

  def test_unknown_single_token_drops(self) -> None:
    self.assertEqual(normalize_dietary_tags(["mystery"]), [])

  def test_whitespace_only_token_is_ignored(self) -> None:
    self.assertEqual(normalize_dietary_tags(["  "]), [])

  def test_leading_trailing_whitespace_on_token(self) -> None:
    self.assertEqual(normalize_dietary_tags(["  keto  "]), ["keto"])


if __name__ == "__main__":
  unittest.main()
