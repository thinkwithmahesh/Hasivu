import { ChallengeNameType } from '@aws-sdk/client-cognito-identity-provider';
export interface CognitoAuthResult {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    tokenType: string;
    expiresIn: number;
    userSub: string;
    challengeName?: ChallengeNameType;
    challengeParameters?: Record<string, string>;
}
export interface UserRegistration {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: string;
    schoolId?: string;
}
export interface LoginCredentials {
    email: string;
    password: string;
}
export interface UserAttributes {
    sub?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    schoolId?: string;
    emailVerified?: boolean;
    phoneVerified?: boolean;
    [key: string]: any;
}
export declare class CognitoServiceError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(message: string, code?: string, statusCode?: number);
}
declare class CognitoServiceClass {
    private static instance;
    private client;
    private userPoolId;
    private clientId;
    constructor();
    static getInstance(): CognitoServiceClass;
    signUp(userData: UserRegistration): Promise<{
        userSub: string;
        isConfirmed: boolean;
    }>;
    confirmSignUp(email: string, confirmationCode: string): Promise<void>;
    resendConfirmationCode(email: string): Promise<void>;
    signIn(credentials: LoginCredentials): Promise<CognitoAuthResult>;
    authenticate(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        idToken: string;
        user: UserAttributes;
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        idToken: string;
        expiresIn: number;
    }>;
    signOut(accessToken: string): Promise<void>;
    getUser(accessToken: string): Promise<{
        user: UserAttributes;
    }>;
    verifyToken(accessToken: string): Promise<UserAttributes>;
    updateUserAttributes(accessToken: string, attributes: UserAttributes): Promise<void>;
    changePassword(accessToken: string, previousPassword: string, proposedPassword: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    confirmForgotPassword(email: string, confirmationCode: string, newPassword: string): Promise<void>;
    private decodeToken;
    private handleCognitoError;
}
export declare const CognitoService: CognitoServiceClass;
export { CognitoServiceClass };
export default CognitoServiceClass;
//# sourceMappingURL=cognito.service.d.ts.map