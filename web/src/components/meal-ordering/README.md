# Enhanced Meal Ordering Components

This directory contains advanced meal ordering components built with ShadCN UI components, specifically designed for the HASIVU school food delivery platform.

## Overview

The enhanced meal ordering system provides a modern, accessible, and mobile-friendly interface for students to browse, select, and order meals. All components are built using TypeScript and follow accessibility best practices.

## New ShadCN Components Implemented

### 1. ScrollArea (`/components/ui/scroll-area.tsx`)

Custom scrollable container with styled scrollbars.

**Features:**

- Smooth scrolling experience
- Custom scrollbar styling
- Touch-friendly mobile scrolling
- Responsive design

**Usage:**

```tsx
import { ScrollArea } from '@/components/ui/scroll-area'

<ScrollArea className=process.env.MEAL-ORDERING_README_PASSWORD_1>
  <div className="space-y-4">
    {/* Long content */}
  </div>
</ScrollArea>
```

### 2. Slider (`/components/ui/slider.tsx`)

Interactive slider for quantity selection and range filtering.

**Features:**

- Responsive touch controls
- Custom styling with brand colors
- Keyboard navigation support
- Real-time value updates

**Usage:**

```tsx
import { Slider } from '@/components/ui/slider';

<Slider
  value={[quantity]}
  onValueChange={setQuantity}
  max={10}
  min={0}
  step={1}
/>;
```

### 3. Sonner (`/components/ui/sonner.tsx`)

Modern toast notification system with theme support.

**Features:**

- Rich notifications with icons
- Theme-aware styling
- Action buttons
- Sound notifications
- Persistent notifications

**Usage:**

```tsx
import { toast } from 'sonner';

toast.success('Order placed successfully!');
toast.error('Payment failed', {
  action: {
    label: 'Retry',
    onClick: () => retryPayment(),
  },
});
```

### 4. ToggleGroup (`/components/ui/toggle-group.tsx`)

Multi-select toggle controls for filters and preferences.

**Features:**

- Single or multi-select modes
- Button-style toggles
- Keyboard navigation
- Active state styling

**Usage:**

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

<ToggleGroup
  type="multiple"
  value={selectedFilters}
  onValueChange={setSelectedFilters}
>
  <ToggleGroupItem value="vegetarian">Vegetarian</ToggleGroupItem>
  <ToggleGroupItem value="vegan">Vegan</ToggleGroupItem>
</ToggleGroup>;
```

### 5. HoverCard (`/components/ui/hover-card.tsx`)

Contextual information display on hover/tap.

**Features:**

- Hover and tap trigger support
- Positioning control
- Animation support
- Mobile-friendly

**Usage:**

```tsx
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';

<HoverCard>
  <HoverCardTrigger>Meal Name</HoverCardTrigger>
  <HoverCardContent>
    <div>Nutritional information...</div>
  </HoverCardContent>
</HoverCard>;
```

### 6. InputOTP (`/components/ui/input-otp.tsx`)

One-time password input for RFID verification.

**Features:**

- Segmented input display
- Auto-advance between segments
- Keyboard navigation
- Visual feedback

**Usage:**

```tsx
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

<InputOTP value={otp} onChange={setOtp} maxLength={6}>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
</InputOTP>;
```

## Enhanced Meal Ordering Components

### 1. EnhancedMealList

Advanced meal browsing with filtering and search capabilities.

**Features:**

- ScrollArea for smooth meal list navigation
- Real-time search and filtering
- ToggleGroup for dietary preference filters
- Slider for price range filtering
- HoverCard for nutritional previews
- Mobile-responsive design

**Props:**

```tsx
interface EnhancedMealListProps {
  meals: MealItem[];
  student: StudentInfo;
  onAddToCart: (meal: MealItem, quantity: number) => void;
  onViewDetails: (meal: MealItem) => void;
  cartItems: { [mealId: string]: number };
  className?: string;
}
```

### 2. QuantitySelector

Interactive quantity selection with price calculations.

**Features:**

- Slider-based quantity selection
- Real-time price breakdown
- Bulk discount calculations
- Nutritional impact preview
- Wallet balance validation

**Props:**

```tsx
interface QuantitySelectorProps {
  meal: MealItem;
  student: StudentInfo;
  currentQuantity: number;
  onQuantityChange: (quantity: number) => void;
  showPriceBreakdown?: boolean;
  showBulkDiscounts?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}
