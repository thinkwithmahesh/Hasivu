// Production-level Nutrition Service for HASIVU Platform
// Maps all nutrition-related backend API endpoints to TypeScript service methods
// USDA-compliant nutrition data with allergen management and dietary filtering
// Critical for food safety, regulatory compliance, and student health

import apiClient from './api';

// ============================================================================
// Type Definitions & Interfaces - USDA Compliance
// ============================================================================

/**
 * Generic API response wrapper
 */
interface ApiResponse<T = unknown> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Major allergens as defined by FDA/USDA food labeling regulations
 * These 9 allergens account for 90% of food allergies and are legally required on labels
 */
export type AllergenType =
  | 'milk' // Dairy products, lactose
  | 'eggs' // Egg proteins (albumin, ovalbumin)
  | 'fish' // Finned fish (salmon, tuna, cod)
  | 'shellfish' // Crustacean shellfish (shrimp, crab, lobster)
  | 'tree_nuts' // Tree nuts (almonds, walnuts, cashews, pistachios)
  | 'peanuts' // Peanuts and peanut products
  | 'wheat' // Wheat gluten and wheat proteins
  | 'soy' // Soybean products
  | 'sesame'; // Sesame seeds (added as 9th major allergen in 2021)

/**
 * Allergen severity classification for risk management
 */
export type AllergenSeverity = 'high' | 'medium' | 'low';

/**
 * Allergen category classification
 */
export type AllergenCategory = 'major' | 'minor';

/**
 * Detailed allergen information for a food item
 */
export interface Allergen {
  id: string;
  name: string;
  type: AllergenType;
  category: AllergenCategory;
  severity: AllergenSeverity;
  present: boolean; // Definitely contains this allergen
  mayContain: boolean; // May contain due to cross-contamination
  crossContaminationRisk: number; // 0-1 scale, probability of cross-contamination
  warningLabel?: string; // Custom warning text for label
  regulatoryNote?: string; // FDA/USDA compliance note
}

/**
 * Dietary restriction and lifestyle categories
 */
export interface DietaryInfo {
  // Religious/cultural restrictions
  vegetarian: boolean; // No meat, fish, or poultry
  vegan: boolean; // No animal products (including dairy, eggs, honey)
  halal: boolean; // Permitted under Islamic dietary law
  kosher: boolean; // Permitted under Jewish dietary law

  // Health-based restrictions
  glutenFree: boolean; // No wheat, barley, rye, or their derivatives
  dairyFree: boolean; // No milk or milk products
  nutFree: boolean; // No tree nuts or peanuts
  eggFree: boolean; // No eggs or egg products
  soyFree: boolean; // No soy or soy products

  // Additional lifestyle choices
  organic: boolean; // Certified organic ingredients
  nonGMO: boolean; // Non-genetically modified organisms

  // Special diet plans
  keto: boolean; // Low-carb, high-fat ketogenic diet
  paleo: boolean; // Paleolithic diet (no grains, dairy, legumes)
  lowSodium: boolean; // Reduced sodium content
  diabeticFriendly: boolean; // Low glycemic index, controlled carbs
}

/**
 * USDA-compliant macronutrients (in grams per serving)
 * These are required on nutrition labels by FDA regulation
 */
export interface Macronutrients {
  protein: number; // Grams of protein
  carbohydrates: number; // Total carbohydrates (grams)
  totalFat: number; // Total fat (grams)
  saturatedFat: number; // Saturated fat (grams)
  transFat: number; // Trans fat (grams) - must be listed if >0.5g
  fiber: number; // Dietary fiber (grams)
  sugars: number; // Total sugars (grams)
  addedSugars: number; // Added sugars (grams) - new FDA requirement
  sugarAlcohols?: number; // Sugar alcohols if present (grams)
}

/**
 * USDA-compliant micronutrients and minerals
 * Required to be listed on nutrition labels
 */
