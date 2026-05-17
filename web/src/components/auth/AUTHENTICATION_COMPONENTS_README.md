# HASIVU Platform - Authentication Components

This directory contains a comprehensive set of authentication components specifically designed for the HASIVU school meal management platform. These components are built using ShadCN/UI and include advanced features like role detection, multi-step registration, multi-factor authentication, and RFID card integration.

## Components Overview

### 🔐 Enhanced School Login Form

**File:** `EnhancedSchoolLoginForm.tsx`

Advanced login form with school-specific features:

- **School Email Validation**: Enforces @hasivu.edu email format
- **Automatic Role Detection**: Identifies user role from email patterns
- **Visual Role Indicators**: Shows detected role with appropriate icons and colors
- **Social Login Support**: Google and Microsoft authentication
- **Remember Me Functionality**: Persistent login sessions
- **Responsive Design**: Mobile-optimized interface

**Usage:**

```tsx
import { EnhancedSchoolLoginForm } from '@/components/auth';

<EnhancedSchoolLoginForm
  onSubmit={handleLogin}
  onSocialLogin={handleSocialLogin}
  showRememberMe={true}
  showSocialLogin={true}
/>;
```

### 📝 Multi-Step Registration Form

**File:** `MultiStepRegistrationForm.tsx`

Progressive registration process with validation at each step:

**Step 1: Personal Information**

- Basic details (name, email, role)
- Real-time role detection from email
- Role-specific form adaptation

**Step 2: School Information**

- School ID validation with real-time API checking
- Class/grade information for students
- Parent-student linking for guardians
- Department and employee ID for staff

**Step 3: Security Setup**

- Strong password requirements with complexity validation
- Profile picture upload
- Emergency contact information
- Terms and privacy policy acceptance

**Features:**

- Progress indicator with step navigation
- Form state preservation across steps
- Real-time validation feedback
- Accessible form structure

**Usage:**

```tsx
import { MultiStepRegistrationForm } from '@/components/auth';

<MultiStepRegistrationForm
  onSubmit={handleRegistration}
  onValidateSchoolId={validateSchoolId}
  onValidateParentLink={validateParentLink}
/>;
```

### 🔄 Enhanced Password Recovery

**File:** `EnhancedPasswordRecoveryForm.tsx`

Multiple recovery methods tailored for school environment:

**Email Recovery**

- School domain validation (@hasivu.edu)
- Role-aware recovery process
- Automatic role detection and appropriate messaging

**Security Questions**

- Pre-defined question bank
- Case-insensitive answer matching
- Student-specific security questions

**Parent Verification**

- SMS verification to registered parent phone
- Student account recovery through parent authentication
- Multi-step verification process

**Features:**

- Tabbed interface for different recovery methods
- Real-time email validation and role detection
- SMS integration for parent verification
- Comprehensive help and support links

### 🛡️ Multi-Factor Authentication

**File:** `MultiFactorAuthForm.tsx`

Comprehensive MFA system with multiple authentication methods:

**Verification Mode**

- SMS code verification with timer and resend functionality
- Authenticator app code input
- Emergency recovery code system
- Multiple method switching

**Setup Mode**

- SMS setup with phone verification
- Authenticator app setup with QR code generation
- Recovery code generation and secure display
- Method preference configuration

**Emergency Mode**

- Recovery code validation
- Alternative verification methods
- Account recovery assistance

**Features:**

- Dynamic QR code generation for authenticator apps
- Secure recovery code management
- Timer-based code resend functionality
- Comprehensive error handling and user guidance

### ⚙️ Profile Management Form

**File:** `ProfileManagementForm.tsx`

Comprehensive profile and preference management:

**Personal Information**

- Avatar upload with preview
- Contact information management
- Profile data validation

**Dietary Preferences**

- Comprehensive dietary restriction selection
- Allergen management with safety warnings
- Custom dietary notes
- Meal preference configuration (spice level, cuisine preferences)

**RFID Card Management**

- Multiple card linking support
- Real-time card validation
- Security PIN setup
- Card status management (active/inactive)

**Notification & Security Settings**

- Granular notification preferences
- Two-factor authentication toggle
- Session timeout configuration
- Login notification settings

**Features:**

- Tabbed interface for organized sections
- Real-time RFID card validation
- Comprehensive dietary management
- Security-focused design

## Validation Schemas

### Enhanced Schema System

**File:** `schemas.ts`

The validation system has been completely enhanced for school-specific requirements:

**School Email Validation**

- Enforces @hasivu.edu domain
- Role pattern detection
- Email format validation

**Multi-Step Registration Schemas**

