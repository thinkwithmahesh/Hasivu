import { Request, Response } from 'express';
import { corsMiddleware, validateInput } from '../../src/middleware/auth.middleware';

describe('Required Gate: auth middleware', () => {
  test('validateInput sanitizes script-like payload', () => {
    const req = {
      body: {
        message: '<script>alert(1)</script>',
        nested: { value: 'javascript:evil()' },
      },
      query: { q: 'onload=boom' },
    } as unknown as Request;

    const res = {} as Response;
    const next = jest.fn();

    validateInput(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.body.message).toContain('script');
    expect(req.body.message).not.toContain('<');
    expect(req.body.nested.value).not.toContain('javascript:');
    expect((req.query as Record<string, string>).q).not.toContain('onload=');
  });

  test('corsMiddleware sets CORS headers and handles preflight', () => {
    process.env.CORS_ORIGINS = 'http://localhost:3000,https://app.hasivu.com';
    const headers: Record<string, string> = {};
    const req = {
      method: 'OPTIONS',
      headers: { origin: 'http://localhost:3000' },
    } as unknown as Request;
    const res = {
      header: (key: string, value: string) => {
        headers[key] = value;
        return res;
      },
      sendStatus: jest.fn(),
    } as unknown as Response;
    const next = jest.fn();

    corsMiddleware(req, res, next);

    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
    expect(headers['Access-Control-Allow-Methods']).toContain('GET');
    expect((res.sendStatus as jest.Mock).mock.calls[0][0]).toBe(200);
    expect(next).not.toHaveBeenCalled();
  });
});
