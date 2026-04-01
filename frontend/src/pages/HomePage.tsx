import { useState, useCallback, useMemo, useEffect } from "react";
import { ChefHat, Loader2 } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { RecipeModal } from "../components/recipe/RecipeModal";
import { HeroSection } from "../components/common/HeroSection";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { useRecipeSearch } from "../hooks/useRecipeSearch";
import type { Recipe, DietaryFilter } from "../types/recipe";

export function HomePage() {
  const { dietaryPreferences } = useUserPreferences();
  const [filters, setFilters] = useState<DietaryFilter>(dietaryPreferences);

  // Sync filters with user preferences when they change
  useEffect(() => {
    setFilters(dietaryPreferences);
  }, [dietaryPreferences]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Text search is server-side via useRecipeSearch (debounced).
  // On empty query the hook returns the full pre-loaded recipe list from context.
  const { recipes, isLoading } = useRecipeSearch(searchQuery);

  // Memoize the handleViewRecipe function to prevent unnecessary re-renders
  const handleViewRecipe = useCallback((recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  }, []);

  const handleFiltersChange = useCallback((newFilters: DietaryFilter) => {
    setFilters(newFilters);
  }, []);

  // Dietary tag filtering remains client-side — the recipes endpoint has no
  // dietary filter query param. Text search is already handled server-side.
  const filteredRecipes = useMemo(() => {
    const activeDietaryFilters = Object.entries(filters).filter(([, value]) => value);
    if (activeDietaryFilters.length === 0) return recipes;

    return recipes.filter((recipe) => {
      const filterMap: Record<string, string[]> = {
        vegetarian: ["Vegetarian", "Vegan"],
        vegan: ["Vegan"],
        glutenFree: ["Gluten-Free"],
        dairyFree: ["Dairy-Free"],
        eggFree: ["Egg-Free"],
        pescatarian: ["Pescatarian"],
        lowCarb: ["Low Carb"],
        keto: ["Keto"],
      };

      return activeDietaryFilters.every(([filterKey]) => {
        const requiredTags = filterMap[filterKey] || [];
        return requiredTags.some((tag) => recipe.dietary_tags.includes(tag));
      });
    });
  }, [recipes, filters]);

  // Simple calculation - memo overhead > benefit
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
                • {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                applied
              </span>
            )}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onViewRecipe={handleViewRecipe}
            />
          ))}
        </div>
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
