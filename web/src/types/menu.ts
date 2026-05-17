/**
 * Menu System TypeScript Interfaces
 * Aligned with backend Lambda functions and Prisma schema
 */

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl?: string | null;
  availability: 'available' | 'unavailable' | 'limited';
  preparationTime: number; // in minutes
  servingSize: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  spiceLevel: 'mild' | 'medium' | 'hot' | 'none';
  rating?: number;
  reviewCount?: number;
  popularity: number;
  schoolId?: string;
  vendorId?: string;
  nutritionalInfo?: NutritionalInfo;
  allergens?: string[];
  ingredients?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NutritionalInfo {
  calories: number;
  protein: number; // in grams
  carbohydrates: number; // in grams
  fat: number; // in grams
  fiber: number; // in grams
  sugar: number; // in grams
  sodium: number; // in mg
  vitamins?: Record<string, number>;
  minerals?: Record<string, number>;
}

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  icon?: string;
  itemCount: number;
}

export interface MenuFilters {
  category?: string;
  dietary?: ('vegetarian' | 'vegan' | 'glutenFree' | 'dairyFree' | 'nutFree')[];
  spiceLevel?: ('mild' | 'medium' | 'hot' | 'none')[];
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: ('available' | 'unavailable' | 'limited')[];
  searchQuery?: string;
  schoolId?: string;
  sortBy?: 'name' | 'price' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface MenuListResponse {
  items: MenuItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  categories: MenuCategory[];
}

export interface MenuItemDetailsResponse extends MenuItem {
  similarItems?: MenuItem[];
  reviews?: MenuItemReview[];
  availabilitySchedule?: MenuAvailabilitySchedule;
}

export interface MenuItemReview {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export interface MenuAvailabilitySchedule {
  daysOfWeek: string[]; // ['monday', 'tuesday', ...]
  timeSlots: {
    start: string; // '08:00'
    end: string; // '14:00'
  }[];
}

// Menu search interfaces
export interface MenuSearchParams {
  query: string;
  filters?: MenuFilters;
  limit?: number;
  page?: number;
}

export interface MenuSearchResponse {
  results: MenuItem[];
  suggestions: string[];
  facets: {
    categories: { name: string; count: number }[];
    dietary: { type: string; count: number }[];
    priceRanges: { range: string; count: number }[];
  };
  totalResults: number;
}
