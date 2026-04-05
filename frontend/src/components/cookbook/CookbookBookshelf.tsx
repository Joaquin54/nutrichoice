import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { Cookbook } from '../../types/recipe';
import { cn } from '../../lib/utils';
import { getCookbookShelfTheme } from './cookbookShelfColors';
import { BookMarked, ChevronLeft, ChevronRight, MoreVertical, Pencil, Trash2 } from 'lucide-react';

/** Shelf book size multiplier (1.5 = 50% larger than original art direction). */
const BOOK_SCALE = 1.5;
const SPINE_PX = Math.round(44 * BOOK_SCALE);
const HEIGHT_PX = Math.round(228 * BOOK_SCALE);
const GAP_PX = Math.round(11 * BOOK_SCALE);
const COVER_PX = SPINE_PX * 4;
const OPEN_BOOK_PX = SPINE_PX + COVER_PX;
const PERSPECTIVE_PX = Math.round(1000 * BOOK_SCALE);

function bookWidthPx(bookIndex: number, openIndex: number | null): number {
  return openIndex === bookIndex ? OPEN_BOOK_PX : SPINE_PX;
}

/** Pixel offset of the left edge of `bookIndex` in the shelf row. */
function leftEdgeOfBook(bookIndex: number, openIndex: number | null): number {
  let x = 0;
  for (let j = 0; j < bookIndex; j++) {
    x += bookWidthPx(j, openIndex) + GAP_PX;
  }
  return x;
}

/** scrollLeft that horizontally centers the book in the viewport. */
function scrollLeftToCenterBook(
  bookIndex: number,
  openIndex: number | null,
  clientWidth: number,
  scrollWidth: number
): number {
  const bookLeft = leftEdgeOfBook(bookIndex, openIndex);
  const bookW = bookWidthPx(bookIndex, openIndex);
  const ideal = bookLeft - (clientWidth - bookW) / 2;
  const maxS = Math.max(0, scrollWidth - clientWidth);
  return Math.max(0, Math.min(maxS, ideal));
}

export interface CookbookBookshelfProps {
  cookbooks: Cookbook[];
  onAddRecipes: (id: string) => void;
  onRename: (cb: Cookbook) => void;
  onDelete: (id: string) => void;
}

