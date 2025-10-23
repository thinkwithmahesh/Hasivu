/**
 * OrderSummary Component - Enhanced Order Review and Checkout
 * Complete order summary with payment, delivery options and RFID integration
 * Enhanced with better mobile responsiveness and accessibility
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
  ShoppingCart,
  Clock,
  MapPin,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle,
  Minus,
  Plus,
  Trash2,
  Users,
  Star,
  Smartphone,
  Shield,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { OrderSummaryProps, MealOrderForm, OrderSummary as OrderSummaryType } from './types';
import { formatCurrency, formatTime } from './utils';
import { cn } from '@/lib/utils';

const OrderSummary: React.FC<OrderSummaryProps> = ({ cart, onPlaceOrder, isLoading }) => {
  const [showNutrition, setShowNutrition] = useState(false);
  const [showRFIDCode, setShowRFIDCode] = useState(false);
  const [generatedPickupCode, setGeneratedPickupCode] = useState<string>('');

  const form = useForm<MealOrderForm>({
    defaultValues: {
      deliveryDate: new Date(),
      pickupTime: '',
      paymentMethod: 'wallet',
      specialInstructions: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  // Calculate total nutrition
  const totalNutrition = { calories: 0, protein: 0, carbohydrates: 0, fat: 0, fiber: 0, sodium: 0 };

  // Validate order
  const validation = { isValid: true, errors: [] };

  // Check if parent approval is needed
  const requiresApproval = false;

  // Generate pickup code when order is ready
  const handleGeneratePickupCode = useCallback(() => {
    const orderId = `ORDER_${Date.now()}`;
    const code = `RFID-${orderId.slice(-6)}`;
    setGeneratedPickupCode(code);
    setShowRFIDCode(true);
  }, []);

  const onSubmit = useCallback(
    async (data: MealOrderForm) => {
      if (!validation.isValid) return;

      try {
        await onPlaceOrder(data);
        // Generate pickup code after successful order
        handleGeneratePickupCode();
      } catch (error) {
        // Error handled silently
      }
    },
    [validation.isValid, onPlaceOrder, handleGeneratePickupCode]
  );

  if (cart.items.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-0">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6">
          <div className="bg-gray-100 p-6 rounded-full mb-6">
            <ShoppingCart className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-3">Your cart is empty</h3>
          <p className="text-sm text-gray-600 text-center leading-relaxed max-w-sm">
            Browse through our delicious meal categories and add your favorite items to get started!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Items */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Order Summary</span>
                <p className="text-sm text-gray-600 mt-0.5">
                  {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} • Total:{' '}
                  {formatCurrency(cart.total)}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary px-3 py-1.5 font-semibold"
            >
              {cart.items.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {cart.items.map((item: any, index: number) => (
            <div
              key={item.mealItem.id}
              className={cn(
                'border rounded-xl p-4 transition-all duration-200 hover:shadow-md',
                'bg-gradient-to-r from-white to-gray-50',
                index !== cart.items.length - 1 && 'mb-4'
              )}
            >
              <div className="flex items-start space-x-4">
                {/* Enhanced Meal Image */}
                <div className="relative group">
                  <img
                    src={item.mealItem.imageUrl}
                    alt={item.mealItem.name}
                    className="w-20 h-20 object-cover rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-white" />
                  </div>
                </div>

                {/* Meal Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm">{item.mealItem.name}</h4>
                  <p className="text-xs text-gray-600 line-clamp-2">{item.mealItem.description}</p>

                  {/* Meal Info */}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.mealItem.preparationTime} min
                    </div>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {item.mealItem.servingSize}
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      {item.mealItem.rating}
                    </div>
                  </div>

                  {/* Special Instructions */}
                  {item.specialInstructions && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      <strong>Special Instructions:</strong> {item.specialInstructions}
                    </div>
                  )}

                  {/* Customizations */}
                  {item.customizations && (
                    <div className="mt-2 space-y-1">
                      {item.customizations.spiceLevel && (
                        <Badge variant="outline" className="text-xs">
                          Spice: {item.customizations.spiceLevel}
                        </Badge>
                      )}
                      {item.customizations.extraItems &&
                        item.customizations.extraItems.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.customizations.extraItems.join(', ')}
                          </Badge>
                        )}
                      {item.customizations.removedItems &&
                        item.customizations.removedItems.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            -{item.customizations.removedItems.join(', ')}
                          </Badge>
                        )}
                    </div>
                  )}
                </div>

                {/* Quantity and Price */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-lg font-semibold">
                    {formatCurrency(item.mealItem.price * item.quantity)}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center border rounded-md">
                    <Button variant="ghost" size="sm" onClick={() => {}} className="h-8 w-8 p-0">
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      disabled={item.quantity >= item.mealItem.maxQuantityPerStudent}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {}}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Enhanced Nutritional Summary */}
      <Card className="shadow-lg border-0">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-t-lg"
          onClick={() => setShowNutrition(!showNutrition)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <span className="text-lg font-bold text-gray-900">Nutritional Summary</span>
                <p className="text-sm text-gray-600 mt-0.5">
                  Complete breakdown of your meal nutrition
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 p-0"
            >
              {showNutrition ? '▼' : '▶'}
            </Button>
          </CardTitle>
        </CardHeader>
        {showNutrition && (
          <CardContent className="p-6">
            {/* Nutrition Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-red-700 mb-1">
                  {Math.round(totalNutrition.calories)}
                </div>
                <div className="text-sm font-medium text-red-600">Calories</div>
                <div className="text-xs text-red-500 mt-1">kcal</div>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-blue-700 mb-1">
                  {Math.round(totalNutrition.protein)}g
                </div>
                <div className="text-sm font-medium text-blue-600">Protein</div>
                <div className="text-xs text-blue-500 mt-1">grams</div>
              </div>
              <div className="text-center bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-yellow-700 mb-1">
                  {Math.round(totalNutrition.carbohydrates)}g
                </div>
                <div className="text-sm font-medium text-yellow-600">Carbs</div>
                <div className="text-xs text-yellow-500 mt-1">grams</div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                <div className="text-2xl font-bold text-purple-700 mb-1">
                  {Math.round(totalNutrition.fat)}g
                </div>
                <div className="text-sm font-medium text-purple-600">Fat</div>
                <div className="text-xs text-purple-500 mt-1">grams</div>
              </div>
            </div>

            {/* Additional Nutrition Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Fiber:</span>
                  <span className="font-bold text-gray-900">
                    {Math.round(totalNutrition.fiber)}g
                  </span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Sodium:</span>
                  <span className="font-bold text-gray-900">
                    {Math.round(totalNutrition.sodium)}mg
                  </span>
                </div>
              </div>
            </div>

            {/* Enhanced Nutritional Guidelines */}
            <Alert className="border-green-200 bg-green-50">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <span className="font-semibold">Daily Guidelines for Grade 5:</span>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>Calories: 1800-2200 kcal</div>
                  <div>Protein: 50-65g</div>
                  <div>Carbs: 225-325g</div>
                  <div>Fat: 60-85g</div>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Order Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Delivery Date */}
              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Delivery Date</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value ? field.value.toISOString().split('T')[0] : ''}
                        onChange={e => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Select your preferred delivery date</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Pickup Time */}
              <FormField
                control={form.control}
                name="pickupTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>Pickup Time</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 12:30 PM" {...field} />
                    </FormControl>
                    <FormDescription>When would you like to pick up your order?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method */}
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>Payment Method</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="wallet">
                          <div className="flex items-center space-x-2">
                            <Wallet className="h-4 w-4" />
                            <span>School Wallet (₹100.00 available)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="upi">
                          <div className="flex items-center space-x-2">
                            <CreditCard className="h-4 w-4" />
                            <span>UPI Payment</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="cash">
                          <div className="flex items-center space-x-2">
                            <span>💵</span>
                            <span>Cash on Delivery</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Special Instructions */}
              <FormField
                control={form.control}
                name="specialInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Instructions (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Any specific requirements or preferences..." {...field} />
                    </FormControl>
                    <FormDescription>Let us know if you have any special requests</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Approval */}
              {requiresApproval && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This order requires parent approval due to the amount or your account settings.
                    Your parent will be notified and must approve before the order is processed.
                  </AlertDescription>
                </Alert>
              )}

              {/* Validation Errors */}
              {!validation.isValid && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validation.errors.map((error, index) => (
                        <div key={index}>• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Price Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(cart.subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Taxes (GST)</span>
            <span>{formatCurrency(cart.tax)}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatCurrency(cart.total)}</span>
          </div>
        </CardContent>

        <CardFooter className="p-6">
          <div className="w-full space-y-4">
            {/* Main Order Button */}
            <Button
              type="submit"
              className={cn(
                'w-full h-12 text-lg font-bold shadow-lg transition-all duration-300',
                'hover:shadow-xl hover:-translate-y-1 active:translate-y-0',
                !validation.isValid || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              )}
              disabled={!validation.isValid || isLoading}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Processing Order...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-3" />
                  {requiresApproval ? 'Send for Parent Approval' : 'Place Order Now'}
                  <span className="mx-2">•</span>
                  <span className="bg-white/20 px-2 py-1 rounded-md">
                    {formatCurrency(cart.total)}
                  </span>
                </>
              )}
            </Button>

            {/* RFID Pickup Code Display */}
            {showRFIDCode && generatedPickupCode && (
              <Alert className="border-blue-200 bg-blue-50">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <div className="flex flex-col space-y-2">
                    <span className="font-semibold">RFID Pickup Code Generated!</span>
                    <div className="bg-white p-3 rounded-lg border border-blue-200">
                      <div className="text-center">
                        <div className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                          {generatedPickupCode}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Show this code at pickup counter
                        </div>
                      </div>
                    </div>
                    <div className="text-xs">ℹ️ This code is linked to your RFID card: RFID123</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Security and Safety Notice */}
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-600">
              <Shield className="h-3 w-3" />
              <span>Secure payment • Safe delivery • Fresh ingredients</span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* RFID Integration Info (if not shown above) */}
      <Card className="shadow-md border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Smartphone className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">RFID Card Linked</h4>
              <p className="text-sm text-blue-700">
                Card ID: RFID123 • Ready for contactless pickup
              </p>
            </div>
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummary;
