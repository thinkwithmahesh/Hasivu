/**
 * Order Workflow Types
 * Type definitions for kitchen order workflow components
 */

// Enhanced Order interface for workflow
export interface WorkflowOrder {
  id: string;
  orderNumber: string;
  studentName: string;
  studentId: string;
  studentAvatar?: string;
  items: OrderItem[];
  status: 'pending' | 'preparing' | 'ready' | 'completed';
  priority: 'low' | 'medium' | 'high';
  orderTime: string;
  estimatedTime: number;
  actualTime?: number;
  assignedStaff?: StaffMember;
  location: string;
  specialInstructions?: string;
  totalAmount: number;
  progress: number; // 0-100
  allergens: string[];
  customerRating?: number;
  notes: string[];
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  category: string;
  preparationTime: number;
  isCompleted: boolean;
  image?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  efficiency: number;
}

// Workflow column configuration
export interface WorkflowColumn {
  id: string;
  title: string;
  icon: any; // Lucide icon component
  color: string;
  description: string;
}
