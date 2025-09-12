import { useState } from "react";
import { Search, ChefHat, Leaf } from "lucide-react";
import { Input } from "./components/ui/input";
import { Card, CardContent } from "./components/ui/card";
import { RecipeCard } from "./components/RecipeCard";
import { RecipeModal } from "./components/RecipeModal";
import { DietaryPreferences } from "./components/DietaryPreferences";
import { mockRecipes } from "./data/mockRecipes";
import type { Recipe, DietaryFilter } from "./types/recipe";

export default function App() {
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRecipe(null);
  };

  const filteredRecipes = mockRecipes.filter((recipe) => {
    // Search filter
    const matchesSearch =
      recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.dietaryTags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;

    // Dietary filters
    const activeFilters = Object.entries(filters).filter(([_, value]) => value);
    if (activeFilters.length === 0) return true;

    return activeFilters.every(([filterKey, _]) => {
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
  });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  //bg-gradient-to-br from--300 via-white to-blue-300">
  return (
    <div className="min-h-screen bg-[#bee378]/40">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-[#9dc257]/70 to-green-200 p-3 rounded-xl shadow-sm">
                <Leaf className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  NutriChoice or another name...
                </h1>
                <p className="text-gray-600 text-sm">
                  Discover recipes that nourish
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12 relative">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-green-600 font-medium">
              Fresh • Seasonal • Delicious
            </span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Discover recipes that bring joy to your kitchen
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            From farm-fresh ingredients to time-honored techniques, find recipes
            that match your taste, dietary needs, and cooking style. Every meal
            is a chance to nourish and delight.
          </p>
        </section>

        {/* Search Section */}
        <div className="relative max-w-lg mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-900" />
            <Input
              placeholder="Search recipes, ingredients, or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border-gray-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 focus:border-[#9dc257]-400"
            />
          </div>
        </div>

        {/* Dietary Preferences */}
        <DietaryPreferences filters={filters} onFiltersChange={setFilters} />

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
      </main>

      {/* Recipe Modal */}
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
