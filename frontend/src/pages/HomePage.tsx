import { useState, useCallback, useEffect, useRef } from "react";
import { ChefHat, Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { RecipeModal } from "../components/recipe/RecipeModal";
import { HeroSection } from "../components/common/HeroSection";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useRecipeLookup } from "../hooks/useRecipeLookup";
import { useRecipeActions } from "../hooks/useRecipeActions";
import type { Recipe, DietaryFilter } from "../types/recipe";
import { getRecipe } from "../api";

/**
 * Shallow-equality check for a DietaryFilter object (fixed set of boolean keys).
 * Avoids adding a dependency on lodash for this narrow use case.
 */
function dietaryFilterEqual(a: DietaryFilter, b: DietaryFilter): boolean {
  const keys = Object.keys(a) as Array<keyof DietaryFilter>;
  return keys.every((k) => a[k] === b[k]);
}

export function HomePage() {
  const { dietaryPreferences } = useUserPreferences();
  const { isFavorite, toggleFavorite } = useRecipeActions();

  // Local session-level filter state — seeded from the user's profile but
  // NEVER written back to it (F2b). Changes here are override-only.
  const [filters, setFilters] = useState<DietaryFilter>(dietaryPreferences);

  // Track whether profilePrefs have been initialised so we sync only on first load.
  const profileSyncedRef = useRef(false);
  useEffect(() => {
    if (!profileSyncedRef.current) {
      setFilters(dietaryPreferences);
      profileSyncedRef.current = true;
    }
  }, [dietaryPreferences]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute dietOverride:
  //   - null  → use the user's profile prefs server-side (no ?diets= param)
  //   - object → send as ?diets= params (session override, never persisted)
  const isDirty = !dietaryFilterEqual(filters, dietaryPreferences);
  const dietOverride: DietaryFilter | null = isDirty ? filters : null;

  const { recipes, isLoading, isLoadingMore, hasMore, loadMore, totalCount } =
    useRecipeLookup({ search: searchQuery, dietOverride });

  // Callback ref for IntersectionObserver — attaches the observer at the moment
  // the sentinel element mounts (after the first page of results renders), not at
  // component mount (when the sentinel does not yet exist in the DOM).
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (node === null) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px 300px 0px" }
    );
    observerRef.current.observe(node);
  }, []); // empty deps: loadMoreRef keeps the callback current without re-creating the ref

  // Disconnect the observer on component unmount.
  useEffect(() => () => { observerRef.current?.disconnect(); }, []);

  const handleViewRecipe = useCallback(async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);

    // Recipe list responses are lightweight and omit nested details.
    // Fetch full detail so the modal can always render ingredients/instructions.
    const recipeId = Number(recipe.id);
    if (!Number.isFinite(recipeId)) return;

    try {
      const detailedRecipe = await getRecipe(recipeId);
      setSelectedRecipe((current) =>
        current?.id === recipe.id ? detailedRecipe : current
      );
    } catch (error) {
      console.error("Failed to load full recipe details:", error);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: DietaryFilter) => {
    // Update local state only — do NOT call updateDietaryPreferences (F2b).
    setFilters(newFilters);
  }, []);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div>
      {/* Hero Section with Dietary Dropdown */}
      <HeroSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dietaryFilters={filters}
        onDietaryFiltersChange={handleFiltersChange}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between mt-2 sm:mt-4">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            Recommended Recipes
            {activeFilterCount > 0 && (
              <span className="hidden sm:inline text-gray-500 dark:text-gray-400 font-normal">
                {" "}
                &bull; {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                applied
              </span>
            )}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {totalCount} recipe{totalCount !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
        </div>
      ) : recipes.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onViewRecipe={handleViewRecipe}
                isFavorite={isFavorite(recipe.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>

          {/* Incremental load indicator — shown while fetching the next page */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#6ec257]" />
            </div>
          )}

          {/* End-of-feed message */}
          {!hasMore && recipes.length > 0 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
              You&apos;ve seen all matching recipes.
            </p>
          )}

          {/* Sentinel div — IntersectionObserver target */}
          <div ref={sentinelRef} className="h-24" aria-hidden="true" />
        </>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <ChefHat className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or dietary preferences to find
              more recipes.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
