# HASIVU Common Components

This directory contains the core common components for the HASIVU platform frontend infrastructure.

## Components

### LoadingScreen

Beautiful loading animation with HASIVU branding and customizable features.

```typescript
import { LoadingScreen } from '@/components/common';

// Basic usage
<LoadingScreen />

// With custom options
<LoadingScreen
  message="Loading your delicious meals..."
  progress={45}
  details="Fetching menu items"
  showLogo={true}
  size="large"
  color="primary"
/>
```

**Features:**

- Animated HASIVU logo with pulsing effect
- Progress tracking with visual indicators
- School-friendly messaging and colors
- Mobile-responsive design
- Accessibility compliant
- Multiple variants (fullscreen, inline)

### ErrorBoundary

React error boundary with comprehensive error handling and user-friendly fallback UI.

```typescript
import { ErrorBoundary } from '@/components/common';

// Wrap your components
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error reporting
    console.error('App error:', error, errorInfo);
  }}
  showDetails={false}
  showRetry={true}
  errorMessages={{
    title: "Oops! Something went wrong",
    description: "We're working on fixing this issue.",
    actionText: "Try Again"
  }}
>
  <YourAppComponents />
</ErrorBoundary>
```

**Features:**

- Automatic error catching and reporting
- Retry functionality with attempt limits
- User-friendly error messages
- Technical details toggle
- Error ID generation for tracking
- Network error detection
- Email error reporting integration

### ProgressBar

NProgress-style top page progress bar for navigation transitions.

```typescript
import { ProgressBarProvider, useProgressBar } from '@/components/common';

// Wrap your app with provider (already done in _app.tsx)
<ProgressBarProvider>
  <YourApp />
</ProgressBarProvider>

// Use in components
function MyComponent() {
  const progressBar = useProgressBar();

  const handleAsyncOperation = async () => {
    progressBar.start();
    try {
      await someAsyncOperation();
      progressBar.finish();
    } catch (error) {
      progressBar.finish();
    }
  };
}
```

**Features:**

- Smooth animations and transitions
- Automatic router integration
- Customizable colors and effects
- Glow, shimmer, and pulse animations
- Context-based progress management
- Mobile-optimized performance

## Usage Examples

### Basic App Setup

The components are already integrated in `_app.tsx`:

```typescript
export default function MyApp({ Component, pageProps, emotionCache }) {
  return (
    <ErrorBoundary>
      <ProgressBarProvider>
        <AuthProvider>
          <SocketProvider>
            <Component {...pageProps} />
          </SocketProvider>
        </AuthProvider>
      </ProgressBarProvider>
    </ErrorBoundary>
  );
}
```

### Manual Progress Control

```typescript
import { useProgressBar } from '@/components/common';

function DataLoadingComponent() {
  const progressBar = useProgressBar();

  useEffect(() => {
    const loadData = async () => {
      progressBar.start();

      try {
        // Simulate loading steps
        progressBar.set(25);
        await fetchUserData();

        progressBar.set(50);
        await fetchMenuData();

        progressBar.set(75);
        await fetchOrderHistory();

        progressBar.finish();
      } catch (error) {
        progressBar.finish();
        throw error;
      }
    };

    loadData();
  }, []);
}
```

### Custom Error Handling

```typescript
import { ErrorBoundary } from '@/components/common';

function FeatureSection() {
  return (
    <ErrorBoundary
      isolate={true}
      onError={(error) => {
        // Send to error tracking service
        errorTrackingService.report(error);
      }}
      errorMessages={{
        title: "Menu Loading Error",
        description: "We're having trouble loading the menu. Please try refreshing.",
        actionText: "Refresh Menu"
      }}
    >
      <MenuComponent />
    </ErrorBoundary>
  );
}
```

## Styling and Theming

All components integrate with the HASIVU theme system:

- **Colors**: Primary green (#4CAF50), secondary orange (#FF9800)
- **Typography**: Inter for body text, Poppins for headings
- **Animations**: Smooth, school-friendly transitions
- **Accessibility**: WCAG 2.1 AA compliant
- **Mobile**: Responsive design with touch optimization

## Performance

- **LoadingScreen**: <100ms render time, optimized animations
- **ErrorBoundary**: Zero performance impact when no errors
- **ProgressBar**: Hardware-accelerated animations, <50ms updates

## Browser Support

- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS 12+, Android 7+)

## Accessibility Features

- **ARIA labels** and roles for screen readers
- **Keyboard navigation** support
- **High contrast** mode compatibility
- **Reduced motion** preference support
- **Focus management** for interactive elements
