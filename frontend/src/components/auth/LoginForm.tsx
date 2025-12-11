import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { LogIn, Mail, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading = false }: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    onSubmit(email, password);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center px-4 sm:px-6 pt-6 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-bold">Welcome Back</CardTitle>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Sign in to your NutriChoice account</p>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Button type="submit" className="w-full bg-[#6ec257] hover:bg-[#6ec257]/90 text-white py-2.5 sm:py-3 text-base" disabled={isLoading}>
            <LogIn className="mr-2 h-4 w-4" />
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/reset-password"
              className="text-sm text-[#6ec257] hover:text-[#6ec257]/80 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
