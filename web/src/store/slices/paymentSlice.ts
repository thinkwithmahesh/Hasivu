import { createSlice } from '@reduxjs/toolkit';

export interface PaymentState {
  isProcessing: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  isProcessing: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
});

export const { clearError } = paymentSlice.actions;
export default paymentSlice.reducer;
