import { MacroCard } from './MacroCard';
import type { DailyMacros } from '../../hooks/useMealPlanning';
import { toLocalISODate } from '../../lib/utils';

/** Default daily macro targets used when no custom targets are provided. */
const DEFAULT_TARGETS: DailyMacros = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
};

interface MacroStripProps {
  /** Aggregated macro totals for the displayed day or week. */
  macros: DailyMacros;
  /**
   * Optional custom targets (daily or weekly — pre-scaled by the caller).
   * Defaults to 2000 kcal / 120g protein / 250g carbs / 65g fat.
   */
  targets?: DailyMacros;
  /**
   * The date whose macros are being shown.
   * Renders "Today" when it matches the local calendar date, otherwise
   * a short format like "Wed, Apr 15".
   * When omitted no heading is shown (backwards-compatible).
   * Ignored when `isWeekView` is true.
   */
  displayDate?: Date;
  /** When true, renders a weekly range label (e.g. "Apr 12 – Apr 18") instead of the day label. */
  isWeekView?: boolean;
  /** First day of the displayed week — required when `isWeekView` is true. */
  weekStart?: Date;
  /** Last day of the displayed week — required when `isWeekView` is true. */
  weekEnd?: Date;
}

/** Formats a Date as a short human-readable label relative to today. */
function formatDisplayDate(date: Date): string {
  if (toLocalISODate(date) === toLocalISODate(new Date())) {
    return 'Today';
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** Formats a week range as "Apr 12 – Apr 18". */
function formatWeekRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}

/**
 * Horizontal strip of four macro summary cards: Calories, Protein, Carbs, Fat.
 *
 * Renders as a 2×2 grid on mobile and a single 4-column row on sm+ screens.
 * Each card shows the current value, unit, and a colored progress bar against the target.
 *
 * When `displayDate` is provided, a compact label above the cards indicates which day's
 * forecast is shown (e.g., "Today" or "Wed, Apr 15"). When `isWeekView` is true, a weekly
 * range label is shown instead (e.g., "Apr 12 – Apr 18").
 */
export function MacroStrip({
  macros,
  targets = DEFAULT_TARGETS,
  displayDate,
  isWeekView = false,
  weekStart,
  weekEnd,
}: MacroStripProps) {
  const label = isWeekView && weekStart && weekEnd
    ? formatWeekRange(weekStart, weekEnd)
    : displayDate
    ? formatDisplayDate(displayDate)
    : null;

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground px-0.5">
          {label}
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <MacroCard
          label="Calories"
          value={macros.calories}
          target={targets.calories}
          unit="kcal"
          accentColor="#6ec257"
        />
        <MacroCard
          label="Protein"
          value={macros.protein}
          target={targets.protein}
          unit="g"
          accentColor="#5bb8d4"
        />
        <MacroCard
          label="Carbs"
          value={macros.carbs}
          target={targets.carbs}
          unit="g"
          accentColor="#f5c842"
        />
        <MacroCard
          label="Fat"
          value={macros.fat}
          target={targets.fat}
          unit="g"
          accentColor="#f58a8a"
        />
      </div>
    </div>
  );
}
