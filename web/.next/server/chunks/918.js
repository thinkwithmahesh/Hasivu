exports.id = 918;
exports.ids = [918];
exports.modules = {

/***/ 64247:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 31232, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 52987, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 50831, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 56926, 23));
Promise.resolve(/* import() eager */).then(__webpack_require__.t.bind(__webpack_require__, 44282, 23))

/***/ }),

/***/ 14781:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 73680));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 33784));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 46373));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 24142));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 31207));
Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 1352))

/***/ }),

/***/ 1352:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AccessibilityProvider: () => (/* binding */ AccessibilityProvider),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   useAccessibility: () => (/* binding */ useAccessibility)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(57114);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_navigation__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(42452);
/* __next_internal_client_entry_do_not_use__ AccessibilityProvider,useAccessibility,default auto */ 
/**
 * HASIVU Platform - Accessibility Provider
 * Comprehensive accessibility management for WCAG 2.1 AA compliance
 */ 


const AccessibilityContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(undefined);
function AccessibilityProvider({ children }) {
    const [announcements, setAnnouncements] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)([]);
    const [pageAnnouncement, setPageAnnouncement] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)("");
    const [_focusedElement, setFocusedElement] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(null);
    const [isReducedMotion, setIsReducedMotion] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const [isHighContrast, setIsHighContrast] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const [fontSize, setFontSize] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)("medium");
    const _router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    const pathname = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.usePathname)();
    // Detect user preferences
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        // Check for reduced motion preference
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        setIsReducedMotion(mediaQuery.matches);
        const handleChange = (e)=>{
            setIsReducedMotion(e.matches);
        };
        mediaQuery.addEventListener("change", handleChange);
        // Check for high contrast preference
        const contrastQuery = window.matchMedia("(prefers-contrast: high)");
        setIsHighContrast(contrastQuery.matches);
        const handleContrastChange = (e)=>{
            setIsHighContrast(e.matches);
        };
        contrastQuery.addEventListener("change", handleContrastChange);
        // Load font size preference
        const savedFontSize = localStorage.getItem("hasivu-font-size");
        if (savedFontSize) {
            setFontSize(savedFontSize);
            document.documentElement.classList.remove("text-sm", "text-base", "text-lg");
            document.documentElement.classList.add(savedFontSize === "small" ? "text-sm" : savedFontSize === "large" ? "text-lg" : "text-base");
        }
        return ()=>{
            mediaQuery.removeEventListener("change", handleChange);
            contrastQuery.removeEventListener("change", handleContrastChange);
        };
    }, []);
    // Handle font size changes
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        localStorage.setItem("hasivu-font-size", fontSize);
        document.documentElement.classList.remove("text-sm", "text-base", "text-lg");
        document.documentElement.classList.add(fontSize === "small" ? "text-sm" : fontSize === "large" ? "text-lg" : "text-base");
    }, [
        fontSize
    ]);
    // Announce page changes
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        const pageName = getPageName(pathname);
        if (pageName) {
            announcePageChange(pageName);
        }
    }, [
        pathname
    ]);
    // Keyboard navigation handler
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        const handleKeyDown = (event)=>{
            // Skip to main content (Alt + M)
            if (event.altKey && event.key.toLowerCase() === "m") {
                event.preventDefault();
                const mainContent = document.getElementById("main-content");
                if (mainContent) {
                    mainContent.focus();
                    mainContent.scrollIntoView({
                        behavior: "smooth"
                    });
                    announceMessage("Navigated to main content", "polite");
                }
            }
            // Skip to navigation (Alt + N)
            if (event.altKey && event.key.toLowerCase() === "n") {
                event.preventDefault();
                const nav = document.querySelector("nav") || document.querySelector('[role="navigation"]');
                if (nav) {
                    const focusable = nav.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
                    if (focusable) {
                        focusable.focus();
                        focusable.scrollIntoView({
                            behavior: "smooth"
                        });
                        announceMessage("Navigated to main navigation", "polite");
                    }
                }
            }
            // Increase font size (Alt + Plus)
            if (event.altKey && event.key === "=") {
                event.preventDefault();
                if (fontSize === "small") setFontSize("medium");
                else if (fontSize === "medium") setFontSize("large");
                announceMessage(`Font size: ${fontSize === "small" ? "medium" : "large"}`, "polite");
            }
            // Decrease font size (Alt + Minus)
            if (event.altKey && event.key === "-") {
                event.preventDefault();
                if (fontSize === "large") setFontSize("medium");
                else if (fontSize === "medium") setFontSize("small");
                announceMessage(`Font size: ${fontSize === "large" ? "medium" : "small"}`, "polite");
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return ()=>document.removeEventListener("keydown", handleKeyDown);
    }, [
        fontSize
    ]);
    const announceMessage = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((message, priority = "polite")=>{
        const id = Date.now().toString();
        setAnnouncements((prev)=>[
                ...prev,
                {
                    id,
                    message,
                    priority
                }
            ]);
        // Clear announcement after 5 seconds
        setTimeout(()=>{
            setAnnouncements((prev)=>prev.filter((announcement)=>announcement.id !== id));
        }, 5000);
    }, []);
    const announcePageChange = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((pageName)=>{
        setPageAnnouncement(`Page changed to: ${pageName}`);
        // Clear page announcement after 3 seconds
        setTimeout(()=>{
            setPageAnnouncement("");
        }, 3000);
    }, []);
    const value = {
        announceMessage,
        announcePageChange,
        setFocusedElement,
        isReducedMotion,
        isHighContrast,
        fontSize,
        setFontSize: (size)=>{
            setFontSize(size);
            announceMessage(`Font size changed to ${size}`, "polite");
        }
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(AccessibilityContext.Provider, {
        value: value,
        children: [
            children,
            announcements.map((announcement)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_3__/* .LiveRegion */ .LE, {
                    politeness: announcement.priority,
                    children: announcement.message
                }, announcement.id)),
            pageAnnouncement && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_ScreenReaderOnly__WEBPACK_IMPORTED_MODULE_3__/* .StatusMessage */ .Am, {
                message: pageAnnouncement,
                type: "status"
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "sr-only",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        children: "Keyboard shortcuts available:"
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("ul", {
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                children: "Alt + M: Skip to main content"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                children: "Alt + N: Skip to navigation"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                children: "Alt + Plus: Increase font size"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("li", {
                                children: "Alt + Minus: Decrease font size"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
function useAccessibility() {
    const context = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AccessibilityContext);
    if (context === undefined) {
        throw new Error("useAccessibility must be used within an AccessibilityProvider");
    }
    return context;
}
function getPageName(pathname) {
    const routes = {
        "/": "Home",
        "/menu": "Menu",
        "/dashboard": "Dashboard",
        "/dashboard/admin": "Administrator Dashboard",
        "/dashboard/teacher": "Teacher Dashboard",
        "/dashboard/parent": "Parent Dashboard",
        "/dashboard/student": "Student Dashboard",
        "/orders": "Order Management",
        "/profile": "Profile",
        "/settings": "Settings",
        "/auth/login": "Login",
        "/auth/register": "Registration"
    };
    return routes[pathname] || `Page: ${pathname.split("/").pop() || "Unknown"}`;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AccessibilityProvider);


/***/ }),

/***/ 42452:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Am: () => (/* binding */ StatusMessage),
/* harmony export */   LE: () => (/* binding */ LiveRegion),
/* harmony export */   uy: () => (/* binding */ ScreenReaderOnly)
/* harmony export */ });
/* unused harmony exports SkipToContent, LoadingAnnouncement */
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12019);
/**
 * Screen Reader Only Component
 * Content visible only to screen readers and assistive technologies
 * WCAG 2.1 AA Compliance - Supporting screen reader navigation
 */ 


const ScreenReaderOnly = ({ children, className, as: Component = "span" })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Component, {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)(// Visually hidden but accessible to screen readers
        "sr-only", // Alternative implementation for better compatibility
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0", // Ensure it doesn't affect layout
        "clip-path-[inset(50%)]", className),
        style: {
            // Fallback for browsers that don't support clip-path
            clip: "rect(0, 0, 0, 0)",
            clipPath: "inset(50%)"
        },
        children: children
    });
};
const LiveRegion = ({ children, politeness = "polite", atomic = false, relevant = "additions text", className })=>{
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_2__.cn)("sr-only", className),
        "aria-live": politeness,
        "aria-atomic": atomic,
        "aria-relevant": relevant,
        role: "status",
        children: children
    });
};
const StatusMessage = ({ message, type = "status", show = true })=>{
    if (!show || !message) return null;
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
        className: "sr-only",
        role: type,
        "aria-live": type === "alert" ? "assertive" : "polite",
        "aria-atomic": "true",
        children: message
    });
};
const SkipToContent = ({ targetId = "main-content", label = "Skip to main content", className })=>{
    return /*#__PURE__*/ _jsx("a", {
        href: `#${targetId}`,
        className: cn(// Hidden until focused
        "absolute top-0 left-0 -translate-y-full", "focus:translate-y-0 z-[9999]", // HASIVU brand styling for skip links
        "bg-hasivu-primary-600 hover:bg-hasivu-primary-700 text-white px-4 py-2", "transition-all duration-200 shadow-lg", "focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2", "font-medium text-sm rounded-md", className),
        onClick: (e)=>{
            const target = document.getElementById(targetId);
            if (target) {
                e.preventDefault();
                target.focus();
                target.scrollIntoView({
                    behavior: "smooth"
                });
            }
        },
        children: label
    });
};
const LoadingAnnouncement = ({ isLoading, loadingText = "Loading content...", completedText = "Content loaded.", delay = 1000 })=>{
    const [announced, setAnnounced] = React.useState(false);
    const [showCompleted, setShowCompleted] = React.useState(false);
    React.useEffect(()=>{
        let timer;
        if (isLoading && !announced) {
            timer = setTimeout(()=>{
                setAnnounced(true);
            }, delay);
        }
        if (!isLoading && announced) {
            setShowCompleted(true);
            setAnnounced(false);
            timer = setTimeout(()=>{
                setShowCompleted(false);
            }, 3000);
        }
        return ()=>clearTimeout(timer);
    }, [
        isLoading,
        announced,
        delay
    ]);
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            isLoading && announced && /*#__PURE__*/ _jsx(LiveRegion, {
                politeness: "polite",
                children: loadingText
            }),
            showCompleted && /*#__PURE__*/ _jsx(LiveRegion, {
                politeness: "polite",
                children: completedText
            })
        ]
    });
};
/* unused harmony default export */ var __WEBPACK_DEFAULT_EXPORT__ = ((/* unused pure expression or super */ null && (ScreenReaderOnly)));


