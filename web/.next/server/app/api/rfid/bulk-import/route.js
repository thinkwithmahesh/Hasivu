"use strict";
(() => {
var exports = {};
exports.id = 650;
exports.ids = [650];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 25537:
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

// NAMESPACE OBJECT: ./src/app/api/rfid/bulk-import/route.ts
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
;// CONCATENATED MODULE: ./src/app/api/rfid/bulk-import/route.ts

const LAMBDA_RFID_BULK_IMPORT_URL = process.env.LAMBDA_RFID_BULK_IMPORT_URL || "https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/rfid/bulk-import";
// POST /api/rfid/bulk-import - Bulk import RFID cards
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
        if (!body.cards || !Array.isArray(body.cards) || body.cards.length === 0) {
            return next_response/* default */.Z.json({
                success: false,
                error: "Cards array is required and must not be empty"
            }, {
                status: 400
            });
        }
        // Forward request to Lambda function
        const lambdaResponse = await fetch(LAMBDA_RFID_BULK_IMPORT_URL, {
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
            const frontendResponse = {
                success: true,
                data: lambdaData.data || lambdaData,
                message: lambdaData.message || "RFID cards imported successfully"
            };
            return next_response/* default */.Z.json(frontendResponse);
        } else {
            return next_response/* default */.Z.json({
                success: false,
                error: lambdaData.error || "Bulk import failed"
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

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Frfid%2Fbulk-import%2Froute&name=app%2Fapi%2Frfid%2Fbulk-import%2Froute&pagePath=private-next-app-dir%2Fapi%2Frfid%2Fbulk-import%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Frfid%2Fbulk-import%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/rfid/bulk-import/route","pathname":"/api/rfid/bulk-import","filename":"route","bundlePath":"app/api/rfid/bulk-import/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/rfid/bulk-import/route.ts","nextConfigOutput":""}
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

    const originalPathname = "/api/rfid/bulk-import/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778], () => (__webpack_exec__(25537)));
module.exports = __webpack_exports__;

})();