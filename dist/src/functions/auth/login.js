"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginHandler = void 0;
const cognito_service_1 = require("../shared/cognito.service");
const database_service_1 = require("../shared/database.service");
const logger_1 = require("../../utils/logger");
const validation_service_1 = require("../shared/validation.service");
const cognito = cognito_service_1.CognitoService;
const db = database_service_1.DatabaseService;
const validator = validation_service_1.ValidationService.getInstance();
const createResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    },
    body: JSON.stringify(body)
});
const loginHandler = async (event, context) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return createResponse(200, { message: 'CORS preflight successful' });
        }
        if (event.httpMethod !== 'POST') {
            return createResponse(405, { error: 'METHOD_NOT_ALLOWED' });
        }
        const body = JSON.parse(event.body || '{}');
        const { email, password } = body;
        if (!email || !password) {
            return createResponse(400, { error: 'Email and password are required' });
        }
        const result = await cognito.authenticate(email, password);
        return createResponse(200, {
            message: 'Login successful',
            token: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user
        });
    }
    catch (error) {
        logger_1.logger.error('Login error', error);
        return createResponse(401, { error: 'Invalid credentials' });
    }
};
exports.loginHandler = loginHandler;
exports.default = exports.loginHandler;
//# sourceMappingURL=login.js.map