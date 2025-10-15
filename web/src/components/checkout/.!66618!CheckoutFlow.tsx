/**
 * Checkout Flow Component
 * 
 * FIXES: CRITICAL-012 (Checkout Flow Missing)
 * 
 * Complete checkout flow with:
 * - Multi-step wizard (Review → Payment → Confirm)
 * - Order summary and review
 * - Payment method selection
 * - Delivery address confirmation
 * - Order notes
 * - Place order functionality
 * - Loading and error states
 * - Mobile responsive
 * - WCAG 2.1 accessible
 * 
 * Integrates with: shopping-cart-context.tsx, production-auth-context.tsx
 */

"use client";

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CreditCard,
  MapPin,
  Package,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Edit as _Edit,
  Trash2 as _Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label as _Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useShoppingCart } from '@/contexts/shopping-cart-context';
import { useAuth } from '@/contexts/production-auth-context';

// ============================================================================
// Types
// ============================================================================

type CheckoutStep = 'review' | 'payment' | 'confirm';

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'wallet' | 'cod';
  name: string;
  details: string;
  icon: string;
}

interface DeliveryAddress {
  id: string;
  label: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CheckoutFlowProps {
  /** Callback when checkout is cancelled */
  onCancel?: () => void;
  /** Callback when order is placed successfully */
  onSuccess?: (orderId: string) => void;
  /** Optional className */
  className?: string;
}

// ============================================================================
// Available Payment Methods
// ============================================================================

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'razorpay_card',
    type: 'card',
    name: 'Credit/Debit Card',
    details: 'Visa, Mastercard, Rupay',
