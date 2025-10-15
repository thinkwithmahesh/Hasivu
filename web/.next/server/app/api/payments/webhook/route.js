"use strict";
(() => {
var exports = {};
exports.id = 1004;
exports.ids = [1004];
exports.modules = {

/***/ 6113:
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ 22037:
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ 43425:
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

// NAMESPACE OBJECT: ./src/app/api/payments/webhook/route.ts
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
// EXTERNAL MODULE: external "crypto"
var external_crypto_ = __webpack_require__(6113);
var external_crypto_default = /*#__PURE__*/__webpack_require__.n(external_crypto_);
;// CONCATENATED MODULE: ./src/app/api/payments/webhook/route.ts


const LAMBDA_PAYMENTS_WEBHOOK_URL = process.env.LAMBDA_PAYMENTS_WEBHOOK_URL || "https://your-lambda-endpoint.execute-api.region.amazonaws.com/dev/payments/webhook";
const { RAZORPAY_WEBHOOK_SECRET } = process.env;
// POST /api/payments/webhook - Razorpay webhook handler
async function POST(request) {
    try {
        const body = await request.text();
        const signature = request.headers.get("x-razorpay-signature");
        // Verify webhook signature if secret is configured
        if (RAZORPAY_WEBHOOK_SECRET && signature) {
            const expectedSignature = external_crypto_default().createHmac("sha256", RAZORPAY_WEBHOOK_SECRET).update(body).digest("hex");
            if (signature !== expectedSignature) {
                return next_response/* default */.Z.json({
                    success: false,
                    error: "Invalid signature"
                }, {
                    status: 400
                });
            }
        }
        // Parse the webhook payload
        const payload = JSON.parse(body);
        // Forward to Lambda function
        const lambdaResponse = await fetch(LAMBDA_PAYMENTS_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Razorpay-Signature": signature || "",
                "X-Webhook-Source": "nextjs-proxy",
                "User-Agent": request.headers.get("user-agent") || "",
                "X-Forwarded-For": request.headers.get("x-forwarded-for") || ""
            },
            body: JSON.stringify(payload)
        });
        // Always return 200 to Razorpay to acknowledge receipt
        // The Lambda function handles the actual processing
        if (lambdaResponse.ok) {
            const lambdaData = await lambdaResponse.json();
        } else {}
        // Return success to Razorpay
        return next_response/* default */.Z.json({
            status: "ok"
        });
    } catch (error) {
        // Still return 200 to prevent Razorpay retries
        return next_response/* default */.Z.json({
            status: "error_logged"
        });
    }
}

;// CONCATENATED MODULE: ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?page=%2Fapi%2Fpayments%2Fwebhook%2Froute&name=app%2Fapi%2Fpayments%2Fwebhook%2Froute&pagePath=private-next-app-dir%2Fapi%2Fpayments%2Fwebhook%2Froute.ts&appDir=%2FUsers%2Fmahesha%2FDownloads%2Fhasivu-platform%2Fweb%2Fsrc%2Fapp&appPaths=%2Fapi%2Fpayments%2Fwebhook%2Froute&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!

    

    

    

    const options = {"definition":{"kind":"APP_ROUTE","page":"/api/payments/webhook/route","pathname":"/api/payments/webhook","filename":"route","bundlePath":"app/api/payments/webhook/route"},"resolvedPagePath":"/Users/mahesha/Downloads/hasivu-platform/web/src/app/api/payments/webhook/route.ts","nextConfigOutput":""}
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

    const originalPathname = "/api/payments/webhook/route"

    

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2778], () => (__webpack_exec__(43425)));
module.exports = __webpack_exports__;

})();