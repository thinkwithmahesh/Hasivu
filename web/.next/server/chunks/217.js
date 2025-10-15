"use strict";
exports.id = 217;
exports.ids = [217];
exports.modules = {

/***/ 30217:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Fk: () => (/* binding */ OrderCard),
  z6: () => (/* binding */ generateDemoOrder)
});

// UNUSED EXPORTS: default

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: external "next/dist/compiled/react"
var react_ = __webpack_require__(18038);
// EXTERNAL MODULE: ./node_modules/framer-motion/dist/es/render/dom/motion.mjs + 194 modules
var motion = __webpack_require__(94571);
// EXTERNAL MODULE: ./node_modules/lucide-react/dist/cjs/lucide-react.js
var lucide_react = __webpack_require__(51158);
// EXTERNAL MODULE: ./src/components/ui/card.tsx
var card = __webpack_require__(58003);
// EXTERNAL MODULE: ./src/components/ui/badge.tsx
var badge = __webpack_require__(5114);
// EXTERNAL MODULE: ./src/components/ui/button.tsx
var ui_button = __webpack_require__(29256);
// EXTERNAL MODULE: ./src/components/ui/avatar.tsx
var avatar = __webpack_require__(22452);
// EXTERNAL MODULE: ./src/components/ui/progress.tsx
var progress = __webpack_require__(81707);
// EXTERNAL MODULE: ./node_modules/@radix-ui/react-dropdown-menu/dist/index.mjs + 4 modules
var dist = __webpack_require__(63710);
// EXTERNAL MODULE: ./src/lib/utils.ts
var utils = __webpack_require__(12019);
;// CONCATENATED MODULE: ./src/components/ui/dropdown-menu.tsx
/* __next_internal_client_entry_do_not_use__ DropdownMenu,DropdownMenuTrigger,DropdownMenuContent,DropdownMenuItem,DropdownMenuCheckboxItem,DropdownMenuRadioItem,DropdownMenuLabel,DropdownMenuSeparator,DropdownMenuShortcut,DropdownMenuGroup,DropdownMenuPortal,DropdownMenuSub,DropdownMenuSubContent,DropdownMenuSubTrigger,DropdownMenuRadioGroup auto */ 




const DropdownMenu = dist/* Root */.fC;
const DropdownMenuTrigger = dist/* Trigger */.xz;
const DropdownMenuGroup = dist/* Group */.ZA;
const DropdownMenuPortal = dist/* Portal */.Uv;
const DropdownMenuSub = dist/* Sub */.Tr;
const DropdownMenuRadioGroup = dist/* RadioGroup */.Ee;
const DropdownMenuSubTrigger = /*#__PURE__*/ react_.forwardRef(({ className, inset, children, ...props }, ref)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)(dist/* SubTrigger */.fF, {
        ref: ref,
        className: (0,utils.cn)("flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
        ...props,
        children: [
            children,
            /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronRight */._Qn, {
                className: "ml-auto"
            })
        ]
    }));
DropdownMenuSubTrigger.displayName = dist/* SubTrigger */.fF.displayName;
const DropdownMenuSubContent = /*#__PURE__*/ react_.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ jsx_runtime_.jsx(dist/* SubContent */.tu, {
        ref: ref,
        className: (0,utils.cn)("z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]", className),
        ...props
    }));
DropdownMenuSubContent.displayName = dist/* SubContent */.tu.displayName;
const DropdownMenuContent = /*#__PURE__*/ react_.forwardRef(({ className, sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ jsx_runtime_.jsx(dist/* Portal */.Uv, {
        children: /*#__PURE__*/ jsx_runtime_.jsx(dist/* Content */.VY, {
            ref: ref,
            sideOffset: sideOffset,
            className: (0,utils.cn)("z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]", className),
            ...props
        })
    }));
DropdownMenuContent.displayName = dist/* Content */.VY.displayName;
const DropdownMenuItem = /*#__PURE__*/ react_.forwardRef(({ className, inset, ...props }, ref)=>/*#__PURE__*/ jsx_runtime_.jsx(dist/* Item */.ck, {
        ref: ref,
        className: (0,utils.cn)("relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", inset && "pl-8", className),
        ...props
    }));
DropdownMenuItem.displayName = dist/* Item */.ck.displayName;
const DropdownMenuCheckboxItem = /*#__PURE__*/ react_.forwardRef(({ className, children, checked, ...props }, ref)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)(dist/* CheckboxItem */.oC, {
        ref: ref,
        className: (0,utils.cn)("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        checked: checked,
        ...props,
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ jsx_runtime_.jsx(dist/* ItemIndicator */.wU, {
                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Check */.JrY, {
                        className: "h-4 w-4"
                    })
                })
            }),
            children
        ]
    }));
