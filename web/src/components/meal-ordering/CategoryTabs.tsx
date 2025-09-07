/**
 * CategoryTabs Component - Enhanced Meal Category Navigation
 * Tabbed navigation for different meal categories with filtering
 * Enhanced with better mobile responsiveness and accessibility
 */

import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, CheckCircle, Users } from 'lucide-react';
import { MEAL_TYPES } from '@/utils/constants';
import type { CategoryTabsProps, MenuCategory } from './types';
import { getMealCategoryInfo } from './utils';
import { cn } from '@/lib/utils';

const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategory,
  onCategoryChange,
  student,
}) => {
  // Filter categories based on student grade and availability
  const availableCategories = categories.filter(category => {
    // Check grade restrictions
    if (category.gradeFilters && category.gradeFilters.length > 0) {
      if (!category.gradeFilters.includes(student.grade)) {
        return false;
      }
    }

    // Check dietary preferences
    if (category.dietaryFilters && category.dietaryFilters.length > 0) {
      const hasMatchingDietary = category.dietaryFilters.some(dietary =>
        student.dietaryPreferences.includes(dietary)
      );
      if (!hasMatchingDietary && student.dietaryPreferences.length > 0) {
        return false;
      }
    }

    return category.isActive;
  });

  // Sort categories by sort order
  const sortedCategories = availableCategories.sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="w-full space-y-4">
      <Tabs value={activeCategory} onValueChange={onCategoryChange} className="w-full">
        {/* Mobile-first responsive tabs */}
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className={cn(
            'inline-flex h-auto p-1 bg-gray-50 border border-gray-200 rounded-xl',
            'min-w-full lg:grid lg:grid-cols-4 gap-1'
          )}>
            {sortedCategories.map((category) => {
              const categoryInfo = getMealCategoryInfo(category.mealType);
              const isActive = activeCategory === category.id;
              
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className={cn(
                    'flex-shrink-0 lg:flex-shrink flex flex-col items-center gap-2',
                    'p-3 sm:p-4 rounded-lg transition-all duration-300 min-w-[120px] lg:min-w-0',
                    'border-2 border-transparent',
                    isActive
                      ? 'bg-white shadow-lg border-primary text-primary scale-105 lg:scale-100'
                      : 'hover:bg-white/80 hover:shadow-md active:scale-95',
                    'focus:outline-none focus:ring-2 focus:ring-primary/50'
                  )}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`category-panel-${category.id}`}
                >
                  {/* Icon and label */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span 
                      className="text-2xl sm:text-3xl transition-transform duration-200 hover:scale-110" 
                      role="img" 
                      aria-label={category.name}
                    >
                      {categoryInfo.icon}
                    </span>
                    <div className="text-center sm:text-left">
                      <div className="font-bold text-xs sm:text-sm leading-tight">
                        {categoryInfo.label}
                      </div>
                      <div className="text-xs text-gray-600 hidden lg:block mt-0.5">
                        {categoryInfo.description}
                      </div>
                    </div>
                  </div>

                  {/* Category-specific badges */}
                  <div className="flex flex-wrap gap-1 justify-center mt-1">
                    {/* Special dietary indicators */}
                    {category.dietaryFilters && category.dietaryFilters.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-green-50 border-green-200 text-green-700">
                        {category.dietaryFilters.length === 1 
                          ? category.dietaryFilters[0] 
                          : `${category.dietaryFilters.length} diets`}
                      </Badge>
                    )}

                    {/* Grade restrictions */}
                    {category.gradeFilters && category.gradeFilters.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5 bg-blue-50 border-blue-200 text-blue-700">
                        Grade {Math.min(...category.gradeFilters)}-{Math.max(...category.gradeFilters)}
                      </Badge>
                    )}

                    {/* New category indicator */}
                    {category.name.toLowerCase().includes('new') && (
                      <Badge className="text-xs px-1.5 py-0.5 bg-gradient-to-r from-green-400 to-green-600 text-white animate-pulse">
                        New!
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      {/* Enhanced Category Description Panel */}
      {activeCategory && (
        <div 
          id={`category-panel-${activeCategory}`}
          role="tabpanel"
          aria-labelledby={`category-tab-${activeCategory}`}
          className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200"
        >
          {(() => {
            const activecat = sortedCategories.find(cat => cat.id === activeCategory);
            if (!activecat) return null;
            
            const categoryInfo = getMealCategoryInfo(activecat.mealType);
            
            return (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start space-x-4">
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <span className="text-4xl" role="img" aria-label={activecat.name}>
                      {categoryInfo.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-1">
                      {categoryInfo.label}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {activecat.description}
                    </p>
                  </div>
                </div>
                  
                {/* Enhanced timing and feature information */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Timing Information */}
                  {(() => {
                    const timingInfo = {
                      [MEAL_TYPES.BREAKFAST]: { time: '7:00 AM - 9:00 AM', lastOrder: '8:30 AM' },
                      [MEAL_TYPES.LUNCH]: { time: '12:00 PM - 2:00 PM', lastOrder: '1:30 PM' },
                      [MEAL_TYPES.DINNER]: { time: '6:00 PM - 8:00 PM', lastOrder: '7:30 PM' },
                      [MEAL_TYPES.SNACKS]: { time: '3:00 PM - 5:00 PM', lastOrder: '4:30 PM' },
                    };
                    
                    const timing = timingInfo[activecat.mealType];
                    
                    return timing ? (
                      <div className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-center mb-2">
                          <Clock className="h-4 w-4 text-blue-500 mr-2" />
                          <span className="font-semibold text-sm text-gray-900">Timings</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Available:</span>
                            <span className="font-medium text-gray-900">{timing.time}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last order:</span>
                            <span className="font-medium text-amber-700">{timing.lastOrder}</span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Student compatibility */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <Users className="h-4 w-4 text-green-500 mr-2" />
                      <span className="font-semibold text-sm text-gray-900">Your Profile</span>
                    </div>
                    <div className="space-y-2">
                      {activecat.gradeFilters && activecat.gradeFilters.includes(student.grade) ? (
                        <div className="flex items-center text-xs text-green-700">
                          <CheckCircle className="h-3 w-3 mr-1.5" />
                          Perfect for Grade {student.grade}
                        </div>
                      ) : (
                        <div className="flex items-center text-xs text-gray-600">
                          <Users className="h-3 w-3 mr-1.5" />
                          Available for all grades
                        </div>
                      )}
                      
                      {/* Dietary compatibility indicator */}
                      {activecat.dietaryFilters && student.dietaryPreferences.length > 0 && (
                        (() => {
                          const compatibleDiets = activecat.dietaryFilters.filter(diet =>
                            student.dietaryPreferences.includes(diet)
                          );
                          
                          return compatibleDiets.length > 0 ? (
                            <div className="flex items-center text-xs text-green-700">
                              <CheckCircle className="h-3 w-3 mr-1.5" />
                              {compatibleDiets.length} compatible diet{compatibleDiets.length > 1 ? 's' : ''}
                            </div>
                          ) : (
                            <div className="flex items-center text-xs text-gray-600">
                              <AlertTriangle className="h-3 w-3 mr-1.5" />
                              Check individual meals for dietary compatibility
                            </div>
                          );
                        })()
                      )}
                    </div>
                  </div>

                  {/* Category features */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{categoryInfo.icon}</span>
                      <span className="font-semibold text-sm text-gray-900">Features</span>
                    </div>
                    <div className="space-y-1">

                      {/* Special features based on meal type */}
                      {activecat.mealType === MEAL_TYPES.BREAKFAST && (
                        <div className="text-xs text-gray-700 flex items-center">
                          <span className="mr-2">🏃‍♂️</span>
                          Perfect energy boost to start your day
                        </div>
                      )}
                      
                      {activecat.mealType === MEAL_TYPES.LUNCH && (
                        <div className="text-xs text-gray-700 flex items-center">
                          <span className="mr-2">💪</span>
                          Complete nutrition for active learning
                        </div>
                      )}
                      
                      {activecat.mealType === MEAL_TYPES.SNACKS && (
                        <div className="text-xs text-gray-700 flex items-center">
                          <span className="mr-2">⚡</span>
                          Quick bites between classes
                        </div>
                      )}
                      
                      {activecat.mealType === MEAL_TYPES.DINNER && (
                        <div className="text-xs text-gray-700 flex items-center">
                          <span className="mr-2">😴</span>
                          Light & healthy evening meals
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Important alerts and notifications */}
                <div className="space-y-3">
                  {/* Allergy warning */}
                  {student.allergies.length > 0 && (
                    <Alert className="border-amber-200 bg-amber-50">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <span className="font-semibold">Allergy Alert:</span> Remember to check allergen information for items in this category.
                        Your profile shows allergies to: <span className="font-medium">{student.allergies.join(', ')}</span>.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Wallet balance warning */}
                  {student.walletBalance < 100 && activecat.mealType === MEAL_TYPES.LUNCH && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <span className="font-semibold">Low Balance:</span> Your wallet balance is low (₹{student.walletBalance}). 
                        Consider topping up for lunch orders.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Parent approval reminder */}
                  {student.parentApprovalRequired && (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Users className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <span className="font-semibold">Parent Approval Required:</span> Orders will be sent to your parent for approval before processing.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Low grade students reminder */}
                  {student.grade <= 5 && (
                    <Alert className="border-purple-200 bg-purple-50">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-800">
                        <span className="font-semibold">Grade {student.grade} Special Care:</span> All your orders automatically require parent approval for your safety.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Add scroll hint for mobile */}
      <style jsx global>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryTabs;