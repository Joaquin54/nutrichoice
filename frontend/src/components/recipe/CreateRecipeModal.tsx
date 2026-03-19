import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ChefHat, ImageIcon } from 'lucide-react';
import { useRecipeActions } from '../../hooks/useRecipeActions';
import type { Recipe } from '../../types/recipe';

const DIETARY_TAG_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Egg-Free',
  'Pescatarian',
  'Low-Carb',
  'Keto',
  'High-Protein',
  'Nut-Free',
];

const DIFFICULTY_OPTIONS: Recipe['difficulty'][] = ['Easy', 'Medium', 'Hard'];

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function generateId() {
  return `my-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function CreateRecipeModal({ isOpen, onClose }: CreateRecipeModalProps) {
  const { addMyRecipe } = useRecipeActions();

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [difficulty, setDifficulty] = useState<Recipe['difficulty']>('Easy');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setDescription('');
    setCookTime('');
    setServings('');
    setDifficulty('Easy');
    setSelectedTags([]);
    setIngredients(['']);
    setInstructions(['']);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const updateIngredient = (index: number, value: string) => {
    setIngredients(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const addIngredient = () => setIngredients(prev => [...prev, '']);

  const removeIngredient = (index: number) => {
    if (ingredients.length === 1) return;
    setIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions(prev => prev.map((item, i) => (i === index ? value : item)));
  };

  const addInstruction = () => setInstructions(prev => [...prev, '']);

  const removeInstruction = (index: number) => {
    if (instructions.length === 1) return;
    setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!description.trim()) newErrors.description = 'Description is required';
    if (!cookTime || isNaN(Number(cookTime)) || Number(cookTime) <= 0)
      newErrors.cookTime = 'Enter a valid cook time in minutes';
    if (!servings || isNaN(Number(servings)) || Number(servings) <= 0)
      newErrors.servings = 'Enter a valid number of servings';
    const filledIngredients = ingredients.filter(i => i.trim());
    if (filledIngredients.length === 0)
      newErrors.ingredients = 'Add at least one ingredient';
    const filledInstructions = instructions.filter(i => i.trim());
    if (filledInstructions.length === 0)
      newErrors.instructions = 'Add at least one instruction';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const recipe: Recipe = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      image: imageUrl.trim() || '',
      cookTime: Number(cookTime),
      servings: Number(servings),
      difficulty,
      dietaryTags: selectedTags,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
    };

    addMyRecipe(recipe);
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ChefHat className="h-5 w-5 text-[#6ec257]" />
            Create a Recipe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-title">
              Recipe Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="recipe-title"
              placeholder="e.g. Creamy Garlic Pasta"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={errors.title ? 'border-red-400' : ''}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-image" className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Image URL <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Input
              id="recipe-image"
              placeholder="https://example.com/my-recipe.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden h-32 bg-muted">
                <img
                  src={imageUrl}
                  alt="Recipe preview"
                  className="w-full h-full object-cover"
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-description">
              Description <span className="text-red-500">*</span>
            </Label>
            <textarea
              id="recipe-description"
              placeholder="A short description of your recipe..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className={`w-full rounded-md border px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 transition-colors ${
                errors.description ? 'border-red-400' : 'border-input'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Cook time, servings, difficulty */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="recipe-cooktime">
                Cook Time (min) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipe-cooktime"
                type="number"
                placeholder="30"
                min={1}
                value={cookTime}
                onChange={e => setCookTime(e.target.value)}
                className={errors.cookTime ? 'border-red-400' : ''}
              />
              {errors.cookTime && (
                <p className="text-xs text-red-500">{errors.cookTime}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipe-servings">
                Servings <span className="text-red-500">*</span>
              </Label>
              <Input
                id="recipe-servings"
                type="number"
                placeholder="4"
                min={1}
                value={servings}
                onChange={e => setServings(e.target.value)}
                className={errors.servings ? 'border-red-400' : ''}
              />
              {errors.servings && (
                <p className="text-xs text-red-500">{errors.servings}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="recipe-difficulty">Difficulty</Label>
              <select
                id="recipe-difficulty"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as Recipe['difficulty'])}
                className="w-full rounded-md border border-input px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 transition-colors"
              >
                {DIFFICULTY_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <Label>Dietary Tags</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAG_OPTIONS.map(tag => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className="focus:outline-none"
                  >
                    <Badge
                      variant={active ? 'default' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        active
                          ? 'bg-[#6ec257] text-white border-[#6ec257] hover:bg-[#5aad44]'
                          : 'hover:border-[#6ec257]/60 hover:text-[#6ec257]'
                      }`}
                    >
                      {tag}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>
              Ingredients <span className="text-red-500">*</span>
            </Label>
            {errors.ingredients && (
              <p className="text-xs text-red-500">{errors.ingredients}</p>
            )}
            <div className="space-y-2">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                    {index + 1}.
                  </span>
                  <Input
                    placeholder={`e.g. 2 cups flour`}
                    value={ingredient}
                    onChange={e => updateIngredient(index, e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIngredient}
              className="gap-1.5 text-[#6ec257] border-[#6ec257]/30 hover:border-[#6ec257]/60 hover:bg-[#6ec257]/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Ingredient
            </Button>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>
              Instructions <span className="text-red-500">*</span>
            </Label>
            {errors.instructions && (
              <p className="text-xs text-red-500">{errors.instructions}</p>
            )}
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0 mt-2.5">
                    {index + 1}.
                  </span>
                  <textarea
                    placeholder={`Step ${index + 1}...`}
                    value={instruction}
                    onChange={e => updateInstruction(index, e.target.value)}
                    rows={2}
                    className="flex-1 rounded-md border border-input px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    disabled={instructions.length === 1}
                    className="p-1.5 mt-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addInstruction}
              className="gap-1.5 text-[#6ec257] border-[#6ec257]/30 hover:border-[#6ec257]/60 hover:bg-[#6ec257]/5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Step
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#6ec257] hover:bg-[#5aad44] text-white gap-2"
          >
            <ChefHat className="h-4 w-4" />
            Save Recipe
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}