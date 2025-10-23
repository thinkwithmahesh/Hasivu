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
    maxAge: number;
    warningAge: number;
    autoRotate: boolean;
    rotationInterval: number;
}
export declare class ApiKeyRotationService {
    private static instance;
    private rotationPolicies;
    private constructor();
    static getInstance(): ApiKeyRotationService;
    generateApiKey(): string;
    hashApiKey(apiKey: string): string;
    createApiKey(userId: string, name: string, policyType?: string, permissions?: string[]): Promise<{
        key: string;
        id: string;
    }>;
    rotateApiKey(keyId: string, reason?: string): Promise<{
        key: string;
        id: string;
    }>;
    shouldRotateKey(apiKey: ApiKey, policyType?: string): boolean;
    isKeyExpiringSoon(apiKey: ApiKey, policyType?: string): boolean;
    validateApiKey(providedKey: string): Promise<boolean>;
    revokeApiKey(keyId: string, reason?: string): Promise<void>;
    getExpiringKeys(policyType?: string): Promise<ApiKey[]>;
    runAutoRotation(): Promise<void>;
    sendRotationWarnings(): Promise<void>;
    getRotationStats(): Promise<{
        totalKeys: number;
        activeKeys: number;
        expiredKeys: number;
        expiringSoon: number;
        averageRotationCount: number;
    }>;
    private determineKeyPolicyType;
    setRotationPolicy(name: string, policy: RotationPolicy): void;
    getRotationPolicy(name: string): RotationPolicy | undefined;
}
export declare const apiKeyRotationService: ApiKeyRotationService;
export type { ApiKey, RotationPolicy };
//# sourceMappingURL=api-key-rotation.service.d.ts.map