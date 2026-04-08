interface MacroCardProps {
  /** Display label for this macro (e.g., "Calories", "Protein"). */
  label: string;
  /** Current value to display. */
  value: number;
  /** Target/goal value used to compute progress bar fill percentage. */
  target: number;
  /** Unit suffix displayed after the value (e.g., "kcal", "g"). */
  unit: string;
  /** Hex color string for the progress bar fill (e.g., "#6ec257"). */
  accentColor: string;
}

/**
 * A single macro metric summary card with a labeled value and thin progress bar.
 *
 * Displays the current value against a goal target, with a 2px colored
 * progress bar indicating percentage of target reached (capped at 100%).
 */
export function MacroCard({ label, value, target, unit, accentColor }: MacroCardProps) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;

  return (
    <div className="rounded-lg border border-border bg-card p-3 flex flex-col gap-1.5">
      <span className="text-[10px] font-medium font-mono uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono text-foreground leading-none">
          {value.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
      <div className="h-0.5 w-full rounded-full bg-border overflow-hidden mt-1">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: accentColor }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={target}
          aria-label={`${label}: ${value} of ${target} ${unit}`}
        />
      </div>
    </div>
  );
}
