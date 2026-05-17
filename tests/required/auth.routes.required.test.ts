import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { authRouter } from '../../src/routes/auth.routes';

jest.mock('../../src/services/auth.service', () => ({
  authService: {
    validatePassword: jest.fn(() => ({ valid: true })),
    hashPassword: jest.fn(async () => 'hash'),
    authenticate: jest.fn(async () => ({ success: false })),
    updateSessionActivity: jest.fn(async () => undefined),
    refreshAccessToken: jest.fn(async () => ({ success: false, error: 'invalid token' })),
    refreshToken: jest.fn(async () => {
      throw new Error('invalid token');
    }),
    logout: jest.fn(async () => undefined),
    logoutAll: jest.fn(async () => undefined),
  },
}));

jest.mock('../../src/services/database.service', () => ({
  DatabaseService: {
    client: {
      user: {
        findUnique: jest.fn(async () => null),
      },
    },
    transaction: jest.fn(async (fn: (prisma: any) => Promise<any>) =>
      fn({
        user: { create: jest.fn(async () => ({ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'parent' })) },
        role: { findUnique: jest.fn(async () => null) },
        userRoleAssignment: { create: jest.fn(async () => ({})) },
      })
    ),
  },
}));

describe('Required Gate: auth routes contracts', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRouter);

  test('POST /api/auth/login returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login returns 401 when credentials are invalid', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'burst@test.com', password: 'Password1!' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/validate-password returns 200 for valid payload', async () => {
    const res = await request(app).post('/api/auth/validate-password').send({ password: 'Str0ng!Pass' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.validation).toBeDefined();
  });
});
