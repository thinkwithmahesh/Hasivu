import React from 'react';
import StartwellInspiredLandingPage from '@/components/landing/StartwellInspiredLandingPage';

export const metadata = {
  title: 'School Meals Done Right — HASIVU',
  description: 'Order warm, nutritious school meals delivered to the classroom. Flexible subscriptions you can change, pause, or cancel by midnight.',
  openGraph: {
    title: 'School Meals Done Right — HASIVU',
    description: 'Order warm, nutritious school meals delivered to the classroom. Flexible subscriptions you can change, pause, or cancel by midnight.',
    images: [
      { url: '/og/home.png', width: 1200, height: 630, alt: 'HASIVU — School meals done right' },
      { url: '/og/home.svg', width: 1200, height: 630, alt: 'HASIVU — School meals done right (SVG placeholder)' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'School Meals Done Right — HASIVU',
    description: 'Order warm, nutritious school meals delivered to the classroom. Flexible subscriptions you can change, pause, or cancel by midnight.',
    images: ['/og/home.png'],
  },
};

export default function HomePage() {
  return (
    <StartwellInspiredLandingPage />
  );
}
