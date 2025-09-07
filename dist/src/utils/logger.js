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
exports.logDebug = exports.logInfo = exports.logWarning = exports.logError = exports.createTimer = exports.PerformanceTimer = exports.createRequestLogger = exports.log = exports.logger = exports.Logger = void 0;
const winston = __importStar(require("winston"));
const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');
const logFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston.format.errors({ stack: true }), winston.format.json(), winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        service: service || 'hasivu-platform',
        environment: NODE_ENV,
        ...meta
    };
    return JSON.stringify(logEntry);
}));
const consoleFormat = winston.format.combine(winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston.format.errors({ stack: true }), winston.format.colorize({ all: true }), winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    if (service) {
        logMessage = `[${timestamp}] [${service}] ${level}: ${message}`;
    }
    if (Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
const transports = [
    new winston.transports.Console({
        format: NODE_ENV === 'production' ? logFormat : consoleFormat,
        level: LOG_LEVEL
    })
];
if (NODE_ENV === 'production') {
    transports.push(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 10485760,
        maxFiles: 5
    }), new winston.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 10485760,
        maxFiles: 10
    }));
}
const logger = winston.createLogger({
    level: LOG_LEVEL,
    format: logFormat,
    defaultMeta: {
        service: 'hasivu-platform',
        environment: NODE_ENV
    },
    transports,
    exitOnError: false,
    silent: NODE_ENV === 'test'
});
class Logger {
    static instance;
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger(logger);
        }
        return Logger.instance;
    }
    debug(message, context) {
        this.logger.debug(message, context);
    }
    info(message, context) {
        this.logger.info(message, context);
    }
    warn(message, context) {
        this.logger.warn(message, context);
    }
    error(message, error, context) {
        const errorContext = {
            ...context,
            ...(error && {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    ...error
                }
            })
        };
        this.logger.error(message, errorContext);
    }
    performance(message, duration, context) {
        this.logger.info(message, {
            ...context,
            duration: `${duration}ms`,
            type: 'performance'
        });
    }
    security(message, context) {
        this.logger.warn(message, {
            ...context,
            type: 'security',
            severity: 'high'
        });
    }
    audit(message, context) {
        this.logger.info(message, {
            ...context,
            type: 'audit'
        });
    }
    database(message, context) {
        this.logger.debug(message, {
            ...context,
            type: 'database'
        });
    }
    request(message, context) {
        this.logger.info(message, {
            ...context,
            type: 'request'
        });
    }
    business(message, context) {
        this.logger.info(message, {
            ...context,
            type: 'business'
        });
    }
    integration(message, context) {
        this.logger.info(message, {
            ...context,
            type: 'integration'
        });
    }
    logFunctionStart(functionName, context) {
        this.logger.info(`Function started: ${functionName}`, {
            ...context,
            type: 'function',
            event: 'start'
        });
    }
    logFunctionEnd(functionName, context) {
        this.logger.info(`Function completed: ${functionName}`, {
            ...context,
            type: 'function',
            event: 'end'
        });
    }
    child(defaultContext) {
        const childLogger = this.logger.child(defaultContext);
        return new Logger(childLogger);
    }
    getWinstonLogger() {
        return this.logger;
    }
}
exports.Logger = Logger;
const enhancedLogger = new Logger(logger);
exports.logger = enhancedLogger;
exports.default = enhancedLogger;
exports.log = enhancedLogger;
const createRequestLogger = (requestId, userId) => {
    return enhancedLogger.child({
        requestId,
        userId,
        type: 'request'
    });
};
exports.createRequestLogger = createRequestLogger;
class PerformanceTimer {
    startTime;
    label;
    logger;
    constructor(label, logger = enhancedLogger) {
        this.label = label;
        this.logger = logger;
        this.startTime = Date.now();
    }
    end(context) {
        const duration = Date.now() - this.startTime;
        this.logger.performance(`${this.label} completed`, duration, context);
        return duration;
    }
    getDuration() {
        return Date.now() - this.startTime;
    }
}
exports.PerformanceTimer = PerformanceTimer;
const createTimer = (label) => {
    return new PerformanceTimer(label);
};
exports.createTimer = createTimer;
const logError = (error, context) => {
    enhancedLogger.error('Unhandled error occurred', error, context);
};
exports.logError = logError;
const logWarning = (message, context) => {
    enhancedLogger.warn(message, context);
};
exports.logWarning = logWarning;
const logInfo = (message, context) => {
    enhancedLogger.info(message, context);
};
exports.logInfo = logInfo;
const logDebug = (message, context) => {
    enhancedLogger.debug(message, context);
};
exports.logDebug = logDebug;
//# sourceMappingURL=logger.js.map