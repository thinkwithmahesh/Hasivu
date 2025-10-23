'use client';

/**
 * HASIVU Platform - Accessibility Provider
 * Comprehensive accessibility management for WCAG 2.1 AA compliance
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LiveRegion, StatusMessage } from './ScreenReaderOnly';

interface AccessibilityContextType {
  announceMessage: (message: string, priority?: 'polite' | 'assertive') => void;
  announcePageChange: (pageName: string) => void;
  setFocusedElement: (element: HTMLElement | null) => void;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export function AccessibilityProvider({ children }: AccessibilityProviderProps) {
  const [announcements, setAnnouncements] = useState<
    Array<{ id: string; message: string; priority: 'polite' | 'assertive' }>
  >([]);
  const [pageAnnouncement, setPageAnnouncement] = useState<string>('');
  const [_focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  const _router = useRouter();
  const pathname = usePathname();

  // Detect user preferences
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Check for high contrast preference
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(contrastQuery.matches);

    const handleContrastChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    contrastQuery.addEventListener('change', handleContrastChange);

    // Load font size preference
    const savedFontSize = localStorage.getItem('hasivu-font-size') as
      | 'small'
      | 'medium'
      | 'large'
      | null;
    if (savedFontSize) {
      setFontSize(savedFontSize);
      document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
      document.documentElement.classList.add(
        savedFontSize === 'small' ? 'text-sm' : savedFontSize === 'large' ? 'text-lg' : 'text-base'
      );
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Handle font size changes
  useEffect(() => {
    localStorage.setItem('hasivu-font-size', fontSize);
    document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
    document.documentElement.classList.add(
      fontSize === 'small' ? 'text-sm' : fontSize === 'large' ? 'text-lg' : 'text-base'
    );
  }, [fontSize]);

  // Announce page changes
  useEffect(() => {
    const pageName = getPageName(pathname || '/');
    if (pageName) {
      announcePageChange(pageName);
    }
  }, [pathname]);

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip to main content (Alt + M)
      if (event.altKey && event.key.toLowerCase() === 'm') {
        event.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth' });
          announceMessage('Navigated to main content', 'polite');
        }
      }

      // Skip to navigation (Alt + N)
      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
        if (nav) {
          const focusable = nav.querySelector(
            'a, button, [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          if (focusable) {
            focusable.focus();
            focusable.scrollIntoView({ behavior: 'smooth' });
            announceMessage('Navigated to main navigation', 'polite');
          }
        }
      }

      // Increase font size (Alt + Plus)
      if (event.altKey && event.key === '=') {
        event.preventDefault();
        if (fontSize === 'small') setFontSize('medium');
        else if (fontSize === 'medium') setFontSize('large');
        announceMessage(`Font size: ${fontSize === 'small' ? 'medium' : 'large'}`, 'polite');
      }

      // Decrease font size (Alt + Minus)
      if (event.altKey && event.key === '-') {
        event.preventDefault();
        if (fontSize === 'large') setFontSize('medium');
        else if (fontSize === 'medium') setFontSize('small');
        announceMessage(`Font size: ${fontSize === 'large' ? 'medium' : 'small'}`, 'polite');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [fontSize]);

  const announceMessage = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const id = Date.now().toString();
      setAnnouncements(prev => [...prev, { id, message, priority }]);

      // Clear announcement after 5 seconds
      setTimeout(() => {
        setAnnouncements(prev => prev.filter(announcement => announcement.id !== id));
      }, 5000);
    },
    []
  );

  const announcePageChange = useCallback((pageName: string) => {
    setPageAnnouncement(`Page changed to: ${pageName}`);

    // Clear page announcement after 3 seconds
    setTimeout(() => {
      setPageAnnouncement('');
    }, 3000);
  }, []);

  const value: AccessibilityContextType = {
    announceMessage,
    announcePageChange,
    setFocusedElement,
    isReducedMotion,
    isHighContrast,
    fontSize,
    setFontSize: size => {
      setFontSize(size);
      announceMessage(`Font size changed to ${size}`, 'polite');
    },
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}

      {/* Announcement regions */}
      {announcements.map(announcement => (
        <LiveRegion key={announcement.id} politeness={announcement.priority}>
          {announcement.message}
        </LiveRegion>
      ))}

      {pageAnnouncement && <StatusMessage message={pageAnnouncement} type="status" />}

      {/* Keyboard shortcuts help */}
      <div className="sr-only">
        <p>Keyboard shortcuts available:</p>
        <ul>
          <li>Alt + M: Skip to main content</li>
          <li>Alt + N: Skip to navigation</li>
          <li>Alt + Plus: Increase font size</li>
          <li>Alt + Minus: Decrease font size</li>
        </ul>
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

function getPageName(pathname: string): string {
  const routes: Record<string, string> = {
    '/': 'Home',
    '/menu': 'Menu',
    '/dashboard': 'Dashboard',
    '/dashboard/admin': 'Administrator Dashboard',
    '/dashboard/teacher': 'Teacher Dashboard',
    '/dashboard/parent': 'Parent Dashboard',
    '/dashboard/student': 'Student Dashboard',
    '/orders': 'Order Management',
    '/profile': 'Profile',
    '/settings': 'Settings',
    '/auth/login': 'Login',
    '/auth/register': 'Registration',
  };

  return routes[pathname] || `Page: ${pathname.split('/').pop() || 'Unknown'}`;
}

export default AccessibilityProvider;
