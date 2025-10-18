'use client';

import { useCallback } from 'react';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
    };

    // In a real implementation, this would send to an analytics service
    console.log('Analytics Event:', event);

    // Mock implementation - could integrate with services like Mixpanel, Google Analytics, etc.
    if (typeof window !== 'undefined') {
      // Store in localStorage for demo purposes
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push(event);
      localStorage.setItem('analytics_events', JSON.stringify(events.slice(-100))); // Keep last 100 events
    }
  }, []);

  const trackPageView = useCallback(
    (pageName: string, properties?: Record<string, any>) => {
      trackEvent('page_view', { page: pageName, ...properties });
    },
    [trackEvent]
  );

  const trackUserAction = useCallback(
    (action: string, properties?: Record<string, any>) => {
      trackEvent('user_action', { action, ...properties });
    },
    [trackEvent]
  );

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
  };
}
