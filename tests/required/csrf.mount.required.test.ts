import express from 'express';
import request from 'supertest';
import { csrfProtection } from '../../src/middleware/csrf.middleware';

jest.mock('../../src/services/session.service', () => ({
  sessionService: {
    validateCSRFToken: jest.fn(),
  },
}));

const { sessionService } = require('../../src/services/session.service');

describe('Required Gate: mounted /api CSRF enforcement', () => {
  const app = express();
  app.use(express.json());
  app.use('/api', csrfProtection());
  app.post('/api/protected', (_req, res) => res.status(200).json({ ok: true }));

  test('mounted /api rejects state-changing call without CSRF token', async () => {
    const response = await request(app)
      .post('/api/protected')
      .set('x-session-id', 'session-a')
      .send({ hello: 'world' });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('CSRF token required');
  });

  test('mounted /api accepts valid CSRF token', async () => {
    sessionService.validateCSRFToken.mockResolvedValue(true);

    const response = await request(app)
      .post('/api/protected')
      .set('x-session-id', 'session-b')
      .set('x-csrf-token', 'valid-token')
      .send({ hello: 'world' });

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(sessionService.validateCSRFToken).toHaveBeenCalledWith('session-b', 'valid-token');
  });
});
