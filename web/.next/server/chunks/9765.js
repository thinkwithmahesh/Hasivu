exports.id = 9765;
exports.ids = [9765];
exports.modules = {

/***/ 18089:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 37951))

/***/ }),

/***/ 44599:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 35019))

/***/ }),

/***/ 35303:
/***/ (() => {



/***/ }),

/***/ 37951:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AuthError)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11440);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(29256);
/* harmony import */ var _components_auth_AuthLayout__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(35019);
/* __next_internal_client_entry_do_not_use__ default auto */ 




function AuthError({ error, reset }) {
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
    // Log the error to an error reporting service
    }, [
        error
    ]);
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_auth_AuthLayout__WEBPACK_IMPORTED_MODULE_4__.AuthLayout, {
        title: "Something went wrong",
        description: "We encountered an error while loading this page",
        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
            className: "flex flex-col items-center space-y-4 p-6 bg-white rounded-lg shadow-sm border",
            children: [
                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                            className: "text-lg font-semibold text-gray-900 mb-2",
                            children: "Authentication Error"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                            className: "text-sm text-gray-600 mb-4",
                            children: error.message || "An unexpected error occurred"
                        })
                    ]
                }),
                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "flex gap-3",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                            onClick: reset,
                            variant: "default",
                            className: "px-4 py-2",
                            children: "Try again"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                            href: "/",
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                variant: "outline",
                                className: "px-4 py-2",
                                children: "Go home"
                            })
                        })
                    ]
                })
            ]
        })
    });
}


/***/ }),

/***/ 35019:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AuthLayout: () => (/* binding */ AuthLayout),
/* harmony export */   MinimalAuthLayout: () => (/* binding */ MinimalAuthLayout)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11440);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(51158);
/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(29256);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(12019);
/* __next_internal_client_entry_do_not_use__ AuthLayout,MinimalAuthLayout auto */ 





