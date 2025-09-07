/**
 * Skip Navigation Component
 * WCAG 2.1 AA Compliance - Bypass Blocks (2.4.1)
 * Provides keyboard users quick access to main content areas
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipNavigationProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#main-navigation', label: 'Skip to navigation' },
  { href: '#search', label: 'Skip to search' },
  { href: '#footer', label: 'Skip to footer' }
];

export const SkipNavigation: React.FC<SkipNavigationProps> = ({
  links = defaultLinks,
  className
}) => {
  return (
    <nav
      className={cn(
        // Hidden by default, visible on focus
        "fixed top-0 left-0 z-[9999] transform -translate-y-full",
        "focus-within:translate-y-0 transition-transform duration-200",
        "bg-primary-600 text-white p-2 shadow-lg",
        "border-b-2 border-primary-700",
        className
      )}
      aria-label="Skip navigation links"
    >
      <ul className="flex space-x-4">
        {links.map(({ href, label }) => (
          <li key={href}>
            <a
              href={href}
              className={cn(
                "inline-block px-4 py-2 bg-primary-700 text-white",
                "rounded-md font-medium text-sm",
                "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600",
                "hover:bg-primary-800 transition-colors duration-200",
                "underline-offset-2 focus:underline"
              )}
              onClick={(e) => {
                // Ensure focus moves to target element
                const target = document.querySelector(href);
                if (target) {
                  e.preventDefault();
                  target.scrollIntoView({ behavior: 'smooth' });
                  
                  // Set focus to the target or make it focusable
                  if (target instanceof HTMLElement) {
                    if (target.tabIndex < 0) {
                      target.tabIndex = -1;
                    }
                    target.focus();
                  }
                }
              }}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

/**
 * Hook to register skip navigation targets
 * Use this to mark important sections that skip links should target
 */
export const useSkipTarget = (id: string) => {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.id = id;
      // Ensure the element can receive focus
      if (ref.current.tabIndex === undefined || ref.current.tabIndex >= 0) {
        ref.current.tabIndex = -1;
      }
    }
  }, [id]);

  return ref;
};

export default SkipNavigation;