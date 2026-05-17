/**
 * HASIVU Platform - Payment Analytics Dashboard
 * Comprehensive payment analytics with real-time insights and trends
 * Implements: GET /analytics/payments/dashboard
 */
import { RedisService } from '@/services/redis.service';
import { logger } from '@/utils/logger';
import { PrismaClient } from '@prisma/client';

/**
 * Payment analytics dashboard interface
 */
export interface PaymentAnalyticsDashboard {
  metrics: PaymentMetrics;
  trends: PaymentTrends;
  breakdowns: PaymentBreakdowns;
  topPerformers: TopPerformers;
  alerts: PaymentAlert[];
  recommendations: PaymentRecommendation[];
}

/**
 * Payment metrics interface
 */
export interface PaymentMetrics {
  totalPayments: number;
  totalRevenue: number;
  avgOrderValue: number;
  paymentSuccessRate: number;
  refundRate: number;
  chargebackRate: number;
  newCustomers: number;
  returningCustomers: number;
}

/**
 * Trend data interface
 */
export interface PaymentTrends {
  revenue: TrendPoint[];
  volume: TrendPoint[];
  successRate: TrendPoint[];
  avgOrderValue: TrendPoint[];
}

/**
 * Payment method breakdown interface
 */
export interface PaymentBreakdowns {
  byMethod: PaymentMethodBreakdown[];
  bySchool: SchoolBreakdown[];
  byTimeOfDay: TimeOfDayBreakdown[];
}

/**
 * School payment breakdown interface
 */
export interface SchoolBreakdown {
  schoolId: string;
  schoolName: string;
  totalRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  successRate: number;
}

/**
 * Payment method breakdown interface
 */
export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  revenue: number;
  successRate: number;
  avgProcessingTime: number;
}

/**
 * Time of day breakdown interface
 */
export interface TimeOfDayBreakdown {
  hour: number;
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
}

/**
 * Trend point interface
 */
export interface TrendPoint {
  date: string;
  value: number;
  change?: number;
}

/**
 * Top performer interface
 */
export interface TopPerformers {
  schools: SchoolBreakdown[];
  paymentMethods: PaymentMethodBreakdown[];
  products: ProductPerformance[];
}

/**
 * Product performance interface
 */
export interface ProductPerformance {
  productId: string;
  productName: string;
  orderCount: number;
  revenue: number;
  avgOrderValue: number;
}

/**
 * Payment alert interface
 */
export interface PaymentAlert {
  id: string;
  type: 'high_failure_rate' | 'low_revenue' | 'unusual_pattern';
  severity: 'low' | 'medium' | 'high';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Payment recommendation interface
 */
export interface PaymentRecommendation {
  id: string;
  type: 'optimization' | 'feature' | 'integration';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedImpact: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Payment analytics service class
 */
export class PaymentAnalyticsService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly prisma = new PrismaClient();

