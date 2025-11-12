# Serializer Implementation Tasks

## Overview
This document outlines all serializers that need to be created for the recipe application backend. The application uses a hybrid database architecture:
- **PostgreSQL**: User data, user profiles, tried recipes
- **MongoDB**: Recipes, ingredients, saved recipes

---

## Dependencies Required

```bash
pip install djangorestframework
pip install django-rest-framework-mongoengine
```

---

## Import Structure

```python
# For PostgreSQL models (User, User_Profile, TriedRecipe)
from rest_framework import serializers

# For MongoDB models (Recipe, Ingredient, SavedRecipe)
from rest_framework_mongoengine import serializers as mongo_serializers
```

---

## Serializers to Create

### PostgreSQL Models (from models.py)

#### 1. UserSerializer
- **Model**: `User`
- **Base Class**: `serializers.ModelSerializer`
- **Fields**: 
  - public_id
  - username
  - first_name
  - last_name
  - email
  - date_created
- **Read-only Fields**: public_id, date_created

---

#### 2. UserProfileSerializer
- **Model**: `User_Profile`
- **Base Class**: `serializers.ModelSerializer`
- **Fields**:
  - id
  - user
  - daily_calorie_goal
  - daily_protein_goal
  - date_created
  - date_updated
  - bio
  - diet_type
  - profil_picture
- **Read-only Fields**: id, date_created
- **Additional**: Consider adding nested username from User relationship

---

#### 3. TriedRecipeSerializer
- **Model**: `TriedRecipe`
- **Base Class**: `serializers.ModelSerializer`
- **Fields**:
  - public_id
  - recipe_id
  - date_added
  - tried_by
- **Read-only Fields**: public_id, date_added
- **Additional**: Consider adding nested username from User relationship

---

### MongoDB Models (from models_mongo.py)

#### 4. IngredientSerializer (Full Detail)
- **Model**: `Ingredient`
- **Base Class**: `mongo_serializers.DocumentSerializer`
- **Fields**:
  - public_id
  - name
  - category
  - calories
  - protein
  - carbs
  - fat
  - fiber
  - sugar
  - sodium
  - conversions
  - created_date
  - updated_date
- **Read-only Fields**: public_id, created_date, updated_date
- **Use Case**: Detailed ingredient view, admin management

---

#### 5. IngredientListSerializer (Lightweight)
- **Model**: `Ingredient`
- **Base Class**: `mongo_serializers.DocumentSerializer`
- **Fields**:
  - public_id
  - name
  - category
  - calories
  - protein
  - carbs
  - fat
- **Read-only Fields**: public_id
- **Use Case**: Search results, dropdowns, ingredient selection

---

#### 6. RecipeIngredientEmbeddedSerializer
- **Model**: `RecipeIngredientEmbedded`
- **Base Class**: `mongo_serializers.EmbeddedDocumentSerializer`
- **Fields**:
  - ingredient_id
  - ingredient_name
  - quantity_grams
  - display_quantity
  - display_unit
  - preparation_notes
  - order
- **Use Case**: Nested within RecipeSerializer

---

#### 7. RecipeInstructionEmbeddedSerializer
- **Model**: `RecipeInstructionEmbedded`
- **Base Class**: `mongo_serializers.EmbeddedDocumentSerializer`
- **Fields**:
  - step_number
  - instruction
  - duration_minutes
- **Use Case**: Nested within RecipeSerializer

---

#### 8. RecipeSerializer (Full Detail)
- **Model**: `Recipe`
- **Base Class**: `mongo_serializers.DocumentSerializer`
- **Fields**:
  - public_id
  - user_id
  - title
  - description
  - image_url
  - prep_time
  - cook_time
  - ingredients (nested)
  - instructions (nested)
  - nutrition_per_serving
  - nutrition_total
  - cuisine_type
  - dietary_tags
  - is_public
  - date_time_created
  - date_time_updated
- **Read-only Fields**: public_id, nutrition_per_serving, nutrition_total, date_time_created, date_time_updated
- **Nested Serializers**: 
  - RecipeIngredientEmbeddedSerializer (many=True)
  - RecipeInstructionEmbeddedSerializer (many=True)
- **Use Case**: Create, update, detailed view of recipes
- **Note**: nutrition fields are calculated automatically by the model's save method

---

#### 9. RecipeListSerializer (Lightweight)
- **Model**: `Recipe`
- **Base Class**: `mongo_serializers.DocumentSerializer`
- **Fields**:
  - public_id
  - title
  - description
  - image_url
  - prep_time
  - cook_time
  - cuisine_type
  - nutrition_per_serving
  - is_public
