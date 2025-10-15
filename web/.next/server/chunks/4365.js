"use strict";
exports.id = 4365;
exports.ids = [4365];
exports.modules = {

/***/ 74365:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   i1: () => (/* binding */ ProtectedRoute)
/* harmony export */ });
/* unused harmony exports withAuth, usePermissions, RequireAuth, RequireRole, RequirePermission */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(57114);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_navigation__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(51158);
/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(29256);
/* harmony import */ var _components_ui_card__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(58003);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(12019);
/* harmony import */ var _types_auth__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(97985);
/* harmony import */ var _contexts_auth_context__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(73680);
/* __next_internal_client_entry_do_not_use__ ProtectedRoute,withAuth,usePermissions,RequireAuth,RequireRole,RequirePermission auto */ 








// Use the actual auth context
const useAuth = ()=>{
    const { user, isLoading, isAuthenticated } = (0,_contexts_auth_context__WEBPACK_IMPORTED_MODULE_6__.useAuth)();
    const checkPermission = (permission)=>{
        return _types_auth__WEBPACK_IMPORTED_MODULE_5__/* .PermissionChecker */ .AT.hasPermission(user, permission);
    };
    const checkRole = (role)=>{
        return _types_auth__WEBPACK_IMPORTED_MODULE_5__/* .PermissionChecker */ .AT.hasRole(user, role);
    };
    return {
        user,
        isLoading,
        isAuthenticated,
        checkPermission,
        checkRole
    };
};
function ProtectedRoute({ children, requireAuth = true, allowedRoles = [], requiredPermissions = [], requireEmailVerification = false, redirectTo = "/auth/login", redirectOnSuccess, loadingComponent, unauthorizedComponent, fallbackLayout = true, className }) {
    const { user, isLoading, isAuthenticated, checkPermission, checkRole } = useAuth();
    const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    // Handle redirection
    react__WEBPACK_IMPORTED_MODULE_1__.useEffect(()=>{
        if (!isLoading) {
            if (requireAuth && !isAuthenticated) {
                const currentPath = window.location.pathname;
                const redirectPath = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
                router.replace(redirectPath);
                return;
            }
            if (redirectOnSuccess && isAuthenticated) {
                router.replace(redirectOnSuccess);
            }
        }
    }, [
        isLoading,
        isAuthenticated,
        requireAuth,
        redirectTo,
        redirectOnSuccess,
        router
    ]);
    // Show loading state
    if (isLoading) {
        if (loadingComponent) {
            return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                children: loadingComponent
            });
        }
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(LoadingScreen, {
            fallbackLayout: fallbackLayout,
            className: className
        });
    }
    // Check authentication
    if (requireAuth && !isAuthenticated) {
        return null; // Redirect will handle this
    }
    // Check email verification
    if (requireEmailVerification && user && !user.emailVerified) {
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(UnauthorizedScreen, {
            type: "email-verification",
            user: user,
            fallbackLayout: fallbackLayout,
            className: className
        });
    }
    // Check role-based access
    if (allowedRoles.length > 0 && user) {
        const hasAllowedRole = allowedRoles.some((role)=>checkRole(role));
        if (!hasAllowedRole) {
            if (unauthorizedComponent) {
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                    children: unauthorizedComponent
                });
            }
            return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(UnauthorizedScreen, {
                type: "role",
                user: user,
                allowedRoles: allowedRoles,
                fallbackLayout: fallbackLayout,
                className: className
            });
        }
    }
    // Check permission-based access
    if (requiredPermissions.length > 0 && user) {
        const hasAllPermissions = requiredPermissions.every((permission)=>checkPermission(permission));
        if (!hasAllPermissions) {
            if (unauthorizedComponent) {
                return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
                    children: unauthorizedComponent
                });
            }
            return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(UnauthorizedScreen, {
                type: "permission",
                user: user,
                requiredPermissions: requiredPermissions,
                fallbackLayout: fallbackLayout,
                className: className
            });
        }
    }
    // All checks passed - render children
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.Fragment, {
        children: children
    });
}
function LoadingScreen({ fallbackLayout = true, className }) {
    const content = /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex flex-col items-center justify-center space-y-4",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_7__/* .Loader2 */ .zM5, {
                    className: "w-8 h-8 text-primary-600 animate-spin"
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "text-center",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                        className: "text-lg font-medium text-gray-900",
                        children: "Loading..."
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        className: "text-gray-600",
                        children: "Please wait while we load your content"
                    })
                ]
            })
        ]
    });
    if (!fallbackLayout) {
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
            className: className,
            children: content
        });
    }
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_8__.cn)("min-h-screen flex items-center justify-center bg-gray-50", className),
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
            className: "w-full max-w-md",
            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                className: "pt-6",
                children: content
            })
        })
    });
}
function UnauthorizedScreen({ type, user, allowedRoles = [], requiredPermissions: _requiredPermissions = [], fallbackLayout = true, className }) {
    const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    const getContent = ()=>{
        switch(type){
            case "email-verification":
                return {
                    icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_7__/* .Shield */ .WL4, {
                        className: "w-8 h-8 text-warning-600"
                    }),
                    title: "Email Verification Required",
                    description: "Please verify your email address to access this page.",
                    action: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                        onClick: ()=>router.push("/auth/verify-email"),
                        className: "bg-primary-600 hover:bg-primary-700",
                        children: "Verify Email"
                    })
                };
            case "role":
                return {
                    icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_7__/* .Lock */ .HEZ, {
                        className: "w-8 h-8 text-error-600"
                    }),
                    title: "Access Denied",
                    description: `This page requires ${allowedRoles.length > 1 ? "one of the following roles" : "the following role"}: ${allowedRoles.join(", ")}.`,
                    action: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                        variant: "outline",
                        onClick: ()=>router.push("/dashboard"),
                        children: "Go to Dashboard"
                    })
                };
            case "permission":
                return {
                    icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_7__/* .AlertTriangle */ .uyG, {
                        className: "w-8 h-8 text-error-600"
                    }),
                    title: "Insufficient Permissions",
                    description: "You don't have the required permissions to access this page.",
                    action: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                        variant: "outline",
                        onClick: ()=>router.push("/dashboard"),
                        children: "Go to Dashboard"
                    })
                };
            default:
                return {
                    icon: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_7__/* .Lock */ .HEZ, {
                        className: "w-8 h-8 text-error-600"
                    }),
                    title: "Access Denied",
                    description: "You don't have permission to access this page.",
                    action: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                        variant: "outline",
                        onClick: ()=>router.push("/"),
                        children: "Go Home"
                    })
                };
        }
    };
    const { icon, title, description, action } = getContent();
    const content = /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
        className: "w-full max-w-md",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                className: "text-center",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4",
                        children: icon
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                        className: "text-xl",
                        children: title
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardDescription */ .SZ, {
                        children: description
                    })
                ]
            }),
            user && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                className: "text-center",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "p-3 bg-gray-50 rounded-md",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            className: "text-sm text-gray-600",
                            children: [
                                "Signed in as: ",
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                    className: "font-medium",
                                    children: user.email
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                            className: "text-sm text-gray-600",
                            children: [
                                "Role: ",
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                    className: "font-medium capitalize",
                                    children: user.role
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardFooter */ .eW, {
                className: "flex flex-col space-y-2",
                children: [
                    action,
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                        variant: "ghost",
                        size: "sm",
                        onClick: ()=>router.push("/auth/logout"),
                        className: "text-gray-600",
                        children: "Sign out"
                    })
                ]
            })
        ]
    });
    if (!fallbackLayout) {
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
            className: className,
            children: content
        });
    }
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_8__.cn)("min-h-screen flex items-center justify-center bg-gray-50 p-4", className),
        children: content
    });
}
// Higher-order component for protecting pages
function withAuth(Component, options = {}) {
    const WrappedComponent = (props)=>/*#__PURE__*/ _jsx(ProtectedRoute, {
            ...options,
            children: /*#__PURE__*/ _jsx(Component, {
                ...props
            })
        });
    WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
// Hook for checking permissions in components
function usePermissions() {
    const { checkPermission, checkRole, user } = useAuth();
    return {
        checkPermission,
        checkRole,
        hasRole: (role)=>checkRole(role),
        hasPermission: (permission)=>checkPermission(permission),
        hasAnyRole: (roles)=>roles.some((role)=>checkRole(role)),
        hasAllPermissions: (permissions)=>permissions.every((permission)=>checkPermission(permission)),
        user
    };
}
function RequireAuth({ children, fallback = null }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? /*#__PURE__*/ _jsx(_Fragment, {
        children: children
    }) : /*#__PURE__*/ _jsx(_Fragment, {
        children: fallback
    });
}
function RequireRole({ children, roles, fallback = null }) {
    const { hasAnyRole } = usePermissions();
    return hasAnyRole(roles) ? /*#__PURE__*/ _jsx(_Fragment, {
        children: children
    }) : /*#__PURE__*/ _jsx(_Fragment, {
        children: fallback
    });
}
function RequirePermission({ children, permissions, fallback = null }) {
    const { hasAllPermissions } = usePermissions();
    return hasAllPermissions(permissions) ? /*#__PURE__*/ _jsx(_Fragment, {
        children: children
    }) : /*#__PURE__*/ _jsx(_Fragment, {
        children: fallback
    });
}


/***/ })

};
;