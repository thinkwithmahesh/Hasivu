/**
 * HASIVU ML INFRASTRUCTURE CONFIGURATION
 * Epic 3 → Story 1: ML Platform Configuration
 *
 * Comprehensive configuration for the predictive analytics engine
 * including model settings, infrastructure, and operational parameters.
 */

export interface MLConfig {
  // Core ML Infrastructure
  models: {
    defaultTimeout: number;
    maxConcurrentPredictions: number;
    cacheTTL: number;
    batchSize: number;
    enableGPU: boolean;
    modelStoragePath: string;
    artifactRetention: number; // days
  };

  // Real-time Prediction Service
  prediction: {
    latencyTarget: number; // milliseconds
    maxLatency: number; // milliseconds
    cacheEnabled: boolean;
    fallbackEnabled: boolean;
    circuitBreakerThreshold: number;
    circuitBreakerTimeout: number;
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
  };

  // Federated Learning
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
    roundTimeout: number; // milliseconds
    aggregationMethod: 'fedavg' | 'fedprox' | 'scaffold';
    byzantineTolerance: number;
  };

  // Feature Engineering
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

  // Model Monitoring
  monitoring: {
    enabled: boolean;
    frequency: number; // minutes
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
      schedule: string; // cron expression
    };
  };

  // AutoML
  automl: {
    enabled: boolean;
    maxTrials: number;
    maxTrainingTime: number; // minutes
    resourceLimits: {
      cpu: number;
      memory: number; // MB
      gpu?: number;
    };
    algorithms: string[];
    optimizationObjectives: string[];
    earlyStoppingEnabled: boolean;
    ensembleEnabled: boolean;
  };

  // Recommendation Engine
  recommendations: {
    enabled: boolean;
    algorithms: string[];
    cacheTTL: number;
    diversityWeight: number;
    noveltyWeight: number;
    coldStartStrategy: string;
    updateFrequency: number; // hours
    abTestingEnabled: boolean;
  };

  // Explainability
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

  // Infrastructure
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

  // Security and Privacy
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
      retentionPolicy: number; // days
      anonymizationEnabled: boolean;
    };
    auditLogging: {
      enabled: boolean;
      level: 'basic' | 'detailed' | 'comprehensive';
      retention: number; // days
    };
  };

  // Performance Optimization
  performance: {
    caching: {
      enabled: boolean;
      strategy: 'lru' | 'ttl' | 'hybrid';
      maxSize: number; // MB
      compressionEnabled: boolean;
    };
    batching: {
      enabled: boolean;
      maxBatchSize: number;
      batchTimeout: number; // milliseconds
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

  // Compliance and Governance
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

// Default configuration
export const defaultMLConfig: MLConfig = {
  models: {
    defaultTimeout: 30000, // 30 seconds
    maxConcurrentPredictions: 100,
    cacheTTL: 300, // 5 minutes
    batchSize: 32,
    enableGPU: false,
    modelStoragePath: '/app/models',
    artifactRetention: 90, // 90 days
  },

  prediction: {
    latencyTarget: 50, // 50ms
    maxLatency: 200, // 200ms
    cacheEnabled: true,
    fallbackEnabled: true,
    circuitBreakerThreshold: 5,
    circuitBreakerTimeout: 30000,
    rateLimit: {
      windowMs: 60000, // 1 minute
      maxRequests: 1000,
    },
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
      participantDelta: 1e-6,
    },
    roundTimeout: 3600000, // 1 hour
    aggregationMethod: 'fedavg',
    byzantineTolerance: 0.33,
  },

  featureEngineering: {
    cacheEnabled: true,
    cacheTTL: 300, // 5 minutes
    driftDetectionEnabled: true,
    driftThreshold: 0.1,
    qualityMonitoringEnabled: true,
    qualityThreshold: 0.8,
    batchProcessingEnabled: true,
    streamingEnabled: true,
  },

  monitoring: {
    enabled: true,
    frequency: 15, // 15 minutes
    performanceThresholds: {
      accuracy: 0.85,
      latency: 100, // milliseconds
      errorRate: 0.05,
      driftScore: 0.1,
    },
    alerting: {
      enabled: true,
      channels: ['email', 'slack'],
      severityLevels: ['warning', 'critical'],
    },
    retraining: {
      autoTrigger: false,
      approvalRequired: true,
      minDataPoints: 1000,
      schedule: '0 2 * * 0', // Weekly at 2 AM on Sunday
    },
  },

  automl: {
    enabled: true,
    maxTrials: 50,
    maxTrainingTime: 120, // 2 hours
    resourceLimits: {
      cpu: 4,
      memory: 8192, // 8 GB
      gpu: 1,
    },
    algorithms: ['random_forest', 'gradient_boosting', 'neural_network', 'svm'],
    optimizationObjectives: ['accuracy', 'latency', 'fairness'],
    earlyStoppingEnabled: true,
    ensembleEnabled: true,
  },

  recommendations: {
    enabled: true,
    algorithms: ['collaborative_filtering', 'content_based', 'hybrid'],
    cacheTTL: 1800, // 30 minutes
    diversityWeight: 0.3,
    noveltyWeight: 0.2,
    coldStartStrategy: 'demographic',
    updateFrequency: 24, // 24 hours
    abTestingEnabled: true,
  },

  explainability: {
    enabled: true,
    defaultMethod: 'natural_language',
    shapEnabled: true,
    limeEnabled: true,
    naturalLanguageEnabled: true,
    biasDetectionEnabled: true,
    uncertaintyQuantificationEnabled: true,
    counterfactualEnabled: true,
  },

  infrastructure: {
    kafka: {
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      groupId: 'hasivu-ml-service',
      retries: 5,
      timeout: 30000,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: 4, // Use DB 4 for ML services
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
    },
    mlflow: {
      trackingUri: process.env.MLFLOW_TRACKING_URI || 'http://localhost:5000',
      experimentName: 'hasivu-predictive-analytics',
      artifactLocation: process.env.MLFLOW_ARTIFACT_ROOT || 's3://hasivu-ml-artifacts',
    },
    tensorflow: {
      backend: 'cpu',
      threads: 4,
      enableProfiling: process.env.NODE_ENV === 'development',
    },
  },

  security: {
    encryptionEnabled: true,
    encryptionAlgorithm: 'AES-256-GCM',
    accessControl: {
      enableRBAC: true,
      defaultPermissions: ['read'],
    },
    dataPrivacy: {
      enableDifferentialPrivacy: true,
      enableDataMasking: true,
      retentionPolicy: 730, // 2 years
      anonymizationEnabled: true,
    },
    auditLogging: {
      enabled: true,
      level: 'detailed',
      retention: 365, // 1 year
    },
  },

  performance: {
    caching: {
      enabled: true,
      strategy: 'hybrid',
      maxSize: 512, // 512 MB
      compressionEnabled: true,
    },
    batching: {
      enabled: true,
      maxBatchSize: 100,
      batchTimeout: 50, // 50ms
    },
    parallelization: {
      enabled: true,
      maxConcurrency: 10,
      resourceAllocation: 'adaptive',
    },
    optimization: {
      modelQuantization: true,
      tensorOptimization: true,
      memoryOptimization: true,
    },
  },

  compliance: {
    regulations: ['GDPR', 'COPPA', 'FERPA', 'CCPA'],
    dataGovernance: {
      dataLineageEnabled: true,
      dataQualityEnabled: true,
      metadataManagement: true,
    },
    modelGovernance: {
      versioningEnabled: true,
      approvalWorkflow: true,
      rollbackCapability: true,
      complianceReporting: true,
    },
  },
};

// Environment-specific configurations
export const getMLConfig = (): MLConfig => {
  const env = process.env.NODE_ENV || 'development';

  const envConfig: Partial<MLConfig> = {};

  switch (env) {
    case 'production':
      envConfig.models = {
        ...defaultMLConfig.models,
        enableGPU: true,
        maxConcurrentPredictions: 500,
      };
      envConfig.prediction = {
        ...defaultMLConfig.prediction,
        latencyTarget: 30, // Stricter in production
      };
      envConfig.monitoring = {
        ...defaultMLConfig.monitoring,
        frequency: 5, // More frequent monitoring
      };
      break;

    case 'staging':
      envConfig.federatedLearning = {
        ...defaultMLConfig.federatedLearning,
        minParticipants: 2, // Lower threshold for testing
      };
      break;

    case 'development':
      envConfig.models = {
        ...defaultMLConfig.models,
        cacheTTL: 60, // Shorter cache for development
      };
      envConfig.automl = {
        ...defaultMLConfig.automl,
        maxTrials: 10, // Fewer trials for development
        maxTrainingTime: 30,
      };
      break;
  }

  return {
    ...defaultMLConfig,
    ...envConfig,
  };
};

// Model-specific configurations
export const modelConfigs = {
  student_behavior: {
    architecture: 'neural_network',
    hyperparameters: {
      layers: [128, 64, 32],
      activation: 'relu',
      dropout: 0.2,
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 100,
    },
    features: ['age', 'grade', 'dietary_preferences', 'historical_choices', 'health_profile'],
    target: 'meal_choice',
    validation_split: 0.2,
    early_stopping_patience: 10,
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
      sequence_length: 30,
    },
    features: ['historical_demand', 'day_of_week', 'month', 'weather', 'events'],
    target: 'demand',
    validation_split: 0.2,
    early_stopping_patience: 15,
  },

  supply_chain: {
    architecture: 'gradient_boosting',
    hyperparameters: {
      n_estimators: 100,
      max_depth: 6,
      learning_rate: 0.1,
      subsample: 0.8,
      colsample_bytree: 0.8,
    },
    features: ['vendor_performance', 'delivery_history', 'cost_trends', 'quality_scores'],
    target: 'risk_score',
    validation_split: 0.2,
  },

  financial: {
    architecture: 'ensemble',
    hyperparameters: {
      base_estimators: ['random_forest', 'gradient_boosting', 'linear_regression'],
      ensemble_method: 'stacking',
      meta_learner: 'linear_regression',
    },
    features: ['budget_history', 'cost_trends', 'enrollment', 'seasonal_factors'],
    target: 'cost_prediction',
    validation_split: 0.2,
  },

  health_outcome: {
    architecture: 'random_forest',
    hyperparameters: {
      n_estimators: 200,
      max_depth: 10,
      min_samples_split: 5,
      min_samples_leaf: 2,
      max_features: 'sqrt',
    },
    features: ['nutrition_intake', 'dietary_patterns', 'health_indicators', 'activity_level'],
    target: 'health_score',
    validation_split: 0.2,
  },

  operational_efficiency: {
    architecture: 'neural_network',
    hyperparameters: {
      layers: [64, 32, 16],
      activation: 'relu',
      dropout: 0.3,
      learning_rate: 0.001,
      batch_size: 32,
      epochs: 80,
    },
    features: ['kitchen_utilization', 'staff_efficiency', 'equipment_status', 'workflow_metrics'],
    target: 'efficiency_score',
    validation_split: 0.2,
    early_stopping_patience: 8,
  },
};

export default getMLConfig;
