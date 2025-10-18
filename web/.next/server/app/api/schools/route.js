"use strict";
(() => {
var exports = {};
exports.id = 8402;
exports.ids = [8402];
exports.modules = {

/***/ 56786:
/***/ ((module) => {

module.exports = require("next/dist/compiled/react/jsx-runtime");

/***/ }),

/***/ 39491:
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ 14300:
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ 6113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 82361:
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ 57147:
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ 13685:
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ 95687:
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 71017:
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ 63477:
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ 12781:
/***/ ((module) => {

module.exports = require("stream");

/***/ }),

/***/ 76224:
/***/ ((module) => {

module.exports = require("tty");

/***/ }),

/***/ 57310:
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ 73837:
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ 59796:
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ 52147:
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

// NAMESPACE OBJECT: ./src/app/api/schools/route.ts
var route_namespaceObject = {};
__webpack_require__.r(route_namespaceObject);
__webpack_require__.d(route_namespaceObject, {
  GET: () => (GET),
  POST: () => (POST),
  PUT: () => (PUT)
});

// EXTERNAL MODULE: ./node_modules/next/dist/server/node-polyfill-headers.js
var node_polyfill_headers = __webpack_require__(42394);
// EXTERNAL MODULE: ./node_modules/next/dist/server/future/route-modules/app-route/module.js
var app_route_module = __webpack_require__(69692);
var module_default = /*#__PURE__*/__webpack_require__.n(app_route_module);
// EXTERNAL MODULE: ./node_modules/next/dist/server/web/exports/next-response.js
var next_response = __webpack_require__(89335);
// EXTERNAL MODULE: ./node_modules/next-auth/index.js
var next_auth = __webpack_require__(49861);
// EXTERNAL MODULE: ./src/services/api/hasivu-api.service.ts
var hasivu_api_service = __webpack_require__(38597);
;// CONCATENATED MODULE: ./src/app/api/schools/route.ts
/**
 * HASIVU School Registration API Routes
 * Epic 2 Story 2: School Onboarding APIs
 *
 * Handles school registration and onboarding operations
 */ 


// GET /api/schools - List schools
async function GET(request) {
    try {
        const session = await (0,next_auth.getServerSession)();
        if (!session) {
            return next_response/* default */.Z.json({
                error: "Authentication required"
            }, {
                status: 401
            });
        }
        const { searchParams } = new URL(request.url);
        const params = Object.fromEntries(searchParams);
        const response = await hasivu_api_service/* hasiviApi */.r.getSchoolList(params);
        if (!response.success) {
            return next_response/* default */.Z.json({
                error: response.error?.message || "Failed to fetch schools"
            }, {
                status: 500
            });
        }
        return next_response/* default */.Z.json(response);
    } catch (error) {
        return next_response/* default */.Z.json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
// POST /api/schools - Register new school
async function POST(request) {
    try {
        const session = await (0,next_auth.getServerSession)();
        if (!session) {
            return next_response/* default */.Z.json({
                error: "Authentication required"
            }, {
                status: 401
            });
        }
        const body = await request.json();
        const { action, ...data } = body;
        let response;
        switch(action){
            case "register":
                // Initial school registration
                response = await hasivu_api_service/* hasiviApi */.r.updateSchoolInfo({
                    ...data,
                    step: "school_info"
                });
                break;
            case "update_profile":
                // Update admin profile
                response = await hasivu_api_service/* hasiviApi */.r.updateUserProfile({
                    ...data,
                    step: "admin_setup"
                });
                break;
            case "configure_stakeholders":
                // Configure stakeholders
                response = await hasivu_api_service/* hasiviApi */.r.configureStakeholders({
                    ...data,
                    step: "stakeholder_setup"
                });
                break;
            case "update_branding":
                // Update school branding
                response = await hasivu_api_service/* hasiviApi */.r.updateSchoolBranding({
                    ...data,
                    step: "branding"
                });
                break;
            case "updateconfiguration":
                // Update system configuration
                response = await hasivu_api_service/* hasiviApi */.r.updateSchoolConfiguration({
                    ...data,
                    step: "configuration"
                });
                break;
            case "configure_rfid":
                // Configure RFID system
                response = await hasivu_api_service/* hasiviApi */.r.configureRFIDSystem({
                    ...data,
                    step: "rfid_setup"
                });
                break;
            case "complete_onboarding":
                // Complete onboarding
                response = await hasivu_api_service/* hasiviApi */.r.completeOnboarding({
                    ...data,
                    step: "completion"
                });
                break;
            default:
                return next_response/* default */.Z.json({
                    error: "Invalid action"
                }, {
                    status: 400
                });
        }
        if (!response.success) {
            return next_response/* default */.Z.json({
                error: response.error?.message || "Operation failed"
            }, {
                status: 500
            });
        }
        return next_response/* default */.Z.json(response);
    } catch (error) {
        return next_response/* default */.Z.json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}
// PUT /api/schools - Update school information
async function PUT(request) {
    try {
        const session = await (0,next_auth.getServerSession)();
        if (!session) {
            return next_response/* default */.Z.json({
                error: "Authentication required"
            }, {
                status: 401
            });
        }
        const body = await request.json();
        const response = await hasivu_api_service/* hasiviApi */.r.updateSchoolInfo(body);
        if (!response.success) {
            return next_response/* default */.Z.json({
                error: response.error?.message || "Failed to update school"
            }, {
                status: 500
            });
        }
        return next_response/* default */.Z.json(response);
    } catch (error) {
        return next_response/* default */.Z.json({
            error: "Internal server error"
        }, {
            status: 500
        });
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fschools%2Froute&name=app%2Fapi%2Fschools%2Froute&pagePath=private-next-app-dir%2Fapi%2Fschools%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Fschools%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/schools/route","pathname":"/api/schools","filename":"route","bundlePath":"app/api/schools/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/schools/route.ts","nextConfigOutput":""}
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

    const originalPathname = "/api/schools/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778,2947,3191,8597], () => (__webpack_exec__(52147)));
module.exports = __webpack_exports__;

})();