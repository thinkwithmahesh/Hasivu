/**
 * HASIVU Platform - Comprehensive Analytics Service
 * Maps all 12 backend analytics API endpoints
 * Supports real-time dashboards, revenue tracking, order analytics, and performance reporting
 * Role-based analytics for admin, kitchen, parent, and teacher roles
 *
 * Wave 2 Phase 1: Analytics Service Implementation
 */

import apiClient from './api';

// ============================================================================
// Core Data Types & Interfaces
// ============================================================================

/**
 * User role types for role-based analytics
 */
export type UserRole = 'admin' | 'kitchen' | 'parent' | 'teacher' | 'school_admin';

/**
 * Time period options for analytics queries
 */
export type TimePeriod = 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

/**
 * Date grouping options for aggregation
 */
export type DateGrouping = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Export file formats
 */
export type ExportFormat = 'csv' | 'pdf' | 'excel' | 'json';

/**
 * Analytics report types
 */
export type ReportType =
  | 'revenue'
  | 'orders'
  | 'students'
  | 'inventory'
  | 'kitchen'
  | 'compliance'
  | 'menu-performance'
  | 'staff-performance'
  | 'financial-summary'
  | 'operational-efficiency';

/**
 * Date range for custom periods
 */
export interface DateRange {
  startDate: string; // ISO 8601 format
  endDate: string; // ISO 8601 format
}

/**
 * Chart data point for visualizations
 */
export interface ChartData {
  label: string;
  value: number;
  percentage?: number;
  color?: string;
  metadata?: Record<string, any>;
}

/**
 * Time series data point
 */
export interface TimeSeriesData {
  timestamp: string;
  value: number;
  category?: string;
  metadata?: Record<string, any>;
}

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * System alert interface
 */
export interface Alert {
  id: string;
  type: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  actionRequired: boolean;
  actionUrl?: string;
}

/**
 * Analytics insight
 */
export interface Insight {
  id: string;
  type: 'trend' | 'opportunity' | 'risk' | 'achievement';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  recommendations: string[];
  timestamp: string;
}

// ============================================================================
// Dashboard Analytics Interfaces
// ============================================================================

/**
 * Dashboard metrics overview
 */
export interface DashboardOverview {
  totalOrders: number;
  revenue: number;
  activeStudents: number;
  averageOrderValue: number;
  growthRate: number; // Percentage vs previous period
  completionRate: number; // Order completion rate
  customerSatisfaction: number; // 0-100 score
}

/**
 * Dashboard chart collection
 */
export interface DashboardCharts {
  revenueByDay: TimeSeriesData[];
  ordersByMealType: ChartData[];
  popularItems: ChartData[];
  studentEngagement: TimeSeriesData[];
  kitchenEfficiency: TimeSeriesData[];
  paymentMethods: ChartData[];
}

/**
 * Complete dashboard metrics by role
 */
export interface DashboardMetrics {
  role: UserRole;
  period: TimePeriod;
  dateRange?: DateRange;
  overview: DashboardOverview;
  charts: DashboardCharts;
  alerts: Alert[];
  insights: Insight[];
  lastUpdated: string;
}

// ============================================================================
// Revenue Analytics Interfaces
// ============================================================================

/**
 * Revenue by category breakdown
 */
export interface CategoryRevenue {
  category: string;
  revenue: number;
  orderCount: number;
  averageOrderValue: number;
  percentageOfTotal: number;
  growthRate: number;
}

/**
 * Revenue by payment method
 */
export interface PaymentMethodRevenue {
  method: string;
  revenue: number;
  transactionCount: number;
  averageTransactionValue: number;
  percentageOfTotal: number;
  successRate: number;
}

/**
 * Revenue trend analysis
 */
export interface RevenueTrend {
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  comparison: string; // "vs last week", "vs last month"
  significanceLevel: 'high' | 'medium' | 'low';
}

/**
 * Revenue projections
 */
export interface RevenueProjection {
  nextWeek: number;
  nextMonth: number;
  nextQuarter: number;
  confidence: number; // 0-100%
  methodology: string;
}

/**
 * Complete revenue analytics
 */
