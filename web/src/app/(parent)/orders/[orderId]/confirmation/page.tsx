/**
 * Order Confirmation Page
 * Display order success and details after payment completion
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderAPIService } from '@/services/order-api.service';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2,
  Download,
  Share2,
  Calendar,
  MapPin,
  User,
  Phone,
  ShoppingBag,
  ArrowRight,
  Home
} from 'lucide-react';

interface OrderConfirmationProps {
  params: {
    orderId: string;
  };
}

export default function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const orderData = await orderAPIService.getOrder(params.orderId);
        setOrder(orderData);
      } catch (err: any) {
        console.error('Error loading order:', err);
        setError(err.message || 'Failed to load order details');
      } finally {
        setIsLoading(false);
      }
    };

    if (params.orderId) {
      loadOrder();
    }
  }, [params.orderId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString));
  };

  const formatDeliveryDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
    }).format(new Date(dateString));
  };

  const getPaymentStatusBadge = (status: Order['paymentStatus']) => {
    const variants = {
      completed: 'default',
      processing: 'secondary',
      pending: 'outline',
      failed: 'destructive',
      refunded: 'secondary',
    } as const;

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Order</CardTitle>
            <CardDescription>{error || 'Order not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/orders')}>
              View All Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-gray-600">
          Your order has been successfully placed and payment received.
        </p>
      </div>

      {/* Order Summary Card */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Order #{order.orderNumber}</CardTitle>
              <CardDescription className="mt-2">
                Placed on {formatDate(order.createdAt)}
              </CardDescription>
            </div>
            {getPaymentStatusBadge(order.paymentStatus)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student Info */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-hasivu-primary-100 rounded-lg">
                <User className="h-5 w-5 text-hasivu-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Student</p>
                <p className="text-sm text-gray-600">
                  {order.student.firstName} {order.student.lastName}
                </p>
                {order.student.grade && order.student.section && (
                  <p className="text-xs text-gray-500">
                    Grade {order.student.grade}{order.student.section}
                  </p>
                )}
              </div>
            </div>

            {/* School Info */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-hasivu-primary-100 rounded-lg">
                <MapPin className="h-5 w-5 text-hasivu-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">School</p>
                <p className="text-sm text-gray-600">{order.school.name}</p>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="flex items-start gap-3">
              <div className="p-2 bg-hasivu-primary-100 rounded-lg">
                <Calendar className="h-5 w-5 text-hasivu-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery Date</p>
                <p className="text-sm text-gray-600">{formatDeliveryDate(order.deliveryDate)}</p>
              </div>
            </div>

            {/* Contact Phone */}
            {order.contactPhone && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-hasivu-primary-100 rounded-lg">
                  <Phone className="h-5 w-5 text-hasivu-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Contact</p>
                  <p className="text-sm text-gray-600">{order.contactPhone}</p>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Instructions */}
          {order.deliveryInstructions && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">Delivery Instructions</p>
              <p className="text-sm text-gray-600">{order.deliveryInstructions}</p>
            </div>
          )}

          {/* Allergy Info */}
          {order.allergyInfo && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm font-medium text-amber-900 mb-1">Allergy Information</p>
              <p className="text-sm text-amber-800">{order.allergyInfo}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Items ({order.orderItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.orderItems.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {item.menuItem?.name || 'Menu Item'}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Quantity: {item.quantity} × {formatCurrency(item.unitPrice)}
                    </p>
                    {item.specialInstructions && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                    <Badge variant="outline" className="mt-2">
                      {item.status}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(item.totalPrice)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          {/* Payment Summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Discount</span>
                <span className="text-green-600">-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Paid</span>
              <span className="text-hasivu-primary-600">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => window.print()}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Receipt
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Order ${order.orderNumber}`,
                text: `Order confirmed for ${order.student.firstName}`,
              });
            }
          }}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share Order
        </Button>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="parent"
          size="lg"
          asChild
        >
          <Link href={`/orders/${order.id}/track`}>
            Track Order
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button
          variant="outline"
          size="lg"
          asChild
        >
          <Link href="/orders">
            View All Orders
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          asChild
        >
          <Link href="/menu">
            <Home className="h-4 w-4 mr-2" />
            Back to Menu
          </Link>
        </Button>
      </div>

      {/* Next Steps Info */}
      <Card className="mt-8 bg-hasivu-primary-50 border-hasivu-primary-200">
        <CardHeader>
          <CardTitle className="text-lg">What happens next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-hasivu-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium text-gray-900">Order Confirmation</p>
                <p className="text-sm text-gray-600">
                  You'll receive an email confirmation shortly
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-hasivu-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium text-gray-900">Kitchen Preparation</p>
                <p className="text-sm text-gray-600">
                  Our kitchen will prepare your order with care
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-hasivu-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div>
                <p className="font-medium text-gray-900">Delivery</p>
                <p className="text-sm text-gray-600">
                  Meal will be delivered on {formatDeliveryDate(order.deliveryDate)}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-hasivu-primary-600 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium text-gray-900">Track Updates</p>
                <p className="text-sm text-gray-600">
                  You'll receive notifications at each step
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
