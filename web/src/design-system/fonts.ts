import { Nunito, Nunito_Sans, Instrument_Serif } from 'next/font/google';

export const fontBody = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const fontUI = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-ui',
  display: 'swap',
});

export const fontHero = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hero',
  display: 'swap',
});

export const fontVariables = `${fontBody.variable} ${fontUI.variable} ${fontHero.variable}`;

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

export const lineHeights = {
  ui: 1.3,
  heading: 1.4,
  body: 1.6,
} as const;
