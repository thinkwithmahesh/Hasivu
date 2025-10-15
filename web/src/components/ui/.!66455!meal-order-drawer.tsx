import * as React from "react"
import { Drawer } from "vaul"
import { X, Plus, Minus, Clock, Heart, Share2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface NutritionInfo {
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
}

interface MealItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
  preparationTime: number
  rating: number
  nutrition: NutritionInfo
  allergens: string[]
  dietaryTags: ('vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free')[]
  ingredients: string[]
  customizations?: {
    portion: { small: number, regular: number, large: number }
    addOns?: { id: string, name: string, price: number }[]
    modifications?: string[]
  }
}

interface MealOrderDrawerProps {
  meal: MealItem
  isOpen: boolean
  onClose: () => void
  onAddToCart: (meal: MealItem, customizations: any) => void
  className?: string
}

const MealOrderDrawer = ({ 
  meal, 
  isOpen, 
  onClose, 
  onAddToCart,
  className 
}: MealOrderDrawerProps) => {
  const [quantity, setQuantity] = React.useState(1)
  const [selectedPortion, setSelectedPortion] = React.useState<'small' | 'regular' | 'large'>('regular')
  const [selectedAddOns, setSelectedAddOns] = React.useState<string[]>([])
  const [showNutrition, setShowNutrition] = React.useState(false)
  const [isFavorite, setIsFavorite] = React.useState(false)

  const calculatePrice = () => {
    const basePrice = meal.customizations?.portion?.[selectedPortion] || meal.price
    const addOnPrice = selectedAddOns.reduce((total, addOnId) => {
      const addOn = meal.customizations?.addOns?.find(a => a.id === addOnId)
      return total + (addOn?.price || 0)
    }, 0)
    return (basePrice + addOnPrice) * quantity
  }

  const handleAddToCart = () => {
    onAddToCart(meal, {
      quantity,
      portion: selectedPortion,
      addOns: selectedAddOns,
    })
    onClose()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meal.name,
          text: `Check out this delicious ${meal.name} from HASIVU!`,
          url: window.location.href,
        })
      } catch (error) {
      }
    }
  }

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content className={cn(
          "fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[90%] flex-col rounded-t-2xl bg-white outline-none dark:bg-slate-900",
          "scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-700 dark:scrollbar-track-slate-800",
          className
        )}>
          {/* Drawer Handle */}
          <div className="mx-auto mt-4 h-2 w-12 rounded-full bg-slate-300 dark:bg-slate-600" />
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 pb-2">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {meal.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                {meal.preparationTime}min
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsFavorite(!isFavorite)}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  isFavorite ? "fill-red-500 text-red-500" : "text-slate-500"
                )} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 text-slate-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4">
            {/* Meal Preview */}
            <div className="mb-6">
              <div className="aspect-video relative rounded-xl overflow-hidden mb-4">
                <img
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">⭐ {meal.rating}</span>
                  </div>
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {meal.name}
              </h2>
              
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {meal.description}
              </p>

              {/* Dietary Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {meal.dietaryTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      tag === 'vegan' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                      tag === 'vegetarian' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
                      tag === 'gluten-free' && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
                      tag === 'dairy-free' && "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
                      tag === 'nut-free' && "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
                    )}
                  >
