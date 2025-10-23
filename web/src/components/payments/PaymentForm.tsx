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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Lock,
  Shield,
  CheckCircle,
  AlertTriangle,
  Loader2,
  IndianRupee,
  Calendar,
  User,
  Phone,
  Mail,
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

const PAYMENTMETHODS: PaymentMethod[] = [
  {
    id: 'card',
    type: 'card',
    name: 'Credit/Debit Card',
    icon: '💳',
    description: 'Visa, Mastercard, RuPay',
    fee: 0,
  },
  {
    id: 'upi',
    type: 'upi',
    name: 'UPI',
    icon: '📱',
    description: 'Google Pay, PhonePe, Paytm',
    fee: 0,
  },
  {
    id: 'netbanking',
    type: 'netbanking',
    name: 'Net Banking',
    icon: '🏦',
    description: 'All major banks',
    fee: 0,
  },
  {
    id: 'wallet',
    type: 'wallet',
    name: 'Digital Wallet',
    icon: '👛',
    description: 'Paytm, Mobikwik, Ola Money',
    fee: 0,
  },
];

export const PaymentForm: React.FC<PaymentFormProps> = ({
  orderId,
  schoolId,
  parentId,
  amount,
  currency = 'INR',
  description,
  onSuccess,
  onError,
  className,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Card form state
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
    email: '',
    phone: '',
  });

  // UPI form state
  const [upiId, setUpiId] = useState('');

  // Net banking state
  const [selectedBank, setSelectedBank] = useState('');

  const paymentService = PaymentService.getInstance();

  // Format amount for display
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Validate card form
  const validateCardForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cardData.number || cardData.number.replace(/\s/g, '').length < 13) {
      newErrors.number = 'Valid card number is required';
    }

    if (!cardData.expiry || !/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      newErrors.expiry = 'Valid expiry date (MM/YY) is required';
    }

    if (!cardData.cvv || cardData.cvv.length < 3) {
      newErrors.cvv = 'Valid CVV is required';
    }

    if (!cardData.name.trim()) {
      newErrors.name = 'Cardholder name is required';
    }

    if (!cardData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cardData.email)) {
      newErrors.email = 'Valid email is required';
    }

    if (!cardData.phone || cardData.phone.length < 10) {
      newErrors.phone = 'Valid phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts: string[] = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Format expiry date
  const formatExpiry = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // Handle card input changes
  const handleCardInputChange = (field: string, value: string) => {
    let formattedValue = value;

    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardData(prev => ({ ...prev, [field]: formattedValue }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Process payment
  const handlePayment = async () => {
    if (isProcessing) return;

    // Validate based on payment method
    if (selectedMethod === 'card' && !validateCardForm()) {
      return;
    }

    if (selectedMethod === 'upi' && !upiId.trim()) {
      setErrors({ upi: 'UPI ID is required' });
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      let paymentData: any = {
        amount,
        currency,
        orderId,
        schoolId,
        parentId,
        paymentMethod: selectedMethod,
        description,
      };

      // Add method-specific data
      if (selectedMethod === 'card') {
        paymentData = {
          ...paymentData,
          cardData: {
            ...cardData,
            number: cardData.number.replace(/\s/g, ''),
          },
          saveCard,
        };
      } else if (selectedMethod === 'upi') {
        paymentData.upiId = upiId;
      } else if (selectedMethod === 'netbanking') {
        paymentData.bankCode = selectedBank;
      }

      const result = await paymentService.processPayment(paymentData);

      if (result.success) {
        onSuccess?.(result.transactionId || result.data?.transactionId);
      } else {
        onError?.(result.error || 'Payment failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className={cn('w-full max-w-2xl mx-auto', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Secure Payment
        </CardTitle>
        <CardDescription>Complete your payment securely for order #{orderId}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Total Amount</p>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">{formatAmount(amount)}</p>
              <p className="text-sm text-gray-600">Inclusive of all taxes</p>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <Label className="text-base font-medium">Choose Payment Method</Label>
          <RadioGroup
            value={selectedMethod}
            onValueChange={setSelectedMethod}
            className="mt-3 space-y-3"
          >
            {PAYMENTMETHODS.map(method => (
              <div key={method.id} className="flex items-center space-x-3">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label
                  htmlFor={method.id}
                  className="flex-1 flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                  {method.fee === 0 && (
                    <Badge variant="secondary" className="text-xs">
                      No fees
                    </Badge>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Card Payment Form */}
        {selectedMethod === 'card' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Shield className="h-4 w-4" />
              <span>Your payment information is encrypted and secure</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardData.number}
                  onChange={e => handleCardInputChange('number', e.target.value)}
                  className={cn(errors.number && 'border-red-500')}
                  maxLength={19}
                />
                {errors.number && <p className="text-sm text-red-600 mt-1">{errors.number}</p>}
              </div>

              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  placeholder="MM/YY"
                  value={cardData.expiry}
                  onChange={e => handleCardInputChange('expiry', e.target.value)}
                  className={cn(errors.expiry && 'border-red-500')}
                  maxLength={5}
                />
                {errors.expiry && <p className="text-sm text-red-600 mt-1">{errors.expiry}</p>}
              </div>

              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cardData.cvv}
                  onChange={e => handleCardInputChange('cvv', e.target.value)}
                  className={cn(errors.cvv && 'border-red-500')}
                  maxLength={4}
                />
                {errors.cvv && <p className="text-sm text-red-600 mt-1">{errors.cvv}</p>}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardData.name}
                  onChange={e => handleCardInputChange('name', e.target.value)}
                  className={cn(errors.name && 'border-red-500')}
                />
                {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={cardData.email}
                  onChange={e => handleCardInputChange('email', e.target.value)}
                  className={cn(errors.email && 'border-red-500')}
                />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+91 98765 43210"
                  value={cardData.phone}
                  onChange={e => handleCardInputChange('phone', e.target.value)}
                  className={cn(errors.phone && 'border-red-500')}
                />
                {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="saveCard"
                checked={saveCard}
                onCheckedChange={checked => setSaveCard(checked === true)}
              />
              <Label htmlFor="saveCard" className="text-sm">
                Save this card for future payments
              </Label>
            </div>
          </div>
        )}

        {/* UPI Payment Form */}
        {selectedMethod === 'upi' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="user@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className={cn(errors.upi && 'border-red-500')}
              />
              {errors.upi && <p className="text-sm text-red-600 mt-1">{errors.upi}</p>}
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You will be redirected to your UPI app to complete the payment.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Net Banking Form */}
        {selectedMethod === 'netbanking' && (
          <div className="space-y-4">
            <div>
              <Label>Select Your Bank</Label>
              <Select value={selectedBank} onValueChange={setSelectedBank}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HDFC">HDFC Bank</SelectItem>
                  <SelectItem value="ICICI">ICICI Bank</SelectItem>
                  <SelectItem value="SBI">State Bank of India</SelectItem>
                  <SelectItem value="AXIS">Axis Bank</SelectItem>
                  <SelectItem value="KOTAK">Kotak Mahindra Bank</SelectItem>
                  <SelectItem value="OTHER">Other Banks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You will be redirected to your bank's secure login page.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Security Notice */}
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Secure Payment:</strong> All transactions are encrypted and PCI DSS compliant.
            Your payment information is never stored on our servers.
          </AlertDescription>
        </Alert>

        {/* Pay Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full h-12 text-lg"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <Lock className="mr-2 h-5 w-5" />
              Pay {formatAmount(amount)}
            </>
          )}
        </Button>

        {/* Trust Badges */}
        <div className="flex justify-center items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Shield className="h-4 w-4" />
            <span>PCI Compliant</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="h-4 w-4" />
            <span>256-bit SSL</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Secure</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function PaymentFormWithErrorBoundary(props: PaymentFormProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Could send to error reporting service here
      }}
      errorMessages={{
        title: 'Payment Form Unavailable',
        description:
          "We're experiencing technical difficulties loading the payment form. Please try refreshing the page.",
        actionText: 'Reload Payment Form',
      }}
    >
      <PaymentForm {...props} />
    </ErrorBoundary>
  );
}
