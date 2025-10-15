/// <reference types="node" />
import { EventEmitter } from 'events';
export declare enum RFIDVendor {
    ZEBRA = "zebra",
    IMPINJ = "impinj",
    HONEYWELL = "honeywell",
    GENERIC = "generic"
}
export interface RFIDReaderConfig {
    id: string;
    vendor: RFIDVendor;
    model: string;
    ipAddress: string;
    port: number;
    apiKey?: string;
    username?: string;
    password?: string;
    connectionTimeout: number;
    readTimeout: number;
    powerLevel?: number;
    frequency?: number;
    metadata?: Record<string, any>;
}
export interface RFIDScanResult {
    success: boolean;
    cardId: string;
    cardData?: string;
    signalStrength: number;
    timestamp: Date;
    readerId: string;
    antenna?: number;
    metadata?: Record<string, any>;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}
export interface RFIDReaderStatus {
    readerId: string;
    isOnline: boolean;
    lastHeartbeat: Date;
    connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
    temperature?: number;
    uptime?: number;
    scanCount?: number;
    errorCount?: number;
    metadata?: Record<string, any>;
}
export declare abstract class RFIDReaderDriver extends EventEmitter {
    protected config: RFIDReaderConfig;
    protected isConnected: boolean;
    protected lastError?: Error;
    constructor(config: RFIDReaderConfig);
    abstract connect(): Promise<boolean>;
    abstract disconnect(): Promise<void>;
    abstract scan(timeout?: number): Promise<RFIDScanResult>;
    abstract getStatus(): Promise<RFIDReaderStatus>;
    abstract testConnection(): Promise<boolean>;
    abstract configure(settings: Record<string, any>): Promise<boolean>;
    getConfig(): RFIDReaderConfig;
    isReaderConnected(): boolean;
    getLastError(): Error | undefined;
}
export declare class ZebraRFIDDriver extends RFIDReaderDriver {
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    scan(timeout?: number): Promise<RFIDScanResult>;
    getStatus(): Promise<RFIDReaderStatus>;
    testConnection(): Promise<boolean>;
    configure(settings: Record<string, any>): Promise<boolean>;
    private makeRequest;
    private assessConnectionQuality;
}
export declare class ImpinjRFIDDriver extends RFIDReaderDriver {
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    scan(timeout?: number): Promise<RFIDScanResult>;
    getStatus(): Promise<RFIDReaderStatus>;
    testConnection(): Promise<boolean>;
    configure(settings: Record<string, any>): Promise<boolean>;
    private makeRequest;
    private assessConnectionQuality;
}
export declare class HoneywellRFIDDriver extends RFIDReaderDriver {
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    scan(timeout?: number): Promise<RFIDScanResult>;
    getStatus(): Promise<RFIDReaderStatus>;
    testConnection(): Promise<boolean>;
    configure(settings: Record<string, any>): Promise<boolean>;
    private makeRequest;
    private assessConnectionQuality;
}
export declare class GenericRFIDDriver extends RFIDReaderDriver {
    connect(): Promise<boolean>;
    disconnect(): Promise<void>;
    scan(timeout?: number): Promise<RFIDScanResult>;
    getStatus(): Promise<RFIDReaderStatus>;
    testConnection(): Promise<boolean>;
    configure(settings: Record<string, any>): Promise<boolean>;
    private makeRequest;
}
export declare class RFIDHardwareAbstractionService {
    private static instance;
    private readers;
    private connectionPool;
    private redis;
    private constructor();
    static getInstance(): RFIDHardwareAbstractionService;
    createDriver(config: RFIDReaderConfig): RFIDReaderDriver;
    addReader(config: RFIDReaderConfig): Promise<boolean>;
    connectAllReaders(): Promise<{
        connected: string[];
        failed: string[];
    }>;
    scanReader(readerId: string, timeout?: number): Promise<RFIDScanResult>;
    scanAllReaders(timeout?: number): Promise<RFIDScanResult[]>;
    getAllReaderStatus(): Promise<RFIDReaderStatus[]>;
    getReaderStatus(readerId: string): Promise<RFIDReaderStatus | null>;
    disconnectAllReaders(): Promise<void>;
    removeReader(readerId: string): Promise<boolean>;
    getRegisteredReaders(): RFIDReaderConfig[];
    testReaderConnection(readerId: string): Promise<boolean>;
    configureReader(readerId: string, settings: Record<string, any>): Promise<boolean>;
    private updateConnectionPool;
    getConnectionPoolStats(): Record<string, number>;
}
export declare const rfidHardwareService: RFIDHardwareAbstractionService;
//# sourceMappingURL=hardware-abstraction.service.d.ts.map