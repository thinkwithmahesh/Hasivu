(() => {
var exports = {};
exports.id = 7702;
exports.ids = [7702];
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

/***/ 23117:
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
        'dashboard',
        {
        children: ['__PAGE__', {}, {
          page: [() => Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 17482)), "/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/page.tsx"],
          
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
    const pages = ["/Users/mahesha/Downloads/hasivu-platform/web/src/app/dashboard/page.tsx"];

    

    const originalPathname = "/dashboard/page"
    const __next_app__ = {
      require: __webpack_require__,
      // all modules are in the entry chunk, so we never actually need to load chunks in webpack
      loadChunk: () => Promise.resolve()
    }

    

    // Create and export the route module that will be consumed.
    const options = {"definition":{"kind":"APP_PAGE","page":"/dashboard/page","pathname":"/dashboard","bundlePath":"app/dashboard/page","filename":"","appPaths":[]}}
    const routeModule = new (next_dist_server_future_route_modules_app_page_module__WEBPACK_IMPORTED_MODULE_0___default())({
      ...options,
      userland: {
        loaderTree: tree,
      },
    })
  

/***/ }),

/***/ 18527:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 45812))

/***/ }),

/***/ 45812:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ParentDashboard: () => (/* binding */ ParentDashboard),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var framer_motion__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(94571);
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(51158);
/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(29256);
/* harmony import */ var _components_ui_card__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(58003);
/* harmony import */ var _components_ui_badge__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5114);
/* harmony import */ var _components_ui_avatar__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(22452);
/* harmony import */ var _components_ui_progress__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(81707);
/* harmony import */ var _components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(25621);
/* harmony import */ var _components_ui_select__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(7848);
/* harmony import */ var _components_ui_input__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(17367);
/* harmony import */ var _components_ui_separator__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(33959);
/* __next_internal_client_entry_do_not_use__ ParentDashboard,default auto */ 
// Removed unused imports: useEffect, AnimatePresence, Users, Calendar, Filter, ChevronDown
// These imports were not used in the component, causing ESLint no-unused-vars errors












