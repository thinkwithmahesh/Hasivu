/// <reference types="node" />
import { EventEmitter } from 'events';
export interface StarSchemaConfig {
    name: string;
    factTable: string;
    dimensionTables: string[];
    tenantId: string;
    createdAt: Date;
    version: number;
}
export interface DimensionTable {
    name: string;
    primaryKey: string;
    attributes: DimensionAttribute[];
    type: 'type1' | 'type2' | 'type3';
    hierarchies?: Hierarchy[];
}
export interface DimensionAttribute {
    name: string;
    dataType: 'string' | 'number' | 'date' | 'boolean';
    nullable: boolean;
    indexed: boolean;
    description?: string;
}
export interface Hierarchy {
    name: string;
    levels: string[];
    rollupRules: Record<string, string>;
}
export interface FactTable {
    name: string;
    measures: Measure[];
    dimensions: DimensionReference[];
    granularity: string;
    partitionStrategy: PartitionStrategy;
}
export interface Measure {
    name: string;
    aggregationType: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'distinct_count';
    dataType: 'number' | 'decimal' | 'integer';
    nullable: boolean;
    description?: string;
}
export interface DimensionReference {
    dimensionTable: string;
    foreignKey: string;
    relationship: 'one-to-many' | 'many-to-many';
}
export interface PartitionStrategy {
    type: 'time_based' | 'hash' | 'range';
    column: string;
    interval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    buckets?: number;
}
export interface SchemaDefinition {
    id: string;
    name: string;
    factTable: FactTable;
    dimensionTables: DimensionTable[];
    relationships: SchemaRelationship[];
    metadata: SchemaMetadata;
    tenantId: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface SchemaRelationship {
    fromTable: string;
    toTable: string;
    fromColumn: string;
    toColumn: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
    enforced: boolean;
}
export interface SchemaMetadata {
    description: string;
    owner: string;
    tags: string[];
    businessGlossary: Record<string, string>;
    dataQualityRules: DataQualityRule[];
}
export interface DataQualityRule {
    column: string;
    rule: 'not_null' | 'unique' | 'range' | 'format' | 'referential_integrity';
    parameters?: Record<string, any>;
    severity: 'warning' | 'error';
}
export declare class StarSchemaBuilder extends EventEmitter {
    private readonly config;
    private readonly schemas;
    private readonly dimensionRegistry;
    constructor(config?: {
        maxDimensions?: number;
        enableSCD?: boolean;
        defaultPartitionStrategy?: PartitionStrategy;
        enforceNamingConventions?: boolean;
    });
    createSchema(schemaConfig: StarSchemaConfig): Promise<SchemaDefinition>;
    private buildFactTable;
    private buildDimensionTable;
    private createSchemaRelationships;
    private generateSchemaMetadata;
    private validateSchemaConfig;
    private validateNamingConventions;
    private generateSchemaId;
    private simpleHash;
    getSchema(schemaId: string): SchemaDefinition | undefined;
    getSchemasByTenant(tenantId: string): SchemaDefinition[];
    getDimensionRegistry(): Map<string, DimensionTable>;
    clearSchemas(): void;
}
//# sourceMappingURL=star-schema-builder.d.ts.map