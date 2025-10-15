exports.id = 3016;
exports.ids = [3016];
exports.modules = {

/***/ 73040:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

Promise.resolve(/* import() eager */).then(__webpack_require__.bind(__webpack_require__, 64565))

/***/ }),

/***/ 64565:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "default": () => (/* binding */ StaffScheduling)
});

// EXTERNAL MODULE: external "next/dist/compiled/react/jsx-runtime"
var jsx_runtime_ = __webpack_require__(56786);
// EXTERNAL MODULE: external "next/dist/compiled/react"
var react_ = __webpack_require__(18038);
// EXTERNAL MODULE: ./node_modules/framer-motion/dist/es/render/dom/motion.mjs + 194 modules
var motion = __webpack_require__(94571);
// EXTERNAL MODULE: ./node_modules/lucide-react/dist/cjs/lucide-react.js
var lucide_react = __webpack_require__(51158);
// EXTERNAL MODULE: ./src/components/ui/button.tsx
var ui_button = __webpack_require__(29256);
// EXTERNAL MODULE: ./src/components/ui/card.tsx
var card = __webpack_require__(58003);
// EXTERNAL MODULE: ./src/components/ui/badge.tsx
var badge = __webpack_require__(5114);
// EXTERNAL MODULE: ./src/components/ui/input.tsx
var input = __webpack_require__(17367);
// EXTERNAL MODULE: ./src/components/ui/label.tsx
var label = __webpack_require__(89122);
// EXTERNAL MODULE: ./src/components/ui/select.tsx
var ui_select = __webpack_require__(7848);
// EXTERNAL MODULE: ./src/components/ui/dialog.tsx
var dialog = __webpack_require__(5511);
// EXTERNAL MODULE: ./src/components/ui/avatar.tsx
var avatar = __webpack_require__(22452);
// EXTERNAL MODULE: ./src/hooks/use-toast.ts
var use_toast = __webpack_require__(30348);
// EXTERNAL MODULE: ./src/hooks/useApiIntegration.ts
var useApiIntegration = __webpack_require__(66493);
// EXTERNAL MODULE: ./src/services/api.ts
var api = __webpack_require__(10253);
;// CONCATENATED MODULE: ./src/hooks/useSocket.ts
/* __next_internal_client_entry_do_not_use__ useWebSocket,default auto */ 

function useWebSocket(options) {
    const [isConnected, setIsConnected] = (0,react_.useState)(false);
    const onMessageRef = (0,react_.useRef)(options?.onMessage);
    (0,react_.useEffect)(()=>{
        onMessageRef.current = options?.onMessage;
    }, [
        options?.onMessage
    ]);
    const makeEventHandler = (0,react_.useCallback)((eventName)=>(data)=>onMessageRef.current?.(eventName, data), []);
    (0,react_.useEffect)(()=>{
        try {
            const token =  false ? 0 : undefined;
            api/* wsManager */.Xe.connect(token);
        } catch (e) {
        // no-op
        }
        // Subscribe to common schedule events if a handler is provided
        if (onMessageRef.current) {
            api/* wsManager */.Xe.subscribe("schedule.updated", makeEventHandler("schedule.updated"));
            api/* wsManager */.Xe.subscribe("schedule.created", makeEventHandler("schedule.created"));
            api/* wsManager */.Xe.subscribe("schedule.deleted", makeEventHandler("schedule.deleted"));
        }
        const interval = setInterval(()=>setIsConnected(api/* wsManager */.Xe.isConnected()), 1000);
        setIsConnected(api/* wsManager */.Xe.isConnected());
        return ()=>{
            if (onMessageRef.current) {
                api/* wsManager */.Xe.unsubscribe("schedule.updated");
                api/* wsManager */.Xe.unsubscribe("schedule.created");
                api/* wsManager */.Xe.unsubscribe("schedule.deleted");
            }
            clearInterval(interval);
        };
    }, [
        makeEventHandler
    ]);
    const send = (0,react_.useCallback)((type, data)=>{
        api/* wsManager */.Xe.send(type, data);
    }, []);
    return {
        isConnected,
        send
    };
}
/* harmony default export */ const useSocket = ((/* unused pure expression or super */ null && (useWebSocket)));

