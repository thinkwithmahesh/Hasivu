"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexValidators = exports.secureRegex = exports.SafeRegexPatterns = exports.isValidURL = exports.isValidUUID = exports.isValidPhone = exports.isValidEmail = exports.createSearchPattern = exports.escapeRegex = exports.validateInput = exports.safeRegexTest = exports.isRegexSafe = exports.SecurePatterns = void 0;
exports.SecurePatterns = {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    PHONE: /^\+?[1-9]\d{1,14}$/,
    ALPHANUMERIC: /^[a-zA-Z0-9_-]+$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,
    IPV4: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
    TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
};
const _DANGEROUS_PATTERNS = [
    /(\w+)+/,
    /(\d+)*/,
    /(\w*)+/,
    /(a+|a)+/,
    /(a|a)+/,
    /(a+)+b/,
    /(a*)*b/,
];
function isRegexSafe(pattern) {
    const patternStr = pattern instanceof RegExp ? pattern.source : pattern;
    if (/\([^)]*[*+][^)]*\)[*+]/.test(patternStr)) {
        return {
            isValid: true,
            isSafe: false,
            message: 'Pattern contains nested quantifiers which may cause ReDoS',
        };
    }
    if (/\(([^|)]+\|)+[^)]*\)[*+]/.test(patternStr)) {
        return {
            isValid: true,
            isSafe: false,
            message: 'Pattern contains overlapping alternations with quantifiers',
        };
    }
    if (/\([^)]*\*[^)]*\)\*/.test(patternStr)) {
        return {
            isValid: true,
            isSafe: false,
            message: 'Pattern may cause catastrophic backtracking',
        };
    }
    return {
        isValid: true,
        isSafe: true,
    };
}
exports.isRegexSafe = isRegexSafe;
function safeRegexTest(pattern, input, timeoutMs = 1000) {
    let matches = false;
    let timedOut = false;
    const worker = setTimeout(() => {
        timedOut = true;
    }, timeoutMs);
    try {
        matches = pattern.test(input);
    }
    catch (error) {
        timedOut = true;
    }
    finally {
        clearTimeout(worker);
    }
    return { matches, timedOut };
}
exports.safeRegexTest = safeRegexTest;
function validateInput(input, pattern) {
    const safetyCheck = isRegexSafe(pattern);
    if (!safetyCheck.isSafe) {
        return false;
    }
    const result = safeRegexTest(pattern, input);
    if (result.timedOut) {
        return false;
    }
    return result.matches;
}
exports.validateInput = validateInput;
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
exports.escapeRegex = escapeRegex;
function createSearchPattern(searchTerm, caseSensitive = false) {
    const escaped = escapeRegex(searchTerm);
    return new RegExp(escaped, caseSensitive ? 'g' : 'gi');
}
exports.createSearchPattern = createSearchPattern;
function isValidEmail(email) {
    return validateInput(email, exports.SecurePatterns.EMAIL);
}
exports.isValidEmail = isValidEmail;
function isValidPhone(phone) {
    return validateInput(phone, exports.SecurePatterns.PHONE);
}
exports.isValidPhone = isValidPhone;
function isValidUUID(uuid) {
    return validateInput(uuid, exports.SecurePatterns.UUID);
}
exports.isValidUUID = isValidUUID;
function isValidURL(url) {
    return validateInput(url, exports.SecurePatterns.URL);
}
exports.isValidURL = isValidURL;
exports.SafeRegexPatterns = {
    bearerToken: /^Bearer .+$/,
    dataUrl: /^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/]+=*$/,
    email: /^[^@]+@[^@]+\.[^@]+$/,
    password: /^.{8,}$/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    safeString: /^[a-zA-Z0-9\s\-_.]+$/,
};
exports.secureRegex = {
    test(pattern, input, timeoutMs = 1000) {
        if (input.length > 10000) {
            return {
                isMatch: false,
                error: 'Input exceeds maximum allowed length (10KB)',
            };
        }
        try {
            const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
            const safetyCheck = isRegexSafe(regex);
            if (!safetyCheck.isSafe) {
                return {
                    isMatch: false,
                    error: `Unsafe regex pattern: ${safetyCheck.message}`,
                };
            }
            const result = safeRegexTest(regex, input, timeoutMs);
            if (result.timedOut) {
                return {
                    isMatch: false,
                    error: 'Regex execution timed out - potential ReDoS detected',
                };
            }
            return {
                isMatch: result.matches,
            };
        }
        catch (error) {
            return {
                isMatch: false,
                error: error instanceof Error ? error.message : 'Unknown error during regex test',
            };
        }
    },
};
exports.RegexValidators = {
    validateEmail(email) {
        return exports.secureRegex.test(exports.SafeRegexPatterns.email, email);
    },
    validatePassword(password) {
        return exports.secureRegex.test(exports.SafeRegexPatterns.password, password);
    },
    validateUUID(uuid) {
        return exports.secureRegex.test(exports.SafeRegexPatterns.uuid, uuid);
    },
    validateBearerToken(token) {
        return exports.secureRegex.test(exports.SafeRegexPatterns.bearerToken, token);
    },
    validateDataUrl(url) {
        return exports.secureRegex.test(exports.SafeRegexPatterns.dataUrl, url);
    },
};
exports.default = {
    SecurePatterns: exports.SecurePatterns,
    SafeRegexPatterns: exports.SafeRegexPatterns,
    isRegexSafe,
    safeRegexTest,
    validateInput,
    escapeRegex,
    createSearchPattern,
    isValidEmail,
    isValidPhone,
    isValidUUID,
    isValidURL,
    secureRegex: exports.secureRegex,
    RegexValidators: exports.RegexValidators,
};
//# sourceMappingURL=secure-regex.js.map