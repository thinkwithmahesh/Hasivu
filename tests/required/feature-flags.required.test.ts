import { NextFunction, Request, Response } from 'express';
import { FeatureFlagService } from '../../src/config/feature-flags';

function createMockResponse() {
  const res: Partial<Response> & {
    statusCode?: number;
    payload?: any;
  } = {};

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res as Response;
  });
  res.json = jest.fn((payload: unknown) => {
    res.payload = payload;
    return res as Response;
  });

  return res as Response & { statusCode?: number; payload?: any };
}

describe('Required Gate: Phase 2 feature flag safety', () => {
  test('launch-impacting Phase 2 flags default to disabled in a clean environment', () => {
    const flags = new FeatureFlagService({});

    expect(flags.get('REALTIME_ENABLED')).toBe(false);
    expect(flags.get('WALLET_ENABLED')).toBe(false);
    expect(flags.get('SUBSCRIPTIONS_ENABLED')).toBe(false);
    expect(flags.get('MEAL_SCHEDULER_ENABLED')).toBe(false);
    expect(flags.get('RECOMMENDATIONS_ENABLED')).toBe(false);
    expect(flags.get('INVOICE_AUTO_SEND_ENABLED')).toBe(false);
    expect(flags.get('SUBSCRIPTION_WALLET_OFFSET_ENABLED')).toBe(false);
    expect(flags.get('WHATSAPP_MODE')).toBe('disabled');
    expect(flags.get('RECOMMENDATION_ENGINE')).toBe('rule_based');
  });

  test('invoice read path is the only Phase 2 feature enabled by default', () => {
    const flags = new FeatureFlagService({});

    expect(flags.get('INVOICE_ENABLED')).toBe(true);
  });

  test('string false environment values are parsed as false', () => {
    const flags = new FeatureFlagService({
      REALTIME_ENABLED: 'false',
      WALLET_ENABLED: 'false',
      INVOICE_AUTO_SEND_ENABLED: 'false',
      SUBSCRIPTIONS_ENABLED: 'false',
      MEAL_SCHEDULER_ENABLED: 'false',
      RECOMMENDATIONS_ENABLED: 'false',
      SUBSCRIPTION_WALLET_OFFSET_ENABLED: 'false',
    });

    expect(flags.get('REALTIME_ENABLED')).toBe(false);
    expect(flags.get('WALLET_ENABLED')).toBe(false);
    expect(flags.get('INVOICE_AUTO_SEND_ENABLED')).toBe(false);
    expect(flags.get('SUBSCRIPTIONS_ENABLED')).toBe(false);
    expect(flags.get('MEAL_SCHEDULER_ENABLED')).toBe(false);
    expect(flags.get('RECOMMENDATIONS_ENABLED')).toBe(false);
    expect(flags.get('SUBSCRIPTION_WALLET_OFFSET_ENABLED')).toBe(false);
  });

  test('disabled feature middleware fails closed with FEATURE_DISABLED', () => {
    jest.isolateModules(() => {
      process.env.WALLET_ENABLED = 'false';
      const { requireFeature } = require('../../src/middleware/feature-flag.middleware');
      const middleware = requireFeature('WALLET_ENABLED');
      const req = { id: 'req-feature-1' } as Request & { id: string };
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.payload?.success).toBe(false);
      expect(res.payload?.error?.code).toBe('FEATURE_DISABLED');
      expect(next).not.toHaveBeenCalled();
    });
  });

  test('enabled feature middleware allows the request through', () => {
    jest.isolateModules(() => {
      process.env.WALLET_ENABLED = 'true';
      const { requireFeature } = require('../../src/middleware/feature-flag.middleware');
      const middleware = requireFeature('WALLET_ENABLED');
      const req = { id: 'req-feature-2' } as Request & { id: string };
      const res = createMockResponse();
      const next = jest.fn() as NextFunction;

      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