export interface Micronutrients {
  // Required minerals
  sodium: number; // Milligrams (mg)
  potassium: number; // Milligrams (mg)
  calcium: number; // Milligrams (mg)
  iron: number; // Milligrams (mg)

  // Vitamins (optional but recommended)
  vitaminA: number; // International Units (IU)
  vitaminC: number; // Milligrams (mg)
  vitaminD: number; // International Units (IU)
  vitaminE: number; // Milligrams (mg)
  vitaminK: number; // Micrograms (mcg)

  // B-vitamins
  thiamin?: number; // Vitamin B1 (mg)
  riboflavin?: number; // Vitamin B2 (mg)
  niacin?: number; // Vitamin B3 (mg)
  vitaminB6?: number; // Pyridoxine (mg)
  folate?: number; // Vitamin B9 (mcg)
  vitaminB12?: number; // Cobalamin (mcg)

  // Additional minerals
  magnesium?: number; // Milligrams (mg)
  phosphorus?: number; // Milligrams (mg)
  zinc?: number; // Milligrams (mg)
  selenium?: number; // Micrograms (mcg)
  copper?: number; // Milligrams (mg)
  manganese?: number; // Milligrams (mg)
  chromium?: number; // Micrograms (mcg)
}

/**
 * Daily Value percentages based on 2000 calorie diet (FDA standard)
 * These percentages help consumers understand nutrient content
 */
export interface DailyValuePercentages {
  totalFat: number; // % of 78g daily value
  saturatedFat: number; // % of 20g daily value
  transFat: number; // No daily value (should be minimized)
  cholesterol: number; // % of 300mg daily value
  sodium: number; // % of 2300mg daily value
  totalCarbohydrates: number; // % of 275g daily value
  dietaryFiber: number; // % of 28g daily value
  totalSugars: number; // No daily value
  addedSugars: number; // % of 50g daily value
  protein: number; // % of 50g daily value
  vitaminD: number; // % of 20mcg daily value
  calcium: number; // % of 1300mg daily value
  iron: number; // % of 18mg daily value
  potassium: number; // % of 4700mg daily value
}

/**
 * USDA compliance verification and certifications
 */
export interface USDACompliance {
  compliant: boolean; // Meets USDA nutrition labeling requirements
  certificationDate: string; // Date of last compliance verification
  certificationNumber?: string; // USDA certification number if applicable
  verifiedBy: string; // Name of verifying authority/nutritionist
  lastAuditDate: string; // Date of last nutrition audit
  expirationDate?: string; // Certification expiration date
  notes?: string; // Additional compliance notes
  violations?: string[]; // Any compliance violations or warnings
}

/**
 * Traffic light nutrition rating system
 * Red (high) / Yellow (medium) / Green (low) classification
 * Based on UK NHS and EU nutrition profiling standards
 */
export type TrafficLightColor = 'red' | 'yellow' | 'green';

export interface TrafficLightRating {
  calories: TrafficLightColor; // Per serving calorie rating
  sugar: TrafficLightColor; // Sugar content rating
  fat: TrafficLightColor; // Total fat rating
  saturatedFat: TrafficLightColor; // Saturated fat rating
  sodium: TrafficLightColor; // Sodium content rating
  overall: TrafficLightColor; // Overall health rating
  score: number; // Numeric health score (0-100)
}

/**
 * Ingredient breakdown for transparency
 */
export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string; // g, mg, oz, cups, etc.
  percentOfTotal: number; // % of total recipe/meal
  allergens: AllergenType[]; // Allergens in this ingredient
  organic: boolean;
  nonGMO: boolean;
  sourceCountry?: string; // Country of origin
  supplier?: string; // Supplier name for traceability
}

/**
 * Complete nutritional information for a menu item
 * USDA-compliant nutrition facts panel data
 */
export interface NutritionalInfo {
  menuItemId: string;
  menuItemName: string;

