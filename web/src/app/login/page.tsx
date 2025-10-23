'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OptimizedBackground } from '@/components/ui/optimized-background';
import { authApiService } from '@/services/auth-api.service';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApiService.login({
        email: email.trim(),
        password: password.trim(),
      });

      if (response.success && response.user) {
        // Redirect to dashboard based on user role
        const roleRoutes = {
          admin: '/admin',
          parent: '/dashboard',
          student: '/dashboard',
          kitchen: '/kitchen',
          vendor: '/vendor',
        };

        const route = roleRoutes[response.user.role as keyof typeof roleRoutes] || '/dashboard';
        router.push(route);
      } else {
        setError(response.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OptimizedBackground
      variant="gradient"
      className="min-h-screen flex items-center justify-center px-4"
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold grid place-items-center shadow-lg">
              H
            </div>
            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                HASIVU
              </div>
              <div className="text-xs text-ink-500 -mt-1">School Meals Done Right</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-ink-900 mb-2">Welcome back!</h1>
          <p className="text-ink-600">Sign in to your account to continue</p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle id="login-form-title" className="text-xl font-semibold text-center">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              role="form"
              aria-labelledby="login-form-title"
            >
              {error && (
                <Alert className="border-red-200 bg-red-50" role="alert" aria-live="assertive">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-ink-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.parent@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    aria-describedby="email-help"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-ink-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    aria-describedby="password-help"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                    aria-describedby="remember-help"
                  />
                  <Label htmlFor="remember" className="text-sm text-ink-600">
                    Remember me
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-ink-500">New to HASIVU?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  href="/register"
                  className="w-full flex justify-center py-3 px-4 border border-slate-300 rounded-xl shadow-sm bg-white text-sm font-medium text-ink-700 hover:bg-slate-50 transition-colors"
                >
                  Create an account
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-xs text-ink-500">
          <p>
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </OptimizedBackground>
  );
}
