/**
 * Database Manager for HASIVU Platform
 * Simplified database connection management
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { DatabaseError } from '../utils/errors';

export interface DatabaseConfig {
  url: string;
  logLevel?: 'info' | 'query' | 'warn' | 'error';
}

export interface ConnectionStatus {
  isConnected: boolean;
  lastHealthCheck: Date;
}

export interface TransactionOptions {
  timeout?: number;
  isolationLevel?: Prisma.TransactionIsolationLevel;
  maxWait?: number;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private prisma: PrismaClient;
  private config: DatabaseConfig;
  private isInitialized = false;

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.config.url,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
    this.isInitialized = true;
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
   * Get Prisma client instance
   */
  public getClient(): PrismaClient {
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
      logger.error('Failed to connect to database', error as Error);
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
      logger.error('Error disconnecting from database', error as Error);
      throw new DatabaseError('Failed to disconnect from database', 'DISCONNECTION_ERROR');
    }
  }

  /**
   * Check database health
   */
  async healthCheck(): Promise<ConnectionStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        isConnected: true,
        lastHealthCheck: new Date(),
      };
    } catch (error) {
      logger.error('Database health check failed', error as Error);
      return {
        isConnected: false,
        lastHealthCheck: new Date(),
      };
    }
  }

  /**
   * Execute raw SQL query
   */
  async executeRaw<T = any>(query: string, params: any[] = []): Promise<T[]> {
    try {
      return await this.prisma.$queryRawUnsafe<T[]>(query, ...params);
    } catch (error) {
      logger.error('Raw query execution failed', error as Error, { query });
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
      return await this.prisma.$transaction(callback, {
        timeout: options?.timeout || 5000,
        isolationLevel: options?.isolationLevel,
        maxWait: options?.maxWait || 2000,
      });
    } catch (error) {
      logger.error('Transaction failed', error as Error);
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
      logger.error('Database reset failed', error as Error);
      throw new DatabaseError('Database reset failed', 'RESET_ERROR');
    }
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
    return this.prisma;
  }
}

/**
 * Export singleton Prisma client instance
 */
export const prisma = DatabaseManager.getInstance({
  url: process.env.DATABASE_URL || '',
}).getClient();