export interface RevenueAnalytics {
  period: TimePeriod;
  dateRange?: DateRange;
  groupBy?: DateGrouping;
  totalRevenue: number;
  averageDailyRevenue: number;
  revenueByCategory: CategoryRevenue[];
  revenueByPaymentMethod: PaymentMethodRevenue[];
  timeSeries: TimeSeriesData[];
  trends: RevenueTrend;
  projections: RevenueProjection;
  topRevenueGenerators: ChartData[];
  seasonality: {
    peakDays: string[];
    peakHours: string[];
    trends: string;
  };
}

// ============================================================================
// Order Analytics Interfaces
// ============================================================================

/**
 * Peak order time analysis
 */
export interface PeakTime {
  timeSlot: string; // "08:00-09:00", "12:00-13:00"
  orderCount: number;
  averageValue: number;
  dayOfWeek?: string;
}

/**
 * Meal type breakdown
 */
export interface MealTypeBreakdown {
  mealType: string; // "breakfast", "lunch", "snack"
  orderCount: number;
  revenue: number;
  averageOrderValue: number;
  percentageOfTotal: number;
  popularItems: string[];
}

/**
 * Order status breakdown
 */
export interface StatusBreakdown {
  status: string; // "pending", "preparing", "completed", "cancelled"
  count: number;
  percentage: number;
  averageProcessingTime?: number; // minutes
}

/**
 * Order trend data
 */
export interface OrderTrendData {
  direction: 'increasing' | 'decreasing' | 'stable';
  percentageChange: number;
  comparisonPeriod: string;
  peakDay: string;
  peakTime: string;
}

/**
 * Complete order analytics
 */
export interface OrderAnalytics {
  period: TimePeriod;
  dateRange?: DateRange;
  groupBy?: DateGrouping;
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  averageProcessingTime: number; // minutes
  peakOrderTimes: PeakTime[];
  ordersByMealType: MealTypeBreakdown[];
  ordersByStatus: StatusBreakdown[];
  timeSeries: TimeSeriesData[];
  trends: OrderTrendData;
  cancellationReasons: ChartData[];
  deliveryPerformance: {
    onTimeRate: number;
    averageDeliveryTime: number;
    lateDeliveries: number;
  };
}

// ============================================================================
// Student Analytics Interfaces
// ============================================================================

/**
 * Favorite menu item
 */
export interface FavoriteItem {
  itemId: string;
  itemName: string;
  orderCount: number;
  category: string;
  lastOrdered: string;
  rating?: number;
}

/**
 * Dietary profile
 */
export interface DietaryProfile {
  preferences: string[]; // "vegetarian", "vegan", "gluten-free"
  restrictions: string[];
  allergies: string[];
  culturalPreferences: string[];
}

/**
 * Nutrition summary
 */
export interface NutritionSummary {
  averageDailyCalories: number;
  averageProtein: number; // grams
  averageCarbs: number;
  averageFat: number;
  averageFiber: number;
  nutritionScore: number; // 0-100
  balanceRating: 'excellent' | 'good' | 'fair' | 'needs-improvement';
  recommendations: string[];
}

/**
 * Allergen exposure profile
 */
export interface AllergenProfile {
  declaredAllergens: string[];
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  safeItems: string[];
  warningItems: string[];
  lastReviewDate: string;
}

/**
 * Student spending pattern
 */
export interface SpendingPattern {
  averageDaily: number;
  averageWeekly: number;
  averageMonthly: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  budgetUtilization: number; // percentage
}

/**
 * Complete student analytics
 */
export interface StudentAnalytics {
  studentId?: string; // Optional - parent sees only their student
  studentName?: string;
  period: TimePeriod;
  dateRange?: DateRange;
  orderFrequency: number; // orders per week
  orderCount: number;
  totalSpending: number;
  averageSpending: number;
  spendingPattern: SpendingPattern;
  favoriteItems: FavoriteItem[];
  dietaryPreferences: DietaryProfile;
  nutritionSummary: NutritionSummary;
  allergenProfile: AllergenProfile;
  attendanceRate: number; // percentage
  mealParticipationRate: number;
  recommendations: string[];
  healthScore: number; // 0-100
}

// ============================================================================
// Kitchen Analytics Interfaces
// ============================================================================

