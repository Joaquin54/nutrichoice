import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { User } from 'lucide-react';

interface ProfileFormProps {
  onSubmit: (data: { name: string; email: string; bio: string }) => void;
  isLoading?: boolean;
  initialData?: { name: string; email: string; bio: string };
  isReadOnly?: boolean;
  onDataChange?: (data: { name: string; email: string; bio: string }) => void;
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
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const bio = formData.get('bio') as string;
    onSubmit({ name, email, bio });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Profile Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name"
              placeholder="Enter your full name" 
              value={initialData?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={isReadOnly}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50 dark:bg-gray-800 cursor-default' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="Enter your email" 
              value={initialData?.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={isReadOnly}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50 dark:bg-gray-800 cursor-default' : ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input 
              id="bio" 
              name="bio"
              placeholder="Tell us about yourself" 
              value={initialData?.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              disabled={isReadOnly}
              readOnly={isReadOnly}
              className={isReadOnly ? 'bg-gray-50 dark:bg-gray-800 cursor-default' : ''}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
});
