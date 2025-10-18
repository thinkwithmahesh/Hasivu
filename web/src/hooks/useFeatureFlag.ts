/**
 * HASIVU Platform - Feature Flag Hook
 * Client-side feature flag management with analytics
 */

import React, { useState, useEffect, useCallback } from 'react';

// Feature flag types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: 'development' | 'staging' | 'production';
  userSegments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: Record<string, any>;
}

export type FeatureFlagRolloutStrategy = 'percentage' | 'user-segment' | 'gradual';

export type FeatureFlagEnvironment = 'development' | 'staging' | 'production';

// Feature flag constants
export const FEATURE_FLAGS = {
  PAYMENT_ANALYTICS: 'payment_analytics',
  WHATSAPP_INTEGRATION: 'whatsapp_integration',
  SUBSCRIPTION_MANAGER: 'subscription_manager',
  BILLING_DASHBOARD: 'billing_dashboard',
  COMMUNICATION_PREFERENCES: 'communication_preferences',
} as const;

// Mock feature flag data
const mockFeatureFlags: Record<string, FeatureFlag> = {
  [FEATURE_FLAGS.PAYMENT_ANALYTICS]: {
    id: '1',
    name: 'Payment Analytics',
    description: 'Advanced payment analytics and reporting',
    enabled: true,
    rolloutPercentage: 100,
    environment: 'production',
    userSegments: ['admin', 'school_admin'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [FEATURE_FLAGS.WHATSAPP_INTEGRATION]: {
    id: '2',
    name: 'WhatsApp Integration',
    description: 'WhatsApp messaging for notifications',
    enabled: false,
    rolloutPercentage: 0,
    environment: 'development',
    userSegments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [FEATURE_FLAGS.SUBSCRIPTION_MANAGER]: {
    id: '3',
    name: 'Subscription Manager',
    description: 'Advanced subscription management features',
    enabled: true,
    rolloutPercentage: 50,
    environment: 'staging',
    userSegments: ['admin'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [FEATURE_FLAGS.BILLING_DASHBOARD]: {
    id: '4',
    name: 'Billing Dashboard',
    description: 'Comprehensive billing and invoicing dashboard',
    enabled: true,
    rolloutPercentage: 100,
    environment: 'production',
    userSegments: ['admin', 'school_admin'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  [FEATURE_FLAGS.COMMUNICATION_PREFERENCES]: {
    id: '5',
    name: 'Communication Preferences',
    description: 'User communication preference management',
    enabled: false,
    rolloutPercentage: 25,
    environment: 'staging',
    userSegments: ['parent'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

/**
 * Hook for checking if a feature flag is enabled
 */
export const useFeatureFlag = (flagKey: string, userId?: string): boolean => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const checkFeatureFlag = async () => {
      try {
        // In production, this would make an API call
        const flag = mockFeatureFlags[flagKey];
        if (!flag) {
          setIsEnabled(false);
          return;
        }

        // Check if flag is enabled
        if (!flag.enabled) {
          setIsEnabled(false);
          return;
        }

        // Check environment
        const currentEnv = process.env.NODE_ENV || 'development';
        if (flag.environment !== currentEnv && flag.environment !== 'production') {
          setIsEnabled(false);
          return;
        }

        // Check rollout percentage (simple random check)
        if (flag.rolloutPercentage < 100) {
          const userHash = userId ? hashString(userId) : Math.random();
          const percentage = (userHash % 100) / 100;
          if (percentage > flag.rolloutPercentage / 100) {
            setIsEnabled(false);
            return;
          }
        }

        setIsEnabled(true);
      } catch (error) {
        console.error('Error checking feature flag:', error);
        setIsEnabled(false);
      }
    };

    checkFeatureFlag();
  }, [flagKey, userId]);

  return isEnabled;
};

/**
 * Hook for conditional rendering based on feature flags
 */
export const useConditionalRender = (flagKey: string, userId?: string) => {
  const isEnabled = useFeatureFlag(flagKey, userId);

  return {
    isEnabled,
    ConditionalRender: ({ children }: { children: React.ReactNode }) =>
      isEnabled ? React.createElement(React.Fragment, null, children) : null,
  };
};

/**
 * Hook for feature flag analytics
 */
export const useFeatureFlagAnalytics = () => {
  const trackFeatureUsage = useCallback(
    async (flagKey: string, action: string, metadata?: Record<string, any>) => {
      try {
        // In production, this would send analytics data
        console.log('Feature flag usage:', {
          flagKey,
          action,
          metadata,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error tracking feature usage:', error);
      }
    },
    []
  );

  const getFeatureStats = useCallback(async (flagKey: string) => {
    try {
      // In production, this would fetch analytics data
      return {
        usageCount: Math.floor(Math.random() * 1000),
        uniqueUsers: Math.floor(Math.random() * 500),
        conversionRate: Math.random() * 100,
      };
    } catch (error) {
      console.error('Error getting feature stats:', error);
      return null;
    }
  }, []);

  return {
    trackFeatureUsage,
    getFeatureStats,
    totalFlags: 5,
    enabledFlags: 3,
    flagsByCategory: {
      payment: 2,
      notification: 1,
      analytics: 1,
      ui: 0,
      experimental: 1,
    },
  };
};

/**
 * Simple string hash function for percentage-based rollouts
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
