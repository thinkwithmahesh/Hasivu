/**
 * Cart summary — uses the same `CartProvider` / `useCart` as checkout (`app/layout.tsx`).
 * Checkout runs Razorpay + `orderAPIService.createOrder`; this page routes there when ready.
 */
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';

import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

export default function CartPage() {
  const router = useRouter();
  const { cart, isLoading, updateQuantity, removeItem } = useCart();

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-10">
        <p className="text-muted-foreground">Loading cart…</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-14 w-14 text-muted-foreground" aria-hidden />
        <h1 className="mb-2 text-2xl font-semibold tracking-tight">Your cart is empty</h1>
        <p className="mb-6 text-muted-foreground">
          Browse the menu and add meals for your children.
        </p>
        <Button asChild>
          <Link href="/daily-menu">Browse menu</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Cart</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Items ({cart.itemCount})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cart.items.map(item => {
            const title = item.menuItem?.name ?? item.name ?? 'Menu item';
            return (
              <div
                key={item.id}
                className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatInr(item.unitPrice)} each · delivers{' '}
                    {item.deliveryDate instanceof Date
                      ? item.deliveryDate.toLocaleDateString()
                      : String(item.deliveryDate)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-destructive"
                    aria-label="Remove item"
                    onClick={() => removeItem(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
        <Separator />
        <CardFooter className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            <p>Subtotal {formatInr(cart.subtotal)}</p>
            <p>Tax {formatInr(cart.tax)}</p>
            <p>Delivery {formatInr(cart.deliveryFee)}</p>
            <p className="text-base font-semibold text-foreground">Total {formatInr(cart.total)}</p>
          </div>
          <Button size="lg" className="w-full sm:w-auto" onClick={() => router.push('/checkout')}>
            Proceed to checkout
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
