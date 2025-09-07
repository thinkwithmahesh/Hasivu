# HASIVU Platform - Implementation Guide

## 🚀 Quick Start Guide

This guide shows how to implement the ShadCN-backend integration components created in the architecture design.

### 1. Setup Environment

```bash
# Install dependencies
npm install @tanstack/react-query socket.io-client react-hot-toast

# Environment variables (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
NEXT_PUBLIC_RAZORPAY_KEY=your_razorpay_key
```

### 2. App Configuration

```typescript
// pages/_app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';

import { store, persistor } from '@/store';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnhancedApiClient } from '@/lib/enhanced-api-client';
import { queryClient } from '@/lib/react-query';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<div>Loading...</div>} persistor={persistor}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Component {...pageProps} />
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
        </QueryClientProvider>
      </PersistGate>
    </Provider>
  );
}
```

---

## 🔐 Authentication Implementation

### Enhanced Login Page

```typescript
// pages/auth/login.tsx
import { EnhancedLoginForm } from '@/components/auth/EnhancedLoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <EnhancedLoginForm
        redirectTo="/dashboard"
        autoFocus
        onLoginSuccess={(user) => {
          console.log('Welcome back,', user.firstName);
        }}
      />
    </div>
  );
}
```

### Protected Route Component

```typescript
// components/ProtectedRoute.tsx
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(router.asPath)}`);
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

---

## 📦 Order Management Implementation

### Order Dashboard

```typescript
// pages/orders/index.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrderTracker } from '@/components/orders/OrderTracker';
import { useOrderUpdates } from '@/hooks/useSocket';
import { api } from '@/lib/enhanced-api-client';

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  
  // Real-time order updates
  useOrderUpdates();

  // Fetch order history
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.orders.getHistory({ limit: 10 }),
  });

  if (isLoading) {
    return <div className="container mx-auto py-8">
      <div className="grid gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="h-20 bg-gray-100 rounded" />
          </Card>
        ))}
      </div>
    </div>;
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <Button onClick={() => window.location.href = '/menu'}>
          Order New Meal
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Order List */}
        <div className=process.env.WEB_IMPLEMENTATION_GUIDE_PASSWORD_1>
          {orders?.data?.map((order: any) => (
            <Card 
              key={order.id} 
              className={`cursor-pointer transition-all ${
                selectedOrder === order.id ? 'ring-2 ring-orange-500' : ''
              }`}
              onClick={() => setSelectedOrder(order.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Order #{order.id.slice(-8)}
                  </CardTitle>
                  <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                    {order.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    {order.items.length} item(s) • ₹{order.total}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Tracker */}
        <div className="sticky top-4">
          {selectedOrder ? (
            <OrderTracker orderId={selectedOrder} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-gray-500">
                Select an order to track its progress
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 🍽️ Menu Integration

### Menu Component with Real-time Updates

```typescript
// components/menu/MenuGrid.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/enhanced-api-client';
import { useSocket } from '@/hooks/useSocket';
import { toast } from 'react-hot-toast';

