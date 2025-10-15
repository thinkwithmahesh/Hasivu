"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StarSchemaBuilder = void 0;
const events_1 = require("events");
const logger_1 = require("../../../../utils/logger");
class StarSchemaBuilder extends events_1.EventEmitter {
    config;
    schemas = new Map();
    dimensionRegistry = new Map();
    constructor(config = {}) {
        super();
        this.config = config;
        logger_1.logger.info('StarSchemaBuilder initialized', this.config);
    }
    async createSchema(schemaConfig) {
        try {
            logger_1.logger.info('Creating star schema', {
                name: schemaConfig.name,
                factTable: schemaConfig.factTable,
                dimensionCount: schemaConfig.dimensionTables.length
            });
            this.validateSchemaConfig(schemaConfig);
            const schemaId = this.generateSchemaId(schemaConfig.name, schemaConfig.tenantId);
            const factTable = await this.buildFactTable(schemaConfig.factTable, schemaConfig.dimensionTables);
            const dimensionTables = await Promise.all(schemaConfig.dimensionTables.map(dimName => this.buildDimensionTable(dimName, schemaConfig.tenantId)));
            const relationships = this.createSchemaRelationships(factTable, dimensionTables);
            const metadata = this.generateSchemaMetadata(schemaConfig);
            const schema = {
                id: schemaId,
                name: schemaConfig.name,
                factTable,
                dimensionTables,
                relationships,
                metadata,
                tenantId: schemaConfig.tenantId,
                version: schemaConfig.version,
                createdAt: schemaConfig.createdAt,
                updatedAt: new Date()
            };
            this.schemas.set(schemaId, schema);
            dimensionTables.forEach(dim => {
                this.dimensionRegistry.set(`${schemaConfig.tenantId}:${dim.name}`, dim);
            });
            logger_1.logger.info('Star schema created successfully', {
                schemaId,
                factTable: factTable.name,
                dimensionCount: dimensionTables.length
            });
            this.emit('schema:created', schema);
            return schema;
        }
        catch (error) {
            logger_1.logger.error('Failed to create star schema', { error, config: schemaConfig });
            throw error;
        }
    }
    async buildFactTable(factTableName, dimensionNames) {
        const measures = [
            {
                name: 'revenue',
                aggregationType: 'sum',
                dataType: 'decimal',
                nullable: false,
                description: 'Total revenue amount'
            },
            {
                name: 'quantity',
                aggregationType: 'sum',
                dataType: 'integer',
                nullable: false,
                description: 'Total quantity'
            },
            {
                name: 'transaction_count',
                aggregationType: 'count',
                dataType: 'integer',
                nullable: false,
                description: 'Number of transactions'
            },
            {
                name: 'avg_order_value',
                aggregationType: 'avg',
                dataType: 'decimal',
                nullable: true,
                description: 'Average order value'
            }
        ];
        const dimensions = dimensionNames.map(dimName => ({
            dimensionTable: dimName,
            foreignKey: `${dimName}_id`,
            relationship: 'one-to-many'
        }));
        const partitionStrategy = this.config.defaultPartitionStrategy || {
            type: 'time_based',
            column: 'date_key',
            interval: 'monthly'
        };
        return {
            name: factTableName,
            measures,
            dimensions,
            granularity: 'daily',
            partitionStrategy
        };
    }
    async buildDimensionTable(dimensionName, tenantId) {
        const existingDim = this.dimensionRegistry.get(`${tenantId}:${dimensionName}`);
        if (existingDim) {
            return existingDim;
        }
        let attributes = [];
        let hierarchies = [];
        switch (dimensionName.toLowerCase()) {
            case 'time':
            case 'date':
                attributes = [
                    { name: 'date_key', dataType: 'number', nullable: false, indexed: true },
                    { name: 'full_date', dataType: 'date', nullable: false, indexed: true },
                    { name: 'year', dataType: 'number', nullable: false, indexed: true },
                    { name: 'quarter', dataType: 'number', nullable: false, indexed: true },
                    { name: 'month', dataType: 'number', nullable: false, indexed: true },
                    { name: 'week', dataType: 'number', nullable: false, indexed: true },
                    { name: 'day', dataType: 'number', nullable: false, indexed: false },
                    { name: 'day_of_week', dataType: 'string', nullable: false, indexed: true },
                    { name: 'is_weekend', dataType: 'boolean', nullable: false, indexed: true },
                    { name: 'is_holiday', dataType: 'boolean', nullable: false, indexed: true }
                ];
                hierarchies = [{
                        name: 'calendar_hierarchy',
                        levels: ['year', 'quarter', 'month', 'week', 'day'],
                        rollupRules: {
                            'day': 'week',
                            'week': 'month',
                            'month': 'quarter',
                            'quarter': 'year'
                        }
                    }];
                break;
            case 'customer':
            case 'user':
                attributes = [
                    { name: 'customer_key', dataType: 'number', nullable: false, indexed: true },
                    { name: 'customer_id', dataType: 'string', nullable: false, indexed: true },
                    { name: 'first_name', dataType: 'string', nullable: false, indexed: false },
                    { name: 'last_name', dataType: 'string', nullable: false, indexed: false },
                    { name: 'email', dataType: 'string', nullable: true, indexed: true },
                    { name: 'phone', dataType: 'string', nullable: true, indexed: false },
                    { name: 'city', dataType: 'string', nullable: true, indexed: true },
                    { name: 'state', dataType: 'string', nullable: true, indexed: true },
                    { name: 'country', dataType: 'string', nullable: true, indexed: true },
                    { name: 'customer_segment', dataType: 'string', nullable: true, indexed: true },
                    { name: 'registration_date', dataType: 'date', nullable: false, indexed: true }
                ];
                hierarchies = [{
                        name: 'geographic_hierarchy',
                        levels: ['country', 'state', 'city'],
                        rollupRules: {
                            'city': 'state',
                            'state': 'country'
                        }
                    }];
                break;
            case 'product':
            case 'item':
                attributes = [
                    { name: 'product_key', dataType: 'number', nullable: false, indexed: true },
                    { name: 'product_id', dataType: 'string', nullable: false, indexed: true },
                    { name: 'product_name', dataType: 'string', nullable: false, indexed: false },
                    { name: 'category', dataType: 'string', nullable: false, indexed: true },
                    { name: 'subcategory', dataType: 'string', nullable: true, indexed: true },
                    { name: 'brand', dataType: 'string', nullable: true, indexed: true },
                    { name: 'unit_price', dataType: 'number', nullable: false, indexed: false },
                    { name: 'unit_cost', dataType: 'number', nullable: true, indexed: false },
                    { name: 'is_active', dataType: 'boolean', nullable: false, indexed: true },
                    { name: 'created_date', dataType: 'date', nullable: false, indexed: true }
                ];
                hierarchies = [{
                        name: 'product_hierarchy',
                        levels: ['category', 'subcategory', 'brand', 'product_name'],
                        rollupRules: {
                            'product_name': 'brand',
                            'brand': 'subcategory',
                            'subcategory': 'category'
                        }
                    }];
                break;
            case 'school':
            case 'organization':
                attributes = [
                    { name: 'school_key', dataType: 'number', nullable: false, indexed: true },
                    { name: 'school_id', dataType: 'string', nullable: false, indexed: true },
                    { name: 'school_name', dataType: 'string', nullable: false, indexed: false },
                    { name: 'school_type', dataType: 'string', nullable: false, indexed: true },
                    { name: 'district', dataType: 'string', nullable: true, indexed: true },
                    { name: 'city', dataType: 'string', nullable: false, indexed: true },
                    { name: 'state', dataType: 'string', nullable: false, indexed: true },
                    { name: 'enrollment', dataType: 'number', nullable: true, indexed: false },
                    { name: 'grade_levels', dataType: 'string', nullable: true, indexed: true },
                    { name: 'established_date', dataType: 'date', nullable: true, indexed: false }
                ];
                hierarchies = [{
                        name: 'administrative_hierarchy',
                        levels: ['state', 'district', 'school_name'],
                        rollupRules: {
                            'school_name': 'district',
                            'district': 'state'
                        }
                    }];
                break;
            default:
                attributes = [
                    { name: `${dimensionName}_key`, dataType: 'number', nullable: false, indexed: true },
                    { name: `${dimensionName}_id`, dataType: 'string', nullable: false, indexed: true },
                    { name: `${dimensionName}_name`, dataType: 'string', nullable: false, indexed: false },
                    { name: 'description', dataType: 'string', nullable: true, indexed: false },
                    { name: 'is_active', dataType: 'boolean', nullable: false, indexed: true },
                    { name: 'created_date', dataType: 'date', nullable: false, indexed: true }
                ];
        }
        return {
            name: dimensionName,
            primaryKey: `${dimensionName}_key`,
            attributes,
            type: this.config.enableSCD ? 'type2' : 'type1',
            hierarchies
        };
    }
    createSchemaRelationships(factTable, dimensions) {
        return dimensions.map(dim => ({
            fromTable: factTable.name,
            toTable: dim.name,
            fromColumn: `${dim.name}_key`,
            toColumn: dim.primaryKey,
            type: 'one-to-many',
            enforced: true
        }));
    }
    generateSchemaMetadata(config) {
        const dataQualityRules = [
            {
                column: 'date_key',
                rule: 'not_null',
                severity: 'error'
            },
            {
                column: 'revenue',
                rule: 'range',
                parameters: { min: 0 },
                severity: 'warning'
            }
        ];
        return {
            description: `Star schema for ${config.name} analytics`,
            owner: `tenant:${config.tenantId}`,
            tags: ['star_schema', 'analytics', 'dimensional_model'],
            businessGlossary: {
                'revenue': 'Total monetary value of transactions',
                'customer': 'Individual or organization making purchases',
                'product': 'Goods or services being sold'
            },
            dataQualityRules
        };
    }
    validateSchemaConfig(config) {
        if (!config.name || config.name.trim().length === 0) {
            throw new Error('Schema name is required');
        }
        if (!config.factTable || config.factTable.trim().length === 0) {
            throw new Error('Fact table name is required');
        }
        if (!config.dimensionTables || config.dimensionTables.length === 0) {
            throw new Error('At least one dimension table is required');
        }
        if (this.config.maxDimensions && config.dimensionTables.length > this.config.maxDimensions) {
            throw new Error(`Maximum ${this.config.maxDimensions} dimensions allowed`);
        }
        if (!config.tenantId || config.tenantId.trim().length === 0) {
            throw new Error('Tenant ID is required');
        }
        if (this.config.enforceNamingConventions) {
            this.validateNamingConventions(config);
        }
    }
    validateNamingConventions(config) {
        const namePattern = /^[a-z][a-z0-9_]*[a-z0-9]$/;
        if (!namePattern.test(config.name)) {
            throw new Error('Schema name must follow snake_case convention');
        }
        if (!namePattern.test(config.factTable)) {
            throw new Error('Fact table name must follow snake_case convention');
        }
        config.dimensionTables.forEach(dimName => {
            if (!namePattern.test(dimName)) {
                throw new Error(`Dimension table name '${dimName}' must follow snake_case convention`);
            }
        });
    }
    generateSchemaId(schemaName, tenantId) {
        const timestamp = Date.now();
        const hash = this.simpleHash(`${tenantId}:${schemaName}:${timestamp}`);
        return `star_schema_${hash}`;
    }
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36);
    }
    getSchema(schemaId) {
        return this.schemas.get(schemaId);
    }
    getSchemasByTenant(tenantId) {
        return Array.from(this.schemas.values())
            .filter(schema => schema.tenantId === tenantId);
    }
    getDimensionRegistry() {
        return new Map(this.dimensionRegistry);
    }
    clearSchemas() {
        this.schemas.clear();
        this.dimensionRegistry.clear();
        logger_1.logger.info('All schemas cleared');
    }
}
exports.StarSchemaBuilder = StarSchemaBuilder;
//# sourceMappingURL=star-schema-builder.js.map