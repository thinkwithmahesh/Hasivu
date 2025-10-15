import { StorageFormat, CompressionFormat } from '../../types/data-lake-types';
export interface FormatRecommendation {
    format: StorageFormat;
    compression: CompressionFormat;
    estimatedSizeReduction: number;
    queryPerformanceImpact: number;
    reason: string;
}
export declare class FormatOptimizer {
    constructor();
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    optimizeData(data: any[] | undefined, metadata?: any): Promise<{
        optimizedData: any[] | undefined;
        format: StorageFormat;
        compression: CompressionFormat;
        sizeReduction: number;
    }>;
    private applyFormatOptimization;
    private optimizeForColumnar;
    private optimizeForOrc;
    private optimizeForAvro;
    private optimizeForJson;
    recommendFormat(data: any[] | undefined, accessPatterns: string[], currentFormat?: StorageFormat): Promise<FormatRecommendation>;
    private analyzeDataCharacteristics;
    private recommendCompression;
}
export default FormatOptimizer;
//# sourceMappingURL=format-optimizer.d.ts.map