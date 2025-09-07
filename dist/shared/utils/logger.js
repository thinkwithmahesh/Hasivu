"use strict";
/**
 * HASIVU Platform - Structured Logging Utility
 * Production-ready structured logging with Winston integration
 * Provides consistent logging across all services with proper log levels and formatting
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformance = exports.errorLoggingMiddleware = exports.requestLoggingMiddleware = exports.logger = exports.LoggerService = exports.LogLevel = void 0;
const winston = require("winston");
const environment_1 = require("../../config/environment");
/**
 * Log level enumeration for type safety
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["HTTP"] = "http";
    LogLevel["VERBOSE"] = "verbose";
    LogLevel["DEBUG"] = "debug";
    LogLevel["SILLY"] = "silly";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Custom log format for JSON structured logging
 */
const jsonFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const logEntry = {
        timestamp: String(timestamp),
        level: String(level),
        message: String(message),
        service: environment_1.config.app.name || 'hasivu-platform',
        environment: environment_1.config.environment || 'development',
        ...meta
    };
    // Remove undefined values
    Object.keys(logEntry).forEach(key => {
        if (logEntry[key] === undefined) {
            delete logEntry[key];
        }
    });
    return JSON.stringify(logEntry);
}));
/**
 * Console format for development
 */
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({
    format: 'HH:mm:ss'
}), winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message}${metaStr}`;
}));
/**
 * Create transports based on environment
 */
function createTransports() {
    const transports = [];
    const environment = environment_1.config.environment || 'development';
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
class LoggerService {
    static instance;
    logger;
    defaultMeta = {};
    constructor() {
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
                service: environment_1.config.app.name || 'hasivu-platform',
                environment: environment_1.config.environment || 'development',
                version: environment_1.config.app.version || '1.0.0'
            }
        });
        // Set up global exception handlers
        this.setupExceptionHandlers();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }
    /**
     * Get appropriate log level based on environment
     */
    getLogLevel() {
        const environment = environment_1.config.environment || 'development';
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
    setupExceptionHandlers() {
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.error('Uncaught Exception', {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
            // Don't exit the process in development
            if (environment_1.config.environment === 'production') {
                process.exit(1);
            }
        });
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.error('Unhandled Rejection', {
                reason: typeof reason === 'object' ? reason.message || reason : reason,
                stack: reason?.stack,
                promise: promise.toString()
            });
            // Don't exit the process in development
            if (environment_1.config.environment === 'production') {
                process.exit(1);
            }
        });
    }
    /**
     * Set default metadata for all logs
     */
    setDefaultMeta(meta) {
        this.defaultMeta = { ...this.defaultMeta, ...meta };
    }
    /**
     * Clear default metadata
     */
    clearDefaultMeta() {
        this.defaultMeta = {};
    }
    /**
     * Create child logger with additional context
     */
    child(meta) {
        const childLogger = new LoggerService();
        childLogger.setDefaultMeta({ ...this.defaultMeta, ...meta });
        return childLogger;
    }
    /**
     * Log error message
     */
    error(message, meta) {
        this.logger.error(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log warning message
     */
    warn(message, meta) {
        this.logger.warn(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log info message
     */
    info(message, meta) {
        this.logger.info(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log HTTP request
     */
    http(message, meta) {
        this.logger.http(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log verbose message
     */
    verbose(message, meta) {
        this.logger.verbose(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log debug message
     */
    debug(message, meta) {
        this.logger.debug(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log silly level message
     */
    silly(message, meta) {
        this.logger.silly(message, { ...this.defaultMeta, ...meta });
    }
    /**
     * Log structured HTTP request
     */
    logHttpRequest(entry) {
        this.http(`${entry.method} ${entry.url} ${entry.statusCode} - ${entry.duration}ms`, {
            ...this.defaultMeta,
            ...entry
        });
    }
    /**
     * Log structured error with context
     */
    logError(error, context) {
        const errorEntry = {
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
    logSecurity(entry) {
        this.warn(`Security Event: ${entry.event}`, {
            ...this.defaultMeta,
            ...entry,
            category: 'security'
        });
    }
    /**
     * Log performance metrics
     */
    logPerformance(entry) {
        this.info(`Performance: ${entry.operation} took ${entry.duration}ms`, {
            ...this.defaultMeta,
            ...entry,
            category: 'performance'
        });
    }
    /**
     * Log user action for audit trail
     */
    logUserAction(userId, action, resource, details) {
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
    logDatabaseOperation(operation, table, duration, rowsAffected) {
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
    logExternalApiCall(service, endpoint, method, statusCode, duration, error) {
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
    logBusinessEvent(event, userId, data) {
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
    logSystemMetric(metric, value, unit, tags) {
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
    getWinstonLogger() {
        return this.logger;
    }
    /**
     * Check if logger would log at specified level
     */
    isLevelEnabled(level) {
        return this.logger.isLevelEnabled(level);
    }
    /**
     * Flush all pending logs (useful before app shutdown)
     */
    async flush() {
        return new Promise((resolve) => {
            const transports = this.logger.transports;
            let pendingFlush = transports.length;
            if (pendingFlush === 0) {
                resolve();
                return;
            }
            transports.forEach((transport) => {
                if (typeof transport.flush === 'function') {
                    transport.flush(() => {
                        pendingFlush--;
                        if (pendingFlush === 0) {
                            resolve();
                        }
                    });
                }
                else {
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
    close() {
        this.logger.close();
    }
}
exports.LoggerService = LoggerService;
/**
 * Default logger instance
 */
exports.logger = LoggerService.getInstance();
/**
 * Express.js request logging middleware
 */
function requestLoggingMiddleware() {
    return (req, res, next) => {
        const startTime = Date.now();
        const originalSend = res.send;
        // Override res.send to capture response
        res.send = function (data) {
            const duration = Date.now() - startTime;
            const contentLength = Buffer.isBuffer(data) ? data.length :
                typeof data === 'string' ? Buffer.byteLength(data) : 0;
            const logEntry = {
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
            exports.logger.logHttpRequest(logEntry);
            originalSend.call(this, data);
        };
        next();
    };
}
exports.requestLoggingMiddleware = requestLoggingMiddleware;
/**
 * Error logging middleware for Express.js
 */
function errorLoggingMiddleware() {
    return (error, req, res, next) => {
        exports.logger.logError(error, {
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
exports.errorLoggingMiddleware = errorLoggingMiddleware;
/**
 * Performance monitoring decorator
 */
function logPerformance(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args) {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();
        const startCpu = process.cpuUsage();
        try {
            const result = await originalMethod.apply(this, args);
            const duration = Date.now() - startTime;
            const endMemory = process.memoryUsage();
            const endCpu = process.cpuUsage(startCpu);
            exports.logger.logPerformance({
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
        }
        catch (error) {
            const duration = Date.now() - startTime;
            exports.logger.error(`Performance: ${propertyKey} failed after ${duration}ms`, {
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
exports.logPerformance = logPerformance;
/**
 * Default export with logger utilities
 */
exports.default = {
    LoggerService,
    logger: exports.logger,
    LogLevel,
    requestLoggingMiddleware,
    errorLoggingMiddleware,
    logPerformance
};
