'use client';

/**
 * HASIVU Platform - Shopping Cart Context
 *
 * FIXES: CRITICAL-010 - Shopping Cart Not Implemented
 * Features:
 * - Add/remove items
 * - Quantity management
 * - Cart persistence (localStorage)
 * - Cart total calculation
 * - Multi-day scheduling
 * - Recurring orders
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Cart item interface
export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  category: string;

  // Customization options
  customizations?: {
    spiceLevel?: number;
    excludeIngredients?: string[];
    addOns?: string[];
    specialInstructions?: string;
  };

  // Delivery information
  deliveryDate: string; // ISO date string
  deliveryTimeSlot: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  // Student information
  studentId?: string;
  studentName?: string;
}

// Cart summary interface
export interface CartSummary {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  itemCount: number;
  uniqueItemCount: number;
}

// Cart context interface
interface CartContextType {
  items: CartItem[];
  summary: CartSummary;

  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateCustomizations: (itemId: string, customizations: CartItem['customizations']) => void;
  clearCart: () => void;

  // Utilities
  getItemCount: () => number;
  hasItem: (menuItemId: string, deliveryDate: string) => boolean;
  getItemsByDate: (date: string) => CartItem[];
  getItemsByStudent: (studentId: string) => CartItem[];

  // Advanced features
  duplicateForDate: (itemId: string, newDate: string) => void;
  setRecurringOrder: (itemId: string, dates: string[]) => void;

  // Persistence
  saveCart: () => void;
  loadCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'hasivu_shopping_cart';

interface CartProviderProps {
  children: React.ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCart();
  }, [items]);

  /**
   * Generate unique ID for cart item
   */
  const generateId = (): string => {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Calculate cart summary
   */
  const calculateSummary = useCallback((cartItems: CartItem[]): CartSummary => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Calculate tax (18% GST in India)
    const tax = subtotal * 0.18;

    // TODO: Calculate discount based on coupon code
    const discount = 0;

    const total = subtotal + tax - discount;

    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItemCount = cartItems.length;

    return {
      subtotal,
      tax,
      discount,
      total,
      itemCount,
      uniqueItemCount,
    };
  }, []);

  /**
   * Get current cart summary
   */
  const summary = calculateSummary(items);

  /**
   * Add item to cart
   */
  const addItem = useCallback(
    (itemData: Omit<CartItem, 'id'>) => {
      // Check if similar item already exists (same menu item, date, student)
      const existingItem = items.find(
        item =>
          item.menuItemId === itemData.menuItemId &&
          item.deliveryDate === itemData.deliveryDate &&
          item.deliveryTimeSlot === itemData.deliveryTimeSlot &&
          item.studentId === itemData.studentId
      );

      if (existingItem) {
        // Update quantity of existing item
        updateQuantity(existingItem.id, existingItem.quantity + itemData.quantity);
        toast.success('Cart updated');
      } else {
        // Add new item
        const newItem: CartItem = {
          ...itemData,
          id: generateId(),
        };

        setItems(prev => [...prev, newItem]);
        toast.success('Added to cart');
      }
    },
    [items]
  );

  /**
   * Remove item from cart
   */
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Removed from cart');
  }, []);

  /**
   * Update item quantity
   */
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    if (quantity > 10) {
      toast.error('Maximum quantity is 10');
      return;
    }

    setItems(prev => prev.map(item => (item.id === itemId ? { ...item, quantity } : item)));
  }, []);

  /**
   * Update item customizations
   */
  const updateCustomizations = useCallback(
    (itemId: string, customizations: CartItem['customizations']) => {
      setItems(prev => prev.map(item => (item.id === itemId ? { ...item, customizations } : item)));
      toast.success('Customizations updated');
    },
    []
  );

  /**
   * Clear entire cart
   */
  const clearCart = useCallback(() => {
    setItems([]);
    toast.success('Cart cleared');
  }, []);

  /**
   * Get total item count
   */
  const getItemCount = useCallback(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  }, [items]);

  /**
   * Check if item exists in cart
   */
  const hasItem = useCallback(
    (menuItemId: string, deliveryDate: string) => {
      return items.some(
        item => item.menuItemId === menuItemId && item.deliveryDate === deliveryDate
      );
    },
    [items]
  );

  /**
   * Get items for specific date
   */
  const getItemsByDate = useCallback(
    (date: string) => {
      return items.filter(item => item.deliveryDate === date);
    },
    [items]
  );

  /**
   * Get items for specific student
   */
  const getItemsByStudent = useCallback(
    (studentId: string) => {
      return items.filter(item => item.studentId === studentId);
    },
    [items]
  );

  /**
   * Duplicate item for different date
   */
  const duplicateForDate = useCallback(
    (itemId: string, newDate: string) => {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }

      const duplicatedItem: Omit<CartItem, 'id'> = {
        ...item,
        deliveryDate: newDate,
      };

      addItem(duplicatedItem);
    },
    [items, addItem]
  );

  /**
   * Set recurring order for multiple dates
   */
  const setRecurringOrder = useCallback(
    (itemId: string, dates: string[]) => {
      const item = items.find(i => i.id === itemId);
      if (!item) {
        toast.error('Item not found');
        return;
      }

      dates.forEach(date => {
        if (date !== item.deliveryDate) {
          duplicateForDate(itemId, date);
        }
      });

      toast.success(`Recurring order set for ${dates.length} days`);
    },
    [items, duplicateForDate]
  );

  /**
   * Save cart to localStorage
   */
  const saveCart = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGEKEY, JSON.stringify(items));
      }
    } catch (error) {
      // Error handled silently
    }
  }, [items]);

  /**
   * Load cart from localStorage
   */
  const loadCart = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedCart = localStorage.getItem(STORAGE_KEY);
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setItems(parsedCart);
        }
      }
    } catch (error) {
      // Error handled silently
    }
  }, []);

  const value: CartContextType = {
    items,
    summary,
    addItem,
    removeItem,
    updateQuantity,
    updateCustomizations,
    clearCart,
    getItemCount,
    hasItem,
    getItemsByDate,
    getItemsByStudent,
    duplicateForDate,
    setRecurringOrder,
    saveCart,
    loadCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to use cart context
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

/**
 * Cart badge component for showing item count
 */
export function CartBadge({ className = '' }: { className?: string }) {
  const { getItemCount } = useCart();
  const count = getItemCount();

  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full ${className}`}
    >
      {count}
    </span>
  );
}

export default CartContext;
