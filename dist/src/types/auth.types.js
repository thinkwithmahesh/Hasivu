"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthUtils = exports.DEFAULT_ROLE_PERMISSIONS = void 0;
exports.DEFAULT_ROLE_PERMISSIONS = {
    super_admin: ['super_admin:all'],
    school_admin: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'orders:create',
        'orders:read',
        'orders:update',
        'orders:delete',
        'orders:list',
        'orders:manage',
        'payments:create',
        'payments:read',
        'payments:refund',
        'menu:create',
        'menu:read',
        'menu:update',
        'menu:delete',
        'delivery:track',
        'delivery:confirm',
        'notifications:send',
        'notifications:manage',
        'admin:users',
        'admin:schools',
        'admin:analytics',
        'admin:settings'
    ],
    teacher: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'orders:read',
        'orders:list',
        'menu:read',
        'delivery:track'
    ],
    student: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'orders:create',
        'orders:read',
        'menu:read',
        'delivery:track'
    ],
    parent: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'orders:create',
        'orders:read',
        'orders:list',
        'payments:create',
        'payments:read',
        'menu:read',
        'delivery:track'
    ],
    staff: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'orders:read',
        'orders:update',
        'orders:list',
        'menu:read',
        'delivery:confirm'
    ],
    canteen_manager: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'orders:read',
        'orders:update',
        'orders:list',
        'orders:manage',
        'menu:create',
        'menu:read',
        'menu:update',
        'menu:delete',
        'delivery:track',
        'delivery:confirm',
        'notifications:send',
        'admin:analytics'
    ],
    accountant: [
        'auth:login',
        'auth:logout',
        'auth:refresh',
        'auth:change_password',
        'profile:read',
        'profile:update',
        'payments:create',
        'payments:read',
        'payments:refund',
        'orders:read',
        'orders:list',
        'admin:analytics'
    ]
};
class AuthUtils {
    static hasRole(user, role) {
        if (!user)
            return false;
        if (Array.isArray(role)) {
            return role.includes(user.role);
        }
        return user.role === role || user.role === 'super_admin';
    }
    static hasPermission(user, permission) {
        if (!user)
            return false;
        if (user.role === 'super_admin' || user.permissions.includes('super_admin:all')) {
            return true;
        }
        if (Array.isArray(permission)) {
            return permission.some(p => user.permissions.includes(p));
        }
        return user.permissions.includes(permission);
    }
    static getPermissionsForRole(role) {
        return exports.DEFAULT_ROLE_PERMISSIONS[role] || [];
    }
    static validatePassword(password) {
        const errors = [];
        if (password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (!/[!@#$%^&*()_+\-=[]{};"':|,.<>?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        if (/(.)\1{2,}/.test(password)) {
            errors.push('Password cannot contain more than 2 consecutive identical characters');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    static generateDeviceFingerprint() {
        if (typeof window === 'undefined') {
            return 'server-side-fingerprint';
        }
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            hash: ''
        };
        const fingerprintString = JSON.stringify(fingerprint);
        fingerprint.hash = btoa(fingerprintString).substring(0, 32);
        return fingerprint.hash;
    }
    static isTokenExpired(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 < Date.now();
        }
        catch {
            return true;
        }
    }
    static getTokenExpiration(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        }
        catch {
            return null;
        }
    }
}
exports.AuthUtils = AuthUtils;
exports.default = {
    DEFAULT_ROLE_PERMISSIONS: exports.DEFAULT_ROLE_PERMISSIONS,
    AuthUtils
};
//# sourceMappingURL=auth.types.js.map