/***/ }),

/***/ 46373:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  ReduxProvider: () => (/* binding */ ReduxProvider)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: ./node_modules/react-redux/lib/index.js
var lib = __webpack_require__(8250);
// EXTERNAL MODULE: ./node_modules/redux-persist/lib/integration/react.js
var react = __webpack_require__(45067);
// EXTERNAL MODULE: ./node_modules/@reduxjs/toolkit/dist/redux-toolkit.cjs.production.min.js
var redux_toolkit_cjs_production_min = __webpack_require__(91388);
// EXTERNAL MODULE: ./node_modules/redux-persist/lib/index.js
var redux_persist_lib = __webpack_require__(22502);
// EXTERNAL MODULE: ./node_modules/redux-persist/lib/storage/index.js
var storage = __webpack_require__(66001);
// EXTERNAL MODULE: ./src/lib/api-client.ts
var api_client = __webpack_require__(58225);
;// CONCATENATED MODULE: ./src/store/slices/authSlice.ts
/**
 * HASIVU Platform - Authentication Redux Slice
 * User authentication state management with backend integration
 * Production-ready with proper error handling and token management
 */ 

// Async thunks for API integration
const loginUser = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("auth/loginUser", async (credentials, { rejectWithValue })=>{
    try {
        const response = await api_client/* default */.ZP.login(credentials);
        if (response.success && response.user) {
            return {
                user: response.user,
                token: response.tokens?.accessToken || null,
                refreshToken: response.tokens?.refreshToken || null,
                message: response.message
            };
        } else {
            return rejectWithValue(response.error || "Login failed");
        }
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Login failed");
    }
});
const refreshToken = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("auth/refreshToken", async (_, { rejectWithValue })=>{
    try {
        const response = await api_client/* default */.ZP.refreshToken();
        if (response.success) {
            return {
                token: response.accessToken,
                refreshToken: response.refreshToken
            };
        } else {
            return rejectWithValue(response.message || "Token refresh failed");
        }
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Token refresh failed");
    }
});
const logoutUser = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("auth/logoutUser", async (_, { rejectWithValue: _rejectWithValue })=>{
    try {
        await api_client/* default */.ZP.logout();
        return true;
    } catch (error) {
        // Even if API call fails, we should clear local state
        return true;
    }
});
const getCurrentUser = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("auth/getCurrentUser", async (_, { rejectWithValue })=>{
    try {
        const response = await api_client/* default */.ZP.getCurrentUser();
        if (response.success && response.data?.user) {
            return response.data.user;
        } else {
            return rejectWithValue(response.error || "Failed to get current user");
        }
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to get current user");
    }
});
// Initial state
const initialState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    lastActivity: Date.now()
};
// Auth slice
const authSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "auth",
    initialState,
    reducers: {
        clearError: (state)=>{
            state.error = null;
        },
        updateLastActivity: (state)=>{
            state.lastActivity = Date.now();
        },
        updateUserProfile: (state, action)=>{
            if (state.user) {
                state.user = {
                    ...state.user,
                    ...action.payload
                };
            }
        },
        clearAuth: (state)=>{
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = null;
            state.lastActivity = Date.now();
        },
        setLoading: (state, action)=>{
            state.isLoading = action.payload;
        }
    },
    extraReducers: (builder)=>{
        // Login
        builder.addCase(loginUser.pending, (state)=>{
            state.isLoading = true;
            state.error = null;
        }).addCase(loginUser.fulfilled, (state, action)=>{
            state.isLoading = false;
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.isAuthenticated = true;
            state.error = null;
            state.lastActivity = Date.now();
        }).addCase(loginUser.rejected, (state, action)=>{
            state.isLoading = false;
            state.error = action.payload;
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        });
        // Token refresh
        builder.addCase(refreshToken.pending, (state)=>{
            state.isLoading = true;
        }).addCase(refreshToken.fulfilled, (state, action)=>{
            state.isLoading = false;
            state.token = action.payload.token;
            state.refreshToken = action.payload.refreshToken;
            state.lastActivity = Date.now();
            state.error = null;
        }).addCase(refreshToken.rejected, (state)=>{
            state.isLoading = false;
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.error = "Session expired. Please login again.";
        });
        // Logout
        builder.addCase(logoutUser.pending, (state)=>{
            state.isLoading = true;
        }).addCase(logoutUser.fulfilled, (state)=>{
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        }).addCase(logoutUser.rejected, (state)=>{
            // Even if logout fails, clear local state
            state.user = null;
            state.token = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.error = null;
        });
        // Get current user
        builder.addCase(getCurrentUser.pending, (state)=>{
            state.isLoading = true;
        }).addCase(getCurrentUser.fulfilled, (state, action)=>{
            state.isLoading = false;
            state.user = action.payload;
            state.isAuthenticated = true;
            state.error = null;
            state.lastActivity = Date.now();
        }).addCase(getCurrentUser.rejected, (state, action)=>{
            state.isLoading = false;
            state.error = action.payload;
        // Don't clear auth state here - let the app decide
        });
    }
});
const { clearError, updateLastActivity, updateUserProfile, clearAuth, setLoading } = authSlice.actions;
/* harmony default export */ const slices_authSlice = (authSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/orderSlice.ts
/**
 * HASIVU Platform - Order Management Redux Slice
 * Production-ready order management with API integration
 */ 

// Async thunks
const fetchOrders = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("orders/fetchOrders", async (_, { rejectWithValue })=>{
    try {
        const response = await api_client/* default */.ZP.getOrders();
        if (response.success) {
            return response.data || [];
        } else {
            return rejectWithValue(response.error || "Failed to fetch orders");
        }
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch orders");
    }
});
const createOrder = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("orders/createOrder", async (orderData, { rejectWithValue })=>{
    try {
        const response = await api_client/* default */.ZP.createOrder(orderData);
        if (response.success) {
            return response.data;
        } else {
            return rejectWithValue(response.error || "Failed to create order");
        }
    } catch (error) {
        return rejectWithValue(error instanceof Error ? error.message : "Failed to create order");
    }
});
// Initial state
const orderSlice_initialState = {
    orders: [],
    currentOrder: null,
    activeOrders: [],
    isLoading: false,
    isCreating: false,
    error: null,
    lastUpdated: null
};
// Order slice
const orderSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "orders",
    initialState: orderSlice_initialState,
    reducers: {
        clearError: (state)=>{
            state.error = null;
        },
        setCurrentOrder: (state, action)=>{
            state.currentOrder = action.payload;
        },
        updateOrderStatus: (state, action)=>{
            const { orderId, status } = action.payload;
            // Update in all orders
            const orderIndex = state.orders.findIndex((order)=>order.id === orderId);
            if (orderIndex !== -1) {
                state.orders[orderIndex].status = status;
            }
            // Update current order
            if (state.currentOrder?.id === orderId) {
                state.currentOrder.status = status;
            }
            // Update active orders
            const activeIndex = state.activeOrders.findIndex((order)=>order.id === orderId);
            if (activeIndex !== -1) {
                state.activeOrders[activeIndex].status = status;
            }
            state.lastUpdated = new Date().toISOString();
        }
    },
    extraReducers: (builder)=>{
        // Fetch orders
        builder.addCase(fetchOrders.pending, (state)=>{
            state.isLoading = true;
            state.error = null;
        }).addCase(fetchOrders.fulfilled, (state, action)=>{
            state.isLoading = false;
            state.orders = action.payload;
            state.activeOrders = action.payload.filter((order)=>![
                    "delivered",
                    "cancelled"
                ].includes(order.status));
            state.lastUpdated = new Date().toISOString();
        }).addCase(fetchOrders.rejected, (state, action)=>{
            state.isLoading = false;
            state.error = action.payload;
        });
        // Create order
        builder.addCase(createOrder.pending, (state)=>{
            state.isCreating = true;
            state.error = null;
        }).addCase(createOrder.fulfilled, (state, action)=>{
            state.isCreating = false;
            state.orders.unshift(action.payload);
            state.activeOrders.unshift(action.payload);
            state.currentOrder = action.payload;
            state.lastUpdated = new Date().toISOString();
        }).addCase(createOrder.rejected, (state, action)=>{
            state.isCreating = false;
            state.error = action.payload;
        });
    }
});
const { clearError: orderSlice_clearError, setCurrentOrder, updateOrderStatus } = orderSlice.actions;
// Selectors
const selectOrders = (state)=>state.orders.orders;
const selectCurrentOrder = (state)=>state.orders.currentOrder;
const selectActiveOrders = (state)=>state.orders.activeOrders;
const selectOrdersLoading = (state)=>state.orders.isLoading;
const selectIsCreatingOrder = (state)=>state.orders.isCreating;
const selectOrdersError = (state)=>state.orders.error;
/* harmony default export */ const slices_orderSlice = (orderSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/menuSlice.ts
/**
 * HASIVU Platform - Menu Management Redux Slice
 */ 

const fetchMenuItems = (0,redux_toolkit_cjs_production_min.createAsyncThunk)("menu/fetchMenuItems", async (_, { rejectWithValue })=>{
    try {
        const response = await api_client/* default */.ZP.getMenuItems();
        return response.success ? response.data || [] : [];
    } catch (error) {
        return rejectWithValue("Failed to fetch menu items");
    }
});
const menuSlice_initialState = {
    items: [],
    categories: [],
    isLoading: false,
    error: null
};
const menuSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "menu",
    initialState: menuSlice_initialState,
    reducers: {
        clearError: (state)=>{
            state.error = null;
        }
    },
    extraReducers: (builder)=>{
        builder.addCase(fetchMenuItems.pending, (state)=>{
            state.isLoading = true;
            state.error = null;
        }).addCase(fetchMenuItems.fulfilled, (state, action)=>{
            state.isLoading = false;
            state.items = action.payload;
            state.categories = [
                ...new Set(action.payload.map((item)=>item.category))
            ];
        }).addCase(fetchMenuItems.rejected, (state, action)=>{
            state.isLoading = false;
            state.error = action.payload;
        });
    }
});
const { clearError: menuSlice_clearError } = menuSlice.actions;
/* harmony default export */ const slices_menuSlice = (menuSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/notificationSlice.ts

const notificationSlice_initialState = {
    notifications: [],
    unreadCount: 0
};
const notificationSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "notification",
    initialState: notificationSlice_initialState,
    reducers: {
        addNotification: (state, action)=>{
            state.notifications.unshift(action.payload);
            state.unreadCount++;
        }
    }
});
const { addNotification } = notificationSlice.actions;
/* harmony default export */ const slices_notificationSlice = (notificationSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/paymentSlice.ts

const paymentSlice_initialState = {
    isProcessing: false,
    error: null
};
const paymentSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "payment",
    initialState: paymentSlice_initialState,
    reducers: {
        clearError: (state)=>{
            state.error = null;
        }
    }
});
const { clearError: paymentSlice_clearError } = paymentSlice.actions;
/* harmony default export */ const slices_paymentSlice = (paymentSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/rfidSlice.ts

const rfidSlice_initialState = {
    isConnected: false,
    error: null
};
const rfidSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "rfid",
    initialState: rfidSlice_initialState,
    reducers: {
        setConnected: (state, action)=>{
            state.isConnected = action.payload;
        }
    }
});
const { setConnected } = rfidSlice.actions;
/* harmony default export */ const slices_rfidSlice = (rfidSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/analyticsSlice.ts

const analyticsSlice_initialState = {
    data: [],
    isLoading: false
};
const analyticsSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "analytics",
    initialState: analyticsSlice_initialState,
    reducers: {
        setLoading: (state, action)=>{
            state.isLoading = action.payload;
        }
    }
});
const { setLoading: analyticsSlice_setLoading } = analyticsSlice.actions;
/* harmony default export */ const slices_analyticsSlice = (analyticsSlice.reducer);

