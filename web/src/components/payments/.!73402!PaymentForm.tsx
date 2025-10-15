/**
 * HASIVU Platform - Payment Form Component
 * Epic 5: Payment Processing & Billing System
 *
 * Secure payment form with PCI compliance, multiple payment methods,
 * and real-time validation for school meal ordering
 */

import React, { useState, _useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { _Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Lock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  _IndianRupee,
  _Calendar,
  _User,
  _Phone,
  _Mail
} from 'lucide-react';
import { PaymentService } from '@/services/payment.service';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

interface PaymentFormProps {
  orderId: string;
  schoolId: string;
  parentId: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  name: string;
  icon: string;
  description: string;
  fee?: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Card',
