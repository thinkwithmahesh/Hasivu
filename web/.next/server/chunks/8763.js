"use strict";
exports.id = 8763;
exports.ids = [8763];
exports.modules = {

/***/ 48763:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   U: () => (/* binding */ LoginForm)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var react_hook_form__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(66558);
/* harmony import */ var _hookform_resolvers_zod__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(83894);
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(51158);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11440);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(29256);
/* harmony import */ var _components_ui_card__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(58003);
/* harmony import */ var _components_ui_input__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(17367);
/* harmony import */ var _components_ui_label__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(89122);
/* harmony import */ var _components_ui_form__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(52073);
/* harmony import */ var _components_ui_separator__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(33959);
/* harmony import */ var _components_ui_tabs__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(25621);
/* harmony import */ var _schemas__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(39811);
/* __next_internal_client_entry_do_not_use__ LoginForm auto */ 













// Role configuration
const USER_ROLES = {
    student: {
        label: "Student",
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .GraduationCap */ .XHo,
        description: "Access your meal orders and account",
        color: "bg-blue-500"
    },
    parent: {
        label: "Parent",
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Users */ .Qaw,
        description: "Manage your child's meals and payments",
        color: "bg-green-500"
    },
    admin: {
        label: "Admin",
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Shield */ .WL4,
        description: "System administration and management",
        color: "bg-purple-500"
    },
    kitchen: {
        label: "Kitchen",
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .ChefHat */ .eP4,
        description: "Manage orders and meal preparation",
        color: "bg-orange-500"
    },
    vendor: {
        label: "Vendor",
        icon: lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Truck */ ._DY,
        description: "Supply management and logistics",
        color: "bg-indigo-500"
    }
};
function LoginForm({ onSubmit, onSocialLogin, isLoading = false, error, showRememberMe = true, showSocialLogin = true, showRoleSelection = true, defaultRole = "student", className }) {
    const [showPassword, setShowPassword] = react__WEBPACK_IMPORTED_MODULE_1__.useState(false);
    const [selectedRole, setSelectedRole] = react__WEBPACK_IMPORTED_MODULE_1__.useState(defaultRole);
    const form = (0,react_hook_form__WEBPACK_IMPORTED_MODULE_12__/* .useForm */ .cI)({
        resolver: (0,_hookform_resolvers_zod__WEBPACK_IMPORTED_MODULE_13__/* .zodResolver */ .F)(_schemas__WEBPACK_IMPORTED_MODULE_10__/* .loginSchema */ .dm),
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false
        }
    });
    const handleSubmit = async (data)=>{
        try {
            await onSubmit({
                ...data,
                role: selectedRole
            });
        } catch (error) {
        // Error handling is managed by parent component
        }
    };
    const handleSocialLogin = async (provider)=>{
        if (onSocialLogin) {
            try {
                await onSocialLogin(provider);
            } catch (error) {
            // Error handled silently
            }
        }
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
        className: className,
        "aria-label": "Login form",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                className: "space-y-1 text-center",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                        className: "text-3xl font-bold text-primary-600",
                        children: "Welcome Back to HASIVU"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardDescription */ .SZ, {
                        className: "text-gray-600",
                        children: showRoleSelection ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                            children: "Select your role and sign in to continue"
                        }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                            children: "Sign in to your HASIVU account to continue"
                        })
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                className: "space-y-4",
                children: [
                    error && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        "data-testid": "general-error",
                        className: "p-3 rounded-md bg-error-50 border border-error-200 text-error-700 text-sm",
                        role: "alert",
                        "aria-live": "polite",
                        children: error
                    }),
                    showRoleSelection && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "mb-6",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_label__WEBPACK_IMPORTED_MODULE_6__/* .Label */ ._, {
                                className: "text-sm font-medium text-gray-700 mb-3 block",
                                children: "Select Your Role"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_9__/* .Tabs */ .mQ, {
                                value: selectedRole,
                                onValueChange: (value)=>setSelectedRole(value),
                                className: "w-full",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_9__/* .TabsList */ .dr, {
                                        className: "grid w-full grid-cols-5 mb-4",
                                        children: Object.entries(USER_ROLES).map(([role, config])=>{
                                            const Icon = config.icon;
                                            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_9__/* .TabsTrigger */ .SP, {
                                                value: role,
                                                "data-testid": `role-tab-${role}`,
                                                className: "flex flex-col items-center gap-1 p-3 text-xs",
                                                "aria-selected": selectedRole === role,
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Icon, {
                                                        className: "h-4 w-4"
                                                    }),
                                                    config.label
                                                ]
                                            }, role);
                                        })
                                    }),
                                    Object.entries(USER_ROLES).map(([role, config])=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_9__/* .TabsContent */ .nU, {
                                            value: role,
                                            className: "mt-2",
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                className: "text-sm text-gray-600 text-center bg-gray-50 p-2 rounded-md",
                                                children: config.description
                                            })
                                        }, role))
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .Form */ .l0, {
                        ...form,
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("form", {
                            onSubmit: form.handleSubmit(handleSubmit),
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormField */ .Wi, {
                                    control: form.control,
                                    name: "email",
                                    render: ({ field })=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormItem */ .xJ, {
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormLabel */ .lX, {
                                                    className: "text-gray-700",
                                                    children: "Email Address"
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormControl */ .NI, {
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                        className: "relative",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Mail */ .Mh9, {
                                                                className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                                                            }),
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_input__WEBPACK_IMPORTED_MODULE_5__/* .Input */ .I, {
                                                                ...field,
                                                                "data-testid": "email-input",
                                                                type: "email",
                                                                placeholder: "you@example.com",
                                                                className: "pl-10",
                                                                autoComplete: "email",
                                                                disabled: isLoading
                                                            })
                                                        ]
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormMessage */ .zG, {
                                                    "data-testid": "email-error"
                                                })
                                            ]
                                        })
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormField */ .Wi, {
                                    control: form.control,
                                    name: "password",
                                    render: ({ field })=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormItem */ .xJ, {
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormLabel */ .lX, {
                                                    className: "text-gray-700",
                                                    children: "Password"
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormControl */ .NI, {
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                        className: "relative",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Lock */ .HEZ, {
                                                                className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                                                            }),
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_input__WEBPACK_IMPORTED_MODULE_5__/* .Input */ .I, {
                                                                ...field,
                                                                "data-testid": "password-input",
                                                                type: showPassword ? "text" : "password",
                                                                placeholder: "Enter your password",
                                                                className: "pl-10 pr-10",
                                                                autoComplete: "current-password",
                                                                disabled: isLoading
                                                            }),
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("button", {
                                                                type: "button",
                                                                "data-testid": "password-toggle",
                                                                onClick: ()=>setShowPassword(!showPassword),
                                                                className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600",
                                                                "aria-label": showPassword ? "Hide password" : "Show password",
                                                                children: showPassword ? /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .EyeOff */ ._jl, {
                                                                    className: "h-4 w-4"
                                                                }) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Eye */ .bAj, {
                                                                    className: "h-4 w-4"
                                                                })
                                                            })
                                                        ]
                                                    })
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormMessage */ .zG, {
                                                    "data-testid": "password-error"
                                                })
                                            ]
                                        })
                                }),
                                showRememberMe && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "flex items-center justify-between",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormField */ .Wi, {
                                            control: form.control,
                                            name: "rememberMe",
                                            render: ({ field })=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormItem */ .xJ, {
                                                    className: "flex flex-row items-start space-x-3 space-y-0",
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_form__WEBPACK_IMPORTED_MODULE_7__/* .FormControl */ .NI, {
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("input", {
                                                                type: "checkbox",
                                                                "data-testid": "remember-me-checkbox",
                                                                checked: field.value,
                                                                onChange: field.onChange,
                                                                className: "mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded",
                                                                disabled: isLoading
                                                            })
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "space-y-1 leading-none",
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_label__WEBPACK_IMPORTED_MODULE_6__/* .Label */ ._, {
                                                                className: "text-sm text-gray-600",
                                                                children: "Remember me"
                                                            })
                                                        })
                                                    ]
                                                })
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                            href: "/auth/forgot-password",
                                            "data-testid": "forgot-password-link",
                                            className: "text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:underline",
                                            children: "Forgot password?"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                    type: "submit",
                                    "data-testid": "login-button",
                                    className: "w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5",
                                    disabled: isLoading,
                                    size: "lg",
                                    children: isLoading ? /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .Loader2 */ .zM5, {
                                                className: "mr-2 h-4 w-4 animate-spin"
                                            }),
                                            "Signing in..."
                                        ]
                                    }) : /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_11__/* .LogIn */ .uX4, {
                                                className: "mr-2 h-4 w-4"
                                            }),
                                            "Sign In"
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    showSocialLogin && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "absolute inset-0 flex items-center",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_separator__WEBPACK_IMPORTED_MODULE_8__/* .Separator */ .Z, {
                                            className: "w-full"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "relative flex justify-center text-xs uppercase",
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                            className: "bg-white px-2 text-gray-500",
                                            children: "Or continue with"
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "grid grid-cols-2 gap-3",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                        variant: "outline",
                                        "data-testid": "google-login-button",
                                        onClick: ()=>handleSocialLogin("google"),
                                        disabled: isLoading,
                                        className: "border-gray-300 text-gray-700 hover:bg-gray-50",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("svg", {
                                                className: "h-4 w-4 mr-2",
                                                viewBox: "0 0 24 24",
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                                                        fill: "currentColor",
                                                        d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                                                        fill: "currentColor",
                                                        d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                                                        fill: "currentColor",
                                                        d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                                                        fill: "currentColor",
                                                        d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    })
                                                ]
                                            }),
                                            "Google"
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                        variant: "outline",
                                        "data-testid": "microsoft-login-button",
                                        onClick: ()=>handleSocialLogin("facebook"),
                                        disabled: isLoading,
                                        className: "border-gray-300 text-gray-700 hover:bg-gray-50",
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("svg", {
                                                className: "h-4 w-4 mr-2",
                                                fill: "currentColor",
                                                viewBox: "0 0 24 24",
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("path", {
                                                    d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                                                })
                                            }),
                                            "Facebook"
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardFooter */ .eW, {
                className: "flex flex-col space-y-2 text-center text-sm text-gray-600",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                    children: [
                        "Don't have an account?",
                        " ",
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                            href: "/auth/register",
                            "data-testid": "signup-link",
                            className: "text-primary-600 hover:text-primary-500 font-medium focus:outline-none focus:underline",
                            children: "Sign up for free"
                        })
                    ]
                })
            })
        ]
    });
}


/***/ }),

/***/ 33959:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Z: () => (/* binding */ Separator)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _radix_ui_react_separator__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(22299);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12019);
/* __next_internal_client_entry_do_not_use__ Separator auto */ 



const Separator = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, orientation = "horizontal", decorative = true, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_separator__WEBPACK_IMPORTED_MODULE_2__/* .Root */ .f, {
        ref: ref,
        decorative: decorative,
        orientation: orientation,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("shrink-0 bg-border", orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]", className),
        ...props
    }));
Separator.displayName = _radix_ui_react_separator__WEBPACK_IMPORTED_MODULE_2__/* .Root */ .f.displayName;



/***/ })

};
;