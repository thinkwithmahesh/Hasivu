export const colors = {
  primary: {
    50: '#FFF8F0',
    100: '#FFECD4',
    200: '#FFD9A8',
    400: '#FF9A3C',
    600: '#E07020',
    800: '#7A3A08',
    900: '#3D1C04',
  },
  secondary: {
    50: '#F0FAF4',
    100: '#D4F0DE',
    200: '#A8E0BC',
    400: '#3CAF6A',
    600: '#207040',
    800: '#0A3A1C',
    900: '#041D0E',
  },
  neutral: {
    50: '#FAF9F7',
    100: '#F2EFE9',
    200: '#E4DFD6',
    400: '#9E9589',
    600: '#5C554A',
    800: '#2A2520',
    900: '#141210',
  },
  semantic: {
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  },
  background: {
    page: '#FAF9F7',
    surface1: '#FFFFFF',
    surface2: '#F2EFE9',
    surface3: '#E4DFD6',
  },
  text: {
    primary: '#141210',
    secondary: '#5C554A',
    tertiary: '#9E9589',
    inverse: '#FFFFFF',
  },
} as const;

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
  section: {
    v: '64px',
    h: '24px',
    vMobile: '40px',
    hMobile: '16px',
  },
} as const;

export const radius = {
  xs: '2px', // table cells, tags
  sm: '6px', // inputs, small buttons
  md: '10px', // standard cards
  lg: '16px', // large cards, modals, drawers
  xl: '24px', // floating panels, bottom sheets
  pill: '999px', // pill badges, avatar circles
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 3px rgba(20,18,16,0.06)',
  md: '0 4px 12px rgba(20,18,16,0.08)',
  lg: '0 8px 32px rgba(20,18,16,0.12)',
  xl: '0 16px 48px rgba(20,18,16,0.16)',
} as const;

export const motionTokens = {
  micro: { duration: 0.15, ease: 'easeOut' },
  standard: { duration: 0.3, ease: [0.25, 1, 0.5, 1] },
  page: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  spring: { type: 'spring', stiffness: 320, damping: 28 },
  stagger: 0.06,
  reduced: { duration: 0, stagger: 0, spring: { stiffness: 1000, damping: 1000 } },
} as const;

export const typography = {
  families: {
    body: 'Nunito',
    ui: 'Nunito',
    hero: 'Instrument Serif',
  },
  scale: {
    11: '11px',
    12: '12px',
    13: '13px',
    14: '14px',
    16: '16px',
    18: '18px',
    20: '20px',
    24: '24px',
    30: '30px',
    36: '36px',
    48: '48px',
    60: '60px',
  },
  weights: {
    regular: 400,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    heading: 1.4,
    body: 1.6,
    ui: 1.3,
  },
} as const;

export const dietaryFlags = {
  veg: { color: colors.semantic.success, label: 'VEG' },
  nonVeg: { color: colors.semantic.danger, label: 'NON-VEG' },
  nuts: { color: colors.semantic.warning, label: 'NUTS' },
  gf: { color: colors.semantic.info, label: 'GF' },
  df: { color: colors.neutral[400], label: 'DF' },
} as const;
