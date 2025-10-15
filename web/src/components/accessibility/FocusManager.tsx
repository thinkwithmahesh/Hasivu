/**
 * Focus Management Components and Hooks
 * WCAG 2.1 AA Compliance - Focus management for modals, menus, and complex interactions
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Focus Trap Component
 * Traps focus within a container (useful for modals and dialogs)
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active = true,
  restoreFocus = true,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!active) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements within the container
    const getFocusableElements = () => {
      const selectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]',
      ].join(', ');

      return Array.from(container.querySelectorAll(selectors)) as HTMLElement[];
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      // Restore focus to the previously focused element
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

/**
 * Focus Guard Components
 * Invisible elements that help manage focus flow
 */
export const FocusGuard: React.FC<{ onFocus: () => void }> = ({ onFocus }) => (
  <div
    tabIndex={0}
    onFocus={onFocus}
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: 1,
      height: 1,
      padding: 0,
      margin: -1,
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    }}
  />
);

/**
 * Auto Focus Component
 * Automatically focuses an element when mounted
 */
interface AutoFocusProps {
  children: React.ReactElement;
  disabled?: boolean;
  delay?: number;
}

export const AutoFocus: React.FC<AutoFocusProps> = ({ children, disabled = false, delay = 0 }) => {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (disabled) return;

    const timer = setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [disabled, delay]);

  return React.cloneElement(children, {
    ref: (node: HTMLElement) => {
      ref.current = node;
      // Preserve existing ref if any
      if (typeof children.ref === 'function') {
        children.ref(node);
      } else if (children.ref) {
        children.ref.current = node;
      }
    },
  });
};

/**
 * Roving Focus Manager
 * Manages focus for arrow key navigation (useful for menus, toolbars)
 */
interface RovingFocusProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  className?: string;
}

export const RovingFocus: React.FC<RovingFocusProps> = ({
  children,
  orientation = 'vertical',
  loop = true,
  className,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = Array.from(
        container.querySelectorAll(
          '[role="menuitem"], button, a, input, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowDown':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length) {
              nextIndex = loop ? 0 : focusableElements.length - 1;
            }
          }
          break;

        case 'ArrowUp':
          if (orientation === 'vertical' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? focusableElements.length - 1 : 0;
            }
          }
          break;

        case 'ArrowRight':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex + 1;
            if (nextIndex >= focusableElements.length) {
              nextIndex = loop ? 0 : focusableElements.length - 1;
            }
          }
          break;

        case 'ArrowLeft':
          if (orientation === 'horizontal' || orientation === 'both') {
            e.preventDefault();
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
              nextIndex = loop ? focusableElements.length - 1 : 0;
            }
          }
          break;

        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;

        case 'End':
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;

        default:
          return;
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
      }
    },
    [orientation, loop]
  );

  return (
    <div ref={containerRef} className={className} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
};

/**
 * Focus Visible Hook
 * Determines if focus should be visible (keyboard vs mouse)
 */
export const useFocusVisible = () => {
  const [focusVisible, setFocusVisible] = React.useState(false);
  const [hadKeyboardEvent, setHadKeyboardEvent] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      setHadKeyboardEvent(true);
    };

    const handlePointerDown = () => {
      setHadKeyboardEvent(false);
    };

    const handleFocus = () => {
      setFocusVisible(hadKeyboardEvent);
    };

    const handleBlur = () => {
      setFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, [hadKeyboardEvent]);

  return focusVisible;
};

/**
 * Focus Ring Component
 * Provides a customizable focus indicator
 */
interface FocusRingProps {
  children: React.ReactElement;
  offset?: number;
  radius?: number;
  color?: string;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  children,
  offset = 2,
  radius = 4,
  color = 'ring-primary-500',
}) => {
  const focusVisible = useFocusVisible();

  return React.cloneElement(children, {
    className: cn(
      children.props.className,
      'relative outline-none',
      focusVisible && ['ring-2', color, `ring-offset-${offset}`, `rounded-${radius}`]
    ),
  });
};

export default FocusTrap;
