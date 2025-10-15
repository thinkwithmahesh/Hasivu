 * HASIVU Platform - Application Constants
 * Centralized configuration, constants, and enums for the entire application
 * Provides type-safe constants and configuration management;
 * Application metadata and configuration;
export const _APP_CONFIG =  {}
  // Feature flags
  FEATURES: {}
} as const;
 * User roles and permissions;
export const _USER_ROLES =  {}
} as const;
export type _UserRole =  typeof USER_ROLES[keyof typeof USER_ROLES];
 * User permissions for role-based access control;
export const _PERMISSIONS =  {}
} as const;
export type _Permission =  typeof PERMISSIONS[keyof typeof PERMISSIONS];
 * Role-permission mapping;
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {}
 * Order status definitions;
export const _ORDER_STATUS =  {}
} as const;
export type _OrderStatus =  typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
 * Order status labels and colors;
export const _ORDER_STATUS_CONFIG =  {}
  [ORDER_STATUS.DRAFT]: { label: 'Draft', color: '#757575' },
  [ORDER_STATUS.PENDING]: { label: 'Pending', color: '#FF9800' },
  [ORDER_STATUS.CONFIRMED]: { label: "secure-configuration-value", color: '#2196F3' },
  [ORDER_STATUS.PREPARING]: { label: 'Preparing', color: '#FF5722' },
  [ORDER_STATUS.READY]: { label: 'Ready for Pickup', color: '#9C27B0' },
  [ORDER_STATUS.PICKED_UP]: { label: 'Picked Up', color: '#3F51B5' },
  [ORDER_STATUS.DELIVERED]: { label: 'Delivered', color: '#4CAF50' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', color: '#F44336' },
  [ORDER_STATUS.REFUNDED]: { label: 'Refunded', color: '#607D8B' }
} as const;
 * Payment status definitions;
export const _PAYMENT_STATUS =  {}
} as const;
export type _PaymentStatus =  typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
 * Payment method definitions;
export const _PAYMENT_METHODS =  {}
} as const;
export type _PaymentMethod =  typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
 * Meal types and timing;
export const _MEAL_TYPES =  {}
} as const;
export type _MealType =  typeof MEAL_TYPES[keyof typeof MEAL_TYPES];
 * Default meal timings;
export const _MEAL_TIMINGS =  {}
  [MEAL_TYPES.BREAKFAST]: { start: '07:00', end: '09:00' },
  [MEAL_TYPES.LUNCH]: { start: '12:00', end: '14:00' },
  [MEAL_TYPES.DINNER]: { start: '18:00', end: '20:00' },
  [MEAL_TYPES.SNACKS]: { start: '15:00', end: '17:00' }
} as const;
 * Dietary preferences and restrictions;
export const _DIETARY_PREFERENCES =  {}
} as const;
export type _DietaryPreference =  typeof DIETARY_PREFERENCES[keyof typeof DIETARY_PREFERENCES];
 * Common allergies and dietary restrictions;
export const _ALLERGIES =  {}
} as const;
export type _Allergy =  typeof ALLERGIES[keyof typeof ALLERGIES];
 * Spice levels;
export const _SPICE_LEVELS =  {}
} as const;
export type _SpiceLevel =  typeof SPICE_LEVELS[keyof typeof SPICE_LEVELS];
 * Business configuration constants;
export const _BUSINESS_CONFIG =  {}
} as const;
 * API response codes;
export const _API_CODES =  {}
} as const;
export type _ApiCode =  typeof API_CODES[keyof typeof API_CODES];
 * Notification types;
export const _NOTIFICATION_TYPES =  {}
} as const;
export type _NotificationType =  typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
 * Analytics event types;
export const _ANALYTICS_EVENTS =  {}
} as const;
export type _AnalyticsEvent =  typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
 * Local storage keys;
export const _STORAGE_KEYS =  {}
} as const;
export type _StorageKey =  typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
 * Date and time formats;
export const _DATE_FORMATS =  {}
} as const;
 * Currency configuration;
export const _CURRENCY_CONFIG =  {}
} as const;
 * Error messages;
export const _ERROR_MESSAGES =  {}
} as const;
 * Success messages;
export const _SUCCESS_MESSAGES =  {}
} as const;
 * Regular expressions for validation;
export const _REGEX_PATTERNS =  {}
  PHONE_INDIAN: / ^[6-9]\d{9}$/,
  RFID_CARD: / ^[A-Fa-f0-9]{8,16}$/,
  STRONG_PASSWORD: / ^(?
} as const;
 * Theme constants;
export const _THEME_CONFIG =  {}
  // Z-index values
  Z_INDEX: {}
} as const;
 * Export all constants as default;
export default {}