// components/recipe/CreateRecipeModal.tsx
// Recipe creation modal — submits to backend, uploads images via Supabase post-create.

import { useReducer, useRef, useCallback, type ReactNode } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ChefHat, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { createRecipe, apiRecipeToRecipe, type CreateRecipePayload } from '../../api';
import { useRecipes } from '../../hooks/useRecipes';
import { useSupabaseUpload } from '../../hooks/useSupabaseUpload';
import { ImageUploadGrid } from './ImageUploadGrid';
import { IngredientInput, type IngredientRow } from './IngredientInput';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIETARY_TAG_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Egg-Free',
  'Pescatarian', 'Low-Carb', 'Keto', 'High-Protein', 'Nut-Free',
];

const CUISINE_OPTIONS = [
  'Italian', 'French', 'Mexican', 'American', 'Japanese',
  'Chinese', 'Indian', 'Thai', 'Mediterranean', 'Korean',
];

type MeasureType = 'grams' | 'cups' | 'tablespoons';

const MODAL_FIELD_CLASS =
  'text-sm font-normal leading-normal text-foreground placeholder:text-muted-foreground';

const TIMELINE_CIRCLE =
  'z-[1] flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25 bg-background text-sm font-semibold tabular-nums text-foreground';

// ---------------------------------------------------------------------------
// Shared timeline sub-components
// ---------------------------------------------------------------------------

function TimelineRow({
  circle, showConnectorBelow, children, alignField = 'center',
}: {
  circle: ReactNode; showConnectorBelow: boolean;
  children: ReactNode; alignField?: 'center' | 'start';
}) {
  return (
    <div className="flex gap-3">
      <div className="flex w-9 shrink-0 flex-col items-center self-stretch">
        <div className={TIMELINE_CIRCLE}>{circle}</div>
        {showConnectorBelow && <div className="mt-1 w-px flex-1 min-h-3 bg-border" aria-hidden />}
      </div>
      <div className={cn('min-w-0 flex-1 flex gap-2 pb-4', alignField === 'center' ? 'items-center' : 'items-start')}>
        {children}
      </div>
    </div>
  );
}

