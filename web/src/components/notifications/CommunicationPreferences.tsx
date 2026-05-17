'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, MessageSquare, Smartphone, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommunicationPreferencesProps {
  userId?: string;
  className?: string;
}

interface ChannelPreference {
  id: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  description: string;
}

export const CommunicationPreferences: React.FC<CommunicationPreferencesProps> = ({
  userId,
  className,
}) => {
  const [preferences, setPreferences] = useState<ChannelPreference[]>([
    {
      id: 'email',
      channel: 'email',
      label: 'Email',
      icon: Mail,
      enabled: true,
      description: 'Receive updates via email',
    },
    {
      id: 'sms',
      channel: 'sms',
      label: 'SMS',
      icon: MessageSquare,
      enabled: false,
      description: 'Receive text messages',
    },
    {
      id: 'whatsapp',
      channel: 'whatsapp',
      label: 'WhatsApp',
      icon: Smartphone,
      enabled: false,
      description: 'Receive WhatsApp messages',
    },
    {
      id: 'push',
      channel: 'push',
      label: 'Push Notifications',
      icon: Bell,
      enabled: true,
      description: 'Receive push notifications',
    },
    {
      id: 'in_app',
      channel: 'in_app',
      label: 'In-App',
      icon: AlertCircle,
      enabled: true,
      description: 'In-app notifications',
    },
  ]);

  const [saving, setSaving] = useState(false);

  // Load preferences
  useEffect(() => {
    if (userId) {
      // In a real implementation, load from API
      // For now, using default preferences
    }
  }, [userId]);

  const handleToggle = (id: string) => {
    setPreferences(prev =>
      prev.map(pref => (pref.id === id ? { ...pref, enabled: !pref.enabled } : pref))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save preferences to API
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      <Card>
        <CardHeader>
          <CardTitle>Communication Preferences</CardTitle>
          <CardDescription>
            Choose how you want to receive notifications and updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {preferences.map(pref => {
            const Icon = pref.icon;
            return (
              <div
                key={pref.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor={pref.id} className="text-base font-medium">
                      {pref.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">{pref.description}</p>
                  </div>
                </div>
                <Switch
                  id={pref.id}
                  checked={pref.enabled}
                  onCheckedChange={() => handleToggle(pref.id)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};
