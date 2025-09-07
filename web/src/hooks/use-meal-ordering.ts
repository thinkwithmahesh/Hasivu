 * HASIVU Platform - Meal Ordering Integration Hook
 * Complete meal ordering system with cart management, real-time updates, and payment integration;
import { useState, useCallback, useEffect, useReducer, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { api, MealItem } from '../lib/api-client';
import { useAuth } from '../contexts/auth-context';
import { useOrderTracking } from './use-realtime';
import { usePaymentFlow } from './u se-payment';
interface CartItem extends MealItem {}
  priceRange?: { min: number; max: number };
  vendor?: string;
  available?: boolean;
  search?: string;
// Cart reducer
type CartAction;
  | { type: 'ADD_ITEM'; payload: { item: MealItem; quantity: number; notes?: string; customizations?: any } }
  | { type: 'UPDATE_QUANTITY'; payload: { itemId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string } }
  | { type: 'UPDATE_NOTES'; payload: { itemId: string; notes: string } }
  | { type: 'UPDATE_CUSTOMIZATIONS'; payload: { itemId: string; customizations: any } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'LOAD_CART'; payload: CartItem[] };
function cartReducer(state: CartState, action: CartAction): CartState {}
      const { item, quantity, notes, customizations } = action.payload;
      const existingItemIndex = state.items.findIndex(cartItem;
        cartItem.id === item.id;
        JSON.stringify(cartItem.customizations) === JSON.stringify(customizations)
      let newItems: CartItem[];
      if (existingItemIndex >= 0) {}
            : cartItem
        newItems = [...state.items, cartItem];
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return {}
    case 'UPDATE_QUANTITY': {}
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {}
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { itemId } });
      const newItems = state.items.map(item;
        item.id === itemId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return {}
    case 'REMOVE_ITEM': {}
      const { itemId } = action.payload;
      const newItems = state.items.filter(item => item.id !== itemId);
      const total = newItems.reduce((sum, item) => sum + item.subtotal, 0);
      const itemCount = newItems.reduce((sum, item) => sum + item.quantity, 0);
      return {}
    case 'UPDATE_NOTES': {}
      const { itemId, notes } = action.payload;
      const newItems = state.items.map(item;
        item.id === itemId ? { ...item, notes } : item
      return {}
    case 'UPDATE_CUSTOMIZATIONS': {}
      const { itemId, customizations } = action.payload;
      const newItems = state.items.map(item;
        item.id === itemId ? { ...item, customizations } : item
      return {}
    case 'CLEAR_CART'
    case 'SET_LOADING'
    case 'LOAD_CART'
    default: undefined
      return state;
// TODO: Refactor this function - it may be too long
  const { user, hasWalletBalance } = useAuth();
  const [cart, dispatch] = useReducer(cartReducer, {}
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [filters, setFilters] = useState<MealFilters>({});
  const [orderPreferences, setOrderPreferences] = useState<OrderPreferences>({}
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<string | null>(null);
  const orderTracking = useOrderTracking(currentOrder || undefined);
  const paymentFlow = usePaymentFlow(currentOrder || undefined);
  // Load cart from localStorage on mount
  useEffect((
        dispatch({ type: 'LOAD_CART', payload: cartData.items || [] });
  }, []);
  // Save cart to localStorage whenever it changes
  useEffect((
  }, [cart]);
  // Load meals and categories
  const loadMeals = useCallback(async (newFilters?: MealFilters
      const filterParams = { ...filters, ...newFilters };
      const [mealsResponse, categoriesResponse, vendorsResponse] = await Promise.all([]
]);
      if (mealsResponse.success) {}
      if (categoriesResponse.success) {}
      if (vendorsResponse.success) {}
  }, [filters]);
  // Search meals
  const searchMeals = useCallback(async (query: string
  }, [filters]);
  // Get meal recommendations
  const loadRecommendations = useCallback(async (
    return [];
  }, [user?.id]);
  // Cart management
  const addToCart = useCallback((item: MealItem, quantity: number = 1, notes?: string, customizations?: any
    dispatch({}
      payload: { item, quantity, notes, customizations }
    toast.success(`${item.name} added to cart``
            description: `Food order #${orderId.slice(-8)}``
              name: `${user?.firstName} ${user?.lastName}``
              toast.error(`Payment failed: ${error.message}``