import { useState, useCallback, useEffect } from 'react';
import { 
  ProfileForm, 
  DietaryPreferencesCard
} from '../components/account';
import { useUserPreferences } from '../hooks/useUserPreferences';
import { Button } from '../components/ui/button';
import { Edit2, Save, X } from 'lucide-react';
import type { DietaryFilter } from '../types/recipe';
import { getCurrentUser, updateUser, updateUserProfile, type User } from '../api';

export function AccountPage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [dietaryLoading, setDietaryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get dietary preferences from shared context
  const { dietaryPreferences, updateDietaryPreferences } = useUserPreferences();
  
  // User data from API
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    bio: '',
    profile_picture: ''
  });

  // Store temporary values while editing
  const [tempProfileData, setTempProfileData] = useState(profileData);
  const [tempDietaryPreferences, setTempDietaryPreferences] = useState(dietaryPreferences);

  // Update tempDietaryPreferences when dietaryPreferences change
  useEffect(() => {
    setTempDietaryPreferences(dietaryPreferences);
  }, [dietaryPreferences]);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const userData = await getCurrentUser();
        setUser(userData);
        
        // Update profile data from user
        setProfileData({
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          username: userData.username || '',
          bio: userData.profile?.bio || '',
          profile_picture: userData.profile?.profile_picture || ''
        });

        // Update dietary preferences from profile diet_type if available
        if (userData.profile?.diet_type && typeof userData.profile.diet_type === 'object') {
          const profileDietType = userData.profile.diet_type as Record<string, boolean>;
          // Convert backend diet_type to DietaryFilter format
          const dietaryPrefs: DietaryFilter = {
            vegetarian: profileDietType.vegetarian || false,
            vegan: profileDietType.vegan || false,
            glutenFree: profileDietType.glutenFree || false,
            dairyFree: profileDietType.dairyFree || false,
            eggFree: profileDietType.eggFree || false,
            pescatarian: profileDietType.pescatarian || false,
            lowCarb: profileDietType.lowCarb || false,
            keto: profileDietType.keto || false,
          };
          updateDietaryPreferences(dietaryPrefs);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
        setError(errorMessage);
        console.error('Error fetching user data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [updateDietaryPreferences]);

  const handleEditClick = () => {
    // Store current values as temporary values
    setTempProfileData(profileData);
    setTempDietaryPreferences(dietaryPreferences);
    setIsEditMode(true);
  };

  const handleCancelClick = () => {
    // Revert to original values
    setTempProfileData(profileData);
    setTempDietaryPreferences(dietaryPreferences);
    setIsEditMode(false);
  };

  const handleSaveAll = useCallback(async () => {
    if (!user) return;
    
    setProfileLoading(true);
    setDietaryLoading(true);
    setError(null);
    
    // Save all changes
    try {
      // Save user data (first_name, last_name, username)
      await handleProfileSubmit(tempProfileData);
      
      // Save dietary preferences to profile
      await handleDietaryPreferencesChange(tempDietaryPreferences);
      
      // Refresh user data to get updated values
      const updatedUser = await getCurrentUser();
      setUser(updatedUser);
      setProfileData({
        first_name: updatedUser.first_name || '',
        last_name: updatedUser.last_name || '',
        username: updatedUser.username || '',
        bio: updatedUser.profile?.bio || '',
        profile_picture: updatedUser.profile?.profile_picture || ''
      });
      
      setIsEditMode(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save changes';
      setError(errorMessage);
      console.error('Error saving changes:', err);
    } finally {
      setProfileLoading(false);
      setDietaryLoading(false);
    }
  }, [tempProfileData, tempDietaryPreferences, user]);

  const handleProfileSubmit = useCallback(async (data: { first_name: string; last_name: string; username: string; bio: string; profile_picture?: string }) => {
    if (!user) throw new Error('User not loaded');
    
    // Update user fields (first_name, last_name, username)
    await updateUser(user.public_id, {
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
    });
    
    // Update profile fields (bio, profile_picture)
    await updateUserProfile({
      bio: data.bio,
      profile_picture: data.profile_picture || '',
    });
  }, [user]);

  const handleDietaryPreferencesChange = useCallback(async (preferences: DietaryFilter) => {
    // Update dietary preferences in context
    updateDietaryPreferences(preferences);
    
    // Update diet_type in profile
    await updateUserProfile({
      diet_type: preferences,
    });
  }, [updateDietaryPreferences]);

  const isSaving = profileLoading || dietaryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6ec257] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading account information...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Account Settings</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your profile and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            <Button 
              onClick={handleEditClick}
              className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
            >
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <>
              <Button 
                onClick={handleCancelClick}
                variant="outline"
                disabled={isSaving}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                onClick={handleSaveAll}
                className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white"
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save All'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        <div className="w-full md:w-1/2">
          <ProfileForm 
            onSubmit={handleProfileSubmit} 
            isLoading={profileLoading}
            initialData={isEditMode ? tempProfileData : profileData}
            isReadOnly={!isEditMode}
            onDataChange={setTempProfileData}
          />
        </div>
        
        <div className="w-full md:w-1/2">
          <DietaryPreferencesCard 
            preferences={isEditMode ? tempDietaryPreferences : dietaryPreferences}
            onPreferencesChange={(prefs) => setTempDietaryPreferences(prefs)}
            isLoading={dietaryLoading}
            isReadOnly={!isEditMode}
          />
        </div>
      </div>
    </div>
  );
}
