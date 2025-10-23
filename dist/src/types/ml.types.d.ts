export type HyperparameterValue = string | number | boolean;
export type MetricValue = number;
export type ArchitectureConfig = Record<string, unknown>;
export type ModelWeights = Record<string, number[] | number[][]>;
export type PredictionValue = number | string | number[];
export interface Participant {
    participantId: string;
    deviceId: string;
    dataSize: number;
    status: 'active' | 'inactive' | 'training' | 'uploading';
    lastSeen: Date;
    contributionScore: number;
}
//# sourceMappingURL=ml.types.d.ts.map