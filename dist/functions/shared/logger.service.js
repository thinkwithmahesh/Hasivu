"use strict";
/**
 * HASIVU Platform - Lambda-Optimized Logger Service
 * CloudWatch-integrated logging optimized for AWS Lambda environment
 * Migration from Express-based winston logger
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.LogLevel = void 0;
/**
 * Log levels for Lambda functions
 */
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Lambda-optimized logger service
 * Uses structured JSON logging for CloudWatch integration
 */
class LoggerService {
    static instance;
    requestId;
    functionName;
    constructor() { }
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
     * Set request ID for request-scoped logging
     */
    setRequestId(requestId) {
        this.requestId = requestId;
    }
    /**
     * Set function name context
     */
    setFunctionName(functionName) {
        this.functionName = functionName;
    }
    /**
     * Create structured log entry
     */
    createLogEntry(level, message, metadata, error) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            requestId: this.requestId,
            functionName: this.functionName
        };
        if (metadata) {
            entry.metadata = metadata;
        }
        if (error) {
            entry.error = {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }
        return entry;
    }
    /**
     * Output log entry to CloudWatch
     */
    output(entry) {
        switch (entry.level) {
            case LogLevel.ERROR:
                console.error(JSON.stringify(entry));
                break;
            case LogLevel.WARN:
                console.warn(JSON.stringify(entry));
                break;
            case LogLevel.INFO:
                console.info(JSON.stringify(entry));
                break;
            case LogLevel.DEBUG:
                console.debug(JSON.stringify(entry));
                break;
            default:
                console.log(JSON.stringify(entry));
        }
    }
    /**
     * Log error message
     */
    error(message, error, metadata) {
        const logError = error instanceof Error ? error : undefined;
        const logMetadata = error && !(error instanceof Error) ? { ...metadata, error } : metadata;
        const entry = this.createLogEntry(LogLevel.ERROR, message, logMetadata, logError);
        this.output(entry);
    }
    /**
     * Log warning message
     */
    warn(message, metadata) {
        const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
        this.output(entry);
    }
    /**
     * Log info message
     */
    info(message, metadata) {
        const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
        this.output(entry);
    }
    /**
     * Log debug message
     */
    debug(message, metadata) {
        const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
        this.output(entry);
    }
    /**
     * Log Lambda function start
     */
    logFunctionStart(event, context) {
        this.setRequestId(context.awsRequestId);
        this.setFunctionName(context.functionName);
        this.info('Lambda function started', {
            functionName: context.functionName,
            functionVersion: context.functionVersion,
            requestId: context.awsRequestId,
            remainingTime: context.getRemainingTimeInMillis()
        });
    }
    /**
     * Log Lambda function end
     */
    logFunctionEnd(statusCode, duration) {
        this.info('Lambda function completed', {
            statusCode,
            duration: `${duration}ms`
        });
    }
    /**
     * Log authentication events
     */
    logAuthentication(event, metadata) {
        this.info(`Authentication: ${event}`, metadata);
    }
    /**
     * Log Cognito operations
     */
    logCognito(operation, metadata) {
        this.info(`Cognito: ${operation}`, metadata);
    }
    /**
     * Log timer operations
     */
    logTimer(label, startTime) {
        const duration = Date.now() - startTime;
        this.debug(`Timer: ${label}`, { duration: `${duration}ms` });
    }
}
exports.LoggerService = LoggerService;
