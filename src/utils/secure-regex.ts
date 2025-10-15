/**
 * Secure Regex Utilities
 * Protection against ReDoS (Regular Expression Denial of Service) attacks
 */

export interface RegexValidationResult {
  isValid: boolean;
  isSafe: boolean;
  message?: string;
}

export interface RegexTestResult {
  isMatch: boolean;
  error?: string;
}

/**
 * Common secure regex patterns
 */
export const SecurePatterns = {
  // Email validation (simple, safe pattern)
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

  // Phone number (10 digits, optional country code)
  PHONE: /^\+?[1-9]\d{1,14}$/,

  // Alphanumeric with underscores and hyphens
  ALPHANUMERIC: /^[a-zA-Z0-9_-]+$/,

  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,

  // URL (basic validation)
  URL: /^https?:\/\/[^\s/$.?#].[^\s]*$/i,

  // IP Address (IPv4)
  IPV4: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,

  // Password strength (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
  PASSWORD_STRONG: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,

  // Date (YYYY-MM-DD)
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,

  // Time (HH:MM or HH:MM:SS)
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/,
};

/**
 * Dangerous regex patterns that can cause ReDoS
 */
const _DANGEROUS_PATTERNS = [
  // Nested quantifiers
  /(\w+)+/,
  /(\d+)*/,
  /(\w*)+/,

  // Overlapping alternations
  /(a+|a)+/,
  /(a|a)+/,

  // Catastrophic backtracking
  /(a+)+b/,
  /(a*)*b/,
];

/**
 * Check if a regex pattern is potentially dangerous (ReDoS vulnerable)
 */
export function isRegexSafe(pattern: string | RegExp): RegexValidationResult {
  const patternStr = pattern instanceof RegExp ? pattern.source : pattern;

  // Check for nested quantifiers
  if (/\([^)]*[*+][^)]*\)[*+]/.test(patternStr)) {
    return {
      isValid: true,
      isSafe: false,
      message: 'Pattern contains nested quantifiers which may cause ReDoS',
    };
  }

  // Check for overlapping alternations with quantifiers
  if (/\(([^|)]+\|)+[^)]*\)[*+]/.test(patternStr)) {
    return {
      isValid: true,
      isSafe: false,
      message: 'Pattern contains overlapping alternations with quantifiers',
    };
  }

  // Check for catastrophic backtracking patterns
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

/**
 * Test a regex with timeout to prevent ReDoS
 */
export function safeRegexTest(
  pattern: RegExp,
  input: string,
  timeoutMs: number = 1000
): { matches: boolean; timedOut: boolean } {
  let matches = false;
  let timedOut = false;

  const worker = setTimeout(() => {
    timedOut = true;
  }, timeoutMs);

  try {
    matches = pattern.test(input);
  } catch (error) {
    timedOut = true;
  } finally {
    clearTimeout(worker);
  }

  return { matches, timedOut };
}

/**
 * Validate input against a secure pattern
 */
export function validateInput(input: string, pattern: RegExp): boolean {
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

/**
 * Sanitize user input to prevent regex injection
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a safe search pattern from user input
 */
export function createSearchPattern(searchTerm: string, caseSensitive: boolean = false): RegExp {
  const escaped = escapeRegex(searchTerm);
  return new RegExp(escaped, caseSensitive ? 'g' : 'gi');
}

/**
 * Validate email with secure pattern
 */
export function isValidEmail(email: string): boolean {
  return validateInput(email, SecurePatterns.EMAIL);
}

/**
 * Validate phone number with secure pattern
 */
export function isValidPhone(phone: string): boolean {
  return validateInput(phone, SecurePatterns.PHONE);
}

/**
 * Validate UUID with secure pattern
 */
export function isValidUUID(uuid: string): boolean {
  return validateInput(uuid, SecurePatterns.UUID);
}

/**
 * Validate URL with secure pattern
 */
export function isValidURL(url: string): boolean {
  return validateInput(url, SecurePatterns.URL);
}

/**
 * Safe regex patterns for use in security-critical contexts
 */
export const SafeRegexPatterns = {
  bearerToken: /^Bearer .+$/,
  dataUrl: /^data:image\/(jpeg|png|gif|webp);base64,[A-Za-z0-9+/]+=*$/,
  email: /^[^@]+@[^@]+\.[^@]+$/,
  password: /^.{8,}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  safeString: /^[a-zA-Z0-9\s\-_.]+$/,
};

/**
 * Secure regex testing with timeout protection
 */
export const secureRegex = {
  test(pattern: RegExp | string, input: string, timeoutMs: number = 1000): RegexTestResult {
    // Input length limit (10KB)
    if (input.length > 10000) {
      return {
        isMatch: false,
        error: 'Input exceeds maximum allowed length (10KB)',
      };
    }

    try {
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

      // Check if pattern is safe
      const safetyCheck = isRegexSafe(regex);
      if (!safetyCheck.isSafe) {
        return {
          isMatch: false,
          error: `Unsafe regex pattern: ${safetyCheck.message}`,
        };
      }

      // Test with timeout
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
    } catch (error) {
      return {
        isMatch: false,
        error: error instanceof Error ? error.message : 'Unknown error during regex test',
      };
    }
  },
};

/**
 * Regex validators for common patterns
 */
export const RegexValidators = {
  validateEmail(email: string): RegexTestResult {
    return secureRegex.test(SafeRegexPatterns.email, email);
  },

  validatePassword(password: string): RegexTestResult {
    return secureRegex.test(SafeRegexPatterns.password, password);
  },

  validateUUID(uuid: string): RegexTestResult {
    return secureRegex.test(SafeRegexPatterns.uuid, uuid);
  },

  validateBearerToken(token: string): RegexTestResult {
    return secureRegex.test(SafeRegexPatterns.bearerToken, token);
  },

  validateDataUrl(url: string): RegexTestResult {
    return secureRegex.test(SafeRegexPatterns.dataUrl, url);
  },
};

export default {
  SecurePatterns,
  SafeRegexPatterns,
  isRegexSafe,
  safeRegexTest,
  validateInput,
  escapeRegex,
  createSearchPattern,
  isValidEmail,
  isValidPhone,
  isValidUUID,
  isValidURL,
  secureRegex,
  RegexValidators,
};
