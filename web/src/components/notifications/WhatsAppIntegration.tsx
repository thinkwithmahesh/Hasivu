/**
 * HASIVU Platform - WhatsApp Business API Integration Component
 * Epic 6: Notifications & Communication System - Story 6.2
 *
 * WhatsApp Business API integration with message templates,
 * interactive messaging, and delivery tracking
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Users,
  BarChart3,
  Settings,
  RefreshCw,
  AlertTriangle,
  Check,
  Eye,
  Download,
  Upload,
  Zap,
  Lock,
} from 'lucide-react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { _FEATURE_FLAGS } from '@/types/feature-flags';
import { cn } from '@/lib/utils';

interface WhatsAppIntegrationProps {
  className?: string;
}

interface WhatsAppStatus {
  connected: boolean;
  phoneNumber: string;
  businessName: string;
  qualityRating: 'green' | 'yellow' | 'red' | 'unknown';
  messageLimit: number;
  messagesSent: number;
  lastActivity: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  category: 'marketing' | 'utility' | 'authentication';
  language: string;
  status: 'approved' | 'pending' | 'rejected';
  content: string;
  variables: string[];
  createdAt: string;
}

interface MessageLog {
  id: string;
  recipient: string;
  templateId?: string;
  content: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  error?: string;
}

const QUALITYCOLORS = {
  green: 'text-green-600 bg-green-50',
  yellow: 'text-yellow-600 bg-yellow-50',
  red: 'text-red-600 bg-red-50',
  unknown: 'text-gray-600 bg-gray-50',
};

const STATUSICONS = {
  sent: <Clock className="h-4 w-4 text-[var(--hasivu-primary)]" />,
  delivered: <CheckCircle className="h-4 w-4 text-green-600" />,
  read: <Eye className="h-4 w-4 text-purple-600" />,
  failed: <XCircle className="h-4 w-4 text-red-600" />,
};

function safeParseTemplateVariables(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }
}

import { useWhatsAppMessages, useWhatsAppMutations } from '@/hooks/useApiIntegration';
import { useToast } from '@/hooks/use-toast';
import { whatsappApi } from '@/services/api';

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ className }) => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const [messageData, setMessageData] = useState({
    recipientUserId: '',
    templateId: '',
    variables: {} as Record<string, string>,
  });

  const { toast } = useToast();
  const whatsappEnabled = useFeatureFlag(_FEATURE_FLAGS.WHATSAPP_NOTIFICATIONS);

  // Real data hooks
  const { data: realMessages, loading: messagesLoading, refetch } = useWhatsAppMessages();
  const { triggerTemplate, loading: sending } = useWhatsAppMutations();
  const loading = messagesLoading || sending;

  const loadWhatsAppData = useCallback(() => {
    refetch?.();
  }, [refetch]);

  const messageLogs: MessageLog[] = (realMessages || []).map((msg: any) => ({
    id: msg.id || `msg_${Math.random()}`,
    recipient: msg.recipientPhone || msg.userId || 'Unknown',
    templateId: msg.templateId || 'Unknown',
    content: msg.content || 'Template Message',
    status: msg.status || 'sent',
    sentAt: msg.createdAt || new Date().toISOString(),
    deliveredAt: msg.deliveredAt,
    readAt: msg.readAt,
  }));

  useEffect(() => {
    let active = true;
    const loadConfiguration = async () => {
      try {
        const [statusResponse, templateResponse] = await Promise.all([
          whatsappApi.getStatus(),
          whatsappApi.getTemplates(),
        ]);

        if (!active) return;

        const apiStatus = statusResponse.data;
        setStatus({
          connected: Boolean(apiStatus?.connected),
          phoneNumber: apiStatus?.phoneNumber || 'Not configured',
          businessName: apiStatus?.businessName || 'HASIVU Platform',
          qualityRating: apiStatus?.qualityRating || 'unknown',
          messageLimit: Number(apiStatus?.messageLimit || 0),
          messagesSent: Number(apiStatus?.messagesSent || 0),
          lastActivity: apiStatus?.lastActivity || 'No activity yet',
        });

        const apiTemplates = Array.isArray(templateResponse.data) ? templateResponse.data : [];
        setTemplates(
          apiTemplates.map((template: any) => ({
            id: template.id,
            name: template.eventType,
            category: template.category || 'utility',
            language: template.language || 'en',
            status: template.status || 'pending',
            content: template.templateName,
            variables: safeParseTemplateVariables(template.variables),
            createdAt: template.createdAt || new Date().toISOString(),
          }))
        );
      } catch {
        if (!active) return;
        setStatus({
          connected: false,
          phoneNumber: 'Unavailable',
          businessName: 'HASIVU Platform',
          qualityRating: 'unknown',
          messageLimit: 0,
          messagesSent: 0,
          lastActivity: 'Unavailable',
        });
        setTemplates([]);
      }
    };

    loadConfiguration();
    return () => {
      active = false;
    };
  }, []);

  const sendMessage = async () => {
    if (!messageData.recipientUserId || !messageData.templateId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      await triggerTemplate(
        messageData.templateId,
        messageData.recipientUserId,
        messageData.variables,
        true
      );

      toast({ title: 'Message Sent', description: 'WhatsApp message triggered successfully.' });

      setMessageData({
        recipientUserId: '',
        templateId: '',
        variables: {},
      });
      setShowSendDialog(false);

      // Refresh messages
      refetch?.();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send WhatsApp message',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      sent: 'secondary',
      delivered: 'default',
      read: 'default',
      failed: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
    );
  };

  // Show fallback when WhatsApp notifications are disabled
  if (!whatsappEnabled) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">WhatsApp Notifications</h3>
            <p className="text-gray-600 mb-4">
              WhatsApp notifications are currently disabled. This feature is being rolled out
              gradually.
            </p>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                WhatsApp notifications will be available soon. You can still use email and SMS
                notifications.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={cn('w-full', className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* WhatsApp Status */}
      {status && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <CardTitle>WhatsApp Business API</CardTitle>
                <Badge variant={status.connected ? 'default' : 'destructive'}>
                  {status.connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={loadWhatsAppData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{status.phoneNumber}</div>
                <p className="text-sm text-gray-600">Business Number</p>
              </div>

              <div className="text-center">
                <div
                  className={cn(
                    'text-2xl font-bold capitalize',
                    QUALITYCOLORS[status.qualityRating]
                  )}
                >
                  {status.qualityRating}
                </div>
                <p className="text-sm text-gray-600">Quality Rating</p>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold">
                  {status.messagesSent} / {status.messageLimit}
                </div>
                <p className="text-sm text-gray-600">Messages Used</p>
              </div>

              <div className="text-center">
                <div className="text-lg font-semibold">
                  {new Date(status.lastActivity).toLocaleDateString()}
                </div>
                <p className="text-sm text-gray-600">Last Activity</p>
              </div>
            </div>

            {status.qualityRating !== 'green' && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your WhatsApp quality rating is {status.qualityRating}. Maintain high engagement
                  to improve your rating.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Message Templates</TabsTrigger>
          <TabsTrigger value="messages">Message Logs</TabsTrigger>
          <TabsTrigger value="send">Send Message</TabsTrigger>
        </TabsList>

        {/* Message Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Approved Templates</CardTitle>
                  <CardDescription>
                    WhatsApp message templates for different use cases
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Template
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {templates.map(template => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-gray-600 capitalize">
                          {template.category} • {template.language}
                        </p>
                      </div>
                      {getStatusBadge(template.status)}
                    </div>

                    <p className="text-sm bg-gray-50 p-3 rounded mb-3 font-mono">
                      {template.content}
                    </p>

                    {template.variables.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Variables:</p>
                        <div className="flex flex-wrap gap-2">
                          {template.variables.map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Message Logs */}
        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Delivery Logs</CardTitle>
              <CardDescription>Track the status and delivery of WhatsApp messages</CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead>Delivered At</TableHead>
                    <TableHead>Read At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messageLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                      <TableCell>{log.templateId || 'Custom'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {STATUSICONS[log.status]}
                          {getStatusBadge(log.status)}
                        </div>
                      </TableCell>
                      <TableCell>{new Date(log.sentAt).toLocaleString()}</TableCell>
                      <TableCell>
                        {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        {log.readAt ? new Date(log.readAt).toLocaleString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Send Message */}
        <TabsContent value="send" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send WhatsApp Message</CardTitle>
              <CardDescription>Send messages using approved templates</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    Compose Message
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Send WhatsApp Message</DialogTitle>
                    <DialogDescription>Send a message using an approved template</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="recipient">Recipient Phone Number</Label>
                      <Input
                        id="recipient"
                        placeholder="User ID (e.g., usr_123)"
                        value={messageData.recipientUserId}
                        onChange={e =>
                          setMessageData(prev => ({ ...prev, recipientUserId: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="template">Message Template</Label>
                      <Select
                        value={messageData.templateId}
                        onValueChange={value =>
                          setMessageData(prev => ({ ...prev, templateId: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates
                            .filter(t => t.status === 'approved')
                            .map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.name} ({template.category})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {messageData.templateId && (
                      <div>
                        <Label>Template Variables</Label>
                        <div className="space-y-2 mt-2">
                          {templates
                            .find(t => t.id === messageData.templateId)
                            ?.variables.map(variable => (
                              <div key={variable}>
                                <Label htmlFor={variable} className="text-sm capitalize">
                                  {variable.replace('_', ' ')}
                                </Label>
                                <Input
                                  id={variable}
                                  placeholder={`Enter ${variable}`}
                                  value={messageData.variables[variable] || ''}
                                  onChange={e =>
                                    setMessageData(prev => ({
                                      ...prev,
                                      variables: {
                                        ...prev.variables,
                                        [variable]: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowSendDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={sendMessage} disabled={sending}>
                        {sending ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
