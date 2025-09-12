import { Card, CardContent, CardHeader } from "./ui/card.tsx";
import { Badge } from "./ui/badge.tsx";
import { Button } from "./ui/button.tsx";
import { Clock, Users, ChefHat } from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { FlameIcon } from "./ui/CookingIcons";

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image: string;
  cookTime: number;
  servings: number;
  difficulty: "Easy" | "Medium" | "Hard";
  dietaryTags: string[];
  ingredients: string[];
  instructions: string[];
}

interface RecipeCardProps {
  recipe: Recipe;
  onViewRecipe: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, onViewRecipe }: RecipeCardProps) {
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

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/90 backdrop-blur-sm border-border/50 hover:border-primary/30">
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
      </div>

      <CardHeader className="pb-3">
        <h3 className="line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
          {recipe.title}
        </h3>
        <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
          {recipe.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <Clock className="h-4 w-4" />
            <span>{recipe.cookTime}m</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <Users className="h-4 w-4" />
            <span>{recipe.servings}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ChefHat className="h-4 w-4" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mb-4">
          {recipe.dietaryTags.slice(0, 3).map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20"
            >
              {tag}
            </Badge>
          ))}
          {recipe.dietaryTags.length > 3 && (
            <Badge
              variant="secondary"
              className="bg-muted text-muted-foreground"
            >
              +{recipe.dietaryTags.length - 3}
            </Badge>
          )}
        </div>

        <Button
          onClick={() => onViewRecipe(recipe)}
          className="w-full text-white bg-[#9dc257]/70 hover:bg-[#9dc257]/80 shadow-sm hover:shadow-md transition-all duration-200 group-hover:bg-[#9dc257]/80 group-hover:scale-[1.02]"
        >
          <span className="flex items-center gap-2">
            View Recipe
            <ChefHat className="h-4 w-4" />
          </span>
        </Button>
      </CardContent>
    </Card>
  );
}
