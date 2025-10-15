# Security Enhancement Action Plan

**Date**: October 12, 2025
**Priority**: P2 (High - Within 7 Days)
**Focus**: Secrets Management Enhancement

---

## Issue Summary

**Current State**: Environment configuration uses weak fallback defaults for critical secrets.

**Risk**: If environment variables are not properly set, the application will use weak default secrets, creating a significant security vulnerability.

**Impact**: HIGH - Affects JWT token security, potentially compromising all authentication.

---

## Enhancement 1: Remove Weak Fallback Defaults

### File: `/src/config/environment.ts`

### Current Implementation (VULNERABLE):

```typescript
// Lines 78-79
JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',  // ⚠️ WEAK DEFAULT
JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',  // ⚠️ WEAK DEFAULT
```

### Proposed Implementation (SECURE):

```typescript
JWT_SECRET: (() => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is required');
  }
  if (secret.length < 32) {
    throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters long');
  }
  return secret;
})(),

JWT_REFRESH_SECRET: (() => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('CRITICAL: JWT_REFRESH_SECRET environment variable is required');
  }
  if (secret.length < 32) {
    throw new Error('CRITICAL: JWT_REFRESH_SECRET must be at least 32 characters long');
  }
  return secret;
})(),
```

### Benefits:

1. **Fail Fast**: Application won't start with missing or weak secrets
2. **Early Detection**: Deployment failures will be caught immediately
3. **No Silent Failures**: Prevents production security vulnerabilities
4. **Validation**: Enforces minimum secret strength requirements

---

## Enhancement 2: AWS Secrets Manager Integration

### New File: `/src/config/secrets.service.ts`

```typescript
/**
 * AWS Secrets Manager Integration
 * Centralized secret management for production security
 */
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  CreateSecretCommand,
  RotateSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import { logger } from '../shared/logger.service';

export class SecretsService {
  private static instance: SecretsService;
  private client: SecretsManagerClient;
  private cache: Map<string, { value: string; expiry: number }>;
  private cacheTTL: number = 300000; // 5 minutes

  private constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
    this.cache = new Map();
  }

  public static getInstance(): SecretsService {
    if (!SecretsService.instance) {
      SecretsService.instance = new SecretsService();
    }
    return SecretsService.instance;
  }

  /**
   * Get secret from AWS Secrets Manager with caching
   */
  public async getSecret(secretName: string): Promise<string> {
    try {
      // Check cache first
      const cached = this.cache.get(secretName);
      if (cached && cached.expiry > Date.now()) {
        logger.debug('Secret retrieved from cache', { secretName });
        return cached.value;
      }

      // Fetch from AWS Secrets Manager
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);

      const secretValue = response.SecretString || '';

      // Cache the secret
      this.cache.set(secretName, {
        value: secretValue,
        expiry: Date.now() + this.cacheTTL,
      });

      logger.info('Secret retrieved from AWS Secrets Manager', { secretName });
      return secretValue;
    } catch (error: unknown) {
      logger.error('Failed to retrieve secret', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
        secretName,
      });
      throw new Error(`Failed to retrieve secret: ${secretName}`);
    }
  }

  /**
   * Create a new secret in AWS Secrets Manager
   */
  public async createSecret(
    secretName: string,
    secretValue: string
  ): Promise<void> {
    try {
      const command = new CreateSecretCommand({
        Name: secretName,
        SecretString: secretValue,
      });

      await this.client.send(command);
      logger.info('Secret created successfully', { secretName });
    } catch (error: unknown) {
      logger.error('Failed to create secret', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
        secretName,
      });
      throw error;
    }
  }

  /**
   * Rotate a secret in AWS Secrets Manager
   */
  public async rotateSecret(secretName: string): Promise<void> {
    try {
      const command = new RotateSecretCommand({
        SecretId: secretName,
        RotationRules: {
          AutomaticallyAfterDays: 90, // Rotate every 90 days
        },
      });

      await this.client.send(command);
      logger.info('Secret rotation initiated', { secretName });

      // Clear cache for rotated secret
      this.cache.delete(secretName);
    } catch (error: unknown) {
      logger.error('Failed to rotate secret', undefined, {
        errorMessage: error instanceof Error ? error.message : String(error),
        secretName,
      });
      throw error;
    }
  }

  /**
   * Clear secret cache
   */
  public clearCache(secretName?: string): void {
    if (secretName) {
      this.cache.delete(secretName);
      logger.debug('Secret cache cleared', { secretName });
    } else {
      this.cache.clear();
      logger.debug('All secret cache cleared');
    }
  }

  /**
   * Validate secret strength
   */
  public validateSecretStrength(secret: string): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (secret.length < 32) {
      issues.push('Secret must be at least 32 characters long');
    }

    if (!/[A-Z]/.test(secret)) {
      issues.push('Secret should contain uppercase letters');
    }

    if (!/[a-z]/.test(secret)) {
      issues.push('Secret should contain lowercase letters');
    }

    if (!/[0-9]/.test(secret)) {
      issues.push('Secret should contain numbers');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(secret)) {
      issues.push('Secret should contain special characters');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

export const secretsService = SecretsService.getInstance();
```

