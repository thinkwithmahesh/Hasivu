/**
 * Enhanced Meal List Component
 * Uses ScrollArea for smooth scrolling of meal items with nutritional previews
 */

"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Filter, 
  Star, 
  Clock, 
  Users, 
  Leaf, 
  AlertTriangle,
  Plus,
  Minus,
  Info,
  Heart,
  Utensils
} from 'lucide-react'
import { toast } from 'sonner'

import type { 
  MealItem, 
  StudentInfo, 
  DietaryPreference, 
  SpiceLevel,
  MealType 
} from './types'

interface EnhancedMealListProps {
  meals: MealItem[]
  student: StudentInfo
  onAddToCart: (meal: MealItem, quantity: number) => void
  onViewDetails: (meal: MealItem) => void
  cartItems: { [mealId: string]: number }
  className?: string
}

interface FilterOptions {
  priceRange: [number, number]
  dietaryPreferences: DietaryPreference[]
  spiceLevel: SpiceLevel[]
  categories: MealType[]
  maxCalories?: number
  isGlutenFree?: boolean
  isDiabeticFriendly?: boolean
  showAvailableOnly: boolean
}

const DIETARY_ICONS: Record<DietaryPreference, { icon: React.ReactNode; color: string }> = {
  vegetarian: { icon: <Leaf className="w-3 h-3" />, color: 'bg-green-100 text-green-800' },
  vegan: { icon: <Leaf className="w-3 h-3" />, color: 'bg-green-200 text-green-900' },
  'non-vegetarian': { icon: <Utensils className="w-3 h-3" />, color: 'bg-red-100 text-red-800' },
  jain: { icon: <Heart className="w-3 h-3" />, color: 'bg-orange-100 text-orange-800' },
  eggetarian: { icon: <Utensils className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-800' }
}

const SPICE_LEVEL_COLORS: Record<SpiceLevel, string> = {
  mild: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  spicy: 'bg-orange-100 text-orange-800',
  'very-spicy': 'bg-red-100 text-red-800'
}

export function EnhancedMealList({ 
  meals, 
  student, 
  onAddToCart, 
  onViewDetails,
  cartItems,
  className 
}: EnhancedMealListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: [0, 500],
    dietaryPreferences: [],
    spiceLevel: [],
    categories: [],
    showAvailableOnly: true
  })

  // Calculate price range from available meals
  const priceRange = useMemo(() => {
    const prices = meals.map(meal => meal.price)
    return [Math.min(...prices), Math.max(...prices)]
  }, [meals])

  // Filter meals based on search and filters
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      // Search filter
      if (searchTerm && !meal.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !meal.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !meal.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) {
        return false
      }

      // Price range filter
      if (meal.price < filters.priceRange[0] || meal.price > filters.priceRange[1]) {
        return false
      }

      // Dietary preference filter
      if (filters.dietaryPreferences.length > 0 && 
          !filters.dietaryPreferences.includes(meal.dietaryType)) {
        return false
      }

      // Spice level filter
      if (filters.spiceLevel.length > 0 && 
          !filters.spiceLevel.includes(meal.spiceLevel)) {
        return false
      }

      // Category filter
      if (filters.categories.length > 0 && 
          !filters.categories.includes(meal.category)) {
        return false
      }

      // Availability filter
      if (filters.showAvailableOnly && !meal.isAvailable) {
        return false
      }

      // Calorie filter
      if (filters.maxCalories && meal.nutritionalInfo.calories > filters.maxCalories) {
        return false
      }

      // Dietary restrictions
      if (filters.isGlutenFree && !meal.isGlutenFree) {
        return false
      }

      if (filters.isDiabeticFriendly && !meal.isDiabeticFriendly) {
        return false
      }

      return true
    })
  }, [meals, searchTerm, filters])

  const handleAddToCart = useCallback((meal: MealItem) => {
    const currentQuantity = cartItems[meal.id] || 0
    if (currentQuantity < meal.maxQuantityPerStudent) {
      onAddToCart(meal, 1)
      toast.success(`${meal.name} added to cart`)
    } else {
      toast.error(`Maximum ${meal.maxQuantityPerStudent} allowed per student`)
    }
  }, [cartItems, onAddToCart])

  const handleRemoveFromCart = useCallback((meal: MealItem) => {
    const currentQuantity = cartItems[meal.id] || 0
    if (currentQuantity > 0) {
      onAddToCart(meal, -1)
      toast.success(`${meal.name} removed from cart`)
    }
  }, [cartItems, onAddToCart])

  const NutritionalPreview = ({ meal }: { meal: MealItem }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{meal.name}</h4>
        <Badge variant="secondary" className="text-xs">
          ₹{meal.price}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Calories:</span>
            <span className="font-medium">{meal.nutritionalInfo.calories}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Protein:</span>
            <span className="font-medium">{meal.nutritionalInfo.protein}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Carbs:</span>
            <span className="font-medium">{meal.nutritionalInfo.carbohydrates}g</span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Fat:</span>
            <span className="font-medium">{meal.nutritionalInfo.fat}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Fiber:</span>
            <span className="font-medium">{meal.nutritionalInfo.fiber}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Prep Time:</span>
            <span className="font-medium">{meal.preparationTime}m</span>
          </div>
        </div>
      </div>

      {meal.allergens.length > 0 && (
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-orange-600">
            <AlertTriangle className="w-3 h-3" />
            <span>Contains: {meal.allergens.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  )

  const MealCard = ({ meal }: { meal: MealItem }) => {
    const cartQuantity = cartItems[meal.id] || 0
    const isInCart = cartQuantity > 0
    const canAddMore = cartQuantity < meal.maxQuantityPerStudent
    const isAvailable = meal.isAvailable

    return (
      <Card className={`group transition-all duration-200 hover:shadow-md ${
        !isAvailable ? 'opacity-60' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Meal Image */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img 
                src={meal.imageUrl} 
                alt={meal.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {!isAvailable && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Meal Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-1">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <h3 className="font-medium text-sm leading-tight cursor-pointer hover:text-primary-600 transition-colors">
                      {meal.name}
                    </h3>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <NutritionalPreview meal={meal} />
                  </HoverCardContent>
                </HoverCard>
                
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span>{meal.rating.toFixed(1)}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {meal.description}
              </p>

              {/* Tags and Dietary Info */}
              <div className="flex items-center gap-1 mb-2 flex-wrap">
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${DIETARY_ICONS[meal.dietaryType].color}`}
                >
                  {DIETARY_ICONS[meal.dietaryType].icon}
                  <span className="ml-1 capitalize">{meal.dietaryType}</span>
                </Badge>
                
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${SPICE_LEVEL_COLORS[meal.spiceLevel]}`}
                >
                  {meal.spiceLevel}
                </Badge>

                {meal.isGlutenFree && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800">
                    Gluten Free
                  </Badge>
                )}
              </div>

              {/* Price and Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-primary-600">₹{meal.price}</span>
                  {meal.originalPrice && meal.originalPrice > meal.price && (
                    <span className="text-xs text-gray-500 line-through">₹{meal.originalPrice}</span>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{meal.preparationTime}m</span>
                  </div>
                </div>

                {/* Cart Controls */}
                <div className="flex items-center gap-2">
                  {isInCart ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleRemoveFromCart(meal)}
                        disabled={!isAvailable}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="text-sm font-medium min-w-[1.5rem] text-center">
                        {cartQuantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleAddToCart(meal)}
                        disabled={!canAddMore || !isAvailable}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleAddToCart(meal)}
                      disabled={!isAvailable}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={className}>
      {/* Search and Filter Header */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search meals, ingredients, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-mobile-optimized"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={`${showFilters ? 'bg-primary-50 border-primary-300' : ''}`}
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters
          </Button>
        </div>

        {/* Quick Filter Toggles */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <ToggleGroup 
            type="multiple" 
            value={filters.dietaryPreferences}
            onValueChange={(values) => 
              setFilters(prev => ({ ...prev, dietaryPreferences: values as DietaryPreference[] }))
            }
            className="flex-shrink-0"
          >
            <ToggleGroupItem value="vegetarian" size="sm">
              <Leaf className="w-3 h-3 mr-1" />
              Veg
            </ToggleGroupItem>
            <ToggleGroupItem value="vegan" size="sm">
              <Leaf className="w-3 h-3 mr-1" />
              Vegan
            </ToggleGroupItem>
            <ToggleGroupItem value="jain" size="sm">
              <Heart className="w-3 h-3 mr-1" />
              Jain
            </ToggleGroupItem>
          </ToggleGroup>

          <div className="w-px h-6 bg-gray-300" />

          <ToggleGroup
            type="single"
            value={filters.showAvailableOnly ? "available" : ""}
            onValueChange={(value) => 
              setFilters(prev => ({ ...prev, showAvailableOnly: value === "available" }))
            }
          >
            <ToggleGroupItem value="available" size="sm">
              Available Only
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="p-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price Range: ₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}
              </label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => 
                  setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                }
                max={priceRange[1]}
                min={priceRange[0]}
                step={10}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Spice Level</label>
              <ToggleGroup 
                type="multiple" 
                value={filters.spiceLevel}
                onValueChange={(values) => 
                  setFilters(prev => ({ ...prev, spiceLevel: values as SpiceLevel[] }))
                }
              >
                <ToggleGroupItem value="mild" size="sm">Mild</ToggleGroupItem>
                <ToggleGroupItem value="medium" size="sm">Medium</ToggleGroupItem>
                <ToggleGroupItem value="spicy" size="sm">Spicy</ToggleGroupItem>
                <ToggleGroupItem value="very-spicy" size="sm">Very Spicy</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({
                  priceRange: priceRange as [number, number],
                  dietaryPreferences: [],
                  spiceLevel: [],
                  categories: [],
                  showAvailableOnly: true
                })}
              >
                Clear Filters
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
        <span>{filteredMeals.length} meals found</span>
        {searchTerm && (
          <span>for "{searchTerm}"</span>
        )}
      </div>

      {/* Meals List */}
      <ScrollArea className="h-[calc(100vh-300px)] pr-4">
        <div className="space-y-3">
          {filteredMeals.length > 0 ? (
            filteredMeals.map((meal) => (
              <MealCard key={meal.id} meal={meal} />
            ))
          ) : (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <h3 className="font-medium mb-2">No meals found</h3>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default EnhancedMealList