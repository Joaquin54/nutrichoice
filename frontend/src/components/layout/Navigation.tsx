import { memo } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Heart, User, BarChart3, LogIn, Calendar } from 'lucide-react';

const navigationItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/favorites', label: 'Favorites', icon: Heart },
  { path: '/meal-planning', label: 'Meal Planning', icon: Calendar },
  { path: '/nutrition', label: 'Nutrition', icon: BarChart3 },
];

export const Navigation = memo(function Navigation() {
  return (
    <nav className="bg-white/60 backdrop-blur-sm border-b border-green-100 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              <User className="h-4 w-4" />
              Account
            </NavLink>
            
            <NavLink
              to="/auth"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
});
