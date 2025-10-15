/**
 * Database Manager for HASIVU Platform
 * Centralized database connection management and utilities
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  logLevel?: 'info' | 'query' | 'warn' | 'error';
  enableLogging?: boolean;
}

export interface ConnectionStatus {
  isConnected: boolean;
  activeConnections: number;
  maxConnections: number;
  lastHealthCheck: Date;
  uptime: number;
}

export interface QueryMetrics {
  totalQueries: number;
  avgExecutionTime: number;
  slowQueries: number;
  errorRate: number;
  lastReset: Date;
}

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
  maxWait?: number;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma!: PrismaClient;
  private config: DatabaseConfig;
  private startTime: Date;
  private metrics: QueryMetrics;
  private isInitialized = false;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.startTime = new Date();
    this.metrics = {
      totalQueries: 0,
      avgExecutionTime: 0,
      slowQueries: 0,
      errorRate: 0,
      lastReset: new Date(),
    };

    this.initializePrisma();
  }

  public static getInstance(config?: DatabaseConfig): DatabaseManager {
    if (!DatabaseManager.instance) {
      if (!config) {
        throw new Error('DatabaseManager requires configuration on first initialization');
      }
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize Prisma client with configuration
   */
  private initializePrisma(): void {
    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: this.config.url,
          },
        },
        log: this.config.enableLogging
          ? [
              { emit: 'event', level: 'query' },
              { emit: 'event', level: 'error' },
              { emit: 'event', level: 'info' },
              { emit: 'event', level: 'warn' },
            ]
          : [],
        errorFormat: 'pretty',
      });

      if (this.config.enableLogging) {
        this.setupPrismaLogging();
      }

      this.isInitialized = true;
      logger.info('Database manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database manager', error as Error, {
        config: this.config,
      });
      throw new DatabaseError('Failed to initialize database manager', 'INITIALIZATION_ERROR');
    }
  }

  /**
   * Setup Prisma event logging
   */
  private setupPrismaLogging(): void {
    // Type-safe Prisma event handling with proper event interface
    (this.prisma as any).$on('query', (e: any) => {
      const queryTime = parseFloat(e.duration);
      this.updateQueryMetrics(queryTime);

      if (this.config.logLevel === 'query') {
        logger.info('Database query executed', {
          query: e.query,
          params: e.params,
          duration: queryTime,
          target: e.target,
        });
      }

      // Log slow queries
      if (queryTime > 1000) {
        // 1 second threshold
        this.metrics.slowQueries++;
        logger.warn('Slow query detected', {
          query: e.query,
          duration: queryTime,
          target: e.target,
        });
      }
    });

    (this.prisma as any).$on('error', (e: any) => {
      this.metrics.errorRate++;
      logger.error('Database error', undefined, {
        target: e.target,
        message: e.message,
        timestamp: e.timestamp,
      });
    });

    (this.prisma as any).$on('info', (e: any) => {
      if (this.config.logLevel === 'info') {
        logger.info('Database info', {
          target: e.target,
          message: e.message,
          timestamp: e.timestamp,
        });
      }
    });

    (this.prisma as any).$on('warn', (e: any) => {
      logger.warn('Database warning', {
        target: e.target,
        message: e.message,
        timestamp: e.timestamp,
      });
    });
  }

  /**
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
    if (!this.isInitialized) {
      throw new DatabaseError('connection', 'Database manager not initialized');
    }
    return this.prisma;
  }

  /**
   * Connect to database
   */
  async connect(): Promise<void> {
    try {
      await this.prisma.$connect();
      logger.info('Database connection established');
    } catch (error) {
      logger.error('Failed to connect to database', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Failed to connect to database', 'CONNECTION_ERROR');
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error('Error disconnecting from database', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Failed to disconnect from database', 'DISCONNECTION_ERROR');
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<ConnectionStatus> {
    try {
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;

      const uptime = Date.now() - this.startTime.getTime();

      return {
        isConnected: true,
        activeConnections: 1, // Prisma manages connection pooling internally
        maxConnections: this.config.maxConnections || 10,
        lastHealthCheck: new Date(),
        uptime: Math.floor(uptime / 1000), // Convert to seconds
      };
    } catch (error) {
      logger.error('Database health check failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      return {
        isConnected: false,
        activeConnections: 0,
        maxConnections: this.config.maxConnections || 10,
        lastHealthCheck: new Date(),
        uptime: 0,
      };
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRaw<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      const startTime = Date.now();
      const result = await this.prisma.$queryRawUnsafe<T[]>(query, ...params);
      const duration = Date.now() - startTime;

      this.updateQueryMetrics(duration);
      logger.info('Raw query executed', { query, duration, resultCount: result.length });

      return result;
    } catch (error) {
      this.metrics.errorRate++;
      logger.error('Raw query execution failed', error as Error, { query, params });
      throw new DatabaseError(`Raw query execution failed: ${query}`, 'QUERY_ERROR');
    }
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    try {
      const startTime = Date.now();
      const result = await this.prisma.$transaction(callback, {
        timeout: options?.timeout || this.config.queryTimeout || 5000,
        isolationLevel: options?.isolationLevel,
        maxWait: options?.maxWait || 2000,
      });

      const duration = Date.now() - startTime;
      this.updateQueryMetrics(duration);
      logger.info('Transaction completed successfully', { duration });

      return result;
    } catch (error) {
      this.metrics.errorRate++;
      logger.error('Transaction failed', error as Error, { options });
      throw new DatabaseError('Transaction execution failed', 'TRANSACTION_ERROR');
    }
  }

  /**
   * Reset database (for testing purposes)
   */
  async reset(): Promise<void> {
    try {
      await this.prisma.$executeRaw`TRUNCATE TABLE "User", "Order", "Payment", "Child" CASCADE`;
      logger.info('Database reset completed');
    } catch (error) {
      logger.error('Database reset failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Database reset failed', 'RESET_ERROR');
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    try {
      // This would typically use Prisma migrate commands
      // For now, we'll log that migration would be needed
      logger.info('Migration check - use "npx prisma migrate deploy" to run migrations');
    } catch (error) {
      logger.error('Migration check failed', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw new DatabaseError('Migration failed', 'MIGRATION_ERROR');
    }
  }

  /**
   * Get query metrics
   */
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset query metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalQueries: 0,
      avgExecutionTime: 0,
      slowQueries: 0,
      errorRate: 0,
      lastReset: new Date(),
    };
    logger.info('Query metrics reset');
  }

  /**
   * Update query execution metrics
   */
  private updateQueryMetrics(duration: number): void {
    const oldTotal = this.metrics.totalQueries;
    const oldAvg = this.metrics.avgExecutionTime;

    this.metrics.totalQueries++;
    this.metrics.avgExecutionTime = (oldAvg * oldTotal + duration) / this.metrics.totalQueries;
  }

  /**
   * Create database backup (placeholder for production implementation)
   */
  async createBackup(backupName?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const name = backupName || `backup_${timestamp}`;

      // In production, this would create an actual database backup
      logger.info('Database backup created (placeholder)', { backupName: name });

      return name;
    } catch (error) {
      logger.error('Database backup failed', error as Error, { backupName });
      throw new DatabaseError('Database backup failed', 'BACKUP_ERROR');
    }
  }

  /**
   * Restore database from backup (placeholder for production implementation)
   */
  async restoreBackup(backupName: string): Promise<void> {
    try {
      // In production, this would restore from an actual database backup
      logger.info('Database restore completed (placeholder)', { backupName });
    } catch (error) {
      logger.error('Database restore failed', error as Error, { backupName });
      throw new DatabaseError('Database restore failed', 'RESTORE_ERROR');
    }
  }

  /**
   * Get database configuration (without sensitive data)
   */
  getConfig(): Omit<DatabaseConfig, 'url'> {
    const { url, ...safeConfig } = this.config;
    return safeConfig;
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get Prisma client instance for direct access
   */
  getPrismaClient(): PrismaClient {
    if (!this.isInitialized) {
      throw new DatabaseError(
        'Database not initialized. Call initialize() first.',
        'NOT_INITIALIZED'
      );
    }
    return this.prisma;
  }
}

/**
 * Export a convenience function to get the Prisma client
 * Note: Database must be initialized before using this
 */
export function getPrismaClient(): PrismaClient {
  const dbManager = DatabaseManager.getInstance();
  return dbManager.getPrismaClient();
}

/**
 * Export singleton Prisma client instance
 * This will be initialized when DatabaseManager.initialize() is called
 */
let prismaInstance: PrismaClient | null = null;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!prismaInstance) {
      try {
        prismaInstance = DatabaseManager.getInstance().getPrismaClient();
      } catch (error) {
        // Return a mock that throws on actual usage
        return () => {
          throw new Error(
            'Database not initialized. Call DatabaseManager.getInstance().initialize() first.'
          );
        };
      }
    }
    return (prismaInstance as any)[prop];
  },
});
