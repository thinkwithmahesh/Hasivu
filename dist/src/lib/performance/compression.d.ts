export declare function createCompressedResponse(data: any, statusCode?: number, headers?: Record<string, string>, acceptEncoding?: string): Promise<{
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Length': string;
    };
    body: string;
    isBase64Encoded?: undefined;
} | {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Encoding': string;
        'Content-Length': string;
        'X-Original-Size': string;
        'X-Compression-Ratio': string;
    };
    body: string;
    isBase64Encoded: boolean;
}>;
export declare function createAPIResponse(statusCode: number, data: any, event?: {
    headers?: Record<string, string>;
}): Promise<{
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Length': string;
    };
    body: string;
    isBase64Encoded?: undefined;
} | {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Encoding': string;
        'Content-Length': string;
        'X-Original-Size': string;
        'X-Compression-Ratio': string;
    };
    body: string;
    isBase64Encoded: boolean;
}>;
export declare function createErrorResponse(statusCode: number, message: string, details?: any): Promise<{
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Length': string;
    };
    body: string;
    isBase64Encoded?: undefined;
} | {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Encoding': string;
        'Content-Length': string;
        'X-Original-Size': string;
        'X-Compression-Ratio': string;
    };
    body: string;
    isBase64Encoded: boolean;
}>;
export declare function createSuccessResponse(data: any, message?: string): Promise<{
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Length': string;
    };
    body: string;
    isBase64Encoded?: undefined;
} | {
    statusCode: number;
    headers: {
        'Content-Type': string;
        'Content-Encoding': string;
        'Content-Length': string;
        'X-Original-Size': string;
        'X-Compression-Ratio': string;
    };
    body: string;
    isBase64Encoded: boolean;
}>;
export declare function estimateCompressionSavings(data: any): Promise<{
    originalSize: number;
    gzipSize: number;
    brotliSize: number;
    gzipSavings: number;
    brotliSavings: number;
    gzipRatio: number;
    brotliRatio: number;
}>;
//# sourceMappingURL=compression.d.ts.map