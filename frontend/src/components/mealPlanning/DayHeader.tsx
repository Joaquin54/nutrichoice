import { cn } from '../../lib/utils';

interface DayHeaderProps {
  /** The date this header represents. */
  date: Date;
  /** Whether this date is today — highlights the date number in brand green. */
  isToday: boolean;
}

/**
 * Renders a single day-column header cell for the meal grid.
 *
 * Shows the abbreviated weekday name (e.g., "Sun") above the date number (e.g., "6").
 * Today's date number is highlighted with the brand green accent color.
 */
export function DayHeader({ date, isToday }: DayHeaderProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const dayNumber = date.getDate();

  return (
    <div className="flex flex-col items-center justify-center py-2 px-1 bg-card">
      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground font-mono">
        {dayName}
      </span>
      <span
        className={cn(
          'text-base font-semibold font-mono leading-tight mt-0.5',
          isToday
            ? 'text-[#6ec257]'
            : 'text-foreground'
        )}
      >
        {dayNumber}
      </span>
    </div>
  );
}
