"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const logger_1 = require("@/utils/logger");
const response_utils_1 = require("@/shared/response.utils");
const database_service_1 = require("@/services/database.service");
const jwt = __importStar(require("jsonwebtoken"));
const uuid_1 = require("uuid");
async function validateRefreshToken(refreshToken) {
    const database = database_service_1.DatabaseService.getInstance();
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'default_refresh_secret');
        if (!decoded.userId || !decoded.tokenId) {
            throw new Error('Invalid refresh token structure');
        }
        const tokenResult = await database.query(`
      SELECT rt.id, rt.userId, rt.tokenId, rt.expiresAt, rt.isActive,
             u.id as user_id, u.email, u.role, u.firstName, u.lastName, u.isActive as user_active
      FROM refresh_tokens rt
      LEFT JOIN users u ON rt.userId = u.id
      WHERE rt.tokenId = $1 AND rt.isActive = true
    `, [decoded.tokenId]);
        const tokenRecord = tokenResult.rows[0];
        if (!tokenRecord) {
            throw new Error('Refresh token not found or expired');
        }
        if (new Date(tokenRecord.expiresAt) < new Date()) {
            await database.query(`
        UPDATE refresh_tokens SET isActive = false, updatedAt = NOW()
        WHERE tokenId = $1
      `, [decoded.tokenId]);
            throw new Error('Refresh token has expired');
        }
        if (!tokenRecord.user_active) {
            throw new Error('User account is inactive');
        }
        if (tokenRecord.userId !== decoded.userId) {
            throw new Error('Token user mismatch');
        }
        return {
            tokenId: tokenRecord.tokenId,
            user: {
                id: tokenRecord.user_id,
                email: tokenRecord.email,
                role: tokenRecord.role,
                firstName: tokenRecord.firstName,
                lastName: tokenRecord.lastName
            }
        };
    }
    catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new Error('Invalid refresh token format');
        }
        else if (error instanceof jwt.TokenExpiredError) {
            throw new Error('Refresh token has expired');
        }
        throw error;
    }
}
async function generateNewTokens(user, oldTokenId) {
    const database = database_service_1.DatabaseService.getInstance();
    const accessTokenSecret = process.env.JWT_ACCESS_SECRET || 'default_access_secret';
    const refreshTokenSecret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
    const accessTokenExpiry = parseInt(process.env.JWT_ACCESS_EXPIRY || '3600');
    const refreshTokenExpiry = parseInt(process.env.JWT_REFRESH_EXPIRY || '604800');
    const newAccessTokenId = (0, uuid_1.v4)();
    const newRefreshTokenId = (0, uuid_1.v4)();
    const accessTokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenId: newAccessTokenId,
        type: 'access'
    };
    const refreshTokenPayload = {
        userId: user.id,
        tokenId: newRefreshTokenId,
        type: 'refresh'
    };
    const accessToken = jwt.sign(accessTokenPayload, accessTokenSecret, {
        expiresIn: accessTokenExpiry,
        issuer: 'hasivu-platform',
        audience: 'hasivu-users'
    });
    const refreshToken = jwt.sign(refreshTokenPayload, refreshTokenSecret, {
        expiresIn: refreshTokenExpiry,
        issuer: 'hasivu-platform',
        audience: 'hasivu-users'
    });
    await database.query('BEGIN');
    try {
        await database.query(`
      UPDATE refresh_tokens 
      SET isActive = false, updatedAt = NOW()
      WHERE tokenId = $1
    `, [oldTokenId]);
        await database.query(`
      INSERT INTO refresh_tokens (
        id, userId, tokenId, expiresAt, isActive, createdAt, updatedAt
      ) VALUES (
        $1, $2, $3, $4, true, NOW(), NOW()
      )
    `, [
            (0, uuid_1.v4)(),
            user.id,
            newRefreshTokenId,
            new Date(Date.now() + refreshTokenExpiry * 1000)
        ]);
        await database.query(`
      UPDATE users SET lastLoginAt = NOW(), updatedAt = NOW()
      WHERE id = $1
    `, [user.id]);
        await database.query('COMMIT');
        logger_1.logger.info('New tokens generated successfully', {
            userId: user.id,
            email: user.email,
            newAccessTokenId: newAccessTokenId,
            newRefreshTokenId: newRefreshTokenId
        });
        return {
            accessToken,
            refreshToken,
            expiresIn: accessTokenExpiry
        };
    }
    catch (error) {
        await database.query('ROLLBACK');
        throw error;
    }
}
const handler = async (event, context) => {
    const startTime = Date.now();
    logger_1.logger.logFunctionStart('tokenRefreshHandler', { event, context });
    try {
        if (event.httpMethod !== 'POST') {
            return (0, response_utils_1.createErrorResponse)('Method not allowed', 405, 'METHOD_NOT_ALLOWED');
        }
        const requestBody = JSON.parse(event.body || '{}');
        logger_1.logger.info('Processing token refresh request', { hasRefreshToken: !!requestBody.refreshToken });
        if (!requestBody.refreshToken) {
            return (0, response_utils_1.createErrorResponse)('Missing required field: refreshToken', 400, 'MISSING_REFRESH_TOKEN');
        }
        if (typeof requestBody.refreshToken !== 'string' || requestBody.refreshToken.trim().length === 0) {
            return (0, response_utils_1.createErrorResponse)('Refresh token must be a non-empty string', 400, 'INVALID_REFRESH_TOKEN_FORMAT');
        }
        const { tokenId, user } = await validateRefreshToken(requestBody.refreshToken);
        const { accessToken, refreshToken, expiresIn } = await generateNewTokens(user, tokenId);
        const response = {
            accessToken,
            refreshToken,
            tokenType: 'Bearer',
            expiresIn,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }
        };
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('refreshHandler', { statusCode: 200, duration });
        logger_1.logger.info('Token refresh completed successfully', {
            userId: user.id,
            email: user.email,
            duration: duration
        });
        return (0, response_utils_1.createSuccessResponse)({
            data: response,
            message: 'Tokens refreshed successfully'
        });
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.logFunctionEnd('refreshHandler', { statusCode: 500, duration, error: true });
        return (0, response_utils_1.handleError)(error, 'Failed to refresh tokens');
    }
};
exports.handler = handler;
//# sourceMappingURL=refresh.test.js.map