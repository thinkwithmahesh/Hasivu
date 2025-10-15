export declare class PrivacyPreservingAnalytics {
    constructor();
    initialize(): Promise<void>;
    addDifferentialPrivacy(query: string, epsilon: number): Promise<string>;
    anonymizeResults(results: any[] | undefined | undefined): Promise<any[]>;
    applyKAnonymity(data: any[] | undefined | undefined, k: number): Promise<any[]>;
    generateSyntheticData(schema: any): Promise<any[]>;
    generateAnalytics(data: any, privacyParameters: any): Promise<any>;
    getHealthStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default PrivacyPreservingAnalytics;
//# sourceMappingURL=privacy-preserving-analytics.d.ts.map