/**
 * HASIVU Platform - Analytics Calculators Module
 * Handles KPI calculations and analytics computations
 */

import { logger } from '../../utils/logger';
import { prisma } from '../../database/DatabaseManager';
import { KPI, RevenueAnalytics, UserBehaviorAnalytics } from './types';

type Trend = 'up' | 'down' | 'stable';

interface TrendStats {
  trend: Trend;
  change: number;
  changePercentage: number;
}

export class AnalyticsCalculatorsService {
  /**
   * Calculate key performance indicators
   */
  public static async calculateKPIs(dateRange: { start: Date; end: Date }): Promise<KPI[]> {
    try {
      const [orderStats, revenueStats, retentionStats] = await Promise.all([
        this.getOrderStatistics(dateRange),
        this.getRevenueStatistics(dateRange),
        this.getUserRetentionStatistics(dateRange),
      ]);

      return [
        this.createOrderCompletionKPI(orderStats),
        this.createRevenueKPI(revenueStats),
        this.createUserRetentionKPI(retentionStats),
      ];
    } catch (error: unknown) {
      logger.error(
        'Failed to calculate KPIs',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  /**
   * Create order completion rate KPI
   */
  private static createOrderCompletionKPI(orderStats: any): KPI {
    return {
      id: 'order_completion_rate',
      name: 'Order Completion Rate',
      description: 'Percentage of orders successfully completed',
      current: orderStats.completionRate,
      target: 95,
      percentage: (orderStats.completionRate / 95) * 100,
      trend: orderStats.trend,
      changeValue: orderStats.change,
      changePercentage: orderStats.changePercentage,
      unit: '%',
      format: 'percentage',
    };
  }

  /**
   * Create revenue KPI
   */
  private static createRevenueKPI(revenueStats: any): KPI {
    return {
      id: 'total_revenue',
      name: 'Total Revenue',
      description: 'Total revenue generated in the period',
      current: revenueStats.total,
      target: revenueStats.target,
      percentage: (revenueStats.total / revenueStats.target) * 100,
      trend: revenueStats.trend,
      changeValue: revenueStats.change,
      changePercentage: revenueStats.changePercentage,
      unit: '₹',
      format: 'currency',
    };
  }

  /**
   * Create user retention KPI
   */
  private static createUserRetentionKPI(retentionStats: any): KPI {
    return {
      id: 'user_retention',
      name: 'User Retention Rate',
      description: '30-day user retention rate',
      current: retentionStats.rate,
      target: 80,
      percentage: (retentionStats.rate / 80) * 100,
      trend: retentionStats.trend,
      changeValue: retentionStats.change,
      changePercentage: retentionStats.changePercentage,
      unit: '%',
      format: 'percentage',
    };
  }

  /**
   * Generate revenue analytics
   */
  public static async generateRevenueAnalytics(_dateRange: {
    start: Date;
    end: Date;
  }): Promise<RevenueAnalytics> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const previousRange = this.getPreviousDateRange(dateRange);

    const [currentOrders, previousRevenue, revenueBySchoolRows] = await Promise.all([
      prisma.order.findMany({
        where: this.paidOrderWhere(dateRange),
        select: {
          id: true,
          schoolId: true,
          orderDate: true,
          totalAmount: true,
        },
        orderBy: { orderDate: 'asc' },
      }),
      prisma.order.aggregate({
        where: this.paidOrderWhere(previousRange),
        _sum: { totalAmount: true },
      }),
      prisma.order.groupBy({
        by: ['schoolId'],
        where: this.paidOrderWhere(dateRange),
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    const schoolIds = revenueBySchoolRows.map(row => row.schoolId);
    const schools = schoolIds.length
      ? await prisma.school.findMany({
          where: { id: { in: schoolIds } },
          select: { id: true, name: true },
        })
      : [];
    const schoolNameById = new Map(schools.map(school => [school.id, school.name]));

    const totalRevenue = this.roundMoney(
      currentOrders.reduce((sum, order) => sum + order.totalAmount, 0)
    );
    const orderCount = currentOrders.length;
    const previousTotal = Number(previousRevenue._sum.totalAmount || 0);
    const growth = this.calculateTrend(totalRevenue, previousTotal);

    return {
      totalRevenue,
      recurringRevenue: 0,
      averageOrderValue: orderCount > 0 ? this.roundMoney(totalRevenue / orderCount) : 0,
      revenueGrowthRate: growth.changePercentage,
      revenueBySchool: revenueBySchoolRows.map(row => ({
        schoolId: row.schoolId,
        schoolName: schoolNameById.get(row.schoolId) || 'Unknown School',
        revenue: this.roundMoney(Number(row._sum.totalAmount || 0)),
        orderCount: row._count.id,
      })),
      revenueByPeriod: this.groupOrdersByMonth(currentOrders),
    };
  }

  /**
   * Generate user behavior analytics
   */
  public static async generateUserBehaviorAnalytics(_dateRange: {
    start: Date;
    end: Date;
  }): Promise<UserBehaviorAnalytics> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const previousRange = this.getPreviousDateRange(dateRange);

    const [
      totalUsers,
      activeUsers,
      newUsers,
      previousActiveUsers,
      featureMetrics,
      registrationCount,
      firstOrderUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { lastLoginAt: { gte: dateRange.start, lte: dateRange.end } },
            { orders: { some: { orderDate: { gte: dateRange.start, lte: dateRange.end } } } },
          ],
        },
      }),
      prisma.user.count({ where: { createdAt: { gte: dateRange.start, lte: dateRange.end } } }),
      prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { lastLoginAt: { gte: previousRange.start, lte: previousRange.end } },
            {
              orders: { some: { orderDate: { gte: previousRange.start, lte: previousRange.end } } },
            },
          ],
        },
      }),
      prisma.analyticsMetric.findMany({
        where: {
          name: { startsWith: 'feature.' },
          createdAt: { gte: dateRange.start, lte: dateRange.end },
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.user.count({ where: { createdAt: { gte: dateRange.start, lte: dateRange.end } } }),
      prisma.user.count({
        where: {
          orders: { some: { orderDate: { gte: dateRange.start, lte: dateRange.end } } },
        },
      }),
    ]);

    const retentionRate = totalUsers > 0 ? this.roundPercent((activeUsers / totalUsers) * 100) : 0;
    const previousRetentionRate =
      totalUsers > 0 ? this.roundPercent((previousActiveUsers / totalUsers) * 100) : 0;
    const retentionTrend = this.calculateTrend(retentionRate, previousRetentionRate);

    return {
      totalUsers,
      activeUsers,
      newUsers,
      retentionRate,
      engagementScore: this.roundPercent((retentionRate + Math.min(activeUsers, 100)) / 20),
      mostPopularFeatures: this.aggregateFeatureMetrics(featureMetrics),
      userJourney: [
        {
          step: 'Registration',
          conversionRate: registrationCount > 0 ? 100 : 0,
          dropoffRate: registrationCount > 0 ? 0 : 100,
        },
        {
          step: 'First Order',
          conversionRate:
            registrationCount > 0
              ? this.roundPercent(
                  (Math.min(firstOrderUsers, registrationCount) / registrationCount) * 100
                )
              : 0,
          dropoffRate:
            registrationCount > 0
              ? this.roundPercent(
                  100 - (Math.min(firstOrderUsers, registrationCount) / registrationCount) * 100
                )
              : 100,
        },
      ],
    };
  }

  /**
   * Get order statistics
   */
  private static async getOrderStatistics(_dateRange: { start: Date; end: Date }): Promise<any> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const previousRange = this.getPreviousDateRange(dateRange);

    const [currentTotal, currentCompleted, previousTotal, previousCompleted] = await Promise.all([
      prisma.order.count({ where: { orderDate: { gte: dateRange.start, lte: dateRange.end } } }),
      prisma.order.count({
        where: {
          orderDate: { gte: dateRange.start, lte: dateRange.end },
          status: { in: ['delivered', 'completed'] },
        },
      }),
      prisma.order.count({
        where: { orderDate: { gte: previousRange.start, lte: previousRange.end } },
      }),
      prisma.order.count({
        where: {
          orderDate: { gte: previousRange.start, lte: previousRange.end },
          status: { in: ['delivered', 'completed'] },
        },
      }),
    ]);

    const completionRate =
      currentTotal > 0 ? this.roundPercent((currentCompleted / currentTotal) * 100) : 0;
    const previousRate =
      previousTotal > 0 ? this.roundPercent((previousCompleted / previousTotal) * 100) : 0;
    const trend = this.calculateTrend(completionRate, previousRate);

    return {
      completionRate,
      trend: trend.trend,
      change: trend.change,
      changePercentage: trend.changePercentage,
    };
  }

  /**
   * Get revenue statistics
   */
  private static async getRevenueStatistics(_dateRange: { start: Date; end: Date }): Promise<any> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const previousRange = this.getPreviousDateRange(dateRange);

    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.order.aggregate({
        where: this.paidOrderWhere(dateRange),
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: this.paidOrderWhere(previousRange),
        _sum: { totalAmount: true },
      }),
    ]);

    const total = this.roundMoney(Number(currentRevenue._sum.totalAmount || 0));
    const previousTotal = Number(previousRevenue._sum.totalAmount || 0);
    const trend = this.calculateTrend(total, previousTotal);
    const target = Math.max(this.roundMoney(previousTotal * 1.1), 1);

    return {
      total,
      target,
      trend: trend.trend,
      change: trend.change,
      changePercentage: trend.changePercentage,
    };
  }

  /**
   * Get user retention statistics
   */
  private static async getUserRetentionStatistics(_dateRange: {
    start: Date;
    end: Date;
  }): Promise<any> {
    const dateRange = this.normalizeDateRange(_dateRange);
    const previousRange = this.getPreviousDateRange(dateRange);

    const [totalUsers, activeUsers, previousActiveUsers] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { lastLoginAt: { gte: dateRange.start, lte: dateRange.end } },
            { orders: { some: { orderDate: { gte: dateRange.start, lte: dateRange.end } } } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          OR: [
            { lastLoginAt: { gte: previousRange.start, lte: previousRange.end } },
            {
              orders: { some: { orderDate: { gte: previousRange.start, lte: previousRange.end } } },
            },
          ],
        },
      }),
    ]);

    const rate = totalUsers > 0 ? this.roundPercent((activeUsers / totalUsers) * 100) : 0;
    const previousRate =
      totalUsers > 0 ? this.roundPercent((previousActiveUsers / totalUsers) * 100) : 0;
    const trend = this.calculateTrend(rate, previousRate);

    return {
      rate,
      trend: trend.trend,
      change: trend.change,
      changePercentage: trend.changePercentage,
    };
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

  private static getPreviousDateRange(dateRange: { start: Date; end: Date }): {
    start: Date;
    end: Date;
  } {
    const duration = dateRange.end.getTime() - dateRange.start.getTime();
    return {
      start: new Date(dateRange.start.getTime() - duration),
      end: new Date(dateRange.start.getTime()),
    };
  }

  private static paidOrderWhere(dateRange: { start: Date; end: Date }) {
    return {
      orderDate: { gte: dateRange.start, lte: dateRange.end },
      paymentStatus: { in: ['paid', 'completed', 'captured'] },
      status: { notIn: ['cancelled', 'failed'] },
    };
  }

  private static calculateTrend(current: number, previous: number): TrendStats {
    const change = this.roundNumber(current - previous);
    const changePercentage =
      previous === 0 ? (current > 0 ? 100 : 0) : this.roundPercent((change / previous) * 100);
    const trend: Trend = Math.abs(changePercentage) < 1 ? 'stable' : change > 0 ? 'up' : 'down';

    return { trend, change, changePercentage };
  }

  private static groupOrdersByMonth(
    orders: Array<{ id: string; orderDate: Date; totalAmount: number }>
  ): RevenueAnalytics['revenueByPeriod'] {
    const byMonth = new Map<string, { revenue: number; orders: number }>();

    for (const order of orders) {
      const period = order.orderDate.toISOString().slice(0, 7);
      const existing = byMonth.get(period) || { revenue: 0, orders: 0 };
      byMonth.set(period, {
        revenue: existing.revenue + order.totalAmount,
        orders: existing.orders + 1,
      });
    }

    return Array.from(byMonth.entries()).map(([period, data]) => ({
      period,
      revenue: this.roundMoney(data.revenue),
      orders: data.orders,
    }));
  }

  private static aggregateFeatureMetrics(
    metrics: Array<{ name: string; value: number; metadata: unknown }>
  ): UserBehaviorAnalytics['mostPopularFeatures'] {
    const byFeature = new Map<string, { usageCount: number; users: Set<string> }>();

    for (const metric of metrics) {
      const metadata = this.asRecord(metric.metadata);
      const feature = String(metadata.feature || metric.name.replace(/^feature\./, ''));
      const userId = typeof metadata.userId === 'string' ? metadata.userId : undefined;
      const existing = byFeature.get(feature) || { usageCount: 0, users: new Set<string>() };

      existing.usageCount += Number(metric.value || 1);
      if (userId) {
        existing.users.add(userId);
      }
      byFeature.set(feature, existing);
    }

    return Array.from(byFeature.entries())
      .map(([feature, data]) => ({
        feature,
        usageCount: Math.round(data.usageCount),
        uniqueUsers: data.users.size,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);
  }

  private static asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private static roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private static roundPercent(value: number): number {
    return Math.round(value * 10) / 10;
  }

  private static roundNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
