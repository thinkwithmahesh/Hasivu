export declare class DataClassificationEngine {
    constructor();
    initialize(): Promise<void>;
    classifyData(resource: string, _data?: any): Promise<any>;
    updateClassification(dataId: string, classification: any): Promise<void>;
    getClassificationRules(): Promise<any[]>;
    createClassificationRule(rule: any): Promise<void>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default DataClassificationEngine;
//# sourceMappingURL=data-classification-engine.d.ts.map