import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import type { Cookbook } from '../../types/recipe';
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
  const scrollLeftRef = useRef<HTMLButtonElement>(null);
  const scrollRightRef = useRef<HTMLButtonElement>(null);

  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [scroll, setScroll] = useState(0);
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

  const totalWidthClosed = useMemo(() => {
    if (cookbooks.length === 0) return 0;
    return cookbooks.length * SPINE_PX + (cookbooks.length - 1) * GAP_PX;
  }, [cookbooks.length]);

  const totalWidth = useMemo(() => {
    if (selectedIndex === null) return totalWidthClosed;
    return totalWidthClosed - SPINE_PX + OPEN_BOOK_PX;
  }, [totalWidthClosed, selectedIndex]);

  const maxScroll = useMemo(() => {
    return Math.max(0, totalWidth - viewportWidth + 8);
  }, [totalWidth, viewportWidth]);

  const boundedRelativeScroll = useCallback(
    (dx: number) => {
      setScroll((s) => {
        const next = Math.max(0, Math.min(maxScroll, s + dx));
        return Number.isFinite(next) ? next : s;
      });
    },
    [maxScroll]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setViewportWidth(w);
    });
    ro.observe(el);
    setViewportWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setScroll((s) => Math.min(s, maxScroll));
  }, [maxScroll]);

  useEffect(() => {
    if (cookbooks.length === 0) return;
    setSelectedIndex((prev) => {
      if (prev === null) return null;
      if (prev >= cookbooks.length) return cookbooks.length - 1;
      return prev;
    });
  }, [cookbooks.length]);

  const booksInViewport = viewportWidth > 0 ? viewportWidth / (SPINE_PX + GAP_PX) : 0;

  const scrollStep = SPINE_PX + GAP_PX;

  useEffect(() => {
    if (selectedIndex === null || viewportWidth <= 0) return;
    const slot = SPINE_PX + GAP_PX;
    const centerOffset =
      (selectedIndex - Math.max(0, (booksInViewport - 4.5) / 2)) * slot;
    setScroll((s) => {
      const next = Math.max(0, Math.min(maxScroll, centerOffset));
      return Number.isFinite(next) ? next : s;
    });
  }, [selectedIndex, booksInViewport, viewportWidth, maxScroll]);

  const transitionStyle = reduceMotion ? 'none' : 'width 500ms ease, transform 500ms ease';

  const transformTransition = reduceMotion ? 'none' : 'transform 500ms ease';

  const canScrollLeft = scroll > 0;
  const canScrollRight = scroll < maxScroll;

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
            ref={scrollLeftRef}
            type="button"
            variant="outline"
            size="icon"
            disabled={!canScrollLeft}
            className="h-11 w-11 shrink-0 rounded-full border-[#6ec257]/50 bg-background shadow-sm hover:bg-[#6ec257]/10 disabled:opacity-40"
            aria-label="Scroll shelf left"
            onClick={() => boundedRelativeScroll(-scrollStep)}
          >
            <ChevronLeft className="h-5 w-5 text-[#5ba045]" />
          </Button>
        </div>

        <div
          ref={viewportRef}
          className="min-w-0 flex-1 cursor-grab overflow-x-hidden py-2"
        >
        <div
          className="flex items-end motion-reduce:transition-none"
          style={{
            gap: GAP_PX,
            transform: `translateX(-${scroll}px)`,
            transition: transitionStyle,
            width: 'max-content',
          }}
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
                }}
                onMouseEnter={() => {
                  if (hoverShelf) setSelectedIndex(index);
                }}
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
                    <div
                      className="relative z-[2] flex w-full flex-col items-center pt-1"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Popover
                        open={openMenuId === cb.id}
                        onOpenChange={(o) => setOpenMenuId(o ? cb.id : null)}
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
                        <PopoverContent className="w-44 p-1" align="start" side="bottom">
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => onRename(cb)}
                          >
                            <Pencil className="h-4 w-4" />
                            Rename
                          </button>
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => onDelete(cb.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <h3
                      className="relative z-[2] mt-2 max-h-[calc(100%-4.5rem)] flex-1 overflow-hidden text-ellipsis px-0.5 text-center text-lg font-semibold leading-snug"
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
                      className="absolute inset-0 z-0 flex flex-col bg-gradient-to-br p-4 text-left"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${theme.coverFrom}, ${theme.coverTo})`,
                      }}
                    >
                      <p className="font-serif text-base font-bold leading-tight text-gray-900 line-clamp-4 dark:text-stone-900">
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
                            className="h-10 w-full border-[#6ec257]/50 text-sm text-[#5ba045] hover:bg-[#6ec257]/10"
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
              </div>
            );
          })}
        </div>
        </div>

        <div className="flex shrink-0 flex-col justify-center py-2">
          <Button
            ref={scrollRightRef}
            type="button"
            variant="outline"
            size="icon"
            disabled={!canScrollRight}
            className="h-11 w-11 shrink-0 rounded-full border-[#6ec257]/50 bg-background shadow-sm hover:bg-[#6ec257]/10 disabled:opacity-40"
            aria-label="Scroll shelf right"
            onClick={() => boundedRelativeScroll(scrollStep)}
          >
            <ChevronRight className="h-5 w-5 text-[#5ba045]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
