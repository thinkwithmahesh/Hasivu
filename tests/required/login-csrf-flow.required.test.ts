import express from 'express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { authRouter } from '../../src/routes/auth.routes';
import { attachCSRFToken, csrfProtection } from '../../src/middleware/csrf.middleware';

jest.mock('../../src/services/auth.service', () => ({
  authService: {
    validatePassword: jest.fn(() => ({ valid: true })),
    hashPassword: jest.fn(async () => 'hash'),
    authenticate: jest.fn(async () => ({
      success: true,
      sessionId: 'sess-csrf-flow',
      tokens: {
        accessToken: 'access-token-test',
        refreshToken: 'refresh-token-test',
        expiresIn: 3600,
      },
      user: {
        id: 'u1',
        email: 'parent@test.com',
        firstName: 'P',
        lastName: 'T',
        role: 'parent',
        permissions: [],
        schoolId: undefined,
      },
      schoolId: undefined,
    })),
    updateSessionActivity: jest.fn(async () => undefined),
    refreshAccessToken: jest.fn(async () => ({ success: false, error: 'invalid token' })),
    logout: jest.fn(async () => undefined),
    logoutAll: jest.fn(async () => undefined),
  },
}));

jest.mock('../../src/services/session.service', () => ({
  sessionService: {
    validateCSRFToken: jest.fn().mockResolvedValue(true),
    generateCSRFToken: jest.fn().mockResolvedValue({
      token: 'issued-csrf-token',
      expiresAt: new Date(Date.now() + 3600000),
    }),
  },
}));

jest.mock('../../src/services/database.service', () => ({
  DatabaseService: {
    client: { user: { findUnique: jest.fn(async () => null) } },
    transaction: jest.fn(),
  },
}));

describe('Required Gate: login → CSRF-protected POST', () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachCSRFToken);
  app.use('/api', csrfProtection());
  app.use('/api/auth', authRouter);
  app.get('/api/session-csrf-bootstrap', (_req, res) => {
    res.status(200).json({ success: true, authenticated: true });
  });
  app.post('/api/csrf-guarded-echo', (_req, res) => {
    res.status(200).json({ ok: true });
  });

  test('login sets sessionId; subsequent POST with X-CSRF-Token returns 200', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'parent@test.com', password: 'Password1!' });

    expect(loginRes.status).toBe(200);
    const rawCookies = loginRes.get('Set-Cookie');
    expect(rawCookies).toBeDefined();
    const cookieHeader = Array.isArray(rawCookies) ? rawCookies.map(c => c.split(';')[0]).join('; ') : rawCookies;
    expect(cookieHeader).toContain('accessToken=access-token-test');
    expect(cookieHeader).toContain('refreshToken=refresh-token-test');

    const cookiesWithSession = `${String(cookieHeader ?? '')}; sessionId=sess-csrf-flow`;
    const getRes = await request(app).get('/api/session-csrf-bootstrap').set('Cookie', cookiesWithSession);
    expect(getRes.status).toBe(200);
    const csrf = getRes.get('X-CSRF-Token');
    expect(csrf).toBe('issued-csrf-token');

    const postRes = await request(app)
      .post('/api/csrf-guarded-echo')
      .set('Cookie', cookiesWithSession)
      .set('X-CSRF-Token', String(csrf))
      .send({ x: 1 });

    expect(postRes.status).toBe(200);
    expect(postRes.body).toEqual({ ok: true });
  });
});
