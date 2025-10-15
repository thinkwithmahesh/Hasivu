'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import BottomNavigation from './BottomNavigation';
import MobileNavSheet from './MobileNavSheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Search, WifiOff, Zap, X } from 'lucide-react';

interface MobileLayoutProps {
  children: React.ReactNode;
  userRole?: 'student' | 'parent' | 'admin';
  user?: {
    name: string;
    email: string;
    avatar?: string;
    id: string;
  };
  showBottomNav?: boolean;
  showHeader?: boolean;
  className?: string;
  onLogout?: () => void;
}

interface OfflineBannerProps {
  isOnline: boolean;
  onRetry: () => void;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, onRetry }) => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setShowBanner(!isOnline);
  }, [isOnline]);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white p-2 safe-area-pt animate-slide-down">
      <div className="flex items-center justify-between container mx-auto">
        <div className="flex items-center space-x-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-medium">You're offline</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="h-6 px-2 text-white hover:bg-white/20"
          >
            Retry
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowBanner(false)}
            className="h-6 w-6 p-0 text-white hover:bg-white/20"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface PWAInstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ onInstall, onDismiss }) => {
  return (
    <Card className="fixed bottom-20 left-4 right-4 z-40 md:hidden border-primary/20 bg-primary/5 animate-slide-in-bottom">
      <div className="p-4">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-gray-900">Install HASIVU App</h4>
            <p className="text-xs text-gray-600 mt-1">
              Get faster access and offline features by installing the app.
            </p>
            <div className="flex space-x-2 mt-3">
              <Button size="sm" onClick={onInstall} className="h-8 px-3 text-xs">
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss} className="h-8 px-3 text-xs">
                Not now
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onDismiss} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  userRole = 'student',
  user,
  showBottomNav = true,
  showHeader = true,
  className,
  onLogout,
}) => {
  const router = useRouter();
  const { isMobile, isTablet, isDesktop, safeArea } = useMobileLayout();
  const [isOnline, setIsOnline] = useState(true);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(3);

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Show install prompt after a delay if on mobile
      if (isMobile) {
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobile]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle PWA installation
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
      }

      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  const handleRetryConnection = () => {
    // Simple connectivity check
    fetch('/api/v1/health', { method: 'HEAD' })
      .then(() => {
        setIsOnline(true);
      })
      .catch(() => {});
  };

  const handleSearch = () => {
    router.push('/search');
  };

  const handleNotifications = () => {
    router.push(`/${userRole}/notifications`);
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-gray-50',
        'safe-area-p', // Use safe area padding
        isMobile && 'pb-16', // Account for bottom navigation
        className
      )}
    >
      {/* Offline Banner */}
      <OfflineBanner isOnline={isOnline} onRetry={handleRetryConnection} />

      {/* Mobile Header */}
      {showHeader && isMobile && (
        <header
          className={cn(
            'sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b',
            !isOnline && 'top-12' // Account for offline banner
          )}
        >
          <div className="flex items-center justify-between px-4 py-3">
            {/* Left side - Menu */}
            <div className="flex items-center space-x-3">
              <MobileNavSheet userRole={userRole} user={user} onLogout={onLogout} />
              <div>
                <h1 className="text-lg font-bold text-gray-900">HASIVU</h1>
                <p className="text-xs text-muted-foreground capitalize">{userRole} Portal</p>
              </div>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSearch}
                className="h-10 w-10 p-0"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNotifications}
                className="h-10 w-10 p-0 relative"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                  >
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Tablet/Desktop Header */}
      {showHeader && !isMobile && (
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">HASIVU</h1>
              <Badge variant="outline" className="capitalize">
                {userRole} Portal
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>

              <Button variant="outline" onClick={handleNotifications}>
                <Bell className="h-4 w-4 mr-2" />
                Notifications
                {notificationCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1',
          isMobile && showHeader && 'pt-0', // Header handles its own spacing
          !isMobile && 'container mx-auto px-6 py-6'
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation - Mobile Only */}
      {showBottomNav && isMobile && <BottomNavigation userRole={userRole} />}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <PWAInstallPrompt
          onInstall={handleInstallApp}
          onDismiss={() => setShowInstallPrompt(false)}
        />
      )}
    </div>
  );
};

// HOC for automatic mobile layout wrapping
export const withMobileLayout = <P extends object>(
  Component: React.ComponentType<P>,
  layoutProps?: Partial<MobileLayoutProps>
) => {
  const WrappedComponent: React.FC<
    P & { mobileLayoutProps?: Partial<MobileLayoutProps> }
  > = props => {
    const { mobileLayoutProps, ...componentProps } = props;

    return (
      <MobileLayout {...layoutProps} {...mobileLayoutProps}>
        <Component {...(componentProps as P)} />
      </MobileLayout>
    );
  };

  WrappedComponent.displayName = `withMobileLayout(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default MobileLayout;