DropdownMenuCheckboxItem.displayName = dist/* CheckboxItem */.oC.displayName;
const DropdownMenuRadioItem = /*#__PURE__*/ react_.forwardRef(({ className, children, ...props }, ref)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)(dist/* RadioItem */.Rk, {
        ref: ref,
        className: (0,utils.cn)("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        ...props,
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ jsx_runtime_.jsx(dist/* ItemIndicator */.wU, {
                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Circle */.Cdc, {
                        className: "h-2 w-2 fill-current"
                    })
                })
            }),
            children
        ]
    }));
DropdownMenuRadioItem.displayName = dist/* RadioItem */.Rk.displayName;
const DropdownMenuLabel = /*#__PURE__*/ react_.forwardRef(({ className, inset, ...props }, ref)=>/*#__PURE__*/ jsx_runtime_.jsx(dist/* Label */.__, {
        ref: ref,
        className: (0,utils.cn)("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className),
        ...props
    }));
DropdownMenuLabel.displayName = dist/* Label */.__.displayName;
const DropdownMenuSeparator = /*#__PURE__*/ react_.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ jsx_runtime_.jsx(dist/* Separator */.Z0, {
        ref: ref,
        className: (0,utils.cn)("-mx-1 my-1 h-px bg-muted", className),
        ...props
    }));
