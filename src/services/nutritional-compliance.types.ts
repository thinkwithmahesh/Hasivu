/**
 * HASIVU Platform - Nutritional Compliance Types
 * Type definitions for nutritional compliance functionality
 * Extracted from nutritional-compliance.service.ts for better organization
 */

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  calcium: number;
  iron: number;
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  potassium: number;
}

export interface AllergenInfo {
  contains: string[];
  mayContain: string[];
  processedIn: string[];
  crossContamination: string[];
}

export interface DietaryCompliance {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  nutFree: boolean;
  halal: boolean;
  kosher: boolean;
  lowSodium: boolean;
  lowSugar: boolean;
  highProtein: boolean;
  highFiber: boolean;
  keto: boolean;
  paleo: boolean;
  organic: boolean;
}

export interface ComplianceResult {
  compliant: boolean;
  violations: Array<{
    rule: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    suggestion?: string;
  }>;
  warnings: Array<{
    rule: string;
    message: string;
    suggestion?: string;
  }>;
  score: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
    nutritionalInfo: Partial<NutritionalInfo>;
    allergens: string[];
    organic: boolean;
    processed: boolean;
    addedSugar: boolean;
    artificialColors: boolean;
    preservatives: boolean;
  }>;
  nutritionalInfo: NutritionalInfo;
  allergenInfo: AllergenInfo;
  dietaryCompliance: DietaryCompliance;
  ageGroups: string[];
  portionSize: number;
  servingUnit: string;
  preparationMethod: string;
  storageRequirements: string[];
  shelfLife: number;
  certifications: string[];
  available?: boolean;
  stock?: number;
}

export interface StudentDietaryProfile {
  id: string;
  studentId: string;
  allergies: Array<{
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
    symptoms: string[];
    treatment: string;
  }>;
  intolerances: Array<{
    substance: string;
    level: 'mild' | 'moderate' | 'severe';
    symptoms: string[];
  }>;
  dietaryRestrictions: Array<{
    type: string;
    reason: 'religious' | 'health' | 'personal' | 'medical';
    strictness: 'strict' | 'flexible';
    exceptions?: string[];
  }>;
  nutritionalRequirements: {
    calorieRange: { min: number; max: number };
    proteinMin: number;
    restrictions: {
      maxSodium?: number;
      maxSugar?: number;
      maxSaturatedFat?: number;
      minFiber?: number;
      minCalcium?: number;
      minIron?: number;
    };
  };
  medicalConditions: Array<{
    condition: string;
    dietaryImplications: string[];
    restrictedIngredients: string[];
    requiredNutrients: string[];
  }>;
  parentNotificationPreferences: {
    allergenAlerts: boolean;
    nutritionalDeviations: boolean;
    newMenuItems: boolean;
    complianceViolations: boolean;
  };
}
