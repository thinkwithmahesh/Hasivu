export interface NutritionalInfo {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber?: number;
    sodium?: number;
    sugar?: number;
    vitamins?: {
        [key: string]: number;
    };
    minerals?: {
        [key: string]: number;
    };
}
export interface AllergenInfo {
    allergens: string[];
    crossContaminationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    safetyNotes: string[];
}
export interface DietaryCompliance {
    vegetarian: boolean;
    vegan: boolean;
    jain: boolean;
    glutenFree: boolean;
    dairyFree: boolean;
    nutFree: boolean;
}
export interface GovernmentCompliance {
    indianStandards: {
        compliant: boolean;
        violations: string[];
        recommendations: string[];
    };
    whoGuidelines: {
        compliant: boolean;
        violations: string[];
        recommendations: string[];
    };
}
export interface NutritionalAnalysis {
    menuItemId: string;
    totalCalories: number;
    macronutrients: {
        protein: number;
        carbohydrates: number;
        fat: number;
    };
    micronutrients: {
        vitamins: {
            [key: string]: number;
        };
        minerals: {
            [key: string]: number;
        };
    };
    allergens: AllergenInfo;
    dietaryCompliance: DietaryCompliance;
    governmentCompliance: GovernmentCompliance;
    nutritionScore: number;
    healthRating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    recommendations: string[];
    warnings: string[];
    analysisTimestamp: Date;
}
export interface StudentNutritionalProfile {
    studentId: string;
    age: number;
    weight?: number;
    height?: number;
    allergens: string[];
    dietaryRestrictions: string[];
    healthConditions: string[];
    nutritionalNeeds: {
        dailyCalories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
    };
}
export interface MenuItem {
    id: string;
    name: string;
    ingredients: Array<{
        name: string;
        quantity?: string;
        nutritionalValue: NutritionalInfo;
    }>;
    available?: boolean;
    stock?: number;
}
export interface BatchAnalysisResult {
    results: NutritionalAnalysis[];
    totalProcessed: number;
    errors: Array<{
        menuItemId: string;
        error: string;
    }>;
    processingTime: number;
}
export declare class NutritionalComplianceService {
    private indianNutritionalStandards;
    private whoGuidelines;
    private allergenDatabase;
    constructor();
    analyzeNutritionalContent(menuItem: MenuItem): Promise<NutritionalAnalysis>;
    batchNutritionalAnalysis(menuItems: MenuItem[]): Promise<BatchAnalysisResult>;
    analyzeStudentSafety(menuItem: MenuItem, studentProfile: StudentNutritionalProfile): Promise<{
        safe: boolean;
        risks: string[];
        alternatives: string[];
        modifications: string[];
    }>;
    getPersonalizedRecommendations(studentProfile: StudentNutritionalProfile, availableMenu: MenuItem[]): Promise<{
        recommended: string[];
        avoid: string[];
        modifications: Map<string, string[]>;
    }>;
    detectAllergens(menuItem: MenuItem): Promise<AllergenInfo>;
    validateDietaryRestrictions(menuItem: MenuItem, restrictions: string[]): Promise<{
        compliant: boolean;
        violations: string[];
        recommendations: string[];
    }>;
    assessAllergenSafety(menuItem: MenuItem, studentProfile: StudentNutritionalProfile): Promise<{
        safe: boolean;
        warnings: string[];
        recommendations: string[];
    }>;
    validateGovernmentCompliance(menuItem: MenuItem, standard: string): Promise<{
        compliant: boolean;
        violations: string[];
        recommendations: string[];
    }>;
    suggestMenuImprovements(menu: MenuItem[]): Promise<{
        issues: string[];
        suggestions: string[];
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
    }>;
    comprehensiveStudentSafetyCheck(menuItem: MenuItem, studentProfile: StudentNutritionalProfile): Promise<{
        overallSafety: 'SAFE' | 'CAUTION' | 'DANGEROUS';
        allergenSafety: {
            safe: boolean;
            risks: string[];
        };
        dietarySafety: {
            safe: boolean;
            risks: string[];
        };
        nutritionalSafety: {
            safe: boolean;
            concerns: string[];
        };
        recommendations: string[];
    }>;
    private calculateTotalNutrition;
    private analyzeAllergens;
    private checkDietaryCompliance;
    private checkGovernmentCompliance;
    private calculateNutritionScore;
    private getHealthRating;
    private generateRecommendationsAndWarnings;
}
//# sourceMappingURL=nutritional-compliance.service.d.ts.map