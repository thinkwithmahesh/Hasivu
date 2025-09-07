import { PaymentStatus } from '../../src/types/index';
export interface PaymentProcessorResult {
    success: boolean;
    payment?: any;
    message?: string;
    error?: string;
    transactionId?: string;
    paymentId?: string;
}
export interface PaymentProcessorConfig {
    successRate?: number;
    averageResponseTime?: number;
    maxResponseTime?: number;
    enableRandomFailures?: boolean;
    enableNetworkDelay?: boolean;
}
export declare class MockPaymentProcessor {
    private config;
    private processedPayments;
    private paymentCounter;
    constructor(config?: Partial<PaymentProcessorConfig>);
    processPayment(orderData: any): Promise<PaymentProcessorResult>;
    createPaymentRecord(orderData: any): Promise<PaymentProcessorResult>;
    updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<PaymentProcessorResult>;
    getPaymentById(paymentId: string): Promise<PaymentProcessorResult>;
    processRefund(paymentId: string, amount?: number, reason?: string): Promise<PaymentProcessorResult>;
    getStatistics(): any;
    reset(): void;
    configure(config: Partial<PaymentProcessorConfig>): void;
    private simulateNetworkDelay;
    private getRandomFailureReason;
    getAllPayments(): any[];
    hasPayment(paymentId: string): boolean;
    getPaymentCount(): number;
    setFailureRate(rate: number): void;
    setNetworkDelay(delay: number): void;
    setRateLimit(limit: number): void;
}
//# sourceMappingURL=MockPaymentProcessor.d.ts.map