;// CONCATENATED MODULE: ./src/store/slices/uiSlice.ts

const uiSlice_initialState = {
    theme: "light",
    language: "en",
    sidebarOpen: true,
    loading: false,
    error: null
};
const uiSlice = (0,redux_toolkit_cjs_production_min.createSlice)({
    name: "ui",
    initialState: uiSlice_initialState,
    reducers: {
        setTheme: (state, action)=>{
            state.theme = action.payload;
        },
        setLanguage: (state, action)=>{
            state.language = action.payload;
        },
        toggleSidebar: (state)=>{
            state.sidebarOpen = !state.sidebarOpen;
        },
        setLoading: (state, action)=>{
            state.loading = action.payload;
        },
        setError: (state, action)=>{
            state.error = action.payload;
        }
    }
});
const { setTheme, setLanguage, toggleSidebar, setLoading: uiSlice_setLoading, setError } = uiSlice.actions;
/* harmony default export */ const slices_uiSlice = (uiSlice.reducer);

;// CONCATENATED MODULE: ./src/store/index.ts
/**
 * HASIVU Platform - Redux Store Configuration
 * Centralized state management with Redux Toolkit and persistence
 * Production-ready configuration with error handling
 */ 



// Slice imports








// Root reducer
const rootReducer = (0,redux_toolkit_cjs_production_min.combineReducers)({
    auth: slices_authSlice,
    order: slices_orderSlice,
    menu: slices_menuSlice,
    notification: slices_notificationSlice,
    payment: slices_paymentSlice,
    rfid: slices_rfidSlice,
    analytics: slices_analyticsSlice,
    ui: slices_uiSlice
});
// Persist configuration
const persistConfig = {
    key: "root",
    storage: storage/* default */.Z,
    whitelist: [
        "auth",
        "ui"
    ],
    blacklist: [
        "order",
        "menu"
    ]
};
// Persisted reducer
const persistedReducer = (0,redux_persist_lib.persistReducer)(persistConfig, rootReducer);
// Store configuration
const store = (0,redux_toolkit_cjs_production_min.configureStore)({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware)=>getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    redux_persist_lib.FLUSH,
                    redux_persist_lib.REHYDRATE,
                    redux_persist_lib.PAUSE,
                    redux_persist_lib.PERSIST,
                    redux_persist_lib.PURGE,
                    redux_persist_lib.REGISTER
                ]
            }
        }),
    devTools: "production" !== "production"
});
// Persistor
const persistor = (0,redux_persist_lib.persistStore)(store);
// Typed hooks
const useAppDispatch = ()=>useDispatch();
const useAppSelector = (/* unused pure expression or super */ null && (useSelector));

;// CONCATENATED MODULE: ./src/components/providers/redux-provider.tsx
/* __next_internal_client_entry_do_not_use__ ReduxProvider auto */ 



function ReduxProvider({ children }) {
    return /*#__PURE__*/ jsx_runtime_.jsx(lib.Provider, {
        store: store,
        children: /*#__PURE__*/ jsx_runtime_.jsx(react/* PersistGate */.r, {
            loading: null,
            persistor: persistor,
            children: children
        })
    });
}


/***/ }),

/***/ 31207:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ThemeProvider: () => (/* binding */ ThemeProvider)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_themes__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(82288);
/* __next_internal_client_entry_do_not_use__ ThemeProvider auto */ 


function ThemeProvider({ children, ...props }) {
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(next_themes__WEBPACK_IMPORTED_MODULE_2__/* .ThemeProvider */ .f, {
        ...props,
        children: children
    });
}


/***/ }),

/***/ 24142:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   PaperShadersBackground: () => (/* binding */ PaperShadersBackground),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _paper_design_shaders_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(60509);
/* __next_internal_client_entry_do_not_use__ PaperShadersBackground,default auto */ 


