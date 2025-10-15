/**
 * Kitchen Component Utilities
 * Shared utility functions for kitchen components
 */

import { WorkflowOrder } from './types';

/**
 * Maps API order data to WorkflowOrder format with safe defaults
 */
export function mapApiOrdersToWorkflowOrders(apiOrders: any[]): WorkflowOrder[] {
  return apiOrders.map((o: any) => ({
    id: o.id || o._id || String(o.orderNumber || Math.random()),
    orderNumber: o.orderNumber || `#${o.id || 'N/A'}`,
    studentName: o.student?.name || o.studentName || 'Student',
    studentId: o.student?.id || o.studentId || 'N/A',
    studentAvatar: o.student?.avatar || undefined,
    items: (o.items || []).map((it: any, idx: number) => ({
      id: it.id || `${o.id}-item-${idx}`,
      name: it.name || 'Item',
      quantity: it.quantity || 1,
      category: it.category || 'General',
      preparationTime: it.preparationTime || 5,
      isCompleted: Boolean(it.isCompleted),
    })),
    status: (o.status || 'pending') as WorkflowOrder['status'],
    priority: (o.priority || 'medium') as WorkflowOrder['priority'],
    orderTime: o.orderTime || o.createdAt || new Date().toISOString(),
    estimatedTime: o.estimatedTime || 15,
    actualTime: o.actualTime,
    assignedStaff: o.assignedStaff
      ? {
          id: o.assignedStaff.id || o.assignedStaff._id || 'staff',
          name: o.assignedStaff.name || 'Staff',
          role: o.assignedStaff.role || 'chef',
          avatar: o.assignedStaff.avatar || '',
          efficiency: o.assignedStaff.efficiency || 0,
        }
      : undefined,
    location: o.location || 'Kitchen',
    specialInstructions: o.specialInstructions || '',
    totalAmount: o.totalAmount || 0,
    progress: o.progress ?? (o.status === 'completed' ? 100 : o.status === 'preparing' ? 50 : 0),
    allergens: o.allergens || [],
    customerRating: o.customerRating,
    notes: o.notes || [],
  }));
}

/**
 * Get status color class for UI components
 */
export function getStatusColor(status: WorkflowOrder['status']): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    preparing: 'bg-blue-100 text-blue-800 border-blue-200',
    ready: 'bg-green-100 text-green-800 border-green-200',
    completed: 'bg-gray-100 text-gray-800 border-gray-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[status] || colors.pending;
}

/**
 * Get priority color class for UI components
 */
export function getPriorityColor(priority: WorkflowOrder['priority']): string {
  const colors = {
    low: 'bg-gray-400',
    medium: 'bg-yellow-400',
    high: 'bg-orange-400',
    urgent: 'bg-red-400',
  };
  return colors[priority] || colors.medium;
}

/**
 * Calculate time elapsed since order was placed
 */
export function getTimeElapsed(orderTime: string): number {
  const orderDate = new Date(orderTime);
  const now = new Date();
  const diffMs = now.getTime() - orderDate.getTime();
  return Math.floor(diffMs / (1000 * 60)); // minutes
}
