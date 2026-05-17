/**
 * Enhanced Meal Ordering Demo Component
 * Comprehensive demonstration of all new ShadCN components working together
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

// Import our new enhanced components
import EnhancedMealList from './EnhancedMealList';
import QuantitySelector from './QuantitySelector';
import RFIDVerification from './RFIDVerification';
import NotificationSystem, { notificationService } from './NotificationSystem';

import type {
  MealItem,
  StudentInfo,
  OrderHistoryItem,
  RFIDPickupInfo,
  OrderSummary as OrderSummary,
} from './types';

// Mock data for demonstration
const mockStudent: StudentInfo = {
  id: 'STU-001',
  name: 'Arjun Patel',
  grade: 8,
  section: 'A',
  rfidCardId: '123456',
  dietaryPreferences: ['vegetarian'],
  allergies: [],
  canOrderWithoutApproval: true,
  maxDailySpend: 500,
  parentApprovalRequired: false,
  schoolId: 'SCH-001',
  rollNumber: '23A001',
  walletBalance: 350.75,
  hasActiveMealPlan: true,
  mealPlanType: 'premium',
};

const mockMeals: MealItem[] = [
  {
    id: 'MEAL-001',
    name: 'Paneer Butter Masala',
    description: 'Rich and creamy paneer curry with aromatic spices, served with naan bread',
    category: 'lunch',
    price: 85,
    originalPrice: 95,
    imageUrl: '/api/placeholder/120/120',
    isAvailable: true,
    preparationTime: 15,
    dietaryType: 'vegetarian',
    allergens: ['dairy'],
    spiceLevel: 'medium',
    isGlutenFree: false,
    isDiabeticFriendly: false,
    nutritionalInfo: {
      calories: 450,
      protein: 18,
      carbohydrates: 35,
      fat: 28,
      fiber: 4,
      sugar: 8,
      sodium: 850,
    },
    gradeAppropriate: [6, 7, 8, 9, 10],
    maxQuantityPerStudent: 3,
    rating: 4.5,
    tags: ['popular', 'protein-rich', 'comfort-food'],
    availability: {
      isAvailable: true,
      maxQuantity: 3,
    },
    vendor: {
      id: 'VENDOR-001',
      name: 'Local Kitchen',
      rating: 4.5,
      certifications: ['FSSAI'],
      contactInfo: {},
    },
  },
  {
    id: 'MEAL-002',
    name: 'Chicken Biryani',
    description: 'Fragrant basmati rice cooked with tender chicken pieces and aromatic spices',
    category: 'lunch',
    price: 120,
    imageUrl: '/api/placeholder/120/120',
    isAvailable: true,
    preparationTime: 20,
    dietaryType: 'non-vegetarian',
    allergens: [],
    spiceLevel: 'spicy',
    isGlutenFree: true,
    isDiabeticFriendly: false,
    nutritionalInfo: {
      calories: 650,
      protein: 35,
      carbohydrates: 75,
      fat: 18,
      fiber: 3,
      sugar: 5,
      sodium: 1200,
    },
    gradeAppropriate: [6, 7, 8, 9, 10],
    maxQuantityPerStudent: 2,
    rating: 4.8,
    tags: ['premium', 'protein-rich', 'spicy'],
    availability: {
      isAvailable: true,
      maxQuantity: 2,
    },
    vendor: {
      id: 'VENDOR-002',
      name: 'Spice Kitchen',
      rating: 4.8,
      certifications: ['FSSAI'],
      contactInfo: {},
    },
  },
  {
    id: 'MEAL-003',
    name: 'Fresh Fruit Salad',
    description: 'Seasonal fresh fruits with honey drizzle and mint leaves',
    category: 'snack',
    price: 45,
    imageUrl: '/api/placeholder/120/120',
    isAvailable: true,
    preparationTime: 5,
    dietaryType: 'vegan',
    allergens: [],
    spiceLevel: 'mild',
    isGlutenFree: true,
    isDiabeticFriendly: true,
    nutritionalInfo: {
      calories: 150,
      protein: 2,
      carbohydrates: 38,
      fat: 1,
      fiber: 6,
      sugar: 32,
      sodium: 5,
    },
    maxQuantityPerStudent: 5,
    rating: 4.2,
    tags: ['healthy', 'refreshing', 'diabetic-friendly'],
    availability: {
      isAvailable: true,
      maxQuantity: 5,
    },
    vendor: {
      id: 'VENDOR-003',
      name: 'Fresh Foods',
      rating: 4.2,
      certifications: ['FSSAI'],
      contactInfo: {},
    },
  },
  {
    id: 'MEAL-004',
    name: 'Masala Dosa',
    description: 'Crispy South Indian crepe with spiced potato filling and coconut chutney',
    category: 'breakfast',
    price: 65,
    imageUrl: '/api/placeholder/120/120',
    isAvailable: false,
    preparationTime: 12,
    dietaryType: 'vegetarian',
    allergens: [],
    spiceLevel: 'medium',
    isGlutenFree: false,
    isDiabeticFriendly: false,
    nutritionalInfo: {
      calories: 380,
      protein: 12,
      carbohydrates: 58,
      fat: 12,
      fiber: 5,
      sugar: 4,
      sodium: 650,
    },
    maxQuantityPerStudent: 3,
    rating: 4.6,
    tags: ['traditional', 'south-indian', 'filling'],
    availability: {
      isAvailable: false,
      maxQuantity: 3,
    },
    vendor: {
      id: 'VENDOR-004',
      name: 'South Indian Kitchen',
      rating: 4.6,
      certifications: ['FSSAI'],
      contactInfo: {},
    },
  },
];

const mockPendingOrders: OrderHistoryItem[] = [
  {
    id: 'ORD-12345',
    orderId: 'ORD-12345',
    studentId: 'STU-001',
    items: [
      {
        mealId: mockMeals[0].id,
        meal: mockMeals[0],
        quantity: 2,
        unitPrice: mockMeals[0].price,
        totalPrice: mockMeals[0].price * 2,
        specialInstructions: 'Less spicy please',
      },
    ],
    totalAmount: 170,
    total: 170,
    orderDate: new Date(),
    deliveryDate: new Date(),
    status: 'ready',
    paymentMethod: 'wallet',
    paymentStatus: 'paid',
  },
];

export function EnhancedMealOrderingDemo() {
  const [activeTab, setActiveTab] = useState('browse');
  const [cartItems, setCartItems] = useState<{ [mealId: string]: number }>({});
  const [selectedMeal, setSelectedMeal] = useState<MealItem | null>(null);
  const [isRFIDVerifying, setIsRFIDVerifying] = useState(false);

  // Calculate cart summary
  const cartSummary = React.useMemo(() => {
    let totalItems = 0;
    let totalAmount = 0;

    Object.entries(cartItems).forEach(([mealId, quantity]) => {
      const meal = mockMeals.find(m => m.id === mealId);
      if (meal && quantity > 0) {
        totalItems += quantity;
        totalAmount += meal.price * quantity;
      }
    });

    return { totalItems, totalAmount };
  }, [cartItems]);

  // Handle adding/removing items from cart
  const handleCartUpdate = useCallback((meal: MealItem, quantityChange: number) => {
    setCartItems(prev => {
      const currentQuantity = prev[meal.id] || 0;
      const newQuantity = Math.max(0, currentQuantity + quantityChange);

      if (newQuantity === 0) {
        const { [meal.id]: _removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [meal.id]: newQuantity,
      };
    });
  }, []);

  const handleMealSelect = useCallback((meal: MealItem) => {
    setSelectedMeal(meal);
    setActiveTab('quantity');
  }, []);

  const handleRFIDVerification = useCallback((rfidInfo: RFIDPickupInfo) => {
    setIsRFIDVerifying(false);
    notificationService.rfidVerification(true, rfidInfo.pickupLocation);

    // Simulate order completion
    setTimeout(() => {
      notificationService.orderStatusUpdate(rfidInfo.orderId, 'delivered');
    }, 2000);
  }, []);

  const handleRFIDError = useCallback((_error: string) => {
    setIsRFIDVerifying(false);
    notificationService.rfidVerification(false);
  }, []);

  const handlePlaceOrder = useCallback(() => {
    if (cartSummary.totalItems === 0) {
      toast.error('Please add items to cart first');
      return;
    }

    if (cartSummary.totalAmount > mockStudent.walletBalance) {
      notificationService.lowBalance(mockStudent.walletBalance, cartSummary.totalAmount);
      return;
    }

    // Simulate order placement
    const orderItems = Object.entries(cartItems)
      .filter(([_, quantity]) => quantity > 0)
      .map(([mealId, _quantity]) => {
        const meal = mockMeals.find(m => m.id === mealId)!;
        return meal.name;
      });

    notificationService.orderPlaced({
      orderId: `ORD-${Date.now()}`,
      items: orderItems,
      total: cartSummary.totalAmount,
    });

    // Clear cart
    setCartItems({});

    // Simulate order status updates
    setTimeout(
      () => notificationService.orderStatusUpdate('ORD-12346', 'confirmed', '15 mins'),
      3000
    );
    setTimeout(() => notificationService.orderStatusUpdate('ORD-12346', 'preparing'), 8000);
    setTimeout(() => notificationService.orderStatusUpdate('ORD-12346', 'ready'), 13000);
  }, [cartItems, cartSummary]);

  // Demo notifications on mount
  useEffect(() => {
    const demoNotifications = () => {
      setTimeout(() => {
        notificationService.specialOffer(
          'Lunch Special: 20% Off!',
          'Get 20% off on all lunch items today',
          'LUNCH20'
        );
      }, 3000);

      setTimeout(() => {
        notificationService.mealRecommendation(
          mockMeals[2],
          'Perfect healthy snack for your afternoon break'
        );
      }, 6000);
    };

    if (process.env.NODE_ENV === 'development') {
      demoNotifications();
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Initialize Notification System */}
      <NotificationSystem student={mockStudent} />

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Enhanced Meal Ordering System
                <Badge variant="secondary">Demo</Badge>
              </CardTitle>
              <CardDescription>
                Demonstrating advanced ShadCN UI components for school food delivery
              </CardDescription>
            </div>

            {/* Cart Summary */}
            <div className="text-right">
              <div className="text-sm text-gray-600">Cart Summary</div>
              <div className="font-semibold">
                {cartSummary.totalItems} items • ₹{cartSummary.totalAmount}
              </div>
              <div className="text-xs text-gray-500">Balance: ₹{mockStudent.walletBalance}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Meals</TabsTrigger>
          <TabsTrigger value="quantity">Quantity Selection</TabsTrigger>
          <TabsTrigger value="rfid">RFID Verification</TabsTrigger>
          <TabsTrigger value="features">Component Features</TabsTrigger>
        </TabsList>

        {/* Browse Meals Tab */}
        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Meal List with ScrollArea & Filters</CardTitle>
              <CardDescription>
                Scroll through meals with advanced filtering using ToggleGroup and Slider
                components. Hover over meal names for nutritional information using HoverCard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedMealList
                meals={mockMeals}
                student={mockStudent}
                onAddToCart={handleCartUpdate}
                onViewDetails={handleMealSelect}
                cartItems={cartItems}
                className="h-[600px]"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quantity Selection Tab */}
        <TabsContent value="quantity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quantity Selector with Slider</CardTitle>
                <CardDescription>
                  Interactive quantity selection with price breakdown and bulk discounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedMeal ? (
                  <QuantitySelector
                    meal={selectedMeal}
                    student={mockStudent}
                    currentQuantity={cartItems[selectedMeal.id] || 0}
                    onQuantityChange={quantity => {
                      setCartItems(prev => ({
                        ...prev,
                        [selectedMeal.id]: quantity,
                      }));
                    }}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">
                      Select a meal from the Browse tab to see quantity selection
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your selected items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(cartItems).filter(([_, quantity]) => quantity > 0).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(cartItems)
                      .filter(([_, quantity]) => quantity > 0)
                      .map(([mealId, quantity]) => {
                        const meal = mockMeals.find(m => m.id === mealId)!;
                        return (
                          <div
                            key={mealId}
                            className="flex items-center justify-between p-2 border rounded"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={meal.imageUrl}
                                alt={meal.name}
                                className="w-8 h-8 rounded object-cover"
                              />
                              <div>
                                <div className="font-medium text-sm">{meal.name}</div>
                                <div className="text-xs text-gray-600">₹{meal.price} each</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">×{quantity}</div>
                              <div className="text-xs text-gray-600">₹{meal.price * quantity}</div>
                            </div>
                          </div>
                        );
                      })}

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{cartSummary.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxes (5%):</span>
                        <span>₹{(cartSummary.totalAmount * 0.05).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t pt-2">
                        <span>Total:</span>
                        <span>₹{(cartSummary.totalAmount * 1.05).toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handlePlaceOrder}
                      className="w-full"
                      disabled={cartSummary.totalAmount > mockStudent.walletBalance}
                    >
                      Place Order
                    </Button>

                    {cartSummary.totalAmount > mockStudent.walletBalance && (
                      <div className="text-sm text-red-600 text-center">
                        Insufficient balance. Add ₹
                        {(cartSummary.totalAmount - mockStudent.walletBalance).toFixed(2)} to
                        wallet.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-sm">No items in cart</div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* RFID Verification Tab */}
        <TabsContent value="rfid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RFID Verification with InputOTP</CardTitle>
              <CardDescription>
                Multi-step verification process using OTP inputs for RFID card, security code, and
                location verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RFIDVerification
                studentInfo={mockStudent}
                pendingOrders={mockPendingOrders}
                onVerificationComplete={handleRFIDVerification}
                onVerificationFailed={handleRFIDError}
                isScanning={isRFIDVerifying}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ScrollArea</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>✅ Smooth scrolling meal lists</p>
                  <p>✅ Custom scrollbar styling</p>
                  <p>✅ Touch-friendly mobile scrolling</p>
                  <p>✅ Nutritional information panels</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Slider</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>✅ Quantity selection</p>
                  <p>✅ Price range filtering</p>
                  <p>✅ Responsive touch controls</p>
                  <p>✅ Real-time price calculation</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sonner Toasts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>✅ Order status notifications</p>
                  <p>✅ Payment confirmations</p>
                  <p>✅ Special offers</p>
                  <p>✅ Sound notifications</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ToggleGroup</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>✅ Dietary preference filters</p>
                  <p>✅ Spice level selection</p>
                  <p>✅ Multi-select options</p>
                  <p>✅ Quick filter toggles</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">HoverCard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>✅ Meal nutritional previews</p>
                  <p>✅ User information display</p>
                  <p>✅ Quick details on hover</p>
                  <p>✅ Mobile tap support</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">InputOTP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p>✅ RFID card verification</p>
                  <p>✅ Security code entry</p>
                  <p>✅ Location verification</p>
                  <p>✅ Auto-advance on complete</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
                  <ul className="space-y-1">
                    <li>• Tab navigation support</li>
                    <li>• Arrow key slider control</li>
                    <li>• Enter/Space activation</li>
                    <li>• Focus management</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Screen Reader Support</h4>
                  <ul className="space-y-1">
                    <li>• ARIA labels and descriptions</li>
                    <li>• Live regions for notifications</li>
                    <li>• Semantic HTML structure</li>
                    <li>• Status announcements</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Mobile Accessibility</h4>
                  <ul className="space-y-1">
                    <li>• Touch target sizing (44px min)</li>
                    <li>• Gesture-friendly controls</li>
                    <li>• High contrast support</li>
                    <li>• Text size adaptation</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Visual Indicators</h4>
                  <ul className="space-y-1">
                    <li>• Focus ring visibility</li>
                    <li>• Color contrast compliance</li>
                    <li>• Loading state indicators</li>
                    <li>• Error state messaging</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default EnhancedMealOrderingDemo;