  // Serving information (required by FDA)
  servingSize: string; // e.g., "1 cup (240g)", "2 pieces (85g)"
  servingSizeGrams: number; // Serving size in grams
  servingsPerContainer: number; // Number of servings in package/meal

  // Energy content
  calories: number; // Kilocalories per serving
  caloriesFromFat: number; // Calories from fat (optional but helpful)

  // Macronutrients and micronutrients
  macronutrients: Macronutrients;
  micronutrients: Micronutrients;

  // Daily value percentages
  dailyValues: DailyValuePercentages;

  // Allergen information
  allergens: Allergen[];
  allergenSummary: string; // e.g., "Contains: Milk, Eggs, Wheat"

  // Dietary information
  dietaryInfo: DietaryInfo;

  // Ingredient transparency
  ingredients: Ingredient[];
  ingredientStatement: string; // Full ingredient list as required by FDA

  // Traffic light system
  trafficLightRating: TrafficLightRating;

  // USDA compliance
  usdaCompliance: USDACompliance;

  // Additional metadata
  preparationMethod?: string; // Cooking method (affects nutrition)
  storageInstructions?: string;
  shelfLife?: string; // e.g., "3 days refrigerated"
  nutritionistNotes?: string; // Professional notes
  lastUpdated: string; // ISO date string
  version: number; // Version number for tracking changes
}

/**
 * Request for calculating nutrition for custom recipe/meal
 */
export interface CalculateNutritionRequest {
  recipeName: string;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }>;
  servings: number;
  preparationMethod?: string;
  cookingTime?: number; // Minutes
  userId?: string; // For personalized calculations
}

/**
 * Response from nutrition calculation
 */
export interface CalculateNutritionResponse {
  nutritionalInfo: NutritionalInfo;
  warnings: string[]; // Nutrition warnings or concerns
  recommendations: string[]; // Nutritionist recommendations
  calculationMetadata: {
    calculatedAt: string;
    calculationMethod: string;
    confidenceScore: number; // 0-1, confidence in calculation accuracy
    dataSource: string; // e.g., "USDA FoodData Central"
  };
}

/**
 * Request for analyzing nutrition of meal plan or day
 */
export interface AnalyzeNutritionRequest {
  menuItemIds: string[]; // Array of menu item IDs to analyze
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'full_day';
  studentAge?: number; // For age-appropriate recommendations
  studentGrade?: string; // Grade level for school nutrition standards
  dietaryRestrictions?: Partial<DietaryInfo>;
  targetDate?: string; // ISO date for meal plan
}

/**
 * Aggregated nutrition analysis for meal plan/day
 */
export interface NutritionAnalysis {
  totalNutrition: {
    calories: number;
    macronutrients: Macronutrients;
    micronutrients: Micronutrients;
  };

  // Comparison to recommended daily allowances
  rdaComparison: {
    calories: { consumed: number; recommended: number; percentage: number };
    protein: { consumed: number; recommended: number; percentage: number };
    carbohydrates: { consumed: number; recommended: number; percentage: number };
    fat: { consumed: number; recommended: number; percentage: number };
    fiber: { consumed: number; recommended: number; percentage: number };
    sodium: { consumed: number; recommended: number; percentage: number };
  };

  // Aggregated allergens across all items
  allergens: AllergenType[];
  allergenWarnings: string[];

  // Overall dietary compliance
  dietaryCompliance: {
    vegetarian: boolean;
    vegan: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
    halal: boolean;
    kosher: boolean;
  };

  // Traffic light rating for entire meal plan
  overallRating: TrafficLightRating;

  // Nutritional balance assessment
  balanceScore: number; // 0-100, how balanced the meal plan is
  balanceReport: {
    macronutrientBalance: string; // e.g., "Well-balanced" or "High in carbs"
    micronutrientCoverage: number; // % of micronutrients adequately covered
    varietyScore: number; // 0-100, food variety score
  };

  // Recommendations
  recommendations: string[];
  warnings: string[];
  improvementSuggestions: string[];