---

## Enhancement 3: Environment Validation Enhancement

### File: `/src/config/environment.ts` (Update `validate` method)

```typescript
public validate(): {
  isValid: boolean;
  missingKeys: string[];
  weakSecrets: string[];
  recommendations: string[];
} {
  const requiredKeys: (keyof EnvironmentConfig)[] = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingKeys: string[] = [];
  const weakSecrets: string[] = [];
  const recommendations: string[] = [];

  requiredKeys.forEach(key => {
    const value = this.config[key];

    if (!value) {
      missingKeys.push(key);
      recommendations.push(`Set ${key} environment variable`);
    } else if (typeof value === 'string') {
      // Check secret strength for sensitive keys
      if (key.includes('SECRET') || key.includes('PASSWORD')) {
        if (value.length < 32) {
          weakSecrets.push(key);
          recommendations.push(`${key} should be at least 32 characters long`);
        }

        // Check for common weak secrets
        const commonWeakSecrets = [
          'your-secret-key',
          'your-refresh-secret-key',
          'secret',
          'password',
          '123456',
          'changeme',
        ];

        if (commonWeakSecrets.some(weak => value.toLowerCase().includes(weak))) {
          weakSecrets.push(key);
          recommendations.push(`${key} uses a common weak secret pattern`);
        }
      }
    }
  });

  // Production-specific checks
  if (this.config.NODE_ENV === 'production') {
    if (!this.config.AWS_REGION || !this.config.AWS_ACCESS_KEY_ID) {
      recommendations.push('AWS credentials should be configured for production');
    }

    if (!this.config.REDIS_URL && !this.config.REDIS_PASSWORD) {
      recommendations.push('Redis should use authentication in production');
    }
  }

  return {
    isValid: missingKeys.length === 0 && weakSecrets.length === 0,
    missingKeys,
    weakSecrets,
    recommendations,
  };
}
```

---

## Enhancement 4: Startup Validation Script

### New File: `/src/scripts/validate-secrets.ts`

```typescript
/**
 * Secrets Validation Script
 * Run during application startup to validate all secrets
 */
import { env } from '../config/environment';
import { secretsService } from '../config/secrets.service';
import { logger } from '../shared/logger.service';

export async function validateSecrets(): Promise<void> {
  logger.info('Starting secrets validation...');

  // Validate environment configuration
  const envValidation = env.validate();

  if (!envValidation.isValid) {
    logger.error('Environment validation failed', undefined, {
      missingKeys: envValidation.missingKeys,
      weakSecrets: envValidation.weakSecrets,
      recommendations: envValidation.recommendations,
    });

    throw new Error(
      `Environment validation failed:\n` +
        `Missing: ${envValidation.missingKeys.join(', ')}\n` +
        `Weak: ${envValidation.weakSecrets.join(', ')}\n` +
        `Recommendations:\n${envValidation.recommendations.map(r => `  - ${r}`).join('\n')}`
    );
  }

  // Validate secret strength
  const jwtSecret = env.get('JWT_SECRET');
  const jwtRefreshSecret = env.get('JWT_REFRESH_SECRET');

  const jwtSecretValidation = secretsService.validateSecretStrength(jwtSecret);
  const jwtRefreshSecretValidation =
    secretsService.validateSecretStrength(jwtRefreshSecret);

  if (!jwtSecretValidation.isValid) {
    logger.warn('JWT_SECRET strength validation failed', {
      issues: jwtSecretValidation.issues,
    });
  }

  if (!jwtRefreshSecretValidation.isValid) {
    logger.warn('JWT_REFRESH_SECRET strength validation failed', {
      issues: jwtRefreshSecretValidation.issues,
    });
  }

  // Production-specific validations
  if (env.isProduction()) {
    logger.info('Running production-specific secret validations...');

    // Validate AWS Secrets Manager connectivity
    try {
      await secretsService.getSecret('hasivu/jwt/secret');
      logger.info('AWS Secrets Manager connectivity verified');
    } catch (error) {
      logger.warn(
        'AWS Secrets Manager not available, using environment variables'
      );
    }
  }

  logger.info('Secrets validation completed successfully');
}

// Run validation if executed directly
if (require.main === module) {
  validateSecrets()
    .then(() => {
      logger.info('Secret validation passed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Secret validation failed', undefined, {
        errorMessage: error.message,
      });
      process.exit(1);
    });
}
```

