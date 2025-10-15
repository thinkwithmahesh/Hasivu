'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Clock, Plus, Minus, Heart, Info, ShoppingCart, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MenuItem } from '@/types/menu.types';

import { MenuItem } from '@/types/menu.types';

interface FoodItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity: number) => void;
  onShowNutrition: (item: MenuItem) => void;
  onQuickOrder: (item: MenuItem) => void;
  cartQuantity?: number;
  className?: string;
}

export function FoodItemCard({
  item,
  onAddToCart,
  onShowNutrition,
  onQuickOrder,
  cartQuantity = 0,
  className,
}: FoodItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [quantity, setQuantity] = useState(cartQuantity);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 0) return;
    setQuantity(newQuantity);
    onAddToCart(item, newQuantity - quantity);
  };

  const getDietaryColor = (tag: string) => {
    const colors: Record<string, string> = {
      Vegetarian: 'bg-green-100 text-green-800 border-green-200',
      Vegan: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      'High Protein': 'bg-blue-100 text-blue-800 border-blue-200',
      'Gluten-Free': 'bg-purple-100 text-purple-800 border-purple-200',
      Traditional: 'bg-orange-100 text-orange-800 border-orange-200',
      'Kid-Friendly': 'bg-pink-100 text-pink-800 border-pink-200',
      Healthy: 'bg-lime-100 text-lime-800 border-lime-200',
    };
    return colors[tag] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-300 ease-out',
        'hover:shadow-xl hover:-translate-y-1',
        'border-0 bg-white/80 backdrop-blur-sm',
        'before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/5 before:opacity-0 before:transition-opacity before:duration-300',
        'hover:before:opacity-100',
        isHovered && 'shadow-xl -translate-y-1',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid="menu-item"
      data-name={item.name}
    >
      {/* Favorite Button */}
      <Button
        size="sm"
        variant="ghost"
        className={cn(
          'absolute top-3 right-3 z-10 h-8 w-8 p-0 rounded-full',
          'bg-white/80 backdrop-blur-sm shadow-sm border',
          'hover:bg-white hover:scale-110 transition-all duration-200',
          isFavorited && 'text-red-500 bg-red-50 border-red-200'
        )}
        onClick={e => {
          e.stopPropagation();
          setIsFavorited(!isFavorited);
        }}
      >
        <Heart
          className={cn('h-4 w-4 transition-all duration-200', isFavorited && 'fill-current')}
        />
      </Button>

      {/* Popular Badge */}
      {item.rating >= 4.5 && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 shadow-sm">
            <Sparkles className="h-3 w-3 mr-1" />
            Popular
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        {/* Food Image Container */}
        <div className="relative h-48 bg-gradient-to-br from-primary-50 via-white to-accent-50 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
              {item.image}
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge
              variant="secondary"
              className="bg-white/90 backdrop-blur-sm text-gray-700 border-white/50 shadow-sm"
            >
              {item.category}
            </Badge>
          </div>

          {/* Quick Add Button - Shows on Hover */}
          <div
            className={cn(
              'absolute bottom-3 right-3 transition-all duration-300',
              isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <Button
              size="sm"
              onClick={e => {
                e.stopPropagation();
                onQuickOrder(item);
              }}
              className="bg-primary-600 hover:bg-primary-700 text-white shadow-lg"
              data-testid="add-to-cart"
            >
              <Plus className="h-4 w-4 mr-1" />
              Quick Add
            </Button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-lg text-gray-900 leading-tight group-hover:text-primary-700 transition-colors">
                {item.name}
              </h3>
              <div className="flex items-center gap-1 shrink-0">
                <Star className={cn('h-4 w-4 fill-current', getRatingColor(item.rating))} />
                <span className={cn('text-sm font-medium', getRatingColor(item.rating))}>
                  {item.rating}
                </span>
              </div>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{item.description}</p>
          </div>

          {/* Dietary Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.dietary.slice(0, 3).map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className={cn(
                  'text-xs px-2 py-1 font-medium border transition-colors',
                  getDietaryColor(tag)
                )}
              >
                {tag}
              </Badge>
            ))}
            {item.dietary.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-1 text-gray-600 border-gray-300">
                +{item.dietary.length - 3} more
              </Badge>
            )}
          </div>

          {/* Stats Row */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{item.prepTime}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-blue-600 hover:text-blue-700 hover:bg-transparent relative z-10"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onShowNutrition(item);
              }}
              data-testid="nutrition-button"
            >
              <Info className="h-3 w-3 mr-1" />
              Nutrition
            </Button>
          </div>

          {/* Price and Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary-700">{item.price}</span>
              <span className="text-xs text-gray-500">per serving</span>
            </div>

            {/* Quantity Controls or Add Button */}
            {quantity > 0 ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    onClick={e => {
                      e.stopPropagation();
                      handleQuantityChange(quantity - 1);
                    }}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium text-sm">{quantity}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-gray-200"
                    onClick={e => {
                      e.stopPropagation();
                      handleQuantityChange(quantity + 1);
                    }}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  handleQuantityChange(1);
                }}
                className="bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
