/**
 * Module declarations for untyped dependencies and internal modules
 */

// Services
declare module '@/services/rfid.service' {
  export class RfidService {
    static getInstance(): RfidService;
    registerCard(params: any): Promise<any>;
    verifyDelivery(params: any): Promise<any>;
    deactivateCard(cardId: string, reason?: string): Promise<any>;
    bulkRegisterCards(input: any): Promise<any>;
    getVerificationHistory(query?: any): Promise<any>;
    getCardAnalytics(query: any): Promise<any>;
    updateReaderStatus(input: any): Promise<any>;
  }
  export const rfidService: RfidService;
  export default RfidService;
}

declare module '../../src/services/rfid.service' {
  export * from '@/services/rfid.service';
}

declare module '@/services/auth.service' {
  export class AuthService {
    static register(data: any): Promise<any>;
    static login(email: string, password: string): Promise<any>;
    static verifyEmail(token: string): Promise<any>;
    static resetPassword(data: any): Promise<any>;
  }
}

declare module '../../src/services/auth.service' {
  export * from '@/services/auth.service';
}

declare module '@/services/payment.service' {
  export class PaymentService {
    static processPayment(params: any): Promise<any>;
    createPaymentOrder(params: any): Promise<any>;
    updateOrder(id: string, status: string): Promise<any>;
    getPaymentOrder(id: string): Promise<any>;
    getAllOrders(params: any): Promise<any>;
    getPaymentAnalytics(params: any): Promise<any>;
  }
}

declare module '../../src/services/payment.service' {
  export * from '@/services/payment.service';
}

declare module '../../src/services/order.service' {
  export class OrderService {
    static createOrder(params: any): Promise<any>;
    static getOrder(id: string): Promise<any>;
    static updateOrderStatus(id: string, status: any): Promise<any>;
    static cancelOrder(id: string, reason?: string): Promise<any>;
  }
  export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled',
  }
}

declare module '../../src/services/menuItem.service' {
  export class MenuItemService {
    static getMenuItem(id: string): Promise<any>;
    static getAllMenuItems(params?: any): Promise<any>;
    static createMenuItem(data: any): Promise<any>;
    static updateMenuItem(id: string, data: any): Promise<any>;
  }
}

declare module '../../src/services/customer.service' {
  export class CustomerService {
    static getInstance(): CustomerService;
    getCustomer(id: string): Promise<any>;
    createCustomer(data: any): Promise<any>;
  }
}

declare module '../../src/services/paymentGateway.service' {
  export class PaymentGatewayService {
    static getInstance(): PaymentGatewayService;
    processTransaction(params: any): Promise<any>;
  }
}

declare module '../../src/services/notification.service' {
  export class NotificationService {
    static sendNotification(params: any): Promise<any>;
    static sendBulkNotifications(params: any): Promise<any>;
  }
}

declare module '@/services/notification.service' {
  export * from '../../src/services/notification.service';
}

declare module '../../src/services/analytics.service' {
  export class AnalyticsService {
    static trackEvent(params: any): Promise<any>;
    static getAnalytics(params: any): Promise<any>;
  }
}

// Middleware
declare module '@/middleware/error.middleware' {
  export function asyncHandler(fn: any): any;
  export function createValidationError(message: string): Error;
  export function errorHandler(err: any, req: any, res: any, next: any): void;
}

declare module '@/middleware/auth.middleware' {
  export function authMiddleware(req: any, res: any, next: any): void;
  export interface AuthenticatedRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      permissions: string[];
      schoolId?: string;
      tenantId?: string;
    };
    sessionId?: string;
    body?: any;
    params?: any;
    query?: any;
  }
}

// User services and functions
declare module '../../services/user.service' {
  export class UserService {
    static getUserById(id: string): Promise<any>;
    static searchUsers(params: any): Promise<any>;
    static updateChildrenAssociations(
      parentId: string,
      childrenIds: string[],
      updatedBy: string
    ): Promise<void>;
  }
}

declare module '../shared/logger.service' {
  export class LoggerService {
    static getInstance(): LoggerService;
    info(message: string, meta?: any): void;
    warn(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
  }
}

declare module '../shared/validation.service' {
  export class ValidationService {
    static validateObject(data: any, schema: any): Promise<{ isValid: boolean; errors?: string[] }>;
  }
}

declare module '../shared/response.utils' {
  export function handleError(
    error: Error,
    context?: any,
    statusCode?: number,
    requestId?: string
  ): any;
  export function createSuccessResponse(
    data: any,
    message?: string,
    statusCode?: number,
    requestId?: string
  ): any;
}

// Database services
declare module '../../src/database/DatabaseManager' {
  export class DatabaseManager {
    static getInstance(): Promise<DatabaseManager>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    migrate(): Promise<void>;
  }
}

// Test utilities
declare module '../utils/LoadTestDataGenerator' {
  export class LoadTestDataGenerator {
    seedMenuItems(count: number): Promise<void>;
    seedCustomers(count: number): Promise<void>;
    generateOrder(): Promise<any>;
    generateCustomer(): Promise<any>;
    getRandomMenuItems(count: number): Promise<any[]>;
    seedPaymentHistory(count: number): Promise<void>;
  }
}

declare module '../mocks/MockPaymentProcessor' {
  export class MockPaymentProcessor {
    reset(): void;
    setFailureRate(rate: number): void;
    setNetworkDelay(ms: number): void;
    setRateLimit(requestsPerSecond: number): void;
  }
}

declare module '../mocks/MockNotificationProvider' {
  export class MockNotificationProvider {
    reset(): void;
  }
}

// Types
declare module '../../src/types' {
  export type PaymentMethod = 'card' | 'wallet' | 'upi' | 'cash';
  export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  export type OrderStatus =
    | 'pending'
    | 'confirmed'
    | 'preparing'
    | 'ready'
    | 'delivered'
    | 'cancelled';
}

// Shared utilities
declare module '@/shared/utils/response' {
  // Extended Response methods
}
