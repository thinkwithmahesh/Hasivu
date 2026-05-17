
 * HASIVU Platform Security Integration Tests;
 * Comprehensive security testing including penetration testing scenarios;
const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = new PrismaClient();
describe('Security Integration Tests', (
  });
  afterAll(async (
  });
  describe('Authentication Security Tests', (
        }
      });
      test('should reject expired JWT tokens', async (
          { userId: testUser.id, role: 'STUDENT' },
          process.env.JWT_SECRET || 'test-secret',
          { expiresIn: '-1h' } // Expired 1 hour ago
        );
        const response = await request(baseURL)
          .get('/api/user/profile')
          .set('Authorization', `Bearer ${expiredToken}``
          .set('Authorization', `Bearer ${wrongSecretToken}``
          .set('Authorization', `Bearer ${freshToken}``
          .set('Authorization', `Bearer ${freshToken}``
          .set('Authorization', `Bearer ${freshToken}``
          .set('Authorization', `Bearer ${sessionToken}``
          .set('Authorization', `Bearer ${originalToken}``
            .get(`/api/menu/search?q=${encodeURIComponent(query)}``
            .set('Authorization', `Bearer ${authToken}``
            .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${authToken}``
            .set('Authorization', `Bearer ${authToken}``
            .get(`/api/files/${encodeURIComponent(payload)}``
            .set('Authorization', `Bearer ${authToken}``
          .get(`/api/users/${otherUser.id}/profile``
          .set('Authorization', `Bearer ${authToken}``
          .patch(`/api/orders/${otherOrder.id}``
          .set('Authorization', `Bearer ${authToken}``
                .set('Authorization', `Bearer ${authToken}``
                .set('Authorization', `Bearer ${authToken}``
                .set('Authorization', `Bearer ${authToken}``
                .set('Authorization', `Bearer ${authToken}``
          .set('Authorization', `Bearer ${adminToken}``
          .set('Authorization', `Bearer ${authToken}``
            .set('Authorization', `Bearer ${authToken}``