/// <reference types="node" />
/// <reference types="node" />
import { CompressionStrategy, CompressionConfig } from '../../types/storage-types';
export declare class CompressionManager {
    private config;
    private strategies;
    private compressionStats;
    private adaptiveThreshold;
    constructor(config: CompressionConfig);
    initialize(): Promise<void>;
    compressData(data: any, strategy?: CompressionStrategy): Promise<CompressedData>;
    decompressData(compressedData: CompressedData): Promise<any>;
    analyzeCompressionCandidates(): Promise<CompressionRecommendation[]>;
    getCompressionStatistics(): Promise<any>;
    getHealth(): Promise<any>;
    shutdown(): Promise<void>;
    getStatistics(): Promise<any>;
    getHealthStatus(): Promise<any>;
    private setupCompressionStrategies;
    private selectOptimalStrategy;
    private performCompression;
    private performDecompression;
    private getAlgorithmCompressionRatio;
    private calculateDataSize;
    private updateCompressionStats;
    private loadCompressionProfiles;
    private startCompressionMonitoring;
    private monitorCompressionEffectiveness;
}
interface CompressedData {
    id: string;
    compressedData: Buffer;
    metadata: {
        algorithm: string;
        originalSize: number;
        compressedSize: number;
        compressionRatio: number;
        compressionTime: number;
        timestamp: Date;
    };
}
interface CompressionRecommendation {
    datasetId: string;
    currentSize: number;
    estimatedCompressedSize: number;
    estimatedSavings: number;
    recommendedAlgorithm: string;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}
export default CompressionManager;
//# sourceMappingURL=compression-manager.d.ts.map