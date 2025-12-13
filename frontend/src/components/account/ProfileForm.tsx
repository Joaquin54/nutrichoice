import { memo } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { User } from 'lucide-react';

interface ProfileFormProps {
  onSubmit: (data: { first_name: string; last_name: string; username: string; bio: string; profile_picture?: string }) => void;
  isLoading?: boolean;
  initialData?: { first_name: string; last_name: string; username: string; bio: string; profile_picture?: string };
  isReadOnly?: boolean;
  onDataChange?: (data: { first_name: string; last_name: string; username: string; bio: string; profile_picture?: string }) => void;
}

export const ProfileForm = memo(function ProfileForm({ 
  onSubmit, 
  isLoading = false, 
  initialData,
  isReadOnly = false,
  onDataChange
}: ProfileFormProps) {
  const handleChange = (field: string, value: string) => {
    if (onDataChange && initialData) {
      onDataChange({
        ...initialData,
        [field]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return;
    const formData = new FormData(e.currentTarget);
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const username = formData.get('username') as string;
    const bio = formData.get('bio') as string;
    onSubmit({ first_name, last_name, username, bio });
  };

  const profilePictureUrl = initialData?.profile_picture || '';
  const displayName = initialData?.first_name && initialData?.last_name 
    ? `${initialData.first_name} ${initialData.last_name}` 
    : initialData?.first_name || initialData?.last_name || '';

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Profile Picture - Circular */}
            <div className="flex-shrink-0">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {profilePictureUrl ? (
                  <ImageWithFallback
                    src={profilePictureUrl}
                    alt={displayName || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                )}
              </div>
            </div>

            {/* Profile Information */}
            <div className="flex-1 space-y-4">
              {/* First Name and Last Name */}
              <div className="space-y-2">
                {isReadOnly ? (
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {displayName || 'Name not set'}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input 
                      name="first_name"
                      placeholder="First name" 
                      value={initialData?.first_name || ''}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      disabled={isReadOnly}
                      className="flex-1"
                    />
                    <Input 
                      name="last_name"
                      placeholder="Last name" 
                      value={initialData?.last_name || ''}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      disabled={isReadOnly}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                {isReadOnly ? (
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    @{initialData?.username || 'username'}
                  </div>
                ) : (
                  <Input 
                    name="username"
                    placeholder="Username" 
                    value={initialData?.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    disabled={isReadOnly}
                    className="w-full sm:w-auto"
                  />
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                {isReadOnly ? (
                  <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 min-h-[60px] py-2">
                    {initialData?.bio || 'No bio set'}
                  </div>
                ) : (
                  <textarea
                    name="bio"
                    placeholder="Tell us about yourself" 
                    value={initialData?.bio || ''}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    disabled={isReadOnly}
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  />
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
