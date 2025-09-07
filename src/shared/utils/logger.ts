/**
 * HASIVU Platform - Structured Logging Utility
 * Production-ready structured logging with Winston integration
 * Provides consistent logging across all services with proper log levels and formatting
 */

import * as winston from 'winston';
import { config } from '../../config/environment';

/**
 * Log level enumeration for type safety
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

/**
 * Base log entry interface for structured logging
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service?: string;
  environment?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  metadata?: Record<string, any>;
}

/**
 * HTTP request log entry interface
 */
export interface HttpLogEntry extends LogEntry {
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  userAgent?: string;
  ip?: string;
  referer?: string;
  contentLength?: number;
}

/**
 * Error log entry interface
 */
export interface ErrorLogEntry extends LogEntry {
  error: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  context?: Record<string, any>;
}

/**
 * Security log entry interface
 */
export interface SecurityLogEntry extends LogEntry {
  event: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip?: string;
  userAgent?: string;
  attempts?: number;
  blocked?: boolean;
}

/**
 * Performance log entry interface
 */
export interface PerformanceLogEntry extends LogEntry {
  operation: string;
  duration: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  cpuUsage?: {
    user: number;
    system: number;
  };
}

/**
 * Custom log format for JSON structured logging
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    const logEntry: LogEntry = {
      timestamp: String(timestamp),
      level: String(level),
      message: String(message),
      service: (config as any).app.name || 'hasivu-platform',
      environment: (config as any).environment || 'development',
      ...meta
    };

    // Remove undefined values
    Object.keys(logEntry).forEach(key => {
      if (logEntry[key as keyof LogEntry] === undefined) {
        delete logEntry[key as keyof LogEntry];
      }
    });

    return JSON.stringify(logEntry);
  })
);

/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Create transports based on environment
 */
function createTransports(): winston.transport[] {
  const transports: winston.transport[] = [];
  const environment = (config as any).environment || 'development';

  // Always add console transport
  transports.push(new winston.transports.Console({
    format: environment === 'production' ? jsonFormat : consoleFormat,
    level: environment === 'production' ? 'info' : 'debug'
  }));

  // Add file transports in production
  if (environment === 'production') {
    // Error log file
    transports.push(new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 10,
      tailable: true
    }));

    // Combined log file
    transports.push(new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 10,
      tailable: true
    }));

    // HTTP access log file
    transports.push(new winston.transports.File({
      filename: 'logs/access.log',
      level: 'http',
      format: jsonFormat,
      maxsize: 100 * 1024 * 1024, // 100MB
      maxFiles: 15,
      tailable: true
    }));
  }

  // Add file transports for staging
  if (environment === 'staging') {
    transports.push(new winston.transports.File({
      filename: 'logs/staging.log',
      format: jsonFormat,
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true
    }));
  }

  return transports;
}

/**
 * Logger Service Singleton
 * Provides structured logging capabilities across the application
 */
