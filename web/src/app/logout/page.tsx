'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';

export default function LogoutPage() {
  const { logout } = useAuth();

  useEffect(() => {
    void logout();
  }, [logout]);

  return (
    <main className="flex min-h-[50vh] items-center justify-center px-4">
      <p className="text-sm text-slate-600">Signing you out...</p>
    </main>
  );
}
