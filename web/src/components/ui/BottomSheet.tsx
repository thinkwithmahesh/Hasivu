'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const dragControls = useDragControls();
  const contentRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-pm-surface-1 rounded-t-[24px] shadow-xl border-t border-pm-neutral-200 flex flex-col will-change-transform max-h-[90vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.8 }}
            onDragEnd={(e, info) => {
              if (info.velocity.y > 200 || info.offset.y > 100) {
                onClose();
              }
            }}
          >
            {/* Drag Handle Area */}
            <div
              className="w-full flex justify-center py-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              onPointerDown={e => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 bg-pm-neutral-200 rounded-full" />
            </div>

            {title && (
              <div className="px-6 py-2 pb-4 text-center">
                <h2 className="font-hero text-[24px] text-pm-text-primary leading-tight">
                  {title}
                </h2>
              </div>
            )}

            <div ref={contentRef} className="px-6 pb-6 overflow-y-auto block touch-pan-y">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
