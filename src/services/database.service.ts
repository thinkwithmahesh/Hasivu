/**
 * Database Service
 * Centralized database operations and connection management
 */

import { PrismaClient, Prisma } from '@prisma/client';

export class DatabaseService {
  private static instance: DatabaseService;
  public client: PrismaClient;

  private constructor() {
    this.client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Static getter for Prisma client
   */
  public static get client(): PrismaClient {
    return DatabaseService.getInstance().client;
  }

  /**
   * Static transaction method
   */
  public static async transaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>
  ): Promise<T> {
    return await DatabaseService.getInstance().transaction(fn);
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  public async transaction<T>(fn: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return await this.client.$transaction(fn);
  }

  /**
   * Health check for database connection
   */
  public async healthCheck(): Promise<{ healthy: boolean; latency?: number }> {
    try {
      const startTime = Date.now();
      await this.client.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      return { healthy: true, latency };
    } catch (error) {
      return { healthy: false };
    }
  }

  /**
   * Execute raw SQL query
   */
  public async executeRaw(query: string, ...params: any[]): Promise<any> {
    return await this.client.$executeRaw(Prisma.raw(query), ...params);
  }

  /**
   * Query raw SQL
   */
  public async queryRaw<T = any>(query: string, ...params: any[]): Promise<T> {
    return await this.client.$queryRaw(Prisma.raw(query), ...params);
  }

  /**
   * Execute raw SQL query with PostgreSQL-style result format
   * Returns result with 'rows' property for compatibility
   */
  public async query<T = any>(query: string, params: any[] = []): Promise<{ rows: T[] }> {
    const result = await this.client.$queryRaw<T[]>(Prisma.raw(query), ...params);
    return { rows: result };
  }

  /**
   * Disconnect from database
   */
  public async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }

  /**
   * Connect to database
   */
  public async connect(): Promise<void> {
    await this.client.$connect();
  }

  /**
   * Get database health status
   */
  public async getHealth(): Promise<{
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: unknown;
    performance: unknown;
    tables: unknown[];
    errors: string[];
    timestamp: Date;
  }> {
    try {
      const startTime = Date.now();
      await this.client.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      // Get basic connection info
      const connections = {
        active: 1, // Simplified for now
        idle: 0,
        total: 1,
      };

      // Basic performance metrics
      const performance = {
        queryTime: responseTime,
        connectionTime: responseTime,
      };

      // Get table list (simplified)
      const tables = ['user', 'order', 'menuItem', 'orderItem', 'paymentOrder'];

      return {
        status: 'healthy',
        responseTime,
        connections,
        performance,
        tables,
        errors: [],
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        responseTime: 0,
        connections: null,
        performance: null,
        tables: [],
        errors: [error.message || 'Database health check failed'],
        timestamp: new Date(),
      };
    }
  }

  /**
   * Sanitize query input
   */
  public sanitizeQuery(query: string | unknown): string | unknown {
    if (typeof query === 'string') {
      // Basic sanitization - remove dangerous keywords
      return query
        .replace(/DROP\s+/gi, '')
        .replace(/DELETE\s+/gi, '')
        .replace(/TRUNCATE\s+/gi, '');
    }
    return query;
  }

  /**
   * Model accessors for backward compatibility
   */
  public get user() {
    return this.client.user;
  }

  public get order() {
    return this.client.order;
  }

  public get menuItem() {
    return this.client.menuItem;
  }

  public get orderItem() {
    return this.client.orderItem;
  }

  public get paymentOrder() {
    return this.client.paymentOrder;
  }

  public get rfidCard() {
    return this.client.rFIDCard;
  }

  public get rfidReader() {
    return this.client.rFIDReader;
  }

  public get deliveryVerification() {
    return this.client.deliveryVerification;
  }

  public get notification() {
    return this.client.notification;
  }

  public get whatsAppMessage() {
    return this.client.whatsAppMessage;
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export for direct access
export default DatabaseService;
