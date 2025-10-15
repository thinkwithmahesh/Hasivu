/**
 * HASIVU Platform - LoginForm Component Tests
 * Comprehensive tests for authentication form component
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent as _fireEvent,
  waitFor,
  act as _act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import { loginSchema } from '../schemas';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

describe('LoginForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnSocialLogin = jest.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onSocialLogin: mockOnSocialLogin,
    isLoading: false,
    error: null,
    showRememberMe: true,
    showSocialLogin: true,
    showRoleSelection: true,
    defaultRole: 'student' as const,
  };

  describe('Rendering', () => {
    test('should render login form with all role tabs', () => {
      render(<LoginForm {...defaultProps} />);

      // Check for role tabs
      expect(screen.getByRole('tab', { name: /student/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /parent/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /admin/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /kitchen/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /vendor/i })).toBeInTheDocument();
    });

    test('should render form fields', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    test('should render remember me checkbox when enabled', () => {
      render(<LoginForm {...defaultProps} showRememberMe={true} />);
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    test('should not render remember me when disabled', () => {
      render(<LoginForm {...defaultProps} showRememberMe={false} />);
      expect(screen.queryByLabelText(/remember me/i)).not.toBeInTheDocument();
    });

    test('should render social login buttons when enabled', () => {
      render(<LoginForm {...defaultProps} showSocialLogin={true} />);
      expect(screen.getByText(/continue with google/i)).toBeInTheDocument();
      expect(screen.getByText(/continue with facebook/i)).toBeInTheDocument();
    });

    test('should not render social login when disabled', () => {
      render(<LoginForm {...defaultProps} showSocialLogin={false} />);
      expect(screen.queryByText(/continue with google/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/continue with facebook/i)).not.toBeInTheDocument();
    });

    test('should hide role selection when disabled', () => {
      render(<LoginForm {...defaultProps} showRoleSelection={false} />);
      expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    });

    test('should show default role when role selection is hidden', () => {
      render(<LoginForm {...defaultProps} showRoleSelection={false} defaultRole="admin" />);
      // The form should still function with the default role
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    test('should toggle password visibility', async () => {
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      const toggleButton = screen.getByRole('button', { name: /toggle password visibility/i });

      // Initially password should be hidden
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click to show password
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click to hide password again
      await user.click(toggleButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should switch between roles', async () => {
      render(<LoginForm {...defaultProps} />);

      const parentTab = screen.getByRole('tab', { name: /parent/i });
      const adminTab = screen.getByRole('tab', { name: /admin/i });

      // Click parent tab
      await user.click(parentTab);
      expect(parentTab).toHaveAttribute('data-state', 'active');

      // Click admin tab
      await user.click(adminTab);
      expect(adminTab).toHaveAttribute('data-state', 'active');
    });

    test('should select default role on mount', () => {
      render(<LoginForm {...defaultProps} defaultRole="admin" />);

      const adminTab = screen.getByRole('tab', { name: /admin/i });
      expect(adminTab).toHaveAttribute('data-state', 'active');
    });

    test('should update role when defaultRole prop changes', () => {
      const { rerender } = render(<LoginForm {...defaultProps} defaultRole="student" />);

      expect(screen.getByRole('tab', { name: /student/i })).toHaveAttribute('data-state', 'active');

      // Change default role
      rerender(<LoginForm {...defaultProps} defaultRole="admin" />);
      expect(screen.getByRole('tab', { name: /admin/i })).toHaveAttribute('data-state', 'active');
    });
  });

  describe('Form Validation', () => {
    test('should show validation errors for empty fields', async () => {
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      // Should not call onSubmit with validation errors
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test('should show validation error for invalid email', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    test('should show validation error for short password', async () => {
      render(<LoginForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(passwordInput, '123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
      });
    });

    test('should clear validation errors when user starts typing', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Trigger validation error
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      // Start typing should clear error
      await user.type(emailInput, 'test@example.com');
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    test('should submit form with valid data', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@hasivu.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@hasivu.com',
          password: 'password123',
          rememberMe: false,
          role: 'student',
        });
      });
    });

    test('should submit with remember me checked', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const rememberMeCheckbox = screen.getByLabelText(/remember me/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@hasivu.com');
      await user.type(passwordInput, 'password123');
      await user.click(rememberMeCheckbox);
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'test@hasivu.com',
          password: 'password123',
          rememberMe: true,
          role: 'student',
        });
      });
    });

    test('should submit with selected role', async () => {
      render(<LoginForm {...defaultProps} />);

      const adminTab = screen.getByRole('tab', { name: /admin/i });
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.click(adminTab);
      await user.type(emailInput, 'admin@hasivu.com');
      await user.type(passwordInput, 'adminpass123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          email: 'admin@hasivu.com',
          password: 'adminpass123',
          rememberMe: false,
          role: 'admin',
        });
      });
    });

    test('should handle form submission errors', async () => {
      const errorMessage = 'Login failed';
      mockOnSubmit.mockRejectedValueOnce(new Error(errorMessage));

      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@hasivu.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Form should handle the error gracefully
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Loading State', () => {
    test('should disable form when loading', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /signing in/i });

      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    test('should show loading indicator in submit button', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      const submitButton = screen.getByRole('button', { name: /signing in/i });
      expect(submitButton).toContainElement(screen.getByTestId('loading-spinner'));
    });

    test('should disable social login buttons when loading', () => {
      render(<LoginForm {...defaultProps} isLoading={true} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      const facebookButton = screen.getByRole('button', { name: /continue with facebook/i });

      expect(googleButton).toBeDisabled();
      expect(facebookButton).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    test('should display error message', () => {
      const errorMessage = 'Invalid credentials';
      render(<LoginForm {...defaultProps} error={errorMessage} />);

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('should not display error when null', () => {
      render(<LoginForm {...defaultProps} error={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('should display different error types', () => {
      const errors = [
        'Network error',
        'Account locked',
        'Invalid email or password',
        'Server temporarily unavailable',
      ];

      errors.forEach(error => {
        const { rerender } = render(<LoginForm {...defaultProps} error={error} />);
        expect(screen.getByText(error)).toBeInTheDocument();
        rerender(<LoginForm {...defaultProps} error={null} />);
      });
    });
  });

  describe('Social Login', () => {
    test('should handle Google login', async () => {
      render(<LoginForm {...defaultProps} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      expect(mockOnSocialLogin).toHaveBeenCalledWith('google');
    });

    test('should handle Facebook login', async () => {
      render(<LoginForm {...defaultProps} />);

      const facebookButton = screen.getByRole('button', { name: /continue with facebook/i });
      await user.click(facebookButton);

      expect(mockOnSocialLogin).toHaveBeenCalledWith('facebook');
    });

    test('should handle social login errors', async () => {
      mockOnSocialLogin.mockRejectedValueOnce(new Error('Social login failed'));

      render(<LoginForm {...defaultProps} />);

      const googleButton = screen.getByRole('button', { name: /continue with google/i });
      await user.click(googleButton);

      expect(mockOnSocialLogin).toHaveBeenCalledWith('google');
    });
  });

  describe('Accessibility', () => {
    test('should have proper form labels', () => {
      render(<LoginForm {...defaultProps} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    test('should have proper ARIA attributes', () => {
      render(<LoginForm {...defaultProps} error="Test error" />);

      const form = screen.getByRole('form');
      const errorAlert = screen.getByRole('alert');

      expect(form).toBeInTheDocument();
      expect(errorAlert).toBeInTheDocument();
    });

    test('should support keyboard navigation', async () => {
      render(<LoginForm {...defaultProps} />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // Test tab navigation
      emailInput.focus();
      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/remember me/i)).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    test('should announce validation errors to screen readers', async () => {
      render(<LoginForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        const emailError = screen.getByText(/email is required/i);
        expect(emailError).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Form Schema Validation', () => {
    test('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.in', 'student123@school.edu'];

      const invalidEmails = ['invalid-email', '@domain.com', 'test@', 'test.domain.com'];

      validEmails.forEach(email => {
        const result = loginSchema.safeParse({ email, password: 'password123' });
        expect(result.success).toBe(true);
      });

      invalidEmails.forEach(email => {
        const result = loginSchema.safeParse({ email, password: 'password123' });
        expect(result.success).toBe(false);
      });
    });

    test('should validate password requirements', () => {
      const validPasswords = ['password123', 'mySecurePass', 'Test123!@#'];

      const invalidPasswords = ['123', 'short', ''];

      validPasswords.forEach(password => {
        const result = loginSchema.safeParse({ email: 'test@example.com', password });
        expect(result.success).toBe(true);
      });

      invalidPasswords.forEach(password => {
        const result = loginSchema.safeParse({ email: 'test@example.com', password });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Component Styling', () => {
    test('should apply custom className', () => {
      const customClass = 'custom-login-form';
      render(<LoginForm {...defaultProps} className={customClass} />);

      const formContainer = screen.getByRole('form').closest('div');
      expect(formContainer).toHaveClass(customClass);
    });

    test('should display role-specific colors and icons', () => {
      render(<LoginForm {...defaultProps} />);

      const studentTab = screen.getByRole('tab', { name: /student/i });
      const parentTab = screen.getByRole('tab', { name: /parent/i });
      const adminTab = screen.getByRole('tab', { name: /admin/i });

      expect(studentTab).toBeInTheDocument();
      expect(parentTab).toBeInTheDocument();
      expect(adminTab).toBeInTheDocument();
    });
  });
});
