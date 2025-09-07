"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logPerformance = exports.errorLoggingMiddleware = exports.requestLoggingMiddleware = exports.logger = exports.LoggerService = exports.LogLevel = void 0;
const winston = __importStar(require("winston"));
const environment_1 = require("../../config/environment");
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
    Object.keys(logEntry).forEach(key => {
        if (logEntry[key] === undefined) {
            delete logEntry[key];
        }
    });
    return JSON.stringify(logEntry);
}));
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({
    format: 'HH:mm:ss'
}), winston.format.printf((info) => {
    const { timestamp, level, message, service, ...meta } = info;
    const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${service || 'app'}] ${level}: ${message}${metaStr}`;
}));
function createTransports() {
    const transports = [];
    const environment = environment_1.config.environment || 'development';
    transports.push(new winston.transports.Console({
        format: environment === 'production' ? jsonFormat : consoleFormat,
        level: environment === 'production' ? 'info' : 'debug'
    }));
    if (environment === 'production') {
        transports.push(new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: jsonFormat,
            maxsize: 50 * 1024 * 1024,
            maxFiles: 10,
            tailable: true
        }));
        transports.push(new winston.transports.File({
            filename: 'logs/combined.log',
            format: jsonFormat,
            maxsize: 100 * 1024 * 1024,
            maxFiles: 10,
            tailable: true
        }));
        transports.push(new winston.transports.File({
            filename: 'logs/access.log',
            level: 'http',
            format: jsonFormat,
            maxsize: 100 * 1024 * 1024,
            maxFiles: 15,
            tailable: true
        }));
    }
    if (environment === 'staging') {
        transports.push(new winston.transports.File({
            filename: 'logs/staging.log',
            format: jsonFormat,
            maxsize: 50 * 1024 * 1024,
            maxFiles: 5,
            tailable: true
        }));
    }
    return transports;
}
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
            handleExceptions: true,
            handleRejections: true,
            defaultMeta: {
                service: environment_1.config.app.name || 'hasivu-platform',
                environment: environment_1.config.environment || 'development',
                version: environment_1.config.app.version || '1.0.0'
            }
        });
        this.setupExceptionHandlers();
    }
    static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }
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
    setupExceptionHandlers() {
        process.on('uncaughtException', (error) => {
            this.error('Uncaught Exception', {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                }
            });
            if (environment_1.config.environment === 'production') {
                process.exit(1);
            }
        });
        process.on('unhandledRejection', (reason, promise) => {
            this.error('Unhandled Rejection', {
                reason: typeof reason === 'object' ? reason.message || reason : reason,
                stack: reason?.stack,
                promise: promise.toString()
            });
            if (environment_1.config.environment === 'production') {
                process.exit(1);
            }
        });
    }
    setDefaultMeta(meta) {
        this.defaultMeta = { ...this.defaultMeta, ...meta };
    }
    clearDefaultMeta() {
        this.defaultMeta = {};
    }
    child(meta) {
        const childLogger = new LoggerService();
        childLogger.setDefaultMeta({ ...this.defaultMeta, ...meta });
        return childLogger;
    }
    error(message, meta) {
        this.logger.error(message, { ...this.defaultMeta, ...meta });
    }
    warn(message, meta) {
        this.logger.warn(message, { ...this.defaultMeta, ...meta });
    }
    info(message, meta) {
        this.logger.info(message, { ...this.defaultMeta, ...meta });
    }
    http(message, meta) {
        this.logger.http(message, { ...this.defaultMeta, ...meta });
    }
    verbose(message, meta) {
        this.logger.verbose(message, { ...this.defaultMeta, ...meta });
    }
    debug(message, meta) {
        this.logger.debug(message, { ...this.defaultMeta, ...meta });
    }
    silly(message, meta) {
        this.logger.silly(message, { ...this.defaultMeta, ...meta });
    }
    logHttpRequest(entry) {
        this.http(`${entry.method} ${entry.url} ${entry.statusCode} - ${entry.duration}ms`, {
            ...this.defaultMeta,
            ...entry
        });
    }
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
    logSecurity(entry) {
        this.warn(`Security Event: ${entry.event}`, {
            ...this.defaultMeta,
            ...entry,
            category: 'security'
        });
    }
    logPerformance(entry) {
        this.info(`Performance: ${entry.operation} took ${entry.duration}ms`, {
            ...this.defaultMeta,
            ...entry,
            category: 'performance'
        });
    }
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
    logBusinessEvent(event, userId, data) {
        this.info(`Business Event: ${event}`, {
            ...this.defaultMeta,
            event,
            userId,
            data,
            category: 'business'
        });
    }
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
    getWinstonLogger() {
        return this.logger;
    }
    isLevelEnabled(level) {
        return this.logger.isLevelEnabled(level);
    }
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
    close() {
        this.logger.close();
    }
}
exports.LoggerService = LoggerService;
exports.logger = LoggerService.getInstance();
function requestLoggingMiddleware() {
    return (req, res, next) => {
        const startTime = Date.now();
        const originalSend = res.send;
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
exports.default = {
    LoggerService,
    logger: exports.logger,
    LogLevel,
    requestLoggingMiddleware,
    errorLoggingMiddleware,
    logPerformance
};
//# sourceMappingURL=logger.js.map