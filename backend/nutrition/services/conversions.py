from decimal import Decimal


# Conversion factors: unit -> grams.
# Volumetric units use water-density approximation (1 ml = 1 g).
# Ingredient-specific density is a future enhancement.
UNIT_TO_GRAMS: dict[str, Decimal] = {
    # Mass units
    "g": Decimal("1"),
    "gram": Decimal("1"),
    "grams": Decimal("1"),
    "kg": Decimal("1000"),
    "oz": Decimal("28.35"),
    "ounce": Decimal("28.35"),
    "lb": Decimal("453.59"),
    "pound": Decimal("453.59"),

    # Volume units (water-density approximation)
    "ml": Decimal("1"),
    "milliliter": Decimal("1"),
    "l": Decimal("1000"),
    "liter": Decimal("1000"),
    "tsp": Decimal("5"),
    "teaspoon": Decimal("5"),
    "tbsp": Decimal("15"),
    "tablespoon": Decimal("15"),
    "cup": Decimal("240"),
    "fl_oz": Decimal("30"),
}


def convert_to_grams(*, quantity: Decimal, unit: str) -> Decimal:
    """
    Convert a quantity in the given unit to grams.

    Raises ValueError if the unit is not recognized.
    """
    normalized = unit.strip().lower()
    factor = UNIT_TO_GRAMS.get(normalized)
    if factor is None:
        raise ValueError(
            f"Unsupported unit '{unit}'. "
            f"Supported units: {', '.join(sorted(UNIT_TO_GRAMS.keys()))}"
        )
    return quantity * factor
