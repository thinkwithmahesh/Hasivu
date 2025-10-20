'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ShoppingCart, Plus, Minus, AlertTriangle, Info } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { menuService } from '@/services/menu.service';
import { nutritionApi, calculateTrafficLight, convertToPer100g } from '@/services/nutrition.service';
import type { Menu, MenuItem, MealType } from '@/services/menu.service';
import type { NutritionalInfo, AllergenType, DietaryInfo, TrafficLightColor } from '@/services/nutrition.service';

// ============================================================================
// Type Definitions
// ============================================================================

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  nutritionInfo?: NutritionalInfo;
}

type DietaryFilter = keyof DietaryInfo;

interface MenuBrowserProps {
  schoolId?: string;
  onAddToCart?: (item: MenuItem, quantity: number) => void;
  initialDate?: string;
  className?: string;
}

// ============================================================================
// Allergen Icons & Constants
// ============================================================================

const ALLERGEN_ICONS: Record<AllergenType, string> = {
  milk: '🥛',
  eggs: '🥚',
  fish: '🐟',
  shellfish: '🦐',
  tree_nuts: '🌰',
  peanuts: '🥜',
  wheat: '🌾',
  soy: '🫘',
  sesame: '🫘'
};

const ALLERGEN_LABELS: Record<AllergenType, string> = {
  milk: 'Milk',
  eggs: 'Eggs',
  fish: 'Fish',
  shellfish: 'Shellfish',
  tree_nuts: 'Tree Nuts',
  peanuts: 'Peanuts',
  wheat: 'Wheat',
  soy: 'Soy',
  sesame: 'Sesame'
};

const TRAFFIC_LIGHT_COLORS = {
  green: '#4CAF50',
  yellow: '#f59e0b',
  red: '#dc2626'
};

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snack: 'Snack',
  dinner: 'Dinner'
};

const DIETARY_FILTER_OPTIONS: Array<{ key: DietaryFilter; label: string; icon: string }> = [
  { key: 'vegetarian', label: 'Vegetarian', icon: '🥗' },
  { key: 'vegan', label: 'Vegan', icon: '🌱' },
  { key: 'glutenFree', label: 'Gluten-Free', icon: '🌾' },
  { key: 'dairyFree', label: 'Dairy-Free', icon: '🥛' },
  { key: 'nutFree', label: 'Nut-Free', icon: '🌰' },
  { key: 'halal', label: 'Halal', icon: '☪️' },
  { key: 'kosher', label: 'Kosher', icon: '✡️' }
];

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Traffic Light Badge Component
 * Shows red/yellow/green health indicator
 */
interface TrafficLightBadgeProps {
  rating: TrafficLightColor;
  className?: string;
}

const TrafficLightBadge: React.FC<TrafficLightBadgeProps> = ({ rating, className }) => {
  const bgColor = TRAFFIC_LIGHT_COLORS[rating];
  const label = rating === 'green' ? 'Healthy' : rating === 'yellow' ? 'Moderate' : 'Occasional';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white',
        className
      )}
      style={{ backgroundColor: bgColor }}
      role="status"
      aria-label={`Nutrition rating: ${label}`}
    >
      <div className="w-2 h-2 rounded-full bg-white/80" />
      <span>{label}</span>
    </div>
  );
};

/**
 * Compact Nutrition Display Component
 */
interface NutritionCompactProps {
  nutrition: NutritionalInfo;
  className?: string;
}

const NutritionCompact: React.FC<NutritionCompactProps> = ({ nutrition, className }) => {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs', className)}>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">🔥</span>
        <span className="font-medium">{nutrition.calories}</span>
        <span className="text-muted-foreground">cal</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">💪</span>
        <span className="font-medium">{nutrition.macronutrients.protein}g</span>
        <span className="text-muted-foreground">protein</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">🌾</span>
        <span className="font-medium">{nutrition.macronutrients.carbohydrates}g</span>
        <span className="text-muted-foreground">carbs</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-muted-foreground">🥑</span>
        <span className="font-medium">{nutrition.macronutrients.totalFat}g</span>
        <span className="text-muted-foreground">fat</span>
      </div>
    </div>
  );
};