---

## Enhancement 5: AWS Secrets Manager Setup Script

### New File: `/scripts/setup-secrets.sh`

```bash
#!/bin/bash

# AWS Secrets Manager Setup Script
# Creates and configures secrets for HASIVU platform

set -e

echo "HASIVU Platform - AWS Secrets Manager Setup"
echo "============================================"

# Check for required environment variables
if [ -z "$AWS_REGION" ]; then
  echo "Error: AWS_REGION environment variable is required"
  exit 1
fi

if [ -z "$ENVIRONMENT" ]; then
  echo "Error: ENVIRONMENT environment variable is required (dev, staging, production)"
  exit 1
fi

# Generate strong secrets
echo "Generating strong secrets..."
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH_SECRET=$(openssl rand -base64 48)
API_KEY=$(openssl rand -base64 32)

# Create secrets in AWS Secrets Manager
echo "Creating secrets in AWS Secrets Manager..."

aws secretsmanager create-secret \
  --name "hasivu/${ENVIRONMENT}/jwt/secret" \
  --description "JWT signing secret for ${ENVIRONMENT}" \
  --secret-string "${JWT_SECRET}" \
  --region "${AWS_REGION}"

aws secretsmanager create-secret \
  --name "hasivu/${ENVIRONMENT}/jwt/refresh-secret" \
  --description "JWT refresh token secret for ${ENVIRONMENT}" \
  --secret-string "${JWT_REFRESH_SECRET}" \
  --region "${AWS_REGION}"

aws secretsmanager create-secret \
  --name "hasivu/${ENVIRONMENT}/api/key" \
  --description "API key for ${ENVIRONMENT}" \
  --secret-string "${API_KEY}" \
  --region "${AWS_REGION}"

# Configure automatic rotation
echo "Configuring automatic rotation..."

aws secretsmanager rotate-secret \
  --secret-id "hasivu/${ENVIRONMENT}/jwt/secret" \
  --rotation-rules AutomaticallyAfterDays=90 \
  --region "${AWS_REGION}"

aws secretsmanager rotate-secret \
  --secret-id "hasivu/${ENVIRONMENT}/jwt/refresh-secret" \
  --rotation-rules AutomaticallyAfterDays=90 \
  --region "${AWS_REGION}"

echo "Secrets setup completed successfully!"
echo ""
echo "Secrets created:"
echo "  - hasivu/${ENVIRONMENT}/jwt/secret"
echo "  - hasivu/${ENVIRONMENT}/jwt/refresh-secret"
echo "  - hasivu/${ENVIRONMENT}/api/key"
echo ""
echo "Rotation configured: Every 90 days"
echo ""
echo "To use these secrets, update your environment configuration:"
echo "  export JWT_SECRET=\$(aws secretsmanager get-secret-value --secret-id hasivu/${ENVIRONMENT}/jwt/secret --query SecretString --output text)"
```

---

## Implementation Checklist

### Phase 1: Development Environment (Day 1-2)

- [ ] Create `secrets.service.ts` with AWS Secrets Manager integration
- [ ] Update `environment.ts` to remove weak fallback defaults
- [ ] Enhance `validate()` method with secret strength checks
- [ ] Create `validate-secrets.ts` startup script
- [ ] Add secret validation to application startup sequence
- [ ] Test with missing environment variables (should fail fast)
- [ ] Test with weak secrets (should fail validation)
- [ ] Test with strong secrets (should pass)

### Phase 2: AWS Setup (Day 3-4)

- [ ] Create `setup-secrets.sh` script
- [ ] Generate strong secrets for all environments (dev, staging, production)
- [ ] Create secrets in AWS Secrets Manager
- [ ] Configure IAM roles for Lambda functions to access secrets
- [ ] Set up CloudWatch alarms for secret access failures
- [ ] Configure automatic rotation (90-day cycle)
- [ ] Test secret retrieval from Lambda functions
- [ ] Verify caching mechanism works correctly

### Phase 3: Integration & Testing (Day 5-6)

- [ ] Update deployment scripts to use AWS Secrets Manager
- [ ] Update Lambda environment variables to reference secrets
- [ ] Test authentication with new secret management
- [ ] Test secret rotation mechanism
- [ ] Verify cache invalidation on rotation
- [ ] Test failure scenarios (secrets not found, AWS Secrets Manager unavailable)
- [ ] Update monitoring dashboards to track secret usage
- [ ] Document secret management procedures

### Phase 4: Documentation & Training (Day 7)

