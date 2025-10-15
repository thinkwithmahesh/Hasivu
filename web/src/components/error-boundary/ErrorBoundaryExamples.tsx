/**
 * HASIVU Platform - Error Boundary Usage Examples
 *
 * Comprehensive examples showing how to use the Unified Error Boundary system
 * with different scenarios and configurations.
 */

import React from 'react';
import {
  PageErrorBoundary,
  SectionErrorBoundary,
  ComponentErrorBoundary,
  ApiErrorBoundary,
  DataErrorBoundary,
  NavigationErrorBoundary,
  UnifiedErrorBoundary,
  withErrorBoundary,
} from './index';

// ============================================================================
// Example Components that might throw errors
// ============================================================================

const ProblematicComponent: React.FC = () => {
  // This component will throw an error for demonstration
  throw new Error('Simulated component error for testing');
};

const ApiComponent: React.FC = () => {
  // Simulate API error
  throw new Error('Failed to fetch data from API');
};

const DataComponent: React.FC = () => {
  // Simulate data processing error
  throw new Error('Invalid data format received');
};

// ============================================================================
// Example 1: Page-Level Error Boundary
// ============================================================================

export const PageLevelExample: React.FC = () => (
  <PageErrorBoundary
    errorBoundaryId="main-app"
    onError={(error, _errorInfo) => {
      // Send to analytics/monitoring service
    }}
  >
    <div className="p-4">
      <h1>HASIVU Platform</h1>
      <ProblematicComponent />
    </div>
  </PageErrorBoundary>
);

// ============================================================================
// Example 2: Section-Level Error Boundaries
// ============================================================================

export const SectionLevelExample: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
    {/* Safe section that won't error */}
    <SectionErrorBoundary errorBoundaryId="user-profile-section">
      <div className="p-4 border rounded">
        <h2>User Profile</h2>
        <p>This section is working correctly</p>
      </div>
    </SectionErrorBoundary>

    {/* Section with error */}
    <SectionErrorBoundary
      errorBoundaryId="dashboard-section"
      title="Dashboard Error"
      description="The dashboard section encountered an error but other sections remain functional."
    >
      <div className="p-4 border rounded">
        <h2>Dashboard</h2>
        <ProblematicComponent />
      </div>
    </SectionErrorBoundary>
  </div>
);

// ============================================================================
// Example 3: Component-Level Error Boundaries
// ============================================================================

export const ComponentLevelExample: React.FC = () => (
  <div className="space-y-4 p-4">
    <h2>Component Isolation Example</h2>

    {/* Working component */}
    <ComponentErrorBoundary errorBoundaryId="working-card">
      <div className="p-4 border rounded bg-green-50">
        <h3>Working Component</h3>
        <p>This component is functioning normally</p>
      </div>
    </ComponentErrorBoundary>

    {/* Component with error */}
    <ComponentErrorBoundary errorBoundaryId="broken-card">
      <div className="p-4 border rounded bg-red-50">
        <h3>Broken Component</h3>
        <ProblematicComponent />
      </div>
    </ComponentErrorBoundary>

    {/* Another working component to show isolation */}
    <ComponentErrorBoundary errorBoundaryId="another-working-card">
      <div className="p-4 border rounded bg-blue-50">
        <h3>Another Working Component</h3>
        <p>This component continues to work despite the error above</p>
      </div>
    </ComponentErrorBoundary>
  </div>
);

// ============================================================================
// Example 4: Specialized Error Boundaries
// ============================================================================

export const SpecializedBoundariesExample: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
    {/* API Error Boundary */}
    <ApiErrorBoundary errorBoundaryId="api-section">
      <div className="p-4 border rounded">
        <h3>API Data</h3>
        <ApiComponent />
      </div>
    </ApiErrorBoundary>

    {/* Data Error Boundary */}
    <DataErrorBoundary errorBoundaryId="data-section">
      <div className="p-4 border rounded">
        <h3>Data Processing</h3>
        <DataComponent />
      </div>
    </DataErrorBoundary>

    {/* Navigation Error Boundary */}
    <NavigationErrorBoundary errorBoundaryId="nav-section">
      <div className="p-4 border rounded">
        <h3>Navigation</h3>
        <ProblematicComponent />
      </div>
    </NavigationErrorBoundary>
  </div>
);

