import { PrismaClient, Prisma } from '@prisma/client';
export declare class DatabaseService {
    private static instance;
    client: PrismaClient;
    private constructor();
    static getInstance(): DatabaseService;
    static get client(): PrismaClient;
    static transaction<T>(fn: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T>;
    transaction<T>(fn: (prisma: Prisma.TransactionClient) => Promise<T>): Promise<T>;
    healthCheck(): Promise<{
        healthy: boolean;
        latency?: number;
    }>;
    executeRaw(query: string, ...params: any[]): Promise<any>;
    queryRaw<T = any>(query: string, ...params: any[]): Promise<T>;
    query<T = any>(query: string, params?: any[]): Promise<{
        rows: T[];
    }>;
    disconnect(): Promise<void>;
    connect(): Promise<void>;
    getHealth(): Promise<{
        status: 'healthy' | 'warning' | 'error';
        responseTime: number;
        connections: unknown;
        performance: unknown;
        tables: unknown[];
        errors: string[];
        timestamp: Date;
    }>;
    sanitizeQuery(query: string | unknown): string | unknown;
    get user(): Prisma.UserDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get order(): Prisma.OrderDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get menuItem(): Prisma.MenuItemDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get orderItem(): Prisma.OrderItemDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get paymentOrder(): Prisma.PaymentOrderDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get rfidCard(): Prisma.RFIDCardDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get rfidReader(): Prisma.RFIDReaderDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get deliveryVerification(): Prisma.DeliveryVerificationDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get notification(): Prisma.NotificationDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
    get whatsAppMessage(): Prisma.WhatsAppMessageDelegate<import(".prisma/client/runtime/library").DefaultArgs, Prisma.PrismaClientOptions>;
}
export declare const databaseService: DatabaseService;
export default DatabaseService;
//# sourceMappingURL=database.service.d.ts.map