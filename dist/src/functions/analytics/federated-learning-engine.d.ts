interface FederatedLearningNode {
    nodeId: string;
    schoolId: string;
    nodeType: 'participant' | 'aggregator' | 'coordinator';
    capabilities: {
        computeCapacity: number;
        dataVolume: number;
        privacyLevel: 'basic' | 'enhanced' | 'maximum';
        networkBandwidth: number;
    };
    lastActive: Date;
    modelVersion: number;
    trustScore: number;
}
interface FederatedModel {
    modelId: string;
    modelType: 'nutrition_optimization' | 'demand_forecasting' | 'quality_prediction' | 'cost_optimization';
    architecture: {
        inputDimensions: number;
        hiddenLayers: number[];
        outputDimensions: number;
        activationFunction: string;
        optimizer: string;
    };
    globalWeights: number[][];
    version: number;
    trainingRounds: number;
    convergenceStatus: 'training' | 'converged' | 'diverging';
    performanceMetrics: {
        accuracy: number;
        loss: number;
        f1Score: number;
        privacyBudgetUsed: number;
    };
    privacyConfig: {
        epsilon: number;
        delta: number;
        clippingNorm: number;
        noiseMultiplier: number;
    };
}
interface SecureMultiPartyComputation {
    computationId: string;
    computationType: 'aggregate_statistics' | 'correlation_analysis' | 'performance_ranking' | 'trend_detection';
    participants: string[];
    inputSchema: Record<string, string>;
    cryptographicProtocol: 'shamir_secret_sharing' | 'homomorphic_encryption' | 'garbled_circuits';
    privacyPreservingTechniques: string[];
    results: {
        computedValues: Record<string, number>;
        confidenceIntervals: Record<string, [number, number]>;
        privacyGuarantees: {
            differentialPrivacyApplied: boolean;
            epsilonBudget: number;
            deltaBudget: number;
        };
        participantContributions: Record<string, number>;
    };
    auditTrail: Array<{
        timestamp: Date;
        action: string;
        participant?: string;
        privacyImpact: number;
        complianceCheck: boolean;
    }>;
}
interface PrivacyPreservingAnalytics {
    analysisId: string;
    analysisType: string;
    participatingSchools: number;
    privacyTechniques: string[];
    insights: {
        industryBenchmarks: Record<string, {
            value: number;
            confidence: number;
            privacyBudgetUsed: number;
        }>;
        trends: Array<{
            trendName: string;
            strength: number;
            confidence: number;
            anonymizedEvidence: string;
        }>;
        recommendations: Array<{
            recommendation: string;
            evidenceStrength: number;
            applicabilityScore: number;
            privacyImpact: 'none' | 'minimal' | 'moderate';
        }>;
    };
    privacyCompliance: {
        coppaCompliant: boolean;
        gdprCompliant: boolean;
        differentialPrivacyLevel: number;
        dataAnonymizationScore: number;
        auditReadiness: number;
    };
}
declare class FederatedLearningEngine {
    private database;
    private logger;
    private nodes;
    private models;
    private activeComputations;
    constructor();
    initializeFederatedNetwork(schools: any[] | undefined): Promise<void>;
    private assessNodeCapabilities;
    createFederatedModel(modelType: FederatedModel['modelType'], privacyConfig: FederatedModel['privacyConfig']): Promise<string>;
    private initializeModelWeights;
    startTrainingRound(modelId: string, participantSelection: 'random' | 'capability_based' | 'all', participantRatio?: number): Promise<string>;
    private selectParticipants;
    private simulateLocalTraining;
    private generateDPNoise;
    private encryptGradients;
    private generateComputationProof;
    private performSecureAggregation;
    private verifyComputationProof;
    private decryptGradients;
    private performWeightedAveraging;
    private addGlobalDPNoise;
    private calculateConvergenceMetric;
    private calculatePrivacyComposition;
    private calculateConsistencyCheck;
    private checkConvergence;
    performSecureComputation(computationType: SecureMultiPartyComputation['computationType'], participantIds: string[], inputData: Record<string, any>[]): Promise<SecureMultiPartyComputation>;
    private generateInputSchema;
    private computeAggregateStatistics;
    private computeCorrelationAnalysis;
    private calculateCorrelation;
    private computePerformanceRanking;
    private computeTrendDetection;
    private detectTrend;
    getNetworkStatus(): {
        totalNodes: number;
        activeNodes: number;
        activeModels: number;
        activeComputations: number;
        networkHealth: number;
    };
    generatePrivacyComplianceReport(): {
        overallCompliance: number;
        gdprCompliance: boolean;
        coppaCompliance: boolean;
        privacyTechniques: string[];
        auditReadiness: number;
    };
}
export declare const federatedLearningEngine: FederatedLearningEngine;
export { FederatedLearningEngine };
export type { FederatedModel, FederatedLearningNode, SecureMultiPartyComputation, PrivacyPreservingAnalytics, };
//# sourceMappingURL=federated-learning-engine.d.ts.map