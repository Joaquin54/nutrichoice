from django.db import models
from django.core.exceptions import ValidationError

# Create your models here.


class Ingredient(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=24, unique=True)
    calories_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    protein_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    carbs_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    fat_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    fiber_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    sugar_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    sodium_per_100g = models.DecimalField(max_digits=6, decimal_places=2)
    default_unit = models.CharField(max_length=20, default="g")

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValidationError(
                "This model is read only. Cannot be modified")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError(
            "This model is read only. Cannot be modified")

    class Meta:
        db_table = "ingredient"
        verbose_name = "Ingredient"
        verbose_name_plural = "Ingredients"
