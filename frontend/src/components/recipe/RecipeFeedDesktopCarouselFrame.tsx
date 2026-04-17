import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

type RecipeFeedDesktopCarouselFrameProps = {
  children: ReactNode;
  /** When false, side columns collapse and the card stays full width (desktop). */
  showArrows: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

/**
 * Wraps a recipe feed card on sm+ with prev/next controls outside the card edges.
 * On mobile, columns are hidden so children span full width; arrows stay in the in-card bottom bar.
 */
export function RecipeFeedDesktopCarouselFrame({
  children,
  showArrows,
  canGoPrevious,
  canGoNext,
  onPrevious,
  onNext,
}: RecipeFeedDesktopCarouselFrameProps) {
  const sideClass = (side: "left" | "right") =>
    showArrows
      ? side === "left"
        ? "hidden w-9 shrink-0 items-center justify-end sm:flex"
        : "hidden w-9 shrink-0 items-center justify-start sm:flex"
      : "hidden w-0 shrink-0 overflow-hidden sm:flex";

  const buttonClass =
    "h-9 w-9 shrink-0 rounded-full bg-white/90 shadow-md ring-1 ring-gray-200 backdrop-blur-sm hover:bg-white disabled:pointer-events-none disabled:opacity-35 dark:bg-gray-800/90 dark:ring-gray-600 dark:hover:bg-gray-800";

  return (
    <div className="flex h-full w-full min-h-0 items-stretch gap-1 px-2 sm:px-3">
      <div className={sideClass("left")}>
        {showArrows && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canGoPrevious}
            onClick={onPrevious}
            className={buttonClass}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        )}
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>

      <div className={sideClass("right")}>
        {showArrows && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={!canGoNext}
            onClick={onNext}
            className={buttonClass}
            aria-label="Next page"
          >
            <ChevronRight className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        )}
      </div>
    </div>
  );
}
