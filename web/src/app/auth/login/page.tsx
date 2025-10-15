'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/contexts/auth-context';
import type { LoginFormData } from '@/components/auth/schemas';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

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
        // Redirect will be handled by the auth context
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
      title="Welcome Back to HASIVU"
      description="Sign in to manage your school meal account and orders"
    >
      <LoginForm
        onSubmit={handleLogin}
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
        error={error}
        className="w-full max-w-md"
      />
    </AuthLayout>
  );
}
