'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '@/hooks/useMobileLayout';

// Touch-optimized container with gesture support
interface TouchContainerProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  hapticFeedback?: boolean;
  swipeThreshold?: number;
  longPressDelay?: number;
}

export const TouchContainer: React.FC<TouchContainerProps> = ({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onLongPress,
  hapticFeedback = false,
  swipeThreshold = 50,
  longPressDelay = 500,
}) => {
  const { isTouchDevice } = useMobileLayout();
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<number>(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const triggerHaptic = useCallback(
    (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
      if (hapticFeedback && 'vibrate' in navigator) {
        const patterns = {
          light: 10,
          medium: 20,
          heavy: [20, 10, 20],
        };
        navigator.vibrate(patterns[intensity]);
      }
    },
    [hapticFeedback]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
      setIsPressed(true);

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          triggerHaptic('medium');
          onLongPress();
          setIsPressed(false);
        }, longPressDelay);
      }
    },
    [onLongPress, longPressDelay, triggerHaptic]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      setIsPressed(false);

      // Clear long press timer
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }

      // Check for double tap
      if (onDoubleTap && deltaTime < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        if (Date.now() - lastTap.current < 300) {
          triggerHaptic('light');
          onDoubleTap();
          lastTap.current = 0;
          return;
        }
        lastTap.current = Date.now();
        return;
      }

      // Check for swipe gestures
      if (Math.abs(deltaX) > swipeThreshold || Math.abs(deltaY) > swipeThreshold) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            triggerHaptic('light');
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            triggerHaptic('light');
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            triggerHaptic('light');
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            triggerHaptic('light');
            onSwipeUp();
          }
        }
      }

      touchStart.current = null;
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onDoubleTap, swipeThreshold, triggerHaptic]
  );

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    touchStart.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  if (!isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={cn(
        'touch-manipulation select-none',
        isPressed && 'transition-transform duration-75 scale-[0.98]',
        className
      )}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </div>
  );
};

// Touch-optimized card with swipe gestures
interface SwipeableCardProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  leftAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    color: string;
    label: string;
  };
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  leftAction,
  rightAction,
  disabled = false,
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiming, setIsSwiming] = useState(false);
  const touchStart = useRef<{ x: number; time: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;

      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        time: Date.now(),
      };
      setIsSwiming(true);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || disabled) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStart.current.x;

      // Limit swipe range
      const maxSwipe = 100;
      const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
      setSwipeOffset(clampedDelta);
    },
    [disabled]
  );

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || disabled) return;

    const threshold = 60;

    if (swipeOffset > threshold && onSwipeRight) {
      onSwipeRight();
    } else if (swipeOffset < -threshold && onSwipeLeft) {
      onSwipeLeft();
    }

    // Reset state
    setSwipeOffset(0);
    setIsSwiming(false);
    touchStart.current = null;
  }, [swipeOffset, onSwipeLeft, onSwipeRight, disabled]);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Background actions */}
      {(leftAction || rightAction) && (
        <div className="absolute inset-0 flex">
          {rightAction && (
            <div className={cn('flex-1 flex items-center justify-start pl-4', rightAction.color)}>
              <div className="flex items-center space-x-2">
                {rightAction.icon}
                <span className="text-sm font-medium">{rightAction.label}</span>
              </div>
            </div>
          )}
          {leftAction && (
            <div className={cn('flex-1 flex items-center justify-end pr-4', leftAction.color)}>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{leftAction.label}</span>
                {leftAction.icon}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main card content */}
      <div
        ref={cardRef}
        className={cn(
          'relative bg-white transition-transform duration-200',
          isSwiming ? 'transition-none' : '',
          className
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
};

// Pull-to-refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 100,
  className,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const touchStart = useRef<number>(0);
  const scrollContainer = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollContainer.current || scrollContainer.current.scrollTop > 0) return;
    touchStart.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!scrollContainer.current || scrollContainer.current.scrollTop > 0 || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStart.current;

      if (deltaY > 0) {
        e.preventDefault();
        const distance = Math.min(deltaY * 0.5, refreshThreshold * 1.5);
        setPullDistance(distance);
        setCanRefresh(distance >= refreshThreshold);
      }
    },
    [refreshThreshold, isRefreshing]
  );

  const handleTouchEnd = useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);

      if ('vibrate' in navigator) {
        navigator.vibrate(20);
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setCanRefresh(false);
    touchStart.current = 0;
  }, [canRefresh, isRefreshing, onRefresh]);

  const refreshProgress = Math.min(pullDistance / refreshThreshold, 1);
  const showRefreshIndicator = pullDistance > 20;

  return (
    <div className={cn('relative', className)}>
      {/* Refresh indicator */}
      {showRefreshIndicator && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary/10 transition-all duration-200 z-10"
          style={{
            height: `${Math.min(pullDistance, refreshThreshold)}px`,
            transform: `translateY(-${Math.max(0, refreshThreshold - pullDistance)}px)`,
          }}
        >
          <div className="flex items-center space-x-2 text-primary">
            <div
              className={cn(
                'w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full transition-transform duration-200',
                isRefreshing ? 'animate-spin' : '',
                canRefresh && !isRefreshing ? 'rotate-180' : ''
              )}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`,
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing
                ? 'Refreshing...'
                : canRefresh
                  ? 'Release to refresh'
                  : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        ref={scrollContainer}
        className="relative overflow-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateY(${isRefreshing ? refreshThreshold : pullDistance}px)`,
          transition: isRefreshing || pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Touch-optimized input with better mobile UX
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helpText?: string;
  icon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const TouchInput: React.FC<TouchInputProps> = ({
  label,
  error,
  helpText,
  icon,
  clearable = false,
  onClear,
  className,
  value,
  onChange,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = useCallback(() => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    }

    if (inputRef.current) {
      inputRef.current.focus();
    }

    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [onClear, onChange]);

  return (
    <div className="space-y-2">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        <input
          ref={inputRef}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            // Base styles
            'w-full px-3 py-3 text-mobile-optimized border border-gray-300 rounded-lg',
            'bg-white text-gray-900 placeholder-gray-500',
            'transition-all duration-200',
            // Focus styles
            'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
            // Touch optimization
            'touch-manipulation min-h-touch-target',
            // Icon spacing
            icon && 'pl-10',
            clearable && value && 'pr-10',
            // Error styles
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            // Custom styles
            className
          )}
          {...props}
        />

        {clearable && value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
            aria-label="Clear input"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {helpText && !error && <p className="text-sm text-gray-500">{helpText}</p>}
    </div>
  );
};
