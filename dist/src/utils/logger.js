"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    logLevel;
    constructor() {
        this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    }
    parseLogLevel(level) {
        const normalized = level.toLowerCase();
        return Object.values(LogLevel).includes(normalized)
            ? normalized
            : LogLevel.INFO;
    }
    shouldLog(level) {
        const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
        return levels.indexOf(level) >= levels.indexOf(this.logLevel);
    }
    formatLog(level, message, context) {
        const timestamp = new Date().toISOString();
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatLog(LogLevel.DEBUG, message, context));
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatLog(LogLevel.INFO, message, context));
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(this.formatLog(LogLevel.WARN, message, context));
        }
    }
    error(message, error, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            const errorContext = error
                ? { ...context, error: error.message, stack: error.stack }
                : context;
            console.error(this.formatLog(LogLevel.ERROR, message, errorContext));
        }
    }
    fatal(message, error, context) {
        if (this.shouldLog(LogLevel.FATAL)) {
            const errorContext = error
                ? { ...context, error: error.message, stack: error.stack }
                : context;
            console.error(this.formatLog(LogLevel.FATAL, message, errorContext));
        }
    }
    integration(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(this.formatLog(LogLevel.INFO, `[INTEGRATION] ${message}`, context));
        }
    }
    logFunctionStart(functionName, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatLog(LogLevel.DEBUG, `Function ${functionName} started`, context));
        }
    }
    logFunctionEnd(functionName, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(this.formatLog(LogLevel.DEBUG, `Function ${functionName} ended`, context));
        }
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
}
exports.Logger = Logger;
exports.logger = new Logger();
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map