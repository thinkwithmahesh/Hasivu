import { NextRequest, NextResponse } from 'next/server';
interface ThreatMetrics {
    totalThreats: number;
    ipThreats: Record<string, {
        score: number;
        blocked: boolean;
    }>;
    threatTypes: Record<string, number>;
}
export declare class ProductionSecurityMiddleware {
    private securityService;
    private threatMetrics;
    constructor();
    handleRequest(request: NextRequest): Promise<NextResponse>;
    cleanup(): Promise<void>;
    getThreatMetrics(): ThreatMetrics;
    private isRateLimited;
    private trackThreat;
}
export {};
//# sourceMappingURL=production-security.middleware.d.ts.map