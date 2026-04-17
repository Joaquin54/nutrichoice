import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { ChevronLeft, ChevronRight, Moon, Sun, Loader2, Sparkles } from 'lucide-react';
import { mockRecipes } from '../../data/mockRecipes';
import { useTheme } from '../../contexts/ThemeContext';
import { completeOnboarding } from '../../api';
import type { User } from '../../api';
import type { DietaryFilter, Recipe } from '../../types/recipe';
import { cn } from '../../lib/utils';

const TASTE_PROFILE_STORAGE_KEY = 'nutrichoice_taste_profile';

/** Exclude from onboarding picks (e.g. if mock data still lists them). */
const EXCLUDE_ONBOARDING_RECIPE_NAMES = /^chicken\s+tacos$/i;

interface RegistrationModalProps {
  isOpen: boolean;
  onComplete: (user: User) => void;
}

const COMMON_ALLERGIES = [
  'Peanuts',
  'Tree Nuts',
  'Dairy',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
  'Sulfites',
];

const FOOD_LIKE_OPTIONS: { id: string; label: string; hint: string }[] = [
  { id: 'fresh', label: 'Fresh & veggie-forward', hint: 'Salads, bowls, produce' },
  { id: 'comfort', label: 'Comfort & cozy', hint: 'Warm, hearty classics' },
  { id: 'spicy', label: 'Spicy & bold', hint: 'Heat and big flavor' },
  { id: 'sweet', label: 'Sweet treats', hint: 'Baking and desserts' },
  { id: 'quick', label: 'Quick & easy', hint: '30 minutes or less' },
  { id: 'protein', label: 'High-protein', hint: 'Filling, gym-friendly' },
  { id: 'light', label: 'Light & simple', hint: 'Easy on calories' },
  { id: 'global', label: 'Global flavors', hint: 'Try cuisines from everywhere' },
];

const CUISINE_OPTIONS: { id: string; label: string }[] = [
  { id: 'italian', label: 'Italian' },
  { id: 'mexican', label: 'Mexican' },
  { id: 'indian', label: 'Indian' },
  { id: 'thai', label: 'Thai' },
  { id: 'japanese', label: 'Japanese' },
  { id: 'chinese', label: 'Chinese' },
  { id: 'korean', label: 'Korean' },
  { id: 'mediterranean', label: 'Mediterranean' },
  { id: 'french', label: 'French' },
  { id: 'american', label: 'American' },
];

const COOKING_FREQUENCY_OPTIONS: { id: string; label: string; sub: string }[] = [
  { id: 'rarely', label: 'Rarely', sub: 'Mostly takeout or convenience' },
  { id: 'few_week', label: 'A few times a week', sub: 'Weekend cooking or simple meals' },
  { id: 'most_nights', label: 'Most nights', sub: 'Home cooking is the default' },
  { id: 'daily', label: 'Daily', sub: 'I love being in the kitchen' },
];

const GOAL_OPTIONS: { id: string; label: string; sub: string }[] = [
  { id: 'time', label: 'Save time', sub: 'Faster shopping and cooking' },
  { id: 'health', label: 'Eat healthier', sub: 'More balance and whole foods' },
  { id: 'learn', label: 'Learn to cook', sub: 'Build skills and confidence' },
  { id: 'diet', label: 'Stick to a plan', sub: 'Keto, macros, or doctor-led' },
  { id: 'family', label: 'Feed others', sub: 'Family meals or meal prep' },
];

const STEPS = [
  'welcome',
  'food_likes',
  'cuisines',
  'diet',
  'allergies',
  'recipes',
  'cooking_frequency',
  'goal',
] as const;

type StepId = (typeof STEPS)[number];

function recipeImageSrc(recipe: Recipe): string {
  const withLegacy = recipe as Recipe & { image?: string };
  return recipe.image_1 ?? withLegacy.image ?? '';
}

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

