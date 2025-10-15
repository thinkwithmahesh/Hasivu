import type { Metadata } from 'next';
import { generateBaseMetadata } from '@/lib/seo';

// Generate auth-specific metadata
export const metadata: Metadata = {
  ...generateBaseMetadata(),
  title: {
    default: 'Login - HASIVU School Meal Management',
    template: '%s | HASIVU Auth',
  },
  description:
    'Sign in to access your HASIVU school meal management account. Secure authentication for students, parents, teachers, and administrators.',
  robots: 'noindex, nofollow', // Don't index auth pages
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
