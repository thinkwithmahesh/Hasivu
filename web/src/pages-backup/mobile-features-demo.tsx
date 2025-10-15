'use client';

import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Tabs components removed - not currently used
import MobileLayout from '@/components/mobile/MobileLayout';

// Touch Optimized Components
import {
  TouchContainer,
  SwipeableCard,
  PullToRefresh,
  TouchInput,
} from '@/components/mobile/TouchOptimized';

// Bottom Sheets
import {
  BottomSheet,
  useBottomSheet,
  MealDetailsSheet,
  RFIDScannerSheet,
} from '@/components/mobile/BottomSheet';

// PWA Features
import {
  NetworkStatusIndicator,
  ShareButton,
  QuickRFIDDisplay,
} from '@/components/mobile/PWAFeatures';

// School Mobile Components
import {
  QuickMealCarousel,
  LiveOrderTracking,
  ParentApprovalInterface,
  SchoolScheduleIntegration,
} from '@/components/mobile/SchoolMobileComponents';

// Hooks
import { usePWAInstall, useNetworkStatus, usePushNotifications } from '@/hooks/usePWA';
import { useMobileLayout } from '@/hooks/useMobileLayout';

import {
  Smartphone,
  Touch,
  Bell,
  Utensils,
  Heart,
  Star,
  Share,
  Download,
  RefreshCw,
  Zap,
  CheckCircle,
} from 'lucide-react';

