"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAuthToken = exports.createTestUser = exports.createMockAuthRequest = exports.generateTestJWT = exports.createAuthTestUtils = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function createAuthTestUtils() {
    return {
        generateTestToken: (payload = {}) => {
            const defaultPayload = {
                userId: 'test-user-id',
                email: 'test@example.com',
                role: 'student',
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 3600
            };
            const tokenPayload = { ...defaultPayload, ...payload };
            return jsonwebtoken_1.default.sign(tokenPayload, 'test-secret-key');
        },
        generateTestUser: () => {
            return {
                id: 'test-user-id',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                role: 'student',
                schoolId: 'test-school-id',
                isActive: true
            };
        },
        createTestAuthHeader: (token) => {
            const authToken = token || createAuthTestUtils().generateTestToken();
            return `Bearer ${authToken}`;
        },
        mockAuthMiddleware: () => {
            return (req, res, next) => {
                req.user = createAuthTestUtils().generateTestUser();
                next();
            };
        }
    };
}
exports.createAuthTestUtils = createAuthTestUtils;
function generateTestJWT(payload) {
    return createAuthTestUtils().generateTestToken(payload);
}
exports.generateTestJWT = generateTestJWT;
function createMockAuthRequest(token) {
    const authHeader = createAuthTestUtils().createTestAuthHeader(token);
    return {
        headers: {
            authorization: authHeader,
            'x-api-key': 'test-api-key'
        },
        user: createAuthTestUtils().generateTestUser()
    };
}
exports.createMockAuthRequest = createMockAuthRequest;
function createTestUser(overrides) {
    const utils = createAuthTestUtils();
    const user = utils.generateTestUser();
    return { ...user, ...overrides, token: utils.generateTestToken(user) };
}
exports.createTestUser = createTestUser;
function generateAuthToken(payload) {
    return createAuthTestUtils().generateTestToken(payload);
}
exports.generateAuthToken = generateAuthToken;
//# sourceMappingURL=auth-utils.js.map