  // Meal-by-meal breakdown
  mealBreakdown: Array<{
    menuItemId: string;
    menuItemName: string;
    calories: number;
    percentOfDailyCalories: number;
    trafficLightRating: TrafficLightColor;
  }>;

  analysisMetadata: {
    analyzedAt: string;
    criteriaUsed: string; // e.g., "USDA School Nutrition Standards"
    ageGroup?: string;
    gradeLevel?: string;
  };
}

/**
 * Allergen check request
 */
export interface AllergenCheckRequest {
  menuItemIds: string[];
  allergenTypes?: AllergenType[]; // Specific allergens to check
  severity?: AllergenSeverity; // Filter by severity
  includeCrossContamination?: boolean; // Include "may contain" warnings
}

/**
 * Allergen check response
 */
export interface AllergenCheckResponse {
  safeItems: Array<{
    menuItemId: string;
    menuItemName: string;
    allergenFree: AllergenType[];
  }>;

  unsafeItems: Array<{
    menuItemId: string;
    menuItemName: string;
    allergens: Allergen[];
    riskLevel: 'high' | 'medium' | 'low';
  }>;

  crossContaminationRisks: Array<{
    menuItemId: string;
    menuItemName: string;
    potentialAllergens: AllergenType[];
    riskScore: number; // 0-1 scale
  }>;

  summary: {
    totalItemsChecked: number;
    safeItemsCount: number;
    unsafeItemsCount: number;
    allergensFFound: AllergenType[];
    highestRiskItem?: string;
  };
}

/**
 * Dietary filter request
 */
export interface DietaryFilterRequest {
  menuItemIds?: string[]; // Specific items to filter (optional)
  dietaryRestrictions: Partial<DietaryInfo>;
  strictMode?: boolean; // If true, exclude "may contain" items
  includeAlternatives?: boolean; // Suggest alternative menu items
  schoolId?: string; // Filter by school menu
  date?: string; // Filter by specific date
}

/**
 * Dietary filter response
 */
export interface DietaryFilterResponse {
  matchingItems: Array<{
    menuItemId: string;
    menuItemName: string;
    category: string;
    dietaryInfo: DietaryInfo;
    confidenceScore: number; // 0-1, confidence in dietary classification
    nutritionalHighlights: string[]; // e.g., "High in protein", "Low sodium"
  }>;

  excludedItems: Array<{
    menuItemId: string;
    menuItemName: string;
    reason: string; // Why it was excluded
    violatedRestrictions: string[]; // Which restrictions it violated
  }>;

  alternatives: Array<{
    originalItemId: string;
    alternativeItemId: string;
    alternativeItemName: string;
    similarityScore: number; // 0-1, how similar to original
    nutritionalComparison: string; // Brief comparison
  }>;

  summary: {
    totalItemsEvaluated: number;
    matchingItemsCount: number;
    excludedItemsCount: number;
    restrictionsApplied: string[];
  };
}

/**
 * All allergen types and their details
 */
export interface AllergenDirectory {
  allergens: Allergen[];
  categories: {
    major: AllergenType[];
    minor: string[];
  };
  metadata: {
    lastUpdated: string;
    regulatoryStandard: string; // e.g., "FDA Food Allergen Labeling Act 2021"
    version: string;
  };
}

// ============================================================================
// Nutrition API - Comprehensive nutrition management
// ============================================================================