```

### 3. RFIDVerification

Multi-step RFID card verification process.

**Features:**

- InputOTP for RFID card number entry
- Security code verification
- Location code validation
- Step-by-step progress tracking
- Timeout management

**Props:**

```tsx
interface RFIDVerificationProps {
  studentInfo: StudentInfo;
  pendingOrders: OrderHistoryItem[];
  onVerificationComplete: (rfidInfo: RFIDPickupInfo) => void;
  onVerificationFailed: (error: string) => void;
  className?: string;
  isScanning?: boolean;
}
```

### 4. NotificationSystem

Comprehensive notification management with Sonner.

**Features:**

- Multiple notification types
- Sound notification support
- Order status tracking
- Special offers and recommendations
- RFID verification feedback

**Methods:**

```tsx
const notificationService = NotificationService.getInstance();

// Order notifications
notificationService.orderPlaced({ orderId, items, total });
notificationService.orderStatusUpdate(orderId, status, estimatedTime);

// Payment notifications
notificationService.paymentUpdate(success, amount, method);

// Special notifications
notificationService.mealRecommendation(meal, reason);
notificationService.specialOffer(title, description, code);
```

## Accessibility Features

### Keyboard Navigation

- Tab navigation through all interactive elements
- Arrow key navigation for sliders and toggles
- Enter/Space key activation
- Focus management and visual indicators

### Screen Reader Support

- Comprehensive ARIA labels and descriptions
- Live regions for dynamic content updates
- Semantic HTML structure
- Status and progress announcements

### Mobile Accessibility

- Touch target sizing (minimum 44px)
- Gesture-friendly interactions
- High contrast mode support
- Responsive text sizing
- Safe area support for notched devices

### Visual Indicators

- High contrast focus rings
- Color contrast compliance (WCAG AA)
- Loading and error states
- Progress indicators
- Status badges and icons

## Responsive Design

### Breakpoint Strategy

- Mobile-first approach
- Custom breakpoints for school devices
- Touch-friendly sizing
- Orientation awareness

### Mobile Optimizations

- Touch target sizing
- Gesture controls
- Scroll behavior optimization
- Performance considerations
- Battery-conscious animations

## Performance Considerations

### Code Splitting

- Lazy loading of heavy components
- Dynamic imports for non-critical features
- Bundle optimization

### Caching Strategy

- Component-level memoization
- API response caching
- Image lazy loading
- Progressive enhancement

### Animation Performance

- Hardware-accelerated transforms
- Reduced motion support
- Battery-conscious animations
- 60fps target maintenance

## Usage Examples

### Basic Implementation

```tsx
import {
  EnhancedMealList,
  QuantitySelector,
  NotificationSystem,
} from '@/components/meal-ordering';

function MealOrderingPage() {
  const [cartItems, setCartItems] = useState({});
  const [selectedMeal, setSelectedMeal] = useState(null);

  return (
    <div>
      <NotificationSystem student={student} />

      <EnhancedMealList
        meals={meals}
        student={student}
        onAddToCart={(meal, quantity) => {
          setCartItems(prev => ({
            ...prev,
            [meal.id]: (prev[meal.id] || 0) + quantity,
          }));
        }}
        onViewDetails={setSelectedMeal}
        cartItems={cartItems}
      />

      {selectedMeal && (
        <QuantitySelector
          meal={selectedMeal}
          student={student}
          currentQuantity={cartItems[selectedMeal.id] || 0}
          onQuantityChange={quantity => {
            setCartItems(prev => ({
              ...prev,
              [selectedMeal.id]: quantity,
            }));
          }}
        />
      )}
    </div>
  );
}
```

### Advanced Configuration

```tsx
// Custom notification setup
const notificationService = NotificationService.getInstance();
notificationService.initialize(student);
notificationService.toggleSound(true);

// RFID verification workflow
function RFIDWorkflow() {
  return (
    <RFIDVerification
      studentInfo={student}
      pendingOrders={pendingOrders}
      onVerificationComplete={rfidInfo => {
        notificationService.rfidVerification(true, rfidInfo.pickupLocation);
        // Handle successful verification
      }}
      onVerificationFailed={error => {
        notificationService.rfidVerification(false);
        // Handle verification failure
      }}
      isScanning={isScanning}
    />
  );
}
```

## Testing

### Component Testing

- Unit tests for all components
- Integration tests for user workflows
- Accessibility testing with axe-core
- Performance testing for mobile devices

### User Experience Testing

- Cross-browser compatibility
- Mobile device testing
- Screen reader testing
- Keyboard navigation testing

## Browser Support

### Desktop

- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+

### Mobile

- iOS Safari 14+
- Chrome Mobile 90+
- Samsung Internet 14+
- Firefox Mobile 85+

## Contributing

When contributing to these components:

1. Follow TypeScript best practices
2. Ensure WCAG 2.1 AA compliance
3. Test on mobile devices
4. Update documentation
5. Add comprehensive tests
6. Consider performance impact

## License

Part of the HASIVU platform - proprietary software for educational institutions.

## Demo

Visit `/enhanced-demo` to see all components in action with interactive examples and feature explanations.
