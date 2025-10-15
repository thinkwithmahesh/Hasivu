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

"use client";

import React, { useState, _useEffect } from 'react';
import { useForm, _Controller } from 'react-hook-form';
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
  _Info,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  customizations: z.object({
    spiceLevel: z.number().min(0).max(5).optional(),
    excludeIngredients: z.array(z.string()).optional(),
    addOns: z.array(z.string()).optional(),
    specialInstructions: z.string().max(500).optional(),
  }).optional(),
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

const AVAILABLE_ADDONS = [
  { id: 'extra_cheese', label: 'Extra Cheese', price: 20 },
  { id: 'extra_veggies', label: 'Extra Vegetables', price: 15 },
  { id: 'extra_sauce', label: 'Extra Sauce', price: 10 },
  { id: 'butter', label: 'Extra Butter', price: 5 },
  { id: 'paneer', label: 'Add Paneer', price: 30 },
];

// ============================================================================
// Time Slot Options
// ============================================================================

const TIME_SLOTS = [
  { value: 'breakfast', label: 'Breakfast', time: '7:00 AM - 9:00 AM', icon: '☀️' },
