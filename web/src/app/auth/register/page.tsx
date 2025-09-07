"use client"

import { useState } from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthLayout } from '@/components/auth/AuthLayout'
import { useAuth } from '@/contexts/auth-context'
import type { RegistrationFormData } from '@/components/auth/schemas'

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register } = useAuth()

  const handleRegister = async (data: RegistrationFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const success = await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        grade: data.grade,
        section: data.section,
        role: 'parent', // Default role, can be adjusted based on email or selection
      })

      if (success) {
        // Redirect will be handled by the auth context
        console.log('Registration successful')
      } else {
        setError('Registration failed. Please check your information and try again.')
      }
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Join HASIVU Today"
      description="Create your account to start managing school meals efficiently"
    >
      <RegisterForm
        onSubmit={handleRegister}
        isLoading={isLoading}
        error={error}
        className="w-full max-w-md"
      />
    </AuthLayout>
  )
}