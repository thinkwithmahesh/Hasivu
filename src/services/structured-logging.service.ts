/**
 * HASIVU Platform - Structured Logging Service
 * Enterprise-grade logging with structured data, correlation IDs,
 * audit trails, and intelligent log aggregation for compliance and debugging.
 * @author HASIVU Development Team
 * @version 2.0.0
 * @since 2024
 */

// Simplified version for frontend compatibility
interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  [key: string]: any;
}

interface AuditLogEntry {
  action: string;
  resource: string;
  userId: string;
  outcome: 'success' | 'failure' | 'pending';
  metadata?: Record<string, any>;
  context: LogContext;
}

interface SecurityLogEntry {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  target?: string;
  outcome: 'success' | 'failure' | 'blocked';
  metadata?: Record<string, any>;
  context: LogContext;
}

interface PerformanceLogEntry {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
  context: LogContext;
}

interface BusinessLogEntry {
  event: string;
  category: string;
  value?: number;
  metadata?: Record<string, any>;
  context: LogContext;
}

export class StructuredLoggingService {
  private context: LogContext = {};

  constructor() {
    // Frontend-compatible initialization
  }

  /**
   * Set logging context for correlation
   */
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Clear logging context
   */
  clearContext(): void {
    this.context = {};
  }

  /**
   * Generate and set request ID
   */
  generateRequestId(): string {
    const requestId = Math.random().toString(36).substr(2, 9);
    this.setContext({ requestId });
    return requestId;
  }

  /**
   * Standard application logging
   */
  info(message: string, metadata?: Record<string, any>): void {
    console.info(`[INFO] ${message}`, { ...metadata, context: this.context });
  }

  warn(message: string, metadata?: Record<string, any>): void {
    console.warn(`[WARN] ${message}`, { ...metadata, context: this.context });
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    console.error(`[ERROR] ${message}`, {
      ...metadata,
      error: error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : undefined,
      context: this.context,
    });
  }

  debug(message: string, metadata?: Record<string, any>): void {
    console.debug(`[DEBUG] ${message}`, { ...metadata, context: this.context });
  }

  /**
   * Audit logging for compliance
   */
  audit(entry: AuditLogEntry): void {
    const auditLog = {
      type: 'audit',
      timestamp: new Date().toISOString(),
      ...entry,
      context: { ...this.context, ...entry.context },
    };
    console.info('[AUDIT]', auditLog);
  }

  /**
   * Security event logging
   */
  security(entry: SecurityLogEntry): void {
    const securityLog = {
      type: 'security',
      timestamp: new Date().toISOString(),
      ...entry,
      context: { ...this.context, ...entry.context },
    };
    console.warn('[SECURITY]', securityLog);
  }

  /**
   * Performance logging
   */
  performance(entry: PerformanceLogEntry): void {
    const performanceLog = {
      type: 'performance',
      timestamp: new Date().toISOString(),
      ...entry,
      context: { ...this.context, ...entry.context },
    };
    console.info('[PERFORMANCE]', performanceLog);
  }

  /**
   * Business event logging
   */
  business(entry: BusinessLogEntry): void {
    const businessLog = {
      type: 'business',
      timestamp: new Date().toISOString(),
      ...entry,
      context: { ...this.context, ...entry.context },
    };
    console.info('[BUSINESS]', businessLog);
  }

  /**
   * Payment transaction logging with PCI compliance
   */
  payment(
    transactionId: string,
    amount: number,
    currency: string,
    status: string,
    gateway: string,
    error?: Error
  ): void {
    const paymentLog = {
      type: 'payment',
      timestamp: new Date().toISOString(),
      transactionId: this.hashSensitiveData(transactionId),
      amount,
      currency,
      status,
      gateway,
      error: error
        ? {
            message: error.message,
            code: (error as any).code,
          }
        : undefined,
      context: this.context,
    };

    if (error || status === 'failed') {
      console.error('[PAYMENT FAILED]', paymentLog);
    } else {
      console.info('[PAYMENT]', paymentLog);
    }
  }

  /**
   * RFID verification logging
   */
  rfidVerification(
    cardId: string,
    readerId: string,
    verificationStatus: string,
    duration: number,
    studentId?: string,
    error?: Error
  ): void {
    const rfidLog = {
      type: 'rfid',
      timestamp: new Date().toISOString(),
      cardId: this.hashSensitiveData(cardId),
      readerId,
      verificationStatus,
      duration,
      studentId: studentId ? this.hashSensitiveData(studentId) : undefined,
      error: error
        ? {
            message: error.message,
          }
        : undefined,
      context: this.context,
    };

    if (error || verificationStatus === 'failed') {
      console.warn('[RFID ISSUE]', rfidLog);
    } else {
      console.info('[RFID]', rfidLog);
    }
  }

  /**
   * User activity logging for analytics
   */
  userActivity(
    userId: string,
    action: string,
    resource: string,
    metadata?: Record<string, any>
  ): void {
    const activityLog = {
      type: 'user_activity',
      timestamp: new Date().toISOString(),
      userId: this.hashSensitiveData(userId),
      action,
      resource,
      metadata: this.sanitizeUserData(metadata || {}),
      context: this.context,
    };
    console.info('[USER ACTIVITY]', activityLog);
  }

  // Private helper methods
  private sanitizeUserData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sanitized = { ...data };
    const sensitiveFields = ['email', 'phone', 'address', 'creditCard', 'ssn'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });
    return sanitized;
  }

  private hashSensitiveData(data: string): string {
    // Simple hash for frontend - in production, use proper crypto
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 8);
  }
}

// Export singleton instance
export const structuredLogger = new StructuredLoggingService();
