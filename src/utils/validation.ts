/**
 * Validation Utilities
 * Common validation functions for enterprise operations
 */
import { ValidationService } from '../services/validation.service';

const validationService = ValidationService.getInstance();

/**
 * Validate district admin data
 */
export const validateDistrictAdmin = (data: any) => {
  const schema = {
    email: { type: 'email' as const, required: true },
    firstName: { type: 'string' as const, required: true, minLength: 2, maxLength: 50 },
    lastName: { type: 'string' as const, required: true, minLength: 2, maxLength: 50 },
    districtId: { type: 'uuid' as const, required: true },
    permissions: { type: 'array' as const, required: false },
  };

  return ValidationService.validateObject(data, schema);
};

/**
 * Validate school assignment data
 */
export const validateSchoolAssignment = (data: any) => {
  const schema = {
    schoolId: { type: 'uuid' as const, required: true },
    adminId: { type: 'uuid' as const, required: true },
    role: { type: 'string' as const, required: true, enum: ['admin', 'manager', 'viewer'] },
    permissions: { type: 'array' as const, required: false },
  };

  return ValidationService.validateObject(data, schema);
};

/**
 * Validate menu item data
 */
export const validateMenuItem = (data: any) => {
  const schema = {
    name: { type: 'string' as const, required: true, minLength: 2, maxLength: 100 },
    description: { type: 'string' as const, required: false, maxLength: 500 },
    price: { type: 'number' as const, required: true, min: 0 },
    category: { type: 'string' as const, required: true },
    isAvailable: { type: 'boolean' as const, required: false },
    schoolId: { type: 'uuid' as const, required: true },
  };

  return ValidationService.validateObject(data, schema);
};

/**
 * Validate order data
 */
export const validateOrder = (data: any) => {
  const schema = {
    userId: { type: 'uuid' as const, required: true },
    items: { type: 'array' as const, required: true },
    totalAmount: { type: 'number' as const, required: true, min: 0 },
    deliveryTime: { type: 'date' as const, required: false },
    paymentMethod: { type: 'string' as const, required: true, enum: ['card', 'wallet', 'cash'] },
  };

  return ValidationService.validateObject(data, schema);
};

/**
 * Validate tenant data
 */
export const validateTenantData = (data: any) => {
  const schema = {
    name: { type: 'string' as const, required: true, minLength: 2, maxLength: 100 },
    domain: { type: 'string' as const, required: true, minLength: 3, maxLength: 50 },
    description: { type: 'string' as const, required: false, maxLength: 500 },
    settings: { type: 'object' as const, required: false },
    isActive: { type: 'boolean' as const, required: false },
  };

  return ValidationService.validateObject(data, schema);
};
