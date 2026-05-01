"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock('../../src/config/environment', () => ({
    config: {
        jwt: { secret: 'test-jwt-secret-that-is-at-least-32-characters-long', refreshSecret: 'test-refresh-secret-that-is-at-least-32-chars-long' },
        redis: { url: 'redis://localhost:6379' },
        database: {},
    }
}));
const auth_routes_1 = require("../../src/routes/auth.routes");
describe('AuthRouter Dynamic Coverage Push', () => {
    it('should export auth router', () => {
        expect(auth_routes_1.authRouter).toBeDefined();
    });
});
//# sourceMappingURL=auth.routes.test.js.map