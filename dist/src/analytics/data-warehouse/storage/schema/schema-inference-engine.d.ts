import { StorageFormat } from '../../types/data-lake-types';
export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'json' | 'array' | 'object' | 'null' | 'decimal' | 'integer' | 'timestamp' | 'unknown';
export interface SchemaField {
    name: string;
    type?: DataType;
    dataType?: DataType;
    nullable: boolean;
    unique?: boolean;
    pattern?: string;
    patterns?: string[];
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    description?: string;
    examples?: unknown[] | undefined;
    constraints?: Record<string, unknown>;
    confidence?: number;
    inferredFrom?: string;
    metadata?: Record<string, unknown>;
}
export interface SchemaInference {
    id?: string;
    datasetId: string;
    fields: SchemaField[];
    format?: StorageFormat;
    confidence: number;
    sampleSize: number;
    nullPercentage?: number;
    inferredAt: Date;
    version?: number;
    metadata?: Record<string, unknown>;
}
export interface SchemaValidationResult {
    valid?: boolean;
    isValid?: boolean;
    errors: Array<{
        field: string;
        error: string;
        recordIndex?: number;
        value?: unknown;
    }> | undefined;
    warnings?: string[];
    confidence?: number;
    validationScore?: number;
    fieldStats?: any;
    summary?: {
        totalRecords: number;
        totalFields: number;
        totalErrors: number;
        validationTime: number;
    };
    fieldValidation?: Record<string, {
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
}
export interface SchemaEvolutionResult {
    compatible?: boolean;
    originalSchema?: SchemaInference;
    evolvedSchema?: SchemaInference;
    changes: Array<{
        type: string;
        field: string;
        details?: unknown;
        oldType?: DataType;
        newType?: DataType;
    }> | {
        added: SchemaField[];
        removed: SchemaField[];
        modified: Array<{
            field: string;
            oldType: DataType;
            newType: DataType;
            breaking: boolean;
        }>;
    };
    isBackwardCompatible?: boolean;
    recommendations?: string[];
    migrationRequired: boolean;
    migrationScript?: string;
}
export interface InferenceConfig {
    sampleSize: number;
    confidenceThreshold: number;
    nullThreshold: number;
    enableTypePromotion: boolean;
    enablePatternDetection: boolean;
    customPatterns?: Record<string, RegExp>;
}
export interface SchemaStats {
    fieldCount: number;
    nullableFields: number;
    uniqueConstraints: number;
    indexRecommendations: string[];
    estimatedSize: number;
    complexityScore: number;
}
export declare class SchemaInferenceEngine {
    private config;
    private typeDetectors;
    private patternMatchers;
    constructor(config?: Partial<InferenceConfig>);
    inferSchema(data: unknown[] | undefined, format: StorageFormat, datasetId: string): Promise<SchemaInference>;
    validateSchema(data: unknown[] | undefined, schema: SchemaInference): Promise<SchemaValidationResult>;
    evolveSchema(currentSchema: SchemaInference, newData: unknown[] | undefined): Promise<SchemaEvolutionResult>;
    private sampleData;
    private extractFields;
    private extractFieldsFromJSON;
    private extractFieldsFromObject;
    private extractFieldsFromCSV;
    private extractFieldsFromStructured;
    private extractFieldsFromGeneric;
    private detectDataTypes;
    private extractFieldValues;
    private getFieldValue;
    private analyzeDataType;
    private detectValueType;
    private promoteType;
    private detectPatterns;
    private detectFieldPatterns;
    private detectConstraints;
    private analyzeConstraints;
    private generateStats;
    private calculateOverallConfidence;
    private validateDataType;
    private validateConstraints;
    private compareSchemas;
    private mergeFields;
    private checkBackwardCompatibility;
    private isCompatibleTypeChange;
    private requiresMigration;
    private generateMigrationScript;
    private mapDataTypeToSQL;
    private initializeTypeDetectors;
    private initializePatternMatchers;
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
export default SchemaInferenceEngine;
//# sourceMappingURL=schema-inference-engine.d.ts.map