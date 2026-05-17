# HASIVU Platform - Unified Error Boundary System

A comprehensive error boundary system built on shadcn/ui components, providing production-ready error handling with consistent fallback UI patterns.

## Features

✨ **Comprehensive Error Handling**

- Production-ready error reporting and logging
- Automatic retry mechanisms with exponential backoff
- Event ID tracking for error correlation
- Development vs Production error display modes

🎨 **shadcn/ui Integration**

- Consistent Alert component styling
- AlertDialog for critical errors
- Responsive design with dark mode support
- Accessibility compliance (ARIA attributes)

🛡️ **Multiple Error Boundary Types**

- Page-level boundaries for application errors
- Section-level for isolated UI components
- Component-level for individual elements
- Specialized boundaries (API, Data, Navigation)

🔧 **Developer Experience**

- HOC patterns for easy component wrapping
- TypeScript interfaces with comprehensive types
- Detailed error information in development mode
- Customizable fallback UI and retry behavior

## Quick Start

```tsx
import {
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
} from '@/components/error-boundary';

// Page-level error boundary
function App() {
  return (
    <PageErrorBoundary errorBoundaryId="main-app">
      <MainApplication />
    </PageErrorBoundary>
  );
}

// Section-level isolation
function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <SectionErrorBoundary errorBoundaryId="user-profile">
        <UserProfile />
      </SectionErrorBoundary>

      <SectionErrorBoundary errorBoundaryId="analytics">
        <Analytics />
      </SectionErrorBoundary>
    </div>
  );
}

// Component-level protection
function UserProfile() {
  return (
    <ComponentErrorBoundary errorBoundaryId="avatar">
      <UserAvatar />
    </ComponentErrorBoundary>
  );
}
```

## Available Components

### Core Components

- **`UnifiedErrorBoundary`** - Main error boundary with full configuration options
- **`PageErrorBoundary`** - For application-level error handling
- **`SectionErrorBoundary`** - For UI section isolation
- **`ComponentErrorBoundary`** - For individual component protection

### Specialized Components

- **`ApiErrorBoundary`** - For API connection errors
- **`DataErrorBoundary`** - For data loading/processing errors
- **`NavigationErrorBoundary`** - For routing/navigation errors

### HOC Pattern

- **`withErrorBoundary`** - Higher-order component for wrapping existing components

## Configuration Options

```tsx
interface ErrorBoundaryProps {
  children?: ReactNode;
  fallback?: ReactNode; // Custom fallback UI
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean; // Show error details in development
  isolate?: boolean; // Add visual isolation styling
  level?: 'page' | 'section' | 'component';
  retryable?: boolean; // Enable retry functionality
  errorBoundaryId?: string; // Unique identifier for tracking
  title?: string; // Custom error title
  description?: string; // Custom error description
  variant?: 'default' | 'destructive';
  showDialog?: boolean; // Show error in dialog
  maxRetries?: number; // Maximum retry attempts (default: 3)
}
```

## Usage Examples

### 1. Basic Page-Level Error Boundary

```tsx
import { PageErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <PageErrorBoundary
      errorBoundaryId="app-root"
      onError={(error, errorInfo) => {
        // Send to monitoring service
        console.error('Application error:', error);
      }}
    >
      <Router>
        <Routes>
          <Route path="/" component={Home} />
          <Route path="/dashboard" component={Dashboard} />
        </Routes>
      </Router>
    </PageErrorBoundary>
  );
}
```

### 2. Section-Level Error Isolation

```tsx
import { SectionErrorBoundary } from '@/components/error-boundary';

function Dashboard() {
  return (
    <div className="dashboard-grid">
      {/* Each section is isolated - errors won't affect others */}
      <SectionErrorBoundary errorBoundaryId="stats-section">
        <StatisticsCards />
      </SectionErrorBoundary>

      <SectionErrorBoundary errorBoundaryId="charts-section">
        <AnalyticsCharts />
      </SectionErrorBoundary>

      <SectionErrorBoundary errorBoundaryId="activity-section">
        <ActivityFeed />
      </SectionErrorBoundary>
    </div>
  );
}
```

