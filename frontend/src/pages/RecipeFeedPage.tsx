import { useState, useRef } from "react";
import { Heart, User, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";
import { useRecipeActions } from "../hooks/useRecipeActions";
import { mockRecipes } from "../data/mockRecipes";

// Mock user data for each recipe
const mockRecipeOwners: Record<string, { username: string; profilePicture?: string }> = {
  '1': { username: 'chef_maria', profilePicture: undefined },
  '2': { username: 'italian_chef', profilePicture: undefined },
  '3': { username: 'seafood_lover', profilePicture: undefined },
  '4': { username: 'dessert_master', profilePicture: undefined },
  '5': { username: 'spice_queen', profilePicture: undefined },
  '6': { username: 'healthy_eats', profilePicture: undefined },
  '7': { username: 'breakfast_pro', profilePicture: undefined },
};

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
  const [cardScrollPositions, setCardScrollPositions] = useState<Map<string, number>>(new Map());
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { toggleFavorite, isFavorite } = useRecipeActions();

  const handleFavoriteClick = (recipeId: string) => {
    toggleFavorite(recipeId);
  };

  const handleAddToCookbook = (recipeId: string) => {
    // TODO: Implement cookbook functionality
    console.log("Add to cookbook:", recipeId);
  };

  const handleCardScroll = (recipeId: string, scrollLeft: number) => {
    setCardScrollPositions((prev) => {
      const newMap = new Map(prev);
      newMap.set(recipeId, scrollLeft);
      return newMap;
    });
  };

  const handleScrollToBack = (recipeId: string) => {
    const cardElement = cardRefs.current.get(recipeId);
    if (cardElement) {
      cardElement.scrollTo({ left: cardElement.clientWidth, behavior: 'smooth' });
    }
  };

  const handleScrollToFront = (recipeId: string) => {
    const cardElement = cardRefs.current.get(recipeId);
    if (cardElement) {
      cardElement.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const isCardOnBack = (recipeId: string) => {
    const cardElement = cardRefs.current.get(recipeId);
    if (!cardElement) return false;
    const scrollLeft = cardScrollPositions.get(recipeId) ?? cardElement.scrollLeft;
    return scrollLeft > cardElement.clientWidth * 0.5;
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden -mt-2 -mx-3 sm:-mx-4" style={{ marginTop: '-8px', marginLeft: '-12px', marginRight: '-12px', width: 'calc(100% + 24px)' }}>
      {/* Feed Container - Vertical Scrollable - Full Viewport */}
      <div 
        ref={feedContainerRef}
        className="flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:y_mandatory] [scroll-padding-top:0px]"
      >
        <div className="w-[90%] max-w-[90%] mx-auto pt-0 pb-4 sm:pb-6">
          <div className="flex flex-col gap-4 sm:gap-6">
        {mockRecipes.map((recipe) => {
          // Filter out cultural cuisine tags from dietary tags
          const dietaryTagsOnly = recipe.dietaryTags.filter(
            tag => !CULTURAL_CUISINE_TAGS.includes(tag)
          );

          const isOnBack = isCardOnBack(recipe.id);

          return (
            <div
              key={recipe.id}
              className="h-[calc(90vh-90px)] sm:h-[calc(90vh-99px)] flex-shrink-0 relative"
              style={{
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              {/* Recipe Card Container - Horizontal Scrollable */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden h-full relative w-[90%] mx-auto">
                {/* Horizontal Scroll Container */}
                <div
                  ref={(el) => {
                    if (el) {
                      cardRefs.current.set(recipe.id, el);
                    } else {
                      cardRefs.current.delete(recipe.id);
                    }
                  }}
                  onScroll={(e) => handleCardScroll(recipe.id, e.currentTarget.scrollLeft)}
                  className="flex overflow-x-auto snap-x snap-mandatory h-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {/* Front Side - Recipe Card */}
                  <div className="flex flex-col sm:flex-row h-full w-full flex-shrink-0 snap-start">
                    {/* Left Side: Recipe Image (60% width on desktop, full width on mobile) */}
                    <div className="w-full sm:w-[60%] h-64 sm:h-full relative bg-gray-100 dark:bg-gray-900 flex-shrink-0">
                      <ImageWithFallback
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Right Side: Recipe Information (40% width on desktop, full width on mobile) */}
                    <div className="w-full sm:w-[40%] flex flex-col p-3 sm:p-4 lg:p-6 relative bg-white dark:bg-gray-800">
                      {/* Favorites Button - Top Right inside info area */}
                      <Button
                        onClick={() => handleFavoriteClick(recipe.id)}
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 sm:h-10 sm:w-10 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 z-10"
                        aria-label={isFavorite(recipe.id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart
                          className={`h-4 w-4 sm:h-5 sm:w-5 transition-all ${
                            isFavorite(recipe.id)
                              ? "fill-red-500 text-red-500 scale-110"
                              : "text-gray-400 hover:text-red-500"
                          }`}
                        />
                      </Button>

                      {/* Recipe Title */}
                      <div className="mt-8 sm:mt-10">
                        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 pr-10">
                          {recipe.title}
                        </h2>
                      </div>

                      {/* Recipe Tags */}
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                        {dietaryTagsOnly.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-[#6ec257]/10 text-[#6ec257] border-[#6ec257]/20 text-[10px] sm:text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Recipe Description Box */}
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 overflow-y-auto mb-2 sm:mb-3 min-h-0">
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Add to Cookbook Button */}
                      <Button
                        onClick={() => handleAddToCookbook(recipe.id)}
                        className="w-full bg-[#6ec257] hover:bg-[#5ba045] text-white font-semibold py-2 sm:py-3 text-xs sm:text-sm rounded-lg transition-colors"
                      >
                        Add to Cookbook
                      </Button>
                    </div>
                  </div>

                  {/* Back Side - Instructions and Ingredients */}
                  <div className="flex flex-col sm:flex-row h-full w-full flex-shrink-0 snap-start p-4 sm:p-6">
                    {/* Left Half: Instructions */}
                    <div className="w-full sm:w-1/2 flex flex-col pr-0 sm:pr-3 mb-4 sm:mb-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                        Instructions
                      </h3>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto">
                        <ol className="space-y-2 sm:space-y-3">
                          {recipe.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="bg-[#6ec257] text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0 text-[10px] sm:text-xs font-semibold">
                                {index + 1}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed pt-0.5">
                                {instruction}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {/* Right Half: Ingredients */}
                    <div className="w-full sm:w-1/2 flex flex-col pl-0 sm:pl-3">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                        Ingredients
                      </h3>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto">
                        <ul className="space-y-1.5 sm:space-y-2">
                          {recipe.ingredients.map((ingredient, index) => (
                            <li key={index} className="flex items-start gap-1.5">
                              <span className="text-[#6ec257] text-base leading-none pt-0.5">•</span>
                              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {ingredient}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Profile Card - Top Left - Only show on front side */}
                {!isOnBack && (
                  <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-30">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-gray-800 rounded-full px-2 sm:px-2.5 py-1 sm:py-1.5 shadow-md border border-gray-200 dark:border-gray-700 w-fit">
                      <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#6ec257] to-[#5ba045] flex items-center justify-center overflow-hidden">
                        {mockRecipeOwners[recipe.id]?.profilePicture ? (
                          <img
                            src={mockRecipeOwners[recipe.id].profilePicture}
                            alt={mockRecipeOwners[recipe.id]?.username || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white pr-1.5">
                        {mockRecipeOwners[recipe.id]?.username || 'User'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Indicator Dots - Bottom Center */}
                <div className="absolute bottom-[2px] sm:bottom-[6px] left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      !isOnBack
                        ? "bg-[#6ec257]"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                  <div
                    className={`w-2 h-2 rounded-full transition-all ${
                      isOnBack
                        ? "bg-[#6ec257]"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                </div>
              </div>

              {/* Left Arrow - Only show when back side is visible */}
              {isOnBack && (
                <Button
                  onClick={() => handleScrollToFront(recipe.id)}
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm z-20 rotate-180 left-[calc(5%-51px)] sm:left-[calc(5%-53px)]"
                  aria-label="Back to recipe"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              )}

              {/* Right Arrow - Only show when front side is visible */}
              {!isOnBack && (
                <Button
                  onClick={() => handleScrollToBack(recipe.id)}
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm z-20 right-[calc(5%-51px)] sm:right-[calc(5%-53px)]"
                  aria-label="View recipe details"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              )}
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
}
