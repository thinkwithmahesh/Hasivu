declare const SECURITY_CONFIG: {
    targetUrl: string;
    apiKey: string;
    testTimeout: number;
    reports: {
        outputDir: string;
        vulnerabilityReport: string;
        penetrationReport: string;
        complianceReport: string;
    };
    tools: {
        zapProxy: string;
        niktoPath: string;
        sqlmapPath: string;
    };
    testData: {
        maliciousPayloads: string[];
        authBypassAttempts: {
            username: string;
            password: string;
        }[];
    };
};
interface SecurityTestState {
    vulnerabilities: Array<{
        severity: 'critical' | 'high' | 'medium' | 'low';
        type: string;
        description: string;
        endpoint: string;
        payload?: string;
        evidence?: string;
    }>;
    complianceChecks: Map<string, boolean>;
    performanceImpact: Map<string, number>;
}
declare global {
    var securityTestState: SecurityTestState;
}
export declare const securityHelpers: {
    testSqlInjection(endpoint: string, parameters: Record<string, string>): Promise<({
        severity: "critical";
        type: string;
        description: string;
        endpoint: string;
        payload: string;
        evidence: string;
    } | {
        severity: "high";
        type: string;
        description: string;
        endpoint: string;
        payload: string;
        evidence?: undefined;
    })[]>;
    testXss(endpoint: string, parameters: Record<string, string>): Promise<{
        severity: "high";
        type: string;
        description: string;
        endpoint: string;
        payload: string;
        evidence: string;
    }[]>;
    testAuthenticationBypass(loginEndpoint: string): Promise<{
        severity: "critical";
        type: string;
        description: string;
        endpoint: string;
        payload: string;
        evidence: string;
    }[]>;
    testRateLimiting(endpoint: string, requests?: number): Promise<{
        successCount: number;
        blockedCount: number;
        duration: number;
        rateLimitEffective: boolean;
    }>;
    testSecurityHeaders(endpoint: string): Promise<{
        missingHeaders: string[];
        allHeaders: {
            [k: string]: string;
        };
    }>;
    testGdprCompliance(endpoints: string[]): Promise<{
        isCompliant: boolean;
        issues: string[];
    }>;
};
export { SECURITY_CONFIG };
//# sourceMappingURL=setup-security.d.ts.map