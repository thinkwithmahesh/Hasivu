/**
 * HASIVU Menu System - Standardized Type Definitions
 * Unified interfaces to ensure consistency across frontend, API, and Redux
 */

// Nutritional information for menu items
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

// Availability schedule for menu items
export interface MenuItemAvailability {
  days: string[];
  timeSlots: string[];
}

// School-specific metadata
export interface SchoolSpecificInfo {
  ageGroup: string[];
  popularity: number;
  lastOrdered?: string;
}

// Main MenuItem interface - matches API structure
export interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string; // Display price with currency symbol (e.g., "₹45")
  rating: number;
  prepTime: string;
  dietary: string[];
  image: string;
  priceValue: number; // Numeric value for calculations (e.g., 45)
  nutritionalInfo?: NutritionalInfo;
  ingredients?: string[];
  allergens?: string[];
  availability?: MenuItemAvailability;
  schoolSpecific?: SchoolSpecificInfo;
}

// Cart item extends MenuItem with quantity
export interface CartItem extends MenuItem {
  quantity: number;
}

// API Response wrapper
export interface MenuResponse {
  status: 'success' | 'error';
  data?: MenuItem[];
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    categories: string[];
  };
}

// Search filters for advanced menu search
export interface MenuSearchFilters {
  query?: string;
  categories?: string[];
  dietary?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  ratingRange?: {
    min: number;
    max: number;
  };
  prepTimeMax?: number;
  ageGroups?: string[];
  allergenFree?: string[];
  availableDay?: string;
  availableTimeSlot?: string;
  nutritionalRequirements?: {
    maxCalories?: number;
    minProtein?: number;
    maxFat?: number;
    maxSugar?: number;
  };
  sortBy?: 'name' | 'price' | 'rating' | 'popularity' | 'prepTime' | 'calories';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Search response with metadata
export interface MenuSearchResponse {
  status: 'success' | 'error';
  data?: MenuItem[];
  message?: string;
  meta?: {
    total: number;
    filtered: number;
    filters: MenuSearchFilters;
    suggestions?: string[];
    popularSearches?: string[];
  };
}

// Form data for creating/updating menu items
export interface MenuItemFormData {
  name: string;
  description: string;
  category: string;
  price: string;
  prepTime: string;
  dietary: string[];
  image?: string;
  nutritionalInfo?: Partial<NutritionalInfo>;
  ingredients?: string[];
  allergens?: string[];
  availability?: Partial<MenuItemAvailability>;
  schoolSpecific?: Partial<SchoolSpecificInfo>;
}

// Redux state structure
export interface MenuState {
  items: MenuItem[];
  categories: string[];
  searchResults: MenuItem[];
  currentFilters: MenuSearchFilters | null;
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;
  searchError: string | null;
  lastUpdated: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
