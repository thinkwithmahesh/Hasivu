"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const supertest_1 = __importDefault(require("supertest"));
const auth_routes_1 = require("../../src/routes/auth.routes");
jest.mock('../../src/services/auth.service', () => ({
    authService: {
        validatePassword: jest.fn(() => ({ valid: true })),
        hashPassword: jest.fn(async () => 'hash'),
        authenticate: jest.fn(async () => ({ success: false })),
        updateSessionActivity: jest.fn(async () => undefined),
        refreshAccessToken: jest.fn(async () => ({ success: false, error: 'invalid token' })),
        refreshToken: jest.fn(async () => {
            throw new Error('invalid token');
        }),
        logout: jest.fn(async () => undefined),
        logoutAll: jest.fn(async () => undefined),
    },
}));
jest.mock('../../src/services/database.service', () => ({
    DatabaseService: {
        client: {
            user: {
                findUnique: jest.fn(async () => null),
            },
        },
        transaction: jest.fn(async (fn) => fn({
            user: { create: jest.fn(async () => ({ id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'parent' })) },
            role: { findUnique: jest.fn(async () => null) },
            userRoleAssignment: { create: jest.fn(async () => ({})) },
        })),
    },
}));
describe('Required Gate: auth routes contracts', () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use('/api/auth', auth_routes_1.authRouter);
    test('POST /api/auth/login returns 400 when email or password is missing', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/login').send({ email: 'a@test.com' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });
    test('POST /api/auth/login returns 401 when credentials are invalid', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/auth/login')
            .send({ email: 'burst@test.com', password: 'Password1!' });
        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
    });
    test('POST /api/auth/validate-password returns 200 for valid payload', async () => {
        const res = await (0, supertest_1.default)(app).post('/api/auth/validate-password').send({ password: 'Str0ng!Pass' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.validation).toBeDefined();
    });
});
//# sourceMappingURL=auth.routes.required.test.js.map