const MobileFeaturesDemo: NextPage = () => {
  const { isMobile, isTablet, vibrate, shareContent } = useMobileLayout();
  const { isInstallable, installApp } = usePWAInstall();
  const { isOnline, connectionQuality } = useNetworkStatus();
  const { permission, requestPermission } = usePushNotifications();

  // Demo state
  const [searchValue, setSearchValue] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const [orderStatus, setOrderStatus] = useState<'placed' | 'preparing' | 'ready'>('preparing');

  // Bottom sheet states
  const mealDetailsSheet = useBottomSheet();
  const rfidScannerSheet = useBottomSheet();
  const demoSheet = useBottomSheet();

  // Demo data
  const mockMeals = [
    {
      id: '1',
      name: 'Butter Chicken Rice Bowl',
      price: 120,
      image: '/api/placeholder/300/200',
      preparationTime: 15,
      rating: 4.5,
      isAvailable: true,
      isPopular: true,
      description: 'Tender chicken in rich tomato curry with basmati rice',
      allergens: ['dairy', 'gluten'],
      nutrition: { calories: 450, protein: 25, carbs: 60, fat: 15 },
    },
    {
      id: '2',
      name: 'Veggie Wrap',
      price: 80,
      image: '/api/placeholder/300/200',
      preparationTime: 8,
      rating: 4.2,
      isAvailable: true,
      isPopular: false,
      description: 'Fresh vegetables wrapped in whole wheat tortilla',
      allergens: ['gluten'],
      nutrition: { calories: 320, protein: 12, carbs: 45, fat: 8 },
    },
    {
      id: '3',
      name: 'Chocolate Brownie',
      price: 60,
      image: '/api/placeholder/300/200',
      preparationTime: 5,
      rating: 4.8,
      isAvailable: false,
      isPopular: true,
      description: 'Rich, fudgy brownie with chocolate chunks',
      allergens: ['dairy', 'eggs', 'nuts'],
      nutrition: { calories: 280, protein: 4, carbs: 35, fat: 14 },
    },
  ];

  const mockOrder = {
    id: 'ORD123456',
    items: [
      { name: 'Butter Chicken Rice Bowl', quantity: 1 },
      { name: 'Mango Lassi', quantity: 1 },
    ],
    status: orderStatus,
    estimatedTime: 12,
    pickupLocation: 'Canteen Counter 2',
  };

  const mockPendingOrders = [
    {
      id: 'REQ001',
      studentName: 'Arjun Sharma',
      items: [
        { name: 'Pizza Slice', price: 80, quantity: 2 },
        { name: 'Cold Drink', price: 30, quantity: 1 },
      ],
      total: 190,
      requestedTime: new Date(),
      dietaryNotes: 'No onions please',
    },
  ];

  const currentSchedule = {
    currentPeriod: {
      subject: 'Mathematics',
      teacher: 'Mrs. Gupta',
      room: 'A-204',
      endTime: new Date(Date.now() + 30 * 60 * 1000),
    },
    nextMealTime: {
      type: 'lunch' as const,
      time: new Date(Date.now() + 90 * 60 * 1000),
      location: 'Main Canteen',
    },
    isOrderingOpen: true,
  };

  const handleRefresh = async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    setRefreshCount(prev => prev + 1);
  };

  const handleMealOrder = (mealId: string, quantity: number) => {
    vibrate([20, 10, 20]);
  };

  const handleShare = () => {
    shareContent({
      title: 'HASIVU Mobile Demo',
      text: 'Check out these amazing mobile features for school food ordering!',
      url: window.location.href,
    });
  };

  const demoSections = [
    {
      id: 'touch',
      label: 'Touch UI',
      icon: <Touch className="h-4 w-4" />,
      color: 'bg-blue-500',
    },
    {
      id: 'pwa',
      label: 'PWA Features',
      icon: <Smartphone className="h-4 w-4" />,
      color: 'bg-green-500',
    },
    {
      id: 'school',
      label: 'School Features',
      icon: <Utensils className="h-4 w-4" />,
      color: 'bg-purple-500',
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: <Zap className="h-4 w-4" />,
      color: 'bg-orange-500',
    },
  ];

  return (
    <>
      <Head>
        <title>Mobile Features Demo - HASIVU</title>
        <meta
          name="description"
          content="Comprehensive mobile experience demo for HASIVU school platform"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      <MobileLayout
        userRole="student"
        user={{
          id: 'demo-user',
          name: 'Demo Student',
          email: 'demo@hasivu.com',
        }}
        showBottomNav={isMobile}
        showHeader={true}
      >
        {/* Status Indicators */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b p-2">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <NetworkStatusIndicator />
            <div className="flex items-center space-x-2">
              <Badge variant={isOnline ? 'default' : 'destructive'} className="text-xs">
                {connectionQuality}
              </Badge>
              {isInstallable && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={installApp}
                  className="h-6 px-2 text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Install
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="space-y-6 pb-safe-bottom">
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-primary/10 to-blue-50 p-6 m-4 rounded-xl">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Mobile Features Demo</h1>
              <p className="text-sm text-gray-600">
                Experience touch-optimized components, PWA features, and school-specific mobile
                interfaces
              </p>
              <div className="flex justify-center space-x-2">
                <ShareButton
                  title="HASIVU Mobile Demo"
                  text="Check out these mobile features!"
                  variant="button"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => vibrate([10, 50, 10])}
                  className="text-xs"
                >
                  Test Haptic
                </Button>
              </div>
            </div>
          </div>

          {/* Feature Categories */}
          <div className="grid grid-cols-2 gap-3 px-4">
            {demoSections.map(section => (
              <TouchContainer key={section.id} hapticFeedback onTap={() => demoSheet.open()}>
                <Card className="p-4 text-center hover:shadow-md transition-shadow">
                  <div
                    className={`mx-auto w-10 h-10 ${section.color} rounded-lg flex items-center justify-center text-white mb-3`}
                  >
                    {section.icon}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900">{section.label}</h3>
                </Card>
              </TouchContainer>
            ))}
          </div>

          {/* Touch Input Demo */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Touch-Optimized Input</h2>
            <TouchInput
              label="Search meals"
              placeholder="Try typing something..."
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              clearable
              onClear={() => setSearchValue('')}
              icon={<Bell className="h-4 w-4" />}
              helpText="This input is optimized for mobile with proper touch targets"
            />
          </div>

          {/* Quick Meal Carousel */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 px-4 mb-4">Quick Order Demo</h2>
            <QuickMealCarousel meals={mockMeals} onOrderMeal={handleMealOrder} />
          </div>

          {/* Swipeable Cards Demo */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Swipeable Cards</h2>
            <SwipeableCard
              leftAction={{
                icon: <Heart className="h-5 w-5" />,
                color: 'bg-red-500 text-white',
                label: 'Like',
              }}
              rightAction={{
                icon: <Star className="h-5 w-5" />,
                color: 'bg-yellow-500 text-white',
                label: 'Favorite',
              }}
              onSwipeLeft={() => vibrate(20)}
              onSwipeRight={() => vibrate(20)}
            >
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Swipe me!</h3>
                <p className="text-sm text-gray-600">
                  Swipe left to like or right to favorite. Each action provides haptic feedback.
                </p>
              </Card>
            </SwipeableCard>
          </div>

          {/* Pull to Refresh Demo */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Pull to Refresh</h2>
            <PullToRefresh onRefresh={handleRefresh} className="max-h-40">
              <Card className="p-4 text-center">
                <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Pull down to refresh</h3>
                <p className="text-sm text-gray-600">Refreshed {refreshCount} times</p>
              </Card>
            </PullToRefresh>
          </div>

          {/* Live Order Tracking */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 px-4 mb-4">Live Order Tracking</h2>
            <LiveOrderTracking
              order={mockOrder}
              onRefresh={() => {
                setOrderStatus(prev => {
                  const statuses = ['placed', 'preparing', 'ready'] as const;
                  const currentIndex = statuses.indexOf(prev);
                  return statuses[(currentIndex + 1) % statuses.length];
                });
              }}
            />
          </div>

          {/* School Schedule Integration */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 px-4 mb-4">School Schedule</h2>
            <SchoolScheduleIntegration
              {...currentSchedule}
              onQuickOrder={() => mealDetailsSheet.open()}
            />
          </div>

          {/* Parent Approval Demo */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Parent Approval Interface</h2>
            <ParentApprovalInterface
              pendingOrders={mockPendingOrders}
              onApprove={_id => vibrate([20, 10, 20])}
              onReject={(_id, _reason) => vibrate([50, 20, 50])}
            />
          </div>

          {/* Quick RFID Display */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 px-4 mb-4">Quick RFID Code</h2>
            <QuickRFIDDisplay
              rfidCode="RF123456"
              studentName="Demo Student"
              onCopy={() => vibrate(10)}
            />
          </div>

          {/* Bottom Sheet Triggers */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Bottom Sheets</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={mealDetailsSheet.open} className="h-12" haptic>
                Meal Details
              </Button>
              <Button variant="outline" onClick={rfidScannerSheet.open} className="h-12" haptic>
                RFID Scanner
              </Button>
            </div>
          </div>

          {/* PWA Features Demo */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">PWA Features</h2>
            <div className="grid grid-cols-1 gap-3">
              {permission !== 'granted' && (
                <Button
                  variant="outline"
                  onClick={requestPermission}
                  className="justify-start"
                  haptic
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Enable Notifications
                </Button>
              )}

              <Button variant="outline" onClick={handleShare} className="justify-start" haptic>
                <Share className="h-4 w-4 mr-2" />
                Share Demo
              </Button>
            </div>
          </div>

          {/* Device Info */}
          <div className="px-4 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Device Information</h2>
            <Card className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Device Type:</span>
                <span className="text-gray-900">
                  {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Connection:</span>
                <span className="text-gray-900 capitalize">{connectionQuality}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">PWA Ready:</span>
                <span className="text-gray-900">{isInstallable ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Notifications:</span>
                <span className="text-gray-900 capitalize">{permission}</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Sheets */}
        <MealDetailsSheet
          isOpen={mealDetailsSheet.isOpen}
          onClose={mealDetailsSheet.close}
          meal={mockMeals[0]}
          onAddToCart={() => {
            vibrate([20, 10, 20]);
            mealDetailsSheet.close();
          }}
        />

        <RFIDScannerSheet
          isOpen={rfidScannerSheet.isOpen}
          onClose={rfidScannerSheet.close}
          onScanComplete={code => {
            vibrate([20, 10, 20]);
          }}
        />

        {/* Demo Info Sheet */}
        <BottomSheet
          isOpen={demoSheet.isOpen}
          onClose={demoSheet.close}
          title="Mobile Features Demo"
          snapPoints={[70]}
        >
          <div className="p-4 space-y-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Features Demonstrated:</h3>

              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Touch-optimized components with haptic feedback</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Swipe gestures and pull-to-refresh</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Bottom sheet dialogs</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">PWA installation and notifications</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">School-specific mobile interfaces</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Offline support and background sync</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Responsive design for all screen sizes</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-1">Performance Optimizations</h4>
              <p className="text-sm text-blue-700">
                All components use virtual scrolling, image lazy loading, and touch debouncing for
                smooth 60fps interactions on mobile devices.
              </p>
            </div>

            <Button onClick={demoSheet.close} className="w-full" haptic>
              Close Demo Info
            </Button>
          </div>
        </BottomSheet>
      </MobileLayout>
    </>
  );
};

export default MobileFeaturesDemo;
