import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { Heart, User, ChevronLeft, ChevronRight, Star, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ImageWithFallback } from "../components/ui/ImageWithFallback";
import { useRecipeActions } from "../hooks/useRecipeActions";
import { useCookbooks } from "../hooks/useCookbooks";
import { useRecipeFeed } from "../hooks/useRecipeFeed";
import {
  getReviewsForRecipe,
  getAverageRating,
  getReviewUpdatesSnapshot,
  subscribeToReviewUpdates,
} from "../data/mockReviews";
import { AddToCookbookPopover } from "../components/recipe/AddToCookbookPopover";
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
  const iconClass = size === "xs" ? "h-3.5 w-3.5" : "h-4 w-4";
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

const PREVIEW_REVIEWS_MAX = 1;

function RecipeReviewsSection({
  recipeId,
  recipeTitle,
  onOpenReviews,
}: {
  recipeId: string;
  recipeTitle: string;
  onOpenReviews: (recipeId: string, recipeTitle: string) => void;
}) {
  useSyncExternalStore(
    subscribeToReviewUpdates,
    getReviewUpdatesSnapshot,
    getReviewUpdatesSnapshot
  );
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
        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-left transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6ec257] focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-900/70 sm:p-3"
      >
        <h4 className="mb-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-base 2xl:text-lg">Reviews & ratings</h4>
        <p className="text-sm leading-snug text-gray-600 dark:text-gray-400 sm:text-base 2xl:text-lg">No reviews yet. Be the first to rate this recipe!</p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex min-h-0 w-full cursor-pointer flex-col rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-left transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#6ec257] focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-900/50 dark:hover:bg-gray-900/70 sm:p-3"
    >
      <div className="mb-2 flex flex-shrink-0 items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 sm:text-base 2xl:text-lg">Reviews & ratings</h4>
        {average != null && (
          <div className="flex shrink-0 items-center gap-1">
            <StarRating rating={average} size="sm" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:text-base 2xl:text-lg">{average.toFixed(1)}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 sm:text-base 2xl:text-lg">({reviews.length})</span>
          </div>
        )}
      </div>
      <div className="min-h-0 space-y-2 overflow-hidden pr-0.5">
        {previewReviews.map((review: RecipeReview) => (
          <div
            key={review.id}
            className="border-b border-gray-200/80 pb-2 text-sm last:border-0 last:pb-0 dark:border-gray-700/80 sm:text-base 2xl:text-lg"
          >
            <div className="mb-0.5 flex items-center gap-2">
              <span className="font-medium text-gray-800 dark:text-gray-200">{review.username}</span>
              <StarRating rating={review.rating} size="sm" />
            </div>
            <p className="leading-snug text-gray-600 line-clamp-2 dark:text-gray-400">{review.comment}</p>
          </div>
        ))}
      </div>
      {reviews.length > PREVIEW_REVIEWS_MAX && (
        <p className="mt-1.5 text-sm font-medium text-[#6ec257] sm:text-base 2xl:text-lg">View all {reviews.length} reviews →</p>
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
        className="flex-1 overflow-y-auto w-full snap-y snap-mandatory sm:snap-proximity [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] [scroll-padding-top:0px] [scroll-padding-bottom:env(safe-area-inset-bottom,0px)]"
      >
        <div className="mx-auto w-full max-w-full px-0 pt-0 pb-4 sm:pb-6">
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
            </div>
          )}
          {/* Recipe feed card height: on each card below — mobile uses 100dvh minus 7.5rem; sm+ uses 88vh minus 110px. Increase those subtrahends to shorten cards. */}
          <div className="flex flex-col gap-4 sm:gap-4">
        {recipes.map((recipe) => {
          const dietaryTagsOnly = recipe.dietary_tags.filter(
            tag => !CULTURAL_CUISINE_TAGS.includes(tag)
          );

          const pageIndex = getCardPageIndex(recipe.id);
          const totalPages = getCardTotalPages(recipe.id);
          const isOnFront = pageIndex === 0;
          const canGoToPreviousPage = pageIndex > 0;
          const canGoToNextPage = pageIndex < totalPages - 1;

          return (
            <div
              key={recipe.id}
              className="relative flex-shrink-0 snap-start snap-always h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom,0px))] min-h-[calc(100dvh-7.5rem-env(safe-area-inset-bottom,0px))] sm:h-[calc(88vh-110px)] sm:min-h-0 sm:snap-normal"
            >
              {/* Recipe Card Container — taller on mobile (see outer height); horizontal scroll inside */}
              <div className="relative mx-auto h-full w-full max-w-full overflow-hidden rounded-none border-x-0 border-y border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:rounded-xl sm:border-x sm:border-gray-200">
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
                  <div className="flex h-full min-h-0 w-full flex-shrink-0 flex-col snap-start sm:flex-row">
                    {/* Left Side: Recipe Image (60% width on desktop, full width on mobile) — 90% of prior h-64 / full column height */}
                    <div className="relative h-[14.4rem] w-full shrink-0 bg-gray-100 dark:bg-gray-900 sm:h-[90%] sm:w-[60%]">
                      <ImageWithFallback
                        src={recipe.image_1}
                        alt={recipe.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Right Side: Recipe Information (40% width on desktop, full width on mobile) */}
                    <div
                      className={`relative flex min-h-0 w-full flex-1 flex-col bg-white p-3 dark:bg-gray-800 sm:h-full sm:w-[40%] sm:p-4 lg:p-6 ${
                        /* Reserve space for bottom nav (bottom offset + row height) + 12px gap above it for reviews */
                        totalPages > 1
                          ? "pb-[calc(21px+2rem+12px)] sm:pb-[calc(21px+2.25rem+12px)]"
                          : ""
                      }`}
                    >
                      {/* Favorites Button - Top Right inside info area */}
                      <Button
                        onClick={() => handleFavoriteClick(recipe.id)}
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full hover:bg-red-50 dark:hover:bg-red-950/20 sm:h-10 sm:w-10"
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

                      <div className="flex min-h-0 flex-1 flex-col">
                        {/* Title + tags (fixed height) + description (flex-1, no scroll — fills space; long text ellipses). */}
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden pr-0.5">
                          {/* Recipe Title */}
                          <div className="mt-1 shrink-0 sm:mt-0">
                            <h2 className="mb-2 pr-10 text-base font-bold text-gray-900 dark:text-white sm:mb-3 sm:text-lg lg:text-xl 2xl:text-2xl">
                              {recipe.name}
                            </h2>
                          </div>

                          {/* Recipe Tags */}
                          <div className="mb-2 flex shrink-0 flex-wrap gap-1 sm:mb-3 sm:gap-1.5">
                            {dietaryTagsOnly.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="border-[#6ec257]/20 bg-[#6ec257]/10 px-2 py-0.5 text-xs text-[#6ec257] sm:text-sm"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Recipe Description — grows to use remaining space; overflow hidden + line clamp (no scrollbar). */}
                          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50 sm:p-3">
                              <p className="line-clamp-[20] break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:line-clamp-[28] sm:text-base 2xl:line-clamp-[32] 2xl:text-lg">
                                {recipe.description}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Reviews: multi-page — mt-auto pins to bottom nav with 12px via parent pb; single-page — space above in-flow cookbook */}
                        <div
                          className={
                            totalPages > 1
                              ? "mt-auto shrink-0 pt-2 sm:pt-3"
                              : "mt-10 mb-[12px] shrink-0 pt-2 sm:pt-3"
                          }
                        >
                          <RecipeReviewsSection
                            recipeId={recipe.id}
                            recipeTitle={recipe.name}
                            onOpenReviews={handleOpenReviews}
                          />
                        </div>

                        {totalPages === 1 && (
                          <div className="shrink-0 pt-0 sm:pt-2">
                            <AddToCookbookPopover
                              cookbooks={cookbooks}
                              recipeId={recipe.id}
                              onAdd={handleAddToCookbook}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Page 2 - Instructions */}
                  <div className="flex h-full w-full flex-shrink-0 snap-start flex-col p-4 pb-14 sm:hidden">
                    <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white sm:text-lg 2xl:text-xl">
                      Instructions
                    </h3>
                    <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50">
                      <ol className="space-y-2.5">
                        {recipe.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6ec257] text-xs font-semibold text-white shadow-sm">
                              {index + 1}
                            </span>
                            <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base 2xl:text-lg">
                              {instruction}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Mobile Page 3 - Ingredients */}
                  <div className="flex h-full w-full flex-shrink-0 snap-start flex-col p-4 pb-14 sm:hidden">
                    <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white sm:text-lg 2xl:text-xl">
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
                  <div className="hidden h-full w-full flex-shrink-0 snap-start flex-col p-4 pb-14 sm:flex sm:flex-row sm:p-6 sm:pb-16">
                    {/* Left Half: Instructions */}
                    <div className="mb-4 flex w-full flex-col pr-0 sm:mb-0 sm:w-1/2 sm:pr-3">
                      <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white sm:mb-3 sm:text-lg 2xl:text-xl">
                        Instructions
                      </h3>
                      <div className="flex-1 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/50 sm:p-4">
                        <ol className="space-y-2.5 sm:space-y-3">
                          {recipe.instructions.map((instruction, index) => (
                            <li key={index} className="flex items-start gap-2.5 sm:gap-3">
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6ec257] text-xs font-semibold text-white shadow-sm sm:h-7 sm:w-7 sm:text-sm">
                                {index + 1}
                              </span>
                              <span className="min-w-0 pt-0.5 text-sm leading-relaxed text-gray-800 dark:text-gray-200 sm:text-base 2xl:text-lg">
                                {instruction}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    {/* Right Half: Ingredients */}
                    <div className="flex w-full flex-col pl-0 sm:w-1/2 sm:pl-3">
                      <h3 className="mb-2 text-base font-bold text-gray-900 dark:text-white sm:mb-3 sm:text-lg 2xl:text-xl">
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

                {/* Prev + Add to Cookbook + next — fixed row above dots; cookbook only on overview page */}
                {totalPages > 1 && (
                  <div className="absolute bottom-[21px] left-3 right-3 z-[25] flex items-center gap-2 sm:bottom-[21px] sm:left-[60%] sm:right-0 sm:gap-3 sm:px-4 lg:px-6">
                    <Button
                      type="button"
                      onClick={() => handleScrollToFront(recipe.id)}
                      variant="ghost"
                      size="icon"
                      disabled={!canGoToPreviousPage}
                      className="h-8 w-8 shrink-0 rounded-full bg-white/90 shadow-md ring-1 ring-gray-200 backdrop-blur-sm hover:bg-white disabled:pointer-events-none disabled:opacity-35 dark:bg-gray-800/90 dark:ring-gray-600 dark:hover:bg-gray-800 sm:h-9 sm:w-9"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300 sm:h-5 sm:w-5" />
                    </Button>
                    <div className="min-w-0 flex-1">
                      {isOnFront && (
                        <AddToCookbookPopover
                          cookbooks={cookbooks}
                          recipeId={recipe.id}
                          onAdd={handleAddToCookbook}
                        />
                      )}
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleScrollToBack(recipe.id)}
                      variant="ghost"
                      size="icon"
                      disabled={!canGoToNextPage}
                      className="h-8 w-8 shrink-0 rounded-full bg-white/90 shadow-md ring-1 ring-gray-200 backdrop-blur-sm hover:bg-white disabled:pointer-events-none disabled:opacity-35 dark:bg-gray-800/90 dark:ring-gray-600 dark:hover:bg-gray-800 sm:h-9 sm:w-9"
                      aria-label="Next page"
                    >
                      <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                )}

                {/* User Profile Card - Top Left - Only show on front side */}
                {isOnFront && (
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
                <div className="absolute bottom-[6px] sm:bottom-[8px] left-1/2 -translate-x-1/2 flex gap-2 z-20">
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
