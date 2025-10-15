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
exports.MLflowService = void 0;
const logger_1 = require("../../utils/logger");
const redis_service_1 = __importDefault(require("../redis.service"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class MLflowService {
    static instance;
    config;
    client;
    redis;
    initialized = false;
    constructor() {
        this.redis = redis_service_1.default;
        this.initializeConfig();
        this.initializeClient();
    }
    static getInstance() {
        if (!MLflowService.instance) {
            MLflowService.instance = new MLflowService();
        }
        return MLflowService.instance;
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing MLflow service', {
                tracking_uri: this.config.trackingUri,
                experiment_name: this.config.experimentName
            });
            await this.testConnection();
            await this.ensureDefaultExperiment();
            this.initialized = true;
            logger_1.logger.info('MLflow service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize MLflow service', {
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                stack: (error instanceof Error ? error.stack : undefined)
            });
            throw error;
        }
    }
    async createExperiment(name, tags = {}) {
        try {
            const existingExperiment = await this.getExperimentByName(name);
            if (existingExperiment) {
                return existingExperiment.experimentId;
            }
            const response = await this.client.post('/api/2.0/mlflow/experiments/create', {
                name,
                artifact_location: `${this.config.defaultArtifactRoot}/${name}`,
                tags: Object.entries(tags).map(([key, value]) => ({ key, value }))
            });
            const experimentId = response.data.experiment_id;
            logger_1.logger.info('MLflow experiment created', { name, experimentId });
            return experimentId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create MLflow experiment', {
                name,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async startExperiment(modelId, tags = {}) {
        try {
            const experimentName = `hasivu-model-${modelId}`;
            const experimentId = await this.createExperiment(experimentName, {
                model_id: modelId,
                platform: 'hasivu',
                ...tags
            });
            logger_1.logger.info('MLflow experiment started', { modelId, experimentId, experimentName });
            return experimentId;
        }
        catch (error) {
            logger_1.logger.error('Failed to start MLflow experiment', {
                modelId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async startRun(experimentId, tags = {}, runName) {
        try {
            const response = await this.client.post('/api/2.0/mlflow/runs/create', {
                experiment_id: experimentId,
                start_time: Date.now(),
                tags: Object.entries(tags).map(([key, value]) => ({ key, value })),
                run_name: runName || `run-${(0, uuid_1.v4)()}`
            });
            const runId = response.data.run.info.run_id;
            await this.redis.setex(`mlflow:run:${runId}`, 3600, JSON.stringify({
                runId,
                experimentId,
                startTime: Date.now(),
                status: 'RUNNING'
            }));
            logger_1.logger.info('MLflow run started', { runId, experimentId });
            return runId;
        }
        catch (error) {
            logger_1.logger.error('Failed to start MLflow run', {
                experimentId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async logMetrics(runId, metrics, step) {
        try {
            const metricData = Object.entries(metrics).map(([key, value]) => ({
                key,
                value,
                timestamp: Date.now(),
                step: step || 0
            }));
            await this.client.post('/api/2.0/mlflow/runs/log-batch', {
                run_id: runId,
                metrics: metricData
            });
            for (const [key, value] of Object.entries(metrics)) {
                await this.redis.hset(`mlflow:metrics:${runId}`, key, value.toString());
            }
            logger_1.logger.debug('MLflow metrics logged', { runId, metrics: Object.keys(metrics) });
        }
        catch (error) {
            logger_1.logger.error('Failed to log MLflow metrics', {
                runId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async logParams(runId, params) {
        try {
            const paramData = Object.entries(params).map(([key, value]) => ({
                key,
                value: String(value)
            }));
            await this.client.post('/api/2.0/mlflow/runs/log-batch', {
                run_id: runId,
                params: paramData
            });
            for (const [key, value] of Object.entries(params)) {
                await this.redis.hset(`mlflow:params:${runId}`, key, String(value));
            }
            logger_1.logger.debug('MLflow parameters logged', { runId, params: Object.keys(params) });
        }
        catch (error) {
            logger_1.logger.error('Failed to log MLflow parameters', {
                runId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async logTags(runId, tags) {
        try {
            const tagData = Object.entries(tags).map(([key, value]) => ({
                key,
                value
            }));
            await this.client.post('/api/2.0/mlflow/runs/set-tag', {
                run_id: runId,
                tags: tagData
            });
            logger_1.logger.debug('MLflow tags logged', { runId, tags: Object.keys(tags) });
        }
        catch (error) {
            logger_1.logger.error('Failed to log MLflow tags', {
                runId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async logArtifact(runId, filePath, artifactPath) {
        try {
            if (!fs.existsSync(filePath)) {
                throw new Error(`Artifact file not found: ${filePath}`);
            }
            const fileName = path.basename(filePath);
            const finalArtifactPath = artifactPath || fileName;
            const artifactUri = await this.getRunArtifactUri(runId);
            const destinationPath = path.join(artifactUri, finalArtifactPath);
            const destinationDir = path.dirname(destinationPath);
            if (!fs.existsSync(destinationDir)) {
                fs.mkdirSync(destinationDir, { recursive: true });
            }
            fs.copyFileSync(filePath, destinationPath);
            logger_1.logger.info('MLflow artifact logged', {
                runId,
                filePath,
                artifactPath: finalArtifactPath
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log MLflow artifact', {
                runId,
                filePath,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async endRun(runId, status = 'FINISHED') {
        try {
            await this.client.post('/api/2.0/mlflow/runs/update', {
                run_id: runId,
                status,
                end_time: Date.now()
            });
            const cachedRun = await this.redis.get(`mlflow:run:${runId}`);
            if (cachedRun) {
                const runInfo = JSON.parse(cachedRun);
                runInfo.status = status;
                runInfo.endTime = Date.now();
                await this.redis.setex(`mlflow:run:${runId}`, 3600, JSON.stringify(runInfo));
            }
            logger_1.logger.info('MLflow run ended', { runId, status });
        }
        catch (error) {
            logger_1.logger.error('Failed to end MLflow run', {
                runId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async registerModel(modelId, stage = 'Staging', description) {
        try {
            const modelName = `hasivu-model-${modelId}`;
            try {
                await this.client.post('/api/2.0/mlflow/registered-models/create', {
                    name: modelName,
                    description: description || `HASIVU ML Model ${modelId}`
                });
            }
            catch (error) {
                const isAxiosError = error && typeof error === 'object' && 'response' in error;
                if (!isAxiosError || !error.response?.data?.error_code?.includes('RESOURCE_ALREADY_EXISTS')) {
                    throw error;
                }
            }
            const response = await this.client.post('/api/2.0/mlflow/model-versions/create', {
                name: modelName,
                source: `models:/${modelName}/latest`,
                description
            });
            const modelVersion = response.data.model_version;
            await this.transitionModelStage(modelName, modelVersion.version, stage);
            logger_1.logger.info('MLflow model registered', {
                modelId,
                modelName,
                version: modelVersion.version,
                stage
            });
            return modelVersion;
        }
        catch (error) {
            logger_1.logger.error('Failed to register MLflow model', {
                modelId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async transitionModelStage(modelName, version, stage) {
        try {
            await this.client.post('/api/2.0/mlflow/model-versions/transition-stage', {
                name: modelName,
                version,
                stage,
                archive_existing_versions: stage === 'Production'
            });
            logger_1.logger.info('MLflow model stage transitioned', { modelName, version, stage });
        }
        catch (error) {
            logger_1.logger.error('Failed to transition MLflow model stage', {
                modelName,
                version,
                stage,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async getModelVersions(modelName) {
        try {
            const response = await this.client.get('/api/2.0/mlflow/registered-models/get', {
                params: { name: modelName }
            });
            return response.data.registered_model.latest_versions || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get MLflow model versions', {
                modelName,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return [];
        }
    }
    async archiveModel(modelId) {
        try {
            const modelName = `hasivu-model-${modelId}`;
            const versions = await this.getModelVersions(modelName);
            for (const version of versions) {
                if (version.currentStage !== 'Archived') {
                    await this.transitionModelStage(modelName, version.version, 'Archived');
                }
            }
            logger_1.logger.info('MLflow model archived', { modelId, modelName });
        }
        catch (error) {
            logger_1.logger.error('Failed to archive MLflow model', {
                modelId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    async getExperimentByName(name) {
        try {
            const response = await this.client.get('/api/2.0/mlflow/experiments/get-by-name', {
                params: { experiment_name: name }
            });
            return response.data.experiment;
        }
        catch (error) {
            const isAxiosError = error && typeof error === 'object' && 'response' in error;
            if (isAxiosError && error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }
    async getRun(runId) {
        try {
            const cachedRun = await this.redis.get(`mlflow:run:${runId}`);
            if (cachedRun) {
                return JSON.parse(cachedRun);
            }
            const response = await this.client.get('/api/2.0/mlflow/runs/get', {
                params: { run_id: runId }
            });
            const run = response.data.run;
            await this.redis.setex(`mlflow:run:${runId}`, 3600, JSON.stringify(run));
            return run;
        }
        catch (error) {
            logger_1.logger.error('Failed to get MLflow run', { runId, error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            return null;
        }
    }
    async searchRuns(experimentIds, filter, orderBy, maxResults) {
        try {
            const response = await this.client.post('/api/2.0/mlflow/runs/search', {
                experiment_ids: experimentIds,
                filter,
                order_by: orderBy,
                max_results: maxResults || 100
            });
            return response.data.runs || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to search MLflow runs', {
                experimentIds,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return [];
        }
    }
    async getRunMetrics(runId) {
        try {
            const cachedMetrics = await this.redis.hgetall(`mlflow:metrics:${runId}`);
            if (Object.keys(cachedMetrics).length > 0) {
                const metrics = {};
                for (const [key, value] of Object.entries(cachedMetrics)) {
                    metrics[key] = parseFloat(String(value));
                }
                return metrics;
            }
            const run = await this.getRun(runId);
            return run?.data.metrics || {};
        }
        catch (error) {
            logger_1.logger.error('Failed to get MLflow run metrics', {
                runId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return {};
        }
    }
    async getRunParams(runId) {
        try {
            const cachedParams = await this.redis.hgetall(`mlflow:params:${runId}`);
            if (Object.keys(cachedParams).length > 0) {
                return cachedParams;
            }
            const run = await this.getRun(runId);
            return run?.data.params || {};
        }
        catch (error) {
            logger_1.logger.error('Failed to get MLflow run parameters', {
                runId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return {};
        }
    }
    async deleteExperiment(experimentId) {
        try {
            await this.client.post('/api/2.0/mlflow/experiments/delete', {
                experiment_id: experimentId
            });
            logger_1.logger.info('MLflow experiment deleted', { experimentId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete MLflow experiment', {
                experimentId,
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            throw error;
        }
    }
    initializeConfig() {
        this.config = {
            trackingUri: process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000',
            registryUri: process.env.MLFLOW_REGISTRY_URI,
            username: process.env.MLFLOW_USERNAME,
            password: process.env.MLFLOW_PASSWORD,
            token: process.env.MLFLOW_TOKEN,
            s3Endpoint: process.env.MLFLOW_S3_ENDPOINT_URL,
            s3AccessKey: process.env.AWS_ACCESS_KEY_ID,
            s3SecretKey: process.env.AWS_SECRET_ACCESS_KEY,
            defaultArtifactRoot: process.env.MLFLOW_DEFAULT_ARTIFACT_ROOT || './mlruns',
            experimentName: process.env.MLFLOW_EXPERIMENT_NAME || 'hasivu-ml-experiments'
        };
    }
    initializeClient() {
        this.client = axios_1.default.create({
            baseURL: this.config.trackingUri,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (this.config.token) {
            this.client.defaults.headers.common['Authorization'] = `Bearer ${this.config.token}`;
        }
        else if (this.config.username && this.config.password) {
            this.client.defaults.auth = {
                username: this.config.username,
                password: this.config.password
            };
        }
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug('MLflow API request', {
                method: config.method,
                url: config.url,
                params: config.params
            });
            return config;
        }, (error) => {
            logger_1.logger.error('MLflow API request error', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug('MLflow API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('MLflow API response error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.response?.data?.message || (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))
            });
            return Promise.reject(error);
        });
    }
    async testConnection() {
        try {
            await this.client.get('/api/2.0/mlflow/experiments/list');
            logger_1.logger.info('MLflow connection test successful');
        }
        catch (error) {
            logger_1.logger.error('MLflow connection test failed', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw new Error('Cannot connect to MLflow tracking server');
        }
    }
    async ensureDefaultExperiment() {
        try {
            const experiment = await this.getExperimentByName(this.config.experimentName);
            if (!experiment) {
                await this.createExperiment(this.config.experimentName, {
                    platform: 'hasivu',
                    created_by: 'system',
                    environment: process.env.NODE_ENV || 'development'
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to ensure default experiment', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            throw error;
        }
    }
    async getRunArtifactUri(runId) {
        const run = await this.getRun(runId);
        if (!run) {
            throw new Error(`Run ${runId} not found`);
        }
        const artifactUri = run.artifactUri || `${this.config.defaultArtifactRoot}/${runId}/artifacts`;
        if (artifactUri.startsWith('file://')) {
            return artifactUri.replace('file://', '');
        }
        return artifactUri;
    }
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.testConnection();
            const latency = Date.now() - startTime;
            return {
                status: 'healthy',
                details: {
                    tracking_uri: this.config.trackingUri,
                    latency,
                    initialized: this.initialized
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                details: {
                    error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                    tracking_uri: this.config.trackingUri,
                    initialized: this.initialized
                }
            };
        }
    }
    async getStats() {
        try {
            const experiments = await this.client.get('/api/2.0/mlflow/experiments/list');
            const experimentCount = experiments.data.experiments?.length || 0;
            let totalRuns = 0;
            if (experimentCount > 0) {
                const recentExperiments = experiments.data.experiments.slice(0, 5);
                for (const exp of recentExperiments) {
                    const runs = await this.searchRuns([exp.experiment_id]);
                    totalRuns += runs.length;
                }
            }
            return {
                experiment_count: experimentCount,
                total_runs: totalRuns,
                tracking_uri: this.config.trackingUri,
                artifact_root: this.config.defaultArtifactRoot,
                cache_size: {
                    runs: await this.redis.keys('mlflow:run:*').then((keys) => keys.length),
                    metrics: await this.redis.keys('mlflow:metrics:*').then((keys) => keys.length),
                    params: await this.redis.keys('mlflow:params:*').then((keys) => keys.length)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get MLflow stats', { error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) });
            return {
                error: (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)),
                tracking_uri: this.config.trackingUri
            };
        }
    }
}
exports.MLflowService = MLflowService;
//# sourceMappingURL=mlflow.service.js.map