import type { ModelWeights, MetricValue } from '../../types/ml.types';
export interface FederatedLearningConfig {
    modelType: string;
    participants: string[];
    rounds: number;
    privacyConfig: {
        epsilon: number;
        delta: number;
        noiseMultiplier: number;
    };
    trainingConfig: {
        batchSize: number;
        learningRate: number;
        epochs: number;
    };
    aggregationMethod: 'fedavg' | 'fedprox' | 'scaffold' | 'fedopt';
    byzantineTolerance: number;
}
export interface FederatedLearningRound {
    roundId: string;
    status: 'initializing' | 'training' | 'aggregating' | 'completed' | 'failed';
    participants: string[];
    startTime: Date;
    endTime?: Date;
    config: FederatedLearningConfig;
    metrics: {
        participationRate: number;
        convergenceRate: number;
        privacyBudgetUsed: number;
        modelAccuracy: number;
    };
}
export interface Participant {
    participantId: string;
    schoolId: string;
    status: 'active' | 'inactive' | 'suspended';
    contributionScore: number;
    privacyBudget: {
        epsilon: number;
        delta: number;
    };
    lastActivity: Date;
}
export interface PrivacyMetrics {
    totalPrivacyBudget: number;
    usedPrivacyBudget: number;
    remainingPrivacyBudget: number;
    participantsCount: number;
}
export interface FederationHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeParticipants: number;
    activeRounds: number;
    averageContributionScore: number;
}
export declare class FederatedLearningService {
    private participants;
    private activeRounds;
    constructor();
    initialize(): Promise<void>;
    startFederatedLearning(_config: FederatedLearningConfig): Promise<string>;
    joinFederation(participantId: string, schoolId: string): Promise<void>;
    submitLocalWeights(_roundId: string, _participantId: string, _weights?: ModelWeights, _metrics?: MetricValue): Promise<void>;
    getRoundStatus(roundId: string): Promise<FederatedLearningRound | null>;
    getGlobalModel(_roundId: string): Promise<ModelWeights | null>;
    getPrivacyMetrics(): Promise<PrivacyMetrics>;
    getFederationHealth(): Promise<FederationHealth>;
    leaveFederation(participantId: string): Promise<void>;
}
//# sourceMappingURL=federated-learning.service.d.ts.map