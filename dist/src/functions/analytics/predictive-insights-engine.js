"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveInsightsEngine = exports.predictiveInsightsEngine = void 0;
const logger_service_1 = require("../shared/logger.service");
const database_service_1 = require("../shared/database.service");
class PredictiveInsightsEngine {
    logger;
    database;
    forecastingModels;
    historicalDataCache;
    predictionCache;
    constructor() {
        this.logger = logger_service_1.LoggerService.getInstance();
        this.database = database_service_1.DatabaseService;
        this.forecastingModels = new Map();
        this.historicalDataCache = new Map();
        this.predictionCache = new Map();
    }
    async initialize(schools) {
        this.logger.info('Initializing predictive insights engine', {
            schoolCount: schools?.length || 0,
            timestamp: new Date(),
        });
        await this.initializeForecastingModels();
        await this.loadHistoricalData(schools);
        await this.trainForecastingModels();
        this.logger.info('Predictive insights engine initialized', {
            modelsInitialized: this.forecastingModels.size,
            historicalDataLoaded: this.historicalDataCache.size,
        });
    }
    async initializeForecastingModels() {
        const models = [
            {
                modelId: 'enrollment_forecast_v1',
                modelType: 'enrollment_forecast',
                algorithm: 'seasonal_decomposition',
                accuracy: 0,
                mape: 0,
                rmse: 0,
                r2Score: 0,
                trainedOn: new Date(),
                trainingDataPoints: 0,
                validationDataPoints: 0,
                features: [
                    'historical_enrollment',
                    'academic_calendar',
                    'demographic_trends',
                    'economic_indicators',
                    'school_performance_scores',
                ],
                seasonalityPeriod: 365,
                trendComponents: {
                    linear: 0.4,
                    exponential: 0.3,
                    logarithmic: 0.3,
                },
                seasonalComponents: {
                    weekly: 0.1,
                    monthly: 0.3,
                    quarterly: 0.4,
                    yearly: 0.2,
                },
                hyperparameters: {
                    seasonalPeriods: [7, 30, 90, 365],
                    trendSmoothingFactor: 0.1,
                    seasonalSmoothingFactor: 0.1,
                    outlierThreshold: 2.5,
                },
            },
            {
                modelId: 'demand_forecast_v1',
                modelType: 'demand_forecast',
                algorithm: 'ensemble',
                accuracy: 0,
                mape: 0,
                rmse: 0,
                r2Score: 0,
                trainedOn: new Date(),
                trainingDataPoints: 0,
                validationDataPoints: 0,
                features: [
                    'historical_demand',
                    'weather_data',
                    'menu_preferences',
                    'special_events',
                    'enrollment_numbers',
                ],
                seasonalityPeriod: 7,
                trendComponents: {
                    linear: 0.3,
                    exponential: 0.4,
                    logarithmic: 0.3,
                },
                seasonalComponents: {
                    weekly: 0.5,
                    monthly: 0.3,
                    quarterly: 0.1,
                    yearly: 0.1,
                },
                hyperparameters: {
                    ensembleWeights: [0.3, 0.3, 0.4],
                    lookbackWindow: 30,
                    forecastHorizon: 14,
                },
            },
            {
                modelId: 'revenue_forecast_v1',
                modelType: 'revenue_forecast',
                algorithm: 'neural_network',
                accuracy: 0,
                mape: 0,
                rmse: 0,
                r2Score: 0,
                trainedOn: new Date(),
                trainingDataPoints: 0,
                validationDataPoints: 0,
                features: [
                    'historical_revenue',
                    'enrollment_forecast',
                    'pricing_changes',
                    'subscription_rates',
                    'market_conditions',
                ],
                seasonalityPeriod: 30,
                trendComponents: {
                    linear: 0.2,
                    exponential: 0.5,
                    logarithmic: 0.3,
                },
                seasonalComponents: {
                    weekly: 0.2,
                    monthly: 0.4,
                    quarterly: 0.3,
                    yearly: 0.1,
                },
                hyperparameters: {
                    hiddenLayers: [64, 32, 16],
                    learningRate: 0.001,
                    epochs: 100,
                    batchSize: 32,
                },
            },
        ];
        for (const model of models) {
            this.forecastingModels.set(model.modelId, model);
        }
    }
    async loadHistoricalData(schools) {
        const prismaClient = this.database.client;
        if (!schools || schools.length === 0) {
            return;
        }
        for (const school of schools) {
            try {
                const enrollmentData = await this.generateHistoricalEnrollmentData(school.id);
                this.historicalDataCache.set(`enrollment_${school.id}`, enrollmentData);
                const demandData = await this.generateHistoricalDemandData(school.id);
                this.historicalDataCache.set(`demand_${school.id}`, demandData);
                const revenueData = await this.generateHistoricalRevenueData(school.id);
                this.historicalDataCache.set(`revenue_${school.id}`, revenueData);
            }
            catch (error) {
                this.logger.error('Error loading historical data for school', undefined, {
                    schoolId: school.id,
                    errorMessage: error instanceof Error
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : 'Unknown error',
                });
            }
        }
    }
    async generateHistoricalEnrollmentData(schoolId) {
        const data = [];
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 2);
        const baseEnrollment = 400 + Math.random() * 600;
        for (let i = 0; i < 730; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
            const seasonalFactor = 1 + 0.15 * Math.sin((2 * Math.PI * dayOfYear) / 365);
            const dayOfWeek = date.getDay();
            const weeklyFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1.0;
            const growthFactor = 1 + (0.05 / 365) * i;
            const noiseFactor = 1 + (Math.random() - 0.5) * 0.1;
            const enrollment = Math.round(baseEnrollment * seasonalFactor * weeklyFactor * growthFactor * noiseFactor);
            data.push({
                timestamp: date,
                value: enrollment,
                context: {
                    dayOfWeek,
                    dayOfYear,
                    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                    schoolId,
                },
            });
        }
        return data;
    }
    async generateHistoricalDemandData(schoolId) {
        const data = [];
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const baseDemand = 200 + Math.random() * 400;
        for (let i = 0; i < 365; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dayOfWeek = date.getDay();
            let weeklyFactor = 1.0;
            if (dayOfWeek === 1)
                weeklyFactor = 0.9;
            if (dayOfWeek === 5)
                weeklyFactor = 1.1;
            if (dayOfWeek === 0 || dayOfWeek === 6)
                weeklyFactor = 0.4;
            const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
            const seasonalFactor = 1 + 0.2 * Math.sin((2 * Math.PI * dayOfYear) / 365 + Math.PI / 2);
            const randomEventFactor = Math.random() < 0.05 ? 0.5 + Math.random() * 1.0 : 1.0;
            const demand = Math.round(baseDemand * weeklyFactor * seasonalFactor * randomEventFactor);
            data.push({
                timestamp: date,
                value: Math.max(0, demand),
                context: {
                    dayOfWeek,
                    dayOfYear,
                    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                    temperature: 20 + 15 * Math.sin((2 * Math.PI * dayOfYear) / 365) + (Math.random() - 0.5) * 10,
                    schoolId,
                },
            });
        }
        return data;
    }
    async generateHistoricalRevenueData(schoolId) {
        const data = [];
        const startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        const baseRevenue = 5000 + Math.random() * 15000;
        for (let i = 0; i < 365; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dayOfWeek = date.getDay();
            let weeklyFactor = 1.0;
            if (dayOfWeek === 1)
                weeklyFactor = 0.9;
            if (dayOfWeek === 5)
                weeklyFactor = 1.1;
            if (dayOfWeek === 0 || dayOfWeek === 6)
                weeklyFactor = 0.4;
            const growthFactor = 1 + (0.08 / 365) * i;
            const dayOfMonth = date.getDate();
            const billingFactor = dayOfMonth <= 5 ? 1.5 : 1.0;
            const revenue = Math.round(baseRevenue * weeklyFactor * growthFactor * billingFactor);
            data.push({
                timestamp: date,
                value: Math.max(0, revenue),
                context: {
                    dayOfWeek,
                    dayOfMonth,
                    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
                    isBillingPeriod: dayOfMonth <= 5,
                    schoolId,
                },
            });
        }
        return data;
    }
    async trainForecastingModels() {
        for (const [modelId, model] of this.forecastingModels.entries()) {
            try {
                await this.trainSingleModel(modelId, model);
                this.logger.info('Model trained successfully', {
                    modelId,
                    accuracy: model.accuracy,
                    mape: model.mape,
                });
            }
            catch (error) {
                this.logger.error('Error training model', undefined, {
                    modelId,
                    errorMessage: error instanceof Error
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : 'Unknown error',
                });
            }
        }
    }
    async trainSingleModel(modelId, model) {
        const relevantDataKeys = Array.from(this.historicalDataCache.keys()).filter(key => key.includes(model.modelType.split('_')[0]));
        if (relevantDataKeys.length === 0) {
            throw new Error(`No historical data available for model ${modelId}`);
        }
        let allDataPoints = 0;
        let totalError = 0;
        const predictions = [];
        const actuals = [];
        for (const dataKey of relevantDataKeys) {
            const historicalData = this.historicalDataCache.get(dataKey);
            if (!historicalData)
                continue;
            const trainingSplit = 0.8;
            const splitIndex = Math.floor(historicalData.length * trainingSplit);
            const trainingData = historicalData.slice(0, splitIndex);
            const validationData = historicalData.slice(splitIndex);
            const forecastResults = this.applyForecastingAlgorithm(trainingData, validationData.length, model);
            for (let i = 0; i < validationData.length; i++) {
                const predicted = forecastResults[i] || trainingData[trainingData.length - 1].value;
                const actual = validationData[i].value;
                predictions.push(predicted);
                actuals.push(actual);
                const error = Math.abs(predicted - actual);
                totalError += error;
                allDataPoints++;
            }
        }
        if (allDataPoints > 0) {
            model.accuracy = this.calculateAccuracy(predictions, actuals);
            model.mape = this.calculateMAPE(predictions, actuals);
            model.rmse = this.calculateRMSE(predictions, actuals);
            model.r2Score = this.calculateR2Score(predictions, actuals);
            model.trainedOn = new Date();
            model.trainingDataPoints = allDataPoints;
            model.validationDataPoints = Math.floor(allDataPoints * 0.2);
        }
    }
    applyForecastingAlgorithm(trainingData, forecastHorizon, model) {
        const values = trainingData.map(d => d.value);
        const forecasts = [];
        const seasonalPeriod = model.seasonalityPeriod;
        const trend = this.calculateTrend(values);
        for (let i = 0; i < forecastHorizon; i++) {
            let forecast = 0;
            if (values.length >= seasonalPeriod) {
                const seasonalIndex = (values.length + i) % seasonalPeriod;
                const historicalSeasonalValues = [];
                for (let j = seasonalIndex; j < values.length; j += seasonalPeriod) {
                    historicalSeasonalValues.push(values[j]);
                }
                if (historicalSeasonalValues.length > 0) {
                    forecast =
                        historicalSeasonalValues.reduce((sum, val) => sum + val, 0) /
                            historicalSeasonalValues.length;
                    forecast += trend * i;
                }
                else {
                    forecast = values[values.length - 1] + trend * i;
                }
            }
            else {
                forecast = values[values.length - 1] + trend * i;
            }
            forecasts.push(Math.max(0, forecast));
        }
        return forecasts;
    }
    calculateTrend(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, idx) => sum + val * idx, 0);
        const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
        const numerator = n * sumXY - sumX * sumY;
        const denominator = n * sumXX - sumX * sumX;
        const trend = denominator !== 0 ? numerator / denominator : 0;
        return trend || 0;
    }
    calculateAccuracy(predictions, actuals) {
        if (predictions.length !== actuals.length || predictions.length === 0)
            return 0;
        let correctPredictions = 0;
        for (let i = 0; i < predictions.length; i++) {
            const actual = actuals[i];
            const predicted = predictions[i];
            if (actual === 0) {
                if (predicted === 0)
                    correctPredictions++;
            }
            else {
                const percentageError = Math.abs(predicted - actual) / actual;
                if (percentageError <= 0.1)
                    correctPredictions++;
            }
        }
        return correctPredictions / predictions.length;
    }
    calculateMAPE(predictions, actuals) {
        if (predictions.length !== actuals.length || predictions.length === 0)
            return 100;
        let totalPercentageError = 0;
        let validPredictions = 0;
        for (let i = 0; i < predictions.length; i++) {
            const actual = actuals[i];
            const predicted = predictions[i];
            if (actual !== 0) {
                totalPercentageError += Math.abs((predicted - actual) / actual) * 100;
                validPredictions++;
            }
        }
        return validPredictions > 0 ? totalPercentageError / validPredictions : 100;
    }
    calculateRMSE(predictions, actuals) {
        if (predictions.length !== actuals.length || predictions.length === 0)
            return 0;
        let sumSquaredErrors = 0;
        for (let i = 0; i < predictions.length; i++) {
            const error = predictions[i] - actuals[i];
            sumSquaredErrors += error * error;
        }
        return Math.sqrt(sumSquaredErrors / predictions.length);
    }
    calculateR2Score(predictions, actuals) {
        if (predictions.length !== actuals.length || predictions.length === 0)
            return 0;
        const actualMean = actuals.reduce((sum, val) => sum + val, 0) / actuals.length;
        let totalSumSquares = 0;
        let residualSumSquares = 0;
        for (let i = 0; i < actuals.length; i++) {
            totalSumSquares += Math.pow(actuals[i] - actualMean, 2);
            residualSumSquares += Math.pow(actuals[i] - predictions[i], 2);
        }
        return totalSumSquares !== 0 ? 1 - residualSumSquares / totalSumSquares : 0;
    }
    async generateEnrollmentForecast(schoolId) {
        const model = this.forecastingModels.get('enrollment_forecast_v1');
        if (!model) {
            throw new Error('Enrollment forecasting model not found');
        }
        const dataKey = schoolId ? `enrollment_${schoolId}` : 'enrollment_aggregate';
        let historicalData = this.historicalDataCache.get(dataKey);
        if (!historicalData && schoolId) {
            historicalData = await this.generateHistoricalEnrollmentData(schoolId);
            this.historicalDataCache.set(dataKey, historicalData);
        }
        if (!historicalData) {
            throw new Error('No historical enrollment data available');
        }
        const shortTermHorizon = 30;
        const mediumTermHorizon = 90;
        const longTermHorizon = 365;
        const shortTermForecasts = this.generateForecastPredictions(historicalData, shortTermHorizon, model, 'short_term');
        const mediumTermForecasts = this.generateForecastPredictions(historicalData, mediumTermHorizon, model, 'medium_term');
        const longTermForecasts = this.generateForecastPredictions(historicalData, longTermHorizon, model, 'long_term');
        const seasonalPatterns = this.analyzeSeasonalPatterns(historicalData);
        const growthAnalysis = this.analyzeGrowthTrajectory(historicalData);
        return {
            forecastId: `enrollment_forecast_${schoolId || 'aggregate'}_${Date.now()}`,
            schoolId,
            generatedAt: new Date(),
            forecastType: schoolId ? 'individual_school' : 'system_wide',
            forecasts: {
                shortTerm: {
                    horizon: shortTermHorizon,
                    predictions: shortTermForecasts,
                },
                mediumTerm: {
                    horizon: mediumTermHorizon,
                    predictions: mediumTermForecasts,
                },
                longTerm: {
                    horizon: longTermHorizon,
                    predictions: longTermForecasts,
                },
            },
            seasonalPatterns,
            growthAnalysis,
        };
    }
    generateForecastPredictions(historicalData, horizon, model, forecastType) {
        const predictions = [];
        const baseForecasts = this.applyForecastingAlgorithm(historicalData, horizon, model);
        const uncertaintyFactor = this.calculateUncertaintyFactor(model, forecastType);
        for (let i = 0; i < horizon; i++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + i + 1);
            const predictedValue = baseForecasts[i];
            const uncertainty = predictedValue * uncertaintyFactor;
            predictions.push({
                date: forecastDate,
                predictedEnrollment: Math.round(predictedValue),
                confidenceInterval: {
                    lower: Math.round(Math.max(0, predictedValue - 1.96 * uncertainty)),
                    upper: Math.round(predictedValue + 1.96 * uncertainty),
                    confidence: 0.95,
                },
                factors: this.identifyForecastFactors(forecastDate, i, forecastType),
            });
        }
        return predictions;
    }
    calculateUncertaintyFactor(model, forecastType) {
        const baseUncertainty = model.mape / 100;
        const horizonMultipliers = {
            short_term: 1.0,
            medium_term: 1.5,
            long_term: 2.0,
        };
        return baseUncertainty * horizonMultipliers[forecastType];
    }
    identifyForecastFactors(forecastDate, dayOffset, forecastType) {
        const factors = [];
        const dayOfYear = Math.floor((forecastDate.getTime() - new Date(forecastDate.getFullYear(), 0, 0).getTime()) /
            (1000 * 60 * 60 * 24));
        const seasonalImpact = 0.15 * Math.sin((2 * Math.PI * dayOfYear) / 365);
        factors.push({
            factor: 'Seasonal Variation',
            impact: seasonalImpact,
            description: `${seasonalImpact > 0 ? 'Higher' : 'Lower'} enrollment expected due to seasonal patterns`,
        });
        const dayOfWeek = forecastDate.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            factors.push({
                factor: 'Weekend Effect',
                impact: -0.7,
                description: 'Significantly lower enrollment expected on weekends',
            });
        }
        const month = forecastDate.getMonth();
        if (month === 5 || month === 6) {
            factors.push({
                factor: 'Summer Break',
                impact: -0.3,
                description: 'Lower enrollment during summer vacation period',
            });
        }
        if (month === 10 || month === 3) {
            factors.push({
                factor: 'Examination Period',
                impact: -0.1,
                description: 'Slightly lower enrollment during exam periods',
            });
        }
        if (forecastType === 'long_term') {
            factors.push({
                factor: 'Growth Trend',
                impact: 0.05,
                description: 'Positive long-term growth trend expected',
            });
        }
        return factors;
    }
    analyzeSeasonalPatterns(historicalData) {
        const weeklyData = Array(7)
            .fill(0)
            .map(() => ({ sum: 0, count: 0 }));
        const monthlyData = Array(12)
            .fill(0)
            .map(() => ({ sum: 0, count: 0 }));
        for (const dataPoint of historicalData) {
            const dayOfWeek = dataPoint.timestamp.getDay();
            const month = dataPoint.timestamp.getMonth();
            weeklyData[dayOfWeek].sum += dataPoint.value;
            weeklyData[dayOfWeek].count += 1;
            monthlyData[month].sum += dataPoint.value;
            monthlyData[month].count += 1;
        }
        const weeklyPattern = weeklyData.map(data => (data.count > 0 ? data.sum / data.count : 0));
        const monthlyPattern = monthlyData.map(data => (data.count > 0 ? data.sum / data.count : 0));
        const weeklyMean = weeklyPattern.reduce((sum, val) => sum + val, 0) / 7;
        const monthlyMean = monthlyPattern.reduce((sum, val) => sum + val, 0) / 12;
        return {
            weeklyPattern: weeklyPattern.map(val => val / weeklyMean),
            monthlyPattern: monthlyPattern.map(val => val / monthlyMean),
            academicCalendarImpact: [
                {
                    event: 'Summer Vacation',
                    startDate: new Date(new Date().getFullYear(), 4, 15),
                    endDate: new Date(new Date().getFullYear(), 5, 30),
                    expectedImpact: -0.4,
                },
                {
                    event: 'Winter Break',
                    startDate: new Date(new Date().getFullYear(), 11, 20),
                    endDate: new Date(new Date().getFullYear() + 1, 0, 5),
                    expectedImpact: -0.6,
                },
                {
                    event: 'Festival Season',
                    startDate: new Date(new Date().getFullYear(), 9, 1),
                    endDate: new Date(new Date().getFullYear(), 10, 15),
                    expectedImpact: -0.2,
                },
            ],
        };
    }
    analyzeGrowthTrajectory(historicalData) {
        const values = historicalData.map(d => d.value);
        const trend = this.calculateTrend(values);
        const meanValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - meanValue, 2), 0) / values.length;
        const volatility = Math.sqrt(variance) / meanValue;
        let currentTrend;
        if (volatility > 0.2) {
            currentTrend = 'volatile';
        }
        else if (Math.abs(trend) < meanValue * 0.001) {
            currentTrend = 'stable';
        }
        else {
            currentTrend = trend > 0 ? 'growing' : 'declining';
        }
        const dailyGrowthRate = trend / meanValue;
        const weeklyGrowthRate = dailyGrowthRate * 7;
        const monthlyGrowthRate = dailyGrowthRate * 30;
        const yearlyGrowthRate = dailyGrowthRate * 365;
        const maxValue = Math.max(...values);
        const currentUtilization = meanValue / (maxValue * 1.2);
        let projectedSaturationDate;
        if (yearlyGrowthRate > 0.05 && currentUtilization > 0.8) {
            const daysToSaturation = (1 - currentUtilization) / yearlyGrowthRate;
            projectedSaturationDate = new Date(Date.now() + daysToSaturation * 24 * 60 * 60 * 1000);
        }
        return {
            currentTrend,
            trendStrength: Math.abs(trend) / meanValue,
            growthRate: {
                daily: dailyGrowthRate,
                weekly: weeklyGrowthRate,
                monthly: monthlyGrowthRate,
                yearly: yearlyGrowthRate,
            },
            saturationAnalysis: {
                currentCapacityUtilization: currentUtilization,
                projectedSaturationDate,
                maxSustainableEnrollment: Math.round(maxValue * 1.2),
            },
        };
    }
    async generateDemandForecast(schoolId) {
        const model = this.forecastingModels.get('demand_forecast_v1');
        if (!model) {
            throw new Error('Demand forecasting model not found');
        }
        const dataKey = schoolId ? `demand_${schoolId}` : 'demand_aggregate';
        let historicalData = this.historicalDataCache.get(dataKey);
        if (!historicalData && schoolId) {
            historicalData = await this.generateHistoricalDemandData(schoolId);
            this.historicalDataCache.set(dataKey, historicalData);
        }
        if (!historicalData) {
            throw new Error('No historical demand data available');
        }
        const dailyPredictions = await this.generateDailyMealDemandPredictions(historicalData, model);
        const weeklyPredictions = await this.generateWeeklyMealDemandPredictions(dailyPredictions);
        const menuPopularityForecast = await this.generateMenuPopularityForecast(historicalData);
        const capacityRequirements = await this.generateCapacityPlanningInsights(dailyPredictions);
        return {
            forecastId: `demand_forecast_${schoolId || 'aggregate'}_${Date.now()}`,
            schoolId,
            generatedAt: new Date(),
            mealDemandPredictions: {
                daily: dailyPredictions,
                weekly: weeklyPredictions,
            },
            menuPopularityForecast,
            capacityRequirements,
        };
    }
    async generateDailyMealDemandPredictions(historicalData, model) {
        const predictions = [];
        const horizon = 14;
        const baseForecasts = this.applyForecastingAlgorithm(historicalData, horizon, model);
        const mealTypes = [
            'breakfast',
            'lunch',
            'snack',
            'dinner',
        ];
        const mealDistribution = {
            breakfast: 0.15,
            lunch: 0.6,
            snack: 0.2,
            dinner: 0.05,
        };
        for (let day = 0; day < horizon; day++) {
            const forecastDate = new Date();
            forecastDate.setDate(forecastDate.getDate() + day + 1);
            const totalDayDemand = baseForecasts[day];
            const uncertaintyFactor = 0.1;
            for (const mealType of mealTypes) {
                const mealDemand = totalDayDemand * mealDistribution[mealType];
                const uncertainty = mealDemand * uncertaintyFactor;
                predictions.push({
                    date: forecastDate,
                    mealType,
                    predictedDemand: Math.round(mealDemand),
                    confidenceInterval: {
                        lower: Math.round(Math.max(0, mealDemand - 1.96 * uncertainty)),
                        upper: Math.round(mealDemand + 1.96 * uncertainty),
                        confidence: 0.95,
                    },
                    peakTimeDistribution: this.generatePeakTimeDistribution(mealType),
                });
            }
        }
        return predictions;
    }
    generatePeakTimeDistribution(mealType) {
        const distributions = {
            breakfast: [
                { timeSlot: '07:00-07:30', demandPercentage: 20 },
                { timeSlot: '07:30-08:00', demandPercentage: 40 },
                { timeSlot: '08:00-08:30', demandPercentage: 30 },
                { timeSlot: '08:30-09:00', demandPercentage: 10 },
            ],
            lunch: [
                { timeSlot: '12:00-12:30', demandPercentage: 35 },
                { timeSlot: '12:30-13:00', demandPercentage: 40 },
                { timeSlot: '13:00-13:30', demandPercentage: 20 },
                { timeSlot: '13:30-14:00', demandPercentage: 5 },
            ],
            snack: [
                { timeSlot: '15:30-16:00', demandPercentage: 50 },
                { timeSlot: '16:00-16:30', demandPercentage: 30 },
                { timeSlot: '16:30-17:00', demandPercentage: 20 },
            ],
            dinner: [
                { timeSlot: '19:00-19:30', demandPercentage: 30 },
                { timeSlot: '19:30-20:00', demandPercentage: 45 },
                { timeSlot: '20:00-20:30', demandPercentage: 25 },
            ],
        };
        return distributions[mealType] || [];
    }
    async generateWeeklyMealDemandPredictions(dailyPredictions) {
        const weeklyPredictions = [];
        const weeksToForecast = 12;
        for (let week = 0; week < weeksToForecast; week++) {
            const weekStartDate = new Date();
            weekStartDate.setDate(weekStartDate.getDate() + week * 7);
            let totalMealDemand = 0;
            const mealTypeDistribution = {
                breakfast: 0,
                lunch: 0,
                snack: 0,
                dinner: 0,
            };
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(weekStartDate);
                currentDate.setDate(currentDate.getDate() + day);
                const dayPredictions = dailyPredictions.filter(p => p.date.toDateString() === currentDate.toDateString());
                for (const prediction of dayPredictions) {
                    totalMealDemand += prediction.predictedDemand;
                    mealTypeDistribution[prediction.mealType] += prediction.predictedDemand;
                }
            }
            weeklyPredictions.push({
                weekStartDate,
                totalMealDemand,
                mealTypeDistribution,
                specialDietaryRequirements: {
                    vegetarian: Math.round(totalMealDemand * 0.25),
                    vegan: Math.round(totalMealDemand * 0.05),
                    glutenFree: Math.round(totalMealDemand * 0.08),
                    allergenFree: Math.round(totalMealDemand * 0.12),
                    diabeticFriendly: Math.round(totalMealDemand * 0.06),
                },
            });
        }
        return weeklyPredictions;
    }
    async generateMenuPopularityForecast(historicalData) {
        const menuItems = [
            { name: 'Dal Rice', category: 'Traditional', basePopularity: 0.8, seasonal: 0.1 },
            { name: 'Vegetable Biryani', category: 'Traditional', basePopularity: 0.7, seasonal: 0.15 },
            { name: 'Paneer Curry', category: 'Traditional', basePopularity: 0.6, seasonal: 0.1 },
            {
                name: 'Mixed Vegetable Curry',
                category: 'Traditional',
                basePopularity: 0.5,
                seasonal: 0.2,
            },
            { name: 'Fruit Salad', category: 'Healthy', basePopularity: 0.4, seasonal: 0.3 },
            { name: 'Sandwich', category: 'Continental', basePopularity: 0.6, seasonal: 0.05 },
            { name: 'Pasta', category: 'Continental', basePopularity: 0.5, seasonal: 0.05 },
            { name: 'Soup', category: 'Continental', basePopularity: 0.3, seasonal: 0.4 },
        ];
        return menuItems.map((item) => {
            const currentMonth = new Date().getMonth();
            const seasonalFactor = 1 + item.seasonal * Math.sin((2 * Math.PI * currentMonth) / 12);
            const predictedPopularity = Math.min(1.0, item.basePopularity * seasonalFactor);
            return {
                menuItem: item.name,
                category: item.category,
                predictedPopularity,
                seasonalVariation: item.seasonal,
                demographicAppeal: {
                    ageGroups: {
                        '6-10 years': item.name.includes('Rice') ? 0.8 : 0.6,
                        '11-15 years': item.name.includes('Pasta') ? 0.7 : 0.5,
                        '16+ years': item.category === 'Healthy' ? 0.6 : 0.4,
                    },
                    dietaryPreferences: {
                        vegetarian: item.name.includes('Paneer') ? 0.3 : 0.8,
                        vegan: item.name.includes('Paneer') ? 0.1 : 0.6,
                        glutenFree: item.name.includes('Rice') ? 0.9 : 0.4,
                        dairyFree: item.name.includes('Paneer') ? 0.1 : 0.7,
                    },
                },
                recommendedFrequency: {
                    optimal: Math.round(predictedPopularity * 8),
                    minimum: Math.round(predictedPopularity * 4),
                    maximum: Math.round(predictedPopularity * 12),
                },
            };
        });
    }
    async generateCapacityPlanningInsights(dailyPredictions) {
        const kitchenCapacity = [];
        const storageRequirements = [];
        const predictionsByDate = {};
        for (const prediction of dailyPredictions) {
            const dateKey = prediction.date.toDateString();
            if (!predictionsByDate[dateKey]) {
                predictionsByDate[dateKey] = [];
            }
            predictionsByDate[dateKey].push(prediction);
        }
        for (const [dateStr, datePredictions] of Object.entries(predictionsByDate)) {
            const date = new Date(dateStr);
            const totalDayMeals = datePredictions.reduce((sum, p) => sum + p.predictedDemand, 0);
            const peakHourRequirement = Math.round(totalDayMeals * 0.4);
            kitchenCapacity.push({
                date,
                requiredCapacity: Math.round(totalDayMeals / 8),
                peakHourRequirement,
                equipmentUtilization: {
                    cooking_stations: Math.min(100, (peakHourRequirement / 50) * 100),
                    serving_counters: Math.min(100, (peakHourRequirement / 30) * 100),
                    dishwashing: Math.min(100, (totalDayMeals / 200) * 100),
                },
                staffingRequirement: Math.ceil(peakHourRequirement / 40),
            });
        }
        const ingredientCategories = ['vegetables', 'grains', 'dairy', 'spices', 'frozen_items'];
        for (const [dateStr, datePredictions] of Object.entries(predictionsByDate)) {
            const date = new Date(dateStr);
            const totalDayMeals = datePredictions.reduce((sum, p) => sum + p.predictedDemand, 0);
            for (const category of ingredientCategories) {
                let storageRequirement = 0;
                let turnoverRate = 7;
                switch (category) {
                    case 'vegetables':
                        storageRequirement = totalDayMeals * 0.3;
                        turnoverRate = 3;
                        break;
                    case 'grains':
                        storageRequirement = totalDayMeals * 0.2;
                        turnoverRate = 30;
                        break;
                    case 'dairy':
                        storageRequirement = totalDayMeals * 0.15;
                        turnoverRate = 5;
                        break;
                    case 'spices':
                        storageRequirement = totalDayMeals * 0.02;
                        turnoverRate = 60;
                        break;
                    case 'frozen_items':
                        storageRequirement = totalDayMeals * 0.1;
                        turnoverRate = 14;
                        break;
                }
                storageRequirements.push({
                    date,
                    ingredientCategory: category,
                    requiredStorage: storageRequirement,
                    turnoverRate,
                });
            }
        }
        return {
            kitchenCapacity,
            storageRequirements,
        };
    }
    getEngineStatus() {
        let totalAccuracy = 0;
        let modelCount = 0;
        for (const model of this.forecastingModels.values()) {
            totalAccuracy += model.accuracy;
            modelCount++;
        }
        const averageAccuracy = modelCount > 0 ? totalAccuracy / modelCount : 0;
        return {
            status: averageAccuracy > 0.7 ? 'healthy' : averageAccuracy > 0.5 ? 'degraded' : 'critical',
            modelsLoaded: this.forecastingModels.size,
            historicalDataSets: this.historicalDataCache.size,
            averageModelAccuracy: averageAccuracy,
            lastTrainingDate: new Date(),
        };
    }
}
exports.PredictiveInsightsEngine = PredictiveInsightsEngine;
exports.predictiveInsightsEngine = new PredictiveInsightsEngine();
//# sourceMappingURL=predictive-insights-engine.js.map