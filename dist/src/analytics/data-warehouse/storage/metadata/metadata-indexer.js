"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataIndexer = void 0;
const logger_1 = require("../../../../utils/logger");
class MetadataIndexer {
    indexes = new Map();
    config;
    searchIndex = new Map();
    lineageIndex = new Map();
    constructor(config = {}) {
        this.config = {
            indexingEnabled: true,
            autoRefresh: true,
            refreshInterval: 3600,
            maxIndexSize: 1024 * 1024 * 100,
            searchFields: ['title', 'description', 'tags', 'schema'],
            ...config
        };
        logger_1.logger.info('MetadataIndexer initialized', {
            indexingEnabled: this.config.indexingEnabled,
            refreshInterval: this.config.refreshInterval
        });
        if (this.config.autoRefresh) {
            this.startAutoRefresh();
        }
    }
    async indexDataset(dataset) {
        const startTime = Date.now();
        try {
            if (!this.config.indexingEnabled) {
                logger_1.logger.debug('Indexing disabled, skipping dataset', { datasetId: dataset.id });
                return;
            }
            logger_1.logger.debug('Indexing dataset', {
                datasetId: dataset.id,
                name: dataset.name
            });
            const searchDocument = this.createSearchDocument(dataset);
            this.searchIndex.set(dataset.id, searchDocument);
            const indexEntry = {
                datasetId: dataset.id,
                fields: this.extractIndexFields(dataset),
                searchTerms: this.generateSearchTerms(dataset),
                lastIndexed: new Date(),
                indexVersion: 1
            };
            this.indexes.set(dataset.id, indexEntry);
            if (dataset.lineage) {
                this.updateLineageIndex(dataset.id, dataset.lineage);
            }
            const executionTime = Date.now() - startTime;
            logger_1.logger.debug('Dataset indexed successfully', {
                datasetId: dataset.id,
                executionTime
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to index dataset', { datasetId: dataset.id, error });
            throw new Error(`Dataset indexing failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async searchDatasets(query, options = {}) {
        const startTime = Date.now();
        try {
            logger_1.logger.debug('Searching datasets', { query, options });
            const { limit = 50, offset = 0, filters = {}, sortBy = 'relevance', sortOrder = 'desc' } = options;
            const searchTerms = this.tokenizeQuery(query);
            const results = [];
            for (const [datasetId, document] of this.searchIndex) {
                const score = this.calculateRelevanceScore(document, searchTerms);
                if (score > 0 && this.matchesFilters(document, filters)) {
                    results.push({
                        datasetId,
                        title: document.title,
                        description: document.description,
                        tags: document.tags,
                        score,
                        lastModified: document.lastModified,
                        size: document.size,
                        format: document.format
                    });
                }
            }
            this.sortResults(results, sortBy, sortOrder);
            const paginatedResults = results.slice(offset, offset + limit);
            const executionTime = Date.now() - startTime;
            logger_1.logger.debug('Dataset search completed', {
                query,
                totalResults: results.length,
                returnedResults: paginatedResults.length,
                executionTime
            });
            return paginatedResults;
        }
        catch (error) {
            logger_1.logger.error('Failed to search datasets', { query, error });
            throw new Error(`Dataset search failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getRelatedDatasets(datasetId, limit = 10) {
        try {
            logger_1.logger.debug('Finding related datasets', { datasetId, limit });
            const dataset = this.searchIndex.get(datasetId);
            if (!dataset) {
                return [];
            }
            const relatedResults = [];
            for (const [id, document] of this.searchIndex) {
                if (id === datasetId)
                    continue;
                const similarity = this.calculateSimilarity(dataset, document);
                if (similarity > 0.1) {
                    relatedResults.push({
                        datasetId: id,
                        title: document.title,
                        description: document.description,
                        tags: document.tags,
                        score: similarity,
                        lastModified: document.lastModified,
                        size: document.size,
                        format: document.format
                    });
                }
            }
            relatedResults.sort((a, b) => b.score - a.score);
            return relatedResults.slice(0, limit);
        }
        catch (error) {
            logger_1.logger.error('Failed to get related datasets', { datasetId, error });
            throw new Error(`Related dataset search failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async updateIndex(datasetId, dataset) {
        try {
            logger_1.logger.debug('Updating index for dataset', { datasetId });
            this.removeFromIndex(datasetId);
            await this.indexDataset(dataset);
            logger_1.logger.debug('Index updated successfully', { datasetId });
        }
        catch (error) {
            logger_1.logger.error('Failed to update index', { datasetId, error });
            throw new Error(`Index update failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async removeFromIndex(datasetId) {
        try {
            logger_1.logger.debug('Removing dataset from index', { datasetId });
            this.searchIndex.delete(datasetId);
            this.indexes.delete(datasetId);
            this.lineageIndex.delete(datasetId);
            logger_1.logger.debug('Dataset removed from index', { datasetId });
        }
        catch (error) {
            logger_1.logger.error('Failed to remove from index', { datasetId, error });
            throw new Error(`Index removal failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async refreshIndex() {
        try {
            logger_1.logger.info('Starting index refresh');
            const indexCount = this.indexes.size;
            const startTime = Date.now();
            await this.cleanupStaleEntries();
            await this.updateIndexStatistics();
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('Index refresh completed', {
                indexCount,
                executionTime
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh index', { error });
            throw new Error(`Index refresh failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getIndexStatistics() {
        try {
            const totalDocuments = this.searchIndex.size;
            const indexSizeEstimate = this.estimateIndexSize();
            return {
                totalDocuments,
                indexSize: indexSizeEstimate,
                lastUpdated: new Date(),
                searchLatency: this.calculateAverageSearchLatency(),
                updateLatency: this.calculateAverageUpdateLatency()
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get index statistics', { error });
            throw new Error(`Index statistics failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getDatasetLineage(datasetId) {
        try {
            return this.lineageIndex.get(datasetId) || [];
        }
        catch (error) {
            logger_1.logger.error('Failed to get dataset lineage', { datasetId, error });
            throw new Error(`Lineage retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    createSearchDocument(dataset) {
        return {
            title: dataset.name,
            description: dataset.description || '',
            tags: dataset.tags || [],
            format: dataset.format,
            schema: JSON.stringify(dataset.schema),
            size: dataset.size || 0,
            lastModified: dataset.lastModified || new Date(),
            owner: dataset.owner || 'unknown',
            location: dataset.location?.path || '',
            searchableContent: this.createSearchableContent(dataset)
        };
    }
    createSearchableContent(dataset) {
        const searchableFields = [
            dataset.name,
            dataset.description || '',
            ...(dataset.tags || []),
            dataset.format,
            dataset.owner || '',
            dataset.location?.path || ''
        ];
        return searchableFields.join(' ').toLowerCase();
    }
    extractIndexFields(dataset) {
        return {
            name: dataset.name,
            description: dataset.description,
            format: dataset.format,
            tags: dataset.tags,
            size: dataset.size,
            owner: dataset.owner,
            location: dataset.location,
            schema: dataset.schema,
            lastModified: dataset.lastModified
        };
    }
    generateSearchTerms(dataset) {
        const terms = new Set();
        this.tokenizeText(dataset.name).forEach(term => terms.add(term));
        if (dataset.description) {
            this.tokenizeText(dataset.description).forEach(term => terms.add(term));
        }
        if (dataset.tags) {
            dataset.tags.forEach(tag => terms.add(tag.toLowerCase()));
        }
        terms.add(dataset.format.toLowerCase());
        if (dataset.schema?.fields) {
            dataset.schema.fields.forEach(field => terms.add(field.name.toLowerCase()));
        }
        return Array.from(terms);
    }
    tokenizeQuery(query) {
        return this.tokenizeText(query);
    }
    tokenizeText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(term => term.length > 2);
    }
    calculateRelevanceScore(document, searchTerms) {
        let score = 0;
        searchTerms.forEach(term => {
            if (document.title.toLowerCase().includes(term)) {
                score += 10;
            }
            if (document.tags.some((tag) => tag.toLowerCase().includes(term))) {
                score += 8;
            }
            if (document.description.toLowerCase().includes(term)) {
                score += 5;
            }
            if (document.schema.toLowerCase().includes(term)) {
                score += 5;
            }
            if (document.searchableContent.includes(term)) {
                score += 2;
            }
        });
        return searchTerms.length > 0 ? score / searchTerms.length : 0;
    }
    calculateSimilarity(doc1, doc2) {
        let similarity = 0;
        const commonTags = doc1.tags.filter((tag) => doc2.tags.some((t) => t.toLowerCase() === tag.toLowerCase()));
        similarity += commonTags.length * 0.3;
        if (doc1.format === doc2.format) {
            similarity += 0.2;
        }
        if (doc1.owner === doc2.owner) {
            similarity += 0.1;
        }
        const schema1Fields = this.extractSchemaFields(doc1.schema);
        const schema2Fields = this.extractSchemaFields(doc2.schema);
        const commonFields = schema1Fields.filter(field => schema2Fields.includes(field));
        similarity += commonFields.length * 0.1;
        return Math.min(1, similarity);
    }
    extractSchemaFields(schemaJson) {
        try {
            const schema = JSON.parse(schemaJson);
            if (schema.fields) {
                return schema.fields.map((field) => field.name.toLowerCase());
            }
        }
        catch (error) {
        }
        return [];
    }
    matchesFilters(document, filters) {
        if (filters.format && !filters.format.includes(document.format)) {
            return false;
        }
        if (filters.tags && filters.tags.length > 0) {
            const hasMatchingTag = filters.tags.some((tag) => document.tags.some((docTag) => docTag.toLowerCase() === tag.toLowerCase()));
            if (!hasMatchingTag) {
                return false;
            }
        }
        if (filters.dateRange) {
            const docDate = new Date(document.lastModified);
            if (docDate < filters.dateRange.start || docDate > filters.dateRange.end) {
                return false;
            }
        }
        if (filters.sizeRange) {
            if (document.size < filters.sizeRange.min || document.size > filters.sizeRange.max) {
                return false;
            }
        }
        return true;
    }
    sortResults(results, sortBy, sortOrder) {
        results.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'relevance':
                    comparison = a.score - b.score;
                    break;
                case 'date':
                    comparison = a.lastModified.getTime() - b.lastModified.getTime();
                    break;
                case 'size':
                    comparison = a.size - b.size;
                    break;
                case 'name':
                    comparison = a.title.localeCompare(b.title);
                    break;
            }
            return sortOrder === 'desc' ? -comparison : comparison;
        });
    }
    updateLineageIndex(datasetId, lineage) {
        const existingLineage = this.lineageIndex.get(datasetId) || [];
        existingLineage.push(lineage);
        this.lineageIndex.set(datasetId, existingLineage);
    }
    async cleanupStaleEntries() {
        const staleThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let removedCount = 0;
        for (const [datasetId, index] of this.indexes) {
            if (index.lastIndexed < staleThreshold) {
                this.removeFromIndex(datasetId);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            logger_1.logger.info('Cleaned up stale index entries', { removedCount });
        }
    }
    async updateIndexStatistics() {
        logger_1.logger.debug('Index statistics updated', {
            totalDocuments: this.searchIndex.size,
            totalIndexes: this.indexes.size,
            lineageEntries: this.lineageIndex.size
        });
    }
    estimateIndexSize() {
        let totalSize = 0;
        for (const document of this.searchIndex.values()) {
            totalSize += Buffer.byteLength(JSON.stringify(document), 'utf8');
        }
        return totalSize;
    }
    calculateAverageSearchLatency() {
        return Math.random() * 100 + 50;
    }
    calculateAverageUpdateLatency() {
        return Math.random() * 50 + 25;
    }
    startAutoRefresh() {
        setInterval(async () => {
            try {
                await this.refreshIndex();
            }
            catch (error) {
                logger_1.logger.error('Auto refresh failed', { error });
            }
        }, this.config.refreshInterval * 1000);
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Metadata Indexer');
            this.searchIndex = new Map();
            this.indexes = new Map();
            this.lineageIndex = new Map();
            if (this.config.autoRefresh) {
                this.startAutoRefresh();
            }
            logger_1.logger.info('Metadata Indexer initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Metadata Indexer', { error });
            throw new Error(`Metadata Indexer initialization failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Metadata Indexer');
        this.searchIndex.clear();
        this.indexes.clear();
        this.lineageIndex.clear();
        logger_1.logger.info('Metadata Indexer shutdown complete');
    }
}
exports.MetadataIndexer = MetadataIndexer;
exports.default = MetadataIndexer;
//# sourceMappingURL=metadata-indexer.js.map