"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.versionLifecycleManager = exports.apiVersionManager = exports.initializeApiVersioning = exports.defaultVersioningConfig = exports.DeprecationError = exports.VersionError = exports.VersionLifecycleManager = exports.parseVersionFromRequest = exports.createDeprecationNotice = exports.generateVersionedPath = exports.getMajorVersion = exports.normalizeVersion = exports.isValidVersionFormat = exports.getLatestVersion = exports.isVersionGTE = exports.compareApiVersions = exports.endpointCompatibilityMiddleware = exports.apiVersioningMiddleware = exports.ApiVersionManager = void 0;
const logger_1 = require("../shared/utils/logger");
const semver = __importStar(require("semver"));
class ApiVersionManager {
    static instance;
    supportedVersions;
    logger;
    config;
    constructor() {
        this.logger = logger_1.logger;
        this.supportedVersions = new Map();
        this.config = {
            defaultVersion: 'v1',
            latestVersion: 'v1.2',
            supportedVersions: ['v1', 'v1.1', 'v1.2'],
            deprecatedVersions: ['v1.0'],
            unsupportedVersions: ['v0.9', 'v0.8'],
            versionHeader: 'api-version',
            pathPrefix: '/api/',
            enableDeprecationWarnings: true,
            enableMigrationHints: true,
            strictVersioning: false,
        };
        this.initializeSupportedVersions();
    }
    static getInstance() {
        if (!ApiVersionManager.instance) {
            ApiVersionManager.instance = new ApiVersionManager();
        }
        return ApiVersionManager.instance;
    }
    initializeSupportedVersions() {
        this.supportedVersions.set('v1.2', {
            version: 'v1.2',
            status: 'current',
            releaseDate: '2024-06-01',
            features: [
                'Enhanced menu management',
                'Advanced payment processing',
                'Real-time notifications',
                'RFID integration',
                'Performance optimizations'
            ],
            breakingChanges: [
                'Payment webhook signature validation required',
                'Menu item structure updated with nutrition info',
                'Authentication token format changed'
            ],
            documentation: '/docs/api/v1.2'
        });
        this.supportedVersions.set('v1.1', {
            version: 'v1.1',
            status: 'supported',
            releaseDate: '2024-03-01',
            features: [
                'Basic menu management',
                'Payment processing',
                'Email notifications',
                'User management'
            ],
            breakingChanges: [
                'Order status enum values changed',
                'User role hierarchy updated'
            ],
            documentation: '/docs/api/v1.1'
        });
        this.supportedVersions.set('v1', {
            version: 'v1',
            status: 'supported',
            releaseDate: '2024-01-01',
            features: [
                'Basic API functionality',
                'User authentication',
                'Order management'
            ],
            breakingChanges: [],
            documentation: '/docs/api/v1'
        });
        this.supportedVersions.set('v1.0', {
            version: 'v1.0',
            status: 'deprecated',
            releaseDate: '2023-10-01',
            deprecationDate: '2024-01-01',
            sunsetDate: '2024-12-31',
            replacementVersion: 'v1.2',
            features: [
                'Legacy API functionality'
            ],
            breakingChanges: [
                'Complete API redesign',
                'Authentication system overhaul'
            ],
            migrationGuide: '/docs/migration/v1.0-to-v1.2',
            documentation: '/docs/api/v1.0'
        });
    }
    detectVersion(req) {
        let detectedVersion;
        let requestedVersion;
        const pathVersion = this.extractVersionFromPath(req.path);
        if (pathVersion && this.supportedVersions.has(pathVersion)) {
            detectedVersion = pathVersion;
            requestedVersion = pathVersion;
        }
        else {
            const versionHeaderValue = req.headers[this.config.versionHeader];
            const fallbackVersionValue = req.headers['x-api-version'];
            const headerVersion = (Array.isArray(versionHeaderValue) ? versionHeaderValue[0] : versionHeaderValue) ||
                (Array.isArray(fallbackVersionValue) ? fallbackVersionValue[0] : fallbackVersionValue);
            if (headerVersion && this.supportedVersions.has(headerVersion)) {
                detectedVersion = headerVersion;
                requestedVersion = headerVersion;
            }
            else {
                const acceptVersion = this.extractVersionFromAcceptHeader(req.headers.accept);
                if (acceptVersion && this.supportedVersions.has(acceptVersion)) {
                    detectedVersion = acceptVersion;
                    requestedVersion = acceptVersion;
                }
                else {
                    detectedVersion = this.config.defaultVersion;
                }
            }
        }
        const versionInfo = this.supportedVersions.get(detectedVersion);
        const isSupported = versionInfo.status !== 'unsupported';
        const isDeprecated = versionInfo.status === 'deprecated';
        let deprecationWarning;
        let migrationInfo;
        if (isDeprecated && this.config.enableDeprecationWarnings) {
            deprecationWarning = this.generateDeprecationWarning(versionInfo);
            if (this.config.enableMigrationHints && versionInfo.replacementVersion) {
                migrationInfo = this.generateMigrationInfo(detectedVersion, versionInfo.replacementVersion);
            }
        }
        return {
            detectedVersion,
            requestedVersion,
            isSupported,
            isDeprecated,
            deprecationWarning,
            migrationInfo
        };
    }
    extractVersionFromPath(path) {
        const versionMatch = path.match(/\/api\/v(\d+(?:\.\d+)?)/);
        return versionMatch ? `v${versionMatch[1]}` : null;
    }
    extractVersionFromAcceptHeader(acceptHeader = '') {
        const versionMatch = acceptHeader.match(/application\/vnd\.hasivu\.v(\d+(?:\.\d+)?)\+json/);
        return versionMatch ? `v${versionMatch[1]}` : null;
    }
    generateDeprecationWarning(versionInfo) {
        const baseMessage = `API version ${versionInfo.version} is deprecated`;
        if (versionInfo.sunsetDate) {
            const sunsetDate = new Date(versionInfo.sunsetDate);
            const now = new Date();
            const daysUntilSunset = Math.ceil((sunsetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilSunset > 0) {
                return `${baseMessage} and will be discontinued in ${daysUntilSunset} days (${versionInfo.sunsetDate}).`;
            }
            else {
                return `${baseMessage} and should no longer be used.`;
            }
        }
        if (versionInfo.replacementVersion) {
            return `${baseMessage}. Please migrate to ${versionInfo.replacementVersion}.`;
        }
        return `${baseMessage}. Please update to a supported version.`;
    }
    generateMigrationInfo(fromVersion, toVersion) {
        const fromInfo = this.supportedVersions.get(fromVersion);
        const toInfo = this.supportedVersions.get(toVersion);
        if (!fromInfo || !toInfo) {
            throw new Error(`Migration information not available for ${fromVersion} to ${toVersion}`);
        }
        const breakingChanges = this.getBreakingChangesBetweenVersions(fromVersion, toVersion);
        const migrationSteps = this.getMigrationSteps(fromVersion, toVersion);
        return {
            fromVersion,
            toVersion,
            breakingChanges,
            migrationSteps,
            automatedMigration: false,
            migrationGuide: `/docs/migration/${fromVersion}-to-${toVersion}`,
            migrationScript: `/scripts/migrate-${fromVersion}-to-${toVersion}.js`,
            testSuite: `/tests/migration/${fromVersion}-to-${toVersion}.test.js`,
            documentation: `/docs/migration/${fromVersion}-to-${toVersion}.md`
        };
    }
    getBreakingChangesBetweenVersions(fromVersion, toVersion) {
        const breakingChanges = {
            'v1.0-to-v1': [
                'Authentication endpoint moved from /auth to /api/v1/auth',
                'User ID format changed from integer to UUID',
                'Order status values updated'
            ],
            'v1-to-v1.1': [
                'Menu item structure includes nutrition information',
                'Payment webhook requires signature validation',
                'Error response format standardized'
            ],
            'v1.1-to-v1.2': [
                'RFID integration endpoints added',
                'Real-time notification system implemented',
                'Enhanced payment processing with multiple gateways'
            ],
            'v1.0-to-v1.2': [
                'Complete API redesign',
                'Authentication system overhaul with JWT',
                'New endpoint structure and naming conventions',
                'Enhanced error handling and validation',
                'Real-time features and WebSocket support'
            ]
        };
        return breakingChanges[`${fromVersion}-to-${toVersion}`] || [
            'Please refer to the migration guide for detailed breaking changes'
        ];
    }
    getMigrationSteps(fromVersion, toVersion) {
        const migrationSteps = {
            'v1.0-to-v1': [
                'Update authentication endpoints',
                'Convert user IDs to UUID format',
                'Update order status handling',
                'Test all existing integrations'
            ],
            'v1-to-v1.1': [
                'Add nutrition info to menu items',
                'Implement webhook signature validation',
                'Update error response handling',
                'Test payment workflows'
            ],
            'v1.1-to-v1.2': [
                'Integrate RFID endpoints',
                'Implement real-time notifications',
                'Update payment gateway integration',
                'Test new features end-to-end'
            ],
            'v1.0-to-v1.2': [
                'Complete authentication system migration',
                'Update all API endpoints to new structure',
                'Implement new error handling patterns',
                'Add real-time notification support',
                'Comprehensive testing and validation'
            ]
        };
        return migrationSteps[`${fromVersion}-to-${toVersion}`] || [
            'Please refer to the migration guide for detailed steps'
        ];
    }
    isEndpointCompatible(endpoint, version) {
        const versionInfo = this.supportedVersions.get(version);
        if (!versionInfo)
            return false;
        const endpointIntroductions = {
            '/api/rfid': 'v1.2',
            '/api/notifications/realtime': 'v1.2',
            '/api/payments/webhook': 'v1.1',
            '/api/menu/nutrition': 'v1.1',
            '/api/auth/refresh': 'v1',
        };
        const requiredVersion = endpointIntroductions[endpoint];
        if (!requiredVersion)
            return true;
        return this.isVersionCompatible(version, requiredVersion);
    }
    isVersionCompatible(currentVersion, requiredVersion) {
        try {
            const current = currentVersion.replace(/^v/, '');
            const required = requiredVersion.replace(/^v/, '');
            return semver.gte(current, required);
        }
        catch (error) {
            this.logger.warn('Version comparison failed', { currentVersion, requiredVersion, error });
            return false;
        }
    }
    getSupportedVersions() {
        return Array.from(this.supportedVersions.values())
            .filter(version => version.status !== 'unsupported')
            .sort((a, b) => {
            try {
                const aVersion = a.version.replace(/^v/, '');
                const bVersion = b.version.replace(/^v/, '');
                return semver.rcompare(aVersion, bVersion);
            }
            catch {
                return b.version.localeCompare(a.version);
            }
        });
    }
    getVersionInfo(version) {
        return this.supportedVersions.get(version) || null;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('API versioning configuration updated', { config: this.config });
    }
    addVersion(versionInfo) {
        this.supportedVersions.set(versionInfo.version, versionInfo);
        this.logger.info('API version added/updated', { version: versionInfo.version });
    }
    removeVersion(version) {
        const removed = this.supportedVersions.delete(version);
        if (removed) {
            this.logger.info('API version removed', { version });
        }
        return removed;
    }
    getCompatibilityMatrix(clientVersion) {
        return Array.from(this.supportedVersions.keys()).map(apiVersion => {
            const compatible = this.isVersionCompatible(clientVersion, apiVersion);
            const warnings = [];
            const requiredChanges = [];
            if (!compatible) {
                warnings.push(`Client version ${clientVersion} is not compatible with API ${apiVersion}`);
                requiredChanges.push(`Upgrade client to support API ${apiVersion}`);
            }
            const versionInfo = this.supportedVersions.get(apiVersion);
            if (versionInfo.status === 'deprecated') {
                warnings.push(`API version ${apiVersion} is deprecated`);
                if (versionInfo.replacementVersion) {
                    requiredChanges.push(`Migrate to ${versionInfo.replacementVersion}`);
                }
            }
            return {
                clientVersion,
                apiVersion,
                compatible,
                warnings,
                requiredChanges
            };
        });
    }
}
exports.ApiVersionManager = ApiVersionManager;
function apiVersioningMiddleware(req, res, next) {
    const versionManager = ApiVersionManager.getInstance();
    try {
        const versionResult = versionManager.detectVersion(req);
        req.apiVersion = versionResult.detectedVersion;
        req.versionInfo = versionResult;
        if (!versionResult.isSupported) {
            const error = {
                code: 'UNSUPPORTED_API_VERSION',
                message: `API version ${versionResult.detectedVersion} is not supported`,
                timestamp: new Date().toISOString(),
                requestId: req.requestId
            };
            return res.status(400).json({
                success: false,
                error,
                timestamp: new Date().toISOString(),
                version: req.apiVersion || 'unknown',
                supportedVersions: versionManager.getSupportedVersions().map(v => v.version)
            });
        }
        if (versionResult.isDeprecated && versionResult.deprecationWarning) {
            res.set('X-API-Deprecation-Warning', versionResult.deprecationWarning);
            if (versionResult.migrationInfo) {
                res.set('X-API-Migration-Guide', versionResult.migrationInfo.migrationGuide);
            }
        }
        res.set('X-API-Version', versionResult.detectedVersion);
        res.set('X-API-Latest-Version', versionManager.config.latestVersion);
        next();
    }
    catch (error) {
        const loggerInstance = logger_1.logger;
        loggerInstance.error('API versioning middleware error', { error, path: req.path });
        const apiError = {
            code: 'VERSION_DETECTION_ERROR',
            message: 'Failed to detect API version',
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        };
        res.status(500).json({
            success: false,
            error: apiError
        });
    }
}
exports.apiVersioningMiddleware = apiVersioningMiddleware;
function endpointCompatibilityMiddleware(req, res, next) {
    const versionManager = ApiVersionManager.getInstance();
    try {
        const apiVersion = req.apiVersion || versionManager.config.defaultVersion;
        const isCompatible = versionManager.isEndpointCompatible(req.path, apiVersion);
        if (!isCompatible) {
            const error = {
                code: 'ENDPOINT_NOT_COMPATIBLE',
                message: `Endpoint ${req.path} is not available in API version ${apiVersion}`,
                timestamp: new Date().toISOString(),
                requestId: req.requestId,
                details: {
                    endpoint: req.path,
                    version: apiVersion,
                    availableVersions: versionManager.getSupportedVersions()
                        .filter(v => versionManager.isEndpointCompatible(req.path, v.version))
                        .map(v => v.version)
                }
            };
            res.status(404).json({
                success: false,
                error
            });
            return;
        }
        next();
    }
    catch (error) {
        const loggerInstance = logger_1.logger;
        loggerInstance.error('Endpoint compatibility middleware error', { error, path: req.path });
        const apiError = {
            code: 'COMPATIBILITY_CHECK_ERROR',
            message: 'Failed to check endpoint compatibility',
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        };
        res.status(500).json({
            success: false,
            error: apiError
        });
    }
}
exports.endpointCompatibilityMiddleware = endpointCompatibilityMiddleware;
function compareApiVersions(version1, version2) {
    try {
        const v1 = version1.replace(/^v/, '');
        const v2 = version2.replace(/^v/, '');
        return semver.compare(v1, v2);
    }
    catch (error) {
        return version1.localeCompare(version2);
    }
}
exports.compareApiVersions = compareApiVersions;
function isVersionGTE(version, target) {
    try {
        const v = version.replace(/^v/, '');
        const t = target.replace(/^v/, '');
        return semver.gte(v, t);
    }
    catch (error) {
        return version >= target;
    }
}
exports.isVersionGTE = isVersionGTE;
function getLatestVersion(versions) {
    if (versions.length === 0)
        return '';
    try {
        const semverVersions = versions.map(v => v.replace(/^v/, ''));
        const latest = semver.maxSatisfying(semverVersions, '*');
        return latest ? `v${latest}` : versions[versions.length - 1];
    }
    catch (error) {
        return versions.sort().reverse()[0];
    }
}
exports.getLatestVersion = getLatestVersion;
function isValidVersionFormat(version) {
    return /^v\d+(\.\d+)*$/.test(version);
}
exports.isValidVersionFormat = isValidVersionFormat;
function normalizeVersion(version) {
    const normalized = version.toLowerCase().trim();
    return normalized.startsWith('v') ? normalized : `v${normalized}`;
}
exports.normalizeVersion = normalizeVersion;
function getMajorVersion(version) {
    const match = version.match(/^v?(\d+)/);
    return match ? `v${match[1]}` : version;
}
exports.getMajorVersion = getMajorVersion;
function generateVersionedPath(basePath, version) {
    const normalizedVersion = normalizeVersion(version);
    const cleanPath = basePath.replace(/^\/+/, '');
    return `/api/${normalizedVersion}/${cleanPath}`;
}
exports.generateVersionedPath = generateVersionedPath;
function createDeprecationNotice(version, sunsetDate, replacementVersion) {
    let notice = `This API version (${version}) is deprecated`;
    if (sunsetDate) {
        notice += ` and will be discontinued on ${sunsetDate}`;
    }
    if (replacementVersion) {
        notice += `. Please migrate to ${replacementVersion}`;
    }
    return notice + '.';
}
exports.createDeprecationNotice = createDeprecationNotice;
function parseVersionFromRequest(req) {
    const pathVersion = req.path.match(/\/api\/v(\d+(?:\.\d+)?)/)?.[1];
    const headerVersion = (req.headers['api-version'] || req.headers['x-api-version']);
    const acceptVersion = req.headers.accept?.match(/application\/vnd\.hasivu\.v(\d+(?:\.\d+)?)\+json/)?.[1];
    return {
        pathVersion: pathVersion ? `v${pathVersion}` : undefined,
        headerVersion: headerVersion ? normalizeVersion(headerVersion) : undefined,
        acceptVersion: acceptVersion ? `v${acceptVersion}` : undefined
    };
}
exports.parseVersionFromRequest = parseVersionFromRequest;
class VersionLifecycleManager {
    static instance;
    logger;
    constructor() {
        this.logger = logger_1.logger;
    }
    static getInstance() {
        if (!VersionLifecycleManager.instance) {
            VersionLifecycleManager.instance = new VersionLifecycleManager();
        }
        return VersionLifecycleManager.instance;
    }
    scheduleDeprecation(version, deprecationDate, sunsetDate, replacementVersion) {
        const versionManager = ApiVersionManager.getInstance();
        const versionInfo = versionManager.getVersionInfo(version);
        if (!versionInfo) {
            throw new Error(`Version ${version} not found`);
        }
        const updatedInfo = {
            ...versionInfo,
            status: 'deprecated',
            deprecationDate: deprecationDate.toISOString(),
            sunsetDate: sunsetDate.toISOString(),
            replacementVersion
        };
        versionManager.addVersion(updatedInfo);
        this.logger.info('Version deprecation scheduled', {
            version,
            deprecationDate,
            sunsetDate,
            replacementVersion
        });
    }
    sunsetVersion(version) {
        const versionManager = ApiVersionManager.getInstance();
        const versionInfo = versionManager.getVersionInfo(version);
        if (!versionInfo) {
            throw new Error(`Version ${version} not found`);
        }
        if (versionInfo.status !== 'deprecated') {
            throw new Error(`Version ${version} is not deprecated and cannot be sunset`);
        }
        const updatedInfo = {
            ...versionInfo,
            status: 'unsupported'
        };
        versionManager.addVersion(updatedInfo);
        this.logger.info('Version sunset completed', { version });
    }
    async getVersionUsageAnalytics() {
        return {
            'v1': {
                requestCount: 1250,
                uniqueClients: 45,
                errorRate: 0.02,
                lastUsed: new Date().toISOString()
            },
            'v1.1': {
                requestCount: 3400,
                uniqueClients: 120,
                errorRate: 0.015,
                lastUsed: new Date().toISOString()
            },
            'v1.2': {
                requestCount: 5600,
                uniqueClients: 200,
                errorRate: 0.01,
                lastUsed: new Date().toISOString()
            }
        };
    }
}
exports.VersionLifecycleManager = VersionLifecycleManager;
class VersionError extends Error {
    code;
    version;
    supportedVersions;
    constructor(message, code, version, supportedVersions = []) {
        super(message);
        this.name = 'VersionError';
        this.code = code;
        this.version = version;
        this.supportedVersions = supportedVersions;
    }
}
exports.VersionError = VersionError;
class DeprecationError extends Error {
    version;
    sunsetDate;
    replacementVersion;
    constructor(message, version, sunsetDate, replacementVersion) {
        super(message);
        this.name = 'DeprecationError';
        this.version = version;
        this.sunsetDate = sunsetDate;
        this.replacementVersion = replacementVersion;
    }
}
exports.DeprecationError = DeprecationError;
exports.defaultVersioningConfig = {
    defaultVersion: 'v1',
    latestVersion: 'v1.2',
    supportedVersions: ['v1', 'v1.1', 'v1.2'],
    deprecatedVersions: ['v1.0'],
    unsupportedVersions: ['v0.9', 'v0.8'],
    versionHeader: 'api-version',
    pathPrefix: '/api/',
    enableDeprecationWarnings: true,
    enableMigrationHints: true,
    strictVersioning: false,
};
function initializeApiVersioning(config) {
    const manager = ApiVersionManager.getInstance();
    if (config) {
        manager.updateConfig(config);
    }
    return manager;
}
exports.initializeApiVersioning = initializeApiVersioning;
exports.apiVersionManager = ApiVersionManager.getInstance();
exports.versionLifecycleManager = VersionLifecycleManager.getInstance();
exports.default = {
    ApiVersionManager,
    VersionLifecycleManager,
    apiVersioningMiddleware,
    endpointCompatibilityMiddleware,
    compareApiVersions,
    isVersionGTE,
    getLatestVersion,
    isValidVersionFormat,
    normalizeVersion,
    getMajorVersion,
    generateVersionedPath,
    createDeprecationNotice,
    parseVersionFromRequest,
    initializeApiVersioning,
    defaultVersioningConfig: exports.defaultVersioningConfig,
    VersionError,
    DeprecationError
};
//# sourceMappingURL=apiVersioning.js.map