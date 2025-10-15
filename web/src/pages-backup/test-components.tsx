/**
 * Test page for Tailwind CSS and ShadCN/UI components
 * This page demonstrates the basic components are working correctly
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestComponentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient-primary">HASIVU Components Test</h1>
          <p className="mt-2 text-lg text-gray-600">
            Testing Tailwind CSS and ShadCN/UI integration
          </p>
        </div>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Button Components</CardTitle>
            <CardDescription>Different button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button>Default</Button>
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="xl">Extra Large</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Components */}
        <Card>
          <CardHeader>
            <CardTitle>Form Components</CardTitle>
            <CardDescription>Input fields and labels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="w-full"
                  />
                </div>
              </div>

              <Button className="w-full md:w-auto">Submit Form</Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Variants */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="text-primary-600">Standard Card</CardTitle>
              <CardDescription>A basic card with hover effect</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                This card demonstrates the standard styling with soft shadows and rounded corners.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover border-primary-200">
            <CardHeader>
              <CardTitle className="text-success-600">Success Card</CardTitle>
              <CardDescription>Card with success theme colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <span className="badge-success">Active</span>
                <p className="text-gray-600">
                  This card uses success theme colors for positive actions.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-warning-200">
            <CardHeader>
              <CardTitle className="text-warning-600">Warning Card</CardTitle>
              <CardDescription>Card with warning theme colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <span className="badge-warning">Pending</span>
                <p className="text-gray-600">
                  This card uses warning colors for cautionary content.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Utility Classes Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Utility Classes</CardTitle>
            <CardDescription>Custom Tailwind utilities and animations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Text Gradients</h3>
                <p className="text-gradient-primary text-xl font-bold">Primary Gradient Text</p>
                <p className="text-gradient-accent text-xl font-bold">Accent Gradient Text</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Status Badges</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="badge-success">Success</span>
                  <span className="badge-warning">Warning</span>
                  <span className="badge-error">Error</span>
                  <span className="badge-info">Info</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Animations</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="p-4 bg-primary-100 rounded-lg animate-fade-in">Fade In</div>
                  <div className="p-4 bg-success-100 rounded-lg animate-slide-up">Slide Up</div>
                  <div className="p-4 bg-warning-100 rounded-lg animate-scale-in">Scale In</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Responsive Design */}
        <Card>
          <CardHeader>
            <CardTitle>Responsive Design</CardTitle>
            <CardDescription>Responsive text and layout examples</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-responsive-xs">Extra small responsive text</p>
              <p className="text-responsive-sm">Small responsive text</p>
              <p className="text-responsive-base">Base responsive text</p>
              <p className="text-responsive-lg">Large responsive text</p>
              <p className="text-responsive-xl">Extra large responsive text</p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-gray-500">
            ✅ Tailwind CSS and ShadCN/UI components are working correctly!
          </p>
        </div>
      </div>
    </div>
  );
}
