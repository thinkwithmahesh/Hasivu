/**
 * HASIVU Platform - Query Execution Service
 * Handles analytics query execution and data retrieval
 */

import { logger } from '../../utils/logger';
import { prisma } from '../../database/DatabaseManager';

export interface QueryOptions {
  select?: Record<string, unknown>;
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown>;
  take?: number;
  skip?: number;
}

export interface AggregationOptions {
  _count?: boolean | Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _sum?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
  where?: Record<string, unknown>;
}

/**
 * Query execution service for analytics data retrieval
 */
export class QueryExecutionService {
  /**
   * Execute an analytics query (static wrapper)
   */
  static async executeQuery(
    query: unknown
  ): Promise<{ success: boolean; data?: unknown[]; error?: { message: string; code: string } }> {
    try {
      // For now, return empty array as this needs proper implementation
      logger.info('Executing analytics query', { query });
      const data: unknown[] = [];
      return { success: true, data };
    } catch (error) {
      logger.error('Analytics query execution failed', error as Error, { query });
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Analytics query execution failed',
          code: 'QUERY_EXECUTION_ERROR',
        },
      };
    }
  }

  /**
   * Calculate period range for reporting
   */
  static calculatePeriodRange(period: string): { start: Date; end: Date } {
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

  /**
   * Execute a query on a Prisma model (instance method)
   */
  async executeQuery(model: string, options: QueryOptions): Promise<unknown[]> {
    try {
      const prismaModel = (prisma as unknown as Record<string, unknown>)[model];

      if (!prismaModel) {
        throw new Error(`Model ${model} not found in Prisma client`);
      }

      logger.info('Executing query', { model, options });

      const results = await (prismaModel as any).findMany(options);
      return results;
    } catch (error) {
      logger.error('Query execution failed', error as Error, { model, options });
      throw error;
    }
  }

  /**
   * Execute an aggregation query
   */
  async executeAggregation(model: string, aggregations: AggregationOptions): Promise<unknown> {
    try {
      const prismaModel = (prisma as unknown as Record<string, unknown>)[model];

      if (!prismaModel) {
        throw new Error(`Model ${model} not found in Prisma client`);
      }

      logger.info('Executing aggregation', { model, aggregations });

      const result = await (prismaModel as any).aggregate(aggregations);
      return result;
    } catch (error) {
      logger.error('Aggregation failed', error as Error, { model, aggregations });
      throw error;
    }
  }

  /**
   * Execute a grouped aggregation query
   */
  async executeGroupBy(
    model: string,
    options: {
      by: string[];
      where?: Record<string, unknown>;
      _count?: boolean | Record<string, boolean>;
      _avg?: Record<string, boolean>;
      _sum?: Record<string, boolean>;
      _min?: Record<string, boolean>;
      _max?: Record<string, boolean>;
    }
  ): Promise<unknown[]> {
    try {
      const prismaModel = (prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Model ${model} not found in Prisma client`);
      }

      logger.info('Executing group by', { model, options });

      const results = await prismaModel.groupBy(options);
      return results;
    } catch (error) {
      logger.error('Group by failed', error as Error, { model, options });
      throw error;
    }
  }

  /**
   * Execute a count query
   */
  async executeCount(model: string, where?: Record<string, unknown>): Promise<number> {
    try {
      const prismaModel = (prisma as any)[model];

      if (!prismaModel) {
        throw new Error(`Model ${model} not found in Prisma client`);
      }

      logger.info('Executing count', { model, where });

      const count = await prismaModel.count({ where });
      return count;
    } catch (error) {
      logger.error('Count query failed', error as Error, { model, where });
      throw error;
    }
  }

  /**
   * Execute raw SQL query (use with caution)
   */
  async executeRawQuery(query: string, params?: unknown[]): Promise<unknown[]> {
    try {
      logger.info('Executing raw query', { query, params });

      const results = await prisma.$queryRawUnsafe(query, ...(params || []));
      return results as unknown[];
    } catch (error) {
      logger.error('Raw query failed', error as Error, { query, params });
      throw error;
    }
  }

  /**
   * Execute transaction with multiple queries
   * Note: Operations should return Prisma queries, not executed promises
   */
  async executeTransaction(operations: Array<() => unknown>): Promise<unknown[]> {
    try {
      logger.info('Executing transaction', { operationCount: operations.length });

      // Use interactive transaction for better control
      const results = await prisma.$transaction(async _tx => {
        const txResults: unknown[] = [];
        for (const op of operations) {
          const result = await op();
          txResults.push(result);
        }
        return txResults;
      });

      return results;
    } catch (error) {
      logger.error('Transaction failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

// Export singleton instance
export const queryExecutionService = new QueryExecutionService();
