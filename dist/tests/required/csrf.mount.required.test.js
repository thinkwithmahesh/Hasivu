"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const supertest_1 = __importDefault(require("supertest"));
const csrf_middleware_1 = require("../../src/middleware/csrf.middleware");
jest.mock('../../src/services/session.service', () => ({
    sessionService: {
        validateCSRFToken: jest.fn(),
    },
}));
const { sessionService } = require('../../src/services/session.service');
describe('Required Gate: mounted /api CSRF enforcement', () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use('/api', (0, csrf_middleware_1.csrfProtection)());
    app.post('/api/protected', (_req, res) => res.status(200).json({ ok: true }));
    test('mounted /api rejects state-changing call without CSRF token', async () => {
        const response = await (0, supertest_1.default)(app)
            .post('/api/protected')
            .set('x-session-id', 'session-a')
            .send({ hello: 'world' });
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('CSRF token required');
    });
    test('mounted /api accepts valid CSRF token', async () => {
        sessionService.validateCSRFToken.mockResolvedValue(true);
        const response = await (0, supertest_1.default)(app)
            .post('/api/protected')
            .set('x-session-id', 'session-b')
            .set('x-csrf-token', 'valid-token')
            .send({ hello: 'world' });
        expect(response.status).toBe(200);
        expect(response.body.ok).toBe(true);
        expect(sessionService.validateCSRFToken).toHaveBeenCalledWith('session-b', 'valid-token');
    });
});
//# sourceMappingURL=csrf.mount.required.test.js.map