export const nutritionApi = {
  /**
   * Get nutritional information for a specific menu item
   * @param menuItemId - Menu item ID
   * @returns Complete USDA-compliant nutritional information
   */
  getNutritionInfo: async (menuItemId: string): Promise<ApiResponse<NutritionalInfo>> => {
    const response = await apiClient.get(`/nutrition/${menuItemId}`);
    return response.data;
  },

  /**
   * Calculate nutrition for custom recipe or meal combination
   * @param calculationData - Recipe ingredients and serving information
   * @returns Calculated nutritional information with warnings
   */
  calculateNutrition: async (
    calculationData: CalculateNutritionRequest
  ): Promise<ApiResponse<CalculateNutritionResponse>> => {
    const response = await apiClient.post('/nutrition/calculate', calculationData);
    return response.data;
  },

  /**
   * Analyze nutrition for meal plan or full day
   * @param analysisData - Menu items and meal context
   * @returns Comprehensive nutrition analysis with RDA comparison
   */
  analyzeNutrition: async (
    analysisData: AnalyzeNutritionRequest
  ): Promise<ApiResponse<NutritionAnalysis>> => {
    const response = await apiClient.post('/nutrition/analyze', analysisData);
    return response.data;
  },

  /**
   * Get all allergen information and directory
   * @returns Complete allergen directory with all 9 major allergens
   */
  getAllergens: async (): Promise<ApiResponse<AllergenDirectory>> => {
    const response = await apiClient.get('/allergens');
    return response.data;
  },

  /**
   * Check menu items for specific allergens
   * @param checkData - Menu items and allergen criteria
   * @returns Allergen safety assessment with risk levels
   */
  checkAllergens: async (
    checkData: AllergenCheckRequest
  ): Promise<ApiResponse<AllergenCheckResponse>> => {
    const response = await apiClient.post('/allergens/check', checkData);
    return response.data;
  },

  /**
   * Filter menu items by dietary restrictions
   * @param filterData - Dietary restrictions and filter criteria
   * @returns Filtered menu items with alternatives
   */
  filterByDiet: async (
    filterData: DietaryFilterRequest
  ): Promise<ApiResponse<DietaryFilterResponse>> => {
    const response = await apiClient.post('/dietary/filter', filterData);
    return response.data;
  },
};

// ============================================================================
// Traffic Light System Calculations
// ============================================================================

/**
 * Calculate traffic light color based on nutrient content per 100g
 * Based on UK NHS and EU nutrition profiling standards
 */
