import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, Users, ChefHat, Heart, CheckCircle } from "lucide-react";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import { useRecipeActions } from "../../hooks/useRecipeActions";
import type { Recipe } from "../../types/recipe";

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  const { toggleFavorite, toggleTried, isFavorite, isTried } = useRecipeActions();
  
  if (!recipe) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 border-green-200";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Hard":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleFavoriteClick = () => {
    toggleFavorite(recipe.id);
  };

  const handleTriedClick = () => {
    toggleTried(recipe.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[80vw] p-10">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>{recipe.title}</span>
            <div className="flex gap-2">
              <Button
                onClick={handleFavoriteClick}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite(recipe.id)
                      ? "fill-red-500 text-red-500"
                      : ""
                  } transition-colors`}
                />
                {isFavorite(recipe.id) ? "Favorited" : "Favorite"}
              </Button>
              <Button
                onClick={handleTriedClick}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <CheckCircle
                  className={`h-4 w-4 ${
                    isTried(recipe.id)
                      ? "fill-green-500 text-green-500"
                      : ""
                  } transition-colors`}
                />
                {isTried(recipe.id) ? "Tried" : "Mark as Tried"}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="relative">
            <ImageWithFallback
              src={recipe.image}
              alt={recipe.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg"
            />
            <div className="absolute top-3 right-3">
              <Badge className={getDifficultyColor(recipe.difficulty)}>
                {recipe.difficulty}
              </Badge>
            </div>
          </div>

          <p className="text-muted-foreground">{recipe.description}</p>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span>{recipe.cookTime} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {recipe.dietaryTags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{ingredient}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="mb-3">Instructions</h3>
              <ol className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
