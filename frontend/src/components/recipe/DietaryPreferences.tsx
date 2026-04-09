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
      <CardContent className="pl-8">
        <div className="grid grid-cols-3 gap-1">
          {dietaryOptions.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center space-x-1 p-1 rounded hover:bg-primary/5 transition-colors"
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
                className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors flex-1"
              >
                <Icon className="h-4 w-4 text-primary/70" />
                <span className="text-sm">{label}</span>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
