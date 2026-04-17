import { useParams, useNavigate } from 'react-router-dom';
import { useCookbooks } from '../hooks/useCookbooks';
import { useRecipes } from '../hooks/useRecipes';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { ChevronLeft, ChevronRight, BookOpen, GripVertical, Trash2, X, Loader2 } from 'lucide-react';
import type { Recipe } from '../types/recipe';
import { IngredientListItem } from '../components/recipe/IngredientListItem';
import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useLayoutEffect,
} from 'react';

const FLIP_MS = 600;
const FLIP_EASING = 'cubic-bezier(0.22, 0.99, 0.35, 1)';
const flipTransition = () => `transform ${FLIP_MS}ms ${FLIP_EASING}`;

/** Tailwind `md` breakpoint — two-page spread only at this width and up. */
function useIsMdUp() {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

/** Fully opaque paper (no alpha) — avoids ghosting during 3D flips. Cool teal paper, not warm brown. */
const PAGE_SHELL_LEFT =
  'bg-[#eef6f4] dark:bg-[#0f1c1e] border-r border-teal-200/75 dark:border-teal-800/55 shadow-[inset_4px_0_10px_rgba(15,118,110,0.06)] dark:shadow-[inset_4px_0_12px_rgba(0,0,0,0.35)]';
const PAGE_SHELL_RIGHT =
  'bg-[#eef6f4] dark:bg-[#0f1c1e] border-l border-teal-200/75 dark:border-teal-800/55 shadow-[inset_-4px_0_10px_rgba(15,118,110,0.06)] dark:shadow-[inset_-4px_0_12px_rgba(0,0,0,0.35)]';
/** Same cool teal paper as the desktop spread — mobile is single-column only (`md` breakpoint). */
const PAGE_SHELL_SINGLE =
  'bg-[#eef6f4] dark:bg-[#0f1c1e] shadow-[inset_0_0_12px_rgba(15,118,110,0.06)] dark:shadow-[inset_0_0_12px_rgba(0,0,0,0.35)]';
const PAGE_BACK_LIGHT = 'bg-[#e5dcc8]';
const PAGE_BACK_DARK = 'dark:bg-[#292524]';
const PAGE_PAD_LEFT = 'p-3 sm:p-5 md:p-6 xl:p-8 2xl:p-10';
const PAGE_PAD_RIGHT = 'p-4 sm:p-5 md:p-6 xl:p-8 2xl:p-10';

/**
 * One opaque leaf on the spine. Front = current side; back can be parchment or real recipe
 * (visible from ~90°–180° so content appears to replace as the page turns).
 */
const FlippingPageLeaf = forwardRef<
  HTMLDivElement,
  {
    hinge: 'left' | 'right';
    pageShell: string;
    scrollPad: string;
    recipe: Recipe | null;
    /** Omitted / 'parchment' = blank paper back. Otherwise recipe (or EmptyPage if null). */
    backRecipe?: Recipe | null | 'parchment';
    /**
     * Desktop two-page spread: hinge must sit at the spine center (middle of the gutter strip),
     * not the inner page edge — otherwise the fold looks wrong and the layout “jumps” when idle.
     */
    spineOffset?: boolean;
  }
>(function FlippingPageLeaf(
  { hinge, pageShell, scrollPad, recipe, backRecipe = 'parchment', spineOffset = false },
  ref
) {
  const transformOrigin =
    spineOffset && hinge === 'left'
      ? 'calc(-1 * var(--cookbook-spine-half, 0.375rem)) center'
      : spineOffset && hinge === 'right'
        ? 'calc(100% + var(--cookbook-spine-half, 0.375rem)) center'
        : hinge === 'left'
          ? 'left center'
          : 'right center';
  const showPaperBack = backRecipe === 'parchment';
  return (
    <div
      ref={ref}
      className="pointer-events-auto absolute inset-0 z-20 h-full w-full min-h-0 [transform-style:preserve-3d]"
      style={{ transformOrigin }}
    >
      <div
        className={`absolute inset-0 flex h-full w-full min-h-0 flex-col overflow-hidden ${pageShell}`}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
      >
        <div
          className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${scrollPad}`}
        >
          {recipe ? <RecipePageContent recipe={recipe} /> : <EmptyPage />}
        </div>
      </div>
      <div
        className={`absolute inset-0 flex h-full w-full min-h-0 flex-col overflow-hidden ${
          showPaperBack ? `${PAGE_BACK_LIGHT} ${PAGE_BACK_DARK} shadow-[inset_0_0_20px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_0_20px_rgba(0,0,0,0.4)]` : pageShell
        }`}
        style={{
          transform: 'rotateY(180deg)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
        aria-hidden={showPaperBack}
      >
        {!showPaperBack && (
          <div
            className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain ${scrollPad}`}
          >
            {backRecipe ? <RecipePageContent recipe={backRecipe} /> : <EmptyPage />}
          </div>
        )}
      </div>
    </div>
  );
});

