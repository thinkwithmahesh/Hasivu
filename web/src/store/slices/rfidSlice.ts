import { createSlice } from '@reduxjs/toolkit';

export interface RfidState {
  isConnected: boolean;
  error: string | null;
}

const initialState: RfidState = {
  isConnected: false,
  error: null,
};

const rfidSlice = createSlice({
  name: 'rfid',
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
  },
});

export const { setConnected } = rfidSlice.actions;
export default rfidSlice.reducer;
