import { memo } from 'react';
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, Users, ChefHat, Heart, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import { FlameIcon } from "../ui/CookingIcons";
import { useRecipeActions } from "../../hooks/useRecipeActions";
import type { Recipe } from "../../types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}

export const RecipeCard = memo(function RecipeCard({ recipe, onViewRecipe }: RecipeCardProps) {
  const { toggleFavorite, toggleTried, isFavorite, isTried } = useRecipeActions();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-[#6ec257]/20 text-[#6ec257] border-[#6ec257]/40";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(recipe.id);
  };

  const handleTriedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTried(recipe.id);
  };

  return (
    <Card 
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-border/50 hover:border-[#6ec257]/30 cursor-pointer"
      onClick={() => onViewRecipe(recipe)}
    >
      <div className="relative overflow-hidden">
        <ImageWithFallback
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3">
          <Badge
            className={`${getDifficultyColor(recipe.difficulty)} shadow-sm`}
          >
            <FlameIcon className="h-3 w-3 mr-1" />
            {recipe.difficulty}
          </Badge>
        </div>
        <div className="absolute top-3 left-3 flex gap-2">
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
            aria-label={isFavorite(recipe.id) ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              className={`h-4 w-4 ${
                isFavorite(recipe.id)
                  ? "fill-red-500 text-red-500"
                  : "text-gray-600"
              } transition-colors`}
            />
          </button>
          <button
            onClick={handleTriedClick}
            className="p-2 rounded-full bg-white/90 hover:bg-white shadow-md transition-all duration-200 hover:scale-110"
            aria-label={isTried(recipe.id) ? "Mark as not tried" : "Mark as tried"}
          >
            <CheckCircle
              className={`h-4 w-4 ${
                isTried(recipe.id)
                  ? "fill-[#6ec257] text-[#6ec257]"
                  : "text-gray-600"
              } transition-colors`}
            />
          </button>
        </div>
      </div>

      <CardHeader className="pb-3">
        <h3 className="line-clamp-2 mb-2 group-hover:text-[#6ec257] transition-colors duration-200">
          {recipe.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {recipe.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-[#6ec257] transition-colors">
            <Clock className="h-4 w-4" />
            <span>{recipe.cookTime}m</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-[#6ec257] transition-colors">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-[#6ec257] transition-colors">
            <ChefHat className="h-4 w-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.dietaryTags.slice(0, 3).map((tag, index) => (
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
