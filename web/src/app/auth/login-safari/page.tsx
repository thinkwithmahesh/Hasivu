'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/contexts/auth-context';
import type { LoginFormData } from '@/components/auth/schemas';

// Helper function to get dashboard URL based on role
function getDashboardUrl(role: string): string {
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

export default function SafariLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, user: _user } = useAuth();
  const router = useRouter();

  const handleLogin = async (data: LoginFormData & { role: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await login({
        email: data.email,
        password: data.password,
        role: data.role,
        rememberMe: data.rememberMe || false,
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
      title="Welcome Back to HASIVU (Safari)"
      description="Safari-compatible login for school meal account"
    >
      <LoginForm
        onSubmit={handleLogin}
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
        error={error}
        className="w-full max-w-md"
        showRoleSelection={false}
        defaultRole="student"
        showSocialLogin={false}
      />
    </AuthLayout>
  );
}
