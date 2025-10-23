/**
 * HASIVU Platform - Dashboard Types
 * TypeScript interfaces for parent dashboard components
 */

// Child profile interface
export interface ChildProfile {
  createdAt: string;
  updatedAt: string;
}

// Child interface (alias for Student)
export interface Child {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  grade?: string;
  class: string;
  section: string;
  rollNumber?: string;
  avatar?: string;
  rfidCode?: string;
  isActive?: boolean;
  allergies?: string[];
}

// Order interface with extended details
export interface Order {
  id: string;
  studentId: string;
  childId?: string; // Alias for studentId in parent dashboard context
  studentName: string;
  class?: string;
  section?: string;
  mealType: string;
  items: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';
  orderDate: string;
  totalAmount: number;
  priority: string;
  rating?: number;
  review?: string;
  nutritionInfo?: NutritionInfo;
  createdAt?: string;
  updatedAt?: string;
}

// Nutrition information
export interface NutritionInfo {
  // Define nutrition fields
}

// Payment method interface
export interface PaymentMethod {
  createdAt: string;
}

// Subscription interface
export interface Subscription {
  createdAt: string;
  updatedAt: string;
}

// Notification interface
export interface Notification {
  // Define notification fields
}

// Dashboard Analytics interface
export interface DashboardAnalytics {
  totalOrders: number;
  averageOrderValue: number;
  totalSpent?: number;
  monthlySpending?: number;
}

// Analytics data
export interface AnalyticsData {
  monthlySpending: Array<Record<string, unknown>>;
  nutritionSummary: Record<string, unknown>;
  deliveryStats: Record<string, unknown>;
}

// Dashboard state interface
export interface DashboardState {
  // Filter and sorting options
  childId?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
}

// Form interfaces for child management
export interface CreateChildForm {
  // Define form fields
}

export interface UpdateChildForm extends Partial<CreateChildForm> {}

// Quick action types
export type _QuickAction =
  | 'reorder'
  | 'cancel_order'
  | 'modify_order'
  | 'track_order'
  | 'add_child'
  | 'view_nutrition'
  | 'update_payment'
  | 'pause_subscription';

// Dashboard widget types
export interface DashboardWidget {
  position: { x: number; y: number };
  isVisible: boolean;
  data?: any;
}

// Real-time updates
export interface RealTimeUpdate {
  // Define real-time update fields
}
