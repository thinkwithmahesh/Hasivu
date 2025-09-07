"use client"

import * as React from "react"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Clock, 
  Users, 
  Leaf, 
  AlertCircle,
  CreditCard,
  Smartphone,
  X
} from "lucide-react"
import { MealItem, OrderItem } from "./types"

interface MealOrderingDrawerProps {
  meals: MealItem[]
  categories: string[]
  cart: OrderItem[]
  onAddToCart: (meal: MealItem, quantity: number) => void
  onUpdateQuantity: (mealId: string, quantity: number) => void
  onRemoveFromCart: (mealId: string) => void
  onCheckout: () => void
  total: number
  children: React.ReactNode
}

export function MealOrderingDrawer({
  meals,
  categories,
  cart,
  onAddToCart,
  onUpdateQuantity,
  onRemoveFromCart,
  onCheckout,
  total,
  children
}: MealOrderingDrawerProps) {
  const [selectedCategory, setSelectedCategory] = React.useState(categories[0] || "All")
  const [quantities, setQuantities] = React.useState<Record<string, number>>({})

  const filteredMeals = React.useMemo(() => {
    return selectedCategory === "All" 
      ? meals 
      : meals.filter(meal => meal.category === selectedCategory)
  }, [meals, selectedCategory])

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const updateQuantity = (mealId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [mealId]: Math.max(0, quantity)
    }))
  }

  const handleAddToCart = (meal: MealItem) => {
    const quantity = quantities[meal.id] || 1
    onAddToCart(meal, quantity)
    setQuantities(prev => ({ ...prev, [meal.id]: 0 }))
  }

  const getCartItemQuantity = (mealId: string) => {
    return cart.find(item => item.mealId === mealId)?.quantity || 0
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>
        {children}
      </DrawerTrigger>
      <DrawerContent className="max-h-[95vh] bg-background">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center pb-0">
            <DrawerTitle className="flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Your Meals
            </DrawerTitle>
            <DrawerDescription>
              Browse available meals and add them to your cart
            </DrawerDescription>
          </DrawerHeader>

          {/* Category Selection */}
          <div className="px-4 py-2">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                {["All", ...categories].map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Meals List */}
          <ScrollArea className="max-h-[40vh] px-4">
            <div className="space-y-3 py-4">
              {filteredMeals.map((meal) => {
                const currentQuantity = quantities[meal.id] || 0
                const inCartQuantity = getCartItemQuantity(meal.id)
                
                return (
                  <Card key={meal.id} className="p-3">
                    <div className="flex gap-3">
                      {/* Meal Image */}
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {meal.image ? (
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        {!meal.available && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <AlertCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Meal Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{meal.name}</h4>
                          <span className="text-sm font-semibold text-green-600">₹{meal.price}</span>
                        </div>
                        
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {meal.description}
                        </p>

                        {/* Meal Info */}
                        <div className="flex items-center gap-1 mb-2">
                          {meal.preparationTime && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                              <Clock className="h-2.5 w-2.5 mr-1" />
                              {meal.preparationTime}m
                            </Badge>
                          )}
                          {meal.dietaryInfo?.vegetarian && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5 text-green-600">
                              <Leaf className="h-2.5 w-2.5 mr-1" />
                              Veg
                            </Badge>
                          )}
                          {meal.servingSize && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-5">
                              <Users className="h-2.5 w-2.5 mr-1" />
                              {meal.servingSize}
                            </Badge>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => updateQuantity(meal.id, currentQuantity - 1)}
                              disabled={currentQuantity === 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-medium min-w-[2ch] text-center">
                              {currentQuantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => updateQuantity(meal.id, currentQuantity + 1)}
                              disabled={!meal.available}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            {inCartQuantity > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {inCartQuantity} in cart
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(meal)}
                              disabled={currentQuantity === 0 || !meal.available}
                              className="h-7 px-3 text-xs"
                            >
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </ScrollArea>

          {/* Cart Summary */}
          {cart.length > 0 && (
            <>
              <Separator />
              <div className="px-4 py-3">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cart Items ({cartItemsCount})</span>
                    <span className="text-sm font-semibold">₹{total}</span>
                  </div>
                  
                  {/* Cart Items Preview */}
                  <div className="space-y-1">
                    {cart.slice(0, 2).map((item) => {
                      const meal = meals.find(m => m.id === item.mealId)
                      return (
                        <div key={item.mealId} className="flex justify-between text-xs text-muted-foreground">
                          <span className="truncate">{meal?.name} x{item.quantity}</span>
                          <span>₹{(meal?.price || 0) * item.quantity}</span>
                        </div>
                      )
                    })}
                    {cart.length > 2 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{cart.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          <DrawerFooter className="pt-2">
            <div className="flex gap-2">
              <Button
                onClick={onCheckout}
                disabled={cart.length === 0}
                className="flex-1"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Checkout ₹{total}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
            
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              Mobile-optimized ordering experience
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  )
}