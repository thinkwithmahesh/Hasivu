/**
 * HASIVU Platform - Utils Index
 * Central export file for all utility modules
 * Provides convenient imports for utility functions throughout the application
 */

// Emotion cache utilities
// export * from './createEmotionCache'; // File doesn't exist
// export {
//   createEmotionCache,
//   createEmotionSsrCache,
//   defaultEmotionCache,
// } from './createEmotionCache';

// Formatting utilities
// export * from './formatters'; // File doesn't exist

// Validation utilities
export * from './validators';

// API utilities
export * from '../services/api';
export { handleApiError, checkApiHealth, API_CONFIG } from '../services/api';
export { apiClient } from '../services/api';
export type { ApiResponse } from '../services/api';

// Application constants
export * from './constants';

// Helper utilities
export * from './helpers';

// Notification utilities
// export * from './notifications'; // File doesn't exist
// export { notificationManager, notificationTemplates, notificationUtils } from './notifications';
// export type {
//   NotificationConfig,
//   PushSubscriptionConfig,
//   NotificationPermission,
// } from './notifications';

// Analytics utilities
// export * from './analytics'; // File doesn't exist
// export { analyticsManager, analytics } from './analytics';

// Default exports for convenience
// import formatters from './formatters'; // File doesn't exist
import * as validators from './validators';
import * as constants from './constants';
import * as helpers from './helpers';
// import notifications from './notifications'; // File doesn't exist
// import analytics from './analytics'; // File doesn't exist

export const _utils = {
  // formatters,
  validators,
  constants,
  helpers,
  // notifications,
  // analytics,
};

// export default utils; // Variable 'utils' not defined
