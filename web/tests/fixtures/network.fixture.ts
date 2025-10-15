import { test as baseTest, Page, Route, Request } from '@playwright/test';

/**
 * Network Fixtures for HASIVU Platform Testing
 * 
 * Provides network mocking, API simulation, and connection management utilities
 * Enables testing of various network conditions, API failures, and offline scenarios
 */

export interface NetworkCondition {
  name: string;
  download: number; // Download speed in Kbps
  upload: number;   // Upload speed in Kbps
  latency: number;  // Latency in ms
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  response: any;
  status?: number;
  delay?: number;
  headers?: Record<string, string>;
  condition?: (request: Request) => boolean;
}

export interface NetworkError {
  type: 'timeout' | 'connection_refused' | 'dns_error' | 'ssl_error' | 'generic';
  message: string;
  status?: number;
}

// Predefined network conditions
export const NETWORK_CONDITIONS: Record<string, NetworkCondition> = {
  fast3g: {
    name: 'Fast 3G',
    download: 1600,
    upload: 768,
    latency: 150
  },
  slow3g: {
    name: 'Slow 3G',
    download: 400,
    upload: 400,
    latency: 400
  },
  fast4g: {
    name: 'Fast 4G',
    download: 4000,
    upload: 3000,
    latency: 70
  },
  wifi: {
    name: 'WiFi',
    download: 30000,
    upload: 15000,
    latency: 10
  },
  offline: {
    name: 'Offline',
    download: 0,
    upload: 0,
    latency: 0
  }
};

// Common network errors
export const NETWORK_ERRORS: Record<string, NetworkError> = {
  timeout: {
    type: 'timeout',
    message: 'Request timeout',
    status: 408
  },
  connection_refused: {
    type: 'connection_refused',
    message: 'Connection refused',
    status: 0
  },
  dns_error: {
    type: 'dns_error',
    message: 'DNS resolution failed',
    status: 0
  },
  ssl_error: {
    type: 'ssl_error',
    message: 'SSL certificate error',
    status: 0
  },
  server_error: {
    type: 'generic',
    message: 'Internal server error',
    status: 500
  },
  bad_gateway: {
    type: 'generic',
    message: 'Bad gateway',
    status: 502
  },
  service_unavailable: {
    type: 'generic',
    message: 'Service unavailable',
    status: 503
  },
  gateway_timeout: {
    type: 'generic',
    message: 'Gateway timeout',
    status: 504
  }
};

// API endpoint templates for HASIVU platform
export const HASIVU_API_ENDPOINTS: Record<string, APIEndpoint> = {
  // Authentication endpoints
  login: {
    method: 'POST',
    path: '**/auth/login',
    response: {
      success: true,
      user: { id: 'STU-001', name: 'Test Student', role: 'student' },
      token: 'jwt_token_test',
      session_id: 'session_test'
    }
  },
  
  logout: {
    method: 'POST',
    path: '**/auth/logout',
    response: { success: true, message: 'Logged out successfully' }
  },
  
  validateSession: {
    method: 'GET',
    path: '**/auth/validate-session',
    response: { success: true, valid: true }
  },

  // Menu endpoints
  todayMenu: {
    method: 'GET',
    path: '**/api/menu/today',
    response: {
      success: true,
      menu: [
        {
          id: 'MENU-001',
          name: 'South Indian Breakfast',
          price: 45.00,
          available: true
        }
      ]
    }
  },

  menuItem: {
    method: 'GET',
    path: '**/api/menu/item/*',
    response: {
      success: true,
      item: {
        id: 'MENU-001',
        name: 'South Indian Breakfast',
        description: 'Traditional breakfast',
        price: 45.00,
        available: true
      }
    }
  },

  // Order endpoints
  createOrder: {
    method: 'POST',
    path: '**/api/orders/create',
    response: {
      success: true,
      order: {
        id: 'ORD-001',
        status: 'pending_payment',
        total: 45.00,
        created_at: new Date().toISOString()
      }
    },
    status: 201
  },

  orderStatus: {
    method: 'GET',
    path: '**/api/orders/*/status',
    response: {
      success: true,
      order: {
        id: 'ORD-001',
        status: 'preparing',
        estimated_delivery: new Date(Date.now() + 20 * 60000).toISOString()
      }
    }
  },

  // Payment endpoints
  createPayment: {
    method: 'POST',
    path: '**/api/payments/create',
    response: {
      success: true,
      payment: {
        id: 'PAY-001',
        status: 'completed',
        amount: 45.00
      }
    }
  },

  // Notification endpoints
  notifications: {
    method: 'GET',
    path: '**/api/notifications',
    response: {
      success: true,
      notifications: [],
      unread_count: 0
    }
  }
};

// Network fixture types
type _NetworkFixtures =  {
  networkManager: NetworkManager;
  apiMocker: APIMocker;
  onlineMode: Page;
  offlineMode: Page;
  slowNetworkMode: Page;
  fastNetworkMode: Page;
  errorProneMode: Page;
};