- [ ] Update README with secret management instructions
- [ ] Create runbook for secret rotation procedures
- [ ] Document emergency secret rotation process
- [ ] Create training materials for team
- [ ] Update deployment documentation
- [ ] Review with security team
- [ ] Final approval and sign-off

---

## Testing Strategy

### Unit Tests

```typescript
// tests/config/secrets.service.test.ts

describe('SecretsService', () => {
  describe('validateSecretStrength', () => {
    it('should reject secrets shorter than 32 characters', () => {
      const result = secretsService.validateSecretStrength('short');
      expect(result.isValid).toBe(false);
      expect(result.issues).toContain(
        'Secret must be at least 32 characters long'
      );
    });

    it('should accept strong secrets', () => {
      const strongSecret = 'Abcd1234!@#$Efgh5678%^&*Ijkl9012()[]';
      const result = secretsService.validateSecretStrength(strongSecret);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect missing character types', () => {
      const weakSecret = 'abcdefghijklmnopqrstuvwxyz123456';
      const result = secretsService.validateSecretStrength(weakSecret);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('getSecret', () => {
    it('should retrieve secret from AWS Secrets Manager', async () => {
      const secret = await secretsService.getSecret('test/secret');
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should cache secrets for performance', async () => {
      const secret1 = await secretsService.getSecret('test/secret');
      const secret2 = await secretsService.getSecret('test/secret');
      expect(secret1).toBe(secret2);
    });

    it('should handle missing secrets gracefully', async () => {
      await expect(
        secretsService.getSecret('nonexistent/secret')
      ).rejects.toThrow('Failed to retrieve secret');
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/auth-with-secrets.test.ts

describe('Authentication with Secrets Manager', () => {
  it('should authenticate with secrets from AWS', async () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Test123!@#',
    };

    const result = await authService.authenticate(credentials);

    expect(result.success).toBe(true);
    expect(result.tokens.accessToken).toBeDefined();
    expect(result.tokens.refreshToken).toBeDefined();
  });

  it('should fail fast with missing JWT secret', () => {
    delete process.env.JWT_SECRET;

    expect(() => require('../config/environment')).toThrow(
      'CRITICAL: JWT_SECRET environment variable is required'
    );
  });
});
```

---

## Rollback Plan

If issues arise during deployment:

1. **Immediate Rollback**: Revert to previous environment.ts with fallback defaults
2. **Disable AWS Secrets Manager**: Use environment variables directly
3. **Clear Secret Cache**: Run `secretsService.clearCache()`
4. **Verify Authentication**: Test login functionality
5. **Monitor Logs**: Check for authentication errors
6. **Notify Team**: Alert all stakeholders of rollback
7. **Root Cause Analysis**: Identify and fix the issue
8. **Gradual Re-deployment**: Test in dev → staging → production

---

## Success Metrics

- **Deployment Success**: Application starts successfully with strong secrets
- **No Fallback Usage**: Zero instances of fallback secrets in production
- **Secret Strength**: All secrets meet 32-character minimum with complexity requirements
- **Rotation Compliance**: Secrets rotate automatically every 90 days
- **Cache Hit Rate**: >95% of secret retrievals served from cache
- **Authentication Success**: No degradation in authentication performance
- **Zero Vulnerabilities**: No weak secrets detected in production

---

## Cost Estimate

### AWS Secrets Manager Pricing (us-east-1)

- **Secret Storage**: $0.40 per secret per month
- **API Calls**: $0.05 per 10,000 API calls
- **Rotation**: Included in storage cost

### Estimated Monthly Cost:

- 3 secrets × $0.40 = $1.20/month
- ~100,000 API calls/month × $0.05/10,000 = $0.50/month
- **Total**: ~$1.70/month per environment

**Annual Cost**: ~$20.40 per environment
**Total (3 environments)**: ~$61.20/year

### ROI Analysis:

- **Security Risk Reduction**: Prevents potential breach costing $100K+
- **Compliance**: Meets industry security standards
- **Automation**: Saves ~4 hours/month of manual secret rotation
- **Peace of Mind**: Priceless

---

**Implementation Timeline**: 7 Days
**Priority**: HIGH (P2)
**Estimated Effort**: 24-32 hours
**Risk**: LOW (with proper testing)
**Business Impact**: HIGH (security posture improvement)

---

**Next Steps**:

1. Review and approve this enhancement plan
2. Assign implementation team
3. Create AWS Secrets Manager resources
4. Begin Phase 1 implementation
5. Schedule team training session

---

**Prepared by**: Agent 3 - Security Hardener
**Date**: October 12, 2025
**Status**: READY FOR IMPLEMENTATION
