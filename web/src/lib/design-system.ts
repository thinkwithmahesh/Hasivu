/**
 * HASIVU Design System - Production-Ready Design Tokens
 * 🎨 Brand Colors: Vibrant Blue (#2563eb), Deep Green (#16a34a)
 * 🏛️ Enterprise UI System for School Meal Management Platform
 * ♿ WCAG 2.1 AA Compliant | 📱 Mobile-First Responsive
 */

// Core brand colors with semantic meanings
export const colors = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#2563eb', // Primary vibrant blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  secondary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#16a34a', // Primary deep green
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Semantic colors
  success: '#16a34a',
  warning: '#f59e0b',
  error: '#dc2626',
  info: '#2563eb',

  // Neutral grays
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Role-based colors for different user types
  roles: {
    admin: '#dc2626',
    teacher: '#2563eb',
    parent: '#16a34a',
    student: '#f59e0b',
    vendor: '#7c3aed',
    kitchen: '#ea580c',
    schoolAdmin: '#1e293b',
  },
} as const;

// Typography system based on Inter font family
export const typography = {
  fontFamily: {
    sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Inconsolata', 'monospace'],
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
    base: ['1rem', { lineHeight: '1.5rem' }], // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }], // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }], // 60px
  },

  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
} as const;

// Spacing system (4px base unit)
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
  36: '9rem', // 144px
  40: '10rem', // 160px
  44: '11rem', // 176px
  48: '12rem', // 192px
  52: '13rem', // 208px
  56: '14rem', // 224px
  60: '15rem', // 240px
  64: '16rem', // 256px
  72: '18rem', // 288px
  80: '20rem', // 320px
  96: '24rem', // 384px
} as const;

// Border radius system
export const borderRadius = {
  none: '0px',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Shadow system for depth
export const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

// Animation and transition system
export const animation = {
  duration: {
    75: '75ms',
    100: '100ms',
    150: '150ms',
    200: '200ms',
    300: '300ms',
    500: '500ms',
    700: '700ms',
    1000: '1000ms',
  },

  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  scale: {
    0: '0',
    50: '.5',
    75: '.75',
    90: '.9',
    95: '.95',
    100: '1',
    105: '1.05',
    110: '1.1',
    125: '1.25',
    150: '1.5',
  },
} as const;

// Responsive breakpoints (mobile-first)
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Component-specific design tokens
export const components = {
  // Button variants
  button: {
    // Sizing
    height: {
      sm: '2rem', // 32px
      base: '2.5rem', // 40px
      lg: '3rem', // 48px
      xl: '3.5rem', // 56px
    },

    // Padding
    padding: {
      sm: '0.5rem 0.75rem', // py-2 px-3
      base: '0.625rem 1rem', // py-2.5 px-4
      lg: '0.75rem 1.5rem', // py-3 px-6
      xl: '1rem 2rem', // py-4 px-8
    },

    // Border radius
    borderRadius: {
      sm: borderRadius.md,
      base: borderRadius.lg,
      lg: borderRadius.xl,
      xl: borderRadius['2xl'],
    },
  },

  // Card component
  card: {
    padding: '1.5rem', // p-6
    borderRadius: borderRadius.xl,
    shadow: boxShadow.md,
    borderWidth: '1px',
  },

  // Input components
  input: {
    height: {
      sm: '2rem', // 32px
      base: '2.5rem', // 40px
      lg: '3rem', // 48px
    },
    padding: '0.75rem 1rem', // py-3 px-4
    borderRadius: borderRadius.lg,
    borderWidth: '1px',
    focusRingWidth: '2px',
    focusRingOffset: '2px',
  },

  // Navigation
  navigation: {
    height: '4rem', // 64px
    padding: '0 1.5rem', // px-6
    shadow: boxShadow.sm,
  },

  // Sidebar
  sidebar: {
    width: '16rem', // 256px
    padding: '1.5rem', // p-6
  },
} as const;

// Accessibility standards (WCAG 2.1 AA)
export const accessibility = {
  // Color contrast ratios
  contrast: {
    normal: 4.5, // Normal text
    large: 3.0, // Large text (18pt+ or 14pt+ bold)
    graphical: 3.0, // Non-text elements
  },

  // Focus indicators
  focus: {
    outlineWidth: '2px',
    outlineColor: colors.primary[500],
    outlineOffset: '2px',
    borderRadius: borderRadius.sm,
  },

  // Minimum touch targets (especially for mobile)
  touchTarget: {
    minimum: '44px', // 44x44px minimum
    preferred: '48px', // 48x48px preferred
  },

  // Animation preferences
  reducedMotion: {
    duration: animation.duration[150],
    easing: animation.easing.easeOut,
  },
} as const;

// Z-index system for layering
export const zIndex = {
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
  max: '2147483647',
} as const;

// Utility functions for design system
export const utils = {
  // Get color with opacity
  withOpacity: (color: string, opacity: number) => {
    return `${color}${Math.round(opacity * 255)
      .toString(16)
      .padStart(2, '0')}`;
  },

  // Responsive value helper
  responsive: <T>(values: { [key: string]: T }) => values,

  // Component variant helper
  variant: <T>(variants: { [key: string]: T }) => variants,

  // Spacing multiplier
  space: (multiplier: number) => `${multiplier * 0.25}rem`,
} as const;

// CSS custom properties for runtime theming
export const cssVariables = {
  '--color-primary': colors.primary[500],
  '--color-secondary': colors.secondary[500],
  '--color-success': colors.success,
  '--color-warning': colors.warning,
  '--color-error': colors.error,
  '--color-info': colors.info,

  '--color-gray-50': colors.gray[50],
  '--color-gray-100': colors.gray[100],
  '--color-gray-200': colors.gray[200],
  '--color-gray-300': colors.gray[300],
  '--color-gray-400': colors.gray[400],
  '--color-gray-500': colors.gray[500],
  '--color-gray-600': colors.gray[600],
  '--color-gray-700': colors.gray[700],
  '--color-gray-800': colors.gray[800],
  '--color-gray-900': colors.gray[900],

  '--font-family-sans': typography.fontFamily.sans.join(', '),
  '--font-family-mono': typography.fontFamily.mono.join(', '),

  '--border-radius-sm': borderRadius.sm,
  '--border-radius-base': borderRadius.base,
  '--border-radius-md': borderRadius.md,
  '--border-radius-lg': borderRadius.lg,
  '--border-radius-xl': borderRadius.xl,

  '--shadow-sm': boxShadow.sm,
  '--shadow-base': boxShadow.base,
  '--shadow-md': boxShadow.md,
  '--shadow-lg': boxShadow.lg,

  '--duration-fast': animation.duration[150],
  '--duration-normal': animation.duration[300],
  '--duration-slow': animation.duration[500],

  '--easing-ease-out': animation.easing.easeOut,
  '--easing-ease-in-out': animation.easing.easeInOut,
} as const;

// Export all design tokens
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  boxShadow,
  animation,
  breakpoints,
  components,
  accessibility,
  zIndex,
  utils,
  cssVariables,
} as const;

export default designSystem;
