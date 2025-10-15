/**
 * SwipeableCard - Touch-friendly swipeable card component
 * Features: Swipe gestures, haptic feedback, smooth animations
 */

import React, { useRef, useState } from 'react';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { Heart, ShoppingCart, Info, Star, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SwipeAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right', actionId?: string) => void;
  swipeThreshold?: number;
  disabled?: boolean;
  className?: string;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  onSwipe,
  swipeThreshold = 80,
  disabled = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [triggerHaptic, setTriggerHaptic] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 0.8, 1, 0.8, 0.5]);
  const scale = useTransform(x, [-200, -100, 0, 100, 200], [0.9, 0.95, 1, 0.95, 0.9]);

  const handleDragStart = () => {
    if (disabled) return;
    setIsDragging(true);

    // Light haptic feedback on drag start
    if ('vibrate' in navigator && navigator.vibrate) {
      navigator.vibrate(5);
    }
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (disabled) return;

    setIsDragging(false);
    const swipeDistance = info.offset.x;
    const velocity = info.velocity.x;

    // Determine if swipe threshold is met
    const shouldSwipe = Math.abs(swipeDistance) > swipeThreshold || Math.abs(velocity) > 500;

    if (shouldSwipe) {
      const direction = swipeDistance > 0 ? 'right' : 'left';
      const actions = direction === 'right' ? rightActions : leftActions;

      // Find the appropriate action based on swipe distance
      let selectedAction: SwipeAction | undefined;
      if (actions.length > 0) {
        const actionIndex = Math.min(
          Math.floor(Math.abs(swipeDistance) / swipeThreshold) - 1,
          actions.length - 1
        );
        selectedAction = actions[Math.max(0, actionIndex)];
      }

      // Haptic feedback for successful swipe
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(15);
      }

      onSwipe?.(direction, selectedAction?.id);
      selectedAction?.action();
    }

    // Reset position
    x.set(0);
  };

  const handleDrag = (event: any, info: PanInfo) => {
    if (disabled) return;

    const swipeDistance = Math.abs(info.offset.x);

    // Trigger haptic feedback when passing threshold
    if (swipeDistance > swipeThreshold && !triggerHaptic) {
      setTriggerHaptic(true);
      if ('vibrate' in navigator && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } else if (swipeDistance <= swipeThreshold && triggerHaptic) {
      setTriggerHaptic(false);
    }
  };

  const renderActionIndicators = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;

    return (
      <div
        className={cn(
          'absolute top-0 bottom-0 flex items-center space-x-2 px-4',
          side === 'left' ? 'left-0' : 'right-0'
        )}
      >
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.id}
              className={cn(
                'flex items-center justify-center',
                'w-12 h-12 rounded-full',
                action.bgColor,
                'shadow-lg'
              )}
              initial={{ scale: 0 }}
              animate={{ scale: triggerHaptic ? 1.1 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <Icon className={cn('h-6 w-6', action.color)} />
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Background action indicators */}
      {renderActionIndicators(leftActions, 'left')}
      {renderActionIndicators(rightActions, 'right')}

      {/* Main card */}
      <motion.div
        ref={cardRef}
        className="relative z-10"
        drag={disabled ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: 'spring',
          stiffness: 400,
          damping: 30,
        }}
      >
        <Card
          className={cn(
            'touch-none select-none',
            isDragging && 'shadow-xl',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {children}
        </Card>
      </motion.div>

      {/* Swipe instruction overlay for first-time users */}
      {!disabled && (leftActions.length > 0 || rightActions.length > 0) && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-lg pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isDragging ? 0.3 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-gray-600 text-sm font-medium">← Swipe for actions →</div>
        </motion.div>
      )}
    </div>
  );
};

// Preset swipe actions for meal cards
export const createMealCardActions = (
  meal: any,
  onAddToCart: (meal: any) => void,
  onToggleFavorite: (meal: any) => void,
  onViewDetails: (meal: any) => void,
  isFavorite: boolean = false
) => {
  const leftActions: SwipeAction[] = [
    {
      id: 'favorite',
      label: isFavorite ? 'Remove Favorite' : 'Add Favorite',
      icon: Heart,
      color: isFavorite ? 'text-red-500' : 'text-white',
      bgColor: isFavorite ? 'bg-gray-100' : 'bg-red-500',
      action: () => onToggleFavorite(meal),
    },
  ];

  const rightActions: SwipeAction[] = [
    {
      id: 'info',
      label: 'View Details',
      icon: Info,
      color: 'text-white',
      bgColor: 'bg-blue-500',
      action: () => onViewDetails(meal),
    },
    {
      id: 'cart',
      label: 'Add to Cart',
      icon: ShoppingCart,
      color: 'text-white',
      bgColor: 'bg-green-500',
      action: () => onAddToCart(meal),
    },
  ];

  return { leftActions, rightActions };
};

export default SwipeableCard;