const features = [
    {
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_4__/* .Shield */ .WL4,
        title: "Secure & Safe",
        description: "Bank-level security with end-to-end encryption"
    },
    {
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_4__/* .Users */ .Qaw,
        title: "Trusted by Schools",
        description: "Over 1000+ schools trust HASIVU platform"
    },
    {
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_4__/* .Zap */ .itc,
        title: "Lightning Fast",
        description: "Quick ordering and instant notifications"
    },
    {
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_4__/* .Globe */ .THo,
        title: "Always Available",
        description: "24/7 support and 99.9% uptime guarantee"
    }
];
const testimonials = [
    {
        name: "Sarah Johnson",
        role: "School Administrator",
        school: "Greenwood High School",
        content: "HASIVU has transformed how we manage school meals. The platform is intuitive and our parents love it!",
        avatar: "SJ"
    },
    {
        name: "Raj Patel",
        role: "Parent",
        school: "Delhi Public School",
        content: "Ordering meals for my kids has never been easier. I can track nutrition and payments all in one place.",
        avatar: "RP"
    }
];
function AuthLayout({ children, title, subtitle, showBackButton = false, backButtonText = "Back", backButtonHref = "/", showBranding = true, showFeatures = true, backgroundImage, className }) {
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_5__.cn)("min-h-screen bg-gray-50", className),
        children: [
            backgroundImage && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5",
                style: {
                    backgroundImage: `url(${backgroundImage})`
                }
            }),
            (showBackButton || showBranding) && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("header", {
                className: "relative z-10 flex items-center justify-between p-4 lg:p-6",
                children: [
                    showBackButton ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                        href: backButtonHref,
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                            variant: "ghost",
                            className: "text-gray-600 hover:text-gray-900",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_4__/* .ArrowLeft */ .XdH, {
                                    className: "mr-2 h-4 w-4"
                                }),
                                backButtonText
                            ]
                        })
                    }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {}),
                    showBranding && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                        href: "/",
                        className: "flex items-center space-x-2",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                className: "w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center",
                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                    className: "text-white font-bold text-lg",
                                    children: "H"
                                })
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                className: "text-xl font-bold text-gray-900",
                                children: "HASIVU"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "relative z-10 flex flex-col lg:flex-row min-h-screen",
                children: [
                    showFeatures && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "hidden lg:flex lg:w-1/2 bg-primary-600 text-white p-8 lg:p-12 flex-col justify-center",
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "max-w-md mx-auto",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "mb-8",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex items-center space-x-3 mb-4",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                        className: "text-white font-bold text-2xl",
                                                        children: "H"
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
                                                    className: "text-3xl font-bold",
                                                    children: "HASIVU"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                            className: "text-primary-100 text-lg",
                                            children: "Revolutionizing school meal management with smart technology and seamless experiences."
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "space-y-6 mb-8",
                                    children: features.map((feature, index)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex items-start space-x-3",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(feature.icon, {
                                                        className: "w-5 h-5 text-white"
                                                    })
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                                                            className: "font-semibold mb-1",
                                                            children: feature.title
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                            className: "text-primary-100 text-sm",
                                                            children: feature.description
                                                        })
                                                    ]
                                                })
                                            ]
                                        }, index))
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "bg-white/10 rounded-xl p-6",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex items-center space-x-3 mb-3",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "w-10 h-10 bg-white/20 rounded-full flex items-center justify-center",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                        className: "text-white font-medium text-sm",
                                                        children: testimonials[0].avatar
                                                    })
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                            className: "font-medium",
                                                            children: testimonials[0].name
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                            className: "text-primary-100 text-sm",
                                                            children: [
                                                                testimonials[0].role,
                                                                ", ",
                                                                testimonials[0].school
                                                            ]
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                            className: "text-primary-100 text-sm italic",
                                            children: [
                                                '"',
                                                testimonials[0].content,
                                                '"'
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/20",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-2xl font-bold",
                                                    children: "1000+"
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-primary-100 text-sm",
                                                    children: "Schools"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-2xl font-bold",
                                                    children: "50K+"
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-primary-100 text-sm",
                                                    children: "Students"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-2xl font-bold",
                                                    children: "99.9%"
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-primary-100 text-sm",
                                                    children: "Uptime"
                                                })
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_5__.cn)("flex-1 flex items-center justify-center p-4 lg:p-8", showFeatures ? "lg:w-1/2" : "w-full"),
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "w-full max-w-md",
                            children: [
                                showBranding && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "lg:hidden text-center mb-8",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                            href: "/",
                                            className: "inline-flex items-center space-x-2",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                        className: "text-white font-bold text-xl",
                                                        children: "H"
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                    className: "text-2xl font-bold text-gray-900",
                                                    children: "HASIVU"
                                                })
                                            ]
                                        }),
                                        title && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "mt-4",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                                    className: "text-2xl font-bold text-gray-900",
                                                    children: title
                                                }),
                                                subtitle && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                    className: "text-gray-600 mt-2",
                                                    children: subtitle
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "w-full",
                                    children: children
                                }),
                                showFeatures && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "lg:hidden mt-8 grid grid-cols-2 gap-4",
                                    children: features.slice(0, 4).map((feature, index)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "text-center p-4 bg-white rounded-lg shadow-sm",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2",
                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(feature.icon, {
                                                        className: "w-4 h-4 text-primary-600"
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                                                    className: "font-medium text-sm text-gray-900 mb-1",
                                                    children: feature.title
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                    className: "text-xs text-gray-600",
                                                    children: feature.description
                                                })
                                            ]
                                        }, index))
                                })
                            ]
                        })
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("footer", {
                className: "relative z-10 py-4 px-4 lg:px-6 bg-white border-t border-gray-200",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "flex items-center space-x-4 mb-2 sm:mb-0",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/legal/privacy",
                                    className: "hover:text-gray-900",
                                    children: "Privacy Policy"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/legal/terms",
                                    className: "hover:text-gray-900",
                                    children: "Terms of Service"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/support",
                                    className: "hover:text-gray-900",
                                    children: "Support"
                                })
                            ]
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "flex items-center space-x-1",
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                children: "\xa9 2024 HASIVU. All rights reserved."
                            })
                        })
                    ]
                })
            })
        ]
    });
}
function MinimalAuthLayout({ children, title, subtitle, showLogo = true, className }) {
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_5__.cn)("min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", className),
        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
            className: "max-w-md w-full space-y-8",
            children: [
                showLogo && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                            href: "/",
                            className: "inline-flex items-center space-x-2",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center",
                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                        className: "text-white font-bold text-2xl",
                                        children: "H"
                                    })
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                    className: "text-3xl font-bold text-gray-900",
                                    children: "HASIVU"
                                })
                            ]
                        }),
                        title && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "mt-6",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                    className: "text-3xl font-bold text-gray-900",
                                    children: title
                                }),
                                subtitle && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                    className: "mt-2 text-gray-600",
                                    children: subtitle
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    className: "w-full",
                    children: children
                })
            ]
        })
    });
}


