"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../../src/middleware/auth.middleware");
const csrf_middleware_1 = require("../../src/middleware/csrf.middleware");
jest.mock('../../src/services/session.service', () => ({
    sessionService: {
        validateCSRFToken: jest.fn(),
        generateCSRFToken: jest.fn(),
        validateSession: jest.fn(),
    },
}));
const { sessionService } = require('../../src/services/session.service');
function createMockResponse() {
    const res = {};
    res.status = jest.fn((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = jest.fn((payload) => {
        res.payload = payload;
        return res;
    });
    res.getHeader = jest.fn();
    res.setHeader = jest.fn();
    return res;
}
describe('Required Gate: security enforcement', () => {
    test('requireRole returns 401 when user is missing', () => {
        const middleware = (0, auth_middleware_1.requireRole)('admin');
        const req = {};
        const res = createMockResponse();
        const next = jest.fn();
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
    test('requireRole returns 403 for insufficient role', () => {
        const middleware = (0, auth_middleware_1.requireRole)(['admin']);
        const req = { user: { id: 'u1', role: 'parent', permissions: [] } };
        const res = createMockResponse();
        const next = jest.fn();
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
    test('requirePermission returns 403 for missing permission', () => {
        const middleware = (0, auth_middleware_1.requirePermission)('orders:write');
        const req = { user: { id: 'u2', role: 'admin', permissions: ['orders:read'] } };
        const res = createMockResponse();
        const next = jest.fn();
        middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
    test('csrfProtection returns 403 when CSRF token is missing on state-changing request', async () => {
        const middleware = (0, csrf_middleware_1.csrfProtection)();
        const req = {
            method: 'POST',
            path: '/orders/checkout',
            cookies: { sessionId: 's1' },
            headers: {},
            body: {},
            query: {},
            ip: '127.0.0.1',
            get: jest.fn(),
        };
        const res = createMockResponse();
        const next = jest.fn();
        await middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
    test('csrfProtection returns 403 when CSRF token validation fails', async () => {
        sessionService.validateCSRFToken.mockResolvedValue(false);
        const middleware = (0, csrf_middleware_1.csrfProtection)();
        const req = {
            method: 'POST',
            path: '/orders/checkout',
            cookies: { sessionId: 's2' },
            headers: { 'x-csrf-token': 'bad-token' },
            body: {},
            query: {},
            ip: '127.0.0.1',
            get: jest.fn(),
        };
        const res = createMockResponse();
        const next = jest.fn();
        await middleware(req, res, next);
        expect(sessionService.validateCSRFToken).toHaveBeenCalledWith('s2', 'bad-token');
        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
    test('authRateLimit starts rejecting burst auth attempts with 429', async () => {
        const req = {
            ip: '10.0.0.1',
            path: '/api/auth/login',
            method: 'POST',
            body: { email: 'ratelimit@test.com' },
            get: jest.fn(),
            headers: {},
            app: { get: jest.fn().mockReturnValue(false) },
        };
        let rejected = 0;
        for (let i = 0; i < 40; i += 1) {
            const res = createMockResponse();
            const next = jest.fn();
            await new Promise(resolve => {
                (0, auth_middleware_1.authRateLimit)(req, res, () => {
                    next();
                    resolve();
                });
                setImmediate(() => {
                    if (res.status.mock.calls.length > 0) {
                        rejected += 1;
                        resolve();
                    }
                });
            });
        }
        expect(rejected).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=security.enforcement.required.test.js.map