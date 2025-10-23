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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._LoggerService = exports.Logger = exports.default = void 0;
const logger_1 = require("../utils/logger");
__exportStar(require("../utils/logger"), exports);
var logger_2 = require("../utils/logger");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(logger_2).default; } });
var logger_3 = require("../utils/logger");
Object.defineProperty(exports, "Logger", { enumerable: true, get: function () { return logger_3.Logger; } });
exports._LoggerService = logger_1.Logger;
//# sourceMappingURL=logger.service.js.map