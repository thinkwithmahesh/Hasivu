import { z } from 'zod';

const FeatureFlagSchema = z.object({
  REALTIME_ENABLED: z.coerce.boolean().default(false),
  WALLET_ENABLED: z.coerce.boolean().default(false),
  INVOICE_ENABLED: z.coerce.boolean().default(true),
  INVOICE_AUTO_SEND_ENABLED: z.coerce.boolean().default(false),
  SUBSCRIPTIONS_ENABLED: z.coerce.boolean().default(false),
  WHATSAPP_MODE: z.enum(['disabled', 'sandbox', 'production']).default('disabled'),
  MEAL_SCHEDULER_ENABLED: z.coerce.boolean().default(false),
  RECOMMENDATIONS_ENABLED: z.coerce.boolean().default(false),
  RECOMMENDATION_ENGINE: z.enum(['rule_based', 'ml']).default('rule_based'),
  SUBSCRIPTION_WALLET_OFFSET_ENABLED: z.coerce.boolean().default(false),
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
