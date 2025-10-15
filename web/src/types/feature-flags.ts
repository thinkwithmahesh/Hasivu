export type _FeatureFlagEnvironment = 'development' | 'staging' | 'production';

export type _FeatureFlagRolloutStrategy = 'percentage' | 'user-segment' | 'environment' | 'gradual';

export interface UserSegment {
  id: string;
  name: string;
  criteria: {
    userType?: string[];
    schoolId?: string[];
    role?: string[];
    region?: string[];
    customProperties?: Record<string, any>;
  };
}

export interface FeatureFlagRule {
  id: string;
  name: string;
  strategy: FeatureFlagRolloutStrategy;
  percentage?: number; // 0-100 for percentage-based rollouts
  segments?: string[]; // User segment IDs
  environments?: FeatureFlagEnvironment[];
  startDate?: Date;
  endDate?: Date;
  conditions?: {
    userId?: string;
    emailDomain?: string;
    ipRange?: string;
    customCondition?: (user: any) => boolean;
  };
}

export interface FeatureFlag {
  id: string;
  name: string;
  key: string;
  description: string;
  enabled: boolean;
  rules: FeatureFlagRule[];
  fallbackValue?: any;
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    category: 'payment' | 'notification' | 'analytics' | 'ui' | 'experimental';
    priority: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface FeatureFlagEvaluationContext {
  userId?: string;
  userType?: string;
  schoolId?: string;
  role?: string;
  region?: string;
  environment: FeatureFlagEnvironment;
  customProperties?: Record<string, any>;
}

export interface FeatureFlagResult {
  enabled: boolean;
  rule?: FeatureFlagRule;
  reason: string;
  metadata?: {
    rolloutPercentage?: number;
    segmentMatch?: boolean;
    environmentMatch?: boolean;
    userPercentage?: number;
    matchedSegment?: string;
  };
}

export interface FeatureFlagConfig {
  flags: FeatureFlag[];
  segments: UserSegment[];
  globalSettings: {
    defaultEnvironment: FeatureFlagEnvironment;
    enableAnalytics: boolean;
    cacheTimeout: number; // in milliseconds
  };
}

// Predefined feature flag keys for the application
export const _FEATURE_FLAGS = {
  // Payment features
  NEW_PAYMENT_METHODS: 'new_payment_methods',
  PAYMENT_SECURITY_ENHANCED: 'payment_security_enhanced',
  BILLING_ANALYTICS: 'billing_analytics',
  PAYMENT_REFUND_AUTO: 'payment_refund_auto',

  // Notification features
  WHATSAPP_NOTIFICATIONS: 'whatsapp_notifications',
  EMAIL_ENHANCED_TEMPLATES: 'email_enhanced_templates',
  PUSH_NOTIFICATION_ADVANCED: 'push_notification_advanced',
  NOTIFICATION_ANALYTICS: 'notification_analytics',

  // Analytics features
  ADVANCED_ANALYTICS: 'advanced_analytics',
  REAL_TIME_DASHBOARD: 'real_time_dashboard',
  PREDICTIVE_ANALYTICS: 'predictive_analytics',
  CUSTOM_REPORTS: 'custom_reports',

  // UI/Experimental features
  EXPERIMENTAL_UI_COMPONENTS: 'experimental_ui_components',
  DARK_MODE: 'dark_mode',
  NEW_NAVIGATION: 'new_navigation',
  BETA_FEATURES: 'beta_features',
} as const;

export type _FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
