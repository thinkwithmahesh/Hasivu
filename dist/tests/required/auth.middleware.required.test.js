"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_middleware_1 = require("../../src/middleware/auth.middleware");
describe('Required Gate: auth middleware', () => {
    test('validateInput sanitizes script-like payload', () => {
        const req = {
            body: {
                message: '<script>alert(1)</script>',
                nested: { value: 'javascript:evil()' },
            },
            query: { q: 'onload=boom' },
        };
        const res = {};
        const next = jest.fn();
        (0, auth_middleware_1.validateInput)(req, res, next);
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.body.message).toContain('script');
        expect(req.body.message).not.toContain('<');
        expect(req.body.nested.value).not.toContain('javascript:');
        expect(req.query.q).not.toContain('onload=');
    });
    test('corsMiddleware sets CORS headers and handles preflight', () => {
        process.env.CORS_ORIGINS = 'http://localhost:3000,https://app.hasivu.com';
        const headers = {};
        const req = {
            method: 'OPTIONS',
            headers: { origin: 'http://localhost:3000' },
        };
        const res = {
            header: (key, value) => {
                headers[key] = value;
                return res;
            },
            sendStatus: jest.fn(),
        };
        const next = jest.fn();
        (0, auth_middleware_1.corsMiddleware)(req, res, next);
        expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
        expect(headers['Access-Control-Allow-Methods']).toContain('GET');
        expect(res.sendStatus.mock.calls[0][0]).toBe(200);
        expect(next).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=auth.middleware.required.test.js.map