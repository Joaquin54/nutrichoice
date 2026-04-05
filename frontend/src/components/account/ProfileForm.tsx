// components/account/ProfileForm.tsx
// Profile form — display + edit mode. Edit mode enables avatar upload.

import React, { memo, useRef } from 'react';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { User, Camera, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Avatar upload sub-component
// ---------------------------------------------------------------------------

interface AvatarUploadProps {
  profilePictureUrl: string;
  displayName: string;
  isReadOnly: boolean;
  isUploading: boolean;
  onFileSelect: (file: File) => void;
}

function AvatarUpload({ profilePictureUrl, displayName, isReadOnly, isUploading, onFileSelect }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    e.target.value = '';
  };

  return (
    <div className="relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32">
      <div
        className={cn(
          'w-full h-full rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center',
          !isReadOnly && 'cursor-pointer'
        )}
        onClick={() => !isReadOnly && inputRef.current?.click()}
      >
        {profilePictureUrl ? (
          <ImageWithFallback src={profilePictureUrl} alt={displayName || 'Profile'} className="w-full h-full object-cover" />
        ) : (
          <User className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
        )}

        {/* Overlay: spinner while uploading, camera icon in edit mode */}
        {!isReadOnly && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity">
            {isUploading
              ? <Loader2 className="h-7 w-7 text-white animate-spin" />
              : <Camera className="h-7 w-7 text-white" />}
          </div>
        )}

        {/* Persistent spinner overlay while uploading (no hover needed) */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40">
            <Loader2 className="h-7 w-7 text-white animate-spin" />
          </div>
        )}
      </div>

      {!isReadOnly && (
        <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleChange} tabIndex={-1} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProfileForm
// ---------------------------------------------------------------------------

type ProfileFields = {
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  profile_picture?: string;
};

interface ProfileFormProps {
  onSubmit: (data: ProfileFields) => void;
  isLoading?: boolean;
  initialData?: ProfileFields;
  isReadOnly?: boolean;
  onDataChange?: (data: ProfileFields) => void;
  onProfilePictureUpload?: (file: File) => Promise<string | null>;
  isUploadingPicture?: boolean;
}

export const ProfileForm = memo(function ProfileForm({
  onSubmit,
  isLoading = false,
  initialData,
  isReadOnly = false,
  onDataChange,
  onProfilePictureUpload,
  isUploadingPicture = false,
}: ProfileFormProps) {
  const handleChange = (field: keyof ProfileFields, value: string) => {
    if (onDataChange && initialData) {
      onDataChange({ ...initialData, [field]: value });
    }
  };

  const handleAvatarFileSelect = async (file: File) => {
    if (!onProfilePictureUpload) return;
    const url = await onProfilePictureUpload(file);
    if (url && onDataChange && initialData) {
      onDataChange({ ...initialData, profile_picture: url });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isReadOnly) return;
    const formData = new FormData(e.currentTarget);
    onSubmit({
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      username: formData.get('username') as string,
      bio: formData.get('bio') as string,
    });
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
            <AvatarUpload
              profilePictureUrl={profilePictureUrl}
              displayName={displayName}
              isReadOnly={isReadOnly}
              isUploading={isUploadingPicture}
              onFileSelect={handleAvatarFileSelect}
            />

            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                {isReadOnly ? (
                  <div className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                    {displayName || 'Name not set'}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input name="first_name" placeholder="First name" value={initialData?.first_name || ''}
                      onChange={(e) => handleChange('first_name', e.target.value)}
                      disabled={isLoading} className="flex-1" />
                    <Input name="last_name" placeholder="Last name" value={initialData?.last_name || ''}
                      onChange={(e) => handleChange('last_name', e.target.value)}
                      disabled={isLoading} className="flex-1" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {isReadOnly ? (
                  <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    @{initialData?.username || 'username'}
                  </div>
                ) : (
                  <Input name="username" placeholder="Username" value={initialData?.username || ''}
                    onChange={(e) => handleChange('username', e.target.value)}
                    disabled={isLoading} className="w-full sm:w-auto" />
                )}
              </div>

              <div className="space-y-2">
                {isReadOnly ? (
                  <div className="text-sm sm:text-base text-gray-700 dark:text-gray-300 min-h-[60px] py-2">
                    {initialData?.bio || 'No bio set'}
                  </div>
                ) : (
                  <textarea name="bio" placeholder="Tell us about yourself" value={initialData?.bio || ''}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    disabled={isLoading} rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" />
                )}
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
