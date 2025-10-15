import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character'
  );

// Role detection utility
export const detectRoleFromEmail = (email: string): string => {
  const domain = email.split('@')[1]?.toLowerCase();

  if (!domain) return 'student';

  // School staff patterns
  if (domain.includes('school') || domain.includes('edu') || domain.includes('admin')) {
    if (email.includes('admin') || email.includes('principal')) return 'admin';
    if (email.includes('teacher') || email.includes('staff')) return 'teacher';
    if (email.includes('kitchen') || email.includes('food')) return 'kitchen';
    return 'staff';
  }

  // Parent patterns
  if (email.includes('parent') || email.includes('guardian')) return 'parent';

  // Default to student for school domains, parent otherwise
  return domain.includes('student') ? 'student' : 'parent';
};

// Enhanced login schema
export const enhancedLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
  role: z.enum(['student', 'parent', 'teacher', 'kitchen', 'admin']).optional(),
});

// Original login schema for backward compatibility
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
  recoveryMethod: z.enum(['email', 'sms', 'security_questions']).default('email'),
});

// Security questions schema
export const securityQuestionsSchema = z.object({
  question1: z.string().min(1, 'Please select a security question'),
  answer1: z.string().min(3, 'Answer must be at least 3 characters'),
  question2: z.string().min(1, 'Please select a second security question'),
  answer2: z.string().min(3, 'Answer must be at least 3 characters'),
  question3: z.string().min(1, 'Please select a third security question'),
  answer3: z.string().min(3, 'Answer must be at least 3 characters'),
});

// Parent verification schema
export const parentVerificationSchema = z.object({
  parentEmail: emailSchema,
  studentId: z.string().min(1, 'Student ID is required'),
  relationshipType: z.enum(['parent', 'guardian', 'emergency_contact']),
  verificationCode: z.string().length(6, 'Verification code must be 6 digits'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),
});

// Multi-step registration schemas
export const registrationStep1Schema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(['student', 'parent', 'teacher', 'kitchen', 'admin']),
    acceptTerms: z.boolean().refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const registrationStep2Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),
  dateOfBirth: z.string().refine(date => {
    const parsed = new Date(date);
    const now = new Date();
    return parsed <= now && parsed.getFullYear() > 1900;
  }, 'Please enter a valid date of birth'),
  grade: z.string().optional(),
  studentId: z.string().optional(),
});

export const registrationStep3Schema = z.object({
  emergencyContactName: z.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),
  emergencyContactRelation: z.string().min(1, 'Please specify relationship'),
  medicalConditions: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  notificationPreferences: z
    .object({
      email: z.boolean().default(true),
      sms: z.boolean().default(false),
      push: z.boolean().default(true),
    })
    .optional(),
});

// Original registration schema for backward compatibility
export const registrationSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters'),
    lastName: z.string().min(2, 'Last name must be at least 2 characters'),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    grade: z.string().optional(),
    section: z.string().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Reset password schema
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// MFA schemas
export const mfaSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
  trustDevice: z.boolean().optional().default(false),
});

export const mfaSetupSchema = z
  .object({
    method: z.enum(['totp', 'sms', 'email']),
    phoneNumber: z.string().optional(),
    backupEmail: z.string().email().optional(),
  })
  .refine(
    data => {
      if (data.method === 'sms' && !data.phoneNumber) {
        return false;
      }
      return true;
    },
    {
      message: 'Phone number is required for SMS verification',
      path: ['phoneNumber'],
    }
  );

export const recoveryCodesSchema = z.object({
  codes: z.array(z.string()).min(8, 'Must have at least 8 recovery codes'),
  acknowledged: z.boolean().refine(val => val === true, {
    message: 'You must acknowledge that you have saved your recovery codes',
  }),
});

// Profile management schema
export const profileManagementSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: emailSchema,
  phoneNumber: z.string().regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),
  dateOfBirth: z.string().optional(),
  grade: z.string().optional(),
  studentId: z.string().optional(),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(2, 'Contact name is required'),
        phone: z.string().regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number'),
        relation: z.string().min(1, 'Please specify relationship'),
      })
    )
    .optional(),
  medicalInfo: z
    .object({
      conditions: z.string().optional(),
      medications: z.string().optional(),
      allergies: z.array(z.string()).optional(),
      dietaryRestrictions: z.array(z.string()).optional(),
    })
    .optional(),
  preferences: z
    .object({
      notifications: z
        .object({
          email: z.boolean().default(true),
          sms: z.boolean().default(false),
          push: z.boolean().default(true),
        })
        .optional(),
      language: z.string().default('en'),
      timezone: z.string().default('UTC'),
    })
    .optional(),
});

// RFID linking schema
export const rfidLinkingSchema = z
  .object({
    rfidTag: z.string().min(8, 'RFID tag must be at least 8 characters'),
    studentId: z.string().min(1, 'Student ID is required'),
    verificationMethod: z.enum(['pin', 'biometric', 'admin_approval']),
    pin: z.string().optional(),
  })
  .refine(
    data => {
      if (data.verificationMethod === 'pin' && !data.pin) {
        return false;
      }
      return true;
    },
    {
      message: 'PIN is required when using PIN verification',
      path: ['pin'],
    }
  );

// Original RFID schema for backward compatibility
export const rfidSchema = z.object({
  rfidTag: z.string().min(1, 'RFID tag is required'),
  studentId: z.string().optional(),
});

// Dietary restrictions and allergens constants
export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Kosher',
  'Halal',
  'Low-Sodium',
  'Low-Sugar',
  'Nut-Free',
  'Organic Only',
] as const;

export const COMMON_ALLERGENS = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
  'Sulphites',
] as const;

// Type exports for TypeScript
export type EnhancedLoginFormData = z.infer<typeof enhancedLoginSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type SecurityQuestionsFormData = z.infer<typeof securityQuestionsSchema>;
export type ParentVerificationFormData = z.infer<typeof parentVerificationSchema>;
export type RegistrationStep1FormData = z.infer<typeof registrationStep1Schema>;
export type RegistrationStep2FormData = z.infer<typeof registrationStep2Schema>;
export type RegistrationStep3FormData = z.infer<typeof registrationStep3Schema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;
export type MfaFormData = z.infer<typeof mfaSchema>;
export type MfaSetupFormData = z.infer<typeof mfaSetupSchema>;
export type RecoveryCodesFormData = z.infer<typeof recoveryCodesSchema>;
export type ProfileManagementFormData = z.infer<typeof profileManagementSchema>;
export type RfidLinkingFormData = z.infer<typeof rfidLinkingSchema>;
export type RFIDFormData = z.infer<typeof rfidSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// Backward compatibility aliases
export { registrationSchema as registerSchema };
