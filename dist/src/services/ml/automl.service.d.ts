import type { HyperparameterValue, MetricValue, ArchitectureConfig } from '../../types/ml.types';
export interface AutoMLConfig {
    experimentId: string;
    taskType: 'classification' | 'regression' | 'ranking' | 'forecasting';
    optimizationObjectives: Array<{
        metric: 'accuracy' | 'precision' | 'recall' | 'f1' | 'auc' | 'rmse' | 'mae' | 'latency' | 'fairness' | 'interpretability';
        weight: number;
        direction: 'maximize' | 'minimize';
        constraint?: {
            min?: number;
            max?: number;
        };
    }>;
    searchSpace: {
        algorithms: string[];
        hyperparameters: Record<string, {
            type: 'categorical' | 'numerical' | 'boolean';
            values?: HyperparameterValue[];
            min?: number;
            max?: number;
            step?: number;
        }>;
        architectures?: {
            layers: {
                min: number;
                max: number;
            };
            neurons: {
                min: number;
                max: number;
            };
            activation_functions: string[];
            dropout_rates: {
                min: number;
                max: number;
            };
        };
    };
    constraints: {
        maxTrainingTime: number;
        maxInferenceLatency: number;
        maxModelSize: number;
        minAccuracy: number;
        resourceLimits: {
            cpu: number;
            memory: number;
            gpu?: number;
        };
    };
    evaluationStrategy: {
        validation_method: 'holdout' | 'cross_validation' | 'time_series_split';
        validation_ratio?: number;
        cv_folds?: number;
        evaluation_metrics: string[];
    };
    advancedOptions: {
        early_stopping: boolean;
        ensemble_methods: string[];
        feature_selection: boolean;
        data_augmentation: boolean;
        transfer_learning: boolean;
        neural_architecture_search: boolean;
    };
}
export interface AutoMLExperiment {
    experimentId: string;
    status: 'initializing' | 'running' | 'completed' | 'failed' | 'cancelled';
    startTime: Date;
    endTime?: Date;
    config: AutoMLConfig;
    trials: Array<{
        trialId: string;
        algorithm: string;
        hyperparameters: Record<string, HyperparameterValue>;
        architecture?: ArchitectureConfig;
        performance: Record<string, MetricValue>;
        trainingTime: number;
        status: 'running' | 'completed' | 'failed' | 'pruned';
        artifacts: {
            modelPath?: string;
            logs?: string;
            metrics?: Record<string, MetricValue>;
        };
    }>;
    bestTrial?: {
        trialId: string;
        score: number;
        metrics: Record<string, MetricValue>;
        hyperparameters: Record<string, HyperparameterValue>;
        modelId: string;
    };
    leaderboard: Array<{
        rank: number;
        trialId: string;
        algorithm: string;
        score: number;
        metrics: Record<string, MetricValue>;
        complexity: number;
    }>;
    insights: {
        best_algorithms: string[];
        important_hyperparameters: Array<{
            parameter: string;
            importance: number;
            optimal_range: {
                min: number;
                max: number;
            };
        }>;
        performance_trends: Record<string, number[]>;
        recommendations: string[];
    };
}
export interface ModelOptimizationRequest {
    modelType: string;
    trainingData?: unknown[];
    config: Record<string, unknown>;
    optimization_objectives: string[];
    constraints?: {
        max_training_time?: number;
        max_inference_latency?: number;
        min_accuracy?: number;
        fairness_constraints?: Record<string, number>;
    };
}
export interface OptimizationResult {
    algorithm: string;
    hyperparameters: Record<string, HyperparameterValue>;
    expected_accuracy: number;
}
export interface TrainingConstraints {
    maxTrainingTime?: number;
    maxModelSize?: number;
    resourceLimits?: {
        cpu: number;
        memory: number;
        gpu?: number;
    };
}
export declare class AutoMLService {
    initialize(): Promise<void>;
    trainModel(_request: ModelOptimizationRequest): Promise<string>;
    optimizeConfiguration(_requirements: Record<string, unknown>): Promise<OptimizationResult>;
    performNeuralArchitectureSearch(_taskType: string, _dataShape: number[], _constraints: TrainingConstraints): Promise<string>;
    createEnsemble(_baseModelIds: string[], _ensembleMethod: 'voting' | 'stacking' | 'blending', _validationData?: unknown[]): Promise<string>;
    getExperimentResults(experimentId: string): Promise<AutoMLExperiment>;
}
//# sourceMappingURL=automl.service.d.ts.map