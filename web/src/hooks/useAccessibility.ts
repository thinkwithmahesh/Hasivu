 * Accessibility Hooks
 * Custom hooks for managing accessibility features and user preferences;
import { useState, useEffect, useCallback } from 'react';
 * Hook for managing user accessibility preferences;
export const // TODO: Refactor this function - it may be too long
useAccessibilityPreferences = (
  useEffect((
      setPreferences(prev => ({ ...prev, reducedMotion: mediaQuery.matches }));
    updateReducedMotion();
    mediaQuery.addEventListener('change', updateReducedMotion);
  // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const updateHighContrast = (
      setPreferences(prev => ({ ...prev, highContrast: contrastQuery.matches }));
    updateHighContrast();
    contrastQuery.addEventListener('change', updateHighContrast);
  // Check for screen reader
    const hasScreenReader = 'speechSynthesis' in window;
                           navigator.userAgent.includes('NVDA');
                           navigator.userAgent.includes('JAWS');
                           navigator.userAgent.includes('VoiceOver');
    setPreferences(prev => ({ ...prev, screenReader: hasScreenReader }));
  // Load user preferences from localStorage
    const stored = localStorage.getItem('accessibility-preferences');
    if (stored) {}
        setPreferences(prev => ({ ...prev, ...parsed }));
    return (
  }, []);
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
      const updated = { ...prev, [key]: value };
      localStorage.setItem('accessibility-preferences', JSON.stringify(updated));
      return updated;
  }, []);
  return { preferences, updatePreference };
 * Hook for managing keyboard navigation;
export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  options: {}
  } = options;
  const handleKeyDown = useCallback((event: KeyboardEvent
        break;
      case 'ArrowUp': undefined
        if (orientation === 'vertical' || orientation === 'both') {}
        break;
      case 'ArrowRight': undefined
        if (orientation === 'horizontal' || orientation === 'both') {}
        break;
      case 'ArrowLeft': undefined
        if (orientation === 'horizontal' || orientation === 'both') {}
        break;
      case 'Home': undefined
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End': undefined
        event.preventDefault();
        nextIndex = focusableElements.length - 1;
        break;
      default: undefined
        return;
    if (nextIndex !== currentIndex && focusableElements[nextIndex]) {}
  }, [containerRef, orientation, loop, selector]);
  useEffect((
  }, [handleKeyDown]);
 * Hook for managing announcements to screen readers;
export const useAnnouncements = (
    }, 1000);
  }, []);
  return { announcements, announce };
 * Hook for managing focus trapping;
export const useFocusTrap = (
  isActive: boolean,
  containerRef: React.RefObject<HTMLElement;
    const handleKeyDown = (event: KeyboardEvent
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey) {}
  // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {}
    document.addEventListener('keydown', handleKeyDown);
    return (
  }, [isActive, containerRef]);
 * Hook for detecting if user prefers reduced motion;
export const useReducedMotion = (
  }, []);
  return reducedMotion;
 * Hook for managing high contrast mode;
export const useHighContrast = (
  }, []);
  return highContrast;
 * Hook for managing roving focus (useful for menus, toolbars);
export const useRovingFocus = (
  items: HTMLElement[],
  currentIndex: number,
  onChange: (index: number) => void,
  orientation: 'horizontal' | 'vertical' = 'vertical'
        break;
      case 'ArrowUp': undefined
        if (orientation === 'vertical') {}
        break;
      case 'ArrowRight': undefined
        if (orientation === 'horizontal') {}
        break;
      case 'ArrowLeft': undefined
        if (orientation === 'horizontal') {}
        break;
      case 'Home': undefined
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End': undefined
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
      default: undefined
        return;
    if (nextIndex !== currentIndex) {}
  }, [currentIndex, items, onChange, orientation]);
  useEffect((
  }, [currentIndex, items, handleKeyDown]);