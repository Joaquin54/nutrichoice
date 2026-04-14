import { cn } from '../../lib/utils';

interface DayHeaderProps {
  /** The date this header represents. */
  date: Date;
  /** Whether this date is today — highlights the date number in brand green. */
  isToday: boolean;
  /** Whether this day column is the currently selected forecast target. */
  isSelected: boolean;
  /** Called when the user clicks or keyboard-activates this header to select the day. */
  onSelect: () => void;
}

/**
 * Renders a single day-column header cell for the meal grid.
 *
 * Rendered as an accessible button so keyboard and pointer users can select the day
 * to update the macro forecast strip. `aria-pressed` reflects selection state.
 *
 * - Today's date number is highlighted with the brand green accent color.
 * - The selected column gets a 2px brand-green bottom border.
 */
export function DayHeader({ date, isToday, isSelected, onSelect }: DayHeaderProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onSelect}
      className={cn(
        'flex flex-col items-center justify-center py-2 px-1 bg-card w-full',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6ec257]/60',
        'transition-colors hover:bg-muted/50',
        isSelected && 'border-b-2 border-[#6ec257]',
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground font-mono">
        {dayName}
      </span>
      <span
        className={cn(
          'text-base font-semibold font-mono leading-tight mt-0.5',
          isToday ? 'text-[#6ec257]' : 'text-foreground',
        )}
      >
        {dayNumber}
      </span>
    </button>
  );
}
