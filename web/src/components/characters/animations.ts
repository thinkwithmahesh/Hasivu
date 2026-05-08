'use client';

import type { Variants, Transition } from 'framer-motion';

// ─── SPRING CONFIGS ─────────────────────────────────────────────────────
export const SPRING_PLAYFUL: Transition = { type: 'spring', stiffness: 300, damping: 15 };
export const SPRING_GENTLE: Transition = { type: 'spring', stiffness: 200, damping: 25 };
export const SPRING_BOUNCY: Transition = { type: 'spring', stiffness: 400, damping: 10 };
export const SPRING_SETTLE: Transition = { type: 'spring', stiffness: 150, damping: 20 };

// ─── PAGE TRANSITIONS ──────────────────────────────────────────────────
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...SPRING_GENTLE, duration: 0.5 },
  },
  exit: { opacity: 0, y: -10, filter: 'blur(2px)', transition: { duration: 0.3 } },
};

// ─── STAGGERED LISTS ────────────────────────────────────────────────────
export const containerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: SPRING_GENTLE,
  },
};

// ─── CHARACTER ANIMATION VARIANTS ───────────────────────────────────────

/** Character breathing — subtle idle loop */
export const breatheVariants: Variants = {
  idle: {
    scale: [1, 1.02, 1],
    transition: {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

/** Peeking from behind elements (Aarav, Benny) */
export const peekVariants: Variants = {
  hidden: {
    y: 20,
    opacity: 0,
    scale: 0.9,
  },
  peek: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { ...SPRING_PLAYFUL, delay: 0.3 },
  },
  duck: {
    y: 20,
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
};

/** Celebration jump (Success state) */
export const celebrateVariants: Variants = {
  rest: { y: 0 },
  celebrate: {
    y: [0, -20, 0, -10, 0],
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
};

/** Dash across screen (Priya) */
export const dashVariants: Variants = {
  offscreen: { x: '-100%', opacity: 0 },
  onscreen: {
    x: 0,
    opacity: 1,
    transition: { ...SPRING_BOUNCY, duration: 0.6 },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.4 },
  },
};

/** Wave animation (Benny goodbye) */
export const waveVariants: Variants = {
  rest: { rotate: 0 },
  wave: {
    rotate: [0, 14, -8, 14, -4, 10, 0],
    transition: {
      duration: 1.2,
      ease: 'easeInOut',
    },
  },
};

/** Nod animation (Meera approval) */
export const nodVariants: Variants = {
  rest: { rotate: 0 },
  nod: {
    rotate: [0, -5, 5, -3, 3, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

/** Stir animation (Rajan cooking) */
export const stirVariants: Variants = {
  rest: { rotate: 0 },
  stir: {
    rotate: [0, 15, -15, 10, -10, 5, 0],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ─── SECTION REVEAL ─────────────────────────────────────────────────────
export const sectionRevealVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...SPRING_SETTLE, duration: 0.6 },
  },
};

// ─── CARD HOVER ─────────────────────────────────────────────────────────
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(255, 107, 53, 0.06), 0 1px 2px rgba(0,0,0,0.04)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 12px 32px rgba(255, 107, 53, 0.12), 0 4px 8px rgba(0,0,0,0.04)',
    transition: SPRING_GENTLE,
  },
};

// ─── REDUCED MOTION HELPER ──────────────────────────────────────────────
export const getReducedMotionVariants = (variants: Variants): Variants => {
  const reduced: Variants = {};
  for (const key of Object.keys(variants)) {
    const variant = variants[key];
    if (typeof variant === 'object' && variant !== null && !Array.isArray(variant)) {
      reduced[key] = {
        opacity: ((variant as Record<string, unknown>).opacity as number | undefined) ?? 1,
        transition: { duration: 0.2 },
      };
    }
  }
  return reduced;
};
