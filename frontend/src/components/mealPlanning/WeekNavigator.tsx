import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface WeekNavigatorProps {
  /** The Sunday that starts the currently displayed week. */
  currentWeekStart: Date;
  /** Navigate to the previous week. */
  onPreviousWeek: () => void;
  /** Navigate to the next week. */
  onNextWeek: () => void;
  /** Jump back to the week containing today. */
  onGoToToday: () => void;
}

/**
 * Week navigation bar for the meal planning calendar.
 *
 * Displays the current week's date range (e.g., "Apr 06 – Apr 12") with
 * chevron buttons to shift the view by ±7 days and a "Today" shortcut.
 */
export function WeekNavigator({
  currentWeekStart,
  onPreviousWeek,
  onNextWeek,
  onGoToToday,
}: WeekNavigatorProps) {
  const weekEnd = new Date(currentWeekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const formatDay = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const rangeLabel = `${formatDay(currentWeekStart)} – ${formatDay(weekEnd)}`;

  return (
    <div className="flex items-center justify-between gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onGoToToday}
        className="text-xs sm:text-sm"
      >
        Today
      </Button>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onPreviousWeek}
          className="h-8 w-8"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-xs sm:text-sm font-medium font-mono min-w-[140px] sm:min-w-[168px] text-center text-foreground">
          {rangeLabel}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={onNextWeek}
          className="h-8 w-8"
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
