/**
 * Order Creation Form Component
 *
 * FIXES: CRITICAL-009 (Order Creation Frontend Incomplete)
 *
 * Production-ready order creation form with:
 * - Delivery date picker (future dates only)
 * - Time slot selection (breakfast/lunch/dinner/snack)
 * - Student selection (for parent users)
 * - Customization options (spice level, add-ons, etc.)
 * - Special instructions
 * - Allergen warnings
 * - Real-time validation
 * - Mobile responsive
 * - WCAG 2.1 accessible
 *
 * Integrates with: shopping-cart-context.tsx
 */

'use client';

import React, { useState, _useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  ChefHat,
  AlertTriangle,
  Plus,
  Minus,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useShoppingCart } from '@/contexts/shopping-cart-context';

// ============================================================================
// Types & Validation Schema
// ============================================================================

const orderFormSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item is required'),
  deliveryDate: z.date({
    required_error: 'Delivery date is required',
  }),
  deliveryTimeSlot: z.enum(['breakfast', 'lunch', 'dinner', 'snack'], {
    required_error: 'Time slot is required',
  }),
  quantity: z.number().min(1).max(10),
  studentId: z.string().optional(),
  customizations: z
    .object({
      spiceLevel: z.number().min(0).max(5).optional(),
      excludeIngredients: z.array(z.string()).optional(),
      addOns: z.array(z.string()).optional(),
      specialInstructions: z.string().max(500).optional(),
    })
    .optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

// ============================================================================
// Component Props
// ============================================================================

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
  allergens?: string[];
  spiceLevel?: number;
  availableTimeSlots?: ('breakfast' | 'lunch' | 'dinner' | 'snack')[];
}

interface Student {
  id: string;
  name: string;
  grade?: string;
  allergens?: string[];
  dietaryRestrictions?: string[];
}

interface OrderCreationFormProps {
  /** Menu item to order */
  menuItem: MenuItem;
  /** Available students (for parent users) */
  students?: Student[];
  /** Callback when order is added to cart */
  onAddToCart?: () => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
  /** Optional className */
  className?: string;
}

// ============================================================================
// Available add-ons
// ============================================================================

const AVAILABLEADDONS = [
  { id: 'extra_cheese', label: 'Extra Cheese', price: 20 },
  { id: 'extra_veggies', label: 'Extra Vegetables', price: 15 },
  { id: 'extra_sauce', label: 'Extra Sauce', price: 10 },
  { id: 'butter', label: 'Extra Butter', price: 5 },
  { id: 'paneer', label: 'Add Paneer', price: 30 },
];

// ============================================================================
// Time Slot Options
// ============================================================================

const TIMESLOTS = [
  { value: 'breakfast', label: 'Breakfast', time: '7:00 AM - 9:00 AM', icon: '☀️' },
  { value: 'lunch', label: 'Lunch', time: '12:00 PM - 2:00 PM', icon: '🌤️' },
  { value: 'snack', label: 'Snack', time: '3:30 PM - 4:30 PM', icon: '🍪' },
  { value: 'dinner', label: 'Dinner', time: '6:00 PM - 8:00 PM', icon: '🌙' },
];

// ============================================================================
// Main Component
// ============================================================================

