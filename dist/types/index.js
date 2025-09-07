"use strict";
/**
 * Consolidated Type Definitions for HASIVU Platform
 * Central exports for all TypeScript types and interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOTIFICATION_CHANNELS = exports.NOTIFICATION_TYPES = exports.DELIVERY_STATUSES = exports.PAYMENT_STATUSES = exports.ORDER_STATUSES = exports.USER_ROLES = exports.createErrorResponse = exports.getErrorMessage = exports.isOperationalError = void 0;
var errors_1 = require("../utils/errors");
Object.defineProperty(exports, "isOperationalError", { enumerable: true, get: function () { return errors_1.isOperationalError; } });
Object.defineProperty(exports, "getErrorMessage", { enumerable: true, get: function () { return errors_1.getErrorMessage; } });
Object.defineProperty(exports, "createErrorResponse", { enumerable: true, get: function () { return errors_1.createErrorResponse; } });
// Common constant types
exports.USER_ROLES = ['PARENT', 'STUDENT', 'TEACHER', 'ADMIN', 'SCHOOL_ADMIN'];
exports.ORDER_STATUSES = ['draft', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
exports.PAYMENT_STATUSES = ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded'];
exports.DELIVERY_STATUSES = ['scheduled', 'in_transit', 'delivered', 'failed', 'returned'];
exports.NOTIFICATION_TYPES = ['order_confirmation', 'order_update', 'payment_success', 'payment_failed', 'delivery_update', 'menu_update', 'school_announcement', 'promotion', 'system_alert'];
exports.NOTIFICATION_CHANNELS = ['email', 'sms', 'push', 'in_app'];
