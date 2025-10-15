/**
 * Response Compression Utility
 * Reduces API response sizes and improves network transfer times
 */

import { gzip, brotliCompress } from 'zlib';
import { promisify } from 'util';
import { recordMetric } from '../monitoring/cloudwatch-metrics';

const gzipAsync = promisify(gzip);
const brotliCompressAsync = promisify(brotliCompress);

// Compression thresholds
const MIN_COMPRESSION_SIZE = 1024; // 1KB - don't compress smaller responses
const COMPRESSION_LEVEL = 6; // Balance between speed and compression ratio

/**
 * Check if compression is worthwhile for the given data
 */
function shouldCompress(data: string | Buffer): boolean {
  const size = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);
  return size >= MIN_COMPRESSION_SIZE;
}

/**
 * Create compressed API Gateway response
 * Automatically chooses best compression method based on request headers
 *
 * @param data - Response data to compress
 * @param statusCode - HTTP status code
 * @param headers - Additional response headers
 * @param acceptEncoding - Accept-Encoding header from request
 * @returns API Gateway response object
 */
export async function createCompressedResponse(
  data: any,
  statusCode: number = 200,
  headers: Record<string, string> = {},
  acceptEncoding?: string
) {
  const startTime = Date.now();

  // Serialize data to JSON
  const body = typeof data === 'string' ? data : JSON.stringify(data);
  const originalSize = Buffer.byteLength(body);

  // Check if compression is worthwhile
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
    // Determine best compression method based on Accept-Encoding
    const supportsBrotli = acceptEncoding?.includes('br');
    const supportsGzip = acceptEncoding?.includes('gzip');

    let compressed: Buffer;
    let encoding: string;

    if (supportsBrotli) {
      // Brotli provides better compression ratios
      compressed = await brotliCompressAsync(body, {
        params: {
          // Quality level (0-11, higher = better compression but slower)
          [11]: COMPRESSION_LEVEL,
        },
      });
      encoding = 'br';
    } else if (supportsGzip) {
      // Gzip is widely supported and fast
      compressed = await gzipAsync(body, {
        level: COMPRESSION_LEVEL,
      });
      encoding = 'gzip';
    } else {
      // Client doesn't support compression
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

    // Record compression metrics
    await Promise.all([
      recordMetric('CompressionDuration', duration, 'Milliseconds', {
        Encoding: encoding,
      }),
      recordMetric('CompressionRatio', compressionRatio, 'Percent', {
        Encoding: encoding,
      }),
      recordMetric('BytesSaved', originalSize - compressedSize, 'Bytes', {
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
  } catch (error) {
    console.error('Compression failed, sending uncompressed:', error);

    await recordMetric('CompressionErrors', 1, 'Count');

    // Fallback to uncompressed response
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

/**
 * Create standard API response with optional compression
 * Convenience wrapper for createCompressedResponse
 *
 * @param statusCode - HTTP status code
 * @param data - Response data
 * @param event - API Gateway event (for Accept-Encoding header)
 */
export async function createAPIResponse(
  statusCode: number,
  data: any,
  event?: { headers?: Record<string, string> }
) {
  const acceptEncoding = event?.headers?.['Accept-Encoding'] || event?.headers?.['accept-encoding'];

  return createCompressedResponse(
    data,
    statusCode,
    {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': 'true',
    },
    acceptEncoding
  );
}

/**
 * Create error response
 * Standardized error response format
 *
 * @param statusCode - HTTP error status code
 * @param message - Error message
 * @param details - Optional error details
 */
export async function createErrorResponse(statusCode: number, message: string, details?: any) {
  const errorResponse = {
    error: {
      message,
      statusCode,
      ...(details && { details }),
    },
  };

  return createCompressedResponse(errorResponse, statusCode);
}

/**
 * Create success response
 * Standardized success response format
 *
 * @param data - Response data
 * @param message - Optional success message
 */
export async function createSuccessResponse(data: any, message?: string) {
  const successResponse = {
    success: true,
    ...(message && { message }),
    data,
  };

  return createCompressedResponse(successResponse, 200);
}

/**
 * Estimate compression savings
 * Useful for capacity planning and optimization analysis
 *
 * @param data - Sample data to analyze
 * @returns Compression statistics
 */
export async function estimateCompressionSavings(data: any): Promise<{
  originalSize: number;
  gzipSize: number;
  brotliSize: number;
  gzipSavings: number;
  brotliSavings: number;
  gzipRatio: number;
  brotliRatio: number;
}> {
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
