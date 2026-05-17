/**
 * HASIVU Platform - Administration Types
 * TypeScript interfaces for administration dashboard and management
 */

export interface DashboardMetrics {
  schools: {
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    byTier: Record<string, number>;
    byState: Record<string, number>;
    performanceDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
  };
  operations: {
    todayOrders: number;
    activeKitchens: number;
    studentsServed: number;
    mealsDelivered: number;
    averageDeliveryTime: number;
    qualityScore: number;
    incidentsReported: number;
    emergencyAlerts: number;
  };
  financial: {
    totalRevenue: number;
    totalCosts: number;
    profitMargin: number;
    outstandingPayments: number;
    budgetUtilization: number;
    costPerMeal: number;
    revenueGrowth: number;
    paymentSuccessRate: number;
  };
  compliance: {
    overallScore: number;
    safetyCompliance: number;
    nutritionalCompliance: number;
    regulatoryCompliance: number;
    auditsPending: number;
    violationsReported: number;
    correctiveActions: number;
    certificationStatus: number;
  };
  performance: {
    averageRating: number;
    customerSatisfaction: number;
    operationalEfficiency: number;
    staffProductivity: number;
    resourceUtilization: number;
    innovationIndex: number;
    sustainabilityScore: number;
    technologyAdoption: number;
  };
  alerts: Alert[];
  timestamp: Date;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: {
    type: 'kitchen' | 'school' | 'system';
    id: string;
    name: string;
  };
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum AlertType {
  KITCHEN_DOWN = 'kitchen_down',
  BUDGET_EXCEEDED = 'budget_exceeded',
  QUALITY_ISSUE = 'quality_issue',
  PAYMENT_FAILED = 'payment_failed',
  SYSTEM_ERROR = 'systemerror',
  SECURITY_ALERT = 'security_alert',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
  URGENT = 'urgent',
}

export enum AdminLevel {
  SCHOOL = 'school',
  ZONE = 'zone',
  DISTRICT = 'district',
  STATE = 'state',
}

export interface SchoolOverview {
  id: string;
  name: string;
  location: string;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  status: 'active' | 'inactive' | 'suspended';
  studentCount: number;
  kitchenCount: number;
  performanceScore: number;
  lastActivity: Date;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
  };
  subscription: {
    plan: string;
    status: 'active' | 'expired' | 'cancelled';
    expiryDate: Date;
  };
}
