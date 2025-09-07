# HASIVU Platform - Component Implementation Guide

## Advanced ShadCN Component Usage Examples

This guide provides detailed implementation examples for the advanced UI components designed for the HASIVU platform. Each example includes TypeScript interfaces, usage patterns, and best practices.

## 1. Enhanced Command Palette Implementation

### Basic Usage

```typescript
import React, { useState } from 'react'
import { Search, Utensils, Clock, Star } from 'lucide-react'
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/advanced-command'

const MealSearchCommand = () => {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Voice search handler
  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition()
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setSearchQuery(transcript)
      }
      recognition.start()
    }
  }

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4" />
          <span>Search meals, nutrition info...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 font-mono text-[10px] font-medium text-slate-600 opacity-100 sm:flex dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          ⌘K
        </kbd>
      </button>

      {/* Command Dialog */}
      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        showVoiceSearch={true}
        onVoiceSearch={handleVoiceSearch}
      >
        <CommandInput 
          placeholder="Search meals, check nutrition, quick actions..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          showVoiceSearch={true}
          onVoiceSearch={handleVoiceSearch}
        />
        
        <CommandList>
          <CommandEmpty>
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🍽️</div>
              <p>No meals found matching "{searchQuery}"</p>
              <p className="text-xs text-slate-500 mt-1">
                Try searching for "pasta", "vegan", or "high protein"
              </p>
            </div>
          </CommandEmpty>

          {/* Today's Specials */}
          <CommandGroup heading="Today's Specials">
            <CommandItem 
              value="butter chicken rice"
              nutritionBadge="high-protein"
              onSelect={() => {
                // Handle meal selection
                setOpen(false)
              }}
            >
              <Utensils className="mr-2 h-4 w-4" />
              <div className="flex-1">
                <div>Butter Chicken with Rice</div>
                <div className="text-xs text-slate-500">₹120 • 25 min • ⭐ 4.8</div>
              </div>
            </CommandItem>
            
            <CommandItem 
              value="paneer tikka"
              nutritionBadge="vegetarian"
            >
              <Utensils className="mr-2 h-4 w-4" />
              <div className="flex-1">
                <div>Paneer Tikka Masala</div>
                <div className="text-xs text-slate-500">₹100 • 20 min • ⭐ 4.6</div>
              </div>
            </CommandItem>
          </CommandGroup>

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem shortcut="⌘R">
              <Clock className="mr-2 h-4 w-4" />
              Repeat Last Order
            </CommandItem>
            
            <CommandItem shortcut="⌘F">
              <Star className="mr-2 h-4 w-4" />
              View Favorites
            </CommandItem>
          </CommandGroup>

          {/* Nutritional Filters */}
          <CommandGroup heading="Dietary Preferences">
            <CommandItem value="vegan meals">
              🌱 Show Vegan Options
            </CommandItem>
            <CommandItem value="gluten free">
              🌾 Gluten-Free Meals
            </CommandItem>
            <CommandItem value="high protein">
              💪 High Protein Options
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}

export default MealSearchCommand
```

### Advanced Search with Context

```typescript
interface SearchContext {
  timeOfDay: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  userPreferences: {
    dietaryRestrictions: string[]
    allergens: string[]
    favoriteCategories: string[]
  }
  recentOrders: Array<{
    id: string
    name: string
    timestamp: Date
  }>
}

const useContextualSearch = (context: SearchContext) => {
  const getSmartSuggestions = () => {
    const { timeOfDay, userPreferences, recentOrders } = context
    
    // Algorithm for time-based suggestions
    const timeBasedSuggestions = {
      breakfast: ['Poha', 'Upma', 'Bread Omelette', 'Fruit Bowl'],
      lunch: ['Dal Rice', 'Chole Bhature', 'Biryani', 'Thali'],
      dinner: ['Roti Sabzi', 'Fried Rice', 'Pasta', 'Soup'],
      snack: ['Samosa', 'Sandwich', 'Fruit Juice', 'Cookies']
    }

    return timeBasedSuggestions[timeOfDay] || []
  }

  const filterByPreferences = (meals: any[]) => {
    return meals.filter(meal => {
      // Filter based on dietary restrictions
      const matchesDiet = userPreferences.dietaryRestrictions.every(
        restriction => meal.dietaryTags.includes(restriction)
      )
      
      // Filter out allergens
      const hasAllergens = userPreferences.allergens.some(
        allergen => meal.allergens.includes(allergen)
      )
      
      return matchesDiet && !hasAllergens
    })
  }

  return {
    getSmartSuggestions,
    filterByPreferences
  }
}
```

