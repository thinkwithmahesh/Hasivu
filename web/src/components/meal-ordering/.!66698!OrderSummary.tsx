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
  TrendingUp
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
import type { OrderSummaryProps, MealOrderForm } from './types';
import {
  formatCurrency,
  validateOrder,
  calculateTotalNutrition,
  needsParentApproval,
  formatTime,
  calculateEstimatedDelivery,
  generatePickupCode,
} from './utils';
import { cn } from '@/lib/utils';

const OrderSummary: React.FC<OrderSummaryProps> = ({
  orderSummary,
  student,
  onUpdateQuantity,
  onRemoveItem,
  onPlaceOrder,
  isPlacingOrder = false,
}) => {
  const [showNutrition, setShowNutrition] = useState(false);
  const [showRFIDCode, setShowRFIDCode] = useState(false);
  const [generatedPickupCode, setGeneratedPickupCode] = useState<string>('');
  
  const form = useForm<MealOrderForm>({
    defaultValues: {
      deliveryTime: orderSummary.selectedDeliverySlot.id,
      deliveryLocation: orderSummary.selectedDeliverySlot.deliveryLocation,
      paymentMethod: 'wallet',
      specialInstructions: '',
      parentApprovalRequested: false,
    },
  });

  // Calculate total nutrition
  const totalNutrition = calculateTotalNutrition(orderSummary.items);
  
  // Validate order
  const validation = validateOrder(orderSummary, student);
  
  // Check if parent approval is needed
  const requiresApproval = needsParentApproval(orderSummary, student);

  // Set parent approval automatically if needed
  useEffect(() => {
    if (requiresApproval) {
      form.setValue('parentApprovalRequested', true);
    }
  }, [requiresApproval, form]);

  // Generate pickup code when order is ready
  const handleGeneratePickupCode = useCallback(() => {
    const orderId = `ORDER_${Date.now()}`;
    const code = generatePickupCode(orderId, student.id);
    setGeneratedPickupCode(code);
    setShowRFIDCode(true);
  }, [student.id]);

  const onSubmit = useCallback(async (data: MealOrderForm) => {
    if (!validation.isValid) return;
    
    try {
      await onPlaceOrder(data);
      // Generate pickup code after successful order
      handleGeneratePickupCode();
    } catch (error) {
    }
  }, [validation.isValid, onPlaceOrder, handleGeneratePickupCode]);

  const handleQuantityUpdate = useCallback((mealId: string, change: number) => {
    const currentItem = orderSummary.items.find(item => item.mealItem.id === mealId);
    if (currentItem) {
      const newQuantity = Math.max(0, currentItem.quantity + change);
      if (newQuantity === 0) {
        onRemoveItem(mealId);
      } else {
        onUpdateQuantity(mealId, newQuantity);
      }
    }
  }, [orderSummary.items, onRemoveItem, onUpdateQuantity]);

  if (orderSummary.items.length === 0) {
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
                <span className="text-lg font-bold text-gray-900">
                  Order Summary
                </span>
                <p className="text-sm text-gray-600 mt-0.5">
