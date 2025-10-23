"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestAppWithDatabase = exports.createTestApp = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
function createTestApp() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', environment: 'test' });
    });
    const server = (0, http_1.createServer)(app);
    return {
        app,
        server,
        close: () => new Promise((resolve) => {
            server.close(() => resolve());
        })
    };
}
exports.createTestApp = createTestApp;
async function createTestAppWithDatabase() {
    const testApp = createTestApp();
    return testApp;
}
exports.createTestAppWithDatabase = createTestAppWithDatabase;
//# sourceMappingURL=test-app-factory.js.map