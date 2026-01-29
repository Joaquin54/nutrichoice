import type { RecipeReview } from '../types/recipe';

// Mock reviews per recipe (recipeId -> reviews). In a real app this would come from the API.
export const mockReviewsByRecipeId: Record<string, RecipeReview[]> = {
  '1': [
    { id: 'r1-1', recipeId: '1', userId: 'u1', username: 'foodie_anna', rating: 5, comment: 'So fresh and filling. Perfect for meal prep!', createdAt: '2025-01-15T12:00:00Z' },
    { id: 'r1-2', recipeId: '1', userId: 'u2', username: 'vegan_chef', rating: 4, comment: 'Loved the quinoa texture. Will make again.', createdAt: '2025-01-18T09:30:00Z' },
    { id: 'r1-3', recipeId: '1', userId: 'u3', username: 'health_first', rating: 5, comment: 'Easy and delicious. Great for weeknights.', createdAt: '2025-01-20T14:00:00Z' },
  ],
  '2': [
    { id: 'r2-1', recipeId: '2', userId: 'u4', username: 'pasta_lover', rating: 5, comment: 'Authentic carbonara. Creamy and perfect.', createdAt: '2025-01-14T18:00:00Z' },
    { id: 'r2-2', recipeId: '2', userId: 'u5', username: 'italian_fan', rating: 4, comment: 'Quick and tasty. Used guanciale as suggested.', createdAt: '2025-01-16T20:00:00Z' },
  ],
  '3': [
    { id: 'r3-1', recipeId: '3', userId: 'u6', username: 'grill_master', rating: 5, comment: 'Herb crust was amazing. Chicken stayed juicy.', createdAt: '2025-01-17T11:00:00Z' },
    { id: 'r3-2', recipeId: '3', userId: 'u7', username: 'keto_eater', rating: 4, comment: 'Fits my diet and tastes great with avocado.', createdAt: '2025-01-19T19:00:00Z' },
  ],
  '4': [
    { id: 'r4-1', recipeId: '4', userId: 'u8', username: 'seafood_fan', rating: 5, comment: 'Salmon was flaky and the herbs were perfect.', createdAt: '2025-01-13T12:30:00Z' },
    { id: 'r4-2', recipeId: '4', userId: 'u9', username: 'quick_cook', rating: 4, comment: 'Under 20 min and restaurant quality.', createdAt: '2025-01-21T17:00:00Z' },
  ],
  '5': [
    { id: 'r5-1', recipeId: '5', userId: 'u10', username: 'risotto_fan', rating: 5, comment: 'Worth the stirring. So creamy and rich.', createdAt: '2025-01-12T14:00:00Z' },
    { id: 'r5-2', recipeId: '5', userId: 'u11', username: 'mushroom_lover', rating: 4, comment: 'Used wild mushrooms—incredible depth of flavor.', createdAt: '2025-01-22T13:00:00Z' },
  ],
  '6': [
    { id: 'r6-1', recipeId: '6', userId: 'u12', username: 'salad_lover', rating: 5, comment: 'Classic Greek salad done right. Feta and olives are perfect.', createdAt: '2025-01-19T12:00:00Z' },
  ],
  '7': [
    { id: 'r7-1', recipeId: '7', userId: 'u13', username: 'ramen_fan', rating: 4, comment: 'Comforting and flavorful. Great for a cold day.', createdAt: '2025-01-21T18:00:00Z' },
    { id: 'r7-2', recipeId: '7', userId: 'u14', username: 'noodle_lover', rating: 5, comment: 'Miso broth was rich. Will make again!', createdAt: '2025-01-23T11:00:00Z' },
  ],
};

// Get reviews for a recipe, or empty array if none
export function getReviewsForRecipe(recipeId: string): RecipeReview[] {
  return mockReviewsByRecipeId[recipeId] ?? [];
}

// Average rating (1–5) for a recipe from its reviews
export function getAverageRating(reviews: RecipeReview[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10; // one decimal
}