/***/ }),

/***/ 39811:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   dm: () => (/* binding */ loginSchema),
/* harmony export */   ek: () => (/* binding */ forgotPasswordSchema),
/* harmony export */   gY: () => (/* binding */ registrationSchema)
/* harmony export */ });
/* unused harmony exports detectRoleFromEmail, enhancedLoginSchema, securityQuestionsSchema, parentVerificationSchema, registrationStep1Schema, registrationStep2Schema, registrationStep3Schema, registrationSchema, resetPasswordSchema, mfaSchema, mfaSetupSchema, recoveryCodesSchema, profileManagementSchema, rfidLinkingSchema, rfidSchema, DIETARY_RESTRICTIONS, COMMON_ALLERGENS */
/* harmony import */ var zod__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(87588);

// Common validation patterns
const emailSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().email("Please enter a valid email address");
const passwordSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(8, "Password must be at least 8 characters").regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain uppercase, lowercase, number, and special character");
// Role detection utility
const detectRoleFromEmail = (email)=>{
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) return "student";
    // School staff patterns
    if (domain.includes("school") || domain.includes("edu") || domain.includes("admin")) {
        if (email.includes("admin") || email.includes("principal")) return "admin";
        if (email.includes("teacher") || email.includes("staff")) return "teacher";
        if (email.includes("kitchen") || email.includes("food")) return "kitchen";
        return "staff";
    }
    // Parent patterns
    if (email.includes("parent") || email.includes("guardian")) return "parent";
    // Default to student for school domains, parent otherwise
    return domain.includes("student") ? "student" : "parent";
};
// Enhanced login schema
const enhancedLoginSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    email: emailSchema,
    password: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Password is required"),
    rememberMe: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().optional().default(false),
    role: zod__WEBPACK_IMPORTED_MODULE_0__/* ["enum"] */ .Km([
        "student",
        "parent",
        "teacher",
        "kitchen",
        "admin"
    ]).optional()
});
// Original login schema for backward compatibility
const loginSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    email: emailSchema,
    password: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(8, "Password must be at least 8 characters"),
    rememberMe: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().optional()
});
// Forgot password schema
const forgotPasswordSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    email: emailSchema,
    recoveryMethod: zod__WEBPACK_IMPORTED_MODULE_0__/* ["enum"] */ .Km([
        "email",
        "sms",
        "security_questions"
    ]).default("email")
});
// Security questions schema
const securityQuestionsSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    question1: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Please select a security question"),
    answer1: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(3, "Answer must be at least 3 characters"),
    question2: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Please select a second security question"),
    answer2: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(3, "Answer must be at least 3 characters"),
    question3: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Please select a third security question"),
    answer3: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(3, "Answer must be at least 3 characters")
});
// Parent verification schema
const parentVerificationSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    parentEmail: emailSchema,
    studentId: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Student ID is required"),
    relationshipType: zod__WEBPACK_IMPORTED_MODULE_0__/* ["enum"] */ .Km([
        "parent",
        "guardian",
        "emergency_contact"
    ]),
    verificationCode: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().length(6, "Verification code must be 6 digits"),
    phoneNumber: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number")
});
// Multi-step registration schemas
const registrationStep1Schema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_(),
    role: zod__WEBPACK_IMPORTED_MODULE_0__/* ["enum"] */ .Km([
        "student",
        "parent",
        "teacher",
        "kitchen",
        "admin"
    ]),
    acceptTerms: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().refine((val)=>val === true, {
        message: "You must accept the terms and conditions"
    })
}).refine((data)=>data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: [
        "confirmPassword"
    ]
});
const registrationStep2Schema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    firstName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "First name must be at least 2 characters"),
    lastName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "Last name must be at least 2 characters"),
    phoneNumber: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number"),
    dateOfBirth: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().refine((date)=>{
        const parsed = new Date(date);
        const now = new Date();
        return parsed <= now && parsed.getFullYear() > 1900;
    }, "Please enter a valid date of birth"),
    grade: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    studentId: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional()
});
const registrationStep3Schema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    emergencyContactName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "Emergency contact name is required"),
    emergencyContactPhone: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number"),
    emergencyContactRelation: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Please specify relationship"),
    medicalConditions: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    allergies: zod__WEBPACK_IMPORTED_MODULE_0__/* .array */ .IX(zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_()).optional(),
    dietaryRestrictions: zod__WEBPACK_IMPORTED_MODULE_0__/* .array */ .IX(zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_()).optional(),
    notificationPreferences: zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
        email: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().default(true),
        sms: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().default(false),
        push: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().default(true)
    }).optional()
});
// Original registration schema for backward compatibility
const registrationSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    firstName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "First name must be at least 2 characters"),
    lastName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "Last name must be at least 2 characters"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_(),
    grade: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    section: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional()
}).refine((data)=>data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: [
        "confirmPassword"
    ]
});
// Reset password schema
const resetPasswordSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    token: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Reset token is required"),
    password: passwordSchema,
    confirmPassword: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_()
}).refine((data)=>data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: [
        "confirmPassword"
    ]
});
// MFA schemas
const mfaSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    code: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().length(6, "Verification code must be 6 digits"),
    trustDevice: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().optional().default(false)
});
const mfaSetupSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    method: zod__WEBPACK_IMPORTED_MODULE_0__/* ["enum"] */ .Km([
        "totp",
        "sms",
        "email"
    ]),
    phoneNumber: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    backupEmail: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().email().optional()
}).refine((data)=>{
    if (data.method === "sms" && !data.phoneNumber) {
        return false;
    }
    return true;
}, {
    message: "Phone number is required for SMS verification",
    path: [
        "phoneNumber"
    ]
});
const recoveryCodesSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    codes: zod__WEBPACK_IMPORTED_MODULE_0__/* .array */ .IX(zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_()).min(8, "Must have at least 8 recovery codes"),
    acknowledged: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().refine((val)=>val === true, {
        message: "You must acknowledge that you have saved your recovery codes"
    })
});
// Profile management schema
const profileManagementSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    firstName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "First name must be at least 2 characters"),
    lastName: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "Last name must be at least 2 characters"),
    email: emailSchema,
    phoneNumber: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number"),
    dateOfBirth: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    grade: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    studentId: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
    emergencyContacts: zod__WEBPACK_IMPORTED_MODULE_0__/* .array */ .IX(zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
        name: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(2, "Contact name is required"),
        phone: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().regex(/^\+?[\d\s\-()]+$/, "Please enter a valid phone number"),
        relation: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Please specify relationship")
    })).optional(),
    medicalInfo: zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
        conditions: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
        medications: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional(),
        allergies: zod__WEBPACK_IMPORTED_MODULE_0__/* .array */ .IX(zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_()).optional(),
        dietaryRestrictions: zod__WEBPACK_IMPORTED_MODULE_0__/* .array */ .IX(zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_()).optional()
    }).optional(),
    preferences: zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
        notifications: zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
            email: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().default(true),
            sms: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().default(false),
            push: zod__WEBPACK_IMPORTED_MODULE_0__/* .boolean */ .O7().default(true)
        }).optional(),
        language: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().default("en"),
        timezone: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().default("UTC")
    }).optional()
});
// RFID linking schema
const rfidLinkingSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    rfidTag: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(8, "RFID tag must be at least 8 characters"),
    studentId: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "Student ID is required"),
    verificationMethod: zod__WEBPACK_IMPORTED_MODULE_0__/* ["enum"] */ .Km([
        "pin",
        "biometric",
        "admin_approval"
    ]),
    pin: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional()
}).refine((data)=>{
    if (data.verificationMethod === "pin" && !data.pin) {
        return false;
    }
    return true;
}, {
    message: "PIN is required when using PIN verification",
    path: [
        "pin"
    ]
});
// Original RFID schema for backward compatibility
const rfidSchema = zod__WEBPACK_IMPORTED_MODULE_0__/* .object */ .Ry({
    rfidTag: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().min(1, "RFID tag is required"),
    studentId: zod__WEBPACK_IMPORTED_MODULE_0__/* .string */ .Z_().optional()
});
// Dietary restrictions and allergens constants
const DIETARY_RESTRICTIONS = (/* unused pure expression or super */ null && ([
    "Vegetarian",
    "Vegan",
    "Gluten-Free",
    "Dairy-Free",
    "Kosher",
    "Halal",
    "Low-Sodium",
    "Low-Sugar",
    "Nut-Free",
    "Organic Only"
]));
const COMMON_ALLERGENS = (/* unused pure expression or super */ null && ([
    "Peanuts",
    "Tree Nuts",
    "Milk",
    "Eggs",
    "Fish",
    "Shellfish",
    "Soy",
    "Wheat",
    "Sesame",
    "Sulphites"
]));
// Backward compatibility aliases