- `registrationStep1Schema`: Basic information validation
- `registrationStep2Schema`: School information and linking
- `registrationStep3Schema`: Security and contact information

**Enhanced Security Schemas**

- Strong password requirements with complexity rules
- Security questions validation
- Parent verification schemas
- MFA setup and verification schemas

**Profile Management Schemas**

- Dietary restrictions and allergen validation
- RFID card format validation with security PIN
- Notification preference validation

**Utility Functions**

- `detectRoleFromEmail()`: Automatic role detection
- `validateSchoolEmail()`: Email domain validation
- Constants for dietary restrictions and allergens

## Key Features

### 🎯 Role Detection

Automatic user role identification based on email patterns:

- `student.{id}@hasivu.edu` → Student role
- `parent.{name}@hasivu.edu` → Parent role
- `admin.{name}@hasivu.edu` → Administrator role
- `kitchen.{name}@hasivu.edu` → Kitchen staff role
- `teacher.{name}@hasivu.edu` → Teacher role

### 🏫 School Integration

- School ID validation (HSV######)
- Parent-student account linking
- Department and employee ID management
- Emergency contact requirements

### 🔒 Security Features

- Multi-factor authentication with multiple methods
- Strong password requirements
- Security question system
- Recovery code management
- Session timeout configuration

### 🍽️ Dietary Management

- Comprehensive dietary restriction tracking
- Allergen management with safety warnings
- Meal preference configuration
- Custom dietary notes

### 💳 RFID Integration

- RFID card linking and validation
- Security PIN setup
- Multiple card management
- Card status tracking

### 📱 Mobile Optimization

- Responsive design for all screen sizes
- Touch-friendly interfaces
- Mobile-specific input types
- Optimized form layouts

## Demo Page

**File:** `auth-forms-demo.tsx`

A comprehensive demo page showcasing all authentication components:

- Interactive demonstrations of all forms
- Real-time validation examples
- Sample data and scenarios
- Feature explanations and use cases

**Access:** Navigate to `/auth-forms-demo` to see all components in action.

## Technical Stack

- **Framework**: Next.js with TypeScript
- **UI Library**: ShadCN/UI with Radix UI primitives
- **Form Management**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with custom HASIVU theme
- **Icons**: Lucide React icons
- **State Management**: React hooks with proper error handling

## Accessibility Features

- **Screen Reader Support**: Proper ARIA labels and roles
- **Keyboard Navigation**: Full keyboard accessibility
- **Focus Management**: Logical tab order and focus indicators
- **Error Announcements**: Live regions for dynamic error messages
- **High Contrast**: Proper color contrast ratios
- **Mobile Accessibility**: Touch target sizes and mobile screen reader support

## Security Considerations

- **Input Sanitization**: All inputs are properly validated and sanitized
- **Password Security**: Strong password requirements and secure handling
- **Session Management**: Proper session timeout and management
- **MFA Implementation**: Industry-standard MFA with backup codes
- **Data Validation**: Server-side validation mirroring client-side rules
- **RFID Security**: Secure card linking with PIN protection

## Integration Guidelines

### API Integration

All components are designed to work with async handlers:

```tsx
const handleLogin = async data => {
  try {
    const response = await authAPI.login(data);
    // Handle success
  } catch (error) {
    // Handle error
  }
};
```

### State Management

Components use controlled state patterns and can integrate with global state management:

```tsx
import { useAuthStore } from '@/store/auth';

const { login, isLoading, error } = useAuthStore();
```

### Error Handling

Consistent error handling across all components:

```tsx
<AuthComponent
  onSubmit={handleSubmit}
  isLoading={isLoading}
  error={error}
  success={successMessage}
/>
```

## Customization

### Theme Integration

Components use CSS custom properties that can be customized:

```css
:root {
  --primary-600: #your-color;
  --error-600: #your-error-color;
}
```

### Component Extension

All components accept `className` props for custom styling:

```tsx
<EnhancedSchoolLoginForm
  className="custom-login-form"
  // ... other props
/>
```

## Best Practices

1. **Always validate on both client and server side**
2. **Use proper loading states for better UX**
3. **Implement proper error handling and user feedback**
4. **Follow accessibility guidelines**
5. **Test with screen readers and keyboard navigation**
6. **Validate RFID cards and school IDs server-side**
7. **Implement proper session management**
8. **Use HTTPS for all authentication endpoints**

## Support

For questions or issues with these components:

- Review the demo page for usage examples
- Check the component documentation in each file
- Contact the development team
- Submit issues through the project repository

---

This authentication system provides a comprehensive, secure, and user-friendly experience specifically tailored for the HASIVU school platform's unique requirements.
