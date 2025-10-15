'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import {
  Wifi,
  WifiOff,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Upload,
  Download,
  Loader2,
  Database,
  Sync,
  CloudOff,
  Cloud,
} from 'lucide-react';

// Types for offline operations
interface OfflineOperation {
  id: string;
  type: 'order' | 'payment' | 'wallet' | 'feedback' | 'profile';
  action: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'retrying' | 'failed' | 'completed';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiry: number;
  category: string;
}

// IndexedDB utilities for offline storage
class OfflineStorage {
  private dbName = 'hasivu-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for offline operations queue
        if (!db.objectStoreNames.contains('operations')) {
          const operationsStore = db.createObjectStore('operations', { keyPath: 'id' });
          operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
          operationsStore.createIndex('status', 'status', { unique: false });
          operationsStore.createIndex('type', 'type', { unique: false });
        }

        // Store for cached data
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('category', 'category', { unique: false });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for meal data
        if (!db.objectStoreNames.contains('meals')) {
          const mealsStore = db.createObjectStore('meals', { keyPath: 'id' });
          mealsStore.createIndex('date', 'date', { unique: false });
          mealsStore.createIndex('category', 'category', { unique: false });
        }
      };
    });
  }

  async addOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.add(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getOperations(status?: string): Promise<OfflineOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readonly');
      const store = transaction.objectStore('operations');

      let request: IDBRequest;
      if (status) {
        const index = store.index('status');
        request = index.getAll(status);
      } else {
        request = store.getAll();
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async updateOperation(operation: OfflineOperation): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.put(operation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async deleteOperation(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['operations'], 'readwrite');
      const store = transaction.objectStore('operations');
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async cacheData(
    key: string,
    data: any,
    category: string,
    expiry: number = 24 * 60 * 60 * 1000
  ): Promise<void> {
    if (!this.db) await this.init();

    const cachedData: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
      category,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cachedData);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          if (result) {
            // Delete expired data
            this.deleteCachedData(key);
          }
          resolve(null);
        }
      };
    });
  }

  async deleteCachedData(key: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearExpiredCache(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const now = Date.now();
        const expired = request.result.filter(item => item.expiry <= now);

        const deletePromises = expired.map(item => this.deleteCachedData(item.key));
        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject);
      };
    });
  }
}

// Initialize storage instance
const offlineStorage = new OfflineStorage();

// Offline Queue Hook
export const useOfflineQueue = () => {
  const [operations, setOperations] = useState<OfflineOperation[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load operations from storage
  const loadOperations = useCallback(async () => {
    try {
      const storedOperations = await offlineStorage.getOperations();
      setOperations(storedOperations.sort((a, b) => a.timestamp - b.timestamp));
    } catch (error) {}
  }, []);

  // Add operation to queue
  const addOperation = useCallback(
    async (
      type: OfflineOperation['type'],
      action: string,
      data: any,
      url: string,
      method: OfflineOperation['method'] = 'POST',
      headers?: Record<string, string>
    ) => {
      const operation: OfflineOperation = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        action,
        data,
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
        url,
        method,
        headers,
      };

      try {
        await offlineStorage.addOperation(operation);
        setOperations(prev => [...prev, operation].sort((a, b) => a.timestamp - b.timestamp));

        // Try to process immediately if online
        if (isOnline) {
          processQueue();
        }

        return operation.id;
      } catch (error) {
        return null;
      }
    },
    [isOnline]
  );

  // Process offline queue
  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current) return;

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const pendingOperations = await offlineStorage.getOperations('pending');
      const retryingOperations = await offlineStorage.getOperations('retrying');
      const toProcess = [...pendingOperations, ...retryingOperations];

      for (const operation of toProcess) {
        try {
          // Update status to retrying
          operation.status = 'retrying';
          await offlineStorage.updateOperation(operation);
          setOperations(prev => prev.map(op => (op.id === operation.id ? operation : op)));

          // Execute the operation
          const response = await fetch(operation.url, {
            method: operation.method,
            headers: {
              'Content-Type': 'application/json',
              ...operation.headers,
            },
            body: operation.method !== 'GET' ? JSON.stringify(operation.data) : undefined,
          });

          if (response.ok) {
            // Success - remove from queue
            operation.status = 'completed';
            await offlineStorage.deleteOperation(operation.id);
            setOperations(prev => prev.filter(op => op.id !== operation.id));

            // Notify user of successful sync
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({
                type: 'OPERATION_SYNCED',
                data: { operation, success: true },
              });
            }
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        } catch (error) {
          operation.retryCount++;

          if (operation.retryCount >= operation.maxRetries) {
            operation.status = 'failed';
          } else {
            operation.status = 'pending';
          }

          await offlineStorage.updateOperation(operation);
          setOperations(prev => prev.map(op => (op.id === operation.id ? operation : op)));
        }
      }
    } catch (error) {
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [isOnline]);

  // Retry failed operation
  const retryOperation = useCallback(
    async (operationId: string) => {
      const operation = operations.find(op => op.id === operationId);
      if (!operation) return;

      operation.status = 'pending';
      operation.retryCount = 0;

      try {
        await offlineStorage.updateOperation(operation);
        setOperations(prev => prev.map(op => (op.id === operationId ? operation : op)));

        if (isOnline) {
          processQueue();
        }
      } catch (error) {}
    },
    [operations, isOnline, processQueue]
  );

  // Delete operation
  const deleteOperation = useCallback(async (operationId: string) => {
    try {
      await offlineStorage.deleteOperation(operationId);
      setOperations(prev => prev.filter(op => op.id !== operationId));
    } catch (error) {}
  }, []);

  // Clear all operations
  const clearQueue = useCallback(async () => {
    try {
      const allOperations = await offlineStorage.getOperations();
      await Promise.all(allOperations.map(op => offlineStorage.deleteOperation(op.id)));
      setOperations([]);
    } catch (error) {}
  }, []);

  // Load operations on mount
  useEffect(() => {
    loadOperations();
  }, [loadOperations]);

  // Auto-process queue when coming online
  useEffect(() => {
    if (isOnline && operations.some(op => op.status === 'pending')) {
      processQueue();
    }
  }, [isOnline, operations, processQueue]);

  return {
    operations,
    isOnline,
    isProcessing,
    addOperation,
    retryOperation,
    deleteOperation,
    clearQueue,
    processQueue,
  };
};

