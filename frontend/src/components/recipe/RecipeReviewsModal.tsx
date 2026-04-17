import { useState, useRef, useEffect } from "react";
import { Star, ThumbsUp, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  appendUserReview,
  getReviewsForRecipe,
  getAverageRating,
  removeUserReview,
  USER_REVIEW_AUTHOR_ID,
} from "../../data/mockReviews";
import type { RecipeReview } from "../../types/recipe";

function StarRatingDisplay({
  rating,
  max = 5,
  size = "sm",
}: {
  rating: number;
  max?: number;
  size?: "sm" | "xs";
}) {
  const full = Math.round(rating);
  const empty = max - full;
  const iconClass = size === "xs" ? "h-3 w-3" : "h-4 w-4";
  return (
    <span
      className="flex items-center gap-0.5 text-amber-500"
      aria-label={`${rating} out of ${max} stars`}
    >
      {Array.from({ length: full }, (_, i) => (
        <Star key={`full-${i}`} className={`${iconClass} fill-current`} />
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <Star
          key={`empty-${i}`}
          className={`${iconClass} text-gray-300 dark:text-gray-600`}
        />
      ))}
    </span>
  );
}

interface RecipeReviewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeId: string;
  recipeTitle: string;
}

export function RecipeReviewsModal({
  open,
  onOpenChange,
  recipeId,
  recipeTitle,
}: RecipeReviewsModalProps) {
  const initialReviews = getReviewsForRecipe(recipeId);
  const [localReviews, setLocalReviews] = useState<RecipeReview[]>(initialReviews);
  const [helpfulCounts, setHelpfulCounts] = useState<Record<string, number>>({});
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const writeFormRef = useRef<HTMLDivElement>(null);

  // Reset and sync when modal opens or recipeId changes
  useEffect(() => {
    if (open) {
      setLocalReviews(getReviewsForRecipe(recipeId));
      setHelpfulCounts({});
      setShowWriteForm(false);
      setNewRating(0);
      setNewComment("");
    }
  }, [open, recipeId]);

  const allReviews = localReviews;
  const average = getAverageRating(allReviews);

  const handleHelpful = (reviewId: string) => {
    setHelpfulCounts((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? 0) + 1,
    }));
  };

  const scrollToWriteForm = () => {
    setShowWriteForm(true);
    setTimeout(() => {
      writeFormRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleDeleteReview = (reviewId: string) => {
    removeUserReview(recipeId, reviewId);
    setLocalReviews(getReviewsForRecipe(recipeId));
    setHelpfulCounts((prev) => {
      const next = { ...prev };
      delete next[reviewId];
      return next;
    });
  };

  const handleSubmitReview = () => {
    if (newRating === 0 || !newComment.trim()) return;
    const review: RecipeReview = {
      id: `new-${Date.now()}`,
      recipeId,
      userId: USER_REVIEW_AUTHOR_ID,
      username: "You",
      rating: newRating,
      comment: newComment.trim(),
      createdAt: new Date().toISOString(),
    };
    appendUserReview(recipeId, review);
    setLocalReviews(getReviewsForRecipe(recipeId));
    setNewRating(0);
    setNewComment("");
    setShowWriteForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 pb-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <DialogTitle className="text-lg font-semibold pr-8">
            Reviews for {recipeTitle}
          </DialogTitle>
          {allReviews.length > 0 && average != null && (
            <div className="flex items-center gap-2 mt-1">
              <StarRatingDisplay rating={average} size="sm" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {average.toFixed(1)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({allReviews.length} {allReviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
          {allReviews.length === 0 && !showWriteForm ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No reviews yet. Be the first to rate this recipe!
            </p>
          ) : (
            <div className="space-y-4">
              {allReviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-gray-50/50 dark:bg-gray-900/30"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {review.username}
                    </span>
                    <div className="flex shrink-0 items-center gap-1">
                      <StarRatingDisplay rating={review.rating} size="xs" />
                      {review.userId === USER_REVIEW_AUTHOR_ID && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                          onClick={() => handleDeleteReview(review.id)}
                          aria-label="Delete your review"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="ml-1">Delete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                    {review.comment}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-gray-600 dark:text-gray-400 hover:text-[#6ec257]"
                    onClick={() => handleHelpful(review.id)}
                  >
                    <ThumbsUp className="h-3.5 w-3.5 mr-1" />
                    Helpful
                    {(helpfulCounts[review.id] ?? 0) > 0 && (
                      <span className="ml-1">({helpfulCounts[review.id]})</span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div ref={writeFormRef} className="pt-2">
            {showWriteForm ? (
              <div className="rounded-lg border border-[#6ec257]/40 dark:border-[#6ec257]/40 bg-[#6ec257]/5 dark:bg-[#6ec257]/10 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Write your review
                </h4>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1.5">
                    Your rating
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setNewRating(value)}
                        className="p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-[#6ec257] focus:ring-offset-2"
                        aria-label={`${value} stars`}
                      >
                        <Star
                          className={`h-8 w-8 ${
                            value <= newRating
                              ? "fill-amber-500 text-amber-500"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="review-comment"
                    className="text-xs text-gray-600 dark:text-gray-400 block mb-1.5"
                  >
                    Your comment
                  </label>
                  <textarea
                    id="review-comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your experience with this recipe..."
                    className="w-full min-h-[80px] px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6ec257] focus:border-transparent resize-y"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmitReview}
                    disabled={newRating === 0 || !newComment.trim()}
                    className="bg-[#6ec257] hover:bg-[#5ba045] text-white"
                  >
                    Submit review
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowWriteForm(false);
                      setNewRating(0);
                      setNewComment("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={scrollToWriteForm}
                className="w-full border-[#6ec257]/50 text-[#6ec257] hover:bg-[#6ec257]/10 hover:text-[#5ba045]"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Write your own review
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
