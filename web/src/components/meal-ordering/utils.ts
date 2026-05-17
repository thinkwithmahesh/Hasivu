/**
 * Meal Ordering System - Utility Functions
 * Helper functions for meal ordering interface
 */

import { MEAL_TYPES } from '@/utils/constants';

// Get meal category information based on meal type
export function getMealCategoryInfo(mealType: string) {
  const category = MEAL_TYPES.find(type => type.id === mealType);

  if (category) {
    return {
      icon: category.icon,
      label: category.label,
      description: `Fresh ${category.label.toLowerCase()} options`,
    };
  }

  // Default fallback
  return {
    icon: '🍽️',
    label: 'Meals',
    description: 'Delicious meal options',
  };
}

// Format price for display
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// Alias for formatPrice to match expected import
export const formatCurrency = formatPrice;

// Get dietary information
export function getDietaryInfo(dietaryType: string) {
  const dietaryMap: Record<string, { label: string; icon: string; color: string }> = {
    vegetarian: { label: 'Vegetarian', icon: '🌱', color: 'green' },
    'non-vegetarian': { label: 'Non-Vegetarian', icon: '🍖', color: 'red' },
    vegan: { label: 'Vegan', icon: '🌿', color: 'green' },
    jain: { label: 'Jain', icon: '🕉️', color: 'orange' },
  };

  return dietaryMap[dietaryType] || { label: dietaryType, icon: '🍽️', color: 'gray' };
}

// Get allergy information for a single allergen
export function getAllergyInfo(allergen: string) {
  const allergyMap: Record<string, { label: string; icon: string }> = {
    dairy: { label: 'Contains Dairy', icon: '🥛' },
    nuts: { label: 'Contains Nuts', icon: '🥜' },
    gluten: { label: 'Contains Gluten', icon: '🌾' },
    eggs: { label: 'Contains Eggs', icon: '🥚' },
    soy: { label: 'Contains Soy', icon: '🫘' },
  };

  return allergyMap[allergen] || { label: `Contains ${allergen}`, icon: '⚠️' };
}

// Get spice level information
export function getSpiceLevelInfo(spiceLevel: string) {
  const spiceMap: Record<
    string,
    { label: string; icon: string; color: string; intensity: number }
  > = {
    mild: { label: 'Mild', icon: '🌶️', color: 'green', intensity: 1 },
    medium: { label: 'Medium', icon: '🌶️🌶️', color: 'orange', intensity: 2 },
    spicy: { label: 'Spicy', icon: '🌶️🌶️🌶️', color: 'red', intensity: 3 },
    'very-spicy': { label: 'Very Spicy', icon: '🌶️🌶️🌶️🌶️', color: 'darkred', intensity: 4 },
  };

  return spiceMap[spiceLevel] || { label: spiceLevel, icon: '🌶️', color: 'gray', intensity: 0 };
}

// Check if meal is suitable for student
export function isMealSuitableForStudent(
  meal: any,
  student: { grade: number; dietaryPreferences: string[]; allergies: string[] }
): boolean {
  // Check grade appropriateness
  if (meal.gradeAppropriate && !meal.gradeAppropriate.includes(student.grade)) {
    return false;
  }

  // Check dietary preferences
  if (student.dietaryPreferences.length > 0) {
    const hasMatchingDietary = student.dietaryPreferences.some(pref =>
      meal.dietaryType.toLowerCase().includes(pref.toLowerCase())
    );
    if (!hasMatchingDietary) return false;
  }

  // Check allergies
  if (student.allergies.length > 0) {
    const hasAllergens = student.allergies.some(allergy =>
      meal.allergens.some((allergen: string) =>
        allergen.toLowerCase().includes(allergy.toLowerCase())
      )
    );
    if (hasAllergens) return false;
  }

  return true;
}

// Check if student can order a meal
export function canOrderMeal(
  meal: any,
  student: { walletBalance: number; maxDailySpend?: number },
  currentOrders: any[] = []
): { canOrder: boolean; reason?: string } {
  // Check wallet balance
  if (student.walletBalance < meal.price) {
    return { canOrder: false, reason: 'Insufficient wallet balance' };
  }

  // Check daily spend limit
  if (student.maxDailySpend) {
    const totalSpentToday = currentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    if (totalSpentToday + meal.price > student.maxDailySpend) {
      return { canOrder: false, reason: 'Daily spend limit exceeded' };
    }
  }

  // Check meal availability
  if (!meal.availability?.isAvailable) {
    return { canOrder: false, reason: 'Meal not available' };
  }

  return { canOrder: true };
}

// Get nutritional score
export function getNutritionalScore(nutrition: any): number {
  return calculateNutritionalScore(nutrition);
}

// Format time
export function formatTime(time?: string): string {
  return time || 'N/A';
}

// Get meal recommendations for student
export function getMealRecommendations(meals: any[], student: any): any[] {
  // Simple recommendation logic based on dietary preferences and allergies
  return meals.filter(meal => isMealSuitableForStudent(meal, student));
}

// Calculate order summary
export function calculateOrderSummary(cart: any[], deliverySlot: any, student: any): any {
  const subtotal = cart.reduce((sum, item) => sum + item.mealItem.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
    deliveryFee: 0,
    discount: 0,
  };
}

// Calculate nutritional score (0-100 scale)
export function calculateNutritionalScore(nutrition: {
  calories: number;
  protein: number;
  fiber: number;
  sodium: number;
}): number {
  let score = 50; // Base score

  // Protein bonus (up to +20)
  score += Math.min((nutrition.protein / 30) * 20, 20);

  // Fiber bonus (up to +15)
  score += Math.min((nutrition.fiber / 10) * 15, 15);

  // Calorie penalty (over 600 calories)
  if (nutrition.calories > 600) {
    score -= Math.min(((nutrition.calories - 600) / 200) * 10, 15);
  }

  // Sodium penalty (over 800mg)
  if (nutrition.sodium > 800) {
    score -= Math.min(((nutrition.sodium - 800) / 400) * 10, 10);
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Check if meal meets dietary restrictions
export function meetsDietaryRequirements(
  mealDietaryTags: string[],
  studentPreferences: string[]
): boolean {
  if (studentPreferences.length === 0) return true;

  return studentPreferences.every(pref =>
    mealDietaryTags.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
  );
}

// Check if meal contains allergens
export function containsAllergens(mealAllergens: string[], studentAllergies: string[]): boolean {
  if (studentAllergies.length === 0) return false;

  return studentAllergies.some(allergy =>
    mealAllergens.some(allergen => allergen.toLowerCase().includes(allergy.toLowerCase()))
  );
}

// Format preparation time
export function formatPreparationTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

// Get meal time slot recommendation
export function getRecommendedMealTime(mealType: string): string {
  const now = new Date();
  const currentHour = now.getHours();

  switch (mealType) {
    case 'breakfast':
      return currentHour < 10 ? 'Available now' : 'Tomorrow morning';
    case 'lunch':
      return currentHour < 14 ? 'Available now' : 'Tomorrow afternoon';
    case 'dinner':
      return currentHour < 20 ? 'Available now' : 'Tomorrow evening';
    case 'snack':
      return 'Available now';
    default:
      return 'Available';
  }
}
