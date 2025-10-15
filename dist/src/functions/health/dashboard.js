"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthDashboardHandler = void 0;
const logger_service_1 = require("../../services/logger.service");
const logger = logger_service_1.LoggerService.getInstance();
const createResponse = (statusCode, body, headers = {}) => ({
    statusCode,
    headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        ...headers
    },
    body: typeof body === 'string' ? body : JSON.stringify(body)
});
const healthDashboardHandler = async (event, context) => {
    const startTime = Date.now();
    try {
        logger.info('Serving health dashboard', {
            requestId: context.awsRequestId,
            functionName: context.functionName
        });
        const dashboardHTML = generateDashboardHTML();
        const duration = Date.now() - startTime;
        logger.info('Health dashboard served successfully', {
            duration,
            requestId: context.awsRequestId
        });
        return createResponse(200, dashboardHTML);
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error('Failed to serve health dashboard', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error',
            duration,
            requestId: context.awsRequestId
        });
        return createResponse(500, '<html><body><h1>Error loading health dashboard</h1></body></html>');
    }
};
exports.healthDashboardHandler = healthDashboardHandler;
function generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HASIVU Platform - Health Dashboard</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      color: #333;
    }
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .status-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background-color: #f9f9f9;
    }
    .status-healthy {
      border-left: 4px solid #28a745;
    }
    .status-degraded {
      border-left: 4px solid #ffc107;
    }
    .status-unhealthy {
      border-left: 4px solid #dc3545;
    }
    .api-links {
      background-color: #e9ecef;
      padding: 20px;
      border-radius: 8px;
    }
    .api-links h3 {
      margin-top: 0;
    }
    .api-links a {
      display: block;
      margin: 10px 0;
      color: #007bff;
      text-decoration: none;
    }
    .api-links a:hover {
      text-decoration: underline;
    }
    .refresh-btn {
      background-color: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    .refresh-btn:hover {
      background-color: #0056b3;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HASIVU Platform Health Dashboard</h1>
      <p>Real-time system health monitoring</p>
      <button class="refresh-btn" onclick="location.reload()">Refresh</button>
    </div>

    <div class="status-grid">
      <div class="status-card status-healthy">
        <h3>Overall System Status</h3>
        <p><strong>Status:</strong> <span id="overall-status">Loading...</span></p>
        <p><strong>Last Updated:</strong> <span id="last-updated">Loading...</span></p>
      </div>

      <div class="status-card">
        <h3>Database</h3>
        <p><strong>Status:</strong> <span id="db-status">Loading...</span></p>
        <p><strong>Response Time:</strong> <span id="db-response">Loading...</span></p>
      </div>

      <div class="status-card">
        <h3>Redis Cache</h3>
        <p><strong>Status:</strong> <span id="redis-status">Loading...</span></p>
        <p><strong>Response Time:</strong> <span id="redis-response">Loading...</span></p>
      </div>

      <div class="status-card">
        <h3>System Metrics</h3>
        <p><strong>Memory Usage:</strong> <span id="memory-usage">Loading...</span></p>
        <p><strong>Uptime:</strong> <span id="uptime">Loading...</span></p>
      </div>
    </div>

    <div class="api-links">
      <h3>Health Check Endpoints</h3>
      <a href="/health/basic" target="_blank">Basic Health Check</a>
      <a href="/health/comprehensive" target="_blank">Comprehensive Health Check</a>
      <a href="/health/detailed" target="_blank">Detailed Health Check</a>
      <a href="/health/database" target="_blank">Database Health Check</a>
      <a href="/health/system" target="_blank">System Health Check</a>
    </div>
  </div>

  <script>
    // Auto-refresh functionality
    function loadHealthData() {
      fetch('/health/comprehensive')
        .then(response => response.json())
        .then(data => {
          if (data.success && data.data) {
            const healthData = data.data;
            
            // Update overall status
            document.getElementById('overall-status').textContent = healthData.status;
            document.getElementById('last-updated').textContent = new Date(healthData.timestamp).toLocaleString();
            
            // Update service statuses
            const dbService = healthData.services.find(s => s.name === 'database');
            if (dbService) {
              document.getElementById('db-status').textContent = dbService.status;
              document.getElementById('db-response').textContent = dbService.responseTime + 'ms';
            }
            
            const redisService = healthData.services.find(s => s.name === 'redis');
            if (redisService) {
              document.getElementById('redis-status').textContent = redisService.status;
              document.getElementById('redis-response').textContent = redisService.responseTime + 'ms';
            }
            
            // Update system metrics
            if (healthData.system) {
              const memoryPercent = Math.round((healthData.system.memory.used / healthData.system.memory.total) * 100);
              document.getElementById('memory-usage').textContent = memoryPercent + '%';
              document.getElementById('uptime').textContent = Math.round(healthData.system.uptime) + 's';
            }
          }
        })
        .catch(error => {
          console.error('Failed to load health data:', error);
          document.getElementById('overall-status').textContent = 'Error loading data';
        });
    }

    // Load data on page load
    loadHealthData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadHealthData, 30000);
  </script>
</body>
</html>
  `;
}
//# sourceMappingURL=dashboard.js.map