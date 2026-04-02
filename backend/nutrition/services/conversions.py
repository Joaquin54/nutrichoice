import logging
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP


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


logger = logging.getLogger(__name__)


# Ingredient-specific density overrides (grams per volumetric unit).
# Used to convert FROM grams back to volume with ingredient-aware accuracy.
# Keys: lowercase ingredient slug matching the DB ingredient name.
# Values: dict with "grams_per_cup" and "grams_per_tbsp" as Decimal.
# If an ingredient is absent, fall back to water-density values from UNIT_TO_GRAMS.
INGREDIENT_DENSITY: dict[str, dict[str, Decimal]] = {
    "flour":         {"grams_per_cup": Decimal("125"),  "grams_per_tbsp": Decimal("7.8")},
    "sugar":         {"grams_per_cup": Decimal("200"),  "grams_per_tbsp": Decimal("12.5")},
    "butter":        {"grams_per_cup": Decimal("227"),  "grams_per_tbsp": Decimal("14.2")},
    "rice":          {"grams_per_cup": Decimal("185"),  "grams_per_tbsp": Decimal("11.6")},
    "oats":          {"grams_per_cup": Decimal("90"),   "grams_per_tbsp": Decimal("5.6")},
    "honey":         {"grams_per_cup": Decimal("340"),  "grams_per_tbsp": Decimal("21")},
    "oil":           {"grams_per_cup": Decimal("218"),  "grams_per_tbsp": Decimal("13.6")},
    "cream":         {"grams_per_cup": Decimal("240"),  "grams_per_tbsp": Decimal("15")},
    "peanut butter": {"grams_per_cup": Decimal("258"),  "grams_per_tbsp": Decimal("16")},
}

# Water-density fallback values, derived from UNIT_TO_GRAMS.
_WATER_DENSITY: dict[str, Decimal] = {
    "grams_per_cup": Decimal("240"),
    "grams_per_tbsp": Decimal("15"),
}

# Valid target units for convert_from_grams.
_VALID_TARGET_UNITS: frozenset[str] = frozenset({"grams", "cups", "tablespoons"})

# Fraction lookup for display formatting.
# Tuples of (decimal_value, unicode_display).
FRACTION_MAP: list[tuple[Decimal, str]] = [
    (Decimal("0.25"),  "¼"),
    (Decimal("0.333"), "⅓"),
    (Decimal("0.5"),   "½"),
    (Decimal("0.667"), "⅔"),
    (Decimal("0.75"),  "¾"),
]

_FRACTION_TOLERANCE: Decimal = Decimal("0.04")

# Mass unit names that should display without fractions.
_MASS_UNITS: frozenset[str] = frozenset({"g", "gram", "grams", "kg"})


@dataclass(frozen=True)
class ConversionResult:
    """Result of a reverse conversion from grams to a display unit."""
    quantity: Decimal
    unit: str
    display_string: str


def _get_density(ingredient_name: str) -> dict[str, Decimal]:
    """
    Look up ingredient-specific density data.

    Checks exact match first, then substring match against INGREDIENT_DENSITY keys.
    Falls back to water-density values if no match is found.

    O(n) on INGREDIENT_DENSITY size at worst; the dict is small and constant.
    """
    if not ingredient_name:
        return _WATER_DENSITY

    normalized = ingredient_name.strip().lower()

    # Exact match.
    if normalized in INGREDIENT_DENSITY:
        return INGREDIENT_DENSITY[normalized]

    # Substring match: check if any density key is contained in the
    # ingredient name, or vice versa.
    for key, density in INGREDIENT_DENSITY.items():
        if key in normalized or normalized in key:
            return density

    return _WATER_DENSITY


def _nearest_fraction(frac: Decimal) -> str | None:
    """
    Match a fractional value to the nearest Unicode fraction within tolerance.

    Returns the Unicode fraction string, or None if no match is found.
    """
    for value, symbol in FRACTION_MAP:
        if abs(frac - value) <= _FRACTION_TOLERANCE:
            return symbol
    return None


def _pluralize_unit(unit: str, quantity: Decimal) -> str:
    """Pluralize volume unit names when quantity is not singular."""
    if unit == "cup":
        return "cups" if quantity > Decimal("1") else "cup"
    return unit


def format_quantity(quantity: Decimal, unit: str) -> str:
    """
    Format a raw Decimal quantity and unit into a human-readable string.

    Uses Unicode fractional notation (¼, ⅓, ½, ¾) for volume units
    and whole numbers for grams.

    Raises no exceptions; returns best-effort formatting for any input.
    """
    if unit in _MASS_UNITS:
        rounded = int(quantity.to_integral_value(rounding=ROUND_HALF_UP))
        return f"{rounded}{unit}"

    whole = int(quantity.to_integral_value(rounding="ROUND_DOWN"))
    frac = quantity - Decimal(whole)

    # Pure whole number.
    if frac < _FRACTION_TOLERANCE:
        display_unit = _pluralize_unit(unit, quantity)
        return f"{whole} {display_unit}"

    # Find nearest fraction symbol.
    fraction_str = _nearest_fraction(frac)

    if fraction_str is not None:
        combined = Decimal(whole) + frac
        display_unit = _pluralize_unit(unit, combined)
        if whole > 0:
            return f"{whole}{fraction_str} {display_unit}"
        return f"{fraction_str} {display_unit}"

    # No clean fraction match — round to 2 decimal places.
    rounded = quantity.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    display_unit = _pluralize_unit(unit, rounded)
    return f"{rounded} {display_unit}"


