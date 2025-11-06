import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';

interface NotificationSettingsData {
  emailNotifications: boolean;
  recipeRecommendations: boolean;
  weeklyMealPlans: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationSettingsData;
  onSettingsChange: (settings: NotificationSettingsData) => void;
  isLoading?: boolean;
}

export const NotificationSettings = memo(function NotificationSettings({ 
  settings, 
  onSettingsChange, 
  isLoading = false 
}: NotificationSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = () => {
    onSettingsChange(localSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={localSettings.emailNotifications}
              onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
            />
            <span className="text-sm">Email notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={localSettings.recipeRecommendations}
              onChange={(e) => handleSettingChange('recipeRecommendations', e.target.checked)}
            />
            <span className="text-sm">Recipe recommendations</span>
          </label>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              className="rounded" 
              checked={localSettings.weeklyMealPlans}
              onChange={(e) => handleSettingChange('weeklyMealPlans', e.target.checked)}
            />
            <span className="text-sm">Weekly meal plans</span>
          </label>
        </div>
        <Button onClick={handleSaveSettings} className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
});
