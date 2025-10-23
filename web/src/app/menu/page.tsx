'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Search,
  Filter,
  X,
  Calendar,
  Info,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { menuAPIService } from '@/services/menu-api.service';
import { MenuItem, MenuCategory, MenuFilters } from '@/types/menu';

export default function MenuPage() {
  const router = useRouter();
  const { cart, addItem } = useCart();
  const { user, isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/menu');
    }
  }, [isAuthenticated, router]);

  // Show loading while checking authentication
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<MenuFilters>({
    dietary: [],
    spiceLevel: [],
    availability: ['available'],
    sortBy: 'popularity',
    sortOrder: 'desc',
  });

  // Selected item state for order dialog
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedDeliveryDate, setSelectedDeliveryDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  );
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Load menu items and categories on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload menu items when filters change
  useEffect(() => {
    if (!loading) {
      loadMenuItems();
    }
  }, [selectedCategory, filters, searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load categories and initial menu items in parallel
      const [categoriesData, menuData] = await Promise.all([
        menuAPIService.getCategories(),
        menuAPIService.getMenuItems({
          availability: ['available'],
          sortBy: 'popularity',
          sortOrder: 'desc',
        }),
      ]);

      setCategories(categoriesData);
      setMenuItems(menuData.items);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu data');
      toast.error('Failed to load menu items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams: MenuFilters = {
        ...filters,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        searchQuery: searchQuery || undefined,
      };

      const response = await menuAPIService.getMenuItems(filterParams);
      setMenuItems(response.items);
    } catch (err) {
      console.error('Error loading menu items:', err);
      setError(err instanceof Error ? err.message : 'Failed to load menu items');
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = useCallback(
    (item: MenuItem, quantity: number = 1, deliveryDate?: Date) => {
      try {
        addItem({
          menuItemId: item.id,
          menuItem: item,
          quantity,
          deliveryDate: deliveryDate || selectedDeliveryDate,
          unitPrice: item.price,
          specialInstructions: specialInstructions || undefined,
        });

        toast.success(`${item.name} added to cart!`, {
          description: `${quantity} item(s) added`,
          duration: 3000,
        });

        // Reset dialog state
        setSelectedQuantity(1);
        setSpecialInstructions('');
        setIsOrderDialogOpen(false);
        setSelectedItem(null);
      } catch (err) {
        console.error('Error adding to cart:', err);
        toast.error('Failed to add item to cart');
      }
    },
    [addItem, selectedDeliveryDate, specialInstructions]
  );

  const handleQuickAdd = (item: MenuItem) => {
    handleAddToCart(item, 1);
  };

  const handleOrderNow = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedQuantity(1);
    setSpecialInstructions('');
    setIsOrderDialogOpen(true);
  };

  const toggleDietaryFilter = (dietary: string) => {
    setFilters(prev => ({
      ...prev,
      dietary: prev.dietary?.includes(dietary as any)
        ? prev.dietary.filter(d => d !== dietary)
        : [...(prev.dietary || []), dietary as any],
    }));
  };

  const toggleSpiceLevelFilter = (level: string) => {
    setFilters(prev => ({
      ...prev,
      spiceLevel: prev.spiceLevel?.includes(level as any)
        ? prev.spiceLevel.filter(l => l !== level)
        : [...(prev.spiceLevel || []), level as any],
    }));
  };

  const clearFilters = () => {
    setFilters({
      dietary: [],
      spiceLevel: [],
      availability: ['available'],
      sortBy: 'popularity',
      sortOrder: 'desc',
    });
    setSearchQuery('');
  };

  const proceedToCheckout = () => {
    router.push('/cart');
  };

  // Get tomorrow's date for min delivery date
  const getMinDeliveryDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Get max delivery date (30 days from now)
  const getMaxDeliveryDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Loading skeleton component
  const MenuItemSkeleton = () => (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex gap-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-6 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Empty state component
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-gray-100 p-6 mb-4">
        <Utensils className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No menu items found</h3>
      <p className="text-gray-600 mb-4 max-w-md">
        {searchQuery || filters.dietary?.length || filters.spiceLevel?.length
          ? 'Try adjusting your filters or search terms'
          : 'Menu items will appear here once they are added'}
      </p>
      {(searchQuery || filters.dietary?.length || filters.spiceLevel?.length) && (
        <Button onClick={clearFilters} variant="outline">
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div>
                  <div className="font-display font-bold text-xl md:text-2xl text-primary-600">
                    School Menu
                  </div>
                  <div className="text-xs text-gray-600 -mt-1">HASIVU Platform</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {cart.itemCount > 0 && (
                <Button onClick={proceedToCheckout} className="relative" size="sm">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Cart</span> ({cart.itemCount})
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-1.5 py-0.5 text-xs">
                    {cart.itemCount}
                  </Badge>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Browse Our Menu</h1>
          <p className="text-gray-600">Healthy and delicious meals prepared fresh daily</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className="shrink-0"
            >
              {showFilters ? <X className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="border-0 shadow-soft">
              <CardContent className="p-4 space-y-4">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Dietary Preferences</h3>
                  <div className="flex flex-wrap gap-2">
                    {['vegetarian', 'vegan', 'glutenFree', 'dairyFree', 'nutFree'].map(diet => (
                      <Badge
                        key={diet}
                        variant={filters.dietary?.includes(diet as any) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDietaryFilter(diet)}
                      >
                        {diet === 'glutenFree'
                          ? 'Gluten-Free'
                          : diet === 'dairyFree'
                            ? 'Dairy-Free'
                            : diet === 'nutFree'
                              ? 'Nut-Free'
                              : diet.charAt(0).toUpperCase() + diet.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2">Spice Level</h3>
                  <div className="flex flex-wrap gap-2">
                    {['none', 'mild', 'medium', 'hot'].map(level => (
                      <Badge
                        key={level}
                        variant={filters.spiceLevel?.includes(level as any) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleSpiceLevelFilter(level)}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => setShowFilters(false)}>
                    Apply Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <div className="flex-1">
                  <p className="font-medium">Failed to load menu items</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
              <Button
                onClick={loadInitialData}
                variant="outline"
                size="sm"
                className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Category Filter */}
        {!loading && !error && categories.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="shrink-0"
            >
              All Items
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.name)}
                className="shrink-0"
              >
                {category.icon && <span className="mr-1">{category.icon}</span>}
                {category.name}
                {category.itemCount > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.itemCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Cart Summary */}
        {cart.itemCount > 0 && (
          <Card className="border-0 shadow-soft mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{cart.itemCount} items in cart</p>
                    <p className="text-sm text-green-700">Total: ₹{cart.total.toFixed(2)}</p>
                  </div>
                </div>
                <Button
                  onClick={proceedToCheckout}
                  className="bg-green-600 hover:bg-green-700 shrink-0"
                >
                  Checkout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Menu Stats */}
        {!loading && !error && menuItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-600">Total Items</p>
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
                    <p className="text-xs text-gray-600">Avg Rating</p>
                    <p className="text-xl font-bold">
                      {menuItems.filter(item => item.rating).length > 0
                        ? (
                            menuItems.reduce((sum, item) => sum + (item.rating || 0), 0) /
                            menuItems.filter(item => item.rating).length
                          ).toFixed(1)
                        : 'N/A'}
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
                    <p className="text-xs text-gray-600">Avg Prep</p>
                    <p className="text-xl font-bold">
                      {Math.round(
                        menuItems.reduce((sum, item) => sum + item.preparationTime, 0) /
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
                    <p className="text-xs text-gray-600">Categories</p>
                    <p className="text-xl font-bold">{categories.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <MenuItemSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && menuItems.length === 0 && <EmptyState />}

        {/* Menu Items Grid */}
        {!loading && !error && menuItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map(item => (
              <Card
                key={item.id}
                className="border-0 shadow-soft hover:shadow-medium transition-all duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                        <Utensils className="h-8 w-8 text-primary-600" />
                      </div>
                    )}
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      {item.availability === 'limited' && (
                        <Badge
                          variant="outline"
                          className="text-xs border-orange-300 text-orange-700"
                        >
                          Limited
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-1">{item.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-600 line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {/* Rating and Prep Time */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        {item.rating ? (
                          <>
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{item.rating.toFixed(1)}</span>
                            {item.reviewCount && (
                              <span className="text-gray-500 text-xs">({item.reviewCount})</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-xs">No ratings</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{item.preparationTime}m</span>
                      </div>
                    </div>

                    {/* Dietary Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.isVegetarian && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Veg
                        </Badge>
                      )}
                      {item.isVegan && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Vegan
                        </Badge>
                      )}
                      {item.isGlutenFree && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          GF
                        </Badge>
                      )}
                      {item.spiceLevel !== 'none' && (
                        <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">
                          {item.spiceLevel === 'mild'
                            ? '🌶️'
                            : item.spiceLevel === 'medium'
                              ? '🌶️🌶️'
                              : '🌶️🌶️🌶️'}
                        </Badge>
                      )}
                    </div>

                    {/* Allergen Warning */}
                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex items-start gap-1 text-xs text-orange-700 bg-orange-50 p-2 rounded">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                        <span>Contains: {item.allergens.join(', ')}</span>
                      </div>
                    )}

                    {/* Nutritional Info */}
                    {item.nutritionalInfo && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Info className="h-3 w-3" />
                        <span>{item.nutritionalInfo.calories} cal</span>
                        <span>•</span>
                        <span>{item.nutritionalInfo.protein}g protein</span>
                      </div>
                    )}

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <span className="text-lg font-bold text-primary-600">
                          ₹{item.price.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500">{item.servingSize}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuickAdd(item)}
                          disabled={item.availability === 'unavailable'}
                        >
                          Quick Add
                        </Button>
                        <Dialog
                          open={isOrderDialogOpen && selectedItem?.id === item.id}
                          onOpenChange={open => {
                            if (!open) {
                              setIsOrderDialogOpen(false);
                              setSelectedItem(null);
                              setSelectedQuantity(1);
                              setSpecialInstructions('');
                            }
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              onClick={() => handleOrderNow(item)}
                              disabled={item.availability === 'unavailable'}
                            >
                              Order
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-10 w-10 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                    <Utensils className="h-5 w-5 text-primary-600" />
                                  </div>
                                )}
                                <span className="line-clamp-1">{item.name}</span>
                              </DialogTitle>
                              <DialogDescription className="line-clamp-2">
                                {item.description}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              {/* Nutritional Info */}
                              {item.nutritionalInfo && (
                                <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-lg">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600">Calories</p>
                                    <p className="font-semibold">{item.nutritionalInfo.calories}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600">Protein</p>
                                    <p className="font-semibold">{item.nutritionalInfo.protein}g</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-600">Carbs</p>
                                    <p className="font-semibold">
                                      {item.nutritionalInfo.carbohydrates}g
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Allergen Warning */}
                              {item.allergens && item.allergens.length > 0 && (
                                <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                  <AlertCircle className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-sm text-orange-900">
                                      Allergen Warning
                                    </p>
                                    <p className="text-sm text-orange-700">
                                      Contains: {item.allergens.join(', ')}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Quantity Selector */}
                              <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <div className="flex items-center gap-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedQuantity(Math.max(1, selectedQuantity - 1))
                                    }
                                    disabled={selectedQuantity <= 1}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-medium w-12 text-center text-lg">
                                    {selectedQuantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      setSelectedQuantity(Math.min(10, selectedQuantity + 1))
                                    }
                                    disabled={selectedQuantity >= 10}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Delivery Date */}
                              <div className="space-y-2">
                                <Label htmlFor="deliveryDate" className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  Delivery Date
                                </Label>
                                <Input
                                  id="deliveryDate"
                                  type="date"
                                  value={selectedDeliveryDate.toISOString().split('T')[0]}
                                  onChange={e => setSelectedDeliveryDate(new Date(e.target.value))}
                                  min={getMinDeliveryDate()}
                                  max={getMaxDeliveryDate()}
                                />
                              </div>

                              {/* Special Instructions */}
                              <div className="space-y-2">
                                <Label htmlFor="instructions">
                                  Special Instructions (Optional)
                                </Label>
                                <Input
                                  id="instructions"
                                  type="text"
                                  placeholder="e.g., Less spicy, Extra sauce..."
                                  value={specialInstructions}
                                  onChange={e => setSpecialInstructions(e.target.value)}
                                  maxLength={200}
                                />
                              </div>

                              {/* Price Summary */}
                              <div className="flex items-center justify-between pt-4 border-t">
                                <div>
                                  <p className="text-sm text-gray-600">Total Price</p>
                                  <p className="text-2xl font-bold text-primary-600">
                                    ₹{(item.price * selectedQuantity).toFixed(2)}
                                  </p>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleAddToCart(item, selectedQuantity, selectedDeliveryDate)
                                  }
                                  className="min-w-[120px]"
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