## 2. Mobile Meal Order Drawer

### Basic Implementation

```typescript
import React, { useState } from 'react'
import { MealOrderDrawer, type MealItem } from '@/components/ui/meal-order-drawer'

const MealCard = ({ meal }: { meal: MealItem }) => {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleAddToCart = (meal: MealItem, customizations: any) => {
    // Add to cart logic
    console.log('Adding to cart:', meal, customizations)
    
    // Show success feedback
    toast.success(`${meal.name} added to cart!`)
    
    // Optional: Navigate to cart or show quick checkout
  }

  return (
    <>
      {/* Meal Card */}
      <div className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
        <div className="aspect-video relative mb-4 overflow-hidden rounded-lg">
          <img
            src={meal.image}
            alt={meal.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-2 right-2 rounded-full bg-white/90 px-2 py-1 text-sm font-medium backdrop-blur-sm">
            ⭐ {meal.rating}
          </div>
        </div>

        <div className=process.env.WEB_COMPONENT_IMPLEMENTATION_GUIDE_PASSWORD_1>
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {meal.name}
            </h3>
            <span className="font-bold text-primary-600">₹{meal.price}</span>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {meal.description}
          </p>

          <div className="flex items-center space-x-2 text-xs">
            <span className="flex items-center text-slate-500">
              <Clock className="mr-1 h-3 w-3" />
              {meal.preparationTime}min
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{meal.category}</span>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full rounded-md bg-primary-600 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Add to Cart
          </button>
        </div>
      </div>

      {/* Order Drawer */}
      <MealOrderDrawer
        meal={meal}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </>
  )
}

export default MealCard
```

### Advanced Customization with Real-time Price Updates

```typescript
const AdvancedMealDrawer = ({ meal }: { meal: MealItem }) => {
  const [customizations, setCustomizations] = useState({
    quantity: 1,
    portion: 'regular' as const,
    addOns: [] as string[],
    specialInstructions: ''
  })

  // Real-time price calculation
  const calculatePrice = () => {
    const basePrice = meal.customizations?.portion?.[customizations.portion] || meal.price
    const addOnPrice = customizations.addOns.reduce((total, addOnId) => {
      const addOn = meal.customizations?.addOns?.find(a => a.id === addOnId)
      return total + (addOn?.price || 0)
    }, 0)
    return (basePrice + addOnPrice) * customizations.quantity
  }

  // Nutrition calculation based on customizations
  const calculateNutrition = () => {
    const baseCal = meal.nutrition.calories
    const portionMultiplier = {
      small: 0.7,
      regular: 1.0,
      large: 1.3
    }[customizations.portion]

    return {
      ...meal.nutrition,
      calories: Math.round(baseCal * portionMultiplier * customizations.quantity)
    }
  }

  return (
    <MealOrderDrawer
      meal={meal}
      isOpen={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      onAddToCart={(meal, customizations) => {
        // Enhanced cart data with calculations
        const cartItem = {
          meal,
          customizations,
          calculatedPrice: calculatePrice(),
          calculatedNutrition: calculateNutrition(),
          timestamp: new Date()
        }
        
        addToCart(cartItem)
      }}
    />
  )
}
```

## 3. Advanced Tooltip System

### Nutritional Information Tooltip

```typescript
import React from 'react'
import { NutritionTooltip, type NutritionData } from '@/components/ui/advanced-tooltip'

const MealNutritionBadge = ({ 
  nutritionData, 
  showDetailed = false 
}: { 
  nutritionData: NutritionData
  showDetailed?: boolean 
}) => {
  return (
    <NutritionTooltip 
      nutritionData={nutritionData}
      showOnHover={!showDetailed}
      showOnClick={showDetailed}
    >
      <button className="inline-flex items-center space-x-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
        <span>📊</span>
        <span>Nutrition</span>
        {showDetailed && <span className="text-[10px]">👆</span>}
      </button>
    </NutritionTooltip>
  )
}

// Usage in meal cards
const EnhancedMealCard = ({ meal }: { meal: MealItem }) => (
  <div className="meal-card">
    {/* ... other card content */}
    
    <div className="flex items-center space-x-2">
      {/* Nutrition tooltip */}
      <MealNutritionBadge 
        nutritionData={meal.nutrition}
        showDetailed={true} // Mobile will show modal
      />
      
      {/* Allergen tooltip */}
      {meal.allergens.length > 0 && (
        <AllergenTooltip 
          allergens={meal.allergens.map(allergen => ({
            allergen,
            severity: 'moderate' as const,
            icon: getAllergenIcon(allergen)
          }))}
        >
          <button className="inline-flex items-center space-x-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            <span>⚠️</span>
            <span>{meal.allergens.length} allergen{meal.allergens.length > 1 ? 's' : ''}</span>
          </button>
        </AllergenTooltip>
      )}
    </div>
  </div>
)
```

