import { useState } from 'react';
import { LoginForm, SignupForm, AuthToggle } from '../components/auth';

export function AuthPage() {
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

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        {isLogin ? (
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        ) : (
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
        )}
        
        <AuthToggle isLogin={isLogin} onToggle={() => setIsLogin(!isLogin)} />
      </div>
    </div>
  );
}
