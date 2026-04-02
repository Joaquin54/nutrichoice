# Re-exporting nutrition services
from .calculations import compute_and_store_nutrition, NutritionResult
from .conversions import (
    convert_from_grams,
    convert_to_grams,
    ConversionResult,
    format_quantity,
    validate_back_conversion,
)
