/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Server } from 'http';
import { Server as HttpsServer } from 'https';
import { EventEmitter } from 'events';
export interface GracefulShutdownOptions {
    timeout?: number;
    logger?: any;
    signals?: string[];
    beforeShutdown?: (signal: string) => Promise<void>;
    onShutdown?: (signal: string) => Promise<void>;
    afterShutdown?: (signal: string) => Promise<void>;
    forceExitTimeout?: number;
    drainTimeout?: number;
    healthCheckTimeout?: number;
    keepAliveTimeout?: number;
    cleanupServices?: boolean;
    enableWebSockets?: boolean;
    enableScheduler?: boolean;
    enableQueue?: boolean;
    enableCache?: boolean;
    enableMonitoring?: boolean;
    enableNotifications?: boolean;
    shutdownPriority?: ShutdownPriority[];
    emergencyShutdown?: boolean;
    preserveState?: boolean;
    backupData?: boolean;
    notifyUsers?: boolean;
    maintainConnections?: boolean;
}
export declare enum ShutdownPriority {
    CRITICAL = 0,
    HIGH = 1,
    NORMAL = 2,
    LOW = 3,
    CLEANUP = 4
}
export interface ServiceShutdownConfig {
    name: string;
    priority: ShutdownPriority;
    timeout: number;
    graceful: boolean;
    preserveState?: boolean;
    cleanupFunction?: () => Promise<void>;
    healthCheck?: () => Promise<boolean>;
    dependencies?: string[];
}
export interface ShutdownStatus {
    initiated: boolean;
    startTime?: Date;
    signal?: string;
    reason?: string;
    phase: ShutdownPhase;
    completedServices: string[];
    failedServices: string[];
    activeConnections: number;
    estimatedTimeRemaining?: number;
    errors: ShutdownError[];
    warnings: string[];
}
export declare enum ShutdownPhase {
    NORMAL = "normal",
    INITIATED = "initiated",
    DRAINING = "draining",
    CLEANUP = "cleanup",
    FINALIZATION = "finalization",
    COMPLETED = "completed",
    FORCED = "forced",
    ERROR = "error"
}
export interface ShutdownError {
    service: string;
    error: Error;
    timestamp: Date;
    phase: ShutdownPhase;
    critical: boolean;
}
export interface ConnectionInfo {
    id: string;
    type: 'http' | 'websocket' | 'database' | 'redis' | 'queue' | 'external';
    socket: any;
    createdAt: Date;
    lastActivity: Date;
    metadata?: any;
    drainTimeout?: number;
    forceCloseTimeout?: number;
}
export declare const shutdownEmitter: EventEmitter<[never]>;
export declare function registerService(config: ServiceShutdownConfig): void;
export declare function unregisterService(serviceName: string): void;
export declare function trackConnection(connection: any, type?: ConnectionInfo['type'], metadata?: any): string;
export declare function untrackConnection(connectionId: string): void;
export declare function getActiveConnectionCount(): number;
export declare function getConnectionInfo(): ConnectionInfo[];
export declare function createGracefulShutdown(server: Server | HttpsServer, options?: GracefulShutdownOptions): (signal: string) => Promise<void>;
export declare function setupGracefulShutdown(server: Server | HttpsServer, options?: GracefulShutdownOptions): void;
export declare function shutdown(reason?: string, options?: GracefulShutdownOptions): Promise<void>;
export declare function emergencyShutdown(reason: string, error?: Error): void;
export declare function getShutdownStatus(): ShutdownStatus;
export declare function isSystemShuttingDown(): boolean;
export declare function setupProcessSignals(customHandlers?: {
    [signal: string]: (signal: string) => Promise<void>;
}): void;
export declare function createConnectionTrackingMiddleware(): (req: any, res: any, next: any) => void;
export declare function trackWebSocketConnection(ws: any, metadata?: any): string;
export declare class GracefulShutdownManager {
    private server?;
    private options;
    private shutdownFunction?;
    constructor(options?: GracefulShutdownOptions);
    init(server: Server | HttpsServer, customOptions?: GracefulShutdownOptions): void;
    shutdown(reason?: string): Promise<void>;
    emergencyShutdown(reason: string, error?: Error): void;
    getStatus(): ShutdownStatus;
    isShuttingDown(): boolean;
    getConnections(): ConnectionInfo[];
    registerService(config: ServiceShutdownConfig): void;
    updateOptions(newOptions: Partial<GracefulShutdownOptions>): void;
}
export declare const gracefulShutdownManager: GracefulShutdownManager;
export declare function enableGracefulShutdown(server: Server | HttpsServer, options?: GracefulShutdownOptions): GracefulShutdownManager;
export declare class ProcessCleanup {
    private static cleanupTasks;
    private static isSetup;
    static addCleanupTask(task: () => Promise<void>): void;
    static setup(): void;
    private static runCleanupTasks;
}
export declare class TimeoutManager {
    private static timeouts;
    static setTimeout(id: string, callback: () => void, ms: number): NodeJS.Timeout;
    static clearTimeout(id: string): void;
    static clearAllTimeouts(): void;
    static getActiveTimeoutCount(): number;
}
export declare function cleanupResources(options?: {
    timeout?: number;
    forceCleanup?: boolean;
    preserveState?: boolean;
}): Promise<void>;
export declare function performShutdownHealthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    activeConnections: number;
    activeServices: string[];
}>;
export declare const gracefulShutdownConfigs: {
    express: GracefulShutdownOptions;
    production: GracefulShutdownOptions;
    development: GracefulShutdownOptions;
    testing: GracefulShutdownOptions;
};
export default gracefulShutdownManager;
//# sourceMappingURL=graceful-shutdown.d.ts.map