// Cached Data Hook
export const useCachedData = () => {
  const [cacheStats, setCacheStats] = useState({
    totalSize: 0,
    itemCount: 0,
    categories: {} as Record<string, number>,
  });

  const getCachedData = useCallback(async (key: string) => {
    try {
      return await offlineStorage.getCachedData(key);
    } catch (error) {
      return null;
    }
  }, []);

  const setCachedData = useCallback(
    async (
      key: string,
      data: any,
      category: string = 'default',
      expiry: number = 24 * 60 * 60 * 1000 // 24 hours
    ) => {
      try {
        await offlineStorage.cacheData(key, data, category, expiry);
        updateCacheStats();
      } catch (error) {}
    },
    []
  );

  const clearExpiredCache = useCallback(async () => {
    try {
      await offlineStorage.clearExpiredCache();
      updateCacheStats();
    } catch (error) {}
  }, []);

  const updateCacheStats = useCallback(async () => {
    // This would need to be implemented based on IndexedDB size calculation
    // For now, we'll use approximate values
    setCacheStats({
      totalSize: 0, // Would calculate actual size
      itemCount: 0, // Would count actual items
      categories: {}, // Would group by category
    });
  }, []);

  useEffect(() => {
    updateCacheStats();
  }, [updateCacheStats]);

  return {
    cacheStats,
    getCachedData,
    setCachedData,
    clearExpiredCache,
  };
};

// Offline Queue Component
interface OfflineQueueProps {
  className?: string;
}

export const OfflineQueue: React.FC<OfflineQueueProps> = ({ className }) => {
  const {
    operations,
    isOnline,
    isProcessing,
    retryOperation,
    deleteOperation,
    clearQueue,
    processQueue,
  } = useOfflineQueue();

  const pendingCount = operations.filter(op => op.status === 'pending').length;
  const failedCount = operations.filter(op => op.status === 'failed').length;

  const getOperationIcon = (operation: OfflineOperation) => {
    switch (operation.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'retrying':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationTitle = (operation: OfflineOperation) => {
    const typeLabels = {
      order: 'Meal Order',
      payment: 'Payment',
      wallet: 'Wallet Update',
      feedback: 'Feedback',
      profile: 'Profile Update',
    };

    return `${typeLabels[operation.type]} - ${operation.action}`;
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-green-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <h3 className="font-semibold">Offline Queue</h3>
          {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
        </div>

        <div className="flex items-center space-x-2">
          {pendingCount > 0 && <Badge variant="secondary">{pendingCount} pending</Badge>}
          {failedCount > 0 && <Badge variant="destructive">{failedCount} failed</Badge>}
        </div>
      </div>

      {!isOnline && (
        <Alert className="mb-4">
          <CloudOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Operations will be queued and synced when connection is restored.
          </AlertDescription>
        </Alert>
      )}

      {operations.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No offline operations</p>
        </div>
      ) : (
        <div className="space-y-3">
          {operations.map(operation => (
            <div
              key={operation.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {getOperationIcon(operation)}
                <div>
                  <div className="text-sm font-medium">{getOperationTitle(operation)}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(operation.timestamp).toLocaleString()}
                    {operation.retryCount > 0 && (
                      <span className="ml-2">
                        (Retry {operation.retryCount}/{operation.maxRetries})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {operation.status === 'failed' && (
                  <Button size="sm" variant="outline" onClick={() => retryOperation(operation.id)}>
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                )}

                <Button size="sm" variant="ghost" onClick={() => deleteOperation(operation.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {operations.length > 1 && (
            <div className="flex justify-between pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={processQueue}
                disabled={!isOnline || isProcessing}
              >
                <Sync className="h-4 w-4 mr-2" />
                Sync Now
              </Button>

              <Button variant="destructive" size="sm" onClick={clearQueue}>
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// Cached Data Manager Component
interface CachedDataManagerProps {
  className?: string;
}

export const CachedDataManager: React.FC<CachedDataManagerProps> = ({ className }) => {
  const { cacheStats, clearExpiredCache } = useCachedData();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearExpired = async () => {
    setIsClearing(true);
    await clearExpiredCache();
    setIsClearing(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <Database className="h-4 w-4 mr-2" />
          Cached Data
        </h3>

        <Button variant="outline" size="sm" onClick={handleClearExpired} disabled={isClearing}>
          {isClearing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Clear Expired
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">{cacheStats.itemCount}</div>
          <div className="text-blue-700">Items Cached</div>
        </div>

        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {formatBytes(cacheStats.totalSize)}
          </div>
          <div className="text-green-700">Storage Used</div>
        </div>
      </div>

      {Object.keys(cacheStats.categories).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">By Category</h4>
          <div className="space-y-1">
            {Object.entries(cacheStats.categories).map(([category, count]) => (
              <div key={category} className="flex justify-between text-xs">
                <span className="capitalize">{category}</span>
                <span className="font-mono">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};
