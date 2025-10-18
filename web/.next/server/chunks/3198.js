"use strict";
exports.id = 3198;
exports.ids = [3198];
exports.modules = {

/***/ 39811:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

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



/***/ })

};
;