- **Read-only Fields**: public_id, nutrition_per_serving
- **Use Case**: Recipe browsing, search results, list views

---

#### 10. SavedRecipeSerializer
- **Model**: `SavedRecipe`
- **Base Class**: `mongo_serializers.DocumentSerializer`
- **Fields**:
  - public_id
  - user_id
  - recipe_id
  - notes
  - saved_date
- **Read-only Fields**: public_id, saved_date
- **Use Case**: User's saved/favorited recipes

---

## Task Assignment

### Developer 1: User Management Serializers
**Estimated Time**: 2-3 hours

**Tasks**:
- [ ] Create UserSerializer
- [ ] Create UserProfileSerializer
- [ ] Create TriedRecipeSerializer
- [ ] Write unit tests for all three serializers
- [ ] Test serialization (model → JSON)
- [ ] Test deserialization (JSON → model)

**Files to Create**:
- `serializers/user_serializers.py`

---

### Developer 2: Ingredient Serializers
**Estimated Time**: 2 hours

**Tasks**:
- [ ] Create IngredientSerializer (full detail)
- [ ] Create IngredientListSerializer (lightweight)
- [ ] Write unit tests for both serializers
- [ ] Test with sample ingredient data
- [ ] Verify all nutrition fields serialize correctly

**Files to Create**:
- `serializers/ingredient_serializers.py`

---

### Developer 3: Recipe Serializers
**Estimated Time**: 4-6 hours (most complex)

**Tasks**:
- [ ] Create RecipeIngredientEmbeddedSerializer
- [ ] Create RecipeInstructionEmbeddedSerializer
- [ ] Create RecipeSerializer with nested serializers
- [ ] Create RecipeListSerializer (lightweight)
- [ ] Create SavedRecipeSerializer
- [ ] Write unit tests for all serializers
- [ ] Test nested serialization/deserialization
- [ ] Verify nutrition fields are read-only and calculated correctly

**Files to Create**:
- `serializers/recipe_serializers.py`

---

## Acceptance Criteria

### For All Serializers:
- [ ] All specified fields included
- [ ] Read-only fields properly marked
- [ ] Correct base class used (ModelSerializer vs DocumentSerializer)
- [ ] Serialization works (model → JSON)
- [ ] Deserialization works (JSON → model)
- [ ] Field validation working
- [ ] Unit tests written and passing
- [ ] Code follows team coding standards

### Additional for RecipeSerializer:
- [ ] Nested ingredients serialize/deserialize correctly
- [ ] Nested instructions serialize/deserialize correctly
- [ ] nutrition_per_serving and nutrition_total are read-only
- [ ] Can create a recipe with ingredients and instructions in one API call
- [ ] Updates to ingredients trigger nutrition recalculation

---

## Testing Guidelines

### Example Test Structure:
```python
from django.test import TestCase
from rest_framework.test import APITestCase

class UserSerializerTest(TestCase):
    def test_serialization(self):
        # Test model → JSON
        pass
    
    def test_deserialization(self):
        # Test JSON → model
        pass
    
    def test_validation(self):
        # Test field validation
        pass
```

---

## Key Implementation Notes

1. **PostgreSQL Serializers**: Use `serializers.ModelSerializer`
2. **MongoDB Serializers**: Use `mongo_serializers.DocumentSerializer`
3. **Embedded Documents**: Use `mongo_serializers.EmbeddedDocumentSerializer`
4. **Nutrition Fields**: Always read-only (calculated by Recipe.save() method)
5. **Nested Serializers**: RecipeSerializer must properly handle nested ingredients and instructions
6. **UUIDs**: All public_id fields should be read-only (auto-generated)

---

## Questions to Resolve

Before starting implementation, discuss with team:

1. Should UserProfileSerializer include the full User object or just username?
2. Should TriedRecipeSerializer include recipe details or just recipe_id?
3. Should RecipeListSerializer include ingredient count or prep+cook total time?
4. What validation rules for recipe title, description?
5. Should SavedRecipeSerializer include recipe details or just IDs?

---

## Timeline

**Week 1**:
- Day 1-2: Developer 1 completes User serializers
- Day 1-2: Developer 2 completes Ingredient serializers
- Day 2-4: Developer 3 completes Recipe serializers
- Day 5: Code review, integration testing, bug fixes

---

## Next Steps After Serializers

Once serializers are complete:
1. Create ViewSets
2. Set up URL routing
3. Add permissions and authentication
4. Create API documentation
5. Integration testing
