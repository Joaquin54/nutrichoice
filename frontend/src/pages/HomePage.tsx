import { useState, useCallback, useMemo, useEffect } from "react";
import { ChefHat } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { RecipeModal } from "../components/recipe/RecipeModal";
import { HeroSection } from "../components/common/HeroSection";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { mockRecipes } from "../data/mockRecipes";
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

  // Memoize the filtered recipes to prevent recalculation on every render
  const filteredRecipes = useMemo(() => {
    return mockRecipes.filter((recipe) => {
      // Search filter
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.dietaryTags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        recipe.cuisine?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Dietary filters
      const activeDietaryFilters = Object.entries(filters).filter(([_, value]) => value);
      if (activeDietaryFilters.length > 0) {
        const dietaryMatch = activeDietaryFilters.every(([filterKey, _]) => {
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

          const requiredTags = filterMap[filterKey] || [];
          return requiredTags.some((tag) => recipe.dietaryTags.includes(tag));
        });
        if (!dietaryMatch) return false;
      }

      return true;
    });
  }, [searchQuery, filters]);

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
      <div className="flex items-center justify-between mt-2">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recommended Recipes
            {activeFilterCount > 0 && (
              <span className="text-gray-500 dark:text-gray-400 font-normal">
                {" "}
                • {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                applied
              </span>
            )}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
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