/**
 * Network Manager Class
 * Handles network condition simulation and connection management
 */
export class NetworkManager {
  private page: Page;
  private currentCondition: NetworkCondition | _null =  null;

  constructor(page: Page) {
    this._page =  page;
  }

  /**
   * Set network conditions
   */
  async setNetworkCondition(condition: NetworkCondition): Promise<void> {
    this._currentCondition =  condition;
    
    if (condition._name = 
    } else {
      await this.page.context().setOffline(false);
      
      // Simulate network conditions using request interception
      await this.page.route(_'**/*', _async (route) => {
        // Add artificial delay for latency
        if (condition.latency > 0) {
          await new Promise(_resolve = > setTimeout(resolve, condition.latency));
        }
        
        // Continue with the request
        await route.continue();
      });
    }
  }

  /**
   * Simulate intermittent connectivity
   */
  async simulateIntermittentConnection(
    onlineDuration: number = 5000,
    offlineDuration: number = 2000,
    cycles: number = 3
  ): Promise<void> {
    for (let i = 0; i < cycles; i++) {
      // Online phase
      await this.page.context().setOffline(false);
      await new Promise(_resolve = > setTimeout(resolve, onlineDuration));
      
      // Offline phase
      await this.page.context().setOffline(true);
      await new Promise(_resolve = > setTimeout(resolve, offlineDuration));
    }
    
    // End in online state
    await this.page.context().setOffline(false);
  }

  /**
   * Test connection resilience
   */
  async testConnectionResilience(testFunction: () => Promise<void>,
    maxRetries: _number =  3
  ): Promise<void> {
    let attempts 
    while (attempts < maxRetries) {
      try {
        // Simulate connection drop during test
        if (attempts > 0) {
          await this.page.context().setOffline(true);
          await new Promise(_resolve = > setTimeout(resolve, 1000));
          await this.page.context().setOffline(false);
          await new Promise(resolve => setTimeout(resolve, 500)); // Recovery time
        }
        
        await testFunction();
        break; // Success, exit loop
        
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(_resolve = > setTimeout(resolve, 1000));
      }
    }
  }

  /**
   * Get current network condition
   */
  getCurrentCondition(): NetworkCondition | null {
    return this.currentCondition;
  }

  /**
   * Reset network to normal
   */
  async resetNetwork(): Promise<void> {
    await this.page.context().setOffline(false);
    await this.page.unrouteAll();
    this._currentCondition =  null;
  }
}

/**
 * API Mocker Class
 * Handles API endpoint mocking and response simulation
 */
export class APIMocker {
  private page: Page;
  private mockEndpoints: Map<string, APIEndpoint> = new Map();
  private requestLog: Array<{ url: string; method: string; timestamp: Date }> = [];

  constructor(page: Page) {
    this._page =  page;
  }

