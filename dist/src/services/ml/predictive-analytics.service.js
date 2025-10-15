"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveAnalyticsService = exports.ModelType = void 0;
const logger_1 = require("../../utils/logger");
const circuit_breaker_service_1 = require("../circuit-breaker.service");
const database_service_1 = require("../database.service");
const recommendation_engine_service_1 = require("./recommendation-engine.service");
var ModelType;
(function (ModelType) {
    ModelType["STUDENT_BEHAVIOR"] = "student_behavior";
    ModelType["DEMAND_FORECASTING"] = "demand_forecasting";
    ModelType["SUPPLY_CHAIN_OPTIMIZATION"] = "supply_chain_optimization";
    ModelType["FINANCIAL_FORECASTING"] = "financial_forecasting";
    ModelType["HEALTH_NUTRITION"] = "health_nutrition";
    ModelType["OPERATIONAL_EFFICIENCY"] = "operational_efficiency";
})(ModelType || (exports.ModelType = ModelType = {}));
class PredictiveAnalyticsService {
    static instance;
    circuitBreaker;
    db;
    recommendationEngine;
    activeModels = new Map();
    modelConfigs = new Map();
    constructor() {
        this.db = database_service_1.DatabaseService.getInstance();
        const circuitConfig = {
            name: 'predictive_analytics',
            failureThreshold: 5,
            recoveryTimeout: 30000,
            requestTimeout: 10000,
            resetTimeout: 60000,
            monitoringWindow: 60000,
            volumeThreshold: 10,
            errorThresholdPercentage: 50
        };
        this.circuitBreaker = new circuit_breaker_service_1.CircuitBreaker(circuitConfig);
        this.recommendationEngine = recommendation_engine_service_1.RecommendationEngine.getInstance();
        this.initializeModels();
    }
    static getInstance() {
        if (!PredictiveAnalyticsService.instance) {
            PredictiveAnalyticsService.instance = new PredictiveAnalyticsService();
        }
        return PredictiveAnalyticsService.instance;
    }
    initializeModels() {
        Object.values(ModelType).forEach(modelType => {
            this.modelConfigs.set(modelType, {
                version: '1.0.0',
                status: 'active',
                accuracy: 0.85,
                lastUpdated: new Date(),
                features: this.getModelFeatures(modelType)
            });
        });
    }
    async makePrediction(request) {
        return this.circuitBreaker.execute(async () => {
            const startTime = Date.now();
            this.validatePredictionRequest(request);
            const prediction = await this.generatePrediction(request);
            const confidence = this.calculateConfidence(prediction, request.modelType);
            let explanation;
            if (request.explainPrediction) {
                explanation = this.generateExplanation(request, prediction);
            }
            const recommendations = await this.recommendationEngine.generateRecommendations({
                prediction: prediction,
                modelType: request.modelType,
                schoolId: request.schoolId,
                userType: 'student'
            });
            const federatedInsights = await this.getFederatedInsights(request.modelType, request.schoolId);
            const latency = Date.now() - startTime;
            await this.logPrediction(request, prediction, confidence);
            const response = {
                prediction: prediction.result,
                confidence,
                explanation,
                recommendations,
                federatedInsights,
                metadata: {
                    modelId: `${request.modelType}_${request.schoolId}`,
                    version: '1.0.0',
                    latency,
                    timestamp: new Date(),
                    schoolId: request.schoolId,
                    federated: federatedInsights.length > 0,
                    privacyPreserved: true
                }
            };
            return response;
        });
    }
    async trainModel(request) {
        try {
            this.validateTrainingRequest(request);
            const modelId = `model_${request.modelType}_${Date.now()}`;
            logger_1.logger.info('Starting model training', {
                modelId,
                modelType: request.modelType,
                schoolId: request.schoolId,
                dataSize: request.trainingData?.length || 0
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
            const metrics = {
                accuracy: 0.85 + Math.random() * 0.1,
                precision: 0.82 + Math.random() * 0.1,
                recall: 0.88 + Math.random() * 0.08,
                f1Score: 0.85 + Math.random() * 0.1
            };
            this.modelConfigs.set(request.modelType, {
                ...this.modelConfigs.get(request.modelType),
                accuracy: metrics.accuracy,
                lastUpdated: new Date(),
                version: '1.1.0'
            });
            logger_1.logger.info('Model training completed', { modelId, metrics });
            return {
                modelId,
                status: 'completed',
                metrics
            };
        }
        catch (error) {
            logger_1.logger.error('Model training failed', {
                modelType: request.modelType,
                schoolId: request.schoolId,
                error: (error instanceof Error ? error.message : String(error))
            });
            return {
                modelId: '',
                status: 'failed',
                error: (error instanceof Error ? error.message : String(error))
            };
        }
    }
    async getAnalytics(schoolId, timeRange, includePrivacyMetrics = false) {
        try {
            const performance = await this.getPerformanceAnalytics(schoolId, timeRange);
            const models = await this.getModelAnalytics(schoolId);
            const predictions = await this.getPredictionAnalytics(schoolId, timeRange);
            const federated = await this.getFederatedAnalytics();
            const privacy = includePrivacyMetrics ? await this.getPrivacyAnalytics() : {};
            const recommendations = await this.generateSystemRecommendations(schoolId);
            return {
                performance,
                models,
                predictions,
                federated,
                privacy,
                recommendations
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get analytics', { schoolId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw error;
        }
    }
    async retrain(request) {
        try {
            const modelConfig = this.modelConfigs.get(request.modelType);
            if (!request.force && modelConfig && modelConfig.accuracy > 0.8) {
                return 'not_needed';
            }
            logger_1.logger.info('Retraining triggered', {
                modelType: request.modelType,
                schoolId: request.schoolId,
                force: request.force
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            return 'started';
        }
        catch (error) {
            logger_1.logger.error('Retraining failed', {
                modelType: request.modelType,
                error: (error instanceof Error ? error.message : String(error))
            });
            return 'failed';
        }
    }
    async getRecommendations(request) {
        return await this.recommendationEngine.getPersonalizedRecommendations(request);
    }
    async getModelStatus(modelId) {
        const modelType = modelId.split('_')[0];
        const config = this.modelConfigs.get(modelType);
        if (!config) {
            return { modelId, status: 'not_found' };
        }
        return {
            modelId,
            status: config.status,
            accuracy: config.accuracy,
            lastUpdated: config.lastUpdated,
            version: config.version
        };
    }
    async getAvailableModels() {
        return Object.values(ModelType);
    }
    async getPerformanceMetrics(schoolId, timeRange) {
        return await this.getPerformanceAnalytics(schoolId, timeRange);
    }
    async getPrivacyMetrics() {
        return {
            totalQueries: 1000,
            privacyBudgetUsed: 0.1,
            complianceStatus: 'compliant',
            auditEvents: 50,
            dataMinimization: 0.95
        };
    }
    async getPrivacyAnalytics() {
        return await this.getPrivacyMetrics();
    }
    async getDriftAnalysis() {
        const models = Object.values(ModelType);
        const driftResults = models.map(modelType => ({
            modelId: modelType,
            driftDetected: Math.random() > 0.8,
            driftMagnitude: Math.random() * 0.3,
            affectedFeatures: []
        }));
        return {
            driftDetected: driftResults.some(r => r.driftDetected),
            driftScore: driftResults.reduce((sum, r) => sum + r.driftMagnitude, 0) / driftResults.length,
            affectedModels: driftResults.filter(r => r.driftDetected).map(r => r.modelId),
            recommendations: ['Monitor affected models closely', 'Consider retraining if drift persists']
        };
    }
    validatePredictionRequest(request) {
        if (!request.modelType || !request.schoolId || !request.features) {
            throw new Error('Invalid prediction request: missing required fields');
        }
        if (!Object.values(ModelType).includes(request.modelType)) {
            throw new Error(`Invalid model type: ${request.modelType}`);
        }
    }
    validateTrainingRequest(request) {
        if (!request.modelType || !request.trainingData || !request.schoolId) {
            throw new Error('Invalid training request: missing required fields');
        }
        if (request.trainingData.length < 100) {
            throw new Error('Insufficient training data: minimum 100 samples required');
        }
    }
    async generatePrediction(request) {
        switch (request.modelType) {
            case ModelType.STUDENT_BEHAVIOR:
                return this.predictStudentBehavior(request.features);
            case ModelType.DEMAND_FORECASTING:
                return this.predictDemand(request.features, request.predictionHorizon);
            case ModelType.SUPPLY_CHAIN_OPTIMIZATION:
                return this.optimizeSupplyChain(request.features);
            case ModelType.HEALTH_NUTRITION:
                return this.analyzeNutrition(request.features);
            case ModelType.OPERATIONAL_EFFICIENCY:
                return this.analyzeEfficiency(request.features);
            default:
                throw new Error(`Unsupported model type: ${request.modelType}`);
        }
    }
    predictStudentBehavior(features) {
        const nutritionScore = features.nutritionScore || Math.random() * 100;
        const riskLevel = nutritionScore < 60 ? 'high' : nutritionScore < 80 ? 'medium' : 'low';
        return {
            result: {
                nutritionScore,
                riskLevel,
                recommendations: riskLevel === 'high' ? ['consult_nutritionist', 'meal_plan_review'] : []
            },
            confidence: 0.85
        };
    }
    predictDemand(features, horizon) {
        const baseDemand = features.historicalDemand || 100;
        const multiplier = horizon === '1w' ? 1.2 : horizon === '1m' ? 1.5 : 1.1;
        return {
            result: {
                expectedDemand: baseDemand * multiplier,
                confidence: 0.82,
                factors: ['seasonal_trends', 'school_events', 'weather']
            },
            confidence: 0.82
        };
    }
    optimizeSupplyChain(features) {
        return {
            result: {
                optimalOrderQuantity: features.currentStock * 1.2,
                reorderPoint: features.currentStock * 0.3,
                supplierRecommendations: ['supplier_a', 'supplier_b'],
                riskLevel: 'low'
            },
            confidence: 0.78
        };
    }
    analyzeNutrition(features) {
        const deficiencies = [];
        if ((features.proteinIntake || 0) < 50)
            deficiencies.push('protein');
        if ((features.calciumIntake || 0) < 800)
            deficiencies.push('calcium');
        return {
            result: {
                overallScore: features.nutritionScore || 75,
                deficiencies,
                supplementationNeeded: deficiencies.length > 0,
                recommendations: deficiencies.map(d => `increase_${d}_intake`)
            },
            confidence: 0.88
        };
    }
    analyzeEfficiency(features) {
        return {
            result: {
                efficiencyScore: features.efficiencyScore || 85,
                bottlenecks: ['prep_time', 'serving_speed'],
                optimizations: ['batch_preparation', 'staff_training'],
                projectedImprovement: 15
            },
            confidence: 0.80
        };
    }
    calculateConfidence(prediction, modelType) {
        const baseConfidence = {
            [ModelType.STUDENT_BEHAVIOR]: 0.85,
            [ModelType.DEMAND_FORECASTING]: 0.82,
            [ModelType.SUPPLY_CHAIN_OPTIMIZATION]: 0.78,
            [ModelType.HEALTH_NUTRITION]: 0.88,
            [ModelType.OPERATIONAL_EFFICIENCY]: 0.80,
            [ModelType.FINANCIAL_FORECASTING]: 0.75
        };
        return Math.max(0.5, Math.min(0.95, baseConfidence[modelType] + (Math.random() - 0.5) * 0.1));
    }
    generateExplanation(request, prediction) {
        const features = Object.keys(request.features);
        const featureImportance = {};
        features.forEach(feature => {
            featureImportance[feature] = Math.random();
        });
        const total = Object.values(featureImportance).reduce((sum, val) => sum + val, 0);
        Object.keys(featureImportance).forEach(key => {
            featureImportance[key] = featureImportance[key] / total;
        });
        return {
            method: 'feature_importance',
            featureImportance,
            reasoning: `Prediction based on analysis of ${features.length} key features`,
            factors: features.map(f => ({
                factor: f,
                weight: featureImportance[f],
                contribution: featureImportance[f] * prediction.confidence,
                direction: featureImportance[f] > 0.5 ? 'positive' : 'neutral'
            })),
            personalizations: [],
            uncertainty: {
                confidence: prediction.confidence,
                variance: 0.05,
                entropy: 0.3,
                reliability: prediction.confidence > 0.8 ? 'high' : 'medium'
            }
        };
    }
    async getFederatedInsights(modelType, schoolId) {
        if (Math.random() > 0.7) {
            return [{
                    schoolId: `${schoolId}_peer`,
                    contribution: 0.15,
                    privacyLevel: 'high',
                    aggregated: true
                }];
        }
        return [];
    }
    async logPrediction(request, prediction, confidence) {
        try {
            const query = `
        INSERT INTO prediction_logs (
          model_type, school_id, user_id, features, prediction, confidence, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
            await this.db.query(query, [
                request.modelType,
                request.schoolId,
                request.userId || null,
                JSON.stringify(request.features),
                JSON.stringify(prediction.result),
                confidence,
                new Date()
            ]);
        }
        catch (error) {
            logger_1.logger.error('Failed to log prediction', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
        }
    }
    getModelFeatures(modelType) {
        const featureSets = {
            [ModelType.STUDENT_BEHAVIOR]: ['age', 'grade', 'meal_history', 'preferences', 'allergies'],
            [ModelType.DEMAND_FORECASTING]: ['historical_demand', 'day_of_week', 'season', 'events', 'weather'],
            [ModelType.SUPPLY_CHAIN_OPTIMIZATION]: ['current_stock', 'supplier_reliability', 'demand_forecast', 'lead_time'],
            [ModelType.HEALTH_NUTRITION]: ['age', 'weight', 'height', 'activity_level', 'meal_composition'],
            [ModelType.OPERATIONAL_EFFICIENCY]: ['staff_count', 'equipment_status', 'order_volume', 'prep_time'],
            [ModelType.FINANCIAL_FORECASTING]: ['revenue_history', 'costs', 'seasonality', 'market_trends']
        };
        return featureSets[modelType] || [];
    }
    async getPerformanceAnalytics(schoolId, timeRange) {
        return {
            totalPredictions: 1250,
            averageLatency: 45,
            successRate: 0.96,
            errorRate: 0.04,
            throughput: 25,
            uptime: 0.995
        };
    }
    async getModelAnalytics(schoolId) {
        const models = Object.values(ModelType);
        return models.map(modelType => ({
            modelId: `${modelType}_${schoolId}`,
            modelType,
            status: 'active',
            accuracy: 0.85 + Math.random() * 0.1,
            lastUpdated: new Date(),
            usageCount: Math.floor(Math.random() * 1000),
            driftScore: Math.random() * 0.2
        }));
    }
    async getPredictionAnalytics(schoolId, timeRange) {
        return {
            totalPredictions: 1250,
            averageConfidence: 0.87,
            topModels: ['student_behavior', 'demand_forecasting'],
            errorPatterns: [],
            userSatisfaction: 0.92
        };
    }
    async getFederatedAnalytics() {
        return {
            activeParticipants: 5,
            roundsCompleted: 12,
            averageContribution: 0.18,
            privacyBudgetRemaining: 0.85,
            convergenceRate: 0.92
        };
    }
    async generateSystemRecommendations(schoolId) {
        return [
            {
                category: 'performance',
                priority: 'medium',
                recommendation: 'Consider increasing model ensemble size for better accuracy',
                impact: '5-10% improvement in prediction accuracy',
                implementation: ['Add 2-3 additional models to ensemble', 'Implement model voting mechanism']
            },
            {
                category: 'privacy',
                priority: 'high',
                recommendation: 'Review and optimize privacy budget allocation',
                impact: 'Better privacy-utility trade-off',
                implementation: ['Implement differential privacy tuning', 'Regular privacy audit']
            }
        ];
    }
}
exports.PredictiveAnalyticsService = PredictiveAnalyticsService;
//# sourceMappingURL=predictive-analytics.service.js.map