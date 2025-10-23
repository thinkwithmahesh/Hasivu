import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { motion, AnimatePresence as AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  sodium: number;
  dailyValue?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

interface AllergenInfo {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  icon: string;
}

interface TooltipContentProps
  extends React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> {
  variant?: 'default' | 'nutrition' | 'allergen' | 'info' | 'modal';
  nutritionData?: NutritionData;
  allergens?: AllergenInfo[];
  showCloseButton?: boolean;
  onClose?: () => void;
}

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  TooltipContentProps
>(
  (
    {
      className,
      sideOffset = 4,
      variant = 'default',
      nutritionData,
      allergens,
      showCloseButton = false,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const renderNutritionContent = () => (
      <div className="space-y-4">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
          Nutrition Facts
        </div>

        {/* Main Nutrition Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <div className="text-lg font-bold text-primary-600">{nutritionData?.calories}</div>
            <div className="text-xs text-slate-500">Calories</div>
            {nutritionData?.dailyValue?.calories && (
              <div className="text-xs text-slate-400">{nutritionData.dailyValue.calories}% DV</div>
            )}
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded">
            <div className="text-lg font-bold text-blue-600">{nutritionData?.protein}g</div>
            <div className="text-xs text-slate-500">Protein</div>
            {nutritionData?.dailyValue?.protein && (
              <div className="text-xs text-slate-400">{nutritionData.dailyValue.protein}% DV</div>
            )}
          </div>
        </div>

        {/* Detailed Nutrition */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Carbohydrates</span>
            <span className="font-medium">{nutritionData?.carbs}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Total Fat</span>
            <span className="font-medium">{nutritionData?.fats}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Fiber</span>
            <span className="font-medium">{nutritionData?.fiber}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Sugar</span>
            <span className="font-medium">{nutritionData?.sugar}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Sodium</span>
            <span className="font-medium">{nutritionData?.sodium}mg</span>
          </div>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t">
          *Percent Daily Values based on a 2000 calorie diet
        </div>
      </div>
    );

    const renderAllergenContent = () => (
      <div className="space-y-3">
        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
          ⚠️ Allergen Information
        </div>

        <div className="space-y-2">
          {allergens?.map((allergen, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center space-x-3 p-2 rounded-lg',
                allergen.severity === 'severe' &&
                  'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800',
                allergen.severity === 'moderate' &&
                  'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800',
                allergen.severity === 'mild' &&
                  'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              )}
            >
              <span className="text-lg">{allergen.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{allergen.allergen}</div>
                <div
                  className={cn(
                    'text-xs capitalize',
                    allergen.severity === 'severe' && 'text-red-700 dark:text-red-400',
                    allergen.severity === 'moderate' && 'text-orange-700 dark:text-orange-400',
                    allergen.severity === 'mild' && 'text-yellow-700 dark:text-yellow-400'
                  )}
                >
                  {allergen.severity} risk
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-slate-500 pt-2 border-t">
          Always consult with dining staff if you have severe allergies
        </div>
      </div>
    );

    // Mobile Modal Version
    if (isMobile && (variant === 'nutrition' || variant === 'allergen' || variant === 'modal')) {
      return (
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 bottom-4 z-50 max-h-[80vh] overflow-y-auto rounded-xl bg-white p-4 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {showCloseButton && onClose && (
                <div className="flex justify-end mb-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {variant === 'nutrition' && nutritionData && renderNutritionContent()}
              {variant === 'allergen' && allergens && renderAllergenContent()}
              {(variant === 'modal' || variant === 'info') && children}
            </motion.div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      );
    }

    // Desktop Tooltip Version
    return (
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'z-50 overflow-hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-950 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50',
          // Enhanced styling for nutrition and allergen variants
          (variant === 'nutrition' || variant === 'allergen') && 'p-4 max-w-sm',
          variant === 'nutrition' && 'min-w-64',
          variant === 'allergen' && 'min-w-56',
          className
        )}
        {...props}
      >
        {variant === 'nutrition' && nutritionData && renderNutritionContent()}
        {variant === 'allergen' && allergens && renderAllergenContent()}
        {(variant === 'default' || variant === 'info') && children}
      </TooltipPrimitive.Content>
    );
  }
);
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// Specialized Nutrition Tooltip
interface NutritionTooltipProps {
  children: React.ReactNode;
  nutritionData: NutritionData;
  showOnHover?: boolean;
  showOnClick?: boolean;
}

const NutritionTooltip = ({
  children,
  nutritionData,
  showOnHover = true,
  showOnClick = false,
}: NutritionTooltipProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onMouseEnter={() => showOnHover && setOpen(true)}
          onMouseLeave={() => showOnHover && setOpen(false)}
          onClick={() => showOnClick && setOpen(!open)}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          variant="nutrition"
          nutritionData={nutritionData}
          showCloseButton={showOnClick}
          onClose={() => setOpen(false)}
        />
      </Tooltip>
    </TooltipProvider>
  );
};

// Specialized Allergen Tooltip
interface AllergenTooltipProps {
  children: React.ReactNode;
  allergens: AllergenInfo[];
  showOnHover?: boolean;
  showOnClick?: boolean;
}

const AllergenTooltip = ({
  children,
  allergens,
  showOnHover = true,
  showOnClick = false,
}: AllergenTooltipProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger
          asChild
          onMouseEnter={() => showOnHover && setOpen(true)}
          onMouseLeave={() => showOnHover && setOpen(false)}
          onClick={() => showOnClick && setOpen(!open)}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent
          variant="allergen"
          allergens={allergens}
          showCloseButton={showOnClick}
          onClose={() => setOpen(false)}
        />
      </Tooltip>
    </TooltipProvider>
  );
};

// Quick Info Tooltip for simple text
interface QuickTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

const QuickTooltip = ({ children, content, side = 'top' }: QuickTooltipProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  NutritionTooltip,
  AllergenTooltip,
  QuickTooltip,
  type NutritionData,
  type AllergenInfo,
};
