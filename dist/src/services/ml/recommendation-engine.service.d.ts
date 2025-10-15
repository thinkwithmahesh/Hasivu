export interface Recommendation {
    type: string;
    title: string;
    description: string;
    impact_score: number;
    confidence: number;
    actions: RecommendationAction[];
    explanation: string;
    priority: 'high' | 'medium' | 'low';
    timeframe: string;
}
export interface RecommendationAction {
    action: string;
    parameters: Record<string, any>;
    expectedOutcome: string;
}
export interface RecommendationRequest {
    userId: string;
    userType: 'student' | 'parent' | 'kitchen_staff' | 'admin';
    schoolId: string;
    context?: Record<string, any>;
    limit?: number;
}
export interface RecommendationContext {
    prediction?: any;
    modelType?: string;
    schoolId?: string;
    userType?: string;
}
export declare class RecommendationEngine {
    private static instance;
    private db;
    private redis;
    private constructor();
    static getInstance(): RecommendationEngine;
    getPersonalizedRecommendations(request: RecommendationRequest): Promise<Recommendation[]>;
    generateRecommendations(context: RecommendationContext): Promise<Recommendation[]>;
    private generateStudentRecommendations;
    private generateParentRecommendations;
    private generateKitchenStaffRecommendations;
    private generateAdminRecommendations;
    private generateBehaviorRecommendations;
    private generateDemandRecommendations;
    private generateSupplyChainRecommendations;
    private generateNutritionRecommendations;
    private getUserProfile;
    private getUserHistory;
}
//# sourceMappingURL=recommendation-engine.service.d.ts.map