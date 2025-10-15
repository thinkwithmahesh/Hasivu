# HASIVU Platform - Backend API Integration

## Overview

This document outlines the comprehensive backend API integration implemented for the HASIVU platform. The system now supports production-ready backend connectivity with real-time updates, error handling, and optimistic UI patterns.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Components  │ ───│   API Hooks      │ ───│   API Services  │
│   (UI Layer)    │    │   (Data Layer)   │    │   (Network)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   WebSocket      │    │   Backend API   │
                       │   (Real-time)    │    │   (REST/GraphQL)│
                       └──────────────────┘    └─────────────────┘
```

## Key Components

### 1. API Services Layer (`/src/services/api.ts`)

**Comprehensive API service layer with:**

- **Authentication & Authorization**
  - JWT token management
  - Automatic token refresh
  - Role-based access control
  - Secure logout handling

- **HTTP Client Configuration**
  - Axios-based HTTP client
  - Request/response interceptors
  - Error handling middleware
  - Automatic retries

- **Modular API Endpoints**
  - Kitchen Management API
  - Inventory Management API
  - Staff Management API
  - RFID System API
  - Notifications API
  - Analytics API
  - User Management API
  - File Upload API

- **Real-time Communication**
  - WebSocket connection manager
  - Auto-reconnection logic
  - Message subscription system
  - Connection status monitoring

**Example Usage:**

```typescript
// Fetch kitchen orders with filters
const orders = await kitchenApi.getOrders({
  status: 'pending',
  priority: 'high',
});

// Update order status
await kitchenApi.updateOrderStatus(orderId, 'preparing');

// Real-time order updates
wsManager.subscribe('order_update', data => {
  console.log('Order updated:', data);
});
```

### 2. React Hooks Layer (`/src/hooks/useApiIntegration.ts`)

**Production-ready React hooks providing:**

- **Data Fetching Hooks**
  - Automatic loading states
  - Error handling
  - Data caching
  - Auto-refetch intervals
  - Dependency-based refetching

- **Mutation Hooks**
  - Optimistic updates
  - Error rollback
  - Loading states
  - Success/error callbacks

- **Real-time Hooks**
  - WebSocket connection management
  - Event subscription/unsubscription
  - Connection status monitoring

**Available Hooks:**

```typescript
// Kitchen Management
useKitchenOrders(filters?)
useKitchenMetrics(period?)
useOrderMutations()

// Inventory Management
useInventoryItems(filters?)
useInventorySuppliers()
usePurchaseOrders(filters?)
useInventoryMetrics()
useLowStockAlerts()
useInventoryMutations()

// Staff Management
useStaffMembers(filters?)
useStaffTasks(filters?)
useStaffSchedules(filters?)
useStaffMetrics()
useStaffMutations()

// Notifications
useNotifications(filters?)
useNotificationSettings()
useNotificationMutations()

// Authentication
useAuth()

// Real-time
useWebSocketConnection()
useWebSocketSubscription(messageType, handler)

// Analytics
useDashboardAnalytics(period?)

