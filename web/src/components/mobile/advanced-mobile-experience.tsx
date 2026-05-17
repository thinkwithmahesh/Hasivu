'use client';

import * as React from 'react';
import { motion, AnimatePresence, PanInfo, useDragControls } from 'framer-motion';
import {
  Home,
  Search,
  ShoppingCart,
  User,
  Plus,
  Minus,
  Heart,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Truck,
  Wifi,
  WifiOff,
  MoreHorizontal,
  ArrowLeft,
  Filter,
  Bell,
  Settings,
  LogOut,
  Eye,
  EyeOff,
  Shield,
  Smartphone,
  Camera,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

// Types and Interfaces
interface MealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  nutritionScore: 'A' | 'B' | 'C' | 'D' | 'E';
  allergens: string[];
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  preparationTime: number;
  availability: number;
  isPopular: boolean;
}

interface CartItem extends MealItem {
  quantity: number;
  customizations?: string[];
}

interface Order {
  id: string;
  items: CartItem[];
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderTime: Date;
  estimatedDelivery: Date;
  total: number;
  pickupLocation: string;
  studentInfo: {
    name: string;
    class: string;
    rollNumber: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  class: string;
  rollNumber: string;
  parentName: string;
  parentPhone: string;
  dietaryPreferences: string[];
  allergens: string[];
  balance: number;
  monthlyLimit: number;
  monthlySpent: number;
}

// Mock Data
const mockMeals: MealItem[] = [
  {
    id: '1',
    name: 'Rajma Chawal',
    description: 'Traditional red kidney beans curry with steamed basmati rice',
    price: 85,
    image: '/api/placeholder/300/200',
    category: 'Main Course',
    rating: 4.5,
    nutritionScore: 'A',
    allergens: ['gluten'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    preparationTime: 15,
    availability: 25,
    isPopular: true,
  },
  {
    id: '2',
    name: 'Paneer Butter Masala',
    description: 'Creamy tomato-based curry with cottage cheese and naan',
    price: 120,
    image: '/api/placeholder/300/200',
    category: 'Main Course',
    rating: 4.7,
    nutritionScore: 'B',
    allergens: ['dairy', 'gluten'],
    isVegetarian: true,
    isVegan: false,
    isGlutenFree: false,
    preparationTime: 20,
    availability: 18,
    isPopular: true,
  },
  {
    id: '3',
    name: 'Masala Dosa',
    description: 'Crispy fermented crepe with spiced potato filling and chutneys',
    price: 75,
    image: '/api/placeholder/300/200',
    category: 'South Indian',
    rating: 4.3,
    nutritionScore: 'A',
    allergens: [],
    isVegetarian: true,
    isVegan: true,
    isGlutenFree: true,
    preparationTime: 12,
    availability: 30,
    isPopular: false,
  },
];

const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Arjun Sharma',
  email: 'arjun.sharma@student.school.edu',
  phone: '+91 98765 43210',
  avatar: '/api/placeholder/100/100',
  class: 'Class 10-A',
  rollNumber: '2024001',
  parentName: 'Rajesh Sharma',
  parentPhone: '+91 98765 43211',
  dietaryPreferences: ['vegetarian'],
  allergens: ['nuts'],
  balance: 2500,
  monthlyLimit: 5000,
  monthlySpent: 2100,
};

// Utility Functions
const generateHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [15],
      heavy: [25],
    };
    navigator.vibrate(patterns[type]);
  }
};

const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

// Gesture Components
interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
}) => {
  const dragControls = useDragControls();

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info: PanInfo) => {
        if (info.offset.x > 100 && onSwipeRight) {
          generateHapticFeedback('medium');
          onSwipeRight();
        } else if (info.offset.x < -100 && onSwipeLeft) {
          generateHapticFeedback('medium');
          onSwipeLeft();
        }
      }}
      className={cn('cursor-grab active:cursor-grabbing', className)}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};

// Navigation Components
interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  cartItemCount: number;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  cartItemCount,
}) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'cart', icon: ShoppingCart, label: 'Cart', badge: cartItemCount },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 safe-area-bottom"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="touch"
              className={cn(
                'flex flex-col items-center gap-1 h-14 px-3 relative',
                isActive && 'text-primary'
              )}
              onClick={() => {
                generateHapticFeedback('light');
                onTabChange(tab.id);
              }}
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {tab.badge && tab.badge > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs">{tab.label}</span>

              {/* Active indicator */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </Button>
          );
        })}
      </div>
    </motion.nav>
  );
};

