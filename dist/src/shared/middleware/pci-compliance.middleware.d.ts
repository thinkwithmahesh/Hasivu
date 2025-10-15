import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export interface PCIComplianceOptions {
    requireTLS?: boolean;
    requireHTTPS?: boolean;
    maxRequestSize?: number;
    allowedHeaders?: string[];
    sensitiveFields?: string[];
}
export declare const pciComplianceMiddleware: (options?: PCIComplianceOptions) => {
    before: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult | null>;
    after: (result: APIGatewayProxyResult) => Promise<APIGatewayProxyResult>;
};
export declare const sanitizePCIData: (data: any, sensitiveFields?: string[]) => any;
export declare const logPCIAuditEvent: (event: string, details: any, userId?: string) => void;
//# sourceMappingURL=pci-compliance.middleware.d.ts.map