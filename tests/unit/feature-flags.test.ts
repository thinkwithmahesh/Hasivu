import { FeatureFlagService } from '../../src/config/feature-flags';

describe('FeatureFlagService', () => {
  it('defaults Phase 2 launch-impacting flags to disabled', () => {
    const flags = new FeatureFlagService({});

    expect(flags.isEnabled('REALTIME_ENABLED')).toBe(false);
    expect(flags.isEnabled('WALLET_ENABLED')).toBe(false);
    expect(flags.isEnabled('SUBSCRIPTIONS_ENABLED')).toBe(false);
    expect(flags.isEnabled('MEAL_SCHEDULER_ENABLED')).toBe(false);
    expect(flags.isEnabled('RECOMMENDATIONS_ENABLED')).toBe(false);
    expect(flags.get('WHATSAPP_MODE')).toBe('disabled');
  });

  it('parses explicit production-mode flags', () => {
    const flags = new FeatureFlagService({
      REALTIME_ENABLED: 'true',
      WHATSAPP_MODE: 'production',
    });

    expect(flags.isEnabled('REALTIME_ENABLED')).toBe(true);
    expect(flags.isEnabled('WHATSAPP_MODE')).toBe(true);
  });
});