// ============================================================================
// Example 5: HOC Pattern
// ============================================================================

const UnsafeComponent: React.FC<{ name: string }> = ({ name }) => {
  if (name === 'error') {
    throw new Error('HOC component error');
  }
  return <div>Hello, {name}!</div>;
};

// Wrap component with error boundary using HOC
const SafeComponent = withErrorBoundary(UnsafeComponent, {
  level: 'component',
  errorBoundaryId: 'safe-component-hoc',
  variant: 'default',
});

export const HOCExample: React.FC = () => (
  <div className="space-y-4 p-4">
    <h2>HOC Pattern Example</h2>
    <SafeComponent name="World" />
    <SafeComponent name="error" />
    <SafeComponent name="HASIVU" />
  </div>
);

// ============================================================================
// Example 6: Custom Configuration
// ============================================================================

export const CustomConfigurationExample: React.FC = () => (
  <div className="space-y-4 p-4">
    <h2>Custom Configuration Example</h2>

    {/* Custom retry limits */}
    <UnifiedErrorBoundary
      level="section"
      maxRetries={5}
      retryable={true}
      errorBoundaryId="custom-retry"
      title="High Availability Component"
      description="This component has extended retry capabilities"
      variant="destructive"
      isolate={true}
    >
      <div className="p-4 border rounded">
        <h3>High Retry Component</h3>
        <ProblematicComponent />
      </div>
    </UnifiedErrorBoundary>

    {/* Non-retryable with custom fallback */}
    <UnifiedErrorBoundary
      level="component"
      retryable={false}
      errorBoundaryId="custom-fallback"
      fallback={
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4>Custom Fallback UI</h4>
          <p>This is a completely custom fallback interface</p>
        </div>
      }
    >
      <div className="p-4 border rounded">
        <h3>Custom Fallback Component</h3>
        <ProblematicComponent />
      </div>
    </UnifiedErrorBoundary>
  </div>
);

// ============================================================================
// Example 7: Nested Error Boundaries
// ============================================================================

export const NestedBoundariesExample: React.FC = () => (
  <PageErrorBoundary errorBoundaryId="nested-page">
    <div className="p-4">
      <h1>Nested Error Boundaries</h1>

      <SectionErrorBoundary errorBoundaryId="nested-section-1">
        <div className="p-4 border rounded mb-4">
          <h2>Section 1</h2>
          <ComponentErrorBoundary errorBoundaryId="nested-component-1">
            <div className="p-2 bg-gray-50 rounded">
              <p>Working nested component</p>
            </div>
          </ComponentErrorBoundary>
        </div>
      </SectionErrorBoundary>

      <SectionErrorBoundary errorBoundaryId="nested-section-2">
        <div className="p-4 border rounded">
          <h2>Section 2</h2>
          <ComponentErrorBoundary errorBoundaryId="nested-component-2">
            <div className="p-2 bg-gray-50 rounded">
              <ProblematicComponent />
            </div>
          </ComponentErrorBoundary>
        </div>
      </SectionErrorBoundary>
    </div>
  </PageErrorBoundary>
);

// ============================================================================
// All Examples Combined
// ============================================================================

export const AllExamples: React.FC = () => (
  <div className="space-y-8">
    <div>
      <h1 className="text-2xl font-bold mb-4">HASIVU Error Boundary Examples</h1>
      <p className="text-muted-foreground mb-6">
        These examples demonstrate various error boundary configurations and use cases. Each section
        is isolated, so errors in one section won't affect others.
      </p>
    </div>

    <SectionLevelExample />
    <ComponentLevelExample />
    <SpecializedBoundariesExample />
    <HOCExample />
    <CustomConfigurationExample />
  </div>
);

export default AllExamples;