/***/ }),

/***/ 52073:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NI: () => (/* binding */ FormControl),
/* harmony export */   Wi: () => (/* binding */ FormField),
/* harmony export */   l0: () => (/* binding */ Form),
/* harmony export */   lX: () => (/* binding */ FormLabel),
/* harmony export */   xJ: () => (/* binding */ FormItem),
/* harmony export */   zG: () => (/* binding */ FormMessage)
/* harmony export */ });
/* unused harmony exports useFormField, FormDescription */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(71085);
/* harmony import */ var react_hook_form__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(66558);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(12019);
/* harmony import */ var _components_ui_label__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(89122);
/* __next_internal_client_entry_do_not_use__ useFormField,Form,FormItem,FormLabel,FormControl,FormDescription,FormMessage,FormField auto */ 





const Form = react_hook_form__WEBPACK_IMPORTED_MODULE_3__/* .FormProvider */ .RV;
const FormFieldContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.createContext({});
const FormField = ({ ...props })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FormFieldContext.Provider, {
        value: {
            name: props.name
        },
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_hook_form__WEBPACK_IMPORTED_MODULE_3__/* .Controller */ .Qr, {
            ...props
        })
    });
};
const useFormField = ()=>{
    const fieldContext = react__WEBPACK_IMPORTED_MODULE_1__.useContext(FormFieldContext);
    const itemContext = react__WEBPACK_IMPORTED_MODULE_1__.useContext(FormItemContext);
    const { getFieldState, formState } = (0,react_hook_form__WEBPACK_IMPORTED_MODULE_3__/* .useFormContext */ .Gc)();
    const fieldState = getFieldState(fieldContext.name, formState);
    if (!fieldContext) {
        throw new Error("useFormField should be used within <FormField>");
    }
    const { id } = itemContext;
    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState
    };
};
const FormItemContext = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.createContext({});
const FormItem = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>{
    const id = react__WEBPACK_IMPORTED_MODULE_1__.useId();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FormItemContext.Provider, {
        value: {
            id
        },
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
            ref: ref,
            className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_4__.cn)("space-y-2", className),
            ...props
        })
    });
});
FormItem.displayName = "FormItem";
const FormLabel = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>{
    const { error, formItemId } = useFormField();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_label__WEBPACK_IMPORTED_MODULE_2__/* .Label */ ._, {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_4__.cn)(error && "text-destructive", className),
        htmlFor: formItemId,
        ...props
    });
});
FormLabel.displayName = "FormLabel";
const FormControl = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ ...props }, ref)=>{
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_slot__WEBPACK_IMPORTED_MODULE_5__/* .Slot */ .g7, {
        ref: ref,
        id: formItemId,
        "aria-describedby": !error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`,
        "aria-invalid": !!error,
        ...props
    });
});
FormControl.displayName = "FormControl";
const FormDescription = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>{
    const { formDescriptionId } = useFormField();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
        ref: ref,
        id: formDescriptionId,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_4__.cn)("text-sm text-muted-foreground", className),
        ...props
    });
});
FormDescription.displayName = "FormDescription";
const FormMessage = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, children, ...props }, ref)=>{
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message ?? "") : children;
    if (!body) {
        return null;
    }
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
        ref: ref,
        id: formMessageId,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_4__.cn)("text-sm font-medium text-destructive", className),
        ...props,
        children: body
    });
});
FormMessage.displayName = "FormMessage";



/***/ }),

/***/ 89122:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   _: () => (/* binding */ Label)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _radix_ui_react_label__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(43618);
/* harmony import */ var class_variance_authority__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(91971);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(12019);
/* __next_internal_client_entry_do_not_use__ Label auto */ 




const labelVariants = (0,class_variance_authority__WEBPACK_IMPORTED_MODULE_2__/* .cva */ .j)("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
const Label = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_label__WEBPACK_IMPORTED_MODULE_3__/* .Root */ .f, {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_4__.cn)(labelVariants(), className),
        ...props
    }));
Label.displayName = _radix_ui_react_label__WEBPACK_IMPORTED_MODULE_3__/* .Root */ .f.displayName;



/***/ }),

/***/ 25442:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   $$typeof: () => (/* binding */ $$typeof),
/* harmony export */   __esModule: () => (/* binding */ __esModule),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/app/auth/error.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ }),

/***/ 49930:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ AuthLayout),
/* harmony export */   metadata: () => (/* binding */ metadata)
/* harmony export */ });
/* harmony import */ var _lib_seo__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(14528);

// Generate auth-specific metadata
const metadata = {
    ...(0,_lib_seo__WEBPACK_IMPORTED_MODULE_0__/* .generateBaseMetadata */ .zR)(),
    title: {
        default: "Login - HASIVU School Meal Management",
        template: "%s | HASIVU Auth"
    },
    description: "Sign in to access your HASIVU school meal management account. Secure authentication for students, parents, teachers, and administrators.",
    robots: "noindex, nofollow"
};
function AuthLayout({ children }) {
    return children;
}


/***/ }),

/***/ 56584:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ AuthLoading)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(61363);
;// CONCATENATED MODULE: ./src/components/auth/AuthLayout.tsx

const proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/auth/AuthLayout.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;

const e0 = proxy["AuthLayout"];

const e1 = proxy["MinimalAuthLayout"];

// EXTERNAL MODULE: ./node_modules/lucide-react/dist/cjs/lucide-react.js
var lucide_react = __webpack_require__(4094);
;// CONCATENATED MODULE: ./src/app/auth/loading.tsx



function AuthLoading() {
    return /*#__PURE__*/ jsx_runtime_.jsx(e0, {
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "flex flex-col items-center justify-center space-y-4 p-8",
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Loader2 */.zM5, {
                    className: "h-8 w-8 animate-spin text-hasivu-primary-600"
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                    className: "text-sm text-gray-600",
                    children: "Loading authentication page..."
                })
            ]
        })
    });
}


/***/ })

};
;