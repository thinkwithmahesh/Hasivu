import { z } from 'zod';

const booleanFlag = z.preprocess(value => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off', ''].includes(normalized)) {
      return false;
    }
  }

  return value;
}, z.boolean());

const FeatureFlagSchema = z.object({
  REALTIME_ENABLED: booleanFlag.default(false),
  WALLET_ENABLED: booleanFlag.default(false),
  INVOICE_ENABLED: booleanFlag.default(true),
  INVOICE_AUTO_SEND_ENABLED: booleanFlag.default(false),
  SUBSCRIPTIONS_ENABLED: booleanFlag.default(false),
  WHATSAPP_MODE: z.enum(['disabled', 'sandbox', 'production']).default('disabled'),
  MEAL_SCHEDULER_ENABLED: booleanFlag.default(false),
  RECOMMENDATIONS_ENABLED: booleanFlag.default(false),
  RECOMMENDATION_ENGINE: z.enum(['rule_based', 'ml']).default('rule_based'),
  SUBSCRIPTION_WALLET_OFFSET_ENABLED: booleanFlag.default(false),
});

export type FeatureFlags = z.infer<typeof FeatureFlagSchema>;
export type FeatureFlagName = keyof FeatureFlags;

export class FeatureFlagService {
  private readonly flags: FeatureFlags;

  constructor(env: NodeJS.ProcessEnv = process.env) {
    const parsed = FeatureFlagSchema.safeParse(env);
    this.flags = parsed.success ? parsed.data : FeatureFlagSchema.parse({});
  }

  get<K extends FeatureFlagName>(flag: K): FeatureFlags[K] {
    return this.flags[flag];
  }

  isEnabled(flag: FeatureFlagName): boolean {
    const value = this.flags[flag];
    return value === true || value === 'production';
  }

  snapshot(): Readonly<FeatureFlags> {
    return { ...this.flags };
  }
}

export const featureFlags = new FeatureFlagService();
