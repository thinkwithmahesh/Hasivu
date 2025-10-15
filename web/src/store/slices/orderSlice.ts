/**
 * HASIVU Platform - Order Management Redux Slice
 * Production-ready order management with API integration
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

// Order interface
export interface Order {
  id: string;
  userId: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  totalAmount: number;
  deliveryType: 'pickup' | 'delivery';
  deliveryTime?: string;
  paymentMethod: 'razorpay' | 'wallet' | 'cash';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

// Order state interface
export interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  activeOrders: Order[];
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// Async thunks
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getOrders();
      if (response.success) {
        return response.data || [];
      } else {
        return rejectWithValue(response.error || 'Failed to fetch orders');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch orders');
    }
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData: any, { rejectWithValue }) => {
    try {
      const response = await apiClient.createOrder(orderData);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.error || 'Failed to create order');
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create order');
    }
  }
);

// Initial state
const initialState: OrderState = {
  orders: [],
  currentOrder: null,
  activeOrders: [],
  isLoading: false,
  isCreating: false,
  error: null,
  lastUpdated: null,
};

// Order slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
    setCurrentOrder: (state, action: PayloadAction<Order | null>) => {
      state.currentOrder = action.payload;
    },
    updateOrderStatus: (
      state,
      action: PayloadAction<{ orderId: string; status: Order['status'] }>
    ) => {
      const { orderId, status } = action.payload;

      // Update in all orders
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].status = status;
      }

      // Update current order
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.status = status;
      }

      // Update active orders
      const activeIndex = state.activeOrders.findIndex(order => order.id === orderId);
      if (activeIndex !== -1) {
        state.activeOrders[activeIndex].status = status;
      }

      state.lastUpdated = new Date().toISOString();
    },
  },
  extraReducers: builder => {
    // Fetch orders
    builder
      .addCase(fetchOrders.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload;
        state.activeOrders = action.payload.filter(
          (order: Order) => !['delivered', 'cancelled'].includes(order.status)
        );
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create order
    builder
      .addCase(createOrder.pending, state => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.orders.unshift(action.payload);
        state.activeOrders.unshift(action.payload);
        state.currentOrder = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setCurrentOrder, updateOrderStatus } = orderSlice.actions;

// Selectors
export const selectOrders = (state: any) => state.orders.orders;
export const selectCurrentOrder = (state: any) => state.orders.currentOrder;
export const selectActiveOrders = (state: any) => state.orders.activeOrders;
export const selectOrdersLoading = (state: any) => state.orders.isLoading;
export const selectIsCreatingOrder = (state: any) => state.orders.isCreating;
export const selectOrdersError = (state: any) => state.orders.error;

export default orderSlice.reducer;
