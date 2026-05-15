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

    if (typeof window !== 'undefined') {
      const payload = JSON.stringify({
        name: event.name,
        value: 1,
        dimensions: properties || {},
        metadata: { timestamp: event.timestamp },
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/analytics/track', payload);
        return;
      }

      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: payload,
      }).catch(() => undefined);
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
