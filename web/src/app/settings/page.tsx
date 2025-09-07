"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Settings, Shield, Bell, Database, Globe, Palette, Zap } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'integrations'>('general');

  const [settings, setSettings] = useState({
    // General Settings
    schoolName: 'Bangalore International School',
    schoolCode: 'BIS-2024',
    timezone: 'Asia/Kolkata',
    language: 'English',
    currency: 'INR',
    
    // Security Settings
    twoFactorAuth: true,
    sessionTimeout: false,
    ipWhitelist: false,
    auditLogging: true,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderAlerts: true,
    inventoryAlerts: true,
    
    // Integration Settings
    razorpayEnabled: true,
    rfidEnabled: false,
    analyticsEnabled: true,
    backupEnabled: true
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const settingsTabs = [
    { key: 'general', label: 'General', icon: Settings },
    { key: 'security', label: 'Security', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'integrations', label: 'Integrations', icon: Zap }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xl">H</span>
                </div>
                <div>
                  <div className="font-display font-bold text-2xl text-primary-600">Settings</div>
                  <div className="text-sm text-gray-600 -mt-1">HASIVU Platform</div>
                </div>
              </div>
            </div>
            <Button>
              <Database className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure platform settings, integrations, and system preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="lg:w-1/4">
            <Card className="border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle>Settings Categories</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {settingsTabs.map((tab) => {
                    const IconComponent = tab.icon;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                          activeTab === tab.key
                            ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-500'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:w-3/4">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Globe className="h-5 w-5 mr-2" />
                      School Information
                    </CardTitle>
                    <CardDescription>Basic school and platform configuration</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Name</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {settings.schoolName}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">School Code</label>
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {settings.schoolCode}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                          {settings.timezone}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
                        <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                          Indian Rupee ({settings.currency})
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Palette className="h-5 w-5 mr-2" />
                      Platform Preferences
                    </CardTitle>
                    <CardDescription>Customize platform appearance and behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Dark Mode</p>
                        <p className="text-sm text-gray-600">Enable dark theme for the platform</p>
                      </div>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Compact Layout</p>
                        <p className="text-sm text-gray-600">Use smaller spacing and components</p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Authentication & Security
                    </CardTitle>
                    <CardDescription>Configure security settings and access controls</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-600">Require 2FA for admin accounts</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.twoFactorAuth}
                          onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                        />
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Enabled</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Session Timeout</p>
                        <p className="text-sm text-gray-600">Auto-logout after 30 minutes of inactivity</p>
                      </div>
                      <Switch 
                        checked={settings.sessionTimeout}
                        onCheckedChange={(checked) => handleSettingChange('sessionTimeout', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">IP Whitelist</p>
                        <p className="text-sm text-gray-600">Restrict access to specific IP addresses</p>
                      </div>
                      <Switch 
                        checked={settings.ipWhitelist}
                        onCheckedChange={(checked) => handleSettingChange('ipWhitelist', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Audit Logging</p>
                        <p className="text-sm text-gray-600">Log all user actions for security audit</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.auditLogging}
                          onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
                        />
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="h-5 w-5 mr-2" />
                      Notification Preferences
                    </CardTitle>
                    <CardDescription>Configure how and when you receive notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-600">Receive updates via email</p>
                      </div>
                      <Switch 
                        checked={settings.emailNotifications}
                        onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">SMS Notifications</p>
                        <p className="text-sm text-gray-600">Receive critical alerts via SMS</p>
                      </div>
                      <Switch 
                        checked={settings.smsNotifications}
                        onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-600">Browser push notifications</p>
                      </div>
                      <Switch 
                        checked={settings.pushNotifications}
                        onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order Alerts</p>
                        <p className="text-sm text-gray-600">Notifications for new orders and updates</p>
                      </div>
                      <Switch 
                        checked={settings.orderAlerts}
                        onCheckedChange={(checked) => handleSettingChange('orderAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Inventory Alerts</p>
                        <p className="text-sm text-gray-600">Low stock and inventory warnings</p>
                      </div>
                      <Switch 
                        checked={settings.inventoryAlerts}
                        onCheckedChange={(checked) => handleSettingChange('inventoryAlerts', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Third-Party Integrations
                    </CardTitle>
                    <CardDescription>Manage external service connections</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Razorpay Payment Gateway</p>
                        <p className="text-sm text-gray-600">Process online payments securely</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.razorpayEnabled}
                          onCheckedChange={(checked) => handleSettingChange('razorpayEnabled', checked)}
                        />
                        <Badge variant="secondary" className="bg-green-100 text-green-700">Connected</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">RFID System</p>
                        <p className="text-sm text-gray-600">Enable contactless meal pickup</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.rfidEnabled}
                          onCheckedChange={(checked) => handleSettingChange('rfidEnabled', checked)}
                        />
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Setup Pending</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Analytics & Tracking</p>
                        <p className="text-sm text-gray-600">Google Analytics integration</p>
                      </div>
                      <Switch 
                        checked={settings.analyticsEnabled}
                        onCheckedChange={(checked) => handleSettingChange('analyticsEnabled', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Automated Backups</p>
                        <p className="text-sm text-gray-600">Daily database backups to cloud storage</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={settings.backupEnabled}
                          onCheckedChange={(checked) => handleSettingChange('backupEnabled', checked)}
                        />
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle>Available Integrations</CardTitle>
                    <CardDescription>Connect additional services to enhance functionality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <h4 className="font-medium">WhatsApp Business</h4>
                        <p className="text-sm text-gray-600 mt-1">Send order updates via WhatsApp</p>
                        <Badge variant="outline" className="mt-2">Coming Soon</Badge>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <h4 className="font-medium">Paytm Integration</h4>
                        <p className="text-sm text-gray-600 mt-1">Alternative payment gateway</p>
                        <Badge variant="outline" className="mt-2">Available</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}