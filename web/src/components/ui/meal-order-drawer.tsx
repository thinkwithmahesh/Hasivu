import * as React from 'react';
import { Drawer } from 'vaul';
import { X, Plus, Minus, Clock, Heart, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface MealItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  preparationTime: number;
  rating: number;
  nutrition: NutritionInfo;
  allergens: string[];
  dietaryTags: ('vegan' | 'vegetarian' | 'gluten-free' | 'dairy-free' | 'nut-free')[];
  ingredients: string[];
  customizations?: {
    portion: { small: number; regular: number; large: number };
    addOns?: { id: string; name: string; price: number }[];
    modifications?: string[];
  };
}

interface MealOrderDrawerProps {
  meal: MealItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (meal: MealItem, customizations: any) => void;
  className?: string;
}

const MealOrderDrawer = ({
  meal,
  isOpen,
  onClose,
  onAddToCart,
  className,
}: MealOrderDrawerProps) => {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedPortion, setSelectedPortion] = React.useState<'small' | 'regular' | 'large'>(
    'regular'
  );
  const [selectedAddOns, setSelectedAddOns] = React.useState<string[]>([]);
  const [showNutrition, setShowNutrition] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(false);

  const calculatePrice = () => {
    const basePrice = meal.customizations?.portion?.[selectedPortion] || meal.price;
    const addOnPrice = selectedAddOns.reduce((total, addOnId) => {
      const addOn = meal.customizations?.addOns?.find(a => a.id === addOnId);
      return total + (addOn?.price || 0);
    }, 0);
    return (basePrice + addOnPrice) * quantity;
  };

  const handleAddToCart = () => {
    onAddToCart(meal, {
      quantity,
      portion: selectedPortion,
      addOns: selectedAddOns,
    });
    onClose();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: meal.name,
          text: `Check out this delicious ${meal.name} from HASIVU!`,
          url: window.location.href,
        });
      } catch (error) {
        // Error handled silently
      }
    }
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        <Drawer.Content
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50 mt-24 flex h-[90%] flex-col rounded-t-2xl bg-white outline-none dark:bg-slate-900',
            'scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 dark:scrollbar-thumb-slate-700 dark:scrollbar-track-slate-800',
            className
          )}
        >
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
                <Heart
                  className={cn(
                    'h-4 w-4',
                    isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-500'
                  )}
                />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleShare}>
                <Share2 className="h-4 w-4 text-slate-500" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-4">
            {/* Meal Preview */}
            <div className="mb-6">
              <div className="aspect-video relative rounded-xl overflow-hidden mb-4">
                <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium">⭐ {meal.rating}</span>
                  </div>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {meal.name}
              </h2>

              <p className="text-slate-600 dark:text-slate-400 mb-4">{meal.description}</p>

              {/* Dietary Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {meal.dietaryTags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      tag === 'vegan' &&
                        'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
                      tag === 'vegetarian' &&
                        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
                      tag === 'gluten-free' &&
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
                      tag === 'dairy-free' &&
                        'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
                      tag === 'nut-free' &&
                        'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                    )}
                  >
                    {tag === 'vegan' && '🌱'}
                    {tag === 'vegetarian' && '🥬'}
                    {tag === 'gluten-free' && '🌾'}
                    {tag === 'dairy-free' && '🥛'}
                    {tag === 'nut-free' && '🥜'}
                    {tag.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Portion Selection */}
            {meal.customizations?.portion && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Choose Portion Size
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(meal.customizations.portion).map(([size, price]) => (
                    <motion.button
                      key={size}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        'p-3 rounded-lg border-2 text-center transition-all',
                        selectedPortion === size
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                      onClick={() => setSelectedPortion(size as 'small' | 'regular' | 'large')}
                    >
                      <div className="font-medium text-sm capitalize">{size}</div>
                      <div className="text-xs text-slate-500 mt-1">₹{price}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {meal.customizations?.addOns && meal.customizations.addOns.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Add-ons</h3>
                <div className="space-y-2">
                  {meal.customizations.addOns.map(addOn => (
                    <motion.button
                      key={addOn.id}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between',
                        selectedAddOns.includes(addOn.id)
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      )}
                      onClick={() => {
                        setSelectedAddOns(prev =>
                          prev.includes(addOn.id)
                            ? prev.filter(id => id !== addOn.id)
                            : [...prev, addOn.id]
                        );
                      }}
                    >
                      <span className="font-medium">{addOn.name}</span>
                      <span className="text-slate-600 dark:text-slate-400">+₹{addOn.price}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Nutrition Information */}
            <div className="mb-6">
              <button
                className="flex items-center justify-between w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                onClick={() => setShowNutrition(!showNutrition)}
              >
                <span className="font-medium">Nutrition Information</span>
                <motion.div
                  animate={{ rotate: showNutrition ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  ⌄
                </motion.div>
              </button>

              <AnimatePresence>
                {showNutrition && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border">
                        <div className="text-2xl font-bold text-primary-600">
                          {meal.nutrition.calories}
                        </div>
                        <div className="text-sm text-slate-500">Calories</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">
                          {meal.nutrition.protein}g
                        </div>
                        <div className="text-sm text-slate-500">Protein</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">
                          {meal.nutrition.carbs}g
                        </div>
                        <div className="text-sm text-slate-500">Carbs</div>
                      </div>
                      <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-lg border">
                        <div className="text-2xl font-bold text-purple-600">
                          {meal.nutrition.fats}g
                        </div>
                        <div className="text-sm text-slate-500">Fats</div>
                      </div>
                    </div>

                    {meal.allergens.length > 0 && (
                      <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                        <div className="font-medium text-orange-800 dark:text-orange-400 mb-1">
                          ⚠️ Contains Allergens
                        </div>
                        <div className="text-sm text-orange-700 dark:text-orange-300">
                          {meal.allergens.join(', ')}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Ingredients */}
            <div className="mb-6">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">Ingredients</h3>
              <div className="flex flex-wrap gap-2">
                {meal.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 space-y-4">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Add to Cart Button */}
            <Button onClick={handleAddToCart} className="w-full h-12 text-lg font-medium" size="lg">
              <div className="flex items-center justify-between w-full">
                <span>Add to Cart</span>
                <span>₹{calculatePrice()}</span>
              </div>
            </Button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export { MealOrderDrawer, type MealItem };
