"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["ERROR"] = "error";
    LogLevel["WARN"] = "warn";
    LogLevel["INFO"] = "info";
    LogLevel["DEBUG"] = "debug";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class LoggerService {
    static instance;
    requestId;
    functionName;
    constructor() { }
    static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }
    setRequestId(requestId) {
        this.requestId = requestId;
    }
    setFunctionName(functionName) {
        this.functionName = functionName;
    }
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
    error(message, error, metadata) {
        const logError = error instanceof Error ? error : undefined;
        const logMetadata = error && !(error instanceof Error) ? { ...metadata, error } : metadata;
        const entry = this.createLogEntry(LogLevel.ERROR, message, logMetadata, logError);
        this.output(entry);
    }
    warn(message, metadata) {
        const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
        this.output(entry);
    }
    info(message, metadata) {
        const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
        this.output(entry);
    }
    debug(message, metadata) {
        const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
        this.output(entry);
    }
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
    logFunctionEnd(statusCode, duration) {
        this.info('Lambda function completed', {
            statusCode,
            duration: `${duration}ms`
        });
    }
    logAuthentication(event, metadata) {
        this.info(`Authentication: ${event}`, metadata);
    }
    logCognito(operation, metadata) {
        this.info(`Cognito: ${operation}`, metadata);
    }
    logTimer(label, startTime) {
        const duration = Date.now() - startTime;
        this.debug(`Timer: ${label}`, { duration: `${duration}ms` });
    }
}
exports.LoggerService = LoggerService;
//# sourceMappingURL=logger.service.js.map