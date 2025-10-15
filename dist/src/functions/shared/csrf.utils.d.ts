import { APIGatewayProxyEvent } from 'aws-lambda';
export declare function validateCSRFToken(event: APIGatewayProxyEvent): {
    isValid: boolean;
    error?: any;
};
export declare function requiresCSRFProtection(method: string): boolean;
//# sourceMappingURL=csrf.utils.d.ts.map