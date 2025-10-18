"use strict";
exports.id = 8003;
exports.ids = [8003];
exports.modules = {

/***/ 58003:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Ol: () => (/* binding */ CardHeader),
/* harmony export */   SZ: () => (/* binding */ CardDescription),
/* harmony export */   Zb: () => (/* binding */ Card),
/* harmony export */   aY: () => (/* binding */ CardContent),
/* harmony export */   eW: () => (/* binding */ CardFooter),
/* harmony export */   ll: () => (/* binding */ CardTitle)
/* harmony export */ });
/* unused harmony export cardVariants */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var class_variance_authority__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(91971);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12019);




const cardVariants = (0,class_variance_authority__WEBPACK_IMPORTED_MODULE_2__/* .cva */ .j)("rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200", {
    variants: {
        variant: {
            default: "border bg-card text-card-foreground shadow-sm",
            elevated: "shadow-md hover:shadow-lg border bg-card",
            outlined: "border-2 border-hasivu-primary-200 bg-background shadow-sm",
            filled: "bg-hasivu-primary-50 border-hasivu-primary-100 text-hasivu-primary-900",
            gradient: "bg-gradient-to-br from-hasivu-primary-50 to-hasivu-secondary-50 border-transparent",
            // Role-based variants
            admin: "bg-red-50 border-red-200 text-red-900",
            teacher: "bg-blue-50 border-blue-200 text-blue-900",
            parent: "bg-green-50 border-green-200 text-green-900",
            student: "bg-amber-50 border-amber-200 text-amber-900",
            // Interactive variants
            hover: "hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer",
            clickable: "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        },
        size: {
            sm: "p-4",
            md: "p-6",
            lg: "p-8"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "md"
    }
});
const Card = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, variant, size, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)(cardVariants({
            variant,
            size
        }), className),
        ...props
    }));
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("flex flex-col space-y-1.5 p-6", className),
        ...props
    }));
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("text-2xl font-semibold leading-none tracking-tight", className),
        ...props
    }));
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("text-sm text-muted-foreground", className),
        ...props
    }));
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("p-6 pt-0", className),
        ...props
    }));
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("flex items-center p-6 pt-0", className),
        ...props
    }));
CardFooter.displayName = "CardFooter";



/***/ })

};
;