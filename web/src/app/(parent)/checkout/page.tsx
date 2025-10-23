/**
 * Checkout Page Component
 * Complete checkout flow with Razorpay payment integration
 * Features:
 * - Order summary with cart items
 * - Student selection for multi-child families
 * - Delivery details form with validation
 * - Razorpay payment processing
 * - Progressive enhancement with loading states
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/contexts/CartContext';
import { paymentAPIService } from '@/services/payment-api.service';
import { orderAPIService } from '@/services/order-api.service';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingCart,
  User,
  Phone,
  MapPin,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
  Calendar,
  Trash2,
} from 'lucide-react';

// Checkout form validation schema
const checkoutFormSchema = z.object({
  studentId: z.string().min(1, 'Please select a student'),
  contactPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  deliveryInstructions: z.string().optional(),
  allergyInfo: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutFormSchema>;

// Mock student data - Replace with actual API call
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string;
  section?: string;
  schoolId: string;
}

// Mock user profile - Replace with actual auth context
interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  students: Student[];
}

// Payment processing states
enum PaymentState {
  IDLE = 'idle',
  LOADING_SCRIPT = 'loading_script',
  CREATING_ORDER = 'creating_order',
  PROCESSING_PAYMENT = 'processing_payment',
  VERIFYING = 'verifying',
  SUCCESS = 'success',
  ERROR = 'error',
}

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    isLoading: isLoadingCart,
    clearCart,
    removeItem,
    updateQuantity,
    updateDeliveryDate,
  } = useCart();

  // Form state
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutFormSchema),
  });

  // Component state
  const [paymentState, setPaymentState] = useState<PaymentState>(PaymentState.IDLE);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Watch form values
  const selectedStudentId = watch('studentId');

  // Load Razorpay script on mount
  useEffect(() => {
    const loadRazorpay = async () => {
      try {
        setPaymentState(PaymentState.LOADING_SCRIPT);
        const loaded = await paymentAPIService.loadRazorpayScript();
        setRazorpayLoaded(loaded);
        if (!loaded) {
          setPaymentError('Failed to load payment gateway. Please refresh the page.');
        }
        setPaymentState(PaymentState.IDLE);
      } catch (error) {
        console.error('Error loading Razorpay:', error);
        setPaymentError('Payment system unavailable. Please try again later.');
        setPaymentState(PaymentState.ERROR);
      }
    };

    loadRazorpay();
  }, []);

  // Load user profile and students
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoadingProfile(true);

        // TODO: Replace with actual API call to get parent profile
        // Mock data for development
        const mockProfile: UserProfile = {
          id: 'parent_123',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+91 9876543210',
          students: [
            {
              id: 'student_1',
              firstName: 'Emma',
              lastName: 'Doe',
              grade: '5',
              section: 'A',
              schoolId: 'school_1',
            },
            {
              id: 'student_2',
              firstName: 'Liam',
              lastName: 'Doe',
              grade: '3',
              section: 'B',
              schoolId: 'school_1',
            },
          ],
        };

        setUserProfile(mockProfile);

        // Pre-fill phone number if available
        if (mockProfile.phone) {
          setValue('contactPhone', mockProfile.phone);
        }

        // Auto-select student if only one
        if (mockProfile.students.length === 1) {
          setValue('studentId', mockProfile.students[0].id);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        setPaymentError('Failed to load profile. Please refresh the page.');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadUserProfile();
  }, [setValue]);

  // Redirect if cart is empty
  useEffect(() => {
    if (!isLoadingCart && cart.items.length === 0) {
      router.push('/menu');
    }
  }, [isLoadingCart, cart.items.length, router]);

  // Handle checkout submission
  const onSubmit = async (formData: CheckoutFormData) => {
    if (!razorpayLoaded) {
      setPaymentError('Payment gateway not ready. Please refresh the page.');
      return;
    }

    if (cart.items.length === 0) {
      setPaymentError('Your cart is empty. Please add items before checkout.');
      return;
    }

    try {
      setPaymentState(PaymentState.CREATING_ORDER);
      setPaymentError(null);

      // Step 1: Create order via orderAPIService
      const orderItems = cart.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        customizations: item.customizations,
      }));

      const createOrderRequest = {
        studentId: formData.studentId,
        deliveryDate: cart.items[0].deliveryDate.toISOString(), // Use first item's delivery date
        orderItems,
        deliveryInstructions: formData.deliveryInstructions,
        contactPhone: formData.contactPhone,
        allergyInfo: formData.allergyInfo,
      };

      const order = await orderAPIService.createOrder(createOrderRequest);

      // Step 2: Process payment via paymentAPIService
      setPaymentState(PaymentState.PROCESSING_PAYMENT);

      const paymentResult = await paymentAPIService.processPayment(
        order.id,
        cart.total * 100, // Convert to paisa
        {
          name: userProfile?.name,
          email: userProfile?.email,
          phone: formData.contactPhone,
        }
      );

      // Step 3: Handle payment success
      if (paymentResult.success) {
        setPaymentState(PaymentState.SUCCESS);

        // Clear cart
        clearCart();

        // Redirect to confirmation page
        router.push(`/orders/${order.id}/confirmation`);
      } else {
        throw new Error(paymentResult.message || 'Payment verification failed');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      setPaymentState(PaymentState.ERROR);

      // User-friendly error messages
      if (error.message?.includes('cancelled')) {
        setPaymentError('Payment was cancelled. You can try again.');
      } else if (error.message?.includes('failed')) {
        setPaymentError('Payment failed. Please check your payment details and try again.');
      } else {
        setPaymentError(error.message || 'An error occurred during checkout. Please try again.');
      }
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
    }).format(date);
  };

  // Get progress message based on payment state
  const getProgressMessage = () => {
    switch (paymentState) {
      case PaymentState.LOADING_SCRIPT:
        return 'Loading payment gateway...';
      case PaymentState.CREATING_ORDER:
        return 'Creating your order...';
      case PaymentState.PROCESSING_PAYMENT:
        return 'Processing payment...';
      case PaymentState.VERIFYING:
        return 'Verifying payment...';
      case PaymentState.SUCCESS:
        return 'Payment successful! Redirecting...';
      default:
        return null;
    }
  };

  const isProcessing = paymentState !== PaymentState.IDLE && paymentState !== PaymentState.ERROR;
  const progressMessage = getProgressMessage();

  // Loading state
  if (isLoadingCart || isLoadingProfile) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">Review your order and complete payment</p>
      </div>

      {/* Progress Indicator */}
      {progressMessage && (
        <Alert className="mb-6 border-hasivu-primary-200 bg-hasivu-primary-50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Processing</AlertTitle>
          <AlertDescription>{progressMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {paymentError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{paymentError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Student Selection */}
            {userProfile && userProfile.students.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-hasivu-primary-500" />
                    Select Student
                  </CardTitle>
                  <CardDescription>Choose which student will receive this meal</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="student">Student *</Label>
                    <Select
                      value={selectedStudentId}
                      onValueChange={value => setValue('studentId', value)}
                      disabled={isProcessing}
                    >
                      <SelectTrigger
                        id="student"
                        className={errors.studentId ? 'border-destructive' : ''}
                      >
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {userProfile.students.map(student => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName}
                            {student.grade &&
                              student.section &&
                              ` (Grade ${student.grade}${student.section})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.studentId && (
                      <p className="text-sm text-destructive">{errors.studentId.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Delivery Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-hasivu-primary-500" />
                  Delivery Details
                </CardTitle>
                <CardDescription>
                  Provide delivery instructions and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Phone */}
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+91 9876543210"
                    {...register('contactPhone')}
                    error={errors.contactPhone?.message}
                    disabled={isProcessing}
                  />
                </div>

                {/* Delivery Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="deliveryInstructions">Delivery Instructions (Optional)</Label>
                  <Textarea
                    id="deliveryInstructions"
                    placeholder="E.g., Gate 2, near playground, hand to teacher"
                    rows={3}
                    {...register('deliveryInstructions')}
                    disabled={isProcessing}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Help us deliver to the right location
                  </p>
                </div>

                {/* Allergy Information */}
                <div className="space-y-2">
                  <Label htmlFor="allergyInfo">Allergy Information (Optional)</Label>
                  <Textarea
                    id="allergyInfo"
                    placeholder="E.g., Peanut allergy, Lactose intolerant"
                    rows={2}
                    {...register('allergyInfo')}
                    disabled={isProcessing}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Please specify any food allergies or dietary restrictions
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-hasivu-primary-500" />
                  Order Items ({cart.itemCount})
                </CardTitle>
                <CardDescription>Review your items and delivery dates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cart.items.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex gap-4">
                        {/* Item Image Placeholder */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                          <span className="text-3xl">{'🍽️'}</span>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {item.menuItem.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Qty: {item.quantity}
                            </Badge>
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.deliveryDate)}
                            </Badge>
                          </div>
                          {item.specialInstructions && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              Note: {item.specialInstructions}
                            </p>
                          )}
                        </div>

                        {/* Item Price */}
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(item.totalPrice)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({(cart.taxRate * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{formatCurrency(cart.tax)}</span>
                  </div>

                  {/* Delivery Fee */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="font-medium">{formatCurrency(cart.deliveryFee)}</span>
                  </div>

                  {/* Discount */}
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Discount</span>
                      <span className="font-medium text-green-600">
                        -{formatCurrency(cart.discount)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-lg font-bold text-hasivu-primary-600">
                      {formatCurrency(cart.total)}
                    </span>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-hasivu-primary-50 border border-hasivu-primary-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <CreditCard className="h-4 w-4 text-hasivu-primary-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-hasivu-primary-900">
                        <p className="font-medium mb-1">Secure Payment</p>
                        <p className="text-hasivu-primary-700">
                          Powered by Razorpay. Your payment information is encrypted and secure.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    variant="parent"
                    size="lg"
                    className="w-full"
                    disabled={isProcessing || !razorpayLoaded || cart.items.length === 0}
                    loading={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pay {formatCurrency(cart.total)}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => router.push('/menu')}
                    disabled={isProcessing}
                  >
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>

              {/* Security Badge */}
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>SSL Secured Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
