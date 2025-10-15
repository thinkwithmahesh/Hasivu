"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationEngine = void 0;
const logger_1 = require("../../utils/logger");
const database_service_1 = require("../database.service");
const redis_service_1 = __importDefault(require("../redis.service"));
class RecommendationEngine {
    static instance;
    db;
    redis;
    constructor() {
        this.db = database_service_1.DatabaseService.getInstance();
        this.redis = redis_service_1.default;
    }
    static getInstance() {
        if (!RecommendationEngine.instance) {
            RecommendationEngine.instance = new RecommendationEngine();
        }
        return RecommendationEngine.instance;
    }
    async getPersonalizedRecommendations(request) {
        try {
            const recommendations = [];
            const userProfile = await this.getUserProfile(request.userId, request.userType);
            const userHistory = await this.getUserHistory(request.userId, request.userType);
            switch (request.userType) {
                case 'student':
                    recommendations.push(...await this.generateStudentRecommendations(userProfile, userHistory, request));
                    break;
                case 'parent':
                    recommendations.push(...await this.generateParentRecommendations(userProfile, userHistory, request));
                    break;
                case 'kitchen_staff':
                    recommendations.push(...await this.generateKitchenStaffRecommendations(userProfile, userHistory, request));
                    break;
                case 'admin':
                    recommendations.push(...await this.generateAdminRecommendations(userProfile, userHistory, request));
                    break;
            }
            recommendations.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
                if (priorityDiff !== 0)
                    return priorityDiff;
                return b.impact_score - a.impact_score;
            });
            const limit = request.limit || 10;
            return recommendations.slice(0, limit);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate recommendations', {
                userId: request.userId,
                userType: request.userType,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return [];
        }
    }
    async generateRecommendations(context) {
        try {
            const recommendations = [];
            if (!context.prediction || !context.modelType) {
                return recommendations;
            }
            switch (context.modelType) {
                case 'student_behavior':
                    recommendations.push(...this.generateBehaviorRecommendations(context.prediction));
                    break;
                case 'demand_forecasting':
                    recommendations.push(...this.generateDemandRecommendations(context.prediction));
                    break;
                case 'supply_chain_optimization':
                    recommendations.push(...this.generateSupplyChainRecommendations(context.prediction));
                    break;
                case 'health_nutrition':
                    recommendations.push(...this.generateNutritionRecommendations(context.prediction));
                    break;
            }
            return recommendations;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate context recommendations', {
                modelType: context.modelType,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return [];
        }
    }
    async generateStudentRecommendations(userProfile, userHistory, request) {
        const recommendations = [];
        if (userHistory.nutritionScore < 70) {
            recommendations.push({
                type: 'nutrition',
                title: 'Improve Your Nutrition Score',
                description: 'Your nutrition score could be improved with better food choices',
                impact_score: 8.5,
                confidence: 0.85,
                priority: 'high',
                timeframe: '2 weeks',
                explanation: 'Based on your meal selections over the past month',
                actions: [
                    {
                        action: 'try_new_foods',
                        parameters: { categories: ['vegetables', 'proteins'] },
                        expectedOutcome: 'Increased nutrition score by 15-20 points'
                    },
                    {
                        action: 'balanced_meals',
                        parameters: { target_balance: 0.7 },
                        expectedOutcome: 'Better macronutrient balance'
                    }
                ]
            });
        }
        if (userHistory.foodVariety < 60) {
            recommendations.push({
                type: 'variety',
                title: 'Explore New Foods',
                description: 'Try different types of food to improve your nutrition variety',
                impact_score: 7.2,
                confidence: 0.78,
                priority: 'medium',
                timeframe: '1 week',
                explanation: 'Limited food variety may affect nutrient intake diversity',
                actions: [
                    {
                        action: 'weekly_challenge',
                        parameters: { new_items_per_week: 2 },
                        expectedOutcome: 'Increased food variety score'
                    }
                ]
            });
        }
        if (userHistory.socialEngagement < 50) {
            recommendations.push({
                type: 'social',
                title: 'Connect with Friends',
                description: 'Eating with friends can make meals more enjoyable',
                impact_score: 6.8,
                confidence: 0.72,
                priority: 'medium',
                timeframe: 'Ongoing',
                explanation: 'Social eating improves meal satisfaction and nutrition',
                actions: [
                    {
                        action: 'group_meals',
                        parameters: { frequency: '2-3 times per week' },
                        expectedOutcome: 'Improved meal satisfaction and social connections'
                    }
                ]
            });
        }
        return recommendations;
    }
    async generateParentRecommendations(userProfile, userHistory, request) {
        const recommendations = [];
        recommendations.push({
            type: 'monitoring',
            title: 'Monitor Child Nutrition Progress',
            description: 'Regularly check your child\'s nutrition analytics',
            impact_score: 9.2,
            confidence: 0.92,
            priority: 'high',
            timeframe: 'Weekly',
            explanation: 'Active parental monitoring improves child nutrition outcomes',
            actions: [
                {
                    action: 'weekly_review',
                    parameters: { frequency: 'weekly', focus_areas: ['nutrition_score', 'variety', 'balance'] },
                    expectedOutcome: 'Better awareness of child nutrition patterns'
                },
                {
                    action: 'set_goals',
                    parameters: { categories: ['nutrition', 'variety', 'hydration'] },
                    expectedOutcome: 'Improved child nutrition through targeted goals'
                }
            ]
        });
        if (userHistory.familyMeals < 5) {
            recommendations.push({
                type: 'family',
                title: 'Plan More Family Meals',
                description: 'Increase family meal frequency for better nutrition and bonding',
                impact_score: 8.7,
                confidence: 0.85,
                priority: 'high',
                timeframe: '2 weeks',
                explanation: 'Family meals improve nutrition quality and family relationships',
                actions: [
                    {
                        action: 'meal_planning',
                        parameters: { meals_per_week: 5, include_children: true },
                        expectedOutcome: 'Increased family meal frequency and better nutrition'
                    }
                ]
            });
        }
        if (userHistory.spendingEfficiency < 70) {
            recommendations.push({
                type: 'budget',
                title: 'Optimize Food Budget',
                description: 'Get better value for your food spending',
                impact_score: 7.5,
                confidence: 0.80,
                priority: 'medium',
                timeframe: '1 month',
                explanation: 'Efficient spending allows for better nutrition within budget',
                actions: [
                    {
                        action: 'budget_analysis',
                        parameters: { target_efficiency: 80 },
                        expectedOutcome: 'Better nutrition value per rupee spent'
                    }
                ]
            });
        }
        return recommendations;
    }
    async generateKitchenStaffRecommendations(userProfile, userHistory, request) {
        const recommendations = [];
        if (userHistory.inventoryAccuracy < 85) {
            recommendations.push({
                type: 'inventory',
                title: 'Improve Inventory Accuracy',
                description: 'Better inventory tracking reduces waste and improves planning',
                impact_score: 8.8,
                confidence: 0.88,
                priority: 'high',
                timeframe: '1 week',
                explanation: 'Accurate inventory is crucial for efficient kitchen operations',
                actions: [
                    {
                        action: 'inventory_audit',
                        parameters: { frequency: 'daily', accuracy_target: 95 },
                        expectedOutcome: 'Reduced waste and better resource planning'
                    }
                ]
            });
        }
        if (userHistory.prepEfficiency < 75) {
            recommendations.push({
                type: 'efficiency',
                title: 'Optimize Food Preparation',
                description: 'Streamline preparation processes to serve meals faster',
                impact_score: 8.2,
                confidence: 0.82,
                priority: 'high',
                timeframe: '2 weeks',
                explanation: 'Efficient preparation improves service quality and reduces wait times',
                actions: [
                    {
                        action: 'process_optimization',
                        parameters: { target_efficiency: 85, focus_areas: ['prep_time', 'batch_cooking'] },
                        expectedOutcome: 'Faster service and improved meal quality'
                    }
                ]
            });
        }
        if (userHistory.wastePercentage > 15) {
            recommendations.push({
                type: 'waste',
                title: 'Reduce Food Waste',
                description: 'Implement strategies to minimize food waste',
                impact_score: 7.9,
                confidence: 0.85,
                priority: 'medium',
                timeframe: '3 weeks',
                explanation: 'Reducing waste improves sustainability and cost efficiency',
                actions: [
                    {
                        action: 'portion_control',
                        parameters: { waste_target: 10, monitoring_frequency: 'daily' },
                        expectedOutcome: 'Reduced waste and improved cost efficiency'
                    }
                ]
            });
        }
        return recommendations;
    }
    async generateAdminRecommendations(userProfile, userHistory, request) {
        const recommendations = [];
        recommendations.push({
            type: 'program',
            title: 'Implement School Nutrition Program',
            description: 'Develop comprehensive nutrition education and monitoring program',
            impact_score: 9.5,
            confidence: 0.95,
            priority: 'high',
            timeframe: '1 month',
            explanation: 'Comprehensive programs improve overall school nutrition outcomes',
            actions: [
                {
                    action: 'program_design',
                    parameters: {
                        components: ['education', 'monitoring', 'intervention', 'evaluation'],
                        target_completion: '30 days'
                    },
                    expectedOutcome: 'Improved school-wide nutrition metrics'
                }
            ]
        });
        if (userHistory.vendorSatisfaction < 80) {
            recommendations.push({
                type: 'vendor',
                title: 'Monitor Vendor Performance',
                description: 'Regular vendor performance reviews and feedback',
                impact_score: 8.5,
                confidence: 0.88,
                priority: 'high',
                timeframe: '2 weeks',
                explanation: 'Quality vendor relationships ensure consistent meal quality',
                actions: [
                    {
                        action: 'vendor_reviews',
                        parameters: { frequency: 'weekly', metrics: ['quality', 'timeliness', 'satisfaction'] },
                        expectedOutcome: 'Improved vendor performance and meal quality'
                    }
                ]
            });
        }
        if (userHistory.studentEngagement < 70) {
            recommendations.push({
                type: 'engagement',
                title: 'Boost Student Engagement',
                description: 'Implement programs to increase student participation in nutrition programs',
                impact_score: 8.0,
                confidence: 0.82,
                priority: 'medium',
                timeframe: '1 month',
                explanation: 'Engaged students show better nutrition outcomes',
                actions: [
                    {
                        action: 'engagement_campaign',
                        parameters: { target_engagement: 80, activities: ['education', 'feedback', 'recognition'] },
                        expectedOutcome: 'Higher student participation and satisfaction'
                    }
                ]
            });
        }
        return recommendations;
    }
    generateBehaviorRecommendations(prediction) {
        const recommendations = [];
        if (prediction.riskLevel === 'high') {
            recommendations.push({
                type: 'intervention',
                title: 'Immediate Nutrition Intervention Required',
                description: 'Student shows high-risk nutrition patterns requiring immediate attention',
                impact_score: 9.8,
                confidence: prediction.confidence || 0.9,
                priority: 'high',
                timeframe: 'Immediate',
                explanation: 'Early intervention prevents long-term nutrition issues',
                actions: [
                    {
                        action: 'parent_notification',
                        parameters: { urgency: 'high', recommended_actions: ['consult_nutritionist', 'meal_plan_review'] },
                        expectedOutcome: 'Improved nutrition patterns and reduced health risks'
                    }
                ]
            });
        }
        return recommendations;
    }
    generateDemandRecommendations(prediction) {
        const recommendations = [];
        if (prediction.expectedDemand > prediction.capacity * 1.2) {
            recommendations.push({
                type: 'capacity',
                title: 'Increase Production Capacity',
                description: 'Expected demand exceeds current capacity by more than 20%',
                impact_score: 9.0,
                confidence: prediction.confidence || 0.85,
                priority: 'high',
                timeframe: '1 week',
                explanation: 'Proactive capacity planning prevents service disruptions',
                actions: [
                    {
                        action: 'capacity_planning',
                        parameters: { increase_percentage: 25, timeframe: '1 week' },
                        expectedOutcome: 'Adequate capacity to meet expected demand'
                    }
                ]
            });
        }
        return recommendations;
    }
    generateSupplyChainRecommendations(prediction) {
        const recommendations = [];
        if (prediction.disruptionRisk > 0.7) {
            recommendations.push({
                type: 'supply_chain',
                title: 'Address Supply Chain Risk',
                description: 'High risk of supply disruption detected',
                impact_score: 8.5,
                confidence: prediction.confidence || 0.8,
                priority: 'high',
                timeframe: '3 days',
                explanation: 'Proactive risk management ensures continuous service',
                actions: [
                    {
                        action: 'alternative_suppliers',
                        parameters: { risk_level: 'high', backup_options: 2 },
                        expectedOutcome: 'Reduced supply disruption risk'
                    }
                ]
            });
        }
        return recommendations;
    }
    generateNutritionRecommendations(prediction) {
        const recommendations = [];
        if (prediction.deficiencyRisk > 0.6) {
            recommendations.push({
                type: 'nutrition_supplement',
                title: 'Nutrition Supplementation Needed',
                description: 'Risk of nutritional deficiencies detected',
                impact_score: 8.2,
                confidence: prediction.confidence || 0.75,
                priority: 'medium',
                timeframe: '2 weeks',
                explanation: 'Preventive supplementation improves long-term health outcomes',
                actions: [
                    {
                        action: 'supplement_program',
                        parameters: { deficiencies: prediction.deficientNutrients, duration: '8 weeks' },
                        expectedOutcome: 'Corrected nutritional deficiencies'
                    }
                ]
            });
        }
        return recommendations;
    }
    async getUserProfile(userId, userType) {
        try {
            const query = 'SELECT * FROM users WHERE id = ?';
            const result = await this.db.query(query, [userId]);
            return result[0] || {};
        }
        catch (error) {
            logger_1.logger.error('Failed to get user profile', { userId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            return {};
        }
    }
    async getUserHistory(userId, userType) {
        return {
            nutritionScore: Math.random() * 40 + 60,
            foodVariety: Math.random() * 40 + 50,
            socialEngagement: Math.random() * 50 + 30,
            familyMeals: Math.floor(Math.random() * 7),
            spendingEfficiency: Math.random() * 30 + 60,
            inventoryAccuracy: Math.random() * 20 + 75,
            prepEfficiency: Math.random() * 25 + 65,
            wastePercentage: Math.random() * 15 + 5,
            vendorSatisfaction: Math.random() * 25 + 70,
            studentEngagement: Math.random() * 30 + 60
        };
    }
}
exports.RecommendationEngine = RecommendationEngine;
//# sourceMappingURL=recommendation-engine.service.js.map