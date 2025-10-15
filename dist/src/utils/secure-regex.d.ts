export interface RegexValidationResult {
    isValid: boolean;
    isSafe: boolean;
    message?: string;
}
export interface RegexTestResult {
    isMatch: boolean;
    error?: string;
}
export declare const SecurePatterns: {
    EMAIL: RegExp;
    PHONE: RegExp;
    ALPHANUMERIC: RegExp;
    UUID: RegExp;
    URL: RegExp;
    IPV4: RegExp;
    PASSWORD_STRONG: RegExp;
    DATE_ISO: RegExp;
    TIME: RegExp;
};
export declare function isRegexSafe(pattern: string | RegExp): RegexValidationResult;
export declare function safeRegexTest(pattern: RegExp, input: string, timeoutMs?: number): {
    matches: boolean;
    timedOut: boolean;
};
export declare function validateInput(input: string, pattern: RegExp): boolean;
export declare function escapeRegex(str: string): string;
export declare function createSearchPattern(searchTerm: string, caseSensitive?: boolean): RegExp;
export declare function isValidEmail(email: string): boolean;
export declare function isValidPhone(phone: string): boolean;
export declare function isValidUUID(uuid: string): boolean;
export declare function isValidURL(url: string): boolean;
export declare const SafeRegexPatterns: {
    bearerToken: RegExp;
    dataUrl: RegExp;
    email: RegExp;
    password: RegExp;
    uuid: RegExp;
    safeString: RegExp;
};
export declare const secureRegex: {
    test(pattern: RegExp | string, input: string, timeoutMs?: number): RegexTestResult;
};
export declare const RegexValidators: {
    validateEmail(email: string): RegexTestResult;
    validatePassword(password: string): RegexTestResult;
    validateUUID(uuid: string): RegexTestResult;
    validateBearerToken(token: string): RegexTestResult;
    validateDataUrl(url: string): RegexTestResult;
};
declare const _default: {
    SecurePatterns: {
        EMAIL: RegExp;
        PHONE: RegExp;
        ALPHANUMERIC: RegExp;
        UUID: RegExp;
        URL: RegExp;
        IPV4: RegExp;
        PASSWORD_STRONG: RegExp;
        DATE_ISO: RegExp;
        TIME: RegExp;
    };
    SafeRegexPatterns: {
        bearerToken: RegExp;
        dataUrl: RegExp;
        email: RegExp;
        password: RegExp;
        uuid: RegExp;
        safeString: RegExp;
    };
    isRegexSafe: typeof isRegexSafe;
    safeRegexTest: typeof safeRegexTest;
    validateInput: typeof validateInput;
    escapeRegex: typeof escapeRegex;
    createSearchPattern: typeof createSearchPattern;
    isValidEmail: typeof isValidEmail;
    isValidPhone: typeof isValidPhone;
    isValidUUID: typeof isValidUUID;
    isValidURL: typeof isValidURL;
    secureRegex: {
        test(pattern: string | RegExp, input: string, timeoutMs?: number): RegexTestResult;
    };
    RegexValidators: {
        validateEmail(email: string): RegexTestResult;
        validatePassword(password: string): RegexTestResult;
        validateUUID(uuid: string): RegexTestResult;
        validateBearerToken(token: string): RegexTestResult;
        validateDataUrl(url: string): RegexTestResult;
    };
};
export default _default;
//# sourceMappingURL=secure-regex.d.ts.map