'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { useAuth } from '@/contexts/auth-context';
import type { LoginFormData } from '@/components/auth/schemas';

export default function StudentLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await login({
        email: data.email,
        password: data.password,
      });

      if (!success) {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Student Login"
      subtitle="Browse meals, track orders, and confirm RFID meal pickup"
    >
      <LoginForm
        onSubmit={handleLogin}
        isLoading={isLoading}
        error={error}
        className="w-full max-w-md"
        showRoleSelection={false}
        showSocialLogin={false}
        defaultRole="student"
      />
    </AuthLayout>
  );
}
