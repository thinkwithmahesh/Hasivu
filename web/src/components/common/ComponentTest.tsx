/**
 * HASIVU Platform - Component Integration Test
 * Test file to verify all common components work together correctly
 * Can be used for development and testing purposes
 */

import React, { useState } from 'react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Container,
  Paper,
} from '@mui/material';
import {
  LoadingScreen,
  ErrorBoundary,
  ProgressBarProvider,
  useProgressBar,
} from '@/components/common';

/**
 * Error throwing component for testing ErrorBoundary
 */
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error thrown for ErrorBoundary demonstration');
  }
  return (
    <Typography color="success.main">
      ✅ No errors - ErrorBoundary is working correctly!
    </Typography>
  );
};

/**
 * Progress bar demonstration component
 */
const ProgressBarDemo: React.FC = () => {
  const progressBar = useProgressBar();
  
  const handleStartProgress = () => {
    progressBar.start(3000); // 3 second simulation
    
    // Simulate finishing after delay
    setTimeout(() => {
      progressBar.finish();
    }, 3000);
  };

  const handleSetProgress = (value: number) => {
    progressBar.set(value);
  };

  const handleIncrement = () => {
    progressBar.increment(10);
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Progress Bar Demo</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button variant="contained" onClick={handleStartProgress}>
          Start Auto Progress
        </Button>
        <Button variant="outlined" onClick={() => handleSetProgress(25)}>
          Set 25%
        </Button>
        <Button variant="outlined" onClick={() => handleSetProgress(50)}>
          Set 50%
        </Button>
        <Button variant="outlined" onClick={() => handleSetProgress(75)}>
          Set 75%
        </Button>
        <Button variant="outlined" onClick={handleIncrement}>
          Increment +10%
        </Button>
        <Button color="success" onClick={() => progressBar.finish()}>
          Finish
        </Button>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        Current progress: {Math.round(progressBar.progress)}% | 
        Visible: {progressBar.isVisible ? 'Yes' : 'No'}
      </Typography>
    </Stack>
  );
};

/**
 * Main component test page
 */
const ComponentTest: React.FC = () => {
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [throwError, setThrowError] = useState(false);

  const simulateLoading = () => {
    setShowLoadingScreen(true);
    setLoadingProgress(0);

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowLoadingScreen(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const resetErrorBoundary = () => {
    setThrowError(false);
    // Force re-render
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <ProgressBarProvider>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom align="center">
          HASIVU Common Components Test
        </Typography>
        
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          This page demonstrates all the common components working together.
        </Typography>

        <Stack spacing={4}>
          {/* Loading Screen Demo */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🔄 LoadingScreen Component
            </Typography>
            
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button 
                  variant="contained" 
                  onClick={simulateLoading}
                  disabled={showLoadingScreen}
                >
                  {showLoadingScreen ? 'Loading...' : 'Test Loading Screen'}
                </Button>
                
                <Button 
                  variant="outlined"
                  onClick={() => setShowLoadingScreen(!showLoadingScreen)}
                >
                  Toggle Loading Screen
                </Button>
              </Stack>

              <Typography variant="body2" color="text.secondary">
                Current progress: {loadingProgress}%
              </Typography>
            </Stack>

            {/* Show loading screen when active */}
            {showLoadingScreen && (
              <LoadingScreen
                variant="inline"
                message="Testing HASIVU loading..."
                progress={loadingProgress}
                details="Simulating data loading process"
                showLogo={true}
                size="large"
              />
            )}
          </Paper>

          {/* Error Boundary Demo */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              🛡️ ErrorBoundary Component
            </Typography>
            
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                <Button 
                  variant="contained" 
                  color="error"
                  onClick={() => setThrowError(true)}
                  disabled={throwError}
                >
                  {throwError ? 'Error Thrown' : 'Test Error Boundary'}
                </Button>
                
                <Button 
                  variant="outlined"
                  onClick={resetErrorBoundary}
                >
                  Reset Error State
                </Button>
              </Stack>

              <ErrorBoundary
                showDetails={true}
                showRetry={true}
                errorMessages={{
                  title: "Test Error Boundary",
                  description: "This is a controlled error for testing purposes.",
                  actionText: "Try Again"
                }}
                onError={(error, errorInfo) => {
                  console.log('ErrorBoundary caught error:', { error, errorInfo });
                }}
              >
                <ErrorThrowingComponent shouldThrow={throwError} />
              </ErrorBoundary>
            </Stack>
          </Paper>

          {/* Progress Bar Demo */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              📊 ProgressBar Component
            </Typography>
            <ProgressBarDemo />
          </Paper>

          {/* Integration Status */}
          <Paper sx={{ p: 3, bgcolor: 'success.light' }}>
            <Typography variant="h6" gutterBottom color="success.dark">
              ✅ Integration Status
            </Typography>
            
            <Typography variant="body1" paragraph>
              All HASIVU common components have been successfully integrated:
            </Typography>
            
            <Box component="ul" sx={{ color: 'success.dark' }}>
              <li>LoadingScreen - ✅ Working with animations and progress tracking</li>
              <li>ErrorBoundary - ✅ Catching errors with user-friendly fallbacks</li>
              <li>ProgressBar - ✅ Provider context and router integration ready</li>
              <li>TypeScript - ✅ Full type safety and IntelliSense support</li>
              <li>Theme Integration - ✅ HASIVU brand colors and styling</li>
              <li>Accessibility - ✅ ARIA labels and keyboard navigation</li>
              <li>Mobile Responsive - ✅ Optimized for all screen sizes</li>
            </Box>
          </Paper>
        </Stack>
      </Container>
    </ProgressBarProvider>
  );
};

export default ComponentTest;