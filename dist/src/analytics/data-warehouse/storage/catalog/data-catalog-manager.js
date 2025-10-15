"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCatalogManager = void 0;
const logger_1 = require("../../../../utils/logger");
class DataCatalogManager {
    catalog = new Map();
    searchIndex = new Map();
    tagIndex = new Map();
    constructor() {
        logger_1.logger.info('DataCatalogManager initialized');
    }
    async initialize() {
        logger_1.logger.info('Initializing Data Catalog Manager');
        try {
            await this.loadCatalog();
            await this.buildSearchIndexes();
            this.startBackgroundTasks();
            logger_1.logger.info('Data Catalog Manager initialization complete');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Data Catalog Manager', { error });
            throw new Error(`Catalog initialization failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async registerDataset(dataset, metadata) {
        try {
            logger_1.logger.info('Registering dataset in catalog', {
                datasetId: dataset.id,
                owner: metadata.owner
            });
            const entry = {
                id: `catalog_${dataset.id}_${Date.now()}`,
                dataset,
                discoverable: metadata.discoverable !== false,
                tags: metadata.tags || [],
                owner: metadata.owner,
                steward: metadata.steward,
                classification: metadata.classification || 'internal',
                lastCrawled: new Date(),
                popularity: 0,
                qualityScore: await this.calculateQualityScore(dataset),
                governancePolicies: [],
                name: dataset.name,
                description: dataset.description || '',
                format: dataset.format || 'parquet',
                createdAt: dataset.createdAt || new Date(),
                updatedAt: new Date(),
                lastAccessedAt: new Date(),
                version: typeof dataset.version === 'string' ? dataset.version : dataset.version?.version || '1.0.0',
                lineage: undefined,
                size: dataset.size || 0
            };
            this.catalog.set(dataset.id, entry);
            await this.updateSearchIndexes(entry);
            await this.applyGovernancePolicies(entry);
            logger_1.logger.info('Dataset registered successfully', {
                datasetId: dataset.id,
                catalogId: entry.id,
                qualityScore: entry.qualityScore
            });
            return entry;
        }
        catch (error) {
            logger_1.logger.error('Failed to register dataset', { datasetId: dataset.id, error });
            throw new Error(`Dataset registration failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async updateDataset(datasetId, updates) {
        try {
            const entry = this.catalog.get(datasetId);
            if (!entry) {
                throw new Error(`Dataset not found in catalog: ${datasetId}`);
            }
            const updatedEntry = {
                ...entry,
                ...updates,
                lastCrawled: new Date()
            };
            this.catalog.set(datasetId, updatedEntry);
            await this.updateSearchIndexes(updatedEntry);
            logger_1.logger.info('Dataset updated in catalog', {
                datasetId,
                catalogId: updatedEntry.id
            });
            return updatedEntry;
        }
        catch (error) {
            logger_1.logger.error('Failed to update dataset', { datasetId, error });
            throw new Error(`Dataset update failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async removeDataset(datasetId) {
        try {
            logger_1.logger.info('Removing dataset from catalog', { datasetId });
            const entry = this.catalog.get(datasetId);
            if (!entry) {
                logger_1.logger.warn('Dataset not found in catalog', { datasetId });
                return;
            }
            this.catalog.delete(datasetId);
            await this.removeFromSearchIndexes(entry);
            logger_1.logger.info('Dataset removed from catalog', { datasetId });
        }
        catch (error) {
            logger_1.logger.error('Failed to remove dataset', { datasetId, error });
            throw new Error(`Dataset removal failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async searchDatasets(filter) {
        try {
            logger_1.logger.debug('Searching datasets', { filter });
            let results = Array.from(this.catalog.values());
            results = results.filter(entry => entry.discoverable);
            if (filter.query) {
                const queryTerms = filter.query.toLowerCase().split(' ');
                results = results.filter(entry => {
                    const searchText = [
                        entry.dataset.name,
                        entry.dataset.description,
                        ...entry.tags
                    ].join(' ').toLowerCase();
                    return queryTerms.every(term => searchText.includes(term));
                });
            }
            if (filter.tags && filter.tags.length > 0) {
                results = results.filter(entry => filter.tags.every(tag => entry.tags.includes(tag)));
            }
            if (filter.owner) {
                results = results.filter(entry => entry.owner === filter.owner || entry.steward === filter.owner);
            }
            if (filter.classification && filter.classification.length > 0) {
                results = results.filter(entry => filter.classification.includes(entry.classification));
            }
            if (filter.format && filter.format.length > 0) {
                results = results.filter(entry => filter.format.includes(entry.dataset.format));
            }
            if (filter.dateRange) {
                results = results.filter(entry => {
                    const createdAt = entry.dataset.createdAt;
                    return createdAt >= filter.dateRange.start && createdAt <= filter.dateRange.end;
                });
            }
            if (filter.qualityThreshold !== undefined) {
                results = results.filter(entry => entry.qualityScore >= filter.qualityThreshold);
            }
            results.sort((a, b) => {
                const scoreA = a.popularity * 0.6 + a.qualityScore * 0.4;
                const scoreB = b.popularity * 0.6 + b.qualityScore * 0.4;
                return scoreB - scoreA;
            });
            logger_1.logger.debug('Dataset search completed', {
                totalResults: results.length,
                filter
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to search datasets', { filter, error });
            throw new Error(`Dataset search failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getDataset(datasetId) {
        try {
            const entry = this.catalog.get(datasetId);
            if (entry) {
                entry.popularity++;
                this.catalog.set(datasetId, entry);
            }
            return entry || null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get dataset', { datasetId, error });
            throw new Error(`Dataset retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getRelatedDatasets(datasetId, limit = 10) {
        try {
            const sourceEntry = this.catalog.get(datasetId);
            if (!sourceEntry) {
                return [];
            }
            const allEntries = Array.from(this.catalog.values())
                .filter(entry => entry.dataset.id !== datasetId && entry.discoverable);
            const scored = allEntries.map(entry => ({
                entry,
                score: this.calculateSimilarity(sourceEntry, entry)
            }));
            return scored
                .sort((a, b) => b.score - a.score)
                .slice(0, limit)
                .map((item) => item.entry);
        }
        catch (error) {
            logger_1.logger.error('Failed to get related datasets', { datasetId, error });
            throw new Error(`Related datasets retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getDatasetLineage(datasetId) {
        try {
            const related = await this.getRelatedDatasets(datasetId, 5);
            return {
                upstream: related.slice(0, 2),
                downstream: related.slice(2, 4)
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get dataset lineage', { datasetId, error });
            throw new Error(`Lineage retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getCatalogStats() {
        try {
            const entries = Array.from(this.catalog.values());
            const formatDistribution = {};
            const classificationDistribution = {};
            let totalSize = 0;
            entries.forEach(entry => {
                formatDistribution[entry.dataset.format] = (formatDistribution[entry.dataset.format] || 0) + 1;
                classificationDistribution[entry.classification] = (classificationDistribution[entry.classification] || 0) + 1;
                totalSize += entry.dataset.size || 0;
            });
            const qualityDistribution = {
                high: entries.filter(e => e.qualityScore >= 0.8).length,
                medium: entries.filter(e => e.qualityScore >= 0.5 && e.qualityScore < 0.8).length,
                low: entries.filter(e => e.qualityScore < 0.5).length
            };
            const popularDatasets = entries
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, 10);
            const recentDatasets = entries
                .sort((a, b) => b.dataset.createdAt.getTime() - a.dataset.createdAt.getTime())
                .slice(0, 10);
            return {
                totalDatasets: entries.length,
                totalSize,
                formatDistribution,
                classificationDistribution,
                popularDatasets,
                recentDatasets,
                qualityDistribution
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get catalog stats', { error });
            throw new Error(`Catalog stats retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async tagDataset(datasetId, tags) {
        try {
            const entry = this.catalog.get(datasetId);
            if (!entry) {
                throw new Error(`Dataset not found: ${datasetId}`);
            }
            const newTags = Array.from(new Set([...entry.tags, ...tags]));
            entry.tags = newTags;
            this.catalog.set(datasetId, entry);
            tags.forEach(tag => {
                if (!this.tagIndex.has(tag)) {
                    this.tagIndex.set(tag, new Set());
                }
                this.tagIndex.get(tag).add(datasetId);
            });
            logger_1.logger.info('Dataset tagged successfully', {
                datasetId,
                newTags: tags,
                totalTags: newTags.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to tag dataset', { datasetId, tags, error });
            throw new Error(`Dataset tagging failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getTagSuggestions(datasetId) {
        try {
            const entry = this.catalog.get(datasetId);
            if (!entry) {
                return [];
            }
            const relatedDatasets = await this.getRelatedDatasets(datasetId, 10);
            const allTags = relatedDatasets.flatMap(dataset => dataset.tags);
            const tagCounts = new Map();
            allTags.forEach(tag => {
                if (!entry.tags.includes(tag)) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            });
            return Array.from(tagCounts.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([tag]) => tag);
        }
        catch (error) {
            logger_1.logger.error('Failed to get tag suggestions', { datasetId, error });
            return [];
        }
    }
    async loadCatalog() {
        logger_1.logger.debug('Loading catalog from storage');
    }
    async buildSearchIndexes() {
        logger_1.logger.debug('Building search indexes');
        this.searchIndex.clear();
        this.tagIndex.clear();
        this.catalog.forEach((entry, datasetId) => {
            this.updateSearchIndexesSync(entry);
        });
    }
    async updateSearchIndexes(entry) {
        this.updateSearchIndexesSync(entry);
    }
    updateSearchIndexesSync(entry) {
        const datasetId = entry.dataset.id;
        const searchTerms = [
            entry.dataset.name,
            entry.dataset.description || '',
            ...entry.tags,
            entry.owner,
            entry.steward || ''
        ];
        searchTerms.forEach(term => {
            if (term) {
                const normalizedTerm = term.toLowerCase();
                if (!this.searchIndex.has(normalizedTerm)) {
                    this.searchIndex.set(normalizedTerm, new Set());
                }
                this.searchIndex.get(normalizedTerm).add(datasetId);
            }
        });
        entry.tags.forEach(tag => {
            if (!this.tagIndex.has(tag)) {
                this.tagIndex.set(tag, new Set());
            }
            this.tagIndex.get(tag).add(datasetId);
        });
    }
    async removeFromSearchIndexes(entry) {
        const datasetId = entry.dataset.id;
        this.searchIndex.forEach((datasetSet, term) => {
            datasetSet.delete(datasetId);
            if (datasetSet.size === 0) {
                this.searchIndex.delete(term);
            }
        });
        this.tagIndex.forEach((datasetSet, tag) => {
            datasetSet.delete(datasetId);
            if (datasetSet.size === 0) {
                this.tagIndex.delete(tag);
            }
        });
    }
    async calculateQualityScore(dataset) {
        let score = 0;
        if (dataset.name && dataset.name.length > 0)
            score += 0.2;
        if (dataset.description && dataset.description.length > 10)
            score += 0.3;
        if (dataset.schema)
            score += 0.2;
        if (dataset.size && dataset.size > 0)
            score += 0.1;
        if (dataset.lastModified)
            score += 0.1;
        if (dataset.schema) {
            score += 0.1;
        }
        return Math.min(score, 1.0);
    }
    calculateSimilarity(entry1, entry2) {
        let similarity = 0;
        const commonTags = entry1.tags.filter(tag => entry2.tags.includes(tag));
        const totalTags = new Set([...entry1.tags, ...entry2.tags]).size;
        if (totalTags > 0) {
            similarity += (commonTags.length / totalTags) * 0.4;
        }
        if (entry1.dataset.format === entry2.dataset.format) {
            similarity += 0.2;
        }
        if (entry1.owner === entry2.owner || entry1.steward === entry2.steward) {
            similarity += 0.2;
        }
        if (entry1.classification === entry2.classification) {
            similarity += 0.1;
        }
        const name1 = entry1.dataset.name.toLowerCase();
        const name2 = entry2.dataset.name.toLowerCase();
        if (name1.includes(name2) || name2.includes(name1)) {
            similarity += 0.1;
        }
        return similarity;
    }
    async applyGovernancePolicies(entry) {
        const defaultPolicies = {
            'public': ['data_retention_7_years'],
            'internal': ['data_retention_5_years', 'access_logging'],
            'confidential': ['data_retention_3_years', 'access_logging', 'encryption_required'],
            'restricted': ['data_retention_1_year', 'access_logging', 'encryption_required', 'approval_required']
        };
        entry.governancePolicies = defaultPolicies[entry.classification] || [];
    }
    startBackgroundTasks() {
        setInterval(() => {
            this.updateQualityScores();
        }, 24 * 60 * 60 * 1000);
        setInterval(() => {
            this.optimizeIndexes();
        }, 7 * 24 * 60 * 60 * 1000);
    }
    async updateQualityScores() {
        try {
            for (const [datasetId, entry] of Array.from(this.catalog)) {
                const newScore = await this.calculateQualityScore(entry.dataset);
                if (Math.abs(newScore - entry.qualityScore) > 0.1) {
                    entry.qualityScore = newScore;
                    this.catalog.set(datasetId, entry);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to update quality scores', { error });
        }
    }
    async optimizeIndexes() {
        try {
            logger_1.logger.info('Optimizing catalog indexes');
            await this.buildSearchIndexes();
            logger_1.logger.info('Catalog indexes optimized');
        }
        catch (error) {
            logger_1.logger.error('Failed to optimize indexes', { error });
        }
    }
    async search(query, filters) {
        try {
            logger_1.logger.debug('Searching catalog', { query, filters });
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            const results = [];
            for (const [datasetId, entry] of this.catalog) {
                let matchScore = 0;
                const searchableText = [
                    entry.name,
                    entry.description,
                    ...(entry.tags || []),
                    entry.schema?.name || ''
                ].join(' ').toLowerCase();
                searchTerms.forEach(term => {
                    if (searchableText.includes(term)) {
                        matchScore += 1;
                    }
                });
                let passesFilters = true;
                if (filters?.tags && filters.tags.length > 0) {
                    const entryTags = entry.tags || [];
                    const hasMatchingTag = filters.tags.some(tag => entryTags.includes(tag));
                    if (!hasMatchingTag) {
                        passesFilters = false;
                    }
                }
                if (filters?.format && entry.format !== filters.format) {
                    passesFilters = false;
                }
                if (filters?.createdAfter && entry.createdAt < filters.createdAfter) {
                    passesFilters = false;
                }
                if (filters?.createdBefore && entry.createdAt > filters.createdBefore) {
                    passesFilters = false;
                }
                if (matchScore > 0 && passesFilters) {
                    results.push(entry);
                }
            }
            results.sort((a, b) => {
                const aScore = this.calculateRelevanceScore(a, searchTerms);
                const bScore = this.calculateRelevanceScore(b, searchTerms);
                return bScore - aScore;
            });
            logger_1.logger.debug('Catalog search completed', {
                query,
                resultCount: results.length
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Failed to search catalog', { query, filters, error });
            throw new Error(`Catalog search failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getLineage(datasetId) {
        try {
            logger_1.logger.debug('Getting data lineage', { datasetId });
            const entry = this.catalog.get(datasetId);
            if (!entry) {
                return null;
            }
            const lineage = {
                datasetId,
                source: datasetId,
                upstream: entry.lineage?.upstream || [],
                downstream: entry.lineage?.downstream || [],
                transformations: entry.lineage?.transformations || [],
                dependencies: this.findDependencies(datasetId),
                impact: {
                    upstreamCount: 0,
                    downstreamCount: 0,
                    criticalityScore: 0.5,
                    businessImpact: 'medium',
                    affectedSystems: [],
                    affectedUsers: [],
                    affectedDatasets: [],
                    estimatedRecords: 0,
                    recoveryTime: 60
                }
            };
            logger_1.logger.debug('Data lineage retrieved', {
                datasetId,
                dependencyCount: lineage.dependencies.length,
                transformationCount: lineage.transformations.length
            });
            return lineage;
        }
        catch (error) {
            logger_1.logger.error('Failed to get data lineage', { datasetId, error });
            throw new Error(`Lineage retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getStatistics() {
        try {
            logger_1.logger.debug('Calculating catalog statistics');
            const stats = {
                totalDatasets: this.catalog.size,
                totalSize: 0,
                formatDistribution: {},
                tagDistribution: {},
                averageDatasetSize: 0,
                recentActivity: {
                    created: 0,
                    updated: 0,
                    accessed: 0
                }
            };
            const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            for (const [_, entry] of this.catalog) {
                stats.totalSize += entry.size || 0;
                const format = entry.format || 'unknown';
                stats.formatDistribution[format] = (stats.formatDistribution[format] || 0) + 1;
                (entry.tags || []).forEach(tag => {
                    stats.tagDistribution[tag] = (stats.tagDistribution[tag] || 0) + 1;
                });
                if (entry.createdAt > oneWeekAgo) {
                    stats.recentActivity.created++;
                }
                if (entry.updatedAt > oneWeekAgo) {
                    stats.recentActivity.updated++;
                }
                if (entry.lastAccessedAt && entry.lastAccessedAt > oneWeekAgo) {
                    stats.recentActivity.accessed++;
                }
            }
            stats.averageDatasetSize = stats.totalDatasets > 0
                ? stats.totalSize / stats.totalDatasets
                : 0;
            logger_1.logger.debug('Catalog statistics calculated', {
                totalDatasets: stats.totalDatasets,
                totalSize: stats.totalSize,
                averageSize: stats.averageDatasetSize
            });
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Failed to get catalog statistics', { error });
            throw new Error(`Statistics calculation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    calculateRelevanceScore(entry, searchTerms) {
        let score = 0;
        const searchableText = [
            entry.name,
            entry.description,
            ...(entry.tags || [])
        ].join(' ').toLowerCase();
        searchTerms.forEach(term => {
            if (entry.name.toLowerCase().includes(term)) {
                score += 10;
            }
            if (entry.description?.toLowerCase().includes(term)) {
                score += 5;
            }
            if ((entry.tags || []).some(tag => tag.toLowerCase().includes(term))) {
                score += 3;
            }
        });
        return score;
    }
    findDependencies(datasetId) {
        const dependencies = [];
        for (const [id, entry] of this.catalog) {
            if (id !== datasetId && entry.lineage?.dependencies?.some(dep => dep.sourceId === datasetId || dep.targetId === datasetId)) {
                dependencies.push({
                    sourceId: id,
                    targetId: datasetId,
                    type: 'hard',
                    description: `Dependency from ${id} to ${datasetId}`,
                    lastValidated: new Date()
                });
            }
        }
        return dependencies;
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Data Catalog Manager');
        this.catalog.clear();
        this.searchIndex.clear();
        this.tagIndex.clear();
        logger_1.logger.info('Data Catalog Manager shutdown complete');
    }
}
exports.DataCatalogManager = DataCatalogManager;
exports.default = DataCatalogManager;
//# sourceMappingURL=data-catalog-manager.js.map