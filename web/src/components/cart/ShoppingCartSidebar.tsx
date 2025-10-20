/**
 * Shopping Cart Sidebar Component
 *
 * FIXES: CRITICAL-010 (Shopping Cart Not Implemented) - UI Component
 *
 * Production-ready shopping cart UI with:
 * - Slide-out sidebar/drawer
 * - Cart item list with images
 * - Delivery date picker (popover calendar)
 * - Special instructions textarea
 * - Quantity controls (1-10)
 * - Remove item confirmation dialog
 * - Cart summary with totals
 * - Empty cart state
 * - Proceed to checkout
 * - Mobile responsive
 * - WCAG 2.1 accessible
 *
 * Integrates with: CartContext (global state management)
 */

'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  X as _X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  Calendar,
  User,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/types/cart';

// ============================================================================
// Types
// ============================================================================

interface ShoppingCartSidebarProps {
  /** Optional trigger element (defaults to cart button) */
  trigger?: React.ReactNode;
  /** Optional className */
  className?: string;
  /** Show cart badge on trigger */
  showBadge?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export const ShoppingCartSidebar: React.FC<ShoppingCartSidebarProps> = ({
  trigger,
  className,
  showBadge = true,
}) => {
  const router = useRouter();
  const { cart, updateQuantity, removeItem, clearCart, isLoading, error } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [removeDialogItem, setRemoveDialogItem] = useState<string | null>(null);

  // Minimum order amount (can be configurable)
  const MINIMUM_ORDER = 100;

  // ============================================================================
  // Computed Values
  // ============================================================================

  const canCheckout = useMemo(() => {
    return cart.items.length > 0 && cart.subtotal >= MINIMUM_ORDER;
  }, [cart.items.length, cart.subtotal]);

  const needsMoreForMinimum = useMemo(() => {
    if (cart.items.length === 0) return 0;
    return Math.max(0, MINIMUM_ORDER - cart.subtotal);
  }, [cart.subtotal, cart.items.length]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveClick = (itemId: string) => {
    setRemoveDialogItem(itemId);
  };

  const confirmRemoveItem = () => {
    if (removeDialogItem) {
      removeItem(removeDialogItem);
      setRemoveDialogItem(null);
    }
  };

  const handleCheckout = () => {
    if (!canCheckout) return;
    setIsOpen(false);
    router.push('/checkout');
  };

  // ============================================================================
  // Format Currency
  // ============================================================================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // ============================================================================
  // Default Trigger
  // ============================================================================

  const defaultTrigger = (
    <Button
      variant="outline"
      size="icon"
      className={cn('relative', className)}
      aria-label={`Shopping cart with ${cart.itemCount} items`}
    >
      <ShoppingCart className="h-5 w-5" />
      {showBadge && cart.itemCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {cart.itemCount}
        </Badge>
      )}
    </Button>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>

        <SheetContent
          side="right"
          className="w-full sm:max-w-lg flex flex-col p-0"
          aria-label="Shopping cart"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Cart
                </SheetTitle>
                <SheetDescription className="text-sm text-gray-600 mt-1">
                  {cart.itemCount > 0
                    ? `${cart.itemCount} ${cart.itemCount === 1 ? 'item' : 'items'} in your cart`
                    : 'Your cart is empty'}
                </SheetDescription>
              </div>
              {cart.items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isLoading}
                >
                  Clear All
                </Button>
              )}
            </div>
          </SheetHeader>