// Removed unused interfaces: Transaction and NutritionInsight
// These interfaces were defined but never used in the component, causing ESLint no-unused-vars errors
// Mock data for demonstration
const mockChildren = [
    {
        id: "1",
        name: "Priya Sharma",
        grade: "7th Grade",
        school: "DPS Bangalore East",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
        dietaryRestrictions: [
            "Vegetarian"
        ],
        favoriteItems: [
            "Masala Dosa",
            "Sambar Rice",
            "Coconut Chutney"
        ],
        nutritionScore: 87,
        weeklyStreak: 5,
        allergies: [
            "Nuts"
        ],
        preferences: {
            spiceLevel: "mild",
            cuisineType: [
                "South Indian",
                "North Indian"
            ],
            mealTime: "12:30 PM"
        }
    },
    {
        id: "2",
        name: "Arjun Sharma",
        grade: "4th Grade",
        school: "DPS Bangalore East",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
        dietaryRestrictions: [],
        favoriteItems: [
            "Chicken Biryani",
            "Roti",
            "Dal Makhani"
        ],
        nutritionScore: 92,
        weeklyStreak: 7,
        allergies: [],
        preferences: {
            spiceLevel: "medium",
            cuisineType: [
                "North Indian",
                "Continental"
            ],
            mealTime: "1:00 PM"
        }
    }
];
const mockOrders = [
    {
        id: "ORD-001",
        childId: "1",
        childName: "Priya Sharma",
        items: [
            {
                id: "1",
                name: "Masala Dosa with Sambar",
                quantity: 1,
                price: 85,
                category: "South Indian",
                nutritionInfo: {
                    calories: 320,
                    protein: 12,
                    carbs: 58,
                    fat: 8
                }
            }
        ],
        status: "delivered",
        orderTime: "2024-01-15T11:30:00Z",
        deliveryTime: "2024-01-15T12:45:00Z",
        totalAmount: 85,
        nutritionScore: 88,
        rfidVerified: true,
        photoProof: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=200&h=150&fit=crop"
    },
    {
        id: "ORD-002",
        childId: "2",
        childName: "Arjun Sharma",
        items: [
            {
                id: "2",
                name: "Chicken Biryani",
                quantity: 1,
                price: 120,
                category: "North Indian",
                nutritionInfo: {
                    calories: 450,
                    protein: 25,
                    carbs: 65,
                    fat: 15
                }
            }
        ],
        status: "preparing",
        orderTime: "2024-01-15T12:00:00Z",
        totalAmount: 120,
        nutritionScore: 85,
        rfidVerified: false
    }
];
// Multi-child selector component
const ChildSelector = ({ children, selectedChild, onSelect })=>{
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex flex-wrap gap-3 mb-6",
        children: [
            children.map((child)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(framer_motion__WEBPACK_IMPORTED_MODULE_11__/* .motion */ .E.button, {
                    onClick: ()=>onSelect(child),
                    className: `flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all duration-200 ${selectedChild?.id === child.id ? "border-hasivu-orange-500 bg-hasivu-orange-50 shadow-glow-orange" : "border-gray-200 bg-white hover:border-hasivu-orange-300 hover:bg-hasivu-orange-25"}`,
                    whileHover: {
                        scale: 1.02
                    },
                    whileTap: {
                        scale: 0.98
                    },
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_avatar__WEBPACK_IMPORTED_MODULE_5__/* .Avatar */ .qE, {
                            className: "w-12 h-12",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_avatar__WEBPACK_IMPORTED_MODULE_5__/* .AvatarImage */ .F$, {
                                    src: child.avatar,
                                    alt: child.name
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_avatar__WEBPACK_IMPORTED_MODULE_5__/* .AvatarFallback */ .Q5, {
                                    children: child.name.split(" ").map((n)=>n[0]).join("")
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "text-left",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "font-semibold text-gray-900",
                                    children: child.name
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "text-sm text-gray-500",
                                    children: child.grade
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "text-xs text-hasivu-green-600 font-medium",
                                    children: [
                                        child.weeklyStreak,
                                        " day streak"
                                    ]
                                })
                            ]
                        }),
                        selectedChild?.id === child.id && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CheckCircle */ .fU8, {
                            className: "w-5 h-5 text-hasivu-orange-500"
                        })
                    ]
                }, child.id)),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(framer_motion__WEBPACK_IMPORTED_MODULE_11__/* .motion */ .E.button, {
                className: "flex items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-hasivu-orange-300 hover:bg-hasivu-orange-25 transition-all duration-200 min-w-[120px]",
                whileHover: {
                    scale: 1.02
                },
                whileTap: {
                    scale: 0.98
                },
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "text-center",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Plus */ .v37, {
                            className: "w-6 h-6 text-gray-400 mx-auto mb-1"
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "text-sm font-medium text-gray-600",
                            children: "Add Child"
                        })
                    ]
                })
            })
        ]
    });
};
// Order status component with real-time updates
const OrderTracker = ({ order })=>{
    const getStatusColor = (status)=>{
        switch(status){
            case "ordered":
                return "text-blue-600 bg-blue-100";
            case "preparing":
                return "text-yellow-600 bg-yellow-100";
            case "ready":
                return "text-orange-600 bg-orange-100";
            case "delivered":
                return "text-green-600 bg-green-100";
            case "cancelled":
                return "text-red-600 bg-red-100";
            default:
                return "text-gray-600 bg-gray-100";
        }
    };
    const getStatusSteps = ()=>{
        const steps = [
            {
                key: "ordered",
                label: "Order Placed",
                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .ShoppingCart */ .yTB
            },
            {
                key: "preparing",
                label: "Preparing",
                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Utensils */ .qT0
            },
            {
                key: "ready",
                label: "Ready",
                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Bell */ .Uos
            },
            {
                key: "delivered",
                label: "Delivered",
                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CheckCircle */ .fU8
            }
        ];
        return steps;
    };
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
        className: "hover:shadow-soft transition-shadow",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                className: "pb-4",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                    className: "text-lg",
                                    children: order.childName
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardDescription */ .SZ, {
                                    children: [
                                        "Order #",
                                        order.id
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                            className: getStatusColor(order.status),
                            children: order.status.charAt(0).toUpperCase() + order.status.slice(1)
                        })
                    ]
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "space-y-2",
                        children: order.items.map((item)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                className: "font-medium",
                                                children: item.name
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                className: "text-sm text-gray-500 ml-2",
                                                children: [
                                                    "\xd7",
                                                    item.quantity
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                        className: "font-semibold",
                                        children: [
                                            "Rs.",
                                            item.price
                                        ]
                                    })
                                ]
                            }, item.id))
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_separator__WEBPACK_IMPORTED_MODULE_10__/* .Separator */ .Z, {}),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "space-y-2",
                        children: getStatusSteps().map((step, _index)=>{
                            // Changed unused 'index' parameter to '_index' to comply with ESLint no-unused-vars rule
                            // The index was not used in the map function, so prefixed with underscore
                            const isActive = order.status === step.key;
                            const isCompleted = [
                                "ordered",
                                "preparing",
                                "ready",
                                "delivered"
                            ].indexOf(order.status) >= [
                                "ordered",
                                "preparing",
                                "ready",
                                "delivered"
                            ].indexOf(step.key);
                            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: `w-8 h-8 rounded-full flex items-center justify-center ${isCompleted ? "bg-hasivu-green-100 text-hasivu-green-600" : "bg-gray-100 text-gray-400"}`,
                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(step.icon, {
                                            className: "w-4 h-4"
                                        })
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                        className: `text-sm ${isActive ? "font-semibold text-hasivu-orange-600" : "text-gray-600"}`,
                                        children: step.label
                                    })
                                ]
                            }, step.key);
                        })
                    }),
                    order.rfidVerified && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "flex items-center space-x-2 p-3 bg-hasivu-green-50 rounded-lg border border-hasivu-green-200",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Shield */ .WL4, {
                                className: "w-4 h-4 text-hasivu-green-600"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                className: "text-sm font-medium text-hasivu-green-700",
                                children: "RFID Verified"
                            }),
                            order.photoProof && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                variant: "outline",
                                size: "sm",
                                className: "ml-auto",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Eye */ .bAj, {
                                        className: "w-3 h-3 mr-1"
                                    }),
                                    "Photo"
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                className: "text-sm text-gray-600",
                                children: "Nutrition Score"
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_progress__WEBPACK_IMPORTED_MODULE_6__/* .Progress */ .E, {
                                        value: order.nutritionScore,
                                        className: "w-16 h-2"
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                        className: "text-sm font-semibold text-hasivu-green-600",
                                        children: [
                                            order.nutritionScore,
                                            "%"
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
// Nutrition insights component with gamification
const NutritionInsights = ({ child })=>{
    const weeklyData = [
        {
            day: "Mon",
            score: 85,
            meals: 1
        },
        {
            day: "Tue",
            score: 90,
            meals: 1
        },
        {
            day: "Wed",
            score: 88,
            meals: 1
        },
        {
            day: "Thu",
            score: 92,
            meals: 1
        },
        {
            day: "Fri",
            score: 87,
            meals: 1
        },
        {
            day: "Sat",
            score: 0,
            meals: 0
        },
        {
            day: "Sun",
            score: 0,
            meals: 0
        }
    ];
    const achievements = [
        {
            id: 1,
            name: "Healthy Week",
            description: "5 days of balanced meals",
            icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Trophy */ .uzG,
            unlocked: true
        },
        {
            id: 2,
            name: "Protein Power",
            description: "Met protein goals 3 days in a row",
            icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Target */ .Vzi,
            unlocked: true
        },
        {
            id: 3,
            name: "Variety Explorer",
            description: "Tried 3 new dishes this week",
            icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Star */ .Uxw,
            unlocked: false
        }
    ];
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "space-y-6",
        children: [
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                            className: "flex items-center",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Activity */ .cS$, {
                                    className: "w-5 h-5 mr-2 text-hasivu-orange-500"
                                }),
                                "Weekly Progress"
                            ]
                        })
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "flex items-center justify-between mb-4",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                className: "text-2xl font-bold text-hasivu-green-600",
                                                children: child.weeklyStreak
                                            }),
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                className: "text-sm text-gray-600",
                                                children: "Day Streak"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "flex space-x-1",
                                        children: weeklyData.map((day, index)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                className: "text-center",
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                        className: "text-xs text-gray-500 mb-1",
                                                        children: day.day
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                        className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${day.meals > 0 ? "bg-hasivu-green-500 text-white" : "bg-gray-200 text-gray-400"}`,
                                                        children: day.score || "-"
                                                    })
                                                ]
                                            }, index))
                                    })
                                ]
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_progress__WEBPACK_IMPORTED_MODULE_6__/* .Progress */ .E, {
                                value: child.weeklyStreak / 7 * 100,
                                className: "h-2"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                            className: "flex items-center",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Trophy */ .uzG, {
                                    className: "w-5 h-5 mr-2 text-yellow-500"
                                }),
                                "Achievements"
                            ]
                        })
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "space-y-3",
                            children: achievements.map((achievement)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: `flex items-center space-x-3 p-3 rounded-lg transition-all ${achievement.unlocked ? "bg-hasivu-green-50 border border-hasivu-green-200" : "bg-gray-50 border border-gray-200 opacity-60"}`,
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(achievement.icon, {
                                            className: `w-6 h-6 ${achievement.unlocked ? "text-hasivu-green-600" : "text-gray-400"}`
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex-1",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "font-medium",
                                                    children: achievement.name
                                                }),
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                    className: "text-sm text-gray-600",
                                                    children: achievement.description
                                                })
                                            ]
                                        }),
                                        achievement.unlocked && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CheckCircle */ .fU8, {
                                            className: "w-5 h-5 text-hasivu-green-600"
                                        })
                                    ]
                                }, achievement.id))
                        })
                    })
                ]
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                            children: "Dietary Profile"
                        })
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("label", {
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Dietary Restrictions"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "flex flex-wrap gap-2 mt-1",
                                        children: child.dietaryRestrictions.length > 0 ? child.dietaryRestrictions.map((restriction)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                variant: "secondary",
                                                className: "bg-blue-100 text-blue-800",
                                                children: restriction
                                            }, restriction)) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                            className: "text-sm text-gray-500",
                                            children: "None"
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("label", {
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Allergies"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "flex flex-wrap gap-2 mt-1",
                                        children: child.allergies.length > 0 ? child.allergies.map((allergy)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                variant: "destructive",
                                                className: "bg-red-100 text-red-800",
                                                children: allergy
                                            }, allergy)) : /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                            className: "text-sm text-gray-500",
                                            children: "None reported"
                                        })
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("label", {
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Preferred Cuisines"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                        className: "flex flex-wrap gap-2 mt-1",
                                        children: child.preferences.cuisineType.map((cuisine)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                className: "bg-hasivu-orange-100 text-hasivu-orange-800",
                                                children: cuisine
                                            }, cuisine))
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("label", {
                                        className: "text-sm font-medium text-gray-700",
                                        children: "Spice Preference"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                        className: "ml-2 bg-yellow-100 text-yellow-800",
                                        children: child.preferences.spiceLevel.charAt(0).toUpperCase() + child.preferences.spiceLevel.slice(1)
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
// Main dashboard component
const ParentDashboard = ()=>{
    const [selectedChild, setSelectedChild] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(mockChildren[0]);
    const [activeTab, setActiveTab] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)("overview");
    const [orders] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(mockOrders);
    const todaysOrders = orders.filter((order)=>{
        const orderDate = new Date(order.orderTime).toDateString();
        const today = new Date().toDateString();
        return orderDate === today;
    });
    const childOrders = selectedChild ? orders.filter((order)=>order.childId === selectedChild.id) : [];
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "min-h-screen bg-gray-50",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "bg-white shadow-sm border-b",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "flex justify-between items-center py-4",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
                                        className: "text-2xl font-bold text-gray-900",
                                        children: "Parent Dashboard"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                        className: "text-gray-600",
                                        children: "Manage your children's meal plans and nutrition"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                className: "flex items-center space-x-4",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                        variant: "outline",
                                        className: "flex items-center",
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Download */ .UWx, {
                                                className: "w-4 h-4 mr-2"
                                            }),
                                            "Export Data"
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                        className: "flex items-center bg-hasivu-orange-600 hover:bg-hasivu-orange-700",
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Plus */ .v37, {
                                                className: "w-4 h-4 mr-2"
                                            }),
                                            "Quick Order"
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(ChildSelector, {
                        children: mockChildren,
                        selectedChild: selectedChild,
                        onSelect: setSelectedChild
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .Tabs */ .mQ, {
                        value: activeTab,
                        onValueChange: setActiveTab,
                        className: "space-y-6",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsList */ .dr, {
                                className: "grid w-full grid-cols-4",
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsTrigger */ .SP, {
                                        value: "overview",
                                        children: "Overview"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsTrigger */ .SP, {
                                        value: "orders",
                                        children: "Orders & Tracking"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsTrigger */ .SP, {
                                        value: "nutrition",
                                        children: "Nutrition & Goals"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsTrigger */ .SP, {
                                        value: "payments",
                                        children: "Payments & Wallet"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsContent */ .nU, {
                                value: "overview",
                                className: "space-y-6",
                                children: selectedChild && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "lg:col-span-2 space-y-6",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                className: "pt-6",
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                    className: "flex items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "p-2 bg-hasivu-green-100 rounded-full",
                                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Utensils */ .qT0, {
                                                                                className: "w-6 h-6 text-hasivu-green-600"
                                                                            })
                                                                        }),
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "ml-4",
                                                                            children: [
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-2xl font-bold",
                                                                                    children: todaysOrders.length
                                                                                }),
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-gray-600",
                                                                                    children: "Today's Orders"
                                                                                })
                                                                            ]
                                                                        })
                                                                    ]
                                                                })
                                                            })
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                className: "pt-6",
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                    className: "flex items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "p-2 bg-hasivu-orange-100 rounded-full",
                                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Star */ .Uxw, {
                                                                                className: "w-6 h-6 text-hasivu-orange-600"
                                                                            })
                                                                        }),
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "ml-4",
                                                                            children: [
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                                    className: "text-2xl font-bold",
                                                                                    children: [
                                                                                        selectedChild.nutritionScore,
                                                                                        "%"
                                                                                    ]
                                                                                }),
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-gray-600",
                                                                                    children: "Nutrition Score"
                                                                                })
                                                                            ]
                                                                        })
                                                                    ]
                                                                })
                                                            })
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                className: "pt-6",
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                    className: "flex items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "p-2 bg-hasivu-blue-100 rounded-full",
                                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Trophy */ .uzG, {
                                                                                className: "w-6 h-6 text-hasivu-blue-600"
                                                                            })
                                                                        }),
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "ml-4",
                                                                            children: [
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-2xl font-bold",
                                                                                    children: selectedChild.weeklyStreak
                                                                                }),
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-gray-600",
                                                                                    children: "Day Streak"
                                                                                })
                                                                            ]
                                                                        })
                                                                    ]
                                                                })
                                                            })
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                className: "flex justify-between items-center",
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                        children: "Recent Orders"
                                                                    }),
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                        variant: "ghost",
                                                                        size: "sm",
                                                                        children: [
                                                                            "View All ",
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .ArrowRight */ .olP, {
                                                                                className: "w-4 h-4 ml-1"
                                                                            })
                                                                        ]
                                                                    })
                                                                ]
                                                            })
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                className: "space-y-4",
                                                                children: childOrders.slice(0, 3).map((order)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(OrderTracker, {
                                                                        order: order
                                                                    }, order.id))
                                                            })
                                                        })
                                                    ]
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(NutritionInsights, {
                                                child: selectedChild
                                            })
                                        })
                                    ]
                                })
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsContent */ .nU, {
                                value: "orders",
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                                        className: "text-2xl font-bold text-gray-900",
                                                        children: "Orders & Tracking"
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                        className: "text-gray-600",
                                                        children: "Monitor all meal orders and delivery status"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                className: "flex items-center space-x-3",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .Select */ .Ph, {
                                                        defaultValue: "all",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectTrigger */ .i4, {
                                                                className: "w-40",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectValue */ .ki, {
                                                                    placeholder: "Filter orders"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectContent */ .Bw, {
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "all",
                                                                        children: "All Orders"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "today",
                                                                        children: "Today"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "week",
                                                                        children: "This Week"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "month",
                                                                        children: "This Month"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .Select */ .Ph, {
                                                        defaultValue: "all-status",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectTrigger */ .i4, {
                                                                className: "w-40",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectValue */ .ki, {
                                                                    placeholder: "Status"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectContent */ .Bw, {
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "all-status",
                                                                        children: "All Status"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "ordered",
                                                                        children: "Ordered"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "preparing",
                                                                        children: "Preparing"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "ready",
                                                                        children: "Ready"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "delivered",
                                                                        children: "Delivered"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                        className: "bg-hasivu-orange-600 hover:bg-hasivu-orange-700",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Plus */ .v37, {
                                                                className: "w-4 h-4 mr-2"
                                                            }),
                                                            "New Order"
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6",
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                    className: "pt-6",
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                        className: "flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                className: "p-2 bg-blue-100 rounded-full",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .ShoppingCart */ .yTB, {
                                                                    className: "w-5 h-5 text-blue-600"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                className: "ml-4",
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-2xl font-bold",
                                                                        children: "24"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-sm text-gray-600",
                                                                        children: "Total Orders"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                    className: "pt-6",
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                        className: "flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                className: "p-2 bg-yellow-100 rounded-full",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Clock */ .SUY, {
                                                                    className: "w-5 h-5 text-yellow-600"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                className: "ml-4",
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-2xl font-bold",
                                                                        children: "3"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-sm text-gray-600",
                                                                        children: "In Progress"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                    className: "pt-6",
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                        className: "flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                className: "p-2 bg-green-100 rounded-full",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CheckCircle */ .fU8, {
                                                                    className: "w-5 h-5 text-green-600"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                className: "ml-4",
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-2xl font-bold",
                                                                        children: "21"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-sm text-gray-600",
                                                                        children: "Completed"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                })
                                            }),
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                    className: "pt-6",
                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                        className: "flex items-center",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                className: "p-2 bg-purple-100 rounded-full",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .TrendingUp */ .klz, {
                                                                    className: "w-5 h-5 text-purple-600"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                className: "ml-4",
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-2xl font-bold",
                                                                        children: "Rs.2,340"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                        className: "text-sm text-gray-600",
                                                                        children: "Total Spent"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                })
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                    className: "flex items-center justify-between",
                                                    children: [
                                                        "Recent Orders",
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "flex items-center space-x-2",
                                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_input__WEBPACK_IMPORTED_MODULE_9__/* .Input */ .I, {
                                                                placeholder: "Search orders...",
                                                                className: "w-64"
                                                            })
                                                        })
                                                    ]
                                                })
                                            }),
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "space-y-4",
                                                    children: [
                                                        orders.map((order)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(OrderTracker, {
                                                                order: order
                                                            }, order.id)),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "grid gap-4",
                                                            children: [
                                                                {
                                                                    id: "ORD-003",
                                                                    childName: "Priya Sharma",
                                                                    items: [
                                                                        {
                                                                            name: "Paneer Butter Masala with Rice",
                                                                            quantity: 1,
                                                                            price: 95
                                                                        }
                                                                    ],
                                                                    status: "ready",
                                                                    orderTime: "2024-01-15T12:15:00Z",
                                                                    estimatedDelivery: "12:45 PM",
                                                                    nutritionScore: 91,
                                                                    specialInstructions: "Less spicy, extra rice"
                                                                },
                                                                {
                                                                    id: "ORD-004",
                                                                    childName: "Arjun Sharma",
                                                                    items: [
                                                                        {
                                                                            name: "Chicken Fried Rice",
                                                                            quantity: 1,
                                                                            price: 110
                                                                        }
                                                                    ],
                                                                    status: "ordered",
                                                                    orderTime: "2024-01-15T12:20:00Z",
                                                                    estimatedDelivery: "1:15 PM",
                                                                    nutritionScore: 88,
                                                                    specialInstructions: "No vegetables"
                                                                }
                                                            ].map((order)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                                    className: "border-l-4 border-l-hasivu-orange-500 hover:shadow-lg transition-shadow",
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                        className: "pt-6",
                                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "flex justify-between items-start",
                                                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "flex-1",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "flex items-center justify-between mb-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                className: "flex items-center space-x-3",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_avatar__WEBPACK_IMPORTED_MODULE_5__/* .Avatar */ .qE, {
                                                                                                        className: "w-8 h-8",
                                                                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_avatar__WEBPACK_IMPORTED_MODULE_5__/* .AvatarFallback */ .Q5, {
                                                                                                            children: order.childName.split(" ").map((n)=>n[0]).join("")
                                                                                                        })
                                                                                                    }),
                                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                        children: [
                                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                                                                                                                className: "font-semibold",
                                                                                                                children: order.childName
                                                                                                            }),
                                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                                                                className: "text-sm text-gray-600",
                                                                                                                children: [
                                                                                                                    "Order #",
                                                                                                                    order.id
                                                                                                                ]
                                                                                                            })
                                                                                                        ]
                                                                                                    })
                                                                                                ]
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                                                                className: `${order.status === "ready" ? "bg-orange-100 text-orange-800" : order.status === "ordered" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`,
                                                                                                children: order.status === "ready" ? "Ready for Pickup" : order.status.charAt(0).toUpperCase() + order.status.slice(1)
                                                                                            })
                                                                                        ]
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "space-y-2 mb-4",
                                                                                        children: order.items.map((item, idx)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                className: "flex justify-between items-center",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                                        className: "font-medium",
                                                                                                        children: item.name
                                                                                                    }),
                                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                                        className: "text-gray-600",
                                                                                                        children: [
                                                                                                            "Rs.",
                                                                                                            item.price
                                                                                                        ]
                                                                                                    })
                                                                                                ]
                                                                                            }, idx))
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "flex items-center justify-between text-sm text-gray-600 mb-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                                children: [
                                                                                                    "Ordered: ",
                                                                                                    new Date(order.orderTime).toLocaleTimeString()
                                                                                                ]
                                                                                            }),
                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                                className: "flex items-center",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Clock */ .SUY, {
                                                                                                        className: "w-4 h-4 mr-1"
                                                                                                    }),
                                                                                                    "ETA: ",
                                                                                                    order.estimatedDelivery
                                                                                                ]
                                                                                            })
                                                                                        ]
                                                                                    }),
                                                                                    order.specialInstructions && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3",
                                                                                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                                                                            className: "text-sm text-amber-800",
                                                                                            children: [
                                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("strong", {
                                                                                                    children: "Special Instructions:"
                                                                                                }),
                                                                                                " ",
                                                                                                order.specialInstructions
                                                                                            ]
                                                                                        })
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "flex items-center justify-between",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                className: "flex items-center space-x-2",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                                        className: "text-sm text-gray-600",
                                                                                                        children: "Nutrition Score:"
                                                                                                    }),
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_progress__WEBPACK_IMPORTED_MODULE_6__/* .Progress */ .E, {
                                                                                                        value: order.nutritionScore,
                                                                                                        className: "w-20 h-2"
                                                                                                    }),
                                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                                        className: "text-sm font-semibold text-hasivu-green-600",
                                                                                                        children: [
                                                                                                            order.nutritionScore,
                                                                                                            "%"
                                                                                                        ]
                                                                                                    })
                                                                                                ]
                                                                                            }),
                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                className: "flex items-center space-x-2",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                                                        variant: "outline",
                                                                                                        size: "sm",
                                                                                                        children: [
                                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .MapPin */ .$td, {
                                                                                                                className: "w-4 h-4 mr-1"
                                                                                                            }),
                                                                                                            "Track"
                                                                                                        ]
                                                                                                    }),
                                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                                                        variant: "outline",
                                                                                                        size: "sm",
                                                                                                        children: [
                                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Bell */ .Uos, {
                                                                                                                className: "w-4 h-4 mr-1"
                                                                                                            }),
                                                                                                            "Notify"
                                                                                                        ]
                                                                                                    })
                                                                                                ]
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            })
                                                                        })
                                                                    })
                                                                }, order.id))
                                                        })
                                                    ]
                                                })
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsContent */ .nU, {
                                value: "nutrition",
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                                        className: "text-2xl font-bold text-gray-900",
                                                        children: "Nutrition & Goals"
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                        className: "text-gray-600",
                                                        children: "AI-powered nutrition insights and personalized goals"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                className: "flex items-center space-x-3",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .Select */ .Ph, {
                                                        defaultValue: "week",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectTrigger */ .i4, {
                                                                className: "w-32",
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectValue */ .ki, {})
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectContent */ .Bw, {
                                                                children: [
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "week",
                                                                        children: "This Week"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "month",
                                                                        children: "This Month"
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                        value: "quarter",
                                                                        children: "3 Months"
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                        variant: "outline",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Download */ .UWx, {
                                                                className: "w-4 h-4 mr-2"
                                                            }),
                                                            "Export Report"
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    selectedChild && (()=>{
                                        const weeklyData = [
                                            {
                                                day: "Mon",
                                                score: 85,
                                                meals: 1
                                            },
                                            {
                                                day: "Tue",
                                                score: 90,
                                                meals: 1
                                            },
                                            {
                                                day: "Wed",
                                                score: 88,
                                                meals: 1
                                            },
                                            {
                                                day: "Thu",
                                                score: 92,
                                                meals: 1
                                            },
                                            {
                                                day: "Fri",
                                                score: 87,
                                                meals: 1
                                            },
                                            {
                                                day: "Sat",
                                                score: 0,
                                                meals: 0
                                            },
                                            {
                                                day: "Sun",
                                                score: 0,
                                                meals: 0
                                            }
                                        ];
                                        return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "lg:col-span-2 space-y-6",
                                                    children: [
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: [
                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                    children: [
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                            className: "flex items-center",
                                                                            children: [
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .TrendingUp */ .klz, {
                                                                                    className: "w-5 h-5 mr-2 text-hasivu-green-600"
                                                                                }),
                                                                                "Nutrition Score Trends"
                                                                            ]
                                                                        }),
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardDescription */ .SZ, {
                                                                            children: [
                                                                                "Weekly nutrition performance for ",
                                                                                selectedChild.name
                                                                            ]
                                                                        })
                                                                    ]
                                                                }),
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                        className: "h-64 flex items-end justify-between space-x-2",
                                                                        children: weeklyData.map((day, index)=>{
                                                                            const height = day.meals > 0 ? day.score / 100 * 200 : 0;
                                                                            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "flex flex-col items-center flex-1",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "w-full bg-gray-200 rounded-t-lg relative overflow-hidden",
                                                                                        style: {
                                                                                            height: "200px"
                                                                                        },
                                                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(framer_motion__WEBPACK_IMPORTED_MODULE_11__/* .motion */ .E.div, {
                                                                                            className: `absolute bottom-0 w-full rounded-t-lg ${day.score >= 90 ? "bg-gradient-to-t from-green-500 to-green-400" : day.score >= 80 ? "bg-gradient-to-t from-yellow-500 to-yellow-400" : day.score >= 70 ? "bg-gradient-to-t from-orange-500 to-orange-400" : day.meals > 0 ? "bg-gradient-to-t from-red-500 to-red-400" : ""}`,
                                                                                            initial: {
                                                                                                height: 0
                                                                                            },
                                                                                            animate: {
                                                                                                height: `${height}px`
                                                                                            },
                                                                                            transition: {
                                                                                                delay: index * 0.1,
                                                                                                duration: 0.5
                                                                                            }
                                                                                        })
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "text-center mt-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                                className: "text-xs text-gray-500",
                                                                                                children: day.day
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                                className: "text-sm font-semibold",
                                                                                                children: day.score || "-"
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            }, index);
                                                                        })
                                                                    })
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: [
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                        children: "Weekly Nutritional Breakdown"
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                        className: "grid grid-cols-2 md:grid-cols-4 gap-4",
                                                                        children: [
                                                                            {
                                                                                label: "Protein",
                                                                                value: 24,
                                                                                unit: "g",
                                                                                target: 30,
                                                                                color: "bg-red-500"
                                                                            },
                                                                            {
                                                                                label: "Carbs",
                                                                                value: 180,
                                                                                unit: "g",
                                                                                target: 200,
                                                                                color: "bg-blue-500"
                                                                            },
                                                                            {
                                                                                label: "Fat",
                                                                                value: 45,
                                                                                unit: "g",
                                                                                target: 50,
                                                                                color: "bg-yellow-500"
                                                                            },
                                                                            {
                                                                                label: "Fiber",
                                                                                value: 18,
                                                                                unit: "g",
                                                                                target: 25,
                                                                                color: "bg-green-500"
                                                                            }
                                                                        ].map((nutrient)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "text-center",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "relative w-20 h-20 mx-auto mb-2",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("svg", {
                                                                                                className: "w-20 h-20 transform -rotate-90",
                                                                                                children: [
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("circle", {
                                                                                                        cx: "40",
                                                                                                        cy: "40",
                                                                                                        r: "36",
                                                                                                        stroke: "currentColor",
                                                                                                        strokeWidth: "4",
                                                                                                        fill: "none",
                                                                                                        className: "text-gray-200"
                                                                                                    }),
                                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("circle", {
                                                                                                        cx: "40",
                                                                                                        cy: "40",
                                                                                                        r: "36",
                                                                                                        stroke: "currentColor",
                                                                                                        strokeWidth: "4",
                                                                                                        fill: "none",
                                                                                                        strokeDasharray: `${2 * Math.PI * 36}`,
                                                                                                        strokeDashoffset: `${2 * Math.PI * 36 * (1 - nutrient.value / nutrient.target)}`,
                                                                                                        className: nutrient.color.replace("bg-", "text-")
                                                                                                    })
                                                                                                ]
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                                className: "absolute inset-0 flex items-center justify-center",
                                                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                                    className: "text-sm font-bold",
                                                                                                    children: [
                                                                                                        Math.round(nutrient.value / nutrient.target * 100),
                                                                                                        "%"
                                                                                                    ]
                                                                                                })
                                                                                            })
                                                                                        ]
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "font-medium",
                                                                                        children: nutrient.label
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "text-sm text-gray-600",
                                                                                        children: [
                                                                                            nutrient.value,
                                                                                            nutrient.unit,
                                                                                            " / ",
                                                                                            nutrient.target,
                                                                                            nutrient.unit
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            }, nutrient.label))
                                                                    })
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: [
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                        className: "flex items-center",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Zap */ .itc, {
                                                                                className: "w-5 h-5 mr-2 text-purple-600"
                                                                            }),
                                                                            "AI Nutrition Recommendations"
                                                                        ]
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                        className: "space-y-4",
                                                                        children: [
                                                                            {
                                                                                type: "success",
                                                                                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CheckCircle */ .fU8,
                                                                                title: "Great Protein Intake!",
                                                                                description: "Priya is meeting her protein goals consistently. Keep including dal and paneer.",
                                                                                color: "text-green-600 bg-green-50 border-green-200"
                                                                            },
                                                                            {
                                                                                type: "warning",
                                                                                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .AlertTriangle */ .uyG,
                                                                                title: "Increase Fiber Intake",
                                                                                description: "Consider adding more vegetables and fruits. Try mixed vegetable curry or fresh fruit sides.",
                                                                                color: "text-amber-600 bg-amber-50 border-amber-200"
                                                                            },
                                                                            {
                                                                                type: "info",
                                                                                icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Target */ .Vzi,
                                                                                title: "Balanced Meal Suggestion",
                                                                                description: "Tomorrow, try: Rajma Rice + Mixed Veg + Curd + Apple for optimal nutrition balance.",
                                                                                color: "text-blue-600 bg-blue-50 border-blue-200"
                                                                            }
                                                                        ].map((rec, index)=>{
                                                                            const IconComponent = rec.icon;
                                                                            return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: `flex items-start space-x-3 p-4 rounded-lg border ${rec.color}`,
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(IconComponent, {
                                                                                        className: "w-5 h-5 mt-0.5 flex-shrink-0"
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        children: [
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                                                                                                className: "font-semibold mb-1",
                                                                                                children: rec.title
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                                className: "text-sm opacity-90",
                                                                                                children: rec.description
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            }, index);
                                                                        })
                                                                    })
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "space-y-6",
                                                    children: [
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: [
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                        className: "text-lg",
                                                                        children: "Weekly Goals"
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                    className: "space-y-4",
                                                                    children: [
                                                                        {
                                                                            label: "Healthy Meals",
                                                                            current: 5,
                                                                            target: 7,
                                                                            icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Utensils */ .qT0
                                                                        },
                                                                        {
                                                                            label: "Nutrition Score",
                                                                            current: 87,
                                                                            target: 90,
                                                                            icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Star */ .Uxw
                                                                        },
                                                                        {
                                                                            label: "Variety Score",
                                                                            current: 8,
                                                                            target: 10,
                                                                            icon: lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Heart */ .Xdw
                                                                        }
                                                                    ].map((goal, index)=>{
                                                                        const IconComponent = goal.icon;
                                                                        const progress = goal.current / goal.target * 100;
                                                                        return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "space-y-2",
                                                                            children: [
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "flex items-center justify-between",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                            className: "flex items-center space-x-2",
                                                                                            children: [
                                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(IconComponent, {
                                                                                                    className: "w-4 h-4 text-hasivu-orange-600"
                                                                                                }),
                                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                                    className: "font-medium text-sm",
                                                                                                    children: goal.label
                                                                                                })
                                                                                            ]
                                                                                        }),
                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                            className: "text-sm text-gray-600",
                                                                                            children: [
                                                                                                goal.current,
                                                                                                "/",
                                                                                                goal.target
                                                                                            ]
                                                                                        })
                                                                                    ]
                                                                                }),
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_progress__WEBPACK_IMPORTED_MODULE_6__/* .Progress */ .E, {
                                                                                    value: progress,
                                                                                    className: "h-2"
                                                                                })
                                                                            ]
                                                                        }, index);
                                                                    })
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: [
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                    children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                        className: "text-lg flex items-center",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Trophy */ .uzG, {
                                                                                className: "w-5 h-5 mr-2 text-yellow-500"
                                                                            }),
                                                                            "Recent Achievements"
                                                                        ]
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                        className: "space-y-3",
                                                                        children: [
                                                                            {
                                                                                title: "Protein Champion",
                                                                                description: "Met protein goals 5 days straight!",
                                                                                date: "2 days ago",
                                                                                icon: "\uD83C\uDFC6"
                                                                            },
                                                                            {
                                                                                title: "Variety Explorer",
                                                                                description: "Tried 3 new healthy dishes",
                                                                                date: "1 week ago",
                                                                                icon: "\uD83C\uDF1F"
                                                                            },
                                                                            {
                                                                                title: "Consistent Eater",
                                                                                description: "No missed meals this week",
                                                                                date: "3 days ago",
                                                                                icon: "\uD83D\uDCAA"
                                                                            }
                                                                        ].map((achievement, index)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "flex items-start space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-2xl",
                                                                                        children: achievement.icon
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        className: "flex-1",
                                                                                        children: [
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                                                                                                className: "font-semibold text-sm",
                                                                                                children: achievement.title
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                                className: "text-xs text-gray-600 mb-1",
                                                                                                children: achievement.description
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                                className: "text-xs text-gray-500",
                                                                                                children: achievement.date
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            }, index))
                                                                    })
                                                                })
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                            children: [
                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                        className: "text-lg",
                                                                        children: "Health Insights"
                                                                    })
                                                                }),
                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                    className: "space-y-3",
                                                                    children: [
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "p-3 bg-green-50 border border-green-200 rounded-lg",
                                                                            children: [
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "flex items-center space-x-2 mb-2",
                                                                                    children: [
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Heart */ .Xdw, {
                                                                                            className: "w-4 h-4 text-green-600"
                                                                                        }),
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                            className: "font-medium text-sm text-green-800",
                                                                                            children: "Overall Health"
                                                                                        })
                                                                                    ]
                                                                                }),
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-xs text-green-700",
                                                                                    children: "Excellent nutrition balance. Keep up the good work!"
                                                                                })
                                                                            ]
                                                                        }),
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "p-3 bg-blue-50 border border-blue-200 rounded-lg",
                                                                            children: [
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "flex items-center space-x-2 mb-2",
                                                                                    children: [
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Activity */ .cS$, {
                                                                                            className: "w-4 h-4 text-blue-600"
                                                                                        }),
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                            className: "font-medium text-sm text-blue-800",
                                                                                            children: "Growth Tracking"
                                                                                        })
                                                                                    ]
                                                                                }),
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                    className: "text-xs text-blue-700",
                                                                                    children: "Nutrition supporting healthy growth patterns"
                                                                                })
                                                                            ]
                                                                        })
                                                                    ]
                                                                })
                                                            ]
                                                        })
                                                    ]
                                                })
                                            ]
                                        });
                                    })()
                                ]
                            }),
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_tabs__WEBPACK_IMPORTED_MODULE_7__/* .TabsContent */ .nU, {
                                value: "payments",
                                className: "space-y-6",
                                children: [
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                                        className: "text-2xl font-bold text-gray-900",
                                                        children: "Payments & Wallet"
                                                    }),
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                        className: "text-gray-600",
                                                        children: "Manage payments, wallet balance, and security"
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                className: "flex items-center space-x-3",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                        variant: "outline",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Download */ .UWx, {
                                                                className: "w-4 h-4 mr-2"
                                                            }),
                                                            "Transaction History"
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                        className: "bg-hasivu-green-600 hover:bg-hasivu-green-700",
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Plus */ .v37, {
                                                                className: "w-4 h-4 mr-2"
                                                            }),
                                                            "Add Money"
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                className: "lg:col-span-2 space-y-6",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                    className: "flex items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CreditCard */ .aBT, {
                                                                            className: "w-5 h-5 mr-2 text-hasivu-blue-600"
                                                                        }),
                                                                        "Wallet Overview"
                                                                    ]
                                                                })
                                                            }),
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                    className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                                                                    children: [
                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "bg-gradient-to-r from-hasivu-green-500 to-hasivu-blue-500 text-white p-6 rounded-2xl",
                                                                            children: [
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "flex items-center justify-between",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                            children: [
                                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                                    className: "text-hasivu-green-100 text-sm",
                                                                                                    children: "Available Balance"
                                                                                                }),
                                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                                    className: "text-2xl font-bold",
                                                                                                    children: "Rs.1,250"
                                                                                                })
                                                                                            ]
                                                                                        }),
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CreditCard */ .aBT, {
                                                                                            className: "w-8 h-8 text-hasivu-green-100"
                                                                                        })
                                                                                    ]
                                                                                }),
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "mt-4 flex items-center justify-between",
                                                                                    children: [
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                            className: "text-xs text-hasivu-green-100",
                                                                                            children: "Wallet ID: WAL-2024-001"
                                                                                        }),
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                                            size: "sm",
                                                                                            variant: "secondary",
                                                                                            className: "bg-white/20 hover:bg-white/30 text-white border-0",
                                                                                            children: "Top Up"
                                                                                        })
                                                                                    ]
                                                                                })
                                                                            ]
                                                                        }),
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "space-y-4",
                                                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "text-center p-4 border-2 border-dashed border-gray-300 rounded-lg",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .TrendingUp */ .klz, {
                                                                                        className: "w-8 h-8 text-gray-400 mx-auto mb-2"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                        className: "text-sm text-gray-600",
                                                                                        children: "Monthly Spending"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                        className: "text-xl font-bold text-gray-900",
                                                                                        children: "Rs.3,240"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                        className: "text-xs text-green-600",
                                                                                        children: "↓ 12% from last month"
                                                                                    })
                                                                                ]
                                                                            })
                                                                        }),
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "space-y-4",
                                                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "text-center p-4 border-2 border-dashed border-gray-300 rounded-lg",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Shield */ .WL4, {
                                                                                        className: "w-8 h-8 text-gray-400 mx-auto mb-2"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                        className: "text-sm text-gray-600",
                                                                                        children: "Fraud Protection"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                        className: "text-xl font-bold text-green-600",
                                                                                        children: "Active"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                        className: "text-xs text-gray-500",
                                                                                        children: "99.7% accuracy"
                                                                                    })
                                                                                ]
                                                                            })
                                                                        })
                                                                    ]
                                                                })
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                    className: "flex justify-between items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                            children: "Recent Transactions"
                                                                        }),
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                            className: "flex items-center space-x-2",
                                                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .Select */ .Ph, {
                                                                                defaultValue: "all",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectTrigger */ .i4, {
                                                                                        className: "w-32",
                                                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectValue */ .ki, {})
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectContent */ .Bw, {
                                                                                        children: [
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                                                value: "all",
                                                                                                children: "All Types"
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                                                value: "payment",
                                                                                                children: "Payments"
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                                                value: "refund",
                                                                                                children: "Refunds"
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_select__WEBPACK_IMPORTED_MODULE_8__/* .SelectItem */ .Ql, {
                                                                                                value: "topup",
                                                                                                children: "Top-ups"
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            })
                                                                        })
                                                                    ]
                                                                })
                                                            }),
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                    className: "space-y-4",
                                                                    children: [
                                                                        {
                                                                            id: "TXN-001",
                                                                            type: "payment",
                                                                            description: "Lunch - Masala Dosa & Sambar",
                                                                            amount: -85,
                                                                            status: "success",
                                                                            timestamp: "2024-01-15T12:45:00Z",
                                                                            child: "Priya Sharma",
                                                                            fraudScore: 0.1
                                                                        },
                                                                        {
                                                                            id: "TXN-002",
                                                                            type: "payment",
                                                                            description: "Lunch - Chicken Biryani",
                                                                            amount: -120,
                                                                            status: "success",
                                                                            timestamp: "2024-01-15T13:00:00Z",
                                                                            child: "Arjun Sharma",
                                                                            fraudScore: 0.05
                                                                        },
                                                                        {
                                                                            id: "TXN-003",
                                                                            type: "topup",
                                                                            description: "Wallet Top-up via UPI",
                                                                            amount: 1000,
                                                                            status: "success",
                                                                            timestamp: "2024-01-14T10:30:00Z",
                                                                            child: "",
                                                                            fraudScore: 0
                                                                        },
                                                                        {
                                                                            id: "TXN-004",
                                                                            type: "refund",
                                                                            description: "Cancelled Order Refund",
                                                                            amount: 95,
                                                                            status: "pending",
                                                                            timestamp: "2024-01-14T16:20:00Z",
                                                                            child: "Priya Sharma",
                                                                            fraudScore: 0
                                                                        }
                                                                    ].map((transaction)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors",
                                                                            children: [
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "flex items-center space-x-4",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                            className: `p-2 rounded-full ${transaction.type === "payment" ? "bg-red-100" : transaction.type === "topup" ? "bg-green-100" : transaction.type === "refund" ? "bg-blue-100" : "bg-gray-100"}`,
                                                                                            children: [
                                                                                                transaction.type === "payment" && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .ArrowRight */ .olP, {
                                                                                                    className: "w-4 h-4 text-red-600 rotate-90"
                                                                                                }),
                                                                                                transaction.type === "topup" && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .ArrowRight */ .olP, {
                                                                                                    className: "w-4 h-4 text-green-600 -rotate-90"
                                                                                                }),
                                                                                                transaction.type === "refund" && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .ArrowRight */ .olP, {
                                                                                                    className: "w-4 h-4 text-blue-600 -rotate-90"
                                                                                                })
                                                                                            ]
                                                                                        }),
                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                            className: "flex-1",
                                                                                            children: [
                                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                    className: "flex items-center space-x-2",
                                                                                                    children: [
                                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                                                                                                            className: "font-medium",
                                                                                                            children: transaction.description
                                                                                                        }),
                                                                                                        transaction.fraudScore > 0.5 && /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                                                                            variant: "destructive",
                                                                                                            className: "text-xs",
                                                                                                            children: [
                                                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .AlertTriangle */ .uyG, {
                                                                                                                    className: "w-3 h-3 mr-1"
                                                                                                                }),
                                                                                                                "Flagged"
                                                                                                            ]
                                                                                                        })
                                                                                                    ]
                                                                                                }),
                                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                                    className: "flex items-center space-x-4 text-sm text-gray-600",
                                                                                                    children: [
                                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("span", {
                                                                                                            children: [
                                                                                                                "#",
                                                                                                                transaction.id
                                                                                                            ]
                                                                                                        }),
                                                                                                        transaction.child && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                                            children: transaction.child
                                                                                                        }),
                                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
                                                                                                            children: new Date(transaction.timestamp).toLocaleString()
                                                                                                        })
                                                                                                    ]
                                                                                                })
                                                                                            ]
                                                                                        })
                                                                                    ]
                                                                                }),
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    className: "text-right",
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                            className: `font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-red-600"}`,
                                                                                            children: [
                                                                                                transaction.amount > 0 ? "+" : "",
                                                                                                "Rs.",
                                                                                                Math.abs(transaction.amount)
                                                                                            ]
                                                                                        }),
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                                                            className: `text-xs ${transaction.status === "success" ? "bg-green-100 text-green-800" : transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`,
                                                                                            children: transaction.status
                                                                                        })
                                                                                    ]
                                                                                })
                                                                            ]
                                                                        }, transaction.id))
                                                                })
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                    className: "flex items-center",
                                                                    children: [
                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Shield */ .WL4, {
                                                                            className: "w-5 h-5 mr-2 text-purple-600"
                                                                        }),
                                                                        "AI Fraud Detection"
                                                                    ]
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                children: [
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                        className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-6",
                                                                        children: [
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "text-center p-4 bg-green-50 border border-green-200 rounded-lg",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-2xl font-bold text-green-600",
                                                                                        children: "99.7%"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-sm text-green-700",
                                                                                        children: "Detection Accuracy"
                                                                                    })
                                                                                ]
                                                                            }),
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "text-center p-4 bg-blue-50 border border-blue-200 rounded-lg",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-2xl font-bold text-blue-600",
                                                                                        children: "Rs.15,420"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-sm text-blue-700",
                                                                                        children: "Protected This Year"
                                                                                    })
                                                                                ]
                                                                            }),
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "text-center p-4 bg-orange-50 border border-orange-200 rounded-lg",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-2xl font-bold text-orange-600",
                                                                                        children: "0"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-sm text-orange-700",
                                                                                        children: "Suspicious Activities"
                                                                                    })
                                                                                ]
                                                                            })
                                                                        ]
                                                                    }),
                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                        className: "bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4",
                                                                        children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                            className: "flex items-center space-x-3",
                                                                            children: [
                                                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CheckCircle */ .fU8, {
                                                                                    className: "w-6 h-6 text-green-600"
                                                                                }),
                                                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                    children: [
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h4", {
                                                                                            className: "font-semibold text-green-800",
                                                                                            children: "All Systems Protected"
                                                                                        }),
                                                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                                                            className: "text-sm text-green-700",
                                                                                            children: "Your account is fully secured with real-time fraud monitoring"
                                                                                        })
                                                                                    ]
                                                                                })
                                                                            ]
                                                                        })
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                className: "space-y-6",
                                                children: [
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                    className: "text-lg",
                                                                    children: "Quick Actions"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                className: "space-y-3",
                                                                children: [
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                        className: "w-full justify-start",
                                                                        variant: "outline",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Plus */ .v37, {
                                                                                className: "w-4 h-4 mr-2"
                                                                            }),
                                                                            "Add Payment Method"
                                                                        ]
                                                                    }),
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                        className: "w-full justify-start",
                                                                        variant: "outline",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Settings */ .Zrf, {
                                                                                className: "w-4 h-4 mr-2"
                                                                            }),
                                                                            "Auto-reload Settings"
                                                                        ]
                                                                    }),
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                        className: "w-full justify-start",
                                                                        variant: "outline",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Download */ .UWx, {
                                                                                className: "w-4 h-4 mr-2"
                                                                            }),
                                                                            "Download Statements"
                                                                        ]
                                                                    }),
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                        className: "w-full justify-start",
                                                                        variant: "outline",
                                                                        children: [
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .Bell */ .Uos, {
                                                                                className: "w-4 h-4 mr-2"
                                                                            }),
                                                                            "Notification Settings"
                                                                        ]
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                    className: "text-lg",
                                                                    children: "Saved Payment Methods"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                className: "space-y-3",
                                                                children: [
                                                                    {
                                                                        type: "UPI",
                                                                        details: "parent@upi",
                                                                        primary: true
                                                                    },
                                                                    {
                                                                        type: "Card",
                                                                        details: "**** **** **** 1234",
                                                                        primary: false
                                                                    },
                                                                    {
                                                                        type: "Net Banking",
                                                                        details: "SBI ****5678",
                                                                        primary: false
                                                                    }
                                                                ].map((method, index)=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                        className: "flex items-center justify-between p-3 border border-gray-200 rounded-lg",
                                                                        children: [
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                className: "flex items-center space-x-3",
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "p-2 bg-blue-100 rounded",
                                                                                        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_12__/* .CreditCard */ .aBT, {
                                                                                            className: "w-4 h-4 text-blue-600"
                                                                                        })
                                                                                    }),
                                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                        children: [
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                                className: "font-medium text-sm",
                                                                                                children: method.type
                                                                                            }),
                                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                                className: "text-xs text-gray-600",
                                                                                                children: method.details
                                                                                            })
                                                                                        ]
                                                                                    })
                                                                                ]
                                                                            }),
                                                                            method.primary && /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_4__/* .Badge */ .C, {
                                                                                className: "bg-hasivu-orange-100 text-hasivu-orange-800 text-xs",
                                                                                children: "Primary"
                                                                            })
                                                                        ]
                                                                    }, index))
                                                            })
                                                        ]
                                                    }),
                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .Card */ .Zb, {
                                                        children: [
                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardHeader */ .Ol, {
                                                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardTitle */ .ll, {
                                                                    className: "text-lg",
                                                                    children: "Security Settings"
                                                                })
                                                            }),
                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_3__/* .CardContent */ .aY, {
                                                                className: "space-y-4",
                                                                children: [
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                        className: "flex items-center justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "font-medium text-sm",
                                                                                        children: "Two-Factor Auth"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-xs text-gray-600",
                                                                                        children: "SMS verification for transactions"
                                                                                    })
                                                                                ]
                                                                            }),
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                className: "w-4 h-4 bg-green-500 rounded-full"
                                                                            })
                                                                        ]
                                                                    }),
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                        className: "flex items-center justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "font-medium text-sm",
                                                                                        children: "Transaction Limits"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-xs text-gray-600",
                                                                                        children: "Rs.500 per transaction"
                                                                                    })
                                                                                ]
                                                                            }),
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_2__/* .Button */ .z, {
                                                                                variant: "outline",
                                                                                size: "sm",
                                                                                children: "Edit"
                                                                            })
                                                                        ]
                                                                    }),
                                                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                        className: "flex items-center justify-between",
                                                                        children: [
                                                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                                                children: [
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "font-medium text-sm",
                                                                                        children: "Auto-reload"
                                                                                    }),
                                                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                        className: "text-xs text-gray-600",
                                                                                        children: "When balance < Rs. 100"
                                                                                    })
                                                                                ]
                                                                            }),
                                                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                                                className: "w-4 h-4 bg-green-500 rounded-full"
                                                                            })
                                                                        ]
                                                                    })
                                                                ]
                                                            })
                                                        ]
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (ParentDashboard);


