import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Flag, Clock, MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  variant?: 'default' | 'menu' | 'profile' | 'meal-actions';
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 4, variant = 'default', ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <AnimatePresence>
      <PopoverPrimitive.Content ref={ref} align={align} sideOffset={sideOffset} asChild {...props}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.2,
          }}
          className={cn(
            'z-50 w-72 rounded-md border border-slate-200 bg-white p-1 text-slate-950 shadow-md outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
            variant === 'menu' && 'min-w-48',
            variant === 'profile' && 'w-80',
            variant === 'meal-actions' && 'w-56',
            className
          )}
        >
          {props.children}
        </motion.div>
      </PopoverPrimitive.Content>
    </AnimatePresence>
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// Quick Action Item Component
interface PopoverActionProps {
  icon: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  variant?: 'default' | 'destructive' | 'success';
  onClick?: () => void;
  disabled?: boolean;
}

const PopoverAction = React.forwardRef<HTMLButtonElement, PopoverActionProps>(
  (
    {
      icon,
      label,
      description,
      shortcut,
      variant = 'default',
      onClick,
      disabled = false,
      ...props
    },
    ref
  ) => (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'flex w-full items-center rounded-sm px-3 py-2 text-sm transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none disabled:pointer-events-none disabled:opacity-50 dark:hover:bg-slate-800 dark:focus:bg-slate-800',
        variant === 'destructive' &&
          'text-red-600 hover:bg-red-50 focus:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 dark:focus:bg-red-950/20',
        variant === 'success' &&
          'text-green-600 hover:bg-green-50 focus:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/20 dark:focus:bg-green-950/20'
      )}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      <div className="mr-3 flex h-4 w-4 items-center justify-center">{icon}</div>
      <div className="flex-1 text-left">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
        )}
      </div>
      {shortcut && (
        <div className="ml-2 text-xs text-slate-400 dark:text-slate-500">{shortcut}</div>
      )}
    </motion.button>
  )
);
PopoverAction.displayName = 'PopoverAction';

// Meal Quick Actions Popover
interface MealQuickActionsProps {
  children: React.ReactNode;
  mealId: string;
  mealName: string;
  isFavorite?: boolean;
  onFavoriteToggle?: (mealId: string) => void;
  onViewNutrition?: (mealId: string) => void;
  onSetAlert?: (mealId: string) => void;
  onShare?: (mealId: string, mealName: string) => void;
  onReport?: (mealId: string) => void;
}

