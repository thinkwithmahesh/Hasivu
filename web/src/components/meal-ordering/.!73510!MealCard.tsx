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
  ShoppingCart
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

  const handleQuantityChange = useCallback((change: number) => {
    const newQuantity = Math.max(1, Math.min(meal.maxQuantityPerStudent, quantity + change));
    setQuantity(newQuantity);
  }, [meal.maxQuantityPerStudent, quantity]);

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
    if (!meal.isAvailable) return { status: 'unavailable', text: 'Not Available', color: 'bg-red-100 text-red-800' };
    if (!canOrder) return { status: 'closed', text: 'Ordering Closed', color: 'bg-gray-100 text-gray-800' };
    if (!isSuitable) return { status: 'unsuitable', text: 'Not Suitable', color: 'bg-yellow-100 text-yellow-800' };
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
        heavy: 100
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
  const handleQuantityChangeWithFeedback = useCallback((change: number) => {
    handleHapticFeedback('light');
    handleQuantityChange(change);
  }, [handleQuantityChange, handleHapticFeedback]);

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
              onClick={(e) => {
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
              onClick={(e) => {
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
