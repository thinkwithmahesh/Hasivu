(() => {
var exports = {};
exports.id = 2596;
exports.ids = [2596];
exports.modules = {

/***/ 18038:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/react");

/***/ }),

/***/ 98704:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/react-dom/server-rendering-stub");

/***/ }),

/***/ 97897:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/react-server-dom-webpack/client");

/***/ }),

/***/ 56786:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/react/jsx-runtime");

/***/ }),

/***/ 5868:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/app-render");

/***/ }),

/***/ 41844:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/get-segment-param");

/***/ }),

/***/ 96624:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/future/helpers/interception-routes");

/***/ }),

/***/ 75281:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/future/route-modules/route-module");

/***/ }),

/***/ 57085:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/app-router-context");

/***/ }),

/***/ 20199:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/hash");

/***/ }),

/***/ 39569:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/hooks-client-context");

/***/ }),

/***/ 30893:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/add-path-prefix");

/***/ }),

/***/ 17887:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/handle-smooth-scroll");

/***/ }),

/***/ 98735:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/is-bot");

/***/ }),

/***/ 68231:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/parse-path");

/***/ }),

/***/ 53750:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/router/utils/remove-trailing-slash");

/***/ }),

/***/ 79618:
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/shared/lib/server-inserted-html");

/***/ }),

/***/ 34059:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GlobalError: () => (/* reexport safe */ next_dist_client_components_error_boundary__WEBPACK_IMPORTED_MODULE_1__.GlobalError),
/* harmony export */   __next_app__: () => (/* binding */ __next_app__),
/* harmony export */   originalPathname: () => (/* binding */ originalPathname),
/* harmony export */   pages: () => (/* binding */ pages),
/* harmony export */   routeModule: () => (/* binding */ routeModule),
/* harmony export */   tree: () => (/* binding */ tree)
/* harmony export */ });
/* harmony import */ var next_dist_server_future_route_modules_app_page_module__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(7262);
/* harmony import */ var next_dist_server_future_route_modules_app_page_module__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_page_module__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var next_dist_client_components_error_boundary__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(31823);
/* harmony import */ var next_dist_client_components_error_boundary__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_dist_client_components_error_boundary__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_dist_server_app_render_entry_base__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(12502);
/* harmony import */ var next_dist_server_app_render_entry_base__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_app_render_entry_base__WEBPACK_IMPORTED_MODULE_2__);
/* harmony reexport (unknown) */ var __WEBPACK_REEXPORT_OBJECT__ = {};
/* harmony reexport (unknown) */ for(const __WEBPACK_IMPORT_KEY__ in next_dist_server_app_render_entry_base__WEBPACK_IMPORTED_MODULE_2__) if(["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(__WEBPACK_IMPORT_KEY__) < 0) __WEBPACK_REEXPORT_OBJECT__[__WEBPACK_IMPORT_KEY__] = () => next_dist_server_app_render_entry_base__WEBPACK_IMPORTED_MODULE_2__[__WEBPACK_IMPORT_KEY__]
/* harmony reexport (unknown) */ __webpack_require__.d(__webpack_exports__, __WEBPACK_REEXPORT_OBJECT__);

    

    const tree = {
        children: [
        '',
        {
        children: [
        'daily-menu',
        {
        children: ['__PAGE__', {}, {
          page: [() => Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 45628)), "/Users/mahesha/Downloads/hasivu-platform/web/src/app/daily-menu/page.tsx"],
          
        }]
      },
        {
          
          
        }
      ]
      },
        {
          'layout': [() => Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 30819)), "/Users/mahesha/Downloads/hasivu-platform/web/src/app/layout.tsx"],
          
        }
      ]
      }.children;
    const pages = ["/Users/mahesha/Downloads/hasivu-platform/web/src/app/daily-menu/page.tsx"];

    

    const originalPathname = "/daily-menu/page"
    const __next_app__ = {
      require: __webpack_require__,
      // all modules are in the entry chunk, so we never actually need to load chunks in webpack
      loadChunk: () => Promise.resolve()
    }

    

    // Create and export the route module that will be consumed.
    const options = {"definition":{"kind":"APP_PAGE","page":"/daily-menu/page","pathname":"/daily-menu","bundlePath":"app/daily-menu/page","filename":"","appPaths":[]}}
    const routeModule = new (next_dist_server_future_route_modules_app_page_module__WEBPACK_IMPORTED_MODULE_0___default())({
      ...options,
      userland: {
        loaderTree: tree,
      },
    })
  

