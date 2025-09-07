"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Star, Clock, Utensils, ShoppingCart, Minus } from 'lucide-react';

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

  const menuItems: MenuItem[] = [
    // South Indian Favorites
    {
      id: 1,
      name: "Mini Idli with Sambar",
      description: "Soft steamed rice cakes with protein-rich lentil curry and coconut chutney",
      category: "Breakfast",
      price: "₹45",
      rating: 4.7,
      prepTime: "8 min",
      dietary: ["Vegetarian", "High Protein", "Gluten-Free"],
      image: "🥟",
      priceValue: 45
    },
    {
      id: 2,
      name: "Masala Dosa Roll",
      description: "Crispy rice crepe filled with spiced potato masala, served with chutney",
      category: "Breakfast",
      price: "₹55",
      rating: 4.8,
      prepTime: "12 min",
      dietary: ["Vegetarian", "Traditional"],
      image: "🌯",
      priceValue: 55
    },
    {
      id: 3,
      name: "Vegetable Upma",
      description: "Nutritious semolina porridge with mixed vegetables and South Indian spices",
      category: "Breakfast",
      price: "₹35",
      rating: 4.4,
      prepTime: "10 min",
      dietary: ["Vegetarian", "High Fiber"],
      image: "🍲",
      priceValue: 35
    },
    
    // North Indian Classics
    {
      id: 4,
      name: "Butter Chicken with Naan",
      description: "Mild creamy chicken curry with soft butter naan bread, kid-friendly spice level",
      category: "Lunch",
      price: "₹85",
      rating: 4.6,
      prepTime: "15 min",
      dietary: ["High Protein", "Mild Spice"],
      image: "🍛",
      priceValue: 85
    },
    {
      id: 5,
      name: "Paneer Butter Masala",
      description: "Soft cottage cheese in rich tomato-cashew gravy with jeera rice",
      category: "Lunch",
      price: "₹75",
      rating: 4.5,
      prepTime: "12 min",
      dietary: ["Vegetarian", "High Protein", "Mild Spice"],
      image: "🧀",
      priceValue: 75
    },
    {
      id: 6,
      name: "Rajma Chawal",
      description: "Kidney bean curry with steamed basmati rice, a protein-packed favorite",
      category: "Lunch",
      price: "₹65",
      rating: 4.3,
      prepTime: "10 min",
      dietary: ["Vegetarian", "High Protein", "High Fiber"],
      image: "🍚",
      priceValue: 65
    },
    
    // Regional Bangalore Specialties
    {
      id: 7,
      name: "Bisi Bele Bath",
      description: "Karnataka's famous spiced rice and lentil dish with vegetables and ghee",
      category: "Lunch",
      price: "₹55",
      rating: 4.6,
      prepTime: "8 min",
      dietary: ["Vegetarian", "Traditional", "One-Pot Meal"],
      image: "🍛",
      priceValue: 55
    },
    {
      id: 8,
      name: "Rava Kesari",
      description: "Sweet semolina pudding with nuts and cardamom, a traditional South Indian dessert",
      category: "Dessert",
      price: "₹30",
      rating: 4.7,
      prepTime: "5 min",
      dietary: ["Vegetarian", "Sweet"],
      image: "🍮",
      priceValue: 30
    },
    
    // Healthy Indian Snacks
    {
      id: 9,
      name: "Masala Corn Chaat",
      description: "Boiled corn kernels with tangy spices, lemon juice, and fresh herbs",
      category: "Snack",
      price: "₹25",
      rating: 4.2,
      prepTime: "5 min",
      dietary: ["Vegetarian", "Gluten-Free", "Street Food"],
      image: "🌽",
      priceValue: 25
    },
    {
      id: 10,
      name: "Fruit Chaat",
      description: "Mixed seasonal fruits with black salt, chaat masala, and mint chutney",
      category: "Snack",
      price: "₹35",
      rating: 4.4,
      prepTime: "5 min",
      dietary: ["Vegetarian", "Healthy", "Vitamin Rich"],
      image: "🍎",
      priceValue: 35
    },
    
    // Kid-Friendly Indian Options
    {
      id: 11,
      name: "Mini Paratha Rolls",
      description: "Small whole wheat flatbreads stuffed with mild potato and served with yogurt",
      category: "Lunch",
      price: "₹45",
      rating: 4.5,
      prepTime: "10 min",
      dietary: ["Vegetarian", "Kid-Friendly", "Mild"],
      image: "🥙",
      priceValue: 45
    },
    {
      id: 12,
      name: "Dal Tadka with Rice",
      description: "Yellow lentil curry tempered with ghee and cumin, served with basmati rice",
      category: "Lunch",
      price: "₹50",
      rating: 4.4,
      prepTime: "8 min",
      dietary: ["Vegetarian", "High Protein", "Comfort Food"],
      image: "🍚",
      priceValue: 50
    }
  ];

  const categories = ["All", "Breakfast", "Lunch", "Snack", "Dessert"];

  // Filter items based on selected category
  const filteredItems = selectedCategory === 'All' 
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
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.priceValue * item.quantity), 0);
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
    const orderId = 'ORD-' + Date.now();
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
                  <div className="font-display font-bold text-2xl text-primary-600">Menu Management</div>
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
          <p className="text-gray-600">Diverse Indian cuisine for school children - South & North Indian favorites</p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={category === selectedCategory ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-xl font-bold">12</p>
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
                  <p className="text-xl font-bold">4.5</p>
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
                  <p className="text-xl font-bold">9m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Indian Specialties</p>
                  <p className="text-xl font-bold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="border-0 shadow-soft hover:shadow-medium transition-shadow">
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
                    {item.dietary.map((tag) => (
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
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleQuickOrder(item)}
                      >
                        Quick Add
                      </Button>
                      <Dialog open={isOrderDialogOpen && selectedItem?.id === item.id} onOpenChange={(open) => {
                        if (!open) {
                          setIsOrderDialogOpen(false);
                          setSelectedItem(null);
                        }
                      }}>
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
                            <DialogDescription>
                              {item.description}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary-600">{item.price}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="font-medium">{item.rating}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {item.dietary.map((tag) => (
                                <Badge key={tag} variant="secondary" className="bg-green-100 text-green-700">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-center justify-between pt-4">
                              <div className="flex items-center gap-3">
                                <Button size="sm" variant="outline" onClick={() => {
                                  const currentQuantity = cart.find(cartItem => cartItem.id === item.id)?.quantity || 0;
                                  if (currentQuantity > 0) {
                                    updateQuantity(item.id, currentQuantity - 1);
                                  }
                                }}>
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="font-medium w-8 text-center">
                                  {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                                </span>
                                <Button size="sm" variant="outline" onClick={() => {
                                  const currentQuantity = cart.find(cartItem => cartItem.id === item.id)?.quantity || 0;
                                  updateQuantity(item.id, currentQuantity + 1);
                                }}>
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button onClick={() => {
                                addToCart(item, 1);
                                setIsOrderDialogOpen(false);
                                setSelectedItem(null);
                              }}>
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
      </main>
    </div>
  );
}