export function CookbookViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCookbook, reorderRecipes, removeRecipeFromCookbook, fetchCookbookDetail } =
    useCookbooks();
  const { getRecipeById } = useRecipes();
  const cookbook = id ? getCookbook(id) : undefined;
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    fetchCookbookDetail(id).finally(() => setDetailLoading(false));
  }, [id, fetchCookbookDetail]);
  const [editRecipesOpen, setEditRecipesOpen] = useState(false);
  const [editRecipeIds, setEditRecipeIds] = useState<string[]>([]);

  const recipes: Recipe[] = useMemo(() => {
    if (!cookbook) return [];
    return cookbook.recipeIds
      .map((rid) => cookbook.recipes?.find((r) => r.id === rid) ?? getRecipeById(rid))
      .filter((r): r is Recipe => r != null);
  }, [cookbook, getRecipeById]);

  const isMdUp = useIsMdUp();
  const recipesPerSpread = isMdUp ? 2 : 1;
  const reduceMotion = usePrefersReducedMotion();

  // Desktop: one spread = two pages (recipes 0–1, 2–3, …). Mobile: one recipe per view.
  const [spreadIndex, setSpreadIndex] = useState(0);
  /** Single-page hinge flip: next = right leaf turns over spine; prev = left leaf turns back. */
  const [flipMode, setFlipMode] = useState<'idle' | 'next' | 'prev'>('idle');
  const pageFlipRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalSpreads = Math.max(1, Math.ceil(recipes.length / recipesPerSpread));
  const canGoPrev = spreadIndex > 0;
  const canGoNext = spreadIndex < totalSpreads - 1;
  const flipBusy = flipMode !== 'idle';

  const goPrev = useCallback(() => {
    if (!canGoPrev || flipBusy) return;
    // Page flip animation is md+ only; mobile advances the spread instantly.
    if (reduceMotion || !isMdUp) {
      setSpreadIndex((i) => i - 1);
      return;
    }
    setFlipMode('prev');
  }, [canGoPrev, flipBusy, reduceMotion, isMdUp]);

  const goNext = useCallback(() => {
    if (!canGoNext || flipBusy) return;
    if (reduceMotion || !isMdUp) {
      setSpreadIndex((i) => i + 1);
      return;
    }
    setFlipMode('next');
  }, [canGoNext, flipBusy, reduceMotion, isMdUp]);

  useLayoutEffect(() => {
    if (flipMode === 'idle' || reduceMotion || !isMdUp) return;
    const el = pageFlipRef.current;
    if (!el) return;

    const direction = flipMode;
    el.style.transition = flipTransition();
    el.style.transform = 'translateZ(1px) rotateY(0deg)';

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (direction === 'next') setSpreadIndex((i) => i + 1);
      else setSpreadIndex((i) => i - 1);
      setFlipMode('idle');
    };

    const fallback = window.setTimeout(finish, FLIP_MS + 400);

    const onEnd = (e: TransitionEvent) => {
      if (e.target !== el || e.propertyName !== 'transform') return;
      el.removeEventListener('transitionend', onEnd);
      window.clearTimeout(fallback);
      finish();
    };
    el.addEventListener('transitionend', onEnd);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transform =
          direction === 'next'
            ? 'translateZ(1px) rotateY(-180deg)'
            : 'translateZ(1px) rotateY(180deg)';
      });
    });

    return () => {
      window.clearTimeout(fallback);
      el.removeEventListener('transitionend', onEnd);
    };
  }, [flipMode, reduceMotion, isMdUp]);

  // If viewport shrinks below md during a flip, drop animation state (flip UI is desktop-only).
  useEffect(() => {
    if (!isMdUp && flipMode !== 'idle') {
      setFlipMode('idle');
    }
  }, [isMdUp, flipMode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if (editRecipesOpen) return;
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable="true"]')) return;
      e.preventDefault();
      if (e.key === 'ArrowLeft') goPrev();
      else goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, editRecipesOpen]);

  const spreadBase = spreadIndex * recipesPerSpread;
  const leftRecipe = recipes[spreadBase] ?? null;
  const rightRecipe = isMdUp ? recipes[spreadBase + 1] ?? null : null;

  const prevSpreadBase = (spreadIndex - 1) * recipesPerSpread;
  const nextSpreadBase = (spreadIndex + 1) * recipesPerSpread;
  const prevLeftRecipe = spreadIndex > 0 ? recipes[prevSpreadBase] ?? null : null;
  const prevRightRecipe =
    spreadIndex > 0 && isMdUp ? recipes[prevSpreadBase + 1] ?? null : null;
  const nextLeftRecipe =
    spreadIndex < totalSpreads - 1 ? recipes[nextSpreadBase] ?? null : null;
  const nextRightRecipe =
    spreadIndex < totalSpreads - 1 && isMdUp ? recipes[nextSpreadBase + 1] ?? null : null;
  const desktopRightStaticRecipe = flipMode === 'prev' ? prevRightRecipe : rightRecipe;

  useEffect(() => {
    setSpreadIndex((i) => Math.min(i, Math.max(0, totalSpreads - 1)));
  }, [totalSpreads]);

  // When cookbook has no recipes (after detail load), go back to My Cookbooks.
  // Do not redirect while recipeIds are still empty from the list view — wait for fetchCookbookDetail.
  useEffect(() => {
    if (detailLoading || !cookbook) return;
    if (cookbook.recipeIds.length === 0 && cookbook.recipeCount === 0) {
      navigate('/cookbooks', { replace: true });
    }
  }, [cookbook, detailLoading, navigate]);

  if (!cookbook) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-2 pt-4 sm:px-4">
        {detailLoading ? (
          <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
        ) : (
          <>
            <p className="text-muted-foreground">Cookbook not found.</p>
            <Button variant="outline" onClick={() => navigate('/cookbooks')}>
              Back to Cookbooks
            </Button>
          </>
        )}
      </div>
    );
  }

  if (recipes.length === 0) {
    if (detailLoading) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-2 pt-4 sm:px-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#6ec257]" />
        </div>
      );
    }
    if (cookbook.recipeCount > 0 && cookbook.recipeIds.length === 0) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-2 pt-4 sm:px-4">
          <p className="text-muted-foreground text-center">Could not load recipes for this cookbook.</p>
          <Button variant="outline" onClick={() => navigate('/cookbooks')}>
            Back to Cookbooks
          </Button>
        </div>
      );
    }
    return null; // Empty cookbook: redirecting to /cookbooks
  }

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col">
        <div className="mb-1 grid w-full shrink-0 grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-x-1 sm:gap-x-2">
          <div className="flex min-w-0 justify-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cookbooks')}
              className="text-muted-foreground shrink-0 px-2 sm:px-3"
            >
              ← Cookbooks
            </Button>
          </div>
          <h1 className="min-w-0 truncate text-center text-base font-semibold text-gray-900 dark:text-white md:text-lg xl:text-xl 2xl:text-2xl">
            {cookbook.name}
          </h1>
          <div className="flex min-w-0 justify-end">
            <Button
              variant="outline"
              size="sm"
              aria-label="Edit cookbook recipes"
              onClick={() => {
                setEditRecipeIds([...cookbook.recipeIds]);
                setEditRecipesOpen(true);
              }}
              className="shrink-0 border-[#6ec257]/40 px-2 text-xs text-[#6ec257] hover:bg-[#6ec257]/10 dark:border-[#6ec257]/50 dark:text-[#6ec257] dark:hover:bg-[#6ec257]/20 sm:px-3 sm:text-sm"
            >
              <span className="hidden sm:inline">Edit recipes</span>
              <span className="sm:hidden">Edit</span>
            </Button>
          </div>
        </div>

        <EditRecipesPanel
          open={editRecipesOpen}
          onOpenChange={setEditRecipesOpen}
          cookbookId={cookbook.id}
          recipeIds={editRecipeIds}
          onRecipeIdsChange={setEditRecipeIds}
          removeRecipeFromCookbook={removeRecipeFromCookbook}
          onSave={() => {
            reorderRecipes(cookbook.id, editRecipeIds);
            setEditRecipesOpen(false);
          }}
        />

        {/* Opened book: fills remaining viewport; page bodies scroll inside fixed shells. */}
        <div className="relative mt-2 flex min-h-0 w-full min-w-0 flex-1 items-stretch gap-1 self-stretch">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev || flipBusy}
            className="z-10 mr-0.5 shrink-0 self-center rounded-full bg-teal-800/90 p-1.5 text-teal-50 shadow-md transition-all hover:bg-teal-700 disabled:pointer-events-none disabled:opacity-40 dark:bg-teal-900/90 dark:text-teal-100 dark:hover:bg-teal-800 sm:mr-2 sm:p-2 md:mr-4 md:p-3 md:shadow-lg"
            aria-label={isMdUp ? 'Previous spread' : 'Previous recipe'}
          >
            <ChevronLeft className="h-4 w-4 xl:h-8 xl:w-8" />
          </button>

          <div
            className={`flex min-h-0 min-w-0 w-full flex-1 flex-col self-stretch rounded-lg border border-teal-300/60 bg-[#f3faf8] shadow-2xl dark:border-teal-950/45 dark:bg-[#050f12]/85 ${
              flipBusy ? 'overflow-visible' : 'overflow-hidden'
            }`}
            onTouchStart={(e) => {
              if (e.touches.length !== 1) return;
              const t = e.touches[0];
              touchStartRef.current = { x: t.clientX, y: t.clientY };
            }}
            onTouchEnd={(e) => {
              const start = touchStartRef.current;
              touchStartRef.current = null;
              if (!start || e.changedTouches.length !== 1) return;
              const t = e.changedTouches[0];
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              if (Math.abs(dx) < 56) return;
              if (Math.abs(dx) < Math.abs(dy) * 1.25) return;
              if (dx < 0) goNext();
              else goPrev();
            }}
          >
            {!isMdUp ? (
              <div
                className={`flex min-h-0 min-w-0 w-full flex-1 flex-col self-stretch overflow-hidden ${PAGE_SHELL_SINGLE}`}
              >
                <div className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${PAGE_PAD_LEFT}`}>
                  {leftRecipe ? <RecipePageContent recipe={leftRecipe} /> : <EmptyPage />}
                </div>
              </div>
            ) : (
              <div
                className="grid h-full min-h-0 min-w-0 w-full flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] items-stretch [--cookbook-spine-half:0.375rem] sm:[--cookbook-spine-half:0.5rem]"
              >
                {flipMode === 'prev' ? (
                  <div
                    className="relative flex min-h-0 min-w-0 w-full flex-col self-stretch [perspective:1800px]"
                    style={{ perspectiveOrigin: 'calc(100% + var(--cookbook-spine-half, 0.375rem)) center' }}
                  >
                    <div
                      className="pointer-events-none min-h-0 w-full min-w-0 flex-1 shrink-0"
                      aria-hidden
                    />
                    <div
                      className={`absolute inset-0 z-0 flex min-h-0 w-full flex-col overflow-hidden ${PAGE_SHELL_LEFT}`}
                    >
                      <div className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${PAGE_PAD_LEFT}`}>
                        {prevLeftRecipe ? (
                          <RecipePageContent recipe={prevLeftRecipe} />
                        ) : (
                          <EmptyPage />
                        )}
                      </div>
                    </div>
                    <FlippingPageLeaf
                      ref={pageFlipRef}
                      hinge="right"
                      pageShell={PAGE_SHELL_LEFT}
                      scrollPad={PAGE_PAD_LEFT}
                      recipe={leftRecipe}
                      backRecipe={prevRightRecipe}
                      spineOffset
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-full min-h-0 min-w-0 flex-col self-stretch overflow-hidden ${PAGE_SHELL_LEFT}`}
                  >
                    <div className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${PAGE_PAD_LEFT}`}>
                      {leftRecipe ? <RecipePageContent recipe={leftRecipe} /> : <EmptyPage />}
                    </div>
                  </div>
                )}

                <div className="w-3 min-h-0 shrink-0 self-stretch bg-gradient-to-b from-teal-800 via-teal-900 to-[#0a2629] shadow-[inset_0_0_14px_rgba(0,0,0,0.35)] dark:from-teal-950 dark:via-slate-950 dark:to-[#020617] sm:w-4" />

                {flipMode === 'next' ? (
                  <div
                    className="relative flex h-full min-h-0 min-w-0 flex-col self-stretch [perspective:1800px]"
                    style={{ perspectiveOrigin: 'calc(-1 * var(--cookbook-spine-half, 0.375rem)) center' }}
                  >
                    <div
                      className={`absolute inset-0 z-0 flex min-h-0 w-full flex-col overflow-hidden ${PAGE_SHELL_RIGHT}`}
                    >
                      <div className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${PAGE_PAD_RIGHT}`}>
                        {nextRightRecipe ? (
                          <RecipePageContent recipe={nextRightRecipe} />
                        ) : (
                          <EmptyPage />
                        )}
                      </div>
                    </div>
                    <FlippingPageLeaf
                      ref={pageFlipRef}
                      hinge="left"
                      pageShell={PAGE_SHELL_RIGHT}
                      scrollPad={PAGE_PAD_RIGHT}
                      recipe={rightRecipe}
                      backRecipe={nextLeftRecipe}
                      spineOffset
                    />
                  </div>
                ) : (
                  <div
                    className={`flex h-full min-h-0 min-w-0 flex-col self-stretch overflow-hidden ${PAGE_SHELL_RIGHT}`}
                  >
                    <div className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden ${PAGE_PAD_RIGHT}`}>
                      {flipMode === 'prev' ? (
                        <div className="min-h-0 flex-1" aria-hidden />
                      ) : desktopRightStaticRecipe ? (
                        <RecipePageContent recipe={desktopRightStaticRecipe} />
                      ) : (
                        <EmptyPage />
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext || flipBusy}
            className="z-10 ml-0.5 shrink-0 self-center rounded-full bg-teal-800/90 p-1.5 text-teal-50 shadow-md transition-all hover:bg-teal-700 disabled:pointer-events-none disabled:opacity-40 dark:bg-teal-900/90 dark:text-teal-100 dark:hover:bg-teal-800 sm:ml-2 sm:p-2 md:ml-4 md:p-3 md:shadow-lg"
            aria-label={isMdUp ? 'Next spread' : 'Next recipe'}
          >
            <ChevronRight className="h-4 w-4 xl:h-8 xl:w-8" />
          </button>
        </div>

        <p className="mt-1.5 shrink-0 text-center text-[11px] text-muted-foreground sm:text-xs md:text-sm">
          Page {spreadIndex + 1} of {totalSpreads}
          {recipes.length > 0 && (
            <span className="text-muted-foreground/80">
              {' '}
              ({recipes.length} recipe{recipes.length !== 1 ? 's' : ''})
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function EditRecipesPanel({
  open,
  onOpenChange,
  cookbookId,
  recipeIds,
  onRecipeIdsChange,
  removeRecipeFromCookbook,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cookbookId: string;
  recipeIds: string[];
  onRecipeIdsChange: (ids: string[]) => void;
  removeRecipeFromCookbook: (cookbookId: string, recipeId: string) => Promise<void>;
  onSave: () => void;
}) {
  const { getRecipeById } = useRecipes();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (recipeId: string) => {
    setRemoveError(null);
    setRemovingId(recipeId);
    try {
      await removeRecipeFromCookbook(cookbookId, recipeId);
      onRecipeIdsChange(recipeIds.filter((id) => id !== recipeId));
    } catch (e) {
      setRemoveError(e instanceof Error ? e.message : 'Failed to remove recipe.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.setData('application/json', JSON.stringify({ index }));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedIndex(null);
    const dragIndex = e.dataTransfer.getData('application/json')
      ? Number(JSON.parse(e.dataTransfer.getData('application/json')).index)
      : Number(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex || dragIndex < 0 || dragIndex >= recipeIds.length) return;
    const next = [...recipeIds];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(dropIndex, 0, removed);
    onRecipeIdsChange(next);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  useEffect(() => {
    if (!open) {
      setRemoveError(null);
      setRemovingId(null);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop - click to close */}
      <div
        className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
        aria-hidden
        onClick={() => onOpenChange(false)}
      />
      {/* Right-side panel - overlays content */}
      <div
        className="fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
        aria-label="Edit recipes"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Edit recipes</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground px-4 pt-2">
          Drag the handle to change order, or remove a recipe from this cookbook.
        </p>
        {removeError && (
          <p className="mx-4 mt-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {removeError}
          </p>
        )}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {recipeIds.map((recipeId, index) => {
            const recipe = getRecipeById(recipeId);
            const title = recipe?.name ?? 'Unknown recipe';
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            const isRemoving = removingId === recipeId;
            return (
              <div
                key={recipeId}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-1 rounded-lg border px-2 py-2 transition-colors ${
                  isDragging ? 'opacity-50 border-[#6ec257] bg-[#6ec257]/10' : ''
                } ${isDragOver ? 'border-[#6ec257] bg-[#6ec257]/10 ring-2 ring-[#6ec257]/30' : 'border-border bg-muted/30'}`}
              >
                <div
                  draggable={!isRemoving}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex min-w-0 flex-1 cursor-grab items-center gap-2 py-0.5 pl-1 active:cursor-grabbing"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate text-sm font-medium">{title}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  disabled={isRemoving}
                  aria-label={`Remove ${title} from cookbook`}
                  onClick={() => void handleRemove(recipeId)}
                >
                  {isRemoving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
        <div className="p-4 border-t border-border">
          <Button
            className="w-full bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
            onClick={onSave}
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );
}

function EmptyPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-8 text-center text-muted-foreground">
      <BookOpen className="mb-2 h-12 w-12 opacity-50" />
      <p className="text-sm">No recipe on this page</p>
    </div>
  );
}

function RecipePageContent({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex min-h-0 min-w-0 max-w-full flex-col break-words">
      <div className="relative mb-3 h-[calc(9rem_*_0.90)] md:h-[calc(11rem_*_0.90)] xl:h-[calc(14rem_*_0.90)] 2xl:h-[calc(16rem_*_0.90)] w-full shrink-0 overflow-hidden rounded-lg bg-amber-100 dark:bg-stone-800">
        <ImageWithFallback
          src={recipe.image_1}
          alt={recipe.name}
          className="h-full w-full object-cover"
        />
      </div>
      <h2 className="mb-1 font-serif text-base font-bold text-gray-900 dark:text-white xl:text-xl 2xl:text-2xl">
        {recipe.name}
      </h2>
      <p className="mb-3 line-clamp-3 text-xs text-muted-foreground xl:text-sm 2xl:text-base">
        {recipe.description}
      </p>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-800 dark:text-gray-200 xl:text-sm 2xl:text-base">
            Ingredients
          </p>
          <ul className="list-none columns-3 gap-x-3 space-y-1 text-muted-foreground">
            {recipe.ingredients.map((ing, i) => (
              <IngredientListItem key={i} variant="compact">
                {ing}
              </IngredientListItem>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1 xl:text-sm 2xl:text-base">
            Instructions
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[13px] leading-snug text-muted-foreground xl:text-sm 2xl:text-base">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
