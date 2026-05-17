export const fontFamilies = {
  body: ['var(--font-body)', 'Nunito', 'system-ui', 'sans-serif'],
  ui: ['var(--font-ui)', 'Nunito', 'system-ui', 'sans-serif'],
  hero: ['var(--font-hero)', 'Instrument Serif', 'Georgia', 'serif'],
} as const;

export const typographyScale = {
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
} as const;

export const fontWeights = {
  regular: 400,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  ui: 1.3,
  heading: 1.4,
  body: 1.6,
} as const;
