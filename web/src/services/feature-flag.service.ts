import {
  FeatureFlag,
  FeatureFlagKey,
  FeatureFlagEvaluationContext,
  FeatureFlagResult,
  FeatureFlagConfig,
  UserSegment,
  FeatureFlagEnvironment,
  FeatureFlagRolloutStrategy,
  _FEATURE_FLAGS as _FEATURE_FLAGS,
} from '../types/feature-flags';

class FeatureFlagService {
  private config: FeatureFlagConfig;
  private cache: Map<string, FeatureFlagResult> = new Map();
  private cacheTimeout: number;

  constructor(config?: Partial<FeatureFlagConfig>) {
    this.config = {
      flags: [],
      segments: [],
      globalSettings: {
        defaultEnvironment: 'development',
        enableAnalytics: false,
        cacheTimeout: 300000, // 5 minutes
        ...config?.globalSettings,
      },
      ...config,
    };
    this.cacheTimeout = this.config.globalSettings.cacheTimeout;
  }

  /**
   * Get a feature flag by key
   */
  getFlag(key: FeatureFlagKey): FeatureFlag | undefined {
    return this.config.flags.find(flag => flag.key === key);
  }

  /**
   * Evaluate a feature flag for a given context
   */
  evaluate(key: FeatureFlagKey, context: FeatureFlagEvaluationContext): FeatureFlagResult {
    const cacheKey = `${key}-${JSON.stringify(context)}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const flag = this.getFlag(key);
    if (!flag) {
      const result: FeatureFlagResult = {
        enabled: false,
        reason: 'Feature flag not found',
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    if (!flag.enabled) {
      const result: FeatureFlagResult = {
        enabled: false,
        reason: 'Feature flag is disabled',
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    // Evaluate rules
    for (const rule of flag.rules) {
      const evaluation = this.evaluateRule(rule, context);
      if (evaluation.enabled) {
        const result: FeatureFlagResult = {
          enabled: true,
          rule,
          reason: evaluation.reason,
          metadata: evaluation.metadata,
        };
        this.cache.set(cacheKey, result);
        return result;
      }
    }

    const result: FeatureFlagResult = {
      enabled: false,
      reason: 'No matching rules found',
    };
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Evaluate a single rule
   */
  private evaluateRule(
    rule: any,
    context: FeatureFlagEvaluationContext
  ): FeatureFlagResult & { metadata?: any } {
    // Check environment
    if (rule.environments && !rule.environments.includes(context.environment)) {
      return {
        enabled: false,
        reason: 'Environment not allowed',
        metadata: { environmentMatch: false },
      };
    }

    // Check date range
    const now = new Date();
    if (rule.startDate && now < rule.startDate) {
      return {
        enabled: false,
        reason: 'Feature not yet active',
      };
    }
    if (rule.endDate && now > rule.endDate) {
      return {
        enabled: false,
        reason: 'Feature has expired',
      };
    }

    // Evaluate based on strategy
    switch (rule.strategy) {
      case 'percentage':
        return this.evaluatePercentageRule(rule, context);
      case 'user-segment':
        return this.evaluateSegmentRule(rule, context);
      case 'environment':
        return {
          enabled: true,
          reason: 'Environment-based rollout',
          metadata: { environmentMatch: true },
        };
      case 'gradual':
        return this.evaluateGradualRule(rule, context);
      default:
        return {
          enabled: false,
          reason: 'Unknown rollout strategy',
        };
    }
  }

  /**
   * Evaluate percentage-based rule
   */
  private evaluatePercentageRule(
    rule: any,
    context: FeatureFlagEvaluationContext
  ): FeatureFlagResult & { metadata?: any } {
    if (!rule.percentage || rule.percentage <= 0) {
      return {
        enabled: false,
        reason: 'Invalid percentage',
      };
    }

    if (rule.percentage >= 100) {
      return {
        enabled: true,
        reason: '100% rollout',
        metadata: { rolloutPercentage: rule.percentage },
      };
    }

    // Use user ID or generate hash for consistent rollout
    const identifier = context.userId || context.schoolId || 'anonymous';
    const hash = this.simpleHash(identifier);
    const userPercentage = (hash % 100) + 1;

    const enabled = userPercentage <= rule.percentage;
    return {
      enabled,
      reason: enabled ? 'User in rollout percentage' : 'User not in rollout percentage',
      metadata: {
        rolloutPercentage: rule.percentage,
        userPercentage,
      },
    };
  }

  /**
   * Evaluate user segment rule
   */
  private evaluateSegmentRule(
    rule: any,
    context: FeatureFlagEvaluationContext
  ): FeatureFlagResult & { metadata?: any } {
    if (!rule.segments || rule.segments.length === 0) {
      return {
        enabled: false,
        reason: 'No segments defined',
      };
    }

    for (const segmentId of rule.segments) {
      const segment = this.config.segments.find(s => s.id === segmentId);
      if (segment && this.matchesSegment(segment, context)) {
        return {
          enabled: true,
          reason: 'User matches segment',
          metadata: {
            segmentMatch: true,
            matchedSegment: segmentId,
          },
        };
      }
    }

    return {
      enabled: false,
      reason: 'User does not match any segment',
      metadata: { segmentMatch: false },
    };
  }

  /**
   * Evaluate gradual rollout rule
   */
  private evaluateGradualRule(
    rule: any,
    context: FeatureFlagEvaluationContext
  ): FeatureFlagResult & { metadata?: any } {
    // Simple gradual rollout - could be enhanced with more sophisticated logic
    return this.evaluatePercentageRule(rule, context);
  }

  /**
   * Check if user matches a segment
   */
  private matchesSegment(segment: UserSegment, context: FeatureFlagEvaluationContext): boolean {
    const { criteria } = segment;

    if (criteria.userType && context.userType && !criteria.userType.includes(context.userType)) {
      return false;
    }

    if (criteria.schoolId && context.schoolId && !criteria.schoolId.includes(context.schoolId)) {
      return false;
    }

    if (criteria.role && context.role && !criteria.role.includes(context.role)) {
      return false;
    }

    if (criteria.region && context.region && !criteria.region.includes(context.region)) {
      return false;
    }

    // Check custom properties
    if (criteria.customProperties && context.customProperties) {
      for (const [key, expectedValue] of Object.entries(criteria.customProperties)) {
        const actualValue = context.customProperties[key];
        if (actualValue !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Simple hash function for percentage rollouts
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Update a feature flag
   */
  updateFlag(flag: FeatureFlag): void {
    const index = this.config.flags.findIndex(f => f.key === flag.key);
    if (index >= 0) {
      this.config.flags[index] = flag;
      // Clear cache for this flag
      for (const [key] of this.cache) {
        if (key.startsWith(flag.key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.config.flags.push(flag);
    }
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return [...this.config.flags];
  }

  /**
   * Set flags (for initialization)
   */
  setFlags(flags: FeatureFlag[]): void {
    this.config.flags = flags;
    this.clearCache();
  }

  /**
   * Set segments (for initialization)
   */
  setSegments(segments: UserSegment[]): void {
    this.config.segments = segments;
    this.clearCache();
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; timeout: number } {
    return {
      size: this.cache.size,
      timeout: this.cacheTimeout,
    };
  }
}

// Singleton instance
let featureFlagService: FeatureFlagService | null = null;

/**
 * Get the feature flag service instance
 */
export function getFeatureFlagService(config?: Partial<FeatureFlagConfig>): FeatureFlagService {
  if (!featureFlagService) {
    featureFlagService = new FeatureFlagService(config);
  }
  return featureFlagService;
}

/**
 * Initialize feature flags with default configuration
 */
export function initializeFeatureFlags(flags: FeatureFlag[], segments: UserSegment[] = []): void {
  const service = getFeatureFlagService();
  service.setFlags(flags);
  service.setSegments(segments);
}

export { FeatureFlagService };
export default getFeatureFlagService;