### Contextual Help Tooltips

```typescript
const FormWithTooltips = () => (
  <form className="space-y-4">
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Dietary Restrictions</label>
        <QuickTooltip 
          content="Select any dietary preferences or restrictions. This helps us recommend suitable meals and filter out items you cannot eat."
          side="right"
        >
          <button type="button" className="text-slate-400 hover:text-slate-600">
            <Info className="h-4 w-4" />
          </button>
        </QuickTooltip>
      </div>
      
      {/* Form input */}
      <select className="w-full rounded-md border border-slate-300 px-3 py-2">
        <option value="">Select dietary preferences...</option>
        <option value="vegetarian">Vegetarian</option>
        <option value="vegan">Vegan</option>
        <option value="gluten-free">Gluten-Free</option>
      </select>
    </div>
  </form>
)
```

## 4. Smart Popover Implementation

### Meal Quick Actions

```typescript
import { MealQuickActions } from '@/components/ui/smart-popover'

const MealCardWithActions = ({ meal }: { meal: MealItem }) => {
  const [isFavorite, setIsFavorite] = useState(false)

  const handleFavoriteToggle = (mealId: string) => {
    setIsFavorite(!isFavorite)
    // API call to update favorites
  }

  const handleShare = async (mealId: string, mealName: string) => {
    if (navigator.share) {
      await navigator.share({
        title: mealName,
        text: `Check out this delicious ${mealName} from HASIVU!`,
        url: `${window.location.origin}/meals/${mealId}`
      })
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/meals/${mealId}`)
      toast.success('Link copied to clipboard!')
    }
  }

  return (
    <div className="meal-card relative">
      {/* Card content */}
      
      {/* Quick actions menu */}
      <MealQuickActions
        mealId={meal.id}
        mealName={meal.name}
        isFavorite={isFavorite}
        onFavoriteToggle={handleFavoriteToggle}
        onViewNutrition={(mealId) => {
          // Open nutrition modal or navigate to nutrition page
          setShowNutritionModal(true)
        }}
        onShare={handleShare}
        onReport={(mealId) => {
          // Open report issue form
          setShowReportModal(true)
        }}
      >
        <button className="absolute top-2 right-2 p-1 rounded-full bg-white/80 hover:bg-white shadow-sm">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </MealQuickActions>
    </div>
  )
}
```

### Profile Switcher for Parents

```typescript
import { ProfileSwitcher, type ChildProfile } from '@/components/ui/smart-popover'

const ParentDashboardHeader = () => {
  const [currentProfile, setCurrentProfile] = useState<ChildProfile>()
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([])

  const handleProfileSwitch = (profileId: string) => {
    const profile = childProfiles.find(p => p.id === profileId)
    setCurrentProfile(profile)
    
    // Update global state/context
    setActiveChild(profile)
    
    // Analytics tracking
    analytics.track('Profile Switched', { profileId, parentId: user.id })
  }

  const handleAddFunds = (profileId: string) => {
    // Navigate to add funds page with pre-selected child
    router.push(`/add-funds?child=${profileId}`)
  }

  return (
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">Manage your children's meals</p>
      </div>

      <ProfileSwitcher
        currentProfile={currentProfile}
        profiles={childProfiles}
        onProfileSwitch={handleProfileSwitch}
        onAddFunds={handleAddFunds}
        onManageProfiles={() => router.push('/manage-profiles')}
      >
        <button className="flex items-center space-x-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
          <img
            src={currentProfile?.avatar}
            alt={currentProfile?.name}
            className="h-6 w-6 rounded-full"
          />
          <span>{currentProfile?.name}</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </ProfileSwitcher>
    </header>
  )
}
```

## 5. Loading States Implementation

### Dashboard with Progressive Loading

```typescript
import { DashboardSkeleton, BrandedSpinner } from '@/components/ui/loading-states'

