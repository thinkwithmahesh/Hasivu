
 * HASIVU Platform API Integration Tests;
 * Comprehensive testing of REST API endpoints with security validation;
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
// Test configuration
const TEST_CONFIG = {}
};
describe('HASIVU API Integration Tests', (
  });
  afterAll(async (
  });
  describe('Authentication API', (
          })
          .expect(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(testUser.email);
      });
      test('should reject invalid credentials', async (
          })
          .expect(401);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toMatch(/invalid credentials/i);
      });
      test('should prevent SQL injection attempts', async (
        };
        const response = await request(TEST_CONFIG.baseURL)
          .post('/api/auth/login')
          .send(maliciousPayload)
          .expect(400);
        expect(response.body.error).toMatch(/validation failed/i);
      });
      test('should implement rate limiting', async (
              })
          );
        }
        const responses = await Promise.all(promises);
        const rateLimitedResponses = responses.filter(res => res.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
      });
    });
    describe('POST /api/auth/register', (
        };
        const response = await request(TEST_CONFIG.baseURL)
          .post('/api/auth/register')
          .send(newUserData)
          .expect(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(newUserData.email);
        expect(response.body).not.toHaveProperty('password');
      });
      test('should validate password strength', async (
        };
        const response = await request(TEST_CONFIG.baseURL)
          .post('/api/auth/register')
          .send(weakPasswordData)
          .expect(400);
        expect(response.body.error).toMatch(/password requirements/i);
      });
      test('should sanitize XSS attempts', async (
        };
        const response = await request(TEST_CONFIG.baseURL)
          .post('/api/auth/register')
          .send(xssPayload)
          .expect(400);
        expect(response.body.error).toMatch(/invalid characters/i);
      });
    });
  });
  describe('Menu API', (
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``