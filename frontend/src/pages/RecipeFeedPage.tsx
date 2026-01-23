import { useState, useEffect } from "react";
import { Heart, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";
import { useRecipeActions } from "../hooks/useRecipeActions";
import { mockRecipes } from "../data/mockRecipes";
import type { Recipe } from "../types/recipe";
import { getCurrentUser, type User as UserType } from "../api";

// Cultural cuisine tags to filter out from dietary tags
const CULTURAL_CUISINE_TAGS = [
  'Italian', 'italian',
  'French', 'french',
  'Mexican', 'mexican',
  'American', 'american',
  'Japanese', 'japanese',
  'Chinese', 'chinese',
  'Indian', 'indian',
  'Thai', 'thai',
  'Mediterranean', 'mediterranean',
  'Korean', 'korean',
];

export function RecipeFeedPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [user, setUser] = useState<UserType | null>(null);
  const { toggleFavorite, isFavorite } = useRecipeActions();

  useEffect(() => {
    // Fetch current user
    getCurrentUser()
      .then(setUser)
      .catch((error) => console.error("Failed to fetch user:", error));
  }, []);

  const currentRecipe: Recipe = mockRecipes[currentIndex];

  // Filter out cultural cuisine tags from dietary tags
  const dietaryTagsOnly = currentRecipe.dietaryTags.filter(
    tag => !CULTURAL_CUISINE_TAGS.includes(tag)
  );

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(mockRecipes.length - 1, prev + 1));
  };

  const isAtStart = currentIndex === 0;
  const isAtEnd = currentIndex === mockRecipes.length - 1;

  const handleFavoriteClick = () => {
    toggleFavorite(currentRecipe.id);
  };

  const handleAddToCookbook = () => {
    // TODO: Implement cookbook functionality
    console.log("Add to cookbook:", currentRecipe.id);
  };

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col">
      {/* User Profile Header - Above the feed container */}
      <div className="mb-3 sm:mb-4 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-gray-800 rounded-full px-3 py-2 shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#6ec257] to-[#5ba045] flex items-center justify-center overflow-hidden">
            {user?.profile?.profile_picture ? (
              <img
                src={user.profile.profile_picture}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </div>
          <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white pr-2">
            {user?.username || "Loading..."}
          </span>
        </div>
      </div>

      {/* Feed Container */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative px-2 sm:px-3 py-4 sm:py-6">
        {/* Main Content Area with Navigation Arrows on the outside */}
        <div className="h-full flex items-center gap-2 sm:gap-3">
          {/* Left Navigation Arrow - Outside content area but inside feed container */}
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            disabled={isAtStart}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous recipe"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
          </Button>

          {/* Inner Container - Image and Info Area */}
          <div className="flex-1 flex h-full bg-gray-50 dark:bg-gray-900/30 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Left Side: Recipe Image (2/3 width) */}
            <div className="w-2/3 relative bg-gray-100 dark:bg-gray-900 flex-shrink-0">
              <ImageWithFallback
                src={currentRecipe.image}
                alt={currentRecipe.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Right Side: Recipe Information (1/3 width) */}
            <div className="w-1/3 flex flex-col p-3 sm:p-4 lg:p-6 relative bg-white dark:bg-gray-800">
              {/* Favorites Button - Top Right inside info area */}
              <Button
                onClick={handleFavoriteClick}
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 z-10"
                aria-label={isFavorite(currentRecipe.id) ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart
                  className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${
                    isFavorite(currentRecipe.id)
                      ? "fill-red-500 text-red-500 scale-110"
                      : "text-gray-400 hover:text-red-500"
                  }`}
                />
              </Button>

              {/* Recipe Title */}
              <div className="mt-8 sm:mt-10">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 pr-10">
                  {currentRecipe.title}
                </h1>
              </div>

              {/* Recipe Tags */}
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                {dietaryTagsOnly.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-[#6ec257]/10 text-[#6ec257] border-[#6ec257]/20 text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Recipe Description Box */}
              <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 overflow-y-auto mb-2 sm:mb-3 min-h-0">
                <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                  {currentRecipe.description}
                </p>
                
                {/* Additional Recipe Info */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Cook Time:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentRecipe.cookTime} min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Servings:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentRecipe.servings}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{currentRecipe.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Add to Cookbook Button */}
              <Button
                onClick={handleAddToCookbook}
                className="w-full bg-[#6ec257] hover:bg-[#5ba045] text-white font-semibold py-2 sm:py-3 text-xs sm:text-sm rounded-lg transition-colors"
              >
                Add to Cookbook
              </Button>
            </div>
          </div>

          {/* Right Navigation Arrow - Outside content area but inside feed container */}
          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            disabled={isAtEnd}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next recipe"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-gray-700 dark:text-gray-300" />
          </Button>
        </div>
      </div>
    </div>
  );
}
