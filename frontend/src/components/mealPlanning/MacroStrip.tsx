import { MacroCard } from './MacroCard';
import type { DailyMacros } from '../../hooks/useMealPlanning';

/** Default daily macro targets used when no custom targets are provided. */
const DEFAULT_TARGETS: DailyMacros = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
};

interface MacroStripProps {
  /** Aggregated macro totals for the displayed day. */
  macros: DailyMacros;
  /**
   * Optional custom daily targets.
   * Defaults to 2000 kcal / 120g protein / 250g carbs / 65g fat.
   */
  targets?: DailyMacros;
}

/**
 * Horizontal strip of four macro summary cards: Calories, Protein, Carbs, Fat.
 *
 * Renders as a 2×2 grid on mobile and a single 4-column row on sm+ screens.
 * Each card shows the current value, unit, and a colored progress bar against the target.
 */
export function MacroStrip({ macros, targets = DEFAULT_TARGETS }: MacroStripProps) {
  return (
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
  );
}
