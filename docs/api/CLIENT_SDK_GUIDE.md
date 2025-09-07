# HASIVU Platform Client SDK Guide

Complete guide for integrating with the HASIVU Platform using official SDKs and client libraries.

## Table of Contents

- [Overview](#overview)
- [JavaScript/TypeScript SDK](#javascripttypescript-sdk)
- [Python SDK](#python-sdk)
- [React Integration Guide](#react-integration-guide)
- [Node.js Backend Integration](#nodejs-backend-integration)
- [Error Handling](#error-handling)
- [Authentication Patterns](#authentication-patterns)
- [Best Practices](#best-practices)
- [Examples and Use Cases](#examples-and-use-cases)

## Overview

The HASIVU Platform provides official SDKs for popular programming languages and frameworks, making integration simple and reliable.

### Available SDKs

| SDK | Language | Status | Installation |
|-----|----------|---------|--------------|
| JavaScript/TypeScript | JavaScript, TypeScript | ✅ Stable | `npm install @hasivu/api-sdk` |
| React Components | React, Next.js | ✅ Stable | `npm install @hasivu/react-components` |
| Python | Python 3.7+ | ✅ Stable | `pip install hasivu-api` |
| Node.js | Node.js 14+ | ✅ Stable | `npm install @hasivu/node-sdk` |
| PHP | PHP 7.4+ | 🚧 Beta | `composer require hasivu/php-sdk` |
| Java | Java 8+ | 🚧 Beta | Maven/Gradle available |

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @hasivu/api-sdk
# or
yarn add @hasivu/api-sdk
```

### Basic Setup

```typescript
import { HasivuAPI, HasivuConfig } from '@hasivu/api-sdk';

const config: HasivuConfig = {
  baseURL: 'https://api.hasivu.com',
  environment: 'production', // 'development', 'staging', 'production'
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
};

const api = new HasivuAPI(config);
```

### Authentication

```typescript
// Login and store tokens
const loginUser = async (email: string, password: string) => {
  try {
    const response = await api.auth.login({ email, password });
    
    // Store tokens securely
    localStorage.setItem('hasivu_access_token', response.tokens.accessToken);
    localStorage.setItem('hasivu_refresh_token', response.tokens.refreshToken);
    
    // Set token for subsequent requests
    api.setAccessToken(response.tokens.accessToken);
    
    return response.user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

// Initialize with stored token
const initializeAPI = () => {
  const accessToken = localStorage.getItem('hasivu_access_token');
  if (accessToken) {
    api.setAccessToken(accessToken);
  }
};

// Auto-refresh token
api.onTokenExpired(async () => {
  const refreshToken = localStorage.getItem('hasivu_refresh_token');
  if (refreshToken) {
    try {
      const response = await api.auth.refresh({ refreshToken });
      localStorage.setItem('hasivu_access_token', response.accessToken);
      api.setAccessToken(response.accessToken);
      return response.accessToken;
    } catch (error) {
      // Redirect to login
      window.location.href = '/login';
    }
  }
});
```

### API Methods

#### Authentication

```typescript
interface AuthMethods {
  login(credentials: LoginRequest): Promise<LoginResponse>;
  register(userData: RegisterRequest): Promise<RegisterResponse>;
  verifyEmail(data: VerifyEmailRequest): Promise<SuccessResponse>;
  refresh(data: RefreshTokenRequest): Promise<TokenResponse>;
  logout(): Promise<SuccessResponse>;
  me(): Promise<UserProfile>;
}

// Usage examples
const user = await api.auth.login({
  email: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_6,
  password: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_1
});

const newUser = await api.auth.register({
  email: 'newuser@example.com',
  password: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_2,
  firstName: 'John',
  lastName: 'Doe',
  schoolId: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_4,
  role: 'parent'
});
```

#### Payment Operations

```typescript
interface PaymentMethods {
  createOrder(data: CreatePaymentOrderRequest): Promise<PaymentOrderResponse>;
  verifyPayment(data: VerifyPaymentRequest): Promise<PaymentVerificationResponse>;
  getStatus(orderId: string): Promise<PaymentStatusResponse>;
  refund(data: RefundRequest): Promise<RefundResponse>;
  
  // Payment methods management
  getPaymentMethods(): Promise<PaymentMethodListResponse>;
  addPaymentMethod(data: AddPaymentMethodRequest): Promise<PaymentMethodResponse>;
  updatePaymentMethod(id: string, data: UpdatePaymentMethodRequest): Promise<PaymentMethodResponse>;
  deletePaymentMethod(id: string): Promise<void>;
}

// Usage examples
const paymentOrder = await api.payments.createOrder({
  userId: 'user-uuid',
  amount: 250.00,
  currency: 'INR',
  description: 'Lunch payment',
  orderId: 'order-uuid'
});

const verification = await api.payments.verifyPayment({
  razorpayOrderId: paymentOrder.razorpayOrderId,
  razorpayPaymentId: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_3,
  razorpaySignature: 'signature_hash'
});
```

#### Subscription Management

```typescript
interface SubscriptionMethods {
  list(filters?: SubscriptionFilters): Promise<SubscriptionListResponse>;
  create(data: CreateSubscriptionRequest): Promise<SubscriptionResponse>;
  get(id: string): Promise<SubscriptionResponse>;
  update(id: string, data: UpdateSubscriptionRequest): Promise<SubscriptionResponse>;
  pause(id: string): Promise<SubscriptionResponse>;
  resume(id: string): Promise<SubscriptionResponse>;
  cancel(id: string, reason?: string): Promise<SubscriptionResponse>;
  
  // Subscription plans
  getPlans(filters?: PlanFilters): Promise<SubscriptionPlanListResponse>;
  getPlan(id: string): Promise<SubscriptionPlanResponse>;
}

// Usage examples
const subscriptions = await api.subscriptions.list({
  status: 'active',
  schoolId: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_1
});

const newSubscription = await api.subscriptions.create({
  subscriptionPlanId: 'plan-uuid',
  studentId: 'student-uuid',
  startDate: '2024-01-15'
});
```

#### Order Management

```typescript
interface OrderMethods {
  list(filters?: OrderFilters): Promise<OrderListResponse>;
  create(data: CreateOrderRequest): Promise<OrderResponse>;
  get(id: string): Promise<OrderResponse>;
  update(id: string, data: UpdateOrderRequest): Promise<OrderResponse>;
  cancel(id: string): Promise<OrderResponse>;
  getHistory(userId: string, options?: PaginationOptions): Promise<OrderHistoryResponse>;
}

// Usage examples
const orders = await api.orders.list({
  status: 'pending',
  page: 1,
  limit: 20
});

const newOrder = await api.orders.create({
  items: [
    {
      menuItemId: 'item-uuid',
      quantity: 1,
      specialInstructions: 'No onions'
    }
  ],
  deliveryDate: '2024-01-15',
  specialRequests: 'Deliver to classroom 101'
});
```

#### Menu Management

```typescript
interface MenuMethods {
  getPlans(filters?: MenuPlanFilters): Promise<MenuPlanListResponse>;
  getPlan(id: string): Promise<MenuPlanResponse>;
  getDailyMenu(schoolId: string, date?: string): Promise<DailyMenuResponse>;
  getMenuItems(filters?: MenuItemFilters): Promise<MenuItemListResponse>;
}

// Usage examples
const dailyMenu = await api.menus.getDailyMenu('school-uuid', '2024-01-15');
const menuPlans = await api.menus.getPlans({
  schoolId: 'school-uuid',
  status: 'APPROVED'
});
```

#### RFID Operations

```typescript
interface RFIDMethods {
  getReaders(schoolId?: string): Promise<RfidReaderListResponse>;
  testReader(readerId: string): Promise<RfidTestResponse>;
  registerCard(data: RegisterRfidCardRequest): Promise<RfidCardResponse>;
  verifyDelivery(data: VerifyDeliveryRequest): Promise<DeliveryVerificationResponse>;
  bulkVerify(data: BulkVerifyRequest): Promise<BulkVerificationResponse>;
  trackStudent(studentId: string, options?: DateRangeOptions): Promise<StudentTrackingResponse>;
  getParentDashboard(parentId: string): Promise<ParentDashboardResponse>;
  getDeliveryHistory(filters?: DeliveryHistoryFilters): Promise<DeliveryHistoryResponse>;
}

// Usage examples
const verification = await api.rfid.verifyDelivery({
  cardNumber: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_5,
  readerId: 'reader-uuid',
  orderId: 'order-uuid'
});

const studentTracking = await api.rfid.trackStudent('student-uuid', {
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});
```

#### Analytics

```typescript
interface AnalyticsMethods {
  getPaymentDashboard(options?: AnalyticsOptions): Promise<PaymentAnalyticsResponse>;
  getPaymentTrends(options?: TrendsOptions): Promise<PaymentTrendsResponse>;
  getSubscriptionDashboard(options?: AnalyticsOptions): Promise<SubscriptionAnalyticsResponse>;
  getPredictiveInsights(options?: InsightsOptions): Promise<PredictiveInsightsResponse>;
  getFraudDetection(options?: FraudOptions): Promise<FraudDetectionResponse>;
}

// Usage examples
const paymentAnalytics = await api.analytics.getPaymentDashboard({
  schoolId: 'school-uuid',
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

const insights = await api.analytics.getPredictiveInsights({
  schoolId: 'school-uuid',
  insightType: 'revenue_forecast'
});
```

### Advanced Features

#### Webhook Integration

```typescript
import { WebhookValidator } from '@hasivu/api-sdk';

const validator = new WebhookValidator('your-webhook-secret');

// Express.js webhook handler
app.post('/webhooks/hasivu', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hasivu-signature'] as string;
  const payload = req.body;
  
  if (!validator.isValid(payload, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(payload.toString());
  handleWebhookEvent(event);
  
  res.status(200).send('OK');
});

const handleWebhookEvent = (event: WebhookEvent) => {
  switch (event.type) {
    case 'payment.success':
      handlePaymentSuccess(event.data);
      break;
    case 'order.completed':
      handleOrderCompleted(event.data);
      break;
    case 'delivery.verified':
      handleDeliveryVerified(event.data);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};
```

#### Error Handling with Retry

```typescript
import { HasivuAPIError, RetryableError } from '@hasivu/api-sdk';

const createOrderWithRetry = async (orderData: CreateOrderRequest, maxRetries = 3) => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await api.orders.create(orderData);
    } catch (error) {
      lastError = error;
      
      if (error instanceof HasivuAPIError) {
        // Don't retry client errors (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        // Retry server errors (5xx) and network errors
        if (error instanceof RetryableError && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }
  
  throw lastError;
};
```

## Python SDK

### Installation

```bash
pip install hasivu-api
```

### Basic Setup

```python
from hasivu_api import HasivuAPI, HasivuConfig
from hasivu_api.exceptions import HasivuAPIError

config = HasivuConfig(
    base_url='https://api.hasivu.com',
    environment='production',
    timeout=10.0,
    retry_attempts=3,
    retry_delay=1.0
)

api = HasivuAPI(config)
```

### Authentication

```python
import os
from datetime import datetime, timedelta

class AuthManager:
    def __init__(self, api: HasivuAPI):
        self.api = api
        self.access_token = None
        self.refresh_token = None
        self.token_expires_at = None
    
    def login(self, email: str, password: str) -> dict:
        try:
            response = self.api.auth.login({
                'email': email,
                process.env.API_CLIENT_SDK_GUIDE_PASSWORD_8: password
            })
            
            self.access_token = response['tokens']['access_token']
            self.refresh_token = response['tokens']['refresh_token']
            self.token_expires_at = datetime.now() + timedelta(
                seconds=response['tokens']['expires_in']
            )
            
            # Set token for subsequent requests
            self.api.set_access_token(self.access_token)
            
            return response['user']
            
        except HasivuAPIError as e:
            print(f"Login failed: {e}")
            raise
    
    def refresh_access_token(self) -> str:
        if not self.refresh_token:
            raise ValueError("No refresh token available")
        
        try:
            response = self.api.auth.refresh({
                'refresh_token': self.refresh_token
            })
            
            self.access_token = response['access_token']
            self.token_expires_at = datetime.now() + timedelta(
                seconds=response['expires_in']
            )
            
            self.api.set_access_token(self.access_token)
            return self.access_token
            
        except HasivuAPIError as e:
            print(f"Token refresh failed: {e}")
            raise
    
    def ensure_valid_token(self):
        if (self.token_expires_at and 
            self.token_expires_at <= datetime.now() + timedelta(minutes=5)):
            self.refresh_access_token()

# Usage
auth_manager = AuthManager(api)
user = auth_manager.login('user@example.com', process.env.API_CLIENT_SDK_GUIDE_PASSWORD_7)
```

### API Operations

```python
# Payment operations
class PaymentManager:
    def __init__(self, api: HasivuAPI, auth_manager: AuthManager):
        self.api = api
        self.auth_manager = auth_manager
    
    def create_payment_order(self, user_id: str, amount: float, 
                           order_id: str = None, description: str = None) -> dict:
        self.auth_manager.ensure_valid_token()
        
        try:
            return self.api.payments.create_order({
                'user_id': user_id,
                'amount': amount,
                'currency': 'INR',
                'order_id': order_id,
                'description': description
            })
        except HasivuAPIError as e:
            print(f"Payment order creation failed: {e}")
            raise
    
    def verify_payment(self, razorpay_order_id: str, 
                      razorpay_payment_id: str, razorpay_signature: str) -> dict:
        self.auth_manager.ensure_valid_token()
        
        return self.api.payments.verify_payment({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })

# Subscription operations
class SubscriptionManager:
    def __init__(self, api: HasivuAPI, auth_manager: AuthManager):
        self.api = api
        self.auth_manager = auth_manager
    
    def create_subscription(self, plan_id: str, student_id: str = None) -> dict:
        self.auth_manager.ensure_valid_token()
        
        return self.api.subscriptions.create({
            'subscription_plan_id': plan_id,
            'student_id': student_id,
            process.env.API_CLIENT_SDK_GUIDE_PASSWORD_13: datetime.now().strftime('%Y-%m-%d')
        })
    
    def get_user_subscriptions(self, filters: dict = None) -> list:
        self.auth_manager.ensure_valid_token()
        
        response = self.api.subscriptions.list(filters or {})
        return response['subscriptions']

# Analytics operations
class AnalyticsManager:
    def __init__(self, api: HasivuAPI, auth_manager: AuthManager):
        self.api = api
        self.auth_manager = auth_manager
    
    def get_payment_analytics(self, school_id: str, start_date: str, end_date: str) -> dict:
        self.auth_manager.ensure_valid_token()
        
        return self.api.analytics.get_payment_dashboard({
            'school_id': school_id,
            'start_date': start_date,
            process.env.API_CLIENT_SDK_GUIDE_PASSWORD_14: end_date
        })
    
    def get_predictive_insights(self, school_id: str, insight_type: str) -> dict:
        self.auth_manager.ensure_valid_token()
        
        return self.api.analytics.get_predictive_insights({
            'school_id': school_id,
            'insight_type': insight_type
        })

# Usage example
payment_manager = PaymentManager(api, auth_manager)
subscription_manager = SubscriptionManager(api, auth_manager)
analytics_manager = AnalyticsManager(api, auth_manager)

# Create a payment order
payment_order = payment_manager.create_payment_order(
    user_id='user-uuid',
    amount=250.00,
    description='Monthly meal plan'
)

# Get analytics
analytics = analytics_manager.get_payment_analytics(
    school_id='school-uuid',
    start_date='2024-01-01',
    end_date='2024-01-31'
)
```

### Async Support

```python
import asyncio
from hasivu_api import AsyncHasivuAPI

async def main():
    api = AsyncHasivuAPI(config)
    
    # Login
    user = await api.auth.login({
        'email': 'user@example.com',
        'password': process.env.API_CLIENT_SDK_GUIDE_PASSWORD_9
    })
    
    # Create multiple orders concurrently
    order_tasks = [
        api.orders.create({
            'items': [{process.env.API_CLIENT_SDK_GUIDE_PASSWORD_10: fprocess.env.API_CLIENT_SDK_GUIDE_PASSWORD_11, process.env.API_CLIENT_SDK_GUIDE_PASSWORD_12: 1}]
        })
        for i in range(5)
    ]
    
    orders = await asyncio.gather(*order_tasks)
    
    # Get analytics
    analytics = await api.analytics.get_payment_dashboard({
        'school_id': 'school-uuid',
        'start_date': '2024-01-01',
        'end_date': '2024-01-31'
    })
    
    print(f"Created {len(orders)} orders")
    print(f"Total revenue: ₹{analytics['total_payments']}")

# Run async main
asyncio.run(main())
```

## React Integration Guide

### Installation

```bash
npm install @hasivu/react-components @hasivu/api-sdk
```

### Provider Setup

```tsx
// App.tsx
import React from 'react';
import { HasivuProvider, HasivuConfig } from '@hasivu/react-components';

const config: HasivuConfig = {
  baseURL: 'https://api.hasivu.com',
  environment: 'production'
};

function App() {
  return (
    <HasivuProvider config={config}>
      <div className="App">
        <Header />
        <MainContent />
        <Footer />
      </div>
    </HasivuProvider>
  );
}

export default App;
```

### Authentication Components

```tsx
// components/LoginForm.tsx
import React, { useState } from 'react';
import { useHasivu } from '@hasivu/react-components';

interface LoginFormProps {
  onLoginSuccess?: (user: any) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const { api, login, loading, error } = useHasivu();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const user = await login(email, password);
      onLoginSuccess?.(user);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="form-group">
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
};
```

### Payment Components

```tsx
// components/PaymentForm.tsx
import React, { useState, useEffect } from 'react';
import { useHasivu } from '@hasivu/react-components';

interface PaymentFormProps {
  orderId: string;
  amount: number;
  onPaymentSuccess?: (payment: any) => void;
  onPaymentError?: (error: Error) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  orderId,
  amount,
  onPaymentSuccess,
  onPaymentError
}) => {
  const { api, user } = useHasivu();
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (user && orderId && amount) {
      createPaymentOrder();
    }
  }, [user, orderId, amount]);

  const createPaymentOrder = async () => {
    try {
      const order = await api.payments.createOrder({
        userId: user.id,
        orderId,
        amount,
        currency: 'INR'
      });
      setPaymentOrder(order);
    } catch (error) {
      onPaymentError?.(error);
    }
  };

  const handlePayment = async () => {
    if (!paymentOrder) return;

    setProcessing(true);
    
    try {
      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        order_id: paymentOrder.razorpayOrderId,
        name: 'HASIVU Platform',
        description: 'Meal Payment',
        handler: async (response: any) => {
          try {
            const verification = await api.payments.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            
            onPaymentSuccess?.(verification);
          } catch (error) {
            onPaymentError?.(error);
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: () => setProcessing(false)
        },
        prefill: {
          email: user.email,
          contact: user.phone
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      setProcessing(false);
      onPaymentError?.(error);
    }
  };

  return (
    <div className="payment-form">
      <div className="payment-details">
        <h3>Payment Details</h3>
        <p>Amount: ₹{amount.toFixed(2)}</p>
        <p>Order ID: {orderId}</p>
      </div>
      
      <button
        onClick={handlePayment}
        disabled={!paymentOrder || processing}
        className="pay-button"
      >
        {processing ? process.env.API_CLIENT_SDK_GUIDE_PASSWORD_15 : `Pay ₹${amount.toFixed(2)}`}
      </button>
    </div>
  );
};
```

### Order Management Components

```tsx
// components/OrderHistory.tsx
import React, { useState, useEffect } from 'react';
import { useHasivu } from '@hasivu/react-components';

interface OrderHistoryProps {
  userId?: string;
  limit?: number;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({
  userId,
  limit = 20
}) => {
  const { api, user } = useHasivu();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [userId, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const response = await api.orders.getHistory(targetUserId, {
        page: 1,
        limit
      });
      
      setOrders(response.orders);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading order history...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="order-history">
      <h2>Order History</h2>
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.orderNumber}</h3>
                <span className={`status status-${order.status}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="order-details">
                <p>Amount: ₹{order.totalAmount.toFixed(2)}</p>
                <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
                
                {order.items && (
                  <div className="order-items">
                    <h4>Items:</h4>
                    <ul>
                      {order.items.map((item: any, index: number) => (
                        <li key={index}>
                          {item.menuItem?.name} x {item.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Custom Hooks

```tsx
// hooks/usePayment.ts
import { useState, useCallback } from 'react';
import { useHasivu } from '@hasivu/react-components';

interface UsePaymentReturn {
  createPaymentOrder: (orderData: any) => Promise<any>;
  verifyPayment: (verificationData: any) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export const usePayment = (): UsePaymentReturn => {
  const { api } = useHasivu();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPaymentOrder = useCallback(async (orderData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.payments.createOrder(orderData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  const verifyPayment = useCallback(async (verificationData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await api.payments.verifyPayment(verificationData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    createPaymentOrder,
    verifyPayment,
    loading,
    error
  };
};

// hooks/useSubscriptions.ts
import { useState, useEffect } from 'react';
import { useHasivu } from '@hasivu/react-components';

export const useSubscriptions = (filters?: any) => {
  const { api } = useHasivu();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, [filters]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await api.subscriptions.list(filters);
      setSubscriptions(response.subscriptions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subscriptionData: any) => {
    const newSubscription = await api.subscriptions.create(subscriptionData);
    setSubscriptions(prev => [...prev, newSubscription]);
    return newSubscription;
  };

  const updateSubscription = async (id: string, updateData: any) => {
    const updatedSubscription = await api.subscriptions.update(id, updateData);
    setSubscriptions(prev =>
      prev.map(sub => sub.id === id ? updatedSubscription : sub)
    );
    return updatedSubscription;
  };

  return {
    subscriptions,
    loading,
    error,
    fetchSubscriptions,
    createSubscription,
    updateSubscription
  };
};
```

## Node.js Backend Integration

### Installation

```bash
npm install @hasivu/node-sdk
```

### Express.js Integration

```javascript
const express = require('express');
const { HasivuAPI, WebhookValidator } = require('@hasivu/node-sdk');

const app = express();
const api = new HasivuAPI({
  baseURL: 'https://api.hasivu.com',
  apiKey: process.env.HASIVU_API_KEY
});

const webhookValidator = new WebhookValidator(process.env.HASIVU_WEBHOOK_SECRET);

// Middleware for authentication
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = await api.auth.validateToken(token);
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Create order endpoint
app.post('/api/orders', authenticateUser, async (req, res) => {
  try {
    const order = await api.orders.create({
      ...req.body,
      userId: req.user.id
    });

    res.status(201).json(order);
  } catch (error) {
    console.error('Order creation failed:', error);
    res.status(500).json({ error: 'Order creation failed' });
  }
});

// Payment webhook handler
app.post('/webhooks/hasivu', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-hasivu-signature'];
  
  if (!webhookValidator.isValid(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  
  // Process webhook event
  processWebhookEvent(event)
    .then(() => res.status(200).send('OK'))
    .catch(error => {
      console.error('Webhook processing failed:', error);
      res.status(500).send('Internal Server Error');
    });
});

const processWebhookEvent = async (event) => {
  switch (event.type) {
    case 'payment.success':
      await handlePaymentSuccess(event.data);
      break;
    case 'order.completed':
      await handleOrderCompleted(event.data);
      break;
    case 'delivery.verified':
      await handleDeliveryVerified(event.data);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
};

const handlePaymentSuccess = async (paymentData) => {
  // Update order status
  await api.orders.update(paymentData.orderId, {
    status: 'paid',
    paymentId: paymentData.id
  });
  
  // Send confirmation email
  // await sendPaymentConfirmation(paymentData);
};

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Background Job Processing

```javascript
// jobs/paymentProcessor.js
const { HasivuAPI } = require('@hasivu/node-sdk');
const Queue = require('bull');

const api = new HasivuAPI({
  baseURL: process.env.HASIVU_API_URL,
  apiKey: process.env.HASIVU_API_KEY
});

const paymentQueue = new Queue('payment processing', process.env.REDIS_URL);

// Process payment orders
paymentQueue.process('create-payment', async (job) => {
  const { orderId, userId, amount } = job.data;
  
  try {
    const paymentOrder = await api.payments.createOrder({
      userId,
      orderId,
      amount,
      currency: 'INR'
    });
    
    return paymentOrder;
  } catch (error) {
    console.error('Payment order creation failed:', error);
    throw error;
  }
});

// Process subscription billing
paymentQueue.process('process-subscription-billing', async (job) => {
  const { subscriptionId } = job.data;
  
  try {
    const result = await api.subscriptions.processBilling(subscriptionId);
    return result;
  } catch (error) {
    console.error('Subscription billing failed:', error);
    throw error;
  }
});

// Schedule recurring jobs
const cron = require('node-cron');

// Process daily subscription billing
cron.schedule('0 9 * * *', async () => {
  console.log('Processing daily subscription billing...');
  
  try {
    const dueSubscriptions = await api.subscriptions.getDueBilling();
    
    for (const subscription of dueSubscriptions) {
      await paymentQueue.add('process-subscription-billing', {
        subscriptionId: subscription.id
      });
    }
  } catch (error) {
    console.error('Failed to schedule subscription billing:', error);
  }
});

module.exports = { paymentQueue };
```

## Error Handling

### Error Types

```typescript
// Error hierarchy
class HasivuAPIError extends Error {
  public status: number;
  public code: string;
  public details?: any;
  public requestId?: string;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = 'HasivuAPIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

class ValidationError extends HasivuAPIError {
  constructor(message: string, details: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends HasivuAPIError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'AuthenticationError';
  }
}

class PaymentError extends HasivuAPIError {
  constructor(message: string, details?: any) {
    super(message, 402, 'PAYMENT_FAILED', details);
    this.name = 'PaymentError';
  }
}

class RateLimitError extends HasivuAPIError {
  public retryAfter: number;

  constructor(message: string, retryAfter: number) {
    super(message, 429, 'TOO_MANY_REQUESTS');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}
```

### Error Handling Patterns

```typescript
// Global error handler
const handleAPIError = (error: any) => {
  if (error instanceof HasivuAPIError) {
    switch (error.constructor) {
      case ValidationError:
        return {
          type: 'validation',
          message: 'Please check your input data',
          details: error.details
        };
      
      case AuthenticationError:
        // Redirect to login
        window.location.href = '/login';
        return { type: 'auth', message: 'Please log in again' };
      
      case PaymentError:
        return {
          type: 'payment',
          message: 'Payment failed. Please try again.',
          details: error.details
        };
      
      case RateLimitError:
        return {
          type: 'rateLimit',
          message: `Too many requests. Please wait ${error.retryAfter} seconds.`,
          retryAfter: error.retryAfter
        };
      
      default:
        return {
          type: 'api',
          message: error.message,
          status: error.status
        };
    }
  }
  
  // Network or other errors
  return {
    type: 'network',
    message: 'Network error. Please check your connection.'
  };
};

// Retry logic with exponential backoff
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry client errors or validation errors
      if (error instanceof HasivuAPIError && error.status < 500) {
        throw error;
      }
      
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Usage
const createOrderWithRetry = async (orderData: any) => {
  return withRetry(
    () => api.orders.create(orderData),
    3,
    1000
  );
};
```

## Authentication Patterns

### Token Management

```typescript
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private refreshPromise: Promise<string> | null = null;

  constructor(private api: HasivuAPI) {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('hasivu_access_token');
    this.refreshToken = localStorage.getItem('hasivu_refresh_token');
    
    const expiresAt = localStorage.getItem('hasivu_token_expires_at');
    if (expiresAt) {
      this.tokenExpiresAt = new Date(expiresAt);
    }
  }

  private saveTokensToStorage() {
    if (this.accessToken) {
      localStorage.setItem('hasivu_access_token', this.accessToken);
    }
    if (this.refreshToken) {
      localStorage.setItem('hasivu_refresh_token', this.refreshToken);
    }
    if (this.tokenExpiresAt) {
      localStorage.setItem('hasivu_token_expires_at', this.tokenExpiresAt.toISOString());
    }
  }

  async getValidToken(): Promise<string | null> {
    // If no token, return null
    if (!this.accessToken) {
      return null;
    }

    // If token is still valid (with 5-minute buffer), return it
    if (this.tokenExpiresAt && this.tokenExpiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      return this.accessToken;
    }

    // If already refreshing, wait for that to complete
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Refresh the token
    this.refreshPromise = this.refreshAccessToken();
    
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.api.auth.refresh({
        refreshToken: this.refreshToken
      });

      this.accessToken = response.accessToken;
      this.tokenExpiresAt = new Date(Date.now() + response.expiresIn * 1000);
      
      this.saveTokensToStorage();
      this.api.setAccessToken(this.accessToken);
      
      return this.accessToken;
    } catch (error) {
      // Refresh failed, clear tokens
      this.clearTokens();
      throw error;
    }
  }

  setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
    
    this.saveTokensToStorage();
    this.api.setAccessToken(this.accessToken);
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiresAt = null;
    
    localStorage.removeItem('hasivu_access_token');
    localStorage.removeItem('hasivu_refresh_token');
    localStorage.removeItem('hasivu_token_expires_at');
    
    this.api.clearAccessToken();
  }
}
```

### React Auth Context

```tsx
// contexts/AuthContext.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { HasivuAPI } from '@hasivu/api-sdk';

interface AuthState {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: any }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload,
        error: null
      };
    
    case 'LOGIN_FAILURE':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        error: action.payload
      };
    
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        error: null
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
  api: HasivuAPI;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, api }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    // Check for existing session on app load
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const user = await api.auth.me();
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      // No valid session
      api.clearAccessToken();
    }
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await api.auth.login({ email, password });
      dispatch({ type: 'LOGIN_SUCCESS', payload: response.user });
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      throw error;
    }
  };

  const logout = () => {
    api.auth.logout();
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Best Practices

### 1. Error Handling

```typescript
// Always handle errors gracefully
const createOrder = async (orderData: any) => {
  try {
    const order = await api.orders.create(orderData);
    return { success: true, data: order };
  } catch (error) {
    if (error instanceof ValidationError) {
      return { 
        success: false, 
        error: 'Please check your input data',
        details: error.details 
      };
    }
    
    if (error instanceof PaymentError) {
      return { 
        success: false, 
        error: 'Payment processing failed. Please try again.' 
      };
    }
    
    return { 
      success: false, 
      error: 'An unexpected error occurred. Please try again.' 
    };
  }
};
```

### 2. Performance Optimization

```typescript
// Use caching for frequently accessed data
const cache = new Map();

const getCachedMenuItems = async (schoolId: string) => {
  const cacheKey = `menu_items_${schoolId}`;
  
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    // Cache for 5 minutes
    if (Date.now() - timestamp < 5 * 60 * 1000) {
      return data;
    }
  }
  
  const menuItems = await api.menus.getMenuItems({ schoolId });
  cache.set(cacheKey, { data: menuItems, timestamp: Date.now() });
  
  return menuItems;
};

// Batch API calls
const getBulkData = async (schoolId: string) => {
  const [menuItems, subscriptionPlans, analytics] = await Promise.all([
    api.menus.getMenuItems({ schoolId }),
    api.subscriptions.getPlans({ schoolId }),
    api.analytics.getPaymentDashboard({ schoolId })
  ]);
  
  return { menuItems, subscriptionPlans, analytics };
};
```

### 3. Security

```typescript
// Validate input on client side
const validateOrderData = (orderData: any) => {
  const errors: string[] = [];
  
  if (!orderData.items || !Array.isArray(orderData.items)) {
    errors.push('Items are required');
  }
  
  if (orderData.items.some((item: any) => !item.menuItemId)) {
    errors.push('All items must have a menu item ID');
  }
  
  if (orderData.items.some((item: any) => item.quantity <= 0)) {
    errors.push('All items must have a positive quantity');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Sanitize user input
const sanitizeInput = (input: string) => {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');
};
```

### 4. Monitoring and Logging

```typescript
// Log API calls for debugging
const logAPICall = (method: string, endpoint: string, data?: any) => {
  console.log(`API Call: ${method} ${endpoint}`, {
    timestamp: new Date().toISOString(),
    data: data ? JSON.stringify(data, null, 2) : null
  });
};

// Track API performance
const withPerformanceTracking = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const startTime = performance.now();
  
  try {
    const result = await operation();
    const endTime = performance.now();
    
    console.log(`${operationName} completed in ${endTime - startTime}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(`${operationName} failed after ${endTime - startTime}ms:`, error);
    throw error;
  }
};
```

## Examples and Use Cases

### Complete E-commerce Flow

```typescript
// Complete order and payment flow
class OrderService {
  constructor(private api: HasivuAPI) {}

  async completeOrder(orderData: any, paymentMethodId?: string) {
    try {
      // 1. Create order
      const order = await this.api.orders.create(orderData);
      
      // 2. Create payment order
      const paymentOrder = await this.api.payments.createOrder({
        userId: orderData.userId,
        orderId: order.id,
        amount: order.totalAmount,
        currency: 'INR'
      });
      
      // 3. Process payment (example with saved payment method)
      let paymentResult;
      if (paymentMethodId) {
        paymentResult = await this.processStoredPayment(
          paymentOrder,
          paymentMethodId
        );
      } else {
        paymentResult = await this.processNewPayment(paymentOrder);
      }
      
      // 4. Update order status
      if (paymentResult.success) {
        await this.api.orders.update(order.id, {
          status: 'confirmed',
          paymentId: paymentResult.paymentId
        });
      }
      
      return {
        success: paymentResult.success,
        order,
        payment: paymentResult
      };
      
    } catch (error) {
      console.error('Order completion failed:', error);
      throw error;
    }
  }

  private async processStoredPayment(paymentOrder: any, paymentMethodId: string) {
    // Implementation depends on your stored payment method handling
    // This is a simplified example
    return {
      success: true,
      paymentId: process.env.API_CLIENT_SDK_GUIDE_PASSWORD_16
    };
  }

  private async processNewPayment(paymentOrder: any) {
    // Return payment order for frontend to handle with Razorpay
    return {
      success: false,
      requiresUserAction: true,
      paymentOrder
    };
  }
}
```

### Subscription Management System

```typescript
class SubscriptionService {
  constructor(private api: HasivuAPI) {}

  async createSubscriptionWithTrial(planId: string, studentId: string) {
    try {
      // Get plan details
      const plan = await this.api.subscriptions.getPlan(planId);
      
      // Create subscription with trial if applicable
      const subscriptionData = {
        subscriptionPlanId: planId,
        studentId: studentId,
        startDate: new Date().toISOString().split('T')[0]
      };
      
      if (plan.trialPeriodDays > 0) {
        subscriptionData.isTrialActive = true;
        subscriptionData.trialEndDate = new Date(
          Date.now() + plan.trialPeriodDays * 24 * 60 * 60 * 1000
        ).toISOString().split('T')[0];
      }
      
      const subscription = await this.api.subscriptions.create(subscriptionData);
      
      // If not in trial, create immediate payment
      if (!subscriptionData.isTrialActive) {
        await this.processSubscriptionPayment(subscription);
      }
      
      return subscription;
      
    } catch (error) {
      console.error('Subscription creation failed:', error);
      throw error;
    }
  }

  async processSubscriptionPayment(subscription: any) {
    const paymentOrder = await this.api.payments.createOrder({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount: subscription.billingAmount,
      currency: 'INR',
      description: `Subscription payment - ${subscription.subscriptionPlan?.name}`
    });
    
    return paymentOrder;
  }

  async handleFailedPayment(subscriptionId: string) {
    try {
      // Get subscription details
      const subscription = await this.api.subscriptions.get(subscriptionId);
      
      // Retry payment
      const retryResult = await this.api.payments.retry({
        subscriptionId: subscriptionId,
        retryMethod: 'auto'
      });
      
      // If retry fails, pause subscription after grace period
      if (!retryResult.success) {
        await this.api.subscriptions.update(subscriptionId, {
          status: 'suspended',
          suspendedAt: new Date().toISOString()
        });
      }
      
      return retryResult;
      
    } catch (error) {
      console.error('Failed payment handling failed:', error);
      throw error;
    }
  }
}
```

### Real-time Dashboard

```typescript
// Real-time analytics dashboard
class AnalyticsDashboard {
  private updateInterval: number = 30000; // 30 seconds
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private api: HasivuAPI,
    private onDataUpdate: (data: any) => void
  ) {}

  async start(schoolId: string) {
    // Initial load
    await this.updateData(schoolId);
    
    // Set up periodic updates
    this.intervalId = setInterval(() => {
      this.updateData(schoolId);
    }, this.updateInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async updateData(schoolId: string) {
    try {
      const [
        paymentAnalytics,
        subscriptionAnalytics,
        recentOrders,
        deliveryStats
      ] = await Promise.all([
        this.api.analytics.getPaymentDashboard({ schoolId }),
        this.api.analytics.getSubscriptionDashboard({ schoolId }),
        this.api.orders.list({ schoolId, limit: 10 }),
        this.api.rfid.getDeliveryHistory({ schoolId, limit: 10 })
      ]);

      const dashboardData = {
        payments: paymentAnalytics,
        subscriptions: subscriptionAnalytics,
        orders: recentOrders.orders,
        deliveries: deliveryStats.deliveries,
        lastUpdated: new Date()
      };

      this.onDataUpdate(dashboardData);
      
    } catch (error) {
      console.error('Dashboard data update failed:', error);
    }
  }
}

// Usage in React
const Dashboard: React.FC<{ schoolId: string }> = ({ schoolId }) => {
  const { api } = useHasivu();
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const dashboard = new AnalyticsDashboard(api, setDashboardData);
    dashboard.start(schoolId);

    return () => dashboard.stop();
  }, [schoolId, api]);

  if (!dashboardData) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>₹{dashboardData.payments.totalPayments.toFixed(2)}</p>
        </div>
        
        <div className="stat-card">
          <h3>Active Subscriptions</h3>
          <p>{dashboardData.subscriptions.activeSubscriptions}</p>
        </div>
        
        <div className="stat-card">
          <h3>Today's Orders</h3>
          <p>{dashboardData.orders.length}</p>
        </div>
        
        <div className="stat-card">
          <h3>Delivery Rate</h3>
          <p>{(dashboardData.deliveries.deliveryRate * 100).toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="last-updated">
        Last updated: {dashboardData.lastUpdated.toLocaleTimeString()}
      </div>
    </div>
  );
};
```

This comprehensive guide provides everything needed to integrate with the HASIVU Platform API using the official SDKs. The examples cover real-world scenarios and best practices for building robust applications.