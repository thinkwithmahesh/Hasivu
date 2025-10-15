"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateCompressionSavings = exports.createSuccessResponse = exports.createErrorResponse = exports.createAPIResponse = exports.createCompressedResponse = void 0;
const zlib_1 = require("zlib");
const util_1 = require("util");
const cloudwatch_metrics_1 = require("../monitoring/cloudwatch-metrics");
const gzipAsync = (0, util_1.promisify)(zlib_1.gzip);
const brotliCompressAsync = (0, util_1.promisify)(zlib_1.brotliCompress);
const MIN_COMPRESSION_SIZE = 1024;
const COMPRESSION_LEVEL = 6;
function shouldCompress(data) {
    const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
    return size >= MIN_COMPRESSION_SIZE;
}
async function createCompressedResponse(data, statusCode = 200, headers = {}, acceptEncoding) {
    const startTime = Date.now();
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = Buffer.byteLength(body);
    if (!shouldCompress(body)) {
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(originalSize),
                ...headers,
            },
            body,
        };
    }
    try {
        const supportsBrotli = acceptEncoding?.includes('br');
        const supportsGzip = acceptEncoding?.includes('gzip');
        let compressed;
        let encoding;
        if (supportsBrotli) {
            compressed = await brotliCompressAsync(body, {
                params: {
                    [11]: COMPRESSION_LEVEL,
                },
            });
            encoding = 'br';
        }
        else if (supportsGzip) {
            compressed = await gzipAsync(body, {
                level: COMPRESSION_LEVEL,
            });
            encoding = 'gzip';
        }
        else {
            return {
                statusCode,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': String(originalSize),
                    ...headers,
                },
                body,
            };
        }
        const compressedSize = compressed.length;
        const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
        const duration = Date.now() - startTime;
        await Promise.all([
            (0, cloudwatch_metrics_1.recordMetric)('CompressionDuration', duration, 'Milliseconds', {
                Encoding: encoding,
            }),
            (0, cloudwatch_metrics_1.recordMetric)('CompressionRatio', compressionRatio, 'Percent', {
                Encoding: encoding,
            }),
            (0, cloudwatch_metrics_1.recordMetric)('BytesSaved', originalSize - compressedSize, 'Bytes', {
                Encoding: encoding,
            }),
        ]);
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Content-Encoding': encoding,
                'Content-Length': String(compressedSize),
                'X-Original-Size': String(originalSize),
                'X-Compression-Ratio': `${compressionRatio.toFixed(2)}%`,
                ...headers,
            },
            body: compressed.toString('base64'),
            isBase64Encoded: true,
        };
    }
    catch (error) {
        console.error('Compression failed, sending uncompressed:', error);
        await (0, cloudwatch_metrics_1.recordMetric)('CompressionErrors', 1, 'Count');
        return {
            statusCode,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': String(originalSize),
                ...headers,
            },
            body,
        };
    }
}
exports.createCompressedResponse = createCompressedResponse;
async function createAPIResponse(statusCode, data, event) {
    const acceptEncoding = event?.headers?.['Accept-Encoding'] || event?.headers?.['accept-encoding'];
    return createCompressedResponse(data, statusCode, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
    }, acceptEncoding);
}
exports.createAPIResponse = createAPIResponse;
async function createErrorResponse(statusCode, message, details) {
    const errorResponse = {
        error: {
            message,
            statusCode,
            ...(details && { details }),
        },
    };
    return createCompressedResponse(errorResponse, statusCode);
}
exports.createErrorResponse = createErrorResponse;
async function createSuccessResponse(data, message) {
    const successResponse = {
        success: true,
        ...(message && { message }),
        data,
    };
    return createCompressedResponse(successResponse, 200);
}
exports.createSuccessResponse = createSuccessResponse;
async function estimateCompressionSavings(data) {
    const body = typeof data === 'string' ? data : JSON.stringify(data);
    const originalSize = Buffer.byteLength(body);
    const [gzipCompressed, brotliCompressed] = await Promise.all([
        gzipAsync(body, { level: COMPRESSION_LEVEL }),
        brotliCompressAsync(body, {
            params: {
                [11]: COMPRESSION_LEVEL,
            },
        }),
    ]);
    const gzipSize = gzipCompressed.length;
    const brotliSize = brotliCompressed.length;
    return {
        originalSize,
        gzipSize,
        brotliSize,
        gzipSavings: originalSize - gzipSize,
        brotliSavings: originalSize - brotliSize,
        gzipRatio: ((originalSize - gzipSize) / originalSize) * 100,
        brotliRatio: ((originalSize - brotliSize) / originalSize) * 100,
    };
}
exports.estimateCompressionSavings = estimateCompressionSavings;
//# sourceMappingURL=compression.js.map