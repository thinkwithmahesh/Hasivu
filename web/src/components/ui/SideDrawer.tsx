// web/src/components/ui/SideDrawer.tsx
'use client';

import { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export function SideDrawer({
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
            className="fixed inset-0 z-50 bg-black/30"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-label="Close drawer"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-y-0 right-0 z-[60] w-full max-w-md bg-white p-4 shadow-[var(--pm-shadow-xl)]"
          >
            <h2 className="mb-4 text-[18px] font-bold">{title}</h2>
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
