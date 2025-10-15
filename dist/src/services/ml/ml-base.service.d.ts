import * as tf from '@tensorflow/tfjs-node';
import { MLflowService } from './mlflow.service';
import { ModelArtifactService } from './model-artifact.service';
export declare enum ModelType {
    STUDENT_BEHAVIOR = "student_behavior",
    DEMAND_FORECASTING = "demand_forecasting",
    SUPPLY_CHAIN_OPTIMIZATION = "supply_chain_optimization",
    VENDOR_PERFORMANCE = "vendor_performance",
    FINANCIAL_FORECASTING = "financial_forecasting",
    HEALTH_NUTRITION = "health_nutrition",
    RECOMMENDATION = "recommendation",
    ANOMALY_DETECTION = "anomaly_detection",
    CLASSIFICATION = "classification",
    REGRESSION = "regression",
    TIME_SERIES = "time_series",
    CLUSTERING = "clustering"
}
export declare enum ModelStatus {
    INITIALIZED = "initialized",
    TRAINING = "training",
    TRAINED = "trained",
    DEPLOYED = "deployed",
    FAILED = "failed",
    DEPRECATED = "deprecated",
    ARCHIVED = "archived"
}
export interface ModelMetrics {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    mse?: number;
    mae?: number;
    r2Score?: number;
    auc?: number;
    confusionMatrix?: number[][];
    featureImportance?: Record<string, number>;
    customMetrics?: Record<string, number>;
}
export interface ModelConfig {
    modelType: ModelType;
    architecture: 'neural_network' | 'random_forest' | 'xgboost' | 'linear_regression' | 'lstm' | 'transformer';
    hyperparameters: Record<string, any>;
    features: string[];
    targetColumn: string;
    validationSplit: number;
    batchSize: number;
    epochs?: number;
    learningRate?: number;
    regularization?: {
        l1?: number;
        l2?: number;
        dropout?: number;
    };
    optimizer?: string;
    lossFunction?: string;
    earlyStoppingPatience?: number;
    crossValidationFolds?: number;
}
export interface TrainingData {
    features: tf.Tensor | number[][];
    labels: tf.Tensor | number[];
    weights?: tf.Tensor | number[];
    metadata?: Record<string, any>;
}
export interface ModelArtifact {
    id: string;
    modelId: string;
    version: string;
    schoolId?: string;
    filePath: string;
    fileSize: number;
    checksum: string;
    metrics: ModelMetrics;
    config: ModelConfig;
    createdAt: Date;
    createdBy: string;
    isActive: boolean;
    tags: string[];
}
export interface PredictionRequest {
    modelId: string;
    features: Record<string, any>;
    schoolId?: string;
    userId?: string;
    context?: Record<string, any>;
    requireConfidence?: boolean;
    explainPrediction?: boolean;
}
export interface PredictionResponse {
    modelId: string;
    prediction: any;
    confidence: number;
    probability?: number[];
    explanation?: Record<string, any>;
    latency: number;
    timestamp: Date;
    version: string;
    features?: Record<string, any>;
}
export declare abstract class MLBaseService {
    protected redis: any;
    protected database: any;
    protected mlflow: MLflowService;
    protected artifacts: ModelArtifactService;
    protected modelCache: Map<string, tf.LayersModel>;
    protected configCache: Map<string, ModelConfig>;
    constructor();
    protected abstract trainModel(data: TrainingData, config: ModelConfig): Promise<tf.LayersModel>;
    protected abstract predict(model: tf.LayersModel, features: tf.Tensor): Promise<tf.Tensor>;
    initialize(): Promise<void>;
    createModel(modelType: ModelType, config: ModelConfig, schoolId?: string, createdBy?: string): Promise<string>;
    trainModelWithData(modelId: string, trainingData: TrainingData, validationData?: TrainingData): Promise<ModelMetrics>;
    makePrediction(request: PredictionRequest): Promise<PredictionResponse>;
    deployModel(modelId: string, environment?: 'staging' | 'production'): Promise<void>;
    getModel(modelId: string): Promise<any>;
    listModels(filters?: {
        schoolId?: string;
        modelType?: ModelType;
        status?: ModelStatus;
        limit?: number;
        offset?: number;
    }): Promise<any[]>;
    deleteModel(modelId: string): Promise<void>;
    protected validateModelConfig(config: ModelConfig): void;
    protected getModelConfig(modelId: string): Promise<ModelConfig | null>;
    protected updateModelStatus(modelId: string, status: ModelStatus): Promise<void>;
    protected updateModelMetrics(modelId: string, metrics: ModelMetrics): Promise<void>;
    protected getModelStatus(modelId: string): Promise<ModelStatus | null>;
    protected getModelVersion(modelId: string): Promise<string>;
    protected loadModel(modelId: string): Promise<tf.LayersModel | null>;
    protected loadActiveModels(): Promise<void>;
    protected preprocessFeatures(features: Record<string, any>, config: ModelConfig): Promise<tf.Tensor>;
    protected calculateConfidence(predictionTensor: tf.Tensor, config: ModelConfig): Promise<number>;
    protected explainPrediction(model: tf.LayersModel, features: tf.Tensor, config: ModelConfig): Promise<Record<string, any>>;
    protected evaluateModel(model: tf.LayersModel, trainingData: TrainingData, validationData?: TrainingData, config?: ModelConfig): Promise<ModelMetrics>;
    protected calculateAccuracy(predictions: tf.Tensor, labels: tf.Tensor): Promise<number>;
    protected calculateConfusionMatrix(predictions: tf.Tensor, labels: tf.Tensor): Promise<number[][]>;
    protected calculateMSE(predictions: tf.Tensor, labels: tf.Tensor): Promise<number>;
    protected calculateMAE(predictions: tf.Tensor, labels: tf.Tensor): Promise<number>;
    protected calculateR2(predictions: tf.Tensor, labels: tf.Tensor): Promise<number>;
    protected logPrediction(request: PredictionRequest, response: PredictionResponse): Promise<void>;
    cleanup(): Promise<void>;
}
export declare class MLModelManager extends MLBaseService {
    private static instance;
    private constructor();
    static getInstance(): MLModelManager;
    protected trainModel(data: TrainingData, config: ModelConfig): Promise<tf.LayersModel>;
    protected predict(model: tf.LayersModel, features: tf.Tensor): Promise<tf.Tensor>;
}
//# sourceMappingURL=ml-base.service.d.ts.map