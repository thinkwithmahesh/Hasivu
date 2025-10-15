/**
 * HASIVU Platform - Dashboard Types
 * TypeScript interfaces for parent dashboard components
 */

// Child profile interface
export interface ChildProfile {
  createdAt: string;
  updatedAt: string;
}

// Order interface with extended details
export interface Order {
  rating?: number;
  review?: string;
  nutritionInfo?: NutritionInfo;
  createdAt: string;
  updatedAt: string;
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