const StudentDashboard = () => {
  const { data: dashboardData, isLoading, error } = useDashboardData()

  if (isLoading) {
    return <DashboardSkeleton role="student" />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">😞</div>
          <h2 className="text-xl font-semibold mb-2">Oops! Something went wrong</h2>
          <p className="text-slate-600 mb-4">We couldn't load your dashboard</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard content */}
    </div>
  )
}
```

### Order Status with Real-time Updates

```typescript
import { OrderStatusLoading } from '@/components/ui/loading-states'

const OrderTrackingPage = ({ orderId }: { orderId: string }) => {
  const [orderStatus, setOrderStatus] = useState<{
    status: 'received' | 'preparing' | 'ready' | 'delivering'
    estimatedTime: number
  }>()

  // Real-time order updates
  useEffect(() => {
    const socket = io()
    socket.on(`order-${orderId}`, (update) => {
      setOrderStatus(update)
    })
    return () => socket.disconnect()
  }, [orderId])

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Order Tracking</h1>
      
      <div className="max-w-2xl mx-auto">
        {orderStatus && (
          <OrderStatusLoading
            currentStep={orderStatus.status}
            estimatedTime={orderStatus.estimatedTime}
          />
        )}
        
        {/* Additional order details */}
        <div className="mt-8 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">Order Details</h3>
          {/* Order items */}
        </div>
      </div>
    </div>
  )
}
```

## 6. Multi-Step Form Implementation

### Enhanced Order Form with Validation

```typescript
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const orderSchema = z.object({
  meal: z.string().min(1, 'Please select a meal'),
  portion: z.enum(['small', 'regular', 'large']),
  addOns: z.array(z.string()),
  deliveryTime: z.string().min(1, 'Please select a delivery time'),
  specialInstructions: z.string().max(500, 'Instructions too long')
})

type OrderFormData = z.infer<typeof orderSchema>

