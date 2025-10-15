"use strict";
exports.id = 7985;
exports.ids = [7985];
exports.modules = {

/***/ 97985:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   AT: () => (/* binding */ PermissionChecker),
/* harmony export */   i4: () => (/* binding */ UserRole),
/* harmony export */   y3: () => (/* binding */ Permission)
/* harmony export */ });
/* unused harmony exports ROLE_PERMISSIONS, isValidUserRole, isValidPermission */
/**
 * HASIVU Platform - Authentication Types
 * TypeScript interfaces and types for authentication system
 */ // User roles in the system
var UserRole;
(function(UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["TEACHER"] = "teacher";
    UserRole["PARENT"] = "parent";
    UserRole["STUDENT"] = "student";
    UserRole["VENDOR"] = "vendor";
    UserRole["KITCHEN_STAFF"] = "kitchen_staff";
    UserRole["SCHOOL_ADMIN"] = "school_admin";
})(UserRole || (UserRole = {}));
var Permission;
(function(Permission) {
    Permission[// User management
    "READ_USERS"] = "read_users";
    Permission["WRITE_USERS"] = "write_users";
    Permission["DELETE_USERS"] = "delete_users";
    Permission["MANAGE_USERS"] = "manage_users";
    Permission[// Order management
    "READ_ORDERS"] = "read_orders";
    Permission["WRITE_ORDERS"] = "write_orders";
    Permission["DELETE_ORDERS"] = "delete_orders";
    Permission["PLACE_ORDERS"] = "place_orders";
    Permission["UPDATE_ORDER_STATUS"] = "update_order_status";
    Permission[// Menu management
    "READ_MENU"] = "read_menu";
    Permission["WRITE_MENU"] = "write_menu";
    Permission["MANAGE_MENU"] = "manage_menu";
    Permission[// Payment management
    "READ_PAYMENTS"] = "read_payments";
    Permission["WRITE_PAYMENTS"] = "write_payments";
    Permission["MANAGE_PAYMENT_METHODS"] = "manage_payment_methods";
    Permission["PROCESS_PAYMENTS"] = "process_payments";
    Permission[// Analytics and reports
    "READ_ANALYTICS"] = "read_analytics";
    Permission["VIEW_REPORTS"] = "view_reports";
    Permission["EXPORT_DATA"] = "export_data";
    Permission[// System administration
    "ADMIN_ACCESS"] = "admin_access";
    Permission["SCHOOL_ADMIN_ACCESS"] = "school_admin_access";
    Permission["SYSTEM_SETTINGS"] = "system_settings";
    Permission[// Kitchen and inventory
    "KITCHEN_ACCESS"] = "kitchen_access";
    Permission["MANAGE_INVENTORY"] = "manage_inventory";
    Permission["VIEW_KITCHEN_QUEUE"] = "view_kitchen_queue";
    Permission[// Student-specific
    "VIEW_OWN_ORDERS"] = "view_own_orders";
    Permission["UPDATE_PROFILE"] = "update_profile";
    Permission[// Parent-specific
    "VIEW_STUDENT_ORDERS"] = "view_student_orders";
    Permission["MANAGE_CHILDREN"] = "manage_children";
    Permission[// Notifications
    "VIEW_NOTIFICATIONS"] = "view_notifications";
    Permission["SEND_NOTIFICATIONS"] = "send_notifications";
})(Permission || (Permission = {}));
// Role-permission mapping
const ROLE_PERMISSIONS = {
    [UserRole.ADMIN]: [
        // Full system access
        Permission.ADMIN_ACCESS,
        Permission.MANAGE_USERS,
        Permission.READ_USERS,
        Permission.WRITE_USERS,
        Permission.DELETE_USERS,
        Permission.READ_ORDERS,
        Permission.WRITE_ORDERS,
        Permission.DELETE_ORDERS,
        Permission.UPDATE_ORDER_STATUS,
        Permission.READ_MENU,
        Permission.WRITE_MENU,
        Permission.MANAGE_MENU,
        Permission.READ_PAYMENTS,
        Permission.WRITE_PAYMENTS,
        Permission.PROCESS_PAYMENTS,
        Permission.READ_ANALYTICS,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
        Permission.SYSTEM_SETTINGS,
        Permission.SEND_NOTIFICATIONS,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.SCHOOL_ADMIN]: [
        // School-level administration
        Permission.SCHOOL_ADMIN_ACCESS,
        Permission.READ_USERS,
        Permission.WRITE_USERS,
        Permission.READ_ORDERS,
        Permission.WRITE_ORDERS,
        Permission.UPDATE_ORDER_STATUS,
        Permission.READ_MENU,
        Permission.WRITE_MENU,
        Permission.MANAGE_MENU,
        Permission.READ_PAYMENTS,
        Permission.READ_ANALYTICS,
        Permission.VIEW_REPORTS,
        Permission.EXPORT_DATA,
        Permission.SEND_NOTIFICATIONS,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.TEACHER]: [
        // Teacher access
        Permission.READ_ORDERS,
        Permission.VIEW_STUDENT_ORDERS,
        Permission.READ_MENU,
        Permission.VIEW_REPORTS,
        Permission.UPDATE_PROFILE,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.PARENT]: [
        // Parent access
        Permission.PLACE_ORDERS,
        Permission.VIEW_STUDENT_ORDERS,
        Permission.MANAGE_CHILDREN,
        Permission.READ_MENU,
        Permission.READ_PAYMENTS,
        Permission.MANAGE_PAYMENT_METHODS,
        Permission.UPDATE_PROFILE,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.STUDENT]: [
        // Student access
        Permission.PLACE_ORDERS,
        Permission.VIEW_OWN_ORDERS,
        Permission.READ_MENU,
        Permission.UPDATE_PROFILE,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.VENDOR]: [
        // Vendor/supplier access
        Permission.READ_ORDERS,
        Permission.MANAGE_MENU,
        Permission.READ_MENU,
        Permission.WRITE_MENU,
        Permission.MANAGE_INVENTORY,
        Permission.VIEW_REPORTS,
        Permission.READ_ANALYTICS,
        Permission.UPDATE_PROFILE,
        Permission.VIEW_NOTIFICATIONS
    ],
    [UserRole.KITCHEN_STAFF]: [
        // Kitchen staff access
        Permission.KITCHEN_ACCESS,
        Permission.READ_ORDERS,
        Permission.UPDATE_ORDER_STATUS,
        Permission.VIEW_KITCHEN_QUEUE,
        Permission.MANAGE_INVENTORY,
        Permission.READ_MENU,
        Permission.UPDATE_PROFILE,
        Permission.VIEW_NOTIFICATIONS
    ]
};
// Permission check utilities
class PermissionChecker {
    static hasPermission(user, permission) {
        if (!user) return false;
        const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
        return rolePermissions.includes(permission);
    }
    static hasAnyPermission(user, permissions) {
        if (!user) return false;
        return permissions.some((permission)=>this.hasPermission(user, permission));
    }
    static hasAllPermissions(user, permissions) {
        if (!user) return false;
        return permissions.every((permission)=>this.hasPermission(user, permission));
    }
    static hasRole(user, role) {
        if (!user) return false;
        return user.role === role;
    }
    static hasAnyRole(user, roles) {
        if (!user) return false;
        return roles.includes(user.role);
    }
    static isAdmin(user) {
        return this.hasAnyRole(user, [
            UserRole.ADMIN,
            UserRole.SCHOOL_ADMIN
        ]);
    }
    static canManageUsers(user) {
        return this.hasPermission(user, Permission.MANAGE_USERS);
    }
    static canPlaceOrders(user) {
        return this.hasPermission(user, Permission.PLACE_ORDERS);
    }
    static canViewAnalytics(user) {
        return this.hasPermission(user, Permission.READ_ANALYTICS);
    }
}
// Type guards
function isValidUserRole(role) {
    return Object.values(UserRole).includes(role);
}
function isValidPermission(permission) {
    return Object.values(Permission).includes(permission);
}


/***/ })

};
;