export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private defaultMeta: Record<string, any> = {};

  private constructor() {
    this.logger = winston.createLogger({
      level: this.getLogLevel(),
      levels: winston.config.npm.levels,
      transports: createTransports(),
      exitOnError: false,
      // Prevent duplicate logs
      handleExceptions: true,
      handleRejections: true,
      // Add default metadata
      defaultMeta: {
        service: (config as any).app.name || 'hasivu-platform',
        environment: (config as any).environment || 'development',
        version: (config as any).app.version || '1.0.0'
      }
    });

    // Set up global exception handlers
    this.setupExceptionHandlers();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Get appropriate log level based on environment
   */
  private getLogLevel(): string {
    const environment = (config as any).environment || 'development';
    
    switch (environment) {
      case 'production':
        return 'info';
      case 'staging':
        return 'verbose';
      case 'test':
        return 'error';
      case 'development':
      default:
        return 'debug';
    }
  }

  /**
   * Set up global exception handlers
   */
  private setupExceptionHandlers(): void {
    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.error('Uncaught Exception', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });
      // Don't exit the process in development
      if ((config as any).environment === 'production') {
        process.exit(1);
      }
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.error('Unhandled Rejection', {
        reason: typeof reason === 'object' ? reason.message || reason : reason,
        stack: reason?.stack,
        promise: promise.toString()
      });
      // Don't exit the process in development
      if ((config as any).environment === 'production') {
        process.exit(1);
      }
    });
  }

  /**
   * Set default metadata for all logs
   */
  public setDefaultMeta(meta: Record<string, any>): void {
    this.defaultMeta = { ...this.defaultMeta, ...meta };
  }

  /**
   * Clear default metadata
   */
  public clearDefaultMeta(): void {
    this.defaultMeta = {};
  }

  /**
   * Create child logger with additional context
   */
  public child(meta: Record<string, any>): LoggerService {
    const childLogger = new LoggerService();
    childLogger.setDefaultMeta({ ...this.defaultMeta, ...meta });
    return childLogger;
  }

  /**
   * Log error message
   */
  public error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log warning message
   */
  public warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log info message
   */
  public info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log HTTP request
   */
  public http(message: string, meta?: Record<string, any>): void {
    this.logger.http(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log verbose message
   */
  public verbose(message: string, meta?: Record<string, any>): void {
    this.logger.verbose(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log debug message
   */
  public debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log silly level message
   */
  public silly(message: string, meta?: Record<string, any>): void {
    this.logger.silly(message, { ...this.defaultMeta, ...meta });
  }

  /**
   * Log structured HTTP request
   */
  public logHttpRequest(entry: HttpLogEntry): void {
    this.http(`${entry.method} ${entry.url} ${entry.statusCode} - ${entry.duration}ms`, {
      ...this.defaultMeta,
      ...entry
    });
  }

  /**
   * Log structured error with context
   */
  public logError(error: Error, context?: Record<string, any>): void {
    const errorEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      context
    };

    this.error(error.message, { ...this.defaultMeta, ...errorEntry });
  }

  /**
   * Log security event
   */
  public logSecurity(entry: SecurityLogEntry): void {
    this.warn(`Security Event: ${entry.event}`, {
      ...this.defaultMeta,
      ...entry,
      category: 'security'
    });
  }

  /**
   * Log performance metrics
   */
  public logPerformance(entry: PerformanceLogEntry): void {
    this.info(`Performance: ${entry.operation} took ${entry.duration}ms`, {
      ...this.defaultMeta,
      ...entry,
      category: 'performance'
    });
  }

  /**
   * Log user action for audit trail
   */
  public logUserAction(
    userId: string,
    action: string,
    resource: string,
    details?: Record<string, any>
  ): void {
    this.info(`User Action: ${action}`, {
      ...this.defaultMeta,
      userId,
      action,
      resource,
      details,
      category: 'audit'
    });
  }

  /**
   * Log database operation
   */
  public logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    rowsAffected?: number
  ): void {
    this.debug(`DB ${operation}: ${table}`, {
      ...this.defaultMeta,
      operation,
      table,
      duration,
      rowsAffected,
      category: 'database'
    });
  }

  /**
   * Log external API call
   */
  public logExternalApiCall(
    service: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    error?: string
  ): void {
    const level = statusCode >= 400 ? 'error' : 'info';
    this.logger.log(level, `External API: ${service} ${method} ${endpoint}`, {
      ...this.defaultMeta,
      service: service,
      endpoint,
      method,
      statusCode,
      duration,
      error,
      category: 'external-api'
    });
  }

  /**
   * Log business event
   */
  public logBusinessEvent(
    event: string,
    userId?: string,
    data?: Record<string, any>
  ): void {
    this.info(`Business Event: ${event}`, {
      ...this.defaultMeta,
      event,
      userId,
      data,
      category: 'business'
    });
  }

  /**
   * Log system metric
   */
  public logSystemMetric(
    metric: string,
    value: number,
    unit?: string,
    tags?: Record<string, string>
  ): void {
    this.info(`Metric: ${metric}`, {
      ...this.defaultMeta,
      metric,
      value,
      unit,
      tags,
      category: 'metrics'
    });
  }

  /**
   * Get Winston logger instance (for advanced usage)
   */
  public getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Check if logger would log at specified level
   */
  public isLevelEnabled(level: LogLevel): boolean {
    return this.logger.isLevelEnabled(level);
  }

  /**
   * Flush all pending logs (useful before app shutdown)
   */
  public async flush(): Promise<void> {
    return new Promise((resolve) => {
      const transports = this.logger.transports;
      let pendingFlush = transports.length;

      if (pendingFlush === 0) {
        resolve();
        return;
      }

      transports.forEach((transport) => {
        if (typeof (transport as any).flush === 'function') {
          (transport as any).flush(() => {
            pendingFlush--;
            if (pendingFlush === 0) {
              resolve();
            }
          });
        } else {
          pendingFlush--;
          if (pendingFlush === 0) {
            resolve();
          }
        }
      });
    });
  }

  /**
   * Gracefully close logger (useful for testing)
   */
  public close(): void {
    this.logger.close();
  }
}

/**
 * Default logger instance
 */
export const logger = LoggerService.getInstance();

/**
 * Express.js request logging middleware
 */
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const originalSend = res.send;
    
    // Override res.send to capture response
    res.send = function(data: any) {
      const duration = Date.now() - startTime;
      const contentLength = Buffer.isBuffer(data) ? data.length : 
                           typeof data === 'string' ? Buffer.byteLength(data) : 0;

      const logEntry: HttpLogEntry = {
        timestamp: new Date().toISOString(),
        level: 'http',
        message: `${req.method} ${req.originalUrl || req.url}`,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        referer: req.get('Referer'),
        contentLength,
        userId: req.user?.id,
        sessionId: req.sessionID,
        requestId: req.id || req.headers['x-request-id']
      };

      logger.logHttpRequest(logEntry);
      originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Error logging middleware for Express.js
 */
export function errorLoggingMiddleware() {
  return (error: Error, req: any, res: any, next: any) => {
    logger.logError(error, {
      url: req.originalUrl || req.url,
      method: req.method,
      userId: req.user?.id,
      sessionId: req.sessionID,
      requestId: req.id || req.headers['x-request-id'],
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    });

    next(error);
  };
}

/**
 * Performance monitoring decorator
 */
export function logPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    try {
      const result = await originalMethod.apply(this, args);
      const duration = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      logger.logPerformance({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Performance: ${propertyKey}`,
        operation: `${target.constructor.name}.${propertyKey}`,
        duration,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          external: endMemory.external - startMemory.external
        },
        cpuUsage: {
          user: endCpu.user,
          system: endCpu.system
        }
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Performance: ${propertyKey} failed after ${duration}ms`, {
        operation: `${target.constructor.name}.${propertyKey}`,
        duration,
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : { message: String(error) }
      });
      throw error;
    }
  };

  return descriptor;
}

/**
 * Default export with logger utilities
 */
export default {
  LoggerService,
  logger,
  LogLevel,
  requestLoggingMiddleware,
  errorLoggingMiddleware,
  logPerformance
};