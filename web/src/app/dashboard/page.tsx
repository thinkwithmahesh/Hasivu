'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/contexts/auth-context';
import { getDashboardUrlForRole } from '@/lib/dashboard-urls';

export default function DashboardPage() {
  const reduced = useReducedMotion();
  const router = useRouter();
  const { user, isLoading, isInitialized } = useAuth();

  useEffect(() => {
    if (!isInitialized || isLoading) {
      return;
    }

    if (!user) {
      router.replace('/auth/login');
      return;
    }

    router.replace(getDashboardUrlForRole(String(user.role)));
  }, [isInitialized, isLoading, router, user]);

  return (
    <LazyMotion features={domAnimation}>
      <m.main
        aria-label="Dashboard"
        className="min-h-screen bg-[var(--hasivu-bg)]"
        initial={reduced ? undefined : { opacity: 0, y: 12 }}
        animate={reduced ? undefined : { opacity: 1, y: 0 }}
        transition={reduced ? { duration: 0 } : { duration: 0.35 }}
      >
        <div className="flex min-h-screen items-center justify-center px-6 text-center">
          <div className="rounded-3xl border border-[var(--hasivu-border)] bg-white p-8 shadow-[var(--hasivu-shadow-md)]">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[var(--hasivu-secondary)]" />
            <h1 className="text-xl font-semibold text-[var(--hasivu-text)]">
              Opening your dashboard
            </h1>
            <p className="mt-2 text-sm text-[var(--hasivu-text-muted)]">
              We are routing you to the workspace for your signed-in role.
            </p>
          </div>
        </div>
      </m.main>
    </LazyMotion>
  );
}
