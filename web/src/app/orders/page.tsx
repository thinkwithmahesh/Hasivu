'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ArrowLeft,
  ShoppingCart,
  Clock,
  CheckCircle,
  ChefHat,
  CreditCard,
  MapPin,
  User,
  Phone,
  XCircle as XCircle,
  RefreshCw,
} from 'lucide-react';
import { OrderCard, generateDemoOrder as _generateDemoOrder } from '@/components/orders/OrderCard';
import { toast } from 'sonner';

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCheckout, setIsCheckout] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock cart items (in real app, this would come from global state or local storage)
  const [cartItems] = useState([
    {
      id: 1,
      name: 'Mini Idli with Sambar',
      description: 'Soft steamed rice cakes with protein-rich lentil curry and coconut chutney',
      category: 'Breakfast',
      price: '₹45',
      priceValue: 45,
      quantity: 2,
      image: '🥟',
    },
    {
      id: 4,
      name: 'Butter Chicken with Naan',
      description:
        'Mild creamy chicken curry with soft butter naan bread, kid-friendly spice level',
      category: 'Lunch',
      price: '₹85',
      priceValue: 85,
      quantity: 1,
      image: '🍛',
    },
  ]);

  useEffect(() => {
    const checkoutParam = searchParams?.get('checkout');
    const orderIdParam = searchParams?.get('orderId');

    if (checkoutParam === 'true' && orderIdParam) {
      setIsCheckout(true);
      setOrderId(orderIdParam);
    }

    // Load orders on component mount
    loadOrders();
  }, [searchParams]);

  // Load orders from API
  const loadOrders = async () => {
    try {
      setLoading(true);

      // Call the orders API
      const response = await fetch('/api/orders');
      const data = await response.json();

      if (data.success && data.data) {
        setOrders(data.data);
      } else {
        throw new Error(data.error || 'Failed to load orders');
      }
    } catch (error) {
      toast.error('Failed to load orders');
      // Fallback to empty array
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle order update
  const handleOrderUpdate = async (orderId: string, updates: any) => {
    try {
      // Call the order update API
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setOrders(prevOrders =>
          prevOrders.map(order => (order.id === orderId ? { ...order, ...updates } : order))
        );
        toast.success('Order updated successfully');
      } else {
        throw new Error(data.error || 'Failed to update order');
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  // Handle order cancellation
  const handleOrderCancel = async (orderId: string) => {
    try {
      // Call the order cancel API
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        // Update order status to cancelled
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? {
                  ...order,
                  status: 'cancelled',
                  paymentStatus: data.data?.refundEligible ? 'refunded' : order.paymentStatus,
                }
              : order
          )
        );

        // Show success message with refund info
        if (data.data?.refundEligible) {
          toast.success(
            `Order cancelled successfully. Refund of ₹${data.data.refundAmount} will be processed within 3-5 business days.`,
            { duration: 6000 }
          );
        } else {
          toast.success('Order cancelled successfully. No refund applicable.');
        }
      } else {
        throw new Error(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  // Handle view order details
  const handleViewDetails = (orderId: string) => {
    // In a real app, this would navigate to order details page
    toast.info(`Viewing details for order ${orderId}`);
  };

  const getTotalAmount = () => {
    return cartItems.reduce((total, item) => total + item.priceValue * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const handleConfirmOrder = async () => {
    try {
      // Create order data
      const orderData = {
        studentId: 'student_123', // This should come from user context
        deliveryDate: new Date().toISOString().split('T')[0],
        mealPeriod: 'lunch',
        orderItems: cartItems.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
        })),
        specialInstructions: '',
      };

      // Call the create order API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        setOrderConfirmed(true);
        toast.success('Order created successfully!');
        setTimeout(() => {
          router.push('/orders');
        }, 3000);
      } else {
        throw new Error(data.error || 'Failed to create order');
      }
    } catch (error) {
      toast.error('Failed to create order');
    }
  };

  const _getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const _getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-700 bg-green-100';
      case 'preparing':
        return 'text-orange-700 bg-orange-100';
      case 'pending':
        return 'text-yellow-700 bg-yellow-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  // Render checkout flow if coming from menu
  if (isCheckout && orderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/menu">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Menu
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">H</span>
                  </div>
                  <div>
                    <div className="font-display font-bold text-2xl text-primary-600">Checkout</div>
                    <div className="text-sm text-gray-600 -mt-1">Order #{orderId}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {orderConfirmed ? (
            // Order Confirmation
            <div className="max-w-2xl mx-auto">
              <Card className="border-0 shadow-soft text-center p-8">
                <CardContent>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                  <p className="text-gray-600 mb-6">
                    Your order #{orderId} has been confirmed and sent to the kitchen.
                  </p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-green-800 mb-2">What happens next?</h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Kitchen will start preparing your meal</li>
                      <li>• You'll receive updates on preparation progress</li>
                      <li>• Estimated ready time: 15-20 minutes</li>
                      <li>• You'll be notified when ready for pickup</li>
                    </ul>
                  </div>
                  <p className="text-sm text-gray-500">Redirecting to orders page...</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Checkout Form
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Summary */}
                <div className="lg:col-span-2">
                  <Card className="border-0 shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Order Summary
                      </CardTitle>
                      <CardDescription>
                        Review your items before confirming the order
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {cartItems.map(item => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="text-3xl">{item.image}</div>
                              <div>
                                <h3 className="font-medium">{item.name}</h3>
                                <p className="text-sm text-gray-600">{item.description}</p>
                                <Badge variant="outline" className="mt-1">
                                  {item.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {item.price} × {item.quantity}
                              </p>
                              <p className="text-sm text-gray-600">
                                ₹{item.priceValue * item.quantity}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Separator className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal ({getTotalItems()} items)</span>
                          <span>₹{getTotalAmount()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Service Fee</span>
                          <span>₹0</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tax</span>
                          <span>₹{Math.round(getTotalAmount() * 0.05)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span>₹{getTotalAmount() + Math.round(getTotalAmount() * 0.05)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Checkout Details */}
                <div>
                  <Card className="border-0 shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="h-5 w-5 mr-2" />
                        Order Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Student Name
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">Sarah Johnson</div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Class & Section
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                          8th Grade - Section A
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Pickup Location
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                          School Cafeteria - Counter 2
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="h-4 w-4 inline mr-1" />
                          Contact Number
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                          +91 98765 43210
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <CreditCard className="h-4 w-4 inline mr-1" />
                          Payment Method
                        </label>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-green-800 font-medium">School Wallet</span>
                            <span className="text-green-600">₹850 available</span>
                          </div>
                        </div>
                      </div>

                      <Button className="w-full" size="lg" onClick={handleConfirmOrder}>
                        Confirm Order - ₹{getTotalAmount() + Math.round(getTotalAmount() * 0.05)}
                      </Button>

                      <p className="text-xs text-gray-500 text-center">
                        By confirming, you agree to the school meal policy and terms
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Regular orders page
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-primary-600">
                    Order Management
                  </div>
                  <div className="text-sm text-gray-600 -mt-1">HASIVU Platform</div>
                </div>
              </div>
            </div>
            <Button>
              <ShoppingCart className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Orders</h1>
          <p className="text-gray-600">Track and manage meal orders for students</p>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-gray-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold">{orders.length}</div>
                <p className="text-xs text-gray-600">All time</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Delivered</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-green-600">
                  {orders.filter(order => order.status === 'delivered').length}
                </div>
                <p className="text-xs text-gray-600">
                  {orders.length > 0
                    ? Math.round(
                        (orders.filter(order => order.status === 'delivered').length /
                          orders.length) *
                          100
                      )
                    : 0}
                  % completion rate
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-2xl font-bold text-yellow-600">
                  {
                    orders.filter(
                      order => order.status === 'pending' || order.status === 'preparing'
                    ).length
                  }
                </div>
                <p className="text-xs text-gray-600">In queue</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Orders</h2>
              <p className="text-gray-600">Manage and track your meal orders</p>
            </div>
            <Button onClick={loadOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <Card className="border-0 shadow-soft">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  You haven't placed any orders yet. Start by browsing our menu!
                </p>
                <Button asChild>
                  <Link href="/menu">Browse Menu</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {orders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onOrderUpdate={handleOrderUpdate}
                  onOrderCancel={handleOrderCancel}
                  onViewDetails={handleViewDetails}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
