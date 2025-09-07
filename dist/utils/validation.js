"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTenantData = exports.validateOrder = exports.validateMenuItem = exports.validateSchoolAssignment = exports.validateDistrictAdmin = void 0;
/**
 * Validation Utilities
 * Common validation functions for enterprise operations
 */
const validation_service_1 = require("../services/validation.service");
const validationService = validation_service_1.ValidationService.getInstance();
/**
 * Validate district admin data
 */
const validateDistrictAdmin = (data) => {
    const schema = {
        email: { type: 'email', required: true },
        firstName: { type: 'string', required: true, minLength: 2, maxLength: 50 },
        lastName: { type: 'string', required: true, minLength: 2, maxLength: 50 },
        districtId: { type: 'uuid', required: true },
        permissions: { type: 'array', required: false }
    };
    return validationService.validateObject(data, schema);
};
exports.validateDistrictAdmin = validateDistrictAdmin;
/**
 * Validate school assignment data
 */
const validateSchoolAssignment = (data) => {
    const schema = {
        schoolId: { type: 'uuid', required: true },
        adminId: { type: 'uuid', required: true },
        role: { type: 'string', required: true, enum: ['admin', 'manager', 'viewer'] },
        permissions: { type: 'array', required: false }
    };
    return validationService.validateObject(data, schema);
};
exports.validateSchoolAssignment = validateSchoolAssignment;
/**
 * Validate menu item data
 */
const validateMenuItem = (data) => {
    const schema = {
        name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        description: { type: 'string', required: false, maxLength: 500 },
        price: { type: 'number', required: true, min: 0 },
        category: { type: 'string', required: true },
        isAvailable: { type: 'boolean', required: false },
        schoolId: { type: 'uuid', required: true }
    };
    return validationService.validateObject(data, schema);
};
exports.validateMenuItem = validateMenuItem;
/**
 * Validate order data
 */
const validateOrder = (data) => {
    const schema = {
        userId: { type: 'uuid', required: true },
        items: { type: 'array', required: true },
        totalAmount: { type: 'number', required: true, min: 0 },
        deliveryTime: { type: 'date', required: false },
        paymentMethod: { type: 'string', required: true, enum: ['card', 'wallet', 'cash'] }
    };
    return validationService.validateObject(data, schema);
};
exports.validateOrder = validateOrder;
/**
 * Validate tenant data
 */
const validateTenantData = (data) => {
    const schema = {
        name: { type: 'string', required: true, minLength: 2, maxLength: 100 },
        domain: { type: 'string', required: true, minLength: 3, maxLength: 50 },
        description: { type: 'string', required: false, maxLength: 500 },
        settings: { type: 'object', required: false },
        isActive: { type: 'boolean', required: false }
    };
    return validationService.validateObject(data, schema);
};
exports.validateTenantData = validateTenantData;
