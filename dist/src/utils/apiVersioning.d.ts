import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/api.types';
export interface ApiVersionInfo {
    version: string;
    status: 'current' | 'supported' | 'deprecated' | 'unsupported';
    releaseDate: string;
    deprecationDate?: string;
    sunsetDate?: string;
    replacementVersion?: string;
    features: string[];
    breakingChanges: string[];
    migrationGuide?: string;
    documentation: string;
}
export interface VersionDetectionResult {
    detectedVersion: string;
    requestedVersion?: string;
    isSupported: boolean;
    isDeprecated: boolean;
    deprecationWarning?: string;
    migrationInfo?: MigrationInfo;
}
export interface MigrationInfo {
    fromVersion: string;
    toVersion: string;
    breakingChanges: string[];
    migrationSteps: string[];
    automatedMigration: boolean;
    migrationGuide: string;
    migrationScript?: string;
    testSuite?: string;
    documentation: string;
}
export interface VersionCompatibility {
    clientVersion: string;
    apiVersion: string;
    compatible: boolean;
    warnings: string[];
    requiredChanges: string[];
}
export interface ApiVersioningConfig {
    defaultVersion: string;
    latestVersion: string;
    supportedVersions: string[];
    deprecatedVersions: string[];
    unsupportedVersions: string[];
    versionHeader: string;
    pathPrefix: string;
    enableDeprecationWarnings: boolean;
    enableMigrationHints: boolean;
    strictVersioning: boolean;
}
export declare class ApiVersionManager {
    private static instance;
    private supportedVersions;
    private logger;
    private config;
    private constructor();
    static getInstance(): ApiVersionManager;
    private initializeSupportedVersions;
    detectVersion(req: AuthenticatedRequest): VersionDetectionResult;
    private extractVersionFromPath;
    private extractVersionFromAcceptHeader;
    private generateDeprecationWarning;
    private generateMigrationInfo;
    private getBreakingChangesBetweenVersions;
    private getMigrationSteps;
    isEndpointCompatible(endpoint: string, version: string): boolean;
    private isVersionCompatible;
    getSupportedVersions(): ApiVersionInfo[];
    getVersionInfo(version: string): ApiVersionInfo | null;
    updateConfig(newConfig: Partial<ApiVersioningConfig>): void;
    addVersion(versionInfo: ApiVersionInfo): void;
    removeVersion(version: string): boolean;
    getCompatibilityMatrix(clientVersion: string): VersionCompatibility[];
}
export declare function apiVersioningMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void | Response;
export declare function endpointCompatibilityMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void;
export declare function compareApiVersions(version1: string, version2: string): number;
export declare function isVersionGTE(version: string, target: string): boolean;
export declare function getLatestVersion(versions: string[]): string;
export declare function isValidVersionFormat(version: string): boolean;
export declare function normalizeVersion(version: string): string;
export declare function getMajorVersion(version: string): string;
export declare function generateVersionedPath(basePath: string, version: string): string;
export declare function createDeprecationNotice(version: string, sunsetDate?: string, replacementVersion?: string): string;
export declare function parseVersionFromRequest(req: Request): {
    pathVersion?: string;
    headerVersion?: string;
    acceptVersion?: string;
};
export declare class VersionLifecycleManager {
    private static instance;
    private logger;
    private constructor();
    static getInstance(): VersionLifecycleManager;
    scheduleDeprecation(version: string, deprecationDate: Date, sunsetDate: Date, replacementVersion: string): void;
    sunsetVersion(version: string): void;
    getVersionUsageAnalytics(): Promise<{
        [version: string]: {
            requestCount: number;
            uniqueClients: number;
            errorRate: number;
            lastUsed: string;
        };
    }>;
}
declare module 'express' {
    interface Request {
        apiVersion?: string;
        versionInfo?: VersionDetectionResult;
    }
}
export declare class VersionError extends Error {
    readonly code: string;
    readonly version: string;
    readonly supportedVersions: string[];
    constructor(message: string, code: string, version: string, supportedVersions?: string[]);
}
export declare class DeprecationError extends Error {
    readonly version: string;
    readonly sunsetDate?: string;
    readonly replacementVersion?: string;
    constructor(message: string, version: string, sunsetDate?: string, replacementVersion?: string);
}
export declare const defaultVersioningConfig: ApiVersioningConfig;
export declare function initializeApiVersioning(config?: Partial<ApiVersioningConfig>): ApiVersionManager;
export declare const apiVersionManager: ApiVersionManager;
export declare const versionLifecycleManager: VersionLifecycleManager;
declare const _default: {
    ApiVersionManager: typeof ApiVersionManager;
    VersionLifecycleManager: typeof VersionLifecycleManager;
    apiVersioningMiddleware: typeof apiVersioningMiddleware;
    endpointCompatibilityMiddleware: typeof endpointCompatibilityMiddleware;
    compareApiVersions: typeof compareApiVersions;
    isVersionGTE: typeof isVersionGTE;
    getLatestVersion: typeof getLatestVersion;
    isValidVersionFormat: typeof isValidVersionFormat;
    normalizeVersion: typeof normalizeVersion;
    getMajorVersion: typeof getMajorVersion;
    generateVersionedPath: typeof generateVersionedPath;
    createDeprecationNotice: typeof createDeprecationNotice;
    parseVersionFromRequest: typeof parseVersionFromRequest;
    initializeApiVersioning: typeof initializeApiVersioning;
    defaultVersioningConfig: ApiVersioningConfig;
    VersionError: typeof VersionError;
    DeprecationError: typeof DeprecationError;
};
export default _default;
//# sourceMappingURL=apiVersioning.d.ts.map