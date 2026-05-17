/**
 * HASIVU Platform - Query Execution Service
 * Handles analytics query execution and data retrieval
 */

import { logger } from '../../utils/logger';
import { prisma } from '../../database/DatabaseManager';
import { AnalyticsQuery } from './types';

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
    query: AnalyticsQuery
  ): Promise<{ success: boolean; data?: unknown[]; error?: { message: string; code: string } }> {
    try {
      logger.info('Executing analytics query', { query });

      const metricRows = await prisma.analyticsMetric.findMany({
        where: {
          name: { in: query.metrics },
          createdAt: {
            gte: new Date(query.dateRange.start),
            lte: new Date(query.dateRange.end),
          },
          ...(query.filters ? this.buildMetadataFilters(query.filters) : {}),
        },
        orderBy: this.buildOrderBy(query.orderBy),
        take: Math.min(query.limit || 500, 1000),
        skip: query.offset || 0,
      });

      const data = query.groupBy
        ? this.groupMetricRows(metricRows, query.groupBy)
        : metricRows.map(metric => ({
            id: metric.id,
            metric: metric.name,
            value: metric.value,
            timestamp: metric.createdAt,
            metadata: metric.metadata || {},
          }));

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

  private static buildMetadataFilters(filters: Record<string, unknown>): Record<string, unknown> {
    const metadataFilters = Object.entries(filters).reduce(
      (acc, [key, value]) => {
        if (value === undefined || value === null) {
          return acc;
        }
        acc.push({ metadata: { path: [key], equals: value } });
        return acc;
      },
      [] as Array<Record<string, unknown>>
    );

    return metadataFilters.length > 0 ? { AND: metadataFilters } : {};
  }

  private static buildOrderBy(
    orderBy?: Array<{ field: string; direction: 'asc' | 'desc' }>
  ): Record<string, 'asc' | 'desc'> {
    const firstOrder = orderBy?.[0];
    if (!firstOrder) {
      return { createdAt: 'desc' };
    }

    const allowedFields = new Set(['name', 'value', 'createdAt']);
    return allowedFields.has(firstOrder.field)
      ? { [firstOrder.field]: firstOrder.direction }
      : { createdAt: 'desc' };
  }

  private static groupMetricRows(
    rows: Array<{ name: string; value: number; createdAt: Date; metadata: unknown }>,
    period: string
  ): unknown[] {
    const buckets = new Map<
      string,
      { metric: string; period: string; count: number; sum: number; min: number; max: number }
    >();

    for (const row of rows) {
      const bucket = this.formatPeriodBucket(row.createdAt, period);
      const key = `${row.name}:${bucket}`;
      const existing = buckets.get(key);

      if (existing) {
        existing.count += 1;
        existing.sum += row.value;
        existing.min = Math.min(existing.min, row.value);
        existing.max = Math.max(existing.max, row.value);
      } else {
        buckets.set(key, {
          metric: row.name,
          period: bucket,
          count: 1,
          sum: row.value,
          min: row.value,
          max: row.value,
        });
      }
    }

    return Array.from(buckets.values()).map(bucket => ({
      ...bucket,
      average: bucket.count > 0 ? bucket.sum / bucket.count : 0,
    }));
  }

  private static formatPeriodBucket(date: Date, period: string): string {
    const d = new Date(date);
    if (period === 'hour') {
      d.setMinutes(0, 0, 0);
    } else if (period === 'day') {
      d.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    } else if (period === 'quarter') {
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
      d.setHours(0, 0, 0, 0);
    } else if (period === 'year') {
      d.setMonth(0, 1);
      d.setHours(0, 0, 0, 0);
    }
    return d.toISOString();
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