def _round_to_nearest(value: Decimal, step: Decimal) -> Decimal:
    """Round a Decimal value to the nearest multiple of step."""
    return (value / step).quantize(Decimal("1"), rounding=ROUND_HALF_UP) * step


def validate_back_conversion(
    *,
    original_grams: Decimal,
    display_quantity: Decimal,
    display_unit: str,
    ingredient_name: str = "",
) -> bool:
    """
    Verify that a display conversion round-trips back to the original grams
    within an acceptable tolerance.

    Returns True if the error is within ±2%.
    Logs a warning if the error is between 2% and 5%.
    Returns False if error exceeds 2%.
    """
    if original_grams == Decimal("0"):
        return display_quantity == Decimal("0")

    # Back-convert using ingredient-aware density for volume units.
    normalized_unit = display_unit.strip().lower()
    if normalized_unit in _MASS_UNITS:
        back_grams = convert_to_grams(quantity=display_quantity, unit=display_unit)
    else:
        density = _get_density(ingredient_name)
        if normalized_unit in ("cup", "cups"):
            back_grams = display_quantity * density["grams_per_cup"]
        elif normalized_unit in ("tbsp", "tablespoon", "tablespoons"):
            back_grams = display_quantity * density["grams_per_tbsp"]
        elif normalized_unit in ("tsp", "teaspoon", "teaspoons"):
            grams_per_tsp = density["grams_per_tbsp"] / Decimal("3")
            back_grams = display_quantity * grams_per_tsp
        elif normalized_unit == "pinch":
            # A pinch is sub-teaspoon; back-conversion is inherently imprecise.
            return True
        else:
            back_grams = convert_to_grams(quantity=display_quantity, unit=display_unit)

    error = abs(back_grams - original_grams) / original_grams
    if error <= Decimal("0.02"):
        return True

    if error <= Decimal("0.05"):
        logger.warning(
            "Back-conversion drift of %.1f%% for %s %s (%s): "
            "expected %sg, got %sg",
            error * Decimal("100"),
            display_quantity,
            display_unit,
            ingredient_name or "water density",
            original_grams,
            back_grams,
        )
        return False

    return False


def convert_from_grams(
    *,
    grams: Decimal,
    target_unit: str,
    ingredient_name: str = "",
) -> ConversionResult:
    """
    Convert a gram quantity to a display unit with cascade logic.

    target_unit must be one of: "grams", "cups", "tablespoons".

    Cascade (starting from target_unit downward):
      cups < ¼   → fall back to tablespoons
      tbsp < 1   → fall back to teaspoons
      tsp  < ¼   → display "a pinch"

    Keyword-only arguments. Decimal in, Decimal out (inside ConversionResult).
    Raises ValueError for negative grams or unrecognized target_unit.
    """
    if grams < Decimal("0"):
        raise ValueError(f"grams must be non-negative, got {grams}")

    if target_unit not in _VALID_TARGET_UNITS:
        raise ValueError(
            f"Unsupported target_unit '{target_unit}'. "
            f"Supported: {', '.join(sorted(_VALID_TARGET_UNITS))}"
        )

    # Grams mode: no conversion needed.
    if target_unit == "grams":
        display = format_quantity(grams, "g")
        return ConversionResult(quantity=grams, unit="g", display_string=display)

    # Zero grams: short-circuit.
    if grams == Decimal("0"):
        return ConversionResult(
            quantity=Decimal("0"), unit="cup", display_string="0 cups"
        )

    density = _get_density(ingredient_name)
    grams_per_cup = density["grams_per_cup"]
    grams_per_tbsp = density["grams_per_tbsp"]
    grams_per_tsp = grams_per_tbsp / Decimal("3")

    # Cascade logic.
    # Step 1: Try cups (only if target is "cups").
    if target_unit == "cups":
        cups_qty = grams / grams_per_cup
        if cups_qty >= Decimal("0.25"):
            rounded = _round_to_nearest(cups_qty, Decimal("0.25"))
            display = format_quantity(rounded, "cup")
            validate_back_conversion(
                original_grams=grams,
                display_quantity=rounded,
                display_unit="cup",
                ingredient_name=ingredient_name,
            )
            return ConversionResult(
                quantity=rounded, unit="cup", display_string=display
            )

    # Step 2: Try tablespoons.
    tbsp_qty = grams / grams_per_tbsp
    if tbsp_qty >= Decimal("1"):
        rounded = _round_to_nearest(tbsp_qty, Decimal("0.5"))
        display = format_quantity(rounded, "tbsp")
        validate_back_conversion(
            original_grams=grams,
            display_quantity=rounded,
            display_unit="tbsp",
            ingredient_name=ingredient_name,
        )
        return ConversionResult(
            quantity=rounded, unit="tbsp", display_string=display
        )

    # Step 3: Try teaspoons.
    tsp_qty = grams / grams_per_tsp
    if tsp_qty >= Decimal("0.25"):
        rounded = _round_to_nearest(tsp_qty, Decimal("0.25"))
        display = format_quantity(rounded, "tsp")
        validate_back_conversion(
            original_grams=grams,
            display_quantity=rounded,
            display_unit="tsp",
            ingredient_name=ingredient_name,
        )
        return ConversionResult(
            quantity=rounded, unit="tsp", display_string=display
        )

    # Step 4: A pinch.
    return ConversionResult(
        quantity=grams, unit="pinch", display_string="a pinch"
    )
