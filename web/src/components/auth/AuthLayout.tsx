"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Shield, Users, Zap, Globe } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBackButton?: boolean
  backButtonText?: string
  backButtonHref?: string
  showBranding?: boolean
  showFeatures?: boolean
  backgroundImage?: string
  className?: string
}

const features = [
  {
    icon: Shield,
    title: "Secure & Safe",
    description: "Bank-level security with end-to-end encryption"
  },
  {
    icon: Users,
    title: "Trusted by Schools",
    description: "Over 1000+ schools trust HASIVU platform"
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Quick ordering and instant notifications"
  },
  {
    icon: Globe,
    title: "Always Available",
    description: "24/7 support and 99.9% uptime guarantee"
  }
]

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "School Administrator",
    school: "Greenwood High School",
    content: "HASIVU has transformed how we manage school meals. The platform is intuitive and our parents love it!",
    avatar: "SJ"
  },
  {
    name: "Raj Patel",
    role: "Parent",
    school: "Delhi Public School",
    content: "Ordering meals for my kids has never been easier. I can track nutrition and payments all in one place.",
    avatar: "RP"
  }
]

export function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton = false,
  backButtonText = "Back",
  backButtonHref = "/",
  showBranding = true,
  showFeatures = true,
  backgroundImage,
  className
}: AuthLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50", className)}>
      {/* Background Image/Pattern */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      
      {/* Header */}
      {(showBackButton || showBranding) && (
        <header className="relative z-10 flex items-center justify-between p-4 lg:p-6">
          {showBackButton ? (
            <Link href={backButtonHref}>
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backButtonText}
              </Button>
            </Link>
          ) : (
            <div />
          )}
          
          {showBranding && (
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HASIVU</span>
            </Link>
          )}
        </header>
      )}

      <div className="relative z-10 flex flex-col lg:flex-row min-h-screen">
        {/* Left Side - Features/Branding */}
        {showFeatures && (
          <div className="hidden lg:flex lg:w-1/2 bg-primary-600 text-white p-8 lg:p-12 flex-col justify-center">
            <div className="max-w-md mx-auto">
              {/* Logo and Title */}
              <div className="mb-8">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">H</span>
                  </div>
                  <h1 className="text-3xl font-bold">HASIVU</h1>
                </div>
                <p className="text-primary-100 text-lg">
                  Revolutionizing school meal management with smart technology and seamless experiences.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-6 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-primary-100 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div className="bg-white/10 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {testimonials[0].avatar}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{testimonials[0].name}</p>
                    <p className="text-primary-100 text-sm">
                      {testimonials[0].role}, {testimonials[0].school}
                    </p>
                  </div>
                </div>
                <p className="text-primary-100 text-sm italic">
                  "{testimonials[0].content}"
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">1000+</div>
                  <div className="text-primary-100 text-sm">Schools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-primary-100 text-sm">Students</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">99.9%</div>
                  <div className="text-primary-100 text-sm">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Auth Form */}
        <div className={cn(
          "flex-1 flex items-center justify-center p-4 lg:p-8",
          showFeatures ? "lg:w-1/2" : "w-full"
        )}>
          <div className="w-full max-w-md">
            {/* Mobile Branding */}
            {showBranding && (
              <div className="lg:hidden text-center mb-8">
                <Link href="/" className="inline-flex items-center space-x-2">
                  <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">H</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">HASIVU</span>
                </Link>
                {title && (
                  <div className="mt-4">
                    <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                    {subtitle && (
                      <p className="text-gray-600 mt-2">{subtitle}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth Form */}
            <div className="w-full">
              {children}
            </div>

            {/* Mobile Features */}
            {showFeatures && (
              <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
                {features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <feature.icon className="w-4 h-4 text-primary-600" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-4 px-4 lg:px-6 bg-white border-t border-gray-200">
        <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <Link href="/legal/privacy" className="hover:text-gray-900">
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="hover:text-gray-900">
              Terms of Service
            </Link>
            <Link href="/support" className="hover:text-gray-900">
              Support
            </Link>
          </div>
          <div className="flex items-center space-x-1">
            <span>© 2024 HASIVU. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Minimal Auth Layout for simple auth pages
interface MinimalAuthLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showLogo?: boolean
  className?: string
}

export function MinimalAuthLayout({
  children,
  title,
  subtitle,
  showLogo = true,
  className
}: MinimalAuthLayoutProps) {
  return (
    <div className={cn("min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", className)}>
      <div className="max-w-md w-full space-y-8">
        {showLogo && (
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-2xl">H</span>
              </div>
              <span className="text-3xl font-bold text-gray-900">HASIVU</span>
            </Link>
            {title && (
              <div className="mt-6">
                <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
                {subtitle && (
                  <p className="mt-2 text-gray-600">{subtitle}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  )
}