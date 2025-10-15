export declare class FraudDetectionService {
    constructor();
    analyzeTransaction(transactionData: any): Promise<any>;
    detectAnomalousActivity(_userId: string): Promise<any[]>;
    flagSuspiciousActivity(_userId: string, reason: string): Promise<void>;
    validateUserBehavior(_userId: string, _activityData: any): Promise<boolean>;
    getSecurityAlerts(): Promise<any[]>;
}
declare const fraudDetectionServiceInstance: FraudDetectionService;
export declare const fraudDetectionService: FraudDetectionService;
export declare const _fraudDetectionService: FraudDetectionService;
export default fraudDetectionServiceInstance;
//# sourceMappingURL=fraud-detection.service.d.ts.map