          {/* Error Display */}
          {error && (
            <div className="px-6 py-3 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}

          {/* Cart Items */}
          {cart.items.length === 0 ? (
            <EmptyCartState />
          ) : (
            <>
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-4">
                  {cart.items.map(item => (
                    <CartItemComponent
                      key={item.id}
                      item={item}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemoveClick}
                      formatCurrency={formatCurrency}
                      disabled={isLoading}
                    />
                  ))}
                </div>
              </ScrollArea>

              {/* Footer - Cart Summary */}
              <div className="border-t bg-gray-50 px-6 py-4 space-y-4">
                {/* Minimum Order Warning */}
                {needsMoreForMinimum > 0 && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-800">
                      Add {formatCurrency(needsMoreForMinimum)} more to reach the minimum order
                      of {formatCurrency(MINIMUM_ORDER)}
                    </p>
                  </div>
                )}

                {/* Summary Lines */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (GST {(cart.taxRate * 100).toFixed(0)}%)</span>
                    <span className="font-medium">{formatCurrency(cart.tax)}</span>
                  </div>
                  {cart.deliveryFee > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Delivery Fee</span>
                      <span className="font-medium">{formatCurrency(cart.deliveryFee)}</span>
                    </div>
                  )}
                  {cart.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span className="font-medium">-{formatCurrency(cart.discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatCurrency(cart.total)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  onClick={handleCheckout}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-6 text-base"
                  size="lg"
                  disabled={!canCheckout || isLoading}
                >
                  {canCheckout ? (
                    <>
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  ) : (
                    'Cannot Checkout'
                  )}
                </Button>

                {/* Info Text */}
                <p className="text-xs text-center text-gray-500">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  Prices and availability subject to change
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Remove Confirmation Dialog */}
      <Dialog open={!!removeDialogItem} onOpenChange={() => setRemoveDialogItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Item from Cart?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this item from your cart? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogItem(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveItem}
            >
              Remove Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// ============================================================================
// Cart Item Component
// ============================================================================

interface CartItemComponentProps {
  item: CartItem;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  formatCurrency: (amount: number) => string;
  disabled?: boolean;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({
  item,
  onQuantityChange,
  onRemove,
  formatCurrency,
  disabled = false,
}) => {
  const { updateDeliveryDate, updateSpecialInstructions } = useCart();
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [localInstructions, setLocalInstructions] = useState(item.specialInstructions || '');
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      updateDeliveryDate(item.id, date);
      setIsDatePickerOpen(false);
    }
  };

  const handleInstructionsBlur = () => {
    if (localInstructions !== (item.specialInstructions || '')) {
      updateSpecialInstructions(item.id, localInstructions);
    }
  };

  return (
    <div
      className="flex flex-col gap-3 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
      data-testid="cart-item"
    >
      {/* Main Item Row */}
      <div className="flex gap-3">
        {/* Item Image */}
        <div className="relative h-20 w-20 flex-shrink-0 rounded-md overflow-hidden bg-gray-100">
          {item.menuItem.image ? (
            <Image
              src={item.menuItem.image}
              alt={item.menuItem.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-4xl">🍽️</div>
          )}
        </div>

        {/* Item Details */}
        <div className="flex-1 min-w-0">
          {/* Name and Remove */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                {item.menuItem.name}
              </h4>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemove(item.id)}
              className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
              aria-label="Remove item"
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Delivery Date */}
          <div className="mb-2">
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 px-2"
                  disabled={disabled}
                >
                  <Calendar className="h-3 w-3" />
                  {format(item.deliveryDate, 'MMM d, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={item.deliveryDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Price and Quantity Controls */}
          <div className="flex items-center justify-between">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={item.quantity <= 1 || disabled}
                className="h-7 w-7 hover:bg-gray-200"
                aria-label="Decrease quantity"
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                disabled={item.quantity >= 10 || disabled}
                className="h-7 w-7 hover:bg-gray-200"
                aria-label="Increase quantity"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Price */}
            <div className="text-right">
              <div className="font-bold text-gray-900">{formatCurrency(item.totalPrice)}</div>
              {item.quantity > 1 && (
                <div className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} each</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Special Instructions Section */}
      <div className="space-y-2">
        {!isInstructionsExpanded ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsInstructionsExpanded(true)}
            className="w-full h-auto py-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-50"
          >
            <MessageSquare className="h-3 w-3 mr-1.5" />
            {item.specialInstructions
              ? 'Edit special instructions'
              : 'Add special instructions'}
          </Button>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
              <MessageSquare className="h-3 w-3" />
              Special Instructions
            </label>
            <Textarea
              value={localInstructions}
              onChange={(e) => setLocalInstructions(e.target.value)}
              onBlur={handleInstructionsBlur}
              placeholder="E.g., No onions, extra spicy, allergy info..."
              className="min-h-[60px] text-sm resize-none"
              maxLength={200}
              disabled={disabled}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {localInstructions.length}/200
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInstructionsExpanded(false)}
                className="h-auto py-1 text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Allergy Info Display */}
      {item.allergyInfo && (
        <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-xs">
          <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
          <span className="text-red-800">
            <strong>Allergy Info:</strong> {item.allergyInfo}
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Empty Cart State
// ============================================================================

const EmptyCartState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        <ShoppingCart className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
      <p className="text-sm text-gray-600 max-w-sm mb-6">
        Start adding delicious meals to your cart and they'll appear here.
      </p>
      <Button variant="outline" asChild>
        <a href="/menu">Browse Menu</a>
      </Button>
    </div>
  );
};

// ============================================================================
// Export
// ============================================================================

export default ShoppingCartSidebar;
