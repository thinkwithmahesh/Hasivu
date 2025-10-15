import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building,
  Phone,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { hasivuApiService } from '../services/hasivu-api.service';
import { toast } from 'react-hot-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot-password';
  onAuthSuccess?: (user: any) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'verify-email' | 'reset-password';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  schoolName: string;
  phoneNumber: string;
  role: 'admin' | 'food_director' | 'staff';
  verificationCode: string;
  newPassword: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    schoolName: '',
    phoneNumber: '',
    role: 'admin',
    verificationCode: '',
    newPassword: '',
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        schoolName: '',
        phoneNumber: '',
        role: 'admin',
        verificationCode: '',
        newPassword: '',
      });
      setErrors({});
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation for login and signup
    if ((mode === 'login' || mode === 'signup') && !formData.password) {
      newErrors.password = 'Password is required';
    }

    if (mode === 'signup') {
      if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }

      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }

      if (!formData.schoolName.trim()) {
        newErrors.schoolName = 'School name is required';
      }

      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      }
    }

    if (mode === 'verify-email' && !formData.verificationCode) {
      newErrors.verificationCode = 'Verification code is required';
    }

    if (mode === 'reset-password') {
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }

      if (!formData.verificationCode) {
        newErrors.verificationCode = 'Verification code is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await hasivuApiService.login({
        email: formData.email,
        password: formData.password,
      });

      toast.success('Login successful!');
      onAuthSuccess?.(response.data);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);

      if (message.includes('verify')) {
        setMode('verify-email');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await hasivuApiService.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        schoolName: formData.schoolName,
        phoneNumber: formData.phoneNumber,
        role: formData.role,
      });

      toast.success('Account created! Please check your email for verification.');
      setMode('verify-email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await hasivuApiService.forgotPassword(formData.email);
      toast.success('Password reset code sent to your email!');
      setMode('reset-password');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset code.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await hasivuApiService.verifyEmail(
        formData.email,
        formData.verificationCode
      );
      toast.success('Email verified successfully!');
      onAuthSuccess?.(response.data);
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Verification failed.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await hasivuApiService.resetPassword(
        formData.email,
        formData.verificationCode,
        formData.newPassword
      );
      toast.success('Password reset successful!');
      setMode('login');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Password reset failed.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    switch (mode) {
      case 'login':
        await handleLogin();
        break;
      case 'signup':
        await handleSignup();
        break;
      case 'forgot-password':
        await handleForgotPassword();
        break;
      case 'verify-email':
        await handleVerifyEmail();
        break;
      case 'reset-password':
        await handleResetPassword();
        break;
    }
  };

  const renderInput = (
    field: keyof FormData,
    label: string,
    type: string = 'text',
    icon?: React.ReactNode,
    placeholder?: string
  ) => (
    <div className="space-y-2">
      <label htmlFor={field} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="text-gray-400">{icon}</div>
          </div>
        )}
        <input
          type={type}
          id={field}
          value={formData[field]}
          onChange={e => handleInputChange(field, e.target.value)}
          className={`w-full ${icon ? 'pl-10' : 'pl-3'} pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors[field] ? 'border-red-500' : ''
          }`}
          placeholder={placeholder || label}
          disabled={isLoading}
        />
        {errors[field] && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
      {errors[field] && <p className="text-sm text-red-600">{errors[field]}</p>}
    </div>
  );

  const renderPasswordInput = (
    field: keyof FormData,
    label: string,
    showPasswordState: boolean,
    setShowPasswordState: (show: boolean) => void
  ) => (
    <div className="space-y-2">
      <label htmlFor={field} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type={showPasswordState ? 'text' : 'password'}
          id={field}
          value={formData[field]}
          onChange={e => handleInputChange(field, e.target.value)}
          className={`w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            errors[field] ? 'border-red-500' : ''
          }`}
          placeholder={label}
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => setShowPasswordState(!showPasswordState)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          {showPasswordState ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        {errors[field] && (
          <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
        )}
      </div>
      {errors[field] && <p className="text-sm text-red-600">{errors[field]}</p>}
    </div>
  );

  const getTitle = () => {
    switch (mode) {
      case 'login':
        return 'Welcome Back';
      case 'signup':
        return 'Create Your Account';
      case 'forgot-password':
        return 'Reset Password';
      case 'verify-email':
        return 'Verify Your Email';
      case 'reset-password':
        return 'Set New Password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return 'Sign in to your HASIVU account';
      case 'signup':
        return 'Join thousands of schools using HASIVU';
      case 'forgot-password':
        return 'Enter your email to receive a reset code';
      case 'verify-email':
        return 'Enter the verification code sent to your email';
      case 'reset-password':
        return 'Enter your reset code and new password';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 pb-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
              <p className="text-gray-600">{getSubtitle()}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
            {/* Login Form */}
            {mode === 'login' && (
              <>
                {renderInput('email', 'Email Address', 'email', <Mail className="w-5 h-5" />)}
                {renderPasswordInput('password', 'Password', showPassword, setShowPassword)}

                <button
                  type="button"
                  onClick={() => setMode('forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </>
            )}

            {/* Signup Form */}
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  {renderInput('firstName', 'First Name', 'text', <User className="w-5 h-5" />)}
                  {renderInput('lastName', 'Last Name', 'text', <User className="w-5 h-5" />)}
                </div>

                {renderInput('email', 'Email Address', 'email', <Mail className="w-5 h-5" />)}
                {renderInput('schoolName', 'School Name', 'text', <Building className="w-5 h-5" />)}
                {renderInput('phoneNumber', 'Phone Number', 'tel', <Phone className="w-5 h-5" />)}

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => handleInputChange('role', e.target.value as any)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="admin">School Administrator</option>
                    <option value="food_director">Food Service Director</option>
                    <option value="staff">Staff Member</option>
                  </select>
                </div>

                {renderPasswordInput('password', 'Password', showPassword, setShowPassword)}
                {renderPasswordInput(
                  'confirmPassword',
                  'Confirm Password',
                  showConfirmPassword,
                  setShowConfirmPassword
                )}
              </>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot-password' && (
              <>{renderInput('email', 'Email Address', 'email', <Mail className="w-5 h-5" />)}</>
            )}

            {/* Email Verification Form */}
            {mode === 'verify-email' && (
              <>
                <div className="text-center p-4 bg-blue-50 rounded-lg mb-4">
                  <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-blue-800">
                    We've sent a verification code to <strong>{formData.email}</strong>
                  </p>
                </div>
                {renderInput(
                  'verificationCode',
                  'Verification Code',
                  'text',
                  <Lock className="w-5 h-5" />,
                  '6-digit code'
                )}
              </>
            )}

            {/* Reset Password Form */}
            {mode === 'reset-password' && (
              <>
                {renderInput(
                  'verificationCode',
                  'Reset Code',
                  'text',
                  <Lock className="w-5 h-5" />,
                  '6-digit code'
                )}
                {renderPasswordInput('newPassword', 'New Password', showPassword, setShowPassword)}
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login'
                      ? 'Sign In'
                      : mode === 'signup'
                        ? 'Create Account'
                        : mode === 'forgot-password'
                          ? 'Send Reset Code'
                          : mode === 'verify-email'
                            ? 'Verify Email'
                            : 'Reset Password'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Mode Switching */}
            <div className="text-center pt-4 border-t border-gray-200">
              {mode === 'login' && (
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    disabled={isLoading}
                  >
                    Sign up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              )}

              {(mode === 'forgot-password' || mode === 'reset-password') && (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                  disabled={isLoading}
                >
                  ← Back to Sign In
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AuthModal;
