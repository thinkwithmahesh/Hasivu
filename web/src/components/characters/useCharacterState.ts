'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type CharacterState = 'IDLE' | 'HOVER' | 'SCROLL' | 'LOADING' | 'SUCCESS';

interface UseCharacterStateOptions {
  /** Delay before returning to IDLE from SUCCESS (ms) */
  successDuration?: number;
  /** Whether to respond to scroll events */
  scrollEnabled?: boolean;
  /** Whether animations are enabled (respects prefers-reduced-motion) */
  enabled?: boolean;
}

/**
 * State machine hook for the hide-and-seek character system.
 *
 * IDLE → Characters peek from edges, subtle breathing
 * HOVER → Nearest character ducks, peeks back after 600ms
 * SCROLL → Characters run to new hiding spots
 * LOADING → Characters play peek-a-boo
 * SUCCESS → Characters celebrate, return to IDLE after duration
 */
export function useCharacterState(options: UseCharacterStateOptions = {}) {
  const { successDuration = 1500, scrollEnabled = true, enabled = true } = options;

  const [state, setState] = useState<CharacterState>('IDLE');
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useRef(false);

  // Check prefers-reduced-motion on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  }, []);

  // Scroll listener
  useEffect(() => {
    if (!scrollEnabled || !enabled || prefersReducedMotion.current) return;

    const handleScroll = () => {
      if (state === 'LOADING' || state === 'SUCCESS') return;

      setState('SCROLL');

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setState('IDLE');
      }, 300);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [scrollEnabled, enabled, state]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const setHover = useCallback(
    (hovering: boolean) => {
      if (!enabled || prefersReducedMotion.current) return;
      if (state === 'LOADING' || state === 'SUCCESS') return;
      setState(hovering ? 'HOVER' : 'IDLE');
    },
    [enabled, state]
  );

  const setLoading = useCallback(
    (loading: boolean) => {
      if (!enabled) return;
      setState(loading ? 'LOADING' : 'IDLE');
    },
    [enabled]
  );

  const triggerSuccess = useCallback(() => {
    if (!enabled) return;
    setState('SUCCESS');
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => {
      setState('IDLE');
    }, successDuration);
  }, [enabled, successDuration]);

  const reset = useCallback(() => {
    setState('IDLE');
  }, []);

  return {
    state,
    isIdle: state === 'IDLE',
    isHover: state === 'HOVER',
    isScroll: state === 'SCROLL',
    isLoading: state === 'LOADING',
    isSuccess: state === 'SUCCESS',
    setHover,
    setLoading,
    triggerSuccess,
    reset,
    prefersReducedMotion: prefersReducedMotion.current,
  };
}
