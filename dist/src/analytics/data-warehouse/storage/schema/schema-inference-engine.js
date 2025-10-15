"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaInferenceEngine = void 0;
const logger_1 = require("../../../../utils/logger");
class SchemaInferenceEngine {
    config;
    typeDetectors = new Map();
    patternMatchers = new Map();
    constructor(config = {}) {
        this.config = {
            sampleSize: 1000,
            confidenceThreshold: 0.8,
            nullThreshold: 0.1,
            enableTypePromotion: true,
            enablePatternDetection: true,
            ...config
        };
        this.initializeTypeDetectors();
        this.initializePatternMatchers();
        logger_1.logger.info('SchemaInferenceEngine initialized', {
            sampleSize: this.config.sampleSize,
            confidenceThreshold: this.config.confidenceThreshold
        });
    }
    async inferSchema(data, format, datasetId) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting schema inference', {
                datasetId,
                format,
                recordCount: data?.length || 0
            });
            const sampleData = this.sampleData(data);
            const fields = await this.extractFields(sampleData, format);
            const typedFields = await this.detectDataTypes(fields, sampleData);
            const enrichedFields = this.config.enablePatternDetection
                ? await this.detectPatterns(typedFields, sampleData)
                : typedFields;
            const finalFields = await this.detectConstraints(enrichedFields, sampleData);
            const stats = this.generateStats(finalFields, sampleData);
            const schema = {
                id: `schema_${datasetId}_${Date.now()}`,
                datasetId,
                fields: finalFields,
                format,
                sampleSize: sampleData?.length || 0,
                confidence: this.calculateOverallConfidence(finalFields),
                inferredAt: new Date(),
                version: 1,
                metadata: {
                    recordCount: data?.length || 0,
                    inferenceTime: Date.now() - startTime,
                    nullThreshold: this.config.nullThreshold,
                    confidenceThreshold: this.config.confidenceThreshold,
                    ...stats
                }
            };
            logger_1.logger.info('Schema inference completed', {
                datasetId,
                fieldCount: finalFields.length,
                confidence: schema.confidence,
                executionTime: Date.now() - startTime
            });
            return schema;
        }
        catch (error) {
            logger_1.logger.error('Schema inference failed', { datasetId, error });
            throw new Error(`Schema inference failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async validateSchema(data, schema) {
        const startTime = Date.now();
        try {
            logger_1.logger.debug('Validating schema', {
                datasetId: schema.datasetId,
                recordCount: data?.length || 0
            });
            const validationErrors = [];
            const fieldStats = {};
            schema.fields.forEach(field => {
                fieldStats[field.name] = {
                    validCount: 0,
                    invalidCount: 0,
                    nullCount: 0,
                    sampleInvalidValues: []
                };
            });
            if (!data) {
                const result = {
                    isValid: true,
                    validationScore: 1.0,
                    errors: [],
                    fieldStats,
                    summary: {
                        totalRecords: 0,
                        totalFields: schema.fields.length,
                        totalErrors: 0,
                        validationTime: Date.now() - startTime
                    }
                };
                return result;
            }
            data.forEach((record, index) => {
                schema.fields.forEach(field => {
                    const value = this.getFieldValue(record, field.name);
                    const stats = fieldStats[field.name];
                    if (value === null || value === undefined) {
                        stats.nullCount++;
                        if (!field.nullable) {
                            validationErrors.push({
                                field: field.name,
                                error: 'Null value in non-nullable field',
                                recordIndex: index
                            });
                        }
                        return;
                    }
                    if (field.dataType && !this.validateDataType(value, field.dataType)) {
                        stats.invalidCount++;
                        if (stats.sampleInvalidValues && stats.sampleInvalidValues.length < 10) {
                            stats.sampleInvalidValues.push(value);
                        }
                        validationErrors.push({
                            field: field.name,
                            error: `Type mismatch: expected ${field.dataType}, got ${typeof value}`,
                            recordIndex: index,
                            value
                        });
                    }
                    else {
                        stats.validCount++;
                    }
                    if (field.constraints) {
                        const constraintErrors = this.validateConstraints(value, field.constraints);
                        constraintErrors.forEach(error => {
                            validationErrors.push({
                                field: field.name,
                                error,
                                recordIndex: index,
                                value
                            });
                        });
                    }
                });
            });
            const totalChecks = (data?.length || 0) * schema.fields.length;
            const errorCount = validationErrors.length;
            const validationScore = totalChecks > 0 ? (totalChecks - errorCount) / totalChecks : 1.0;
            const result = {
                isValid: validationErrors.length === 0,
                validationScore,
                errors: validationErrors,
                fieldStats,
                summary: {
                    totalRecords: data?.length || 0,
                    totalFields: schema.fields.length,
                    totalErrors: errorCount,
                    validationTime: Date.now() - startTime
                }
            };
            logger_1.logger.info('Schema validation completed', {
                datasetId: schema.datasetId,
                isValid: result.isValid,
                validationScore: result.validationScore,
                errorCount: validationErrors.length
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Schema validation failed', { error });
            throw new Error(`Schema validation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async evolveSchema(currentSchema, newData) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Starting schema evolution', {
                datasetId: currentSchema.datasetId,
                currentFields: currentSchema.fields.length,
                newRecords: newData?.length || 0
            });
            const newSchema = await this.inferSchema(newData, currentSchema.format || 'json', currentSchema.datasetId);
            const changes = this.compareSchemas(currentSchema, newSchema);
            const evolvedFields = this.mergeFields(currentSchema.fields, newSchema.fields);
            const evolvedSchema = {
                ...currentSchema,
                fields: evolvedFields,
                version: (currentSchema.version || 0) + 1,
                inferredAt: new Date(),
                metadata: {
                    ...currentSchema.metadata,
                    evolutionSource: 'data_drift',
                    previousVersion: currentSchema.version || 0,
                    evolutionTime: Date.now() - startTime
                }
            };
            const result = {
                originalSchema: currentSchema,
                evolvedSchema,
                changes,
                isBackwardCompatible: this.checkBackwardCompatibility(changes),
                migrationRequired: this.requiresMigration(changes),
                migrationScript: this.generateMigrationScript(changes)
            };
            logger_1.logger.info('Schema evolution completed', {
                datasetId: currentSchema.datasetId,
                changesCount: changes?.length || 0,
                isBackwardCompatible: result.isBackwardCompatible,
                migrationRequired: result.migrationRequired
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Schema evolution failed', { error });
            throw new Error(`Schema evolution failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    sampleData(data) {
        if (!data || data.length <= this.config.sampleSize) {
            return data;
        }
        const sampleIndices = new Set();
        const interval = Math.floor(data.length / this.config.sampleSize);
        for (let i = 0; i < this.config.sampleSize; i++) {
            const index = Math.min(i * interval, data.length - 1);
            sampleIndices.add(index);
        }
        while (sampleIndices.size < this.config.sampleSize && sampleIndices.size < data.length) {
            const randomIndex = Math.floor(Math.random() * data.length);
            sampleIndices.add(randomIndex);
        }
        return Array.from(sampleIndices).map(index => data[index]);
    }
    async extractFields(data, format) {
        const fieldMap = new Map();
        switch (format) {
            case 'json':
                this.extractFieldsFromJSON(data, fieldMap);
                break;
            case 'csv':
                this.extractFieldsFromCSV(data, fieldMap);
                break;
            case 'parquet':
            case 'orc':
            case 'avro':
                this.extractFieldsFromStructured(data, fieldMap);
                break;
            default:
                this.extractFieldsFromGeneric(data, fieldMap);
        }
        return Array.from(fieldMap.values());
    }
    extractFieldsFromJSON(data, fieldMap) {
        if (!data)
            return;
        data.forEach(record => {
            if (typeof record === 'object' && record !== null) {
                this.extractFieldsFromObject(record, fieldMap);
            }
        });
    }
    extractFieldsFromObject(obj, fieldMap, prefix = '') {
        Object.keys(obj).forEach(key => {
            const fieldName = prefix ? `${prefix}.${key}` : key;
            const value = obj[key];
            if (!fieldMap.has(fieldName)) {
                fieldMap.set(fieldName, {
                    name: fieldName,
                    dataType: 'unknown',
                    nullable: false,
                    confidence: 0,
                    inferredFrom: 'structure'
                });
            }
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.extractFieldsFromObject(value, fieldMap, fieldName);
            }
        });
    }
    extractFieldsFromCSV(data, fieldMap) {
        if (!data || data.length === 0)
            return;
        const headers = Object.keys(data[0]);
        headers.forEach(header => {
            fieldMap.set(header, {
                name: header,
                dataType: 'string',
                nullable: false,
                confidence: 0,
                inferredFrom: 'header'
            });
        });
    }
    extractFieldsFromStructured(data, fieldMap) {
        this.extractFieldsFromJSON(data, fieldMap);
    }
    extractFieldsFromGeneric(data, fieldMap) {
        this.extractFieldsFromJSON(data, fieldMap);
    }
    async detectDataTypes(fields, data) {
        return fields.map(field => {
            const values = this.extractFieldValues(data, field.name);
            const typeAnalysis = this.analyzeDataType(values);
            return {
                ...field,
                dataType: typeAnalysis.primaryType,
                nullable: typeAnalysis.hasNulls,
                confidence: typeAnalysis.confidence,
                metadata: {
                    ...field.metadata,
                    typeDistribution: typeAnalysis.typeDistribution,
                    nullPercentage: typeAnalysis.nullPercentage
                }
            };
        });
    }
    extractFieldValues(data, fieldName) {
        if (!data)
            return [];
        return data.map(record => this.getFieldValue(record, fieldName));
    }
    getFieldValue(record, fieldName) {
        const parts = fieldName.split('.');
        let value = record;
        for (const part of parts) {
            if (value === null || value === undefined) {
                return null;
            }
            value = value[part];
        }
        return value;
    }
    analyzeDataType(values) {
        if (!values) {
            return {
                primaryType: 'string',
                hasNulls: false,
                confidence: 0,
                typeDistribution: {},
                nullPercentage: 0
            };
        }
        const typeCount = {};
        let nullCount = 0;
        values.forEach(value => {
            if (value === null || value === undefined) {
                nullCount++;
                return;
            }
            const detectedType = this.detectValueType(value);
            typeCount[detectedType] = (typeCount[detectedType] || 0) + 1;
        });
        const totalValues = values.length;
        const nonNullValues = totalValues - nullCount;
        const nullPercentage = totalValues > 0 ? nullCount / totalValues : 0;
        let primaryType = 'string';
        let maxCount = 0;
        Object.entries(typeCount).forEach(([type, count]) => {
            if (count > maxCount) {
                maxCount = count;
                primaryType = type;
            }
        });
        const confidence = nonNullValues > 0 ? maxCount / nonNullValues : 0;
        if (this.config.enableTypePromotion && confidence < this.config.confidenceThreshold) {
            primaryType = this.promoteType(typeCount, nonNullValues);
        }
        return {
            primaryType,
            hasNulls: nullPercentage > this.config.nullThreshold,
            confidence,
            typeDistribution: typeCount,
            nullPercentage
        };
    }
    detectValueType(value) {
        for (const [type, detector] of this.typeDetectors) {
            if (detector(value)) {
                return type;
            }
        }
        return 'string';
    }
    promoteType(typeCount, totalCount) {
        const hasNumeric = typeCount['integer'] || typeCount['decimal'];
        const hasString = typeCount['string'];
        if (hasNumeric && hasString && (hasNumeric / totalCount) > 0.5) {
            return typeCount['decimal'] ? 'decimal' : 'integer';
        }
        return 'string';
    }
    async detectPatterns(fields, data) {
        return fields.map(field => {
            if (field.dataType !== 'string') {
                return field;
            }
            const extractedValues = this.extractFieldValues(data, field.name);
            const values = extractedValues ? extractedValues.filter(v => v !== null && v !== undefined) : [];
            const patterns = this.detectFieldPatterns(values);
            return {
                ...field,
                patterns,
                metadata: {
                    ...field.metadata,
                    patternAnalysis: patterns
                }
            };
        });
    }
    detectFieldPatterns(values) {
        const detectedPatterns = [];
        this.patternMatchers.forEach((regex, patternName) => {
            const matchCount = values.filter(value => regex.test(String(value))).length;
            const matchRatio = matchCount / values.length;
            if (matchRatio > 0.8) {
                detectedPatterns.push(patternName);
            }
        });
        return detectedPatterns;
    }
    async detectConstraints(fields, data) {
        return fields.map(field => {
            const extractedValues = this.extractFieldValues(data, field.name);
            const values = extractedValues ? extractedValues.filter(v => v !== null && v !== undefined) : [];
            const constraints = field.dataType ? this.analyzeConstraints(values, field.dataType) : {};
            return {
                ...field,
                constraints,
                metadata: {
                    ...field.metadata,
                    constraintAnalysis: constraints
                }
            };
        });
    }
    analyzeConstraints(values, dataType) {
        const constraints = {};
        if (!values || values.length === 0)
            return constraints;
        const uniqueValues = new Set(values);
        if (uniqueValues.size === values.length) {
            constraints.unique = true;
        }
        switch (dataType) {
            case 'string': {
                const lengths = values.map(v => String(v).length);
                constraints.minLength = Math.min(...lengths);
                constraints.maxLength = Math.max(...lengths);
                break;
            }
            case 'integer':
            case 'decimal': {
                const numbers = values.map(v => Number(v));
                constraints.min = Math.min(...numbers);
                constraints.max = Math.max(...numbers);
                break;
            }
            case 'date':
            case 'timestamp': {
                const dates = values.map(v => new Date(v));
                constraints.minDate = new Date(Math.min(...dates.map(d => d.getTime())));
                constraints.maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
                break;
            }
        }
        return constraints;
    }
    generateStats(fields, data) {
        const nullableFields = fields.filter(f => f.nullable).length;
        const uniqueConstraints = fields.filter(f => f.constraints?.unique).length;
        const indexRecommendations = [];
        fields.forEach(field => {
            if (field.constraints?.unique) {
                indexRecommendations.push(`CREATE UNIQUE INDEX idx_${field.name} ON table (${field.name})`);
            }
            else if (field.dataType === 'string' && field.patterns?.includes('email')) {
                indexRecommendations.push(`CREATE INDEX idx_${field.name} ON table (${field.name})`);
            }
        });
        const estimatedSize = fields.reduce((total, field) => {
            let fieldSize = 0;
            switch (field.dataType) {
                case 'boolean':
                    fieldSize = 1;
                    break;
                case 'integer':
                    fieldSize = 8;
                    break;
                case 'decimal':
                    fieldSize = 16;
                    break;
                case 'date':
                    fieldSize = 8;
                    break;
                case 'timestamp':
                    fieldSize = 16;
                    break;
                case 'string':
                    fieldSize = field.constraints?.maxLength || 255;
                    break;
                default: fieldSize = 255;
            }
            return total + fieldSize;
        }, 0);
        const complexityScore = fields.length * 0.5 +
            nullableFields * 0.3 +
            uniqueConstraints * 0.2;
        return {
            fieldCount: fields.length,
            nullableFields,
            uniqueConstraints,
            indexRecommendations,
            estimatedSize,
            complexityScore
        };
    }
    calculateOverallConfidence(fields) {
        if (fields.length === 0)
            return 0;
        const totalConfidence = fields.reduce((sum, field) => sum + (field.confidence || 0), 0);
        return totalConfidence / fields.length;
    }
    validateDataType(value, expectedType) {
        const detector = this.typeDetectors.get(expectedType);
        return detector ? detector(value) : true;
    }
    validateConstraints(value, constraints) {
        const errors = [];
        if (constraints.unique) {
        }
        if (constraints.minLength && String(value).length < constraints.minLength) {
            errors.push(`Value too short: minimum length is ${constraints.minLength}`);
        }
        if (constraints.maxLength && String(value).length > constraints.maxLength) {
            errors.push(`Value too long: maximum length is ${constraints.maxLength}`);
        }
        if (constraints.min && Number(value) < constraints.min) {
            errors.push(`Value too small: minimum is ${constraints.min}`);
        }
        if (constraints.max && Number(value) > constraints.max) {
            errors.push(`Value too large: maximum is ${constraints.max}`);
        }
        return errors;
    }
    compareSchemas(current, newSchema) {
        const changes = [];
        const currentFieldMap = new Map(current.fields.map(f => [f.name, f]));
        const newFieldMap = new Map(newSchema.fields.map(f => [f.name, f]));
        newFieldMap.forEach((field, name) => {
            if (!currentFieldMap.has(name)) {
                changes.push({
                    type: 'field_added',
                    field: name,
                    details: field
                });
            }
        });
        currentFieldMap.forEach((field, name) => {
            if (!newFieldMap.has(name)) {
                changes.push({
                    type: 'field_removed',
                    field: name,
                    details: field
                });
            }
        });
        currentFieldMap.forEach((currentField, name) => {
            const newField = newFieldMap.get(name);
            if (newField && currentField.dataType !== newField.dataType) {
                changes.push({
                    type: 'type_changed',
                    field: name,
                    oldType: currentField.dataType,
                    newType: newField.dataType
                });
            }
        });
        return changes;
    }
    mergeFields(currentFields, newFields) {
        const mergedMap = new Map();
        currentFields.forEach(field => {
            mergedMap.set(field.name, { ...field });
        });
        newFields.forEach(newField => {
            const existing = mergedMap.get(newField.name);
            if (existing) {
                mergedMap.set(newField.name, {
                    ...existing,
                    nullable: existing.nullable || newField.nullable,
                    confidence: Math.max(existing.confidence || 0, newField.confidence || 0)
                });
            }
            else {
                mergedMap.set(newField.name, { ...newField });
            }
        });
        return Array.from(mergedMap.values());
    }
    checkBackwardCompatibility(changes) {
        if (!changes)
            return true;
        return !changes.some(change => change.type === 'field_removed' ||
            (change.type === 'type_changed' && !this.isCompatibleTypeChange(change.oldType, change.newType)));
    }
    isCompatibleTypeChange(oldType, newType) {
        const compatibleTransitions = {
            'integer': ['decimal', 'string'],
            'decimal': ['string'],
            'date': ['timestamp', 'string'],
            'boolean': ['string']
        };
        return compatibleTransitions[oldType]?.includes(newType) || false;
    }
    requiresMigration(changes) {
        if (!changes)
            return false;
        return changes.some(change => change.type === 'field_removed' ||
            change.type === 'type_changed');
    }
    generateMigrationScript(changes) {
        const scripts = [];
        if (changes) {
            changes.forEach(change => {
                switch (change.type) {
                    case 'field_added':
                        scripts.push(`ALTER TABLE table_name ADD COLUMN ${change.field} ${this.mapDataTypeToSQL(change.details.dataType)};`);
                        break;
                    case 'field_removed':
                        scripts.push(`ALTER TABLE table_name DROP COLUMN ${change.field};`);
                        break;
                    case 'type_changed':
                        scripts.push(`ALTER TABLE table_name ALTER COLUMN ${change.field} TYPE ${this.mapDataTypeToSQL(change.newType)};`);
                        break;
                }
            });
        }
        return scripts.join('\n');
    }
    mapDataTypeToSQL(dataType) {
        const mapping = {
            'string': 'VARCHAR(255)',
            'integer': 'INTEGER',
            'decimal': 'DECIMAL(10,2)',
            'boolean': 'BOOLEAN',
            'date': 'DATE',
            'timestamp': 'TIMESTAMP',
            'number': 'NUMERIC',
            'object': 'JSON',
            'array': 'JSON',
            'json': 'JSON',
            'null': 'NULL',
            'unknown': 'TEXT'
        };
        return mapping[dataType] || 'TEXT';
    }
    initializeTypeDetectors() {
        this.typeDetectors.set('boolean', (value) => {
            return typeof value === 'boolean' ||
                (typeof value === 'string' && /^(true|false|yes|no|1|0)$/i.test(value));
        });
        this.typeDetectors.set('integer', (value) => {
            return Number.isInteger(Number(value)) && !isNaN(Number(value));
        });
        this.typeDetectors.set('decimal', (value) => {
            return typeof value === 'number' && !Number.isInteger(value) ||
                (typeof value === 'string' && /^\d+\.\d+$/.test(value));
        });
        this.typeDetectors.set('date', (value) => {
            if (value instanceof Date)
                return true;
            if (typeof value === 'string') {
                const date = new Date(value);
                return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(value);
            }
            return false;
        });
        this.typeDetectors.set('timestamp', (value) => {
            if (value instanceof Date)
                return true;
            if (typeof value === 'string') {
                const date = new Date(value);
                return !isNaN(date.getTime()) && value.includes('T');
            }
            return false;
        });
        this.typeDetectors.set('string', () => true);
    }
    initializePatternMatchers() {
        this.patternMatchers.set('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/);
        this.patternMatchers.set('phone', /^[+]?[1-9][\d]{0,15}$/);
        this.patternMatchers.set('url', /^https?:\/\/.+/);
        this.patternMatchers.set('uuid', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        this.patternMatchers.set('ip_address', /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/);
        this.patternMatchers.set('credit_card', /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/);
        if (this.config.customPatterns) {
            Object.entries(this.config.customPatterns).forEach(([name, pattern]) => {
                this.patternMatchers.set(name, pattern);
            });
        }
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Schema Inference Engine');
            this.initializeTypeDetectors();
            this.initializePatternMatchers();
            logger_1.logger.info('Schema Inference Engine initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Schema Inference Engine', { error });
            throw new Error(`Schema Inference Engine initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Schema Inference Engine');
        this.typeDetectors.clear();
        this.patternMatchers.clear();
        logger_1.logger.info('Schema Inference Engine shutdown complete');
    }
}
exports.SchemaInferenceEngine = SchemaInferenceEngine;
exports.default = SchemaInferenceEngine;
//# sourceMappingURL=schema-inference-engine.js.map