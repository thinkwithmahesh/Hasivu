export interface AuthTestUtils {
    generateTestToken: (payload?: any) => string;
    generateTestUser: () => any;
    createTestAuthHeader: (token?: string) => string;
    mockAuthMiddleware: () => any;
}
export declare function createAuthTestUtils(): AuthTestUtils;
export declare function generateTestJWT(payload?: any): string;
export declare function createMockAuthRequest(token?: string): {
    headers: {
        authorization: string;
        'x-api-key': string;
    };
    user: any;
};
export declare function createTestUser(overrides?: any): any;
export declare function generateAuthToken(payload?: any): string;
//# sourceMappingURL=auth-utils.d.ts.map