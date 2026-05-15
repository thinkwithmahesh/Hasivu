/**
 * HASIVU Platform - API Key Rotation Service
 * Implements automated API key rotation for enhanced security
 */
import crypto from 'crypto';
import { logger } from '../shared/logger.service';
import { config } from '../config/environment';
import { prisma } from '../database/DatabaseManager';

interface ApiKey {
  id: string;
  key: string;
  userId: string;
  name: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  rotationCount: number;
  isActive: boolean;
  permissions: string[];
}

interface RotationPolicy {
  maxAge: number; // Maximum age in days before forced rotation
  warningAge: number; // Days before expiration to send warning
  autoRotate: boolean; // Enable automatic rotation
  rotationInterval: number; // Days between automatic rotations
}

/**
 * API Key Rotation Service
 */
export class ApiKeyRotationService {
  private static instance: ApiKeyRotationService;
  private rotationPolicies: Map<string, RotationPolicy> = new Map();

  private constructor() {
    // Default rotation policy
    this.rotationPolicies.set('default', {
      maxAge: 90, // 90 days
      warningAge: 80, // 10 days before expiration
      autoRotate: true,
      rotationInterval: 90,
    });

    // Strict policy for payment keys
    this.rotationPolicies.set('payment', {
      maxAge: 30,
      warningAge: 25,
      autoRotate: true,
      rotationInterval: 30,
    });

    // Moderate policy for internal services
    this.rotationPolicies.set('service', {
      maxAge: 180,
      warningAge: 170,
      autoRotate: true,
      rotationInterval: 180,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): ApiKeyRotationService {
    if (!ApiKeyRotationService.instance) {
      ApiKeyRotationService.instance = new ApiKeyRotationService();
    }
    return ApiKeyRotationService.instance;
  }

  /**
   * Generate a secure API key
   */
  public generateApiKey(): string {
    const prefix = 'hsk'; // HASIVU Secret Key
    const randomBytes = crypto.randomBytes(32).toString('base64url');
    const timestamp = Date.now().toString(36);
    return `${prefix}_${timestamp}_${randomBytes}`;
  }

  /**
   * Hash API key for storage
   */
  public hashApiKey(apiKey: string): string {
    return crypto
      .createHash('sha256')
      .update(apiKey + (config.jwt?.secret || 'default-secret'))
      .digest('hex');
  }

  /**
   * Create a new API key
   */
  public async createApiKey(
    userId: string,
    name: string,
    policyType: string = 'default',
    permissions: string[] = []
  ): Promise<{ key: string; id: string }> {
    try {
      const key = this.generateApiKey();
      const hashedKey = this.hashApiKey(key);
      const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default')!;

      const apiKey: ApiKey = {
        id: crypto.randomUUID(),
        key: hashedKey,
        userId,
        name,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + policy.maxAge * 24 * 60 * 60 * 1000),
        rotationCount: 0,
        isActive: true,
        permissions,
      };

      await this.saveApiKey(apiKey, policyType);

      logger.info('API key created', {
        userId,
        keyId: apiKey.id,
        name,
        expiresAt: apiKey.expiresAt,
        policyType,
      });

      return { key, id: apiKey.id };
    } catch (error: unknown) {
      logger.error(
        'Error creating API key',
        error instanceof Error ? error : new Error(String(error)),
        { userId, name }
      );
      throw error;
    }
  }

  /**
   * Rotate an existing API key
   */
  public async rotateApiKey(
    keyId: string,
    reason: string = 'scheduled'
  ): Promise<{ key: string; id: string }> {
    try {
      const existingKey = await this.getApiKeyById(keyId);
      if (!existingKey || !existingKey.isActive) {
        throw new Error('API key not found or inactive');
      }

      const newKey = this.generateApiKey();
      const hashedKey = this.hashApiKey(newKey);
      const policyType = this.determineKeyPolicyType(existingKey);
      const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default')!;

      await (prisma as any).apiKeyCredential.update({
        where: { id: keyId },
        data: {
          keyHash: hashedKey,
          rotationCount: existingKey.rotationCount + 1,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + policy.maxAge * 24 * 60 * 60 * 1000),
          lastUsedAt: null,
          metadata: JSON.stringify({
            rotatedAt: new Date().toISOString(),
            reason,
          }),
        },
      });

      logger.info('API key rotated', {
        keyId,
        reason,
        timestamp: new Date().toISOString(),
      });

      return { key: newKey, id: keyId };
    } catch (error: unknown) {
      logger.error(
        'Error rotating API key',
        error instanceof Error ? error : new Error(String(error)),
        { keyId, reason }
      );
      throw error;
    }
  }

