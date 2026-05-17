/**
 * HASIVU Platform - Password Validation Utility
 *
 * FIXES: HIGH-001 - Password Validation Inconsistency
 * Matches backend validation rules from auth.service.ts
 */

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
  errors?: string[];
  strength?: 'weak' | 'medium' | 'strong' | 'very-strong';
  score?: number;
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  maxLength?: number;
  minScore?: number;
}

/**
 * Default password requirements matching backend
 */
export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  maxLength: 128,
  minScore: 3, // Medium strength minimum
};

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length
  if (password.length < requirements.minLength) {
    errors.push(`Password must be at least ${requirements.minLength} characters long`);
  }

  // Check maximum length
  if (requirements.maxLength && password.length > requirements.maxLength) {
    errors.push(`Password must not exceed ${requirements.maxLength} characters`);
  }

  // Check uppercase requirement
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check lowercase requirement
  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check number requirement
  if (requirements.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check special character requirement
  if (requirements.requireSpecialChar && !/[!@#$%^&*()_+\-=[]{};"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Calculate password strength
  const strengthResult = calculatePasswordStrength(password);

  // Check minimum score if required
  if (requirements.minScore && strengthResult.score < requirements.minScore) {
    errors.push(`Password strength is too weak (score: ${strengthResult.score}/5)`);
  }

  const valid = errors.length === 0;

  return {
    valid,
    message: valid ? 'Password meets all requirements' : errors.join('. '),
    errors: errors.length > 0 ? errors : undefined,
    strength: strengthResult.strength,
    score: strengthResult.score,
  };
}

/**
 * Calculate password strength score (0-5)
 */
export function calculatePasswordStrength(password: string): {
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  score: number;
} {
  let score = 0;

  // Length contribution (max 2 points)
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character variety (1 point each)
  if (/[a-z]/.test(password)) score += 1; // Lowercase
  if (/[A-Z]/.test(password)) score += 1; // Uppercase
  if (/[0-9]/.test(password)) score += 1; // Numbers
  if (/[!@#$%^&*()_+\-=[]{};"\\|,.<>\/?]/.test(password)) score += 1; // Special chars

  // Penalize common patterns
  if (/^(?:12345|password|qwerty|abc123)/i.test(password)) {
    score = Math.max(0, score - 2);
  }

  // Bonus for very long passwords
  if (password.length >= 16) score += 1;

  // Cap at 5
  score = Math.min(5, score);

  // Determine strength level
  let strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  if (score <= 2) {
    strength = 'weak';
  } else if (score === 3) {
    strength = 'medium';
  } else if (score === 4) {
    strength = 'strong';
  } else {
    strength = 'very-strong';
  }

  return { strength, score };
}

/**
 * Get password strength color for UI
 */
export function getPasswordStrengthColor(
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
): string {
  const colors = {
    weak: '#ef4444', // red-500
    medium: '#f59e0b', // amber-500
    strong: '#10b981', // green-500
    'very-strong': '#059669', // green-600
  };
  return colors[strength];
}

/**
 * Get password strength label for UI
 */
export function getPasswordStrengthLabel(
  strength: 'weak' | 'medium' | 'strong' | 'very-strong'
): string {
  const labels = {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    'very-strong': 'Very Strong',
  };
  return labels[strength];
}

/**
 * Check if password matches confirmation
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): { valid: boolean; message?: string } {
  if (password !== confirmPassword) {
    return {
      valid: false,
      message: 'Passwords do not match',
    };
  }
  return { valid: true };
}

/**
 * Check for common passwords (basic check)
 */
export function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password',
    '12345678',
    'qwerty',
    'abc123',
    'password123',
    'admin',
    'letmein',
    'welcome',
    'monkey',
    '1234567890',
    'password1',
    'qwerty123',
  ];

  return commonPasswords.some(common => password.toLowerCase() === common.toLowerCase());
}

/**
 * Get password requirements as formatted text
 */
export function getPasswordRequirementsText(
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): string[] {
  const rules: string[] = [];

  rules.push(`At least ${requirements.minLength} characters`);

  if (requirements.requireUppercase) {
    rules.push('One uppercase letter (A-Z)');
  }

  if (requirements.requireLowercase) {
    rules.push('One lowercase letter (a-z)');
  }

  if (requirements.requireNumber) {
    rules.push('One number (0-9)');
  }

  if (requirements.requireSpecialChar) {
    rules.push('One special character (!@#$%^&*...)');
  }

  if (requirements.maxLength) {
    rules.push(`Maximum ${requirements.maxLength} characters`);
  }

  return rules;
}

/**
 * Real-time password validation for form inputs
 */
export function validatePasswordRealtime(password: string): {
  isValid: boolean;
  checks: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    specialChar: boolean;
  };
  strength: ReturnType<typeof calculatePasswordStrength>;
} {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*()_+\-=[]{};"\\|,.<>\/?]/.test(password),
  };

  const isValid = Object.values(checks).every(check => check);
  const strength = calculatePasswordStrength(password);

  return {
    isValid,
    checks,
    strength,
  };
}

/**
 * Generate a strong password suggestion
 */
export function generateStrongPassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one of each required character type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Export utility object for convenience
 */
export const PasswordValidator = {
  validate: validatePassword,
  calculateStrength: calculatePasswordStrength,
  getStrengthColor: getPasswordStrengthColor,
  getStrengthLabel: getPasswordStrengthLabel,
  validateMatch: validatePasswordMatch,
  isCommon: isCommonPassword,
  getRequirementsText: getPasswordRequirementsText,
  validateRealtime: validatePasswordRealtime,
  generateStrong: generateStrongPassword,
  DEFAULT_REQUIREMENTS: DEFAULT_PASSWORD_REQUIREMENTS,
};

export default PasswordValidator;
