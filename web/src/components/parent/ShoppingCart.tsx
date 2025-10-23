'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart as ShoppingCartIcon,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  CalendarIcon,
  Clock,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  orderService,
  type CartCalculation,
  type DeliverySlot,
  type MealType,
  type CartItem as CartItemType,
  type NutritionSummary,
} from '@/services/order.service';
import { formatAllergenList, type AllergenType } from '@/services/nutrition.service';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CartItemData {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
  allergens?: Array<{
    id: string;
    name: string;
    type: AllergenType;
    severity: 'high' | 'medium' | 'low';
  }>;
  customizations?: string[];
  specialInstructions?: string;
}

export interface ShoppingCartProps {
  studentId: string;
  schoolId: string;
  initialCartItems?: CartItemData[];
  onProceedToCheckout?: (
    calculation: CartCalculation,
    deliveryDate: string,
    deliverySlotId: string,
    specialInstructions: string
  ) => void;
  onUpdateCart?: (items: CartItemData[]) => void;
  onClearCart?: () => void;
  className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get tomorrow's date in ISO format
 */
const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Get max date (30 days from today) in ISO format
 */
const getMaxDate = (): string => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);
  return maxDate.toISOString().split('T')[0];
};

/**
 * Format currency in INR
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get nutrition score color class
 */
const getNutritionScoreColor = (score: number): string => {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Cart Item Component
 * Displays individual cart item with quantity controls
 */
interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
}

