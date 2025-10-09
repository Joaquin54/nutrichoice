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
    <section className="text-center py-0 relative">
      {/* Dietary Filters Dropdown - Top Right */}
      <div className="absolute top-0 right-0">
        <DietaryPreferencesDropdown 
          filters={dietaryFilters}
          onFiltersChange={onDietaryFiltersChange}
        />
      </div>

      <div className="flex items-center justify-center mb-3">
        <Leaf className="h-5 w-5 text-[#69823b] mr-2" />
        <span className="text-[#69823b] font-medium text-sm">
          Fresh • Seasonal • Delicious
        </span>
      </div>

      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
        Discover Delicious Recipes
      </h2>

      {/* Search Bar */}
      <div className="relative max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-900" />
          <Input
            placeholder="Search recipes, ingredients, or cuisine..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-4 py-3 !bg-white border-gray-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-md transition-all duration-200 focus:border-green-400"
          />
        </div>
      </div>
    </section>
  );
}
