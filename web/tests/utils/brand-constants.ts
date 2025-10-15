/**
 * HASIVU Brand Design System Constants
 * Enterprise UI Testing Framework - Brand Guidelines Integration
 *
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)
 * 🏛️ Design System: Modern, accessible, mobile-first responsive
 * ✨ Brand Identity: Professional school meal management platform
 */

export const _BRAND_COLORS = {
  // Primary Brand Colors
  primary: {
    vibrantBlue: '#2563eb',
    deepGreen: '#16a34a',
  },

  // Secondary Colors
  secondary: {
    slate50: '#f8fafc',
    slate100: '#f1f5f9',
    slate200: '#e2e8f0',
    slate300: '#cbd5e1',
    slate400: '#94a3b8',
    slate500: '#64748b',
    slate600: '#475569',
    slate700: '#334155',
    slate800: '#1e293b',
    slate900: '#0f172a',
  },

  // Semantic Colors
  semantic: {
    success: '#16a34a', // Deep Green (aligned with primary)
    warning: '#f59e0b',
    error: '#dc2626',
    info: '#2563eb', // Vibrant Blue (aligned with primary)
  },

  // Role-Based Colors (for different user types)
  roles: {
    admin: '#dc2626', // Red for admin actions
    teacher: '#2563eb', // Primary blue
    parent: '#16a34a', // Primary green
    student: '#f59e0b', // Warm orange
    vendor: '#7c3aed', // Purple
    kitchenStaff: '#ea580c', // Orange-red
    schoolAdmin: '#1e293b', // Dark slate
  },

  // RFID System Colors
  rfid: {
    scanning: '#2563eb', // Blue for scanning states
    success: '#16a34a', // Green for successful scans
    error: '#dc2626', // Red for failed scans
    pending: '#f59e0b', // Amber for pending transactions
  },
} as const;

export const _BRAND_TYPOGRAPHY = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'monospace'],
  },

  // Font sizes (tailwind scale)
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

export const _BRAND_SPACING = {
  // Tailwind spacing scale
  spacing: {
    0: '0px',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
  },

  // Component-specific spacing
  component: {
    buttonPadding: '0.75rem 1.5rem', // py-3 px-6
    cardPadding: '1.5rem', // p-6
    navbarHeight: '4rem', // h-16
    sidebarWidth: '16rem', // w-64
    footerHeight: '3rem', // h-12
  },
} as const;

export const _BRAND_BORDERS = {
  // Border radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem', // 2px
    base: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    full: '9999px', // rounded-full
  },

  // Border widths
  borderWidth: {
    0: '0px',
    1: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },
} as const;

export const _ACCESSIBILITY_STANDARDS = {
  // WCAG AA Compliance
  contrastRatios: {
    normal: 4.5, // Normal text
    large: 3.0, // Large text (18pt+ or 14pt+ bold)
    nonText: 3.0, // Non-text elements
  },

  // Focus indicators
  focusIndicators: {
    outlineWidth: '2px',
    outlineColor: BRAND_COLORS.primary.vibrantBlue,
    outlineOffset: '2px',
  },

  // Minimum touch targets (mobile)
  touchTargets: {
    minimum: '44px', // 44x44px minimum
    preferred: '48px', // 48x48px preferred
  },

  // Animation preferences
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)', // tailwind's ease-in-out
    prefersReducedMotion: true,
  },
} as const;

export const _RESPONSIVE_BREAKPOINTS = {
  // Tailwind responsive breakpoints
  sm: '640px', // Small devices
  md: '768px', // Medium devices
  lg: '1024px', // Large devices
  xl: '1280px', // Extra large devices
  '2xl': '1536px', // 2X Extra large devices

  // Mobile-first testing viewports
  mobile: {
    width: 375,
    height: 667,
  },
  tablet: {
    width: 768,
    height: 1024,
  },
  desktop: {
    width: 1280,
    height: 720,
  },
  desktopLarge: {
    width: 1920,
    height: 1080,
  },
} as const;

export const _PERFORMANCE_BUDGETS = {
  // Core Web Vitals targets
  coreWebVitals: {
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100, // First Input Delay (ms)
    CLS: 0.1, // Cumulative Layout Shift
    FCP: 1800, // First Contentful Paint (ms)
    TTI: 3800, // Time to Interactive (ms)
    TBT: 300, // Total Blocking Time (ms)
  },

  // Bundle size budgets
  bundleSize: {
    initial: 500 * 1024, // 500KB initial bundle
    total: 2 * 1024 * 1024, // 2MB total
    component: 50 * 1024, // 50KB per component
  },

  // Network performance
  network: {
    timeout: 30000, // 30s max timeout
    retry: 3, // 3 retry attempts
  },
} as const;

// User role definitions for testing
export const _USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  STUDENT: 'student',
  VENDOR: 'vendor',
  KITCHEN_STAFF: 'kitchen_staff',
  SCHOOL_ADMIN: 'school_admin',
} as const;

// RFID workflow states
export const _RFID_STATES = {
  IDLE: 'idle',
  SCANNING: 'scanning',
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING: 'pending',
  PROCESSING: 'processing',
} as const;

// Animation and transition constants
export const _ANIMATIONS = {
  // Common durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '1000ms',
  },

  // Easing functions
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Transform origins
  origin: {
    center: 'center',
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  },
} as const;

// Test data constants
export const _TEST_CONSTANTS = {
  // Default test user credentials
  defaultUsers: {
    admin: {
      email: 'admin@hasivu.test',
      password: 'TestAdmin123!',
      role: USER_ROLES.ADMIN,
    },
    teacher: {
      email: 'teacher@hasivu.test',
      password: 'TestTeacher123!',
      role: USER_ROLES.TEACHER,
    },
    parent: {
      email: 'parent@hasivu.test',
      password: 'TestParent123!',
      role: USER_ROLES.PARENT,
    },
  },

  // Test data identifiers
  testIds: {
    loginForm: 'login-form',
    loginEmail: 'login-email-input',
    loginPassword: 'login-password-input',
    loginSubmit: 'login-submit-button',
    dashboard: 'dashboard-container',
    navigation: 'main-navigation',
    rfidScanner: 'rfid-scanner-component',
    mealMenu: 'meal-menu-display',
  },

  // API endpoints for testing
  apiEndpoints: {
    auth: '/api/auth',
    users: '/api/users',
    meals: '/api/meals',
    orders: '/api/orders',
    rfid: '/api/rfid',
    analytics: '/api/analytics',
  },
} as const;
