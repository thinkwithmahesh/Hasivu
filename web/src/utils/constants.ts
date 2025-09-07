 * HASIVU Platform - Application Constants
 * Centralized configuration, constants, and enums for the entire application
 * Provides type-safe constants and configuration management;
 * Application metadata and configuration;
export const APP_CONFIG = {}
  // Feature flags
  FEATURES: {}
} as const;
 * User roles and permissions;
export const USER_ROLES = {}
} as const;
export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
 * User permissions for role-based access control;
export const PERMISSIONS = {}
} as const;
export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
 * Role-permission mapping;
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {}
 * Order status definitions;
export const ORDER_STATUS = {}
} as const;
export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];
 * Order status labels and colors;
export const ORDER_STATUS_CONFIG = {}
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
export const PAYMENT_STATUS = {}
} as const;
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];
 * Payment method definitions;
export const PAYMENT_METHODS = {}
} as const;
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
 * Meal types and timing;
export const MEAL_TYPES = {}
} as const;
export type MealType = typeof MEAL_TYPES[keyof typeof MEAL_TYPES];
 * Default meal timings;
export const MEAL_TIMINGS = {}
  [MEAL_TYPES.BREAKFAST]: { start: '07:00', end: '09:00' },
  [MEAL_TYPES.LUNCH]: { start: '12:00', end: '14:00' },
  [MEAL_TYPES.DINNER]: { start: '18:00', end: '20:00' },
  [MEAL_TYPES.SNACKS]: { start: '15:00', end: '17:00' }
} as const;
 * Dietary preferences and restrictions;
export const DIETARY_PREFERENCES = {}
} as const;
export type DietaryPreference = typeof DIETARY_PREFERENCES[keyof typeof DIETARY_PREFERENCES];
 * Common allergies and dietary restrictions;
export const ALLERGIES = {}
} as const;
export type Allergy = typeof ALLERGIES[keyof typeof ALLERGIES];
 * Spice levels;
export const SPICE_LEVELS = {}
} as const;
export type SpiceLevel = typeof SPICE_LEVELS[keyof typeof SPICE_LEVELS];
 * Business configuration constants;
export const BUSINESS_CONFIG = {}
} as const;
 * API response codes;
export const API_CODES = {}
} as const;
export type ApiCode = typeof API_CODES[keyof typeof API_CODES];
 * Notification types;
export const NOTIFICATION_TYPES = {}
} as const;
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];
 * Analytics event types;
export const ANALYTICS_EVENTS = {}
} as const;
export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS];
 * Local storage keys;
export const STORAGE_KEYS = {}
} as const;
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
 * Date and time formats;
export const DATE_FORMATS = {}
} as const;
 * Currency configuration;
export const CURRENCY_CONFIG = {}
} as const;
 * Error messages;
export const ERROR_MESSAGES = {}
} as const;
 * Success messages;
export const SUCCESS_MESSAGES = {}
} as const;
 * Regular expressions for validation;
export const REGEX_PATTERNS = {}
  PHONE_INDIAN: / ^[6-9]\d{9}$/,
  RFID_CARD: / ^[A-Fa-f0-9]{8,16}$/,
  STRONG_PASSWORD: / ^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{}
}$/,
  PIN_CODE: / ^[1-9][0-9]{5}$/,
  STUDENT_ID: / ^[A-Za-z0-9]{6,12}$/,
  SCHOOL_CODE: / ^[A-Z0-9]{4,8}$/,
  GST_NUMBER: / ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  IFSC_CODE: / ^[A-Z]{4}0[A-Z0-9]{6}$/,
  UPI_ID: / ^[\w.-]+@[\w.-]+$/,
  CARD_NUMBER: / ^[0-9]{13,19}$/,
  CVV: / ^[0-9]{3,4}$;
} as const;
 * Theme constants;
export const THEME_CONFIG = {}
  // Z-index values
  Z_INDEX: {}
} as const;
 * Export all constants as default;
export default {}