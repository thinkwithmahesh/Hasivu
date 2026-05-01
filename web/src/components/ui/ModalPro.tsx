// web/src/components/ui/ModalPro.tsx
'use client';

import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function ModalPro({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close modal"
          />
          <motion.section
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="fixed left-1/2 top-1/2 z-[60] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[16px] bg-white p-6 shadow-[var(--pm-shadow-xl)]"
          >
            <h2 className="mb-4 text-[20px] font-bold">{title}</h2>
            {children}
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
