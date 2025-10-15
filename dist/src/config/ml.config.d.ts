export interface MLConfig {
    models: {
        defaultTimeout: number;
        maxConcurrentPredictions: number;
        cacheTTL: number;
        batchSize: number;
        enableGPU: boolean;
        modelStoragePath: string;
        artifactRetention: number;
    };
    prediction: {
        latencyTarget: number;
        maxLatency: number;
        cacheEnabled: boolean;
        fallbackEnabled: boolean;
        circuitBreakerThreshold: number;
        circuitBreakerTimeout: number;
        rateLimit: {
            windowMs: number;
            maxRequests: number;
        };
    };
    federatedLearning: {
        enabled: boolean;
        minParticipants: number;
        maxParticipants: number;
        trustThreshold: number;
        privacyBudget: {
            totalEpsilon: number;
            totalDelta: number;
            participantEpsilon: number;
            participantDelta: number;
        };
        roundTimeout: number;
        aggregationMethod: 'fedavg' | 'fedprox' | 'scaffold';
        byzantineTolerance: number;
    };
    featureEngineering: {
        cacheEnabled: boolean;
        cacheTTL: number;
        driftDetectionEnabled: boolean;
        driftThreshold: number;
        qualityMonitoringEnabled: boolean;
        qualityThreshold: number;
        batchProcessingEnabled: boolean;
        streamingEnabled: boolean;
    };
    monitoring: {
        enabled: boolean;
        frequency: number;
        performanceThresholds: {
            accuracy: number;
            latency: number;
            errorRate: number;
            driftScore: number;
        };
        alerting: {
            enabled: boolean;
            channels: string[];
            severityLevels: string[];
        };
        retraining: {
            autoTrigger: boolean;
            approvalRequired: boolean;
            minDataPoints: number;
            schedule: string;
        };
    };
    automl: {
        enabled: boolean;
        maxTrials: number;
        maxTrainingTime: number;
        resourceLimits: {
            cpu: number;
            memory: number;
            gpu?: number;
        };
        algorithms: string[];
        optimizationObjectives: string[];
        earlyStoppingEnabled: boolean;
        ensembleEnabled: boolean;
    };
    recommendations: {
        enabled: boolean;
        algorithms: string[];
        cacheTTL: number;
        diversityWeight: number;
        noveltyWeight: number;
        coldStartStrategy: string;
        updateFrequency: number;
        abTestingEnabled: boolean;
    };
    explainability: {
        enabled: boolean;
        defaultMethod: 'shap' | 'lime' | 'natural_language';
        shapEnabled: boolean;
        limeEnabled: boolean;
        naturalLanguageEnabled: boolean;
        biasDetectionEnabled: boolean;
        uncertaintyQuantificationEnabled: boolean;
        counterfactualEnabled: boolean;
    };
    infrastructure: {
        kafka: {
            brokers: string[];
            groupId: string;
            retries: number;
            timeout: number;
        };
        redis: {
            host: string;
            port: number;
            password?: string;
            db: number;
            maxRetriesPerRequest: number;
            retryDelayOnFailover: number;
        };
        mlflow: {
            trackingUri: string;
            experimentName: string;
            artifactLocation: string;
        };
        tensorflow: {
            backend: 'cpu' | 'gpu';
            threads: number;
            enableProfiling: boolean;
        };
    };
    security: {
        encryptionEnabled: boolean;
        encryptionAlgorithm: string;
        accessControl: {
            enableRBAC: boolean;
            defaultPermissions: string[];
        };
        dataPrivacy: {
            enableDifferentialPrivacy: boolean;
            enableDataMasking: boolean;
            retentionPolicy: number;
            anonymizationEnabled: boolean;
        };
        auditLogging: {
            enabled: boolean;
            level: 'basic' | 'detailed' | 'comprehensive';
            retention: number;
        };
    };
    performance: {
        caching: {
            enabled: boolean;
            strategy: 'lru' | 'ttl' | 'hybrid';
            maxSize: number;
            compressionEnabled: boolean;
        };
        batching: {
            enabled: boolean;
            maxBatchSize: number;
            batchTimeout: number;
        };
        parallelization: {
            enabled: boolean;
            maxConcurrency: number;
            resourceAllocation: 'uniform' | 'adaptive';
        };
        optimization: {
            modelQuantization: boolean;
            tensorOptimization: boolean;
            memoryOptimization: boolean;
        };
    };
    compliance: {
        regulations: string[];
        dataGovernance: {
            dataLineageEnabled: boolean;
            dataQualityEnabled: boolean;
            metadataManagement: boolean;
        };
        modelGovernance: {
            versioningEnabled: boolean;
            approvalWorkflow: boolean;
            rollbackCapability: boolean;
            complianceReporting: boolean;
        };
    };
}
export declare const defaultMLConfig: MLConfig;
export declare const getMLConfig: () => MLConfig;
export declare const modelConfigs: {
    student_behavior: {
        architecture: string;
        hyperparameters: {
            layers: number[];
            activation: string;
            dropout: number;
            learning_rate: number;
            batch_size: number;
            epochs: number;
        };
        features: string[];
        target: string;
        validation_split: number;
        early_stopping_patience: number;
    };
    demand_forecasting: {
        architecture: string;
        hyperparameters: {
            lstm_units: number;
            dense_units: number;
            dropout: number;
            learning_rate: number;
            batch_size: number;
            epochs: number;
            sequence_length: number;
        };
        features: string[];
        target: string;
        validation_split: number;
        early_stopping_patience: number;
    };
    supply_chain: {
        architecture: string;
        hyperparameters: {
            n_estimators: number;
            max_depth: number;
            learning_rate: number;
            subsample: number;
            colsample_bytree: number;
        };
        features: string[];
        target: string;
        validation_split: number;
    };
    financial: {
        architecture: string;
        hyperparameters: {
            base_estimators: string[];
            ensemble_method: string;
            meta_learner: string;
        };
        features: string[];
        target: string;
        validation_split: number;
    };
    health_outcome: {
        architecture: string;
        hyperparameters: {
            n_estimators: number;
            max_depth: number;
            min_samples_split: number;
            min_samples_leaf: number;
            max_features: string;
        };
        features: string[];
        target: string;
        validation_split: number;
    };
    operational_efficiency: {
        architecture: string;
        hyperparameters: {
            layers: number[];
            activation: string;
            dropout: number;
            learning_rate: number;
            batch_size: number;
            epochs: number;
        };
        features: string[];
        target: string;
        validation_split: number;
        early_stopping_patience: number;
    };
};
export default getMLConfig;
//# sourceMappingURL=ml.config.d.ts.map