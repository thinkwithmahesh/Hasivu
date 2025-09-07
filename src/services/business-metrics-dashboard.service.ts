/**
 * HASIVU Platform - Business Metrics Dashboard Service
 * Real-time business metrics collection, analysis, and dashboard generation
 * for executive and operational decision making
 * @author HASIVU Development Team
 * @version 2.0.0
 * @since 2024
 */

import { PrismaClient } from '@prisma/client';
import { DatabaseService } from '../functions/shared/database.service';
import { logger } from '../utils/logger';

interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: number;
    weekly: number;
    daily: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    averageOrderValue: number;
  };
  customers: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  schools: {
    total: number;
    active: number;
    subscriptionRate: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
}

interface TimeRange {
  startDate: Date;
  endDate: Date;
}

interface MetricsFilter {
  schoolId?: string;
  region?: string;
  subscriptionTier?: string;
  timeRange?: TimeRange;
}

export class BusinessMetricsDashboardService {
  private static prisma = DatabaseService.client;

  /**
   * Get comprehensive business dashboard metrics
   */
  static async getDashboardMetrics(filters: MetricsFilter = {}): Promise<BusinessMetrics> {
    try {
      const [revenue, orders, customers, schools, performance] = await Promise.all([
        this.getRevenueMetrics(filters),
        this.getOrderMetrics(filters),
        this.getCustomerMetrics(filters),
        this.getSchoolMetrics(filters),
        this.getPerformanceMetrics(filters)
      ]);

      return {
        revenue,
        orders,
        customers,
        schools,
        performance
      };
    } catch (error) {
      logger.error('Failed to get dashboard metrics:', error);
      throw new Error('Failed to retrieve business metrics');
    }
  }

