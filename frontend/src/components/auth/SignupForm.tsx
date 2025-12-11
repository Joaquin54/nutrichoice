import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

interface SignupFormProps {
  onSubmit: (username: string, firstName: string, lastName: string, email: string, password: string, confirmPassword: string) => void;
  isLoading?: boolean;
}

export function SignupForm({ onSubmit, isLoading = false }: SignupFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    onSubmit(username, firstName, lastName, email, password, confirmPassword);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold">Create Account</CardTitle>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Join NutriChoice to discover amazing recipes</p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Choose a username"
                className="pl-10 py-2.5 sm:py-3 text-base focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
                minLength={4}
                maxLength={24}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">4-24 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="Enter your first name"
                className="pl-10 py-2.5 sm:py-3 text-base focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
                maxLength={35}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Enter your last name"
                className="pl-10 py-2.5 sm:py-3 text-base focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
                maxLength={35}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                className="pl-10 py-2.5 sm:py-3 text-base focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                className="pl-10 py-2.5 sm:py-3 text-base focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                className="pl-10 py-2.5 sm:py-3 text-base focus-visible:border-[#6ec257] focus-visible:ring-[#6ec257]/50"
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#6ec257] hover:bg-[#6ec257]/90 text-white py-2.5 sm:py-3 text-base" disabled={isLoading}>
            <UserPlus className="mr-2 h-4 w-4" />
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
