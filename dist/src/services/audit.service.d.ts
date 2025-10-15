export declare class AuditService {
    private static instance;
    constructor();
    static getInstance(): AuditService;
    logActivity(userId: string, action: string, details: any): Promise<void>;
    log(userId: string, action: string, details: any): Promise<void>;
    getAuditLogs(userId?: string): Promise<any[]>;
}
declare const auditServiceInstance: AuditService;
export declare const auditService: AuditService;
export declare const _auditService: AuditService;
export default auditServiceInstance;
//# sourceMappingURL=audit.service.d.ts.map