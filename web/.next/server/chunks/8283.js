exports.id = 8283;
exports.ids = [8283];
exports.modules = {

/***/ 71839:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 165))

/***/ }),

/***/ 165:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ StartwellInspiredLandingPage)
/* harmony export */ });
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(56786);
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(18038);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(11440);
/* harmony import */ var next_link__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_link__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var lucide_react__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(51158);
/* harmony import */ var _components_ui_button__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(29256);
/* harmony import */ var _components_ui_card__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(58003);
/* harmony import */ var _components_ui_badge__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(5114);
/* harmony import */ var _components_ui_dialog__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(5511);
/* harmony import */ var _components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(29914);
/* harmony import */ var _lib_analytics__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(70900);
/* __next_internal_client_entry_do_not_use__ default auto */ 










// Startwell-inspired, but original design and copy for HASIVU
// Bright, friendly, trustworthy, with clear CTAs
const FeatureItem = ({ icon: Icon, title, description })=>/*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "flex items-start space-x-4",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700",
                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(Icon, {
                    className: "h-6 w-6"
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                        className: "text-lg font-semibold text-ink-900",
                        children: title
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                        className: "text-ink-700",
                        children: description
                    })
                ]
            })
        ]
    });
const Pill = ({ children })=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("span", {
        className: "inline-flex items-center rounded-full bg-slate-100 text-ink-700 px-3 py-1 text-xs font-medium border border-slate-200",
        children: children
    });
const testimonials = [
    {
        quote: "HASIVU made school lunches stress-free. My child gets warm meals on time and I can change plans easily!",
        author: "Shalini K.",
        title: "Parent, Grade 4"
    },
    {
        quote: "The flexibility to pause or swap meals the night before is a game changer for busy families.",
        author: "Rahul S.",
        title: "Parent, Grade 7"
    },
    {
        quote: "Great variety and nutrition. The ordering flow is simple and transparent — love it!",
        author: "Meera R.",
        title: "Parent, Grade 2"
    }
];
function StartwellInspiredLandingPage() {
    const [videoOpen, setVideoOpen] = (0,react__WEBPACK_IMPORTED_MODULE_1__.useState)(false);
    const instagramUrl = process.env.NEXT_PUBLIC_SOCIAL_INSTAGRAM || "https://instagram.com/hasivu";
    const twitterUrl = process.env.NEXT_PUBLIC_SOCIAL_TWITTER || "https://twitter.com/hasivu_official";
    const linkedinUrl = process.env.NEXT_PUBLIC_SOCIAL_LINKEDIN || "https://linkedin.com/company/hasivu";
    return /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
        className: "min-h-screen bg-gradient-to-b from-white to-slate-50",
        children: [
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("header", {
                className: "sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-xl",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "mx-auto max-w-7xl px-4 py-3 flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                            href: "/",
                            className: "flex items-center space-x-3",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                    className: "w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold grid place-items-center shadow-soft",
                                    children: "H"
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "leading-tight",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent",
                                            children: "HASIVU"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "text-[11px] text-ink-500 -mt-1",
                                            children: "School Meals Done Right"
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("nav", {
                            className: "hidden md:flex items-center space-x-8",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "#how",
                                    className: "text-ink-600 hover:text-ink-900 font-medium",
                                    children: "How it works"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "#reasons",
                                    className: "text-ink-600 hover:text-ink-900 font-medium",
                                    children: "Why HASIVU"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "#faqs",
                                    className: "text-ink-600 hover:text-ink-900 font-medium",
                                    children: "FAQs"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/auth/login",
                                    className: "text-ink-600 hover:text-ink-900 font-medium",
                                    children: "Login"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "hidden md:flex items-center space-x-3",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/menu",
                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                        variant: "outline",
                                        className: "rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50",
                                        onClick: ()=>_lib_analytics__WEBPACK_IMPORTED_MODULE_8__/* .events */ .U.ctaClick("header_order_online", {
                                                location: "header"
                                            }),
                                        children: "Order Online"
                                    })
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/orders",
                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                        className: "rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-soft",
                                        onClick: ()=>_lib_analytics__WEBPACK_IMPORTED_MODULE_8__/* .events */ .U.ctaClick("header_manage_subscription", {
                                                location: "header"
                                            }),
                                        children: "Manage Subscription"
                                    })
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                className: "relative overflow-hidden",
                children: [
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-100 blur-3xl"
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-100 blur-3xl"
                    }),
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "mx-auto max-w-7xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center",
                        children: [
                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                children: [
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_5__/* .Badge */ .C, {
                                        className: "mb-4 bg-emerald-100 text-emerald-700 border-emerald-200",
                                        children: "Warm meals at school, on time"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h1", {
                                        className: "text-4xl md:text-6xl font-black tracking-tight text-ink-900",
                                        children: "School meals done right"
                                    }),
                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                        className: "mt-4 text-lg md:text-xl text-ink-700 max-w-xl",
                                        children: "Opt for a single meal or subscribe and save. Change, pause or cancel by midnight — full control for busy parents."
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "mt-8 flex flex-col sm:flex-row gap-3",
                                        children: [
                                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                                href: "/menu",
                                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                                    size: "lg",
                                                    className: "rounded-xl px-7 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-soft",
                                                    onClick: ()=>_lib_analytics__WEBPACK_IMPORTED_MODULE_8__/* .events */ .U.ctaClick("hero_order_now", {
                                                            location: "hero"
                                                        }),
                                                    children: [
                                                        "Order Now",
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .ArrowRight */ .olP, {
                                                            className: "ml-2 h-5 w-5"
                                                        })
                                                    ]
                                                })
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                                size: "lg",
                                                variant: "outline",
                                                className: "rounded-xl border-slate-300",
                                                onClick: ()=>{
                                                    _lib_analytics__WEBPACK_IMPORTED_MODULE_8__/* .events */ .U.videoOpen({
                                                        location: "hero"
                                                    });
                                                    setVideoOpen(true);
                                                },
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Play */ .shV, {
                                                        className: "mr-2 h-5 w-5"
                                                    }),
                                                    " Guided Video — How to Order"
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                        className: "mt-6 flex flex-wrap gap-3",
                                        children: [
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(Pill, {
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Utensils */ .qT0, {
                                                        className: "mr-2 h-4 w-4 text-emerald-600"
                                                    }),
                                                    " Meals delivered warm to classroom"
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(Pill, {
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Clock */ .SUY, {
                                                        className: "mr-2 h-4 w-4 text-cyan-600"
                                                    }),
                                                    " Arrives during recess"
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(Pill, {
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Repeat */ .wA, {
                                                        className: "mr-2 h-4 w-4 text-blue-600"
                                                    }),
                                                    " Pause/cancel until midnight"
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
                                    className: "rounded-2xl border-slate-200 shadow-medium",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                                                className: "text-ink-900",
                                                children: "Parents love the flexibility"
                                            })
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                                            className: "grid grid-cols-2 gap-4",
                                            children: [
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "text-3xl font-black text-emerald-600 mb-1",
                                                            children: "4.9★"
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                            className: "text-ink-700 text-sm",
                                                            children: "Average parent rating"
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "text-3xl font-black text-cyan-600 mb-1",
                                                            children: "99.9%"
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                            className: "text-ink-700 text-sm",
                                                            children: "On-time delivery"
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "text-3xl font-black text-blue-600 mb-1",
                                                            children: "100%"
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                            className: "text-ink-700 text-sm",
                                                            children: "Flexible subscriptions"
                                                        })
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                                    className: "p-4 rounded-xl bg-slate-50 border border-slate-200",
                                                    children: [
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                                            className: "text-3xl font-black text-purple-600 mb-1",
                                                            children: "0"
                                                        }),
                                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                                            className: "text-ink-700 text-sm",
                                                            children: "Food colorings added"
                                                        })
                                                    ]
                                                })
                                            ]
                                        })
                                    ]
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("section", {
                id: "reasons",
                className: "mx-auto max-w-7xl px-4 py-12 md:py-16",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "grid md:grid-cols-3 gap-8",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FeatureItem, {
                            icon: lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Leaf */ .B3Q,
                            title: "Natural Ingredients",
                            description: "Sustainably sourced whole and fresh ingredients. We keep it clean and simple."
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FeatureItem, {
                            icon: lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .GraduationCap */ .XHo,
                            title: "Designed by Nutritionists",
                            description: "Balanced, age-appropriate meals aligned to recommended dietary allowances."
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(FeatureItem, {
                            icon: lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .ChefHat */ .eP4,
                            title: "Prepared by Chefs & Parents",
                            description: "A team of chefs and parents ensure variety, taste and safety every day."
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("section", {
                id: "how",
                className: "bg-white border-y border-slate-200/70",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "mx-auto max-w-7xl px-4 py-16",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                            className: "text-3xl md:text-4xl font-black text-ink-900 text-center mb-10",
                            children: "How it works"
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "grid md:grid-cols-3 gap-6",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
                                    className: "rounded-2xl border-slate-200",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                                                className: "flex items-center gap-3 text-ink-900",
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Utensils */ .qT0, {
                                                        className: "h-5 w-5 text-emerald-600"
                                                    }),
                                                    "1. Order Online"
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                                            className: "text-ink-700",
                                            children: "Choose a single meal or subscribe for the week/month. Customize preferences and allergies."
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
                                    className: "rounded-2xl border-slate-200",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                                                className: "flex items-center gap-3 text-ink-900",
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Clock */ .SUY, {
                                                        className: "h-5 w-5 text-cyan-600"
                                                    }),
                                                    "2. Delivered Warm"
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                                            className: "text-ink-700",
                                            children: "Meals arrive to the classroom just before recess. Packed for freshness and warmth."
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
                                    className: "rounded-2xl border-slate-200",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                                            children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                                                className: "flex items-center gap-3 text-ink-900",
                                                children: [
                                                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Repeat */ .wA, {
                                                        className: "h-5 w-5 text-blue-600"
                                                    }),
                                                    "3. Full Flexibility"
                                                ]
                                            })
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                                            className: "text-ink-700",
                                            children: "Change, pause, or cancel by midnight. Manage everything from your dashboard."
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "text-center mt-10",
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                href: "/menu",
                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                    size: "lg",
                                    className: "rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500",
                                    onClick: ()=>_lib_analytics__WEBPACK_IMPORTED_MODULE_8__/* .events */ .U.ctaClick("how_start_order", {
                                            location: "how_it_works"
                                        }),
                                    children: "Start an Order"
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("section", {
                id: "testimonials",
                className: "mx-auto max-w-7xl px-4 py-16",
                children: [
                    /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                        className: "text-center mb-10",
                        children: [
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_5__/* .Badge */ .C, {
                                className: "mb-3 bg-purple-100 text-purple-700 border-purple-200",
                                children: "Parents say it best"
                            }),
                            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                className: "text-3xl md:text-4xl font-black text-ink-900",
                                children: "Loved by busy families"
                            })
                        ]
                    }),
                    /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                        className: "grid md:grid-cols-3 gap-6",
                        children: testimonials.map((t, i)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
                                className: "rounded-2xl border-slate-200",
                                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                                    className: "p-6",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "flex mb-3",
                                            children: [
                                                ...Array(5)
                                            ].map((_, idx)=>/*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Star */ .Uxw, {
                                                    className: "h-4 w-4 text-yellow-400 fill-current"
                                                }, idx))
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("p", {
                                            className: "text-ink-700 italic",
                                            children: [
                                                "“",
                                                t.quote,
                                                "”"
                                            ]
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "mt-4 text-sm text-ink-700 font-medium",
                                            children: t.author
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                                            className: "text-xs text-ink-500",
                                            children: t.title
                                        })
                                    ]
                                })
                            }, i))
                    })
                ]
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("section", {
                id: "contact",
                className: "mx-auto max-w-7xl px-4 py-16",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "grid md:grid-cols-2 gap-8 items-center",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h3", {
                                    className: "text-2xl md:text-3xl font-black text-ink-900",
                                    children: "We feed your kids like our own"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("p", {
                                    className: "mt-3 text-ink-700",
                                    children: "Follow us for menu highlights, behind-the-scenes, and nutrition tips."
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                    className: "mt-6 flex gap-3",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                            href: instagramUrl,
                                            target: "_blank",
                                            rel: "noreferrer",
                                            "aria-label": "HASIVU on Instagram",
                                            className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Instagram */ .mre, {
                                                    className: "h-4 w-4"
                                                }),
                                                " Instagram"
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                            href: twitterUrl,
                                            target: "_blank",
                                            rel: "noreferrer",
                                            "aria-label": "HASIVU on Twitter",
                                            className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Twitter */ .tLe, {
                                                    className: "h-4 w-4"
                                                }),
                                                " Twitter"
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("a", {
                                            href: linkedinUrl,
                                            target: "_blank",
                                            rel: "noreferrer",
                                            "aria-label": "HASIVU on LinkedIn",
                                            className: "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-ink-700 hover:bg-slate-50",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Linkedin */ .n6B, {
                                                    className: "h-4 w-4"
                                                }),
                                                " LinkedIn"
                                            ]
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .Card */ .Zb, {
                            className: "rounded-2xl border-slate-200",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardHeader */ .Ol, {
                                    children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardTitle */ .ll, {
                                        className: "text-ink-900",
                                        children: "Let's get talking!"
                                    })
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_card__WEBPACK_IMPORTED_MODULE_4__/* .CardContent */ .aY, {
                                    className: "space-y-3 text-ink-700",
                                    children: [
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Mail */ .Mh9, {
                                                    className: "h-4 w-4 text-emerald-600",
                                                    "aria-hidden": "true"
                                                }),
                                                " support@hasivu.com"
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .Phone */ .LPZ, {
                                                    className: "h-4 w-4 text-cyan-600",
                                                    "aria-hidden": "true"
                                                }),
                                                " +91 91361 47011"
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                                            className: "flex items-center gap-3",
                                            children: [
                                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(lucide_react__WEBPACK_IMPORTED_MODULE_9__/* .MapPin */ .$td, {
                                                    className: "h-4 w-4 text-blue-600",
                                                    "aria-hidden": "true"
                                                }),
                                                " Bangalore, India"
                                            ]
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("section", {
                id: "faqs",
                className: "bg-white border-y border-slate-200/70",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "mx-auto max-w-3xl px-4 py-16",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "text-center mb-8",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_badge__WEBPACK_IMPORTED_MODULE_5__/* .Badge */ .C, {
                                    className: "mb-3 bg-slate-100 text-ink-700 border-slate-200",
                                    children: "FAQs"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("h2", {
                                    className: "text-3xl font-black text-ink-900",
                                    children: "Questions parents ask"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .Accordion */ .UQ, {
                            type: "single",
                            collapsible: true,
                            className: "w-full",
                            children: [
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionItem */ .Qd, {
                                    value: "item-1",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionTrigger */ .o4, {
                                            children: "Can I pause or cancel a subscription?"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionContent */ .vF, {
                                            children: "Yes — change, pause, or cancel meals up to midnight the day before. Your dashboard gives you full control."
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionItem */ .Qd, {
                                    value: "item-2",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionTrigger */ .o4, {
                                            children: "Are meals delivered warm to classrooms?"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionContent */ .vF, {
                                            children: "Meals are prepared fresh and delivered to classrooms just before recess to keep them warm and safe."
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionItem */ .Qd, {
                                    value: "item-3",
                                    children: [
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionTrigger */ .o4, {
                                            children: "How do you handle allergies?"
                                        }),
                                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_accordion__WEBPACK_IMPORTED_MODULE_7__/* .AccordionContent */ .vF, {
                                            children: "You can set dietary preferences and allergies during ordering. We filter options and label allergens clearly."
                                        })
                                    ]
                                })
                            ]
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("footer", {
                className: "border-t border-slate-200/80 bg-white",
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                    className: "mx-auto max-w-7xl px-4 py-8 grid md:grid-cols-3 gap-6 items-center",
                    children: [
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "text-sm text-ink-700",
                            children: [
                                "\xa9 ",
                                new Date().getFullYear(),
                                " HASIVU"
                            ]
                        }),
                        /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)("div", {
                            className: "flex justify-center gap-6 text-sm",
                            children: [
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/",
                                    className: "text-ink-700 hover:text-ink-900",
                                    children: "Home"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "#faqs",
                                    className: "text-ink-700 hover:text-ink-900",
                                    children: "FAQs"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/privacy",
                                    className: "text-ink-700 hover:text-ink-900",
                                    children: "Privacy"
                                }),
                                /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                    href: "/terms",
                                    className: "text-ink-700 hover:text-ink-900",
                                    children: "Terms"
                                })
                            ]
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "text-right",
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx((next_link__WEBPACK_IMPORTED_MODULE_2___default()), {
                                href: "/menu",
                                children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_button__WEBPACK_IMPORTED_MODULE_3__/* .Button */ .z, {
                                    size: "sm",
                                    variant: "outline",
                                    className: "rounded-xl",
                                    onClick: ()=>_lib_analytics__WEBPACK_IMPORTED_MODULE_8__/* .events */ .U.ctaClick("footer_order_now", {
                                            location: "footer"
                                        }),
                                    children: "Order Now"
                                })
                            })
                        })
                    ]
                })
            }),
            /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_dialog__WEBPACK_IMPORTED_MODULE_6__/* .Dialog */ .Vq, {
                open: videoOpen,
                onOpenChange: setVideoOpen,
                children: /*#__PURE__*/ (0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxs)(_components_ui_dialog__WEBPACK_IMPORTED_MODULE_6__/* .DialogContent */ .cZ, {
                    className: "sm:max-w-[900px]",
                    children: [
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_dialog__WEBPACK_IMPORTED_MODULE_6__/* .DialogHeader */ .fK, {
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx(_components_ui_dialog__WEBPACK_IMPORTED_MODULE_6__/* .DialogTitle */ .$N, {
                                children: "How to Order"
                            })
                        }),
                        /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("div", {
                            className: "aspect-video w-full rounded-lg overflow-hidden bg-black",
                            children: /*#__PURE__*/ react_jsx_runtime__WEBPACK_IMPORTED_MODULE_0__.jsx("video", {
                                src: "/videos/how-to-order.mp4",
                                className: "w-full h-full",
                                controls: true,
                                poster: "/videos/how-to-order-poster.jpg"
                            })
                        })
                    ]
                })
            })
        ]
    });
}


/***/ }),

/***/ 50053:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/landing/StartwellInspiredLandingPage.tsx`)

// Accessing the __esModule property and exporting $$typeof are required here.
// The __esModule getter forces the proxy target to create the default export
// and the $$typeof value is for rendering logic to determine if the module
// is a client boundary.
const { __esModule, $$typeof } = proxy;
const __default__ = proxy.default;


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (__default__);

/***/ })

};
;