export function MenuGrid() {
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const { emit } = useSocket();

  // Fetch menu items
  const { data: menuItems, isLoading } = useQuery({
    queryKey: ['menu-items'],
    queryFn: () => api.meals.getItems({ available: true }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData: any) => api.orders.create(orderData),
    onSuccess: (response) => {
      queryClient.invalidateQueries(['orders']);
      setCart(new Map());
      toast.success('Order placed successfully!');
      
      // Emit socket event for real-time updates
      emit('order_placed', { orderId: response.data.id });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to place order');
    },
  });

  const updateCartItem = (itemId: string, change: number) => {
    const newCart = new Map(cart);
    const currentQty = newCart.get(itemId) || 0;
    const newQty = Math.max(0, currentQty + change);
    
    if (newQty === 0) {
      newCart.delete(itemId);
    } else {
      newCart.set(itemId, newQty);
    }
    
    setCart(newCart);
  };

  const getTotalPrice = () => {
    return Array.from(cart.entries()).reduce((total, [itemId, quantity]) => {
      const item = menuItems?.data?.find((item: any) => item.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const handleCheckout = () => {
    const items = Array.from(cart.entries()).map(([itemId, quantity]) => ({
      id: itemId,
      quantity,
    }));

    createOrderMutation.mutate({
      items,
      deliveryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes
    });
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-lg" />
            <CardContent className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Menu Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems?.data?.map((item: any) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">🍽️</div>
              )}
            </div>
            
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
                {item.isVegetarian && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Veg
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xl font-bold text-orange-600">₹{item.price}</p>
                  <p className="text-xs text-gray-500">{item.calories} cal</p>
                </div>
                
                <div className="flex items-center space-x-2">
                  {cart.get(item.id) ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(item.id, -1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">
                        {cart.get(item.id)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateCartItem(item.id, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => updateCartItem(item.id, 1)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      {cart.size > 0 && (
        <Card className="sticky bottom-4 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {Array.from(cart.values()).reduce((a, b) => a + b, 0)} items in cart
                </p>
                <p className="text-sm text-gray-600">Total: ₹{getTotalPrice()}</p>
              </div>
              <Button 
                onClick={handleCheckout}
                disabled={createOrderMutation.isLoading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {createOrderMutation.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-2" />
                )}
                Place Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## 💳 Payment Integration

### Payment Component with Razorpay

```typescript
// components/payments/RazorpayCheckout.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Wallet } from 'lucide-react';
import { api } from '@/lib/enhanced-api-client';
import { usePaymentEvents } from '@/hooks/useSocket';
import { toast } from 'react-hot-toast';

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  onSuccess: (paymentData: any) => void;
  onError: (error: any) => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function RazorpayCheckout({ orderId, amount, onSuccess, onError }: RazorpayCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { paymentStatus, resetPaymentStatus } = usePaymentEvents();

  const initializePayment = async () => {
    try {
      setIsProcessing(true);
      resetPaymentStatus();

      // Initialize payment with backend
      const response = await api.payments.initialize({
        orderId,
        amount,
      });

      const { razorpayOrder } = response.data;

      // Load Razorpay script if not already loaded
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'HASIVU',
        description: `Order #${orderId.slice(-8)}`,
        image: '/logo.png',
        order_id: razorpayOrder.id,
        handler: async (response: any) => {
          try {
            // Verify payment with backend
            const verification = await api.payments.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verification.data.success) {
              toast.success('Payment successful!');
              onSuccess(verification.data);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error: any) {
            toast.error('Payment verification failed');
            onError(error);
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: 'Student Name',
          email: 'student@school.com',
          contact: '9000090000',
        },
        theme: {
          color: '#f97316', // Orange theme
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error: any) {
      setIsProcessing(false);
      toast.error(error.message || 'Failed to initialize payment');
      onError(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Order Total</span>
            <span className="text-xl font-bold text-orange-600">₹{amount}</span>
          </div>
          <p className="text-sm text-gray-600">Including all taxes and fees</p>
        </div>

        <div className="space-y-2">
          <Button
            onClick={initializePayment}
            disabled={isProcessing}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pay with Razorpay
              </>
            )}
          </Button>

          <Button
            variant="outline"
            disabled
            className="w-full h-12"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Wallet Pay (Coming Soon)
          </Button>
        </div>

        <div className="text-center text-xs text-gray-500">
          Secured by Razorpay • Your payment information is encrypted
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔔 Real-time Notifications

### Notification Component

```typescript
// components/notifications/NotificationCenter.tsx
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useSocket';
import { useAppSelector, useAppDispatch } from '@/store';
import { markAsRead } from '@/store/slices/notificationSlice';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(state => state.notifications.items);
  
  // Subscribe to real-time notifications
  useNotifications();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    dispatch(markAsRead(id));
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-12 w-80 max-h-96 overflow-y-auto z-50 shadow-lg">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
```

---

## 🔧 Development Commands

### Development Server Setup

```bash
# Terminal 1 - Backend Server
cd /path/to/hasivu-platform
npm run dev

# Terminal 2 - Frontend Server
cd /path/to/hasivu-platform/web
npm run dev

# Terminal 3 - Database (if running locally)
docker run --name hasivu-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

### Testing API Integration

```typescript
// utils/api-test.ts
import { api } from '@/lib/enhanced-api-client';

export async function testApiIntegration() {
  try {
    console.log('Testing API integration...');
    
    // Test authentication
    const loginResult = await api.auth.login({
      email: 'test@school.com',
      password: 'testpassword123',
      rememberMe: true,
    });
    console.log('✅ Login successful:', loginResult);

    // Test menu fetching
    const menuItems = await api.meals.getItems();
    console.log('✅ Menu items fetched:', menuItems.data.length);

    // Test order creation
    const orderResult = await api.orders.create({
      items: [{ id: menuItems.data[0].id, quantity: 1 }],
    });
    console.log('✅ Order created:', orderResult.data.id);

    console.log('🎉 All API tests passed!');
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}
```

---

## 📝 Summary

The integration architecture provides:

✅ **Complete API Integration** - Enhanced API client with authentication, retries, and error handling  
✅ **Real-time Socket.IO** - Automatic reconnection with typed events  
✅ **ShadCN Components** - Production-ready UI components integrated with backend  
✅ **State Management** - Redux with real-time updates  
✅ **Payment Integration** - Razorpay with verification flow  
✅ **Error Handling** - Comprehensive error boundaries and recovery  
✅ **Performance** - React Query caching and optimization  
✅ **Type Safety** - Full TypeScript integration

### Key Features Implemented:

1. **Enhanced Login Form** - with validation, error handling, and success states
2. **Order Tracker** - Real-time order status with Socket.IO integration
3. **Menu Grid** - Interactive menu with cart functionality
4. **Payment Component** - Razorpay integration with verification
5. **Notification Center** - Real-time notifications with badge counts
6. **Protected Routes** - Authentication middleware
7. **Socket Hooks** - Custom React hooks for WebSocket events

### Next Steps:

1. **Deploy** the backend to production (localhost:3000 → production URL)
2. **Update environment variables** in frontend
3. **Test end-to-end flows** with real data
4. **Add error tracking** (Sentry integration)
5. **Implement analytics** (order completion rates, user behavior)
6. **Add push notifications** for mobile devices
7. **Scale WebSocket** connections with Redis adapter