/**
 * Meal Ordering System - Type Definitions
 * Comprehensive type system for HASIVU school meal ordering interface
 */

// Define types locally
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietaryPreference = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'jain';
export type SpiceLevel = 'mild' | 'medium' | 'spicy' | 'very-spicy';

// Core meal item structure
export interface MealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: MealType;
  imageUrl: string;
  nutritionalInfo: NutritionalInfo;
  vendor: VendorInfo;
  availability: {
    isAvailable: boolean;
    startDate?: Date;
    endDate?: Date;
    maxQuantity?: number;
  };
  rating: number;
  totalRatings?: number;
  preparationTime: number;
  servingSize?: string;
  gradeAppropriate?: number[];
  tags: string[];
  dietaryType: DietaryPreference;
  spiceLevel: SpiceLevel;
  isAvailable: boolean;
  isGlutenFree?: boolean;
  isDiabeticFriendly?: boolean;
  isJainFood?: boolean;
  schoolApprovalRequired?: boolean;
  maxQuantityPerStudent: number;
  allergens: string[];
  availableFrom?: string;
  availableTo?: string;
  lastOrderTime?: string;
}

// Nutritional information structure
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs?: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium: number;
  allergens?: string[];
  dietaryTags?: string[];
  ingredients?: string[];
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
  location?: string;
  contactNumber?: string;
  hygieneCertification?: boolean;
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
  orderId: string;
  studentId: string;
  items: OrderItem[];
  totalAmount: number;
  total: number;
  orderDate: Date;
  deliveryDate: Date;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  specialRequests?: string;
  pickupTime?: string;
}

// Order history item (alias for MealOrder)
export type OrderHistoryItem = MealOrder;

// RFID pickup information
export interface RFIDPickupInfo {
  orderId: string;
  pickupCode: string;
  pickupTime: string;
  pickupLocation: string;
  status: 'ready' | 'picked-up' | 'cancelled';
}

// Order summary type
export type OrderSummary = {
  totalOrders: number;
  totalAmount: number;
  pendingOrders: number;
  completedOrders: number;
};

// Delivery slot type
export interface DeliverySlot {
  id: string;
  mealType: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  currentOrders: number;
  maxOrders: number;
  deliveryLocation: string;
}

// Meal order form type
export interface MealOrderForm {
  deliveryDate: Date;
  pickupTime: string;
  paymentMethod: string;
  specialInstructions?: string;
  contactPhone: string;
  contactEmail: string;
}

// School meal config type
export interface SchoolMealConfig {
  schoolId: string;
  name: string;
  mealTypes: string[];
  dietaryOptions: string[];
  deliverySlots: DeliverySlot[];
  maxOrdersPerSlot: number;
  cutoffTime: string;
  supportedPaymentMethods: string[];
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
  mealType?: string; // breakfast, lunch, dinner, snack
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

// Student information for meal ordering
export interface StudentInfo {
  id: string;
  name: string;
  grade: number;
  section?: string;
  rfidCardId?: string;
  dietaryPreferences: string[];
  allergies: string[];
  walletBalance: number;
  parentApprovalRequired?: boolean;
  canOrderWithoutApproval?: boolean;
  maxDailySpend?: number;
  schoolId?: string;
  rollNumber?: string;
  hasActiveMealPlan?: boolean;
  mealPlanType?: string;
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
export interface CategoryTabsProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  student: {
    grade: number;
    dietaryPreferences: string[];
    allergies: string[];
    walletBalance: number;
    parentApprovalRequired?: boolean;
  };
}

// Extended MealCategory with filters
export interface MenuCategory extends MealCategory {
  gradeFilters?: number[];
  dietaryFilters?: string[];
}

export interface MealCardProps {
  meal: MealItem;
  student: StudentInfo;
  onAddToCart: (meal: MealItem, quantity: number) => void;
  onViewDetails: (mealId: string) => void;
  isInCart: boolean;
  cartQuantity?: number;
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
