export declare enum BusinessMetricCategory {
    USER_ENGAGEMENT = "UserEngagement",
    PAYMENT_PERFORMANCE = "PaymentPerformance",
    ORDER_FULFILLMENT = "OrderFulfillment",
    RFID_OPERATIONS = "RFIDOperations",
    SECURITY_EVENTS = "SecurityEvents",
    SYSTEM_HEALTH = "SystemHealth"
}
export interface BusinessMetric {
    name: string;
    value: number;
    unit: 'Count' | 'Percent' | 'Seconds' | 'Bytes' | 'None';
    category: BusinessMetricCategory;
    dimensions?: Array<{
        name: string;
        value: string;
    }>;
    timestamp?: Date;
    metadata?: Record<string, any>;
}
export interface KPICalculation {
    name: string;
    current: number;
    previous: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
    target?: number;
    unit: string;
    period: string;
}
export declare class BusinessMetricsService {
    private cloudWatchClient;
    private metricsBuffer;
    private readonly FLUSH_INTERVAL;
    private readonly BUFFER_SIZE;
    private flushTimer?;
    constructor();
    trackUserEngagement(userId: string, action: string, metadata?: Record<string, any>): Promise<void>;
    trackPaymentMetrics(orderId: string, amount: number, status: 'success' | 'failed' | 'pending', paymentMethod: string, metadata?: Record<string, any>): Promise<void>;
    trackOrderMetrics(orderId: string, status: 'created' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled', metadata?: Record<string, any>): Promise<void>;
    trackRFIDMetrics(operation: 'verification' | 'registration' | 'reader_status', status: 'success' | 'failed', metadata?: Record<string, any>): Promise<void>;
    trackSecurityEvent(eventType: 'failed_login' | 'suspicious_activity' | 'fraud_attempt' | 'unauthorized_access', severity: 'low' | 'medium' | 'high' | 'critical', metadata?: Record<string, any>): Promise<void>;
    calculateSystemHealthScore(): Promise<number>;
    generateKPIReport(timeWindow: '1h' | '24h' | '7d' | '30d'): Promise<KPICalculation[]>;
    private addMetricsToBuffer;
    private flushMetricsBuffer;
    private startPeriodicFlush;
    stopPeriodicFlush(): void;
    private chunkArray;
    private checkDatabaseHealth;
    private checkCacheHealth;
    private checkPaymentSystemHealth;
    private checkRFIDSystemHealth;
    private calculatePaymentSuccessRate;
    private calculateOrderCompletionRate;
    private calculateRFIDVerificationRate;
    private calculateUserSatisfactionScore;
    shutdown(): Promise<void>;
}
export declare const businessMetricsService: BusinessMetricsService;
export default businessMetricsService;
//# sourceMappingURL=business-metrics.service.d.ts.map