const PaperShadersBackground = ()=>{
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "fixed inset-0 -z-10 overflow-hidden bg-black",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "absolute inset-0",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_paper_design_shaders_react__WEBPACK_IMPORTED_MODULE_2__/* .MeshGradient */ .bL, {
                    speed: 0.3,
                    colors: [
                        "#000000",
                        "#1a0133",
                        "#2d0a4e",
                        "#000000",
                        "#4c1d95",
                        "#7c3aed",
                        "#000000",
                        "#ffffff",
                        "#1a0133"
                    ],
                    style: {
                        width: "100%",
                        height: "100%",
                        opacity: 1
                    }
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "absolute inset-0",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_paper_design_shaders_react__WEBPACK_IMPORTED_MODULE_2__/* .MeshGradient */ .bL, {
                    speed: 0.2,
                    colors: [
                        "#000000",
                        "#3b0764",
                        "#581c87",
                        "#000000",
                        "#6b21a8",
                        "#8b5cf6",
                        "#000000",
                        "#f3f4f6",
                        "#1f0937"
                    ],
                    style: {
                        width: "100%",
                        height: "100%",
                        opacity: 0.6,
                        mixBlendMode: "overlay"
                    }
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "absolute inset-0 opacity-20",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_paper_design_shaders_react__WEBPACK_IMPORTED_MODULE_2__/* .MeshGradient */ .bL, {
                    speed: 0.15,
                    colors: [
                        "#000000",
                        "#ffffff",
                        "#8b5cf6",
                        "#000000",
                        "#c4b5fd",
                        "#1e1b4b",
                        "#000000",
                        "#ffffff",
                        "#0f0a1e"
                    ],
                    style: {
                        width: "100%",
                        height: "100%",
                        mixBlendMode: "soft-light"
                    }
                })
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (PaperShadersBackground);


/***/ }),

/***/ 33784:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Toaster: () => (/* binding */ Toaster)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_themes__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(82288);
/* harmony import */ var sonner__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(9941);
/* __next_internal_client_entry_do_not_use__ Toaster auto */ 


const Toaster = ({ ...props })=>{
    const { theme = "system" } = (0,next_themes__WEBPACK_IMPORTED_MODULE_1__/* .useTheme */ .F)();
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(sonner__WEBPACK_IMPORTED_MODULE_2__/* .Toaster */ .x7, {
        theme: theme,
        className: "toaster group",
        toastOptions: {
            classNames: {
                toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-950 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-gray-950 dark:group-[.toaster]:text-gray-50 dark:group-[.toaster]:border-gray-800",
                description: "group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400",
                actionButton: "group-[.toast]:bg-primary-500 group-[.toast]:text-white dark:group-[.toast]:bg-primary-400 dark:group-[.toast]:text-gray-950",
                cancelButton: "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-gray-800 dark:group-[.toast]:text-gray-400"
            }
        },
        ...props
    });
};



/***/ }),

/***/ 73680:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AuthProvider: () => (/* binding */ AuthProvider),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   useAuth: () => (/* binding */ useAuth),
/* harmony export */   useRoleGuard: () => (/* binding */ useRoleGuard),
/* harmony export */   withAuth: () => (/* binding */ withAuth)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(57114);
/* harmony import */ var next_navigation__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_navigation__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var react_hot_toast__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(10345);
/* harmony import */ var _services_auth_api_service__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(42897);
/* __next_internal_client_entry_do_not_use__ AuthProvider,useAuth,withAuth,useRoleGuard,default auto */ 
/**
 * HASIVU Platform - Production Authentication Context
 * With Real API Integration and Token Management
 */ 



const AuthContext = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_1__.createContext)(undefined);
function AuthProvider({ children }) {
    const [state, setState] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)({
        user: null,
        isAuthenticated: false,
        isLoading: true,
        isInitialized: false
    });
    const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    const authApi = new _services_auth_api_service__WEBPACK_IMPORTED_MODULE_4__/* .AuthApiService */ .Q();
    // Check authentication on mount
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        const initAuth = async ()=>{
            try {
                setState((prev)=>({
                        ...prev,
                        isLoading: true
                    }));
                const result = await authApi.checkAuth();
                if (result.authenticated && result.user) {
                    setState({
                        user: result.user,
                        isAuthenticated: true,
                        isLoading: false,
                        isInitialized: true
                    });
                } else {
                    setState({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                        isInitialized: true
                    });
                }
            } catch (error) {
                setState({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    isInitialized: true
                });
            }
        };
        initAuth();
    }, []);
    // Real API login method
    const login = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (credentials)=>{
        try {
            setState((prev)=>({
                    ...prev,
                    isLoading: true
                }));
            // Call real API
            const response = await authApi.login(credentials);
            if (response.success && response.user) {
                setState({
                    user: response.user,
                    isAuthenticated: true,
                    isLoading: false,
                    isInitialized: true
                });
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success(`Welcome back, ${response.user.firstName}!`);
                return true;
            } else {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(response.error || "Login failed");
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Login failed";
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(errorMessage);
            return false;
        } finally{
            setState((prev)=>({
                    ...prev,
                    isLoading: false
                }));
        }
    }, []);
    // Real API register method
    const register = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (userData)=>{
        try {
            setState((prev)=>({
                    ...prev,
                    isLoading: true
                }));
            // Call real API
            const response = await authApi.register({
                ...userData,
                passwordConfirm: userData.password
            });
            if (response.success && response.user) {
                setState({
                    user: response.user,
                    isAuthenticated: true,
                    isLoading: false,
                    isInitialized: true
                });
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success(`Welcome, ${response.user.firstName}!`);
                return true;
            } else {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(response.error || "Registration failed");
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Registration failed";
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(errorMessage);
            return false;
        } finally{
            setState((prev)=>({
                    ...prev,
                    isLoading: false
                }));
        }
    }, []);
    // Real API logout method
    const logout = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async ()=>{
        try {
            await authApi.logout();
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true
            });
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success("Logged out successfully");
            router.push("/");
        } catch (error) {
            // Still clear local state even if API call fails
            setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true
            });
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success("Logged out");
            router.push("/");
        }
    }, [
        router
    ]);
    // Real API update profile method
    const updateProfile = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (data)=>{
        if (!state.user) {
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error("You must be logged in");
            return false;
        }
        try {
            const response = await authApi.updateProfile(data);
            if (response.success && response.user) {
                setState((prev)=>({
                        ...prev,
                        user: response.user
                    }));
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success("Profile updated successfully");
                return true;
            } else {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(response.error || "Profile update failed");
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Update failed";
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(errorMessage);
            return false;
        }
    }, [
        state.user
    ]);
    // Real API change password method
    const changePassword = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (data)=>{
        // Validate passwords match
        if (data.newPassword !== data.newPasswordConfirm) {
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error("Passwords do not match");
            return false;
        }
        try {
            const response = await authApi.changePassword(data);
            if (response.success) {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success("Password changed successfully");
                return true;
            } else {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(response.error || "Password change failed");
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Password change failed";
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(errorMessage);
            return false;
        }
    }, []);
    // Real API refresh profile method
    const refreshProfile = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async ()=>{
        try {
            const user = await authApi.getProfile();
            if (user) {
                setState((prev)=>({
                        ...prev,
                        user: user
                    }));
            }
        } catch (error) {
        // Error handled silently
        }
    }, []);
    // Real API check auth method
    const checkAuth = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async ()=>{
        try {
            const result = await authApi.checkAuth();
            if (result.authenticated && result.user) {
                setState((prev)=>({
                        ...prev,
                        user: result.user,
                        isAuthenticated: true
                    }));
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    }, []);
    // Real API forgot password method
    const forgotPassword = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (email)=>{
        try {
            const response = await authApi.forgotPassword(email);
            if (response.success) {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success("Password reset instructions sent to your email");
                return true;
            } else {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(response.error || "Request failed");
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Request failed";
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(errorMessage);
            return false;
        }
    }, []);
    // Real API reset password method
    const resetPassword = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)(async (token, password, passwordConfirm)=>{
        if (password !== passwordConfirm) {
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error("Passwords do not match");
            return false;
        }
        try {
            const response = await authApi.resetPassword(token, password, passwordConfirm);
            if (response.success) {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.success("Password reset successful");
                return true;
            } else {
                react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(response.error || "Password reset failed");
                return false;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Reset failed";
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error(errorMessage);
            return false;
        }
    }, []);
    const hasRole = (0,react__WEBPACK_IMPORTED_MODULE_1__.useCallback)((role)=>{
        if (!state.user) return false;
        const userRole = state.user.role;
        if (Array.isArray(role)) {
            return role.includes(userRole);
        }
        return userRole === role;
    }, [
        state.user
    ]);
    const value = {
        ...state,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshProfile,
        checkAuth,
        forgotPassword,
        resetPassword,
        hasRole
    };
    return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(AuthContext.Provider, {
        value: value,
        children: children
    });
}
function useAuth() {
    const context = (0,react__WEBPACK_IMPORTED_MODULE_1__.useContext)(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
// Helper function to get dashboard URL based on role
function _getDashboardUrl(role) {
    const dashboardUrls = {
        admin: "/dashboard/admin",
        teacher: "/dashboard/teacher",
        parent: "/dashboard/parent",
        student: "/dashboard/student",
        vendor: "/dashboard/vendor",
        kitchen_staff: "/dashboard/kitchen"
    };
    return dashboardUrls[role] || "/dashboard";
}
// Higher-order component for protected routes
function withAuth(Component) {
    return function AuthenticatedComponent(props) {
        const { isAuthenticated, isLoading, isInitialized } = useAuth();
        const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
        (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
            if (isInitialized && !isLoading && !isAuthenticated) {
                const currentPath = router.asPath;
                router.push(`/auth/login?redirect=${encodeURIComponent(currentPath)}`);
            }
        }, [
            isAuthenticated,
            isLoading,
            isInitialized,
            router
        ]);
        if (!isInitialized || isLoading) {
            return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "flex items-center justify-center min-h-screen",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
                })
            });
        }
        if (!isAuthenticated) {
            return null;
        }
        return /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Component, {
            ...props
        });
    };
}
// Hook for role-based access control
function useRoleGuard(allowedRoles) {
    const { hasRole, isAuthenticated, isLoading } = useAuth();
    const router = (0,next_navigation__WEBPACK_IMPORTED_MODULE_2__.useRouter)();
    (0,react__WEBPACK_IMPORTED_MODULE_1__.useEffect)(()=>{
        if (!isLoading && isAuthenticated && !hasRole(allowedRoles)) {
            react_hot_toast__WEBPACK_IMPORTED_MODULE_3__/* .toast */ .Am.error("Access denied. Insufficient permissions.");
            router.push("/dashboard");
        }
    }, [
        hasRole,
        allowedRoles,
        isAuthenticated,
        isLoading,
        router
    ]);
    return {
        hasAccess: hasRole(allowedRoles),
        isLoading
    };
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (AuthContext);


/***/ }),

