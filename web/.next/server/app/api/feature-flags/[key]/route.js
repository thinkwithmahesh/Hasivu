"use strict";
(() => {
var exports = {};
exports.id = 8132;
exports.ids = [8132];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 53325:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  headerHooks: () => (/* binding */ headerHooks),
  originalPathname: () => (/* binding */ originalPathname),
  requestAsyncStorage: () => (/* binding */ requestAsyncStorage),
  routeModule: () => (/* binding */ routeModule),
  serverHooks: () => (/* binding */ serverHooks),
  staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage),
  staticGenerationBailout: () => (/* binding */ staticGenerationBailout)
});

// NAMESPACE OBJECT: ./src/app/api/feature-flags/[key]/route.ts
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  DELETE: () => (DELETE),
  GET: () => (GET),
  PUT: () => (PUT)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(42394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(69692);
var module_default = /*#__PURE__*/__webpack_require__.n(app_route_module);
// EXTERNAL MODULE: ./node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(89335);
;// CONCATENATED MODULE: ./src/services/feature-flag.service.ts
class FeatureFlagService {
    constructor(config){
        this.cache = new Map();
        this.config = {
            flags: [],
            segments: [],
            globalSettings: {
                defaultEnvironment: "development",
                enableAnalytics: false,
                cacheTimeout: 300000,
                ...config?.globalSettings
            },
            ...config
        };
        this.cacheTimeout = this.config.globalSettings.cacheTimeout;
    }
    /**
   * Get a feature flag by key
   */ getFlag(key) {
        return this.config.flags.find((flag)=>flag.key === key);
    }
    /**
   * Evaluate a feature flag for a given context
   */ evaluate(key, context) {
        const cacheKey = `${key}-${JSON.stringify(context)}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
            return cached;
        }
        const flag = this.getFlag(key);
        if (!flag) {
            const result = {
                enabled: false,
                reason: "Feature flag not found"
            };
            this.cache.set(cacheKey, result);
            return result;
        }
        if (!flag.enabled) {
            const result = {
                enabled: false,
                reason: "Feature flag is disabled"
            };
            this.cache.set(cacheKey, result);
            return result;
        }
        // Evaluate rules
        for (const rule of flag.rules){
            const evaluation = this.evaluateRule(rule, context);
            if (evaluation.enabled) {
                const result = {
                    enabled: true,
                    rule,
                    reason: evaluation.reason,
                    metadata: evaluation.metadata
                };
                this.cache.set(cacheKey, result);
                return result;
            }
        }
        const result = {
            enabled: false,
            reason: "No matching rules found"
        };
        this.cache.set(cacheKey, result);
        return result;
    }
    /**
   * Evaluate a single rule
   */ evaluateRule(rule, context) {
        // Check environment
        if (rule.environments && !rule.environments.includes(context.environment)) {
            return {
                enabled: false,
                reason: "Environment not allowed",
                metadata: {
                    environmentMatch: false
                }
            };
        }
        // Check date range
        const now = new Date();
        if (rule.startDate && now < rule.startDate) {
            return {
                enabled: false,
                reason: "Feature not yet active"
            };
        }
        if (rule.endDate && now > rule.endDate) {
            return {
                enabled: false,
                reason: "Feature has expired"
            };
        }
        // Evaluate based on strategy
        switch(rule.strategy){
            case "percentage":
                return this.evaluatePercentageRule(rule, context);
            case "user-segment":
                return this.evaluateSegmentRule(rule, context);
            case "environment":
                return {
                    enabled: true,
                    reason: "Environment-based rollout",
                    metadata: {
                        environmentMatch: true
                    }
                };
            case "gradual":
                return this.evaluateGradualRule(rule, context);
            default:
                return {
                    enabled: false,
                    reason: "Unknown rollout strategy"
                };
        }
    }
    /**
   * Evaluate percentage-based rule
   */ evaluatePercentageRule(rule, context) {
        if (!rule.percentage || rule.percentage <= 0) {
            return {
                enabled: false,
                reason: "Invalid percentage"
            };
        }
        if (rule.percentage >= 100) {
            return {
                enabled: true,
                reason: "100% rollout",
                metadata: {
                    rolloutPercentage: rule.percentage
                }
            };
        }
        // Use user ID or generate hash for consistent rollout
        const identifier = context.userId || context.schoolId || "anonymous";
        const hash = this.simpleHash(identifier);
        const userPercentage = hash % 100 + 1;
        const enabled = userPercentage <= rule.percentage;
        return {
            enabled,
            reason: enabled ? "User in rollout percentage" : "User not in rollout percentage",
            metadata: {
                rolloutPercentage: rule.percentage,
                userPercentage
            }
        };
    }
    /**
   * Evaluate user segment rule
   */ evaluateSegmentRule(rule, context) {
        if (!rule.segments || rule.segments.length === 0) {
            return {
                enabled: false,
                reason: "No segments defined"
            };
        }
        for (const segmentId of rule.segments){
            const segment = this.config.segments.find((s)=>s.id === segmentId);
            if (segment && this.matchesSegment(segment, context)) {
                return {
                    enabled: true,
                    reason: "User matches segment",
                    metadata: {
                        segmentMatch: true,
                        matchedSegment: segmentId
                    }
                };
            }
        }
        return {
            enabled: false,
            reason: "User does not match any segment",
            metadata: {
                segmentMatch: false
            }
        };
    }
    /**
   * Evaluate gradual rollout rule
   */ evaluateGradualRule(rule, context) {
        // Simple gradual rollout - could be enhanced with more sophisticated logic
        return this.evaluatePercentageRule(rule, context);
    }
    /**
   * Check if user matches a segment
   */ matchesSegment(segment, context) {
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
            for (const [key, expectedValue] of Object.entries(criteria.customProperties)){
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
   */ simpleHash(str) {
        let hash = 0;
        for(let i = 0; i < str.length; i++){
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }
    /**
   * Update a feature flag
   */ updateFlag(flag) {
        const index = this.config.flags.findIndex((f)=>f.key === flag.key);
        if (index >= 0) {
            this.config.flags[index] = flag;
            // Clear cache for this flag
            for (const [key] of this.cache){
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
   */ getAllFlags() {
        return [
            ...this.config.flags
        ];
    }
    /**
   * Set flags (for initialization)
   */ setFlags(flags) {
        this.config.flags = flags;
        this.clearCache();
    }
    /**
   * Set segments (for initialization)
   */ setSegments(segments) {
        this.config.segments = segments;
        this.clearCache();
    }
    /**
   * Clear cache
   */ clearCache() {
        this.cache.clear();
    }
    /**
   * Get cache statistics
   */ getCacheStats() {
        return {
            size: this.cache.size,
            timeout: this.cacheTimeout
        };
    }
}
// Singleton instance
let featureFlagService = null;
/**
 * Get the feature flag service instance
 */ function getFeatureFlagService(config) {
    if (!featureFlagService) {
        featureFlagService = new FeatureFlagService(config);
    }
    return featureFlagService;
}
/**
 * Initialize feature flags with default configuration
 */ function initializeFeatureFlags(flags, segments = []) {
    const service = getFeatureFlagService();
    service.setFlags(flags);
    service.setSegments(segments);
}

/* harmony default export */ const feature_flag_service = ((/* unused pure expression or super */ null && (getFeatureFlagService)));

;// CONCATENATED MODULE: ./src/app/api/feature-flags/[key]/route.ts


// GET /api/feature-flags/[key] - Get specific feature flag
async function GET(request, { params }) {
    try {
        const service = getFeatureFlagService();
        const flag = service.getFlag(params.key);
        if (!flag) {
            return next_response/* default */.Z.json({
                error: "Feature flag not found",
                success: false
            }, {
                status: 404
            });
        }
        // Evaluate the flag with context from query params
        const { searchParams } = new URL(request.url);
        const context = {
            userId: searchParams.get("userId") || undefined,
            userType: searchParams.get("userType") || undefined,
            schoolId: searchParams.get("schoolId") || undefined,
            role: searchParams.get("role") || undefined,
            region: searchParams.get("region") || undefined,
            environment: searchParams.get("environment") || "development"
        };
        const evaluation = service.evaluate(params.key, context);
        return next_response/* default */.Z.json({
            flag,
            evaluation,
            success: true
        });
    } catch (error) {
        return next_response/* default */.Z.json({
            error: "Failed to fetch feature flag",
            success: false
        }, {
            status: 500
        });
    }
}
// PUT /api/feature-flags/[key] - Update specific feature flag
async function PUT(request, { params }) {
    try {
        const body = await request.json();
        const service = getFeatureFlagService();
        const existingFlag = service.getFlag(params.key);
        if (!existingFlag) {
            return next_response/* default */.Z.json({
                error: "Feature flag not found",
                success: false
            }, {
                status: 404
            });
        }
        const updatedFlag = {
            ...existingFlag,
            ...body,
            key: params.key,
            metadata: {
                ...existingFlag.metadata,
                ...body.metadata,
                updatedAt: new Date()
            }
        };
        service.updateFlag(updatedFlag);
        return next_response/* default */.Z.json({
            flag: updatedFlag,
            success: true,
            message: "Feature flag updated successfully"
        });
    } catch (error) {
        return next_response/* default */.Z.json({
            error: "Failed to update feature flag",
            success: false
        }, {
            status: 500
        });
    }
}
// DELETE /api/feature-flags/[key] - Delete feature flag (soft delete by disabling)
async function DELETE(request, { params }) {
    try {
        const service = getFeatureFlagService();
        const flag = service.getFlag(params.key);
        if (!flag) {
            return next_response/* default */.Z.json({
                error: "Feature flag not found",
                success: false
            }, {
                status: 404
            });
        }
        // Soft delete by disabling the flag
        const disabledFlag = {
            ...flag,
            enabled: false,
            metadata: {
                ...flag.metadata,
                updatedAt: new Date()
            }
        };
        service.updateFlag(disabledFlag);
        return next_response/* default */.Z.json({
            success: true,
            message: "Feature flag disabled successfully"
        });
    } catch (error) {
        return next_response/* default */.Z.json({
            error: "Failed to disable feature flag",
            success: false
        }, {
            status: 500
        });
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Ffeature-flags%2F%5Bkey%5D%2Froute&name=app%2Fapi%2Ffeature-flags%2F%5Bkey%5D%2Froute&pagePath=private-next-app-dir%2Fapi%2Ffeature-flags%2F%5Bkey%5D%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Ffeature-flags%2F%5Bkey%5D%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/feature-flags/[key]/route","pathname":"/api/feature-flags/[key]","filename":"route","bundlePath":"app/api/feature-flags/[key]/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/feature-flags/[key]/route.ts","nextConfigOutput":""}
    const routeModule = new (module_default())({
      ...options,
      userland: route_namespaceObject,
    })

    // Pull out the exports that we need to expose from the module. This should
    // be eliminated when we've moved the other routes to the new format. These
    // are used to hook into the route.
    const {
      requestAsyncStorage,
      staticGenerationAsyncStorage,
      serverHooks,
      headerHooks,
      staticGenerationBailout
    } = routeModule

    const originalPathname = "/api/feature-flags/[key]/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778], () => (__webpack_exec__(53325)));
module.exports = __webpack_exports__;

})();