  /**
   * Get payment analytics dashboard data
   */
  async getDashboardData(
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly',
    schoolId?: string
  ): Promise<PaymentAnalyticsDashboard> {
    try {
      const startTime = Date.now();
      logger.info('Generating payment analytics dashboard data', { period, schoolId });

      // Generate cache key
      const cacheKey = `payment_analytics:${period}:${schoolId || 'all'}`;

      // Try to get from cache first
      const cached = await RedisService.get(cacheKey);
      if (cached) {
        logger.info('Returning cached payment analytics data');
        return JSON.parse(cached);
      }

      // Generate date range based on period
      const dateRange = this.generateDateRange(period);

      // Get all dashboard data in parallel
      const [metrics, trends, breakdowns, topPerformers, alerts, recommendations] =
        await Promise.all([
          this.getPaymentMetrics(dateRange, schoolId),
          this.getPaymentTrends(dateRange, schoolId),
          this.getPaymentBreakdowns(dateRange, schoolId),
          this.getTopPerformers(dateRange, schoolId),
          this.generateAlerts(dateRange, schoolId),
          this.generateRecommendations(dateRange, schoolId),
        ]);

      const dashboard: PaymentAnalyticsDashboard = {
        metrics,
        trends,
        breakdowns,
        topPerformers,
        alerts,
        recommendations,
      };

      // Cache the result
      await RedisService.setex(cacheKey, this.CACHE_TTL, JSON.stringify(dashboard));

      const duration = Date.now() - startTime;
      logger.info('Payment analytics dashboard data generated successfully', {
        period,
        schoolId: schoolId || 'all',
        duration,
      });

      return dashboard;
    } catch (error) {
      logger.error(
        'Error generating payment analytics dashboard data',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  /**
   * Generate date range based on period
   */
  private generateDateRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'daily':
        startDate.setDate(endDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarterly':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'yearly':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Get payment metrics for the specified period
   */
  private async getPaymentMetrics(
    dateRange: { startDate: Date; endDate: Date },
    schoolId?: string
  ): Promise<PaymentMetrics> {
    const where = this.buildPaymentWhere(dateRange, schoolId);
    const completedWhere = { ...where, status: { in: ['completed', 'captured', 'paid'] } };
    const refundedWhere = { ...where, status: { in: ['refunded', 'partially_refunded'] } };

    const [totalPayments, completedPayments, failedPayments, refundedPayments, revenue, customers] =
      await Promise.all([
        this.prisma.payment.count({ where }),
        this.prisma.payment.count({ where: completedWhere }),
        this.prisma.payment.count({ where: { ...where, status: { in: ['failed', 'cancelled'] } } }),
        this.prisma.payment.count({ where: refundedWhere }),
        this.prisma.payment.aggregate({ where: completedWhere, _sum: { amount: true } }),
        this.prisma.payment.groupBy({
          by: ['userId'],
          where,
          _min: { createdAt: true },
        }),
      ]);

    const totalRevenue = revenue._sum.amount || 0;
    const newCustomers = customers.filter(
      customer =>
        customer._min.createdAt &&
        customer._min.createdAt >= dateRange.startDate &&
        customer._min.createdAt <= dateRange.endDate
    ).length;

    return {
      totalPayments,
      totalRevenue,
      avgOrderValue: completedPayments === 0 ? 0 : totalRevenue / completedPayments,
      paymentSuccessRate: totalPayments === 0 ? 0 : (completedPayments / totalPayments) * 100,
      refundRate: totalPayments === 0 ? 0 : (refundedPayments / totalPayments) * 100,
      chargebackRate: totalPayments === 0 ? 0 : (failedPayments / totalPayments) * 100,
      newCustomers,
      returningCustomers: Math.max(customers.length - newCustomers, 0),
    };
  }

  /**
   * Get payment trends for the specified period
   */
  private async getPaymentTrends(
    dateRange: { startDate: Date; endDate: Date },
    schoolId?: string
  ): Promise<PaymentTrends> {
    const payments = await this.prisma.payment.findMany({
      where: this.buildPaymentWhere(dateRange, schoolId),
      select: { amount: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<
      string,
      { revenue: number; volume: number; completed: number; total: number }
    >();

    for (const payment of payments) {
      const key = payment.createdAt.toISOString().slice(0, 10);
      const bucket = buckets.get(key) || { revenue: 0, volume: 0, completed: 0, total: 0 };
      bucket.total += 1;
      bucket.volume += 1;
      if (['completed', 'captured', 'paid'].includes(payment.status)) {
        bucket.completed += 1;
        bucket.revenue += payment.amount;
      }
      buckets.set(key, bucket);
    }

    const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b));

    return {
      revenue: this.withChange(sorted.map(([date, value]) => ({ date, value: value.revenue }))),
      volume: this.withChange(sorted.map(([date, value]) => ({ date, value: value.volume }))),
      successRate: this.withChange(
        sorted.map(([date, value]) => ({
          date,
          value: value.total === 0 ? 0 : (value.completed / value.total) * 100,
        }))
      ),
      avgOrderValue: this.withChange(
        sorted.map(([date, value]) => ({
          date,
          value: value.completed === 0 ? 0 : value.revenue / value.completed,
        }))
      ),
    };
  }

  /**
   * Get payment breakdowns for the specified period
   */
  private async getPaymentBreakdowns(
    dateRange: { startDate: Date; endDate: Date },
    schoolId?: string
  ): Promise<PaymentBreakdowns> {
    const payments = await this.prisma.payment.findMany({
      where: this.buildPaymentWhere(dateRange, schoolId),
      include: {
        order: {
          include: {
            school: { select: { id: true, name: true } },
          },
        },
      },
    });

    return {
      byMethod: this.buildMethodBreakdown(payments),
      bySchool: this.buildSchoolBreakdown(payments),
      byTimeOfDay: this.buildTimeBreakdown(payments),
    };
  }

  /**
   * Get top performers for the specified period
   */
  private async getTopPerformers(
    dateRange: { startDate: Date; endDate: Date },
    schoolId?: string
  ): Promise<TopPerformers> {
    const breakdowns = await this.getPaymentBreakdowns(dateRange, schoolId);
    const productRows = await this.prisma.orderItem.findMany({
      where: {
        order: {
          ...(schoolId ? { schoolId } : {}),
          payments: {
            some: {
              status: { in: ['completed', 'captured', 'paid'] },
              createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
            },
          },
        },
      },
      include: { menuItem: { select: { id: true, name: true } } },
    });

    const productMap = new Map<string, ProductPerformance>();
    for (const row of productRows) {
      const existing =
        productMap.get(row.menuItemId) ||
        ({
          productId: row.menuItemId,
          productName: row.menuItem.name,
          orderCount: 0,
          revenue: 0,
          avgOrderValue: 0,
        } satisfies ProductPerformance);
      existing.orderCount += row.quantity;
      existing.revenue += row.totalPrice;
      existing.avgOrderValue =
        existing.orderCount === 0 ? 0 : existing.revenue / existing.orderCount;
      productMap.set(row.menuItemId, existing);
    }

    return {
      schools: breakdowns.bySchool.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5),
      paymentMethods: breakdowns.byMethod.sort((a, b) => b.revenue - a.revenue).slice(0, 5),
      products: [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    };
  }

  /**
   * Generate alerts based on payment data analysis
   */
  private async generateAlerts(
    dateRange: { startDate: Date; endDate: Date },
    schoolId?: string
  ): Promise<PaymentAlert[]> {
    const metrics = await this.getPaymentMetrics(dateRange, schoolId);
    const alerts: PaymentAlert[] = [];

    if (metrics.totalPayments >= 10 && metrics.paymentSuccessRate < 90) {
      alerts.push({
        id: `payment_success_${dateRange.endDate.toISOString()}`,
        type: 'high_failure_rate',
        severity: metrics.paymentSuccessRate < 80 ? 'high' : 'medium',
        message: `Payment success rate is ${metrics.paymentSuccessRate.toFixed(1)}% for the selected period.`,
        timestamp: new Date(),
        metadata: { successRate: metrics.paymentSuccessRate, totalPayments: metrics.totalPayments },
      });
    }

    if (metrics.totalPayments > 0 && metrics.totalRevenue === 0) {
      alerts.push({
        id: `payment_revenue_${dateRange.endDate.toISOString()}`,
        type: 'low_revenue',
        severity: 'medium',
        message: 'Payments exist for the period, but no completed revenue was recorded.',
        timestamp: new Date(),
        metadata: { totalPayments: metrics.totalPayments },
      });
    }

    return alerts;
  }

  /**
   * Generate recommendations based on payment analysis
   */
  private async generateRecommendations(
    dateRange: { startDate: Date; endDate: Date },
    schoolId?: string
  ): Promise<PaymentRecommendation[]> {
    const metrics = await this.getPaymentMetrics(dateRange, schoolId);
    const recommendations: PaymentRecommendation[] = [];

    if (metrics.totalPayments >= 10 && metrics.paymentSuccessRate < 95) {
      recommendations.push({
        id: 'payment-retry-tuning',
        type: 'optimization',
        priority: metrics.paymentSuccessRate < 90 ? 'high' : 'medium',
        title: 'Review failed payment retry flow',
        description:
          'Payment success rate is below target. Inspect gateway failure reasons and retry timing.',
        estimatedImpact: 'Reduced checkout drop-off and fewer manual support tickets.',
        effort: 'medium',
      });
    }

    if (metrics.refundRate > 5) {
      recommendations.push({
        id: 'refund-root-cause-review',
        type: 'optimization',
        priority: 'medium',
        title: 'Investigate elevated refund rate',
        description:
          'Refund rate is above the operational threshold. Review cancellation reasons and menu availability.',
        estimatedImpact: 'Lower refund operations and improved parent trust.',
        effort: 'medium',
      });
    }

    return recommendations;
  }

  private buildPaymentWhere(dateRange: { startDate: Date; endDate: Date }, schoolId?: string) {
    return {
      createdAt: { gte: dateRange.startDate, lte: dateRange.endDate },
      ...(schoolId
        ? {
            order: {
              schoolId,
            },
          }
        : {}),
    };
  }

  private withChange(points: Array<{ date: string; value: number }>): TrendPoint[] {
    return points.map((point, index) => {
      const previous = points[index - 1]?.value;
      return {
        ...point,
        change:
          previous === undefined || previous === 0
            ? undefined
            : ((point.value - previous) / previous) * 100,
      };
    });
  }

  private buildMethodBreakdown(
    payments: Array<{ paymentType: string; status: string; amount: number; createdAt: Date }>
  ): PaymentMethodBreakdown[] {
    const byMethod = new Map<string, { count: number; completed: number; revenue: number }>();
    for (const payment of payments) {
      const key = payment.paymentType || 'unknown';
      const row = byMethod.get(key) || { count: 0, completed: 0, revenue: 0 };
      row.count += 1;
      if (['completed', 'captured', 'paid'].includes(payment.status)) {
        row.completed += 1;
        row.revenue += payment.amount;
      }
      byMethod.set(key, row);
    }

    return [...byMethod.entries()].map(([method, row]) => ({
      method,
      count: row.count,
      revenue: row.revenue,
      successRate: row.count === 0 ? 0 : (row.completed / row.count) * 100,
      avgProcessingTime: 0,
    }));
  }

  private buildSchoolBreakdown(
    payments: Array<{
      status: string;
      amount: number;
      order?: { school?: { id: string; name: string } | null } | null;
    }>
  ): SchoolBreakdown[] {
    const bySchool = new Map<string, SchoolBreakdown & { completed: number; total: number }>();
    for (const payment of payments) {
      const school = payment.order?.school;
      const key = school?.id || 'unassigned';
      const row =
        bySchool.get(key) ||
        ({
          schoolId: key,
          schoolName: school?.name || 'Unassigned',
          totalRevenue: 0,
          orderCount: 0,
          avgOrderValue: 0,
          successRate: 0,
          completed: 0,
          total: 0,
        } as SchoolBreakdown & { completed: number; total: number });

      row.total += 1;
      if (['completed', 'captured', 'paid'].includes(payment.status)) {
        row.completed += 1;
        row.orderCount += 1;
        row.totalRevenue += payment.amount;
      }
      row.avgOrderValue = row.orderCount === 0 ? 0 : row.totalRevenue / row.orderCount;
      row.successRate = row.total === 0 ? 0 : (row.completed / row.total) * 100;
      bySchool.set(key, row);
    }

    return [...bySchool.values()].map(({ completed: _completed, total: _total, ...row }) => row);
  }

  private buildTimeBreakdown(
    payments: Array<{ status: string; amount: number; createdAt: Date }>
  ): TimeOfDayBreakdown[] {
    const byHour = new Map<number, TimeOfDayBreakdown>();
    for (const payment of payments) {
      const hour = payment.createdAt.getHours();
      const row = byHour.get(hour) || { hour, orderCount: 0, revenue: 0, avgOrderValue: 0 };
      if (['completed', 'captured', 'paid'].includes(payment.status)) {
        row.orderCount += 1;
        row.revenue += payment.amount;
        row.avgOrderValue = row.orderCount === 0 ? 0 : row.revenue / row.orderCount;
      }
      byHour.set(hour, row);
    }

    return [...byHour.values()].sort((a, b) => a.hour - b.hour);
  }
}

export default PaymentAnalyticsService;
