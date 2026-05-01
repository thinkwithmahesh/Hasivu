"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSessionDeviceFingerprint = exports.getClientIpForSession = void 0;
const crypto_1 = require("crypto");
function getClientIpForSession(req) {
    const xff = req.headers['x-forwarded-for'];
    const xffFirst = typeof xff === 'string'
        ? xff.split(',')[0]?.trim() || ''
        : Array.isArray(xff)
            ? xff[0]?.trim() || ''
            : '';
    const xRealIp = req.headers['x-real-ip'];
    const realIp = typeof xRealIp === 'string' ? xRealIp.trim() : '';
    return (xffFirst ||
        realIp ||
        req.ip ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        '127.0.0.1');
}
exports.getClientIpForSession = getClientIpForSession;
function buildSessionDeviceFingerprint(userAgent, acceptLanguage, acceptEncoding, ipAddress) {
    const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ipAddress}`;
    return (0, crypto_1.createHash)('sha256').update(fingerprintData).digest('hex');
}
exports.buildSessionDeviceFingerprint = buildSessionDeviceFingerprint;
//# sourceMappingURL=session-fingerprint.util.js.map