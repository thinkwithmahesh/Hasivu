/**
 * HASIVU Platform - Report Generation Module
 * Handles periodic report generation (hourly, daily, weekly, monthly)
 */

import { logger } from '../../utils/logger';
import { cache } from '../../utils/cache';
import { AnalyticsReport, ServiceResponse, TimePeriod } from './types';
import { QueryExecutionService } from './query-execution';
import { AnalyticsCalculatorsService } from './analytics-calculators';
import { DashboardGenerationService } from './dashboard-generation';

export class ReportGenerationService {
  private static readonly CACHE_TTL = 3600; // 1 hour

  /**
   * Generate periodic reports (hourly, daily, weekly, monthly)
   */
  public static async generateReport(
    period: TimePeriod,
    reportType: 'summary' | 'detailed' | 'executive'
  ): Promise<ServiceResponse<AnalyticsReport>> {
    try {
      const reportId = `${period}_${reportType}_${Date.now()}`;

      const cacheKey = `report:${reportId}`;
      const cached = await cache.get(cacheKey);

      if (cached) {
        return {
          success: true,
          data: JSON.parse(cached),
        };
      }

      const dateRange = QueryExecutionService.calculatePeriodRange(period);

      const report: AnalyticsReport = {
        id: reportId,
        title: `${period.charAt(0).toUpperCase() + period.slice(1)} ${reportType} Report`,
        type: 'scheduled',
        period,
        metrics: [],
        data: [],
        filters: { period, reportType },
        generatedAt: new Date(),
        generatedBy: 'system',
      };

      // Generate report content based on type
      switch (reportType) {
        case 'summary':
          report.data = await this.generateSummaryReport(dateRange);
          break;
        case 'detailed':
          report.data = await this.generateDetailedReport(dateRange);
          break;
        case 'executive':
          report.data = await this.generateExecutiveReport(dateRange);
          break;
      }

      // Cache for appropriate duration
      const cacheDuration = this.CACHE_TTL;
      await cache.setex(cacheKey, cacheDuration, JSON.stringify(report));

      logger.info('Report generated successfully', {
        reportId,
        period,
        reportType,
        dataPoints: report.data.length,
      });

      return {
        success: true,
        data: report,
      };
    } catch (error: unknown) {
      logger.error(
        'Failed to generate report',
        error instanceof Error ? error : new Error(String(error)),
        { period, reportType }
      );
      return {
        success: false,
        error: {
          message: 'Failed to generate report',
          code: 'REPORT_GENERATION_FAILED',
          details: error,
        },
      };
    }
  }

  /**
   * Generate summary report
   */
  private static async generateSummaryReport(_dateRange: {
    start: Date;
    end: Date;
  }): Promise<any[]> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const [kpis, revenueAnalytics, userBehavior] = await Promise.all([
      AnalyticsCalculatorsService.calculateKPIs(dateRange),
      AnalyticsCalculatorsService.generateRevenueAnalytics(dateRange),
      AnalyticsCalculatorsService.generateUserBehaviorAnalytics(dateRange),
    ]);

    return [
      {
        section: 'summary',
        dateRange,
        kpis,
        totals: {
          revenue: revenueAnalytics.totalRevenue,
          orders: revenueAnalytics.revenueByPeriod.reduce((sum, period) => sum + period.orders, 0),
          activeUsers: userBehavior.activeUsers,
          newUsers: userBehavior.newUsers,
        },
      },
    ];
  }

  /**
   * Generate detailed report
   */
  private static async generateDetailedReport(_dateRange: {
    start: Date;
    end: Date;
  }): Promise<any[]> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const [kpis, revenueAnalytics, userBehavior, dashboard] = await Promise.all([
      AnalyticsCalculatorsService.calculateKPIs(dateRange),
      AnalyticsCalculatorsService.generateRevenueAnalytics(dateRange),
      AnalyticsCalculatorsService.generateUserBehaviorAnalytics(dateRange),
      DashboardGenerationService.generateDashboard('scheduled-detailed', 'system', dateRange),
    ]);

    return [
      {
        section: 'kpis',
        rows: kpis,
      },
      {
        section: 'revenue_by_school',
        rows: revenueAnalytics.revenueBySchool,
      },
      {
        section: 'revenue_by_period',
        rows: revenueAnalytics.revenueByPeriod,
      },
      {
        section: 'user_behavior',
        rows: {
          totalUsers: userBehavior.totalUsers,
          activeUsers: userBehavior.activeUsers,
          newUsers: userBehavior.newUsers,
          retentionRate: userBehavior.retentionRate,
          engagementScore: userBehavior.engagementScore,
        },
      },
      {
        section: 'order_trends',
        rows: dashboard.success ? dashboard.data?.orderTrends || [] : [],
      },
    ];
  }

  /**
   * Generate executive report
   */
  private static async generateExecutiveReport(_dateRange: {
    start: Date;
    end: Date;
  }): Promise<any[]> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const [kpis, revenueAnalytics, userBehavior] = await Promise.all([
      AnalyticsCalculatorsService.calculateKPIs(dateRange),
      AnalyticsCalculatorsService.generateRevenueAnalytics(dateRange),
      AnalyticsCalculatorsService.generateUserBehaviorAnalytics(dateRange),
    ]);

    const atRiskKpis = kpis.filter(kpi => kpi.percentage < 80);

    return [
      {
        section: 'executive_overview',
        dateRange,
        revenue: {
          total: revenueAnalytics.totalRevenue,
          growthRate: revenueAnalytics.revenueGrowthRate,
          averageOrderValue: revenueAnalytics.averageOrderValue,
        },
        users: {
          active: userBehavior.activeUsers,
          new: userBehavior.newUsers,
          retentionRate: userBehavior.retentionRate,
        },
        atRiskKpis,
        recommendations: this.buildExecutiveActions(atRiskKpis),
      },
    ];
  }

  private static normalizeDateRange(dateRange: { start: Date; end: Date }): {
    start: Date;
    end: Date;
  } {
    return {
      start: new Date(dateRange.start),
      end: new Date(dateRange.end),
    };
  }

  private static buildExecutiveActions(kpis: Array<{ id: string; name: string }>): string[] {
    if (kpis.length === 0) {
      return ['Maintain current operations and monitor trend changes in the next report period.'];
    }

    return kpis.map(kpi => {
      switch (kpi.id) {
        case 'order_completion_rate':
          return 'Review delayed/cancelled order causes with kitchen operations.';
        case 'total_revenue':
          return 'Review menu availability, checkout conversion, and school-level revenue distribution.';
        case 'user_retention':
          return 'Review parent engagement, login/session friction, and first-order conversion.';
        default:
          return `Review KPI: ${kpi.name}.`;
      }
    });
  }
}