  /**
   * Get revenue metrics
   */
  private static async getRevenueMetrics(filters: MetricsFilter): Promise<BusinessMetrics['revenue']> {
    const baseWhere = this.buildBaseWhereClause(filters);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      previousMonthRevenue
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { ...baseWhere, status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { 
          ...baseWhere, 
          status: 'SUCCESS',
          createdAt: { gte: monthStart }
        },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { 
          ...baseWhere, 
          status: 'SUCCESS',
          createdAt: { gte: weekStart }
        },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { 
          ...baseWhere, 
          status: 'SUCCESS',
          createdAt: { gte: dayStart }
        },
        _sum: { amount: true }
      }),
      this.prisma.payment.aggregate({
        where: { 
          ...baseWhere, 
          status: 'SUCCESS',
          createdAt: { 
            gte: new Date(monthStart.getTime() - 30 * 24 * 60 * 60 * 1000),
            lt: monthStart
          }
        },
        _sum: { amount: true }
      })
    ]);

    const currentMonth = monthlyRevenue._sum.amount || 0;
    const previousMonth = previousMonthRevenue._sum.amount || 0;
    const growth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

    return {
      total: totalRevenue._sum.amount || 0,
      monthly: currentMonth,
      weekly: weeklyRevenue._sum.amount || 0,
      daily: dailyRevenue._sum.amount || 0,
      growth: Math.round(growth * 100) / 100
    };
  }

  /**
   * Get order metrics
   */
  private static async getOrderMetrics(filters: MetricsFilter): Promise<BusinessMetrics['orders']> {
    const baseWhere = this.buildBaseWhereClause(filters);

    const [
      totalOrders,
      ordersByStatus,
      averageOrderValue
    ] = await Promise.all([
      this.prisma.order.count({ where: baseWhere }),
      this.prisma.order.groupBy({
        by: ['status'],
        where: baseWhere,
        _count: { status: true }
      }),
      this.prisma.order.aggregate({
        where: { ...baseWhere, status: { not: 'CANCELLED' } },
        _avg: { totalAmount: true }
      })
    ]);

    const statusCounts = ordersByStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalOrders,
      pending: statusCounts.pending || 0,
      completed: statusCounts.completed || statusCounts.delivered || 0,
      cancelled: statusCounts.cancelled || 0,
      averageOrderValue: Math.round((averageOrderValue._avg.totalAmount || 0) * 100) / 100
    };
  }

  /**
   * Get customer metrics
   */
  private static async getCustomerMetrics(filters: MetricsFilter): Promise<BusinessMetrics['customers']> {
    const baseWhere = this.buildBaseWhereClause(filters);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalCustomers,
      activeCustomers,
      newCustomers,
      returningCustomers
    ] = await Promise.all([
      this.prisma.user.count({ 
        where: { 
          ...baseWhere, 
          role: { not: 'ADMIN' }
        }
      }),
      this.prisma.user.count({ 
        where: { 
          ...baseWhere, 
          role: { not: 'ADMIN' },
          lastLoginAt: { gte: thirtyDaysAgo }
        }
      }),
      this.prisma.user.count({ 
        where: { 
          ...baseWhere, 
          role: { not: 'ADMIN' },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      this.prisma.order.groupBy({
        by: ['userId'],
        where: baseWhere,
        having: {
          userId: {
            _count: {
              gt: 1
            }
          }
        },
        _count: {
          userId: true
        }
      })
    ]);

    const retention = totalCustomers > 0 
      ? Math.round((returningCustomers.length / totalCustomers) * 100 * 100) / 100 
      : 0;

    return {
      total: totalCustomers,
      active: activeCustomers,
      new: newCustomers,
      retention
    };
  }

  /**
   * Get school metrics
   */
  private static async getSchoolMetrics(filters: MetricsFilter): Promise<BusinessMetrics['schools']> {
    const baseWhere = this.buildSchoolWhereClause(filters);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalSchools,
      activeSchools,
      subscribedSchools
    ] = await Promise.all([
      this.prisma.school.count({ where: baseWhere }),
      this.prisma.school.count({ 
        where: { 
          ...baseWhere, 
          updatedAt: { gte: thirtyDaysAgo }
        }
      }),
      this.prisma.subscription.count({ 
        where: { 
          status: 'ACTIVE',
          endDate: { gte: new Date() }
        }
      })
    ]);

    const subscriptionRate = totalSchools > 0 
      ? Math.round((subscribedSchools / totalSchools) * 100 * 100) / 100 
      : 0;

    return {
      total: totalSchools,
      active: activeSchools,
      subscriptionRate
    };
  }

  /**
   * Get performance metrics
   */
  private static async getPerformanceMetrics(filters: MetricsFilter): Promise<BusinessMetrics['performance']> {
    // This would typically come from monitoring services like CloudWatch, New Relic, etc.
    // For now, we'll return mock data or basic calculations
    
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Note: errorLog and requestLog models not defined in current schema
    // Using fallback implementation until proper logging infrastructure is added
    const [
      errorCount,
      totalRequests
    ] = await Promise.all([
      Promise.resolve(0), // Fallback: errorLog model not available
      Promise.resolve(100) // Fallback: requestLog model not available, use reasonable default
    ]);

    const errorRate = totalRequests > 0 
      ? Math.round((errorCount / totalRequests) * 100 * 100) / 100 
      : 0;

    return {
      responseTime: 150, // Mock data - would come from APM
      uptime: 99.9,     // Mock data - would come from monitoring
      errorRate,
      throughput: Math.round(totalRequests / 24) // Requests per hour
    };
  }

  /**
   * Get time-series data for charts
   */
  static async getTimeSeriesData(
    metric: keyof BusinessMetrics,
    filters: MetricsFilter = {},
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    try {
      const timeRange = filters.timeRange || {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      };

      switch (metric) {
        case 'revenue':
          return this.getRevenueTimeSeries(timeRange, granularity, filters);
        case 'orders':
          return this.getOrdersTimeSeries(timeRange, granularity, filters);
        case 'customers':
          return this.getCustomersTimeSeries(timeRange, granularity, filters);
        default:
          throw new Error(`Time series not supported for metric: ${metric}`);
      }
    } catch (error) {
      logger.error('Failed to get time series data:', error);
      throw new Error('Failed to retrieve time series data');
    }
  }

  /**
   * Get revenue time series
   */
  private static async getRevenueTimeSeries(
    timeRange: TimeRange,
    granularity: string,
    filters: MetricsFilter
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const baseWhere = this.buildBaseWhereClause(filters);

    // This is a simplified implementation
    // In production, you'd want to use database-specific date functions
    const payments = await this.prisma.payment.findMany({
      where: {
        ...baseWhere,
        status: 'SUCCESS',
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        }
      },
      select: {
        amount: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by time period (simplified - would use database grouping in production)
    const groupedData: Record<string, number> = {};
    
    payments.forEach(payment => {
      const key = this.getTimeKey(payment.createdAt, granularity);
      groupedData[key] = (groupedData[key] || 0) + payment.amount;
    });

    return Object.entries(groupedData).map(([timestamp, value]) => ({
      timestamp: new Date(timestamp),
      value
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get orders time series
   */
  private static async getOrdersTimeSeries(
    timeRange: TimeRange,
    granularity: string,
    filters: MetricsFilter
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const baseWhere = this.buildBaseWhereClause(filters);

    const orders = await this.prisma.order.findMany({
      where: {
        ...baseWhere,
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const groupedData: Record<string, number> = {};
    
    orders.forEach(order => {
      const key = this.getTimeKey(order.createdAt, granularity);
      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    return Object.entries(groupedData).map(([timestamp, value]) => ({
      timestamp: new Date(timestamp),
      value
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get customers time series
   */
  private static async getCustomersTimeSeries(
    timeRange: TimeRange,
    granularity: string,
    filters: MetricsFilter
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    const baseWhere = this.buildBaseWhereClause(filters);

    const users = await this.prisma.user.findMany({
      where: {
        ...baseWhere,
        role: { not: 'ADMIN' },
        createdAt: {
          gte: timeRange.startDate,
          lte: timeRange.endDate
        }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const groupedData: Record<string, number> = {};
    
    users.forEach(user => {
      const key = this.getTimeKey(user.createdAt, granularity);
      groupedData[key] = (groupedData[key] || 0) + 1;
    });

    return Object.entries(groupedData).map(([timestamp, value]) => ({
      timestamp: new Date(timestamp),
      value
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Build base where clause for filtering
   */
  private static buildBaseWhereClause(filters: MetricsFilter): any {
    const where: any = {};

    if (filters.schoolId) {
      where.schoolId = filters.schoolId;
    }

    if (filters.timeRange) {
      where.createdAt = {
        gte: filters.timeRange.startDate,
        lte: filters.timeRange.endDate
      };
    }

    return where;
  }

  /**
   * Build school-specific where clause
   */
  private static buildSchoolWhereClause(filters: MetricsFilter): any {
    const where: any = {};

    if (filters.region) {
      where.region = filters.region;
    }

    if (filters.subscriptionTier) {
      where.subscriptionTier = filters.subscriptionTier;
    }

    if (filters.timeRange) {
      where.createdAt = {
        gte: filters.timeRange.startDate,
        lte: filters.timeRange.endDate
      };
    }

    return where;
  }

  /**
   * Generate time key for grouping
   */
  private static getTimeKey(date: Date, granularity: string): string {
    switch (granularity) {
      case 'hour':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
      case 'day':
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      case 'week':
        const week = new Date(date);
        week.setDate(date.getDate() - date.getDay());
        return new Date(week.getFullYear(), week.getMonth(), week.getDate()).toISOString();
      case 'month':
        return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      default:
        return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    }
  }

  /**
   * Get real-time metrics update
   */
  static async getRealTimeUpdate(filters: MetricsFilter = {}): Promise<Partial<BusinessMetrics>> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const realtimeFilters = {
        ...filters,
        timeRange: {
          startDate: fiveMinutesAgo,
          endDate: new Date()
        }
      };

      const [revenue, orders] = await Promise.all([
        this.getRevenueMetrics(realtimeFilters),
        this.getOrderMetrics(realtimeFilters)
      ]);

      return {
        revenue: {
          ...revenue,
          // Only return recent data for real-time
          total: revenue.daily,
          monthly: revenue.daily,
          weekly: revenue.daily,
          daily: revenue.daily,
          growth: revenue.growth
        },
        orders: {
          ...orders,
          // Show recent order activity
          total: orders.total
        }
      };
    } catch (error) {
      logger.error('Failed to get real-time update:', error);
      throw new Error('Failed to get real-time metrics update');
    }
  }
}

export default BusinessMetricsDashboardService;