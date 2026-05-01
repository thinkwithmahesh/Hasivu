import { useReducedMotion } from 'framer-motion';

export const motionDurations = {
  micro: 0.15,
  standard: 0.28,
  page: 0.42,
} as const;

export const motionEase = [0.25, 1, 0.5, 1] as const;

export const motionPresets = {
  page: {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
    transition: { duration: motionDurations.page, ease: motionEase },
  },
  panel: {
    initial: { opacity: 0, y: 14, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 10, scale: 0.98 },
    transition: { duration: motionDurations.standard, ease: motionEase },
  },
  card: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: motionDurations.standard, ease: motionEase },
  },
  listItem: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -8 },
    transition: { duration: motionDurations.standard, ease: motionEase },
  },
  tap: {
    whileTap: { scale: 0.98 },
  },
} as const;

export function useMotionPreset<T extends keyof typeof motionPresets>(name: T) {
  const reduced = useReducedMotion();

  if (!reduced) {
    return motionPresets[name];
  }

  return {
    initial: { opacity: 1 },
    animate: { opacity: 1 },
    exit: { opacity: 1 },
    transition: { duration: 0 },
  };
}

export function useMotionEnabled() {
  return !useReducedMotion();
}
