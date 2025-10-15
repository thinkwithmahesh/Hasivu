'use client';

import React, { forwardRef, type ComponentProps } from 'react';
import { cn } from '@/lib/utils';

// Mobile optimization constants
const MOBILE_TOUCH_TARGET_SIZE = 44; // Minimum 44px for accessibility
const _MOBILE_BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
};

// ===== Mobile Optimized Wrapper =====
interface MobileOptimizedProps {
  children: React.ReactNode;
  className?: string;
  touchOptimized?: boolean;
  oneHandedMode?: boolean;
}

export function MobileOptimized({
  children,
  className,
  touchOptimized = true,
  oneHandedMode = false,
}: MobileOptimizedProps) {
  return (
    <div
      className={cn(
        'relative',
        touchOptimized && 'touch-manipulation select-none',
        oneHandedMode && 'pb-safe-bottom', // Safe area for one-handed use
        className
      )}
      style={{
        // Optimize for touch
        touchAction: touchOptimized ? 'manipulation' : 'auto',
        // Prevent zoom on inputs
        fontSize: '16px',
      }}
    >
      {children}
    </div>
  );
}

// ===== Mobile Button =====
interface MobileButtonProps extends ComponentProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  touchOptimized?: boolean;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      touchOptimized = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      // Base styles
      'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',

      // Touch optimization
      touchOptimized && 'active:scale-95 active:bg-opacity-80',

      // Ensure minimum touch target
      'min-h-[44px] min-w-[44px]',

      // Variant styles
      {
        'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm hover:from-blue-700 hover:to-blue-800 focus-visible:ring-blue-500':
          variant === 'primary',
        'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-500':
          variant === 'secondary',
        'border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-500':
          variant === 'outline',
        'text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-500': variant === 'ghost',
      },

      // Size styles
      {
        'px-3 py-2 text-sm': size === 'sm',
        'px-4 py-2.5 text-base': size === 'md',
        'px-6 py-3 text-lg': size === 'lg',
      },

      // Width
      fullWidth && 'w-full',

      className
    );

    return (
      <button
        ref={ref}
        className={baseClasses}
        style={{
          minHeight: `${MOBILE_TOUCH_TARGET_SIZE}px`,
          minWidth: `${MOBILE_TOUCH_TARGET_SIZE}px`,
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';

// ===== Mobile Input =====
interface MobileInputProps extends ComponentProps<'input'> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  touchOptimized?: boolean;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, icon, touchOptimized = true, type = 'text', ...props }, ref) => {
    // Optimize input type for mobile keyboards
    const optimizedType = React.useMemo(() => {
      if (type === 'email') return 'email';
      if (type === 'tel') return 'tel';
      if (type === 'url') return 'url';
      if (type === 'number') return 'number';
      return type;
    }, [type]);

    const inputClasses = cn(
      // Base styles
      'w-full rounded-lg border border-slate-300 bg-white px-4 py-3',
      'text-base text-slate-900 placeholder:text-slate-500',
      'transition-colors duration-200',

      // Focus styles
      'focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none',

      // Error styles
      error && 'border-red-500 focus:border-red-500 focus:ring-red-500',

      // Touch optimization
      touchOptimized && 'min-h-[44px]',

      // Icon spacing
      icon && 'pl-12',

      className
    );

    return (
      <div className="space-y-2">
        {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}

        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</div>
          )}

          <input
            ref={ref}
            type={optimizedType}
            className={inputClasses}
            style={{
              fontSize: '16px', // Prevent zoom on iOS
              minHeight: `${MOBILE_TOUCH_TARGET_SIZE}px`,
            }}
            // Mobile-specific attributes
            autoCapitalize={type === 'email' ? 'none' : 'sentences'}
            autoCorrect={type === 'email' || type === 'password' ? 'off' : 'on'}
            spellCheck={type === 'email' || type === 'password' ? false : true}
            inputMode={
              type === 'email'
                ? 'email'
                : type === 'tel'
                  ? 'tel'
                  : type === 'number'
                    ? 'numeric'
                    : type === 'url'
                      ? 'url'
                      : 'text'
            }
            {...props}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// ===== Touch Gesture Handler =====
interface TouchGestureProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  className?: string;
}

export function TouchGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onTap,
  onLongPress,
  swipeThreshold = 50,
  longPressDelay = 500,
  className,
}: TouchGestureProps) {
  const touchStart = React.useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout>();

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start long press timer
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
      }, longPressDelay);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;

    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStart.current.time;

    // Check for tap (quick touch with minimal movement)
    if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
      onTap?.();
      return;
    }

    // Check for swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > swipeThreshold) {
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > swipeThreshold) {
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }

    touchStart.current = null;
  };

  const handleTouchMove = () => {
    // Clear long press timer on move
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <div
      className={cn('touch-manipulation', className)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {children}
    </div>
  );
}

// ===== Mobile Card =====
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  pressable?: boolean;
  onPress?: () => void;
}

export function MobileCard({ children, className, pressable = false, onPress }: MobileCardProps) {
  const cardClasses = cn(
    'bg-white rounded-xl border border-slate-200 shadow-sm',
    'p-4 space-y-3',
    pressable && [
      'cursor-pointer transition-all duration-200',
      'hover:shadow-md hover:border-slate-300',
      'active:scale-[0.98] active:shadow-sm',
    ],
    className
  );

  if (pressable) {
    return (
      <TouchGesture onTap={onPress}>
        <div className={cardClasses}>{children}</div>
      </TouchGesture>
    );
  }

  return <div className={cardClasses}>{children}</div>;
}

// ===== Mobile Navigation =====
interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onPress?: () => void;
}

export function MobileNavItem({ icon, label, active = false, badge, onPress }: MobileNavItemProps) {
  return (
    <TouchGesture onTap={onPress}>
      <div
        className={cn(
          'flex flex-col items-center justify-center p-2 rounded-lg transition-colors',
          'min-h-[44px] min-w-[44px]',
          active
            ? 'text-blue-600 bg-blue-50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        )}
      >
        <div className="relative">
          {icon}
          {badge && badge > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
              {badge > 99 ? '99+' : badge}
            </div>
          )}
        </div>
        <span className="text-xs mt-1 text-center leading-tight">{label}</span>
      </div>
    </TouchGesture>
  );
}

// ===== Mobile-Safe Layout =====
interface MobileSafeLayoutProps {
  children: React.ReactNode;
  className?: string;
  hasBottomNav?: boolean;
}

export function MobileSafeLayout({
  children,
  className,
  hasBottomNav = false,
}: MobileSafeLayoutProps) {
  return (
    <div
      className={cn(
        'min-h-screen bg-slate-50',
        // Safe area support
        'pt-safe-top',
        hasBottomNav ? 'pb-safe-bottom pb-16' : 'pb-safe-bottom',
        className
      )}
    >
      {children}
    </div>
  );
}
