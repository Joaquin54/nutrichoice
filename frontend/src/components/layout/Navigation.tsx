import { memo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Heart, User, BarChart3, LogOut, Calendar, Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { logout } from '../../api';

const navigationItems = [
  { path: '/home', label: 'Home', icon: Home },
  { path: '/favorites', label: 'Favorites', icon: Heart },
  { path: '/meal-planning', label: 'Meal Planning', icon: Calendar },
  { path: '/nutrition', label: 'Nutrition', icon: BarChart3 },
];

export const Navigation = memo(function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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
    <nav className="bg-white/60 dark:bg-gray-900 backdrop-blur-sm border-b border-[#6ec257]/20 dark:border-gray-800 shadow-sm">
      <div className="container mx-auto px-4 md:py-1">
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
                    `flex items-center gap-2 px-4 py-2 md:py-2.5 text-sm font-medium rounded-lg transition-colors ${
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
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 md:py-2.5 text-sm font-medium rounded-lg transition-colors ${
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
              className="flex items-center gap-2 px-4 py-2 md:py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </NavLink>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-between py-1.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-8 w-8"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
          
          <div className="flex items-center gap-2">
            <NavLink
              to="/account"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#6ec257]/20 dark:bg-[#6ec257]/30 text-[#3b752b] dark:text-gray-200'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              <User className="h-4 w-4" />
            </NavLink>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
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
              className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors mt-2"
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
