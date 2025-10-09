import { Card, CardContent } from '../ui/card';
import { Heart } from 'lucide-react';

interface EmptyFavoritesProps {
  onBrowseRecipes: () => void;
  message?: string;
  description?: string;
}

export function EmptyFavorites({ 
  onBrowseRecipes, 
  message = "No favorites yet",
  description = "Start exploring recipes and save your favorites to see them here."
}: EmptyFavoritesProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {message}
        </h3>
        <p className="text-gray-600 mb-4">
          {description}
        </p>
        <button 
          onClick={onBrowseRecipes}
          className="text-green-600 hover:text-green-700 font-medium"
        >
          Browse Recipes
        </button>
      </CardContent>
    </Card>
  );
}
