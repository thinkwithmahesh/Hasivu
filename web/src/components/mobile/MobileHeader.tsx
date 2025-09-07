/**
 * MobileHeader - Mobile-optimized header component
 * Features: Responsive layout, notification badge, quick actions
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Wallet, 
  Wifi, 
  WifiOff,
  Battery,
  Signal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader,
  SheetTitle 
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatCurrency';

interface StudentInfo {
  id: string;
  name: string;
  grade: string;
  section: string;
  walletBalance: number;
  profileImage?: string;
  school: {
    name: string;
    logo?: string;
  };
}

interface MobileHeaderProps {
  student: StudentInfo;
  title?: string;
  showSearch?: boolean;
  showWallet?: boolean;
  notificationCount?: number;
  isOnline?: boolean;
  onSearchClick?: () => void;
  onNotificationClick?: () => void;
  onMenuClick?: () => void;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  student,
  title = 'HASIVU',
  showSearch = true,
  showWallet = true,
  notificationCount = 0,
  isOnline = true,
  onSearchClick,
  onNotificationClick,
  onMenuClick,
  className
}) => {
  const getStudentInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBatteryLevel = () => {
    // Check if Battery API is available
    if ('getBattery' in navigator) {
      // This would be implemented with proper battery API
      return 85; // Mock battery level
    }
    return null;
  };

  const getSignalStrength = () => {
    // Mock network quality - in real app, this would use Network Information API
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || '4g';
    }
    return '4g';
  };

  return (
    <header className={cn(
      'sticky top-0 z-50',
      'bg-white border-b border-gray-200',
      'safe-area-inset-top',
      className
    )}>
      {/* Status bar info for PWA */}
      <div className="bg-primary/5 px-4 py-1 text-xs text-gray-600 flex justify-between items-center md:hidden">
        <div className="flex items-center space-x-2">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex items-center space-x-1">
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="text-xs">{getSignalStrength()}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-500" />
                <span className="text-red-500">Offline</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {getBatteryLevel() && (
            <div className="flex items-center space-x-1">
              <Battery className="h-3 w-3" />
              <span>{getBatteryLevel()}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Main header */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Menu & Title */}
          <div className="flex items-center space-x-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 md:hidden"
                  onClick={onMenuClick}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="text-left">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={student.profileImage} alt={student.name} />
                        <AvatarFallback className="bg-primary text-white">
                          {getStudentInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">
                          Grade {student.grade}-{student.section}
                        </p>
                      </div>
                    </div>
                  </SheetTitle>
                </SheetHeader>
                
                {/* Menu content */}
                <div className="mt-6 space-y-4">
                  {showWallet && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Wallet className="h-5 w-5 text-green-600" />
                          <span className="font-medium text-gray-700">Wallet Balance</span>
                        </div>
                        <span className="font-bold text-green-600 text-lg">
                          {formatCurrency(student.walletBalance)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="space-y-2">
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Wallet className="h-5 w-5 mr-3" />
                      Top up Wallet
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Bell className="h-5 w-5 mr-3" />
                      Notifications
                      {notificationCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {notificationCount}
                        </Badge>
                      )}
                    </Button>
                    <Button variant="ghost" className="w-full justify-start" size="lg">
                      <Search className="h-5 w-5 mr-3" />
                      Order History
                    </Button>
                  </div>

                  {/* School info */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      {student.school.logo && (
                        <img 
                          src={student.school.logo} 
                          alt={student.school.name}
                          className="h-6 w-6 rounded"
                        />
                      )}
                      <span className="text-sm text-gray-600">{student.school.name}</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                {student.school.name}
              </p>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-2">
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 p-0"
                onClick={onSearchClick}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Search</span>
              </Button>
            )}

            {showWallet && (
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg"
              >
                <Wallet className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {formatCurrency(student.walletBalance)}
                </span>
              </motion.div>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 p-0 relative"
              onClick={onNotificationClick}
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1"
                >
                  <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                </motion.div>
              )}
              <span className="sr-only">Notifications</span>
            </Button>

            <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
              <AvatarImage src={student.profileImage} alt={student.name} />
              <AvatarFallback className="bg-primary text-white text-sm">
                {getStudentInitials(student.name)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>

      {/* Offline indicator */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500 text-white text-center py-2 px-4 text-sm"
        >
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="h-4 w-4" />
            <span>You're offline. Some features may be limited.</span>
          </div>
        </motion.div>
      )}
    </header>
  );
};

export default MobileHeader;