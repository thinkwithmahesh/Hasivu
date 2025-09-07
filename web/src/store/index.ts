/**
 * HASIVU Platform - Redux Store Configuration
 * Centralized state management with Redux Toolkit and persistence
 * Production-ready configuration with error handling
 */
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Slice imports
import authSlice from './slices/authSlice';
import orderSlice from './slices/orderSlice';
import menuSlice from './slices/menuSlice';
import notificationSlice from './slices/notificationSlice';
import paymentSlice from './slices/paymentSlice';
import rfidSlice from './slices/rfidSlice';
import analyticsSlice from './slices/analyticsSlice';
import uiSlice from './slices/uiSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authSlice,
  order: orderSlice,
  menu: menuSlice,
  notification: notificationSlice,
  payment: paymentSlice,
  rfid: rfidSlice,
  analytics: analyticsSlice,
  ui: uiSlice,
});

// Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // Only persist auth and UI state
  blacklist: ['order', 'menu'], // Don't persist dynamic data
};

// Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store configuration
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Persistor
export const persistor = persistStore(store);

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;