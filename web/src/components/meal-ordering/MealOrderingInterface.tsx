/**
 * MealOrderingInterface - Main Component
 * Complete school meal ordering interface with all features integrated
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter as Filter,
  SortAsc as SortAsc,
  Heart,
  ShoppingCart,
  Smartphone,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button as Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert as Alert, AlertDescription as AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Import our custom components
import MealCard from './MealCard';
import CategoryTabs from './CategoryTabs';
import OrderSummary from './OrderSummary';
import RFIDInterface from './RFIDInterface';

// Import types and utilities
import type {
  MealItem,
  StudentInfo,
  OrderItem,
  MenuCategory,
  DeliverySlot,
  OrderSummary as OrderSummaryType,
  MealOrderForm,
  SchoolMealConfig,
} from './types';
import {
  formatCurrency,
  isMealSuitableForStudent,
  getMealRecommendations,
  calculateOrderSummary,
} from './utils';

// Import constants
import { MEAL_TYPES, DIETARY_PREFERENCES, SPICE_LEVELS } from '@/utils/constants';

interface MealOrderingInterfaceProps {
  studentInfo: StudentInfo;
  schoolConfig: SchoolMealConfig;
  onOrderPlaced: (orderData: any) => Promise<void>;
  onRFIDScan?: (cardId: string) => Promise<void>;
}

const MealOrderingInterface: React.FC<MealOrderingInterfaceProps> = ({
  studentInfo,
  schoolConfig: _schoolConfig,
  onOrderPlaced,
  onRFIDScan,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('menu');
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [filterDietary, setFilterDietary] = useState<string>('all');
  const [cart, setCart] = useState<
    { mealItem: MealItem; quantity: number; selectedDeliveryTime: string }[]
  >([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [selectedDeliverySlot, setSelectedDeliverySlot] = useState<DeliverySlot | null>(null);

  // Mock data - in real app, this would come from API
  const [meals, setMeals] = useState<MealItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [_deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [pendingOrders, _setPendingOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize with mock data
  useEffect(() => {
    initializeMockData();
  }, []);

  const initializeMockData = () => {
    // Mock categories
    const mockCategories: MenuCategory[] = [
      {
        id: 'breakfast',
        name: 'Breakfast',
        mealType: 'breakfast',
        description: 'Start your day with nutritious breakfast options',
        icon: '☕',
        isActive: true,
        sortOrder: 1,
      },
      {
        id: 'lunch',
        name: 'Lunch',
        mealType: 'lunch',
        description: 'Hearty and filling lunch meals',
        icon: '🍽️',
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'snacks',
        name: 'Snacks',
        mealType: 'snacks',
        description: 'Quick and tasty snacks',
        icon: '🍪',
        isActive: true,
        sortOrder: 3,
      },
      {
        id: 'dinner',
        name: 'Dinner',
        mealType: 'dinner',
        description: 'Light and healthy dinner options',
        icon: '🌙',
        isActive: true,
        sortOrder: 4,
      },
    ];

    // Mock meals
    const mockMeals: MealItem[] = [
      {
        id: 'meal-1',
        name: 'Vegetable Sandwich',
        description: 'Fresh vegetables with whole wheat bread and mint chutney',
        category: 'breakfast',
        price: 45,
        originalPrice: 50,
        imageUrl: '/images/meals/veg-sandwich.jpg',
        isAvailable: true,
        preparationTime: 10,
        servingSize: '2 pieces',
        dietaryType: 'vegetarian',
        allergens: [],
        spiceLevel: 'mild',
        isGlutenFree: false,
        isDiabeticFriendly: true,
        isJainFood: true,
        nutritionalInfo: {
          calories: 280,
          protein: 8,
          carbohydrates: 45,
          fat: 6,
          fiber: 4,
          sugar: 8,
          sodium: 320,
        },
        maxQuantityPerStudent: 2,
        rating: 4.3,
        tags: ['healthy', 'fresh', 'popular'],
        availability: {
          isAvailable: true,
          maxQuantity: 2,
        },
        vendor: {
          id: 'vendor-1',
          name: 'Fresh Foods',
          rating: 4.3,
          certifications: ['FSSAI'],
          contactInfo: {},
        },
      },
      {
        id: 'meal-2',
        name: 'Dal Rice Bowl',
        description: 'Nutritious lentil curry with steamed rice and pickle',
        category: 'lunch',
        price: 85,
        imageUrl: '/images/meals/dal-rice.jpg',
        isAvailable: true,
        preparationTime: 15,
        servingSize: '1 bowl',
        dietaryType: 'vegetarian',
        allergens: [],
        spiceLevel: 'medium',
        isGlutenFree: true,
        isDiabeticFriendly: false,
        isJainFood: true,
        nutritionalInfo: {
          calories: 420,
          protein: 18,
          carbohydrates: 65,
          fat: 8,
          fiber: 6,
          sugar: 4,
          sodium: 480,
        },
        maxQuantityPerStudent: 2,
        rating: 4.6,
        tags: ['traditional', 'protein-rich', 'comfort-food'],
        availability: {
          isAvailable: true,
          maxQuantity: 2,
        },
        vendor: {
          id: 'vendor-2',
          name: 'Traditional Foods',
          rating: 4.6,
          certifications: ['FSSAI'],
          contactInfo: {},
        },
      },
      {
        id: 'meal-3',
        name: 'Fresh Fruit Bowl',
        description: 'Seasonal fresh fruits with honey and nuts',
        category: 'snack',
        price: 35,
        imageUrl: '/images/meals/fruit-bowl.jpg',
        isAvailable: true,
        preparationTime: 5,
        servingSize: '1 bowl',
        dietaryType: 'vegan',
        allergens: ['nuts'],
        spiceLevel: 'mild',
        isGlutenFree: true,
        isDiabeticFriendly: true,
        isJainFood: true,
        nutritionalInfo: {
          calories: 150,
          protein: 3,
          carbohydrates: 35,
          fat: 2,
          fiber: 8,
          sugar: 28,
          sodium: 5,
        },
        maxQuantityPerStudent: 3,
        rating: 4.8,
        tags: ['healthy', 'fresh', 'vitamin-rich'],
        availability: {
          isAvailable: true,
          maxQuantity: 3,
        },
        vendor: {
          id: 'vendor-3',
          name: 'Fresh Produce',
          rating: 4.8,
          certifications: ['Organic'],
          contactInfo: {},
        },
      },
    ];

    // Mock delivery slots
    const mockSlots: DeliverySlot[] = [
      {
        id: 'slot-1',
        mealType: 'breakfast',
        startTime: '08:00',
        endTime: '09:00',
        isAvailable: true,
        currentOrders: 15,
        maxOrders: 50,
        deliveryLocation: 'Classroom Block A',
      },
      {
        id: 'slot-2',
        mealType: 'lunch',
        startTime: '12:30',
        endTime: '13:30',
        isAvailable: true,
        currentOrders: 32,
        maxOrders: 100,
        deliveryLocation: 'Main Cafeteria',
      },
    ];

    setCategories(mockCategories);
    setMeals(mockMeals);
    setDeliverySlots(mockSlots);
    setActiveCategory(mockCategories[0]?.id || '');
    setSelectedDeliverySlot(mockSlots[0] || null);
    setLoading(false);
  };

  // Filter and sort meals
  const filteredMeals = React.useMemo(() => {
    let filtered = meals;

    // Filter by category
    if (activeCategory) {
      const category = categories.find(cat => cat.id === activeCategory);
      if (category) {
        filtered = filtered.filter(meal => meal.category === category.mealType);
      }
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        meal =>
          meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meal.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          meal.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by dietary preference
    if (filterDietary !== 'all') {
      filtered = filtered.filter(meal => meal.dietaryType === filterDietary);
    }

    // Filter suitable meals for student
    filtered = filtered.filter(meal => isMealSuitableForStudent(meal, studentInfo));

    // Sort meals
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [meals, activeCategory, searchQuery, filterDietary, sortBy, categories, studentInfo]);

  // Get recommended meals
  const recommendedMeals = React.useMemo(() => {
    return getMealRecommendations(meals, studentInfo).slice(0, 3);
  }, [meals, studentInfo]);

  // Calculate order summary
  const orderSummary: OrderSummaryType | null = React.useMemo(() => {
    if (cart.length === 0 || !selectedDeliverySlot) return null;

    const summary = calculateOrderSummary(cart, selectedDeliverySlot, studentInfo);
    return {
      ...summary,
      selectedDeliverySlot,
      estimatedDeliveryTime: '30 minutes',
    };
  }, [cart, selectedDeliverySlot, studentInfo]);

  // Convert to ShoppingCart format for OrderSummary component
  const shoppingCart: any = React.useMemo(() => {
    if (!orderSummary) return null;
    return {
      items: cart,
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: cart.reduce((sum, item) => sum + item.mealItem.price * item.quantity, 0),
      tax: 0,
      total: cart.reduce((sum, item) => sum + item.mealItem.price * item.quantity, 0),
      estimatedDeliveryTime: '30 minutes',
    };
  }, [cart, orderSummary]);

  // Cart management
  const addToCart = useCallback(
    (meal: MealItem, quantity: number) => {
      setCart(prev => {
        const existingItem = prev.find(item => item.mealItem.id === meal.id);
        if (existingItem) {
          return prev.map(item =>
            item.mealItem.id === meal.id
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + quantity, meal.maxQuantityPerStudent),
                }
              : item
          );
        } else {
          return [
            ...prev,
            {
              mealItem: meal,
              quantity: Math.min(quantity, meal.maxQuantityPerStudent),
              selectedDeliveryTime: selectedDeliverySlot?.startTime || '',
            },
          ];
        }
      });
    },
    [selectedDeliverySlot]
  );

  const updateCartQuantity = useCallback((mealId: string, quantity: number) => {
    setCart(prev => prev.map(item => (item.mealItem.id === mealId ? { ...item, quantity } : item)));
  }, []);

  const removeFromCart = useCallback((mealId: string) => {
    setCart(prev => prev.filter(item => item.mealItem.id !== mealId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Order placement
  const handlePlaceOrder = async (orderData: MealOrderForm) => {
    if (!orderSummary) return;

    setIsPlacingOrder(true);
    try {
      await onOrderPlaced({
        ...orderData,
        items: cart,
        summary: orderSummary,
        studentId: studentInfo.id,
      });
      clearCart();
      setActiveTab('rfid'); // Switch to RFID tab after order
    } catch (error) {
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // View meal details
  const handleViewMealDetails = useCallback((mealId: string) => {
    // This could open a detailed modal or navigate to a detail page
  }, []);

  // Get cart item count and total
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.mealItem.price * item.quantity, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">HASIVU Meal Ordering</h1>
          <p className="text-gray-600">
            Welcome, {studentInfo.name} | Grade {studentInfo.grade}-{studentInfo.section}
          </p>
        </div>

        {/* Wallet Balance */}
        <div className="flex items-center space-x-4">
          <Card className="p-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Wallet Balance:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(studentInfo.walletBalance)}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="menu" className="flex items-center space-x-2">
            <span>🍽️</span>
            <span>Menu</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-red-100 text-red-700">
                {cartItemCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="cart" className="flex items-center space-x-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Cart</span>
            {cart.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {formatCurrency(cartTotal)}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rfid" className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>Pickup</span>
          </TabsTrigger>
        </TabsList>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search meals, ingredients, or tags..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Dietary Filter as Filter */}
                <Select value={filterDietary} onValueChange={setFilterDietary}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Dietary preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Diets</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                    <SelectItem value="jain">Jain</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort By */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popularity">Popularity</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Category Tabs */}
          <CategoryTabs
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            student={studentInfo}
          />

          {/* Recommended Meals */}
          {recommendedMeals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <span>Recommended for You</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recommendedMeals.map(meal => (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      student={studentInfo}
                      onAddToCart={addToCart}
                      onViewDetails={handleViewMealDetails}
                      isInCart={cart.some(item => item.mealItem.id === meal.id)}
                      cartQuantity={cart.find(item => item.mealItem.id === meal.id)?.quantity || 0}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Meal Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeals.map(meal => (
              <MealCard
                key={meal.id}
                meal={meal}
                student={studentInfo}
                onAddToCart={addToCart}
                onViewDetails={handleViewMealDetails}
                isInCart={cart.some(item => item.mealItem.id === meal.id)}
                cartQuantity={cart.find(item => item.mealItem.id === meal.id)?.quantity || 0}
              />
            ))}
          </div>

          {/* No Results */}
          {filteredMeals.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No meals found</h3>
                <p className="text-sm text-gray-500 text-center">
                  Try adjusting your search query or filters to find more meals.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cart Tab */}
        <TabsContent value="cart">
          {shoppingCart && (
            <OrderSummary
              cart={shoppingCart}
              onPlaceOrder={handlePlaceOrder}
              isLoading={isPlacingOrder}
            />
          )}
        </TabsContent>

        {/* RFID Tab */}
        <TabsContent value="rfid">
          <RFIDInterface
            studentInfo={studentInfo}
            pendingOrders={pendingOrders}
            onRFIDScan={onRFIDScan || (() => Promise.resolve())}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MealOrderingInterface;