/**
 * Kitchen efficiency metrics
 */
export interface KitchenEfficiency {
  averagePrepTime: number; // minutes
  ordersPerHour: number;
  onTimeDeliveryRate: number; // percentage
  wastePercentage: number;
  utilizationRate: number; // capacity utilization
  qualityScore: number; // 0-100
}

/**
 * Kitchen capacity metrics
 */
export interface KitchenCapacity {
  currentLoad: number; // current orders
  maxCapacity: number; // max concurrent orders
  utilizationRate: number; // percentage
  peakLoadTime: string;
  averageLoadTime: string;
  bottlenecks: string[];
}

/**
 * Staff performance metric
 */
export interface StaffMetric {
  staffId: string;
  staffName: string;
  ordersCompleted: number;
  averagePrepTime: number;
  qualityScore: number; // 0-100
  efficiencyRating: number; // 0-100
  attendanceRate: number;
  overtimeHours: number;
}

/**
 * Inventory usage metric
 */
export interface InventoryMetric {
  itemId: string;
  itemName: string;
  quantityUsed: number;
  unit: string;
  cost: number;
  wasteAmount: number;
  wastePercentage: number;
  reorderLevel: number;
  status: 'adequate' | 'low' | 'critical';
}

/**
 * Kitchen quality metrics
 */
export interface KitchenQualityMetrics {
  customerSatisfaction: number; // 0-100
  orderAccuracy: number; // percentage
  foodSafety: number; // compliance score
  hygieneScore: number; // 0-100
  complaintRate: number; // per 100 orders
  returnRate: number; // percentage
}

/**
 * Complete kitchen analytics
 */
export interface KitchenAnalytics {
  period: TimePeriod;
  dateRange?: DateRange;
  efficiency: KitchenEfficiency;
  capacity: KitchenCapacity;
  staffPerformance: StaffMetric[];
  inventoryUsage: InventoryMetric[];
  qualityMetrics: KitchenQualityMetrics;
  peakHours: PeakTime[];
  productivityTrends: TimeSeriesData[];
  alerts: Alert[];
  recommendations: string[];
}

// ============================================================================
// Menu Performance Analytics Interfaces
// ============================================================================

/**
 * Menu item performance
 */
export interface MenuItemPerformance {
  itemId: string;
  itemName: string;
  category: string;
  totalOrders: number;
  revenue: number;
  averageRating: number;
  profitMargin: number; // percentage
  popularityScore: number; // 0-100
  trend: 'rising' | 'stable' | 'declining';
  lastOrdered: string;
  imageUrl?: string;
}

/**
 * Menu optimization recommendations
 */
export interface MenuRecommendations {
  toPromote: MenuItemPerformance[];
  toRemove: MenuItemPerformance[];
  toModify: MenuItemPerformance[];
  reasoning: Record<string, string>;
}

/**
 * Complete menu performance analytics
 */
export interface MenuPerformanceAnalytics {
  menuItemId?: string; // Optional - for specific item analysis
  period: TimePeriod;
  dateRange?: DateRange;
  popularItems: MenuItemPerformance[];
  unpopularItems: MenuItemPerformance[];
  averageRating: number;
  totalOrders: number;
  totalRevenue: number;
  averageProfitMargin: number;
  categoryPerformance: ChartData[];
  priceSensitivityAnalysis: {
    elasticity: number;
    optimalPricePoints: Record<string, number>;
  };
  recommendations: MenuRecommendations;
  seasonalTrends: TimeSeriesData[];
}

// ============================================================================
// Staff Performance Analytics Interfaces
// ============================================================================

/**
 * Staff efficiency breakdown
 */
export interface StaffEfficiencyMetric {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  ordersProcessed: number;
  averageProcessingTime: number;
  qualityScore: number;
  punctualityScore: number;
  customerFeedbackScore: number;
  efficiencyRank: number;
  improvementAreas: string[];
}

/**
 * Staff attendance record
 */
export interface StaffAttendanceRecord {
  staffId: string;
  staffName: string;
  scheduledDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  attendanceRate: number;
  punctualityRate: number;
}

/**
 * Complete staff performance analytics
 */
