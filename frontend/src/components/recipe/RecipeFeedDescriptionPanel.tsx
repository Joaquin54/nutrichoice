import { useState, useRef, useLayoutEffect, useCallback, useSyncExternalStore } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { cn } from "../../lib/utils";

const MOBILE_MQ = "(max-width: 639px)";

function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(MOBILE_MQ);
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () =>
      typeof window !== "undefined"
        ? window.matchMedia(MOBILE_MQ).matches
        : false,
    () => false
  );
}

export function RecipeFeedDescriptionPanel({
  description,
  recipeTitle,
}: {
  description: string;
  recipeTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const [truncated, setTruncated] = useState(false);
  const isMobile = useIsMobile();
  const textRef = useRef<HTMLParagraphElement>(null);

  const measure = useCallback(() => {
    const el = textRef.current;
    if (!el || !isMobile) {
      setTruncated(false);
      return;
    }
    setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [isMobile, description]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useLayoutEffect(() => {
    if (!isMobile) return;
    const el = textRef.current;
    const parent = el?.parentElement;
    if (!parent) return;

    const ro = new ResizeObserver(() => measure());
    ro.observe(parent);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [isMobile, measure]);

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/50 sm:p-3">
        <p
          ref={textRef}
          className={cn(
            "line-clamp-[20] break-words text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:line-clamp-[14] sm:pb-0 sm:text-base lg:line-clamp-[18] 2xl:line-clamp-[22] 2xl:text-lg",
            truncated && "pb-8"
          )}
        >
          {description}
        </p>
        {isMobile && truncated && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute bottom-1.5 right-1.5 z-10 rounded-md bg-gray-50/95 px-2 py-1 text-xs font-semibold text-[#6ec257] shadow-sm ring-1 ring-gray-200 backdrop-blur-sm dark:bg-gray-900/95 dark:ring-gray-600"
            aria-label="Read full description"
          >
            ...
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(85dvh,32rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 text-left">{recipeTitle}</DialogTitle>
          </DialogHeader>
          <p className="text-left text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
            {description}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
