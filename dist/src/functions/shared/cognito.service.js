"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CognitoServiceClass = exports.CognitoService = exports.CognitoServiceError = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const logger_1 = require("../../utils/logger");
class CognitoServiceError extends Error {
    code;
    statusCode;
    constructor(message, code = 'CognitoError', statusCode = 500) {
        super(message);
        this.name = 'CognitoServiceError';
        this.code = code;
        this.statusCode = statusCode;
    }
}
exports.CognitoServiceError = CognitoServiceError;
class CognitoServiceClass {
    static instance;
    client;
    userPoolId;
    clientId;
    constructor() {
        this.client = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
            region: process.env.AWS_REGION || 'us-east-1',
        });
        this.userPoolId = process.env.COGNITO_USER_POOL_ID;
        this.clientId = process.env.COGNITO_CLIENT_ID;
        if (!this.userPoolId || !this.clientId) {
            throw new Error('Cognito User Pool ID and Client ID must be configured');
        }
    }
    static getInstance() {
        if (!CognitoServiceClass.instance) {
            CognitoServiceClass.instance = new CognitoServiceClass();
        }
        return CognitoServiceClass.instance;
    }
    async signUp(userData) {
        try {
            logger_1.logger.info('Attempting user registration', { email: userData.email });
            const command = new client_cognito_identity_provider_1.SignUpCommand({
                ClientId: this.clientId,
                Username: userData.email,
                Password: userData.password,
                UserAttributes: [
                    { Name: 'email', Value: userData.email },
                    { Name: 'given_name', Value: userData.firstName },
                    { Name: 'family_name', Value: userData.lastName },
                    ...(userData.phoneNumber ? [{ Name: 'phone_number', Value: userData.phoneNumber }] : []),
                    ...(userData.role ? [{ Name: 'custom:role', Value: userData.role }] : []),
                    ...(userData.schoolId ? [{ Name: 'custom:school_id', Value: userData.schoolId }] : []),
                ],
            });
            const response = await this.client.send(command);
            logger_1.logger.integration('Cognito signUp operation completed successfully', {
                email: userData.email,
                userSub: response.UserSub,
            });
            return {
                userSub: response.UserSub,
                isConfirmed: !!response.UserConfirmed,
            };
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async confirmSignUp(email, confirmationCode) {
        try {
            const command = new client_cognito_identity_provider_1.ConfirmSignUpCommand({
                ClientId: this.clientId,
                Username: email,
                ConfirmationCode: confirmationCode,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito confirmSignUp operation completed successfully', { email });
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async resendConfirmationCode(email) {
        try {
            const command = new client_cognito_identity_provider_1.ResendConfirmationCodeCommand({
                ClientId: this.clientId,
                Username: email,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito resendConfirmationCode operation completed successfully', {
                email,
            });
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async signIn(credentials) {
        try {
            logger_1.logger.info('Attempting user authentication', { email: credentials.email });
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
                ClientId: this.clientId,
                AuthFlow: client_cognito_identity_provider_1.AuthFlowType.USER_PASSWORD_AUTH,
                AuthParameters: {
                    USERNAME: credentials.email,
                    PASSWORD: credentials.password,
                },
            });
            const response = await this.client.send(command);
            if (!response.AuthenticationResult) {
                throw new CognitoServiceError('Authentication failed', 'AuthenticationFailed', 401);
            }
            const authResult = {
                accessToken: response.AuthenticationResult.AccessToken,
                refreshToken: response.AuthenticationResult.RefreshToken,
                idToken: response.AuthenticationResult.IdToken,
                tokenType: response.AuthenticationResult.TokenType,
                expiresIn: response.AuthenticationResult.ExpiresIn,
                userSub: this.decodeToken(response.AuthenticationResult.AccessToken).sub,
                challengeName: response.ChallengeName,
                challengeParameters: response.ChallengeParameters,
            };
            logger_1.logger.integration('Cognito signIn operation completed successfully', {
                email: credentials.email,
                userSub: authResult.userSub,
            });
            return authResult;
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async authenticate(email, password) {
        try {
            const authResult = await this.signIn({ email, password });
            const { user } = await this.getUser(authResult.accessToken);
            return {
                accessToken: authResult.accessToken,
                refreshToken: authResult.refreshToken,
                idToken: authResult.idToken,
                user,
            };
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async refreshToken(refreshToken) {
        try {
            const command = new client_cognito_identity_provider_1.InitiateAuthCommand({
                ClientId: this.clientId,
                AuthFlow: client_cognito_identity_provider_1.AuthFlowType.REFRESH_TOKEN_AUTH,
                AuthParameters: {
                    REFRESH_TOKEN: refreshToken,
                },
            });
            const response = await this.client.send(command);
            if (!response.AuthenticationResult) {
                throw new CognitoServiceError('Token refresh failed', 'TokenRefreshFailed', 401);
            }
            const result = {
                accessToken: response.AuthenticationResult.AccessToken,
                idToken: response.AuthenticationResult.IdToken,
                expiresIn: response.AuthenticationResult.ExpiresIn,
            };
            logger_1.logger.integration('Cognito refreshToken operation completed successfully', {
                tokenRefreshed: true,
            });
            return result;
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async signOut(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GlobalSignOutCommand({
                AccessToken: accessToken,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito signOut operation completed successfully');
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async getUser(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GetUserCommand({
                AccessToken: accessToken,
            });
            const response = await this.client.send(command);
            const attributes = {};
            response.UserAttributes?.forEach((attr) => {
                if (attr.Name && attr.Value) {
                    switch (attr.Name) {
                        case 'sub':
                            attributes.sub = attr.Value;
                            break;
                        case 'email':
                            attributes.email = attr.Value;
                            break;
                        case 'given_name':
                            attributes.firstName = attr.Value;
                            break;
                        case 'family_name':
                            attributes.lastName = attr.Value;
                            break;
                        case 'phone_number':
                            attributes.phoneNumber = attr.Value;
                            break;
                        case 'custom:role':
                            attributes.role = attr.Value;
                            break;
                        case 'custom:school_id':
                            attributes.schoolId = attr.Value;
                            break;
                        case 'email_verified':
                            attributes.emailVerified = attr.Value === 'true';
                            break;
                        case 'phone_number_verified':
                            attributes.phoneVerified = attr.Value === 'true';
                            break;
                        default:
                            attributes[attr.Name] = attr.Value;
                    }
                }
            });
            logger_1.logger.integration('Cognito getUser operation completed successfully', {
                userSub: attributes.sub,
            });
            return { user: attributes };
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async verifyToken(accessToken) {
        try {
            const { user } = await this.getUser(accessToken);
            return user;
        }
        catch (error) {
            throw new CognitoServiceError('Invalid or expired access token', 'InvalidToken', 401);
        }
    }
    async updateUserAttributes(accessToken, attributes) {
        try {
            const userAttributes = [];
            Object.entries(attributes).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    switch (key) {
                        case 'firstName':
                            userAttributes.push({ Name: 'given_name', Value: value.toString() });
                            break;
                        case 'lastName':
                            userAttributes.push({ Name: 'family_name', Value: value.toString() });
                            break;
                        case 'phoneNumber':
                            userAttributes.push({ Name: 'phone_number', Value: value.toString() });
                            break;
                        case 'role':
                            userAttributes.push({ Name: 'custom:role', Value: value.toString() });
                            break;
                        case 'schoolId':
                            userAttributes.push({ Name: 'custom:school_id', Value: value.toString() });
                            break;
                        default:
                            if (key !== 'sub' && key !== 'email') {
                                userAttributes.push({ Name: key, Value: value.toString() });
                            }
                    }
                }
            });
            const command = new client_cognito_identity_provider_1.UpdateUserAttributesCommand({
                AccessToken: accessToken,
                UserAttributes: userAttributes,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito updateUserAttributes operation completed successfully', {
                attributesUpdated: userAttributes.length,
            });
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async changePassword(accessToken, previousPassword, proposedPassword) {
        try {
            const command = new client_cognito_identity_provider_1.ChangePasswordCommand({
                AccessToken: accessToken,
                PreviousPassword: previousPassword,
                ProposedPassword: proposedPassword,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito changePassword operation completed successfully');
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async forgotPassword(email) {
        try {
            const command = new client_cognito_identity_provider_1.ForgotPasswordCommand({
                ClientId: this.clientId,
                Username: email,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito forgotPassword operation completed successfully', { email });
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    async confirmForgotPassword(email, confirmationCode, newPassword) {
        try {
            const command = new client_cognito_identity_provider_1.ConfirmForgotPasswordCommand({
                ClientId: this.clientId,
                Username: email,
                ConfirmationCode: confirmationCode,
                Password: newPassword,
            });
            await this.client.send(command);
            logger_1.logger.integration('Cognito confirmForgotPassword operation completed successfully', {
                email,
            });
        }
        catch (error) {
            throw this.handleCognitoError(error);
        }
    }
    decodeToken(token) {
        try {
            const base64Payload = token.split('.')[1];
            const payload = Buffer.from(base64Payload, 'base64').toString();
            return JSON.parse(payload);
        }
        catch (error) {
            throw new CognitoServiceError('Invalid token format', 'InvalidToken', 400);
        }
    }
    handleCognitoError(error) {
        if (error instanceof CognitoServiceError) {
            return error;
        }
        const errorName = error.name || error.code || 'UnknownError';
        const errorMessage = error.message || 'An unknown error occurred';
        switch (errorName) {
            case 'UsernameExistsException':
                return new CognitoServiceError('User already exists', 'UserExists', 409);
            case 'UserNotConfirmedException':
                return new CognitoServiceError('User email not confirmed', 'UserNotConfirmed', 400);
            case 'NotAuthorizedException':
                return new CognitoServiceError('Invalid credentials', 'InvalidCredentials', 401);
            case 'UserNotFoundException':
                return new CognitoServiceError('User not found', 'UserNotFound', 404);
            case 'CodeMismatchException':
                return new CognitoServiceError('Invalid confirmation code', 'InvalidCode', 400);
            case 'ExpiredCodeException':
                return new CognitoServiceError('Confirmation code expired', 'CodeExpired', 400);
            case 'LimitExceededException':
                return new CognitoServiceError('Too many attempts', 'TooManyAttempts', 429);
            case 'InvalidPasswordException':
                return new CognitoServiceError('Password does not meet requirements', 'InvalidPassword', 400);
            case 'TooManyRequestsException':
                return new CognitoServiceError('Too many requests', 'TooManyRequests', 429);
            default:
                logger_1.logger.error('Unhandled Cognito error', new Error(errorMessage), {
                    errorName,
                    errorMessage,
                });
                return new CognitoServiceError(errorMessage, errorName, 500);
        }
    }
}
exports.CognitoServiceClass = CognitoServiceClass;
exports.CognitoService = new CognitoServiceClass();
exports.default = CognitoServiceClass;
//# sourceMappingURL=cognito.service.js.map