;// CONCATENATED MODULE: ./src/components/staff/StaffScheduling.tsx
/* __next_internal_client_entry_do_not_use__ default auto */ 












// API hooks


const shiftTemplates = [
    {
        id: "morning",
        name: "Morning Shift",
        startTime: "06:00",
        endTime: "14:00",
        days: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday"
        ],
        isActive: true,
        color: "bg-yellow-100 text-yellow-800 border-yellow-200"
    },
    {
        id: "afternoon",
        name: "Afternoon Shift",
        startTime: "14:00",
        endTime: "22:00",
        days: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday"
        ],
        isActive: true,
        color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
        id: "night",
        name: "Night Shift",
        startTime: "22:00",
        endTime: "06:00",
        days: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday"
        ],
        isActive: true,
        color: "bg-purple-100 text-purple-800 border-purple-200"
    },
    {
        id: "weekend",
        name: "Weekend Shift",
        startTime: "08:00",
        endTime: "16:00",
        days: [
            "saturday",
            "sunday"
        ],
        isActive: true,
        color: "bg-green-100 text-green-800 border-green-200"
    }
];
const getShiftIcon = (shiftId)=>{
    switch(shiftId){
        case "morning":
            return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Sun */.kOA, {
                className: "w-3 h-3"
            });
        case "afternoon":
            return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Coffee */.nYX, {
                className: "w-3 h-3"
            });
        case "night":
            return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Moon */.JFe, {
                className: "w-3 h-3"
            });
        default:
            return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Clock */.SUY, {
                className: "w-3 h-3"
            });
    }
};
const ScheduleStatusBadge = ({ status })=>{
    const getStatusStyles = ()=>{
        switch(status){
            case "confirmed":
                return "bg-green-100 text-green-800 border-green-200";
            case "scheduled":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "completed":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "absent":
                return "bg-red-100 text-red-800 border-red-200";
            case "sick":
                return "bg-orange-100 text-orange-800 border-orange-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };
    const getStatusIcon = ()=>{
        switch(status){
            case "confirmed":
            case "completed":
                return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* CheckCircle */.fU8, {
                    className: "w-3 h-3"
                });
            case "absent":
                return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* XCircle */.a2, {
                    className: "w-3 h-3"
                });
            case "sick":
                return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertTriangle */.uyG, {
                    className: "w-3 h-3"
                });
            default:
                return /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Clock */.SUY, {
                    className: "w-3 h-3"
                });
        }
    };
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(badge/* Badge */.C, {
        className: `${getStatusStyles()} border capitalize flex items-center gap-1`,
        children: [
            getStatusIcon(),
            status
        ]
    });
};
const CalendarView = ({ schedules, staffMembers, currentWeek, onScheduleClick, onCreateSchedule })=>{
    const weekDays = (0,react_.useMemo)(()=>{
        const days = [];
        const startOfWeek = new Date(currentWeek);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        for(let i = 0; i < 7; i++){
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            days.push(day);
        }
        return days;
    }, [
        currentWeek
    ]);
    const getSchedulesForDay = (date, staffId)=>{
        const dateStr = date.toISOString().split("T")[0];
        return schedules.filter((s)=>s.date === dateStr && s.staffId === staffId);
    };
    return /*#__PURE__*/ jsx_runtime_.jsx("div", {
        className: "overflow-x-auto",
        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("table", {
            className: "w-full border-collapse",
            children: [
                /*#__PURE__*/ jsx_runtime_.jsx("thead", {
                    children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("tr", {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx("th", {
                                className: "text-left p-3 border-b font-medium text-gray-700",
                                children: "Staff"
                            }),
                            weekDays.map((day, index)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("th", {
                                    className: "text-center p-3 border-b border-l font-medium text-gray-700 min-w-[120px]",
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                            children: day.toLocaleDateString("en-US", {
                                                weekday: "short"
                                            })
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                            className: "text-sm text-gray-500",
                                            children: day.toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric"
                                            })
                                        })
                                    ]
                                }, index))
                        ]
                    })
                }),
                /*#__PURE__*/ jsx_runtime_.jsx("tbody", {
                    children: staffMembers.map((staff)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("tr", {
                            className: "hover:bg-gray-50",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("td", {
                                    className: "p-3 border-b",
                                    children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        className: "flex items-center space-x-3",
                                        children: [
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(avatar/* Avatar */.qE, {
                                                className: "w-8 h-8",
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx(avatar/* AvatarImage */.F$, {
                                                        src: staff.avatar,
                                                        alt: staff.name
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx(avatar/* AvatarFallback */.Q5, {
                                                        children: staff.name.split(" ").map((n)=>n[0]).join("")
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                children: [
                                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                        className: "font-medium text-gray-900",
                                                        children: staff.name
                                                    }),
                                                    /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                        className: "text-xs text-gray-500",
                                                        children: staff.role
                                                    })
                                                ]
                                            })
                                        ]
                                    })
                                }),
                                weekDays.map((day, dayIndex)=>{
                                    const daySchedules = getSchedulesForDay(day, staff.id);
                                    const isToday = day.toDateString() === new Date().toDateString();
                                    return /*#__PURE__*/ jsx_runtime_.jsx("td", {
                                        className: `p-2 border-b border-l ${isToday ? "bg-blue-50/50" : ""}`,
                                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                            className: "space-y-1 min-h-[80px]",
                                            children: [
                                                daySchedules.map((schedule)=>{
                                                    const shift = shiftTemplates.find((s)=>s.id === schedule.shiftId);
                                                    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(motion/* motion */.E.div, {
                                                        initial: {
                                                            opacity: 0,
                                                            scale: 0.9
                                                        },
                                                        animate: {
                                                            opacity: 1,
                                                            scale: 1
                                                        },
                                                        className: `p-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${shift?.color || "bg-gray-100"}`,
                                                        onClick: ()=>onScheduleClick(schedule),
                                                        "data-testid": `schedule-${schedule.id}`,
                                                        children: [
                                                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                                className: "flex items-center justify-between",
                                                                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                                    className: "flex items-center gap-1",
                                                                    children: [
                                                                        getShiftIcon(schedule.shiftId),
                                                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                                            className: "font-medium",
                                                                            children: [
                                                                                shift?.startTime,
                                                                                " - ",
                                                                                shift?.endTime
                                                                            ]
                                                                        })
                                                                    ]
                                                                })
                                                            }),
                                                            schedule.status !== "scheduled" && /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                                                className: "mt-1",
                                                                children: /*#__PURE__*/ jsx_runtime_.jsx(ScheduleStatusBadge, {
                                                                    status: schedule.status
                                                                })
                                                            })
                                                        ]
                                                    }, schedule.id);
                                                }),
                                                daySchedules.length === 0 && /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                                    variant: "ghost",
                                                    size: "sm",
                                                    className: "w-full h-full opacity-0 hover:opacity-100 transition-opacity",
                                                    onClick: ()=>onCreateSchedule(day.toISOString().split("T")[0], staff.id),
                                                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Plus */.v37, {
                                                        className: "w-3 h-3"
                                                    })
                                                })
                                            ]
                                        })
                                    }, dayIndex);
                                })
                            ]
                        }, staff.id))
                })
            ]
        })
    });
};
const CreateScheduleDialog = ({ onCreateSchedule, staffMembers, initialDate, initialStaffId })=>{
    const [open, setOpen] = (0,react_.useState)(false);
    const [scheduleData, setScheduleData] = (0,react_.useState)({
        staffId: initialStaffId || "",
        date: initialDate || new Date().toISOString().split("T")[0],
        shiftId: "morning",
        status: "scheduled",
        notes: ""
    });
    const handleSubmit = ()=>{
        if (scheduleData.staffId && scheduleData.date && scheduleData.shiftId) {
            onCreateSchedule(scheduleData);
            setOpen(false);
            setScheduleData({
                staffId: "",
                date: new Date().toISOString().split("T")[0],
                shiftId: "morning",
                status: "scheduled",
                notes: ""
            });
        }
    };
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* Dialog */.Vq, {
        open: open,
        onOpenChange: setOpen,
        children: [
            /*#__PURE__*/ jsx_runtime_.jsx(dialog/* DialogTrigger */.hg, {
                asChild: true,
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_button/* Button */.z, {
                    "data-testid": "create-schedule-button",
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Plus */.v37, {
                            className: "w-4 h-4 mr-2"
                        }),
                        "Add Schedule"
                    ]
                })
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogContent */.cZ, {
                className: "sm:max-w-[425px]",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogHeader */.fK, {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(dialog/* DialogTitle */.$N, {
                                children: "Create Schedule"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(dialog/* DialogDescription */.Be, {
                                children: "Add a new schedule for a staff member"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "space-y-4 py-4",
                        children: [
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                        htmlFor: "staff",
                                        children: "Staff Member"
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_select/* Select */.Ph, {
                                        value: scheduleData.staffId,
                                        onValueChange: (value)=>setScheduleData({
                                                ...scheduleData,
                                                staffId: value
                                            }),
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectTrigger */.i4, {
                                                id: "staff",
                                                "data-testid": "schedule-staff-select",
                                                children: /*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectValue */.ki, {
                                                    placeholder: "Select staff member"
                                                })
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectContent */.Bw, {
                                                children: staffMembers.map((staff)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_select/* SelectItem */.Ql, {
                                                        value: staff.id,
                                                        children: [
                                                            staff.name,
                                                            " - ",
                                                            staff.role
                                                        ]
                                                    }, staff.id))
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                        htmlFor: "date",
                                        children: "Date"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(input/* Input */.I, {
                                        id: "date",
                                        type: "date",
                                        value: scheduleData.date,
                                        onChange: (e)=>setScheduleData({
                                                ...scheduleData,
                                                date: e.target.value
                                            }),
                                        "data-testid": "schedule-date-input"
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                        htmlFor: "shift",
                                        children: "Shift"
                                    }),
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(ui_select/* Select */.Ph, {
                                        value: scheduleData.shiftId,
                                        onValueChange: (value)=>setScheduleData({
                                                ...scheduleData,
                                                shiftId: value
                                            }),
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectTrigger */.i4, {
                                                id: "shift",
                                                "data-testid": "schedule-shift-select",
                                                children: /*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectValue */.ki, {})
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectContent */.Bw, {
                                                children: shiftTemplates.map((shift)=>/*#__PURE__*/ jsx_runtime_.jsx(ui_select/* SelectItem */.Ql, {
                                                        value: shift.id,
                                                        children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                                            className: "flex items-center gap-2",
                                                            children: [
                                                                getShiftIcon(shift.id),
                                                                /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                                                    children: shift.name
                                                                }),
                                                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                                                    className: "text-xs text-gray-500",
                                                                    children: [
                                                                        "(",
                                                                        shift.startTime,
                                                                        " - ",
                                                                        shift.endTime,
                                                                        ")"
                                                                    ]
                                                                })
                                                            ]
                                                        })
                                                    }, shift.id))
                                            })
                                        ]
                                    })
                                ]
                            }),
                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "space-y-2",
                                children: [
                                    /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                        htmlFor: "notes",
                                        children: "Notes (Optional)"
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(input/* Input */.I, {
                                        id: "notes",
                                        placeholder: "Any special notes...",
                                        value: scheduleData.notes,
                                        onChange: (e)=>setScheduleData({
                                                ...scheduleData,
                                                notes: e.target.value
                                            }),
                                        "data-testid": "schedule-notes-input"
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogFooter */.cN, {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                variant: "outline",
                                onClick: ()=>setOpen(false),
                                children: "Cancel"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                onClick: handleSubmit,
                                "data-testid": "submit-schedule-button",
                                children: "Create Schedule"
                            })
                        ]
                    })
                ]
            })
        ]
    });
};
function StaffScheduling() {
    const { toast } = (0,use_toast/* useToast */.pm)();
    const [currentWeek, setCurrentWeek] = (0,react_.useState)(new Date());
    const [selectedSchedule, setSelectedSchedule] = (0,react_.useState)(null);
    // Fetch data from backend
    const { data: schedulesData, loading: schedulesLoading, error: schedulesError, refetch: refetchSchedules } = (0,useApiIntegration/* useStaffSchedules */.nF)({
        startDate: new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() - currentWeek.getDay()).toISOString(),
        endDate: new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate() - currentWeek.getDay() + 6).toISOString()
    });
    const { data: staffData, loading: staffLoading } = (0,useApiIntegration/* useStaffMembers */.Bs)();
    const { createSchedule } = (0,useApiIntegration/* useStaffMutations */.N5)();
    // WebSocket for real-time updates
    const { isConnected } = useWebSocket({
        onMessage: (event, _data)=>{
            if (event === "schedule.updated" || event === "schedule.created" || event === "schedule.deleted") {
                refetchSchedules();
            }
        }
    });
    // Process schedules data
    const schedules = (0,react_.useMemo)(()=>{
        if (!schedulesData) return [];
        return schedulesData;
    }, [
        schedulesData
    ]);
    // Calculate metrics
    const metrics = (0,react_.useMemo)(()=>{
        const totalScheduled = schedules.length;
        const confirmed = schedules.filter((s)=>s.status === "confirmed").length;
        const absent = schedules.filter((s)=>s.status === "absent").length;
        const completed = schedules.filter((s)=>s.status === "completed").length;
        const totalHours = schedules.reduce((sum, s)=>{
            if (s.hoursWorked) return sum + s.hoursWorked;
            const shift = shiftTemplates.find((sh)=>sh.id === s.shiftId);
            if (shift) {
                const start = parseInt(shift.startTime.split(":")[0]);
                const end = parseInt(shift.endTime.split(":")[0]);
                return sum + (end > start ? end - start : 24 - start + end);
            }
            return sum;
        }, 0);
        return {
            totalScheduled,
            confirmed,
            absent,
            completed,
            totalHours,
            attendanceRate: totalScheduled > 0 ? Math.round((confirmed + completed) / totalScheduled * 100) : 0
        };
    }, [
        schedules
    ]);
    const handleCreateSchedule = async (scheduleData)=>{
        try {
            await createSchedule(scheduleData);
            toast({
                title: "Schedule Created",
                description: "The schedule has been created successfully."
            });
            refetchSchedules();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create schedule. Please try again.",
                variant: "destructive"
            });
        }
    };
    const handleWeekChange = (direction)=>{
        const newWeek = new Date(currentWeek);
        newWeek.setDate(newWeek.getDate() + (direction === "next" ? 7 : -7));
        setCurrentWeek(newWeek);
    };
    const handleScheduleClick = (schedule)=>{
        setSelectedSchedule(schedule);
    };
    const handleQuickCreateSchedule = (date, staffId)=>{
        // Open dialog with pre-filled data
        handleCreateSchedule({
            staffId,
            date,
            shiftId: "morning",
            status: "scheduled"
        });
    };
    if (schedulesLoading || staffLoading) {
        return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "space-y-6",
            "data-testid": "staff-scheduling",
            children: [
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("h2", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: "Staff Scheduling"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                    className: "text-gray-600",
                                    children: "Manage staff shifts and schedules"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: "outline",
                                    size: "icon",
                                    onClick: ()=>handleWeekChange("prev"),
                                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronLeft */.s$$, {
                                        className: "w-4 h-4"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                    className: "px-4 py-2 bg-gray-100 rounded",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "font-medium",
                                        children: currentWeek.toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric"
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: "outline",
                                    size: "icon",
                                    onClick: ()=>handleWeekChange("next"),
                                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronRight */._Qn, {
                                        className: "w-4 h-4"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(CreateScheduleDialog, {
                                    onCreateSchedule: handleCreateSchedule,
                                    staffMembers: staffData || []
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* Card */.Zb, {
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardHeader */.Ol, {
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(card/* CardTitle */.ll, {
                                    children: "Weekly Schedule"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(card/* CardDescription */.SZ, {
                                    children: "Loading schedules..."
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                            children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "flex items-center justify-center h-48",
                                children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Loader2 */.zM5, {
                                    className: "w-8 h-8 animate-spin text-gray-400"
                                })
                            })
                        })
                    ]
                })
            ]
        });
    }
    if (schedulesError) {
        return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
            className: "space-y-6",
            "data-testid": "staff-scheduling",
            children: [
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
                    children: [
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx("h2", {
                                    className: "text-2xl font-bold text-gray-900",
                                    children: "Staff Scheduling"
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                    className: "text-gray-600",
                                    children: "Manage staff shifts and schedules"
                                })
                            ]
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: "outline",
                                    size: "icon",
                                    onClick: ()=>handleWeekChange("prev"),
                                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronLeft */.s$$, {
                                        className: "w-4 h-4"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                    className: "px-4 py-2 bg-gray-100 rounded",
                                    children: /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                        className: "font-medium",
                                        children: currentWeek.toLocaleDateString("en-US", {
                                            month: "long",
                                            year: "numeric"
                                        })
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                    variant: "outline",
                                    size: "icon",
                                    onClick: ()=>handleWeekChange("next"),
                                    children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronRight */._Qn, {
                                        className: "w-4 h-4"
                                    })
                                }),
                                /*#__PURE__*/ jsx_runtime_.jsx(CreateScheduleDialog, {
                                    onCreateSchedule: handleCreateSchedule,
                                    staffMembers: staffData || []
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                    className: "text-center py-12",
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* XCircle */.a2, {
                            className: "w-12 h-12 text-red-500 mx-auto mb-4"
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx("p", {
                            className: "text-gray-600",
                            children: "Failed to load schedules. Please try again."
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                            onClick: refetchSchedules,
                            className: "mt-4",
                            children: "Retry"
                        })
                    ]
                })
            ]
        });
    }
    return /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
        className: "space-y-6",
        "data-testid": "staff-scheduling",
        children: [
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4",
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx("h2", {
                                className: "text-2xl font-bold text-gray-900",
                                children: "Staff Scheduling"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                className: "text-gray-600",
                                children: "Manage staff shifts and schedules"
                            })
                        ]
                    }),
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                variant: "outline",
                                size: "icon",
                                onClick: ()=>handleWeekChange("prev"),
                                children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronLeft */.s$$, {
                                    className: "w-4 h-4"
                                })
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx("div", {
                                className: "px-4 py-2 bg-gray-100 rounded",
                                children: /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                    className: "font-medium",
                                    children: currentWeek.toLocaleDateString("en-US", {
                                        month: "long",
                                        year: "numeric"
                                    })
                                })
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                variant: "outline",
                                size: "icon",
                                onClick: ()=>handleWeekChange("next"),
                                children: /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* ChevronRight */._Qn, {
                                    className: "w-4 h-4"
                                })
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(CreateScheduleDialog, {
                                onCreateSchedule: handleCreateSchedule,
                                staffMembers: staffData || []
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "grid grid-cols-1 md:grid-cols-5 gap-4",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-sm font-medium text-gray-600",
                                                children: "Total Scheduled"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-2xl font-bold",
                                                children: metrics.totalScheduled
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Calendar */.faS, {
                                        className: "w-8 h-8 text-blue-500"
                                    })
                                ]
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-sm font-medium text-gray-600",
                                                children: "Confirmed"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-2xl font-bold text-green-600",
                                                children: metrics.confirmed
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* CheckCircle */.fU8, {
                                        className: "w-8 h-8 text-green-500"
                                    })
                                ]
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-sm font-medium text-gray-600",
                                                children: "Absent"
                                            }),
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-2xl font-bold text-red-600",
                                                children: metrics.absent
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* XCircle */.a2, {
                                        className: "w-8 h-8 text-red-500"
                                    })
                                ]
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-sm font-medium text-gray-600",
                                                children: "Total Hours"
                                            }),
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                                className: "text-2xl font-bold",
                                                children: [
                                                    metrics.totalHours,
                                                    "h"
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Clock */.SUY, {
                                        className: "w-8 h-8 text-purple-500"
                                    })
                                ]
                            })
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* Card */.Zb, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                            className: "pt-6",
                            children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                className: "flex items-center justify-between",
                                children: [
                                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                        children: [
                                            /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                                className: "text-sm font-medium text-gray-600",
                                                children: "Attendance Rate"
                                            }),
                                            /*#__PURE__*/ (0,jsx_runtime_.jsxs)("p", {
                                                className: "text-2xl font-bold",
                                                children: [
                                                    metrics.attendanceRate,
                                                    "%"
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* Users */.Qaw, {
                                        className: "w-8 h-8 text-orange-500"
                                    })
                                ]
                            })
                        })
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* Card */.Zb, {
                children: [
                    /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* CardHeader */.Ol, {
                        children: [
                            /*#__PURE__*/ jsx_runtime_.jsx(card/* CardTitle */.ll, {
                                children: "Weekly Schedule"
                            }),
                            /*#__PURE__*/ jsx_runtime_.jsx(card/* CardDescription */.SZ, {
                                children: "Click on empty slots to add schedules, or on existing schedules to edit"
                            })
                        ]
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(CalendarView, {
                            schedules: schedules,
                            staffMembers: staffData || [],
                            currentWeek: currentWeek,
                            onScheduleClick: handleScheduleClick,
                            onCreateSchedule: handleQuickCreateSchedule
                        })
                    })
                ]
            }),
            /*#__PURE__*/ (0,jsx_runtime_.jsxs)(card/* Card */.Zb, {
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* CardHeader */.Ol, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx(card/* CardTitle */.ll, {
                            children: "Shift Types"
                        })
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx(card/* CardContent */.aY, {
                        children: /*#__PURE__*/ jsx_runtime_.jsx("div", {
                            className: "flex flex-wrap gap-3",
                            children: shiftTemplates.map((shift)=>/*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    className: `flex items-center gap-2 px-3 py-2 rounded border ${shift.color}`,
                                    children: [
                                        getShiftIcon(shift.id),
                                        /*#__PURE__*/ jsx_runtime_.jsx("span", {
                                            className: "font-medium",
                                            children: shift.name
                                        }),
                                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("span", {
                                            className: "text-xs",
                                            children: [
                                                "(",
                                                shift.startTime,
                                                " - ",
                                                shift.endTime,
                                                ")"
                                            ]
                                        })
                                    ]
                                }, shift.id))
                        })
                    })
                ]
            }),
            selectedSchedule && /*#__PURE__*/ jsx_runtime_.jsx(dialog/* Dialog */.Vq, {
                open: !!selectedSchedule,
                onOpenChange: ()=>setSelectedSchedule(null),
                children: /*#__PURE__*/ (0,jsx_runtime_.jsxs)(dialog/* DialogContent */.cZ, {
                    children: [
                        /*#__PURE__*/ jsx_runtime_.jsx(dialog/* DialogHeader */.fK, {
                            children: /*#__PURE__*/ jsx_runtime_.jsx(dialog/* DialogTitle */.$N, {
                                children: "Schedule Details"
                            })
                        }),
                        /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                            className: "space-y-4",
                            children: [
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                            children: "Staff Member"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                            className: "font-medium",
                                            children: selectedSchedule.staff?.name
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                            children: "Date"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                            className: "font-medium",
                                            children: new Date(selectedSchedule.date).toLocaleDateString()
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                            children: "Shift"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                            className: "font-medium",
                                            children: shiftTemplates.find((s)=>s.id === selectedSchedule.shiftId)?.name
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                            children: "Status"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx(ScheduleStatusBadge, {
                                            status: selectedSchedule.status
                                        })
                                    ]
                                }),
                                selectedSchedule.notes && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                                    children: [
                                        /*#__PURE__*/ jsx_runtime_.jsx(label/* Label */._, {
                                            children: "Notes"
                                        }),
                                        /*#__PURE__*/ jsx_runtime_.jsx("p", {
                                            className: "text-sm text-gray-600",
                                            children: selectedSchedule.notes
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ jsx_runtime_.jsx(dialog/* DialogFooter */.cN, {
                            children: /*#__PURE__*/ jsx_runtime_.jsx(ui_button/* Button */.z, {
                                variant: "outline",
                                onClick: ()=>setSelectedSchedule(null),
                                children: "Close"
                            })
                        })
                    ]
                })
            }),
            !isConnected && /*#__PURE__*/ (0,jsx_runtime_.jsxs)("div", {
                className: "fixed bottom-4 right-4 bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2",
                children: [
                    /*#__PURE__*/ jsx_runtime_.jsx(lucide_react/* AlertTriangle */.uyG, {
                        className: "w-4 h-4"
                    }),
                    /*#__PURE__*/ jsx_runtime_.jsx("span", {
                        className: "text-sm",
                        children: "Real-time updates disconnected"
                    })
                ]
            })
        ]
    });
}


/***/ }),

/***/ 79558:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ZP: () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* unused harmony exports __esModule, $$typeof */
/* harmony import */ var next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(61363);

const proxy = (0,next_dist_build_webpack_loaders_next_flight_loader_module_proxy__WEBPACK_IMPORTED_MODULE_0__.createProxy)(String.raw`/Users/mahesha/Downloads/hasivu-platform/web/src/components/staff/StaffScheduling.tsx`)

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