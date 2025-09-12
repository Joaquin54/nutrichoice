import { useState } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "./ui/input.tsx";
import { Button } from "./ui/button.tsx";
import { Badge } from "./ui/badge.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover.tsx";
import { Label } from "./ui/label.tsx";
import { Slider } from "./ui/slider.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { DietaryFilter } from "../types/recipe";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters?: DietaryFilter;
  onFiltersChange?: (filters: DietaryFilter) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  className?: string;
}

interface AdvancedFilters {
  maxCookTime: number;
  difficulty: string;
  cuisine: string;
}

export function SearchBar({
  searchQuery,
  onSearchChange,
  filters,
  onFiltersChange,
  placeholder = "Search recipes, ingredients, or cuisine...",
  showAdvancedFilters = false,
  className = "",
}: SearchBarProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>({
    maxCookTime: 120,
    difficulty: "",
    cuisine: "",
  });

  const clearSearch = () => {
    onSearchChange("");
  };

  const clearAllFilters = () => {
    if (onFiltersChange && filters) {
      const clearedFilters = Object.keys(filters).reduce((acc, key) => {
        acc[key as keyof DietaryFilter] = false;
        return acc;
      }, {} as DietaryFilter);
      onFiltersChange(clearedFilters);
    }
    setAdvancedFilters({
      maxCookTime: 120,
      difficulty: "",
      cuisine: "",
    });
  };

  const getActiveFilterCount = () => {
    const dietaryCount = filters
      ? Object.values(filters).filter(Boolean).length
      : 0;
    const advancedCount = [
      advancedFilters.difficulty,
      advancedFilters.cuisine,
      advancedFilters.maxCookTime < 120 ? "time" : "",
    ].filter(Boolean).length;
    return dietaryCount + advancedCount;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Input */}
      <div className="relative max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-900" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-20 py-3 bg-white backdrop-blur-sm border-gray-200 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg transition-all duration-200 focus:border-[#9dc257]-400"
          />

          {/* Clear Search Button */}
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-12 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

          {/* Advanced Filters Button */}
          {showAdvancedFilters && (
            <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 px-2 hover:bg-gray-100 rounded-lg"
                >
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 min-w-5 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Advanced Filters</h4>
                    {activeFilterCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="text-xs"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {/* Cook Time Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Max Cook Time: {advancedFilters.maxCookTime} min
                    </Label>
                    <Slider
                      value={[advancedFilters.maxCookTime]}
                      onValueChange={([value]) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          maxCookTime: value,
                        }))
                      }
                      max={120}
                      min={10}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Difficulty Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Difficulty</Label>
                    <Select
                      value={advancedFilters.difficulty}
                      onValueChange={(value) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          difficulty: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any difficulty</SelectItem>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cuisine Filter */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Cuisine</Label>
                    <Select
                      value={advancedFilters.cuisine}
                      onValueChange={(value) =>
                        setAdvancedFilters((prev) => ({
                          ...prev,
                          cuisine: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Any cuisine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any cuisine</SelectItem>
                        <SelectItem value="Italian">Italian</SelectItem>
                        <SelectItem value="Mediterranean">
                          Mediterranean
                        </SelectItem>
                        <SelectItem value="Asian">Asian</SelectItem>
                        <SelectItem value="Mexican">Mexican</SelectItem>
                        <SelectItem value="American">American</SelectItem>
                        <SelectItem value="French">French</SelectItem>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Thai">Thai</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {/* Dietary Filter Badges */}
          {filters &&
            Object.entries(filters).map(([key, value]) => {
              if (!value) return null;
              const filterLabels: Record<string, string> = {
                vegetarian: "Vegetarian",
                vegan: "Vegan",
                glutenFree: "Gluten-Free",
                dairyFree: "Dairy-Free",
                eggFree: "Egg-Free",
                pescatarian: "Pescatarian",
                lowCarb: "Low Carb",
                keto: "Keto",
              };

              return (
                <Badge
                  key={key}
                  variant="secondary"
                  className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 cursor-pointer"
                  onClick={() => {
                    if (onFiltersChange) {
                      onFiltersChange({ ...filters, [key]: false });
                    }
                  }}
                >
                  {filterLabels[key]}
                  <X className="ml-1 h-3 w-3" />
                </Badge>
              );
            })}

          {/* Advanced Filter Badges */}
          {advancedFilters.difficulty && (
            <Badge
              variant="secondary"
              className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 cursor-pointer"
              onClick={() =>
                setAdvancedFilters((prev) => ({ ...prev, difficulty: "" }))
              }
            >
              {advancedFilters.difficulty}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}

          {advancedFilters.cuisine && (
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 cursor-pointer"
              onClick={() =>
                setAdvancedFilters((prev) => ({ ...prev, cuisine: "" }))
              }
            >
              {advancedFilters.cuisine}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}

          {advancedFilters.maxCookTime < 120 && (
            <Badge
              variant="secondary"
              className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 cursor-pointer"
              onClick={() =>
                setAdvancedFilters((prev) => ({ ...prev, maxCookTime: 120 }))
              }
            >
              ≤ {advancedFilters.maxCookTime} min
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

// Simple version without advanced filters
export function SimpleSearchBar({
  searchQuery,
  onSearchChange,
  placeholder = "Search recipes...",
  className = "",
}: Pick<
  SearchBarProps,
  "searchQuery" | "onSearchChange" | "placeholder" | "className"
>) {
  return (
    <SearchBar
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      placeholder={placeholder}
      showAdvancedFilters={false}
      className={className}
    />
  );
}