/***/ 58225:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports api, apiClient */
/**
 * API Client for HASIVU Platform
 * Handles communication with the backend Express server
 */ const API_BASE_URL = "http://localhost:3000/api" || 0;
// HTTP Client class
class APIClient {
    constructor(baseURL = API_BASE_URL){
        this.accessToken = null;
        this.csrfToken = null;
        this.baseURL = baseURL;
        // Load token from cookies on client-side
        if (false) {}
    }
    // Generate CSRF token
    generateCSRFToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
    // Helper method to get cookie value
    getCookie(name) {
        if (typeof document === "undefined") return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop()?.split(";").shift() || null;
        }
        return null;
    }
    // Helper method to set httpOnly cookie (server-side only)
    setCookie(name, value, options = {}) {
        // Note: httpOnly cookies can only be set server-side
        // For client-side, we'll use regular cookies with httpOnly=false
        if (typeof document !== "undefined") {
            let cookieString = `${name}=${value}`;
            if (options.maxAge) cookieString += `; max-age=${options.maxAge}`;
            if (options.secure !== false) cookieString += "; secure";
            if (options.sameSite) cookieString += `; samesite=${options.sameSite}`;
            document.cookie = cookieString;
        }
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers
            }
        };
        // Add authorization header if token exists
        if (this.accessToken) {
            config.headers = {
                ...config.headers,
                Authorization: `Bearer ${this.accessToken}`
            };
        }
        // Add CSRF token for auth endpoints
        if (this.csrfToken && endpoint.startsWith("/auth/") && (options.method === "POST" || options.method === "PUT" || options.method === "PATCH")) {
            config.headers = {
                ...config.headers,
                "X-CSRF-Token": this.csrfToken
            };
        }
        try {
            const response = await fetch(url, config);
            // Handle non-JSON responses
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                if (!response.ok) {
                    return {
                        success: false,
                        error: `HTTP ${response.status}: ${response.statusText}`
                    };
                }
                return {
                    success: true
                };
            }
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    error: data.message || data.error || `HTTP ${response.status}`,
                    ...data
                };
            }
            return {
                success: true,
                ...data
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Network error"
            };
        }
    }
    // Token management
    setToken(token) {
        this.accessToken = token;
        if (false) {}
    }
    clearToken() {
        this.accessToken = null;
        if (false) {}
    }
    // Authentication endpoints
    async login(credentials) {
        const response = await this.request("/auth/login", {
            method: "POST",
            body: JSON.stringify(credentials)
        });
        if (response.success && response.data?.tokens?.accessToken) {
            this.setToken(response.data.tokens.accessToken);
            // Store refresh token in cookie
            if (false) {}
        }
        return response;
    }
    async register(userData) {
        return this.request("/auth/register", {
            method: "POST",
            body: JSON.stringify(userData)
        });
    }
    async logout() {
        const response = await this.request("/auth/logout", {
            method: "POST"
        });
        this.clearToken();
        return response;
    }
    async logoutAll() {
        const response = await this.request("/auth/logout-all", {
            method: "POST"
        });
        this.clearToken();
        return response;
    }
    async forgotPassword(data) {
        return this.request("/auth/forgot-password", {
            method: "POST",
            body: JSON.stringify(data)
        });
    }
    async getCurrentUser() {
        return this.request("/auth/me");
    }
    async updateProfile(data) {
        return this.request("/auth/profile", {
            method: "PATCH",
            body: JSON.stringify(data)
        });
    }
    async changePassword(data) {
        return this.request("/auth/change-password", {
            method: "PATCH",
            body: JSON.stringify(data)
        });
    }
    async checkAuthStatus() {
        return this.request("/auth/status");
    }
    async refreshToken() {
        const refreshToken =  false ? 0 : null;
        if (!refreshToken) {
            return {
                success: false,
                message: "No refresh token available"
            };
        }
        const response = await this.request("/auth/refresh", {
            method: "POST",
            body: JSON.stringify({
                refreshToken
            })
        });
        if (response.success && response.data?.tokens?.accessToken) {
            this.setToken(response.data.tokens.accessToken);
        }
        return response;
    }
    async validatePassword(password) {
        return this.request("/auth/validate-password", {
            method: "POST",
            body: JSON.stringify({
                password
            })
        });
    }
    // Menu endpoints
    async getMenuItems() {
        return this.request("/menu/items");
    }
    async getMenuByDate(date) {
        return this.request(`/menu/daily?date=${encodeURIComponent(date)}`);
    }
    // Order endpoints
    async getOrders() {
        return this.request("/orders");
    }
    async createOrder(orderData) {
        return this.request("/orders", {
            method: "POST",
            body: JSON.stringify(orderData)
        });
    }
    async getOrderById(orderId) {
        return this.request(`/orders/${orderId}`);
    }
    async updateOrderStatus(orderId, status) {
        return this.request(`/orders/${orderId}/status`, {
            method: "PATCH",
            body: JSON.stringify({
                status
            })
        });
    }
    // Payment endpoints
    async processPayment(paymentData) {
        return this.request("/payments/process", {
            method: "POST",
            body: JSON.stringify(paymentData)
        });
    }
    async getPaymentHistory() {
        return this.request("/payments/history");
    }
    // Kitchen endpoints (for staff)
    async getKitchenOrders() {
        return this.request("/kitchen/orders");
    }
    async updateKitchenOrderStatus(orderId, status) {
        return this.request(`/kitchen/orders/${orderId}`, {
            method: "PATCH",
            body: JSON.stringify({
                status
            })
        });
    }
    // Admin endpoints
    async getUsers() {
        return this.request("/admin/users");
    }
    async updateUserRole(userId, role) {
        return this.request(`/admin/users/${userId}/role`, {
            method: "PATCH",
            body: JSON.stringify({
                role
            })
        });
    }
    async getSystemStats() {
        return this.request("/admin/stats");
    }
}
// Create singleton instance
const apiClient = new APIClient();
// Automatic token refresh on 401 errors
const originalRequest = apiClient["request"];
apiClient["request"] = async function(endpoint, options = {}) {
    const response = await originalRequest.call(this, endpoint, options);
    // If we get 401 and have a refresh token, try to refresh
    if (!response.success && response.error?.includes("401") && "undefined" !== "undefined") {}
    return response;
};
// Named exports for backward compatibility
const api = (/* unused pure expression or super */ null && (apiClient));

// Default export
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (apiClient);


/***/ }),

/***/ 12019:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   cn: () => (/* binding */ cn)
/* harmony export */ });
/* unused harmony exports formatCurrency, formatDate, formatTime, getInitials */
/* harmony import */ var clsx__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(10566);
/* harmony import */ var tailwind_merge__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(78126);


/**
 * Combines clsx and tailwind-merge for optimal class merging
 * This is the recommended utility function for ShadCN/UI components
 */ function cn(...inputs) {
    return (0,tailwind_merge__WEBPACK_IMPORTED_MODULE_0__/* .twMerge */ .m6)((0,clsx__WEBPACK_IMPORTED_MODULE_1__/* .clsx */ .W)(inputs));
}
/**
 * Format currency values for display
 */ function formatCurrency(value, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency
    }).format(value);
}
/**
 * Format date values
 */ function formatDate(date, format = "medium") {
    const dateObj = new Date(date);
    const options = {
        short: {
            month: "short",
            day: "numeric"
        },
        medium: {
            month: "short",
            day: "numeric",
            year: "numeric"
        },
        long: {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        }
    }[format];
    return new Intl.DateTimeFormat("en-IN", options).format(dateObj);
}
/**
 * Format time values
 */ function formatTime(date) {
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(dateObj);
}
/**
 * Get initials from a name string
 */ function getInitials(name) {
    return name.split(" ").map((word)=>word.charAt(0).toUpperCase()).slice(0, 2).join("");
}


/***/ }),

