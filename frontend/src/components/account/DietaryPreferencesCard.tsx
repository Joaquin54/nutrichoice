import { memo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Settings } from 'lucide-react';
import type { DietaryFilter } from '../../types/recipe';

interface DietaryPreferencesCardProps {
  preferences: DietaryFilter;
  onPreferencesChange: (preferences: DietaryFilter) => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export const DietaryPreferencesCard = memo(function DietaryPreferencesCard({
  preferences,
  onPreferencesChange,
  isReadOnly = false
}: DietaryPreferencesCardProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Update local preferences when props change
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handlePreferenceChange = (key: keyof DietaryFilter, checked: boolean) => {
    if (isReadOnly) return;
    const updated = {
      ...localPreferences,
      [key]: checked,
    };
    setLocalPreferences(updated);
    onPreferencesChange(updated);
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Dietary Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Customize your dietary preferences to get better recipe recommendations.
        </p>
        <div className="space-y-2">
          <label className="text-sm font-medium">Dietary Restrictions</label>
          <div className="grid grid-cols-4 grid-rows-2 gap-x-2 gap-y-2 sm:gap-x-3">
            {dietaryOptions.map(({ key, label }) => (
              <label key={key} className={`flex min-w-0 items-center gap-1.5 sm:gap-2 ${isReadOnly ? 'cursor-default opacity-75' : 'cursor-pointer'}`}>
                <input 
                  type="checkbox" 
                  className="shrink-0 rounded" 
                  checked={localPreferences[key]}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                  disabled={isReadOnly}
                />
                <span className="text-xs leading-tight sm:text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});