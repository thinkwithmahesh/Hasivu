import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusPillProps {
  status: OrderStatus;
  animateChange?: boolean;
  className?: string;
}

export function OrderStatusPill({
  status,
  animateChange = true,
  className = '',
}: OrderStatusPillProps) {
  const shouldReduceMotion = useReducedMotion();

  const statusConfig: Record<
    OrderStatus,
    { label: string; colorClass: string; icon: React.ReactNode }
  > = {
    pending: {
      label: 'Pending',
      colorClass: 'bg-pm-neutral-200 text-pm-neutral-800',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    preparing: {
      label: 'Preparing',
      colorClass: 'bg-amber-100 text-amber-800',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    ready: {
      label: 'Ready for Pickup',
      colorClass: 'bg-green-100 text-green-800',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      colorClass: 'bg-[var(--hasivu-primary)]/10 text-[var(--hasivu-primary-dark)]',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    delivered: {
      label: 'Delivered',
      colorClass: 'bg-pm-semantic-success text-pm-text-inverse',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    cancelled: {
      label: 'Cancelled',
      colorClass: 'bg-pm-semantic-danger text-pm-text-inverse',
      icon: (
        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      layout={animateChange && !shouldReduceMotion}
      initial={animateChange && !shouldReduceMotion ? { scale: 0.9, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center px-3 py-1 rounded-pill font-ui font-bold text-[12px] uppercase tracking-wide shadow-sm ${config.colorClass} ${className}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </motion.div>
  );
}
