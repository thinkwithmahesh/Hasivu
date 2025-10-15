export declare class COPPAComplianceManager {
    constructor();
    initialize(): Promise<void>;
    validateMinorAge(userId: string): Promise<boolean>;
    requireParentalConsent(userId: string): Promise<void>;
    restrictDataCollection(userId: string): Promise<void>;
    handleParentalRequest(request: any): Promise<any>;
    generateReport(period: any): Promise<any>;
    validateAccess(userId: string, dataType: string): Promise<boolean>;
    performAutomaticChecks(): Promise<any>;
    private hasValidParentalConsent;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default COPPAComplianceManager;
//# sourceMappingURL=coppa-compliance-manager.d.ts.map