### 3. API Error Handling

```tsx
import { ApiErrorBoundary } from '@/components/error-boundary';

function UserData() {
  return (
    <ApiErrorBoundary
      errorBoundaryId="user-api"
      maxRetries={5}
      onError={error => {
        // Log API errors specifically
        analytics.track('api_error', {
          endpoint: '/api/users',
          error: error.message,
        });
      }}
    >
      <UserDataDisplay />
    </ApiErrorBoundary>
  );
}
```

### 4. HOC Pattern for Component Libraries

```tsx
import { withErrorBoundary } from '@/components/error-boundary';

// Original component
const UserAvatar = ({ userId }: { userId: string }) => {
  // Component implementation that might throw errors
  return <img src={`/api/users/${userId}/avatar`} />;
};

// Wrapped with error boundary
const SafeUserAvatar = withErrorBoundary(UserAvatar, {
  level: 'component',
  errorBoundaryId: 'user-avatar',
  title: 'Avatar Loading Error',
  description: 'Unable to load user avatar',
  maxRetries: 2,
});

// Usage
function UserProfile({ userId }: { userId: string }) {
  return (
    <div>
      <h2>User Profile</h2>
      <SafeUserAvatar userId={userId} />
    </div>
  );
}
```

### 5. Custom Fallback UI

```tsx
import { UnifiedErrorBoundary } from '@/components/error-boundary';

function CustomFallbackExample() {
  return (
    <UnifiedErrorBoundary
      errorBoundaryId="custom-fallback"
      fallback={
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-muted-foreground mb-4">
            Don't worry, our team has been notified and is working on a fix.
          </p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      }
    >
      <ProblematicComponent />
    </UnifiedErrorBoundary>
  );
}
```

### 6. Advanced Configuration

```tsx
import { UnifiedErrorBoundary } from '@/components/error-boundary';

function AdvancedExample() {
  return (
    <UnifiedErrorBoundary
      level="section"
      errorBoundaryId="advanced-section"
      title="High Availability Component"
      description="This component has extended retry capabilities and comprehensive error tracking"
      variant="destructive"
      isolate={true}
      retryable={true}
      maxRetries={5}
      showDialog={false}
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Advanced error handling
        const errorReport = {
          error: error.message,
          componentStack: errorInfo.componentStack,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          userId: getCurrentUserId(),
          sessionId: getSessionId(),
          buildVersion: process.env.REACT_APP_VERSION,
        };

        // Send to multiple services
        errorTrackingService.captureException(error, errorReport);
        analyticsService.track('component_error', errorReport);

        // Notify user if critical
        if (error.name === 'ChunkLoadError') {
          toast.error('Please refresh the page to load the latest version');
        }
      }}
    >
      <CriticalBusinessComponent />
    </UnifiedErrorBoundary>
  );
}
```

## Error Reporting Integration

The error boundary system includes built-in error reporting capabilities. To integrate with your monitoring service:

```tsx
// In your error boundary configuration
onError: (error, errorInfo) => {
  // Sentry integration
  Sentry.withScope(scope => {
    scope.setTag('errorBoundary', true);
    scope.setContext('errorInfo', errorInfo);
    Sentry.captureException(error);
  });

  // DataDog integration
  datadogLogs.logger.error('Error boundary triggered', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
  });

  // Custom analytics
  analytics.track('error_boundary_triggered', {
    errorType: error.name,
    errorMessage: error.message,
    componentStack: errorInfo.componentStack,
  });
};
```

## Best Practices

### 1. Error Boundary Hierarchy

