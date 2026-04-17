import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Globe } from "lucide-react";
import type { CuisineFilter as CuisineFilterType } from "../../types/recipe";

interface CuisineFilterProps {
  filters: CuisineFilterType;
  onFiltersChange: (filters: CuisineFilterType) => void;
}

const cuisineOptions: Array<{ key: keyof CuisineFilterType; label: string }> = [
  { key: "italian", label: "Italian" },
  { key: "french", label: "French" },
  { key: "mexican", label: "Mexican" },
  { key: "american", label: "American" },
  { key: "japanese", label: "Japanese" },
  { key: "chinese", label: "Chinese" },
  { key: "indian", label: "Indian" },
  { key: "thai", label: "Thai" },
  { key: "mediterranean", label: "Mediterranean" },
  { key: "korean", label: "Korean" },
];

export const CuisineFilter = memo(function CuisineFilter({
  filters,
  onFiltersChange,
}: CuisineFilterProps) {
  const handleFilterChange = (key: keyof CuisineFilterType, checked: boolean) => {
    onFiltersChange({
      ...filters,
      [key]: checked,
    });
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-1">
        <CardTitle className="flex items-center gap-1 mb-[-18px]">
          <Globe className="h-4 w-4 text-primary" />
          Cuisine Types
        </CardTitle>
      </CardHeader>
      <CardContent className="pl-8 mb-[-6px]">
        <div className="grid grid-cols-3 gap-2">
          {cuisineOptions.map(({ key, label }) => (
            <div
              key={key}
              className="flex items-center space-x-0.5 p-0 rounded hover:bg-primary/5 transition-colors gap-2"
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
                className="cursor-pointer hover:text-primary transition-colors flex-1"
              >
                <span className="text-sm">{label}</span>
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
