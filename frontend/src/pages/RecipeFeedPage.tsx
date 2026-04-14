import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, User, ChevronRight, Star, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";
import { useRecipeActions } from "../hooks/useRecipeActions";
import { useCookbooks } from "../hooks/useCookbooks";
import { useRecipeFeed } from "../hooks/useRecipeFeed";
import { getReviewsForRecipe, getAverageRating } from "../data/mockReviews";
import { RecipeReviewsModal } from "../components/recipe/RecipeReviewsModal";
import { IngredientListItem } from "../components/recipe/IngredientListItem";
import type { RecipeReview } from "../types/recipe";

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

function StarRating({ rating, max = 5, size = "sm" }: { rating: number; max?: number; size?: "sm" | "xs" }) {
  const full = Math.round(rating);
  const empty = max - full;
  const iconClass = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span className="flex items-center gap-0.5 text-amber-500" aria-label={`${rating} out of ${max} stars`}>
      {Array.from({ length: full }, (_, i) => (
        <Star key={`full-${i}`} className={`${iconClass} fill-current`} />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <Star key={`empty-${i}`} className={`${iconClass} text-gray-300 dark:text-gray-600`} />
      ))}
    </span>
  );
}

const PREVIEW_REVIEWS_MAX = 2;

function RecipeReviewsSection({
  recipeId,
  recipeTitle,
  onOpenReviews,
}: {
  recipeId: string;
  recipeTitle: string;
  onOpenReviews: (recipeId: string, recipeTitle: string) => void;
}) {
  const reviews = getReviewsForRecipe(recipeId);
  const previewReviews = reviews.slice(0, PREVIEW_REVIEWS_MAX);
  const average = getAverageRating(reviews);

  const handleClick = () => {
    onOpenReviews(recipeId, recipeTitle);
  };

  if (reviews.length === 0) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2 sm:p-2.5 mb-2 sm:mb-3 hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6ec257] focus:ring-offset-2"
      >
        <h4 className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Reviews & ratings</h4>
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">No reviews yet. Be the first to rate this recipe!</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-2 sm:p-2.5 mb-2 sm:mb-3 min-h-0 flex flex-col hover:bg-gray-100 dark:hover:bg-gray-900/70 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6ec257] focus:ring-offset-2"
    >
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <h4 className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300">Reviews & ratings</h4>
        {average != null && (
          <div className="flex items-center gap-1">
            <StarRating rating={average} size="xs" />
            <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">{average.toFixed(1)}</span>
            <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">({reviews.length})</span>
          </div>
        )}
      </div>
      <div className="overflow-hidden min-h-0 space-y-1.5 pr-0.5">
        {previewReviews.map((review: RecipeReview, index) => (
          <div
            key={review.id}
            className={`text-[10px] sm:text-xs border-b border-gray-200/80 dark:border-gray-700/80 last:border-0 last:pb-0 pb-1.5 ${
              index === 1 ? "hidden sm:block" : ""
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-medium text-gray-800 dark:text-gray-200">{review.username}</span>
              <StarRating rating={review.rating} size="xs" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 leading-snug line-clamp-2">{review.comment}</p>
          </div>
        ))}
      </div>
      {reviews.length > PREVIEW_REVIEWS_MAX && (
        <p className="text-[10px] sm:text-xs text-[#6ec257] font-medium mt-1">View all {reviews.length} reviews →</p>
      )}
    </button>
  );
}

export function RecipeFeedPage() {
  const [cardScrollPositions, setCardScrollPositions] = useState<Map<string, number>>(new Map());
  const [reviewsModalOpen, setReviewsModalOpen] = useState(false);
  const [reviewsModalRecipeId, setReviewsModalRecipeId] = useState<string>("");
  const [reviewsModalRecipeTitle, setReviewsModalRecipeTitle] = useState<string>("");
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { toggleFavorite, isFavorite } = useRecipeActions();
  const { cookbooks, addRecipeToCookbook } = useCookbooks();
  const { recipes, isLoading, isLoadingMore, hasMore, loadMore } = useRecipeFeed();

  // Keep a stable ref to loadMore so the observer callback never goes stale.
  const loadMoreRef = useRef(loadMore);
  loadMoreRef.current = loadMore;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = feedContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current();
        }
      },
      { root: container, threshold: 0.1, rootMargin: '0px 0px 300px 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []); // observer is created once; loadMoreRef keeps the callback current

  const getCardPageIndex = (recipeId: string) => {
    const cardElement = cardRefs.current.get(recipeId);
    if (!cardElement) return 0;
    const scrollLeft = cardScrollPositions.get(recipeId) ?? cardElement.scrollLeft;
    const pageWidth = cardElement.clientWidth || 1;
    const rawIndex = Math.round(scrollLeft / pageWidth);
    const totalPages = Math.max(1, Math.round(cardElement.scrollWidth / pageWidth));
    return Math.min(totalPages - 1, Math.max(0, rawIndex));
  };

  const getCardTotalPages = (recipeId: string) => {
    const cardElement = cardRefs.current.get(recipeId);
    if (!cardElement) return 2;
    const pageWidth = cardElement.clientWidth || 1;
    return Math.max(1, Math.round(cardElement.scrollWidth / pageWidth));
  };

  const handleOpenReviews = (recipeId: string, recipeTitle: string) => {
    setReviewsModalRecipeId(recipeId);
    setReviewsModalRecipeTitle(recipeTitle);
    setReviewsModalOpen(true);
  };

  const handleFavoriteClick = (recipeId: string) => {
    toggleFavorite(recipeId);
  };

  const handleAddToCookbook = (recipeId: string, cookbookId: string) => {
    addRecipeToCookbook(cookbookId, recipeId);
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
    if (!cardElement) return;
    const pageWidth = cardElement.clientWidth || 1;
    const totalPages = getCardTotalPages(recipeId);
    const currentIndex = getCardPageIndex(recipeId);
    const nextIndex = Math.min(totalPages - 1, currentIndex + 1);
    cardElement.scrollTo({ left: nextIndex * pageWidth, behavior: 'smooth' });
  };

  const handleScrollToFront = (recipeId: string) => {
    const cardElement = cardRefs.current.get(recipeId);
    if (!cardElement) return;
    const pageWidth = cardElement.clientWidth || 1;
    const currentIndex = getCardPageIndex(recipeId);
    const prevIndex = Math.max(0, currentIndex - 1);
    cardElement.scrollTo({ left: prevIndex * pageWidth, behavior: 'smooth' });
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden -mt-2 -mx-3 sm:-mx-4" style={{ marginTop: '-8px', marginLeft: '-12px', marginRight: '-12px', width: 'calc(100% + 24px)' }}>
      {/* Feed Container - Vertical Scrollable - Full Viewport */}
      <div 
        ref={feedContainerRef}
        className="flex-1 overflow-y-auto w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [scroll-snap-type:y_proximity] [scroll-padding-top:0px]"
      >
        <div className="w-[90%] max-w-[90%] mx-auto pt-0 pb-4 sm:pb-6">
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
            </div>
          )}
          <div className="flex flex-col gap-4 sm:gap-4">
        {recipes.map((recipe) => {
          const dietaryTagsOnly = recipe.dietary_tags.filter(
            tag => !CULTURAL_CUISINE_TAGS.includes(tag)
          );

          const pageIndex = getCardPageIndex(recipe.id);
          const totalPages = getCardTotalPages(recipe.id);
          const isOnBack = pageIndex > 0;

          return (
            <div
              key={recipe.id}
              className="h-[calc(88vh-90px)] sm:h-[calc(88vh-99px)] flex-shrink-0 relative" //RECIPE HEIGHTTODO: Change to 88vh-90px when reviews are implemented
              //if description is larger adjust the card height.
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
                        src={recipe.image_1}
                        alt={recipe.name}
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
                        aria-label={isFavorite(recipe.id) ? "Unlike recipe" : "Like recipe"}
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
                      <div className="mt-1 sm:mt-0">
                        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 pr-10">
                          {recipe.name}
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
                      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 sm:p-3 border border-gray-200 dark:border-gray-700 mb-2 sm:mb-3">
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {recipe.description}
                        </p>
                      </div>

                      {/* Reviews & Ratings */}
                      <RecipeReviewsSection
                        recipeId={recipe.id}
                        recipeTitle={recipe.name}
                        onOpenReviews={handleOpenReviews}
                      />

                      {/* Add to Cookbook - anchored to bottom, popover to choose cookbook */}
                      <div className="mt-auto">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              className="w-full bg-[#6ec257] hover:bg-[#5ba045] text-white font-semibold py-2 sm:py-3 text-xs sm:text-sm rounded-lg transition-colors"
                            >
                              Add to Cookbook
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-2" align="center" side="top">
                            <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                              Choose a cookbook
                            </p>
                            {cookbooks.length === 0 ? (
                              <p className="text-xs text-muted-foreground px-2 py-2">
                                No cookbooks yet.{" "}
                                <Link
                                  to="/cookbooks"
                                  className="text-[#6ec257] hover:underline"
                                >
                                  Create one
                                </Link>
                                .
                              </p>
                            ) : (
                              <ul className="max-h-48 overflow-y-auto">
                                {cookbooks.map((cb) => {
                                  const alreadyAdded = cb.recipeIds.includes(recipe.id);
                                  return (
                                    <li key={cb.id}>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          !alreadyAdded &&
                                          handleAddToCookbook(recipe.id, cb.id)
                                        }
                                        disabled={alreadyAdded}
                                        className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted disabled:opacity-60 disabled:cursor-default"
                                      >
                                        {cb.name}
                                        {alreadyAdded && (
                                          <span className="ml-1 text-xs text-[#6ec257]">
                                            ✓
                                          </span>
                                        )}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Page 2 - Instructions */}
                  <div className="flex flex-col h-full w-full flex-shrink-0 snap-start p-4 sm:hidden">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Instructions
                    </h3>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 overflow-y-auto">
                      <ol className="space-y-2">
                        {recipe.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="bg-[#6ec257] text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-[10px] font-semibold shadow-sm">
                              {index + 1}
                            </span>
                            <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pt-0.5 min-w-0">
                              {instruction}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Mobile Page 3 - Ingredients */}
                  <div className="flex flex-col h-full w-full flex-shrink-0 snap-start p-4 sm:hidden">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                      Ingredients
                    </h3>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 overflow-y-auto">
                      <ul className="list-none space-y-2">
                        {recipe.ingredients.map((ingredient, index) => (
                          <IngredientListItem key={index} variant="feed">
                            {ingredient}
                          </IngredientListItem>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Desktop / Tablet Back Side - Instructions and Ingredients */}
                  <div className="hidden sm:flex flex-col sm:flex-row h-full w-full flex-shrink-0 snap-start p-4 sm:p-6">
                    {/* Left Half: Instructions */}
                    <div className="w-full sm:w-1/2 flex flex-col pr-0 sm:pr-3 mb-4 sm:mb-0">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">
                        Instructions
                      </h3>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 sm:p-4 border border-gray-200 dark:border-gray-700 overflow-y-auto">
                        <ol className="space-y-2 sm:space-y-2.5">
                          {recipe.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start gap-2 sm:gap-2.5">
                              <span className="bg-[#6ec257] text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center flex-shrink-0 text-[10px] sm:text-xs font-semibold shadow-sm">
                                {index + 1}
                              </span>
                              <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed pt-0.5 min-w-0">
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
                        <ul className="list-none space-y-1.5 sm:space-y-2">
                          {recipe.ingredients.map((ingredient, index) => (
                            <IngredientListItem key={index} variant="feed">
                              {ingredient}
                            </IngredientListItem>
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
                        <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white pr-1.5">
                        {recipe.creator ?? 'User'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Indicator Dots - Bottom Center */}
                <div className="absolute bottom-[2px] sm:bottom-[6px] left-1/2 -translate-x-1/2 flex gap-2 z-20">
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all ${
                        pageIndex === index
                          ? "bg-[#6ec257]"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Left Arrow - Only show when back side is visible */}
              {isOnBack && (
                <Button
                  onClick={() => handleScrollToFront(recipe.id)}
                  variant="ghost"
                  size="icon"
                  className="absolute top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm z-20 rotate-180 left-[calc(5%-40px)] sm:left-[calc(5%-53px)]"
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
                  className="absolute top-1/2 -translate-y-1/2 h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm z-20 right-[calc(5%-40px)] sm:right-[calc(5%-53px)]"
                  aria-label="View recipe details"
                >
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700 dark:text-gray-300" />
                </Button>
              )}
            </div>
          );
        })}
          </div>

          {/* Sentinel div observed by IntersectionObserver to trigger loadMore */}
          <div ref={sentinelRef} className="h-24" aria-hidden="true" />

          {/* Loading indicator shown while fetching the next page */}
          {isLoadingMore && (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#6ec257]" />
            </div>
          )}

          {/* End-of-feed message once all recipes have been loaded */}
          {!hasMore && !isLoading && recipes.length > 0 && (
            <p className="text-center text-xs text-gray-400 dark:text-gray-600 py-4">
              You&apos;ve seen all recipes in your feed.
            </p>
          )}
        </div>
      </div>

      <RecipeReviewsModal
        open={reviewsModalOpen}
        onOpenChange={setReviewsModalOpen}
        recipeId={reviewsModalRecipeId}
        recipeTitle={reviewsModalRecipeTitle}
      />
    </div>
  );
}
