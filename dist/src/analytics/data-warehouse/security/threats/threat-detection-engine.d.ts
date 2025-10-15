export declare class ThreatDetectionEngine {
    constructor();
    initialize(): Promise<void>;
    analyzeThreat(event: any): Promise<any>;
    detectAnomalies(_data: any[] | undefined | undefined): Promise<any[]>;
    updateThreatRules(rules: any[] | undefined | undefined): Promise<void>;
    getThreatReport(period: any): Promise<any>;
    detectThreats(): Promise<any[]>;
    mitigateThreat(threatId: string): Promise<void>;
    getHealthStatus(): Promise<any>;
    getActiveThreats(): Promise<any[]>;
    shutdown(): Promise<void>;
}
export default ThreatDetectionEngine;
//# sourceMappingURL=threat-detection-engine.d.ts.map