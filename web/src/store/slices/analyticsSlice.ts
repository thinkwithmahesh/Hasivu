import { createSlice } from '@reduxjs/toolkit';

export interface AnalyticsState {
  data: any[];
  isLoading: boolean;
}

const initialState: AnalyticsState = {
  data: [],
  isLoading: false,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = analyticsSlice.actions;
export default analyticsSlice.reducer;
