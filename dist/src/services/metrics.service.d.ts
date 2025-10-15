interface PaymentMetrics {
    transactionId: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'pending';
    gateway: string;
    processingTime: number;
}
interface OrderMetrics {
    orderId: string;
    userId: string;
    schoolId: string;
    totalAmount: number;
    itemCount: number;
    processingTime: number;
}
interface RFIDMetrics {
    rfidTag: string;
    operation: 'verification' | 'registration';
    status: 'success' | 'failed';
    processingTime: number;
    location?: string;
}
interface UserActivityMetrics {
    userId: string;
    action: 'login' | 'logout' | 'order_created' | 'payment_completed' | 'rfid_verified';
    sessionDuration?: number;
    deviceType?: string;
}
interface PerformanceMetrics {
    endpoint: string;
    method: string;
    statusCode: number;
    duration: number;
    userId?: string;
}
interface SystemHealthMetrics {
    timestamp: number;
    components: {
        api: {
            healthy: boolean;
            responseTime: number;
        };
        database: {
            healthy: boolean;
            connectionPool: number;
        };
        cache: {
            healthy: boolean;
            hitRate: number;
        };
        payment: {
            healthy: boolean;
            successRate: number;
        };
    };
    overallScore: number;
}
declare class MetricsService {
    trackPayment(metrics: PaymentMetrics): Promise<void>;
    trackOrderCreation(metrics: OrderMetrics): Promise<void>;
    trackOrderCompletion(orderId: string, deliveryTime: number): Promise<void>;
    trackOrderCancellation(orderId: string, reason: string, refundAmount?: number): Promise<void>;
    trackRFID(metrics: RFIDMetrics): Promise<void>;
    trackUserActivity(metrics: UserActivityMetrics): Promise<void>;
    trackApiRequest(metrics: PerformanceMetrics): Promise<void>;
    trackSystemHealth(metrics: SystemHealthMetrics): Promise<void>;
    trackSecurityEvent(eventType: 'failed_login' | 'suspicious_activity' | 'fraud_attempt' | 'unauthorized_access', userId?: string, details?: Record<string, any>): Promise<void>;
    trackCostMetric(service: 'Lambda' | 'RDS' | 'APIGateway' | 'S3', estimatedCost: number): Promise<void>;
    calculateRevenueMetrics(totalRevenue: number, transactionCount: number): Promise<void>;
    trackDatabasePerformance(queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE', duration: number, success: boolean, rowCount?: number): Promise<void>;
    trackCacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', duration: number): Promise<void>;
    trackError(errorType: string, errorMessage: string, context?: Record<string, any>): Promise<void>;
    getMetricsSummary(): Promise<Record<string, any>>;
}
export declare const metricsService: MetricsService;
export {};
//# sourceMappingURL=metrics.service.d.ts.map