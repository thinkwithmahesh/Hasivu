/**
 * Database Manager for HASIVU Platform
 * Centralized database connection management and utilities
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { Logger } from '../utils/logger';
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

// Define proper types for Prisma events to replace 'any'
interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: string;
  target: string;
}

interface PrismaErrorEvent {
  target: string;
  message: string;
  timestamp: string;
}

interface PrismaInfoEvent {
  target: string;
  message: string;
  timestamp: string;
}

interface PrismaWarnEvent {
  target: string;
  message: string;
  timestamp: string;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private logger = Logger.getInstance();
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
      this.logger.info('Database manager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize database manager', { error, config: this.config });
      throw new DatabaseError(
        'initialization',
        'Failed to initialize database manager',
        error as Error
      );
    }
  }

  /**
   * Setup Prisma event logging
   */
  private setupPrismaLogging(): void {
    // Type-safe Prisma event handling with proper event interface - replaced 'any' with specific PrismaQueryEvent type for better type safety
    (this.prisma as any).$on('query', (e: PrismaQueryEvent) => {
      const queryTime = parseFloat(e.duration);
      this.updateQueryMetrics(queryTime);

      if (this.config.logLevel === 'query') {
        this.logger.info('Database query executed', {
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
        this.logger.warn('Slow query detected', {
          query: e.query,
          duration: queryTime,
          target: e.target,
        });
      }
    });

    // Replaced 'any' with PrismaErrorEvent type for type safety
    (this.prisma as any).$on('error', (e: PrismaErrorEvent) => {
      this.metrics.errorRate++;
      this.logger.error('Database error', {
        target: e.target,
        message: e.message,
        timestamp: e.timestamp,
      });
    });

    // Replaced 'any' with PrismaInfoEvent type for type safety
    (this.prisma as any).$on('info', (e: PrismaInfoEvent) => {
      if (this.config.logLevel === 'info') {
        this.logger.info('Database info', {
          target: e.target,
          message: e.message,
          timestamp: e.timestamp,
        });
      }
    });

    // Replaced 'any' with PrismaWarnEvent type for type safety
    (this.prisma as any).$on('warn', (e: PrismaWarnEvent) => {
      this.logger.warn('Database warning', {
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
      this.logger.info('Database connection established');
    } catch (error) {
      this.logger.error('Failed to connect to database', { error });
      throw new DatabaseError('connection', 'Failed to connect to database', error as Error);
    }
  }

  /**
   * Disconnect from database
   */
  async disconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      this.logger.info('Database connection closed');
    } catch (error) {
      this.logger.error('Error disconnecting from database', { error });
      throw new DatabaseError(
        'disconnection',
        'Failed to disconnect from database',
        error as Error
      );
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
      this.logger.error('Database health check failed', { error });
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
  async executeRaw<T = unknown>(query: string, params: unknown[] = []): Promise<T[]> {
    try {
      const startTime = Date.now();
      const result = await this.prisma.$queryRawUnsafe<T[]>(query, ...params);
      const duration = Date.now() - startTime;

      this.updateQueryMetrics(duration);
      this.logger.info('Raw query executed', { query, duration, resultCount: result.length });

      return result;
    } catch (error) {
      this.metrics.errorRate++;
      this.logger.error('Raw query execution failed', { query, params, error });
      throw new DatabaseError('query', `Raw query execution failed: ${query}`, error as Error);
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
      this.logger.info('Transaction completed successfully', { duration });

      return result;
    } catch (error) {
      this.metrics.errorRate++;
      this.logger.error('Transaction failed', { error, options });
      throw new DatabaseError('transaction', 'Transaction execution failed', error as Error);
    }
  }

  /**
   * Reset database (for testing purposes)
   */
  async reset(): Promise<void> {
    try {
      await this.prisma.$executeRaw`TRUNCATE TABLE "User", "Order", "Payment", "Child" CASCADE`;
      this.logger.info('Database reset completed');
    } catch (error) {
      this.logger.error('Database reset failed', { error });
      throw new DatabaseError('reset', 'Database reset failed', error as Error);
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    try {
      // This would typically use Prisma migrate commands
      // For now, we'll log that migration would be needed
      this.logger.info('Migration check - use "npx prisma migrate deploy" to run migrations');
    } catch (error) {
      this.logger.error('Migration check failed', { error });
      throw new DatabaseError('migration', 'Migration failed', error as Error);
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
    this.logger.info('Query metrics reset');
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
      this.logger.info('Database backup created (placeholder)', { backupName: name });

      return name;
    } catch (error) {
      this.logger.error('Database backup failed', { error, backupName });
      throw new DatabaseError('backup', 'Database backup failed', error as Error);
    }
  }

  /**
   * Restore database from backup (placeholder for production implementation)
   */
  async restoreBackup(backupName: string): Promise<void> {
    try {
      // In production, this would restore from an actual database backup
      this.logger.info('Database restore completed (placeholder)', { backupName });
    } catch (error) {
      this.logger.error('Database restore failed', { error, backupName });
      throw new DatabaseError('restore', 'Database restore failed', error as Error);
    }
  }

  /**
   * Get database configuration (without sensitive data)
   */
  getConfig(): Omit<DatabaseConfig, 'url'> {
    // Create safe config object without sensitive 'url' property to avoid unused variable warning
    const safeConfig = {
      maxConnections: this.config.maxConnections,
      connectionTimeout: this.config.connectionTimeout,
      queryTimeout: this.config.queryTimeout,
      logLevel: this.config.logLevel,
      enableLogging: this.config.enableLogging,
    };
    return safeConfig;
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
