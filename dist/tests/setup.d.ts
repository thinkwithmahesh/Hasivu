declare global {
    var jest: typeof import('@jest/globals').jest;
}
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeValidEmail(): R;
            toBeValidPhoneNumber(): R;
            toHaveValidTimestamp(): R;
            toMatchSecurityPattern(pattern: 'password' | 'token' | 'hash'): R;
        }
    }
    var testUtils: {
        waitFor: (condition: () => boolean, timeout?: number) => Promise<void>;
        mockFn: <T extends (...args: any[]) => any>(implementation?: T) => any;
        timestamp: (offsetMs?: number) => Date;
        networkDelay: (ms?: number) => Promise<void>;
        generateTestId: (prefix?: string) => string;
    };
}
export {};
//# sourceMappingURL=setup.d.ts.map