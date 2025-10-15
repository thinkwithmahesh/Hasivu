export declare class QualityControlService {
    constructor();
    performQualityCheck(itemId: string): Promise<any>;
    getQualityReports(): Promise<any[]>;
    recordIssue(itemId: string, issue: string): Promise<void>;
    getTodayMetrics(_schoolId: string): Promise<any>;
    initiateCheck(orderId: string, _qualityChecks?: any[] | undefined | undefined): Promise<void>;
    handleFailedCheck(checkId: string, _options: any): Promise<void>;
    updateMetrics(schoolId: string, _data: any): Promise<void>;
    submitCheck(checkData: any): Promise<any>;
}
declare const qualityControlServiceInstance: QualityControlService;
export declare const qualityControlService: QualityControlService;
export declare const _qualityControlService: QualityControlService;
export default qualityControlServiceInstance;
//# sourceMappingURL=quality-control.service.d.ts.map