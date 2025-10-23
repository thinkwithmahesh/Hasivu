import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { LoggingService } from '@/services/logging.service';
declare let testPrisma: PrismaClient;
declare let testRedis: Redis | null;
declare let testLogger: LoggingService;
export declare const IntegrationTestConfig: {
    database: {
        url: string;
        schema: string;
        maxConnections: number;
        connectionTimeout: number;
    };
    redis: {
        host: string;
        port: number;
        password: string | undefined;
        db: number;
        keyPrefix: string;
    };
    aws: {
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        s3Bucket: string;
        sesRegion: string;
    };
    razorpay: {
        keyId: string;
        keySecret: string;
        webhookSecret: string;
    };
    server: {
        port: number;
        host: string;
        jwtSecret: string;
        sessionSecret: string;
    };
    email: {
        testEmail: string;
        testPassword: string;
        smtpHost: string;
        smtpPort: number;
    };
};
export declare function initTestDatabase(): Promise<PrismaClient>;
export declare function cleanTestDatabase(): Promise<void>;
export declare function initTestRedis(): Promise<Redis | null>;
export declare function cleanTestRedis(): Promise<void>;
export declare function initTestAWS(): void;
export declare function createTestUser(overrides?: Partial<any>): Promise<any>;
export declare function createTestRestaurant(userId: string, overrides?: Partial<any>): Promise<any>;
export declare function setupIntegrationTests(): Promise<{
    prisma: PrismaClient;
    redis: Redis | null;
    logger: LoggingService;
}>;
export declare function teardownIntegrationTests(): Promise<void>;
export declare function waitForService(serviceName: string, checkFunction: () => Promise<boolean>, maxRetries?: number, delayMs?: number): Promise<void>;
export declare function generateTestJWT(payload: any, expiresIn?: string): string;
export declare function setupMockRequests(): void;
export { testPrisma, testRedis, testLogger };
//# sourceMappingURL=setup-integration.d.ts.map