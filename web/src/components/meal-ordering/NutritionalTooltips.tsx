'use client';

import * as React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Info as _Info,
  Zap,
  Droplets,
  Wheat,
  Apple,
  AlertTriangle,
  Leaf,
  Shield,
  Clock,
  Users,
} from 'lucide-react';
import { NutritionalInfo, DietaryInfo } from './types';

interface NutritionalTooltipProps {
  nutrition: NutritionalInfo;
  dietary: DietaryInfo;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function NutritionalTooltip({
  nutrition,
  dietary,
  children,
  side = 'top',
}: NutritionalTooltipProps) {
  // Calculate daily value percentages (based on 2000 calorie diet)
  const getDVPercentage = (value: number, dv: number) => Math.round((value / dv) * 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className="w-80 p-0">
          <div className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b">
              <Apple className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-sm">Nutritional Information</span>
            </div>

            {/* Calories - Main highlight */}
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{nutrition.calories}</span>
                <span className="text-sm text-muted-foreground">calories</span>
              </div>
              <Progress value={getDVPercentage(nutrition.calories, 2000)} className="h-2" />
              <span className="text-xs text-muted-foreground">
                {getDVPercentage(nutrition.calories, 2000)}% Daily Value*
              </span>
            </div>

            {/* Macronutrients */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Macronutrients</div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Wheat className="h-3 w-3 text-amber-600" />
                    <span>Carbs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nutrition.carbohydrates}g</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {getDVPercentage(nutrition.carbohydrates, 300)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-3 w-3 text-red-600" />
                    <span>Protein</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nutrition.protein}g</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {getDVPercentage(nutrition.protein, 50)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span>Fat</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nutrition.fat}g</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {getDVPercentage(nutrition.fat, 65)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span>Fiber</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nutrition.fiber}g</span>
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      {getDVPercentage(nutrition.fiber, 25)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3 w-3 text-red-500" />
                    <span>Sodium</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nutrition.sodium}mg</span>
                    <Badge
                      variant={
                        getDVPercentage(nutrition.sodium, 2300) > 20 ? 'destructive' : 'outline'
                      }
                      className="text-xs px-1.5 py-0"
                    >
                      {getDVPercentage(nutrition.sodium, 2300)}%
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dietary Information */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Dietary Information</div>
              <div className="flex flex-wrap gap-1">
                {dietary.vegetarian && (
                  <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    <Leaf className="h-2.5 w-2.5 mr-1" />
                    Vegetarian
                  </Badge>
                )}
                {dietary.vegan && (
                  <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    <Leaf className="h-2.5 w-2.5 mr-1" />
                    Vegan
                  </Badge>
                )}
                {dietary.glutenFree && (
                  <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                    <Shield className="h-2.5 w-2.5 mr-1" />
                    Gluten-Free
                  </Badge>
                )}
                {dietary.dairyFree && (
                  <Badge className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">
                    <Shield className="h-2.5 w-2.5 mr-1" />
                    Dairy-Free
                  </Badge>
                )}
                {dietary.nutFree && (
                  <Badge className="text-xs bg-purple-100 text-purple-800 hover:bg-purple-100">
                    <Shield className="h-2.5 w-2.5 mr-1" />
                    Nut-Free
                  </Badge>
                )}
                {dietary.spicy && (
                  <Badge className="text-xs bg-red-100 text-red-800 hover:bg-red-100">
                    🌶️ Spicy
                  </Badge>
                )}
              </div>
            </div>

            {/* Allergens Warning */}
            {dietary.allergens && dietary.allergens.length > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                    <AlertTriangle className="h-3 w-3" />
                    Allergen Information
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Contains: {dietary.allergens.join(', ')}
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="pt-2 border-t">
              <div className="text-xs text-muted-foreground">
                * % Daily Values are based on a 2,000 calorie diet. Your daily values may be higher
                or lower depending on your calorie needs.
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Quick info tooltip for meal attributes
interface QuickInfoTooltipProps {
  info: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export function QuickInfoTooltip({ info, children, icon }: QuickInfoTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="flex items-start gap-2">
            {icon && <div className="mt-0.5">{icon}</div>}
            <span className="text-sm">{info}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Preparation time tooltip
export function PreparationTimeTooltip({
  minutes,
  children,
}: {
  minutes: number;
  children: React.ReactNode;
}) {
  const getPreparationInfo = (minutes: number) => {
    if (minutes <= 15) {
      return {
        text: `Quick preparation in ${minutes} minutes. Perfect for busy schedules!`,
        color: 'text-green-600',
      };
    } else if (minutes <= 30) {
      return {
        text: `Fresh preparation takes ${minutes} minutes. Worth the wait for quality!`,
        color: 'text-amber-600',
      };
    } else {
      return {
        text: `Artisan preparation requires ${minutes} minutes. Premium quality meal.`,
        color: 'text-red-600',
      };
    }
  };

  const info = getPreparationInfo(minutes);

  return (
    <QuickInfoTooltip info={info.text} icon={<Clock className={`h-3 w-3 ${info.color}`} />}>
      {children}
    </QuickInfoTooltip>
  );
}

// Serving size tooltip
export function ServingSizeTooltip({
  size,
  children,
}: {
  size: string;
  children: React.ReactNode;
}) {
  return (
    <QuickInfoTooltip
      info={`Serving size: ${size}. Perfect portion for balanced nutrition.`}
      icon={<Users className="h-3 w-3 text-blue-600" />}
    >
      {children}
    </QuickInfoTooltip>
  );
}
