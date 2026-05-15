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

/**
 * Hook for checking if a feature flag is enabled
 */
export const useFeatureFlag = (flagKey: string, userId?: string): boolean => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const checkFeatureFlag = async () => {
      try {
        const params = new URLSearchParams({
          environment: process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development',
        });
        if (userId) params.set('userId', userId);

        const response = await fetch(`/api/feature-flags/${flagKey}?${params.toString()}`, {
          credentials: 'include',
          signal: abortController.signal,
        });

        if (!response.ok) {
          setIsEnabled(false);
          return;
        }

        const payload = await response.json();
        setIsEnabled(Boolean(payload?.success && payload?.evaluation?.enabled));
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error checking feature flag:', error);
        }
        setIsEnabled(false);
      }
    };

    checkFeatureFlag();

    return () => abortController.abort();
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
        const payload = {
          flagKey,
          action,
          metadata,
          timestamp: new Date().toISOString(),
        };

        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/feature-flags/usage', JSON.stringify(payload));
          return;
        }

        await fetch('/api/feature-flags/usage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.error('Error tracking feature usage:', error);
      }
    },
    []
  );

  const getFeatureStats = useCallback(async (flagKey: string) => {
    try {
      const response = await fetch(
        `/api/feature-flags/usage?flagKey=${encodeURIComponent(flagKey)}`,
        { credentials: 'include' }
      );
      if (!response.ok) return null;
      const payload = await response.json();
      return payload?.data || null;
    } catch (error) {
      console.error('Error getting feature stats:', error);
      return null;
    }
  }, []);

  return {
    trackFeatureUsage,
    getFeatureStats,
  };
};
