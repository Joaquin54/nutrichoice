import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Leaf, Heart, Wheat, Milk, Egg, Fish } from "lucide-react";
import { HerbIcon, FlameIcon } from "../ui/CookingIcons";
import type { DietaryFilter } from "../../types/recipe";

interface DietaryPreferencesProps {
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

export const DietaryPreferences = memo(function DietaryPreferences({
  filters,
  onFiltersChange,
}: DietaryPreferencesProps) {
  const handleFilterChange = (key: keyof DietaryFilter, checked: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: checked,
    });
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1 mb-[-18px]">
          <Leaf className="h-4 w-4 text-primary" />
          Dietary Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-6 sm:pl-8">
        <div className="grid grid-cols-4 grid-rows-2 gap-x-1 gap-y-1 sm:gap-x-2 sm:gap-y-1.5">
          {dietaryOptions.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex min-w-0 items-center gap-1 rounded p-0.5 transition-colors hover:bg-primary/5 sm:p-1"
            >
              <Checkbox
                id={key}
                checked={filters[key]}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  handleFilterChange(key, checked === true)
                }
                className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <Label
                htmlFor={key}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 transition-colors hover:text-primary sm:gap-2"
              >
                <Icon className="hidden h-3.5 w-3.5 shrink-0 text-primary/70 sm:block sm:h-4 sm:w-4" />
                <span className="text-[11px] leading-tight sm:text-sm">{label}</span>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
