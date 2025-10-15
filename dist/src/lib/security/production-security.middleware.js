"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductionSecurityMiddleware = void 0;
const server_1 = require("next/server");
const security_service_1 = require("./security.service");
class ProductionSecurityMiddleware {
    securityService;
    threatMetrics;
    constructor() {
        this.securityService = new security_service_1.SecurityService();
        this.threatMetrics = {
            totalThreats: 0,
            ipThreats: {},
            threatTypes: {}
        };
    }
    async handleRequest(request) {
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        if (this.isRateLimited(ip)) {
            return server_1.NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
        }
        if (request.method === 'POST') {
            const csrfToken = request.headers.get('x-csrf-token');
            if (!csrfToken || !(await this.securityService.validateCSRFToken(csrfToken))) {
                this.trackThreat(ip, 'CSRF');
                return server_1.NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
            }
        }
        if (this.securityService.detectSQLInjection(request.url)) {
            this.trackThreat(ip, 'SQL_INJECTION');
            return server_1.NextResponse.json({ error: 'Malicious input detected' }, { status: 400 });
        }
        const response = server_1.NextResponse.next();
        response.headers.set('X-Frame-Options', 'DENY');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        response.headers.set('Content-Security-Policy', "default-src 'self'");
        response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        return response;
    }
    async cleanup() {
    }
    getThreatMetrics() {
        return this.threatMetrics;
    }
    isRateLimited(ip) {
        return false;
    }
    trackThreat(ip, type) {
        this.threatMetrics.totalThreats++;
        this.threatMetrics.threatTypes[type] = (this.threatMetrics.threatTypes[type] || 0) + 1;
        this.threatMetrics.ipThreats[ip] = {
            score: (this.threatMetrics.ipThreats[ip]?.score || 0) + 10,
            blocked: (this.threatMetrics.ipThreats[ip]?.score || 0) > 100
        };
    }
}
exports.ProductionSecurityMiddleware = ProductionSecurityMiddleware;
//# sourceMappingURL=production-security.middleware.js.map