/***/ }),

/***/ 21623:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 92693))

/***/ }),

/***/ 92693:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  DailyMenuDisplay: () => (/* binding */ DailyMenuDisplay)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: external "next/dist/compiled/react"
var react_ = __webpack_require__(18038);
// EXTERNAL MODULE: ./node_modules/date-fns/esm/format/index.js + 31 modules
var format = __webpack_require__(42165);
// EXTERNAL MODULE: ./node_modules/date-fns/esm/addDays/index.js
var addDays = __webpack_require__(73709);
// EXTERNAL MODULE: ./node_modules/date-fns/esm/subDays/index.js
var subDays = __webpack_require__(82642);
// EXTERNAL MODULE: ./node_modules/lucide-react/dist/cjs/lucide-react.js
var lucide_react = __webpack_require__(51158);
// EXTERNAL MODULE: ./src/components/ui/button.tsx
var ui_button = __webpack_require__(29256);
// EXTERNAL MODULE: ./src/components/ui/card.tsx
var card = __webpack_require__(58003);
// EXTERNAL MODULE: ./src/components/ui/badge.tsx
var badge = __webpack_require__(5114);
// EXTERNAL MODULE: ./src/lib/utils.ts
var utils = __webpack_require__(12019);
;// CONCATENATED MODULE: ./src/components/ui/skeleton.tsx


function Skeleton({ className, ...props }) {
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        className: (0,utils.cn)("animate-pulse rounded-md bg-muted", className),
        ...props
    });
}


// EXTERNAL MODULE: ./src/components/ui/alert.tsx
var ui_alert = __webpack_require__(92663);
;// CONCATENATED MODULE: ./src/hooks/useDailyMenu.ts
/**
 * HASIVU Platform - Daily Menu Hook
 * Custom hook for managing daily menu data and operations
 */ 
const useDailyMenu = ()=>{
    const [currentMenu, setCurrentMenu] = (0,react_.useState)(null);
    const [selectedDate, setSelectedDate] = (0,react_.useState)(new Date().toISOString().split("T")[0]);
    const [isLoading, setIsLoading] = (0,react_.useState)(false);
    const [isLoadingWeekly] = (0,react_.useState)(false);
    const [error, setError] = (0,react_.useState)(null);
    const loadDailyMenu = (0,react_.useCallback)(async (schoolId, date)=>{
        setIsLoading(true);
        setError(null);
        try {
            // In production, this would make an API call
            // For now, return mock data
            const mockMenu = {
                date,
                menus: [
                    {
                        id: "1",
                        category: "Breakfast",
                        isActive: true,
                        notes: "Fresh and nutritious breakfast options",
                        availableQuantity: 150,
                        menuItems: [
                            {
                                id: "b1",
                                name: "Idli with Sambar",
                                description: "Traditional South Indian breakfast",
                                price: 25,
                                category: "Breakfast",
                                available: true,
                                preparationTime: 10,
                                allergens: [
                                    "gluten"
                                ],
                                nutritionalInfo: {
                                    calories: 180,
                                    protein: 6,
                                    carbs: 35,
                                    fat: 3
                                }
                            },
                            {
                                id: "b2",
                                name: "Poha",
                                description: "Flattened rice with vegetables",
                                price: 20,
                                category: "Breakfast",
                                available: true,
                                preparationTime: 8,
                                allergens: [],
                                nutritionalInfo: {
                                    calories: 150,
                                    protein: 4,
                                    carbs: 30,
                                    fat: 2
                                }
                            }
                        ]
                    },
                    {
                        id: "2",
                        category: "Lunch",
                        isActive: true,
                        notes: "Balanced lunch with vegetables and protein",
                        availableQuantity: 200,
                        menuItems: [
                            {
                                id: "l1",
                                name: "Rice with Dal and Vegetables",
                                description: "Complete meal with rice, lentils, and seasonal vegetables",
                                price: 40,
                                category: "Lunch",
                                available: true,
                                preparationTime: 15,
                                allergens: [],
                                nutritionalInfo: {
                                    calories: 350,
                                    protein: 12,
                                    carbs: 65,
                                    fat: 8
                                }
                            }
                        ]
                    }
                ]
            };
            setCurrentMenu(mockMenu);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load menu");
        } finally{
            setIsLoading(false);
        }
    }, []);
    const selectDate = (0,react_.useCallback)((date)=>{
        setSelectedDate(date);
    }, []);
    const refreshMenu = (0,react_.useCallback)(async (schoolId)=>{
        await loadDailyMenu(schoolId, selectedDate);
    }, [
        loadDailyMenu,
        selectedDate
    ]);
    const dismissError = (0,react_.useCallback)(()=>{
        setError(null);
    }, []);
    // Load menu when selectedDate changes
    (0,react_.useEffect)(()=>{
        if (selectedDate) {
        // Note: In a real implementation, we'd need the schoolId here
        // For now, we'll skip auto-loading and let components call loadDailyMenu explicitly
        }
    }, [
        selectedDate
    ]);
    const selectedDateMenus = currentMenu?.menus || [];
    const hasMenuForSelectedDate = selectedDateMenus.length > 0;
    const isEmpty = !isLoading && !hasMenuForSelectedDate && !error;
    const hasError = !!error;
    return {
        currentMenu,
        selectedDate,
        selectedDateMenus,
        isLoading,
        isLoadingWeekly,
        error,
        hasMenuForSelectedDate,
        isEmpty,
        hasError,
        loadDailyMenu,
        selectDate,
        refreshMenu,
        dismissError
    };
};

