import { memo } from 'react';
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { Leaf, Heart, Wheat, Milk, Egg, Fish, SlidersHorizontal } from "lucide-react";
import { HerbIcon, FlameIcon } from "../ui/CookingIcons";
import type { DietaryFilter } from "../../types/recipe";

interface DietaryPreferencesDropdownProps {
  filters: DietaryFilter;
  onFiltersChange: (filters: DietaryFilter) => void;
}

// Canonical snake_case keys matching backend ALLOWED_DIET_KEYS.
// Icons are selected from already-imported lucide-react and CookingIcons sets.
const dietaryOptions = [
  { key: "vegetarian" as keyof DietaryFilter, label: "Vegetarian", icon: HerbIcon },
  { key: "vegan" as keyof DietaryFilter, label: "Vegan", icon: Heart },
  { key: "gluten_free" as keyof DietaryFilter, label: "Gluten-Free", icon: Wheat },
  { key: "dairy_free" as keyof DietaryFilter, label: "Dairy-Free", icon: Milk },
  { key: "nut_free" as keyof DietaryFilter, label: "Nut-Free", icon: Egg },
  { key: "keto" as keyof DietaryFilter, label: "Keto", icon: FlameIcon },
  { key: "paleo" as keyof DietaryFilter, label: "Paleo", icon: Fish },
  { key: "low_carb" as keyof DietaryFilter, label: "Low Carb", icon: FlameIcon },
];

export const DietaryPreferencesDropdown = memo(function DietaryPreferencesDropdown({
  filters,
  onFiltersChange,
}: DietaryPreferencesDropdownProps) {
  const handleFilterChange = (key: keyof DietaryFilter, checked: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: checked,
    });
  };

  const activeFilterCount = filters ? Object.values(filters).filter(Boolean).length : 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative gap-2 border-border bg-background px-3 py-2 text-sm shadow-sm hover:bg-muted/60 sm:px-4 sm:py-2.5 sm:text-base"
        >
          <Leaf className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
          <span>Dietary Filters</span>
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 py-0 text-sm text-primary-foreground hover:bg-primary"
            >
              {activeFilterCount}
            </Badge>
          )}
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground sm:h-5 sm:w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[min(30rem,calc(100vw-1.5rem))] p-4 sm:p-5"
        align="center"
        sideOffset={8}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="flex items-center gap-2.5 text-base font-semibold text-foreground">
              <Leaf className="h-5 w-5 shrink-0 text-primary" />
              Dietary Preferences
            </h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({
                  vegetarian: false,
                  vegan: false,
                  gluten_free: false,
                  dairy_free: false,
                  nut_free: false,
                  keto: false,
                  paleo: false,
                  low_carb: false,
                })}
                className="h-8 shrink-0 px-3 text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-2 sm:gap-x-3 sm:gap-y-2.5">
            {dietaryOptions.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/50 sm:gap-2.5 sm:px-2 sm:py-2.5"
              >
                <Checkbox
                  id={`dropdown-${key}`}
                  checked={filters?.[key] || false}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    handleFilterChange(key, checked === true)
                  }
                  className="h-5 w-5 shrink-0 border-primary/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <Label
                  htmlFor={`dropdown-${key}`}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-foreground sm:gap-2"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary/70 sm:h-5 sm:w-5" />
                  <span className="text-sm leading-snug sm:text-base">{label}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

