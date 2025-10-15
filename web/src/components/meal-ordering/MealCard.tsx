/**
 * MealCard Component - Enhanced Individual Meal Display Card
 * Displays meal information with add to cart functionality
 * Enhanced with better ShadCN patterns, mobile responsiveness, and accessibility
 */

import React, { useState, useCallback, useRef, useEffect as _useEffect } from 'react';
import Image from 'next/image';
import {
  Star,
  Clock,
  Users,
  AlertTriangle,
  Plus,
  Minus,
  Info,
  Heart,
  Share2,
  Zap,
  Shield,
  ShoppingCart,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator as _Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { MealCardProps, MealItem as _MealItem, StudentInfo as _StudentInfo } from './types';
import {
  formatCurrency,
  getDietaryInfo,
  getAllergyInfo,
  getSpiceLevelInfo,
  isMealSuitableForStudent,
  canOrderMeal,
  getNutritionalScore,
  formatTime,
} from './utils';

const MealCard: React.FC<MealCardProps> = ({
  meal,
  student,
  onAddToCart,
  onViewDetails,
  isInCart = false,
  cartQuantity = 0,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const isSuitable = isMealSuitableForStudent(meal, student);
  const canOrder = canOrderMeal(meal);
  const dietaryInfo = getDietaryInfo(meal.dietaryType);
  const spiceLevelInfo = getSpiceLevelInfo(meal.spiceLevel);
  const nutritionalScore = getNutritionalScore(meal.nutritionalInfo);

  const handleAddToCart = useCallback(() => {
    onAddToCart(meal, quantity);
    setQuantity(1);
  }, [meal, quantity, onAddToCart]);

  const handleQuantityChange = useCallback(
    (change: number) => {
      const newQuantity = Math.max(1, Math.min(meal.maxQuantityPerStudent, quantity + change));
      setQuantity(newQuantity);
    },
    [meal.maxQuantityPerStudent, quantity]
  );

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsImageLoading(false);
    setImageError(true);
  }, []);

  // Mobile touch handlers for enhanced interactions
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    setIsPressed(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Detect horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        setSwipeDirection('right');
      } else {
        setSwipeDirection('left');
      }
    }
  }, []);

  // Get meal availability status
  const getAvailabilityStatus = () => {
    if (!meal.isAvailable)
      return { status: 'unavailable', text: 'Not Available', color: 'bg-red-100 text-red-800' };
    if (!canOrder)
      return { status: 'closed', text: 'Ordering Closed', color: 'bg-gray-100 text-gray-800' };
    if (!isSuitable)
      return { status: 'unsuitable', text: 'Not Suitable', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'available', text: 'Available', color: 'bg-green-100 text-green-800' };
  };

  // Get meal availability status
  const availability = getAvailabilityStatus();

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);

    // Handle swipe actions
    if (swipeDirection === 'right' && availability.status === 'available') {
      // Swipe right to add to cart
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      handleAddToCart();
    } else if (swipeDirection === 'left') {
      // Swipe left to view details
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
      setShowDetails(true);
    }

    setSwipeDirection(null);
    touchStartX.current = null;
    touchStartY.current = null;
  }, [swipeDirection, availability.status, handleAddToCart]);

  // Haptic feedback for interactions
  const handleHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 30,
        medium: 50,
        heavy: 100,
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Enhanced add to cart with haptic feedback
  const handleAddToCartWithFeedback = useCallback(() => {
    handleHapticFeedback('medium');
    handleAddToCart();
  }, [handleAddToCart, handleHapticFeedback]);

  // Enhanced quantity change with haptic feedback
  const handleQuantityChangeWithFeedback = useCallback(
    (change: number) => {
      handleHapticFeedback('light');
      handleQuantityChange(change);
    },
    [handleQuantityChange, handleHapticFeedback]
  );

  // Enhanced add to cart with haptic feedback

  return (
    <Card
      ref={cardRef}
      className={cn(
        'group relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1',
        'border-0 shadow-md bg-white touch-manipulation select-none',
        'active:scale-[0.98] active:shadow-lg',
        !isSuitable && 'opacity-60 grayscale',
        isInCart && 'ring-2 ring-primary shadow-primary/20',
        !canOrder && 'cursor-not-allowed',
        isPressed && 'scale-[0.98] shadow-lg',
        swipeDirection === 'right' && 'translate-x-2 bg-green-50',
        swipeDirection === 'left' && '-translate-x-2 bg-blue-50'
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <CardHeader className="p-0 relative overflow-hidden">
        <div className="relative aspect-video overflow-hidden">
          {/* Loading skeleton */}
          {isImageLoading && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          )}

          {/* Image */}
          {!imageError ? (
            <Image
              src={meal.imageUrl}
              alt={`${meal.name} - ${meal.description.slice(0, 50)}...`}
              width={400}
              height={200}
              className={cn(
                'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
                isImageLoading && 'opacity-0'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
              priority={false}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2">🍽️</div>
                <p className="text-sm">Image unavailable</p>
              </div>
            </div>
          )}

          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          {/* Availability Badge */}
          <Badge
            variant="secondary"
            className={cn(
              'absolute top-3 right-3 font-medium backdrop-blur-sm',
              availability.color,
              'shadow-sm border-white/20'
            )}
          >
            {availability.text}
          </Badge>

          {/* Discount Badge */}
          {meal.originalPrice && meal.originalPrice > meal.price && (
            <Badge
              variant="destructive"
              className="absolute top-3 left-3 font-bold backdrop-blur-sm shadow-sm animate-pulse"
            >
              <Zap className="w-3 h-3 mr-1" />
              {Math.round(((meal.originalPrice - meal.price) / meal.originalPrice) * 100)}% OFF
            </Badge>
          )}

          {/* Dietary Type Indicator */}
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="outline"
              className={cn(
                'bg-white/95 backdrop-blur-sm shadow-sm border-white/50',
                `text-${dietaryInfo.color}-700 hover:bg-${dietaryInfo.color}-50`
              )}
            >
              <span className="mr-1.5 text-sm" role="img" aria-label={dietaryInfo.label}>
                {dietaryInfo.icon}
              </span>
              <span className="font-medium text-xs">{dietaryInfo.label}</span>
            </Badge>
          </div>

          {/* Quick action buttons - Mobile optimized */}
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 md:opacity-100 transition-opacity duration-200 flex space-x-1">
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 p-0 backdrop-blur-sm bg-white/90 hover:bg-white touch-manipulation"
              onClick={e => {
                e.stopPropagation();
                handleHapticFeedback('light');
                // Add to favorites logic
              }}
              aria-label="Add to favorites"
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-10 w-10 p-0 backdrop-blur-sm bg-white/90 hover:bg-white touch-manipulation"
              onClick={e => {
                e.stopPropagation();
                handleHapticFeedback('light');
                // Share meal logic
              }}
              aria-label="Share meal"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Swipe hint indicator for mobile */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 md:hidden">
            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              ← Swipe for details • Swipe for cart →
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3 sm:p-4 lg:p-5">
        <div className="space-y-4">
          {/* Meal Title and Rating */}
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight text-gray-900 group-hover:text-primary transition-colors">
                {meal.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">
                {meal.description}
              </p>
            </div>
            <div className="flex items-center shrink-0 bg-yellow-50 px-2 py-1 rounded-full">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-semibold ml-1 text-gray-900">
                {meal.rating.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500 ml-1">({meal.totalRatings})</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-primary">{formatCurrency(meal.price)}</span>
            {meal.originalPrice && meal.originalPrice > meal.price && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(meal.originalPrice)}
              </span>
            )}
            <span className="text-xs text-gray-500 font-medium">per {meal.servingSize}</span>
          </div>

          {/* Key Information */}
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center bg-gray-50 px-2 py-1.5 rounded-md min-h-[32px] touch-manipulation">
                <Clock className="h-3 w-3 mr-1.5 text-gray-500 shrink-0" />
                <span className="font-medium whitespace-nowrap">{meal.preparationTime}m</span>
              </div>
              <div className="flex items-center bg-gray-50 px-2 py-1.5 rounded-md min-h-[32px] touch-manipulation">
                <Users className="h-3 w-3 mr-1.5 text-gray-500 shrink-0" />
                <span className="font-medium whitespace-nowrap">{meal.servingSize}</span>
              </div>
              {spiceLevelInfo.intensity > 0 && (
                <div className="flex items-center bg-red-50 px-2 py-1.5 rounded-md min-h-[32px] touch-manipulation">
                  <span className="mr-1.5 text-xs shrink-0">{spiceLevelInfo.icon}</span>
                  <span className="font-medium text-red-700 whitespace-nowrap">
                    {spiceLevelInfo.label}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nutritional Score */}
          {nutritionalScore > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 text-gray-500 mr-1.5" />
                  <span className="text-xs font-medium text-gray-700">Nutrition Score</span>
                </div>
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-1 rounded-full',
                    nutritionalScore >= 80
                      ? 'bg-green-100 text-green-800'
                      : nutritionalScore >= 60
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                  )}
                >
                  {nutritionalScore}/100
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    nutritionalScore >= 80
                      ? 'bg-green-500'
                      : nutritionalScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  )}
                  style={{ width: `${nutritionalScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Allergen Warnings */}
          {meal.allergens.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-orange-800 mb-1">Allergen Warning</p>
                  <div className="flex flex-wrap gap-1">
                    {meal.allergens.map(allergen => {
                      const allergyInfo = getAllergyInfo(allergen);
                      return (
                        <Badge
                          key={allergen}
                          variant="outline"
                          className="text-xs bg-white border-orange-300 text-orange-700"
                        >
                          <span className="mr-1">{allergyInfo.icon}</span>
                          {allergyInfo.label.replace('Contains ', '')}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Special Indicators */}
          <div className="flex flex-wrap gap-1.5">
            {meal.isGlutenFree && (
              <Badge
                variant="outline"
                className="text-xs bg-green-50 border-green-300 text-green-700"
              >
                🌾 Gluten-Free
              </Badge>
            )}
            {meal.isDiabeticFriendly && (
              <Badge variant="outline" className="text-xs bg-blue-50 border-blue-300 text-blue-700">
                💙 Diabetic-Friendly
              </Badge>
            )}
            {meal.isJainFood && (
              <Badge
                variant="outline"
                className="text-xs bg-yellow-50 border-yellow-300 text-yellow-700"
              >
                🗺️ Jain
              </Badge>
            )}
            {meal.schoolApprovalRequired && (
              <Badge
                variant="outline"
                className="text-xs bg-purple-50 border-purple-300 text-purple-700"
              >
                ✓ School Approved
              </Badge>
            )}
          </div>

          {/* Availability Time */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center text-gray-600">
                <Clock className="h-3 w-3 mr-1.5 text-gray-500" />
                <span>
                  <span className="font-medium">Available:</span>
                  <br className="sm:hidden" />
                  <span className="sm:ml-1">
                    {formatTime(meal.availableFrom)} - {formatTime(meal.availableTo)}
                  </span>
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <AlertTriangle className="h-3 w-3 mr-1.5 text-amber-500" />
                <span>
                  <span className="font-medium">Last order:</span>
                  <br className="sm:hidden" />
                  <span className="sm:ml-1 font-semibold text-amber-700">
                    {formatTime(meal.lastOrderTime)}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 lg:p-5 pt-0">
        <div className="w-full space-y-3">
          {/* Quantity Selector and Add Button */}
          {availability.status === 'available' && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center space-x-3">
                <Label
                  htmlFor={`quantity-${meal.id}`}
                  className="text-sm font-medium text-gray-700"
                >
                  Quantity:
                </Label>
                <div className="flex items-center border-2 rounded-lg bg-white shadow-sm">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChangeWithFeedback(-1)}
                    disabled={quantity <= 1}
                    className="h-11 w-11 p-0 hover:bg-gray-50 disabled:opacity-50 touch-manipulation active:scale-95"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    id={`quantity-${meal.id}`}
                    className="px-4 py-3 text-base font-bold min-w-[3.5rem] text-center select-none"
                    role="spinbutton"
                    aria-valuenow={quantity}
                    aria-valuemin={1}
                    aria-valuemax={meal.maxQuantityPerStudent}
                  >
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuantityChangeWithFeedback(1)}
                    disabled={quantity >= meal.maxQuantityPerStudent}
                    className="h-11 w-11 p-0 hover:bg-gray-50 disabled:opacity-50 touch-manipulation active:scale-95"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {meal.maxQuantityPerStudent > 1 && (
                  <span className="text-xs text-gray-500">Max: {meal.maxQuantityPerStudent}</span>
                )}
              </div>

              <Button
                onClick={handleAddToCartWithFeedback}
                className={cn(
                  'flex-1 h-12 font-semibold shadow-md transition-all duration-200 touch-manipulation',
                  'hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0',
                  'min-h-[48px]', // Ensure minimum touch target size
                  !canOrder || !isSuitable
                    ? 'opacity-50 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary/90'
                )}
                disabled={!canOrder || !isSuitable}
                aria-describedby={!isSuitable ? 'meal-unsuitable-reason' : undefined}
              >
                <ShoppingCart className="h-4 w-4 mr-2 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Add to Cart •</span>
                <span className="font-bold ml-1">{formatCurrency(meal.price * quantity)}</span>
              </Button>
            </div>
          )}

          {/* Unavailable state */}
          {availability.status !== 'available' && (
            <div className="text-center">
              <Button
                variant="outline"
                className="w-full h-12 cursor-not-allowed min-h-[48px] touch-manipulation"
                disabled
              >
                {availability.status === 'unavailable' && 'Currently Unavailable'}
                {availability.status === 'closed' && 'Ordering Window Closed'}
                {availability.status === 'unsuitable' && 'Not Suitable for Your Preferences'}
              </Button>
              {availability.status === 'unsuitable' && (
                <p id="meal-unsuitable-reason" className="text-xs text-gray-600 mt-1">
                  This meal contains allergens or doesn't match your dietary preferences
                </p>
              )}
            </div>
          )}

          {/* Cart Status */}
          {isInCart && cartQuantity > 0 && (
            <div className="flex items-center justify-center">
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-primary/20 px-3 py-1.5 font-medium animate-pulse"
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  {cartQuantity} item{cartQuantity !== 1 ? 's' : ''} in cart
                </div>
              </Badge>
            </div>
          )}

          {/* View Details Button */}
          <Dialog open={showDetails} onOpenChange={setShowDetails}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full h-11 border-2 font-medium transition-all duration-200 touch-manipulation',
                  'hover:bg-gray-50 hover:border-gray-300 focus:ring-2 focus:ring-primary/20',
                  'min-h-[44px] active:scale-[0.98]'
                )}
                onClick={() => {
                  handleHapticFeedback('light');
                  onViewDetails(meal);
                }}
              >
                <Info className="h-4 w-4 mr-2 shrink-0" />
                <span className="truncate">View Details & Nutrition</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <span>{meal.name}</span>
                  <Badge className={availability.color}>{availability.text}</Badge>
                </DialogTitle>
                <DialogDescription>{meal.description}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Image */}
                <Image
                  src={meal.imageUrl}
                  alt={meal.name}
                  width={600}
                  height={300}
                  className="w-full h-60 object-cover rounded-lg"
                />

                {/* Detailed Information */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Basic Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Price:</span>
                          <span className="font-medium">{formatCurrency(meal.price)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Serving Size:</span>
                          <span>{meal.servingSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Preparation Time:</span>
                          <span>{meal.preparationTime} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rating:</span>
                          <span>
                            {meal.rating}/5 ({meal.totalRatings} reviews)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Dietary Information */}
                    <div>
                      <h4 className="font-semibold mb-2">Dietary Information</h4>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span>{dietaryInfo.icon}</span>
                          <span className="text-sm">{dietaryInfo.label}</span>
                        </div>
                        {spiceLevelInfo.intensity > 0 && (
                          <div className="flex items-center space-x-2">
                            <span>{spiceLevelInfo.icon}</span>
                            <span className="text-sm">{spiceLevelInfo.label}</span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {meal.isGlutenFree && (
                            <Badge variant="outline" className="text-xs">
                              Gluten-Free
                            </Badge>
                          )}
                          {meal.isDiabeticFriendly && (
                            <Badge variant="outline" className="text-xs">
                              Diabetic-Friendly
                            </Badge>
                          )}
                          {meal.isJainFood && (
                            <Badge variant="outline" className="text-xs">
                              Jain
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nutritional Information */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Nutritional Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Calories:</span>
                          <span className="font-medium">{meal.nutritionalInfo.calories} kcal</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Protein:</span>
                          <span>{meal.nutritionalInfo.protein}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Carbohydrates:</span>
                          <span>{meal.nutritionalInfo.carbohydrates}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fat:</span>
                          <span>{meal.nutritionalInfo.fat}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fiber:</span>
                          <span>{meal.nutritionalInfo.fiber}g</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Sodium:</span>
                          <span>{meal.nutritionalInfo.sodium}mg</span>
                        </div>
                      </div>
                    </div>

                    {/* Allergen Information */}
                    {meal.allergens.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2 text-orange-600">Allergen Warnings</h4>
                        <div className="space-y-1">
                          {meal.allergens.map(allergen => {
                            const info = getAllergyInfo(allergen);
                            return (
                              <div key={allergen} className="flex items-center space-x-2 text-sm">
                                <span>{info.icon}</span>
                                <span>{info.label}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vendor Information */}
                {meal.vendor && (
                  <div>
                    <h4 className="font-semibold mb-2">Vendor Information</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{meal.vendor.name}</p>
                          <p className="text-sm text-gray-600">{meal.vendor.location}</p>
                          <p className="text-sm text-gray-600">{meal.vendor.contactNumber}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{meal.vendor.rating}/5</span>
                          </div>
                          {meal.vendor.hygieneCertification && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Hygiene Certified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Availability Schedule */}
                <div>
                  <h4 className="font-semibold mb-2">Availability Schedule</h4>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span>Available Hours:</span>
                      <span>
                        {formatTime(meal.availableFrom)} - {formatTime(meal.availableTo)}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span>Last Order Time:</span>
                      <span>{formatTime(meal.lastOrderTime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardFooter>
    </Card>
  );
};

export default MealCard;
