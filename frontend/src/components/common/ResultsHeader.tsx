import { memo } from 'react';

interface ResultsHeaderProps {
  activeFilterCount: number;
  recipeCount: number;
}

export const ResultsHeader = memo(function ResultsHeader({ 
  activeFilterCount, 
  recipeCount 
}: ResultsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">
          Recommended Recipes
          {activeFilterCount > 0 && (
            <span className="text-gray-500 font-normal">
              {" "}
              • {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}{" "}
              applied
            </span>
          )}
        </h3>
        <p className="text-gray-600">
          {recipeCount} recipe
          {recipeCount !== 1 ? "s" : ""} found
        </p>
      </div>
    </div>
  );
});
