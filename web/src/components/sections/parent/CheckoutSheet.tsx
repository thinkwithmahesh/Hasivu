'use client';

import React, { useState } from 'react';
import { BottomSheet } from '../../ui/BottomSheet';
import { Button } from '../../ui/button';

export interface CheckoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cartTotal: number;
}

export function CheckoutSheet({ isOpen, onClose, cartTotal }: CheckoutSheetProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRazorpayCheckout = async () => {
    setIsProcessing(true);
    // In a real flow, this invokes the existing Razorpay SDK window
    // with the orders created on the backend.

    // Simulate API delay
    setTimeout(() => {
      setIsProcessing(false);
      onClose();
      // Router push to confirmation
    }, 2000);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Complete Order">
      <div className="flex flex-col gap-6 pt-2">
        {/* Order Summary */}
        <div className="bg-pm-surface-2 rounded-xl p-4 border border-pm-neutral-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-ui text-[14px] text-pm-text-secondary">Subtotal</span>
            <span className="font-ui font-semibold text-[14px] text-pm-text-primary">
              ₹{cartTotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center mb-4">
            <span className="font-ui text-[14px] text-pm-text-secondary">Taxes & Fees</span>
            <span className="font-ui font-semibold text-[14px] text-pm-text-primary">
              ₹{(cartTotal * 0.05).toFixed(2)}
            </span>
          </div>

          <div className="pt-3 border-t border-pm-neutral-200 border-dashed flex justify-between items-center">
            <span className="font-ui font-bold text-[16px] text-pm-text-primary">Total to Pay</span>
            <span className="font-hero text-[24px] text-pm-primary-600">
              ₹{(cartTotal * 1.05).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Razorpay Warning / Information */}
        <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <p className="font-body text-[12px] text-pm-text-secondary leading-snug">
            Payments are securely processed by Razorpay. You can use UPI, Credit Cards, or
            Netbanking.
          </p>
        </div>

        {/* Swipe or click to pay block */}
        <Button
          size="lg"
          loading={isProcessing}
          onClick={handleRazorpayCheckout}
          className="mt-2 w-full text-[18px]"
        >
          {isProcessing ? 'Processing Payment...' : 'Pay Securely'}
        </Button>
      </div>
    </BottomSheet>
  );
}
