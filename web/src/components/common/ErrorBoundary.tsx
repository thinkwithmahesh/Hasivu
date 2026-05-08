'use client';

import React, { Component, ErrorInfo as ReactErrorInfo, ReactNode } from 'react';
import { AlertTriangle, Bug, ChevronDown, ChevronUp, Home, LifeBuoy, RefreshCw } from 'lucide-react';

export interface CustomErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: CustomErrorInfo) => void;
  showDetails?: boolean;
  showRetry?: boolean;
  errorMessages?: {
    title?: string;
    description?: string;
    actionText?: string;
  };
  isolate?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ReactErrorInfo | null;
  errorId: string;
  retryCount: number;
  showDetails: boolean;
}

export interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ReactErrorInfo | null;
  errorId: string;
  retryCount: number;
  showDetails: boolean;
  onRetry: () => void;
  onToggleDetails: () => void;
  onReportError: () => void;
  onGoHome: () => void;
  customMessages?: {
    title?: string;
    description?: string;
    actionText?: string;
  };
}

const getUserFriendlyMessage = (error: Error | null): string => {
  const message = error?.message?.toLowerCase() || '';
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  if (message.includes('timeout')) return 'The request timed out. Please try again.';
  if (message.includes('unauthorized') || message.includes('403') || message.includes('401')) {
    return 'Authentication required. Please log in again.';
  }
  if (message.includes('not found') || message.includes('404')) {
    return 'The requested resource was not found.';
  }
  if (message.includes('server') || message.includes('500')) {
    return 'Server error. Please try again later.';
  }
  return 'An unexpected error occurred. Please try again.';
};

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  retryCount,
  showDetails,
  onRetry,
  onToggleDetails,
  onReportError,
  onGoHome,
  customMessages,
}) => {
  const title = customMessages?.title || 'Something went wrong';
  const description =
    customMessages?.description ||
    "We're sorry, but something unexpected happened. Please retry or contact support with the error ID below.";
  const actionText = customMessages?.actionText || 'Try again';

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-10">
      <section className="relative w-full overflow-hidden rounded-3xl border border-red-200 bg-white p-6 text-center shadow-xl sm:p-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-700 to-orange-500" />
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle className="h-10 w-10" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold text-stone-950">{title}</h1>
        <p className="mt-3 text-lg font-medium text-red-700">{getUserFriendlyMessage(error)}</p>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-stone-600">{description}</p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {actionText}
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 font-semibold text-stone-800 transition hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Go home
          </button>
          <button
            type="button"
            onClick={onReportError}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-orange-300 px-5 py-2.5 font-semibold text-orange-800 transition hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            Contact support
          </button>
        </div>

        <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-left text-sm text-stone-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
              Error ID: {errorId}
            </span>
            {retryCount > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-800">
                Retry {retryCount}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onToggleDetails}
            className="mt-4 inline-flex items-center gap-2 font-medium text-stone-900 underline-offset-4 hover:underline"
          >
            <Bug className="h-4 w-4" aria-hidden="true" />
            Technical details
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showDetails && (
            <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-stone-950 p-4 text-xs leading-6 text-stone-100">
              {[
                `Message: ${error?.message || 'Unknown error'}`,
                `Stack: ${error?.stack || 'Unavailable'}`,
                `Component stack: ${errorInfo?.componentStack || 'Unavailable'}`,
              ].join('\n\n')}
            </pre>
          )}
        </div>
      </section>
    </div>
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0,
      showDetails: props.showDetails || false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ReactErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack ?? undefined,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    });
  }

  private handleRetry = () => {
    this.setState(prev => ({ retryCount: prev.retryCount + 1 }));
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
        showDetails: this.props.showDetails || false,
      });
    }, 150);
  };

  private handleToggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  private handleReportError = () => {
    if (!this.state.error || !this.state.errorInfo || typeof window === 'undefined') return;
    const subject = encodeURIComponent(`HASIVU Error Report - ${this.state.errorId}`);
    const body = encodeURIComponent(
      `Error ID: ${this.state.errorId}\nURL: ${window.location.href}\nMessage: ${this.state.error.message}\n\nPlease describe what you were doing:\n\n`
    );
    window.open(`mailto:support@hasivu.com?subject=${subject}&body=${body}`);
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false,
    });
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) clearTimeout(this.retryTimeoutId);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    const FallbackComponent = this.props.fallback || DefaultErrorFallback;
    return (
      <FallbackComponent
        error={this.state.error}
        errorInfo={this.state.errorInfo}
        errorId={this.state.errorId}
        retryCount={this.state.retryCount}
        showDetails={this.state.showDetails}
        onRetry={this.handleRetry}
        onToggleDetails={this.handleToggleDetails}
        onReportError={this.handleReportError}
        onGoHome={this.handleGoHome}
        customMessages={this.props.errorMessages}
      />
    );
  }
}

export default ErrorBoundary;
