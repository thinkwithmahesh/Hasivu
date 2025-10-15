'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CreditCard, XCircle, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import {
  OrderCancellationRequest,
  OrderCancellationResponse,
  OrderCancellationModalProps,
} from '@/types/orders';

// Predefined cancellation reasons
const CANCELLATION_REASONS = [
  'Change of mind',
  'Wrong order placed',
  'Delivery delay',
  'Allergies/medical reasons',
  'Duplicate order',
  'Student not available',
  'Payment issues',
  'Other',
];

export function OrderCancellationModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  orderAmount,
  onCancellationComplete,
}: OrderCancellationModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [refundRequested, setRefundRequested] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the final reason (custom or selected)
  const getFinalReason = () => {
    if (selectedReason === 'Other') {
      return customReason.trim() || 'Other';
    }
    return selectedReason;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const reason = getFinalReason();

    if (!reason) {
      setError('Please provide a cancellation reason');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare cancellation request
      const cancellationRequest: OrderCancellationRequest = {
        reason,
        refundRequested,
        cancelledBy: 'parent-123', // In real app, get from auth context
      };

      // Call API to cancel order
      const response = await cancelOrderAPI(orderId, cancellationRequest);

      // Notify parent component
      onCancellationComplete(response);

      // Close modal on success
      if (response.success) {
        onClose();
        // Reset form
        setSelectedReason('');
        setCustomReason('');
        setRefundRequested(true);
      }
    } catch (err) {
      setError('Failed to cancel order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // API call to cancel order
  const cancelOrderAPI = async (
    orderId: string,
    request: OrderCancellationRequest
  ): Promise<OrderCancellationResponse> => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to cancel order',
            code: errorData.code || 'CANCELLATION_FAILED',
          },
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: {
          refundEligible: data.refundEligible,
          refundAmount: data.refundAmount,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection and try again.',
          code: 'NETWORK_ERROR',
        },
      };
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setSelectedReason('');
      setCustomReason('');
      setRefundRequested(true);
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Cancel Order
          </DialogTitle>
          <DialogDescription>
            Cancel order #{orderNumber} for ₹{orderAmount}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Cancelling this order may result in charges depending on the preparation status.
              Refunds are processed within 3-5 business days.
            </AlertDescription>
          </Alert>

          {/* Cancellation Reason */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Reason for cancellation *</Label>
            <div className="space-y-2">
              {CANCELLATION_REASONS.map(reason => (
                <div key={reason} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={reason}
                    name="cancellation-reason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={e => setSelectedReason(e.target.value)}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <Label htmlFor={reason} className="text-sm cursor-pointer">
                    {reason}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom reason textarea */}
            <AnimatePresence>
              {selectedReason === 'Other' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Textarea
                    placeholder="Please provide details about why you're cancelling this order..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    className="mt-2"
                    rows={3}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Separator />

          {/* Refund Request */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="refund-request"
              checked={refundRequested}
              onCheckedChange={checked => setRefundRequested(checked as boolean)}
            />
            <Label htmlFor="refund-request" className="text-sm">
              Request refund to original payment method
            </Label>
          </div>

          {/* Refund Information */}
          {refundRequested && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Refund Information</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Refund eligibility will be determined based on order status and preparation
                progress. Refunds are typically processed within 3-5 business days.
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                !selectedReason ||
                (selectedReason === 'Other' && !customReason.trim())
              }
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default OrderCancellationModal;