const MultiStepOrderForm = ({ meal }: { meal: MealItem }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      meal: meal.id,
      portion: 'regular',
      addOns: [],
      deliveryTime: '',
      specialInstructions: ''
    }
  })

  const steps = [
    { title: 'Choose Portion', fields: ['portion'] },
    { title: 'Add-ons', fields: ['addOns'] },
    { title: 'Delivery', fields: ['deliveryTime'] },
    { title: 'Review', fields: ['specialInstructions'] }
  ]

  const nextStep = async () => {
    const fieldsToValidate = steps[currentStep].fields
    const isValid = await form.trigger(fieldsToValidate as any)
    
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const onSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    try {
      await submitOrder(data)
      toast.success('Order placed successfully!')
      router.push('/orders')
    } catch (error) {
      toast.error('Failed to place order')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                index <= currentStep
                  ? "bg-primary-600 text-white"
                  : "bg-slate-200 text-slate-600"
              )}>
                {index + 1}
              </div>
              <div className="ml-2 text-sm font-medium text-slate-900">
                {step.title}
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "mx-4 h-0.5 w-12",
                  index < currentStep ? "bg-primary-600" : "bg-slate-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Steps */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && (
              <PortionSelectionStep control={form.control} />
            )}
            {currentStep === 1 && (
              <AddOnsSelectionStep control={form.control} meal={meal} />
            )}
            {currentStep === 2 && (
              <DeliveryTimeStep control={form.control} />
            )}
            {currentStep === 3 && (
              <ReviewStep form={form} meal={meal} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-slate-600 disabled:opacity-50"
          >
            Previous
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <BrandedSpinner size="sm" />
                  <span>Placing Order...</span>
                </div>
              ) : (
                'Place Order'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
```

## 7. Responsive Design Patterns

### Mobile-First Component Structure

```typescript
// Use Tailwind's responsive prefixes for mobile-first design
const ResponsiveMealGrid = ({ meals }: { meals: MealItem[] }) => (
  <div className="
    grid gap-4
    grid-cols-1 
    sm:grid-cols-2 
    lg:grid-cols-3 
    xl:grid-cols-4
    2xl:grid-cols-5
  ">
    {meals.map(meal => (
      <MealCard key={meal.id} meal={meal} />
    ))}
  </div>
)

// Mobile navigation with bottom tabs
const MobileNavigation = () => (
  <nav className="
    fixed bottom-0 left-0 right-0 
    bg-white border-t border-slate-200 
    safe-area-pb
    md:hidden
  ">
    <div className="grid grid-cols-4 gap-1">
      {navigationItems.map(item => (
        <NavigationItem key={item.id} {...item} />
      ))}
    </div>
  </nav>
)

// Adaptive layout based on screen size
const AdaptiveDashboard = () => {
  const [isMobile] = useMediaQuery('(max-width: 768px)')
  
  return (
    <div className={cn(
      "container mx-auto px-4 py-6",
      isMobile ? "pb-20" : "pb-6" // Account for bottom navigation
    )}>
      {isMobile ? (
        <MobileDashboardLayout />
      ) : (
        <DesktopDashboardLayout />
      )}
    </div>
  )
}
```

### Touch-Friendly Interactions

```typescript
// Ensure minimum touch target sizes
const TouchFriendlyButton = ({ children, ...props }) => (
  <button
    className="
      min-h-touch-target min-w-touch-target
      touch-manipulation
      active:scale-95 transition-transform
      rounded-lg px-4 py-2
      hover:no-hover:bg-slate-100
      focus:outline-none focus:ring-2 focus:ring-primary-500
    "
    {...props}
  >
    {children}
  </button>
)

// Swipe gestures for mobile
const SwipeableCard = ({ children, onSwipeLeft, onSwipeRight }) => {
  const [dragX, setDragX] = useState(0)
  
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -100, right: 100 }}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={() => {
        if (dragX > 50 && onSwipeRight) onSwipeRight()
        if (dragX < -50 && onSwipeLeft) onSwipeLeft()
        setDragX(0)
      }}
      className="touch-pan-y relative"
    >
      {children}
    </motion.div>
  )
}
```

## 8. Accessibility Implementation

### Screen Reader Support

```typescript
// Proper ARIA labels and roles
const AccessibleMealCard = ({ meal }: { meal: MealItem }) => (
  <article 
    className="meal-card"
    aria-labelledby={`meal-${meal.id}-title`}
    aria-describedby={`meal-${meal.id}-description`}
  >
    <h3 id={`meal-${meal.id}-title`} className="sr-only">
      {meal.name} - ₹{meal.price}
    </h3>
    
    <div id={`meal-${meal.id}-description`} className="sr-only">
      {meal.description}. 
      Preparation time: {meal.preparationTime} minutes. 
      Rating: {meal.rating} out of 5 stars.
      {meal.allergens.length > 0 && ` Contains allergens: ${meal.allergens.join(', ')}.`}
    </div>
    
    <button
      aria-label={`Add ${meal.name} to cart for ₹${meal.price}`}
      className="add-to-cart-button"
    >
      Add to Cart
    </button>
  </article>
)

// Live regions for dynamic updates
const LiveRegion = ({ children, type = 'polite' }: { 
  children: React.ReactNode
  type?: 'polite' | 'assertive' 
}) => (
  <div
    aria-live={type}
    aria-atomic="true"
    className="sr-only"
  >
    {children}
  </div>
)

// Usage for order status updates
const OrderStatusUpdate = ({ status }) => (
  <LiveRegion type="polite">
    Order status updated to {status}
  </LiveRegion>
)
```

### Keyboard Navigation

```typescript
// Focus management for modals
const useModal = () => {
  const [isOpen, setIsOpen] = useState(false)
  const previousFocus = useRef<HTMLElement>()
  
  const openModal = () => {
    previousFocus.current = document.activeElement as HTMLElement
    setIsOpen(true)
  }
  
  const closeModal = () => {
    setIsOpen(false)
    previousFocus.current?.focus()
  }
  
  // Trap focus within modal
  const trapFocus = (event: KeyboardEvent) => {
    if (!isOpen) return
    
    const modal = document.querySelector('[role="dialog"]')
    const focusableElements = modal?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (!focusableElements) return
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    
    if (event.key === 'Tab') {
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }
  }
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', trapFocus)
      return () => document.removeEventListener('keydown', trapFocus)
    }
  }, [isOpen])
  
  return { isOpen, openModal, closeModal }
}
```

This implementation guide provides practical, production-ready examples of how to use the advanced ShadCN components designed for the HASIVU platform. Each example includes proper TypeScript typing, accessibility considerations, and mobile-first responsive design patterns.