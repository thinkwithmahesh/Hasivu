// Health check endpoint for production monitoring
export default function handler(req, res) {
  // Check database connection (mock for now)
  const dbStatus = 'connected'; // Replace with actual DB check

  // Check external services (mock for now)
  const servicesStatus = {
    database: 'healthy',
    cache: 'healthy',
    storage: 'healthy',
  };

  // System metrics
  const systemMetrics = {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  };

  // Overall health status
  const isHealthy =
    dbStatus === 'connected' && Object.values(servicesStatus).every(status => status === 'healthy');

  const healthData = {
    status: isHealthy ? 'healthy' : 'unhealthy',
    services: servicesStatus,
    system: systemMetrics,
    version: process.env.npm_package_version || '1.0.0',
  };

  // Return appropriate status code
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json(healthData);
}
