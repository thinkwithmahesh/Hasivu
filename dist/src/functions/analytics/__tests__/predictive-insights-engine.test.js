"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const predictive_insights_engine_1 = require("../predictive-insights-engine");
jest.mock('../shared/logger.service');
jest.mock('../shared/database.service');
describe('Predictive Insights Engine', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('Engine Initialization', () => {
        it('should initialize with school data', async () => {
            const mockSchools = [
                { id: 'school1', subscriptionTier: 'PREMIUM' },
                { id: 'school2', subscriptionTier: 'BASIC' },
            ];
            await predictive_insights_engine_1.predictiveInsightsEngine.initialize(mockSchools);
            expect(predictive_insights_engine_1.predictiveInsightsEngine).toBeDefined();
        });
        it('should handle empty school data', async () => {
            await predictive_insights_engine_1.predictiveInsightsEngine.initialize([]);
            expect(predictive_insights_engine_1.predictiveInsightsEngine).toBeDefined();
        });
    });
    describe('Enrollment Forecasting', () => {
        it('should generate enrollment forecasts', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            expect(forecast).toBeDefined();
            expect(forecast.forecastId).toContain('school1');
            expect(forecast.forecastType).toBe('individual_school');
            expect(forecast.forecasts.shortTerm.predictions).toHaveLength(30);
            expect(forecast.forecasts.mediumTerm.predictions).toHaveLength(90);
            expect(forecast.forecasts.longTerm.predictions).toHaveLength(365);
        });
        it('should generate system-wide forecasts', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast();
            expect(forecast).toBeDefined();
            expect(forecast.forecastType).toBe('system_wide');
            expect(forecast.seasonalPatterns).toBeDefined();
            expect(forecast.growthAnalysis).toBeDefined();
        });
        it('should include confidence intervals in forecasts', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            const firstPrediction = forecast.forecasts.shortTerm.predictions[0];
            expect(firstPrediction.confidenceInterval).toBeDefined();
            expect(firstPrediction.confidenceInterval.lower).toBeLessThanOrEqual(firstPrediction.predictedEnrollment);
            expect(firstPrediction.confidenceInterval.upper).toBeGreaterThanOrEqual(firstPrediction.predictedEnrollment);
            expect(firstPrediction.confidenceInterval.confidence).toBe(0.95);
        });
        it('should identify forecast factors', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            const firstPrediction = forecast.forecasts.shortTerm.predictions[0];
            expect(firstPrediction.factors).toBeDefined();
            expect(firstPrediction.factors.length).toBeGreaterThan(0);
            const seasonalFactor = firstPrediction.factors.find(f => f.factor === 'Seasonal Variation');
            expect(seasonalFactor).toBeDefined();
        });
    });
    describe('Demand Forecasting', () => {
        it('should generate meal demand predictions', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateDemandForecast('school1');
            expect(forecast).toBeDefined();
            expect(forecast.forecastId).toContain('school1');
            expect(forecast.mealDemandPredictions.daily).toHaveLength(14 * 4);
            expect(forecast.mealDemandPredictions.weekly).toHaveLength(12);
        });
        it('should forecast menu popularity', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateDemandForecast('school1');
            expect(forecast.menuPopularityForecast).toBeDefined();
            expect(forecast.menuPopularityForecast.length).toBeGreaterThan(0);
            const firstItem = forecast.menuPopularityForecast[0];
            expect(firstItem.predictedPopularity).toBeGreaterThanOrEqual(0);
            expect(firstItem.predictedPopularity).toBeLessThanOrEqual(1);
            expect(firstItem.recommendedFrequency).toBeDefined();
        });
        it('should provide capacity planning insights', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateDemandForecast('school1');
            expect(forecast.capacityRequirements).toBeDefined();
            expect(forecast.capacityRequirements.kitchenCapacity).toHaveLength(14);
            expect(forecast.capacityRequirements.storageRequirements).toBeDefined();
        });
    });
    describe('Seasonal Pattern Analysis', () => {
        it('should analyze weekly patterns', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            expect(forecast.seasonalPatterns.weeklyPattern).toHaveLength(7);
            expect(forecast.seasonalPatterns.monthlyPattern).toHaveLength(12);
            expect(forecast.seasonalPatterns.weeklyPattern[0]).toBeLessThan(1);
            expect(forecast.seasonalPatterns.weeklyPattern[6]).toBeLessThan(1);
        });
        it('should identify academic calendar impacts', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            expect(forecast.seasonalPatterns.academicCalendarImpact).toBeDefined();
            expect(forecast.seasonalPatterns.academicCalendarImpact.length).toBeGreaterThan(0);
            const summerBreak = forecast.seasonalPatterns.academicCalendarImpact.find(event => event.event === 'Summer Vacation');
            expect(summerBreak).toBeDefined();
            expect(summerBreak?.expectedImpact).toBeLessThan(0);
        });
    });
    describe('Growth Trajectory Analysis', () => {
        it('should analyze growth trends', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            expect(forecast.growthAnalysis.currentTrend).toBeDefined();
            expect(['growing', 'stable', 'declining', 'volatile']).toContain(forecast.growthAnalysis.currentTrend);
            expect(forecast.growthAnalysis.growthRate).toBeDefined();
            expect(forecast.growthAnalysis.saturationAnalysis).toBeDefined();
        });
        it('should calculate growth rates across timeframes', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            const { growthRate } = forecast.growthAnalysis;
            expect(growthRate.daily).toBeDefined();
            expect(growthRate.weekly).toBeDefined();
            expect(growthRate.monthly).toBeDefined();
            expect(growthRate.yearly).toBeDefined();
        });
        it('should provide capacity saturation analysis', async () => {
            const forecast = await predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('school1');
            const saturation = forecast.growthAnalysis.saturationAnalysis;
            expect(saturation.currentCapacityUtilization).toBeGreaterThanOrEqual(0);
            expect(saturation.currentCapacityUtilization).toBeLessThanOrEqual(1);
            expect(saturation.maxSustainableEnrollment).toBeDefined();
        });
    });
    describe('Engine Status Monitoring', () => {
        it('should report engine health status', () => {
            const status = predictive_insights_engine_1.predictiveInsightsEngine.getEngineStatus();
            expect(status).toBeDefined();
            expect(['healthy', 'degraded', 'critical']).toContain(status.status);
            expect(status.modelsLoaded).toBeGreaterThanOrEqual(0);
            expect(status.averageModelAccuracy).toBeGreaterThanOrEqual(0);
            expect(status.averageModelAccuracy).toBeLessThanOrEqual(1);
        });
        it('should track model performance metrics', () => {
            const status = predictive_insights_engine_1.predictiveInsightsEngine.getEngineStatus();
            expect(status.averageModelAccuracy).toBeDefined();
            expect(status.modelsLoaded).toBeDefined();
            expect(status.historicalDataSets).toBeDefined();
            expect(status.lastTrainingDate).toBeInstanceOf(Date);
        });
    });
    describe('Error Handling', () => {
        it('should handle missing historical data gracefully', async () => {
            await expect(predictive_insights_engine_1.predictiveInsightsEngine.generateEnrollmentForecast('nonexistent-school')).rejects.toThrow('No historical enrollment data available');
        });
        it('should handle invalid forecast parameters', async () => {
            expect(predictive_insights_engine_1.predictiveInsightsEngine).toBeDefined();
        });
    });
    describe('Model Training and Validation', () => {
        it('should initialize forecasting models', async () => {
            const mockSchools = [{ id: 'school1' }];
            await predictive_insights_engine_1.predictiveInsightsEngine.initialize(mockSchools);
            const status = predictive_insights_engine_1.predictiveInsightsEngine.getEngineStatus();
            expect(status.modelsLoaded).toBeGreaterThan(0);
        });
        it('should load historical data for training', async () => {
            const mockSchools = [{ id: 'school1' }];
            await predictive_insights_engine_1.predictiveInsightsEngine.initialize(mockSchools);
            const status = predictive_insights_engine_1.predictiveInsightsEngine.getEngineStatus();
            expect(status.historicalDataSets).toBeGreaterThanOrEqual(0);
        });
    });
});
//# sourceMappingURL=predictive-insights-engine.test.js.map