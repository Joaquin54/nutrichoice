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
}

export const ProfileForm = memo(function ProfileForm({ onSubmit, isLoading = false, initialData }: ProfileFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
              defaultValue={initialData?.name || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              name="email"
              type="email" 
              placeholder="Enter your email" 
              defaultValue={initialData?.email || ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Input 
              id="bio" 
              name="bio"
              placeholder="Tell us about yourself" 
              defaultValue={initialData?.bio || ''}
            />
          </div>
          <Button type="submit" className="bg-[#6ec257] hover:bg-[#6ec257]/90 text-white" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});
