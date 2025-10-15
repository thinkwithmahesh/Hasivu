'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/components/auth/AuthLayout';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
  }, [error]);

  return (
    <AuthLayout
      title="Something went wrong"
      description="We encountered an error while loading this page"
    >
      <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-sm border">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-sm text-gray-600 mb-4">
            {error.message || 'An unexpected error occurred'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button onClick={reset} variant="default" className="px-4 py-2">
            Try again
          </Button>

          <Link href="/">
            <Button variant="outline" className="px-4 py-2">
              Go home
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