DropdownMenuSeparator.displayName = dist/* Separator */.Z0.displayName;
const DropdownMenuShortcut = ({ className, ...props })=>{
    return /*#__PURE__*/ jsx_runtime_.jsx("span", {
        className: (0,utils.cn)("ml-auto text-xs tracking-widest opacity-60", className),
        ...props
    });
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";


// EXTERNAL MODULE: ./src/components/ui/separator.tsx
var separator = __webpack_require__(33959);
// EXTERNAL MODULE: ./node_modules/framer-motion/dist/es/components/AnimatePresence/index.mjs + 5 modules
var AnimatePresence = __webpack_require__(30569);
// EXTERNAL MODULE: ./src/components/ui/dialog.tsx
var dialog = __webpack_require__(5511);
;// CONCATENATED MODULE: ./src/components/ui/textarea.tsx



const Textarea = /*#__PURE__*/ react_.forwardRef(({ className, ...props }, ref)=>{
    return /*#__PURE__*/ jsx_runtime_.jsx("textarea", {
        className: (0,utils.cn)("flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", className),
        ref: ref,
        ...props
    });
});
Textarea.displayName = "Textarea";


// EXTERNAL MODULE: ./node_modules/@radix-ui/react-checkbox/dist/index.mjs + 1 modules
var react_checkbox_dist = __webpack_require__(19327);
;// CONCATENATED MODULE: ./src/components/ui/checkbox.tsx
/* __next_internal_client_entry_do_not_use__ Checkbox auto */ 




const Checkbox = /*#__PURE__*/ react_.forwardRef(({ className, ...props }, ref)=>/*#__PURE__*/ jsx_runtime_.jsx(react_checkbox_dist/* Root */.fC, {
        ref: ref,
        className: (0,utils.cn)("peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
        ...props,
        children: /*#__PURE__*/ jsx_runtime_.jsx(react_checkbox_dist/* Indicator */.z$, {
            className: (0,utils.cn)("flex items-center justify-center text-current"),
            children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Check */.JrY, {
                className: "h-4 w-4"
            })
        })
    }));
Checkbox.displayName = react_checkbox_dist/* Root */.fC.displayName;


// EXTERNAL MODULE: ./src/components/ui/label.tsx
var label = __webpack_require__(89122);
// EXTERNAL MODULE: ./src/components/ui/alert.tsx
var ui_alert = __webpack_require__(92663);
;// CONCATENATED MODULE: ./src/components/orders/OrderCancellationModal.tsx
/* __next_internal_client_entry_do_not_use__ OrderCancellationModal,default auto */ 










// Predefined cancellation reasons
const CANCELLATION_REASONS = [
    "Change of mind",
    "Wrong order placed",
    "Delivery delay",
    "Allergies/medical reasons",
    "Duplicate order",
    "Student not available",
    "Payment issues",
    "Other"
];
function OrderCancellationModal({ isOpen, onClose, orderId, orderNumber, orderAmount, onCancellationComplete }) {
    const [selectedReason, setSelectedReason] = (0,react_.useState)("");
    const [customReason, setCustomReason] = (0,react_.useState)("");
    const [refundRequested, setRefundRequested] = (0,react_.useState)(true);
    const [isSubmitting, setIsSubmitting] = (0,react_.useState)(false);
    const [error, setError] = (0,react_.useState)(null);
    // Get the final reason (custom or selected)
    const getFinalReason = ()=>{
        if (selectedReason === "Other") {
            return customReason.trim() || "Other";
        }
        return selectedReason;
    };
    // Handle form submission
    const handleSubmit = async ()=>{
        const reason = getFinalReason();
        if (!reason) {
            setError("Please provide a cancellation reason");
            return;
        }
        setIsSubmitting(true);
        setError(null);
        try {
            // Prepare cancellation request
            const cancellationRequest = {
                reason,
                refundRequested,
                cancelledBy: "parent-123"
            };
            // Call API to cancel order
            const response = await cancelOrderAPI(orderId, cancellationRequest);
            // Notify parent component
            onCancellationComplete(response);
            // Close modal on success
            if (response.success) {
                onClose();
                // Reset form
                setSelectedReason("");
                setCustomReason("");
                setRefundRequested(true);
            }
        } catch (err) {
            setError("Failed to cancel order. Please try again.");
        } finally{
            setIsSubmitting(false);
        }
    };
    // API call to cancel order
    const cancelOrderAPI = async (orderId, request)=>{
        try {
            const response = await fetch(`/api/orders/${orderId}/cancel`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(request)
            });
            if (!response.ok) {
                const errorData = await response.json();
                return {
                    success: false,
                    error: {
                        message: errorData.message || "Failed to cancel order",
                        code: errorData.code || "CANCELLATION_FAILED"
                    }
                };
            }
            const data = await response.json();
            return {
                success: true,
                data: {
                    refundEligible: data.refundEligible,
                    refundAmount: data.refundAmount
                }
            };
        } catch (error) {
            return {
                success: false,
                error: {
                    message: "Network error. Please check your connection and try again.",
                    code: "NETWORK_ERROR"
                }
            };
        }
    };
    const handleClose = ()=>{
        if (!isSubmitting) {
            onClose();
            // Reset form
            setSelectedReason("");
            setCustomReason("");
            setRefundRequested(true);
            setError(null);
        }
    };
    return /*#__PURE__*/ jsx_runtime_.jsx(dialog/* Dialog */.Vq, {
        open: isOpen,
        onOpenChange: handleClose,
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogContent */.cZ, {
            className: "sm:max-w-md",
            children: [
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogHeader */.fK, {
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogTitle */.$N, {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertTriangle */.uyG, {
                                    className: "h-5 w-5 text-orange-500"
                                }),
                                "Cancel Order"
                            ]
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogDescription */.Be, {
                            children: [
                                "Cancel order #",
                                orderNumber,
                                " for ₹",
                                orderAmount
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "space-y-4",
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_alert/* Alert */.bZ, {
                            className: "border-orange-200 bg-orange-50",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertTriangle */.uyG, {
                                    className: "h-4 w-4 text-orange-600"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_alert/* AlertDescription */.X, {
                                    className: "text-orange-800",
                                    children: "Cancelling this order may result in charges depending on the preparation status. Refunds are processed within 3-5 business days."
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "space-y-3",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                    className: "text-sm font-medium",
                                    children: "Reason for cancellation *"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                    className: "space-y-2",
                                    children: CANCELLATION_REASONS.map((reason)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                            className: "flex items-center space-x-2",
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx("input", {
                                                    type: "radio",
                                                    id: reason,
                                                    name: "cancellation-reason",
                                                    value: reason,
                                                    checked: selectedReason === reason,
                                                    onChange: (e)=>setSelectedReason(e.target.value),
                                                    className: "text-primary-600 focus:ring-primary-500"
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                                    htmlFor: reason,
                                                    className: "text-sm cursor-pointer",
                                                    children: reason
                                                })
                                            ]
                                        }, reason))
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(AnimatePresence/* AnimatePresence */.M, {
                                    children: selectedReason === "Other" && /*#__PURE__*/ jsx_runtime_.jsx(motion/* motion */.E.div, {
                                        initial: {
                                            opacity: 0,
                                            height: 0
                                        },
                                        animate: {
                                            opacity: 1,
                                            height: "auto"
                                        },
                                        exit: {
                                            opacity: 0,
                                            height: 0
                                        },
                                        className: "overflow-hidden",
                                        children: /*#__PURE__*/ jsx_runtime_.jsx(Textarea, {
                                            placeholder: "Please provide details about why you're cancelling this order...",
                                            value: customReason,
                                            onChange: (e)=>setCustomReason(e.target.value),
                                            className: "mt-2",
                                            rows: 3
                                        })
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx(separator/* Separator */.Z, {}),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "flex items-center space-x-2",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(Checkbox, {
                                    id: "refund-request",
                                    checked: refundRequested,
                                    onCheckedChange: (checked)=>setRefundRequested(checked)
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                    htmlFor: "refund-request",
                                    className: "text-sm",
                                    children: "Request refund to original payment method"
                                })
                            ]
                        }),
                        refundRequested && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "p-3 bg-blue-50 border border-blue-200 rounded-lg",
                            children: [
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    className: "flex items-center gap-2 text-blue-800",
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* CreditCard */.aBT, {
                                            className: "h-4 w-4"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                            className: "text-sm font-medium",
                                            children: "Refund Information"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                    className: "text-sm text-blue-700 mt-1",
                                    children: "Refund eligibility will be determined based on order status and preparation progress. Refunds are typically processed within 3-5 business days."
                                })
                            ]
                        }),
                        error && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_alert/* Alert */.bZ, {
                            className: "border-red-200 bg-red-50",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* XCircle */.a2, {
                                    className: "h-4 w-4 text-red-600"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_alert/* AlertDescription */.X, {
                                    className: "text-red-800",
                                    children: error
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "flex gap-3 pt-4",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: "outline",
                                    onClick: handleClose,
                                    disabled: isSubmitting,
                                    className: "flex-1",
                                    children: "Keep Order"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: "destructive",
                                    onClick: handleSubmit,
                                    disabled: isSubmitting || !selectedReason || selectedReason === "Other" && !customReason.trim(),
                                    className: "flex-1",
                                    children: isSubmitting ? /*#__PURE__*/ (0,jsx_runtime_.jsxs)(jsx_runtime_.Fragment, {
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Loader2 */.zM5, {
                                                className: "mr-2 h-4 w-4 animate-spin"
                                            }),
                                            "Cancelling..."
                                        ]
                                    }) : "Cancel Order"
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}
/* harmony default export */ const orders_OrderCancellationModal = ((/* unused pure expression or super */ null && (OrderCancellationModal)));

;// CONCATENATED MODULE: ./src/components/orders/OrderCard.tsx
/* __next_internal_client_entry_do_not_use__ OrderCard,generateDemoOrder,default auto */ 
/**
 * HASIVU Platform - Order Card Component
 * Displays order information with real-time status updates
 */ 










function OrderCard({ order, onOrderUpdate, onViewDetails, onOrderCancel, showActions = true, className = "" }) {
    const [isUpdating, setIsUpdating] = (0,react_.useState)(false);
    const [statusProgress, setStatusProgress] = (0,react_.useState)(0);
    const [showCancellationModal, setShowCancellationModal] = (0,react_.useState)(false);
    // Calculate status progress
    (0,react_.useEffect)(()=>{
        const statusMap = {
            pending: 10,
            confirmed: 25,
            preparing: 50,
            ready: 75,
            delivered: 100,
            cancelled: 0
        };
        setStatusProgress(statusMap[order.status] || 0);
    }, [
        order.status
    ]);
    const getStatusConfig = (status)=>{
        const configs = {
            pending: {
                color: "orange",
                bgColor: "bg-orange-50",
                textColor: "text-orange-700",
                borderColor: "border-orange-200",
                icon: lucide_react/* Clock */.SUY,
                message: "Order received"
            },
            confirmed: {
                color: "blue",
                bgColor: "bg-blue-50",
                textColor: "text-blue-700",
                borderColor: "border-blue-200",
                icon: lucide_react/* CheckCircle */.fU8,
                message: "Order confirmed"
            },
            preparing: {
                color: "purple",
                bgColor: "bg-purple-50",
                textColor: "text-purple-700",
                borderColor: "border-purple-200",
                icon: lucide_react/* ChefHat */.eP4,
                message: "Being prepared"
            },
            ready: {
                color: "green",
                bgColor: "bg-green-50",
                textColor: "text-green-700",
                borderColor: "border-green-200",
                icon: lucide_react/* CheckCircle */.fU8,
                message: "Ready for pickup"
            },
            delivered: {
                color: "green",
                bgColor: "bg-green-50",
                textColor: "text-green-700",
                borderColor: "border-green-200",
                icon: lucide_react/* Truck */._DY,
                message: "Delivered successfully"
            },
            cancelled: {
                color: "red",
                bgColor: "bg-red-50",
                textColor: "text-red-700",
                borderColor: "border-red-200",
                icon: lucide_react/* AlertCircle */.bG7,
                message: "Order cancelled"
            }
        };
        return configs[status];
    };
    const getPaymentStatusBadge = (paymentStatus)=>{
        const variants = {
            pending: {
                variant: "secondary",
                text: "Payment Pending"
            },
            completed: {
                variant: "default",
                text: "Paid"
            },
            failed: {
                variant: "destructive",
                text: "Payment Failed"
            },
            refunded: {
                variant: "outline",
                text: "Refunded"
            }
        };
        return variants[paymentStatus];
    };
    const handleStatusUpdate = async (newStatus)=>{
        if (!onOrderUpdate) return;
        setIsUpdating(true);
        try {
            const newStatusEntry = {
                status: newStatus,
                timestamp: new Date().toISOString(),
                message: `Order ${newStatus}`
            };
            await onOrderUpdate(order.id, {
                status: newStatus,
                statusHistory: [
                    ...order.statusHistory,
                    newStatusEntry
                ]
            });
        } catch (error) {} finally{
            setIsUpdating(false);
        }
    };
    // Check if order can be cancelled
    const canCancelOrder = ()=>{
        const cancellableStatuses = [
            "pending",
            "confirmed",
            "preparing"
        ];
        return cancellableStatuses.includes(order.status) && order.status !== "cancelled";
    };
    // Handle order cancellation
    const handleOrderCancellation = (result)=>{
        if (result.success && onOrderCancel) {
            onOrderCancel(order.id, result);
        }
    };
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;
    const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(motion/* motion */.E.div, {
        layout: true,
        initial: {
            opacity: 0,
            y: 20
        },
        animate: {
            opacity: 1,
            y: 0
        },
        exit: {
            opacity: 0,
            y: -20
        },
        className: className,
        "data-testid": `order-card-${order.id}`,
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* Card */.Zb, {
                className: `relative overflow-hidden border-2 ${statusConfig.borderColor} ${statusConfig.bgColor}`,
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                        className: "absolute top-0 left-0 right-0 h-1 bg-gray-200",
                        children: /*#__PURE__*/ jsx_runtime_.jsx(motion/* motion */.E.div, {
                            className: `h-full bg-${statusConfig.color}-500`,
                            initial: {
                                width: 0
                            },
                            animate: {
                                width: `${statusProgress}%`
                            },
                            transition: {
                                duration: 0.8,
                                ease: "easeOut"
                            }
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* CardHeader */.Ol, {
                        className: "pb-3",
                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    className: "flex items-center space-x-3",
                                    children: [
                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(avatar/* Avatar */.qE, {
                                            className: "h-10 w-10",
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx(avatar/* AvatarImage */.F$, {
                                                    src: order.studentAvatar,
                                                    alt: order.studentName
                                                }),
                                                /*#__PURE__*/ jsx_runtime_.jsx(avatar/* AvatarFallback */.Q5, {
                                                    children: order.studentName.split(" ").map((n)=>n[0]).join("").toUpperCase()
                                                })
                                            ]
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                            children: [
                                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardTitle */.ll, {
                                                    className: "text-lg font-semibold",
                                                    children: [
                                                        "Order #",
                                                        order.orderNumber
                                                    ]
                                                }),
                                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                                    className: "text-sm text-gray-600 flex items-center",
                                                    children: [
                                                        /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* User */.sLt, {
                                                            className: "w-4 h-4 mr-1"
                                                        }),
                                                        order.studentName
                                                    ]
                                                })
                                            ]
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(badge/* Badge */.C, {
                                            variant: paymentBadge.variant,
                                            className: "text-xs",
                                            children: paymentBadge.text
                                        }),
                                        showActions && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(DropdownMenu, {
                                            children: [
                                                /*#__PURE__*/ jsx_runtime_.jsx(DropdownMenuTrigger, {
                                                    asChild: true,
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                                        variant: "ghost",
                                                        size: "sm",
                                                        className: "h-8 w-8 p-0",
                                                        children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* MoreVertical */.hlC, {
                                                            className: "h-4 w-4"
                                                        })
                                                    })
                                                }),
                                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)(DropdownMenuContent, {
                                                    align: "end",
                                                    children: [
                                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(DropdownMenuItem, {
                                                            onClick: ()=>onViewDetails?.(order.id),
                                                            children: [
                                                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Eye */.bAj, {
                                                                    className: "mr-2 h-4 w-4"
                                                                }),
                                                                "View Details"
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(DropdownMenuItem, {
                                                            children: [
                                                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Download */.UWx, {
                                                                    className: "mr-2 h-4 w-4"
                                                                }),
                                                                "Download Receipt"
                                                            ]
                                                        }),
                                                        order.status === "pending" && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(DropdownMenuItem, {
                                                            onClick: ()=>handleStatusUpdate("confirmed"),
                                                            disabled: isUpdating,
                                                            children: [
                                                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* CheckCircle */.fU8, {
                                                                    className: "mr-2 h-4 w-4"
                                                                }),
                                                                "Confirm Order"
                                                            ]
                                                        }),
                                                        canCancelOrder() && /*#__PURE__*/ (0,jsx_runtime_.jsxs)(DropdownMenuItem, {
                                                            onClick: ()=>setShowCancellationModal(true),
                                                            disabled: isUpdating,
                                                            className: "text-red-600 focus:text-red-600",
                                                            children: [
                                                                /*#__PURE__*/ jsx_runtime_.jsx(lucide_react.X, {
                                                                    className: "mr-2 h-4 w-4"
                                                                }),
                                                                "Cancel Order"
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
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardContent */.aY, {
                        className: "space-y-4",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "flex items-center space-x-2",
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx(motion/* motion */.E.div, {
                                                animate: {
                                                    rotate: isUpdating ? 360 : 0
                                                },
                                                transition: {
                                                    duration: 1,
                                                    repeat: isUpdating ? Infinity : 0,
                                                    ease: "linear"
                                                },
                                                children: /*#__PURE__*/ jsx_runtime_.jsx(StatusIcon, {
                                                    className: `h-5 w-5 ${statusConfig.textColor}`
                                                })
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                className: `font-medium ${statusConfig.textColor}`,
                                                children: statusConfig.message
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "text-sm text-gray-500",
                                        children: new Date(order.placedAt).toLocaleTimeString()
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(progress/* Progress */.E, {
                                value: statusProgress,
                                className: "h-2"
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("h4", {
                                        className: "font-medium text-sm text-gray-700",
                                        children: "Order Items"
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "space-y-1",
                                        children: [
                                            order.items.slice(0, 3).map((item)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                    className: "flex justify-between items-center text-sm",
                                                    children: [
                                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                            className: "flex-1",
                                                            children: [
                                                                item.quantity,
                                                                "x ",
                                                                item.name
                                                            ]
                                                        }),
                                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                            className: "font-medium",
                                                            children: [
                                                                "₹",
                                                                item.price * item.quantity
                                                            ]
                                                        })
                                                    ]
                                                }, item.id)),
                                            order.items.length > 3 && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                                className: "text-xs text-gray-500",
                                                children: [
                                                    "+",
                                                    order.items.length - 3,
                                                    " more items"
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(separator/* Separator */.Z, {}),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "flex items-center space-x-4 text-sm text-gray-600",
                                        children: [
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                className: "flex items-center",
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* MapPin */.$td, {
                                                        className: "w-4 h-4 mr-1"
                                                    }),
                                                    order.location
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                className: "flex items-center",
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Calendar */.faS, {
                                                        className: "w-4 h-4 mr-1"
                                                    }),
                                                    new Date(order.placedAt).toLocaleDateString()
                                                ]
                                            }),
                                            order.rfidVerified && /*#__PURE__*/ jsx_runtime_.jsx(badge/* Badge */.C, {
                                                variant: "outline",
                                                className: "text-xs",
                                                children: "RFID Verified"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                        className: "text-right",
                                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                            className: "font-bold text-lg",
                                            children: [
                                                "₹",
                                                order.totalAmount
                                            ]
                                        })
                                    })
                                ]
                            }),
                            order.estimatedDelivery && order.status !== "delivered" && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between p-2 bg-blue-50 rounded-lg",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "text-sm text-blue-700",
                                        children: "Estimated ready time:"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "font-medium text-blue-800",
                                        children: new Date(order.estimatedDelivery).toLocaleTimeString()
                                    })
                                ]
                            }),
                            order.notes && /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "p-2 bg-gray-50 rounded-lg",
                                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                    className: "text-sm text-gray-700",
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx("strong", {
                                            children: "Notes:"
                                        }),
                                        " ",
                                        order.notes
                                    ]
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ jsx_runtime_.jsx(OrderCancellationModal, {
                isOpen: showCancellationModal,
                onClose: ()=>setShowCancellationModal(false),
                orderId: order.id,
                orderNumber: order.orderNumber,
                orderAmount: order.totalAmount,
                onCancellationComplete: handleOrderCancellation
            })
        ]
    });
}
// Demo order data generator
function generateDemoOrder() {
    const orderNumber = `ORD-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const statuses = [
        "pending",
        "confirmed",
        "preparing",
        "ready",
        "delivered"
    ];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    return {
        id: `order-${Date.now()}`,
        orderNumber,
        studentId: "student-123",
        studentName: "Priya Sharma",
        studentAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
        items: [
            {
                id: "item-1",
                name: "Masala Dosa",
                quantity: 1,
                price: 45
            },
            {
                id: "item-2",
                name: "Sambar & Chutney",
                quantity: 1,
                price: 15
            }
        ],
        totalAmount: 60,
        status: randomStatus,
        statusHistory: [
            {
                status: "pending",
                timestamp: new Date().toISOString(),
                message: "Order placed"
            }
        ],
        placedAt: new Date().toISOString(),
        estimatedDelivery: new Date(Date.now() + 1800000).toISOString(),
        location: "Cafeteria - Main Counter",
        paymentStatus: "completed",
        paymentMethod: "RFID Card",
        notes: "Extra spicy please",
        rfidVerified: true
    };
}
/* harmony default export */ const orders_OrderCard = ((/* unused pure expression or super */ null && (OrderCard)));


/***/ }),

/***/ 89122:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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

/***/ 81707:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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