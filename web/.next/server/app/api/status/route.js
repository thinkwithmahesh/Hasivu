"use strict";
(() => {
var exports = {};
exports.id = 6492;
exports.ids = [6492];
exports.modules = {

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 64335:
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

// NAMESPACE OBJECT: ./src/app/api/status/route.ts
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  GET: () => (GET)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(42394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(69692);
var module_default = /*#__PURE__*/__webpack_require__.n(app_route_module);
// EXTERNAL MODULE: ./node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(89335);
;// CONCATENATED MODULE: ./src/app/api/status/route.ts
// System status endpoint for deployment validation

async function GET(_request) {
    try {
        const statusData = {
            status: "ok",
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: "production" || 0,
            build: {
                version: process.env.npm_package_version || "1.0.0",
                commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA,
                timestamp: process.env.BUILD_TIMESTAMP
            }
        };
        return next_response/* default */.Z.json(statusData);
    } catch (error) {
        return next_response/* default */.Z.json({
            status: "error",
            timestamp: new Date().toISOString(),
            uptime: 0,
            environment: "error",
            build: {
                version: "1.0.0"
            }
        }, {
            status: 500
        });
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fstatus%2Froute&name=app%2Fapi%2Fstatus%2Froute&pagePath=private-next-app-dir%2Fapi%2Fstatus%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Fstatus%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/status/route","pathname":"/api/status","filename":"route","bundlePath":"app/api/status/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/status/route.ts","nextConfigOutput":""}
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

    const originalPathname = "/api/status/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778], () => (__webpack_exec__(64335)));
module.exports = __webpack_exports__;

})();