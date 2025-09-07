export declare const corsHeaders: {
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Expose-Headers': string;
    'Access-Control-Allow-Credentials': string;
    'Access-Control-Max-Age': string;
    Vary: string;
};
export declare const preflightHeaders: {
    'Access-Control-Max-Age': string;
    'Cache-Control': string;
    'Content-Type': string;
    'Content-Length': string;
    'Access-Control-Allow-Origin': string;
    'Access-Control-Allow-Methods': string;
    'Access-Control-Allow-Headers': string;
    'Access-Control-Expose-Headers': string;
    'Access-Control-Allow-Credentials': string;
    Vary: string;
};
export interface CorsConfig {
    origins: string[] | string | boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    credentials: boolean;
    maxAge: number;
    preflightContinue: boolean;
    optionsSuccessStatus: number;
}
export declare const developmentCorsConfig: CorsConfig;
export declare const productionCorsConfig: CorsConfig;
export declare const stagingCorsConfig: CorsConfig;
export declare function getCorsConfig(environment?: string): CorsConfig;
export declare function generateCorsHeaders(origin?: string, config?: CorsConfig): Record<string, string>;
export declare function validateOrigin(origin: string | undefined, allowedOrigins: string[] | string | boolean): boolean;
export declare function handleCorsForLambda(event: any, config?: CorsConfig): Record<string, string>;
export declare function createCorsMiddleware(config?: CorsConfig): (req: any, res: any, next: any) => any;
export declare const secureCorsConfig: CorsConfig;
export declare const apiCorsConfig: CorsConfig;
export declare const websocketCorsConfig: CorsConfig;
export declare function createEnvironmentCorsHeaders(environment?: string, customOrigins?: string[]): Record<string, string>;
export declare class CorsError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly origin?: string;
    constructor(message: string, code?: string, statusCode?: number, origin?: string);
    toJSON(): {
        error: string;
        message: string;
        code: string;
        statusCode: number;
        origin: string;
        timestamp: string;
    };
}
export declare function validateCorsRequest(origin: string | undefined, method: string, headers?: Record<string, string>, config?: CorsConfig): void;
declare const _default: {
    corsHeaders: {
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Expose-Headers': string;
        'Access-Control-Allow-Credentials': string;
        'Access-Control-Max-Age': string;
        Vary: string;
    };
    preflightHeaders: {
        'Access-Control-Max-Age': string;
        'Cache-Control': string;
        'Content-Type': string;
        'Content-Length': string;
        'Access-Control-Allow-Origin': string;
        'Access-Control-Allow-Methods': string;
        'Access-Control-Allow-Headers': string;
        'Access-Control-Expose-Headers': string;
        'Access-Control-Allow-Credentials': string;
        Vary: string;
    };
    getCorsConfig: typeof getCorsConfig;
    generateCorsHeaders: typeof generateCorsHeaders;
    validateOrigin: typeof validateOrigin;
    handleCorsForLambda: typeof handleCorsForLambda;
    createCorsMiddleware: typeof createCorsMiddleware;
    createEnvironmentCorsHeaders: typeof createEnvironmentCorsHeaders;
    validateCorsRequest: typeof validateCorsRequest;
    CorsError: typeof CorsError;
    configs: {
        development: CorsConfig;
        staging: CorsConfig;
        production: CorsConfig;
        secure: CorsConfig;
        api: CorsConfig;
        websocket: CorsConfig;
    };
};
export default _default;
//# sourceMappingURL=cors.d.ts.map