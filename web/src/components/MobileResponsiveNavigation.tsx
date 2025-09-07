import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Home, BarChart3, Radio, CreditCard, Users, Settings, 
  Search, LogOut, User, ChevronDown, Shield, Activity,
  Building, FileText, Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import NotificationSystem from './NotificationSystem';
import AuthModal from './AuthModal';
import { toast } from 'react-hot-toast';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  href: string;
  badge?: string | number;
  roles?: string[];
  submenu?: NavigationItem[];
}

interface MobileResponsiveNavigationProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

const MobileResponsiveNavigation: React.FC<MobileResponsiveNavigationProps> = ({
  currentPath = '/',
  onNavigate,
  className = ''
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [, setIsSearchFocused] = useState(false);

  // Navigation items based on user role and authentication status
  const getNavigationItems = (): NavigationItem[] => {
    const publicItems: NavigationItem[] = [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        href: '/'
      },
      {
        id: 'demo',
        label: 'Live Demo',
        icon: Eye,
        href: '/demo'
      }
    ];

    if (!isAuthenticated) {
      return publicItems;
    }

    const authenticatedItems: NavigationItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: BarChart3,
        href: '/dashboard',
        badge: 'New'
      },
      {
        id: 'rfid',
        label: 'RFID Management',
        icon: Radio,
        href: '/rfid',
        submenu: [
          { id: 'rfid-cards', label: 'Card Management', icon: CreditCard, href: '/rfid/cards' },
          { id: 'rfid-readers', label: 'Reader Status', icon: Activity, href: '/rfid/readers' },
          { id: 'rfid-logs', label: 'Verification Logs', icon: FileText, href: '/rfid/logs' }
        ]
      },
      {
        id: 'payments',
        label: 'Payment Intelligence',
        icon: CreditCard,
        href: '/payments',
        submenu: [
          { id: 'payment-analytics', label: 'Analytics', icon: BarChart3, href: '/payments/analytics' },
          { id: 'fraud-detection', label: 'Fraud Detection', icon: Shield, href: '/payments/fraud' },
          { id: 'transaction-logs', label: 'Transactions', icon: FileText, href: '/payments/transactions' }
        ]
      }
    ];

    // Add admin-only items
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      authenticatedItems.push(
        {
          id: 'users',
          label: 'User Management',
          icon: Users,
          href: '/admin/users',
          roles: ['admin', 'super_admin']
        },
        {
          id: 'schools',
          label: 'School Management',
          icon: Building,
          href: '/admin/schools',
          roles: ['admin', 'super_admin']
        }
      );
    }

    authenticatedItems.push({
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/settings'
    });

    return [...publicItems, ...authenticatedItems];
  };

  const navigationItems = getNavigationItems();

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-trigger')) {
        setIsMobileMenuOpen(false);
      }
      if (isUserMenuOpen && !target.closest('.user-menu') && !target.closest('.user-menu-trigger')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen, isUserMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveSubmenu(null);
  }, [currentPath]);

  const handleNavigation = (href: string) => {
    if (onNavigate) {
      onNavigate(href);
    } else {
      window.location.href = href;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      setIsUserMenuOpen(false);
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const toggleSubmenu = (itemId: string) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
  };

  const filteredNavigationItems = navigationItems.filter(item => {
    if (!searchTerm) return true;
    return item.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.submenu?.some(sub => sub.label.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const UserAvatar = () => (
    <div className="flex items-center space-x-3">
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
        <span className="text-white text-sm font-medium">
          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
        </span>
      </div>
      <div className="hidden md:block">
        <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
      </div>
    </div>
  );

  return (
    <>
      <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">HASIVU</span>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-8">
                {navigationItems.slice(0, 4).map((item) => {
                  const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                  return (
                    <div key={item.id} className="relative group">
                      <button
                        onClick={() => item.submenu ? toggleSubmenu(item.id) : handleNavigation(item.href)}
                        className={`flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                          isActive
                            ? 'border-blue-500 text-gray-900'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.label}
                        {item.badge && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                        {item.submenu && <ChevronDown className="w-4 h-4 ml-1" />}
                      </button>

                      {/* Desktop Submenu */}
                      {item.submenu && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                          {item.submenu.map((subItem) => (
                            <button
                              key={subItem.id}
                              onClick={() => handleNavigation(subItem.href)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                            >
                              <subItem.icon className="w-4 h-4 mr-3" />
                              {subItem.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Search Bar - Hidden on Mobile */}
            <div className="hidden md:flex md:items-center md:flex-1 md:max-w-xs md:ml-8">
              <div className="w-full relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search navigation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              {isAuthenticated && (
                <NotificationSystem
                  userId={user?.id}
                  schoolId={user?.schoolId}
                  enableWebSocket={true}
                />
              )}

              {/* User Menu or Auth Button */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="user-menu-trigger flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <UserAvatar />
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* User Dropdown */}
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="user-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                      >
                        <button
                          onClick={() => handleNavigation('/profile')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 mr-3" />
                          Profile
                        </button>
                        <button
                          onClick={() => handleNavigation('/settings')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 mr-3" />
                          Settings
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Sign In
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="mobile-menu-trigger md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mobile-menu md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {/* Mobile Search */}
                <div className="px-3 pb-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Mobile Navigation Items */}
                {filteredNavigationItems.map((item) => {
                  const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
                  return (
                    <div key={item.id}>
                      <button
                        onClick={() => item.submenu ? toggleSubmenu(item.id) : handleNavigation(item.href)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 border-blue-500'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="w-5 h-5 mr-3" />
                          {item.label}
                          {item.badge && (
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.submenu && (
                          <motion.div
                            animate={{ rotate: activeSubmenu === item.id ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </motion.div>
                        )}
                      </button>

                      {/* Mobile Submenu */}
                      <AnimatePresence>
                        {item.submenu && activeSubmenu === item.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-4 mt-1 space-y-1"
                          >
                            {item.submenu.map((subItem) => (
                              <button
                                key={subItem.id}
                                onClick={() => handleNavigation(subItem.href)}
                                className="flex items-center w-full px-3 py-2 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                              >
                                <subItem.icon className="w-4 h-4 mr-3" />
                                {subItem.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* Mobile User Section */}
              {isAuthenticated && (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="px-3 space-y-1">
                    <div className="flex items-center px-3 py-2">
                      <UserAvatar />
                    </div>
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-5 h-5 mr-3" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={() => {
            setShowAuthModal(false);
            toast.success('Welcome to HASIVU!');
          }}
        />
      )}
    </>
  );
};

export default MobileResponsiveNavigation;