export function CookbookBookshelf({
  cookbooks,
  onAddRecipes,
  onRename,
  onDelete,
}: CookbookBookshelfProps) {
  const paperFilterId = useId().replace(/:/g, '');
  const viewportRef = useRef<HTMLDivElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [hoverShelf, setHoverShelf] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setHoverShelf(mq.matches);
    const onChange = () => setHoverShelf(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const spineWidth = `${SPINE_PX}px`;
  const coverWidth = `${COVER_PX}px`;
  const bookHeight = `${HEIGHT_PX}px`;
  const openBookWidth = `${OPEN_BOOK_PX}px`;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setViewportWidth(el.clientWidth);
    });
    ro.observe(el);
    setViewportWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el || selectedIndex === null) return;
    const target = scrollLeftToCenterBook(
      selectedIndex,
      selectedIndex,
      el.clientWidth,
      el.scrollWidth
    );
    el.scrollTo({
      left: target,
      behavior: reduceMotion || !hoverShelf ? 'auto' : 'smooth',
    });
  }, [selectedIndex, viewportWidth, cookbooks.length, reduceMotion, hoverShelf]);

  useEffect(() => {
    if (cookbooks.length === 0) return;
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (prev >= cookbooks.length) return cookbooks.length - 1;
      return prev;
    });
  }, [cookbooks.length]);

  const transitionStyle = reduceMotion ? 'none' : 'width 500ms ease, transform 500ms ease';

  const transformTransition = reduceMotion ? 'none' : 'transform 500ms ease';

  const goShelfLeft = useCallback(() => {
    setSelectedIndex((prev) => {
      if (prev === null || prev <= 0) return prev;
      return prev - 1;
    });
  }, []);

  const goShelfRight = useCallback(() => {
    setSelectedIndex((prev) => {
      if (cookbooks.length === 0) return prev;
      if (prev === null) return 0;
      return Math.min(cookbooks.length - 1, prev + 1);
    });
  }, [cookbooks.length]);

  const canScrollLeft = selectedIndex !== null && selectedIndex > 0;

  const canScrollRight =
    selectedIndex === null
      ? cookbooks.length > 0
      : selectedIndex < cookbooks.length - 1;

  if (cookbooks.length === 0) return null;

  return (
    <div className="relative w-full select-none">
      <svg
        className="pointer-events-none absolute inset-0 h-0 w-0 overflow-hidden"
        aria-hidden
      >
        <defs>
          <filter id={paperFilterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves={8}
              result="noise"
            />
            <feDiffuseLighting
              in="noise"
              lightingColor="white"
              surfaceScale={1}
              result="diffLight"
            >
              <feDistantLight azimuth="45" elevation="35" />
            </feDiffuseLighting>
          </filter>
        </defs>
      </svg>

      <div className="flex w-full items-stretch gap-2 px-2 sm:gap-3 sm:px-3">
        <div className="flex shrink-0 flex-col justify-center py-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!canScrollLeft}
            className="h-11 w-11 shrink-0 rounded-full border-[#6ec257]/50 bg-background shadow-sm hover:bg-[#6ec257]/10 disabled:opacity-40"
            aria-label="Open previous cookbook on shelf"
            onClick={goShelfLeft}
          >
            <ChevronLeft className="h-5 w-5 text-[#5ba045]" />
          </Button>
        </div>

        <div
          ref={viewportRef}
          className={cn(
            'min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-2 [scrollbar-width:thin]',
            hoverShelf && 'cursor-grab',
            !hoverShelf && '[-webkit-overflow-scrolling:touch]'
          )}
          style={
            !hoverShelf
              ? { scrollSnapType: 'x mandatory', overscrollBehaviorX: 'contain' }
              : undefined
          }
        >
        <div
          className="flex w-max items-end motion-reduce:transition-none"
          style={{ gap: GAP_PX }}
        >
          {cookbooks.map((cb, index) => {
            const open = selectedIndex === index;
            const theme = getCookbookShelfTheme(cb);
            return (
              <div
                key={cb.id}
                className="motion-reduce:transition-none"
                style={{
                  flexShrink: 0,
                  width: open ? openBookWidth : spineWidth,
                  perspective: `${PERSPECTIVE_PX}px`,
                  transition: transitionStyle,
                  scrollSnapAlign: !hoverShelf ? 'center' : undefined,
                  scrollSnapStop: !hoverShelf ? 'always' : undefined,
                }}
                onMouseEnter={() => {
                  if (hoverShelf) setSelectedIndex(index);
                }}
              >
                <Popover
                  open={openMenuId === cb.id}
                  onOpenChange={(o) => setOpenMenuId(o ? cb.id : null)}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    className="flex w-full cursor-pointer items-stretch overflow-visible rounded-sm text-left outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none"
                    style={{
                      width: open ? openBookWidth : spineWidth,
                      transition: transitionStyle,
                    }}
                    onClick={() => {
                      if (hoverShelf) return;
                      setSelectedIndex((prev) => (prev === index ? null : index));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedIndex((prev) => (prev === index ? null : index));
                      }
                    }}
                    aria-expanded={open}
                    aria-label={`${cb.name}, ${cb.recipeCount} recipes. ${open ? 'Expanded' : 'Collapsed'}.`}
                  >
                    <div
                      className="relative flex shrink-0 flex-col items-center overflow-hidden rounded-l-sm motion-reduce:transition-none"
                      style={{
                        width: spineWidth,
                        height: bookHeight,
                        transformOrigin: 'right center',
                        backgroundColor: theme.bg,
                        color: theme.fg,
                        transform: open
                          ? 'translate3d(0,0,0) rotateY(-60deg)'
                          : 'translate3d(0,0,0) rotateY(0deg)',
                        transition: transformTransition,
                        transformStyle: 'preserve-3d',
                        filter: 'brightness(0.88) contrast(1.15)',
                      }}
                    >
                      <span
                        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35] motion-reduce:opacity-0"
                        style={{ filter: `url(#${paperFilterId})` }}
                      />
                      <h3
                        className="relative z-[2] mt-0 max-h-[calc(100%-1.25rem)] flex-1 overflow-hidden text-ellipsis px-0.5 pt-2 text-center text-lg font-semibold leading-snug"
                        style={{
                          writingMode: 'vertical-rl',
                          textOrientation: 'mixed',
                        }}
                      >
                        {cb.name}
                      </h3>
                  </div>

                  <div
                    className="relative shrink-0 overflow-hidden rounded-r-sm motion-reduce:transition-none"
                    style={{
                      width: coverWidth,
                      height: bookHeight,
                      transformOrigin: 'left center',
                      transform: open
                        ? 'translate3d(0,0,0) rotateY(30deg)'
                        : 'translate3d(0,0,0) rotateY(88.8deg)',
                      transition: transformTransition,
                      transformStyle: 'preserve-3d',
                      filter: 'brightness(0.92) contrast(1.08)',
                    }}
                  >
                    <span
                      className="pointer-events-none absolute inset-0 z-[1] opacity-[0.3] motion-reduce:opacity-0"
                      style={{ filter: `url(#${paperFilterId})` }}
                    />
                    <span
                      className="pointer-events-none absolute inset-0 z-[2]"
                      style={{
                        background:
                          'linear-gradient(to right, rgba(255,255,255,0) 2px, rgba(255,255,255,0.45) 3px, rgba(255,255,255,0.2) 5px, transparent 10px)',
                      }}
                    />
                    <div
                      className="absolute inset-0 z-0 flex flex-col bg-gradient-to-br p-4 pt-3 text-left"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${theme.coverFrom}, ${theme.coverTo})`,
                      }}
                    >
                      {open && (
                        <div
                          className="absolute right-1 top-1 z-[5]"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-full border border-white/20 bg-black/15 text-inherit shadow-sm hover:bg-black/25"
                              aria-label={`Options for ${cb.name}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                        </div>
                      )}
                      <p className="pr-10 font-serif text-base font-bold leading-tight text-gray-900 line-clamp-4 dark:text-stone-900">
                        {cb.name}
                      </p>
                      <p className="mt-1 text-sm text-stone-700/90">
                        {cb.recipeCount} recipe{cb.recipeCount !== 1 ? 's' : ''}
                      </p>
                      {open && (
                        <div
                          className="mt-auto flex flex-col gap-2 pt-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            asChild
                            size="sm"
                            className="h-10 w-full bg-[#6ec257] text-sm text-white hover:bg-[#6ec257]/90"
                          >
                            <Link to={`/cookbooks/${cb.id}`}>Open cookbook</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 w-full border-[#6ec257]/50 text-sm text-[#2d5a27] hover:!bg-white/40 dark:border-[#6ec257]/45 dark:text-white dark:hover:!bg-[#6ec257]/50"
                            onClick={() => onAddRecipes(cb.id)}
                          >
                            <BookMarked className="mr-1.5 h-4 w-4" />
                            Add recipes
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <PopoverContent className="w-44 p-1" align="end" side="bottom">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                    onClick={() => {
                      setOpenMenuId(null);
                      onRename(cb);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Rename
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                    onClick={() => {
                      setOpenMenuId(null);
                      onDelete(cb.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </PopoverContent>
              </Popover>
              </div>
            );
          })}
        </div>
        </div>

        <div className="flex shrink-0 flex-col justify-center py-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={!canScrollRight}
            className="h-11 w-11 shrink-0 rounded-full border-[#6ec257]/50 bg-background shadow-sm hover:bg-[#6ec257]/10 disabled:opacity-40"
            aria-label="Open next cookbook on shelf"
            onClick={goShelfRight}
          >
            <ChevronRight className="h-5 w-5 text-[#5ba045]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
