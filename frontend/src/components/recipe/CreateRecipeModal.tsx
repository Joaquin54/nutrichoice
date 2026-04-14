// components/recipe/CreateRecipeModal.tsx
// Recipe creation modal — submits to backend, uploads images via Supabase post-create.

import { useReducer, useRef, useCallback, useState, Fragment, type ReactNode } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Plus, Trash2, ChefHat, ChevronDown, Check } from 'lucide-react';
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

/** All fields, helpers, errors, timeline add-row — one size with muted placeholders */
const MODAL_FIELD_CLASS =
  'text-sm font-normal leading-normal text-foreground placeholder:text-muted-foreground';

/** Dialog title + field labels — one size */
const MODAL_SECTION_TITLE = 'text-base font-semibold';

/** Step name row under circles */
const MODAL_STEPPER = 'text-sm font-medium';
/** Numbers inside step circles */
const MODAL_STEPPER_NUM = 'text-sm font-semibold tabular-nums';

/** Vertical rhythm — tighter on small screens for mobile */
const WIZARD_STEP = 'flex flex-col gap-4 sm:gap-6';
/** Label, control, helper, or error — same on all steps */
const WIZARD_FIELD = 'space-y-2';
/** ~10% under Tailwind max-w-4xl (56rem) */
const DIALOG_MAX_WIDTH = 'max-w-[50.4rem] sm:max-w-[50.4rem]';

/** Tight vertical rhythm; Add row is pulled up with -mt-1 on TimelineAddRow. */
const TIMELINE_STACK = 'flex flex-col gap-1';

const TIMELINE_CIRCLE =
  'z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/25 bg-background text-sm font-semibold tabular-nums text-foreground sm:h-9 sm:w-9';

// ---------------------------------------------------------------------------
// Shared timeline sub-components
// ---------------------------------------------------------------------------