/***/ }),

/***/ 81707:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E: () => (/* binding */ Progress)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _radix_ui_react_progress__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(81915);
/* harmony import */ var _lib_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(12019);
/* __next_internal_client_entry_do_not_use__ Progress auto */ 



const Progress = /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_1__.forwardRef(({ className, value, ...props }, ref)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_progress__WEBPACK_IMPORTED_MODULE_2__/* .Root */ .fC, {
        ref: ref,
        className: (0,_lib_utils__WEBPACK_IMPORTED_MODULE_3__.cn)("relative h-4 w-full overflow-hidden rounded-full bg-secondary", className),
        ...props,
        children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_radix_ui_react_progress__WEBPACK_IMPORTED_MODULE_2__/* .Indicator */ .z$, {
            className: "h-full w-full flex-1 bg-primary transition-all",
            style: {
                transform: `translateX(-${100 - (value || 0)}%)`
            }
        })
    }));
Progress.displayName = _radix_ui_react_progress__WEBPACK_IMPORTED_MODULE_2__/* .Root */ .fC.displayName;



/***/ }),

/***/ 33959:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
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



/***/ }),

/***/ 17482:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ DashboardPage)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: ./node_modules/next/dist/build/webpack/loaders/next-flight-loader/module-proxy.js
var module_proxy = __webpack_require__(61363);
;// CONCATENATED MODULE: ./src/components/dashboard/ParentDashboard.tsx

const proxy = (0,module_proxy.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/dashboard/ParentDashboard.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;

const e0 = proxy["ParentDashboard"];


/* harmony default export */ const ParentDashboard = ((/* unused pure expression or super */ null && (__default__)));
;// CONCATENATED MODULE: ./src/app/dashboard/page.tsx


function DashboardPage() {
    return /*#__PURE__*/ jsx_runtime_.jsx(e0, {});
}


/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, [7212,2947,6302,3490,3979,6254,3408,3205,9752,6627,4571,9382,8028,7579,2107,1915,2299,2585,918,9256,8003,5114,7367,2452,5621,7848], () => (__webpack_exec__(23117)));
module.exports = __webpack_exports__;

})();