// RFID System
useRfidDevices()
useRfidTransactions(filters?)
useRfidMetrics()
```

### 3. Updated Components

**Kitchen Management Dashboard Integration:**

The `KitchenManagementDashboard` component has been updated to demonstrate full API integration:

```typescript
export const KitchenManagementDashboard: React.FC = () => {
  // API Integration hooks
  const {
    data: orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useKitchenOrders(orderFilters);
  const { data: metrics, loading: metricsLoading } = useKitchenMetrics('today');
  const {
    updateOrderStatus,
    assignOrder,
    loading: mutationLoading,
  } = useOrderMutations();
  const { connected: wsConnected } = useWebSocketConnection();

  // Real-time updates
  useWebSocketSubscription(
    'order_update',
    useCallback(
      orderData => {
        toast.success(`Order ${orderData.orderNumber} updated`);
        refetchOrders();
      },
      [refetchOrders]
    )
  );

  // Handle mutations
  const handleOrderStatusUpdate = useCallback(
    async (orderId, newStatus) => {
      try {
        await updateOrderStatus(orderId, newStatus);
        toast.success('Order status updated successfully');
        refetchOrders();
      } catch (error) {
        toast.error('Failed to update order status');
      }
    },
    [updateOrderStatus, refetchOrders]
  );

  // UI with loading states, error handling, and real-time indicators
  // ...
};
```

## Features Implemented

### 1. **Authentication & Security**

- JWT token-based authentication
- Automatic token refresh
- Secure session management
- Role-based access control

### 2. **Real-time Updates**

- WebSocket connection for live data
- Automatic reconnection
- Real-time notifications
- Live order status updates
- Inventory alerts

### 3. **Error Handling**

- Comprehensive error catching
- User-friendly error messages
- Retry mechanisms
- Fallback data loading
- Connection status indicators

### 4. **Performance Optimization**

- Data caching
- Optimistic updates
- Loading states
- Pagination support
- Efficient re-fetching

### 5. **User Experience**

- Loading spinners
- Error alerts
- Success notifications
- Connection status indicators
- Offline mode handling

## API Endpoints

### Kitchen Management

```
GET    /api/kitchen/orders              - Get orders with filters
POST   /api/kitchen/orders              - Create new order
PATCH  /api/kitchen/orders/:id/status   - Update order status
PATCH  /api/kitchen/orders/:id/assign   - Assign order to staff
GET    /api/kitchen/metrics             - Get kitchen metrics
```

### Inventory Management

```
GET    /api/inventory/items             - Get inventory items
POST   /api/inventory/items             - Create inventory item
PUT    /api/inventory/items/:id         - Update inventory item
PATCH  /api/inventory/items/:id/stock   - Update stock levels
GET    /api/inventory/suppliers         - Get suppliers
GET    /api/inventory/purchase-orders   - Get purchase orders
POST   /api/inventory/purchase-orders   - Create purchase order
GET    /api/inventory/low-stock-alerts  - Get low stock alerts
GET    /api/inventory/metrics           - Get inventory metrics
```

### Staff Management

```
GET    /api/staff/members               - Get staff members
POST   /api/staff/members               - Create staff member
PUT    /api/staff/members/:id           - Update staff member
PATCH  /api/staff/members/:id/status    - Update staff status
GET    /api/staff/tasks                 - Get tasks
POST   /api/staff/tasks                 - Create task
PATCH  /api/staff/tasks/:id/status      - Update task status
GET    /api/staff/schedules             - Get schedules
POST   /api/staff/schedules             - Create schedule
GET    /api/staff/metrics               - Get staff metrics
```

### Notifications

```
GET    /api/notifications               - Get notifications
PATCH  /api/notifications/mark-read     - Mark notifications as read
PATCH  /api/notifications/mark-all-read - Mark all notifications as read
DELETE /api/notifications/:id           - Delete notification
GET    /api/notifications/settings      - Get notification settings
PUT    /api/notifications/settings      - Update notification settings
```

### Authentication

```
POST   /api/auth/login                  - User login
POST   /api/auth/register               - User registration
POST   /api/auth/logout                 - User logout
GET    /api/users/profile               - Get user profile
PUT    /api/users/profile               - Update user profile
```

## WebSocket Events

### Real-time Event Types

```javascript
// Order updates
'order_update' - { orderId, status, orderNumber, ... }

// Kitchen alerts
'kitchen_alert' - { type, message, severity, ... }

// Inventory alerts
'inventory_alert' - { itemId, itemName, currentStock, ... }

// Staff updates
'staff_update' - { staffId, status, currentTask, ... }

// System notifications
'system_notification' - { title, message, type, ... }
```

## Environment Configuration

### Required Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws

# Authentication
NEXT_PUBLIC_JWT_SECRET=your-jwt-secret
NEXT_PUBLIC_REFRESH_TOKEN_ENDPOINT=/auth/refresh

# Feature Flags
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## Usage Examples

### 1. Fetching Kitchen Orders with Real-time Updates

```typescript
function OrdersDashboard() {
  // Fetch orders with auto-refresh every 30 seconds
  const { data: orders, loading, error, refetch } = useKitchenOrders({
    status: 'pending'
  });

  // Subscribe to real-time order updates
  useWebSocketSubscription('order_update', (orderData) => {
    // Handle real-time order updates
    refetch(); // Refresh orders list
  });

  // Handle loading and error states
  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {orders?.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

### 2. Updating Order Status with Optimistic Updates

```typescript
function OrderCard({ order }) {
  const { updateOrderStatus, loading } = useOrderMutations();

  const handleStatusChange = async (newStatus) => {
    try {
      // Optimistic update - immediately update UI
      // The hook handles reverting on error
      await updateOrderStatus(order.id, newStatus);
      toast.success('Order status updated');
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  return (
    <Card>
      <CardHeader>{order.orderNumber}</CardHeader>
      <CardContent>
        <Button
          onClick={() => handleStatusChange('preparing')}
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Start Preparing'}
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 3. Managing Authentication State

```typescript
function App() {
  const { user, login, logout, loading, isAuthenticated } = useAuth();

  const handleLogin = async (credentials) => {
    try {
      await login(credentials);
      toast.success('Login successful');
    } catch (error) {
      toast.error('Login failed');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <DashboardLayout user={user} onLogout={logout} />;
}
```

## Error Handling Patterns

### API Error Handling

```typescript
// Centralized error handling
const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Component error handling
const { data, loading, error } = useKitchenOrders();

if (error) {
  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        {error}
      </AlertDescription>
    </Alert>
  );
}
```

## Testing Considerations

### Unit Tests

- Test API service functions
- Test React hooks behavior
- Test error handling scenarios
- Test WebSocket connections

### Integration Tests

- Test complete user workflows
- Test real-time data updates
- Test authentication flows
- Test error recovery

### E2E Tests

- Test full user journeys
- Test cross-module interactions
- Test real-time synchronization

## Deployment Checklist

### Pre-deployment

- [ ] Environment variables configured
- [ ] API endpoints accessible
- [ ] WebSocket connections tested
- [ ] Authentication configured
- [ ] Error monitoring setup

### Production Monitoring

- [ ] API response times
- [ ] Error rates
- [ ] WebSocket connection health
- [ ] User authentication success rates
- [ ] Real-time data synchronization

## Future Enhancements

### Planned Features

1. **Offline Support**
   - Service worker implementation
   - Offline data caching
   - Sync when online

2. **Advanced Caching**
   - Redis integration
   - Query result caching
   - Intelligent cache invalidation

3. **Performance Optimization**
   - GraphQL implementation
   - Query optimization
   - Bundle size reduction

4. **Advanced Real-time Features**
   - Real-time collaborative editing
   - Live video streaming
   - Voice notifications

This backend integration provides a solid foundation for the HASIVU platform's production deployment, ensuring scalability, reliability, and excellent user experience.
