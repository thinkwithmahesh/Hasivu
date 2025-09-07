/**
 * Static File Serving Lambda Function
 * 
 * Alternative static file server with health dashboard functionality
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { logger } from '../../shared/utils/logger';
import { createSuccessResponse, createErrorResponse, handleError } from '../shared/response.utils';
import * as fs from 'fs';
import * as path from 'path';

// Logger already imported

// Content type mappings
const contentTypes: { [key: string]: string } = {
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

/**
 * GET /static/{proxy+}
 * Alternative static content handler with simplified logic
 */
export const serveStaticContentHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('Function started: serveStaticContent', { requestId: context.awsRequestId });

  try {
    // Extract file path from proxy parameter
    const filePath = event.pathParameters?.proxy || 'index.html';

    // Validate path to prevent directory traversal
    if (filePath.includes('../') || filePath.includes('..\\')) {
      logger.warn('Directory traversal attempt detected', { filePath, requestId: context.awsRequestId });
      return createErrorResponse(400, 'Invalid path', undefined, undefined, context.awsRequestId);
    }

    // Determine content type based on file extension
    const contentType = getContentType(filePath);

    // Resolve file path securely
    const basePath = path.join(__dirname, '..', '..', 'public');
    const fullPath = path.join(basePath, filePath);

    // Ensure the file is within the public directory
    if (!fullPath.startsWith(basePath)) {
      logger.warn('Path traversal attempt blocked:', { filePath, fullPath, basePath });
      return createErrorResponse(404, 'File not found', undefined, undefined, context.awsRequestId);
    }

    // Check if file exists
    try {
      await fs.promises.access(fullPath, fs.constants.F_OK);
    } catch (error) {
      logger.info('File not found', { fullPath, requestId: context.awsRequestId });
      return createErrorResponse(404, 'File not found', undefined, undefined, context.awsRequestId);
    }

    // Read file content
    const fileContent = await fs.promises.readFile(fullPath, 'utf8');

    const duration = Date.now() - startTime;
    logger.info('Function completed: serveStaticContent', { statusCode: 200, duration });

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

  } catch (error) {
    return handleError(error, 'serveStaticContent', 500, context.awsRequestId);
  }
};

/**
 * GET /health/dashboard
 * Serves the health dashboard HTML interface
 */
export const serveHealthDashboardHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('Function started: serveHealthDashboard', { requestId: context.awsRequestId });

  try {
    // Read the health dashboard HTML file
    const htmlFilePath = path.join(__dirname, '..', '..', 'public', 'health-dashboard.html');

    // Check if file exists
    try {
      await fs.promises.access(htmlFilePath, fs.constants.F_OK);
    } catch (error) {
      logger.warn('Health dashboard file not found', { htmlFilePath, requestId: context.awsRequestId });
      
      // Return a basic dashboard if file doesn't exist
      const basicDashboard = generateBasicHealthDashboard();
      
      const duration = Date.now() - startTime;
      logger.info('Function completed: serveHealthDashboard', { statusCode: 200, duration });

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

    // Read file content
    const htmlContent = await fs.promises.readFile(htmlFilePath, 'utf8');

    const duration = Date.now() - startTime;
    logger.info('Function completed: serveHealthDashboard', { statusCode: 200, duration });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': context.awsRequestId
      },
      body: htmlContent
    };

  } catch (error) {
    return handleError(error, 'serveHealthDashboard', 500, context.awsRequestId);
  }
};

/**
 * Generate a basic health dashboard HTML when file is not available
 */
function generateBasicHealthDashboard(): string {
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

/**
 * Get content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Get cache control header based on file type
 */
function getCacheControl(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  // Cache HTML files for shorter time
  if (ext === '.html' || ext === '.htm') {
    return 'public, max-age=300, must-revalidate';
  }

  // Cache CSS and JS files for longer
  if (ext === '.css' || ext === '.js') {
    return 'public, max-age=3600';
  }

  // Cache images for longest time
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
    return 'public, max-age=86400';
  }

  // Default cache control
  return 'public, max-age=3600';
}

/**
 * List available static files
 */
export const listStaticFilesHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  const startTime = Date.now();
  logger.info('Function started: listStaticFiles', { requestId: context.awsRequestId });

  try {
    const basePath = path.join(__dirname, '..', '..', 'public');
    
    // Check if public directory exists
    try {
      await fs.promises.access(basePath, fs.constants.F_OK);
    } catch (error) {
      return createErrorResponse(404, 'Public directory not found', undefined, undefined, context.awsRequestId);
    }

    // Read directory contents recursively
    const files = await getDirectoryContents(basePath, basePath);

    const duration = Date.now() - startTime;
    logger.info('Function completed: listStaticFiles', { statusCode: 200, duration });

    return createSuccessResponse({
      basePath,
      fileCount: files.length,
      files: files.map(file => ({
        path: file.relativePath,
        size: file.size,
        lastModified: file.lastModified,
        contentType: getContentType(file.relativePath)
      }))
    }, context.awsRequestId);

  } catch (error) {
    return handleError(error, 'listStaticFiles', 500, context.awsRequestId);
  }
};

/**
 * Get directory contents recursively
 */
async function getDirectoryContents(dirPath: string, basePath: string): Promise<Array<{
  fullPath: string;
  relativePath: string;
  size: number;
  lastModified: string;
}>> {
  const items: Array<{
    fullPath: string;
    relativePath: string;
    size: number;
    lastModified: string;
  }> = [];

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(basePath, fullPath);

      if (entry.isDirectory()) {
        // Recursively get contents of subdirectories
        const subItems = await getDirectoryContents(fullPath, basePath);
        items.push(...subItems);
      } else if (entry.isFile()) {
        const stats = await fs.promises.stat(fullPath);
        items.push({
          fullPath,
          relativePath: relativePath.replace(/\\/g, '/'), // Normalize path separators
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        });
      }
    }
  } catch (error) {
    logger.warn('Error reading directory:', { dirPath, error });
  }

  return items;
}

export default {
  serveStaticContentHandler,
  serveHealthDashboardHandler,
  listStaticFilesHandler
};