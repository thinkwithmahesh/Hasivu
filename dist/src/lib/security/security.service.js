"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityService = void 0;
class SecurityService {
    async validateCSRFToken(_token) {
        return true;
    }
    sanitizeInput(_input) {
        return _input;
    }
    detectSQLInjection(_input) {
        return false;
    }
    async validateJWTToken(_token) {
        return { valid: true, payload: {} };
    }
}
exports.SecurityService = SecurityService;
//# sourceMappingURL=security.service.js.map