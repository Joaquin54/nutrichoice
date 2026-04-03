import { useState, type ReactNode } from 'react';
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
import { cn } from '../../lib/utils';

/** Same size/line-height for value + placeholder; overrides Input's default `text-base md:text-sm`. */
const MODAL_FIELD_CLASS =
  'text-sm font-normal leading-normal text-foreground placeholder:text-muted-foreground';

const TIMELINE_CIRCLE =
  'z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25 bg-background text-sm font-semibold tabular-nums text-foreground';

function TimelineRow({
  circle,
  showConnectorBelow,
  children,
  alignField = 'center',
}: {
  circle: ReactNode;
  showConnectorBelow: boolean;
  children: ReactNode;
  alignField?: 'center' | 'start';
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-9 shrink-0 flex-col items-center self-stretch">
        <div className={TIMELINE_CIRCLE}>{circle}</div>
        {showConnectorBelow ? (
          <div className="mt-1 w-px flex-1 min-h-3 bg-border" aria-hidden />
        ) : null}
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 flex gap-2 pb-4',
          alignField === 'center' ? 'items-center' : 'items-start'
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TimelineAddRow({
  addLabel,
  onAdd,
}: {
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="group flex w-full gap-3 rounded-md py-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#6ec257]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="flex w-9 shrink-0 flex-col items-center">
        <span
          className={cn(
            TIMELINE_CIRCLE,
            'border-dashed border-muted-foreground/35 bg-muted/40 font-normal text-muted-foreground transition-colors group-hover:border-[#6ec257]/40 group-hover:text-[#6ec257]'
          )}
          aria-hidden
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center py-2 text-sm font-normal text-muted-foreground transition-colors group-hover:text-[#6ec257]">
        {addLabel}
      </span>
    </button>
  );
}

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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setDescription('');
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
      name: title.trim(),
      description: description.trim(),
      image: imageUrl.trim() || undefined,
      dietary_tags: selectedTags,
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
              className={cn(MODAL_FIELD_CLASS, errors.title && 'border-red-400')}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Image URL */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-image" className="flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Image URL{' '}
              <span className="text-sm font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="recipe-image"
              placeholder="https://example.com/my-recipe.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className={MODAL_FIELD_CLASS}
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
              className={cn(
                MODAL_FIELD_CLASS,
                'w-full rounded-md border px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 transition-colors',
                errors.description ? 'border-red-400' : 'border-input'
              )}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
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
                      className={cn(
                        'cursor-pointer text-sm transition-all',
                        active
                          ? 'border-[#6ec257] bg-[#6ec257] text-white hover:bg-[#5aad44]'
                          : 'hover:border-[#6ec257]/60 hover:text-[#6ec257]'
                      )}
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
              <p className="text-sm text-red-500">{errors.ingredients}</p>
            )}
            <div>
              {ingredients.map((ingredient, index) => (
                <TimelineRow
                  key={index}
                  circle={index + 1}
                  showConnectorBelow
                  alignField="center"
                >
                  <Input
                    placeholder={`Add ingredient ${index + 1}`}
                    value={ingredient}
                    onChange={e => updateIngredient(index, e.target.value)}
                    className={cn(MODAL_FIELD_CLASS, 'rounded-lg')}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    disabled={ingredients.length === 1}
                    className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-red-950/20"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TimelineRow>
              ))}
              <TimelineAddRow addLabel="Add new ingredient" onAdd={addIngredient} />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>
              Instructions <span className="text-red-500">*</span>
            </Label>
            {errors.instructions && (
              <p className="text-sm text-red-500">{errors.instructions}</p>
            )}
            <div>
              {instructions.map((instruction, index) => (
                <TimelineRow
                  key={index}
                  circle={index + 1}
                  showConnectorBelow
                  alignField="start"
                >
                  <textarea
                    placeholder={`Add instruction ${index + 1}`}
                    value={instruction}
                    onChange={e => updateInstruction(index, e.target.value)}
                    rows={2}
                    className={cn(
                      MODAL_FIELD_CLASS,
                      'min-h-[72px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50'
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    disabled={instructions.length === 1}
                    className="mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-red-950/20"
                    aria-label="Remove step"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TimelineRow>
              ))}
              <TimelineAddRow addLabel="Add new instruction" onAdd={addInstruction} />
            </div>
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