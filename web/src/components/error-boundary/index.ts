/**
 * HASIVU Platform - Error Boundary System Exports
 *
 * Centralized exports for all error boundary components and utilities.
 * Provides a clean API for importing error boundaries throughout the application.
 */

// Main unified error boundary
export {
  UnifiedErrorBoundary as default,
  UnifiedErrorBoundary,
  withErrorBoundary,
} from './UnifiedErrorBoundary';

// Specialized error boundaries
export {
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  ApiErrorBoundary,
  DataErrorBoundary,
  NavigationErrorBoundary,
} from './UnifiedErrorBoundary';

// Legacy exports for backwards compatibility
export { ErrorBoundary } from './ErrorBoundary';

// Types
export type { ErrorBoundaryProps } from './UnifiedErrorBoundary';

/**
 * Usage Examples:
 *
 * // Page-level error boundary
 * <PageErrorBoundary>
 *   <App />
 * </PageErrorBoundary>
 *
 * // Section-level with custom error handling
 * <SectionErrorBoundary _onError = {(error)
 */
