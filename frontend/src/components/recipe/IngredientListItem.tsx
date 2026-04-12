import { Leaf } from 'lucide-react';
import { cn } from '../../lib/utils';

export type IngredientListVariant = 'compact' | 'default' | 'feed';

const variants: Record<
  IngredientListVariant,
  { row: string; leaf: string; text: string }
> = {
  compact: {
    row: 'flex items-start gap-1.5 break-inside-avoid',
    leaf: 'mt-px h-3 w-3 shrink-0 text-[#6ec257] dark:text-[#6ec257]/90',
    text: 'min-w-0 text-[13px] leading-snug text-muted-foreground',
  },
  default: {
    row: 'flex items-start gap-2.5',
    leaf: 'mt-1 h-[18px] w-[18px] shrink-0 text-[#6ec257] dark:text-[#6ec257]/90 sm:h-5 sm:w-5',
    text: 'min-w-0 text-sm sm:text-base text-foreground leading-relaxed',
  },
  feed: {
    row: 'flex items-start gap-2 sm:gap-2.5',
    leaf: 'mt-0.5 h-4 w-4 shrink-0 text-[#6ec257] dark:text-[#6ec257] sm:h-4 sm:w-4',
    text: 'min-w-0 pt-0.5 text-xs leading-relaxed text-gray-800 dark:text-gray-100 sm:text-sm',
  },
};

interface IngredientListItemProps {
  children: React.ReactNode;
  variant?: IngredientListVariant;
  className?: string;
}

/**
 * Single ingredient row with a leaf icon bullet (shared across recipe views).
 */
export function IngredientListItem({
  children,
  variant = 'default',
  className,
}: IngredientListItemProps) {
  const v = variants[variant];
  return (
    <li className={cn(v.row, className)}>
      <Leaf strokeWidth={2.5} className={v.leaf} aria-hidden />
      <span className={v.text}>{children}</span>
    </li>
  );
}
