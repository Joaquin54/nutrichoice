import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { ChevronLeft, ChevronRight, ChefHat, Moon, Sun, Loader2 } from 'lucide-react';
import { mockRecipes } from '../../data/mockRecipes';
import { useTheme } from '../../contexts/ThemeContext';
import { completeOnboarding } from '../../api';
import type { User } from '../../api';
import type { DietaryFilter } from '../../types/recipe';

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

export function RegistrationModal({ isOpen, onComplete }: RegistrationModalProps) {
  const { theme, toggleTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [modalWidth, setModalWidth] = useState('90vw');

  useEffect(() => {
    const updateModalSize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop
        setModalWidth('70vw');
      } else if (window.innerWidth >= 768) {
        // Tablet/Medium
        setModalWidth('85vw');
      } else {
        // Mobile
        setModalWidth('95vw');
      }
    };

    updateModalSize();
    window.addEventListener('resize', updateModalSize);
    return () => window.removeEventListener('resize', updateModalSize);
  }, []);
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
  const [dietarySkipped, setDietarySkipped] = useState<boolean>(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    // Toggling any checkbox cancels a prior "skip" action
    setDietarySkipped(false);
    setDietaryRestrictions({
      ...dietaryRestrictions,
      [key]: checked,
    });
  };

  const handleAllergyToggle = (allergy: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(allergy)
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleCustomAllergyAdd = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      setSelectedAllergies([...selectedAllergies, customAllergy.trim()]);
      setCustomAllergy('');
    }
  };

  const handleCustomAllergyRemove = (allergy: string) => {
    setSelectedAllergies((prev) => prev.filter((a) => a !== allergy));
  };

  const handleRecipeToggle = (recipeId: string) => {
    setSelectedRecipes((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipDietary = () => {
    // Reset all checkboxes and mark as skipped — persists as NULL on the backend
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
    handleNext();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const updatedUser = await completeOnboarding({
        // null signals "no preference provided" (skipped); otherwise send the selections
        diet_type: dietarySkipped ? null : dietaryRestrictions,
        allergies: selectedAllergies,
      });
      onComplete(updatedUser);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save preferences. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">What are your dietary restrictions?</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Select all that apply to help us personalize your recipe recommendations.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {dietaryOptions.map(({ key, label }) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={dietaryRestrictions[key]}
                    onCheckedChange={(checked) =>
                      handleDietaryChange(key, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={key}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col items-start gap-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipDietary}
                className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-0 hover:bg-transparent hover:underline"
              >
                Skip / No Preference
              </Button>
              {dietarySkipped && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Skipped — you can set this later in Account.
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Any Allergies?</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Select common allergies or add your own.
              </p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {COMMON_ALLERGIES.map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <Checkbox
                      id={allergy}
                      checked={selectedAllergies.includes(allergy)}
                      onCheckedChange={() => handleAllergyToggle(allergy)}
                    />
                    <Label
                      htmlFor={allergy}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {allergy}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <Label htmlFor="custom-allergy" className="text-xs sm:text-sm font-medium mb-2 block">
                  Add Custom Allergy
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="custom-allergy"
                    type="text"
                    placeholder="e.g., Cinnamon, Mustard"
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
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCustomAllergyAdd}
                    disabled={!customAllergy.trim()}
                  >
                    Add
                  </Button>
                </div>
                {selectedAllergies.filter((a) => !COMMON_ALLERGIES.includes(a)).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedAllergies
                      .filter((a) => !COMMON_ALLERGIES.includes(a))
                      .map((allergy) => (
                        <div
                          key={allergy}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-sm"
                        >
                          <span>{allergy}</span>
                          <button
                            type="button"
                            onClick={() => handleCustomAllergyRemove(allergy)}
                            className="hover:text-red-500 transition-colors"
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Select the recipes you are most likely to cook:
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
                Choose your favorite recipes to help us personalize your experience.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 pr-2">
              {mockRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedRecipes.includes(recipe.id)
                      ? 'ring-2 ring-[#6ec257] border-[#6ec257]'
                      : ''
                  }`}
                  onClick={() => handleRecipeToggle(recipe.id)}
                >
                  <div className="relative">
                    <ImageWithFallback
                      src={recipe.image_1}
                      alt={recipe.name}
                      className="w-full h-24 sm:h-28 md:h-32 object-cover rounded-t-lg"
                    />
                    {selectedRecipes.includes(recipe.id) && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#6ec257] flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                  <div className="p-2 sm:p-3">
                    <h4 className="text-xs sm:text-sm font-medium line-clamp-2">{recipe.name}</h4>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center py-8">
            <ChefHat className="h-16 w-16 mx-auto text-[#6ec257] mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold mb-2">You're all set!</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Click finish to complete your registration and start exploring recipes.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="h-[90vh] sm:h-[85vh] md:h-[90vh] max-h-[90vh] sm:max-h-[85vh] md:max-h-[80vh] flex flex-col [&>button]:hidden"
        style={{ 
          width: modalWidth,
          maxWidth: '1600px'
        }}
      >
        <DialogHeader className="relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-9 w-9"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
          </div>
          <DialogTitle className="text-base sm:text-lg">Complete Your Profile</DialogTitle>
          <div className="flex items-center gap-1 sm:gap-2 pt-3 sm:pt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex-1 h-1.5 sm:h-2 rounded-full transition-colors ${
                    step <= currentStep
                      ? 'bg-[#6ec257]'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
                {step < 4 && (
                  <div
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mx-0.5 sm:mx-1 transition-colors ${
                      step < currentStep
                        ? 'bg-[#6ec257]'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-1 sm:pt-2">
            <span>{currentStep}/4</span>
            <span className="hidden sm:inline">Step {currentStep} of 4</span>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 sm:py-6 min-h-0">{renderStep()}</div>

        {submitError && (
          <div className="px-1 pb-2">
            <p className="text-xs text-red-600 dark:text-red-400">{submitError}</p>
          </div>
        )}
        <div className="flex justify-between gap-2 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || isSubmitting}
            className="text-xs sm:text-sm"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
          </Button>
          {currentStep < 4 ? (
            <Button type="button" onClick={handleNext} className="text-xs sm:text-sm">
              Next
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleComplete}
              disabled={isSubmitting}
              className="text-xs sm:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                  Saving…
                </>
              ) : (
                'Finish'
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
