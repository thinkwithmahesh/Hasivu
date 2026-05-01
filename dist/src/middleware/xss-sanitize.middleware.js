"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeXSS = void 0;
const logger_service_1 = require("../shared/logger.service");
const validation_service_1 = require("../services/validation.service");
function sanitizeParsedQuery(query) {
    for (const key of Object.keys(query)) {
        const value = query[key];
        if (typeof value === 'string') {
            query[key] = validation_service_1.validationService.sanitizeString(value);
        }
        else if (Array.isArray(value)) {
            query[key] = value.map(item => typeof item === 'string' ? validation_service_1.validationService.sanitizeString(item) : item);
        }
    }
}
const sanitizeXSS = (req, _res, next) => {
    try {
        if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
            req.body = validation_service_1.validationService.sanitizePayload(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            sanitizeParsedQuery(req.query);
        }
        next();
    }
    catch (error) {
        logger_service_1.logger.error('XSS sanitization error', error instanceof Error ? error : new Error(String(error)), {
            ip: req.ip,
            path: req.path,
        });
        next();
    }
};
exports.sanitizeXSS = sanitizeXSS;
//# sourceMappingURL=xss-sanitize.middleware.js.map