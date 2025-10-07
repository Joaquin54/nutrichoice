import { useState, useCallback, useMemo } from "react";
import { ChefHat } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { RecipeCard } from "../components/recipe/RecipeCard";
import { RecipeModal } from "../components/recipe/RecipeModal";
import { DietaryPreferences } from "../components/recipe/DietaryPreferences";
import { CuisineFilter } from "../components/recipe/CuisineFilter";
import { HeroSection } from "../components/common/HeroSection";
import { mockRecipes } from "../data/mockRecipes";
import type { Recipe, DietaryFilter, CuisineFilter as CuisineFilterType } from "../types/recipe";

export function HomePage() {
  const [filters, setFilters] = useState<DietaryFilter>({
    vegetarian: false,
    vegan: false,
    glutenFree: false,
    dairyFree: false,
    eggFree: false,
    pescatarian: false,
    lowCarb: false,
    keto: false,
  });

  const [cuisineFilters, setCuisineFilters] = useState<CuisineFilterType>({
    italian: false,
    french: false,
    mexican: false,
    american: false,
    japanese: false,
    chinese: false,
    indian: false,
    thai: false,
    mediterranean: false,
    korean: false,
  });

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

  const handleCuisineFiltersChange = useCallback((newCuisineFilters: CuisineFilterType) => {
    setCuisineFilters(newCuisineFilters);
  }, []);

  // Memoize the filtered recipes to prevent recalculation on every render
  // This is expensive with 100+ recipes and complex filtering logic
  const filteredRecipes = useMemo(() => {
    return mockRecipes.filter((recipe) => {
      // Search filter
      const matchesSearch =
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.dietaryTags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

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

      // Cuisine filters
      const activeCuisineFilters = Object.entries(cuisineFilters).filter(([_, value]) => value);
      if (activeCuisineFilters.length > 0) {
        const cuisineMatch = activeCuisineFilters.some(([cuisineKey, _]) => {
          const cuisineMap: Record<string, string> = {
            italian: "Italian",
            french: "French",
            mexican: "Mexican",
            american: "American",
            japanese: "Japanese",
            chinese: "Chinese",
            indian: "Indian",
            thai: "Thai",
            mediterranean: "Mediterranean",
            korean: "Korean",
          };
          const cuisineName = cuisineMap[cuisineKey];
          return recipe.cuisine?.toLowerCase() === cuisineName.toLowerCase();
        });
        if (!cuisineMatch) return false;
      }

      return true;
    });
  }, [searchQuery, filters, cuisineFilters]);

  // Simple calculation - memo overhead > benefit
  const activeFilterCount = Object.values(filters).filter(Boolean).length + 
                           Object.values(cuisineFilters).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <HeroSection 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Filters Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CuisineFilter 
          filters={cuisineFilters} 
          onFiltersChange={handleCuisineFiltersChange} 
        />
        <DietaryPreferences 
          filters={filters} 
          onFiltersChange={handleFiltersChange} 
        />
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Recommended Recipes
            {activeFilterCount > 0 && (
              <span className="text-gray-500 font-normal">
                {" "}
                • {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
                applied
              </span>
            )}
          </h3>
          <p className="text-gray-600">
            {filteredRecipes.length} recipe
            {filteredRecipes.length !== 1 ? "s" : ""} found
          </p>
        </div>
      </div>

      {/* Recipe Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No recipes found
            </h3>
            <p className="text-gray-600">
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