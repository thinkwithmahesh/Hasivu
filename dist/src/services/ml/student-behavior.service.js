"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentBehaviorService = exports.BehaviorPredictionType = void 0;
const logger_1 = require("../../utils/logger");
const database_service_1 = require("../database.service");
const ml_base_service_1 = require("./ml-base.service");
const tf = __importStar(require("@tensorflow/tfjs-node"));
var BehaviorPredictionType;
(function (BehaviorPredictionType) {
    BehaviorPredictionType["MEAL_PREFERENCE"] = "meal_preference";
    BehaviorPredictionType["ORDER_TIMING"] = "order_timing";
    BehaviorPredictionType["QUANTITY_PREFERENCE"] = "quantity_preference";
    BehaviorPredictionType["DIETARY_COMPLIANCE"] = "dietary_compliance";
    BehaviorPredictionType["NUTRITIONAL_NEEDS"] = "nutritional_needs";
    BehaviorPredictionType["SOCIAL_INFLUENCE"] = "social_influence";
    BehaviorPredictionType["SEASONAL_PREFERENCE"] = "seasonal_preference";
    BehaviorPredictionType["HEALTH_OUTCOME"] = "health_outcome";
})(BehaviorPredictionType || (exports.BehaviorPredictionType = BehaviorPredictionType = {}));
class StudentBehaviorService extends ml_base_service_1.MLBaseService {
    static instance;
    featureExtractor;
    constructor() {
        super();
        this.featureExtractor = new StudentBehaviorFeatureExtractor();
    }
    static getInstance() {
        if (!StudentBehaviorService.instance) {
            StudentBehaviorService.instance = new StudentBehaviorService();
        }
        return StudentBehaviorService.instance;
    }
    async initialize() {
        await super.initialize();
        await this.featureExtractor.initialize();
        await this.ensureBehaviorModels();
        logger_1.logger.info('Student Behavior Service initialized successfully');
    }
    async trainBehaviorModel(predictionType, schoolId, options = {}) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Training student behavior model', {
                predictionType,
                schoolId,
                options
            });
            const trainingData = await this.prepareTrainingData(predictionType, schoolId, options.dataRange);
            if (trainingData.features.length < 100) {
                throw new Error(`Insufficient training data: ${trainingData.features.length} samples (minimum 100 required)`);
            }
            const config = this.createBehaviorModelConfig(predictionType, trainingData);
            const modelId = await this.createModel(ml_base_service_1.ModelType.STUDENT_BEHAVIOR, config, schoolId, 'student-behavior-service');
            const tfTrainingData = {
                features: tf.tensor2d(trainingData.features),
                labels: tf.tensor1d(trainingData.labels),
                metadata: { predictionType, schoolId }
            };
            const metrics = await this.trainModelWithData(modelId, tfTrainingData);
            await this.tagModel(modelId, [predictionType, 'student-behavior', schoolId || 'global']);
            const duration = Date.now() - startTime;
            logger_1.logger.info('Student behavior model trained successfully', {
                modelId,
                predictionType,
                duration,
                samples: trainingData.features.length,
                accuracy: metrics.accuracy
            });
            return modelId;
        }
        catch (error) {
            logger_1.logger.error('Failed to train student behavior model', {
                predictionType,
                schoolId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async predictStudentBehavior(studentId, predictionType, context = {}) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Predicting student behavior', {
                studentId,
                predictionType
            });
            const features = await this.featureExtractor.extractStudentFeatures(studentId, context);
            const modelId = await this.getBehaviorModelId(predictionType, features.schoolId);
            if (!modelId) {
                throw new Error(`No trained model found for prediction type: ${predictionType}`);
            }
            const request = {
                modelId,
                features: this.featuresToPredictionInput(features),
                schoolId: features.schoolId,
                userId: studentId,
                requireConfidence: true,
                explainPrediction: true
            };
            const response = await this.makePrediction(request);
            const interpretedPrediction = this.interpretBehaviorPrediction(predictionType, response, features);
            const prediction = {
                studentId,
                predictionType,
                prediction: interpretedPrediction.value,
                confidence: response.confidence,
                probability: response.probability,
                explanation: {
                    topFactors: interpretedPrediction.topFactors,
                    reasoning: interpretedPrediction.reasoning,
                    recommendations: interpretedPrediction.recommendations
                },
                metadata: {
                    modelVersion: response.version,
                    timestamp: response.timestamp,
                    features
                }
            };
            const duration = Date.now() - startTime;
            logger_1.logger.info('Student behavior predicted successfully', {
                studentId,
                predictionType,
                confidence: response.confidence,
                duration
            });
            return prediction;
        }
        catch (error) {
            logger_1.logger.error('Failed to predict student behavior', {
                studentId,
                predictionType,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async generateStudentAnalytics(studentId, timeframe = 'month') {
        try {
            logger_1.logger.info('Generating student behavior analytics', { studentId, timeframe });
            const patterns = await this.analyzeStudentPatterns(studentId, timeframe);
            const predictions = await this.generateBehaviorPredictions(studentId);
            const recommendations = await this.generatePersonalizedRecommendations(studentId, patterns);
            const analytics = {
                studentId,
                analysisDate: new Date(),
                timeframe,
                patterns,
                predictions,
                recommendations
            };
            await this.cacheStudentAnalytics(studentId, analytics);
            logger_1.logger.info('Student behavior analytics generated successfully', { studentId });
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate student analytics', {
                studentId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async getGroupBehaviorInsights(studentIds, predictionType) {
        try {
            const insights = [];
            const batchSize = 10;
            for (let i = 0; i < studentIds.length; i += batchSize) {
                const batch = studentIds.slice(i, i + batchSize);
                const batchPromises = batch.map(studentId => this.predictStudentBehavior(studentId, predictionType));
                const batchResults = await Promise.allSettled(batchPromises);
                for (let j = 0; j < batchResults.length; j++) {
                    const result = batchResults[j];
                    const studentId = batch[j];
                    if (result.status === 'fulfilled') {
                        const prediction = result.value;
                        insights.push({
                            studentId,
                            prediction: prediction.prediction,
                            confidence: prediction.confidence,
                            riskLevel: this.calculateRiskLevel(prediction)
                        });
                    }
                    else {
                        logger_1.logger.warn('Failed to predict for student', {
                            studentId,
                            error: result.reason.message
                        });
                        insights.push({
                            studentId,
                            prediction: null,
                            confidence: 0,
                            riskLevel: 'medium'
                        });
                    }
                }
            }
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Failed to get group behavior insights', {
                studentCount: studentIds.length,
                predictionType,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async trainModel(data, config) {
        const model = tf.sequential();
        model.add(tf.layers.dense({
            units: 128,
            activation: 'relu',
            inputShape: [config.features.length],
            name: 'input_layer'
        }));
        model.add(tf.layers.dropout({ rate: 0.2, name: 'dropout_1' }));
        model.add(tf.layers.dense({
            units: 64,
            activation: 'relu',
            name: 'hidden_layer_1'
        }));
        model.add(tf.layers.dropout({ rate: 0.2, name: 'dropout_2' }));
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu',
            name: 'hidden_layer_2'
        }));
        const outputUnits = this.getOutputUnits(config);
        const outputActivation = this.getOutputActivation(config);
        model.add(tf.layers.dense({
            units: outputUnits,
            activation: outputActivation,
            name: 'output_layer'
        }));
        model.compile({
            optimizer: tf.train.adam(config.learningRate || 0.001),
            loss: this.getLossFunction(config),
            metrics: ['accuracy']
        });
        const history = await model.fit(data.features, data.labels, {
            epochs: config.epochs || 100,
            batchSize: config.batchSize || 32,
            validationSplit: config.validationSplit || 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        logger_1.logger.info('Training progress', {
                            epoch,
                            loss: logs?.loss,
                            accuracy: logs?.acc,
                            valLoss: logs?.val_loss,
                            valAccuracy: logs?.val_acc
                        });
                    }
                }
            }
        });
        return model;
    }
    async predict(model, features) {
        return model.predict(features);
    }
    async ensureBehaviorModels() {
        const behaviorTypes = Object.values(BehaviorPredictionType);
        for (const type of behaviorTypes) {
            const existingModels = await this.listModels({
                modelType: ml_base_service_1.ModelType.STUDENT_BEHAVIOR
            });
            const typeModels = existingModels.filter(model => model.tags.includes(type));
            if (typeModels.length === 0) {
                logger_1.logger.info('No existing model found for behavior type', { type });
            }
        }
    }
    async prepareTrainingData(predictionType, schoolId, dateRange) {
        const trainingData = await this.featureExtractor.extractTrainingData(predictionType, schoolId, dateRange);
        return trainingData;
    }
    createBehaviorModelConfig(predictionType, trainingData) {
        const featureCount = trainingData.features[0]?.length || 0;
        return {
            modelType: ml_base_service_1.ModelType.STUDENT_BEHAVIOR,
            architecture: 'neural_network',
            hyperparameters: {
                hiddenUnits: [128, 64, 32],
                dropoutRate: 0.2,
                predictionType
            },
            features: this.getBehaviorFeatures(predictionType),
            targetColumn: this.getTargetColumn(predictionType),
            validationSplit: 0.2,
            batchSize: 32,
            epochs: 100,
            learningRate: 0.001,
            regularization: {
                l2: 0.001,
                dropout: 0.2
            },
            optimizer: 'adam',
            lossFunction: this.getLossFunction({ hyperparameters: { predictionType } }),
            earlyStoppingPatience: 10
        };
    }
    getBehaviorFeatures(predictionType) {
        const baseFeatures = [
            'age', 'grade', 'totalOrders', 'avgOrderValue', 'orderFrequency',
            'proteinPreference', 'vegetarianTendency', 'spicyFoodTolerance',
            'peersInfluence', 'seasonalVariation', 'timeOfDay', 'dayOfWeek'
        ];
        switch (predictionType) {
            case BehaviorPredictionType.MEAL_PREFERENCE:
                return [...baseFeatures, 'sweetTooth', 'energyLevels', 'physicalActivity'];
            case BehaviorPredictionType.ORDER_TIMING:
                return [...baseFeatures, 'avgOrderTime', 'weekdayVsWeekend', 'schoolEventImpact'];
            case BehaviorPredictionType.NUTRITIONAL_NEEDS:
                return [...baseFeatures, 'bmi', 'energyLevels', 'concentrationLevels', 'physicalActivity'];
            default:
                return baseFeatures;
        }
    }
    getTargetColumn(predictionType) {
        switch (predictionType) {
            case BehaviorPredictionType.MEAL_PREFERENCE:
                return 'preferred_meal_category';
            case BehaviorPredictionType.ORDER_TIMING:
                return 'next_order_time';
            case BehaviorPredictionType.NUTRITIONAL_NEEDS:
                return 'nutritional_requirement_score';
            default:
                return 'behavior_score';
        }
    }
    getOutputUnits(config) {
        const predictionType = config.hyperparameters.predictionType;
        switch (predictionType) {
            case BehaviorPredictionType.MEAL_PREFERENCE:
                return 10;
            case BehaviorPredictionType.ORDER_TIMING:
                return 24;
            case BehaviorPredictionType.NUTRITIONAL_NEEDS:
                return 1;
            default:
                return 1;
        }
    }
    getOutputActivation(config) {
        const predictionType = config.hyperparameters.predictionType;
        switch (predictionType) {
            case BehaviorPredictionType.MEAL_PREFERENCE:
            case BehaviorPredictionType.ORDER_TIMING:
                return 'softmax';
            case BehaviorPredictionType.NUTRITIONAL_NEEDS:
                return 'linear';
            default:
                return 'sigmoid';
        }
    }
    getLossFunction(config) {
        const predictionType = config.hyperparameters?.predictionType;
        switch (predictionType) {
            case BehaviorPredictionType.MEAL_PREFERENCE:
            case BehaviorPredictionType.ORDER_TIMING:
                return 'sparseCategoricalCrossentropy';
            case BehaviorPredictionType.NUTRITIONAL_NEEDS:
                return 'meanSquaredError';
            default:
                return 'binaryCrossentropy';
        }
    }
    async getBehaviorModelId(predictionType, schoolId) {
        let models = await this.listModels({
            modelType: ml_base_service_1.ModelType.STUDENT_BEHAVIOR,
            schoolId
        });
        models = models.filter(model => model.tags.includes(predictionType));
        if (models.length > 0) {
            return models[0].id;
        }
        models = await this.listModels({
            modelType: ml_base_service_1.ModelType.STUDENT_BEHAVIOR
        });
        models = models.filter(model => model.tags.includes(predictionType) && !model.schoolId);
        return models.length > 0 ? models[0].id : null;
    }
    featuresToPredictionInput(features) {
        return {
            age: features.age,
            grade: features.grade,
            totalOrders: features.totalOrders,
            avgOrderValue: features.avgOrderValue,
            orderFrequency: features.orderFrequency,
            proteinPreference: features.proteinPreference,
            vegetarianTendency: features.vegetarianTendency,
            spicyFoodTolerance: features.spicyFoodTolerance,
            sweetTooth: features.sweetTooth,
            peersInfluence: features.peersInfluence,
            seasonalVariation: features.seasonalVariation,
            energyLevels: features.energyLevels,
            concentrationLevels: features.concentrationLevels,
            physicalActivity: features.physicalActivity,
            timeOfDay: features.timeOfDay,
            dayOfWeek: features.dayOfWeek,
            monthOfYear: features.monthOfYear,
            specialEvent: features.specialEvent ? 1 : 0,
            classSize: features.classSize
        };
    }
    interpretBehaviorPrediction(predictionType, response, features) {
        const topFactors = [
            {
                factor: 'ordering_frequency',
                importance: 0.8,
                description: 'Student has a consistent ordering pattern'
            },
            {
                factor: 'peer_influence',
                importance: 0.6,
                description: 'Student is influenced by peer choices'
            },
            {
                factor: 'time_of_day',
                importance: 0.4,
                description: 'Ordering time affects meal preferences'
            }
        ];
        const reasoning = `Based on the student's ordering history and behavioral patterns, the model predicts ${predictionType} with ${Math.round(response.confidence * 100)}% confidence.`;
        const recommendations = [
            'Consider offering personalized meal suggestions',
            'Monitor nutritional balance in food choices',
            'Encourage healthy eating habits through social influence'
        ];
        return {
            value: response.prediction,
            topFactors,
            reasoning,
            recommendations
        };
    }
    async analyzeStudentPatterns(studentId, timeframe) {
        return {
            orderingPatterns: {
                preferredTimes: [12, 13, 18],
                preferredDays: ['Monday', 'Wednesday', 'Friday'],
                orderFrequency: 3.5,
                avgOrderValue: 150
            },
            mealPreferences: {
                favoriteCategories: ['Indian', 'Continental', 'Snacks'],
                avoidedCategories: ['Spicy', 'Seafood'],
                nutritionalBalance: 0.7,
                dietaryCompliance: 0.8
            },
            socialInfluence: {
                peerInfluenceScore: 0.6,
                parentalInfluenceScore: 0.8,
                trendFollowing: 0.4
            },
            healthCorrelations: {
                energyLevelCorrelation: 0.7,
                concentrationCorrelation: 0.6,
                activityLevelCorrelation: 0.8,
                moodCorrelation: 0.5
            }
        };
    }
    async generateBehaviorPredictions(studentId) {
        return {
            nextWeekOrders: 4,
            likelyMealChoices: ['Rice Bowl', 'Sandwich', 'Fruit Salad'],
            riskFactors: ['Low vegetable intake', 'High sugar preference'],
            opportunities: ['Introduce new cuisines', 'Promote healthy snacks']
        };
    }
    async generatePersonalizedRecommendations(studentId, patterns) {
        return {
            forStudent: [
                'Try adding more vegetables to your meals',
                'Consider healthier snack options',
                'Maintain regular meal times'
            ],
            forParents: [
                'Encourage balanced nutrition at home',
                'Discuss healthy food choices with your child',
                'Monitor meal preferences and patterns'
            ],
            forSchool: [
                'Offer more variety in healthy options',
                'Implement nutrition education programs',
                'Create social incentives for healthy eating'
            ],
            forKitchen: [
                'Prepare more appealing healthy options',
                'Consider student preferences in menu planning',
                'Offer customization options for meals'
            ]
        };
    }
    calculateRiskLevel(prediction) {
        if (prediction.confidence > 0.8) {
            return 'low';
        }
        else if (prediction.confidence > 0.6) {
            return 'medium';
        }
        else {
            return 'high';
        }
    }
    async tagModel(modelId, tags) {
        logger_1.logger.info('Tagging model', { modelId, tags });
    }
    async cacheStudentAnalytics(studentId, analytics) {
        const cacheKey = `student_analytics:${studentId}`;
        await this.redis.setex(cacheKey, 3600, JSON.stringify(analytics));
    }
}
exports.StudentBehaviorService = StudentBehaviorService;
class StudentBehaviorFeatureExtractor {
    database;
    constructor() {
        this.database = database_service_1.DatabaseService.getInstance();
    }
    async initialize() {
        logger_1.logger.info('Initializing Student Behavior Feature Extractor');
    }
    async extractStudentFeatures(studentId, context = {}) {
        const mockFeatures = {
            age: 12,
            grade: 7,
            gender: 'M',
            bmi: 18.5,
            healthConditions: [],
            allergies: ['nuts'],
            totalOrders: 45,
            avgOrderValue: 120,
            favoriteCategories: ['Indian', 'Snacks'],
            orderFrequency: 3.2,
            avgOrderTime: 12.5,
            weekdayVsWeekend: 0.8,
            proteinPreference: 0.7,
            vegetarianTendency: 0.3,
            spicyFoodTolerance: 0.6,
            sweetTooth: 0.8,
            peersInfluence: 0.6,
            parentalGuidance: 0.8,
            schoolEventImpact: 0.4,
            seasonalVariation: 0.5,
            weatherSensitivity: 0.3,
            energyLevels: 0.7,
            concentrationLevels: 0.6,
            physicalActivity: 0.8,
            timeOfDay: context.timeOfDay || new Date().getHours(),
            dayOfWeek: context.dayOfWeek || new Date().getDay(),
            monthOfYear: context.monthOfYear || new Date().getMonth() + 1,
            specialEvent: context.specialEvent || false,
            weatherCondition: context.weatherCondition || 'clear',
            schoolId: context.schoolId || 'school-1',
            classSize: 30,
            mealProgramType: 'full'
        };
        return mockFeatures;
    }
    async extractTrainingData(predictionType, schoolId, dateRange) {
        const sampleSize = 1000;
        const features = [];
        const labels = [];
        for (let i = 0; i < sampleSize; i++) {
            const featureVector = [
                Math.random() * 6 + 10,
                Math.floor(Math.random() * 12) + 1,
                Math.random() * 100,
                Math.random() * 200 + 50,
                Math.random() * 7,
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random() * 24,
                Math.floor(Math.random() * 7),
                Math.floor(Math.random() * 12) + 1
            ];
            features.push(featureVector);
            let label;
            switch (predictionType) {
                case BehaviorPredictionType.MEAL_PREFERENCE:
                    label = Math.floor(Math.random() * 10);
                    break;
                case BehaviorPredictionType.ORDER_TIMING:
                    label = Math.floor(Math.random() * 24);
                    break;
                case BehaviorPredictionType.NUTRITIONAL_NEEDS:
                    label = Math.random();
                    break;
                default:
                    label = Math.round(Math.random());
            }
            labels.push(label);
        }
        return { features, labels };
    }
}
//# sourceMappingURL=student-behavior.service.js.map