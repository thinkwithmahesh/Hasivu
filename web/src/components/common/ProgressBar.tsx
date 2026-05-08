'use client';

import React, { useEffect, useRef, useState } from 'react';

export interface ProgressBarProps {
  visible?: boolean;
  progress?: number;
  duration?: number;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  height?: number;
  showGlow?: boolean;
  showShimmer?: boolean;
  showPulse?: boolean;
  zIndex?: number;
  top?: number;
  smooth?: boolean;
  minimum?: number;
  maximum?: number;
}

export interface ProgressBarContextType {
  start: (duration?: number) => void;
  finish: () => void;
  set: (progress: number) => void;
  increment: (amount?: number) => void;
  isVisible: boolean;
  progress: number;
}

const ProgressBarContext = React.createContext<ProgressBarContextType | null>(null);

export const useProgressBar = (): ProgressBarContextType => {
  const context = React.useContext(ProgressBarContext);
  if (!context) {
    throw new Error('useProgressBar must be used within a ProgressBarProvider');
  }
  return context;
};

export interface ProgressBarProviderProps {
  children: React.ReactNode;
  config?: Partial<ProgressBarProps>;
}

export const ProgressBarProvider: React.FC<ProgressBarProviderProps> = ({ children, config = {} }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const incrementTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (incrementTimerRef.current) clearInterval(incrementTimerRef.current);
  };

  const start = (duration: number = 2000) => {
    clearTimers();
    setProgress(0);
    setIsVisible(true);
    const intervalDuration = duration / 20;
    incrementTimerRef.current = setInterval(() => {
      setProgress(current => {
        if (current >= 90) {
          if (incrementTimerRef.current) clearInterval(incrementTimerRef.current);
          return 90;
        }
        return current + 6;
      });
    }, intervalDuration);
  };

  const finish = () => {
    if (incrementTimerRef.current) clearInterval(incrementTimerRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 400);
  };

  const set = (newProgress: number) => {
    const clampedProgress = Math.min(Math.max(newProgress, 0), 100);
    setProgress(clampedProgress);
    if (!isVisible && clampedProgress > 0) setIsVisible(true);
  };

  const increment = (amount: number = 5) => setProgress(prev => Math.min(prev + amount, 90));

  useEffect(() => clearTimers, []);

  return (
    <ProgressBarContext.Provider value={{ start, finish, set, increment, isVisible, progress }}>
      {children}
      <ProgressBar visible={isVisible} progress={progress} showGlow showShimmer {...config} />
    </ProgressBarContext.Provider>
  );
};

const colorClasses: Record<NonNullable<ProgressBarProps['color']>, string> = {
  primary: 'bg-emerald-600',
  secondary: 'bg-orange-500',
  success: 'bg-emerald-600',
  warning: 'bg-amber-500',
  error: 'bg-red-600',
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  visible = false,
  progress = 0,
  duration = 300,
  color = 'primary',
  height = 3,
  showGlow = false,
  showShimmer = false,
  showPulse = false,
  zIndex = 2000,
  top = 0,
  smooth = true,
  minimum = 5,
  maximum = 100,
}) => {
  const clampedProgress = Math.min(Math.max(progress, minimum), maximum);
  const displayProgress = visible && progress > 0 ? clampedProgress : 0;

  if (!visible && displayProgress === 0) return null;

  return (
    <div
      aria-hidden={!visible}
      className="fixed left-0 right-0 overflow-hidden bg-emerald-100"
      style={{ top, zIndex, height }}
    >
      <div
        className={[
          'relative h-full rounded-r-full',
          colorClasses[color],
          smooth ? 'transition-[width] ease-out' : '',
          showGlow ? 'shadow-[0_0_18px_rgba(22,163,74,0.55)]' : '',
          showPulse ? 'animate-pulse' : '',
        ].join(' ')}
        style={{ width: `${displayProgress}%`, transitionDuration: `${duration}ms` }}
      >
        {showShimmer && (
          <span className="absolute inset-0 block translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        )}
      </div>
    </div>
  );
};

export const useRouterProgress = () => {
  const progressBar = useProgressBar();

  useEffect(() => {
    const handlePopState = () => {
      progressBar.start();
      setTimeout(() => progressBar.finish(), 500);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [progressBar]);

  return progressBar;
};

export default ProgressBar;

declare global {
  interface Window {
    next?: {
      router?: {
        events: {
          on: (event: string, handler: () => void) => void;
          off: (event: string, handler: () => void) => void;
        };
      };
    };
  }
}
