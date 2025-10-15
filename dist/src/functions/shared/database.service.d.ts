import { PrismaClient, Prisma } from '@prisma/client';
declare global {
    var __prisma__: PrismaClient | undefined;
}
export declare class LambdaDatabaseService {
    private static instance;
    private _prisma;
    private constructor();
    static getInstance(): LambdaDatabaseService;
    private createPrismaClient;
    private enhanceDatabaseUrlForLambda;
    private getLogConfig;
    get client(): PrismaClient;
    get prisma(): PrismaClient;
    get user(): Prisma.UserDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get school(): Prisma.SchoolDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get parentChild(): Prisma.ParentChildDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get role(): Prisma.RoleDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get userRoleAssignment(): Prisma.UserRoleAssignmentDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get auditLog(): Prisma.AuditLogDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get authSession(): Prisma.AuthSessionDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get order(): Prisma.OrderDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get paymentTransaction(): Prisma.PaymentTransactionDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get rfidCard(): Prisma.RFIDCardDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get whatsappMessage(): Prisma.WhatsAppMessageDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    transaction<T>(fn: (prisma: Prisma.TransactionClient) => Promise<T>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): Promise<T>;
    testConnection(): Promise<boolean>;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'unhealthy';
        connected: boolean;
        latency: number;
        details?: string;
    }>;
    queryRaw<T = any>(sql: TemplateStringsArray, ...values: any[]): Promise<T[]>;
    executeRaw(sql: TemplateStringsArray, ...values: any[]): Promise<number>;
    isReady(): Promise<boolean>;
    cleanup(): Promise<void>;
    forceDisconnect(): Promise<void>;
}
export declare const DatabaseService: LambdaDatabaseService;
export type { PrismaClient, Prisma } from '@prisma/client';
export default DatabaseService;
//# sourceMappingURL=database.service.d.ts.map