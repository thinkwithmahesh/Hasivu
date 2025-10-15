/**
 * Machine Learning Types
 * Common type definitions for ML services
 */

// Core ML Types
export type HyperparameterValue = string | number | boolean;
export type MetricValue = number;
export type ArchitectureConfig = Record<string, unknown>;
export type ModelWeights = Record<string, number[] | number[][]>;
export type PredictionValue = number | string | number[];

// Participant Type (for federated learning)
export interface Participant {
  participantId: string;
  deviceId: string;
  dataSize: number;
  status: 'active' | 'inactive' | 'training' | 'uploading';
  lastSeen: Date;
  contributionScore: number;
}
