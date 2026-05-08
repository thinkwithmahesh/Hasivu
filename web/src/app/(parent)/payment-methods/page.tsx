'use client';

import React from 'react';
import { CreditCard, Plus, ShieldCheck, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const paymentMethods = [
  {
    id: 'wallet',
    title: 'School Wallet',
    description: 'Primary meal wallet for daily school orders',
    balance: '₹850.00',
    status: 'Active',
  },
  {
    id: 'upi',
    title: 'UPI Autopay',
    description: 'Ready for Razorpay-backed payments when production keys are configured',
    balance: 'Linked',
    status: 'Test mode',
  },
];

const transactions = [
  { id: 'txn-1', label: 'Test checkout order', amount: '₹302.00', status: 'Paid' },
  { id: 'txn-2', label: 'Wallet top-up', amount: '₹500.00', status: 'Completed' },
];

export default function PaymentMethodsPage() {
  return (
    <div className="min-h-screen bg-[var(--hasivu-bg-warm)] px-4 py-8 text-[var(--hasivu-text-primary)]">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[var(--hasivu-primary)]">
              Parent Workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold">Payment Methods</h1>
            <p className="mt-2 text-[var(--hasivu-text-secondary)]">
              Review school wallet, payment readiness, and recent meal transactions.
            </p>
          </div>
          <Button
            type="button"
            className="min-h-11"
            onClick={() => toast.info('Payment method linking is disabled until live Razorpay keys are configured.')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Method
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {paymentMethods.map(method => (
            <Card key={method.id} className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3">
                  <span className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      {method.id === 'wallet' ? (
                        <WalletCards className="h-5 w-5" />
                      ) : (
                        <CreditCard className="h-5 w-5" />
                      )}
                    </span>
                    <span>
                      <span className="block">{method.title}</span>
                      <span className="text-sm font-normal text-[var(--hasivu-text-secondary)]">
                        {method.description}
                      </span>
                    </span>
                  </span>
                  <Badge variant={method.status === 'Active' ? 'default' : 'secondary'}>
                    {method.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[var(--hasivu-text-secondary)]">Current state</p>
                <p className="mt-1 text-2xl font-bold">{method.balance}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-700" />
              Transaction History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-xl border bg-white/70 p-4"
              >
                <div>
                  <p className="font-semibold">{transaction.label}</p>
                  <p className="text-sm text-[var(--hasivu-text-secondary)]">{transaction.status}</p>
                </div>
                <p className="font-bold">{transaction.amount}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