  /**
   * Check if API key needs rotation
   */
  public shouldRotateKey(apiKey: ApiKey, policyType: string = 'default'): boolean {
    const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default')!;
    const keyAge = Date.now() - apiKey.createdAt.getTime();
    const maxAgeMs = policy.maxAge * 24 * 60 * 60 * 1000;

    return keyAge >= maxAgeMs;
  }

  /**
   * Check if API key is expiring soon
   */
  public isKeyExpiringSoon(apiKey: ApiKey, policyType: string = 'default'): boolean {
    const policy = this.rotationPolicies.get(policyType) || this.rotationPolicies.get('default')!;
    const timeUntilExpiry = apiKey.expiresAt.getTime() - Date.now();
    const warningMs = (policy.maxAge - policy.warningAge) * 24 * 60 * 60 * 1000;

    return timeUntilExpiry <= warningMs && timeUntilExpiry > 0;
  }

  /**
   * Validate API key
   */
  public async validateApiKey(providedKey: string): Promise<boolean> {
    try {
      const hashedKey = this.hashApiKey(providedKey);

      const apiKey = await (prisma as any).apiKeyCredential.findUnique({
        where: { keyHash: hashedKey },
      });

      if (!apiKey || !apiKey.isActive || apiKey.revokedAt || apiKey.expiresAt <= new Date()) {
        return false;
      }

      await (prisma as any).apiKeyCredential.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
      return true;
    } catch (error: unknown) {
      logger.error(
        'Error validating API key',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Revoke API key
   */
  public async revokeApiKey(keyId: string, reason: string = 'user_requested'): Promise<void> {
    try {
      await (prisma as any).apiKeyCredential.update({
        where: { id: keyId },
        data: {
          isActive: false,
          revokedAt: new Date(),
          metadata: JSON.stringify({ revokedReason: reason }),
        },
      });

      logger.info('API key revoked', {
        keyId,
        reason,
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      logger.error(
        'Error revoking API key',
        error instanceof Error ? error : new Error(String(error)),
        { keyId, reason }
      );
      throw error;
    }
  }

  /**
   * Get keys expiring soon
   */
  public async getExpiringKeys(policyType?: string): Promise<ApiKey[]> {
    try {
      const allKeys = await this.getAllActiveApiKeys();

      return allKeys.filter(key => {
        const keyPolicyType = this.determineKeyPolicyType(key);
        if (policyType && keyPolicyType !== policyType) {
          return false;
        }
        return this.isKeyExpiringSoon(key, keyPolicyType);
      });
    } catch (error: unknown) {
      logger.error(
        'Error getting expiring keys',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  /**
   * Automatic rotation job
   */
  public async runAutoRotation(): Promise<void> {
    try {
      logger.info('Starting automatic API key rotation job');

      const keysToRotate = await this.getKeysNeedingRotation();

      for (const key of keysToRotate) {
        const policyType = this.determineKeyPolicyType(key);
        const policy = this.rotationPolicies.get(policyType)!;

        if (policy.autoRotate) {
          await this.rotateApiKey(key.id, 'auto_rotation');

          // Notify user about rotation
          // await this.notifyUserAboutRotation(key.userId, key.id);
        }
      }

      logger.info('Automatic API key rotation completed', {
        keysRotated: keysToRotate.length,
      });
    } catch (error: unknown) {
      logger.error(
        'Error in automatic rotation job',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Send rotation warnings
   */
  public async sendRotationWarnings(): Promise<void> {
    try {
      const expiringKeys = await this.getExpiringKeys();

      for (const key of expiringKeys) {
        logger.warn('API key expiring soon', {
          keyId: key.id,
          userId: key.userId,
          expiresAt: key.expiresAt,
          daysRemaining: Math.ceil((key.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
        });

        // Send notification to user
        // await this.notifyUserAboutExpiration(key.userId, key.id, key.expiresAt);
      }
    } catch (error: unknown) {
      logger.error(
        'Error sending rotation warnings',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get rotation statistics
   */
  public async getRotationStats(): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    expiringSoon: number;
    averageRotationCount: number;
  }> {
    try {
      const allKeys = await this.getAllApiKeys();
      const now = new Date();
      const activeKeys = allKeys.filter(key => key.isActive && key.expiresAt > now);
      const expiredKeys = allKeys.filter(key => key.expiresAt <= now);
      const expiringSoon = activeKeys.filter(key =>
        this.isKeyExpiringSoon(key, this.determineKeyPolicyType(key))
      );
      const averageRotationCount =
        allKeys.length > 0
          ? allKeys.reduce((sum, key) => sum + key.rotationCount, 0) / allKeys.length
          : 0;

      return {
        totalKeys: allKeys.length,
        activeKeys: activeKeys.length,
        expiredKeys: expiredKeys.length,
        expiringSoon: expiringSoon.length,
        averageRotationCount: Math.round(averageRotationCount * 100) / 100,
      };
    } catch (error: unknown) {
      logger.error(
        'Error getting rotation stats',
        error instanceof Error ? error : new Error(String(error))
      );
      return {
        totalKeys: 0,
        activeKeys: 0,
        expiredKeys: 0,
        expiringSoon: 0,
        averageRotationCount: 0,
      };
    }
  }

  /**
   * Determine policy type for a key
   */
  private determineKeyPolicyType(key: ApiKey): string {
    if (key.permissions.some(p => p.includes('payment'))) {
      return 'payment';
    }
    if (key.permissions.some(p => p.includes('service'))) {
      return 'service';
    }
    return 'default';
  }

  /**
   * Set custom rotation policy
   */
  public setRotationPolicy(name: string, policy: RotationPolicy): void {
    this.rotationPolicies.set(name, policy);
    logger.info('Rotation policy updated', { name, policy });
  }

  /**
   * Get rotation policy
   */
  public getRotationPolicy(name: string): RotationPolicy | undefined {
    return this.rotationPolicies.get(name);
  }

  private async saveApiKey(apiKey: ApiKey, policyType: string): Promise<void> {
    await (prisma as any).apiKeyCredential.create({
      data: {
        id: apiKey.id,
        keyHash: apiKey.key,
        userId: apiKey.userId,
        name: apiKey.name,
        policyType,
        permissions: JSON.stringify(apiKey.permissions),
        rotationCount: apiKey.rotationCount,
        isActive: apiKey.isActive,
        expiresAt: apiKey.expiresAt,
        lastUsedAt: apiKey.lastUsedAt,
      },
    });
  }

  private async getApiKeyById(keyId: string): Promise<ApiKey | null> {
    const row = await (prisma as any).apiKeyCredential.findUnique({
      where: { id: keyId },
    });
    return row ? this.mapApiKey(row) : null;
  }

  private async getAllActiveApiKeys(): Promise<ApiKey[]> {
    const rows = await (prisma as any).apiKeyCredential.findMany({
      where: {
        isActive: true,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    return rows.map((row: any) => this.mapApiKey(row));
  }

  private async getAllApiKeys(): Promise<ApiKey[]> {
    const rows = await (prisma as any).apiKeyCredential.findMany();
    return rows.map((row: any) => this.mapApiKey(row));
  }

  private async getKeysNeedingRotation(): Promise<ApiKey[]> {
    const allKeys = await this.getAllActiveApiKeys();
    return allKeys.filter(key => this.shouldRotateKey(key, this.determineKeyPolicyType(key)));
  }

  private mapApiKey(row: any): ApiKey {
    return {
      id: row.id,
      key: row.keyHash,
      userId: row.userId,
      name: row.name,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      lastUsedAt: row.lastUsedAt || undefined,
      rotationCount: row.rotationCount,
      isActive: row.isActive,
      permissions: this.parseJsonArray(row.permissions),
    };
  }

  private parseJsonArray(value: string | null | undefined): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}

// Export singleton instance
export const apiKeyRotationService = ApiKeyRotationService.getInstance();

// Export types
export type { ApiKey, RotationPolicy };