const CartItem: React.FC<CartItemProps> = ({ item, onUpdateQuantity, onRemove, disabled }) => {
  const totalPrice = item.unitPrice * item.quantity;

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Item Image */}
          {item.imageUrl && (
            <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Item Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-base mb-1 truncate">{item.name}</h4>
            {item.description && (
              <p className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</p>
            )}

            {/* Unit Price */}
            <p className="text-sm text-gray-600 mb-2">{formatCurrency(item.unitPrice)} each</p>

            {/* Allergen Tags */}
            {item.allergens && item.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.allergens.map(allergen => (
                  <Badge
                    key={allergen.id}
                    variant={allergen.severity === 'high' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {allergen.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Customizations */}
            {item.customizations && item.customizations.length > 0 && (
              <div className="text-xs text-gray-500 mb-2">
                <span className="font-medium">Customizations:</span>{' '}
                {item.customizations.join(', ')}
              </div>
            )}
          </div>

          {/* Quantity Controls & Price */}
          <div className="flex flex-col items-end gap-2">
            {/* Quantity Control */}
            <div className="flex items-center gap-2 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={disabled || item.quantity <= 1}
                className="h-8 w-8 p-0"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </Button>

              <span className="w-8 text-center font-medium">{item.quantity}</span>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={disabled || item.quantity >= 10}
                className="h-8 w-8 p-0"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Total Price */}
            <div className="text-right">
              <p className="text-lg font-semibold">{formatCurrency(totalPrice)}</p>
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Delivery Selector Component
 * Date and time slot selection
 */
interface DeliverySelectorProps {
  deliveryDate: string;
  selectedSlot: string;
  availableSlots: DeliverySlot[];
  onDateChange: (date: string) => void;
  onSlotChange: (slotId: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

const DeliverySelector: React.FC<DeliverySelectorProps> = ({
  deliveryDate,
  selectedSlot,
  availableSlots,
  onDateChange,
  onSlotChange,
  loading,
  disabled,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Delivery Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="delivery-date">Delivery Date</Label>
          <Input
            id="delivery-date"
            type="date"
            min={getTomorrowDate()}
            max={getMaxDate()}
            value={deliveryDate}
            onChange={e => onDateChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
          <p className="text-xs text-gray-500">Orders must be placed at least 1 day in advance</p>
        </div>

        {/* Time Slot Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Delivery Time Slot
          </Label>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : availableSlots.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No delivery slots available for this date. Please select a different date.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={selectedSlot} onValueChange={onSlotChange} disabled={disabled}>
              <div className="space-y-2">
                {availableSlots.map(slot => (
                  <div
                    key={slot.id}
                    className={cn(
                      'flex items-center space-x-2 p-3 rounded-md border transition-colors',
                      !slot.available && 'opacity-50 cursor-not-allowed bg-gray-50',
                      slot.available && 'hover:bg-gray-50 cursor-pointer'
                    )}
                  >
                    <RadioGroupItem
                      value={slot.id}
                      id={`slot-${slot.id}`}
                      disabled={!slot.available || disabled}
                    />
                    <Label htmlFor={`slot-${slot.id}`} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{slot.time}</p>
                          <p className="text-sm text-gray-500 capitalize">{slot.mealType}</p>
                        </div>
                        <div className="text-right">
                          {slot.available ? (
                            <Badge variant="outline" className="bg-green-50">
                              {slot.capacity - slot.currentBookings} slots left
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Full</Badge>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Nutrition Summary Component
 * Displays aggregated nutrition for entire cart
 */
interface NutritionSummaryProps {
  summary: NutritionSummary;
}

const NutritionSummaryCard: React.FC<NutritionSummaryProps> = ({ summary }) => {
  // Calculate nutrition score (0-100)
  const nutritionScore = useMemo(() => {
    let score = 50;

    // Positive factors
    if (summary.totalProtein > 20) score += 10;
    if (summary.totalFiber > 10) score += 10;

    // Negative factors
    if (summary.totalSugar > 50) score -= 15;
    if (summary.totalSodium > 2000) score -= 15;

    return Math.max(0, Math.min(100, score));
  }, [summary]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total Nutrition</CardTitle>
        <CardDescription>Nutritional information for entire order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Nutrition Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{summary.totalCalories}</p>
            <p className="text-xs text-gray-600">Calories (kcal)</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{summary.totalProtein}g</p>
            <p className="text-xs text-gray-600">Protein</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{summary.totalCarbs}g</p>
            <p className="text-xs text-gray-600">Carbs</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{summary.totalFat}g</p>
            <p className="text-xs text-gray-600">Fat</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{summary.totalFiber}g</p>
            <p className="text-xs text-gray-600">Fiber</p>
          </div>

          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{summary.totalSodium}mg</p>
            <p className="text-xs text-gray-600">Sodium</p>
          </div>
        </div>

        {/* Nutrition Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Nutrition Score</Label>
            <span className={cn('font-bold text-lg', getNutritionScoreColor(nutritionScore))}>
              {nutritionScore}/100
            </span>
          </div>
          <Progress value={nutritionScore} className="h-2" />
          <p className="text-xs text-gray-500">
            {nutritionScore >= 75 && 'Excellent nutritional balance'}
            {nutritionScore >= 50 && nutritionScore < 75 && 'Good nutritional balance'}
            {nutritionScore < 50 && 'Consider adding more nutritious items'}
          </p>
        </div>

        {/* Guideline Notes */}
        {summary.guidelineNotes && summary.guidelineNotes.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1">
                {summary.guidelineNotes.map((note, idx) => (
                  <li key={idx}>{note}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Allergen Warnings Component
 * Displays all allergens present in cart
 */
interface AllergenWarningsProps {
  allergenWarnings: string[];
  allergenAlerts: Array<{
    allergenType: AllergenType;
    studentAllergic: boolean;
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

const AllergenWarnings: React.FC<AllergenWarningsProps> = ({
  allergenWarnings,
  allergenAlerts,
}) => {
  if (allergenWarnings.length === 0 && allergenAlerts.length === 0) {
    return null;
  }

  const criticalAlerts = allergenAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = allergenAlerts.filter(a => a.severity === 'warning');

  return (
    <div className="space-y-3">
      {/* Critical Allergen Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Critical Allergen Warning</AlertTitle>
          <AlertDescription>
            <p className="font-medium mb-2">
              This order contains allergens that the student is allergic to:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {criticalAlerts.map((alert, idx) => (
                <li key={idx} className="text-sm">
                  {alert.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning Allergen Alerts */}
      {warningAlerts.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">Allergen Advisory</AlertTitle>
          <AlertDescription className="text-yellow-800">
            <ul className="list-disc list-inside space-y-1 text-sm">
              {warningAlerts.map((alert, idx) => (
                <li key={idx}>{alert.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* General Allergen Information */}
      {allergenWarnings.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Allergens Present</AlertTitle>
          <AlertDescription>
            <p className="text-sm mb-2">This order contains the following allergens:</p>
            <div className="flex flex-wrap gap-2">
              {allergenWarnings.map((allergen, idx) => (
                <Badge key={idx} variant="outline">
                  {allergen}
                </Badge>
              ))}
            </div>
            <p className="text-xs mt-2 text-gray-600">
              ⚠️ Please verify with kitchen staff if you have severe allergies or concerns.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

/**
 * Order Summary Component
 * Displays pricing breakdown
 */
interface OrderSummaryProps {
  calculation: CartCalculation | null;
  totalItems: number;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ calculation, totalItems }) => {
  if (!calculation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})
          </span>
          <span className="font-medium">{formatCurrency(calculation.subtotal)}</span>
        </div>

        {/* Tax */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Tax (GST {calculation.taxRate}%)</span>
          <span className="font-medium">{formatCurrency(calculation.tax)}</span>
        </div>

        {/* Delivery Fee */}
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Delivery Fee</span>
          <span className="font-medium">
            {calculation.deliveryFee === 0 ? (
              <Badge variant="default" className="bg-green-600">
                FREE
              </Badge>
            ) : (
              formatCurrency(calculation.deliveryFee)
            )}
          </span>
        </div>

        {/* Discount */}
        {calculation.discount > 0 && (
          <div className="flex items-center justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatCurrency(calculation.discount)}</span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold">Total</span>
          <span className="text-xl font-bold">{formatCurrency(calculation.total)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Empty Cart State Component
 */
const EmptyCartState: React.FC = () => {
  return (
    <div className="text-center py-16">
      <ShoppingCartIcon className="h-24 w-24 mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h3>
      <p className="text-gray-500 mb-6">Add items from the menu to get started</p>
    </div>
  );
};

// ============================================================================
// Main ShoppingCart Component
// ============================================================================

export const ShoppingCart: React.FC<ShoppingCartProps> = ({
  studentId,
  schoolId,
  initialCartItems = [],
  onProceedToCheckout,
  onUpdateCart,
  onClearCart,
  className,
}) => {
  // State Management
  const [cartItems, setCartItems] = useState<CartItemData[]>(initialCartItems);
  const [deliveryDate, setDeliveryDate] = useState<string>(getTomorrowDate());
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<DeliverySlot[]>([]);
  const [calculation, setCalculation] = useState<CartCalculation | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Loading States
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingCalculation, setLoadingCalculation] = useState(false);
  const [processingCheckout, setProcessingCheckout] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Computed Values
  const totalItems = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  const canCheckout = useMemo(() => {
    return (
      cartItems.length > 0 &&
      deliveryDate !== '' &&
      selectedSlot !== '' &&
      calculation !== null &&
      !processingCheckout
    );
  }, [cartItems, deliveryDate, selectedSlot, calculation, processingCheckout]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Load delivery slots when date changes
   */
  useEffect(() => {
    const loadDeliverySlots = async () => {
      if (!deliveryDate || !schoolId) return;

      setLoadingSlots(true);
      setError(null);
      try {
        const slots = await orderService.getDeliverySlots({
          schoolId,
          date: deliveryDate,
        });
        setAvailableSlots(slots);

        // Auto-select first available slot
        const firstAvailable = slots.find(slot => slot.available);
        if (firstAvailable && !selectedSlot) {
          setSelectedSlot(firstAvailable.id);
        }
      } catch (err) {
        console.error('Failed to load delivery slots:', err);
        setError('Failed to load delivery slots. Please try again.');
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadDeliverySlots();
  }, [deliveryDate, schoolId]);

  /**
   * Calculate cart totals when cart items, date, or slot changes
   */
  useEffect(() => {
    const calculateCartTotals = async () => {
      if (cartItems.length === 0 || !deliveryDate || !selectedSlot) {
        setCalculation(null);
        return;
      }

      setLoadingCalculation(true);
      setError(null);
      try {
        const calc = await orderService.calculateCart({
          studentId,
          deliveryDate,
          deliverySlotId: selectedSlot,
          items: cartItems.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            customizations: item.customizations,
            specialInstructions: item.specialInstructions,
          })),
        });
        setCalculation(calc);
      } catch (err) {
        console.error('Failed to calculate cart:', err);
        setError('Failed to calculate order total. Please try again.');
        setCalculation(null);
      } finally {
        setLoadingCalculation(false);
      }
    };

    calculateCartTotals();
  }, [cartItems, deliveryDate, selectedSlot, studentId]);

  /**
   * Notify parent component when cart changes
   */
  useEffect(() => {
    onUpdateCart?.(cartItems);
  }, [cartItems, onUpdateCart]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Update item quantity
   */
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity: Math.min(newQuantity, 10) } : item
      )
    );
  };

  /**
   * Remove item from cart
   */
  const handleRemoveItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  /**
   * Clear entire cart
   */
  const handleClearCart = () => {
    setCartItems([]);
    setCalculation(null);
    onClearCart?.();
  };

  /**
   * Handle delivery date change
   */
  const handleDateChange = (date: string) => {
    setDeliveryDate(date);
    setSelectedSlot(''); // Reset slot when date changes
  };

  /**
   * Handle slot change
   */
  const handleSlotChange = (slotId: string) => {
    setSelectedSlot(slotId);
  };

  /**
   * Proceed to checkout
   */
  const handleProceedToCheckout = async () => {
    if (!canCheckout || !calculation) return;

    setProcessingCheckout(true);
    try {
      await onProceedToCheckout?.(calculation, deliveryDate, selectedSlot, specialInstructions);
    } catch (err) {
      console.error('Checkout failed:', err);
      setError('Failed to proceed to checkout. Please try again.');
    } finally {
      setProcessingCheckout(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('container max-w-6xl mx-auto py-6 px-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCartIcon className="h-8 w-8" />
            Shopping Cart
            {totalItems > 0 && (
              <Badge variant="default" className="ml-2">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </Badge>
            )}
          </h1>
          <p className="text-gray-500 mt-1">Review your order and proceed to checkout</p>
        </div>

        {cartItems.length > 0 && (
          <Button
            variant="ghost"
            onClick={handleClearCart}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {cartItems.length === 0 ? (
        <EmptyCartState />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Cart Items & Delivery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Items in Cart</h2>
              <div>
                {cartItems.map(item => (
                  <CartItem
                    key={item.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                    disabled={processingCheckout}
                  />
                ))}
              </div>
            </div>

            {/* Delivery Selection */}
            <DeliverySelector
              deliveryDate={deliveryDate}
              selectedSlot={selectedSlot}
              availableSlots={availableSlots}
              onDateChange={handleDateChange}
              onSlotChange={handleSlotChange}
              loading={loadingSlots}
              disabled={processingCheckout}
            />

            {/* Special Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Special Instructions</CardTitle>
                <CardDescription>Add any special requests or dietary notes</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="E.g., Please call before delivery, extra sauce on the side, etc."
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  disabled={processingCheckout}
                  rows={3}
                  maxLength={500}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {specialInstructions.length}/500 characters
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Summary & Checkout */}
          <div className="space-y-6">
            {/* Nutrition Summary */}
            {calculation && <NutritionSummaryCard summary={calculation.nutritionSummary} />}

            {/* Allergen Warnings */}
            {calculation && (
              <AllergenWarnings
                allergenWarnings={calculation.allergenWarnings}
                allergenAlerts={calculation.allergenAlerts}
              />
            )}

            {/* Order Summary */}
            <OrderSummary calculation={calculation} totalItems={totalItems} />

            {/* Checkout Button */}
            <Button
              className="w-full h-12 text-lg"
              size="lg"
              disabled={!canCheckout}
              onClick={handleProceedToCheckout}
            >
              {processingCheckout ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Proceed to Checkout
                  <ChevronRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {!canCheckout && cartItems.length > 0 && (
              <p className="text-sm text-center text-gray-500">
                {!deliveryDate && 'Please select a delivery date'}
                {deliveryDate && !selectedSlot && 'Please select a delivery time slot'}
                {deliveryDate && selectedSlot && !calculation && 'Calculating order total...'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
