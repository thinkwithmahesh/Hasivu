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
exports.listStaticFilesHandler = exports.serveHealthDashboardHandler = exports.serveStaticContentHandler = void 0;
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
    '.eot': 'application/vnd.ms-fontobject'
};
const serveStaticContentHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Function started: serveStaticContent', { requestId: context.awsRequestId });
    try {
        const filePath = event.pathParameters?.proxy || 'index.html';
        if (filePath.includes('../') || filePath.includes('..\\')) {
            logger_1.logger.warn('Directory traversal attempt detected', { filePath, requestId: context.awsRequestId });
            return (0, response_utils_1.createErrorResponse)(400, 'Invalid path', undefined, undefined, context.awsRequestId);
        }
        const contentType = getContentType(filePath);
        const basePath = path.join(__dirname, '..', '..', 'public');
        const fullPath = path.join(basePath, filePath);
        if (!fullPath.startsWith(basePath)) {
            logger_1.logger.warn('Path traversal attempt blocked:', { filePath, fullPath, basePath });
            return (0, response_utils_1.createErrorResponse)(404, 'File not found', undefined, undefined, context.awsRequestId);
        }
        try {
            await fs.promises.access(fullPath, fs.constants.F_OK);
        }
        catch (error) {
            logger_1.logger.info('File not found', { fullPath, requestId: context.awsRequestId });
            return (0, response_utils_1.createErrorResponse)(404, 'File not found', undefined, undefined, context.awsRequestId);
        }
        const fileContent = await fs.promises.readFile(fullPath, 'utf8');
        const duration = Date.now() - startTime;
        logger_1.logger.info('Function completed: serveStaticContent', { statusCode: 200, duration });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': getCacheControl(filePath),
                'X-Request-ID': context.awsRequestId,
                'X-Content-Type-Options': 'nosniff'
            },
            body: fileContent
        };
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'serveStaticContent', 500, context.awsRequestId);
    }
};
exports.serveStaticContentHandler = serveStaticContentHandler;
const serveHealthDashboardHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Function started: serveHealthDashboard', { requestId: context.awsRequestId });
    try {
        const htmlFilePath = path.join(__dirname, '..', '..', 'public', 'health-dashboard.html');
        try {
            await fs.promises.access(htmlFilePath, fs.constants.F_OK);
        }
        catch (error) {
            logger_1.logger.warn('Health dashboard file not found', { htmlFilePath, requestId: context.awsRequestId });
            const basicDashboard = generateBasicHealthDashboard();
            const duration = Date.now() - startTime;
            logger_1.logger.info('Function completed: serveHealthDashboard', { statusCode: 200, duration });
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'X-Request-ID': context.awsRequestId
                },
                body: basicDashboard
            };
        }
        const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');
        const duration = Date.now() - startTime;
        logger_1.logger.info('Function completed: serveHealthDashboard', { statusCode: 200, duration });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'X-Request-ID': context.awsRequestId
            },
            body: htmlContent
        };
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'serveHealthDashboard', 500, context.awsRequestId);
    }
};
exports.serveHealthDashboardHandler = serveHealthDashboardHandler;
function generateBasicHealthDashboard() {
    const timestamp = new Date().toISOString();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hasivu Platform - Health Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 300;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        .status-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #28a745;
        }
        .status-card.warning {
            border-left-color: #ffc107;
        }
        .status-card.error {
            border-left-color: #dc3545;
        }
        .status-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        .status-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            color: #333;
        }
        .status-detail {
            color: #666;
            font-size: 0.9rem;
        }
        .footer {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            color: #666;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍎 Hasivu Platform</h1>
            <p>System Health Dashboard</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <div class="status-icon">✅</div>
                <div class="status-title">Static Content Service</div>
                <div class="status-detail">Operational</div>
            </div>
            
            <div class="status-card">
                <div class="status-icon">🌐</div>
                <div class="status-title">API Gateway</div>
                <div class="status-detail">Responding</div>
            </div>
            
            <div class="status-card">
                <div class="status-icon">💾</div>
                <div class="status-title">Database</div>
                <div class="status-detail">Connected</div>
            </div>
            
            <div class="status-card">
                <div class="status-icon">🔒</div>
                <div class="status-title">Authentication</div>
                <div class="status-detail">Active</div>
            </div>
            
            <div class="status-card">
                <div class="status-icon">📱</div>
                <div class="status-title">RFID Tracking</div>
                <div class="status-detail">Monitoring</div>
            </div>
            
            <div class="status-card">
                <div class="status-icon">🍽️</div>
                <div class="status-title">Menu Planning</div>
                <div class="status-detail">Available</div>
            </div>
        </div>
        
        <div class="footer">
            <p>Last updated: ${timestamp}</p>
            <p>Hasivu Platform - Smart School Meal Management System</p>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>
  `.trim();
}
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return contentTypes[ext] || 'application/octet-stream';
}
function getCacheControl(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.html' || ext === '.htm') {
        return 'public, max-age=300, must-revalidate';
    }
    if (ext === '.css' || ext === '.js') {
        return 'public, max-age=3600';
    }
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
        return 'public, max-age=86400';
    }
    return 'public, max-age=3600';
}
const listStaticFilesHandler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.info('Function started: listStaticFiles', { requestId: context.awsRequestId });
    try {
        const basePath = path.join(__dirname, '..', '..', 'public');
        try {
            await fs.promises.access(basePath, fs.constants.F_OK);
        }
        catch (error) {
            return (0, response_utils_1.createErrorResponse)(404, 'Public directory not found', undefined, undefined, context.awsRequestId);
        }
        const files = await getDirectoryContents(basePath, basePath);
        const duration = Date.now() - startTime;
        logger_1.logger.info('Function completed: listStaticFiles', { statusCode: 200, duration });
        return (0, response_utils_1.createSuccessResponse)({
            basePath,
            fileCount: files.length,
            files: files.map(file => ({
                path: file.relativePath,
                size: file.size,
                lastModified: file.lastModified,
                contentType: getContentType(file.relativePath)
            }))
        }, context.awsRequestId);
    }
    catch (error) {
        return (0, response_utils_1.handleError)(error, 'listStaticFiles', 500, context.awsRequestId);
    }
};
exports.listStaticFilesHandler = listStaticFilesHandler;
async function getDirectoryContents(dirPath, basePath) {
    const items = [];
    try {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            const relativePath = path.relative(basePath, fullPath);
            if (entry.isDirectory()) {
                const subItems = await getDirectoryContents(fullPath, basePath);
                items.push(...subItems);
            }
            else if (entry.isFile()) {
                const stats = await fs.promises.stat(fullPath);
                items.push({
                    fullPath,
                    relativePath: relativePath.replace(/\\/g, '/'),
                    size: stats.size,
                    lastModified: stats.mtime.toISOString()
                });
            }
        }
    }
    catch (error) {
        logger_1.logger.warn('Error reading directory:', { dirPath, error });
    }
    return items;
}
exports.default = {
    serveStaticContentHandler: exports.serveStaticContentHandler,
    serveHealthDashboardHandler: exports.serveHealthDashboardHandler,
    listStaticFilesHandler: exports.listStaticFilesHandler
};
//# sourceMappingURL=serve-static.js.map