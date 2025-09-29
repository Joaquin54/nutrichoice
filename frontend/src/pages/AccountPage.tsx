import { useState, useCallback } from 'react';
import { 
  ProfileForm, 
  DietaryPreferencesCard, 
  NotificationSettings, 
  SecuritySettings 
} from '../components/account';
import type { DietaryFilter } from '../types/recipe';

export function AccountPage() {
  // Separate loading states for each component
  const [profileLoading, setProfileLoading] = useState(false);
  const [dietaryLoading, setDietaryLoading] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  
  // Mock data - in real app, this would come from API/context
  const [profileData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    bio: 'Food enthusiast and home cook'
  });

  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryFilter>({
    vegetarian: false,
    vegan: false,
    glutenFree: true,
    dairyFree: false,
    eggFree: false,
    pescatarian: false,
    lowCarb: false,
    keto: false,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    recipeRecommendations: true,
    weeklyMealPlans: false,
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleProfileSubmit = useCallback(async (data: { name: string; email: string; bio: string }) => {
    setProfileLoading(true);
    // TODO: Implement profile update logic
    console.log('Profile update:', data);
    setTimeout(() => setProfileLoading(false), 1000);
  }, []);

  const handleDietaryPreferencesChange = useCallback(async (preferences: DietaryFilter) => {
    setDietaryLoading(true);
    // TODO: Implement dietary preferences update logic
    console.log('Dietary preferences update:', preferences);
    setDietaryPreferences(preferences);
    setTimeout(() => setDietaryLoading(false), 1000);
  }, []);

  const handleNotificationSettingsChange = useCallback(async (settings: typeof notificationSettings) => {
    setNotificationLoading(true);
    // TODO: Implement notification settings update logic
    console.log('Notification settings update:', settings);
    setNotificationSettings(settings);
    setTimeout(() => setNotificationLoading(false), 1000);
  }, []);

  const handleSecuritySubmit = useCallback(async (data: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
  }) => {
    setSecurityLoading(true);
    // TODO: Implement password change logic
    console.log('Password change:', data);
    setTimeout(() => setSecurityLoading(false), 1000);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
        <p className="text-gray-600">
          Manage your profile and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileForm 
          onSubmit={handleProfileSubmit} 
          isLoading={profileLoading}
          initialData={profileData}
        />
        
        <DietaryPreferencesCard 
          preferences={dietaryPreferences}
          onPreferencesChange={handleDietaryPreferencesChange}
          isLoading={dietaryLoading}
        />
        
        <NotificationSettings 
          settings={notificationSettings}
          onSettingsChange={handleNotificationSettingsChange}
          isLoading={notificationLoading}
        />
        
        <SecuritySettings 
          onSubmit={handleSecuritySubmit}
          isLoading={securityLoading}
        />
      </div>
    </div>
  );
}
