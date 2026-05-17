import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Theme = 'light' | 'dark' | 'system';
export type Language = 'en' | 'kn' | 'hi' | 'ta';

export interface UIState {
  theme: Theme;
  language: Language;
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: UIState = {
  theme: 'light',
  language: 'en',
  sidebarOpen: true,
  loading: false,
  error: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
    },
    toggleSidebar: state => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { setTheme, setLanguage, toggleSidebar, setLoading, setError } = uiSlice.actions;

export default uiSlice.reducer;
