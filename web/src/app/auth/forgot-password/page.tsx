"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/contexts/auth-context'
import type { ForgotPasswordFormData } from '@/components/auth/schemas'

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { forgotPassword } = useAuth()
  const router = useRouter()

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await forgotPassword(data.email)

      if (result) {
        setSuccess(true)
      } else {
        setError('Failed to send password reset instructions. Please try again.')
      }
    } catch (err: any) {
      console.error('Forgot password error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout
        title="Check Your Email"
        description="We've sent password reset instructions to your email address"
      >
        <div className="w-full max-w-md text-center">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-green-700 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Reset Instructions Sent
            </h3>
            <p className="text-green-700 mb-4">
              If an account with this email exists, we've sent you a password reset link.
            </p>
            <button
              onClick={() => router.push('/auth/login')}
              className="text-primary-600 hover:text-primary-500 font-medium"
            >
              Return to Login
            </button>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Forgot Your Password?"
      description="Enter your email address and we'll send you a reset link"
    >
      <ForgotPasswordForm
        onSubmit={handleForgotPassword}
        isLoading={isLoading}
        error={error}
        className="w-full max-w-md"
      />
    </AuthLayout>
  )
}