export interface StaffPerformanceAnalytics {
  period: TimePeriod;
  dateRange?: DateRange;
  staffId?: string; // Optional - for individual analysis
  efficiency: StaffEfficiencyMetric[];
  attendance: StaffAttendanceRecord[];
  productivityTrends: TimeSeriesData[];
  topPerformers: StaffEfficiencyMetric[];
  needsImprovement: StaffEfficiencyMetric[];
  departmentComparison: ChartData[];
  trainingRecommendations: string[];
}

// ============================================================================
// Compliance & Audit Analytics Interfaces
// ============================================================================

/**
 * Compliance status
 */
export interface ComplianceStatus {
  domain: string; // "food-safety", "hygiene", "nutrition", "regulatory"
  status: 'compliant' | 'warning' | 'non-compliant';
  score: number; // 0-100
  lastAuditDate: string;
  nextAuditDate: string;
  violations: number;
  criticalViolations: number;
}

/**
 * Compliance violation
 */
export interface ComplianceViolation {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedDate: string;
  resolvedDate?: string;
  status: 'open' | 'in-progress' | 'resolved';
  responsibleParty: string;
  correctiveActions: string[];
}

/**
 * Complete compliance analytics
 */
export interface ComplianceAnalytics {
  period: TimePeriod;
  dateRange?: DateRange;
  overallScore: number;
  complianceStatus: ComplianceStatus[];
  violations: ComplianceViolation[];
  auditHistory: TimeSeriesData[];
  certifications: {
    name: string;
    status: 'active' | 'expiring' | 'expired';
    expiryDate: string;
  }[];
  recommendations: string[];
}

// ============================================================================
// Inventory Analytics Interfaces
// ============================================================================

/**
 * Inventory stock level
 */
export interface InventoryStockLevel {
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  unit: string;
  status: 'adequate' | 'low' | 'critical' | 'overstocked';
  daysUntilStockout: number;
  reorderPoint: number;
}

/**
 * Inventory prediction
 */
export interface InventoryPrediction {
  itemId: string;
  itemName: string;
  predictedUsage: number;
  recommendedOrder: number;
  confidence: number; // 0-100
  methodology: string;
}

/**
 * Complete inventory analytics
 */
export interface InventoryAnalytics {
  period: TimePeriod;
  dateRange?: DateRange;
  stockLevels: InventoryStockLevel[];
  predictions: InventoryPrediction[];
  turnoverRate: number; // inventory turnover
  wastagePercentage: number;
  stockoutEvents: number;
  overstockItems: string[];
  criticalItems: string[];
  costAnalysis: {
    totalInventoryValue: number;
    averageHoldingCost: number;
    wasteValue: number;
  };
  recommendations: string[];
}

// ============================================================================
// Real-Time Metrics Interfaces
// ============================================================================

/**
 * Real-time alert
 */
export interface RealTimeAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: string;
  source: string;
  actionRequired: boolean;
}

/**
 * System health indicator
 */
export type SystemHealth = 'healthy' | 'degraded' | 'critical';

/**
 * Real-time metrics snapshot
 */
export interface RealTimeMetrics {
  timestamp: string;
  activeOrders: number;
  activeDevices: number;
  currentRevenue: number; // today's revenue
  peakLoad: number; // current vs capacity
  systemHealth: SystemHealth;
  alerts: RealTimeAlert[];
  kitchenLoad: number; // percentage
  pendingOrders: number;
  averageWaitTime: number; // minutes
  activeStudents: number;
}

// ============================================================================
// API Request/Response Interfaces
// ============================================================================

/**
 * Dashboard metrics request parameters
 */
export interface DashboardMetricsParams {
  role?: UserRole;
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
  studentId?: string; // For parent role
  classId?: string; // For teacher role
  schoolId?: string;
}

/**
 * Revenue analytics request parameters
 */
export interface RevenueAnalyticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: DateGrouping;
  schoolId?: string;
  category?: string;
}

/**
 * Order analytics request parameters
 */
export interface OrderAnalyticsParams {
  startDate?: string;
  endDate?: string;
  groupBy?: DateGrouping;
  status?: string;
  schoolId?: string;
  mealType?: string;
}

/**
 * Student analytics request parameters
 */
