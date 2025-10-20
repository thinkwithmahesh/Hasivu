/**
 * Shopping Cart TypeScript Interfaces
 * For parent ordering journey
 */

import { MenuItem } from './menu';

export interface CartItem {
  id: string; // Client-generated UUID
  menuItemId: string;
  menuItem: MenuItem; // Full menu item details for display
  quantity: number;
  deliveryDate: Date;
  specialInstructions?: string;
  customizations?: Record<string, any>;
  allergyInfo?: string;
  unitPrice: number;
  totalPrice: number; // quantity * unitPrice
  addedAt: Date;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  tax: number;
  taxRate: number; // e.g., 0.05 for 5%
  deliveryFee: number;
  discount: number;
  total: number;
  itemCount: number;
  lastUpdated: Date;
}

export interface CartContextType {
  cart: Cart;
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice' | 'addedAt'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateDeliveryDate: (itemId: string, date: Date) => void;
  updateSpecialInstructions: (itemId: string, instructions: string) => void;
  clearCart: () => void;
  isLoading: boolean;
  error: string | null;
}

export interface CartItemUpdateRequest {
  itemId: string;
  updates: Partial<Pick<CartItem, 'quantity' | 'deliveryDate' | 'specialInstructions' | 'customizations' | 'allergyInfo'>>;
}

// Cart persistence
export interface CartStorageData {
  items: CartItem[];
  expiresAt: string;
}
