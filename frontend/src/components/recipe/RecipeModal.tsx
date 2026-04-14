import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import { Heart, CheckCircle, BookOpen } from "lucide-react";
import { ImageWithFallback } from "../ui/ImageWithFallback";
import { useRecipeActions } from "../../hooks/useRecipeActions";
import { useCookbooks } from "../../hooks/useCookbooks";
import type { Recipe } from "../../types/recipe";
import { IngredientListItem } from "./IngredientListItem";

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
  const { cookbooks, addRecipeToCookbook } = useCookbooks();
  const [cookbookPopoverOpen, setCookbookPopoverOpen] = useState(false);
  
  if (!recipe) return null;

  const handleAddToCookbook = (cookbookId: string) => {
    addRecipeToCookbook(cookbookId, recipe.id);
    setCookbookPopoverOpen(false);
  };

  const dietaryTagsOnly = recipe.dietary_tags.filter(
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
            <span className="flex-1">{recipe.name}</span>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Popover open={cookbookPopoverOpen} onOpenChange={setCookbookPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 flex-1 sm:flex-initial"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="hidden sm:inline">Add to Cookbook</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1">Add to collection</p>
                  {cookbooks.length === 0 ? (
                    <p className="text-xs text-muted-foreground px-2 py-2">
                      No cookbooks yet. <Link to="/cookbooks" className="text-[#6ec257] hover:underline" onClick={() => setCookbookPopoverOpen(false)}>Create one</Link>.
                    </p>
                  ) : (
                    <ul className="max-h-48 overflow-y-auto">
                      {cookbooks.map((cb) => {
                        const alreadyAdded = cb.recipeIds.includes(recipe.id);
                        return (
                          <li key={cb.id}>
                            <button
                              type="button"
                              onClick={() => !alreadyAdded && handleAddToCookbook(cb.id)}
                              disabled={alreadyAdded}
                              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted disabled:opacity-60 disabled:cursor-default"
                            >
                              {cb.name}
                              {alreadyAdded && (
                                <span className="ml-1 text-xs text-[#6ec257]">✓</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </PopoverContent>
              </Popover>
              <Button
                onClick={handleFavoriteClick}
                variant="outline"
                size="sm"
                className="gap-2 flex-1 sm:flex-initial"
                aria-label={isFavorite(recipe.id) ? "Unlike recipe" : "Like recipe"}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isFavorite(recipe.id)
                      ? "fill-red-500 text-red-500"
                      : ""
                  } transition-colors`}
                />
                <span className="hidden sm:inline">{isFavorite(recipe.id) ? "Liked" : "Like"}</span>
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
          <div className="space-y-2">
            <ImageWithFallback
              src={recipe.image_1}
              alt={recipe.name}
              className="w-full h-64 md:h-80 object-cover rounded-lg"
            />
            {(recipe.image_2 || recipe.image_3) && (
              <div className="flex gap-2">
                {recipe.image_2 && (
                  <img src={recipe.image_2} alt={`${recipe.name} — photo 2`}
                    className="h-20 w-20 rounded-md object-cover flex-shrink-0" />
                )}
                {recipe.image_3 && (
                  <img src={recipe.image_3} alt={`${recipe.name} — photo 3`}
                    className="h-20 w-20 rounded-md object-cover flex-shrink-0" />
                )}
              </div>
            )}
          </div>

          <p className="text-muted-foreground">{recipe.description}</p>

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
                <ul className="list-none grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2.5">
                  {recipe.ingredients.map((ingredient, index) => (
                    <IngredientListItem key={index} variant="default">
                      {ingredient}
                    </IngredientListItem>
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
                      <span className="text-sm leading-relaxed">{instruction}</span>
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
