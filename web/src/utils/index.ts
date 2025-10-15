/**
 * HASIVU Platform - Utils Index
 * Central export file for all utility modules
 * Provides convenient imports for utility functions throughout the application
 */

// Emotion cache utilities
export * from './createEmotionCache';
export {
  createEmotionCache,
  createEmotionSsrCache,
  defaultEmotionCache,
} from './createEmotionCache';

// Formatting utilities
export * from './formatters';

// Validation utilities
export * from './validators';

// API utilities
export * from './api';
export { apiClient, api, API_CONFIG } from './api';
export type { ApiResponse, ApiError, ApiRequestConfig } from './api';

// Application constants
export * from './constants';

// Helper utilities
export * from './helpers';

// Notification utilities
export * from './notifications';
export { notificationManager, notificationTemplates, notificationUtils } from './notifications';
export type {
  NotificationConfig,
  PushSubscriptionConfig,
  NotificationPermission,
} from './notifications';

// Analytics utilities
export * from './analytics';
export { analyticsManager, analytics } from './analytics';

// Default exports for convenience
import formatters from './formatters';
import validators from './validators';
import constants from './constants';
import helpers from './helpers';
import notifications from './notifications';
import analytics from './analytics';

export const _utils = {
  formatters,
  validators,
  constants,
  helpers,
  notifications,
  analytics,
};

export default utils;
