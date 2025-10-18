"use strict";
(() => {
var exports = {};
exports.id = 7792;
exports.ids = [7792];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 20025:
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

// NAMESPACE OBJECT: ./src/app/api/analytics/cross-school/route.ts
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  POST: () => (POST)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(42394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(69692);
var module_default = /*#__PURE__*/__webpack_require__.n(app_route_module);
// EXTERNAL MODULE: ./node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(89335);
;// CONCATENATED MODULE: ./src/app/api/analytics/cross-school/route.ts

const LAMBDA_CROSS_SCHOOL_ANALYTICS_URL = process.env.LAMBDA_CROSS_SCHOOL_ANALYTICS_URL || "https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/analytics/cross-school";
async function POST(request) {
    try {
        // Get auth token from httpOnly cookie
        const authToken = request.cookies.get("auth-token")?.value;
        if (!authToken) {
            return next_response/* default */.Z.json({
                success: false,
                error: "No authentication token found"
            }, {
                status: 401
            });
        }
        const body = await request.json();
        // Basic validation
        if (!body.region || !body.analyticsType) {
            return next_response/* default */.Z.json({
                success: false,
                error: "Missing required fields: region, analyticsType"
            }, {
                status: 400
            });
        }
        // Forward request to Lambda function
        const lambdaResponse = await fetch(LAMBDA_CROSS_SCHOOL_ANALYTICS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
                "User-Agent": request.headers.get("user-agent") || "",
                "X-Forwarded-For": request.headers.get("x-forwarded-for") || ""
            },
            body: JSON.stringify(body)
        });
        const lambdaData = await lambdaResponse.json();
        // Handle Lambda response and transform to expected frontend format
        if (lambdaResponse.ok) {
            // Transform Lambda response to frontend expected format
            const frontendResponse = {
                success: true,
                data: lambdaData.data || lambdaData
            };
            return next_response/* default */.Z.json(frontendResponse);
        } else {
            // Handle Lambda errors
            return next_response/* default */.Z.json({
                success: false,
                error: lambdaData.error || "Failed to generate cross-school analytics"
            }, {
                status: lambdaResponse.status
            });
        }
    } catch (error) {
        return next_response/* default */.Z.json({
            success: false,
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fanalytics%2Fcross-school%2Froute&name=app%2Fapi%2Fanalytics%2Fcross-school%2Froute&pagePath=private-next-app-dir%2Fapi%2Fanalytics%2Fcross-school%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Fanalytics%2Fcross-school%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/analytics/cross-school/route","pathname":"/api/analytics/cross-school","filename":"route","bundlePath":"app/api/analytics/cross-school/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/analytics/cross-school/route.ts","nextConfigOutput":""}
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

    const originalPathname = "/api/analytics/cross-school/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778], () => (__webpack_exec__(20025)));
module.exports = __webpack_exports__;

})();