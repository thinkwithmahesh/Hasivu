/**
 * Cart Context Provider
 * Global state management for shopping cart
 * Persists cart data to localStorage
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Cart, CartItem, CartContextType, CartStorageData } from '@/types/cart';
import { MenuItem } from '@/types/menu';

const CART_STORAGE_KEY = 'hasivu_shopping_cart';
const CART_EXPIRY_HOURS = 24;

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Initial empty cart
const getEmptyCart = (): Cart => ({
  items: [],
  subtotal: 0,
  tax: 0,
  taxRate: 0.05, // 5% tax
  deliveryFee: 0,
  discount: 0,
  total: 0,
  itemCount: 0,
  lastUpdated: new Date(),
});

// Calculate cart totals
const calculateCartTotals = (items: CartItem[], taxRate: number = 0.05): Cart => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const tax = subtotal * taxRate;
  const deliveryFee = subtotal > 0 ? 50 : 0; // ₹50 delivery fee
  const discount = 0; // Can be calculated based on promo codes
  const total = subtotal + tax + deliveryFee - discount;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    subtotal,
    tax,
    taxRate,
    deliveryFee,
    discount,
    total,
    itemCount,
    lastUpdated: new Date(),
  };
};

// Cart Provider Component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(getEmptyCart());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCartFromStorage();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveCartToStorage(cart);
    }
  }, [cart, isLoading]);

  const loadCartFromStorage = () => {
    try {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      const storedData = localStorage.getItem(CART_STORAGE_KEY);
      if (!storedData) {
        setIsLoading(false);
        return;
      }

      const cartData: CartStorageData = JSON.parse(storedData);

      // Check if cart has expired
      const expiresAt = new Date(cartData.expiresAt);
      if (expiresAt < new Date()) {
        localStorage.removeItem(CART_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      // Restore cart with recalculated totals
      const restoredItems = cartData.items.map((item) => ({
        ...item,
        deliveryDate: new Date(item.deliveryDate),
        addedAt: new Date(item.addedAt),
      }));

      const restoredCart = calculateCartTotals(restoredItems);
      setCart(restoredCart);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading cart from storage:', error);
      setError('Failed to load cart');
      setIsLoading(false);
    }
  };

  const saveCartToStorage = (cartToSave: Cart) => {
    try {
      if (typeof window === 'undefined') return;

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + CART_EXPIRY_HOURS);

      const storageData: CartStorageData = {
        items: cartToSave.items,
        expiresAt: expiresAt.toISOString(),
      };

      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(storageData));
    } catch (error) {
      console.error('Error saving cart to storage:', error);
    }
  };

  const addItem = useCallback(
    (item: Omit<CartItem, 'id' | 'totalPrice' | 'addedAt'>) => {
      try {
        setError(null);

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(
          (cartItem) =>
            cartItem.menuItemId === item.menuItemId &&
            cartItem.deliveryDate.toDateString() === item.deliveryDate.toDateString()
        );

        let updatedItems: CartItem[];

        if (existingItemIndex >= 0) {
          // Update quantity of existing item
          updatedItems = [...cart.items];
          updatedItems[existingItemIndex] = {
            ...updatedItems[existingItemIndex],
            quantity: updatedItems[existingItemIndex].quantity + item.quantity,
            totalPrice:
              updatedItems[existingItemIndex].unitPrice *
              (updatedItems[existingItemIndex].quantity + item.quantity),
          };
        } else {
          // Add new item
          const newItem: CartItem = {
            id: uuidv4(),
            ...item,
            totalPrice: item.unitPrice * item.quantity,
            addedAt: new Date(),
          };
          updatedItems = [...cart.items, newItem];
        }

        const updatedCart = calculateCartTotals(updatedItems);
        setCart(updatedCart);
      } catch (err) {
        console.error('Error adding item to cart:', err);
        setError('Failed to add item to cart');
      }
    },
    [cart.items]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      try {
        setError(null);
        const updatedItems = cart.items.filter((item) => item.id !== itemId);
        const updatedCart = calculateCartTotals(updatedItems);
        setCart(updatedCart);
      } catch (err) {
        console.error('Error removing item from cart:', err);
        setError('Failed to remove item from cart');
      }
    },
    [cart.items]
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      try {
        setError(null);

        if (quantity <= 0) {
          removeItem(itemId);
          return;
        }

        const updatedItems = cart.items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                totalPrice: item.unitPrice * quantity,
              }
            : item
        );

        const updatedCart = calculateCartTotals(updatedItems);
        setCart(updatedCart);
      } catch (err) {
        console.error('Error updating quantity:', err);
        setError('Failed to update quantity');
      }
    },
    [cart.items, removeItem]
  );

  const updateDeliveryDate = useCallback(
    (itemId: string, date: Date) => {
      try {
        setError(null);
        const updatedItems = cart.items.map((item) =>
          item.id === itemId ? { ...item, deliveryDate: date } : item
        );

        const updatedCart = calculateCartTotals(updatedItems);
        setCart(updatedCart);
      } catch (err) {
        console.error('Error updating delivery date:', err);
        setError('Failed to update delivery date');
      }
    },
    [cart.items]
  );

  const updateSpecialInstructions = useCallback(
    (itemId: string, instructions: string) => {
      try {
        setError(null);
        const updatedItems = cart.items.map((item) =>
          item.id === itemId ? { ...item, specialInstructions: instructions } : item
        );

        const updatedCart = calculateCartTotals(updatedItems);
        setCart(updatedCart);
      } catch (err) {
        console.error('Error updating special instructions:', err);
        setError('Failed to update special instructions');
      }
    },
    [cart.items]
  );

  const clearCart = useCallback(() => {
    try {
      setError(null);
      setCart(getEmptyCart());
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    }
  }, []);

  const value: CartContextType = {
    cart,
    addItem,
    removeItem,
    updateQuantity,
    updateDeliveryDate,
    updateSpecialInstructions,
    clearCart,
    isLoading,
    error,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