export const calculateTrafficLight = {
  /**
   * Calculate traffic light for total fat (per 100g)
   * Green: ≤3g, Yellow: 3.1-17.5g, Red: >17.5g
   */
  fat: (gramsPerHundred: number): TrafficLightColor => {
    if (gramsPerHundred <= 3) return 'green';
    if (gramsPerHundred <= 17.5) return 'yellow';
    return 'red';
  },

  /**
   * Calculate traffic light for saturated fat (per 100g)
   * Green: ≤1.5g, Yellow: 1.6-5g, Red: >5g
   */
  saturatedFat: (gramsPerHundred: number): TrafficLightColor => {
    if (gramsPerHundred <= 1.5) return 'green';
    if (gramsPerHundred <= 5) return 'yellow';
    return 'red';
  },

  /**
   * Calculate traffic light for sugars (per 100g)
   * Green: ≤5g, Yellow: 5.1-22.5g, Red: >22.5g
   */
  sugars: (gramsPerHundred: number): TrafficLightColor => {
    if (gramsPerHundred <= 5) return 'green';
    if (gramsPerHundred <= 22.5) return 'yellow';
    return 'red';
  },

  /**
   * Calculate traffic light for sodium (per 100g)
   * Green: ≤0.3g, Yellow: 0.31-1.5g, Red: >1.5g
   */
  sodium: (gramsPerHundred: number): TrafficLightColor => {
    if (gramsPerHundred <= 0.3) return 'green';
    if (gramsPerHundred <= 1.5) return 'yellow';
    return 'red';
  },

  /**
   * Calculate traffic light for calories (per serving)
   * Green: ≤100 kcal, Yellow: 101-400 kcal, Red: >400 kcal
   */
  calories: (caloriesPerServing: number): TrafficLightColor => {
    if (caloriesPerServing <= 100) return 'green';
    if (caloriesPerServing <= 400) return 'yellow';
    return 'red';
  },

  /**
   * Calculate overall traffic light rating
   * Based on weighted average of all nutrient ratings
   */
  overall: (ratings: {
    fat: TrafficLightColor;
    saturatedFat: TrafficLightColor;
    sugars: TrafficLightColor;
    sodium: TrafficLightColor;
    calories: TrafficLightColor;
  }): TrafficLightColor => {
    const colorToScore = { green: 1, yellow: 2, red: 3 };
    const total =
      colorToScore[ratings.fat] +
      colorToScore[ratings.saturatedFat] * 1.5 + // Saturated fat weighted higher
      colorToScore[ratings.sugars] +
      colorToScore[ratings.sodium] * 1.5 + // Sodium weighted higher
      colorToScore[ratings.calories];

    const average = total / 6.5; // Total weight: 6.5

    if (average <= 1.5) return 'green';
    if (average <= 2.5) return 'yellow';
    return 'red';
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert nutrient amount to per-100g basis for traffic light calculation
 * @param nutrientGrams - Nutrient amount in grams
 * @param servingSizeGrams - Serving size in grams
 * @returns Nutrient amount per 100g
 */
export const convertToPer100g = (nutrientGrams: number, servingSizeGrams: number): number => {
  return (nutrientGrams / servingSizeGrams) * 100;
};

/**
 * Format allergen list for display
 * @param allergens - Array of allergen types
 * @returns Formatted allergen string (e.g., "Contains: Milk, Eggs, Wheat")
 */
export const formatAllergenList = (allergens: Allergen[]): string => {
  const presentAllergens = allergens.filter(a => a.present).map(a => a.name);
  const mayContainAllergens = allergens.filter(a => a.mayContain && !a.present).map(a => a.name);

  let result = '';
  if (presentAllergens.length > 0) {
    result += `Contains: ${presentAllergens.join(', ')}`;
  }
  if (mayContainAllergens.length > 0) {
    if (result) result += '. ';
    result += `May contain: ${mayContainAllergens.join(', ')}`;
  }

  return result || 'No major allergens';
};

/**
 * Check if menu item is safe for specific dietary restrictions
 * @param nutritionalInfo - Nutritional information
 * @param restrictions - Dietary restrictions to check
 * @returns Whether the item meets all restrictions
 */
export const isSafeForDiet = (
  nutritionalInfo: NutritionalInfo,
  restrictions: Partial<DietaryInfo>
): boolean => {
  const { dietaryInfo } = nutritionalInfo;

  for (const [key, required] of Object.entries(restrictions)) {
    if (required && !dietaryInfo[key as keyof DietaryInfo]) {
      return false;
    }
  }

  return true;
};

/**
 * Calculate nutrition score (0-100) based on overall healthiness
 * Higher score = healthier food
 * @param nutritionalInfo - Nutritional information
 * @returns Health score (0-100)
 */
export const calculateNutritionScore = (nutritionalInfo: NutritionalInfo): number => {
  let score = 50; // Start at neutral

  const { macronutrients, micronutrients, servingSizeGrams } = nutritionalInfo;

  // Positive factors (add points)
  const proteinPer100g = convertToPer100g(macronutrients.protein, servingSizeGrams);
  const fiberPer100g = convertToPer100g(macronutrients.fiber, servingSizeGrams);

  score += Math.min(proteinPer100g * 2, 20); // Up to +20 for protein
  score += Math.min(fiberPer100g * 3, 15); // Up to +15 for fiber

  // Negative factors (subtract points)
  const sugarsPer100g = convertToPer100g(macronutrients.sugars, servingSizeGrams);
  const saturatedFatPer100g = convertToPer100g(macronutrients.saturatedFat, servingSizeGrams);
  const sodiumPer100g = ((micronutrients.sodium / servingSizeGrams) * 100) / 1000; // Convert mg to g

  score -= Math.min(sugarsPer100g, 25); // Up to -25 for sugars
  score -= Math.min(saturatedFatPer100g * 2, 20); // Up to -20 for saturated fat
  score -= Math.min(sodiumPer100g * 10, 15); // Up to -15 for sodium

  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
};

/**
 * Get recommended daily allowance (RDA) based on age and gender
 * @param nutrient - Nutrient type
 * @param age - Age in years
 * @param gender - Gender ('male' or 'female')
 * @returns RDA value
 */
export const getRDA = (
  nutrient: 'calories' | 'protein' | 'carbohydrates' | 'fat' | 'fiber' | 'sodium',
  age: number,
  gender: 'male' | 'female' = 'male'
): number => {
  // Simplified RDA values based on USDA guidelines
  // Values are age-appropriate for school children

  const rdaTable: Record<string, Record<string, number>> = {
    calories: {
      '4-8': gender === 'male' ? 1400 : 1200,
      '9-13': gender === 'male' ? 1800 : 1600,
      '14-18': gender === 'male' ? 2400 : 1800,
      adult: gender === 'male' ? 2400 : 2000,
    },
    protein: {
      '4-8': 19,
      '9-13': 34,
      '14-18': gender === 'male' ? 52 : 46,
      adult: gender === 'male' ? 56 : 46,
    },
    carbohydrates: {
      all: 130, // Minimum recommended
    },
    fat: {
      '4-18': 78, // 25-35% of calories
      adult: 78,
    },
    fiber: {
      '4-8': 25,
      '9-13': gender === 'male' ? 31 : 26,
      '14-18': gender === 'male' ? 38 : 26,
      adult: gender === 'male' ? 38 : 25,
    },
    sodium: {
      '4-8': 1900,
      '9-13': 2200,
      '14-18': 2300,
      adult: 2300,
    },
  };

  let ageGroup = 'adult';
  if (age >= 4 && age <= 8) ageGroup = '4-8';
  else if (age >= 9 && age <= 13) ageGroup = '9-13';
  else if (age >= 14 && age <= 18) ageGroup = '14-18';

  if (nutrient === 'carbohydrates') {
    return rdaTable[nutrient]['all'];
  }

  return rdaTable[nutrient][ageGroup] || rdaTable[nutrient]['adult'];
};

/**
 * Generate allergen warning label text
 * @param allergens - Array of allergens
 * @returns Warning label text
 */
export const generateAllergenWarning = (allergens: Allergen[]): string => {
  const highSeverity = allergens.filter(a => a.present && a.severity === 'high');
  const mayContain = allergens.filter(a => a.mayContain && !a.present);

  let warning = '';

  if (highSeverity.length > 0) {
    warning = `⚠️ ALLERGEN WARNING: This product contains ${highSeverity.map(a => a.name.toUpperCase()).join(', ')}. `;
  }

  if (mayContain.length > 0) {
    warning += `May contain traces of ${mayContain.map(a => a.name).join(', ')} due to cross-contamination.`;
  }

  return warning || 'No allergen warnings';
};

// ============================================================================
// Export all interfaces and types
// ============================================================================

// Remove duplicate exports - these are already exported above
// export type {
//   ApiResponse,
//   AllergenType,
//   AllergenSeverity,
//   AllergenCategory,
//   Allergen,
//   DietaryInfo,
//   Macronutrients,
//   Micronutrients,
//   DailyValuePercentages,
//   USDACompliance,
//   TrafficLightColor,
//   TrafficLightRating,
//   Ingredient,
//   NutritionalInfo,
//   CalculateNutritionRequest,
//   CalculateNutritionResponse,
//   AnalyzeNutritionRequest,
//   NutritionAnalysis,
//   AllergenCheckRequest,
//   AllergenCheckResponse,
//   DietaryFilterRequest,
//   DietaryFilterResponse,
//   AllergenDirectory,
// };

// Default export
export default {
  nutrition: nutritionApi,
  trafficLight: calculateTrafficLight,
  utils: {
    convertToPer100g,
    formatAllergenList,
    isSafeForDiet,
    calculateNutritionScore,
    getRDA,
    generateAllergenWarning,
  },
};
