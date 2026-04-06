import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRecipes, type RecipeFilters } from '../api';
import type { Recipe } from '../types/recipe';

/**
 * Stable query key root for recipe list queries.
 * Scoped queries (search, creator filter, etc.) append filter params so they
 * sit in their own cache slot while still being invalidatable en-masse via
 * the root key.
 */
export const RECIPES_QUERY_KEY = ['recipes'] as const;

/**
 * Fetch and cache recipes from the backend.
 *
 * Calling this hook with no filters returns the paginated initial page (the
 * same data that was previously loaded by RecipesProvider on mount).
 * Calling with filters fetches a separate, independently cached result.
 *
 * TanStack Query deduplicates simultaneous calls with identical keys, so
 * multiple components calling useRecipes() share a single in-flight request.
 */
export function useRecipes(filters?: RecipeFilters) {
  const queryClient = useQueryClient();

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: [...RECIPES_QUERY_KEY, filters ?? null],
    queryFn: () => getRecipes(filters),
  });

  function getRecipeById(id: string): Recipe | undefined {
    return recipes.find((r) => r.id === id);
  }

  /**
   * Optimistically prepend a newly-created recipe to the unfiltered list cache
   * without triggering a full refetch.
   */
  function addRecipe(recipe: Recipe): void {
    queryClient.setQueryData<Recipe[]>(
      [...RECIPES_QUERY_KEY, null],
      (prev) => [recipe, ...(prev ?? [])]
    );
  }

  return { recipes, isLoading, getRecipeById, addRecipe };
}
