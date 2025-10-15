'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Building2, BarChart3, DollarSign, Shield, Activity, Settings, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  description?: string;
  badge?: string | number;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Overview',
    href: '/administration',
    icon: BarChart3,
    description: 'Executive dashboard and key metrics',
  },
  {
    name: 'Schools',
    href: '/administration/schools',
    icon: Building2,
    description: 'School management and monitoring',
    badge: '1,247',
  },
  {
    name: 'Operations',
    href: '/administration/operations',
    icon: Activity,
    description: 'Real-time operational monitoring',
    badge: '3',
  },
  {
    name: 'Financials',
    href: '/administration/financials',
    icon: DollarSign,
    description: 'Financial management and analytics',
  },
  {
    name: 'Compliance',
    href: '/administration/compliance',
    icon: Shield,
    description: 'Compliance monitoring and policy management',
    badge: '2',
  },
  {
    name: 'Analytics',
    href: '/administration/analytics',
    icon: TrendingUp,
    description: 'Advanced analytics and insights',
  },
  {
    name: 'Reports',
    href: '/administration/reports',
    icon: FileText,
    description: 'Custom reports and data exports',
  },
  {
    name: 'Settings',
    href: '/administration/settings',
    icon: Settings,
    description: 'System configuration and preferences',
  },
];

const quickActions = [
  {
    name: 'Add School',
    href: '/administration/schools/new',
    icon: Building2,
    description: 'Onboard a new school',
  },
  {
    name: 'Generate Report',
    href: '/administration/reports/new',
    icon: FileText,
    description: 'Create custom report',
  },
  {
    name: 'Send Notification',
    href: '/administration/notifications/new',
    icon: Bell,
    description: 'Broadcast to schools',
  },
  {
    name: 'Bulk Operations',
    href: '/administration/bulk',
    icon: Target,
    description: 'Multi-school actions',
  },
];

interface AdminNavigationProps {
  className?: string;
}

export function AdminNavigation({ className }: AdminNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/administration') {
      return pathname === '/administration';
    }
    return pathname.startsWith(href);
  };

  const getAdminLevel = () => {
    // Determine admin level based on user role
    if (user?.role === 'super_admin') return 'STATE LEVEL';
    if (user?.role === 'district_admin') return 'DISTRICT LEVEL';
    if (user?.role === 'zone_admin') return 'ZONE LEVEL';
    return 'SCHOOL LEVEL';
  };

  const NavigationContent = () => (
    <div className="space-y-6">
      {/* Admin Level Badge */}
      <div className="px-3">
        <Badge variant="outline" className="w-full justify-center py-2">
          {getAdminLevel()}
        </Badge>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1">
        {navigationItems.map(item => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors',
              isActive(item.href)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            )}
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-center space-x-3">
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  typeof item.badge === 'number' && item.badge > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {item.badge}
              </Badge>
            )}
          </Link>
        ))}
      </nav>

      {/* Quick Actions */}
      <div className="px-3 space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map(action => (
            <Link
              key={action.name}
              href={action.href}
              className="flex flex-col items-center p-3 text-xs text-center bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              <action.icon className="w-5 h-5 mb-1 text-gray-600" />
              <span className="font-medium text-gray-900">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="px-3">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">All Systems Operational</span>
          </div>
          <p className="text-xs text-green-600 mt-1">1,205 schools online • 24.5K orders today</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:border-r lg:bg-white',
          className
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">HASIVU Admin</h1>
                <p className="text-sm text-gray-600">Control Center</p>
              </div>
            </div>
          </div>

          {/* Navigation Content */}
          <div className="flex-1 py-4 overflow-y-auto">
            <NavigationContent />
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="lg:hidden">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="py-4">
                  <NavigationContent />
                </div>
              </SheetContent>
            </Sheet>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">HASIVU Admin</h1>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {getAdminLevel()}
          </Badge>
        </div>
      </div>
    </>
  );
}

export default AdminNavigation;
