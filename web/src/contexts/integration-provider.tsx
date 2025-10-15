/**
 * HASIVU Platform - Integration Provider
 * Main provider that orchestrates all backend integrations and real-time features
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthProvider } from './auth-context';
import { apiClient } from '../lib/api-client';
import { socketClient } from '../lib/socket-client';
import { toast, Toaster } from 'react-hot-toast';

interface IntegrationState {
  isOnline: boolean;
  apiHealth: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime?: number;
    lastCheck: Date;
  };
  socketStatus: {
    connected: boolean;
    reconnectAttempts: number;
    lastConnected?: Date;
  };
  systemStatus: {
    maintenance: boolean;
    version: string;
    environment: string;
  };
}

interface IntegrationContextType extends IntegrationState {
  checkApiHealth: () => Promise<void>;
  reconnectSocket: () => void;
  getSystemInfo: () => Promise<any>;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

interface IntegrationProviderProps {
  children: React.ReactNode;
}

export function IntegrationProvider({ children }: IntegrationProviderProps) {
  const [state, setState] = useState<IntegrationState>({
    isOnline: navigator.onLine,
    apiHealth: {
      status: 'healthy',
      lastCheck: new Date(),
    },
    socketStatus: {
      connected: false,
      reconnectAttempts: 0,
    },
    systemStatus: {
      maintenance: false,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  });

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      toast.success('Connection restored', { id: 'connection-status' });
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      toast.error('Connection lost', { id: 'connection-status', duration: Infinity });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor socket connection status
  useEffect(() => {
    const updateSocketStatus = () => {
      const stats = socketClient.getConnectionStats();
      setState(prev => ({
        ...prev,
        socketStatus: {
          connected: stats.isConnected,
          reconnectAttempts: stats.reconnectAttempts,
          lastConnected: stats.lastConnected,
        },
      }));
    };

    const unsubscribe = socketClient.subscribe('connection_status', data => {
      updateSocketStatus();

      if (data.status === 'connected') {
        toast.dismiss('socket-disconnected');
      } else if (data.status === 'disconnected') {
        toast.error('Real-time updates disconnected', {
          id: 'socket-disconnected',
          duration: 5000,
        });
      }
    });

    // Initial status check
    updateSocketStatus();

    return unsubscribe;
  }, []);

  // API health check
  const checkApiHealth = async () => {
    try {
      const startTime = Date.now();
      const response = await apiClient.get('/health');
      const responseTime = Date.now() - startTime;

      setState(prev => ({
        ...prev,
        apiHealth: {
          status: response.success ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date(),
        },
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        apiHealth: {
          status: 'down',
          lastCheck: new Date(),
        },
      }));
    }
  };

  // Socket reconnection
  const reconnectSocket = () => {
    socketClient.reconnect();
    toast.loading('Reconnecting...', { id: 'socket-reconnecting' });
  };

  // Get system information
  const getSystemInfo = async () => {
    try {
      const [versionResponse, statusResponse] = await Promise.all([
        apiClient.get('/system/version'),
        apiClient.get('/system/status'),
      ]);

      if (versionResponse.success && statusResponse.success) {
        setState(prev => ({
          ...prev,
          systemStatus: {
            maintenance: statusResponse.data.maintenance || false,
            version: versionResponse.data.version || '1.0.0',
            environment: versionResponse.data.environment || 'production',
          },
        }));

        return {
          version: versionResponse.data,
          status: statusResponse.data,
        };
      }
    } catch (error) {
      // Error handled silently
    }

    return null;
  };

  // Periodic health checks
  useEffect(() => {
    checkApiHealth();
    getSystemInfo();

    // Check API health every 60 seconds
    const healthInterval = setInterval(checkApiHealth, 60000);

    // Check system status every 5 minutes
    const statusInterval = setInterval(getSystemInfo, 5 * 60 * 1000);

    return () => {
      clearInterval(healthInterval);
      clearInterval(statusInterval);
    };
  }, []);

  const value: IntegrationContextType = {
    ...state,
    checkApiHealth,
    reconnectSocket,
    getSystemInfo,
  };

  return (
    <IntegrationContext.Provider value={value}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </AuthProvider>
    </IntegrationContext.Provider>
  );
}

export function useIntegration(): IntegrationContextType {
  const context = useContext(IntegrationContext);
  if (context === undefined) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  return context;
}

// Connection status indicator component
export function ConnectionStatusIndicator() {
  const { isOnline, apiHealth, socketStatus } = useIntegration();

  const getStatusColor = () => {
    if (!isOnline || apiHealth.status === 'down') return 'bg-red-500';
    if (apiHealth.status === 'degraded' || !socketStatus.connected) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (apiHealth.status === 'down') return 'API Down';
    if (apiHealth.status === 'degraded') return 'Degraded';
    if (!socketStatus.connected) return 'Real-time Disconnected';
    return 'Connected';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-gray-600 dark:text-gray-300">{getStatusText()}</span>
      {apiHealth.responseTime && (
        <span className="text-xs text-gray-500">({apiHealth.responseTime}ms)</span>
      )}
    </div>
  );
}

// System maintenance banner
export function MaintenanceBanner() {
  const { systemStatus } = useIntegration();

  if (!systemStatus.maintenance) return null;

  return (
    <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
      ⚠️ System maintenance in progress. Some features may be unavailable.
    </div>
  );
}

// Error boundary for integration errors
export class IntegrationErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Report error to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Add error reporting here (e.g., Sentry)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Something went wrong
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  An error occurred while loading the application.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Reload Application
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for API status monitoring
export function useApiStatus() {
  const { apiHealth, checkApiHealth } = useIntegration();

  return {
    status: apiHealth.status,
    responseTime: apiHealth.responseTime,
    lastCheck: apiHealth.lastCheck,
    refresh: checkApiHealth,
    isHealthy: apiHealth.status === 'healthy',
  };
}

// Hook for real-time connection monitoring
export function useConnectionStatus() {
  const { isOnline, socketStatus, reconnectSocket } = useIntegration();

  return {
    isOnline,
    socketConnected: socketStatus.connected,
    reconnectAttempts: socketStatus.reconnectAttempts,
    lastConnected: socketStatus.lastConnected,
    reconnect: reconnectSocket,
    isFullyConnected: isOnline && socketStatus.connected,
  };
}

export default IntegrationProvider;
