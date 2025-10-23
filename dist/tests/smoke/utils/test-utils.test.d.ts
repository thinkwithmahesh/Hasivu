import { SuiteResult } from './test-types';
export declare class SmokeTestUtils {
    private static authToken;
    private static testResults;
    private static suiteStartTime;
    static initializeSuite(): void;
    static makeRequest(endpoint: string, options: RequestInit | undefined, testName: string): Promise<{
        response: any;
        status: number;
        duration: number;
    }>;
    static authenticate(): Promise<boolean>;
    static recordTestResult(testName: string, status: 'passed' | 'failed' | 'skipped', duration: number, error?: string, responseCode?: number): void;
    static checkPerformanceThreshold(testName: string, duration: number, threshold: number): boolean;
    static validateResponseStatus(status: number, expectedStatuses: number[]): boolean;
    static generateSuiteSummary(): SuiteResult;
    static cleanup(): Promise<void>;
    static getAuthToken(): string | null;
    static shouldContinueSuite(): boolean;
}
//# sourceMappingURL=test-utils.test.d.ts.map