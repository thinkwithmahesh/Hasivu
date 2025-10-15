"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggingService = exports.LoggingService = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
    LogLevel["FATAL"] = "fatal";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class LoggingService {
    static instance;
    logLevel;
    constructor() {
        this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'info');
    }
    static getInstance() {
        if (!LoggingService.instance) {
            LoggingService.instance = new LoggingService();
        }
        return LoggingService.instance;
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
    formatLog(entry) {
        const { level, message, timestamp, context, error } = entry;
        const contextStr = context ? ` ${JSON.stringify(context)}` : '';
        const errorStr = error ? ` | Error: ${error.message}\n${error.stack}` : '';
        return `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}${contextStr}${errorStr}`;
    }
    log(level, message, context, error) {
        if (!this.shouldLog(level))
            return;
        const entry = {
            level,
            message,
            timestamp: new Date(),
            context,
            error,
        };
        const formattedLog = this.formatLog(entry);
        switch (level) {
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                break;
            case LogLevel.WARN:
                break;
            default:
        }
    }
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    error(message, error, context) {
        this.log(LogLevel.ERROR, message, context, error);
    }
    fatal(message, error, context) {
        this.log(LogLevel.FATAL, message, context, error);
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
}
exports.LoggingService = LoggingService;
exports.loggingService = LoggingService.getInstance();
exports.default = LoggingService;
//# sourceMappingURL=logging.service.js.map