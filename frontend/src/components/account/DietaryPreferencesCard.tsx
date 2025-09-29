import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Settings } from 'lucide-react';
import type { DietaryFilter } from '../../types/recipe';

interface DietaryPreferencesCardProps {
  preferences: DietaryFilter;
  onPreferencesChange: (preferences: DietaryFilter) => void;
  isLoading?: boolean;
}

export const DietaryPreferencesCard = memo(function DietaryPreferencesCard({ 
  preferences, 
  onPreferencesChange, 
  isLoading = false 
}: DietaryPreferencesCardProps) {
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handlePreferenceChange = (key: keyof DietaryFilter, checked: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleSavePreferences = () => {
    onPreferencesChange(localPreferences);
  };

  const dietaryOptions = [
    { key: 'vegetarian' as keyof DietaryFilter, label: 'Vegetarian' },
    { key: 'vegan' as keyof DietaryFilter, label: 'Vegan' },
    { key: 'glutenFree' as keyof DietaryFilter, label: 'Gluten-Free' },
    { key: 'dairyFree' as keyof DietaryFilter, label: 'Dairy-Free' },
    { key: 'eggFree' as keyof DietaryFilter, label: 'Egg-Free' },
    { key: 'pescatarian' as keyof DietaryFilter, label: 'Pescatarian' },
    { key: 'lowCarb' as keyof DietaryFilter, label: 'Low Carb' },
    { key: 'keto' as keyof DietaryFilter, label: 'Keto' },
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
          <div className="grid grid-cols-2 gap-2">
            {dietaryOptions.map(({ key, label }) => (
              <label key={key} className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  className="rounded" 
                  checked={localPreferences[key]}
                  onChange={(e) => handlePreferenceChange(key, e.target.checked)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
        <Button onClick={handleSavePreferences} disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
});