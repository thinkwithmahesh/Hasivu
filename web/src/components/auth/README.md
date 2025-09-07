# HASIVU Authentication Components

A comprehensive set of authentication UI components built with ShadCN/UI components, React Hook Form, and Zod validation. All components are responsive, accessible, and follow the HASIVU design system.

## 🚀 Features

- **Complete Authentication Flow**: Login, registration, password reset, email verification, and MFA
- **ShadCN/UI Components**: Built exclusively with ShadCN components for consistency
- **Form Validation**: Robust validation using Zod schemas and React Hook Form
- **Responsive Design**: Mobile-first approach that works on all devices
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and keyboard navigation
- **Social Authentication**: Google, Facebook, GitHub, and Apple login options
- **Route Protection**: Comprehensive role and permission-based access control
- **TypeScript**: Fully typed with comprehensive type definitions
- **HASIVU Brand Colors**: Integrated with the HASIVU color palette

## 📦 Components

### Form Components

#### `LoginForm`
Full-featured login form with email/password authentication, remember me option, and social login integration.

```tsx
import { LoginForm } from '@/components/auth'

<LoginForm
  onSubmit={handleLogin}
  onSocialLogin={handleSocialLogin}
  isLoading={false}
  error={null}
  showRememberMe={true}
  showSocialLogin={true}
/>
```

**Props:**
- `onSubmit`: Login handler function
- `onSocialLogin`: Social login handler (optional)
- `isLoading`: Loading state
- `error`: Error message to display
- `showRememberMe`: Show remember me checkbox
- `showSocialLogin`: Show social login buttons

#### `RegisterForm`
Comprehensive registration form with role selection, school ID, and terms acceptance.

```tsx
import { RegisterForm } from '@/components/auth'

<RegisterForm
  onSubmit={handleRegister}
  onSocialLogin={handleSocialLogin}
  availableRoles={['student', 'parent', 'teacher']}
  isLoading={false}
  error={null}
/>
```

**Props:**
- `onSubmit`: Registration handler function
- `onSocialLogin`: Social login handler (optional)
- `isLoading`: Loading state
- `error`: Error message to display
- `availableRoles`: Array of roles user can register as
- `showSocialLogin`: Show social login buttons

#### `ForgotPasswordForm` & `ResetPasswordForm`
Password reset flow with email sending and new password setting.

```tsx
import { ForgotPasswordForm, ResetPasswordForm } from '@/components/auth'

// Step 1: Request reset
<ForgotPasswordForm
  onSubmit={handleForgotPassword}
  isLoading={false}
  error={null}
  success={false}
/>

// Step 2: Reset password
<ResetPasswordForm
  onSubmit={handleResetPassword}
  token="reset-token"
  isLoading={false}
  error={null}
  success={false}
/>
```

#### `EmailVerificationForm`
Email verification with 6-digit code input, auto-submission, and resend functionality.

```tsx
import { EmailVerificationForm } from '@/components/auth'

<EmailVerificationForm
  onSubmit={handleVerification}
  onResendCode={handleResendCode}
  email="user@example.com"
  isLoading={false}
  isResending={false}
  error={null}
  success={false}
/>
```

#### `MfaForm` & `BackupCodeForm`
Multi-factor authentication with support for authenticator apps, SMS, and email codes.

```tsx
import { MfaForm, BackupCodeForm } from '@/components/auth'

// MFA with authenticator app
<MfaForm
  onSubmit={handleMfaVerification}
  method="authenticator"
  isLoading={false}
  error={null}
/>

// MFA with SMS
<MfaForm
  onSubmit={handleMfaVerification}
  method="sms"
  contact="+91 98765 43210"
  onResendCode={handleResendCode}
  isLoading={false}
  error={null}
/>

// Backup code form
<BackupCodeForm
  onSubmit={handleBackupCode}
  onBackToMfa={() => setShowBackup(false)}
  isLoading={false}
  error={null}
/>
```

### Social Authentication

#### `SocialLoginButtons`
Flexible social login component with multiple providers and layout options.

```tsx
import { SocialLoginButtons } from '@/components/auth'

<SocialLoginButtons
  onSocialLogin={handleSocialLogin}
  providers={['google', 'facebook', 'github', 'apple']}
  orientation="horizontal"
  showSeparator={true}
  separatorText="Or continue with"
  isLoading={false}
/>
```

**Supported Providers:**
- Google
- Facebook  
- GitHub
- Apple

### Layout Components

#### `AuthLayout`
Full-featured authentication layout with branding, features showcase, and testimonials.

```tsx
import { AuthLayout } from '@/components/auth'

<AuthLayout
  title="Welcome Back"
  subtitle="Sign in to continue"
  showBackButton={true}
  backButtonHref="/"
  showBranding={true}
  showFeatures={true}
>
  <LoginForm onSubmit={handleLogin} />
</AuthLayout>
```

#### `MinimalAuthLayout`
Simplified layout for basic authentication pages.

```tsx
import { MinimalAuthLayout } from '@/components/auth'

<MinimalAuthLayout
  title="Reset Password"
  subtitle="Enter your new password"
  showLogo={true}
>
  <ResetPasswordForm onSubmit={handleReset} />
</MinimalAuthLayout>
```

### Route Protection

#### `ProtectedRoute`
Comprehensive route protection with authentication, role, and permission checks.

```tsx
import { ProtectedRoute } from '@/components/auth'

<ProtectedRoute
  requireAuth={true}
  allowedRoles={['admin', 'school_admin']}
  requiredPermissions={['read_users', 'write_users']}
  requireEmailVerification={true}
  redirectTo="/auth/login"
>
  <AdminDashboard />
</ProtectedRoute>
```

