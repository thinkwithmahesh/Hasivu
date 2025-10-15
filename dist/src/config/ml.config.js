"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelConfigs = exports.getMLConfig = exports.defaultMLConfig = void 0;
exports.defaultMLConfig = {
    models: {
        defaultTimeout: 30000,
        maxConcurrentPredictions: 100,
        cacheTTL: 300,
        batchSize: 32,
        enableGPU: false,
        modelStoragePath: '/app/models',
        artifactRetention: 90
    },
    prediction: {
        latencyTarget: 50,
        maxLatency: 200,
        cacheEnabled: true,
        fallbackEnabled: true,
        circuitBreakerThreshold: 5,
        circuitBreakerTimeout: 30000,
        rateLimit: {
            windowMs: 60000,
            maxRequests: 1000
        }
    },
    federatedLearning: {
        enabled: process.env.FEDERATED_LEARNING_ENABLED === 'true',
        minParticipants: 3,
        maxParticipants: 500,
        trustThreshold: 0.7,
        privacyBudget: {
            totalEpsilon: 10.0,
            totalDelta: 1e-5,
            participantEpsilon: 1.0,
            participantDelta: 1e-6
        },
        roundTimeout: 3600000,
        aggregationMethod: 'fedavg',
        byzantineTolerance: 0.33
    },
    featureEngineering: {
        cacheEnabled: true,
        cacheTTL: 300,
        driftDetectionEnabled: true,
        driftThreshold: 0.1,
        qualityMonitoringEnabled: true,
        qualityThreshold: 0.8,
        batchProcessingEnabled: true,
        streamingEnabled: true
    },
    monitoring: {
        enabled: true,
        frequency: 15,
        performanceThresholds: {
            accuracy: 0.85,
            latency: 100,
            errorRate: 0.05,
            driftScore: 0.1
        },
        alerting: {
            enabled: true,
            channels: ['email', 'slack'],
            severityLevels: ['warning', 'critical']
        },
        retraining: {
            autoTrigger: false,
            approvalRequired: true,
            minDataPoints: 1000,
            schedule: '0 2 * * 0'
        }
    },
    automl: {
        enabled: true,
        maxTrials: 50,
        maxTrainingTime: 120,
        resourceLimits: {
            cpu: 4,
            memory: 8192,
            gpu: 1
        },
        algorithms: ['random_forest', 'gradient_boosting', 'neural_network', 'svm'],
        optimizationObjectives: ['accuracy', 'latency', 'fairness'],
        earlyStoppingEnabled: true,
        ensembleEnabled: true
    },
    recommendations: {
        enabled: true,
        algorithms: ['collaborative_filtering', 'content_based', 'hybrid'],
        cacheTTL: 1800,
        diversityWeight: 0.3,
        noveltyWeight: 0.2,
        coldStartStrategy: 'demographic',
        updateFrequency: 24,
        abTestingEnabled: true
    },
    explainability: {
        enabled: true,
        defaultMethod: 'natural_language',
        shapEnabled: true,
        limeEnabled: true,
        naturalLanguageEnabled: true,
        biasDetectionEnabled: true,
        uncertaintyQuantificationEnabled: true,
        counterfactualEnabled: true
    },
    infrastructure: {
        kafka: {
            brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
            groupId: 'hasivu-ml-service',
            retries: 5,
            timeout: 30000
        },
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: 4,
            maxRetriesPerRequest: 3,
            retryDelayOnFailover: 100
        },
        mlflow: {
            trackingUri: process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000',
            experimentName: 'hasivu-predictive-analytics',
            artifactLocation: process.env.MLFLOW_ARTIFACT_ROOT || 's3://hasivu-ml-artifacts'
        },
        tensorflow: {
            backend: 'cpu',
            threads: 4,
            enableProfiling: process.env.NODE_ENV === 'development'
        }
    },
    security: {
        encryptionEnabled: true,
        encryptionAlgorithm: 'AES-256-GCM',
        accessControl: {
            enableRBAC: true,
            defaultPermissions: ['read']
        },
        dataPrivacy: {
            enableDifferentialPrivacy: true,
            enableDataMasking: true,
            retentionPolicy: 730,
            anonymizationEnabled: true
        },
        auditLogging: {
            enabled: true,
            level: 'detailed',
            retention: 365
        }
    },
    performance: {
        caching: {
            enabled: true,
            strategy: 'hybrid',
            maxSize: 512,
            compressionEnabled: true
        },
        batching: {
            enabled: true,
            maxBatchSize: 100,
            batchTimeout: 50
        },
        parallelization: {
            enabled: true,
            maxConcurrency: 10,
            resourceAllocation: 'adaptive'
        },
        optimization: {
            modelQuantization: true,
            tensorOptimization: true,
            memoryOptimization: true
        }
    },
    compliance: {
        regulations: ['GDPR', 'COPPA', 'FERPA', 'CCPA'],
        dataGovernance: {
            dataLineageEnabled: true,
            dataQualityEnabled: true,
            metadataManagement: true
        },
        modelGovernance: {
            versioningEnabled: true,
            approvalWorkflow: true,
            rollbackCapability: true,
            complianceReporting: true
        }
    }
};
const getMLConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    const envConfig = {};
    switch (env) {
        case 'production':
            envConfig.models = {
                ...exports.defaultMLConfig.models,
                enableGPU: true,
                maxConcurrentPredictions: 500
            };
            envConfig.prediction = {
                ...exports.defaultMLConfig.prediction,
                latencyTarget: 30
            };
            envConfig.monitoring = {
                ...exports.defaultMLConfig.monitoring,
                frequency: 5
            };
            break;
        case 'staging':
            envConfig.federatedLearning = {
                ...exports.defaultMLConfig.federatedLearning,
                minParticipants: 2
            };
            break;
        case 'development':
            envConfig.models = {
                ...exports.defaultMLConfig.models,
                cacheTTL: 60
            };
            envConfig.automl = {
                ...exports.defaultMLConfig.automl,
                maxTrials: 10,
                maxTrainingTime: 30
            };
            break;
    }
    return {
        ...exports.defaultMLConfig,
        ...envConfig
    };
};
exports.getMLConfig = getMLConfig;
exports.modelConfigs = {
    student_behavior: {
        architecture: 'neural_network',
        hyperparameters: {
            layers: [128, 64, 32],
            activation: 'relu',
            dropout: 0.2,
            learning_rate: 0.001,
            batch_size: 32,
            epochs: 100
        },
        features: ['age', 'grade', 'dietary_preferences', 'historical_choices', 'health_profile'],
        target: 'meal_choice',
        validation_split: 0.2,
        early_stopping_patience: 10
    },
    demand_forecasting: {
        architecture: 'lstm',
        hyperparameters: {
            lstm_units: 50,
            dense_units: 25,
            dropout: 0.1,
            learning_rate: 0.001,
            batch_size: 64,
            epochs: 150,
            sequence_length: 30
        },
        features: ['historical_demand', 'day_of_week', 'month', 'weather', 'events'],
        target: 'demand',
        validation_split: 0.2,
        early_stopping_patience: 15
    },
    supply_chain: {
        architecture: 'gradient_boosting',
        hyperparameters: {
            n_estimators: 100,
            max_depth: 6,
            learning_rate: 0.1,
            subsample: 0.8,
            colsample_bytree: 0.8
        },
        features: ['vendor_performance', 'delivery_history', 'cost_trends', 'quality_scores'],
        target: 'risk_score',
        validation_split: 0.2
    },
    financial: {
        architecture: 'ensemble',
        hyperparameters: {
            base_estimators: ['random_forest', 'gradient_boosting', 'linear_regression'],
            ensemble_method: 'stacking',
            meta_learner: 'linear_regression'
        },
        features: ['budget_history', 'cost_trends', 'enrollment', 'seasonal_factors'],
        target: 'cost_prediction',
        validation_split: 0.2
    },
    health_outcome: {
        architecture: 'random_forest',
        hyperparameters: {
            n_estimators: 200,
            max_depth: 10,
            min_samples_split: 5,
            min_samples_leaf: 2,
            max_features: 'sqrt'
        },
        features: ['nutrition_intake', 'dietary_patterns', 'health_indicators', 'activity_level'],
        target: 'health_score',
        validation_split: 0.2
    },
    operational_efficiency: {
        architecture: 'neural_network',
        hyperparameters: {
            layers: [64, 32, 16],
            activation: 'relu',
            dropout: 0.3,
            learning_rate: 0.001,
            batch_size: 32,
            epochs: 80
        },
        features: ['kitchen_utilization', 'staff_efficiency', 'equipment_status', 'workflow_metrics'],
        target: 'efficiency_score',
        validation_split: 0.2,
        early_stopping_patience: 8
    }
};
exports.default = exports.getMLConfig;
//# sourceMappingURL=ml.config.js.map