export interface StudentAnalyticsParams {
  studentId?: string;
  grade?: string;
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
  schoolId?: string;
}

/**
 * Performance report request parameters
 */
export interface PerformanceReportParams {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  schoolId?: string;
  format?: 'summary' | 'detailed';
}

/**
 * Export data request parameters
 */
export interface ExportDataParams {
  type: ReportType;
  format: ExportFormat;
  period?: TimePeriod;
  startDate?: string;
  endDate?: string;
  schoolId?: string;
  filters?: Record<string, any>;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  timestamp: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// ============================================================================
// Analytics Service Class
// ============================================================================

/**
 * Comprehensive Analytics Service
 * Provides complete analytics functionality for HASIVU platform
 */
export class AnalyticsService {
  /**
   * Get dashboard metrics based on user role
   * Endpoint: GET /analytics/dashboard
   *
   * @param params - Dashboard metrics parameters
   * @returns Dashboard metrics tailored to user role
   */
  async getDashboardMetrics(
    params: DashboardMetricsParams = {}
  ): Promise<ApiResponse<DashboardMetrics>> {
    const response = await apiClient.get('/analytics/dashboard', { params });
    return response.data;
  }

  /**
   * Get revenue analytics with grouping options
   * Endpoint: GET /analytics/revenue
   *
   * @param params - Revenue analytics parameters
   * @returns Comprehensive revenue analytics
   */
  async getRevenueAnalytics(
    params: RevenueAnalyticsParams = {}
  ): Promise<ApiResponse<RevenueAnalytics>> {
    const response = await apiClient.get('/analytics/revenue', { params });
    return response.data;
  }

  /**
   * Get order analytics with trends
   * Endpoint: GET /analytics/orders
   *
   * @param params - Order analytics parameters
   * @returns Comprehensive order analytics
   */
  async getOrderAnalytics(params: OrderAnalyticsParams = {}): Promise<ApiResponse<OrderAnalytics>> {
    const response = await apiClient.get('/analytics/orders', { params });
    return response.data;
  }

  /**
   * Get student behavior and preferences analytics
   * Endpoint: GET /analytics/students
   *
   * @param params - Student analytics parameters
   * @returns Student analytics including nutrition and preferences
   */
  async getStudentAnalytics(
    params: StudentAnalyticsParams = {}
  ): Promise<ApiResponse<StudentAnalytics>> {
    const response = await apiClient.get('/analytics/students', { params });
    return response.data;
  }

  /**
   * Get performance reports by type
   * Endpoint: GET /analytics/reports/:type
   *
   * @param type - Report type
   * @param params - Report parameters
   * @returns Performance report data
   */
  async getPerformanceReport(
    type: ReportType,
    params: PerformanceReportParams = { type }
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.get(`/analytics/reports/${type}`, {
      params: { ...params, type: undefined }, // Remove type from params
    });
    return response.data;
  }

  /**
   * Export analytics data in various formats
   * Endpoint: GET /analytics/export/:type
   *
   * @param params - Export parameters
   * @returns File blob for download
   */
  async exportData(params: ExportDataParams): Promise<Blob> {
    const { type, format, ...otherParams } = params;

    const response = await apiClient.get(`/analytics/export/${type}`, {
      params: { ...otherParams, format },
      responseType: 'blob',
    });

    return response.data;
  }

  /**
   * Get kitchen-specific metrics
   * Endpoint: GET /analytics/kitchen
   *
   * @param params - Kitchen analytics parameters
   * @returns Kitchen efficiency and performance metrics
   */
  async getKitchenAnalytics(
    params: {
      startDate?: string;
      endDate?: string;
      period?: TimePeriod;
      schoolId?: string;
    } = {}
  ): Promise<ApiResponse<KitchenAnalytics>> {
    const response = await apiClient.get('/analytics/kitchen', { params });
    return response.data;
  }

  /**
   * Get menu item performance and popularity
   * Endpoint: GET /analytics/menu-performance
   *
   * @param params - Menu performance parameters
   * @returns Menu item analytics and recommendations
   */
  async getMenuPerformance(
    params: {
      menuItemId?: string;
      startDate?: string;
      endDate?: string;
      period?: TimePeriod;
      category?: string;
      schoolId?: string;
    } = {}
  ): Promise<ApiResponse<MenuPerformanceAnalytics>> {
    const response = await apiClient.get('/analytics/menu-performance', { params });
    return response.data;
  }

