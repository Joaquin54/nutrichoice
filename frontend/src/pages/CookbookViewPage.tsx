import { useParams, useNavigate } from 'react-router-dom';
import { useCookbooks } from '../hooks/useCookbooks';
import { mockRecipes } from '../data/mockRecipes';
import { Button } from '../components/ui/button';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { ChevronLeft, ChevronRight, BookOpen, GripVertical, X, Loader2 } from 'lucide-react';
import type { Recipe } from '../types/recipe';
import { useState, useMemo, useEffect } from 'react';


export function CookbookViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCookbook, reorderRecipes, fetchCookbookDetail } = useCookbooks();
  const cookbook = id ? getCookbook(id) : undefined;
  const [detailLoading, setDetailLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setDetailLoading(true);
    fetchCookbookDetail(id).finally(() => setDetailLoading(false));
  }, [id, fetchCookbookDetail]);
  const [reorderOpen, setReorderOpen] = useState(false);
  const [reorderIds, setReorderIds] = useState<string[]>([]);

  const recipes: Recipe[] = useMemo(() => {
    if (!cookbook) return [];
    return cookbook.recipeIds
      .map((rid) => mockRecipes.find((r) => r.id === rid))
      .filter((r): r is Recipe => r != null);
  }, [cookbook]);

  // One "spread" = two pages (left + right). spreadIndex 0 = recipes 0,1; 1 = recipes 2,3; etc.
  const [spreadIndex, setSpreadIndex] = useState(0);
  const totalSpreads = Math.max(1, Math.ceil(recipes.length / 2));
  const canGoPrev = spreadIndex > 0;
  const canGoNext = spreadIndex < totalSpreads - 1;

  const leftRecipe = recipes[spreadIndex * 2] ?? null;
  const rightRecipe = recipes[spreadIndex * 2 + 1] ?? null;

  // When cookbook has no recipes, go back to My Cookbooks
  useEffect(() => {
    if (cookbook && recipes.length === 0) {
      navigate('/cookbooks', { replace: true });
    }
  }, [cookbook, recipes.length, navigate]);

  if (!cookbook) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
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
    return null; // Redirecting to /cookbooks
  }

  return (
    <div className="flex flex-col items-center min-h-screen pb-4 sm:pb-8 px-2 sm:px-4">
      <div className="w-full max-w-6xl flex flex-col items-center flex-1 min-h-0">
        <div className="flex items-center justify-between w-full mb-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/cookbooks')}
            className="text-muted-foreground ml-[60px]"
          >
            ← Cookbooks
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
            {cookbook.name}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReorderIds([...cookbook.recipeIds]);
              setReorderOpen(true);
            }}
            className="shrink-0 border-[#6ec257]/40 text-[#6ec257] hover:bg-[#6ec257]/10 dark:border-[#6ec257]/50 dark:text-[#6ec257] dark:hover:bg-[#6ec257]/20 mr-[72px]"
          >
            Reorder recipes
          </Button>
        </div>

        <ReorderRecipesPanel
          open={reorderOpen}
          onOpenChange={setReorderOpen}
          recipeIds={reorderIds}
          onReorder={setReorderIds}
          onSave={() => {
            reorderRecipes(cookbook.id, reorderIds);
            setReorderOpen(false);
          }}
        />

        {/* Opened book: left page | spine | right page */}
        <div className="relative flex items-center w-full max-w-[1344px] flex-1 min-h-0">
          {/* Left arrow */}
          <button
            type="button"
            onClick={() => setSpreadIndex((i) => i - 1)}
            disabled={!canGoPrev}
            className="z-10 shrink-0 p-3 rounded-full bg-amber-800/90 dark:bg-slate-600 dark:hover:bg-slate-500 text-amber-100 dark:text-slate-200 hover:bg-amber-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg mr-2 sm:mr-4"
            aria-label="Previous spread"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          {/* Book: two pages + spine - height fills available space */}
          <div className="flex-1 flex min-w-0 min-h-0 h-full rounded-lg overflow-hidden shadow-2xl border border-amber-800/30 dark:border-slate-600/60 bg-amber-900/20 dark:bg-slate-800/40">
            {/* Left page */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#fef9f0] dark:bg-stone-900/95 border-r border-amber-200/80 dark:border-slate-700/80 shadow-[inset_4px_0_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_4px_0_8px_rgba(0,0,0,0.2)]">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6">
                {leftRecipe ? (
                  <RecipePageContent recipe={leftRecipe} />
                ) : (
                  <EmptyPage />
                )}
              </div>
            </div>

            {/* Spine (binding) */}
            <div className="w-3 sm:w-4 shrink-0 bg-gradient-to-b from-amber-700 via-amber-800 to-amber-900 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 shadow-[inset_0_0_12px_rgba(0,0,0,0.3)]" />

            {/* Right page */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#fef9f0] dark:bg-stone-900/95 border-l border-amber-200/80 dark:border-slate-700/80 shadow-[inset_-4px_0_8px_rgba(0,0,0,0.06)] dark:shadow-[inset_-4px_0_8px_rgba(0,0,0,0.2)]">
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 md:p-6">
                {rightRecipe ? (
                  <RecipePageContent recipe={rightRecipe} />
                ) : (
                  <EmptyPage />
                )}
              </div>
            </div>
          </div>

          {/* Right arrow */}
          <button
            type="button"
            onClick={() => setSpreadIndex((i) => i + 1)}
            disabled={!canGoNext}
            className="z-10 shrink-0 p-3 rounded-full bg-amber-800/90 dark:bg-slate-600 dark:hover:bg-slate-500 text-amber-100 dark:text-slate-200 hover:bg-amber-700 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-lg ml-2 sm:ml-4"
            aria-label="Next spread"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground shrink-0">
          Page {spreadIndex + 1} of {totalSpreads}
          {recipes.length > 0 && (
            <span className="ml-1 text-muted-foreground/80">
              ({recipes.length} recipe{recipes.length !== 1 ? 's' : ''})
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function ReorderRecipesPanel({
  open,
  onOpenChange,
  recipeIds,
  onReorder,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipeIds: string[];
  onReorder: (ids: string[]) => void;
  onSave: () => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    onReorder(next);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

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
        aria-label="Reorder recipes"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Reorder recipes</h2>
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
          Drag recipes to change the order.
        </p>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {recipeIds.map((recipeId, index) => {
            const recipe = mockRecipes.find((r) => r.id === recipeId);
            const title = recipe?.name ?? 'Unknown recipe';
            const isDragging = draggedIndex === index;
            const isDragOver = dragOverIndex === index;
            return (
              <div
                key={recipeId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-grab active:cursor-grabbing transition-colors ${
                  isDragging ? 'opacity-50 border-[#6ec257] bg-[#6ec257]/10' : ''
                } ${isDragOver ? 'border-[#6ec257] bg-[#6ec257]/10 ring-2 ring-[#6ec257]/30' : 'border-border bg-muted/30'}`}
              >
                <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 truncate text-sm font-medium">{title}</span>
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
    <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-8 px-4">
      <BookOpen className="h-12 w-12 mb-2 opacity-50" />
      <p className="text-sm">No recipe on this page</p>
    </div>
  );
}

function RecipePageContent({ recipe }: { recipe: Recipe }) {
  return (
    <div className="h-full flex flex-col">
      <div className="relative w-full rounded-lg overflow-hidden mb-3 bg-amber-100 dark:bg-stone-800 shrink-0" style={{ aspectRatio: '16 / 8.1' }}>
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-full object-cover"
        />
      </div>
      <h2 className="font-serif text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
        {recipe.name}
      </h2>
      <p className="text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2">
        {recipe.description}
      </p>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Ingredients
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside columns-2 gap-x-3">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Instructions
          </p>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            {recipe.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
