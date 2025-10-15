'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  Trash2,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  rating: number;
  prepTime: string;
  dietary: string[];
  image: string;
  priceValue: number;
  quantity: number;
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  className?: string;
}

export function CartSidebar({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  className,
}: CartSidebarProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const totalPrice = cart.reduce((total, item) => total + item.priceValue * item.quantity, 0);
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const estimatedTime = Math.max(...cart.map(item => parseInt(item.prepTime))) || 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'fixed right-0 top-0 h-full w-full max-w-md z-50',
          'bg-white shadow-2xl transform transition-transform duration-300 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          className
        )}
        data-testid="cart-sidebar"
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Your Cart</h2>
                <p className="text-primary-100 text-sm">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'} • Est. {estimatedTime}min
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="close-cart"
              className="h-10 w-10 p-0 text-white hover:bg-white/20 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Progress Indicator */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-primary-100">Order Progress</span>
              <span className="text-white font-medium">Ready to order</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-white to-primary-200 rounded-full w-full transform transition-transform duration-500"></div>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="h-24 w-24 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
                <ShoppingCart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Browse our delicious menu and add your favorite items to get started!
              </p>
              <Button onClick={onClose} className="bg-primary-600 hover:bg-primary-700">
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cart.map((item, index) => (
                <div
                  key={item.id}
                  className={cn(
                    'bg-white border border-gray-200 rounded-2xl p-4 shadow-sm',
                    'hover:shadow-md transition-all duration-200',
                    'animate-in slide-in-from-right-5 duration-300'
                  )}
                  style={{ animationDelay: `${index * 100}ms` }}
                  data-testid="cart-item"
                  data-name={item.name}
                >
                  <div className="flex gap-4">
                    {/* Food Image */}
                    <div className="h-16 w-16 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl flex items-center justify-center shrink-0">
                      <span className="text-2xl">{item.image}</span>
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">{item.name}</h3>
                          <p className="text-sm text-gray-600">{item.price}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(item.id)}
                          data-testid="remove-item"
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Dietary Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.dietary.slice(0, 2).map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center bg-gray-50 rounded-lg p-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              className="h-8 w-8 p-0 hover:bg-gray-200 rounded-md"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-10 text-center font-medium text-sm">
                              {item.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                              className="h-8 w-8 p-0 hover:bg-gray-200 rounded-md"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ₹{item.priceValue * item.quantity}
                          </div>
                          <div className="text-xs text-gray-500">
                            {item.quantity} × ₹{item.priceValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Order Summary Card */}
              {cart.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4 mt-6">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Order Summary</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({totalItems} items)</span>
                      <span className="font-medium">₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-green-200">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-primary-700" data-testid="cart-total">
                        ₹{totalPrice}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Estimated delivery: {estimatedTime + 5}-{estimatedTime + 10} minutes
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {cart.length > 0 && (
          <div className="border-t bg-white p-4 space-y-3 shadow-2xl">
            {/* Delivery Info */}
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span>Free delivery for orders above ₹50</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onCheckout}
                data-testid="checkout-button"
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg shadow-primary-500/25"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Proceed to Checkout
              </Button>

              <div className="flex gap-2">
                <Button
                  onClick={onClearCart}
                  data-testid="clear-cart"
                  variant="outline"
                  className="flex-1 h-10 text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Clear Cart
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1 h-10 text-gray-700 border-gray-300 hover:bg-gray-50"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