function TimelineAddRow({ addLabel, onAdd }: { addLabel: string; onAdd: () => void }) {
  return (
    <button type="button" onClick={onAdd}
      className="group flex w-full gap-3 rounded-md py-1 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#6ec257]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
      <span className="flex w-9 shrink-0 flex-col items-center">
        <span className={cn(TIMELINE_CIRCLE, 'border-dashed border-muted-foreground/35 bg-muted/40 font-normal text-muted-foreground transition-colors group-hover:border-[#6ec257]/40 group-hover:text-[#6ec257]')} aria-hidden>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center py-2 text-sm font-normal text-muted-foreground transition-colors group-hover:text-[#6ec257]">
        {addLabel}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

interface FormState {
  title: string;
  description: string;
  cuisineType: string;
  measureType: MeasureType;
  selectedTags: string[];
  ingredients: IngredientRow[];
  instructions: string[];
  /** Preview URLs (object URLs) or uploaded URLs for the 3 image slots. */
  imagePreviews: (string | null)[];
  uploadingIndex: number | null;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof Pick<FormState, 'title' | 'description' | 'cuisineType'>; value: string }
  | { type: 'SET_MEASURE_TYPE'; value: MeasureType }
  | { type: 'TOGGLE_TAG'; tag: string }
  | { type: 'SET_INGREDIENT'; index: number; row: IngredientRow }
  | { type: 'ADD_INGREDIENT' }
  | { type: 'REMOVE_INGREDIENT'; index: number }
  | { type: 'SET_INSTRUCTION'; index: number; value: string }
  | { type: 'ADD_INSTRUCTION' }
  | { type: 'REMOVE_INSTRUCTION'; index: number }
  | { type: 'SET_IMAGE_PREVIEW'; index: number; url: string }
  | { type: 'REMOVE_IMAGE'; index: number }
  | { type: 'SET_UPLOADING_INDEX'; index: number | null }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'SET_SUBMITTING'; value: boolean }
  | { type: 'RESET' };

const DEFAULT_INGREDIENT: IngredientRow = {
  ingredientId: null, ingredientName: '', quantity: '', unit: 'grams',
};

const INITIAL_STATE: FormState = {
  title: '', description: '', cuisineType: '', measureType: 'grams',
  selectedTags: [], ingredients: [{ ...DEFAULT_INGREDIENT }],
  instructions: [''], imagePreviews: [null, null, null],
  uploadingIndex: null, errors: {}, isSubmitting: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
    case 'SET_MEASURE_TYPE': return { ...state, measureType: action.value };
    case 'TOGGLE_TAG': return {
      ...state,
      selectedTags: state.selectedTags.includes(action.tag)
        ? state.selectedTags.filter((t) => t !== action.tag)
        : [...state.selectedTags, action.tag],
    };
    case 'SET_INGREDIENT': {
      const updated = [...state.ingredients];
      updated[action.index] = action.row;
      return { ...state, ingredients: updated };
    }
    case 'ADD_INGREDIENT': return { ...state, ingredients: [...state.ingredients, { ...DEFAULT_INGREDIENT }] };
    case 'REMOVE_INGREDIENT': return {
      ...state, ingredients: state.ingredients.filter((_, i) => i !== action.index),
    };
    case 'SET_INSTRUCTION': {
      const updated = [...state.instructions];
      updated[action.index] = action.value;
      return { ...state, instructions: updated };
    }
    case 'ADD_INSTRUCTION': return { ...state, instructions: [...state.instructions, ''] };
    case 'REMOVE_INSTRUCTION': return {
      ...state, instructions: state.instructions.filter((_, i) => i !== action.index),
    };
    case 'SET_IMAGE_PREVIEW': {
      const previews = [...state.imagePreviews] as (string | null)[];
      previews[action.index] = action.url;
      return { ...state, imagePreviews: previews };
    }
    case 'REMOVE_IMAGE': {
      const previews = [...state.imagePreviews] as (string | null)[];
      previews[action.index] = null;
      return { ...state, imagePreviews: previews };
    }
    case 'SET_UPLOADING_INDEX': return { ...state, uploadingIndex: action.index };
    case 'SET_ERRORS': return { ...state, errors: action.errors };
    case 'SET_SUBMITTING': return { ...state, isSubmitting: action.value };
    case 'RESET': return { ...INITIAL_STATE, ingredients: [{ ...DEFAULT_INGREDIENT }] };
    default: return state;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validate(state: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!state.title.trim()) errs.title = 'Title is required';
  if (!state.description.trim()) errs.description = 'Description is required';
  const validIngredients = state.ingredients.filter((i) => i.ingredientId !== null && i.quantity.trim());
  if (validIngredients.length === 0) errs.ingredients = 'Add at least one ingredient with a quantity';
  const validInstructions = state.instructions.filter((s) => s.trim());
  if (validInstructions.length === 0) errs.instructions = 'Add at least one instruction';
  return errs;
}

// ---------------------------------------------------------------------------
// CreateRecipeModal
// ---------------------------------------------------------------------------

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRecipeModal({ isOpen, onClose }: CreateRecipeModalProps) {
  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const { addRecipe } = useRecipes();
  const { uploadRecipeImage, state: uploadState } = useSupabaseUpload();

  // Staged file objects — uploaded after recipe creation so we have a valid recipe_id.
  const stagedFiles = useRef<(File | null)[]>([null, null, null]);
  // Object URLs we created — must be revoked on close.
  const objectUrls = useRef<(string | null)[]>([null, null, null]);

  const revokeObjectUrls = useCallback(() => {
    objectUrls.current.forEach((url) => { if (url) URL.revokeObjectURL(url); });
    objectUrls.current = [null, null, null];
  }, []);

  const handleClose = useCallback(() => {
    revokeObjectUrls();
    stagedFiles.current = [null, null, null];
    dispatch({ type: 'RESET' });
    onClose();
  }, [onClose, revokeObjectUrls]);

  // Stage the file and create a local preview — actual upload happens post-submit.
  const handleImageStage = useCallback(async (file: File, index: number): Promise<string | null> => {
    // Revoke previous object URL for this slot if any.
    const prev = objectUrls.current[index];
    if (prev) URL.revokeObjectURL(prev);

    const previewUrl = URL.createObjectURL(file);
    objectUrls.current[index] = previewUrl;
    stagedFiles.current[index] = file;
    dispatch({ type: 'SET_IMAGE_PREVIEW', index, url: previewUrl });
    return previewUrl;
  }, []);

  const handleRemoveImage = useCallback((index: number) => {
    const prev = objectUrls.current[index];
    if (prev) URL.revokeObjectURL(prev);
    objectUrls.current[index] = null;
    stagedFiles.current[index] = null;
    dispatch({ type: 'REMOVE_IMAGE', index });
  }, []);

  const handleSubmit = async () => {
    const errs = validate(state);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: errs });
      return;
    }
    dispatch({ type: 'SET_SUBMITTING', value: true });
    dispatch({ type: 'SET_ERRORS', errors: {} });

    try {
      const payload: CreateRecipePayload = {
        name: state.title.trim(),
        description: state.description.trim(),
        cuisine_type: state.cuisineType,
        dietary_tags: state.selectedTags,
        measure_type: state.measureType,
        ingredients: state.ingredients
          .filter((i) => i.ingredientId !== null && i.quantity.trim())
          .map((i) => ({ ingredient: i.ingredientId as number, quantity: parseFloat(i.quantity), unit: i.unit as string })),
        instructions: state.instructions
          .filter((s) => s.trim())
          .map((text, idx) => ({ step_number: idx + 1, text: text.trim(), estimated_cooktime: null })),
      };

      const apiRecipe = await createRecipe(payload);

      // Upload staged images now that we have a valid recipe_id.
      for (const imgIndex of ([0, 1, 2] as const)) {
        const file = stagedFiles.current[imgIndex];
        if (!file) continue;
        dispatch({ type: 'SET_UPLOADING_INDEX', index: imgIndex });
        await uploadRecipeImage(file, apiRecipe.id, imgIndex);
        dispatch({ type: 'SET_UPLOADING_INDEX', index: null });
      }

      addRecipe(apiRecipeToRecipe(apiRecipe));
      handleClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create recipe';
      dispatch({ type: 'SET_ERRORS', errors: { submit: msg } });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', value: false });
    }
  };

  const isBusy = state.isSubmitting || uploadState.isUploading;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ChefHat className="h-5 w-5 text-[#6ec257]" />
            Create a Recipe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {state.errors.submit && (
            <p className="text-sm text-red-500 rounded-md bg-red-50 dark:bg-red-950/20 px-3 py-2">
              {state.errors.submit}
            </p>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-title">Recipe Title <span className="text-red-500">*</span></Label>
            <Input id="recipe-title" placeholder="e.g. Creamy Garlic Pasta"
              value={state.title}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
              className={cn(MODAL_FIELD_CLASS, state.errors.title && 'border-red-400')} />
            {state.errors.title && <p className="text-sm text-red-500">{state.errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="recipe-description">Description <span className="text-red-500">*</span></Label>
            <textarea id="recipe-description" placeholder="A short description of your recipe…"
              value={state.description}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
              rows={3}
              className={cn(MODAL_FIELD_CLASS, 'w-full rounded-md border px-3 py-2 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 transition-colors', state.errors.description ? 'border-red-400' : 'border-input')} />
            {state.errors.description && <p className="text-sm text-red-500">{state.errors.description}</p>}
          </div>

          {/* Cuisine + Measure type */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="cuisine-type">Cuisine Type</Label>
              <div className="relative">
                <select id="cuisine-type" value={state.cuisineType}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cuisineType', value: e.target.value })}
                  className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50">
                  <option value="">— Select —</option>
                  {CUISINE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="measure-type">Measure Type</Label>
              <div className="relative">
                <select id="measure-type" value={state.measureType}
                  onChange={(e) => dispatch({ type: 'SET_MEASURE_TYPE', value: e.target.value as MeasureType })}
                  className="h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50">
                  <option value="grams">Grams</option>
                  <option value="cups">Cups</option>
                  <option value="tablespoons">Tablespoons</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="space-y-2">
            <Label>Dietary Tags</Label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_TAG_OPTIONS.map((tag) => {
                const active = state.selectedTags.includes(tag);
                return (
                  <button key={tag} type="button" onClick={() => dispatch({ type: 'TOGGLE_TAG', tag })} className="focus:outline-none">
                    <Badge variant={active ? 'default' : 'outline'}
                      className={cn('cursor-pointer text-sm transition-all', active ? 'border-[#6ec257] bg-[#6ec257] text-white hover:bg-[#5aad44]' : 'hover:border-[#6ec257]/60 hover:text-[#6ec257]')}>
                      {tag}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Images — staged locally, uploaded post-submit */}
          <div className="space-y-1.5">
            <Label>Photos <span className="text-sm font-normal text-muted-foreground">(optional, up to 3)</span></Label>
            <ImageUploadGrid
              images={state.imagePreviews}
              onUpload={handleImageStage}
              onRemove={handleRemoveImage}
              uploadingIndex={state.uploadingIndex}
              disabled={isBusy}
              error={uploadState.error}
            />
          </div>

          {/* Ingredients */}
          <div className="space-y-2">
            <Label>Ingredients <span className="text-red-500">*</span></Label>
            {state.errors.ingredients && <p className="text-sm text-red-500">{state.errors.ingredients}</p>}
            <div>
              {state.ingredients.map((row, index) => (
                <TimelineRow key={index} circle={index + 1} showConnectorBelow alignField="start">
                  <IngredientInput row={row} index={index}
                    canRemove={state.ingredients.length > 1}
                    onChange={(i, r) => dispatch({ type: 'SET_INGREDIENT', index: i, row: r })}
                    onRemove={(i) => dispatch({ type: 'REMOVE_INGREDIENT', index: i })} />
                </TimelineRow>
              ))}
              <TimelineAddRow addLabel="Add ingredient" onAdd={() => dispatch({ type: 'ADD_INGREDIENT' })} />
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Instructions <span className="text-red-500">*</span></Label>
            {state.errors.instructions && <p className="text-sm text-red-500">{state.errors.instructions}</p>}
            <div>
              {state.instructions.map((step, index) => (
                <TimelineRow key={index} circle={index + 1} showConnectorBelow alignField="start">
                  <textarea placeholder={`Step ${index + 1}`} value={step}
                    onChange={(e) => dispatch({ type: 'SET_INSTRUCTION', index, value: e.target.value })}
                    rows={2}
                    className={cn(MODAL_FIELD_CLASS, 'min-h-[72px] flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50')} />
                  <button type="button" onClick={() => dispatch({ type: 'REMOVE_INSTRUCTION', index })}
                    disabled={state.instructions.length === 1}
                    className="mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30 dark:hover:bg-red-950/20"
                    aria-label="Remove step">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </TimelineRow>
              ))}
              <TimelineAddRow addLabel="Add step" onAdd={() => dispatch({ type: 'ADD_INSTRUCTION' })} />
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={handleClose} disabled={isBusy}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isBusy}
            className="bg-[#6ec257] hover:bg-[#5aad44] text-white gap-2">
            <ChefHat className="h-4 w-4" />
            {state.isSubmitting ? 'Saving…' : 'Save Recipe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
