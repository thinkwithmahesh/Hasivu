"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckHandler = exports.serveStaticContentHandler = void 0;
const logger_1 = require("../../shared/utils/logger");
const response_utils_1 = require("../shared/response.utils");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};
const serveStaticContentHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Function started: serveStaticContent', { requestId: context.awsRequestId });
    try {
        const proxyPath = event.pathParameters?.proxy || 'index.html';
        if (proxyPath.includes('../') || proxyPath.includes('..\\') || proxyPath.includes('..%2f') || proxyPath.includes('..%5c')) {
            logger_1.logger.warn('Directory traversal attempt detected', { proxyPath, requestId: context.awsRequestId });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid path', undefined, undefined, context.awsRequestId);
        }
        const normalizedPath = proxyPath.replace(/\0/g, '');
        if (normalizedPath !== proxyPath) {
            logger_1.logger.warn('Null byte injection attempt detected', { proxyPath, requestId: context.awsRequestId });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid path', undefined, undefined, context.awsRequestId);
        }
        const contentType = getContentType(normalizedPath);
        const basePath = path.resolve(__dirname, '..', '..', 'public');
        const fullPath = path.resolve(basePath, normalizedPath);
        if (!fullPath.startsWith(basePath + path.sep) && fullPath !== basePath) {
            logger_1.logger.warn('Path traversal attempt blocked:', { proxyPath, fullPath, basePath });
            return (0, response_utils_1.createErrorResponse)(404, 'File not found', undefined, undefined, context.awsRequestId);
        }
        try {
            await fs.promises.access(fullPath, fs.constants.F_OK | fs.constants.R_OK);
        }
        catch (error) {
            logger_1.logger.info('File not found or not readable', { fullPath, requestId: context.awsRequestId });
            return (0, response_utils_1.createErrorResponse)(404, 'File not found', undefined, undefined, context.awsRequestId);
        }
        const stats = await fs.promises.stat(fullPath);
        const lastModified = stats.mtime.toUTCString();
        const etag = `"${stats.size}-${stats.mtime.getTime()}"`;
        const ifModifiedSince = event.headers['if-modified-since'] || event.headers['If-Modified-Since'];
        const ifNoneMatch = event.headers['if-none-match'] || event.headers['If-None-Match'];
        if ((ifModifiedSince && ifModifiedSince === lastModified) || (ifNoneMatch && ifNoneMatch === etag)) {
            const duration = Date.now() - startTime;
            logger_1.logger.info('Function completed: serveStaticContent', { statusCode: 304, duration });
            return {
                statusCode: 304,
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': getCacheControl(normalizedPath),
                    'Last-Modified': lastModified,
                    'ETag': etag,
                    'X-Request-ID': context.awsRequestId
                },
                body: ''
            };
        }
        const isTextFile = contentType.startsWith('text/') ||
            contentType.includes('javascript') ||
            contentType.includes('json') ||
            contentType.includes('xml');
        let fileContent;
        let isBase64Encoded = false;
        if (isTextFile) {
            fileContent = await fs.promises.readFile(fullPath, 'utf8');
        }
        else {
            const buffer = await fs.promises.readFile(fullPath);
            fileContent = buffer.toString('base64');
            isBase64Encoded = true;
        }
        const duration = Date.now() - startTime;
        logger_1.logger.info('Function completed: serveStaticContent', { statusCode: 200, duration });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': getCacheControl(normalizedPath),
                'Last-Modified': lastModified,
                'ETag': etag,
                'Content-Length': stats.size.toString(),
                'X-Request-ID': context.awsRequestId,
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block'
            },
            body: fileContent,
            isBase64Encoded
        };
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'serveStaticContent');
    }
};
exports.serveStaticContentHandler = serveStaticContentHandler;
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return contentTypes[ext] || 'application/octet-stream';
}
function getCacheControl(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html' || ext === '.htm') {
        return 'public, max-age=300, must-revalidate';
    }
    if (ext === '.css' || ext === '.js' || ext === '.mjs') {
        return 'public, max-age=3600, immutable';
    }
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'].includes(ext)) {
        return 'public, max-age=86400, immutable';
    }
    return 'public, max-age=3600';
}
const healthCheckHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Function started: staticContentHealthCheck', { requestId: context.awsRequestId });
    try {
        const basePath = path.resolve(__dirname, '..', '..', 'public');
        try {
            await fs.promises.access(basePath, fs.constants.F_OK | fs.constants.R_OK);
        }
        catch (error) {
            logger_1.logger.error('Public directory not accessible:', error);
            return (0, response_utils_1.createErrorResponse)(503, 'Static content service unavailable', undefined, undefined, context.awsRequestId);
        }
        const files = await fs.promises.readdir(basePath);
        const duration = Date.now() - startTime;
        logger_1.logger.info('Function completed: staticContentHealthCheck', { statusCode: 200, duration, requestId: context.awsRequestId });
        return (0, response_utils_1.createSuccessResponse)({
            status: 'healthy',
            service: 'static-content',
            publicPath: basePath,
            fileCount: files.length,
            timestamp: new Date().toISOString()
        }, context.awsRequestId);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'staticContentHealthCheck', 500, context.awsRequestId);
    }
};
exports.healthCheckHandler = healthCheckHandler;
exports.default = {
    serveStaticContentHandler: exports.serveStaticContentHandler,
    healthCheckHandler: exports.healthCheckHandler
};
//# sourceMappingURL=serve-content.js.map