/**
 * Allergen Badges Component
 */
interface AllergenBadgesProps {
  allergens: Array<{ type: AllergenType; present: boolean; mayContain: boolean }>;
  className?: string;
}

const AllergenBadges: React.FC<AllergenBadgesProps> = ({ allergens, className }) => {
  const presentAllergens = allergens.filter(a => a.present);
  const mayContainAllergens = allergens.filter(a => a.mayContain && !a.present);

  if (presentAllergens.length === 0 && mayContainAllergens.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {presentAllergens.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" aria-hidden="true" />
          {presentAllergens.map(allergen => (
            <Badge
              key={allergen.type}
              variant="destructive"
              className="text-xs"
              aria-label={`Contains ${ALLERGEN_LABELS[allergen.type]}`}
            >
              {ALLERGEN_ICONS[allergen.type]} {ALLERGEN_LABELS[allergen.type]}
            </Badge>
          ))}
        </div>
      )}
      {mayContainAllergens.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <Info className="h-3 w-3 text-yellow-500 flex-shrink-0" aria-hidden="true" />
          {mayContainAllergens.map(allergen => (
            <Badge
              key={allergen.type}
              variant="outline"
              className="text-xs border-yellow-400 text-yellow-700"
              aria-label={`May contain ${ALLERGEN_LABELS[allergen.type]}`}
            >
              {ALLERGEN_ICONS[allergen.type]} May contain {ALLERGEN_LABELS[allergen.type]}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Dietary Tags Component
 */
interface DietaryTagsProps {
  dietaryInfo: DietaryInfo;
  className?: string;
}

const DietaryTags: React.FC<DietaryTagsProps> = ({ dietaryInfo, className }) => {
  const activeTags = DIETARY_FILTER_OPTIONS.filter(option => dietaryInfo[option.key]);

  if (activeTags.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {activeTags.map(tag => (
        <Badge
          key={tag.key}
          variant="secondary"
          className="text-xs bg-hasivu-green-100 text-hasivu-green-800 border-hasivu-green-200"
        >
          {tag.icon} {tag.label}
        </Badge>
      ))}
    </div>
  );
};

/**
 * Quantity Selector Component
 */
interface QuantitySelectorProps {
  quantity: number;
  maxQuantity?: number;
  onIncrease: () => void;
  onDecrease: () => void;
  onAdd: () => void;
  className?: string;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  maxQuantity = 10,
  onIncrease,
  onDecrease,
  onAdd,
  className
}) => {
  if (quantity === 0) {
    return (
      <Button
        onClick={onAdd}
        size="sm"
        className={cn(
          'w-full bg-hasivu-orange-500 hover:bg-hasivu-orange-600 text-white min-h-touch-target',
          className
        )}
        aria-label="Add to cart"
      >
        <ShoppingCart className="h-4 w-4 mr-2" aria-hidden="true" />
        Add to Cart
      </Button>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Button
        onClick={onDecrease}
        size="sm"
        variant="outline"
        className="min-w-touch-target min-h-touch-target"
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </Button>
      <span className="font-semibold text-lg min-w-[2rem] text-center" aria-live="polite">
        {quantity}
      </span>
      <Button
        onClick={onIncrease}
        size="sm"
        variant="outline"
        className="min-w-touch-target min-h-touch-target"
        disabled={quantity >= maxQuantity}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
};

/**
 * Menu Item Card Component
 */
interface MenuItemCardProps {
  item: MenuItem;
  nutritionInfo?: NutritionalInfo;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  className?: string;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  nutritionInfo,
  quantity,
  onQuantityChange,
  className
}) => {
  const trafficLight = useMemo(() => {
    if (!nutritionInfo) return null;

    const { macronutrients, micronutrients, servingSizeGrams } = nutritionInfo;

    const fatPer100g = convertToPer100g(macronutrients.totalFat, servingSizeGrams);
    const saturatedFatPer100g = convertToPer100g(macronutrients.saturatedFat, servingSizeGrams);
    const sugarsPer100g = convertToPer100g(macronutrients.sugars, servingSizeGrams);
    const sodiumPer100g = (micronutrients.sodium / servingSizeGrams) * 100 / 1000; // Convert mg to g

    const ratings = {
      fat: calculateTrafficLight.fat(fatPer100g),
      saturatedFat: calculateTrafficLight.saturatedFat(saturatedFatPer100g),
      sugars: calculateTrafficLight.sugars(sugarsPer100g),
      sodium: calculateTrafficLight.sodium(sodiumPer100g),
      calories: calculateTrafficLight.calories(nutritionInfo.calories)
    };

    return calculateTrafficLight.overall(ratings);
  }, [nutritionInfo]);

  return (
    <Card
      className={cn(
        'group overflow-hidden hover:shadow-lg transition-all duration-200',
        className
      )}
    >
      {item.imageUrl && (
        <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {!item.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-sm">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Title and Price */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-2 text-ink-900">
              {item.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xl font-bold text-hasivu-orange-600">
              ₹{item.price}
            </div>
            {item.preparationTime && (
              <div className="text-xs text-muted-foreground">
                ~{item.preparationTime}min
              </div>
            )}
          </div>
        </div>

        {/* Traffic Light Rating */}
        {trafficLight && (
          <TrafficLightBadge rating={trafficLight} />
        )}

        {/* Compact Nutrition */}
        {nutritionInfo && (
          <NutritionCompact nutrition={nutritionInfo} />
        )}

        {/* Allergen Warnings */}
        {item.allergens && item.allergens.length > 0 && (
          <AllergenBadges allergens={item.allergens} />
        )}

        {/* Dietary Tags */}
        {item.dietaryInfo && (
          <DietaryTags dietaryInfo={item.dietaryInfo} />
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {item.servingSize}
        </div>
        <QuantitySelector
          quantity={quantity}
          maxQuantity={item.maxQuantity}
          onIncrease={() => onQuantityChange(quantity + 1)}
          onDecrease={() => onQuantityChange(quantity - 1)}
          onAdd={() => onQuantityChange(1)}
          className="flex-shrink-0"
        />
      </CardFooter>
    </Card>
  );
};

/**
 * Loading Skeleton Component
 */
const MenuItemSkeleton: React.FC = () => (
  <Card className="overflow-hidden">
    <Skeleton className="h-48 sm:h-56 w-full" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-4 gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

// ============================================================================
// Main MenuBrowser Component
// ============================================================================

export const MenuBrowser: React.FC<MenuBrowserProps> = ({
  schoolId,
  onAddToCart,
  initialDate,
  className
}) => {
  // State management
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [dietaryFilters, setDietaryFilters] = useState<Set<DietaryFilter>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [nutritionData, setNutritionData] = useState<Map<string, NutritionalInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch today's menus
  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setLoading(true);
        setError(null);

        const date = initialDate || new Date().toISOString().split('T')[0];
        const result = await menuService.listMenus({
          date,
          active: true,
          schoolId,
          status: ['published', 'active']
        });

        setMenus(result.menus as Menu[]);

        // Fetch full menu details with items for each menu
        const fullMenus = await Promise.all(
          result.menus.map(menu => menuService.getMenu(menu.id))
        );

        setMenus(fullMenus);

        // Fetch nutrition info for all items
        const nutritionPromises = fullMenus.flatMap(menu =>
          menu.items.map(async item => {
            try {
              const response = await nutritionApi.getNutritionInfo(item.id);
              return { itemId: item.id, nutrition: response.data };
            } catch (err) {
              console.error(`Failed to fetch nutrition for item ${item.id}:`, err);
              return null;
            }
          })
        );

        const nutritionResults = await Promise.all(nutritionPromises);
        const nutritionMap = new Map<string, NutritionalInfo>();
        nutritionResults.forEach(result => {
          if (result) {
            nutritionMap.set(result.itemId, result.nutrition);
          }
        });
        setNutritionData(nutritionMap);
      } catch (err) {
        console.error('Failed to fetch menus:', err);
        setError('Unable to load menus. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMenus();
  }, [schoolId, initialDate]);

  // Filter menu items
  const filteredItems = useMemo(() => {
    const menu = menus.find(m => m.mealType === selectedMealType);
    if (!menu) return [];

    let items = menu.items;

    // Apply dietary filters
    if (dietaryFilters.size > 0) {
      items = items.filter(item => {
        return Array.from(dietaryFilters).every(filter => item.dietaryInfo[filter]);
      });
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.ingredients.some(ing => ing.toLowerCase().includes(query))
        );
      });
    }

    return items;
  }, [menus, selectedMealType, dietaryFilters, searchQuery]);

  // Toggle dietary filter
  const toggleDietaryFilter = (filter: DietaryFilter) => {
    setDietaryFilters(prev => {
      const newFilters = new Set(prev);
      if (newFilters.has(filter)) {
        newFilters.delete(filter);
      } else {
        newFilters.add(filter);
      }
      return newFilters;
    });
  };

  // Update cart quantity
  const updateCartQuantity = (itemId: string, quantity: number) => {
    setCart(prev => {
      const newCart = new Map(prev);
      if (quantity <= 0) {
        newCart.delete(itemId);
      } else {
        newCart.set(itemId, quantity);
      }
      return newCart;
    });

    // Call parent callback if provided
    if (onAddToCart && quantity > 0) {
      const item = filteredItems.find(i => i.id === itemId);
      if (item) {
        onAddToCart(item, quantity);
      }
    }
  };

  // Cart total count
  const cartCount = useMemo(() => {
    return Array.from(cart.values()).reduce((sum, qty) => sum + qty, 0);
  }, [cart]);

  // Render
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ink-900">
              Today's Menu
            </h1>
            <p className="text-muted-foreground mt-1">
              Fresh, healthy meals for your child
            </p>
          </div>
          {cartCount > 0 && (
            <Badge className="bg-hasivu-orange-500 text-white text-lg px-4 py-2">
              <ShoppingCart className="h-5 w-5 mr-2" aria-hidden="true" />
              {cartCount} {cartCount === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Search menu items, ingredients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 min-h-touch-target"
            aria-label="Search menu items"
          />
        </div>

        {/* Dietary Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span>Dietary Preferences</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {DIETARY_FILTER_OPTIONS.map(option => (
              <Button
                key={option.key}
                onClick={() => toggleDietaryFilter(option.key)}
                variant={dietaryFilters.has(option.key) ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'min-h-touch-target',
                  dietaryFilters.has(option.key) &&
                    'bg-hasivu-green-500 hover:bg-hasivu-green-600 text-white'
                )}
                aria-pressed={dietaryFilters.has(option.key)}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Meal Type Tabs */}
      <Tabs
        value={selectedMealType}
        onValueChange={(value) => setSelectedMealType(value as MealType)}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto min-h-touch-target">
          {Object.entries(MEAL_TYPE_LABELS).map(([type, label]) => (
            <TabsTrigger
              key={type}
              value={type}
              className="min-h-touch-target"
              aria-label={`View ${label} menu`}
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Error State */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MenuItemSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-ink-900 mb-2">
            No menu items available
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || dietaryFilters.size > 0
              ? 'Try adjusting your filters or search query'
              : 'Check back later for today\'s menu'}
          </p>
        </div>
      )}

      {/* Menu Items Grid */}
      {!loading && !error && filteredItems.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          role="list"
          aria-label="Menu items"
        >
          {filteredItems.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              nutritionInfo={nutritionData.get(item.id)}
              quantity={cart.get(item.id) || 0}
              onQuantityChange={(quantity) => updateCartQuantity(item.id, quantity)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MenuBrowser;
