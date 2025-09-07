/// <reference types="node" />
import { PrismaClient, Prisma } from '@prisma/client';
import { EventEmitter } from 'events';
export interface DatabaseHealth {
    status: 'healthy' | 'warning' | 'error';
    responseTime: number;
    connections: {
        active: number;
        idle: number;
        total: number;
        maxConnections: number;
    };
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        connectionPoolUsage: number;
    };
    tables: Array<{
        name: string;
        rowCount: number;
        size: string;
    }>;
    errors: string[];
    timestamp: Date;
}
export interface DatabaseStats {
    totalQueries: number;
    avgResponseTime: number;
    slowQueries: number;
    failedQueries: number;
    connectionMetrics: {
        activeConnections: number;
        totalConnections: number;
        poolUtilization: number;
    };
}
export type TransactionCallback<T> = (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>) => Promise<T>;
export declare class DatabaseService extends EventEmitter {
    private static instance;
    private prismaClient;
    private queryStats;
    private healthCheckInterval?;
    private readonly SLOW_QUERY_THRESHOLD;
    private readonly HEALTH_CHECK_INTERVAL;
    constructor();
    static getInstance(): DatabaseService;
    static get client(): PrismaClient;
    static get query(): PrismaClient;
    static connect(): Promise<void>;
    get school(): Prisma.SchoolDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get user(): Prisma.UserDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get menuItem(): Prisma.MenuItemDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get order(): Prisma.OrderDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get orderItem(): Prisma.OrderItemDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get paymentOrder(): Prisma.PaymentOrderDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get rfidCard(): Prisma.RFIDCardDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get rfidReader(): Prisma.RFIDReaderDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get deliveryVerification(): Prisma.DeliveryVerificationDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get notification(): Prisma.NotificationDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get session(): {
        create: (data: any) => Promise<any>;
        findFirst: (query: any) => Promise<any>;
        update: (params: any) => Promise<any>;
        delete: (query: any) => Promise<{}>;
        findMany: (query: any) => Promise<any[]>;
    };
    get passwordReset(): {
        create: (data: any) => Promise<any>;
        findFirst: (query: any) => Promise<any>;
        update: (params: any) => Promise<any>;
        delete: (query: any) => Promise<{}>;
    };
    get whatsAppMessage(): Prisma.WhatsAppMessageDelegate<import(".prisma/client/runtime/library").DefaultArgs>;
    get studentProfile(): {
        create: (data: any) => Promise<any>;
        findFirst: (query: any) => Promise<any>;
        update: (params: any) => Promise<any>;
        delete: (query: any) => Promise<{}>;
    };
    get teacherProfile(): {
        create: (data: any) => Promise<any>;
        findFirst: (query: any) => Promise<any>;
        update: (params: any) => Promise<any>;
        delete: (query: any) => Promise<{}>;
    };
    get parentProfile(): {
        create: (data: any) => Promise<any>;
        findFirst: (query: any) => Promise<any>;
        update: (params: any) => Promise<any>;
        delete: (query: any) => Promise<{}>;
    };
    get query(): any;
    static transaction<T>(callback: TransactionCallback<T>, options?: {
        maxWait?: number;
        timeout?: number;
        isolationLevel?: Prisma.TransactionIsolationLevel;
    }): Promise<T>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getHealth(): Promise<DatabaseHealth>;
    getStats(): DatabaseStats;
    resetStats(): void;
    executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Promise<T>;
    private setupEventListeners;
    private updateQueryStats;
    private getTableInfo;
    private startHealthChecks;
    private formatBytes;
    getConnectionPoolStatus(): {
        active: number;
        idle: number;
        total: number;
        maxConnections: number;
    };
    isSSLEnabled(): boolean;
    initialize(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    validateConnectionSecurity(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    getUserCount(): Promise<number>;
    searchMenuItems(query: string): Promise<any[]>;
    getAllMenuItems(): Promise<any[]>;
    createMenuItem(data: any): Promise<any>;
    sanitizeQuery(query: string | any): string | any;
    cleanup(): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
}
export declare const databaseService: DatabaseService;
export default DatabaseService;
//# sourceMappingURL=database.service.d.ts.map