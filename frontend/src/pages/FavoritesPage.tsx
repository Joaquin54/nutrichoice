import { Heart } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';

export function FavoritesPage() {
  // This will be populated with actual favorites data later
  const favorites: any[] = [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Favorites</h1>
        <p className="text-gray-600">
          Recipes you've saved and loved
        </p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Favorite recipes will be rendered here */}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start exploring recipes and save your favorites to see them here.
            </p>
            <button className="text-green-600 hover:text-green-700 font-medium">
              Browse Recipes
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
