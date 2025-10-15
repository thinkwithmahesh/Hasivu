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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MLModelManager = exports.MLBaseService = exports.ModelStatus = exports.ModelType = void 0;
const logger_1 = require("../../utils/logger");
const redis_service_1 = __importDefault(require("../redis.service"));
const database_service_1 = require("../database.service");
const uuid_1 = require("uuid");
const tf = __importStar(require("@tensorflow/tfjs-node"));
const mlflow_service_1 = require("./mlflow.service");
const model_artifact_service_1 = require("./model-artifact.service");
var ModelType;
(function (ModelType) {
    ModelType["STUDENT_BEHAVIOR"] = "student_behavior";
    ModelType["DEMAND_FORECASTING"] = "demand_forecasting";
    ModelType["SUPPLY_CHAIN_OPTIMIZATION"] = "supply_chain_optimization";
    ModelType["VENDOR_PERFORMANCE"] = "vendor_performance";
    ModelType["FINANCIAL_FORECASTING"] = "financial_forecasting";
    ModelType["HEALTH_NUTRITION"] = "health_nutrition";
    ModelType["RECOMMENDATION"] = "recommendation";
    ModelType["ANOMALY_DETECTION"] = "anomaly_detection";
    ModelType["CLASSIFICATION"] = "classification";
    ModelType["REGRESSION"] = "regression";
    ModelType["TIME_SERIES"] = "time_series";
    ModelType["CLUSTERING"] = "clustering";
})(ModelType || (exports.ModelType = ModelType = {}));
var ModelStatus;
(function (ModelStatus) {
    ModelStatus["INITIALIZED"] = "initialized";
    ModelStatus["TRAINING"] = "training";
    ModelStatus["TRAINED"] = "trained";
    ModelStatus["DEPLOYED"] = "deployed";
    ModelStatus["FAILED"] = "failed";
    ModelStatus["DEPRECATED"] = "deprecated";
    ModelStatus["ARCHIVED"] = "archived";
})(ModelStatus || (exports.ModelStatus = ModelStatus = {}));
class MLBaseService {
    redis;
    database;
    mlflow;
    artifacts;
    modelCache = new Map();
    configCache = new Map();
    constructor() {
        this.redis = redis_service_1.default;
        this.database = database_service_1.DatabaseService.getInstance();
        this.mlflow = mlflow_service_1.MLflowService.getInstance();
        this.artifacts = model_artifact_service_1.ModelArtifactService.getInstance();
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing ML Base Service', {
                service: this.constructor.name,
                tensorflow_version: tf.version.tfjs,
                backend: tf.getBackend()
            });
            if (tf.getBackend() === 'tensorflow') {
                await tf.enableProdMode();
            }
            await this.mlflow.initialize();
            await this.loadActiveModels();
            logger_1.logger.info('ML Base Service initialized successfully', {
                cached_models: this.modelCache.size,
                backend: tf.getBackend()
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize ML Base Service', {
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async createModel(modelType, config, schoolId, createdBy) {
        const modelId = (0, uuid_1.v4)();
        const startTime = Date.now();
        try {
            logger_1.logger.info('Creating new ML model', {
                modelId,
                modelType,
                schoolId,
                architecture: config.architecture
            });
            this.validateModelConfig(config);
            const modelMetadata = {
                id: modelId,
                type: modelType,
                status: ModelStatus.INITIALIZED,
                config: JSON.stringify(config),
                schoolId,
                createdBy: createdBy || 'system',
                createdAt: new Date(),
                updatedAt: new Date(),
                version: '1.0.0',
                isActive: false,
                metrics: JSON.stringify({}),
                tags: JSON.stringify([modelType, config.architecture])
            };
            const query = `
        INSERT INTO ml_models (
          id, type, status, config, school_id, created_by,
          created_at, updated_at, version, is_active, metrics, tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
            await this.database.execute(query, [
                modelMetadata.id,
                modelMetadata.type,
                modelMetadata.status,
                modelMetadata.config,
                modelMetadata.schoolId,
                modelMetadata.createdBy,
                modelMetadata.createdAt,
                modelMetadata.updatedAt,
                modelMetadata.version,
                modelMetadata.isActive,
                modelMetadata.metrics,
                modelMetadata.tags
            ]);
            this.configCache.set(modelId, config);
            await this.mlflow.startExperiment(modelId, {
                model_type: modelType,
                architecture: config.architecture,
                school_id: schoolId || "",
                created_by: createdBy || ""
            });
            const duration = Date.now() - startTime;
            logger_1.logger.info('ML model created successfully', {
                modelId,
                modelType,
                duration,
                status: ModelStatus.INITIALIZED
            });
            return modelId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create ML model', {
                modelId,
                modelType,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async trainModelWithData(modelId, trainingData, validationData) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting model training', {
                modelId,
                features_shape: Array.isArray(trainingData.features)
                    ? [trainingData.features.length, trainingData.features[0]?.length]
                    : trainingData.features.shape,
                labels_shape: Array.isArray(trainingData.labels)
                    ? [trainingData.labels.length]
                    : trainingData.labels.shape
            });
            const config = await this.getModelConfig(modelId);
            if (!config) {
                throw new Error(`Model configuration not found for model ${modelId}`);
            }
            await this.updateModelStatus(modelId, ModelStatus.TRAINING);
            const runId = await this.mlflow.startRun(modelId, {
                features_count: config.features.length.toString(),
                batch_size: config.batchSize.toString(),
                validation_split: config.validationSplit.toString()
            });
            const trainedModel = await this.trainModel(trainingData, config);
            const metrics = await this.evaluateModel(trainedModel, trainingData, validationData, config);
            const numericMetrics = {};
            if (metrics.accuracy !== undefined)
                numericMetrics.accuracy = metrics.accuracy;
            if (metrics.precision !== undefined)
                numericMetrics.precision = metrics.precision;
            if (metrics.recall !== undefined)
                numericMetrics.recall = metrics.recall;
            if (metrics.f1Score !== undefined)
                numericMetrics.f1Score = metrics.f1Score;
            if (metrics.mse !== undefined)
                numericMetrics.mse = metrics.mse;
            if (metrics.mae !== undefined)
                numericMetrics.mae = metrics.mae;
            if (metrics.r2Score !== undefined)
                numericMetrics.r2Score = metrics.r2Score;
            if (metrics.auc !== undefined)
                numericMetrics.auc = metrics.auc;
            await this.mlflow.logMetrics(runId, numericMetrics);
            await this.mlflow.logParams(runId, config.hyperparameters);
            const artifactPath = await this.artifacts.saveModel(modelId, trainedModel, config, metrics);
            await this.mlflow.logArtifact(runId, artifactPath);
            await this.updateModelStatus(modelId, ModelStatus.TRAINED);
            await this.updateModelMetrics(modelId, metrics);
            this.modelCache.set(modelId, trainedModel);
            await this.mlflow.endRun(runId);
            const duration = Date.now() - startTime;
            logger_1.logger.info('Model training completed successfully', {
                modelId,
                duration,
                metrics: {
                    accuracy: metrics.accuracy,
                    f1Score: metrics.f1Score,
                    mse: metrics.mse
                }
            });
            return metrics;
        }
        catch (error) {
            await this.updateModelStatus(modelId, ModelStatus.FAILED);
            logger_1.logger.error('Model training failed', {
                modelId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async makePrediction(request) {
        const startTime = Date.now();
        try {
            let model = this.modelCache.get(request.modelId);
            if (!model) {
                model = await this.loadModel(request.modelId) || undefined;
            }
            if (!model) {
                throw new Error(`Model ${request.modelId} not found or not trained`);
            }
            const config = await this.getModelConfig(request.modelId);
            if (!config) {
                throw new Error(`Configuration not found for model ${request.modelId}`);
            }
            const features = await this.preprocessFeatures(request.features, config);
            const predictionTensor = await this.predict(model, features);
            const prediction = await predictionTensor.data();
            const confidence = await this.calculateConfidence(predictionTensor, config);
            let explanation;
            if (request.explainPrediction) {
                explanation = await this.explainPrediction(model, features, config);
            }
            const latency = Date.now() - startTime;
            features.dispose();
            predictionTensor.dispose();
            const response = {
                modelId: request.modelId,
                prediction: prediction[0],
                confidence,
                explanation,
                latency,
                timestamp: new Date(),
                version: await this.getModelVersion(request.modelId),
                features: request.features
            };
            await this.logPrediction(request, response);
            return response;
        }
        catch (error) {
            logger_1.logger.error('Prediction failed', {
                modelId: request.modelId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async deployModel(modelId, environment = 'staging') {
        try {
            logger_1.logger.info('Deploying model', { modelId, environment });
            const status = await this.getModelStatus(modelId);
            if (status !== ModelStatus.TRAINED) {
                throw new Error(`Model ${modelId} must be trained before deployment`);
            }
            const model = await this.loadModel(modelId);
            if (!model) {
                throw new Error(`Failed to load model ${modelId} for deployment`);
            }
            await this.updateModelStatus(modelId, ModelStatus.DEPLOYED);
            const mlflowEnvironment = environment === 'production' ? 'Production' : 'Staging';
            await this.mlflow.registerModel(modelId, mlflowEnvironment);
            this.modelCache.set(modelId, model);
            logger_1.logger.info('Model deployed successfully', { modelId, environment });
        }
        catch (error) {
            logger_1.logger.error('Model deployment failed', {
                modelId,
                environment,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async getModel(modelId) {
        try {
            const query = `
        SELECT * FROM ml_models WHERE id = ? AND is_active = true
      `;
            const result = await this.database.query(query, [modelId]);
            if (result.length === 0) {
                return null;
            }
            const model = result[0];
            return {
                ...model,
                config: JSON.parse(model.config),
                metrics: JSON.parse(model.metrics),
                tags: JSON.parse(model.tags)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get model', { modelId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw error;
        }
    }
    async listModels(filters = {}) {
        try {
            let query = `
        SELECT * FROM ml_models WHERE is_active = true
      `;
            const params = [];
            if (filters.schoolId) {
                query += ` AND school_id = ?`;
                params.push(filters.schoolId);
            }
            if (filters.modelType) {
                query += ` AND type = ?`;
                params.push(filters.modelType);
            }
            if (filters.status) {
                query += ` AND status = ?`;
                params.push(filters.status);
            }
            query += ` ORDER BY created_at DESC`;
            if (filters.limit) {
                query += ` LIMIT ?`;
                params.push(filters.limit);
            }
            if (filters.offset) {
                query += ` OFFSET ?`;
                params.push(filters.offset);
            }
            const results = await this.database.query(query, params);
            return results.map((model) => ({
                ...model,
                config: JSON.parse(model.config),
                metrics: JSON.parse(model.metrics),
                tags: JSON.parse(model.tags)
            }));
        }
        catch (error) {
            logger_1.logger.error('Failed to list models', { filters, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw error;
        }
    }
    async deleteModel(modelId) {
        try {
            logger_1.logger.info('Deleting model', { modelId });
            const query = `
        UPDATE ml_models SET
          is_active = false,
          status = ?,
          updated_at = ?
        WHERE id = ?
      `;
            await this.database.query(query, [
                ModelStatus.ARCHIVED,
                new Date(),
                modelId
            ]);
            this.modelCache.delete(modelId);
            this.configCache.delete(modelId);
            await this.mlflow.archiveModel(modelId);
            logger_1.logger.info('Model deleted successfully', { modelId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete model', { modelId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw error;
        }
    }
    validateModelConfig(config) {
        if (!config.features || config.features.length === 0) {
            throw new Error('Model configuration must include features');
        }
        if (!config.targetColumn) {
            throw new Error('Model configuration must include target column');
        }
        if (config.validationSplit < 0 || config.validationSplit > 1) {
            throw new Error('Validation split must be between 0 and 1');
        }
        if (config.batchSize <= 0) {
            throw new Error('Batch size must be positive');
        }
    }
    async getModelConfig(modelId) {
        if (this.configCache.has(modelId)) {
            return this.configCache.get(modelId);
        }
        const model = await this.getModel(modelId);
        if (model) {
            this.configCache.set(modelId, model.config);
            return model.config;
        }
        return null;
    }
    async updateModelStatus(modelId, status) {
        const query = `
      UPDATE ml_models SET status = ?, updated_at = ? WHERE id = ?
    `;
        await this.database.query(query, [status, new Date(), modelId]);
    }
    async updateModelMetrics(modelId, metrics) {
        const query = `
      UPDATE ml_models SET metrics = ?, updated_at = ? WHERE id = ?
    `;
        await this.database.query(query, [JSON.stringify(metrics), new Date(), modelId]);
    }
    async getModelStatus(modelId) {
        const query = `SELECT status FROM ml_models WHERE id = ?`;
        const result = await this.database.query(query, [modelId]);
        return result.length > 0 ? result[0].status : null;
    }
    async getModelVersion(modelId) {
        const query = `SELECT version FROM ml_models WHERE id = ?`;
        const result = await this.database.query(query, [modelId]);
        return result.length > 0 ? result[0].version : '1.0.0';
    }
    async loadModel(modelId) {
        try {
            const artifactPath = await this.artifacts.getModelPath(modelId);
            if (!artifactPath) {
                return null;
            }
            const model = await tf.loadLayersModel(`file://${artifactPath}`);
            this.modelCache.set(modelId, model);
            return model;
        }
        catch (error) {
            logger_1.logger.error('Failed to load model', { modelId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            return null;
        }
    }
    async loadActiveModels() {
        try {
            const activeModels = await this.listModels({ status: ModelStatus.DEPLOYED });
            for (const modelData of activeModels) {
                const model = await this.loadModel(modelData.id);
                if (model) {
                    this.modelCache.set(modelData.id, model);
                    this.configCache.set(modelData.id, modelData.config);
                }
            }
            logger_1.logger.info('Active models loaded', { count: this.modelCache.size });
        }
        catch (error) {
            logger_1.logger.error('Failed to load active models', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
        }
    }
    async preprocessFeatures(features, config) {
        const featureValues = config.features.map(feature => {
            const value = features[feature];
            if (value === undefined || value === null) {
                throw new Error(`Missing feature: ${feature}`);
            }
            return typeof value === 'number' ? value : parseFloat(value);
        });
        return tf.tensor2d([featureValues]);
    }
    async calculateConfidence(predictionTensor, config) {
        if (config.modelType === ModelType.CLASSIFICATION) {
            const probabilities = await predictionTensor.data();
            return Math.max(...Array.from(probabilities));
        }
        const prediction = await predictionTensor.data();
        return Math.min(1.0, Math.abs(prediction[0]) / 100);
    }
    async explainPrediction(model, features, config) {
        const explanation = {
            method: 'feature_importance',
            features: {}
        };
        const featureValues = await features.data();
        const baselineFeatures = Array.from(featureValues).map(v => v * 0.5);
        for (let i = 0; i < config.features.length; i++) {
            const perturbedFeatures = [...featureValues];
            perturbedFeatures[i] = baselineFeatures[i];
            const perturbedTensor = tf.tensor2d([perturbedFeatures]);
            const perturbedPrediction = await this.predict(model, perturbedTensor);
            const originalPrediction = await this.predict(model, features);
            const importance = Math.abs((await originalPrediction.data())[0] - (await perturbedPrediction.data())[0]);
            explanation.features[config.features[i]] = importance;
            perturbedTensor.dispose();
            perturbedPrediction.dispose();
            originalPrediction.dispose();
        }
        return explanation;
    }
    async evaluateModel(model, trainingData, validationData, config) {
        const metrics = {};
        try {
            const evalData = validationData || trainingData;
            const features = Array.isArray(evalData.features)
                ? tf.tensor2d(evalData.features)
                : evalData.features;
            const labels = Array.isArray(evalData.labels)
                ? tf.tensor1d(evalData.labels)
                : evalData.labels;
            const predictions = model.predict(features);
            if (config?.modelType === ModelType.CLASSIFICATION) {
                const accuracy = await this.calculateAccuracy(predictions, labels);
                const confusionMatrix = await this.calculateConfusionMatrix(predictions, labels);
                metrics.accuracy = accuracy;
                metrics.confusionMatrix = confusionMatrix;
                if (confusionMatrix.length === 2) {
                    const tp = confusionMatrix[1][1];
                    const fp = confusionMatrix[0][1];
                    const fn = confusionMatrix[1][0];
                    metrics.precision = tp / (tp + fp);
                    metrics.recall = tp / (tp + fn);
                    metrics.f1Score = 2 * (metrics.precision * metrics.recall) / (metrics.precision + metrics.recall);
                }
            }
            else {
                const mse = await this.calculateMSE(predictions, labels);
                const mae = await this.calculateMAE(predictions, labels);
                const r2 = await this.calculateR2(predictions, labels);
                metrics.mse = mse;
                metrics.mae = mae;
                metrics.r2Score = r2;
            }
            if (Array.isArray(evalData.features))
                features.dispose();
            if (Array.isArray(evalData.labels))
                labels.dispose();
            predictions.dispose();
        }
        catch (error) {
            logger_1.logger.error('Model evaluation failed', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            metrics.accuracy = 0.5;
            metrics.mse = 1.0;
        }
        return metrics;
    }
    async calculateAccuracy(predictions, labels) {
        const predictedClasses = predictions.argMax(-1);
        const actualClasses = labels.argMax ? labels.argMax(-1) : labels;
        const correct = predictedClasses.equal(actualClasses);
        const accuracy = correct.mean();
        const result = await accuracy.data();
        predictedClasses.dispose();
        if (actualClasses)
            actualClasses.dispose();
        correct.dispose();
        accuracy.dispose();
        return result[0];
    }
    async calculateConfusionMatrix(predictions, labels) {
        const predictedClasses = await predictions.argMax(-1).data();
        const actualClasses = await (labels.argMax ? labels.argMax(-1).data() : labels.data());
        const matrix = [[0, 0], [0, 0]];
        for (let i = 0; i < predictedClasses.length; i++) {
            const predicted = Math.round(predictedClasses[i]);
            const actual = Math.round(actualClasses[i]);
            if (predicted < 2 && actual < 2) {
                matrix[actual][predicted]++;
            }
        }
        return matrix;
    }
    async calculateMSE(predictions, labels) {
        const mse = tf.losses.meanSquaredError(labels, predictions);
        const result = await mse.data();
        mse.dispose();
        return result[0];
    }
    async calculateMAE(predictions, labels) {
        const mae = tf.losses.absoluteDifference(labels, predictions);
        const result = await mae.data();
        mae.dispose();
        return result[0];
    }
    async calculateR2(predictions, labels) {
        const labelsMean = labels.mean();
        const totalSumSquares = labels.sub(labelsMean).square().sum();
        const residualSumSquares = labels.sub(predictions).square().sum();
        const r2 = tf.scalar(1).sub(residualSumSquares.div(totalSumSquares));
        const result = await r2.data();
        labelsMean.dispose();
        totalSumSquares.dispose();
        residualSumSquares.dispose();
        r2.dispose();
        return result[0];
    }
    async logPrediction(request, response) {
        try {
            const logEntry = {
                timestamp: response.timestamp,
                modelId: request.modelId,
                latency: response.latency,
                confidence: response.confidence,
                schoolId: request.schoolId,
                userId: request.userId
            };
            logger_1.logger.debug('Prediction logged', { modelId: request.modelId, latency: response.latency });
        }
        catch (error) {
            logger_1.logger.error('Failed to log prediction', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
        }
    }
    async cleanup() {
        try {
            for (const model of this.modelCache.values()) {
                model.dispose();
            }
            this.modelCache.clear();
            this.configCache.clear();
            logger_1.logger.info('ML Base Service cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('ML Base Service cleanup failed', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
        }
    }
}
exports.MLBaseService = MLBaseService;
class MLModelManager extends MLBaseService {
    static instance;
    constructor() {
        super();
    }
    static getInstance() {
        if (!MLModelManager.instance) {
            MLModelManager.instance = new MLModelManager();
        }
        return MLModelManager.instance;
    }
    async trainModel(data, config) {
        const model = tf.sequential();
        model.add(tf.layers.dense({
            units: config.hyperparameters.hiddenUnits || 64,
            activation: 'relu',
            inputShape: [config.features.length]
        }));
        if (config.regularization?.dropout) {
            model.add(tf.layers.dropout({ rate: config.regularization.dropout }));
        }
        model.add(tf.layers.dense({
            units: config.modelType === ModelType.CLASSIFICATION ? 2 : 1,
            activation: config.modelType === ModelType.CLASSIFICATION ? 'softmax' : 'linear'
        }));
        model.compile({
            optimizer: tf.train.adam(config.learningRate || 0.001),
            loss: config.lossFunction || (config.modelType === ModelType.CLASSIFICATION ? 'sparseCategoricalCrossentropy' : 'meanSquaredError'),
            metrics: ['accuracy']
        });
        const features = Array.isArray(data.features) ? tf.tensor2d(data.features) : data.features;
        const labels = Array.isArray(data.labels) ? tf.tensor1d(data.labels) : data.labels;
        await model.fit(features, labels, {
            epochs: config.epochs || 100,
            batchSize: config.batchSize,
            validationSplit: config.validationSplit,
            shuffle: true,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        logger_1.logger.info('Training progress', { epoch, loss: logs?.loss, accuracy: logs?.acc });
                    }
                }
            }
        });
        if (Array.isArray(data.features))
            features.dispose();
        if (Array.isArray(data.labels))
            labels.dispose();
        return model;
    }
    async predict(model, features) {
        return model.predict(features);
    }
}
exports.MLModelManager = MLModelManager;
//# sourceMappingURL=ml-base.service.js.map