```tsx
// ✅ Good: Nested boundaries for granular error handling
<PageErrorBoundary errorBoundaryId="app">
  <Header />
  <main>
    <SectionErrorBoundary errorBoundaryId="sidebar">
      <Sidebar />
    </SectionErrorBoundary>
    <SectionErrorBoundary errorBoundaryId="content">
      <ComponentErrorBoundary errorBoundaryId="user-widget">
        <UserWidget />
      </ComponentErrorBoundary>
      <ComponentErrorBoundary errorBoundaryId="activity-widget">
        <ActivityWidget />
      </ComponentErrorBoundary>
    </SectionErrorBoundary>
  </main>
</PageErrorBoundary>
```

### 2. Meaningful Error Boundary IDs

```tsx
// ✅ Good: Descriptive IDs for easier debugging
<SectionErrorBoundary errorBoundaryId="dashboard-analytics-section">
<ComponentErrorBoundary errorBoundaryId="user-avatar-component">
<ApiErrorBoundary errorBoundaryId="orders-api-integration">

// ❌ Avoid: Generic or unclear IDs
<SectionErrorBoundary errorBoundaryId="section1">
<ComponentErrorBoundary errorBoundaryId="comp">
```

### 3. Appropriate Error Levels

```tsx
// ✅ Good: Match boundary level to scope
<PageErrorBoundary>        {/* For app-wide errors */}
<SectionErrorBoundary>     {/* For UI section isolation */}
<ComponentErrorBoundary>   {/* For individual components */}

// ❌ Avoid: Overuse of page-level boundaries
<PageErrorBoundary>
  <PageErrorBoundary>  {/* Unnecessary nesting */}
```

### 4. Custom Error Messages

```tsx
// ✅ Good: User-friendly, context-specific messages
<ApiErrorBoundary
  title="Unable to Load Orders"
  description="We're having trouble connecting to our order system. Please try again in a few moments."
/>

// ❌ Avoid: Technical jargon in user-facing messages
<ApiErrorBoundary
  title="HTTP 500 Internal Server Error"
  description="The server encountered an internal error and was unable to complete your request."
/>
```

## Development Tools

### Error Testing

Use the provided example components to test error boundaries:

```tsx
import { ErrorBoundaryExamples } from '@/components/error-boundary/ErrorBoundaryExamples';

// Add to your development routes
<Route path="/error-boundary-demo" component={ErrorBoundaryExamples} />;
```

### Debugging

Enable detailed error information in development:

```tsx
<UnifiedErrorBoundary
  showErrorDetails={process.env.NODE_ENV === 'development'}
  onError={(error, errorInfo) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Debug');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.error('Error Boundary ID:', errorBoundaryId);
      console.groupEnd();
    }
  }}
>
```

## Migration from Legacy Error Boundaries

If you're migrating from existing error boundaries:

```tsx
// Old approach
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

// New approach
import { SectionErrorBoundary } from '@/components/error-boundary';

// The new system is backward compatible
// Replace gradually with enhanced features
```

## Performance Considerations

- Error boundaries have minimal performance impact in normal operation
- Retry mechanisms use exponential backoff to prevent excessive retries
- Error reporting is optimized to avoid blocking the UI
- Development mode includes additional debugging features that are stripped in production

## Browser Support

The error boundary system works with all modern browsers that support:

- React 16.8+ (Hooks)
- ES2018 features
- shadcn/ui component requirements

## Contributing

When extending the error boundary system:

1. **Follow TypeScript patterns** - Use proper interfaces and type safety
2. **Maintain accessibility** - Include ARIA attributes and proper semantics
3. **Test error scenarios** - Create components that deliberately error for testing
4. **Document new features** - Update this README with new functionality
5. **Consider performance** - Ensure new features don't impact normal operation

## Support

For issues, questions, or feature requests:

1. Check the ErrorBoundaryExamples.tsx for usage patterns
2. Review error logs in development mode for debugging
3. Refer to shadcn/ui documentation for styling customizations
4. Create GitHub issues for bugs or enhancement requests