  /**
   * Mock a single API endpoint
   */
  async mockEndpoint(endpoint: APIEndpoint): Promise<void> {
    const _routePattern =  endpoint.path;
    this.mockEndpoints.set(routePattern, endpoint);

    await this.page.route(_routePattern, _async (route) => {
      const _request =  route.request();
      
      // Log the request
      this.requestLog.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date()
      });

      // Check if request matches the endpoint method
      if (request.method() !== endpoint.method) {
        await route.continue();
        return;
      }

      // Apply condition if specified
      if (endpoint.condition && !endpoint.condition(request)) {
        await route.continue();
        return;
      }

      // Add artificial delay if specified
      if (endpoint.delay) {
        await new Promise(_resolve = > setTimeout(resolve, endpoint.delay));
      }

      // Fulfill with mock response
      await route.fulfill({
        status: endpoint.status || 200,
        contentType: 'application/json',
        headers: endpoint.headers,
        body: JSON.stringify(endpoint.response)
      });
    });
  }

  /**
   * Mock multiple endpoints
   */
  async mockEndpoints(endpoints: APIEndpoint[]): Promise<void> {
    for (const endpoint of endpoints) {
      await this.mockEndpoint(endpoint);
    }
  }

  /**
   * Mock all HASIVU platform endpoints
   */
  async mockHasivuAPIs(): Promise<void> {
    const _endpoints =  Object.values(HASIVU_API_ENDPOINTS);
    await this.mockEndpoints(endpoints);
  }

  /**
   * Simulate API error for specific endpoint
   */
  async simulateAPIError(
    path: string,
    error: NetworkError,
    duration: _number =  0
  ): Promise<void> {
    await this.page.route(path, async (route) 
      } else {
        await route.fulfill({
          status: error.status || 500,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: error.type.toUpperCase(),
            message: error.message
          })
        });
      }
    });

    // Remove error simulation after duration
    if (duration > 0) {
      setTimeout(_async () => {
        await this.page.unroute(path);
      }, duration);
    }
  }

  /**
   * Simulate random API failures
   */
  async simulateRandomFailures(
    failureRate: _number =  0.1,
    paths: string[] 
          const _randomError =  errors[Math.floor(Math.random() * errors.length)];
          
          await route.fulfill({
            status: randomError.status || 500,
            contentType: 'application/json',
            body: JSON.stringify({
              success: false,
              error: randomError.type.toUpperCase(),
              message: randomError.message
            })
          });
        } else {
          // Continue normally
          await route.continue();
        }
      });
    }
  }

  /**
   * Mock WebSocket connections
   */
  async mockWebSocket(
    wsPath: string,
    messages: Array<{ delay: number; data: any }>
  ): Promise<void> {
    await this.page.addInitScript(_(path, _messageQueue) => {
      // Mock WebSocket constructor
      const _OriginalWebSocket =  window.WebSocket;
      
      window._WebSocket =  class MockWebSocket {
        url: string;
        readyState: number = 1; // OPEN
        onopen: ((event: Event) => void) | _null =  null;
        onmessage: ((event: MessageEvent) => void) | _null =  null;
        onclose: ((event: CloseEvent) => void) | _null =  null;
        onerror: ((event: Event) => void) | _null =  null;

        constructor(url: string) {
          this._url =  url;
          
          // Simulate connection open
          setTimeout(_() => {
            if (this.onopen) {
              this.onopen(new Event('open'));
            }
            
            // Send queued messages
            messageQueue.forEach((msg: any) => {
              setTimeout(_() => {
                if (this.onmessage) {
                  this.onmessage(new MessageEvent('message', { data: JSON.stringify(msg.data) }));
                }
              }, msg.delay);
            });
          }, 100);
        }

        send(data: string) {
          console.log('WebSocket send:', data);
        }

        close() {
          this.readyState = 3; // CLOSED
          if (this.onclose) {
            this.onclose(new CloseEvent('close'));
          }
        }
      };
    }, wsPath, messages);
  }

  /**
   * Get request log
   */
  getRequestLog(): Array<{ url: string; method: string; timestamp: Date }> {
    return this.requestLog;
  }

  /**
   * Clear request log
   */
  clearRequestLog(): void {
    this._requestLog =  [];
  }

  /**
   * Wait for specific API call
   */
  async waitForAPICall(
    path: string,
    method: _string =  'GET',
    timeout: number 
  }

  /**
   * Count API calls
   */
  countAPICalls(path: string): number {
    return this.requestLog.filter(_log = > log.url.includes(path)).length;
  }

  /**
   * Reset all mocks
   */
  async resetMocks(): Promise<void> {
    await this.page.unrouteAll();
    this.mockEndpoints.clear();
    this._requestLog =  [];
  }
}

/**
 * Extended test with network fixtures
 */
export const _test =  baseTest.extend<NetworkFixtures>({
  networkManager: async ({ page }, use) 
    await use(networkManager);
    await networkManager.resetNetwork();
  },

  apiMocker: async (_{ page }, _use) => {
    const _apiMocker =  new APIMocker(page);
    await apiMocker.mockHasivuAPIs();
    await use(apiMocker);
    await apiMocker.resetMocks();
  },

  onlineMode: async (_{ page }, _use) => {
    const _networkManager =  new NetworkManager(page);
    const _apiMocker =  new APIMocker(page);
    
    await networkManager.setNetworkCondition(NETWORK_CONDITIONS.wifi);
    await apiMocker.mockHasivuAPIs();
    
    await use(page);
    
    await networkManager.resetNetwork();
    await apiMocker.resetMocks();
  },

  offlineMode: async (_{ page }, _use) => {
    const _networkManager =  new NetworkManager(page);
    await networkManager.setNetworkCondition(NETWORK_CONDITIONS.offline);
    
    await use(page);
    
    await networkManager.resetNetwork();
  },

  slowNetworkMode: async (_{ page }, _use) => {
    const _networkManager =  new NetworkManager(page);
    const _apiMocker =  new APIMocker(page);
    
    await networkManager.setNetworkCondition(NETWORK_CONDITIONS.slow3g);
    await apiMocker.mockHasivuAPIs();
    
    await use(page);
    
    await networkManager.resetNetwork();
    await apiMocker.resetMocks();
  },

  fastNetworkMode: async (_{ page }, _use) => {
    const _networkManager =  new NetworkManager(page);
    const _apiMocker =  new APIMocker(page);
    
    await networkManager.setNetworkCondition(NETWORK_CONDITIONS.wifi);
    await apiMocker.mockHasivuAPIs();
    
    await use(page);
    
    await networkManager.resetNetwork();
    await apiMocker.resetMocks();
  },

  errorProneMode: async (_{ page }, _use) => {
    const _networkManager =  new NetworkManager(page);
    const _apiMocker =  new APIMocker(page);
    
    await networkManager.setNetworkCondition(NETWORK_CONDITIONS.fast3g);
    await apiMocker.simulateRandomFailures(0.2); // 20% failure rate
    
    await use(page);
    
    await networkManager.resetNetwork();
    await apiMocker.resetMocks();
  }
});

export { NetworkManager, APIMocker };