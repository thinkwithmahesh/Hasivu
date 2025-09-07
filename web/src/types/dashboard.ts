 * HASIVU Platform - Dashboard Types
 * TypeScript interfaces for parent dashboard components;
import { UserPreferences } from './auth';
  // Child profile interface
  createdAt: string;
  updatedAt: string;
  // Order interface with extended details
  rating?: number;
  review?: string;
  nutritionInfo?: NutritionInfo;
  createdAt: string;
  updatedAt: string;
  // Nutrition information
  // Payment method interface
  createdAt: string;
  // Subscription interface
  createdAt: string;
  updatedAt: string;
  // Notification interface
  // Analytics data
>;
  monthlySpending: Array<{}
  }>;
  nutritionSummary
    }>;
  deliveryStats: {}
  // Dashboard state interface
  // Filter and sorting options
  childId?: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery?: string;
  // Form interfaces for child management
export interface UpdateChildForm extends Partial<CreateChildForm> {}
  // Quick action types
export type QuickAction;
  | 'reorder'
  | 'cancel_order'
  | 'modify_order'
  | 'track_order'
  | 'add_child'
  | 'view_nutrition'
  | 'update_payment'
  | 'pause_subscription';
  // Dashboard widget types
  position: { x: number; y: number };
  isVisible: boolean;
  data?: any;
  // Real-time updates
  // Export all interfaces for easy importing
  // (Interfaces are already exported individually above)