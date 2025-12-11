import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { Button } from '../ui/button';

export const Header = memo(function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-green-100 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-3 sm:py-4 md:py-3">
        <div className="flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-[#6ec257]/70 to-[#6ec257]/40 dark:from-[#6ec257]/50 dark:to-[#6ec257]/30 p-2 sm:p-3 rounded-xl shadow-sm">
              <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 dark:text-green-400 transition-colors" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                NutriChoice
              </h1>
              <p className="hidden sm:block text-gray-600 dark:text-gray-400 text-sm">
                Discover recipes that nourish
              </p>
            </div>
          </Link>
          
          <div className="flex items-center gap-2 sm:gap-4">
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
            {/* User menu will go here later */}
            <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
              Welcome back!
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});
