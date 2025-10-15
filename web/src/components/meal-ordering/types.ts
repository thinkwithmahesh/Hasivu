/**
 * Meal Ordering System - Type Definitions
 * Comprehensive type system for HASIVU school meal ordering interface
 */

// Core meal item structure
export interface MealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  nutritionalInfo: NutritionalInfo;
  vendor: VendorInfo;
  availability: {
    isAvailable: boolean;
    startDate?: Date;
    endDate?: Date;
    maxQuantity?: number;
  };
  rating?: number;
  preparationTime?: number;
  gradeAppropriate?: number[];
}

// Nutritional information structure
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  allergens: string[];
  dietaryTags: string[];
  ingredients: string[];
}

// Vendor information for tracking meal sources
export interface VendorInfo {
  id: string;
  name: string;
  rating: number;
  certifications: string[];
  contactInfo: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

// Order item with quantity and customization
export interface OrderItem {
  mealId: string;
  meal: MealItem;
  quantity: number;
  customizations?: {
    [key: string]: string | boolean;
  };
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

// Complete meal order structure
export interface MealOrder {
  id: string;
  studentId: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: Date;
  deliveryDate: Date;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialRequests?: string;
  pickupTime?: string;
}

// Meal category with filtering options
export interface MealCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  subcategories?: string[];
}

// Student meal preferences and restrictions
export interface StudentPreferences {
  studentId: string;
  dietaryRestrictions: string[];
  allergies: string[];
  favoriteCategories: string[];
  dislikedIngredients: string[];
  spiceLevel: 'none' | 'mild' | 'medium' | 'hot';
  portionSize: 'small' | 'regular' | 'large';
}

// Meal menu for a specific date
export interface DailyMenu {
  date: Date;
  meals: MealItem[];
  categories: MealCategory[];
  specialOffers: {
    id: string;
    title: string;
    description: string;
    discountPercent: number;
    applicableMeals: string[];
  }[];
}

// Shopping cart state
export interface ShoppingCart {
  items: OrderItem[];
  totalItems: number;
  subtotal: number;
  tax: number;
  total: number;
  estimatedDeliveryTime?: string;
}

// Meal ordering form data
export interface OrderFormData {
  deliveryDate: Date;
  pickupTime: string;
  paymentMethod: string;
  specialInstructions?: string;
  contactPhone: string;
  contactEmail: string;
}

// Filter options for meal search
export interface MealFilters {
  categories: string[];
  dietaryTags: string[];
  priceRange: {
    min: number;
    max: number;
  };
  allergenFree: string[];
  rating: number;
  preparationTime: number;
  isAvailable: boolean;
  gradeAppropriate: number;
}

// Search results structure
export interface MealSearchResults {
  meals: MealItem[];
  totalCount: number;
  filters: {
    categories: Array<{ name: string; count: number }>;
    dietaryTypes: Array<{ name: string; count: number }>;
    priceRanges: Array<{ range: string; count: number }>;
  };
  searchQuery?: string;
  appliedFilters: MealFilters;
}

// Component prop types
export interface MealCardProps {
  meal: MealItem;
  onAddToCart: (meal: MealItem, quantity: number) => void;
  onViewDetails: (mealId: string) => void;
  isInCart: boolean;
}

export interface CartItemProps {
  item: OrderItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export interface OrderSummaryProps {
  cart: ShoppingCart;
  onPlaceOrder: (formData: OrderFormData) => void;
  isLoading: boolean;
}

// API response types
export interface MealApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export type _GetMenuResponse = MealApiResponse<DailyMenu>;
export type _SearchMealsResponse = MealApiResponse<MealSearchResults>;
export type _CreateOrderResponse = MealApiResponse<MealOrder>;
export type _GetOrdersResponse = MealApiResponse<MealOrder[]>;