// Meal Components
interface MealCardProps {
  meal: MealItem;
  onAddToCart: (meal: MealItem) => void;
  onToggleFavorite: (mealId: string) => void;
  isFavorite: boolean;
}

const MealCard: React.FC<MealCardProps> = ({ meal, onAddToCart, onToggleFavorite, isFavorite }) => {
  const [isAdding, setIsAdding] = React.useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    generateHapticFeedback('medium');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    onAddToCart(meal);
    setIsAdding(false);
  };

  const nutritionColors = {
    A: 'bg-green-500',
    B: 'bg-lime-500',
    C: 'bg-yellow-500',
    D: 'bg-orange-500',
    E: 'bg-red-500',
  };

  return (
    <SwipeableCard
      onSwipeLeft={() => onToggleFavorite(meal.id)}
      onSwipeRight={() => handleAddToCart()}
      className="mb-4"
    >
      <motion.div
        className="bg-card rounded-lg border border-border overflow-hidden shadow-sm"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Image and badges */}
        <div className="relative">
          <img
            src={meal.image}
            alt={meal.name}
            className="w-full h-32 object-cover"
            loading="lazy"
          />

          {/* Badges overlay */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {meal.isPopular && (
              <Badge variant="destructive" className="text-xs">
                Popular
              </Badge>
            )}
            <Badge className={cn('text-xs text-white', nutritionColors[meal.nutritionScore])}>
              Nutri-Score {meal.nutritionScore}
            </Badge>
          </div>

          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm"
            onClick={() => onToggleFavorite(meal.id)}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-red-500 text-red-500')} />
          </Button>

          {/* Availability indicator */}
          <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            {meal.availability} left
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">{meal.name}</h3>
              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{meal.description}</p>
            </div>
          </div>

          {/* Rating and timing */}
          <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{meal.rating}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{meal.preparationTime}m</span>
            </div>
          </div>

          {/* Dietary indicators */}
          <div className="flex items-center gap-2 mb-3">
            {meal.isVegetarian && (
              <div className="w-3 h-3 border-2 border-green-600 rounded-sm bg-green-100 flex items-center justify-center">
                <div className="w-1 h-1 bg-green-600 rounded-full" />
              </div>
            )}
            {meal.isVegan && (
              <Badge variant="outline" className="text-xs">
                Vegan
              </Badge>
            )}
            {meal.isGlutenFree && (
              <Badge variant="outline" className="text-xs">
                Gluten-Free
              </Badge>
            )}
          </div>

          {/* Price and add to cart */}
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold">{formatCurrency(meal.price)}</span>
            <Button
              onClick={handleAddToCart}
              disabled={isAdding || meal.availability === 0}
              className="min-w-[100px]"
              haptic
            >
              {isAdding ? (
                <motion.div
                  className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              ) : meal.availability === 0 ? (
                'Sold Out'
              ) : (
                'Add to Cart'
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </SwipeableCard>
  );
};

// Cart Components
interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove }) => {
  return (
    <SwipeableCard onSwipeLeft={() => onRemove(item.id)} className="mb-3">
      <motion.div
        className="bg-card rounded-lg border border-border p-4"
        layout
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex gap-3">
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1 truncate">{item.name}</h4>
            <p className="text-xs text-muted-foreground mb-2">{formatCurrency(item.price)} each</p>

            {/* Quantity controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  disabled={item.quantity <= 1}
                  haptic
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="w-8 text-center font-medium">{item.quantity}</span>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  disabled={item.quantity >= item.availability}
                  haptic
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </SwipeableCard>
  );
};

// Payment Components
interface PaymentMethodProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  balance: number;
}

const PaymentMethod: React.FC<PaymentMethodProps> = ({
  selectedMethod,
  onMethodChange,
  balance,
}) => {
  const [showBalance, setShowBalance] = React.useState(false);
  const [useFingerprint, setUseFingerprint] = React.useState(false);

  const methods = [
    {
      id: 'wallet',
      name: 'School Wallet',
      description: `Balance: ${showBalance ? formatCurrency(balance) : '••••••'}`,
      icon: CreditCard,
      available: balance > 0,
    },
    {
      id: 'upi',
      name: 'UPI Payment',
      description: 'Pay via PhonePe, GPay, Paytm',
      icon: Smartphone,
      available: true,
    },
    {
      id: 'card',
      name: 'Debit/Credit Card',
      description: 'Secure card payment',
      icon: CreditCard,
      available: true,
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Payment Method</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowBalance(!showBalance)}
          className="flex items-center gap-2"
        >
          {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showBalance ? 'Hide' : 'Show'} Balance
        </Button>
      </div>

      {methods.map(method => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <motion.div
            key={method.id}
            className={cn(
              'p-4 rounded-lg border border-border cursor-pointer transition-all',
              isSelected && 'border-primary bg-primary/5',
              !method.available && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => method.available && onMethodChange(method.id)}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <div className="flex-1">
                <div className="font-medium">{method.name}</div>
                <div className="text-sm text-muted-foreground">{method.description}</div>
              </div>
              {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
            </div>
          </motion.div>
        );
      })}

      {/* Security options */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <div className="font-medium text-sm">Biometric Authentication</div>
              <div className="text-xs text-muted-foreground">
                Use fingerprint for secure payments
              </div>
            </div>
          </div>
          <Switch checked={useFingerprint} onCheckedChange={setUseFingerprint} />
        </div>
      </div>
    </div>
  );
};

// Order Tracking Components
interface OrderTrackingProps {
  order: Order;
  onCancelOrder?: (orderId: string) => void;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({ order, onCancelOrder }) => {
  const statusSteps = [
    { id: 'pending', label: 'Order Placed', icon: CheckCircle },
    { id: 'preparing', label: 'Preparing', icon: Clock },
    { id: 'ready', label: 'Ready for Pickup', icon: Bell },
    { id: 'delivered', label: 'Delivered', icon: Truck },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.id === order.status);
  const canCancel = order.status === 'pending';

  return (
    <motion.div
      className="bg-card rounded-lg border border-border p-4 mb-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Order #{order.id.slice(-6).toUpperCase()}</h3>
          <p className="text-sm text-muted-foreground">Placed at {formatTime(order.orderTime)}</p>
        </div>
        <Badge
          variant={order.status === 'delivered' ? 'default' : 'secondary'}
          className="capitalize"
        >
          {order.status}
        </Badge>
      </div>

      {/* Progress steps */}
      <div className="space-y-3 mb-4">
        {statusSteps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;

          return (
            <div key={step.id} className="flex items-center gap-3">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all',
                  isCompleted
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground/30'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>

              <div className="flex-1">
                <div
                  className={cn(
                    'font-medium text-sm',
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </div>
                {isCurrent && order.status === 'preparing' && (
                  <div className="text-xs text-muted-foreground">
                    Est. {formatTime(order.estimatedDelivery)}
                  </div>
                )}
              </div>

              {isCurrent && (
                <motion.div
                  className="w-2 h-2 bg-primary rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Order details */}
      <div className="border-t border-border pt-3 mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span>Items:</span>
          <span>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>Total:</span>
          <span className="font-semibold">{formatCurrency(order.total)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Pickup:</span>
          <span className="text-muted-foreground">{order.pickupLocation}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share Order
        </Button>

        {canCancel && onCancelOrder && (
          <Button variant="destructive" size="sm" onClick={() => onCancelOrder(order.id)} haptic>
            Cancel Order
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Profile Components
interface ProfileSectionProps {
  user: UserProfile;
  onLogout: () => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ user, onLogout }) => {
  const spendingPercentage = (user.monthlySpent / user.monthlyLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>
            {user.name
              .split(' ')
              .map(n => n[0])
              .join('')}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h2 className="font-semibold text-lg">{user.name}</h2>
          <p className="text-sm text-muted-foreground">{user.class}</p>
          <p className="text-sm text-muted-foreground">Roll: {user.rollNumber}</p>
        </div>

        <Button variant="ghost" size="icon" onClick={onLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>

      {/* Balance card */}
      <motion.div
        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg p-4"
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm opacity-90">Available Balance</span>
          <CreditCard className="h-5 w-5 opacity-90" />
        </div>
        <div className="text-2xl font-bold mb-1">{formatCurrency(user.balance)}</div>
        <div className="text-sm opacity-90">
          Monthly spent: {formatCurrency(user.monthlySpent)} / {formatCurrency(user.monthlyLimit)}
        </div>
        <Progress value={spendingPercentage} className="mt-2 h-2 bg-white/20" />
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Plus, label: 'Add Money', action: () => {} },
          { icon: Clock, label: 'Order History', action: () => {} },
          { icon: Settings, label: 'Settings', action: () => {} },
          { icon: Bell, label: 'Notifications', action: () => {} },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <Button
              key={index}
              variant="outline"
              className="h-16 flex flex-col gap-2"
              onClick={item.action}
              haptic
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Dietary preferences */}
      <div className="space-y-3">
        <h3 className="font-semibold">Dietary Preferences</h3>
        <div className="flex flex-wrap gap-2">
          {user.dietaryPreferences.map((pref, index) => (
            <Badge key={index} variant="secondary" className="capitalize">
              {pref}
            </Badge>
          ))}
        </div>

        {user.allergens.length > 0 && (
          <div>
            <h4 className="font-medium text-sm mb-2">Allergens to Avoid</h4>
            <div className="flex flex-wrap gap-2">
              {user.allergens.map((allergen, index) => (
                <Badge key={index} variant="destructive" className="capitalize">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Parent contact */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Parent Contact</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span>{user.parentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span>{user.parentPhone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Component
export const AdvancedMobileExperience: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = React.useState('home');
  const [meals] = React.useState<MealItem[]>(mockMeals);
  const [cart, setCart] = React.useState<CartItem[]>([]);
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [user] = React.useState<UserProfile>(mockUser);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('wallet');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isCheckingOut, setIsCheckingOut] = React.useState(false);

  // Hooks
  const isOnline = useOnlineStatus();
  const { toast } = useToast();

  // Cart functions
  const addToCart = React.useCallback(
    (meal: MealItem) => {
      setCart(prevCart => {
        const existingItem = prevCart.find(item => item.id === meal.id);
        if (existingItem) {
          return prevCart.map(item =>
            item.id === meal.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return [...prevCart, { ...meal, quantity: 1 }];
      });

      toast({
        title: 'Added to cart',
        description: `${meal.name} has been added to your cart`,
        duration: 2000,
      });
    },
    [toast]
  );

  const updateCartQuantity = React.useCallback((itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
    } else {
      setCart(prevCart =>
        prevCart.map(item => (item.id === itemId ? { ...item, quantity } : item))
      );
    }
    generateHapticFeedback('light');
  }, []);

  const removeFromCart = React.useCallback(
    (itemId: string) => {
      setCart(prevCart => prevCart.filter(item => item.id !== itemId));
      generateHapticFeedback('medium');
      toast({
        title: 'Item removed',
        description: 'Item has been removed from your cart',
        duration: 2000,
      });
    },
    [toast]
  );

  const toggleFavorite = React.useCallback(
    (mealId: string) => {
      setFavorites(prevFavorites => {
        const newFavorites = new Set(prevFavorites);
        if (newFavorites.has(mealId)) {
          newFavorites.delete(mealId);
          toast({
            title: 'Removed from favorites',
            duration: 2000,
          });
        } else {
          newFavorites.add(mealId);
          toast({
            title: 'Added to favorites',
            duration: 2000,
          });
        }
        return newFavorites;
      });
      generateHapticFeedback('light');
    },
    [toast]
  );

  // Checkout function
  const handleCheckout = React.useCallback(async () => {
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    generateHapticFeedback('medium');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newOrder: Order = {
        id: `order-${Date.now()}`,
        items: [...cart],
        status: 'pending',
        orderTime: new Date(),
        estimatedDelivery: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
        total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        pickupLocation: 'School Cafeteria',
        studentInfo: {
          name: user.name,
          class: user.class,
          rollNumber: user.rollNumber,
        },
      };

      setOrders(prevOrders => [newOrder, ...prevOrders]);
      setCart([]);

      toast({
        title: 'Order placed successfully!',
        description: `Order #${newOrder.id.slice(-6).toUpperCase()} will be ready in 20 minutes`,
        duration: 5000,
      });

      setActiveTab('profile'); // Switch to show order tracking
    } catch (error) {
      toast({
        title: 'Order failed',
        description: 'Please try again',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsCheckingOut(false);
    }
  }, [cart, user, toast]);

  // Filter meals based on search
  const filteredMeals = React.useMemo(() => {
    if (!searchQuery) return meals;
    return meals.filter(
      meal =>
        meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meal.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [meals, searchQuery]);

  // Calculate cart total
  const cartTotal = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const cartItemCount = React.useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Online status indicator */}
            <motion.div
              className={cn(
                'flex items-center gap-2 p-3 rounded-lg text-sm',
                isOnline
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {isOnline ? 'Connected - Real-time updates' : 'Offline - Some features limited'}
            </motion.div>

            {/* Active orders */}
            {orders
              .filter(order => order.status !== 'delivered')
              .map(order => (
                <OrderTracking
                  key={order.id}
                  order={order}
                  onCancelOrder={orderId => {
                    setOrders(prevOrders => prevOrders.filter(o => o.id !== orderId));
                    toast({
                      title: 'Order cancelled',
                      description: 'Your order has been cancelled successfully',
                      duration: 3000,
                    });
                  }}
                />
              ))}

            {/* Featured meals */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Today's Menu</h2>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="space-y-4">
                {meals.map(meal => (
                  <MealCard
                    key={meal.id}
                    meal={meal}
                    onAddToCart={addToCart}
                    onToggleFavorite={toggleFavorite}
                    isFavorite={favorites.has(meal.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        );

      case 'search':
        return (
          <div className="space-y-4">
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-4">
              <Input
                placeholder="Search meals, categories..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-4">
              {filteredMeals.map(meal => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  onAddToCart={addToCart}
                  onToggleFavorite={toggleFavorite}
                  isFavorite={favorites.has(meal.id)}
                />
              ))}

              {filteredMeals.length === 0 && searchQuery && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No meals found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'cart':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your Cart</h2>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCart([])}
                  className="text-destructive"
                >
                  Clear All
                </Button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your cart is empty</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab('home')}>
                  Browse Menu
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {cart.map(item => (
                    <CartItemCard
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateCartQuantity}
                      onRemove={removeFromCart}
                    />
                  ))}
                </div>

                {/* Order summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cartItemCount} items)</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service charge</span>
                    <span>{formatCurrency(5)}</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal + 5)}</span>
                  </div>
                </div>

                {/* Payment method */}
                <PaymentMethod
                  selectedMethod={selectedPaymentMethod}
                  onMethodChange={setSelectedPaymentMethod}
                  balance={user.balance}
                />

                {/* Checkout button */}
                <Button
                  className="w-full h-12 text-base font-semibold"
                  onClick={handleCheckout}
                  disabled={isCheckingOut || cartTotal + 5 > user.balance}
                  haptic
                >
                  {isCheckingOut ? (
                    <motion.div
                      className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    />
                  ) : null}
                  {isCheckingOut
                    ? 'Processing...'
                    : `Place Order • ${formatCurrency(cartTotal + 5)}`}
                </Button>

                {cartTotal + 5 > user.balance && (
                  <p className="text-destructive text-sm text-center">
                    Insufficient balance. Please add money to your wallet.
                  </p>
                )}
              </>
            )}
          </div>
        );

      case 'profile':
        return (
          <ProfileSection
            user={user}
            onLogout={() => {
              toast({
                title: 'Logged out',
                description: 'You have been logged out successfully',
                duration: 3000,
              });
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-40 safe-area-top"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {activeTab !== 'home' && (
              <Button variant="ghost" size="icon" onClick={() => setActiveTab('home')} haptic>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="font-bold text-lg">
                {activeTab === 'home' && 'HASIVU'}
                {activeTab === 'search' && 'Search Menu'}
                {activeTab === 'cart' && 'Cart'}
                {activeTab === 'profile' && 'Profile'}
              </h1>
              {activeTab === 'home' && (
                <p className="text-sm text-muted-foreground">
                  Good appetite, {user.name.split(' ')[0]}!
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'home' && (
              <Button variant="ghost" size="icon" haptic>
                <Bell className="h-5 w-5" />
              </Button>
            )}

            {activeTab === 'search' && (
              <Button variant="ghost" size="icon" haptic>
                <Camera className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="px-4 py-6 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        cartItemCount={cartItemCount}
      />

      {/* PWA install prompt would go here */}
      {/* Offline toast notifications would be handled by the toast system */}
    </div>
  );
};

export default AdvancedMobileExperience;