export function RegistrationModal({ isOpen, onComplete }: RegistrationModalProps) {
  const { theme, toggleTheme } = useTheme();
  const [stepIndex, setStepIndex] = useState(0);
  const [modalWidth, setModalWidth] = useState('90vw');

  const [foodLikes, setFoodLikes] = useState<string[]>([]);
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>([]);
  const [cookingFrequency, setCookingFrequency] = useState<string | null>(null);
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null);

  const [dietaryRestrictions, setDietaryRestrictions] = useState<DietaryFilter>({
    vegetarian: false,
    vegan: false,
    gluten_free: false,
    dairy_free: false,
    nut_free: false,
    keto: false,
    paleo: false,
    low_carb: false,
  });
  const [dietarySkipped, setDietarySkipped] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const totalSteps = STEPS.length;
  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    if (!isOpen) return;
    setStepIndex(0);
    setFoodLikes([]);
    setFavoriteCuisines([]);
    setCookingFrequency(null);
    setPrimaryGoal(null);
    setDietaryRestrictions({
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: false,
      keto: false,
      paleo: false,
      low_carb: false,
    });
    setDietarySkipped(false);
    setSelectedAllergies([]);
    setCustomAllergy('');
    setSelectedRecipes([]);
    setSubmitError(null);
  }, [isOpen]);

  useEffect(() => {
    const updateModalSize = () => {
      if (window.innerWidth >= 1024) {
        setModalWidth('min(520px, 70vw)');
      } else if (window.innerWidth >= 768) {
        setModalWidth('85vw');
      } else {
        setModalWidth('100vw');
      }
    };

    updateModalSize();
    window.addEventListener('resize', updateModalSize);
    return () => window.removeEventListener('resize', updateModalSize);
  }, []);

  const dietaryOptions = [
    { key: 'vegetarian' as keyof DietaryFilter, label: 'Vegetarian' },
    { key: 'vegan' as keyof DietaryFilter, label: 'Vegan' },
    { key: 'gluten_free' as keyof DietaryFilter, label: 'Gluten-Free' },
    { key: 'dairy_free' as keyof DietaryFilter, label: 'Dairy-Free' },
    { key: 'nut_free' as keyof DietaryFilter, label: 'Nut-Free' },
    { key: 'keto' as keyof DietaryFilter, label: 'Keto' },
    { key: 'paleo' as keyof DietaryFilter, label: 'Paleo' },
    { key: 'low_carb' as keyof DietaryFilter, label: 'Low Carb' },
  ];

  const handleDietaryChange = (key: keyof DietaryFilter, checked: boolean) => {
    setDietarySkipped(false);
    setDietaryRestrictions((prev) => ({ ...prev, [key]: checked }));
  };

  const handleAllergyToggle = (allergy: string) => {
    setSelectedAllergies((prev) => toggleInList(prev, allergy));
  };

  const handleCustomAllergyAdd = () => {
    const next = customAllergy.trim();
    if (next && !selectedAllergies.includes(next)) {
      setSelectedAllergies((prev) => [...prev, next]);
      setCustomAllergy('');
    }
  };

  const handleCustomAllergyRemove = (allergy: string) => {
    setSelectedAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  const handleRecipeToggle = (recipeId: string) => {
    setSelectedRecipes((prev) => toggleInList(prev, recipeId));
  };

  const handleSkipDietary = () => {
    setDietaryRestrictions({
      vegetarian: false,
      vegan: false,
      gluten_free: false,
      dairy_free: false,
      nut_free: false,
      keto: false,
      paleo: false,
      low_carb: false,
    });
    setDietarySkipped(true);
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  };

  const handleNext = () => {
    if (stepIndex < totalSteps - 1) {
      setStepIndex((i) => i + 1);
    }
  };

  const handlePrevious = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  const persistTasteProfile = () => {
    try {
      localStorage.setItem(
        TASTE_PROFILE_STORAGE_KEY,
        JSON.stringify({
          foodLikes,
          favoriteCuisines,
          cookingFrequency,
          primaryGoal,
          selectedRecipeIds: selectedRecipes,
          savedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore quota / private mode
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const updatedUser = await completeOnboarding({
        diet_type: dietarySkipped ? null : ({ ...dietaryRestrictions } as Record<string, boolean>),
        allergies: selectedAllergies,
      });
      persistTasteProfile();
      onComplete(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepHeading = (title: string, subtitle: string) => (
    <div className="space-y-1.5 pb-1">
      <h3 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
    </div>
  );

  const chipClass = (active: boolean) =>
    cn(
      'rounded-full border px-4 py-3 text-left text-sm font-medium transition-all',
      active
        ? 'border-[#6ec257] bg-[#6ec257]/15 text-foreground shadow-sm ring-2 ring-[#6ec257]/40'
        : 'border-border bg-card text-foreground hover:border-[#6ec257]/50 hover:bg-muted/40'
    );

  const renderStepBody = () => {
    switch (currentStep as StepId) {
      case 'welcome':
        return (
          <div className="flex flex-col items-center justify-center space-y-6 py-4 text-center sm:py-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#6ec257]/20">
              <Sparkles className="h-10 w-10 text-[#6ec257]" aria-hidden />
            </div>
            {stepHeading("Let's get to know your taste", "A few quick questions—one screen at a time—so NutriChoice can feel personal from day one.")}
            <p className="max-w-sm text-xs text-muted-foreground">
              You can change preferences anytime in your account.
            </p>
          </div>
        );

      case 'food_likes':
        return (
          <div className="space-y-5">
            {stepHeading('What kinds of foods do you gravitate toward?', 'Pick all that sound like you—there are no wrong answers.')}
            <div className="flex flex-col gap-2.5">
              {FOOD_LIKE_OPTIONS.map(({ id, label, hint }) => {
                const active = foodLikes.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFoodLikes((prev) => toggleInList(prev, id))}
                    className={cn(chipClass(active), 'flex w-full flex-col items-start gap-0.5')}
                  >
                    <span>{label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'cuisines':
        return (
          <div className="space-y-5">
            {stepHeading('Favorite cuisines?', 'Choose the flavors you want to see more of.')}
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {CUISINE_OPTIONS.map(({ id, label }) => {
                const active = favoriteCuisines.includes(id);
                return (
                  <button key={id} type="button" onClick={() => setFavoriteCuisines((prev) => toggleInList(prev, id))} className={chipClass(active)}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'diet':
        return (
          <div className="space-y-5">
            {stepHeading('Any dietary preferences?', 'We will prioritize recipes that match what you need.')}
            <div className="grid grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2">
              {dietaryOptions.map(({ key, label }) => (
                <div key={key} className="flex min-w-0 items-center gap-1.5 rounded-lg border border-border px-1.5 py-1.5 sm:gap-2 sm:rounded-xl sm:px-2.5 sm:py-2">
                  <Checkbox
                    id={key}
                    checked={dietaryRestrictions[key]}
                    onCheckedChange={(checked) => handleDietaryChange(key, checked as boolean)}
                  />
                  <Label htmlFor={key} className="min-w-0 cursor-pointer text-[11px] font-medium leading-tight sm:text-sm sm:leading-snug">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkipDietary}
              className="h-auto px-0 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground hover:underline"
            >
              Skip — no specific diet
            </Button>
            {dietarySkipped && <p className="text-xs text-muted-foreground">Skipped. You can set this later in Account.</p>}
          </div>
        );

      case 'allergies':
        return (
          <div className="space-y-5">
            {stepHeading('Allergies or ingredients to avoid?', 'So we can steer you away from risky recipes.')}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {COMMON_ALLERGIES.map((allergy) => (
                <div key={allergy} className="flex items-center space-x-3 rounded-xl border border-border px-3 py-2">
                  <Checkbox id={allergy} checked={selectedAllergies.includes(allergy)} onCheckedChange={() => handleAllergyToggle(allergy)} />
                  <Label htmlFor={allergy} className="cursor-pointer text-sm font-medium">
                    {allergy}
                  </Label>
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="custom-allergy" className="text-sm font-medium">
                Something else?
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="custom-allergy"
                  type="text"
                  placeholder="e.g. Mustard, Celery"
                  value={customAllergy}
                  onChange={(e) => setCustomAllergy(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCustomAllergyAdd();
                    }
                  }}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleCustomAllergyAdd} disabled={!customAllergy.trim()}>
                  Add
                </Button>
              </div>
              {selectedAllergies.filter((a) => !COMMON_ALLERGIES.includes(a)).length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedAllergies
                    .filter((a) => !COMMON_ALLERGIES.includes(a))
                    .map((allergy) => (
                      <div
                        key={allergy}
                        className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                      >
                        <span>{allergy}</span>
                        <button
                          type="button"
                          onClick={() => handleCustomAllergyRemove(allergy)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                          aria-label={`Remove ${allergy}`}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'recipes':
        return (
          <div className="space-y-5">
            {stepHeading('Which recipes would you actually try?', 'Tap a few favorites—we use this to tune recommendations.')}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {mockRecipes
                .filter((recipe) => !EXCLUDE_ONBOARDING_RECIPE_NAMES.test(recipe.name.trim()))
                .map((recipe) => {
                const selected = selectedRecipes.includes(recipe.id);
                const src = recipeImageSrc(recipe);
                return (
                  <Card
                    key={recipe.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRecipeToggle(recipe.id);
                      }
                    }}
                    className={cn(
                      'cursor-pointer gap-0 overflow-hidden border-2 transition-all hover:shadow-md',
                      selected ? 'border-[#6ec257] ring-2 ring-[#6ec257]/30' : 'border-transparent'
                    )}
                    onClick={() => handleRecipeToggle(recipe.id)}
                  >
                    <div className="relative h-[7rem] min-h-[7rem] max-h-[7rem] w-full shrink-0 overflow-hidden bg-muted sm:h-[8rem] sm:min-h-[8rem] sm:max-h-[8rem]">
                      {src ? (
                        <ImageWithFallback
                          src={src}
                          alt={recipe.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : null}
                      {selected && (
                        <div className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#6ec257] text-xs font-bold text-white shadow-md">
                          ✓
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h4 className="line-clamp-2 text-xs font-medium leading-snug sm:text-sm">{recipe.name}</h4>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'cooking_frequency':
        return (
          <div className="space-y-5">
            {stepHeading('How often do you cook at home?', 'This helps us suggest realistic recipes.')}
            <div className="flex flex-col gap-2.5">
              {COOKING_FREQUENCY_OPTIONS.map(({ id, label, sub }) => {
                const active = cookingFrequency === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCookingFrequency(id)}
                    className={cn(chipClass(active), 'flex w-full flex-col items-start gap-0.5 text-left')}
                  >
                    <span>{label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'goal':
        return (
          <div className="space-y-5">
            {stepHeading('What is your main goal right now?', 'Pick the one that matters most—we will prioritize around it.')}
            <div className="flex flex-col gap-2.5">
              {GOAL_OPTIONS.map(({ id, label, sub }) => {
                const active = primaryGoal === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPrimaryGoal(id)}
                    className={cn(chipClass(active), 'flex w-full flex-col items-start gap-0.5 text-left')}
                  >
                    <span>{label}</span>
                    <span className="text-xs font-normal text-muted-foreground">{sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isLastStep = stepIndex === totalSteps - 1;
  const primaryLabel = isLastStep ? 'Finish' : 'Continue';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="flex h-[100dvh] max-h-[100dvh] flex-col gap-0 overflow-hidden rounded-none border-0 p-0 sm:h-[min(720px,90vh)] sm:max-h-[90vh] sm:rounded-xl sm:border sm:p-6 [&>button]:hidden"
        style={{
          width: modalWidth,
          maxWidth: '560px',
        }}
      >
        <DialogHeader className="relative shrink-0 space-y-3 border-b border-border px-4 pb-3 pt-4 sm:border-0 sm:px-0 sm:pb-0 sm:pt-0">
          <div className="absolute right-2 top-2 sm:right-0 sm:top-0">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9" aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
          </div>
          <DialogTitle className="pr-12 text-left text-lg font-semibold sm:pr-10 sm:text-xl">Personalize NutriChoice</DialogTitle>
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= stepIndex ? 'bg-[#6ec257]' : 'bg-muted')}
                aria-hidden
              />
            ))}
          </div>
          <p className="text-left text-xs text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-0 sm:py-2">{renderStepBody()}</div>

        {submitError && (
          <div className="shrink-0 px-4 sm:px-0">
            <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}

        <div className="flex shrink-0 items-stretch justify-between gap-2 border-t border-border bg-background px-4 py-3 sm:rounded-b-xl sm:border-0 sm:px-0 sm:py-0 sm:pt-3">
          <Button type="button" variant="outline" onClick={handlePrevious} disabled={stepIndex === 0 || isSubmitting} className="min-w-[88px]">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          {isLastStep ? (
            <Button type="button" onClick={handleComplete} disabled={isSubmitting} className="min-w-[120px] flex-1 sm:flex-none">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                primaryLabel
              )}
            </Button>
          ) : (
            <Button type="button" onClick={handleNext} className="min-w-[120px] flex-1 sm:flex-none">
              {primaryLabel}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
