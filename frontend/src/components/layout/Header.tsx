import { Link } from 'react-router-dom';
import { Leaf } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-green-100 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#9dc257]/70 to-green-200 p-3 rounded-xl shadow-sm">
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                NutriChoice
              </h1>
              <p className="text-gray-600 text-sm">
                Discover recipes that nourish
              </p>
            </div>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* User menu will go here later */}
            <div className="text-sm text-gray-600">
              Welcome back!
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
