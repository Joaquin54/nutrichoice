import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, SignupForm, AuthToggle } from '../components/auth';
import { Button } from '../components/ui/button';
import { SkipForward } from 'lucide-react';
import { login, register } from '../api';

export function AuthPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await login(username, password);
      // Login successful, token is stored automatically
      navigate('/home');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (username: string, firstName: string, lastName: string, email: string, password: string, confirmPassword: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await register({
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        password_confirm: confirmPassword,
      });
      
      // After successful registration, automatically log in
      const response = await login(username, password);
      navigate('/home');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = () => {
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        {isLogin ? (
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        ) : (
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
        )}
        
        <AuthToggle isLogin={isLogin} onToggle={() => {
          setIsLogin(!isLogin);
          setError(null);
        }} />

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