const MealQuickActions = ({
  children,
  mealId,
  mealName,
  isFavorite = false,
  onFavoriteToggle,
  onViewNutrition,
  onSetAlert,
  onShare,
  onReport,
}: MealQuickActionsProps) => {
  const [open, setOpen] = React.useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent variant="meal-actions" align="end">
        <div className="py-1">
          {onFavoriteToggle && (
            <PopoverAction
              icon={<Heart className={cn('h-4 w-4', isFavorite && 'fill-current text-red-500')} />}
              label={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              variant={isFavorite ? 'default' : 'success'}
              onClick={() => handleAction(() => onFavoriteToggle(mealId))}
            />
          )}

          {onViewNutrition && (
            <PopoverAction
              icon={<div className="text-blue-500">📊</div>}
              label="View Nutrition"
              description="Calories, protein, allergens"
              onClick={() => handleAction(() => onViewNutrition(mealId))}
            />
          )}

          {onSetAlert && (
            <PopoverAction
              icon={<div className="text-orange-500">⚠️</div>}
              label="Set Dietary Alert"
              description="Get notified about ingredients"
              onClick={() => handleAction(() => onSetAlert(mealId))}
            />
          )}

          <Separator className="my-1" />

          {onShare && (
            <PopoverAction
              icon={<Share2 className="h-4 w-4 text-slate-600" />}
              label="Share Meal"
              shortcut="⌘S"
              onClick={() => handleAction(() => onShare(mealId, mealName))}
            />
          )}

          {onReport && (
            <PopoverAction
              icon={<Flag className="h-4 w-4 text-slate-600" />}
              label="Report Issue"
              variant="destructive"
              onClick={() => handleAction(() => onReport(mealId))}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Profile Quick Switcher for Parents
interface ChildProfile {
  id: string;
  name: string;
  avatar: string;
  balance: number;
  recentOrder?: string;
  dietaryRestrictions: string[];
  grade?: string;
}

interface ProfileSwitcherProps {
  children: React.ReactNode;
  currentProfile: ChildProfile;
  profiles: ChildProfile[];
  onProfileSwitch: (profileId: string) => void;
  onManageProfiles?: () => void;
  onAddFunds?: (profileId: string) => void;
}

const ProfileSwitcher = ({
  children,
  currentProfile,
  profiles,
  onProfileSwitch,
  onManageProfiles,
  onAddFunds,
}: ProfileSwitcherProps) => {
  const [open, setOpen] = React.useState(false);

  const handleSwitch = (profileId: string) => {
    onProfileSwitch(profileId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent variant="profile">
        <div className="py-2">
          <div className="px-3 py-2 mb-2">
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Switch Profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage multiple children's accounts
            </p>
          </div>

          <div className="space-y-1">
            {profiles.map(profile => (
              <motion.button
                key={profile.id}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex w-full items-center space-x-3 rounded-sm px-3 py-2 text-sm transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-slate-800 dark:focus:bg-slate-800',
                  currentProfile.id === profile.id && 'bg-slate-100 dark:bg-slate-800'
                )}
                onClick={() => handleSwitch(profile.id)}
              >
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{profile.name}</span>
                    {profile.grade && (
                      <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {profile.grade}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-green-600 font-medium">₹{profile.balance}</span>
                    {profile.recentOrder && (
                      <span className="text-xs text-slate-500 truncate max-w-24">
                        {profile.recentOrder}
                      </span>
                    )}
                  </div>
                  {profile.dietaryRestrictions.length > 0 && (
                    <div className="flex items-center space-x-1 mt-1">
                      {profile.dietaryRestrictions.slice(0, 2).map((restriction, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-1 py-0.5 rounded"
                        >
                          {restriction}
                        </span>
                      ))}
                      {profile.dietaryRestrictions.length > 2 && (
                        <span className="text-xs text-slate-400">
                          +{profile.dietaryRestrictions.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {onAddFunds && profile.balance < 100 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={e => {
                      e.stopPropagation();
                      onAddFunds(profile.id);
                      setOpen(false);
                    }}
                  >
                    Top Up
                  </Button>
                )}
              </motion.button>
            ))}
          </div>

          {onManageProfiles && (
            <>
              <Separator className="my-2" />
              <PopoverAction
                icon={<div className="text-slate-500">⚙️</div>}
                label="Manage Profiles"
                description="Add, edit, or remove children"
                onClick={() => {
                  onManageProfiles();
                  setOpen(false);
                }}
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Order Status Quick Actions
interface OrderStatusPopoverProps {
  children: React.ReactNode;
  orderId: string;
  status: 'pending' | 'preparing' | 'ready' | 'delivered';
  estimatedTime?: number;
  onTrackOrder?: (orderId: string) => void;
  onContactSupport?: (orderId: string) => void;
  onReorder?: (orderId: string) => void;
  onCancelOrder?: (orderId: string) => void;
}

const OrderStatusPopover = ({
  children,
  orderId,
  status,
  estimatedTime,
  onTrackOrder,
  onContactSupport,
  onReorder,
  onCancelOrder,
}: OrderStatusPopoverProps) => {
  const [open, setOpen] = React.useState(false);

  const handleAction = (action: () => void) => {
    action();
    setOpen(false);
  };

  const canCancel = status === 'pending';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent variant="menu">
        <div className="py-1">
          <div className="px-3 py-2 mb-2 border-b">
            <div className="flex items-center space-x-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  status === 'pending' && 'bg-yellow-500',
                  status === 'preparing' && 'bg-blue-500 animate-pulse',
                  status === 'ready' && 'bg-green-500',
                  status === 'delivered' && 'bg-gray-500'
                )}
              />
              <span className="font-medium text-sm capitalize">{status}</span>
            </div>
            {estimatedTime && status !== 'delivered' && (
              <div className="flex items-center space-x-1 mt-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{estimatedTime} min remaining</span>
              </div>
            )}
          </div>

          {onTrackOrder && (
            <PopoverAction
              icon={<MapPin className="h-4 w-4 text-blue-500" />}
              label="Track Order"
              description="See real-time progress"
              onClick={() => handleAction(() => onTrackOrder(orderId))}
            />
          )}

          {onReorder && (
            <PopoverAction
              icon={<div className="text-green-500">🔄</div>}
              label="Order Again"
              description="Repeat this order"
              onClick={() => handleAction(() => onReorder(orderId))}
            />
          )}

          <Separator className="my-1" />

          {onContactSupport && (
            <PopoverAction
              icon={<div className="text-blue-500">💬</div>}
              label="Contact Support"
              description="Get help with this order"
              onClick={() => handleAction(() => onContactSupport(orderId))}
            />
          )}

          {onCancelOrder && canCancel && (
            <PopoverAction
              icon={<div className="text-red-500">❌</div>}
              label="Cancel Order"
              description="Cancel before preparation"
              variant="destructive"
              onClick={() => handleAction(() => onCancelOrder(orderId))}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAction,
  MealQuickActions,
  ProfileSwitcher,
  OrderStatusPopover,
  type ChildProfile,
};