// EXTERNAL MODULE: ./src/lib/api-client.ts
var api_client = __webpack_require__(58225);
;// CONCATENATED MODULE: ./src/hooks/useAuth.ts
/* __next_internal_client_entry_do_not_use__ useAuth,default auto */ 

function useAuth() {
    const [user, setUser] = (0,react_.useState)(null);
    const [isLoading, setIsLoading] = (0,react_.useState)(true);
    const [error, setError] = (0,react_.useState)(null);
    const isAuthenticated = Boolean(user);
    // Initialize authentication state
    (0,react_.useEffect)(()=>{
        initializeAuth();
    }, []);
    const initializeAuth = async ()=>{
        try {
            setIsLoading(true);
            // Check if we have a token
            const token =  false ? 0 : null;
            if (!token) {
                setIsLoading(false);
                return;
            }
            // Verify the token and get current user
            const response = await api_client/* default */.ZP.getCurrentUser();
            if (response.success && response.data?.user) {
                setUser(response.data.user);
                setError(null);
            } else {
                // Token might be invalid, try to refresh
                const refreshResponse = await api_client/* default */.ZP.refreshToken();
                if (refreshResponse.success) {
                    // Try to get user again after refresh
                    const userResponse = await api_client/* default */.ZP.getCurrentUser();
                    if (userResponse.success && userResponse.data?.user) {
                        setUser(userResponse.data.user);
                        setError(null);
                    }
                } else {
                    // Refresh failed, clear tokens
                    api_client/* default */.ZP.clearToken();
                    setUser(null);
                }
            }
        } catch (error) {
            api_client/* default */.ZP.clearToken();
            setUser(null);
            setError("Authentication initialization failed");
        } finally{
            setIsLoading(false);
        }
    };
    const login = async (credentials)=>{
        try {
            setIsLoading(true);
            setError(null);
            const response = await api_client/* default */.ZP.login(credentials);
            if (response.success && response.user) {
                setUser(response.user);
                setError(null);
                return {
                    success: true,
                    message: response.message
                };
            } else {
                const errorMessage = response.error || response.message || "Login failed";
                setError(errorMessage);
                return {
                    success: false,
                    message: errorMessage
                };
            }
        } catch (error) {
            const errorMessage = "Login failed. Please try again.";
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage
            };
        } finally{
            setIsLoading(false);
        }
    };
    const register = async (userData)=>{
        try {
            setIsLoading(true);
            setError(null);
            const response = await api_client/* default */.ZP.register(userData);
            if (response.success) {
                // Registration successful - typically user needs to verify email
                return {
                    success: true,
                    message: response.message || "Registration successful"
                };
            } else {
                const errorMessage = response.error || response.message || "Registration failed";
                setError(errorMessage);
                return {
                    success: false,
                    message: errorMessage
                };
            }
        } catch (error) {
            const errorMessage = "Registration failed. Please try again.";
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage
            };
        } finally{
            setIsLoading(false);
        }
    };
    const logout = async ()=>{
        try {
            setIsLoading(true);
            // Call API logout
            await api_client/* default */.ZP.logout();
        } catch (error) {} finally{
            // Always clear local state regardless of API response
            setUser(null);
            setError(null);
            setIsLoading(false);
        }
    };
    const refreshUser = async ()=>{
        if (!isAuthenticated) return;
        try {
            const response = await api_client/* default */.ZP.getCurrentUser();
            if (response.success && response.data?.user) {
                setUser(response.data.user);
                setError(null);
            } else {
                // If getting current user fails, try refresh token
                const refreshResponse = await api_client/* default */.ZP.refreshToken();
                if (refreshResponse.success) {
                    const userResponse = await api_client/* default */.ZP.getCurrentUser();
                    if (userResponse.success && userResponse.data?.user) {
                        setUser(userResponse.data.user);
                        setError(null);
                    }
                } else {
                    // Refresh failed, user needs to login again
                    await logout();
                }
            }
        } catch (error) {
            setError("Session expired. Please login again.");
        }
    };
    const clearError = ()=>{
        setError(null);
    };
    // Auto-refresh user data periodically (every 15 minutes)
    (0,react_.useEffect)(()=>{
        if (!isAuthenticated) return;
        const interval = setInterval(()=>{
            refreshUser();
        }, 15 * 60 * 1000); // 15 minutes
        return ()=>clearInterval(interval);
    }, [
        isAuthenticated
    ]);
    return {
        // State
        user,
        isLoading,
        isAuthenticated,
        error,
        // Actions
        login,
        register,
        logout,
        refreshUser,
        clearError
    };
}
/* harmony default export */ const hooks_useAuth = ((/* unused pure expression or super */ null && (useAuth)));

