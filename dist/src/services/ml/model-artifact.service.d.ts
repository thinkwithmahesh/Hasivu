export interface ModelArtifactMetadata {
    id: string;
    modelId: string;
    version: string;
    checksum: string;
    fileSize: number;
    storagePath: string;
    storageBackend: string;
    compressionType?: string;
    encryptionEnabled: boolean;
    createdAt: Date;
    createdBy: string;
    tags: string[];
    metrics: any;
    config: any;
    isActive: boolean;
    downloadCount: number;
    lastAccessedAt?: Date;
}
export interface ModelConfig {
    modelType: string;
    architecture: string;
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
export declare enum ExportFormat {
    TENSORFLOW_SAVED_MODEL = "tensorflow_saved_model",
    TENSORFLOW_LITE = "tensorflow_lite",
    ONNX = "onnx",
    TENSORFLOWJS = "tensorflowjs",
    PICKLE = "pickle",
    JOBLIB = "joblib"
}
export declare enum DeploymentTarget {
    PRODUCTION = "production",
    STAGING = "staging",
    DEVELOPMENT = "development",
    EDGE_DEVICE = "edge",
    MOBILE = "mobile",
    WEB_BROWSER = "browser"
}
export declare class ModelArtifactService {
    private static instance;
    private constructor();
    static getInstance(): ModelArtifactService;
    saveModel(modelId: string, model: any, config: ModelConfig, metrics: ModelMetrics, options?: any): Promise<string>;
    loadModel(_modelId: string, _version?: string, _target?: DeploymentTarget): Promise<any>;
    getModelPath(_modelId: string, _version?: string): Promise<string | null>;
    listModelVersions(_modelId: string): Promise<ModelArtifactMetadata[]>;
    exportModel(modelId: string, version: string, format: ExportFormat, target: DeploymentTarget, options?: Record<string, any>): Promise<string>;
    deleteModel(modelId: string, version?: string): Promise<void>;
    getArtifactStats(modelId?: string): Promise<Record<string, any>>;
}
//# sourceMappingURL=model-artifact.service.d.ts.map