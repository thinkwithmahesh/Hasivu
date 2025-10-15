/// <reference types="node" />
import { EventEmitter } from 'events';
import { RFIDVendor, RFIDScanResult, RFIDReaderStatus } from './hardware-abstraction.service';
export interface UnifiedScanRequest {
    readerId?: string;
    timeout?: number;
    requireOrder?: boolean;
    schoolId?: string;
    location?: {
        latitude?: number;
        longitude?: number;
        description?: string;
    };
    metadata?: Record<string, any>;
}
export interface UnifiedScanResponse {
    success: boolean;
    verification?: {
        id: string;
        cardId: string;
        studentName: string;
        orderInfo?: {
            id: string;
            orderNumber: string;
            status: string;
        };
        school: {
            id: string;
            name: string;
        };
        timestamp: Date;
        location: any;
        readerInfo: {
            id: string;
            name: string;
            vendor: RFIDVendor;
        };
    };
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    scanResults?: RFIDScanResult[];
    readerStatuses?: RFIDReaderStatus[];
}
export interface ReaderDiscoveryResult {
    readerId: string;
    ipAddress: string;
    vendor: RFIDVendor;
    model: string;
    isOnline: boolean;
    capabilities: string[];
    metadata?: Record<string, any>;
}
export interface BulkCardOperation {
    operation: 'register' | 'activate' | 'deactivate' | 'update';
    cards: Array<{
        cardNumber: string;
        studentId?: string;
        schoolId?: string;
        metadata?: Record<string, any>;
    }>;
    schoolId: string;
    batchId?: string;
}
export interface BulkOperationResult {
    batchId: string;
    totalCards: number;
    successful: number;
    failed: number;
    results: Array<{
        cardNumber: string;
        success: boolean;
        error?: string;
        cardId?: string;
    }>;
    metadata: {
        startTime: Date;
        endTime: Date;
        duration: number;
    };
}
export interface RFIDEvent {
    type: 'scan' | 'verification' | 'reader_status' | 'error';
    data: any;
    timestamp: Date;
    source: {
        readerId: string;
        vendor: RFIDVendor;
        location?: string;
    };
}
export interface RFIDAnalyticsQuery {
    startDate: Date;
    endDate: Date;
    schoolId?: string;
    readerId?: string;
    studentId?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    metrics?: string[];
}
export interface RFIDAnalyticsResult {
    totalScans: number;
    successfulVerifications: number;
    failedVerifications: number;
    uniqueStudents: number;
    averageResponseTime: number;
    peakUsageTime: string;
    readerPerformance: Array<{
        readerId: string;
        scanCount: number;
        successRate: number;
        averageResponseTime: number;
    }>;
    timeSeriesData: Array<{
        timestamp: Date;
        scanCount: number;
        successCount: number;
        failureCount: number;
    }>;
}
export declare class UnifiedRFIDAPIService extends EventEmitter {
    private static instance;
    private isInitialized;
    private eventHistory;
    private maxEventHistory;
    private constructor();
    static getInstance(): UnifiedRFIDAPIService;
    initialize(): Promise<boolean>;
    scan(request: UnifiedScanRequest): Promise<UnifiedScanResponse>;
    private performDeliveryVerification;
    discoverReaders(networkRange?: string, timeout?: number): Promise<ReaderDiscoveryResult[]>;
    bulkCardOperation(operation: BulkCardOperation): Promise<BulkOperationResult>;
    getAnalytics(query: RFIDAnalyticsQuery): Promise<RFIDAnalyticsResult>;
    getSystemHealth(): Promise<{
        overall: 'healthy' | 'degraded' | 'critical';
        readers: RFIDReaderStatus[];
        metrics: {
            totalReaders: number;
            onlineReaders: number;
            averageResponseTime: number;
            errorRate: number;
        };
    }>;
    private setupEventListeners;
    private emitRFIDEvent;
    private addToEventHistory;
    private parseReaderConfiguration;
    private sendDeliveryNotification;
    private scanIPForReaders;
    private calculateReaderPerformance;
    private generateTimeSeriesData;
    getRecentEvents(limit?: number): RFIDEvent[];
    clearEventHistory(): void;
}
export declare const unifiedRFIDService: UnifiedRFIDAPIService;
//# sourceMappingURL=unified-api.service.d.ts.map