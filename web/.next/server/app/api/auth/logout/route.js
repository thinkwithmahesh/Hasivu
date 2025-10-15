"use strict";
(() => {
var exports = {};
exports.id = 7716;
exports.ids = [7716];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 74232:
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

// NAMESPACE OBJECT: ./src/app/api/auth/logout/route.ts
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
;// CONCATENATED MODULE: ./src/app/api/auth/logout/route.ts

const LAMBDA_AUTH_LOGOUT_URL = process.env.LAMBDA_AUTH_LOGOUT_URL || "https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/auth/logout";
// POST /api/auth/logout - User logout
async function POST(request) {
    try {
        // Get auth token from cookie
        const authToken = request.cookies.get("auth-token")?.value;
        // Forward request to Lambda function if token exists
        if (authToken) {
            try {
                await fetch(LAMBDA_AUTH_LOGOUT_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${authToken}`,
                        "User-Agent": request.headers.get("user-agent") || "",
                        "X-Forwarded-For": request.headers.get("x-forwarded-for") || ""
                    }
                });
            } catch (lambdaError) {
            // Log but don't fail logout due to Lambda issues
            }
        }
        // Clear cookies regardless of Lambda response
        const response = next_response/* default */.Z.json({
            success: true,
            message: "Logout successful"
        });
        // Clear auth cookies
        response.cookies.set("auth-token", "", {
            httpOnly: true,
            secure: "production" === "production",
            sameSite: "strict",
            maxAge: 0
        });
        response.cookies.set("refresh-token", "", {
            httpOnly: true,
            secure: "production" === "production",
            sameSite: "strict",
            maxAge: 0
        });
        return response;
    } catch (error) {
        // Still clear cookies even if there's an error
        const response = next_response/* default */.Z.json({
            success: false,
            error: "Logout completed with warnings"
        }, {
            status: 200
        });
        response.cookies.set("auth-token", "", {
            httpOnly: true,
            secure: "production" === "production",
            sameSite: "strict",
            maxAge: 0
        });
        response.cookies.set("refresh-token", "", {
            httpOnly: true,
            secure: "production" === "production",
            sameSite: "strict",
            maxAge: 0
        });
        return response;
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fauth%2Flogout%2Froute&name=app%2Fapi%2Fauth%2Flogout%2Froute&pagePath=private-next-app-dir%2Fapi%2Fauth%2Flogout%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Fauth%2Flogout%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/auth/logout/route","pathname":"/api/auth/logout","filename":"route","bundlePath":"app/api/auth/logout/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/auth/logout/route.ts","nextConfigOutput":""}
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

    const originalPathname = "/api/auth/logout/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778], () => (__webpack_exec__(74232)));
module.exports = __webpack_exports__;

})();