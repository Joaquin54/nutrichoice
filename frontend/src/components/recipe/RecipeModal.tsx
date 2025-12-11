import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Clock, Users, Heart, CheckCircle } from "lucide-react";
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

interface RecipeModalProps {
  recipe: Recipe | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RecipeModal({ recipe, isOpen, onClose }: RecipeModalProps) {
  const { toggleFavorite, toggleTried, isFavorite, isTried } = useRecipeActions();
  
  if (!recipe) return null;

  // Filter out cultural cuisine tags from dietary tags
  const dietaryTagsOnly = recipe.dietaryTags.filter(
    tag => !CULTURAL_CUISINE_TAGS.includes(tag)
  );

  const handleFavoriteClick = () => {
    toggleFavorite(recipe.id);
  };

  const handleTriedClick = () => {
    toggleTried(recipe.id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl sm:max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-[80vw] p-4 sm:p-6 md:p-10">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="flex-1">{recipe.title}</span>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleFavoriteClick}
                variant="outline"
                size="sm"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite(recipe.id)
                      ? "fill-red-500 text-red-500"
                      : ""
                  } transition-colors`}
                />
                <span className="hidden sm:inline">{isFavorite(recipe.id) ? "Favorited" : "Favorite"}</span>
              </Button>
              <Button
                onClick={handleTriedClick}
                variant="outline"
                size="sm"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <CheckCircle
                  className={`h-4 w-4 ${
                    isTried(recipe.id)
                      ? "text-[#6ec257]"
                      : ""
                  } transition-colors`}
                />
                <span className="hidden sm:inline">{isTried(recipe.id) ? "Tried" : "Mark as Tried"}</span>
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
          </div>

          <p className="text-muted-foreground">{recipe.description}</p>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#6ec257]" />
              <span className="text-sm sm:text-base">{recipe.cookTime} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-[#6ec257]" />
              <span className="text-sm sm:text-base">{recipe.servings} servings</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {dietaryTagsOnly.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-[#6ec257]/10 text-[#6ec257] border-[#6ec257]/20"
              >
                {tag}
              </Badge>
            ))}
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="ingredients">
              <AccordionTrigger>Ingredients</AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-[#6ec257] mt-1">•</span>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="instructions">
              <AccordionTrigger>Instructions</AccordionTrigger>
              <AccordionContent>
                <ol className="space-y-3">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="bg-[#6ec257] text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
