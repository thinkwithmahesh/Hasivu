import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import MobileLayout from '@/components/mobile/MobileLayout';
import { MealCardSkeleton, ProgressiveLoadingSkeleton } from '@/components/mobile/LoadingSkeleton';
import VirtualScrollList, { VirtualListItem } from '@/components/mobile/VirtualScrollList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMobileLayout } from '@/hooks/useMobileLayout';
import { _cn } from '@/lib/utils';
import {
  Smartphone,
  Tablet,
  Monitor,
  Vibrate,
  Share2,
  Download,
  Zap,
  Wifi,
  Battery,
  Eye,
  TouchpadIcon as Touch,
  Layers,
  Palette,
  Box,
  List,
  Grid3x3,
  Navigation,
} from 'lucide-react';

// Mock data for demonstrations
const mockMeals = Array.from({ length: 100 }, (_, i) => ({
  id: `meal-${i}`,
  name: `Delicious Meal ${i + 1}`,
  description: `A tasty meal with fresh ingredients. Item ${i + 1} in our extensive menu.`,
  price: Math.floor(Math.random() * 50) + 20,
  category: ['Main Course', 'Snacks', 'Beverages', 'Desserts'][i % 4],
  rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
  isVeg: Math.random() > 0.3,
  preparationTime: Math.floor(Math.random() * 30) + 5,
  imageUrl: `/api/placeholder/300/200?meal=${i}`,
}));

