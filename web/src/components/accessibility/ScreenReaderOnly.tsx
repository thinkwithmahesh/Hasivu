/**
 * Screen Reader Only Component
 * Content visible only to screen readers and assistive technologies
 * WCAG 2.1 AA Compliance - Supporting screen reader navigation
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const ScreenReaderOnly: React.FC<ScreenReaderOnlyProps> = ({
  children,
  className,
  as: Component = 'span',
}) => {
  return (
    <Component
      className={cn(
        // Visually hidden but accessible to screen readers
        'sr-only',
        // Alternative implementation for better compatibility
        'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
        // Ensure it doesn't affect layout
        'clip-path-[inset(50%)]',
        className
      )}
      style={{
        // Fallback for browsers that don't support clip-path
        clip: 'rect(0, 0, 0, 0)',
        clipPath: 'inset(50%)',
      }}
    >
      {children}
    </Component>
  );
};

/**
 * Live Region for Screen Reader Announcements
 * Use for dynamic content that should be announced
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  politeness = 'polite',
  atomic = false,
  relevant = 'additions text',
  className,
}) => {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant as 'additions' | 'removals' | 'text' | 'all' | 'additions text'}
      role="status"
    >
      {children}
    </div>
  );
};

/**
 * Status Message Component
 * For announcing status changes to screen readers
 */
interface StatusMessageProps {
  message: string;
  type?: 'status' | 'alert';
  show?: boolean;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type = 'status',
  show = true,
}) => {
  if (!show || !message) return null;

  return (
    <div
      className="sr-only"
      role={type}
      aria-live={type === 'alert' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {message}
    </div>
  );
};

/**
 * Skip to Content Link
 * Specialized skip navigation for main content
 */
interface SkipToContentProps {
  targetId?: string;
  label?: string;
  className?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({
  targetId = 'main-content',
  label = 'Skip to main content',
  className,
}) => {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Hidden until focused
        'absolute top-0 left-0 -translate-y-full',
        'focus:translate-y-0 z-[9999]',
        // HASIVU brand styling for skip links
        'bg-hasivu-primary-600 hover:bg-hasivu-primary-700 text-white px-4 py-2',
        'transition-all duration-200 shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2',
        'font-medium text-sm rounded-md',
        className
      )}
      onClick={e => {
        const target = document.getElementById(targetId);
        if (target) {
          e.preventDefault();
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }}
    >
      {label}
    </a>
  );
};

/**
 * Loading Announcement
 * Announces loading states to screen readers
 */
interface LoadingAnnouncementProps {
  isLoading: boolean;
  loadingText?: string;
  completedText?: string;
  delay?: number;
}

export const LoadingAnnouncement: React.FC<LoadingAnnouncementProps> = ({
  isLoading,
  loadingText = 'Loading content...',
  completedText = 'Content loaded.',
  delay = 1000,
}) => {
  const [announced, setAnnounced] = React.useState(false);
  const [showCompleted, setShowCompleted] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isLoading && !announced) {
      timer = setTimeout(() => {
        setAnnounced(true);
      }, delay);
    }

    if (!isLoading && announced) {
      setShowCompleted(true);
      setAnnounced(false);

      timer = setTimeout(() => {
        setShowCompleted(false);
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [isLoading, announced, delay]);

  return (
    <>
      {isLoading && announced && <LiveRegion politeness="polite">{loadingText}</LiveRegion>}
      {showCompleted && <LiveRegion politeness="polite">{completedText}</LiveRegion>}
    </>
  );
};

export default ScreenReaderOnly;
