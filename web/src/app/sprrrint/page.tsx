import React from 'react';
import SprrrintInspiredLandingPage from '@/components/landing/SprrrintInspiredLandingPage';

export const metadata = {
  title: 'HASIVU — Sprrrint-inspired Landing',
  description: 'A minimal, typography-first landing focused on clarity and conversion.',
  openGraph: {
    title: 'HASIVU — Sprrrint-inspired Landing',
    description: 'A minimal, typography-first landing focused on clarity and conversion.',
    images: [
      { url: '/og/sprrrint.svg', width: 1200, height: 630, alt: 'HASIVU — Sprrrint-inspired' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HASIVU — Sprrrint-inspired Landing',
    description: 'A minimal, typography-first landing focused on clarity and conversion.',
    images: ['/og/sprrrint.svg'],
  },
};

export default function Page() {
  return <SprrrintInspiredLandingPage />;
}
