import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm, SignupForm, AuthToggle, RegistrationModal } from '../components/auth';
import { Button } from '../components/ui/button';
import { SkipForward, UserCircle, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { login, register } from '../api';
import type { User } from '../api';

export function AuthPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await login(username, password);
      // Derive registration status from the backend-authoritative profile flag
      if (response.user.profile?.is_onboarded) {
        navigate('/home');
      } else {
        setShowRegistrationModal(true);
      }
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

      // After successful registration, log in and open the onboarding modal
      const response = await login(username, password);
      if (response.user.profile?.is_onboarded) {
        navigate('/home');
      } else {
        setShowRegistrationModal(true);
      }
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

  const handleSkipToRegistration = () => {
    // Simulate login without backend - set a mock token for local dev only
    localStorage.setItem('auth_token', 'mock_token_for_testing');
    setShowRegistrationModal(true);
  };

  const handleRegistrationComplete = (_user: User) => {
    setShowRegistrationModal(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-[#6ec257]/15 dark:bg-gray-900 flex items-center justify-center px-4 relative">
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Moon className="h-5 w-5" />
          ) : (
            <Sun className="h-5 w-5" />
          )}
        </Button>
      </div>

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

        {/* Development bypass buttons — stripped from production builds */}
        {import.meta.env.DEV && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSkipToRegistration}
              className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Skip to Registration Modal (Test)
            </Button>
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
        )}
      </div>

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={showRegistrationModal}
        onComplete={handleRegistrationComplete}
      />
    </div>
  );
}
