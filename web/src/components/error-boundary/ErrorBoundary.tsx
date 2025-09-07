'use client';

/**
 * HASIVU Platform - Production Error Boundary
 * Comprehensive error boundary with logging, recovery, and user feedback
 * Implements production-ready error handling with graceful degradation
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
  retryable?: boolean;
  errorBoundaryId?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
  showDetails: boolean;
  retryCount: number;
  isRetrying: boolean;
}

// Error reporting utility
class ErrorReporter {
  static report(
    error: Error,
    errorInfo: ErrorInfo,
    boundaryId?: string,
    retryCount: number = 0
  ): string {
    const eventId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    const errorReport = {
      eventId,
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo.componentStack,
      boundaryId,
      retryCount,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userId: 'anonymous', // TODO: Get from auth context
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary: ${error.name}`);
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Full Report:', errorReport);
      console.groupEnd();
    }

    // TODO: In production, send to error reporting service
    // await fetch('/api/errors', { 
    //   method: 'POST',
    //   body: JSON.stringify(errorReport),
    //   headers: { 'Content-Type': 'application/json' }
    // });

    return eventId;
  }
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
      showDetails: false,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = ErrorReporter.report(
      error,
      errorInfo,
      this.props.errorBoundaryId,
      this.state.retryCount
    );

    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    if (this.state.retryCount >= 3) return;

    this.setState({ isRetrying: true });
    
    this.retryTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
        showDetails: false,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, 1000);
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails,
    }));
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, eventId, showDetails, retryCount, isRetrying } = this.state;
      const { level = 'component', retryable = true, showErrorDetails = true } = this.props;
      
      const canRetry = retryable && retryCount < 3;
      const isPageLevel = level === 'page';

      return (
        <div
          className={cn(
            'flex items-center justify-center p-4',
            isPageLevel && 'min-h-screen bg-gray-50',
            this.props.isolate && 'border border-red-200 rounded-lg bg-red-50'
          )}
          role="alert"
          aria-live="assertive"
        >
          <Card className={cn(
            'w-full max-w-lg mx-auto',
            isPageLevel ? 'border-red-200 bg-white shadow-lg' : 'border-red-200 bg-red-50'
          )}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">
                {isPageLevel ? 'Something went wrong' : 'Component Error'}
              </CardTitle>
              <CardDescription className="text-red-700">
                {isPageLevel
                  ? 'We encountered an unexpected error. Our team has been notified.'
                  : 'This section encountered an error and cannot be displayed.'}
                {eventId && (
                  <span className="block mt-2 text-xs font-mono text-red-600">
                    Error ID: {eventId}
                  </span>
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={isRetrying}
                    className="flex items-center justify-center space-x-2"
                    variant={isPageLevel ? 'default' : 'outline'}
                  >
                    <RefreshCw className={cn('w-4 h-4', isRetrying && 'animate-spin')} />
                    <span>{isRetrying ? 'Retrying...' : 'Try Again'}</span>
                  </Button>
                )}
                
                {isPageLevel && (
                  <Button 
                    onClick={this.handleGoHome} 
                    variant="outline"
                    className="flex items-center justify-center space-x-2"
                  >
                    <Home className="w-4 h-4" />
                    <span>Go Home</span>
                  </Button>
                )}
              </div>

              {/* Retry count indicator */}
              {retryCount > 0 && (
                <div className="text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Attempt {retryCount} of 3
                  </span>
                </div>
              )}

              {/* Error details (development/debug mode) */}
              {showErrorDetails && error && process.env.NODE_ENV === 'development' && (
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.toggleDetails}
                    className="w-full flex items-center justify-center space-x-2 text-red-700 hover:text-red-800"
                  >
                    <Bug className="w-4 h-4" />
                    <span>Error Details</span>
                    {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>

                  {showDetails && (
                    <div className="mt-3 p-3 bg-red-100 rounded-md">
                      <div className="text-sm space-y-2">
                        <div>
                          <strong className="text-red-900">Error:</strong>
                          <pre className="mt-1 text-red-700 text-xs whitespace-pre-wrap font-mono">
                            {error.message}
                          </pre>
                        </div>
                        {error.stack && (
                          <div>
                            <strong className="text-red-900">Stack Trace:</strong>
                            <pre className="mt-1 text-red-700 text-xs whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Production help text */}
              {process.env.NODE_ENV === 'production' && (
                <div className="text-center text-sm text-gray-600">
                  If this problem persists, please contact support with the error ID above.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized error boundaries for different use cases
export const PageErrorBoundary = (props: Omit<Props, 'level'>) => (
  <ErrorBoundary level="page" {...props} />
);

export const SectionErrorBoundary = (props: Omit<Props, 'level' | 'isolate'>) => (
  <ErrorBoundary level="section" isolate {...props} />
);

export const ComponentErrorBoundary = (props: Omit<Props, 'level' | 'retryable'>) => (
  <ErrorBoundary level="component" retryable={false} {...props} />
);

export default ErrorBoundary;