;// CONCATENATED MODULE: ./src/components/DailyMenuDisplay.tsx
/**
 * Daily Menu Display Component
 * Displays daily menus with date selection and menu management
 */ /* __next_internal_client_entry_do_not_use__ DailyMenuDisplay auto */ 












const DailyMenuDisplay = ({ schoolId, className = "" })=>{
    const { user } = useAuth();
    const { currentMenu: _currentMenu, selectedDate, selectedDateMenus, isLoading, isLoadingWeekly: _isLoadingWeekly, error, hasMenuForSelectedDate: _hasMenuForSelectedDate, isEmpty, hasError, loadDailyMenu, selectDate, refreshMenu, dismissError } = useDailyMenu();
    const [showDatePicker, setShowDatePicker] = (0,react_.useState)(false);
    // Load menu for selected date on mount and when date changes
    (0,react_.useEffect)(()=>{
        if (schoolId && selectedDate) {
            loadDailyMenu(schoolId, selectedDate);
        }
    }, [
        schoolId,
        selectedDate,
        loadDailyMenu
    ]);
    const handleDateChange = (newDate)=>{
        selectDate(newDate);
        setShowDatePicker(false);
    };
    const handlePreviousDay = ()=>{
        const prevDate = (0,subDays/* default */.Z)(new Date(selectedDate), 1);
        selectDate((0,format/* default */.Z)(prevDate, "yyyy-MM-dd"));
    };
    const handleNextDay = ()=>{
        const nextDate = (0,addDays/* default */.Z)(new Date(selectedDate), 1);
        selectDate((0,format/* default */.Z)(nextDate, "yyyy-MM-dd"));
    };
    const handleRefresh = ()=>{
        refreshMenu(schoolId);
    };
    const formatDisplayDate = (dateString)=>{
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = (0,addDays/* default */.Z)(today, 1);
        const yesterday = (0,subDays/* default */.Z)(today, 1);
        if ((0,format/* default */.Z)(date, "yyyy-MM-dd") === (0,format/* default */.Z)(today, "yyyy-MM-dd")) {
            return "Today";
        }
        if ((0,format/* default */.Z)(date, "yyyy-MM-dd") === (0,format/* default */.Z)(tomorrow, "yyyy-MM-dd")) {
            return "Tomorrow";
        }
        if ((0,format/* default */.Z)(date, "yyyy-MM-dd") === (0,format/* default */.Z)(yesterday, "yyyy-MM-dd")) {
            return "Yesterday";
        }
        return (0,format/* default */.Z)(date, "EEEE, MMMM d, yyyy");
    };
    const getMenuStatusColor = (isActive)=>{
        return isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800";
    };
    const getMenuStatusText = (isActive)=>{
        return isActive ? "Active" : "Inactive";
    };
    if (hasError && error) {
        return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_alert/* Alert */.bZ, {
            variant: "destructive",
            className: className,
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertCircle */.bG7, {
                    className: "h-4 w-4"
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_alert/* AlertDescription */.X, {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx("span", {
                            children: error
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                            variant: "outline",
                            size: "sm",
                            onClick: dismissError,
                            className: "ml-2",
                            children: "Dismiss"
                        })
                    ]
                })
            ]
        });
    }
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: `space-y-6 ${className}`,
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* Card */.Zb, {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* CardHeader */.Ol, {
                        className: "pb-4",
                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    className: "flex items-center space-x-4",
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: handlePreviousDay,
                                            disabled: isLoading,
                                            children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronLeft */.s$$, {
                                                className: "h-4 w-4"
                                            })
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                            className: "text-center",
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx("h2", {
                                                    className: "text-2xl font-bold text-gray-900",
                                                    children: formatDisplayDate(selectedDate)
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                    className: "text-sm text-gray-500",
                                                    children: (0,format/* default */.Z)(new Date(selectedDate), "yyyy-MM-dd")
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: handleNextDay,
                                            disabled: isLoading,
                                            children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronRight */._Qn, {
                                                className: "h-4 w-4"
                                            })
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_button/* Button */.z, {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: ()=>setShowDatePicker(!showDatePicker),
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Calendar */.faS, {
                                                    className: "h-4 w-4 mr-2"
                                                }),
                                                "Pick Date"
                                            ]
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                            variant: "outline",
                                            size: "sm",
                                            onClick: handleRefresh,
                                            disabled: isLoading,
                                            children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* RefreshCw */.oQ9, {
                                                className: `h-4 w-4 ${isLoading ? "animate-spin" : ""}`
                                            })
                                        })
                                    ]
                                })
                            ]
                        })
                    }),
                    showDatePicker && /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                        className: "pt-0",
                        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            className: "grid grid-cols-7 gap-2 mb-4",
                            children: Array.from({
                                length: 31
                            }, (_, i)=>{
                                const date = (0,addDays/* default */.Z)(new Date(), i - 15);
                                const dateString = (0,format/* default */.Z)(date, "yyyy-MM-dd");
                                const isSelected = dateString === selectedDate;
                                const isToday = (0,format/* default */.Z)(date, "yyyy-MM-dd") === (0,format/* default */.Z)(new Date(), "yyyy-MM-dd");
                                return /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: isSelected ? "default" : "outline",
                                    size: "sm",
                                    className: `h-8 w-8 p-0 ${isToday ? "ring-2 ring-blue-500" : ""}`,
                                    onClick: ()=>handleDateChange(dateString),
                                    children: (0,format/* default */.Z)(date, "d")
                                }, dateString);
                            })
                        })
                    })
                ]
            }),
            isLoading ? /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                    className: "p-6",
                    children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(Skeleton, {
                                className: "h-8 w-48"
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "space-y-3",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(Skeleton, {
                                        className: "h-4 w-full"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(Skeleton, {
                                        className: "h-4 w-3/4"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(Skeleton, {
                                        className: "h-4 w-1/2"
                                    })
                                ]
                            })
                        ]
                    })
                })
            }) : isEmpty ? /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                    className: "p-6 text-center",
                    children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "flex flex-col items-center space-y-4",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertCircle */.bG7, {
                                className: "h-12 w-12 text-gray-400"
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("h3", {
                                        className: "text-lg font-medium text-gray-900",
                                        children: "No Menu Available"
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                        className: "text-gray-500 mt-1",
                                        children: [
                                            "There is no menu scheduled for ",
                                            formatDisplayDate(selectedDate).toLowerCase(),
                                            "."
                                        ]
                                    })
                                ]
                            }),
                            user?.role === "admin" && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_button/* Button */.z, {
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Plus */.v37, {
                                        className: "h-4 w-4 mr-2"
                                    }),
                                    "Create Menu"
                                ]
                            })
                        ]
                    })
                })
            }) : /*#__PURE__*/ jsx_runtime_.jsx("div", {
                className: "space-y-4",
                children: selectedDateMenus.map((menu)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* Card */.Zb, {
                        className: "overflow-hidden",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardHeader */.Ol, {
                                className: "pb-4",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "flex items-center justify-between",
                                        children: [
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                className: "flex items-center space-x-3",
                                                children: [
                                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardTitle */.ll, {
                                                        className: "text-xl",
                                                        children: [
                                                            menu.category,
                                                            " Menu"
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx(badge/* Badge */.C, {
                                                        className: getMenuStatusColor(menu.isActive),
                                                        children: getMenuStatusText(menu.isActive)
                                                    })
                                                ]
                                            }),
                                            user?.role === "admin" && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                className: "flex items-center space-x-2",
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                                        variant: "outline",
                                                        size: "sm",
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Edit */.I8b, {
                                                            className: "h-4 w-4"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                                        variant: "outline",
                                                        size: "sm",
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Copy */.CKM, {
                                                            className: "h-4 w-4"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                                        variant: "outline",
                                                        size: "sm",
                                                        className: "text-red-600 hover:text-red-700",
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Trash2 */.VhS, {
                                                            className: "h-4 w-4"
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    menu.notes && /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                        className: "text-sm text-gray-600 mt-2",
                                        children: menu.notes
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardContent */.aY, {
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                                        children: menu.menuItems.map((item)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                                                children: [
                                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                        className: "flex-1",
                                                        children: [
                                                            /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                                                                className: "font-medium text-gray-900",
                                                                children: item.name
                                                            }),
                                                            item.description && /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                                className: "text-sm text-gray-600 mt-1",
                                                                children: item.description
                                                            }),
                                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                                className: "flex items-center space-x-4 mt-2 text-xs text-gray-500",
                                                                children: [
                                                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                                        className: "flex items-center",
                                                                        children: [
                                                                            /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Clock */.SUY, {
                                                                                className: "h-3 w-3 mr-1"
                                                                            }),
                                                                            item.preparationTime,
                                                                            "min"
                                                                        ]
                                                                    }),
                                                                    item.allergens && item.allergens.length > 0 && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                                        className: "flex items-center",
                                                                        children: [
                                                                            /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertCircle */.bG7, {
                                                                                className: "h-3 w-3 mr-1"
                                                                            }),
                                                                            "Allergens"
                                                                        ]
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                        className: "text-right",
                                                        children: [
                                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                                                className: "font-semibold text-gray-900",
                                                                children: [
                                                                    "₹",
                                                                    item.price
                                                                ]
                                                            }),
                                                            !item.available && /*#__PURE__*/ jsx_runtime_.jsx(badge/* Badge */.C, {
                                                                variant: "secondary",
                                                                className: "mt-1",
                                                                children: "Unavailable"
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }, item.id))
                                    }),
                                    menu.availableQuantity && /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                        className: "mt-4 pt-4 border-t border-gray-200",
                                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                            className: "flex items-center justify-between text-sm",
                                            children: [
                                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                    className: "flex items-center text-gray-600",
                                                    children: [
                                                        /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Users */.Qaw, {
                                                            className: "h-4 w-4 mr-2"
                                                        }),
                                                        "Available Quantity"
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                    className: "font-medium",
                                                    children: [
                                                        menu.availableQuantity,
                                                        " servings"
                                                    ]
                                                })
                                            ]
                                        })
                                    })
                                ]
                            })
                        ]
                    }, menu.id))
            })
        ]
    });
};


