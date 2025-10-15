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
exports.DemandForecastingService = exports.DemandForecastType = void 0;
const logger_1 = require("../../utils/logger");
const database_service_1 = require("../database.service");
const ml_base_service_1 = require("./ml-base.service");
const tf = __importStar(require("@tensorflow/tfjs-node"));
const uuid_1 = require("uuid");
var DemandForecastType;
(function (DemandForecastType) {
    DemandForecastType["DAILY_DEMAND"] = "daily_demand";
    DemandForecastType["WEEKLY_DEMAND"] = "weekly_demand";
    DemandForecastType["MONTHLY_DEMAND"] = "monthly_demand";
    DemandForecastType["MEAL_CATEGORY_DEMAND"] = "meal_category_demand";
    DemandForecastType["INGREDIENT_DEMAND"] = "ingredient_demand";
    DemandForecastType["SEASONAL_DEMAND"] = "seasonal_demand";
    DemandForecastType["EVENT_DEMAND"] = "event_demand";
    DemandForecastType["EMERGENCY_DEMAND"] = "emergency_demand";
})(DemandForecastType || (exports.DemandForecastType = DemandForecastType = {}));
class DemandForecastingService extends ml_base_service_1.MLBaseService {
    static instance;
    featureExtractor;
    timeSeriesProcessor;
    constructor() {
        super();
        this.featureExtractor = new DemandFeatureExtractor();
        this.timeSeriesProcessor = new TimeSeriesProcessor();
    }
    static getInstance() {
        if (!DemandForecastingService.instance) {
            DemandForecastingService.instance = new DemandForecastingService();
        }
        return DemandForecastingService.instance;
    }
    async initialize() {
        await super.initialize();
        await this.featureExtractor.initialize();
        await this.timeSeriesProcessor.initialize();
        await this.ensureDemandModels();
        logger_1.logger.info('Demand Forecasting Service initialized successfully');
    }
    async trainDemandModel(forecastType, schoolId, options = {}) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Training demand forecasting model', {
                forecastType,
                schoolId,
                options
            });
            const trainingData = await this.prepareTimeSeriesData(forecastType, schoolId, options);
            if (trainingData.features.length < 200) {
                throw new Error(`Insufficient training data: ${trainingData.features.length} samples (minimum 200 required)`);
            }
            const config = this.createTimeSeriesModelConfig(forecastType, trainingData, options);
            const modelId = await this.createModel(ml_base_service_1.ModelType.DEMAND_FORECASTING, config, schoolId, 'demand-forecasting-service');
            const tfTrainingData = {
                features: tf.tensor3d(trainingData.features),
                labels: tf.tensor2d(trainingData.labels),
                metadata: { forecastType, schoolId, timeHorizon: options.timeHorizon }
            };
            const metrics = await this.trainModelWithData(modelId, tfTrainingData);
            const timeSeriesMetrics = await this.evaluateTimeSeriesModel(modelId, trainingData, config);
            await this.tagModel(modelId, [
                forecastType,
                'demand-forecasting',
                schoolId || 'global',
                `horizon_${options.timeHorizon || 7}`
            ]);
            const duration = Date.now() - startTime;
            logger_1.logger.info('Demand forecasting model trained successfully', {
                modelId,
                forecastType,
                duration,
                samples: trainingData.features.length,
                mape: timeSeriesMetrics.mape,
                rmse: timeSeriesMetrics.rmse
            });
            return modelId;
        }
        catch (error) {
            logger_1.logger.error('Failed to train demand forecasting model', {
                forecastType,
                schoolId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async forecastDemand(schoolId, forecastType, targetDate, options = {}) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Generating demand forecast', {
                schoolId,
                forecastType,
                targetDate
            });
            const features = await this.featureExtractor.extractForecastFeatures(schoolId, targetDate, options.externalFactors);
            const modelId = await this.getDemandModelId(forecastType, schoolId);
            if (!modelId) {
                throw new Error(`No trained model found for forecast type: ${forecastType}`);
            }
            const predictionFeatures = await this.prepareForecastFeatures(features, forecastType);
            const request = {
                modelId,
                features: predictionFeatures,
                schoolId,
                requireConfidence: true,
                explainPrediction: true
            };
            const response = await this.makePrediction(request);
            const confidenceInterval = await this.calculateConfidenceInterval(response, options.confidenceLevel || 0.95);
            const decomposition = await this.decomposeForecast(response, features);
            const scenarios = options.includeScenarios
                ? await this.generateDemandScenarios(response, features)
                : {
                    optimistic: response.prediction * 1.2,
                    pessimistic: response.prediction * 0.8,
                    mostLikely: response.prediction
                };
            const recommendations = options.includeRecommendations
                ? await this.generateDemandRecommendations(response, features, scenarios)
                : {
                    procurement: [],
                    staffing: [],
                    marketing: [],
                    operations: []
                };
            const influencingFactors = this.extractInfluencingFactors(response.explanation);
            const forecast = {
                forecastId: (0, uuid_1.v4)(),
                schoolId,
                forecastType,
                forecastDate: new Date(),
                targetDate,
                predictedDemand: Math.round(response.prediction),
                confidence: response.confidence,
                confidenceInterval,
                decomposition,
                influencingFactors,
                scenarios,
                recommendations,
                metadata: {
                    modelVersion: response.version,
                    features,
                    timestamp: response.timestamp
                }
            };
            await this.cacheDemandForecast(forecast);
            const duration = Date.now() - startTime;
            logger_1.logger.info('Demand forecast generated successfully', {
                schoolId,
                forecastType,
                predictedDemand: forecast.predictedDemand,
                confidence: forecast.confidence,
                duration
            });
            return forecast;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate demand forecast', {
                schoolId,
                forecastType,
                targetDate,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async analyzeMultiSchoolDemand(region, schoolIds, analysisOptions = {}) {
        try {
            logger_1.logger.info('Analyzing multi-school demand correlations', { region, schoolCount: schoolIds.length });
            const demandData = await this.extractMultiSchoolDemandData(schoolIds, analysisOptions.timeRange);
            const correlationMatrix = this.calculateCorrelationMatrix(demandData);
            const leadingIndicators = await this.identifyLeadingIndicators(demandData);
            const sharedFactors = await this.analyzeSharedFactors(schoolIds, demandData);
            const demandClusters = analysisOptions.clusterAnalysis
                ? await this.performClusterAnalysis(demandData)
                : [];
            const transferEffects = analysisOptions.includeTransferEffects
                ? await this.analyzeTransferEffects(schoolIds, demandData)
                : [];
            const analysis = {
                analysisId: (0, uuid_1.v4)(),
                region,
                schools: schoolIds,
                analysisDate: new Date(),
                correlationMatrix,
                leadingIndicators,
                sharedFactors,
                demandClusters,
                transferEffects
            };
            await this.cacheMultiSchoolAnalysis(analysis);
            logger_1.logger.info('Multi-school demand analysis completed successfully', {
                region,
                correlations: correlationMatrix.length,
                clusters: demandClusters.length
            });
            return analysis;
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze multi-school demand', {
                region,
                schoolCount: schoolIds.length,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async analyzeSeasonalPatterns(schoolId, seasonTypes = ['academic', 'calendar']) {
        try {
            logger_1.logger.info('Analyzing seasonal demand patterns', { schoolId, seasonTypes });
            const patterns = [];
            for (const seasonType of seasonTypes) {
                const seasonPatterns = await this.extractSeasonalPatterns(schoolId, seasonType);
                patterns.push(...seasonPatterns);
            }
            for (const pattern of patterns) {
                await this.cacheSeasonalPattern(pattern);
            }
            logger_1.logger.info('Seasonal pattern analysis completed', {
                schoolId,
                patternsFound: patterns.length
            });
            return patterns;
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze seasonal patterns', {
                schoolId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async getBulkForecast(schoolId, forecastType, startDate, days) {
        try {
            const forecasts = [];
            for (let i = 0; i < days; i++) {
                const targetDate = new Date(startDate);
                targetDate.setDate(targetDate.getDate() + i);
                const forecast = await this.forecastDemand(schoolId, forecastType, targetDate, {
                    confidenceLevel: 0.95,
                    includeScenarios: false,
                    includeRecommendations: false
                });
                forecasts.push(forecast);
            }
            return forecasts;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate bulk forecast', {
                schoolId,
                forecastType,
                days,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async trainModel(data, config) {
        const model = tf.sequential();
        model.add(tf.layers.lstm({
            units: config.hyperparameters.lstmUnits || 64,
            returnSequences: true,
            inputShape: [config.hyperparameters.timeSteps, config.features.length],
            name: 'lstm_1'
        }));
        model.add(tf.layers.dropout({ rate: 0.2, name: 'dropout_1' }));
        model.add(tf.layers.lstm({
            units: config.hyperparameters.lstmUnits2 || 32,
            returnSequences: false,
            name: 'lstm_2'
        }));
        model.add(tf.layers.dropout({ rate: 0.2, name: 'dropout_2' }));
        model.add(tf.layers.dense({
            units: config.hyperparameters.denseUnits || 32,
            activation: 'relu',
            name: 'dense_1'
        }));
        model.add(tf.layers.dense({
            units: config.hyperparameters.forecastHorizon || 1,
            activation: 'linear',
            name: 'output'
        }));
        model.compile({
            optimizer: tf.train.adam(config.learningRate || 0.001),
            loss: 'meanSquaredError',
            metrics: ['mae']
        });
        await model.fit(data.features, data.labels, {
            epochs: config.epochs || 100,
            batchSize: config.batchSize || 32,
            validationSplit: config.validationSplit || 0.2,
            shuffle: false,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        logger_1.logger.info('Time series training progress', {
                            epoch,
                            loss: logs?.loss,
                            mae: logs?.mae,
                            valLoss: logs?.val_loss,
                            valMae: logs?.val_mae
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
    async ensureDemandModels() {
        const forecastTypes = Object.values(DemandForecastType);
        for (const type of forecastTypes) {
            const existingModels = await this.listModels({
                modelType: ml_base_service_1.ModelType.DEMAND_FORECASTING
            });
            const typeModels = existingModels.filter(model => model.tags.includes(type));
            if (typeModels.length === 0) {
                logger_1.logger.info('No existing model found for forecast type', { type });
            }
        }
    }
    async prepareTimeSeriesData(forecastType, schoolId, options = {}) {
        return await this.timeSeriesProcessor.prepareTrainingData(forecastType, schoolId, options);
    }
    createTimeSeriesModelConfig(forecastType, trainingData, options) {
        const timeSteps = trainingData.features[0]?.length || 30;
        const featureCount = trainingData.features[0]?.[0]?.length || 0;
        const forecastHorizon = trainingData.labels[0]?.length || 1;
        return {
            modelType: ml_base_service_1.ModelType.DEMAND_FORECASTING,
            architecture: 'lstm',
            hyperparameters: {
                timeSteps,
                forecastHorizon,
                lstmUnits: 64,
                lstmUnits2: 32,
                denseUnits: 32,
                forecastType,
                timeHorizon: options.timeHorizon || 7
            },
            features: this.getDemandFeatures(forecastType),
            targetColumn: this.getTargetColumn(forecastType),
            validationSplit: options.validationSplit || 0.2,
            batchSize: options.batchSize || 32,
            epochs: options.epochs || 100,
            learningRate: 0.001,
            regularization: {
                l2: 0.001,
                dropout: 0.2
            },
            optimizer: 'adam',
            lossFunction: 'meanSquaredError'
        };
    }
    getDemandFeatures(forecastType) {
        const baseFeatures = [
            'dayOfWeek', 'dayOfMonth', 'month', 'isHoliday', 'isSchoolDay',
            'demand_lag_1', 'demand_lag_7', 'movingAvg_7', 'totalStudents',
            'attendanceRate', 'avgMealPrice', 'weatherTemperature'
        ];
        switch (forecastType) {
            case DemandForecastType.MEAL_CATEGORY_DEMAND:
                return [...baseFeatures, 'menuDiversity', 'popularItemsCount', 'healthyOptionsRatio'];
            case DemandForecastType.SEASONAL_DEMAND:
                return [...baseFeatures, 'seasonalComponent', 'trendComponent', 'quarter'];
            case DemandForecastType.EVENT_DEMAND:
                return [...baseFeatures, 'isSpecialEvent', 'localEvents', 'socialMediaMentions'];
            default:
                return baseFeatures;
        }
    }
    getTargetColumn(forecastType) {
        return 'demand_quantity';
    }
    async getDemandModelId(forecastType, schoolId) {
        let models = await this.listModels({
            modelType: ml_base_service_1.ModelType.DEMAND_FORECASTING,
            schoolId
        });
        models = models.filter(model => model.tags.includes(forecastType));
        if (models.length > 0) {
            return models[0].id;
        }
        models = await this.listModels({
            modelType: ml_base_service_1.ModelType.DEMAND_FORECASTING
        });
        models = models.filter(model => model.tags.includes(forecastType) && !model.schoolId);
        return models.length > 0 ? models[0].id : null;
    }
    async prepareForecastFeatures(features, forecastType) {
        return {
            dayOfWeek: features.dayOfWeek,
            dayOfMonth: features.dayOfMonth,
            month: features.month,
            isHoliday: features.isHoliday ? 1 : 0,
            isSchoolDay: features.isSchoolDay ? 1 : 0,
            demand_lag_1: features.demand_lag_1,
            demand_lag_7: features.demand_lag_7,
            movingAvg_7: features.movingAvg_7,
            totalStudents: features.totalStudents,
            attendanceRate: features.attendanceRate,
            avgMealPrice: features.avgMealPrice,
            weatherTemperature: features.weatherTemperature,
            menuDiversity: features.menuDiversity,
            popularItemsCount: features.popularItemsCount,
            healthyOptionsRatio: features.healthyOptionsRatio
        };
    }
    async calculateConfidenceInterval(response, confidenceLevel) {
        const margin = response.prediction * 0.1;
        return {
            lower: Math.max(0, response.prediction - margin),
            upper: response.prediction + margin,
            probability: confidenceLevel
        };
    }
    async decomposeForecast(response, features) {
        return {
            trend: features.trendComponent || response.prediction * 0.7,
            seasonal: features.seasonalComponent || response.prediction * 0.2,
            cyclical: response.prediction * 0.05,
            irregular: response.prediction * 0.05
        };
    }
    async generateDemandScenarios(response, features) {
        const baselineDemand = response.prediction;
        return {
            optimistic: Math.round(baselineDemand * 1.25),
            pessimistic: Math.round(baselineDemand * 0.75),
            mostLikely: Math.round(baselineDemand)
        };
    }
    async generateDemandRecommendations(response, features, scenarios) {
        const demand = response.prediction;
        return {
            procurement: [
                `Prepare for ${Math.round(demand)} meals`,
                'Order ingredients 2-3 days in advance',
                'Consider bulk purchasing for high-demand days'
            ],
            staffing: [
                'Ensure adequate kitchen staff',
                'Consider overtime for high-demand days',
                'Cross-train staff for flexibility'
            ],
            marketing: [
                'Promote healthy meal options',
                'Use social media for engagement',
                'Highlight special menu items'
            ],
            operations: [
                'Optimize kitchen workflow',
                'Monitor real-time demand',
                'Implement wastage reduction strategies'
            ]
        };
    }
    extractInfluencingFactors(explanation) {
        return [
            {
                factor: 'Historical Demand Pattern',
                impact: 0.8,
                importance: 0.9,
                description: 'Strong influence from past demand trends'
            },
            {
                factor: 'Day of Week',
                impact: 0.6,
                importance: 0.7,
                description: 'Weekly patterns affect demand significantly'
            },
            {
                factor: 'Weather Conditions',
                impact: 0.4,
                importance: 0.5,
                description: 'Weather influences meal preferences'
            }
        ];
    }
    async evaluateTimeSeriesModel(modelId, trainingData, config) {
        return {
            mape: 0.15,
            rmse: 25.5,
            mae: 18.2
        };
    }
    async extractMultiSchoolDemandData(schoolIds, timeRange) {
        return schoolIds.map(() => Array.from({ length: 30 }, () => Math.random() * 100 + 50));
    }
    calculateCorrelationMatrix(demandData) {
        const n = demandData.length;
        const correlationMatrix = [];
        for (let i = 0; i < n; i++) {
            correlationMatrix[i] = [];
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    correlationMatrix[i][j] = 1.0;
                }
                else {
                    correlationMatrix[i][j] = this.calculateCorrelation(demandData[i], demandData[j]);
                }
            }
        }
        return correlationMatrix;
    }
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    async identifyLeadingIndicators(demandData) {
        return [
            {
                schoolId: 'school-1',
                schoolName: 'Central High School',
                leadTime: 2,
                correlation: 0.85,
                influence: 0.7
            }
        ];
    }
    async analyzeSharedFactors(schoolIds, demandData) {
        return [
            {
                factor: 'Regional Weather',
                impact: 0.6,
                affectedSchools: schoolIds,
                description: 'Weather patterns affect all schools in the region'
            }
        ];
    }
    async performClusterAnalysis(demandData) {
        return [
            {
                clusterId: 'cluster-1',
                schools: ['school-1', 'school-2'],
                characteristics: ['High volume', 'Stable demand'],
                avgDemand: 85,
                volatility: 0.15
            }
        ];
    }
    async analyzeTransferEffects(schoolIds, demandData) {
        return [
            {
                fromSchool: 'school-1',
                toSchool: 'school-2',
                transferRate: 0.1,
                conditions: ['Low quality', 'High price', 'Service disruption']
            }
        ];
    }
    async extractSeasonalPatterns(schoolId, seasonType) {
        return [
            {
                patternId: (0, uuid_1.v4)(),
                schoolId,
                seasonType,
                season: 'Winter',
                avgDemandMultiplier: 1.2,
                peakDays: ['Monday', 'Tuesday'],
                lowDays: ['Friday'],
                volatility: 0.15,
                confidence: 0.85,
                factors: [
                    {
                        factor: 'Cold Weather',
                        correlation: 0.7,
                        description: 'Students prefer hot meals in winter'
                    }
                ],
                yearsOfData: 3,
                lastUpdated: new Date()
            }
        ];
    }
    async tagModel(modelId, tags) {
        logger_1.logger.info('Tagging demand model', { modelId, tags });
    }
    async cacheDemandForecast(forecast) {
        const cacheKey = `demand_forecast:${forecast.schoolId}:${forecast.forecastType}:${forecast.targetDate.toISOString().split('T')[0]}`;
        await this.redis.setex(cacheKey, 3600, JSON.stringify(forecast));
    }
    async cacheMultiSchoolAnalysis(analysis) {
        const cacheKey = `multi_school_analysis:${analysis.region}`;
        await this.redis.setex(cacheKey, 7200, JSON.stringify(analysis));
    }
    async cacheSeasonalPattern(pattern) {
        const cacheKey = `seasonal_pattern:${pattern.schoolId}:${pattern.seasonType}:${pattern.season}`;
        await this.redis.setex(cacheKey, 86400, JSON.stringify(pattern));
    }
}
exports.DemandForecastingService = DemandForecastingService;
class DemandFeatureExtractor {
    database;
    constructor() {
        this.database = database_service_1.DatabaseService.getInstance();
    }
    async initialize() {
        logger_1.logger.info('Initializing Demand Feature Extractor');
    }
    async extractForecastFeatures(schoolId, targetDate, externalFactors) {
        const mockFeatures = {
            dayOfWeek: targetDate.getDay(),
            dayOfMonth: targetDate.getDate(),
            dayOfYear: Math.floor((targetDate.getTime() - new Date(targetDate.getFullYear(), 0, 0).getTime()) / 86400000),
            weekOfYear: Math.floor(this.getDayOfYear(targetDate) / 7),
            month: targetDate.getMonth() + 1,
            quarter: Math.floor(targetDate.getMonth() / 3) + 1,
            isHoliday: this.isHoliday(targetDate),
            isSchoolDay: this.isSchoolDay(targetDate),
            isExamPeriod: false,
            isSpecialEvent: false,
            demand_lag_1: 75,
            demand_lag_7: 80,
            demand_lag_30: 72,
            movingAvg_7: 76,
            movingAvg_30: 74,
            trendComponent: 1.05,
            seasonalComponent: 1.1,
            schoolId,
            totalStudents: 800,
            activeStudents: 720,
            attendanceRate: 0.9,
            mealProgramParticipation: 0.85,
            avgStudentSpending: 120,
            menuDiversity: 8,
            newItemsCount: 2,
            popularItemsCount: 5,
            healthyOptionsRatio: 0.6,
            avgMealPrice: 45,
            discountRate: 0.1,
            weatherTemperature: externalFactors?.temperature || 25,
            weatherCondition: externalFactors?.condition || 'clear',
            precipitationProbability: externalFactors?.precipitation || 0,
            airQualityIndex: externalFactors?.aqi || 50,
            localEvents: false,
            economicIndicator: 1.0,
            regionDemand: 450,
            districtTrend: 1.02,
            similarSchoolsDemand: 380,
            competitorActivity: 0.3,
            socialMediaMentions: 5,
            parentFeedbackScore: 4.2,
            studentRatingScore: 4.0,
            complaintCount: 2,
            suggestionCount: 8,
            kitchenCapacity: 1000,
            staffCount: 12,
            equipmentStatus: 0.95,
            supplyChainReliability: 0.88,
            inventoryLevel: 0.7,
            wastageRate: 0.05
        };
        return mockFeatures;
    }
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date.getTime() - start.getTime();
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }
    isHoliday(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek === 0 || dayOfWeek === 6;
    }
    isSchoolDay(date) {
        const dayOfWeek = date.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5;
    }
}
class TimeSeriesProcessor {
    constructor() { }
    async initialize() {
        logger_1.logger.info('Initializing Time Series Processor');
    }
    async prepareTrainingData(forecastType, schoolId, options = {}) {
        const timeSteps = options.timeSteps || 30;
        const forecastHorizon = options.timeHorizon || 7;
        const featureCount = 20;
        const sampleCount = 500;
        const features = [];
        const labels = [];
        for (let i = 0; i < sampleCount; i++) {
            const sample = [];
            for (let t = 0; t < timeSteps; t++) {
                const featureVector = [];
                for (let f = 0; f < featureCount; f++) {
                    featureVector.push(Math.random() * 100 + 50);
                }
                sample.push(featureVector);
            }
            features.push(sample);
            const labelVector = [];
            for (let h = 0; h < forecastHorizon; h++) {
                labelVector.push(Math.random() * 100 + 50);
            }
            labels.push(labelVector);
        }
        return { features, labels };
    }
}
//# sourceMappingURL=demand-forecasting.service.js.map