  /**
   * Get inventory analytics and predictions
   * Endpoint: GET /analytics/inventory
   *
   * @param params - Inventory analytics parameters
   * @returns Inventory levels, predictions, and recommendations
   */
  async getInventoryAnalytics(
    params: {
      startDate?: string;
      endDate?: string;
      period?: TimePeriod;
      category?: string;
      schoolId?: string;
    } = {}
  ): Promise<ApiResponse<InventoryAnalytics>> {
    const response = await apiClient.get('/analytics/inventory', { params });
    return response.data;
  }

  /**
   * Get staff efficiency metrics
   * Endpoint: GET /analytics/staff-performance
   *
   * @param params - Staff performance parameters
   * @returns Staff performance and efficiency metrics
   */
  async getStaffPerformance(
    params: {
      staffId?: string;
      department?: string;
      startDate?: string;
      endDate?: string;
      period?: TimePeriod;
      schoolId?: string;
    } = {}
  ): Promise<ApiResponse<StaffPerformanceAnalytics>> {
    const response = await apiClient.get('/analytics/staff-performance', { params });
    return response.data;
  }

  /**
   * Get compliance and audit reports
   * Endpoint: GET /analytics/compliance
   *
   * @param params - Compliance analytics parameters
   * @returns Compliance status and audit reports
   */
  async getComplianceAnalytics(
    params: {
      domain?: string;
      startDate?: string;
      endDate?: string;
      period?: TimePeriod;
      schoolId?: string;
    } = {}
  ): Promise<ApiResponse<ComplianceAnalytics>> {
    const response = await apiClient.get('/analytics/compliance', { params });
    return response.data;
  }

  /**
   * Get real-time metrics
   * Endpoint: GET /analytics/real-time
   *
   * @param params - Real-time metrics parameters
   * @returns Current system metrics and alerts
   */
  async getRealTimeMetrics(
    params: {
      schoolId?: string;
    } = {}
  ): Promise<ApiResponse<RealTimeMetrics>> {
    const response = await apiClient.get('/analytics/real-time', { params });
    return response.data;
  }
}

// ============================================================================
// Helper Functions & Utilities
// ============================================================================

/**
 * Format currency values
 */
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format large numbers with abbreviations (K, M, B)
 */
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Calculate growth rate between two values
 */
export const calculateGrowthRate = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/**
 * Get date range for predefined periods
 */
export const getDateRangeForPeriod = (period: TimePeriod): DateRange | null => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (period) {
    case 'today':
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };

    case 'yesterday':
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate: yesterday.toISOString(),
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
      };

    case 'week':
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return {
        startDate: weekStart.toISOString(),
        endDate: now.toISOString(),
      };

    case 'month':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        startDate: monthStart.toISOString(),
        endDate: now.toISOString(),
      };

    case 'quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return {
        startDate: quarterStart.toISOString(),
        endDate: now.toISOString(),
      };

    case 'year':
      const yearStart = new Date(now.getFullYear(), 0, 1);
      return {
        startDate: yearStart.toISOString(),
        endDate: now.toISOString(),
      };

    default:
      return null;
  }
};

/**
 * Download exported file
 */
export const downloadExportedFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Get severity color for alerts
 */
export const getAlertColor = (severity: AlertSeverity): string => {
  const colors: Record<AlertSeverity, string> = {
    info: '#3b82f6', // blue
    warning: '#f59e0b', // amber
    error: '#ef4444', // red
    critical: '#dc2626', // dark red
  };
  return colors[severity];
};

/**
 * Get trend direction icon
 */
export const getTrendIcon = (direction: 'up' | 'down' | 'stable'): string => {
  const icons: Record<string, string> = {
    up: '↑',
    down: '↓',
    stable: '→',
  };
  return icons[direction];
};

// ============================================================================
// Export Service Instance
// ============================================================================

/**
 * Singleton analytics service instance
 */
export const analyticsService = new AnalyticsService();

/**
 * Default export for convenience
 */
export default analyticsService;
