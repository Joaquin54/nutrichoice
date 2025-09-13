// import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card.tsx";
import { Checkbox } from "./ui/checkbox.tsx";
import { Label } from "./ui/label.tsx";
import { Leaf, Heart, Wheat, Milk, Egg, Fish } from "lucide-react";
// import { CheckedState } from '@radix-ui/react-checkbox';
import { HerbIcon, FlameIcon } from "./ui/CookingIcons.tsx";

export interface DietaryFilter {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  eggFree: boolean;
  pescatarian: boolean;
  lowCarb: boolean;
  keto: boolean;
}

interface DietaryPreferencesProps {
  filters: DietaryFilter;
  onFiltersChange: (filters: DietaryFilter) => void;
}

const dietaryOptions = [
  {
    key: "vegetarian" as keyof DietaryFilter,
    label: "Vegetarian",
    icon: HerbIcon,
  },
  { key: "vegan" as keyof DietaryFilter, label: "Vegan", icon: Heart },
  {
    key: "glutenFree" as keyof DietaryFilter,
    label: "Gluten-Free",
    icon: Wheat,
  },
  { key: "dairyFree" as keyof DietaryFilter, label: "Dairy-Free", icon: Milk },
  { key: "eggFree" as keyof DietaryFilter, label: "Egg-Free", icon: Egg },
  {
    key: "pescatarian" as keyof DietaryFilter,
    label: "Pescatarian",
    icon: Fish,
  },
  { key: "lowCarb" as keyof DietaryFilter, label: "Low Carb", icon: FlameIcon },
  { key: "keto" as keyof DietaryFilter, label: "Keto", icon: FlameIcon },
];

export function DietaryPreferences({
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="h-5 w-5 text-primary" />
          Dietary Preferences
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dietaryOptions.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
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
}