#### `withAuth` HOC
Higher-order component for protecting pages.

```tsx
import { withAuth } from '@/components/auth'

const ProtectedPage = withAuth(DashboardPage, {
  allowedRoles: ['admin'],
  requireEmailVerification: true
})
```

#### Permission Hooks
Hooks for checking permissions within components.

```tsx
import { usePermissions } from '@/components/auth'

function MyComponent() {
  const { hasPermission, hasRole, user } = usePermissions()
  
  if (hasRole('admin')) {
    return <AdminPanel />
  }
  
  if (hasPermission('read_users')) {
    return <UsersList />
  }
  
  return <AccessDenied />
}
```

#### Conditional Rendering Components
Components for conditional rendering based on auth state.

```tsx
import { RequireAuth, RequireRole, RequirePermission } from '@/components/auth'

<RequireAuth fallback={<LoginPrompt />}>
  <AuthenticatedContent />
</RequireAuth>

<RequireRole roles={['admin', 'school_admin']} fallback={<Unauthorized />}>
  <AdminContent />
</RequireRole>

<RequirePermission permissions={['write_users']} fallback={<ReadOnly />}>
  <EditableUserForm />
</RequirePermission>
```

## 🎨 Design System Integration

All components use the HASIVU brand colors defined in the Tailwind configuration:

- **Primary**: Green color palette (`primary-50` to `primary-950`)
- **Secondary**: Purple color palette  
- **Success**: Green success states
- **Warning**: Orange warning states
- **Error**: Red error states
- **Info**: Blue info states

## 📱 Responsive Design

All components are built with a mobile-first approach:

- **Mobile**: Optimized for small screens with touch-friendly interactions
- **Tablet**: Adjusted layouts for medium screens
- **Desktop**: Full-featured layouts with enhanced UX

## ♿ Accessibility Features

- **WCAG 2.1 AA Compliance**: All components meet accessibility standards
- **Keyboard Navigation**: Full keyboard support with proper focus management
- **Screen Reader Support**: Comprehensive ARIA labels and descriptions
- **Color Contrast**: All text meets minimum contrast requirements
- **Form Validation**: Clear error messages and validation feedback

## 🔒 Security Features

- **Input Validation**: Client-side validation with Zod schemas
- **Password Security**: Strong password requirements and visibility toggles
- **CSRF Protection**: Form tokens and secure headers
- **Rate Limiting**: Built-in protection against brute force attacks
- **Secure Redirects**: Validated redirect URLs to prevent open redirects

## 📝 Form Validation

All forms use Zod schemas for validation:

```tsx
// Login validation
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().default(false)
})

// Registration validation with password confirmation
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  // ... other fields
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})
```

## 🚦 Usage Examples

### Complete Login Page
```tsx
import { LoginForm, AuthLayout } from '@/components/auth'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (data) => {
    setIsLoading(true)
    setError(null)
    
    try {
      await loginUser(data)
      router.push('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider) => {
    // Handle social login
  }

  return (
    <AuthLayout
      showFeatures={true}
      showBranding={true}
    >
      <LoginForm
        onSubmit={handleLogin}
        onSocialLogin={handleSocialLogin}
        isLoading={isLoading}
        error={error}
        showRememberMe={true}
        showSocialLogin={true}
      />
    </AuthLayout>
  )
}
```

### Protected Admin Dashboard
```tsx
import { ProtectedRoute } from '@/components/auth'
import { AdminDashboard } from '@/components/admin'

export default function AdminPage() {
  return (
    <ProtectedRoute
      requireAuth={true}
      allowedRoles={['admin', 'super_admin']}
      requiredPermissions={['admin_access']}
      requireEmailVerification={true}
      redirectTo="/auth/login"
    >
      <AdminDashboard />
    </ProtectedRoute>
  )
}
```

### Multi-Step Registration Flow
```tsx
import { useState } from 'react'
import { RegisterForm, EmailVerificationForm, AuthLayout } from '@/components/auth'

export default function RegisterPage() {
  const [step, setStep] = useState<'register' | 'verify'>('register')
  const [email, setEmail] = useState('')

  const handleRegister = async (data) => {
    await registerUser(data)
    setEmail(data.email)
    setStep('verify')
  }

  const handleVerification = async (data) => {
    await verifyEmail(data)
    router.push('/dashboard')
  }

  return (
    <AuthLayout>
      {step === 'register' ? (
        <RegisterForm
          onSubmit={handleRegister}
          availableRoles={['student', 'parent', 'teacher']}
        />
      ) : (
        <EmailVerificationForm
          onSubmit={handleVerification}
          email={email}
        />
      )}
    </AuthLayout>
  )
}
```

## 🔧 Customization

All components accept className props for custom styling:

```tsx
<LoginForm 
  className="max-w-sm mx-auto"
  onSubmit={handleLogin}
/>

<AuthLayout 
  className="bg-gradient-to-br from-primary-50 to-primary-100"
  showFeatures={false}
>
  <CustomForm />
</AuthLayout>
```

## 📚 API Reference

See the TypeScript definitions in each component file for detailed prop types and interfaces. All components are fully typed with comprehensive JSDoc comments.

## 🤝 Contributing

When adding new authentication components:

1. Follow the existing patterns and naming conventions
2. Use ShadCN/UI components exclusively
3. Implement proper TypeScript types
4. Add Zod validation schemas
5. Include accessibility attributes
6. Test on mobile and desktop
7. Update this README with examples