import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, SignupForm, AuthToggle } from '../components/auth';
import { Button } from '../components/ui/button';
import { SkipForward } from 'lucide-react';

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    // TODO: Implement login logic
    console.log('Login:', { email, password });
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleSignup = async (email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    // TODO: Implement signup logic
    console.log('Signup:', { email, password, confirmPassword });
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleBypass = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        {isLogin ? (
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        ) : (
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
        )}
        
        <AuthToggle isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />

        {/* Development bypass button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={handleBypass}
            className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Skip Authentication (Dev)
          </Button>
        </div>
      </div>
    </div>
  );
}
