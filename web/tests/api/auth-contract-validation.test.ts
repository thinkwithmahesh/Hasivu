/**
 * HASIVU Platform - Authentication API Contract Testing Suite
 * 
 * This test suite validates authentication API contracts against OpenAPI specifications:
 * 1. Request/Response Schema Validation
 * 2. API Contract Compliance Testing
 * 3. Backward Compatibility Validation
 * 4. Data Type and Format Validation
 * 
 * Ensures API reliability and prevents breaking changes
 */

import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize JSON Schema validator
const _ajv =  new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// API Contract Schemas
const _API_SCHEMAS =  {
  LOGIN_REQUEST: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      role: { 
        type: 'string', 
        enum: ['admin', 'parent', 'student', 'vendor', 'kitchen_staff'] 
      },
      rememberMe: { type: 'boolean' }
    },
    required: ['email', 'password'],
    additionalProperties: false
  },

  LOGIN_RESPONSE_SUCCESS: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: true },
      data: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', minLength: 1 },
              email: { type: 'string', format: 'email' },
              firstName: { type: 'string', minLength: 1 },
              lastName: { type: 'string', minLength: 1 },
              role: { 
                type: 'string', 
                enum: ['admin', 'parent', 'student', 'vendor', 'kitchen_staff'] 
              },
              isActive: { type: 'boolean' },
              emailVerified: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' }
            },
            required: ['id', 'email', 'firstName', 'lastName', 'role']
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: { type: 'string', minLength: 10 },
              refreshToken: { type: 'string', minLength: 10 },
              expiresIn: { type: 'number', minimum: 0 }
            },
            required: ['accessToken', 'refreshToken', 'expiresIn']
          }
        },
        required: ['user', 'tokens']
      },
      message: { type: 'string' }
    },
    required: ['success', 'data'],
    additionalProperties: false
  },

  LOGIN_RESPONSE_ERROR: {
    type: 'object',
    properties: {
      success: { type: 'boolean', const: false },
      error: {
        type: 'object',
        properties: {
          message: { type: 'string', minLength: 1 },
          code: { type: 'string', minLength: 1 },
          details: { type: 'object' }
        },
        required: ['message', 'code']
      },
      message: { type: 'string' }
    },
    required: ['success', 'error'],
    additionalProperties: false
  },

  REGISTER_REQUEST: {
    type: 'object',
    properties: {
      firstName: { type: 'string', minLength: 2, maxLength: 50 },
      lastName: { type: 'string', minLength: 2, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      password: { 
        type: 'string', 
        minLength: 8,
        pattern: '^(?
// Test Configuration
const _API_BASE_URL =  process.env.NEXT_PUBLIC_API_URL || 'https://api.hasivu.com';

test.describe('🔍 Authentication API Contract Validation', _() => {
  
  test.describe(_'1. Request Schema Validation', _() => {
    
    test(_'✅ Valid login request schemas', _async ({ request }) => {
      const _validRequests =  [
        { email: 'student@hasivu.test', password: 'Test123!@#', role: 'student' },
        { email: 'parent@hasivu.test', password: 'Test123!@#', role: 'parent', rememberMe: true },
        { email: 'admin@hasivu.test', password: 'Test123!@#', role: 'admin', rememberMe: false }
      ];

      const _validate =  ajv.compile(API_SCHEMAS.LOGIN_REQUEST);

      for (const requestData of validRequests) {
        const _isValid =  validate(requestData);
        
        if (!isValid) {
          console.error('Validation errors:', validate.errors);
        }
        
        expect(isValid).toBe(true);
        console.log(`✓ Login request schema valid: ${requestData.role}`);
        
        // Test actual API call
        const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
          data: requestData
        });
        
        // Should accept the request (not necessarily succeed, but not reject due to format)
        expect([200, 401]).toContain(response.status());
      }
    });

    test(_'❌ Invalid login request schemas should be rejected', _async ({ request }) => {
      const _invalidRequests =  [
        { email: 'invalid-email', password: 'Test123!' }, // Invalid email format
        { email: 'test@test.com', password: 'short' }, // Password too short
        { email: 'test@test.com', password: 'Test123!', role: 'invalid_role' }, // Invalid role
        { password: 'Test123!' }, // Missing email
        { email: 'test@test.com' }, // Missing password
        { email: 'test@test.com', password: 'Test123!', extraField: 'not_allowed' } // Extra field
      ];

      const _validate =  ajv.compile(API_SCHEMAS.LOGIN_REQUEST);

      for (const requestData of invalidRequests) {
        const _isValid =  validate(requestData);
        expect(isValid).toBe(false);
        
        console.log(`✓ Invalid request properly rejected: ${JSON.stringify(requestData)}`);
        
        // Test API response
        const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
          data: requestData
        });
        
        // Should return validation error
        expect([400, 422]).toContain(response.status());
      }
    });

    test(_'✅ Valid registration request schema', _async ({ request }) => {
      const _validRegistrationData =  {
        firstName: 'John',
        lastName: 'Doe',
        email: `test.${Date.now()}@hasivu.test`,
        password: 'Test123!@#',
        role: 'student',
        phone: '+1234567890',
        schoolId: 'school-001'
      };

      const _validate =  ajv.compile(API_SCHEMAS.REGISTER_REQUEST);
      const _isValid =  validate(validRegistrationData);
      
      if (!isValid) {
        console.error('Registration validation errors:', validate.errors);
      }
      
      expect(isValid).toBe(true);
      
      // Test API call
      const _response =  await request.post(`${API_BASE_URL}/auth/register`, {
        data: validRegistrationData
      });
      
      expect([200, 201, 409]).toContain(response.status()); // 409 for existing user
      console.log('✓ Registration request schema validation passed');
    });

    test(_'🔄 Refresh token request schema', _async ({ request }) => {
      const _refreshTokenData =  {
        refreshToken: 'sample-refresh-token-string-12345'
      };

      const _validate =  ajv.compile(API_SCHEMAS.REFRESH_TOKEN_REQUEST);
      const _isValid =  validate(refreshTokenData);
      
      expect(isValid).toBe(true);
      
      // Test with invalid data
      const invalidData = { token: 'wrong-field' }; // Wrong field name
      const _isInvalid =  validate(invalidData);
      expect(isInvalid).toBe(false);
      
      console.log('✓ Refresh token request schema validation passed');
    });
  });

  test.describe(_'2. Response Schema Validation', _() => {
    
    test(_'✅ Successful login response schema', _async ({ request }) => {
      const _loginData =  {
        email: 'student@hasivu.test',
        password: 'Test123!',
        role: 'student'
      };

      const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
        data: loginData
      });

      if (response.status() === 200) {
        const _responseData =  await response.json();
        
        const _validate =  ajv.compile(API_SCHEMAS.LOGIN_RESPONSE_SUCCESS);
        const _isValid =  validate(responseData);
        
        if (!isValid) {
          console.error('Login response validation errors:', validate.errors);
          console.error('Actual response:', JSON.stringify(responseData, null, 2));
        }
        
        expect(isValid).toBe(true);
        console.log('✓ Successful login response schema validation passed');
        
        // Additional specific validations
        expect(responseData.data.user.email).toBe(loginData.email);
        expect(responseData.data.user.role).toBe(loginData.role);
        expect(typeof responseData.data.tokens.accessToken).toBe('string');
        expect(typeof responseData.data.tokens.refreshToken).toBe('string');
        expect(typeof responseData.data.tokens.expiresIn).toBe('number');
      }
    });

    test(_'❌ Error response schema validation', _async ({ request }) => {
      const _invalidLoginData =  {
        email: 'nonexistent@test.com',
        password: 'WrongPassword123!'
      };

      const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
        data: invalidLoginData
      });

      if (response.status() >= 400) {
        const _responseData =  await response.json();
        
        const _validate =  ajv.compile(API_SCHEMAS.LOGIN_RESPONSE_ERROR);
        const _isValid =  validate(responseData);
        
        if (!isValid) {
          console.error('Error response validation errors:', validate.errors);
          console.error('Actual error response:', JSON.stringify(responseData, null, 2));
        }
        
        expect(isValid).toBe(true);
        console.log('✓ Error response schema validation passed');
        
        // Verify error structure
        expect(responseData.success).toBe(false);
        expect(typeof responseData.error.message).toBe('string');
        expect(typeof responseData.error.code).toBe('string');
      }
    });

    test(_'🔄 Token refresh response schema', _async ({ request }) => {
      // First login to get a refresh token
      const _loginResponse =  await request.post(`${API_BASE_URL}/auth/login`, {
        data: { email: 'student@hasivu.test', password: 'Test123!' }
      });

      if (loginResponse.status() === 200) {
        const _loginData =  await loginResponse.json();
        const _refreshToken =  loginData.data.tokens.refreshToken;

        // Test refresh token
        const _refreshResponse =  await request.post(`${API_BASE_URL}/auth/refresh`, {
          data: { refreshToken }
        });

        if (refreshResponse.status() === 200) {
          const _refreshData =  await refreshResponse.json();
          
          const _validate =  ajv.compile(API_SCHEMAS.TOKEN_RESPONSE);
          const _isValid =  validate(refreshData);
          
          if (!isValid) {
            console.error('Token refresh response validation errors:', validate.errors);
          }
          
          expect(isValid).toBe(true);
          console.log('✓ Token refresh response schema validation passed');
        }
      }
    });
  });

  test.describe(_'3. Data Type and Format Validation', _() => {
    
    test(_'📧 Email format validation', _async ({ request }) => {
      const _emailTestCases =  [
        { email: 'valid@example.com', shouldBeValid: true },
        { email: 'user+tag@domain.co.uk', shouldBeValid: true },
        { email: 'invalid.email', shouldBeValid: false },
        { email: '@domain.com', shouldBeValid: false },
        { email: 'user@', shouldBeValid: false },
        { email: '', shouldBeValid: false }
      ];

      for (const testCase of emailTestCases) {
        const _requestData =  {
          email: testCase.email,
          password: 'Test123!@#'
        };

        const _validate =  ajv.compile(API_SCHEMAS.LOGIN_REQUEST);
        const _isValid =  validate(requestData);
        
        if (testCase.shouldBeValid) {
          expect(isValid).toBe(true);
          console.log(`✓ Valid email accepted: ${testCase.email}`);
        } else {
          expect(isValid).toBe(false);
          console.log(`✓ Invalid email rejected: ${testCase.email}`);
        }
      }
    });

    test(_'🔐 Password strength validation', _async ({ request }) => {
      const _passwordTestCases =  [
        { password: 'Test123!@#', shouldBeValid: true, description: 'Strong password' },
        { password: 'test123', shouldBeValid: false, description: 'Missing uppercase and special chars' },
        { password: 'TEST123!', shouldBeValid: false, description: 'Missing lowercase' },
        { password: 'Test!@#', shouldBeValid: false, description: 'Missing numbers' },
        { password: 'Test123', shouldBeValid: false, description: 'Missing special chars' },
        { password: 'Test!2', shouldBeValid: false, description: 'Too short' }
      ];

      for (const testCase of passwordTestCases) {
        const _requestData =  {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: testCase.password,
          role: 'student'
        };

        const _validate =  ajv.compile(API_SCHEMAS.REGISTER_REQUEST);
        const _isValid =  validate(requestData);
        
        if (testCase.shouldBeValid) {
          expect(isValid).toBe(true);
          console.log(`✓ ${testCase.description}: Password accepted`);
        } else {
          expect(isValid).toBe(false);
          console.log(`✓ ${testCase.description}: Password rejected`);
        }
      }
    });

    test(_'📱 Phone number format validation', _async ({ request }) => {
      const _phoneTestCases =  [
        { phone: '+1234567890', shouldBeValid: true },
        { phone: '+91-9876543210', shouldBeValid: false }, // Hyphens not allowed in this pattern
        { phone: '1234567890', shouldBeValid: true },
        { phone: '+123', shouldBeValid: false }, // Too short
        { phone: 'invalid-phone', shouldBeValid: false },
        { phone: '', shouldBeValid: true } // Optional field
      ];

      for (const testCase of phoneTestCases) {
        const requestData: _any =  {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'Test123!@#',
          role: 'student'
        };

        if (testCase.phone) {
          requestData._phone =  testCase.phone;
        }

        const _validate =  ajv.compile(API_SCHEMAS.REGISTER_REQUEST);
        const _isValid =  validate(requestData);
        
        if (testCase.shouldBeValid) {
          expect(isValid).toBe(true);
          console.log(`✓ Valid phone format: ${testCase.phone || 'empty'}`);
        } else {
          expect(isValid).toBe(false);
          console.log(`✓ Invalid phone format rejected: ${testCase.phone}`);
        }
      }
    });

    test(_'🏷️ Role enum validation', _async ({ request }) => {
      const _roleTestCases =  [
        { role: 'admin', endpoint: 'login', shouldBeValid: true },
        { role: 'parent', endpoint: 'both', shouldBeValid: true },
        { role: 'student', endpoint: 'both', shouldBeValid: true },
        { role: 'vendor', endpoint: 'both', shouldBeValid: true },
        { role: 'kitchen_staff', endpoint: 'login', shouldBeValid: true },
        { role: 'invalid_role', endpoint: 'both', shouldBeValid: false },
        { role: 'teacher', endpoint: 'both', shouldBeValid: false } // Not in enum
      ];

      for (const testCase of roleTestCases) {
        // Test login endpoint
        if (testCase._endpoint = 
          const _loginValidate =  ajv.compile(API_SCHEMAS.LOGIN_REQUEST);
          const _loginValid =  loginValidate(loginData);
          
          expect(loginValid).toBe(testCase.shouldBeValid);
        }

        // Test registration endpoint (limited roles)
        if (testCase._endpoint = 
          const _registerValidate =  ajv.compile(API_SCHEMAS.REGISTER_REQUEST);
          const _registerValid =  registerValidate(registerData);
          
          expect(registerValid).toBe(true);
          console.log(`✓ Role valid for registration: ${testCase.role}`);
        }
      }
    });
  });

  test.describe(_'4. Backward Compatibility Validation', _() => {
    
    test(_'📊 Response field consistency', _async ({ request }) => {
      const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
        data: {
          email: 'student@hasivu.test',
          password: 'Test123!'
        }
      });

      if (response.status() === 200) {
        const _responseData =  await response.json();
        
        // Check for required fields that should always be present
        const _requiredFields =  [
          'success',
          'data.user.id',
          'data.user.email',
          'data.user.role',
          'data.tokens.accessToken',
          'data.tokens.refreshToken'
        ];

        for (const fieldPath of requiredFields) {
          const _fieldValue =  getNestedProperty(responseData, fieldPath);
          expect(fieldValue).toBeDefined();
          expect(fieldValue).not.toBeNull();
          console.log(`✓ Required field present: ${fieldPath}`);
        }

        // Check for deprecated fields (should warn but not fail)
        const _deprecatedFields =  [
          'data.user.username', // Deprecated in favor of email
          'data.token' // Deprecated in favor of tokens object
        ];

        for (const fieldPath of deprecatedFields) {
          const _fieldValue =  getNestedProperty(responseData, fieldPath);
          if (fieldValue !== undefined) {
            console.warn(`⚠️ Deprecated field still present: ${fieldPath}`);
          }
        }
      }
    });

    test(_'🔄 API versioning support', _async ({ request }) => {
      const _versions =  ['v1', 'v2'];
      
      for (const version of versions) {
        const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
          headers: {
            'Accept': `application/vnd.hasivu.${version}+json`
          },
          data: {
            email: 'student@hasivu.test',
            password: 'Test123!'
          }
        });

        // Should either work or return proper version error
        expect([200, 404, 406]).toContain(response.status());
        
        if (response.status() === 200) {
          console.log(`✓ API version ${version} supported`);
        } else {
          console.log(`✓ API version ${version} properly handled: ${response.status()}`);
        }
      }
    });

    test(_'📝 Content-Type handling', _async ({ request }) => {
      const _contentTypes =  [
        'application/json',
        'application/x-www-form-urlencoded',
        'text/plain' // Should be rejected
      ];

      for (const contentType of contentTypes) {
        const _loginData =  {
          email: 'student@hasivu.test',
          password: 'Test123!'
        };

        let requestBody: any;
        const headers: _any =  { 'Content-Type': contentType };

        if (_contentType = 
        } else if (_contentType = 
        } else {
          _requestBody =  'invalid data';
        }

        const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
          headers,
          data: requestBody
        });

        if (_contentType = 
          console.log(`✓ JSON content-type accepted`);
        } else if (_contentType = 
          console.log(`✓ Form content-type handled: ${response.status()}`);
        } else {
          expect([415, 400]).toContain(response.status());
          console.log(`✓ Invalid content-type rejected: ${response.status()}`);
        }
      }
    });
  });

  test.describe(_'5. Error Response Contract Validation', _() => {
    
    test(_'🚨 Standard error response format', _async ({ request }) => {
      const _errorCausingRequests =  [
        { data: { email: 'invalid@test.com', password: 'wrong' }, expectedStatus: 401 },
        { data: { email: '', password: 'test' }, expectedStatus: 400 },
        { data: { invalid: 'data' }, expectedStatus: 400 },
      ];

      for (const testCase of errorCausingRequests) {
        const _response =  await request.post(`${API_BASE_URL}/auth/login`, {
          data: testCase.data
        });

        expect(response.status()).toBeGreaterThanOrEqual(400);
        
        const _errorData =  await response.json();
        
        // Validate error response schema
        const _validate =  ajv.compile(API_SCHEMAS.LOGIN_RESPONSE_ERROR);
        const _isValid =  validate(errorData);
        
        if (!isValid) {
          console.error('Error response validation failed:', validate.errors);
          console.error('Actual error response:', JSON.stringify(errorData, null, 2));
        }
        
        expect(isValid).toBe(true);
        console.log(`✓ Error response contract validated for status ${response.status()}`);
      }
    });
  });
});

// Helper function to get nested property values
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce(_(current, _key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}