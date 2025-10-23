'use client';

/**
 * HASIVU Platform - ARIA Utilities
 * Collection of ARIA-focused components for enhanced accessibility
 */

import React, { useId, useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScreenReaderOnly } from './ScreenReaderOnly';

// Focus trap for modals and dialogs
interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  restoreFocus?: boolean;
  className?: string;
}

export function FocusTrap({
  children,
  isActive = true,
  restoreFocus = true,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store the last focused element
    lastFocusedElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);

      if (restoreFocus && lastFocusedElement.current) {
        lastFocusedElement.current.focus();
      }
    };
  }, [isActive, restoreFocus]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

// Breadcrumb navigation with proper ARIA
interface BreadcrumbProps {
  items: Array<{ label: string; href?: string; current?: boolean }>;
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex', className)}>
      <ol className="flex items-center space-x-1 text-sm">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-gray-400" aria-hidden="true">
                /
              </span>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-hasivu-primary-600 hover:text-hasivu-primary-700 hover:underline"
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(item.current ? 'text-gray-900 font-medium' : 'text-gray-500')}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Progress indicator with proper ARIA
interface ProgressIndicatorProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ProgressIndicator({
  value,
  max = 100,
  label = 'Progress',
  showValue = true,
  className,
  size = 'md',
}: ProgressIndicatorProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const progressId = useId();

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between items-center mb-1">
        <label
          htmlFor={progressId}
          className="text-sm font-medium text-gray-700"
          id={`${progressId}-label`}
        >
          {label}
        </label>
        {showValue && (
          <span className="text-sm text-gray-500" id={`${progressId}-value`}>
            {value} of {max}
          </span>
        )}
      </div>
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          id={progressId}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-labelledby={`${progressId}-label`}
          aria-describedby={showValue ? `${progressId}-value` : undefined}
          className={cn(
            'bg-hasivu-primary-500 h-full transition-all duration-300',
            percentage === 100 && 'bg-hasivu-secondary-500'
          )}
          style={{ width: `${percentage}%` }}
        >
          <ScreenReaderOnly>{percentage.toFixed(0)}% complete</ScreenReaderOnly>
        </div>
      </div>
    </div>
  );
}

// Tabs component with proper ARIA
interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');
  const tabListRef = useRef<HTMLDivElement>(null);
  const tablistId = useId();

  const handleTabChange = (tabId: string) => {
    if (tabs.find(tab => tab.id === tabId && !tab.disabled)) {
      setActiveTab(tabId);
      onChange?.(tabId);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, tabId: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === tabId);
    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        do {
          nextIndex = (nextIndex + 1) % tabs.length;
        } while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        do {
          nextIndex = nextIndex === 0 ? tabs.length - 1 : nextIndex - 1;
        } while (tabs[nextIndex]?.disabled && nextIndex !== currentIndex);
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = tabs.findIndex(tab => !tab.disabled);
        break;
      case 'End':
        event.preventDefault();
        nextIndex = tabs.length - 1;
        while (nextIndex >= 0 && tabs[nextIndex]?.disabled) {
          nextIndex--;
        }
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex && tabs[nextIndex]) {
      handleTabChange(tabs[nextIndex].id);
      // Focus the newly selected tab
      setTimeout(() => {
        const newTab = tabListRef.current?.querySelector(
          `[data-tab-id="${tabs[nextIndex].id}"]`
        ) as HTMLElement;
        newTab?.focus();
      }, 0);
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        ref={tabListRef}
        role="tablist"
        aria-labelledby={`${tablistId}-label`}
        className="flex border-b border-gray-200"
      >
        <ScreenReaderOnly>Tab navigation</ScreenReaderOnly>
        {tabs.map(tab => (
          <button
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-hasivu-primary-500 focus:ring-offset-2',
              activeTab === tab.id
                ? 'border-hasivu-primary-500 text-hasivu-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              tab.disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => handleTabChange(tab.id)}
            onKeyDown={e => handleKeyDown(e, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabs.map(tab => (
        <div
          key={tab.id}
          id={`${tab.id}-panel`}
          role="tabpanel"
          aria-labelledby={tab.id}
          tabIndex={0}
          className={cn('mt-4 focus:outline-none', activeTab === tab.id ? 'block' : 'hidden')}
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}

// Alert component with proper ARIA
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function Alert({
  type,
  title,
  children,
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const alertId = useId();

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div
      id={alertId}
      role={role}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={cn('p-4 border rounded-md', typeStyles[type], className)}
    >
      <div className="flex">
        <div className="flex-1">
          {title && <h3 className="text-sm font-medium mb-1">{title}</h3>}
          <div className="text-sm">{children}</div>
        </div>
        {dismissible && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 flex-shrink-0 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-gray-600"
            aria-label="Dismiss alert"
          >
            <span className="sr-only">Dismiss</span>
            <span aria-hidden="true">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default {
  FocusTrap,
  Breadcrumb,
  ProgressIndicator,
  Tabs,
  Alert,
};