/***/ }),

/***/ 45628:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ DailyMenuPage),
  metadata: () => (/* binding */ metadata)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: ./node_modules/next/dist/compiled/react/react.shared-subset.js
var react_shared_subset = __webpack_require__(62947);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(61363);
;// CONCATENATED MODULE: ./src/components/DailyMenuDisplay.tsx

const proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/DailyMenuDisplay.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;

const e0 = proxy["DailyMenuDisplay"];

;// CONCATENATED MODULE: ./src/app/daily-menu/page.tsx
/**
 * Daily Menu Page
 * Displays daily menus with date selection and management capabilities
 */ 


// This would typically come from auth context or props
const getCurrentSchoolId = ()=>{
    // In a real app, this would come from user context or URL params
    return "school-123";
};
const metadata = {
    title: "Daily Menu | HASIVU Platform",
    description: "View and manage daily menus for your school"
};
function DailyMenuPage() {
    const schoolId = getCurrentSchoolId();
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "container mx-auto px-4 py-8",
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "mb-8",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("h1", {
                        className: "text-3xl font-bold text-gray-900 mb-2",
                        children: "Daily Menu"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                        className: "text-gray-600",
                        children: "View and manage daily menus for your school. Select a date to see available menus."
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(e0, {
                schoolId: schoolId
            })
        ]
    });
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2947,6302,3490,6753,1473,9423,5114,2663], () => (__webpack_exec__(34059)));
module.exports = __webpack_exports__;

})();