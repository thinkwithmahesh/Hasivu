/**
 * HASIVU Platform - Analytics Routes
 * Analytics and reporting API endpoints
 */

import express, { Response, NextFunction } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { AnalyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger';

const router = express.Router();

function getAuthenticatedUser(
  req: AuthenticatedRequest
): NonNullable<AuthenticatedRequest['user']> {
  if (!req.user) {
    throw Object.assign(new Error('Authenticated user missing'), { statusCode: 401 });
  }
  return req.user;
}

/**
 * Access control: restrict analytics to admin roles
 */
const requireAnalyticsAccess = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!['admin', 'super_admin', 'school_admin'].includes(req.user?.role || '')) {
    res
      .status(403)
      .json({ success: false, error: 'Insufficient permissions for analytics access' });
    return;
  }
  next();
};

router.use(authMiddleware);
router.use(requireAnalyticsAccess);

/**
 * GET /api/v1/analytics/dashboard
 * Get dashboard analytics data
 */
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || '30d';
    const dashboardId = (req.query.dashboardId as string) || 'default';

    const dateRange = parsePeriod(period);
    const user = getAuthenticatedUser(req);
    const result = await AnalyticsService.generateDashboard(dashboardId, user.id, dateRange);

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * GET /api/v1/analytics/realtime
 * Get real-time metrics
 */
router.get('/realtime', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const metrics = await AnalyticsService.getRealtimeMetrics();

    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * POST /api/v1/analytics/query
 * Execute custom analytics query
 */
router.post('/query', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { metrics, dateRange, dimensions, filters, groupBy } = req.body;

    if (!metrics || !dateRange) {
      res.status(400).json({
        success: false,
        error: 'metrics and dateRange are required',
      });
      return;
    }

    const result = await AnalyticsService.executeQuery({
      metrics,
      dateRange: {
        start: new Date(dateRange.start),
        end: new Date(dateRange.end),
      },
      dimensions,
      filters,
      groupBy,
    });

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * GET /api/v1/analytics/report
 * Generate a report
 */
router.get('/report', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const period = (req.query.period as string) || 'daily';
    const reportType = (req.query.type as string) || 'summary';

    const result = await AnalyticsService.generateReport(period as any, reportType as any);

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * GET /api/v1/analytics/cohort
 * Get cohort analysis
 */
router.get('/cohort', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const result = await AnalyticsService.generateCohortAnalysis(startDate, endDate);

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * GET /api/v1/analytics/predictive
 * Get predictive analytics
 */
router.get('/predictive', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await AnalyticsService.generatePredictiveAnalytics();

    res.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

/**
 * POST /api/v1/analytics/track
 * Track a custom metric
 */
router.post('/track', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, value, dimensions, metadata } = req.body;

    if (!name || value === undefined) {
      res.status(400).json({ success: false, error: 'name and value are required' });
      return;
    }

    const result = await AnalyticsService.trackMetric(name, value, dimensions, metadata);

    res.json({
      success: true,
      data: result.data,
      message: 'Metric tracked',
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    next(error);
  }
});

// Helper: parse period string to date range
function parsePeriod(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case '7d':
      start.setDate(start.getDate() - 7);
      break;
    case '30d':
      start.setDate(start.getDate() - 30);
      break;
    case '90d':
      start.setDate(start.getDate() - 90);
      break;
    case '1y':
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

export default router;
