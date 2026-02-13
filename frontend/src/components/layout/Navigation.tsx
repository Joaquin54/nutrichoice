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
  { path: '/favorites', label: 'Favorites', icon: Heart },
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
    <nav className="sticky top-[32px] sm:top-[38px] z-30 bg-white/60 dark:bg-gray-900 backdrop-blur-sm border-b border-[#6ec257]/20 dark:border-gray-800 shadow-sm -mt-[1px]">
      <div className="container mx-auto px-4 py-0.5">
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
                    `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-7 w-7"
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
                `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`
              }
            >
              <User className="h-3.5 w-3.5" />
              Account
            </NavLink>
            
            <NavLink
              to="/"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </NavLink>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between py-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-7 w-7"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-3.5 w-3.5" />
            ) : (
              <Menu className="h-3.5 w-3.5" />
            )}
          </Button>
          
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-7 w-7"
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
                `flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
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
          <div className="md:hidden pb-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
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
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors mt-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
});
