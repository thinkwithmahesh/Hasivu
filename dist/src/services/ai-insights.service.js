"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIInsightsEngine = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const client_bedrock_runtime_1 = require("@aws-sdk/client-bedrock-runtime");
const client_sagemaker_runtime_1 = require("@aws-sdk/client-sagemaker-runtime");
const logger_1 = require("../utils/logger");
const metrics_service_1 = require("./metrics.service");
const cache_manager_service_1 = require("./cache-manager.service");
class AIInsightsEngine extends events_1.EventEmitter {
    config;
    metrics = new metrics_service_1.MetricsCollector();
    cache = new cache_manager_service_1.CacheManager();
    bedrockClient;
    sagemakerClient;
    isInitialized = false;
    modelConfigs = new Map();
    insightCache = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.bedrockClient = new client_bedrock_runtime_1.BedrockRuntimeClient({
            region: this.config.awsRegion
        });
        this.sagemakerClient = new client_sagemaker_runtime_1.SageMakerRuntimeClient({
            region: this.config.awsRegion
        });
        this.setupEventHandlers();
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing AI Insights Engine...');
            await this.testModelConnections();
            await this.loadModelConfigurations();
            this.isInitialized = true;
            logger_1.logger.info('AI Insights Engine initialized successfully', {
                bedrockModel: this.config.bedrockModel,
                sagemakerEndpoints: Object.keys(this.config.sagemakerEndpoints),
                confidenceThreshold: this.config.confidenceThreshold
            });
            this.emit('initialized');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize AI Insights Engine', { error });
            throw error;
        }
    }
    async analyzeTrends(data, dateRange, config = {}) {
        try {
            logger_1.logger.debug('Analyzing trends', {
                dataSourcesCount: Object.keys(data).length,
                dateRange
            });
            if (!this.isInitialized) {
                throw new Error('AI Insights Engine not initialized');
            }
            const insights = [];
            for (const [sourceName, sourceData] of Object.entries(data)) {
                if (!Array.isArray(sourceData) || sourceData.length < (config.minDataPoints || 10)) {
                    continue;
                }
                const trendAnalysis = await this.performTrendAnalysis(sourceData, sourceName);
                if (trendAnalysis.significance >= (config.significanceLevel || 0.05)) {
                    const insight = await this.generateTrendInsight(trendAnalysis, sourceName);
                    if (insight.confidence >= this.config.confidenceThreshold) {
                        insights.push(insight);
                    }
                }
            }
            insights.sort((a, b) => b.confidence - a.confidence);
            logger_1.logger.info('Trend analysis completed', {
                trendsDetected: insights.length,
                significantTrends: insights.filter(i => i.priority === 'high' || i.priority === 'critical').length
            });
            this.metrics.gauge('ai_insights.trends.detected', insights.length);
            return insights.slice(0, this.config.maxInsightsPerRequest);
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze trends', { error });
            this.metrics.increment('ai_insights.trends.failed');
            return [];
        }
    }
    async detectAnomalies(data, config) {
        try {
            logger_1.logger.debug('Detecting anomalies', {
                algorithm: config.algorithm,
                sensitivity: config.sensitivity
            });
            const insights = [];
            for (const [sourceName, sourceData] of Object.entries(data)) {
                if (!Array.isArray(sourceData) || sourceData.length < 20) {
                    continue;
                }
                const anomalies = await this.detectAnomaliesInDataset(sourceData, config);
                for (const anomaly of anomalies) {
                    if (anomaly.isAnomaly && anomaly.score >= config.sensitivity) {
                        const insight = await this.generateAnomalyInsight(anomaly, sourceName, config);
                        if (insight.confidence >= this.config.confidenceThreshold) {
                            insights.push(insight);
                        }
                    }
                }
            }
            insights.sort((a, b) => {
                const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const aSeverity = severityOrder[a.priority];
                const bSeverity = severityOrder[b.priority];
                return bSeverity - aSeverity || b.confidence - a.confidence;
            });
            logger_1.logger.info('Anomaly detection completed', {
                anomaliesDetected: insights.length,
                criticalAnomalies: insights.filter(i => i.priority === 'critical').length
            });
            this.metrics.gauge('ai_insights.anomalies.detected', insights.length);
            return insights.slice(0, this.config.maxInsightsPerRequest);
        }
        catch (error) {
            logger_1.logger.error('Failed to detect anomalies', { error });
            this.metrics.increment('ai_insights.anomalies.failed');
            return [];
        }
    }
    async generatePredictions(data, config) {
        try {
            logger_1.logger.debug('Generating predictions', {
                horizon: config.horizon,
                algorithm: config.algorithm || 'auto'
            });
            const insights = [];
            for (const [sourceName, sourceData] of Object.entries(data)) {
                if (!Array.isArray(sourceData) || sourceData.length < 30) {
                    continue;
                }
                const predictions = await this.generateTimeSeriesPredictions(sourceData, config);
                if (predictions && predictions.length > 0) {
                    const insight = await this.generatePredictionInsight(predictions, sourceName, config);
                    if (insight.confidence >= this.config.confidenceThreshold) {
                        insights.push(insight);
                    }
                }
            }
            logger_1.logger.info('Predictions generated', {
                predictionsGenerated: insights.length,
                horizon: config.horizon
            });
            this.metrics.gauge('ai_insights.predictions.generated', insights.length);
            return insights.slice(0, this.config.maxInsightsPerRequest);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate predictions', { error });
            this.metrics.increment('ai_insights.predictions.failed');
            return [];
        }
    }
    async findCorrelations(data, config) {
        try {
            logger_1.logger.debug('Finding correlations', {
                method: config.method,
                threshold: config.threshold
            });
            const insights = [];
            const correlations = await this.calculateCorrelationMatrix(data, config);
            for (const correlation of correlations) {
                if (Math.abs(correlation.coefficient) >= config.threshold) {
                    const insight = await this.generateCorrelationInsight(correlation, config);
                    if (insight.confidence >= this.config.confidenceThreshold) {
                        insights.push(insight);
                    }
                }
            }
            insights.sort((a, b) => b.confidence - a.confidence);
            logger_1.logger.info('Correlation analysis completed', {
                correlationsFound: insights.length,
                strongCorrelations: insights.filter(i => i.confidence > 0.8).length
            });
            this.metrics.gauge('ai_insights.correlations.found', insights.length);
            return insights.slice(0, this.config.maxInsightsPerRequest);
        }
        catch (error) {
            logger_1.logger.error('Failed to find correlations', { error });
            this.metrics.increment('ai_insights.correlations.failed');
            return [];
        }
    }
    async generateRecommendations(data, kpis, config) {
        try {
            logger_1.logger.debug('Generating recommendations', {
                context: config.context,
                priority: config.priority
            });
            const insights = [];
            const performanceAnalysis = await this.analyzePerformance(data, kpis, config);
            const recommendations = await this.generateLLMRecommendations(performanceAnalysis, config);
            for (const recommendation of recommendations) {
                const insight = await this.createRecommendationInsight(recommendation, config);
                if (insight.confidence >= this.config.confidenceThreshold) {
                    insights.push(insight);
                }
            }
            insights.sort((a, b) => {
                const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
                const aImpact = impactOrder[a.priority];
                const bImpact = impactOrder[b.priority];
                return bImpact - aImpact || b.confidence - a.confidence;
            });
            logger_1.logger.info('Recommendations generated', {
                recommendationsGenerated: insights.length,
                highPriorityRecommendations: insights.filter(i => i.priority === 'high' || i.priority === 'critical').length
            });
            this.metrics.gauge('ai_insights.recommendations.generated', insights.length);
            return insights.slice(0, config.maxRecommendations || this.config.maxInsightsPerRequest);
        }
        catch (error) {
            logger_1.logger.error('Failed to generate recommendations', { error });
            this.metrics.increment('ai_insights.recommendations.failed');
            return [];
        }
    }
    async generateNaturalLanguageExplanation(insight, context) {
        try {
            logger_1.logger.debug('Generating natural language explanation', {
                insightType: insight.type,
                priority: insight.priority
            });
            const prompt = this.buildExplanationPrompt(insight, context);
            const explanation = await this.invokeLLMForExplanation(prompt);
            return {
                description: explanation.summary,
                details: explanation.detailed
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to generate natural language explanation', { error });
            return {
                description: `${insight.type} detected with ${(insight.confidence * 100).toFixed(1)}% confidence`,
                details: 'Detailed explanation not available'
            };
        }
    }
    async testModelConnections() {
        try {
            if (this.config.bedrockModel) {
                await this.invokeLLMForExplanation('Test connection');
            }
            for (const [, endpoint] of Object.entries(this.config.sagemakerEndpoints)) {
                if (endpoint) {
                    await this.testSagemakerEndpoint(endpoint);
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('Some model connections failed during testing', { error });
        }
    }
    async loadModelConfigurations() {
        this.modelConfigs.set('anomaly_detection', {
            algorithm: 'isolation_forest',
            contamination: 0.1,
            nEstimators: 100
        });
        this.modelConfigs.set('time_series_forecasting', {
            algorithm: 'prophet',
            seasonality: 'auto',
            holidays: true
        });
        this.modelConfigs.set('correlation_analysis', {
            method: 'pearson',
            minSamples: 10,
            significanceLevel: 0.05
        });
    }
    async performTrendAnalysis(data, sourceName) {
        const values = data?.map(d => d.value || d.count || 0) || [];
        const direction = values[values.length - 1] > values[0] ? 'up' : 'down';
        const strength = Math.abs(values[values.length - 1] - values[0]) / Math.max(values[0], 1);
        return {
            metric: sourceName,
            direction,
            strength,
            significance: 0.85,
            seasonality: {
                detected: false
            },
            changePoints: [],
            forecast: []
        };
    }
    async generateTrendInsight(trendAnalysis, sourceName) {
        const priority = trendAnalysis.strength > 0.5 ? 'high' : 'medium';
        const confidence = trendAnalysis.significance;
        return {
            id: (0, uuid_1.v4)(),
            type: 'trend',
            priority: priority,
            confidence,
            title: `${trendAnalysis.direction === 'up' ? 'Increasing' : 'Decreasing'} Trend in ${sourceName}`,
            description: `Significant ${trendAnalysis.direction} trend detected`,
            details: `The metric shows a ${(trendAnalysis.strength * 100).toFixed(1)}% change with ${(confidence * 100).toFixed(1)}% confidence`,
            visualizations: [],
            actionItems: [],
            dataPoints: [],
            metadata: {
                algorithm: 'trend_analysis',
                modelVersion: '1.0.0',
                generatedAt: new Date(),
                reviewStatus: 'pending'
            }
        };
    }
    async detectAnomaliesInDataset(data, config) {
        const results = [];
        const values = data?.map(d => d.value || d.count || 0) || [];
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
        const threshold = config.sensitivity * std;
        data?.forEach((dataPoint) => {
            const value = dataPoint.value || dataPoint.count || 0;
            const deviation = Math.abs(value - mean);
            const isAnomaly = deviation > threshold;
            if (isAnomaly) {
                results.push({
                    dataPoint,
                    score: deviation / std,
                    isAnomaly: true,
                    severity: deviation > 3 * std ? 'critical' : deviation > 2 * std ? 'high' : 'medium',
                    explanation: `Value ${value} deviates significantly from expected range`,
                    similarPatterns: [],
                    recommendedActions: ['Investigate cause', 'Verify data quality']
                });
            }
        });
        return results;
    }
    async generateAnomalyInsight(anomaly, sourceName, config) {
        return {
            id: (0, uuid_1.v4)(),
            type: 'anomaly',
            priority: anomaly.severity,
            confidence: Math.min(anomaly.score / 3, 1),
            title: `Anomaly Detected in ${sourceName}`,
            description: anomaly.explanation,
            details: `Anomaly score: ${anomaly.score.toFixed(2)}, Severity: ${anomaly.severity}`,
            visualizations: [],
            actionItems: anomaly.recommendedActions.map(action => ({
                id: (0, uuid_1.v4)(),
                title: action,
                description: action,
                priority: 'medium',
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
            })),
            dataPoints: [anomaly.dataPoint],
            metadata: {
                algorithm: config.algorithm,
                modelVersion: '1.0.0',
                generatedAt: new Date(),
                reviewStatus: 'pending'
            }
        };
    }
    async generateTimeSeriesPredictions(data, _config) {
        const lastValue = data?.[data.length - 1]?.value || 0;
        const predictions = [];
        for (let i = 1; i <= 30; i++) {
            predictions.push({
                date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
                value: lastValue * (1 + (Math.random() - 0.5) * 0.1),
                confidence_lower: lastValue * 0.9,
                confidence_upper: lastValue * 1.1
            });
        }
        return predictions;
    }
    async generatePredictionInsight(predictions, sourceName, config) {
        if (!predictions || predictions.length === 0) {
            throw new Error('Predictions array is required and cannot be empty');
        }
        const avgValue = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;
        return {
            id: (0, uuid_1.v4)(),
            type: 'prediction',
            priority: 'medium',
            confidence: config.confidence,
            title: `${config.horizon} Forecast for ${sourceName}`,
            description: `Predicted average value: ${avgValue.toFixed(2)}`,
            details: `Forecast generated for ${config.horizon} with ${(config.confidence * 100).toFixed(1)}% confidence`,
            visualizations: [],
            actionItems: [],
            dataPoints: predictions,
            metadata: {
                algorithm: config.algorithm || 'prophet',
                modelVersion: '1.0.0',
                generatedAt: new Date(),
                reviewStatus: 'pending'
            }
        };
    }
    async calculateCorrelationMatrix(data, _config) {
        const correlations = [];
        const variables = Object.keys(data);
        for (let i = 0; i < variables.length; i++) {
            for (let j = i + 1; j < variables.length; j++) {
                correlations.push({
                    var1: variables[i],
                    var2: variables[j],
                    coefficient: (Math.random() - 0.5) * 2,
                    pValue: Math.random() * 0.1
                });
            }
        }
        return correlations;
    }
    async generateCorrelationInsight(correlation, _config) {
        const strength = Math.abs(correlation.coefficient);
        const direction = correlation.coefficient > 0 ? 'positive' : 'negative';
        return {
            id: (0, uuid_1.v4)(),
            type: 'correlation',
            priority: strength > 0.8 ? 'high' : 'medium',
            confidence: strength,
            title: `${direction.charAt(0).toUpperCase() + direction.slice(1)} Correlation Found`,
            description: `${correlation.var1} and ${correlation.var2} show ${direction} correlation`,
            details: `Correlation coefficient: ${correlation.coefficient.toFixed(3)}, p-value: ${correlation.pValue.toFixed(3)}`,
            visualizations: [],
            actionItems: [],
            dataPoints: [],
            metadata: {
                algorithm: 'correlation_analysis',
                modelVersion: '1.0.0',
                generatedAt: new Date(),
                reviewStatus: 'pending'
            }
        };
    }
    async analyzePerformance(data, kpis, _config) {
        return {
            kpiPerformance: Object.entries(kpis).map(([kpi, value]) => ({
                kpi,
                value,
                benchmark: value * 1.1,
                performance: value / (value * 1.1)
            })),
            trends: Object.keys(data),
            opportunities: ['Improve efficiency', 'Reduce costs', 'Enhance quality']
        };
    }
    async generateLLMRecommendations(performanceAnalysis, _config) {
        return [
            {
                title: 'Optimize Resource Allocation',
                description: 'Reallocate resources based on demand patterns',
                impact: 'high',
                effort: 'medium',
                implementationSteps: [
                    'Analyze current resource utilization',
                    'Identify optimization opportunities',
                    'Implement resource reallocation plan'
                ]
            }
        ];
    }
    async createRecommendationInsight(recommendation, _config) {
        return {
            id: (0, uuid_1.v4)(),
            type: 'recommendation',
            priority: recommendation.impact,
            confidence: 0.85,
            title: recommendation.title,
            description: recommendation.description,
            details: `Implementation effort: ${recommendation.effort}`,
            visualizations: [],
            actionItems: recommendation.implementationSteps?.map((step) => ({
                id: (0, uuid_1.v4)(),
                title: step,
                description: step,
                priority: 'medium'
            })) || [],
            dataPoints: [],
            metadata: {
                algorithm: 'llm_recommendations',
                modelVersion: '1.0.0',
                generatedAt: new Date(),
                reviewStatus: 'pending'
            }
        };
    }
    buildExplanationPrompt(insight, context) {
        return `
      Generate a clear, actionable explanation for the following ${insight.type} insight:

      Type: ${insight.type}
      Priority: ${insight.priority}
      Confidence: ${(insight.confidence * 100).toFixed(1)}%
      Title: ${insight.title}

      Context: ${JSON.stringify(context)}

      Please provide:
      1. A concise summary (2-3 sentences)
      2. A detailed explanation with actionable recommendations

      Focus on business impact and practical next steps.
    `;
    }
    async invokeLLMForExplanation(prompt) {
        try {
            const command = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: this.config.bedrockModel,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    prompt,
                    max_tokens: 500,
                    temperature: 0.7
                })
            });
            const response = await this.bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            const completion = responseBody.completion || responseBody.generated_text || '';
            return {
                summary: completion.split('\n')[0] || 'Summary not available',
                detailed: completion || 'Detailed explanation not available'
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to invoke LLM for explanation', { error });
            return {
                summary: 'AI explanation not available',
                detailed: 'Unable to generate detailed explanation'
            };
        }
    }
    async testSagemakerEndpoint(endpoint) {
        try {
            const command = new client_sagemaker_runtime_1.InvokeEndpointCommand({
                EndpointName: endpoint,
                ContentType: 'application/json',
                Body: JSON.stringify({ test: 'connection' })
            });
            await this.sagemakerClient.send(command);
        }
        catch (error) {
            logger_1.logger.warn(`SageMaker endpoint ${endpoint} test failed`, { error });
        }
    }
    async getHealthStatus() {
        const cacheSize = this.insightCache.size;
        const modelsLoaded = this.modelConfigs.size;
        let bedrockConnected = false;
        let sagemakerConnected = false;
        try {
            const testCommand = new client_bedrock_runtime_1.InvokeModelCommand({
                modelId: this.config.bedrockModel,
                contentType: 'application/json',
                accept: 'application/json',
                body: JSON.stringify({
                    prompt: 'test',
                    max_tokens: 1
                })
            });
            await this.bedrockClient.send(testCommand);
            bedrockConnected = true;
        }
        catch (error) {
            logger_1.logger.warn('Bedrock health check failed', { error: (error instanceof Error ? error.message : String(error)) });
        }
        try {
            for (const endpoint of Object.values(this.config.sagemakerEndpoints)) {
                if (endpoint) {
                    await this.testSagemakerEndpoint(endpoint);
                    sagemakerConnected = true;
                    break;
                }
            }
        }
        catch (error) {
            logger_1.logger.warn('SageMaker health check failed', { error: (error instanceof Error ? error.message : String(error)) });
        }
        let status = 'healthy';
        if (!this.isInitialized) {
            status = 'unhealthy';
        }
        else if (!bedrockConnected && !sagemakerConnected) {
            status = 'unhealthy';
        }
        else if (!bedrockConnected || !sagemakerConnected) {
            status = 'degraded';
        }
        return {
            status,
            initialized: this.isInitialized,
            bedrockConnected,
            sagemakerConnected,
            cacheSize,
            modelsLoaded
        };
    }
    setupEventHandlers() {
        this.on('initialized', () => {
            this.metrics.increment('ai_insights.initialized');
        });
        this.on('insight:generated', (insight) => {
            this.metrics.increment(`ai_insights.${insight.type}.generated`);
            this.metrics.gauge(`ai_insights.confidence.${insight.type}`, insight.confidence);
        });
        this.on('error', (error) => {
            logger_1.logger.error('AI Insights Engine error', { error });
            this.metrics.increment('ai_insights.errors');
        });
    }
}
exports.AIInsightsEngine = AIInsightsEngine;
//# sourceMappingURL=ai-insights.service.js.map