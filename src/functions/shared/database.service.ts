/**
 * Lambda-Optimized Database Service
 * Prisma client with connection pooling optimized for AWS Lambda cold starts
 * Migration from Express-based database service
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Global variable to cache the Prisma client between Lambda invocations
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined; // eslint-disable-line no-var
}

/**
 * Lambda-optimized database service class
 * Uses global connection caching to minimize cold start impact
 */
export class LambdaDatabaseService {
  private static instance: LambdaDatabaseService;
  private _prisma: PrismaClient;

  private constructor() {
    this._prisma = this.createPrismaClient();
  }

  /**
   * Get singleton instance (optimized for Lambda)
   */
  public static getInstance(): LambdaDatabaseService {
    if (!LambdaDatabaseService.instance) {
      LambdaDatabaseService.instance = new LambdaDatabaseService();
    }
    return LambdaDatabaseService.instance;
  }

  /**
   * Create Prisma client with Lambda-optimized configuration
   */
  private createPrismaClient(): PrismaClient {
    // Reuse connection if available (Lambda warm start)
    if (global.__prisma__) {
      return global.__prisma__;
    }

    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const enhancedUrl = this.enhanceDatabaseUrlForLambda(databaseUrl);

    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: enhancedUrl,
        },
      },
      log: this.getLogConfig(),
      errorFormat: 'minimal', // Reduce payload size
    });

    // Cache globally for Lambda warm starts
    global.__prisma__ = prisma;

    return prisma;
  }

  /**
   * Enhance database URL for Lambda execution environment
   */
  private enhanceDatabaseUrlForLambda(url: string): string {
    try {
      const dbUrl = new URL(url);

      // Add connection pooling parameters optimized for serverless
      const searchParams = new URLSearchParams(dbUrl.search);

      // Serverless-optimized connection settings
      if (!searchParams.has('connection_limit')) {
        searchParams.set('connection_limit', '1'); // Single connection per Lambda
      }
      if (!searchParams.has('pool_timeout')) {
        searchParams.set('pool_timeout', '20'); // 20 seconds timeout
      }
      if (!searchParams.has('connect_timeout')) {
        searchParams.set('connect_timeout', '20'); // 20 seconds connect timeout
      }
      if (!searchParams.has('statement_cache_size')) {
        searchParams.set('statement_cache_size', '100'); // Cache prepared statements
      }

      dbUrl.search = searchParams.toString();
      return dbUrl.toString();
    } catch (error) {
      // If URL parsing fails, return original URL
      return url;
    }
  }

  /**
   * Get logging configuration for Lambda
   */
  private getLogConfig(): Prisma.LogLevel[] {
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      return ['warn', 'error'];
    } else {
      return ['query', 'info', 'warn', 'error'];
    }
  }

  /**
   * Get Prisma client instance
   */
  public get client(): PrismaClient {
    return this._prisma;
  }

  /**
   * Get Prisma client instance (alias for backwards compatibility)
   */
  public get prisma(): PrismaClient {
    return this._prisma;
  }

  /**
   * Convenient access to all Prisma models
   */
  public get user() {
    return this.prisma.user;
  }

  public get school() {
    return this.prisma.school;
  }

  public get parentChild() {
    return this.prisma.parentChild;
  }

  public get role() {
    return this.prisma.role;
  }

  public get userRoleAssignment() {
    return this.prisma.userRoleAssignment;
  }

  public get auditLog() {
    return this.prisma.auditLog;
  }

  public get authSession() {
    return this.prisma.authSession;
  }

  // Note: Students are represented by User model with role='student'

  public get order() {
    return this.prisma.order;
  }

  public get paymentTransaction() {
    return this.prisma.paymentTransaction;
  }

  public get rfidCard() {
    return this.prisma.rFIDCard;
  }

  public get whatsappMessage() {
    return this.prisma.whatsAppMessage;
  }

  // Menu management models - these will be added based on actual Prisma schema
  // public get menuItem() {
  //   return this.prisma.menuItem;
  // }

  // public get menuPlan() {
  //   return this.prisma.menuPlan;
  // }

  // public get dailyMenu() {
  //   return this.prisma.dailyMenu;
  // }

  // public get mealSlot() {
  //   return this.prisma.mealSlot;
  // }

  // public get menuItemSlot() {
  //   return this.prisma.menuItemSlot;
  // }

  // Note: These models will be added in future stories
  // public get product() { return this.prisma.product; }
  // public get orderItem() { return this.prisma.orderItem; }
  // public get notification() { return this.prisma.notification; }

  /**
   * Execute transaction with Lambda-appropriate timeouts
   */
  public async transaction<T>(
    fn: (prisma: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    }
  ): Promise<T> {
    const transactionOptions = {
      maxWait: options?.maxWait || 5000, // 5 seconds max wait
      timeout: options?.timeout || 25000, // 25 seconds timeout (within Lambda limit)
      isolationLevel: options?.isolationLevel,
    };

    return await this.prisma.$transaction(fn, transactionOptions);
  }

  /**
   * Test database connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get health status for Lambda functions
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    connected: boolean;
    latency: number;
    details?: string;
  }> {
    const startTime = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        connected: true,
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      return {
        status: 'unhealthy',
        connected: false,
        latency,
        details: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Execute raw SQL query (with type safety)
   */
  public async queryRaw<T = any>(sql: TemplateStringsArray, ...values: any[]): Promise<T[]> {
    return await this.prisma.$queryRaw(sql, ...values);
  }

  /**
   * Execute raw SQL command (for DDL operations)
   */
  public async executeRaw(sql: TemplateStringsArray, ...values: any[]): Promise<number> {
    return await this.prisma.$executeRaw(sql, ...values);
  }

  /**
   * Check if database is ready for queries
   */
  public async isReady(): Promise<boolean> {
    try {
      await this.prisma.$connect();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Graceful cleanup for Lambda function end
   */
  public async cleanup(): Promise<void> {
    try {
      await this.prisma.$disconnect();
    } catch (error) {
      // Error handled silently
    }
  }

  /**
   * Force disconnect (for testing or emergency situations)
   */
  public async forceDisconnect(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      // Clear global cache to force new connection
      global.__prisma__ = undefined;
    } catch (error) {
      // Error handled silently
    }
  }
}

// Export singleton instance
export const DatabaseService = LambdaDatabaseService.getInstance();

// Export types for convenience
export type { PrismaClient, Prisma } from '@prisma/client';

// Default export
export default DatabaseService;