const mockUser = {
  name: 'Alex Student',
  email: 'alex@school.edu',
  avatar: '/api/placeholder/40/40?user=1',
  id: 'student-123',
};

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  status: 'implemented' | 'demo' | 'planned';
  onDemo?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  status,
  onDemo,
}) => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              <Badge
                variant={
                  status === 'implemented' ? 'default' : status === 'demo' ? 'secondary' : 'outline'
                }
                className="text-xs mt-1"
              >
                {status}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        {onDemo && (
          <Button size="sm" variant="outline" onClick={onDemo} className="w-full">
            Try Demo
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

const MobileDemoPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [demoResults, setDemoResults] = useState<string[]>([]);
  const {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    orientation,
    screenSize,
    vibrate,
    shareContent,
    enableFullscreen,
    requestWakeLock,
  } = useMobileLayout();

  const addDemoResult = useCallback((result: string) => {
    setDemoResults(prev => [result, ...prev.slice(0, 4)]);
  }, []);

  const handleVibrationDemo = useCallback(() => {
    const success = vibrate([200, 100, 200, 100, 200]);
    addDemoResult(success ? 'Vibration pattern executed' : 'Vibration not supported');
  }, [vibrate, addDemoResult]);

  const handleShareDemo = useCallback(async () => {
    try {
      await shareContent({
        title: 'HASIVU Mobile Demo',
        text: 'Check out this awesome mobile food ordering platform!',
        url: window.location.href,
      });
      addDemoResult('Content shared successfully');
    } catch (error) {
      addDemoResult('Share failed or cancelled');
    }
  }, [shareContent, addDemoResult]);

  const handleFullscreenDemo = useCallback(async () => {
    try {
      await enableFullscreen();
      addDemoResult('Fullscreen mode enabled');
    } catch (error) {
      addDemoResult('Fullscreen not supported');
    }
  }, [enableFullscreen, addDemoResult]);

  const handleWakeLockDemo = useCallback(async () => {
    try {
      const wakeLock = await requestWakeLock();
      addDemoResult(wakeLock ? 'Wake lock acquired' : 'Wake lock not supported');
    } catch (error) {
      addDemoResult('Wake lock failed');
    }
  }, [requestWakeLock, addDemoResult]);

  const features = [
    {
      icon: Smartphone,
      title: 'Bottom Navigation',
      description:
        'Touch-friendly bottom navigation with haptic feedback and role-based menu items.',
      status: 'implemented' as const,
    },
    {
      icon: Navigation,
      title: 'Hamburger Menu',
      description:
        'Slide-out navigation with user profile, quick actions, and contextual menu items.',
      status: 'implemented' as const,
    },
    {
      icon: Touch,
      title: 'Touch Gestures',
      description: 'Swipe gestures on meal cards - swipe right to add to cart, left for details.',
      status: 'implemented' as const,
    },
    {
      icon: Vibrate,
      title: 'Haptic Feedback',
      description: 'Native vibration API integration for tactile feedback on interactions.',
      status: 'implemented' as const,
      onDemo: handleVibrationDemo,
    },
    {
      icon: Share2,
      title: 'Web Share API',
      description: 'Native sharing using device share sheet for meals and app content.',
      status: 'implemented' as const,
      onDemo: handleShareDemo,
    },
    {
      icon: Wifi,
      title: 'Offline Support',
      description: 'Service worker with cache strategies and offline page for poor connectivity.',
      status: 'implemented' as const,
    },
    {
      icon: Download,
      title: 'PWA Installation',
      description: 'Progressive Web App with install prompts and native app-like experience.',
      status: 'implemented' as const,
    },
    {
      icon: Zap,
      title: 'Push Notifications',
      description:
        'Real-time notifications for order updates, payment reminders, and menu changes.',
      status: 'implemented' as const,
    },
    {
      icon: List,
      title: 'Virtual Scrolling',
      description: 'Performance-optimized lists for large meal catalogs with infinite scroll.',
      status: 'implemented' as const,
    },
    {
      icon: Eye,
      title: 'Loading Skeletons',
      description:
        'Progressive loading states and skeleton screens for better perceived performance.',
      status: 'implemented' as const,
    },
    {
      icon: Layers,
      title: 'Background Sync',
      description: 'Queue orders and payments when offline, sync when connection is restored.',
      status: 'demo' as const,
    },
    {
      icon: Monitor,
      title: 'Fullscreen API',
      description: 'Immersive fullscreen mode for focused meal browsing experience.',
      status: 'demo' as const,
      onDemo: handleFullscreenDemo,
    },
    {
      icon: Battery,
      title: 'Wake Lock API',
      description: 'Keep screen awake during meal ordering and RFID scanning.',
      status: 'demo' as const,
      onDemo: handleWakeLockDemo,
    },
  ];

  return (
    <>
      <Head>
        <title>Mobile Demo - HASIVU Platform</title>
        <meta
          name="description"
          content="Interactive demo of HASIVU mobile features and PWA capabilities"
        />
      </Head>

      <MobileLayout userRole="student" user={mockUser} showBottomNav={true} showHeader={true}>
        <div className="p-4 space-y-6">
          {/* Device Info Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                {isMobile && <Smartphone className="h-5 w-5 text-primary" />}
                {isTablet && <Tablet className="h-5 w-5 text-primary" />}
                {isDesktop && <Monitor className="h-5 w-5 text-primary" />}
                <div>
                  <h3 className="font-semibold text-sm">
                    Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {screenSize.width} × {screenSize.height} • {orientation} •{' '}
                    {isTouchDevice ? 'Touch' : 'Mouse'}
                  </p>
                </div>
              </div>

              {demoResults.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Recent Demo Results:</p>
                  <div className="space-y-1">
                    {demoResults.map((result, index) => (
                      <p key={index} className="text-xs text-muted-foreground">
                        • {result}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feature Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="text-xs">
                Overview
              </TabsTrigger>
              <TabsTrigger value="components" className="text-xs">
                Components
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">
                Performance
              </TabsTrigger>
              <TabsTrigger value="pwa" className="text-xs">
                PWA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.slice(0, 6).map((feature, index) => (
                  <FeatureCard key={index} {...feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="components" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Grid3x3 className="h-5 w-5" />
                    <span>Mobile Components Demo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Loading Skeletons Demo */}
                  <div>
                    <h4 className="font-medium mb-2">Loading Skeletons</h4>
                    <ProgressiveLoadingSkeleton
                      initialCount={2}
                      maxCount={4}
                      loadingDelay={800}
                      renderItem={index => <MealCardSkeleton key={index} className="mb-4" />}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.slice(6, 10).map((feature, index) => (
                  <FeatureCard key={index + 6} {...feature} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>Virtual Scrolling Demo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Efficient rendering of 100+ meal items with smooth scrolling performance.
                  </p>
                  <div className="border rounded-lg">
                    <VirtualScrollList
                      items={mockMeals}
                      itemHeight={80}
                      containerHeight={300}
                      keyExtractor={item => item.id}
                      renderItem={(meal, index) => (
                        <VirtualListItem key={meal.id} className="border-b last:border-b-0">
                          <div className="flex items-center space-x-3 p-3">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">{meal.name}</h4>
                              <p className="text-xs text-muted-foreground truncate">
                                {meal.description}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {meal.isVeg ? '🌱 Veg' : '🍖 Non-Veg'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">₹{meal.price}</span>
                              </div>
                            </div>
                          </div>
                        </VirtualListItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pwa" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {features.slice(10).map((feature, index) => (
                  <FeatureCard key={index + 10} {...feature} />
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>PWA Installation Guide</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Open in Browser</h4>
                        <p className="text-xs text-muted-foreground">
                          Visit this demo in Chrome, Safari, or Edge on mobile
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Look for Install Prompt</h4>
                        <p className="text-xs text-muted-foreground">
                          Browser will show "Add to Home Screen" or install banner
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-medium">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Install & Enjoy</h4>
                        <p className="text-xs text-muted-foreground">
                          App will install and work offline with push notifications
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </MobileLayout>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async _context => {
  // Add any server-side data fetching here
  return {
    props: {},
  };
};

export default MobileDemoPage;