/***/ 42897:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   P: () => (/* binding */ authApiService),
/* harmony export */   Q: () => (/* binding */ AuthApiService)
/* harmony export */ });
/**
 * HASIVU Platform - Authentication API Service
 * Client-side authentication service for login, logout, and user management
 */ class AuthApiService {
    constructor(){
        this.refreshPromise = null;
        this.baseUrl = "http://localhost:3000/api" || 0;
    }
    /**
   * Login user with credentials
   */ async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(credentials)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Login failed");
            }
            const data = await response.json();
            return {
                user: data.user,
                tokens: data.tokens,
                success: true
            };
        } catch (error) {
            console.error("Login error:", error);
            throw error;
        }
    }
    /**
   * Register new user
   */ async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(userData)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Registration failed");
            }
            const data = await response.json();
            return {
                user: data.user,
                tokens: data.tokens,
                success: true
            };
        } catch (error) {
            console.error("Registration error:", error);
            throw error;
        }
    }
    /**
   * Logout user
   */ async logout() {
        try {
            const token = this.getAccessToken();
            if (token) {
                await fetch(`${this.baseUrl}/auth/logout`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            // Clear local storage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        } catch (error) {
            console.error("Logout error:", error);
            // Still clear local storage even if API call fails
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
        }
    }
    /**
   * Refresh access token
   */ async refreshToken() {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }
        this.refreshPromise = this._refreshToken();
        try {
            const tokens = await this.refreshPromise;
            return tokens;
        } finally{
            this.refreshPromise = null;
        }
    }
    async _refreshToken() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) {
            throw new Error("No refresh token available");
        }
        try {
            const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    refreshToken
                })
            });
            if (!response.ok) {
                throw new Error("Token refresh failed");
            }
            const tokens = await response.json();
            // Store new tokens
            localStorage.setItem("accessToken", tokens.accessToken);
            localStorage.setItem("refreshToken", tokens.refreshToken);
            return tokens;
        } catch (error) {
            // Clear tokens on refresh failure
            this.clearTokens();
            throw error;
        }
    }
    /**
   * Get current user profile
   */ async getCurrentUser() {
        try {
            const token = this.getAccessToken();
            if (!token) {
                throw new Error("No access token available");
            }
            const response = await fetch(`${this.baseUrl}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    // Try to refresh token
                    await this.refreshToken();
                    return this.getCurrentUser();
                }
                throw new Error("Failed to get user profile");
            }
            const user = await response.json();
            return user;
        } catch (error) {
            console.error("Get current user error:", error);
            throw error;
        }
    }
    /**
   * Request password reset
   */ async requestPasswordReset(data) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Password reset request failed");
            }
        } catch (error) {
            console.error("Password reset request error:", error);
            throw error;
        }
    }
    /**
   * Confirm password reset
   */ async confirmPasswordReset(data) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Password reset failed");
            }
        } catch (error) {
            console.error("Password reset confirm error:", error);
            throw error;
        }
    }
    /**
   * Verify email
   */ async verifyEmail(token) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/verify-email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token
                })
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Email verification failed");
            }
        } catch (error) {
            console.error("Email verification error:", error);
            throw error;
        }
    }
    /**
   * Check if user is authenticated
   */ isAuthenticated() {
        const token = this.getAccessToken();
        if (!token) return false;
        try {
            // Basic JWT validation (in production, use a proper JWT library)
            const payload = JSON.parse(atob(token.split(".")[1]));
            const currentTime = Date.now() / 1000;
            return payload.exp > currentTime;
        } catch  {
            return false;
        }
    }
    /**
   * Get access token from storage
   */ getAccessToken() {
        return localStorage.getItem("accessToken");
    }
    /**
   * Get refresh token from storage
   */ getRefreshToken() {
        return localStorage.getItem("refreshToken");
    }
    /**
   * Store tokens in local storage
   */ setTokens(tokens) {
        localStorage.setItem("accessToken", tokens.accessToken);
        localStorage.setItem("refreshToken", tokens.refreshToken);
    }
    /**
   * Clear all tokens
   */ clearTokens() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
    }
    /**
   * Get stored user data
   */ getStoredUser() {
        const userJson = localStorage.getItem("user");
        if (!userJson) return null;
        try {
            return JSON.parse(userJson);
        } catch  {
            return null;
        }
    }
    /**
   * Store user data
   */ setStoredUser(user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
}
// Export singleton instance
const authApiService = new AuthApiService();



/***/ }),

/***/ 30819:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ RootLayout),
  metadata: () => (/* binding */ metadata)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: ./node_modules/next/font/google/target.css?{"path":"src/app/layout.tsx","import":"Inter","arguments":[{"subsets":["latin"]}],"variableName":"inter"}
var layout_tsx_import_Inter_arguments_subsets_latin_variableName_inter_ = __webpack_require__(25856);
var layout_tsx_import_Inter_arguments_subsets_latin_variableName_inter_default = /*#__PURE__*/__webpack_require__.n(layout_tsx_import_Inter_arguments_subsets_latin_variableName_inter_);
// EXTERNAL MODULE: ./src/app/globals.css
var globals = __webpack_require__(5023);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(61363);
;// CONCATENATED MODULE: ./src/components/ui/sonner.tsx

const proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/ui/sonner.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;

const e0 = proxy["Toaster"];

;// CONCATENATED MODULE: ./src/components/providers/theme-provider.tsx

const theme_provider_proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/providers/theme-provider.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule: theme_provider_esModule, $$typeof: theme_provider_$$typeof } = theme_provider_proxy;
const theme_provider_default_ = theme_provider_proxy.default;

const theme_provider_e0 = theme_provider_proxy["ThemeProvider"];

;// CONCATENATED MODULE: ./src/components/providers/redux-provider.tsx

const redux_provider_proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/providers/redux-provider.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule: redux_provider_esModule, $$typeof: redux_provider_$$typeof } = redux_provider_proxy;
const redux_provider_default_ = redux_provider_proxy.default;

const redux_provider_e0 = redux_provider_proxy["ReduxProvider"];

;// CONCATENATED MODULE: ./src/contexts/auth-context.tsx

const auth_context_proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/contexts/auth-context.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule: auth_context_esModule, $$typeof: auth_context_$$typeof } = auth_context_proxy;
const auth_context_default_ = auth_context_proxy.default;

const auth_context_e0 = auth_context_proxy["AuthProvider"];

const e1 = auth_context_proxy["useAuth"];

const e2 = auth_context_proxy["withAuth"];

const e3 = auth_context_proxy["useRoleGuard"];


/* harmony default export */ const auth_context = ((/* unused pure expression or super */ null && (auth_context_default_)));
;// CONCATENATED MODULE: ./src/components/accessibility/AccessibilityProvider.tsx

const AccessibilityProvider_proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/accessibility/AccessibilityProvider.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule: AccessibilityProvider_esModule, $$typeof: AccessibilityProvider_$$typeof } = AccessibilityProvider_proxy;
const AccessibilityProvider_default_ = AccessibilityProvider_proxy.default;

const AccessibilityProvider_e0 = AccessibilityProvider_proxy["AccessibilityProvider"];

const AccessibilityProvider_e1 = AccessibilityProvider_proxy["useAccessibility"];


/* harmony default export */ const AccessibilityProvider = ((/* unused pure expression or super */ null && (AccessibilityProvider_default_)));
;// CONCATENATED MODULE: ./src/components/ui/paper-shaders-background.tsx

const paper_shaders_background_proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/ui/paper-shaders-background.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule: paper_shaders_background_esModule, $$typeof: paper_shaders_background_$$typeof } = paper_shaders_background_proxy;
const paper_shaders_background_default_ = paper_shaders_background_proxy.default;

const paper_shaders_background_e0 = paper_shaders_background_proxy["PaperShadersBackground"];


/* harmony default export */ const paper_shaders_background = (paper_shaders_background_default_);
// EXTERNAL MODULE: ./src/lib/seo.ts
var seo = __webpack_require__(14528);
;// CONCATENATED MODULE: ./src/app/layout.tsx










// Generate comprehensive production-ready metadata
const metadata = (0,seo/* generateBaseMetadata */.zR)();
function RootLayout({ children }) {
    // Generate structured data for SEO
    const organizationSchema = (0,seo/* generateOrganizationSchema */.w)();
    const webApplicationSchema = (0,seo/* generateWebApplicationSchema */.D5)();
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("html", {
        lang: "en",
        className: "scroll-smooth",
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("head", {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("script", {
                        type: "application/ld+json",
                        dangerouslySetInnerHTML: {
                            __html: JSON.stringify(organizationSchema)
                        }
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("script", {
                        type: "application/ld+json",
                        dangerouslySetInnerHTML: {
                            __html: JSON.stringify(webApplicationSchema)
                        }
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "dns-prefetch",
                        href: "//fonts.googleapis.com"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "dns-prefetch",
                        href: "//fonts.gstatic.com"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "dns-prefetch",
                        href: "//api.hasivu.com"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "preconnect",
                        href: "https://fonts.googleapis.com",
                        crossOrigin: ""
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "preconnect",
                        href: "https://fonts.gstatic.com",
                        crossOrigin: ""
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        httpEquiv: "X-Content-Type-Options",
                        content: "nosniff"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        httpEquiv: "X-Frame-Options",
                        content: "DENY"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        httpEquiv: "X-XSS-Protection",
                        content: "1; mode=block"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        httpEquiv: "Referrer-Policy",
                        content: "strict-origin-when-cross-origin"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "mobile-web-app-capable",
                        content: "yes"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "apple-mobile-web-app-capable",
                        content: "yes"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "apple-mobile-web-app-status-bar-style",
                        content: "default"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "apple-mobile-web-app-title",
                        content: "HASIVU"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "msapplication-TileColor",
                        content: "#2563eb"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("meta", {
                        name: "msapplication-config",
                        content: "/browserconfig.xml"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("link", {
                        rel: "preload",
                        href: "/fonts/inter.woff2",
                        as: "font",
                        type: "font/woff2",
                        crossOrigin: ""
                    }),
                     true && process.env.NEXT_PUBLIC_GA_ID && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx("script", {
                                async: true,
                                src: `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("script", {
                                dangerouslySetInnerHTML: {
                                    __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                    send_page_view: true,
                    anonymize_ip: true,
                    cookie_flags: 'max-age=7200;secure;samesite=strict'
                  });
                `
                                }
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("script", {
                        dangerouslySetInnerHTML: {
                            __html: `
              if ('serviceWorker' in navigator && '${"production"}' === 'production') {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(registration) {
                    })
                    .catch(function(registrationError) {
                    });
                });
              }
            `
                        }
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("body", {
                className: `${(layout_tsx_import_Inter_arguments_subsets_latin_variableName_inter_default()).className} font-sans antialiased bg-gradient-to-br from-hasivu-primary-25 via-white to-hasivu-secondary-25 selection:bg-hasivu-primary-100 selection:text-hasivu-primary-900`,
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(paper_shaders_background, {}),
                    /*#__PURE__*/ jsx_runtime_.jsx(redux_provider_e0, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(auth_context_e0, {
                            children: /*#__PURE__*/ jsx_runtime_.jsx(AccessibilityProvider_e0, {
                                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)(theme_provider_e0, {
                                    attribute: "class",
                                    defaultTheme: "light",
                                    enableSystem: true,
                                    disableTransitionOnChange: true,
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx("a", {
                                            href: "#main-content",
                                            className: "sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-hasivu-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-hasivu-primary-700 transition-colors",
                                            children: "Skip to main content"
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                            className: "min-h-screen relative flex flex-col",
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx("main", {
                                                    id: "main-content",
                                                    className: "flex-1",
                                                    tabIndex: -1,
                                                    children: children
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                    className: "pb-safe-bottom"
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx(e0, {
                                            richColors: true,
                                            position: "top-right",
                                            toastOptions: {
                                                duration: 4000,
                                                style: {
                                                    background: "white",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "0.75rem",
                                                    padding: "16px",
                                                    fontSize: "14px",
                                                    fontFamily: "inherit"
                                                },
                                                className: "shadow-lg"
                                            }
                                        })
                                    ]
                                })
                            })
                        })
                    })
                ]
            })
        ]
    });
}


/***/ }),

/***/ 14528:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   D5: () => (/* binding */ generateWebApplicationSchema),
/* harmony export */   w: () => (/* binding */ generateOrganizationSchema),
/* harmony export */   zR: () => (/* binding */ generateBaseMetadata)
/* harmony export */ });
/* unused harmony exports generatePageMetadata, generateBreadcrumbSchema, generateArticleSchema, generateFAQSchema, generateMetaTagsHTML, PAGE_METADATA, APP_CONFIG */
/**
 * HASIVU Platform - Production SEO Optimization System
 * Comprehensive SEO utilities for enhanced search engine visibility
 * Implements structured data, meta tags, and social media optimization
 */ // Base application configuration
const APP_CONFIG = {
    name: "HASIVU",
    fullName: "HASIVU - School Meal Management Platform",
    description: "Complete school meal management system with real-time ordering, nutrition tracking, RFID pickup verification, and seamless payment integration for students, parents, and administrators.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://hasivu.com",
    domain: process.env.NEXT_PUBLIC_DOMAIN || "hasivu.com",
    logo: "/icons/icon-512x512.png",
    author: "HASIVU Team",
    keywords: [
        "school meal management",
        "student food ordering",
        "RFID verification",
        "school nutrition tracking",
        "educational technology",
        "cafeteria management",
        "meal planning software",
        "school administration",
        "parent portal",
        "student services"
    ],
    category: "Education Technology",
    type: "SaaS Platform",
    locale: "en_US",
    twitter: "@hasivu_official",
    social: {
        twitter: "https://twitter.com/hasivu_official",
        linkedin: "https://linkedin.com/company/hasivu",
        facebook: "https://facebook.com/hasivu.official",
        youtube: "https://youtube.com/@hasivu"
    }
};
// Generate base metadata
function generateBaseMetadata() {
    return {
        title: {
            default: APP_CONFIG.fullName,
            template: `%s | ${APP_CONFIG.name}`
        },
        description: APP_CONFIG.description,
        applicationName: APP_CONFIG.name,
        authors: [
            {
                name: APP_CONFIG.author
            }
        ],
        creator: APP_CONFIG.author,
        publisher: APP_CONFIG.author,
        generator: "Next.js",
        keywords: APP_CONFIG.keywords,
        referrer: "origin-when-cross-origin",
        colorScheme: "light dark",
        viewport: {
            width: "device-width",
            initialScale: 1,
            maximumScale: 5,
            userScalable: true,
            viewportFit: "cover"
        },
        themeColor: [
            {
                media: "(prefers-color-scheme: light)",
                color: "#2563eb"
            },
            {
                media: "(prefers-color-scheme: dark)",
                color: "#1d4ed8"
            }
        ],
        manifest: "/manifest.json",
        appleWebApp: {
            capable: true,
            statusBarStyle: "default",
            title: APP_CONFIG.name,
            startupImage: [
                {
                    url: "/startup/iphone5.png",
                    media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
                },
                {
                    url: "/startup/iphone6.png",
                    media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
                },
                {
                    url: "/startup/iphoneplus.png",
                    media: "(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)"
                },
                {
                    url: "/startup/iphonex.png",
                    media: "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
                },
                {
                    url: "/startup/iphonexr.png",
                    media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)"
                },
                {
                    url: "/startup/iphonexsmax.png",
                    media: "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)"
                },
                {
                    url: "/startup/ipad.png",
                    media: "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
                }
            ]
        },
        formatDetection: {
            email: false,
            address: false,
            telephone: false
        },
        metadataBase: new URL(APP_CONFIG.url),
        alternates: {
            canonical: APP_CONFIG.url,
            languages: {
                "en-US": "/en-US",
                "es-ES": "/es-ES",
                "fr-FR": "/fr-FR"
            }
        },
        openGraph: {
            type: "website",
            siteName: APP_CONFIG.fullName,
            title: APP_CONFIG.fullName,
            description: APP_CONFIG.description,
            url: APP_CONFIG.url,
            locale: APP_CONFIG.locale,
            images: [
                {
                    url: `${APP_CONFIG.url}/og/default.png`,
                    width: 1200,
                    height: 630,
                    alt: `${APP_CONFIG.name} - School Meal Management Platform`,
                    type: "image/png"
                },
                {
                    url: `${APP_CONFIG.url}/og/square.png`,
                    width: 1200,
                    height: 1200,
                    alt: `${APP_CONFIG.name} Logo`,
                    type: "image/png"
                }
            ]
        },
        twitter: {
            card: "summary_large_image",
            site: APP_CONFIG.twitter,
            creator: APP_CONFIG.twitter,
            title: APP_CONFIG.fullName,
            description: APP_CONFIG.description,
            images: [
                `${APP_CONFIG.url}/og/twitter.png`
            ]
        },
        robots: {
            index: true,
            follow: true,
            nocache: false,
            googleBot: {
                index: true,
                follow: true,
                noimageindex: false,
                "max-video-preview": -1,
                "max-image-preview": "large",
                "max-snippet": -1
            }
        },
        icons: {
            icon: [
                {
                    url: "/favicon.ico",
                    sizes: "32x32"
                },
                {
                    url: "/icons/icon-192x192.png",
                    sizes: "192x192",
                    type: "image/png"
                },
                {
                    url: "/icons/icon-512x512.png",
                    sizes: "512x512",
                    type: "image/png"
                }
            ],
            apple: [
                {
                    url: "/icons/apple-touch-icon.png",
                    sizes: "180x180",
                    type: "image/png"
                }
            ],
            shortcut: "/favicon.ico"
        },
        verification: {
            google: process.env.GOOGLE_SITE_VERIFICATION,
            yandex: process.env.YANDEX_VERIFICATION,
            yahoo: process.env.YAHOO_SITE_VERIFICATION,
            other: {
                "facebook-domain-verification": process.env.FACEBOOK_DOMAIN_VERIFICATION || "",
                "p:domain_verify": process.env.PINTEREST_DOMAIN_VERIFICATION || ""
            }
        },
        category: APP_CONFIG.category,
        classification: APP_CONFIG.type,
        other: {
            "mobile-web-app-capable": "yes",
            "apple-mobile-web-app-capable": "yes",
            "apple-mobile-web-app-status-bar-style": "default",
            "msapplication-TileColor": "#2563eb",
            "msapplication-config": "/browserconfig.xml",
            "theme-color": "#2563eb"
        }
    };
}
// Generate page-specific metadata
function generatePageMetadata(config) {
    const fullTitle = config.title === APP_CONFIG.fullName ? config.title : `${config.title} | ${APP_CONFIG.name}`;
    const canonical = config.canonical || `${APP_CONFIG.url}${config.path}`;
    const pageUrl = `${APP_CONFIG.url}${config.path}`;
    const imageUrl = config.image ? `${APP_CONFIG.url}${config.image}` : `${APP_CONFIG.url}/og/default.png`;
    const metadata = {
        title: fullTitle,
        description: config.description,
        keywords: [
            ...APP_CONFIG.keywords,
            ...config.keywords || []
        ],
        alternates: {
            canonical
        },
        openGraph: {
            type: config.type || "website",
            title: fullTitle,
            description: config.description,
            url: pageUrl,
            siteName: APP_CONFIG.fullName,
            locale: APP_CONFIG.locale,
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: config.title
                }
            ],
            ...config.publishedTime && {
                publishedTime: config.publishedTime
            },
            ...config.modifiedTime && {
                modifiedTime: config.modifiedTime
            },
            ...config.author && {
                authors: [
                    config.author
                ]
            },
            ...config.section && {
                section: config.section
            },
            ...config.tags && {
                tags: config.tags
            }
        },
        twitter: {
            card: "summary_large_image",
            site: APP_CONFIG.twitter,
            creator: APP_CONFIG.twitter,
            title: fullTitle,
            description: config.description,
            images: [
                imageUrl
            ]
        },
        robots: {
            index: !config.noIndex,
            follow: !config.noFollow,
            googleBot: {
                index: !config.noIndex,
                follow: !config.noFollow
            }
        }
    };
    return metadata;
}
// Structured data generators
function generateOrganizationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: APP_CONFIG.fullName,
        alternateName: APP_CONFIG.name,
        url: APP_CONFIG.url,
        logo: `${APP_CONFIG.url}${APP_CONFIG.logo}`,
        description: APP_CONFIG.description,
        foundingDate: "2024",
        contactPoint: {
            "@type": "ContactPoint",
            telephone: "+1-800-HASIVU",
            contactType: "customer service",
            areaServed: "US",
            availableLanguage: [
                "English",
                "Spanish",
                "French"
            ]
        },
        sameAs: Object.values(APP_CONFIG.social),
        address: {
            "@type": "PostalAddress",
            addressCountry: "US"
        }
    };
}
function generateWebApplicationSchema() {
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: APP_CONFIG.fullName,
        alternateName: APP_CONFIG.name,
        url: APP_CONFIG.url,
        description: APP_CONFIG.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        softwareVersion: "1.0.0",
        offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
        },
        author: {
            "@type": "Organization",
            name: APP_CONFIG.author
        },
        screenshot: [
            `${APP_CONFIG.url}/screenshots/desktop-1.png`,
            `${APP_CONFIG.url}/screenshots/mobile-1.png`
        ],
        featureList: [
            "Real-time meal ordering",
            "RFID verification system",
            "Nutrition tracking",
            "Payment integration",
            "Parent portal",
            "Admin dashboard",
            "Multi-language support"
        ]
    };
}
function generateBreadcrumbSchema(items) {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index)=>({
                "@type": "ListItem",
                position: index + 1,
                name: item.name,
                item: `${APP_CONFIG.url}${item.url}`
            }))
    };
}
function generateArticleSchema(config) {
    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: config.title,
        description: config.description,
        image: `${APP_CONFIG.url}${config.image}`,
        author: {
            "@type": "Person",
            name: config.author
        },
        publisher: {
            "@type": "Organization",
            name: APP_CONFIG.fullName,
            logo: {
                "@type": "ImageObject",
                url: `${APP_CONFIG.url}${APP_CONFIG.logo}`
            }
        },
        datePublished: config.publishedTime,
        dateModified: config.modifiedTime || config.publishedTime,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${APP_CONFIG.url}${config.url}`
        },
        ...config.section && {
            articleSection: config.section
        },
        ...config.tags && {
            keywords: config.tags
        }
    };
}
function generateFAQSchema(faqs) {
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq)=>({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                    "@type": "Answer",
                    text: faq.answer
                }
            }))
    };
}
// Generate meta tags as HTML string (for dynamic insertion)
function generateMetaTagsHTML(config) {
    const canonical = config.canonical || `${APP_CONFIG.url}${config.path}`;
    const imageUrl = config.image ? `${APP_CONFIG.url}${config.image}` : `${APP_CONFIG.url}/og/default.png`;
    return `
    <!-- Basic Meta Tags -->
    <meta name="description" content="${config.description}" />
    <meta name="keywords" content="${[
        ...APP_CONFIG.keywords,
        ...config.keywords || []
    ].join(", ")}" />
    <meta name="author" content="${config.author || APP_CONFIG.author}" />
    <link rel="canonical" href="${canonical}" />
    
    <!-- Open Graph Meta Tags -->
    <meta property="og:type" content="${config.type || "website"}" />
    <meta property="og:title" content="${config.title}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="${APP_CONFIG.url}${config.path}" />
    <meta property="og:site_name" content="${APP_CONFIG.fullName}" />
    
    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="${APP_CONFIG.twitter}" />
    <meta name="twitter:title" content="${config.title}" />
    <meta name="twitter:description" content="${config.description}" />
    <meta name="twitter:image" content="${imageUrl}" />
    
    <!-- Robots -->
    <meta name="robots" content="${config.noIndex ? "noindex" : "index"},${config.noFollow ? "nofollow" : "follow"}" />
  `.trim();
}
// Pre-configured page metadata
const PAGE_METADATA = {
    home: {
        title: APP_CONFIG.fullName,
        description: APP_CONFIG.description,
        path: "/",
        keywords: [
            "school meals",
            "student portal",
            "food ordering",
            "education technology"
        ]
    },
    login: {
        title: "Sign In",
        description: "Sign in to your HASIVU account to order meals, track nutrition, and manage your school food experience.",
        path: "/login",
        keywords: [
            "login",
            "sign in",
            "student portal",
            "parent access"
        ],
        noIndex: true
    },
    dashboard: {
        title: "Dashboard",
        description: "Your HASIVU dashboard with real-time meal ordering, nutrition tracking, and account management.",
        path: "/dashboard",
        keywords: [
            "dashboard",
            "student portal",
            "meal orders",
            "nutrition tracking"
        ],
        noIndex: true
    },
    menu: {
        title: "Today's Menu",
        description: "Browse today's delicious and nutritious school meal options with detailed nutrition information.",
        path: "/menu",
        keywords: [
            "school menu",
            "meal options",
            "nutrition information",
            "food ordering"
        ]
    },
    orders: {
        title: "Order History",
        description: "View your complete meal order history with nutrition summaries and spending insights.",
        path: "/orders",
        keywords: [
            "order history",
            "meal orders",
            "nutrition tracking",
            "spending history"
        ],
        noIndex: true
    },
    wallet: {
        title: "Account Balance",
        description: "Manage your meal account balance, view transaction history, and add funds to your wallet.",
        path: "/wallet",
        keywords: [
            "account balance",
            "meal wallet",
            "payment history",
            "add funds"
        ],
        noIndex: true
    },
    nutrition: {
        title: "Nutrition Tracker",
        description: "Track your daily nutrition intake with detailed reports and personalized recommendations.",
        path: "/nutrition",
        keywords: [
            "nutrition tracking",
            "dietary analysis",
            "health monitoring",
            "meal planning"
        ],
        noIndex: true
    },
    support: {
        title: "Help & Support",
        description: "Get help with your HASIVU account, find answers to common questions, and contact support.",
        path: "/support",
        keywords: [
            "help",
            "support",
            "FAQ",
            "contact",
            "troubleshooting"
        ]
    },
    privacy: {
        title: "Privacy Policy",
        description: "Learn how HASIVU protects your privacy and handles your personal information.",
        path: "/privacy",
        keywords: [
            "privacy policy",
            "data protection",
            "user privacy",
            "information security"
        ]
    },
    terms: {
        title: "Terms of Service",
        description: "Read the terms of service for using the HASIVU school meal management platform.",
        path: "/terms",
        keywords: [
            "terms of service",
            "user agreement",
            "platform rules",
            "legal terms"
        ]
    }
};
// Export configuration for external use



/***/ }),

/***/ 5023:
/***/ (() => {



/***/ })

};
;