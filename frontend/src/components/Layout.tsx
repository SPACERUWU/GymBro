import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Plus, 
  Dumbbell, 
  BarChart3, 
  Calendar,
  Activity,
  CalendarDays
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Log Workout', href: '/workout', icon: Plus },
    { name: 'Exercises', href: '/exercises', icon: Dumbbell },
    { name: 'Stats', href: '/stats', icon: BarChart3 },
    { name: 'Planning', href: '/planning', icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="glass border-b border-white/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center">
              <div className="relative">
                <Activity className="h-8 w-8 sm:h-10 sm:w-10 text-primary-600 animate-bounce-gentle" />
                <div className="absolute -top-1 -right-1 h-2 w-2 sm:h-3 sm:w-3 bg-success-500 rounded-full animate-pulse"></div>
              </div>
              <div className="ml-2 sm:ml-3">
                <h1 className="text-lg sm:text-2xl font-bold text-gradient">GymBro</h1>
                <p className="text-xs text-gray-500 -mt-1 hidden sm:block">Personal Gym Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-6">
              <div className="hidden sm:flex items-center space-x-2 bg-white/50 rounded-full px-3 sm:px-4 py-1 sm:py-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              <div className="flex items-center space-x-1 sm:space-x-2">
                <div className="h-2 w-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm text-gray-600 font-medium hidden sm:inline">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
          {/* Sidebar */}
          <nav className="lg:w-72 flex-shrink-0 order-2 lg:order-1">
            <div className="card-elevated p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                <div className="h-2 w-2 bg-primary-500 rounded-full mr-2 sm:mr-3"></div>
                Main Menu
              </h2>
              <ul className="space-y-2 sm:space-y-3">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex items-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-105'
                            : 'text-gray-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 hover:text-primary-700 hover:shadow-md hover:transform hover:scale-105'
                        }`}
                      >
                        <Icon className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 transition-transform duration-200 ${
                          isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'
                        }`} />
                        {item.name}
                        {isActive && (
                          <div className="ml-auto h-2 w-2 bg-white rounded-full animate-pulse"></div>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              
              {/* Quick Stats */}
              <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl">
                <h3 className="text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-primary-600">0</div>
                    <div className="text-gray-500">Workouts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm sm:text-lg font-bold text-secondary-600">0</div>
                    <div className="text-gray-500">Exercises</div>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main className="flex-1 order-1 lg:order-2">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
