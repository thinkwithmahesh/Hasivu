export declare class DataMaskingEngine {
    constructor();
    initialize(): Promise<void>;
    maskData(data: any, rules: any[] | undefined | undefined): Promise<any>;
    createMaskingRule(rule: any): Promise<void>;
    applyMasking(data: any, context?: any): Promise<any>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default DataMaskingEngine;
//# sourceMappingURL=data-masking-engine.d.ts.map