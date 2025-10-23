"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryExecutionService = exports.QueryExecutionService = void 0;
const logger_1 = require("../../utils/logger");
const DatabaseManager_1 = require("../../database/DatabaseManager");
class QueryExecutionService {
    static async executeQuery(query) {
        try {
            logger_1.logger.info('Executing analytics query', { query });
            const data = [];
            return { success: true, data };
        }
        catch (error) {
            logger_1.logger.error('Analytics query execution failed', error, { query });
            return {
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Analytics query execution failed',
                    code: 'QUERY_EXECUTION_ERROR',
                },
            };
        }
    }
    static calculatePeriodRange(period) {
        const end = new Date();
        const start = new Date();
        switch (period) {
            case 'hour':
                start.setHours(start.getHours() - 1);
                break;
            case 'day':
                start.setDate(start.getDate() - 1);
                break;
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setDate(start.getDate() - 1);
        }
        return { start, end };
    }
    async executeQuery(model, options) {
        try {
            const prismaModel = DatabaseManager_1.prisma[model];
            if (!prismaModel) {
                throw new Error(`Model ${model} not found in Prisma client`);
            }
            logger_1.logger.info('Executing query', { model, options });
            const results = await prismaModel.findMany(options);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Query execution failed', error, { model, options });
            throw error;
        }
    }
    async executeAggregation(model, aggregations) {
        try {
            const prismaModel = DatabaseManager_1.prisma[model];
            if (!prismaModel) {
                throw new Error(`Model ${model} not found in Prisma client`);
            }
            logger_1.logger.info('Executing aggregation', { model, aggregations });
            const result = await prismaModel.aggregate(aggregations);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Aggregation failed', error, { model, aggregations });
            throw error;
        }
    }
    async executeGroupBy(model, options) {
        try {
            const prismaModel = DatabaseManager_1.prisma[model];
            if (!prismaModel) {
                throw new Error(`Model ${model} not found in Prisma client`);
            }
            logger_1.logger.info('Executing group by', { model, options });
            const results = await prismaModel.groupBy(options);
            return results;
        }
        catch (error) {
            logger_1.logger.error('Group by failed', error, { model, options });
            throw error;
        }
    }
    async executeCount(model, where) {
        try {
            const prismaModel = DatabaseManager_1.prisma[model];
            if (!prismaModel) {
                throw new Error(`Model ${model} not found in Prisma client`);
            }
            logger_1.logger.info('Executing count', { model, where });
            const count = await prismaModel.count({ where });
            return count;
        }
        catch (error) {
            logger_1.logger.error('Count query failed', error, { model, where });
            throw error;
        }
    }
    async executeRawQuery(query, params) {
        try {
            logger_1.logger.info('Executing raw query', { query, params });
            const results = await DatabaseManager_1.prisma.$queryRawUnsafe(query, ...(params || []));
            return results;
        }
        catch (error) {
            logger_1.logger.error('Raw query failed', error, { query, params });
            throw error;
        }
    }
    async executeTransaction(operations) {
        try {
            logger_1.logger.info('Executing transaction', { operationCount: operations.length });
            const results = await DatabaseManager_1.prisma.$transaction(async (_tx) => {
                const txResults = [];
                for (const op of operations) {
                    const result = await op();
                    txResults.push(result);
                }
                return txResults;
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Transaction failed', undefined, {
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
}
exports.QueryExecutionService = QueryExecutionService;
exports.queryExecutionService = new QueryExecutionService();
//# sourceMappingURL=query-execution.js.map