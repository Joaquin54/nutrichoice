import { memo } from 'react';
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ChefHat, Heart } from "lucide-react";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import { useRecipeActions } from "../../hooks/useRecipeActions";
import type { Recipe } from "../../types/recipe";

// Cultural cuisine tags to filter out from dietary tags
const CULTURAL_CUISINE_TAGS = [
  'Italian', 'italian',
  'French', 'french',
  'Mexican', 'mexican',
  'American', 'american',
  'Japanese', 'japanese',
  'Chinese', 'chinese',
  'Indian', 'indian',
  'Thai', 'thai',
  'Mediterranean', 'mediterranean',
  'Korean', 'korean',
];

interface RecipeCardProps {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}

export const RecipeCard = memo(function RecipeCard({ recipe, onViewRecipe }: RecipeCardProps) {
  const { toggleFavorite, isFavorite } = useRecipeActions();

  const dietaryTagsOnly = recipe.dietary_tags.filter(
    tag => !CULTURAL_CUISINE_TAGS.includes(tag)
  );

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-border/50 hover:border-[#6ec257]/30 cursor-pointer"
      onClick={() => onViewRecipe(recipe)}
    >
      <div className="relative overflow-hidden">
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
            aria-label={isFavorite(recipe.id) ? "Unlike recipe" : "Like recipe"}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite(recipe.id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
              } transition-colors`}
            />
          </button>
        </div>
      </div>

      <CardHeader className="pb-0 pt-0">
        <h3 className="line-clamp-2 mb-2 group-hover:text-[#6ec257] transition-colors duration-200 -mt-1">
          {recipe.name}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed mt-[-4px]">
          {recipe.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1 mb-4 min-h-[28px] -mt-3">
          {dietaryTagsOnly.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-[#6ec257]/10 text-[#6ec257] border-[#6ec257]/20"
            >
              {tag}
            </Badge>
          ))}
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            onViewRecipe(recipe);
          }}
          className="w-full text-white bg-[#6ec257]/70 hover:bg-[#6ec257]/80 shadow-sm hover:shadow-md transition-all duration-200 group-hover:bg-[#6ec257]/80 group-hover:scale-[1.02]"
        >
          <span className="flex items-center gap-2">
            View Recipe
            <ChefHat className="h-4 w-4" />
          </span>
        </Button>
      </CardContent>
    </Card>
  );
});
