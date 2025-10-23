export declare class GDPRComplianceManager {
    constructor();
    initialize(): Promise<void>;
    handleDataSubjectRequest(request: any): Promise<any>;
    anonymizeData(userId: string): Promise<void>;
    exportUserData(userId: string): Promise<any>;
    deleteUserData(userId: string): Promise<void>;
    validateConsent(userId: string, purpose: string): Promise<boolean>;
    processRequest(request: any): Promise<any>;
    generateReport(period: any): Promise<any>;
    validateAccess(userId: string, dataType: string): Promise<boolean>;
    performAutomaticChecks(): Promise<any>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default GDPRComplianceManager;
//# sourceMappingURL=gdpr-compliance-manager.d.ts.map