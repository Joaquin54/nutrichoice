import { memo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Heart, User, BarChart3, LogOut, Calendar, Menu, X, Layers, Moon, Sun, BookOpen } from 'lucide-react';
import { Button } from '../ui/button';
import { logout } from '../../api';
import { useTheme } from '../../contexts/ThemeContext';

const navigationItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/recipe-feed', label: 'Recipe Feed', icon: Layers },
  { path: '/cookbooks', label: 'Cookbook', icon: BookOpen },
  { path: '/my-recipes', label: 'My Recipes', icon: Heart },
  { path: '/meal-planning', label: 'Meal Planning', icon: Calendar },
  { path: '/nutrition', label: 'Nutrition', icon: BarChart3 },
];

export const Navigation = memo(function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still navigate to auth page even if logout fails
      navigate('/');
    }
  };

  return (
    <nav className="relative border-b border-[#6ec257]/20 bg-white/60 shadow-sm backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto w-full max-w-full px-3 py-0 sm:max-w-page-sm sm:px-4 sm:py-1 md:max-w-page-md xl:max-w-7xl 2xl:max-w-screen-2xl">
        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              <User className="h-4 w-4" />
              Account
            </NavLink>
            
            <NavLink
              to="/"
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </NavLink>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex items-center justify-between py-1 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-7 w-7 shrink-0"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Menu className="h-3.5 w-3.5" />
            )}
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-7 w-7 shrink-0"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="h-3.5 w-3.5" />
              ) : (
                <Sun className="h-3.5 w-3.5" />
              )}
            </Button>

            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center rounded-md px-2 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#6ec257]/20 text-[#3b752b] dark:bg-[#6ec257]/30 dark:text-gray-200'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              <User className="h-3.5 w-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="space-y-0.5 pb-2 md:hidden">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
            <NavLink
              to="/"
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                handleSignOut(e);
              }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors mt-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
});
