/**
 * Quantity Selector Component
 * Uses Slider for intuitive quantity selection with price range filtering
 */

"use client"

import React, { useState, useCallback, useMemo } from 'react'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Info, 
  TrendingUp, 
  Users, 
  AlertCircle,
  Calculator,
  Percent
} from 'lucide-react'
import { toast } from 'sonner'

import type { MealItem, StudentInfo } from './types'

interface QuantitySelectorProps {
  meal: MealItem
  student: StudentInfo
  currentQuantity: number
  onQuantityChange: (quantity: number) => void
  showPriceBreakdown?: boolean
  showBulkDiscounts?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

interface PriceBreakdown {
  subtotal: number
  bulkDiscount: number
  taxes: number
  total: number
  savingsAmount: number
  savingsPercentage: number
}

interface BulkDiscountTier {
  minQuantity: number
  discount: number
  description: string
}

// Mock bulk discount tiers
const BULK_DISCOUNT_TIERS: BulkDiscountTier[] = [
  { minQuantity: 3, discount: 0.05, description: '5% off for 3+ items' },
  { minQuantity: 5, discount: 0.10, description: '10% off for 5+ items' },
  { minQuantity: 8, discount: 0.15, description: '15% off for 8+ items' },
]

export function QuantitySelector({
  meal,
  student,
  currentQuantity,
  onQuantityChange,
  showPriceBreakdown = true,
  showBulkDiscounts = true,
  className,
  size = 'md'
}: QuantitySelectorProps) {
  const [sliderValue, setSliderValue] = useState([currentQuantity])
  
  // Calculate price breakdown
  const priceBreakdown = useMemo((): PriceBreakdown => {
    const quantity = sliderValue[0]
    const subtotal = meal.price * quantity
    
    // Find applicable bulk discount
    const applicableDiscount = BULK_DISCOUNT_TIERS
      .filter(tier => quantity >= tier.minQuantity)
      .pop()
    
    const bulkDiscountRate = applicableDiscount?.discount || 0
    const bulkDiscount = subtotal * bulkDiscountRate
    const afterDiscount = subtotal - bulkDiscount
    const taxes = afterDiscount * 0.05 // 5% tax
    const total = afterDiscount + taxes
    
    const originalTotal = subtotal + (subtotal * 0.05)
    const savingsAmount = originalTotal - total
    const savingsPercentage = (savingsAmount / originalTotal) * 100
    
    return {
      subtotal,
      bulkDiscount,
      taxes,
      total,
      savingsAmount,
      savingsPercentage
    }
  }, [sliderValue, meal.price])

  // Get current discount tier
  const currentDiscountTier = useMemo(() => {
    return BULK_DISCOUNT_TIERS
      .filter(tier => sliderValue[0] >= tier.minQuantity)
      .pop()
  }, [sliderValue])

  // Get next discount tier
  const nextDiscountTier = useMemo(() => {
    return BULK_DISCOUNT_TIERS
      .find(tier => sliderValue[0] < tier.minQuantity)
  }, [sliderValue])

  const handleSliderChange = useCallback((value: number[]) => {
    const newQuantity = value[0]
    setSliderValue(value)
    
    // Validate against meal limits
    if (newQuantity > meal.maxQuantityPerStudent) {
      toast.error(`Maximum ${meal.maxQuantityPerStudent} allowed per student`)
      return
    }
    
    // Check wallet balance
    const estimatedCost = priceBreakdown.total
    if (estimatedCost > student.walletBalance) {
      toast.warning('Insufficient wallet balance')
    }
    
    onQuantityChange(newQuantity)
  }, [meal.maxQuantityPerStudent, priceBreakdown.total, student.walletBalance, onQuantityChange])

  const handleDirectInput = useCallback((delta: number) => {
    const newQuantity = Math.max(0, Math.min(meal.maxQuantityPerStudent, sliderValue[0] + delta))
    setSliderValue([newQuantity])
    onQuantityChange(newQuantity)
    
    if (delta > 0 && newQuantity === meal.maxQuantityPerStudent) {
      toast.info(`Maximum limit reached for ${meal.name}`)
    }
  }, [sliderValue, meal.maxQuantityPerStudent, meal.name, onQuantityChange])

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          card: 'p-3',
          title: 'text-sm',
          button: 'h-6 w-6 text-xs',
          quantity: 'text-sm',
          price: 'text-sm'
        }
      case 'lg':
        return {
          card: 'p-6',
          title: 'text-lg',
          button: 'h-10 w-10 text-sm',
          quantity: 'text-xl',
          price: 'text-lg'
        }
      default:
        return {
          card: 'p-4',
          title: 'text-base',
          button: 'h-8 w-8 text-sm',
          quantity: 'text-lg',
          price: 'text-base'
        }
    }
  }

  const sizeClasses = getSizeClasses()
  const quantity = sliderValue[0]
  const isMaxReached = quantity >= meal.maxQuantityPerStudent
  const isInsufficientFunds = priceBreakdown.total > student.walletBalance
  const canIncrease = quantity < meal.maxQuantityPerStudent && meal.isAvailable
  const canDecrease = quantity > 0

  return (
    <Card className={className}>
      <CardHeader className={`${sizeClasses.card} pb-3`}>
        <div className="flex items-center justify-between">
          <CardTitle className={`${sizeClasses.title} flex items-center gap-2`}>
            <ShoppingCart className="w-4 h-4" />
            Quantity Selection
          </CardTitle>
          
          {currentDiscountTier && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
              <Percent className="w-3 h-3 mr-1" />
              {(currentDiscountTier.discount * 100)}% off
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className={`${sizeClasses.card} pt-0 space-y-4`}>
        {/* Meal Info */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <img 
            src={meal.imageUrl} 
            alt={meal.name}
            className="w-12 h-12 rounded-md object-cover"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{meal.name}</h3>
            <p className="text-xs text-gray-600">₹{meal.price} per item</p>
            {!meal.isAvailable && (
              <Badge variant="destructive" className="text-xs mt-1">
                Out of Stock
              </Badge>
            )}
          </div>
        </div>

        {/* Quantity Controls */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Quantity:</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className={sizeClasses.button}
                onClick={() => handleDirectInput(-1)}
                disabled={!canDecrease}
              >
                <Minus className="w-3 h-3" />
              </Button>
              
              <span className={`font-semibold ${sizeClasses.quantity} min-w-[2rem] text-center`}>
                {quantity}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                className={sizeClasses.button}
                onClick={() => handleDirectInput(1)}
                disabled={!canIncrease}
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <Slider
              value={sliderValue}
              onValueChange={handleSliderChange}
              max={meal.maxQuantityPerStudent}
              min={0}
              step={1}
              disabled={!meal.isAvailable}
              className="w-full"
            />
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>0</span>
              <span>Max: {meal.maxQuantityPerStudent}</span>
            </div>
          </div>

          {/* Warnings */}
          {isMaxReached && (
            <div className="flex items-center gap-2 text-orange-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Maximum quantity per student reached</span>
            </div>
          )}
          
          {isInsufficientFunds && quantity > 0 && (
            <div className="flex items-center gap-2 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>Insufficient wallet balance</span>
            </div>
          )}
        </div>

        {/* Bulk Discount Info */}
        {showBulkDiscounts && quantity > 0 && (
          <div className="space-y-2">
            {currentDiscountTier && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded text-green-800 text-xs">
                <TrendingUp className="w-3 h-3" />
                <span>Active: {currentDiscountTier.description}</span>
              </div>
            )}
            
            {nextDiscountTier && !currentDiscountTier && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-blue-800 text-xs">
                <Info className="w-3 h-3" />
                <span>
                  Add {nextDiscountTier.minQuantity - quantity} more for {(nextDiscountTier.discount * 100)}% off
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price Breakdown */}
        {showPriceBreakdown && quantity > 0 && (
          <Card className="p-3 bg-gray-50">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium">Price Breakdown</span>
              </div>
              
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Subtotal ({quantity} × ₹{meal.price}):</span>
                  <span>₹{priceBreakdown.subtotal.toFixed(2)}</span>
                </div>
                
                {priceBreakdown.bulkDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Bulk Discount:</span>
                    <span>-₹{priceBreakdown.bulkDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span>Taxes (5%):</span>
                  <span>₹{priceBreakdown.taxes.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-1">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className={`${sizeClasses.price} ${isInsufficientFunds ? 'text-red-600' : 'text-primary-600'}`}>
                      ₹{priceBreakdown.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {priceBreakdown.savingsAmount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>You Save:</span>
                    <span>₹{priceBreakdown.savingsAmount.toFixed(2)} ({priceBreakdown.savingsPercentage.toFixed(1)}%)</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Wallet Balance */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600">Wallet Balance:</span>
          <span className={`font-medium ${student.walletBalance < priceBreakdown.total ? 'text-red-600' : 'text-green-600'}`}>
            ₹{student.walletBalance.toFixed(2)}
          </span>
        </div>

        {/* Popular Quantities */}
        {size !== 'sm' && (
          <div className="space-y-2">
            <div className="text-xs text-gray-600 font-medium">Popular quantities:</div>
            <div className="flex gap-2">
              {[1, 2, 3, 5].filter(q => q <= meal.maxQuantityPerStudent).map((popularQty) => (
                <Button
                  key={popularQty}
                  variant="outline"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    setSliderValue([popularQty])
                    onQuantityChange(popularQty)
                  }}
                  disabled={!meal.isAvailable}
                >
                  {popularQty}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Nutritional Impact */}
        {quantity > 0 && size !== 'sm' && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <div className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer hover:text-primary-600">
                <Users className="w-3 h-3" />
                <span>Nutritional impact for {quantity} item{quantity > 1 ? 's' : ''}</span>
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Total Nutrition</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Calories:</span>
                    <span>{(meal.nutritionalInfo.calories * quantity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span>{(meal.nutritionalInfo.protein * quantity).toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Carbs:</span>
                    <span>{(meal.nutritionalInfo.carbohydrates * quantity).toFixed(1)}g</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fat:</span>
                    <span>{(meal.nutritionalInfo.fat * quantity).toFixed(1)}g</span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        )}
      </CardContent>
    </Card>
  )
}

export default QuantitySelector