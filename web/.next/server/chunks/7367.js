"use strict";
exports.id = 7367;
exports.ids = [7367];
exports.modules = {

/***/ 17367:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   I: () => (/* binding */ Input)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12019);
/* harmony import */ var _components_accessibility_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42452);




const Input = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, type, error, helpText, label, required, showRequiredIndicator = true, ...props }, ref)=>{
    const inputId = react__WEBPACK_IMPORTED_MODULE_1__.useId();
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    // Ensure minimum 16px font size on mobile to prevent zoom
    const mobileTextSize = type === "email" || type === "tel" || type === "url" ? "text-base" : "text-base md:text-sm";
    const describedBy = [
        error ? errorId : null,
        helpText ? helpId : null
    ].filter(Boolean).join(" ") || undefined;
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "space-y-1",
        children: [
            label && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("label", {
                htmlFor: inputId,
                className: "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                children: [
                    label,
                    required && showRequiredIndicator && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                className: "text-destructive ml-1",
                                "aria-hidden": "true",
                                children: "*"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_accessibility_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_2__/* .ScreenReaderOnly */ .uy, {
                                children: "(required)"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("input", {
                id: inputId,
                type: type,
                className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("flex h-10 w-full rounded-md border bg-background px-3 py-2 ring-offset-background", "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground", "placeholder:text-muted-foreground", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", "disabled:cursor-not-allowed disabled:opacity-50", // Mobile optimization
                mobileTextSize, "touch-manipulation", // Error state styling
                error ? "border-destructive focus-visible:ring-destructive" : "border-input", // High contrast support
                "contrast-more:border-2", // Reduced motion support
                "motion-reduce:transition-none", className),
                ref: ref,
                "aria-invalid": error ? "true" : "false",
                "aria-describedby": describedBy,
                "aria-required": required,
                ...props
            }),
            helpText && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                id: helpId,
                className: "text-sm text-muted-foreground",
                children: helpText
            }),
            error && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                id: errorId,
                className: "text-sm font-medium text-destructive",
                role: "alert",
                "aria-live": "polite",
                children: error
            })
        ]
    });
});
Input.displayName = "Input";



/***/ })

};
;