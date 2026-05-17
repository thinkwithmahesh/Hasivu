// Lightweight Google Analytics helpers for client-side events
// Safe no-op in development or when GA is not configured

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params || {});
  } else if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
  }
}

export const events = {
  track: (eventName: string, params?: Record<string, any>) => trackEvent(eventName, params),
  ctaClick: (cta_id: string, metadata?: Record<string, any>) =>
    trackEvent('cta_click', { cta_id, ...metadata }),
  videoOpen: (metadata?: Record<string, any>) => trackEvent('video_open', { ...metadata }),
};
