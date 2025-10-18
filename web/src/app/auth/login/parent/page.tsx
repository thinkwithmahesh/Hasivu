'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';
import type { LoginFormData } from '@/components/auth/schemas';

// Safari-compatible login form with SSR disabled
const SafariCompatibleLoginForm = dynamic(
  () =>
    import('@/components/auth/SafariCompatibleLoginForm').then(mod => ({
      default: mod.SafariCompatibleLoginForm,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="h-12 bg-gray-200 rounded"></div>
        </div>
      </div>
    ),
  }
);

// Helper function to get dashboard URL based on role
  const dashboardUrls: Record<string, string> = {
    admin: '/dashboard/admin',
    teacher: '/dashboard/teacher',
    parent: '/dashboard/parent',
    student: '/dashboard/student',
    vendor: '/dashboard/vendor',
    kitchen_staff: '/dashboard/kitchen',
    school_admin: '/dashboard/school-admin',
  };

  return dashboardUrls[role] || '/dashboard';
}

export default function ParentLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSafari, setIsSafari] = useState(false);
  const { login, user: _user } = useAuth();
  const router = useRouter();

  // Detect Safari browser for compatibility
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isSafariBrowser =
      /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent);
    setIsSafari(isSafariBrowser);
  }, []);

    setIsLoading(true);
    setError(null);

    try {
      const success = await login({
        email: data.email,
        password: data.password,
      });

      if (success) {
        // Wait for auth state to update, then use the user's actual role for redirect
        setTimeout(() => {
          // Try to get user from localStorage since auth context might not be updated yet
          try {
            const savedUser = localStorage.getItem('demoUser');
            if (savedUser) {
              const parsedUser = JSON.parse(savedUser);
              const dashboardUrl = getDashboardUrl(parsedUser.role);
              router.push(dashboardUrl);
              return;
            }
          } catch (e) {}

          // Fallback to using form role
          const dashboardUrl = getDashboardUrl(data.role);
          router.push(dashboardUrl);
        }, 100);
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (_provider: 'google' | 'facebook') => {
    setError(null);
    // TODO: Implement social login
    setError('Social login is coming soon!');
  };

  return (
    <AuthLayout
      title="Parent Login - HASIVU"
      subtitle="Sign in to manage your child's meals and payments"
    >
      {isSafari ? (
        <SafariCompatibleLoginForm
          onSubmit={handleLogin}
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
          error={error}
          defaultRole={UserRole.PARENT}
          className="w-full max-w-md"
        />
      ) : (
        <LoginForm
          onSubmit={handleLogin}
          onSocialLogin={handleSocialLogin}
          isLoading={isLoading}
          error={error}
          defaultRole={'parent' as any}
          className="w-full max-w-md"
        />
      )}
    </AuthLayout>
  );
}
