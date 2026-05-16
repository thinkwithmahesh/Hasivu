// web/src/components/ui/ToastPro.tsx
'use client';

import { motion } from 'framer-motion';

type Kind = 'success' | 'warning' | 'error' | 'info';

const classByKind: Record<Kind, string> = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-[var(--hasivu-primary)]/10 text-[var(--hasivu-primary-dark)]',
};

export function ToastPro({ message, kind = 'info' }: { message: string; kind?: Kind }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-[10px] px-3 py-2 text-[13px] font-semibold ${classByKind[kind]}`}
    >
      {message}
    </motion.div>
  );
}
