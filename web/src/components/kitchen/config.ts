/**
 * Order Workflow Configuration
 * Configuration constants for the kitchen order workflow
 */

import { Clock, ChefHat, CheckCircle, Star } from 'lucide-react';

import { WorkflowColumn } from './types';

// Workflow columns configuration
export const workflowColumns: WorkflowColumn[] = [
  {
    id: 'pending',
    title: 'Pending Orders',
    icon: Clock,
    color: 'yellow',
    description: 'Orders waiting to be prepared',
  },
  {
    id: 'preparing',
    title: 'In Progress',
    icon: ChefHat,
    color: 'blue',
    description: 'Orders currently being prepared',
  },
  {
    id: 'ready',
    title: 'Ready for Pickup',
    icon: CheckCircle,
    color: 'green',
    description: 'Orders ready for collection',
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: Star,
    color: 'gray',
    description: 'Successfully delivered orders',
  },
];
