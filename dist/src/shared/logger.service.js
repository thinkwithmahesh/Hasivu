"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.LogLevel = exports.default = exports.logger = void 0;
const logger_1 = require("../utils/logger");
var logger_2 = require("../utils/logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_2.logger; } });
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return logger_2.logger; } });
Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function () { return logger_2.LogLevel; } });
class LoggerService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!LoggerService.instance) {
            LoggerService.instance = new LoggerService();
        }
        return LoggerService.instance;
    }
    info(message, context) {
        logger_1.logger.info(message, context);
    }
    error(message, error, context) {
        logger_1.logger.error(message, error, context);
    }
    warn(message, context) {
        logger_1.logger.warn(message, context);
    }
    debug(message, context) {
        logger_1.logger.debug(message, context);
    }
    logFunctionStart(functionName, context) {
        logger_1.logger.logFunctionStart(functionName, context);
    }
    logFunctionEnd(functionName, context) {
        logger_1.logger.logFunctionEnd(functionName, context);
    }
}
exports.LoggerService = LoggerService;
//# sourceMappingURL=logger.service.js.map