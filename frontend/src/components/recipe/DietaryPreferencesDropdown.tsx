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
          className="gap-2 bg-white hover:bg-gray-50 border-gray-300 shadow-sm relative dark:border-emerald-300 dark:bg-emerald-50 dark:text-green-900 dark:hover:bg-emerald-100"
        >
          <Leaf className="h-4 w-4 text-[#6ec257] dark:text-green-800" />
          <span>Dietary Filters</span>
          {activeFilterCount > 0 && (
            <Badge 
              variant="secondary" 
              className="ml-1 bg-[#6ec257] text-white hover:bg-[#6ec257] px-1.5 py-0 h-5 min-w-5 flex items-center justify-center rounded-full"
            >
              {activeFilterCount}
            </Badge>
          )}
          <SlidersHorizontal className="h-4 w-4 text-gray-500 dark:text-green-800/90" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-4 dark:border-emerald-200 dark:bg-emerald-50 dark:text-green-900"
        align="end"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm flex items-center gap-2 dark:text-green-900">
              <Leaf className="h-4 w-4 text-[#6ec257] dark:text-green-800" />
              Dietary Preferences
            </h4>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiltersChange({
                  vegetarian: false,
                  vegan: false,
                  glutenFree: false,
                  dairyFree: false,
                  eggFree: false,
                  pescatarian: false,
                  lowCarb: false,
                  keto: false,
                })}
                className="h-7 px-2 text-xs dark:text-green-800 dark:hover:bg-emerald-200/70 dark:hover:text-green-950"
              >
                Clear all
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {dietaryOptions.map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-50 transition-colors dark:hover:bg-emerald-100/90"
              >
                <Checkbox
                  id={`dropdown-${key}`}
                  checked={filters?.[key] || false}
                  onCheckedChange={(checked: boolean | "indeterminate") =>
                    handleFilterChange(key, checked === true)
                  }
                  className="border-primary/30 data-[state=checked]:bg-[#6ec257] data-[state=checked]:border-[#6ec257] data-[state=checked]:text-white dark:border-green-800/45 dark:data-[state=unchecked]:bg-white/80"
                />
                <Label
                  htmlFor={`dropdown-${key}`}
                  className="flex items-center gap-2 cursor-pointer flex-1 dark:text-green-900"
                >
                  <Icon className="h-4 w-4 text-[#6ec257]/70 dark:text-green-800" />
                  <span className="text-sm">{label}</span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

