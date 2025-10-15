'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Plus,
  Star,
  Clock,
  Utensils,
  ShoppingCart,
  Minus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  category: string;
  price: string;
  rating: number;
  prepTime: string;
  dietary: string[];
  image: string;
  priceValue: number;
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  ingredients?: string[];
  allergens?: string[];
  availability?: {
    days: string[];
    timeSlots: string[];
  };
  schoolSpecific?: {
    ageGroup: string[];
    popularity: number;
    lastOrdered?: string;
  };
}

interface MenuResponse {
  status: 'success' | 'error';
  data?: MenuItem[];
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    categories: string[];
  };
}

interface CartItem extends MenuItem {
  quantity: number;
}

export default function MenuPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Load menu items from API
  useEffect(() => {
    loadMenuItems();
  }, [selectedCategory]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/menu?${params}`);
      const data: MenuResponse = await response.json();

      if (data.status === 'success' && data.data) {
        setMenuItems(data.data);
        if (data.meta?.categories) {
          setCategories(['All', ...data.meta.categories]);
        }
      } else {
        throw new Error(data.message || 'Failed to load menu items');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
      // Fallback to empty array
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Fallback categories if API doesn't provide them
  const defaultCategories = ['All', 'Breakfast', 'Lunch', 'Snack', 'Dessert'];

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  // Filter items based on selected category
  const filteredItems =
    selectedCategory === 'All'
      ? menuItems
      : menuItems.filter(item => item.category === selectedCategory);

  // Cart functions
  const addToCart = (item: MenuItem, quantity: number = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...prevCart, { ...item, quantity }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart(prevCart => prevCart.map(item => (item.id === id ? { ...item, quantity } : item)));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.priceValue * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleOrderNow = (item: MenuItem) => {
    setSelectedItem(item);
    setIsOrderDialogOpen(true);
  };

  const handleQuickOrder = (item: MenuItem) => {
    addToCart(item, 1);
    // Show success message or redirect to cart
  };

  const proceedToCheckout = () => {
    // Generate order ID and redirect to orders page
    const orderId = `ORD-${Date.now()}`;
    router.push(`/orders?checkout=true&orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-primary-600">
                    Menu Management
                  </div>
                  <div className="text-sm text-gray-600 -mt-1">HASIVU Platform</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cart.length > 0 && (
                <Button onClick={proceedToCheckout} className="relative">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  View Cart ({getTotalItems()})
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white">
                    {getTotalItems()}
                  </Badge>
                </Button>
              )}
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bangalore School Menu</h1>
          <p className="text-gray-600">
            Diverse Indian cuisine for school children - South & North Indian favorites
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600 mr-2" />
            <span className="text-gray-600">Loading menu items...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-8">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <span>Failed to load menu items: {error}</span>
              </div>
              <Button onClick={() => loadMenuItems()} variant="outline" size="sm" className="mt-2">
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
        {!loading && !error && (
          <div className="flex gap-2 mb-8 flex-wrap">
            {displayCategories.map(category => (
              <Button
                key={category}
                variant={category === selectedCategory ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Cart Summary */}
        {cart.length > 0 && (
          <Card className="border-0 shadow-soft mb-8 bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    {getTotalItems()} items in cart - Total: ₹{getTotalPrice()}
                  </span>
                </div>
                <Button onClick={proceedToCheckout} className="bg-green-600 hover:bg-green-700">
                  Proceed to Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Stats */}
        {!loading && !error && menuItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Items</p>
                    <p className="text-xl font-bold">{menuItems.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-xl font-bold">
                      {(
                        menuItems.reduce((sum, item) => sum + item.rating, 0) / menuItems.length
                      ).toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Prep Time</p>
                    <p className="text-xl font-bold">
                      {Math.round(
                        menuItems.reduce((sum, item) => sum + parseInt(item.prepTime), 0) /
                          menuItems.length
                      )}
                      m
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Categories</p>
                    <p className="text-xl font-bold">{displayCategories.length - 1}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Menu Items Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <Card
                key={item.id}
                className="border-0 shadow-soft hover:shadow-medium transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="text-3xl mb-2">{item.image}</div>
                    <span className="text-sm px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {item.category}
                    </span>
                  </div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Rating and Prep Time */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-medium">{item.rating}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{item.prepTime}</span>
                      </div>
                    </div>

                    {/* Dietary Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.dietary.map(tag => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-lg font-bold text-primary-600">{item.price}</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleQuickOrder(item)}>
                          Quick Add
                        </Button>
                        <Dialog
                          open={isOrderDialogOpen && selectedItem?.id === item.id}
                          onOpenChange={open => {
                            if (!open) {
                              setIsOrderDialogOpen(false);
                              setSelectedItem(null);
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button size="sm" onClick={() => handleOrderNow(item)}>
                              Order Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <span className="text-2xl">{item.image}</span>
                                {item.name}
                              </DialogTitle>
                              <DialogDescription>{item.description}</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-lg font-bold text-primary-600">
                                  {item.price}
                                </span>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                  <span className="font-medium">{item.rating}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {item.dietary.map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="bg-green-100 text-green-700"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center justify-between pt-4">
                                <div className="flex items-center gap-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const currentQuantity =
                                        cart.find(cartItem => cartItem.id === item.id)?.quantity ||
                                        0;
                                      if (currentQuantity > 0) {
                                        updateQuantity(item.id, currentQuantity - 1);
                                      }
                                    }}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-medium w-8 text-center">
                                    {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const currentQuantity =
                                        cart.find(cartItem => cartItem.id === item.id)?.quantity ||
                                        0;
                                      updateQuantity(item.id, currentQuantity + 1);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Button
                                  onClick={() => {
                                    addToCart(item, 1);
                                    setIsOrderDialogOpen(false);
                                    setSelectedItem(null);
                                  }}
                                >
                                  Add to Cart
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