function TimelineRow({
  circle, showConnectorBelow, children, alignField = 'center', contentClassName,
  /**
   * Last row before “Add …”: short fixed connector + rail doesn’t stretch to textarea height,
   * so ingredients and instructions match visually.
   */
  stubConnectorBeforeAdd = false,
}: {
  circle: ReactNode; showConnectorBelow: boolean;
  children: ReactNode; alignField?: 'center' | 'start';
  contentClassName?: string;
  stubConnectorBeforeAdd?: boolean;
}) {
  return (
    <div className="flex gap-2 sm:gap-3">
      <div
        className={cn(
          'flex w-8 shrink-0 flex-col items-center sm:w-9',
          stubConnectorBeforeAdd ? 'self-start' : 'self-stretch',
        )}
      >
        <div className={TIMELINE_CIRCLE}>{circle}</div>
        {showConnectorBelow && (
          stubConnectorBeforeAdd ? (
            <div
              className="mt-1 h-4 w-0.5 shrink-0 rounded-full bg-muted-foreground/40 dark:bg-muted-foreground/50"
              aria-hidden
            />
          ) : (
            <div className="mt-1 w-0.5 flex-1 min-h-3 rounded-full bg-muted-foreground/35 dark:bg-muted-foreground/45" aria-hidden />
          )
        )}
      </div>
      <div
        className={cn(
          'min-w-0 flex-1 flex gap-2',
          alignField === 'center' ? 'items-center' : 'items-start',
          contentClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TimelineAddRow({ addLabel, onAdd }: { addLabel: string; onAdd: () => void }) {
  return (
    <button type="button" onClick={onAdd}
      className="group -mt-1 flex min-h-11 w-full touch-manipulation gap-2 rounded-md py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#6ec257]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-0 sm:gap-3 sm:py-1">
      <span className="flex w-8 shrink-0 flex-col items-center justify-center sm:w-9">
        <span className={cn(TIMELINE_CIRCLE, 'border-dashed border-muted-foreground/35 bg-muted/40 font-normal text-muted-foreground transition-colors group-hover:border-[#6ec257]/40 group-hover:text-[#6ec257]')} aria-hidden>
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center text-sm font-normal text-muted-foreground transition-colors group-hover:text-[#6ec257]">
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
  title: '', description: '', cuisineType: '',
  selectedTags: [], ingredients: [{ ...DEFAULT_INGREDIENT }],
  instructions: [''], imagePreviews: [null, null, null],
  uploadingIndex: null, errors: {}, isSubmitting: false,
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FIELD': return { ...state, [action.field]: action.value };
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

function validateBasics(state: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  if (!state.title.trim()) errs.title = 'Title is required';
  if (!state.description.trim()) errs.description = 'Description is required';
  return errs;
}

function validateIngredientsOnly(state: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  const validIngredients = state.ingredients.filter((i) => i.ingredientId !== null && i.quantity.trim());
  if (validIngredients.length === 0) errs.ingredients = 'Add at least one ingredient with a quantity';
  return errs;
}

function validateInstructionsOnly(state: FormState): Record<string, string> {
  const errs: Record<string, string> = {};
  const validInstructions = state.instructions.filter((s) => s.trim());
  if (validInstructions.length === 0) errs.instructions = 'Add at least one instruction';
  return errs;
}

function validateForSubmit(state: FormState): Record<string, string> {
  return {
    ...validateBasics(state),
    ...validateIngredientsOnly(state),
    ...validateInstructionsOnly(state),
  };
}

// ---------------------------------------------------------------------------
// CreateRecipeModal
// ---------------------------------------------------------------------------

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  { id: 1 as const, label: 'Basics' },
  { id: 2 as const, label: 'Ingredients' },
  { id: 3 as const, label: 'Instructions' },
  { id: 4 as const, label: 'Photos' },
] as const;

const STEP_LABEL_COL = ['col-start-1', 'col-start-3', 'col-start-5', 'col-start-7'] as const;

export function CreateRecipeModal({ isOpen, onClose }: CreateRecipeModalProps) {
  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const [step, setStep] = useState(1);
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
    setStep(1);
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

  const goNext = () => {
    let errs: Record<string, string>;
    let nextStep: number;

    switch (step) {
      case 1:
        errs = validateBasics(state);
        nextStep = 2;
        break;
      case 2:
        errs = validateIngredientsOnly(state);
        nextStep = 3;
        break;
      case 3:
        errs = validateInstructionsOnly(state);
        nextStep = 4;
        break;
      default:
        return;
    }

    if (Object.keys(errs).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: errs });
      return;
    }
    dispatch({ type: 'SET_ERRORS', errors: {} });
    setStep(nextStep);
  };

  const goBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const errs = validateForSubmit(state);
    if (Object.keys(errs).length > 0) {
      dispatch({ type: 'SET_ERRORS', errors: errs });
      if (errs.title || errs.description) setStep(1);
      else if (errs.ingredients) setStep(2);
      else if (errs.instructions) setStep(3);
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
        measure_type: 'grams',
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
      <DialogContent
        className={cn(
          DIALOG_MAX_WIDTH,
          'flex max-h-[min(92dvh,92vh)] w-[calc(100vw-1rem)] max-w-[min(calc(100vw-1rem),50.4rem)] flex-col overflow-hidden rounded-xl border p-0 shadow-lg',
          'gap-0 sm:max-h-[90vh] sm:gap-5 sm:rounded-lg sm:p-6',
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/60 px-4 pb-3 pr-12 pt-4 text-center sm:border-0 sm:px-0 sm:pb-0 sm:pr-10 sm:pt-0 sm:text-center">
          <DialogTitle className={cn('flex items-center justify-center gap-2', MODAL_SECTION_TITLE)}>
            <ChefHat className="h-5 w-5 shrink-0 text-[#6ec257]" />
            Create a Recipe
          </DialogTitle>
          <div className="-mx-1 overflow-x-auto overscroll-x-contain pb-0.5 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:overflow-visible">
            <nav
              aria-label="Recipe creation steps"
              className="mx-auto grid w-max min-w-[min(100%,18.75rem)] grid-cols-[2rem_minmax(0.35rem,1fr)_2rem_minmax(0.35rem,1fr)_2rem_minmax(0.35rem,1fr)_2rem] items-center gap-x-0.5 gap-y-0.5 px-1 sm:w-full sm:min-w-0 sm:max-w-xl sm:grid-cols-[2.25rem_minmax(0.5rem,1fr)_2.25rem_minmax(0.5rem,1fr)_2.25rem_minmax(0.5rem,1fr)_2.25rem] sm:gap-x-1 sm:gap-y-1 sm:px-0"
            >
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              return (
                <Fragment key={s.id}>
                  <div className="flex justify-center">
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 tabular-nums transition-colors sm:h-7 sm:w-7',
                        MODAL_STEPPER_NUM,
                        done && 'border-[#6ec257] bg-[#6ec257] text-white',
                        active && !done && 'border-[#6ec257] bg-background text-[#6ec257]',
                        !active && !done && 'border-muted-foreground/25 bg-background text-muted-foreground',
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : s.id}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex min-h-7 items-center" aria-hidden>
                      <div
                        className={cn(
                          'h-0.5 w-full rounded-full transition-colors',
                          step > i + 1
                            ? 'bg-[#6ec257]'
                            : 'bg-muted-foreground/45 dark:bg-muted-foreground/55',
                        )}
                      />
                    </div>
                  )}
                </Fragment>
              );
            })}
            {STEPS.map((s, i) => {
              const active = step === s.id;
              return (
                <span
                  key={`label-${s.id}`}
                  className={cn(
                    'row-start-2 max-w-[5.5rem] justify-self-center text-center leading-tight sm:max-w-none',
                    MODAL_STEPPER,
                    STEP_LABEL_COL[i],
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {s.label}
                </span>
              );
            })}
            </nav>
          </div>
        </DialogHeader>

        <div className={cn(WIZARD_STEP, 'min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 pb-8 sm:px-0 sm:py-0.5 sm:pb-0')}>
          {state.errors.submit && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
              {state.errors.submit}
            </p>
          )}

          {step === 1 && (
            <div className={WIZARD_STEP}>
              <div className={WIZARD_FIELD}>
                <Label htmlFor="recipe-title" className={MODAL_SECTION_TITLE}>Recipe Title <span className="text-red-500">*</span></Label>
                <Input id="recipe-title" placeholder="e.g. Creamy Garlic Pasta"
                  value={state.title}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
                  className={cn(MODAL_FIELD_CLASS, state.errors.title && 'border-red-400')} />
                {state.errors.title && <p className="text-sm text-red-600 dark:text-red-400">{state.errors.title}</p>}
              </div>

              <div className={WIZARD_FIELD}>
                <Label htmlFor="recipe-description" className={MODAL_SECTION_TITLE}>Description <span className="text-red-500">*</span></Label>
                <textarea id="recipe-description" placeholder="A short description of your recipe…"
                  value={state.description}
                  onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                  rows={3}
                  className={cn(MODAL_FIELD_CLASS, 'w-full rounded-md border bg-background px-3 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 resize-none', state.errors.description ? 'border-red-400' : 'border-input')} />
                {state.errors.description && <p className="text-sm text-red-600 dark:text-red-400">{state.errors.description}</p>}
              </div>

              <div className={WIZARD_FIELD}>
                <Label htmlFor="cuisine-type" className={MODAL_SECTION_TITLE}>Cuisine Type</Label>
                <div className="relative w-full max-w-md">
                  <select id="cuisine-type" value={state.cuisineType}
                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'cuisineType', value: e.target.value })}
                    className={cn(
                      MODAL_FIELD_CLASS,
                      'h-9 w-full appearance-none rounded-md border border-input bg-background pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50',
                    )}
                  >
                    <option value="">— Select —</option>
                    {CUISINE_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              <div className={WIZARD_FIELD}>
                <Label className={MODAL_SECTION_TITLE}>Dietary Tags</Label>
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
            </div>
          )}

          {step === 2 && (
            <section className="flex flex-col gap-2">
              <div className={WIZARD_FIELD}>
                <Label className={MODAL_SECTION_TITLE}>Ingredients <span className="text-red-500">*</span></Label>
                {state.errors.ingredients && <p className="text-sm text-red-600 dark:text-red-400">{state.errors.ingredients}</p>}
              </div>
              <div className={cn(TIMELINE_STACK, '[&_input]:mb-0 [&_textarea]:mb-0 [&_select]:mb-0')}>
                {state.ingredients.map((row, index) => (
                  <TimelineRow
                    key={index}
                    circle={index + 1}
                    showConnectorBelow
                    alignField="start"
                    stubConnectorBeforeAdd={index === state.ingredients.length - 1}
                  >
                    <IngredientInput row={row} index={index}
                      canRemove={state.ingredients.length > 1}
                      onChange={(i, r) => dispatch({ type: 'SET_INGREDIENT', index: i, row: r })}
                      onRemove={(i) => dispatch({ type: 'REMOVE_INGREDIENT', index: i })} />
                  </TimelineRow>
                ))}
                <TimelineAddRow addLabel="Add ingredient" onAdd={() => dispatch({ type: 'ADD_INGREDIENT' })} />
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="flex flex-col gap-2">
              <div className={WIZARD_FIELD}>
                <Label className={MODAL_SECTION_TITLE}>Instructions <span className="text-red-500">*</span></Label>
                {state.errors.instructions && <p className="text-sm text-red-600 dark:text-red-400">{state.errors.instructions}</p>}
              </div>
              <div className={cn(TIMELINE_STACK, '[&_input]:mb-0 [&_textarea]:mb-0 [&_select]:mb-0')}>
                {state.instructions.map((instructionStep, index) => (
                  <TimelineRow
                    key={index}
                    circle={index + 1}
                    showConnectorBelow
                    alignField="start"
                    stubConnectorBeforeAdd={index === state.instructions.length - 1}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-start sm:gap-2">
                      <textarea placeholder={`Step ${index + 1}`} value={instructionStep}
                        onChange={(e) => dispatch({ type: 'SET_INSTRUCTION', index, value: e.target.value })}
                        rows={3}
                        className={cn(
                          MODAL_FIELD_CLASS,
                          'mb-0 block min-h-[5.5rem] w-full min-w-0 flex-1 resize-y rounded-lg border border-input bg-background px-3 py-2 leading-snug transition-colors focus:outline-none focus:ring-2 focus:ring-[#6ec257]/50 sm:min-h-[3.25rem]',
                        )}
                      />
                      <button type="button" onClick={() => dispatch({ type: 'REMOVE_INSTRUCTION', index })}
                        disabled={state.instructions.length === 1}
                        className="min-h-11 shrink-0 touch-manipulation self-end rounded-md px-2 py-2 text-muted-foreground hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-30 sm:mt-1 sm:min-h-0 sm:self-start sm:p-1.5 dark:hover:bg-red-950/20"
                        aria-label="Remove step">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TimelineRow>
                ))}
                <TimelineAddRow addLabel="Add step" onAdd={() => dispatch({ type: 'ADD_INSTRUCTION' })} />
              </div>
            </section>
          )}

          {step === 4 && (
            <div className={WIZARD_FIELD}>
              <Label className={MODAL_SECTION_TITLE}>
                Photos
                <span className="ml-1.5 font-normal text-muted-foreground">(optional, up to 3)</span>
              </Label>
              <p className={cn(MODAL_FIELD_CLASS, 'leading-relaxed text-muted-foreground')}>
                Add up to three images. You can finish without photos.
              </p>
              <ImageUploadGrid
                images={state.imagePreviews}
                onUpload={handleImageStage}
                onRemove={handleRemoveImage}
                uploadingIndex={state.uploadingIndex}
                disabled={isBusy}
                error={uploadState.error}
              />
            </div>
          )}
        </div>

        <DialogFooter className="mt-0 w-full shrink-0 flex-col gap-2 border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-0 sm:pb-0 sm:pt-5">
          {step > 1 && (
            <div className="flex w-full sm:w-auto">
              <Button type="button" variant="secondary" className="min-h-11 w-full touch-manipulation sm:min-h-9 sm:w-auto" onClick={goBack} disabled={isBusy}>
                Back
              </Button>
            </div>
          )}
          <div className="flex w-full gap-2 sm:ml-auto sm:w-auto">
            {step < 4 ? (
              <Button type="button" onClick={goNext} disabled={isBusy}
                className="min-h-11 w-full touch-manipulation bg-[#6ec257] hover:bg-[#5aad44] text-white sm:min-h-9 sm:w-auto">
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={isBusy}
                className="min-h-11 w-full touch-manipulation gap-2 bg-[#6ec257] hover:bg-[#5aad44] text-white sm:min-h-9 sm:w-auto">
                <ChefHat className="h-4 w-4" />
                {state.isSubmitting ? 'Saving…' : 'Save Recipe'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
