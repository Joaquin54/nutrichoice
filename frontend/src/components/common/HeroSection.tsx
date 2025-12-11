import { Leaf, Search } from 'lucide-react';
import { Input } from '../ui/input';
import { DietaryPreferencesDropdown } from '../recipe/DietaryPreferencesDropdown';
import type { DietaryFilter } from '../../types/recipe';

interface HeroSectionProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dietaryFilters: DietaryFilter;
  onDietaryFiltersChange: (filters: DietaryFilter) => void;
}

export function HeroSection({ 
  searchQuery, 
  onSearchChange,
  dietaryFilters,
  onDietaryFiltersChange
}: HeroSectionProps) {
  return (
    <section className="text-center py-0 relative mb-4 sm:mb-6 -mt-2 sm:mt-0">
      {/* Dietary Filters Dropdown - Top Right on desktop, below title on mobile */}
      <div className="absolute top-0 right-0 z-10 hidden sm:block">
        <DietaryPreferencesDropdown 
          filters={dietaryFilters}
          onFiltersChange={onDietaryFiltersChange}
        />
      </div>

      <div className="flex items-center justify-center mb-2 sm:mb-3">
        <Leaf className="h-4 w-4 sm:h-5 sm:w-5 text-[#6ec257] dark:text-[#6ec257]/80 mr-2" />
        <span className="text-[#6ec257] dark:text-[#6ec257]/80 font-medium text-xs sm:text-sm">
          Fresh • Seasonal • Delicious
        </span>
      </div>

      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4 md:mb-6 px-2">
        Discover Delicious Recipes
      </h2>

      {/* Dietary Filters Dropdown - Below title on mobile */}
      <div className="flex justify-center mb-3 sm:hidden">
        <DietaryPreferencesDropdown 
          filters={dietaryFilters}
          onFiltersChange={onDietaryFiltersChange}
        />
      </div>

      {/* Search Bar */}
      <div className="relative max-w-lg mx-auto px-2">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-900 dark:text-gray-400" />
          <Input
            placeholder="Search recipes, ingredients..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 text-sm sm:text-base !bg-white dark:!bg-gray-800 border-gray-300 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 focus:border-[#6ec257] dark:focus:border-[#6ec257]/70"
          />
        </div>
      </div>
    </section>
  );
}
