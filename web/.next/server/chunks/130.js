"use strict";
exports.id = 130;
exports.ids = [130];
exports.modules = {

/***/ 29914:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Qd: () => (/* binding */ AccordionItem),
/* harmony export */   UQ: () => (/* binding */ Accordion),
/* harmony export */   o4: () => (/* binding */ AccordionTrigger),
/* harmony export */   vF: () => (/* binding */ AccordionContent)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(88107);
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(51158);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12019);
/* __next_internal_client_entry_do_not_use__ Accordion,AccordionItem,AccordionTrigger,AccordionContent auto */ 




const Accordion = _radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Root */ .fC;
const AccordionItem = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Item */ .ck, {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("border-b", className),
        ...props
    }));
AccordionItem.displayName = "AccordionItem";
const AccordionTrigger = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, children, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Header */ .h4, {
        className: "flex",
        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Trigger */ .xz, {
            ref: ref,
            className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180", className),
            ...props,
            children: [
                children,
                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_4__/* .ChevronDown */ ._ME, {
                    className: "h-4 w-4 shrink-0 transition-transform duration-200"
                })
            ]
        })
    }));
AccordionTrigger.displayName = _radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Trigger */ .xz.displayName;
const AccordionContent = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, children, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Content */ .VY, {
        ref: ref,
        className: "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        ...props,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
            className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("pb-4 pt-0", className),
            children: children
        })
    }));
AccordionContent.displayName = _radix_ui_react_accordion__WEBPACK_IMPORTED_MODULE_2__/* .Content */ .VY.displayName;



/***/ }),

/***/ 70900:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   U: () => (/* binding */ events)
/* harmony export */ });
/* unused harmony export trackEvent */
// Lightweight Google Analytics helpers for client-side events
// Safe no-op in development or when GA is not configured
function trackEvent(eventName, params) {
    if (false) {} else if (false) {}
}
const events = {
    ctaClick: (cta_id, metadata)=>trackEvent("cta_click", {
            cta_id,
            ...metadata
        }),
    videoOpen: (metadata)=>trackEvent("video_open", {
            ...metadata
        })
};


/***/ })

};
;