export const OrderCreationForm: React.FC<OrderCreationFormProps> = ({
  menuItem,
  students = [],
  onAddToCart,
  onCancel,
  className,
}) => {
  const { addItem } = useShoppingCart();
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  // Initialize form
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      menuItemId: menuItem.id,
      quantity: 1,
      deliveryDate: addDays(new Date(), 1), // Default to tomorrow
      deliveryTimeSlot: 'lunch',
      customizations: {
        spiceLevel: menuItem.spiceLevel || 2,
        excludeIngredients: [],
        addOns: [],
        specialInstructions: '',
      },
    },
  });

  const watchedQuantity = form.watch('quantity');
  const _watchedSpiceLevel = form.watch('customizations.spiceLevel');
  const watchedStudent = form.watch('studentId');

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSubmit = (data: OrderFormData) => {
    try {
      // Add to cart
      addItem({
        menuItemId: data.menuItemId,
        name: menuItem.name,
        description: menuItem.description,
        price: menuItem.price,
        quantity: data.quantity,
        imageUrl: menuItem.imageUrl,
        category: menuItem.category,
        deliveryDate: data.deliveryDate.toISOString(),
        deliveryTimeSlot: data.deliveryTimeSlot,
        studentId: data.studentId,
        studentName: students.find(s => s.id === data.studentId)?.name,
        customizations: data.customizations,
      });

      toast.success('Added to cart successfully!');

      if (onAddToCart) {
        onAddToCart();
      }

      // Reset form for next order
      form.reset();
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleAddOnToggle = (addOnId: string) => {
    setSelectedAddOns(prev => {
      const newAddOns = prev.includes(addOnId)
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId];

      form.setValue('customizations.addOns', newAddOns);
      return newAddOns;
    });
  };

  // ============================================================================
  // Calculate total price
  // ============================================================================

  const calculateTotalPrice = (): number => {
    const basePrice = menuItem.price * watchedQuantity;
    const addOnsPrice = selectedAddOns.reduce((sum, addOnId) => {
      const addOn = AVAILABLEADDONS.find(a => a.id === addOnId);
      return sum + (addOn?.price || 0) * watchedQuantity;
    }, 0);
    return basePrice + addOnsPrice;
  };

  const totalPrice = calculateTotalPrice();

  // ============================================================================
  // Get spice level label
  // ============================================================================

  const getSpiceLevelLabel = (level: number): string => {
    const labels = ['Mild', 'Low', 'Medium', 'Medium-High', 'Hot', 'Extra Hot'];
    return labels[level] || 'Medium';
  };

  // ============================================================================
  // Check for allergen conflicts
  // ============================================================================

  const selectedStudent = students.find(s => s.id === watchedStudent);
  const hasAllergenConflict = selectedStudent?.allergens?.some(allergen =>
    menuItem.allergens?.includes(allergen)
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn('space-y-6', className)}>
      {/* Menu Item Header */}
      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="w-20 h-20 bg-gray-200 rounded-md flex items-center justify-center text-3xl flex-shrink-0">
          {menuItem.imageUrl ? (
            <img
              src={menuItem.imageUrl}
              alt={menuItem.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            '🍽️'
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-lg text-gray-900">{menuItem.name}</h3>
          <p className="text-sm text-gray-600 mt-1">{menuItem.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{menuItem.category}</Badge>
            <span className="text-lg font-bold text-primary-600">₹{menuItem.price}</span>
          </div>
        </div>
      </div>

      {/* Allergen Warning */}
      {hasAllergenConflict && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900">Allergen Warning</h4>
            <p className="text-sm text-red-700 mt-1">
              This item contains allergens that {selectedStudent?.name} is allergic to:{' '}
              <strong>
                {menuItem.allergens
                  ?.filter(a => selectedStudent?.allergens?.includes(a))
                  .join(', ')}
              </strong>
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Student Selection (for parents) */}
          {students.length > 0 && (
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Select Student
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} {student.grade && `(${student.grade})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>Who is this meal for?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Delivery Date */}
          <FormField
            control={form.control}
            name="deliveryDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Delivery Date
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={date =>
                        isBefore(startOfDay(date), startOfDay(addDays(new Date(), 1)))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>Orders must be placed at least 1 day in advance</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Time Slot Selection */}
          <FormField
            control={form.control}
            name="deliveryTimeSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time Slot
                </FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-3">
                    {TIMESLOTS.map(slot => {
                      const isAvailable =
                        !menuItem.availableTimeSlots ||
                        menuItem.availableTimeSlots.includes(slot.value as any);

                      return (
                        <button
                          key={slot.value}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => field.onChange(slot.value)}
                          className={cn(
                            'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                            field.value === slot.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300',
                            !isAvailable && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span className="text-2xl mb-1">{slot.icon}</span>
                          <span className="font-semibold text-sm">{slot.label}</span>
                          <span className="text-xs text-gray-600 mt-1">{slot.time}</span>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Quantity */}
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => field.onChange(Math.max(1, field.value - 1))}
                      disabled={field.value <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-2xl font-bold w-12 text-center">{field.value}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => field.onChange(Math.min(10, field.value + 1))}
                      disabled={field.value >= 10}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </FormControl>
                <FormDescription>Maximum 10 items per order</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Customizations Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold flex items-center gap-2">
              <ChefHat className="h-4 w-4" />
              Customizations
            </h4>

            {/* Spice Level */}
            <FormField
              control={form.control}
              name="customizations.spiceLevel"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between mb-2">
                    <FormLabel>Spice Level</FormLabel>
                    <Badge variant="secondary">{getSpiceLevelLabel(field.value || 2)}</Badge>
                  </div>
                  <FormControl>
                    <Slider
                      min={0}
                      max={5}
                      step={1}
                      value={[field.value || 2]}
                      onValueChange={([value]) => field.onChange(value)}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Adjust the spice level to your preference
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Add-ons */}
            <div className="space-y-2">
              <Label>Add-ons (Optional)</Label>
              <div className="space-y-2">
                {AVAILABLEADDONS.map(addOn => (
                  <div
                    key={addOn.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={addOn.id}
                        checked={selectedAddOns.includes(addOn.id)}
                        onCheckedChange={() => handleAddOnToggle(addOn.id)}
                      />
                      <label
                        htmlFor={addOn.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {addOn.label}
                      </label>
                    </div>
                    <span className="text-sm text-gray-600">+₹{addOn.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <FormField
              control={form.control}
              name="customizations.specialInstructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Special Instructions (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific requests or dietary requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">Maximum 500 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Price Summary */}
          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Base Price</span>
              <span className="text-sm font-medium">
                ₹{menuItem.price} × {watchedQuantity}
              </span>
            </div>
            {selectedAddOns.length > 0 && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Add-ons</span>
                <span className="text-sm font-medium">
                  +₹
                  {selectedAddOns.reduce((sum, addOnId) => {
                    const addOn = AVAILABLEADDONS.find(a => a.id === addOnId);
                    return sum + (addOn?.price || 0) * watchedQuantity;
                  }, 0)}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-primary-300 flex justify-between items-center">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-2xl text-primary-700">₹{totalPrice}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700"
              disabled={hasAllergenConflict}
            >
              Add to Cart
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default OrderCreationForm;
