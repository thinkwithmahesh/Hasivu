/**
 * HASIVU Platform - Menu Management Redux Slice
 */
import { createSlice, createAsyncThunk, PayloadAction as _PayloadAction } from '@reduxjs/toolkit';
import apiClient from '@/lib/api-client';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

export interface MenuState {
  items: MenuItem[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
}

export const fetchMenuItems = createAsyncThunk(
  'menu/fetchMenuItems',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.getMenuItems();
      return response.success ? response.data || [] : [];
    } catch (error) {
      return rejectWithValue('Failed to fetch menu items');
    }
  }
);

const initialState: MenuState = {
  items: [],
  categories: [],
  isLoading: false,
  error: null,
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchMenuItems.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        state.categories = [...new Set(action.payload.map((item: MenuItem) => item.category))];
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = menuSlice.actions;
export default menuSlice.reducer;
