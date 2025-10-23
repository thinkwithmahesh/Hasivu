import { createSlice, PayloadAction as PayloadAction } from '@reduxjs/toolkit';

export interface NotificationState {
  notifications: any[];
  unreadCount: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount++;
    },
  },
});

export const { addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
