"use strict";
exports.id = 9423;
exports.ids = [9423];
exports.modules = {

/***/ 29256:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   z: () => (/* binding */ Button)
/* harmony export */ });
/* unused harmony export buttonVariants */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(71085);
/* harmony import */ var class_variance_authority__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(91971);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(12019);
/* harmony import */ var _components_accessibility_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(42452);






const buttonVariants = (0,class_variance_authority__WEBPACK_IMPORTED_MODULE_3__/* .cva */ .j)("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hasivu-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none active:scale-[0.98] md:active:scale-100 md:hover:scale-[1.02]", {
    variants: {
        variant: {
            default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm",
            destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-sm",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 shadow-sm",
            secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 shadow-sm",
            ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
            link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
            // HASIVU Brand variants
            hasivu: "bg-hasivu-primary-500 text-white hover:bg-hasivu-primary-600 active:bg-hasivu-primary-700 shadow-md hover:shadow-lg",
            hasivuSecondary: "bg-hasivu-secondary-500 text-white hover:bg-hasivu-secondary-600 active:bg-hasivu-secondary-700 shadow-md hover:shadow-lg",
            hasivuOutline: "border-2 border-hasivu-primary-500 text-hasivu-primary-500 hover:bg-hasivu-primary-50 active:bg-hasivu-primary-100",
            hasivuGhost: "text-hasivu-primary-500 hover:bg-hasivu-primary-50 hover:text-hasivu-primary-600 active:bg-hasivu-primary-100",
            // Role-based HASIVU variants
            admin: "bg-hasivu-role-admin text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg",
            teacher: "bg-hasivu-role-teacher text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg",
            parent: "bg-hasivu-role-parent text-white hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg",
            student: "bg-hasivu-role-student text-white hover:bg-amber-600 active:bg-amber-700 shadow-md hover:shadow-lg",
            vendor: "bg-hasivu-role-vendor text-white hover:bg-purple-700 active:bg-purple-800 shadow-md hover:shadow-lg",
            kitchen: "bg-hasivu-role-kitchen text-white hover:bg-orange-600 active:bg-orange-700 shadow-md hover:shadow-lg",
            schoolAdmin: "bg-hasivu-role-schoolAdmin text-white hover:bg-slate-800 active:bg-slate-900 shadow-md hover:shadow-lg",
            // Mobile-optimized variants
            floating: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:shadow-md rounded-full",
            fab: "bg-primary text-primary-foreground shadow-lg hover:shadow-xl active:shadow-md rounded-full min-w-[56px] min-h-[56px]"
        },
        size: {
            default: "h-10 px-4 py-2 min-w-touch-target",
            sm: "h-9 rounded-md px-3 min-w-[36px]",
            lg: "h-11 rounded-md px-8 min-w-touch-target",
            icon: "h-10 w-10 min-w-touch-target min-h-touch-target",
            // Mobile-specific sizes
            touch: "h-touch-target w-touch-target min-w-touch-target min-h-touch-target",
            fab: "h-14 w-14 min-w-[56px] min-h-[56px]",
            fabSmall: "h-10 w-10 min-w-[40px] min-h-[40px]"
        }
    },
    defaultVariants: {
        variant: "default",
        size: "default"
    }
});
const Button = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, variant, size, asChild = false, haptic = false, loading = false, loadingText, children, disabled, onClick, ariaLabel, ariaDescribedBy, srOnlyText, pressed, expanded, ...props }, ref)=>{
    const Comp = asChild ? _radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_4__/* .Slot */ .g7 : "button";
    const _buttonId = react__WEBPACK_IMPORTED_MODULE_1__.useId();
    // Haptic feedback for mobile devices
    const handleClick = react__WEBPACK_IMPORTED_MODULE_1__.useCallback((e)=>{
        if (haptic && "vibrate" in navigator) {
            navigator.vibrate(10); // Light haptic feedback
        }
        onClick?.(e);
    }, [
        haptic,
        onClick
    ]);
    // Enhanced accessibility props
    const accessibilityProps = {
        "aria-label": ariaLabel,
        "aria-describedby": ariaDescribedBy,
        "aria-pressed": pressed !== undefined ? pressed : undefined,
        "aria-expanded": expanded !== undefined ? expanded : undefined,
        "aria-busy": loading,
        "aria-disabled": disabled || loading
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(Comp, {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_5__.cn)(buttonVariants({
            variant,
            size
        }), // Enhanced focus styles for accessibility
        "focus-visible:ring-2 focus-visible:ring-offset-2", // High contrast mode support
        "contrast-more:border-2 contrast-more:border-current", // Reduced motion support
        "motion-reduce:transition-none motion-reduce:transform-none", className),
        ref: ref,
        disabled: disabled || loading,
        onClick: handleClick,
        ...accessibilityProps,
        ...props,
        children: [
            loading && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_accessibility_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_2__/* .ScreenReaderOnly */ .uy, {
                children: loadingText || "Loading..."
            }),
            loading && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent",
                "aria-hidden": "true"
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                className: loading ? "ml-2" : "",
                children: [
                    children,
                    srOnlyText && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_accessibility_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_2__/* .ScreenReaderOnly */ .uy, {
                        children: srOnlyText
                    })
                ]
            })
        ]
    });
});
Button.displayName = "Button";



/***/ }),

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