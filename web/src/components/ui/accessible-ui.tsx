'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// ===== Accessibility Context =====
interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  screenReaderMode: boolean;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}

// ===== Accessibility Provider =====
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [screenReaderMode, setScreenReaderMode] = useState(false);
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    motionQuery.addEventListener('change', handleMotionChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(contrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    // Detect screen reader usage
    const detectScreenReader = () => {
      // Screen reader detection heuristics
      const hasAriaLive = document.querySelectorAll('[aria-live]').length > 0;
      const hasScreenReaderElements = document.querySelectorAll('.sr-only').length > 0;
      setScreenReaderMode(hasAriaLive || hasScreenReaderElements);
    };

    detectScreenReader();

    // Check periodically for screen reader elements
    const screenReaderInterval = setInterval(detectScreenReader, 5000);

    return () => {
      motionQuery.removeEventListener('change', handleMotionChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
      clearInterval(screenReaderInterval);
    };
  }, []);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        announceToScreenReader,
        isReducedMotion,
        isHighContrast,
        screenReaderMode,
      }}
    >
      {children}
      {/* Screen reader announcements */}
      <div ref={announcerRef} className="sr-only" aria-live="polite" aria-atomic="true" />
    </AccessibilityContext.Provider>
  );
}

// ===== Screen Reader Only Content =====
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return <span className={cn('sr-only', className)}>{children}</span>;
}

// ===== Skip Link =====
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50',
        'bg-blue-600 text-white px-4 py-2 rounded-md font-medium',
        'hover:bg-blue-700 transition-colors',
        className
      )}
    >
      {children}
    </a>
  );
}

// ===== Focusable Region =====
interface FocusableRegionProps {
  children: React.ReactNode;
  label: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  role?: string;
}

export function FocusableRegion({
  children,
  label,
  className,
  as: Component = 'div',
  role = 'region',
}: FocusableRegionProps) {
  return (
    <Component
      role={role}
      aria-label={label}
      tabIndex={-1}
      className={cn(
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md',
        className
      )}
    >
      {children}
    </Component>
  );
}

// ===== Role-based Context =====
interface RoleContextProps {
  role: 'student' | 'parent' | 'admin' | 'kitchen' | 'vendor' | 'school_admin';
  children: React.ReactNode;
}

export function RoleContext({ role, children }: RoleContextProps) {
  const { announceToScreenReader } = useAccessibility();

  useEffect(() => {
    const roleLabels = {
      student: 'Student Dashboard',
      parent: 'Parent Dashboard',
      admin: 'Administrator Dashboard',
      kitchen: 'Kitchen Staff Dashboard',
      vendor: 'Vendor Dashboard',
      school_admin: 'School Administrator Dashboard',
    };

    announceToScreenReader(`Navigated to ${roleLabels[role]}`);
  }, [role, announceToScreenReader]);

  return (
    <div role="main" aria-label={`${role} dashboard`} className="focus:outline-none">
      {children}
    </div>
  );
}

// ===== Accessible Form Field =====
interface AccessibleFormFieldProps {
  children: React.ReactNode;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

export function AccessibleFormField({
  children,
  label,
  description,
  error,
  required = false,
  className,
}: AccessibleFormFieldProps) {
  const fieldId = React.useId();
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <div id={descriptionId} className="text-sm text-slate-600">
          {description}
        </div>
      )}

      <div>
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': [descriptionId, errorId].filter(Boolean).join(' '),
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required,
        })}
      </div>

      {error && (
        <div id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

// ===== Accessibility Announcer =====
interface AccessibilityAnnouncerProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

export function AccessibilityAnnouncer({
  message,
  priority = 'polite',
  clearAfter = 1000,
}: AccessibilityAnnouncerProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  return (
    <div aria-live={priority} aria-atomic="true" className="sr-only">
      {currentMessage}
    </div>
  );
}

// ===== High Contrast Support =====
interface HighContrastProps {
  children: React.ReactNode;
  className?: string;
}

export function HighContrastProvider({ children, className }: HighContrastProps) {
  const { isHighContrast } = useAccessibility();

  return (
    <div
      className={cn(
        isHighContrast && [
          'high-contrast',
          // Force higher contrast styles
          '[&_*]:border-black [&_*]:text-black',
          '[&_button]:bg-black [&_button]:text-white [&_button]:border-2 [&_button]:border-black',
          '[&_input]:border-2 [&_input]:border-black [&_input]:bg-white [&_input]:text-black',
          '[&_a]:text-blue-800 [&_a]:underline [&_a:visited]:text-purple-800',
        ],
        className
      )}
    >
      {children}
    </div>
  );
}

// ===== Motion Sensitive Component =====
interface MotionSensitiveProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export function MotionSensitive({ children, fallback, className }: MotionSensitiveProps) {
  const { isReducedMotion } = useAccessibility();

  if (isReducedMotion && fallback) {
    return <div className={className}>{fallback}</div>;
  }

  return (
    <div
      className={cn(
        isReducedMotion && 'motion-reduce:transition-none motion-reduce:animate-none',
        className
      )}
    >
      {children}
    </div>
  );
}

// ===== Focus Trap =====
interface FocusTrapProps {
  children: React.ReactNode;
  enabled?: boolean;
  className?: string;
}

export function FocusTrap({ children, enabled = true, className }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    // Focus first element when trap is enabled
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// ===== Keyboard Navigation Helper =====
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onEscape?: () => void;
  onEnter?: () => void;
  className?: string;
}

export function KeyboardNavigation({
  children,
  onEscape,
  onEnter,
  className,
}: KeyboardNavigationProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        onEnter?.();
        break;
    }
  };

  return (
    <div onKeyDown={handleKeyDown} className={className}>
      {children}
    </div>
  );
}

// ===== Live Region for Dynamic Content =====
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  priority = 'polite',
  atomic = true,
  className,
}: LiveRegionProps) {
  return (
    <div aria-live={priority} aria-atomic={atomic} className={className}>
      {children}
    </div>
  );
}

// ===== Custom Hooks =====

// Hook for managing focus
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);

  const saveFocus = () => {
    setFocusedElement(document.activeElement as HTMLElement);
  };

  const restoreFocus = () => {
    if (focusedElement && document.contains(focusedElement)) {
      focusedElement.focus();
    }
  };

  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      setFocusedElement(element);
    }
  };

  return { saveFocus, restoreFocus, focusElement };
}

// Hook for reduced motion detection
export function useReducedMotion() {
  const { isReducedMotion } = useAccessibility();
  return isReducedMotion;
}

// Hook for high contrast detection
export function useHighContrast() {
  const { isHighContrast } = useAccessibility();
  return isHighContrast;
}
