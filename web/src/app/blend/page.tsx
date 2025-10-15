import React from 'react';
import HybridLandingPage from '@/components/landing/HybridLandingPage';

export const metadata = {
  title: 'HASIVU — Hybrid Landing',
  description:
    'Startwell content hierarchy blended with a minimal, typography-first layout influenced by Sprrrint.',
  openGraph: {
    title: 'HASIVU — Hybrid Landing',
    description:
      'Startwell content hierarchy blended with a minimal, typography-first layout influenced by Sprrrint.',
    images: [{ url: '/og/hybrid.svg', width: 1200, height: 630, alt: 'HASIVU — Hybrid' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HASIVU — Hybrid Landing',
    description:
      'Startwell content hierarchy blended with a minimal, typography-first layout influenced by Sprrrint.',
    images: ['/og/hybrid.svg'],
  },
};

export default function Page() {
  return <HybridLandingPage />;
}
