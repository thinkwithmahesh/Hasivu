'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Package,
  ShoppingCart,
  Bell,
  FileText,
  Search,
  Calendar,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';

// ─── Preset illustrations ────────────────────────────────────────────
const presets = {
  orders: { icon: Package, title: 'No orders yet', description: 'Your order history will appear here once you place your first order.' },
  cart: { icon: ShoppingCart, title: 'Your cart is empty', description: 'Browse the menu to add delicious meals for your child.' },
  notifications: { icon: Bell, title: 'All caught up!', description: "You don't have any notifications right now." },
  documents: { icon: FileText, title: 'No documents', description: 'Documents and reports will appear here.' },
  search: { icon: Search, title: 'No results found', description: 'Try adjusting your search or filter criteria.' },
  schedule: { icon: Calendar, title: 'No meals scheduled', description: 'Plan meals for the week using the meal scheduler.' },
  students: { icon: Users, title: 'No students found', description: 'Students will appear here once enrolled.' },
  menu: { icon: UtensilsCrossed, title: 'No menu items', description: "Today's menu hasn't been published yet." },
} as const;

type PresetKey = keyof typeof presets;

interface EmptyStateProps {
  /** Use a built-in preset for common empty states */
  preset?: PresetKey;
  /** Custom icon (overrides preset) */
  icon?: LucideIcon;
  /** Heading text (overrides preset) */
  title?: string;
  /** Body text (overrides preset) */
  description?: string;
  /** Primary CTA button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  /** Secondary CTA button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional className */
  className?: string;
  /** Compact mode for inline/card usage */
  compact?: boolean;
}

/**
 * Reusable empty state component with preset illustrations.
 *
 * Usage:
 *   <EmptyState preset="orders" />
 *   <EmptyState preset="cart" action={{ label: "Browse Menu", onClick: () => router.push('/menu') }} />
 *   <EmptyState icon={Inbox} title="Custom title" description="Custom desc" />
 *
 * BMAD Audit Finding: S3 — UX Auditor
 */
export function EmptyState({
  preset,
  icon: CustomIcon,
  title: customTitle,
  description: customDescription,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  const base = preset ? presets[preset] : null;
  const Icon = CustomIcon || base?.icon || Package;
  const title = customTitle || base?.title || 'Nothing here';
  const description = customDescription || base?.description || '';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon with soft gradient background */}
      <div
        className={cn(
          'rounded-full bg-gradient-to-br from-[var(--hasivu-primary-100,#e0f2fe)] to-[var(--hasivu-primary-50,#f0f9ff)] flex items-center justify-center mb-4',
          compact ? 'h-14 w-14' : 'h-20 w-20'
        )}
      >
        <Icon
          className={cn(
            'text-[var(--hasivu-primary-500,#3b82f6)]',
            compact ? 'h-7 w-7' : 'h-10 w-10'
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          'font-semibold text-gray-900',
          compact ? 'text-base' : 'text-lg'
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-gray-500 mt-1 max-w-sm',
            compact ? 'text-sm' : 'text-base'
          )}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-5">
          {action && (
            <Button
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="h-10"
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              onClick={secondaryAction.onClick}
              className="h-10"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
