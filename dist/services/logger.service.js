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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = exports.Logger = exports.default = void 0;
/**
 * Logger Service
 * Re-export from utils/logger for backward compatibility
 */
const logger_1 = require("../utils/logger");
__exportStar(require("../utils/logger"), exports);
var logger_2 = require("../utils/logger");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return logger_2.default; } });
var logger_3 = require("../utils/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_3.Logger; } });
// Create alias for LoggerService to Logger for backward compatibility
exports.LoggerService = logger_1.Logger;
