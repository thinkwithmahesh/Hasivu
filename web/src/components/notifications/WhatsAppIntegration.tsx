/**
 * HASIVU Platform - WhatsApp Business API Integration Component
 * Epic 6: Notifications & Communication System - Story 6.2
 *
 * WhatsApp Business API integration with message templates,
 * interactive messaging, and delivery tracking
 */

import React, { useState, useEffect } from 'react';
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
  sent: <Clock className="h-4 w-4 text-blue-600" />,
  delivered: <CheckCircle className="h-4 w-4 text-green-600" />,
  read: <Eye className="h-4 w-4 text-purple-600" />,
  failed: <XCircle className="h-4 w-4 text-red-600" />,
};

export const WhatsAppIntegration: React.FC<WhatsAppIntegrationProps> = ({ className }) => {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);

  const [messageData, setMessageData] = useState({
    recipient: '',
    templateId: '',
    variables: {} as Record<string, string>,
  });

  // Feature flag for WhatsApp notifications
  const whatsappEnabled = useFeatureFlag(_FEATURE_FLAGS.WHATSAPP_NOTIFICATIONS);

  // Load WhatsApp status and data
  useEffect(() => {
    loadWhatsAppData();
  }, []);

  const loadWhatsAppData = async () => {
    try {
      setLoading(true);

      // Load WhatsApp status
      // TODO: Implement notification service
      // const statusResult = await notificationService.getWhatsAppStatus();
      // if (statusResult.success) {
      //   setStatus(statusResult.data);
      // } else {
      // Mock data for demo
      setStatus({
        connected: true,
        phoneNumber: '+91 98765 43210',
        businessName: 'HASIVU Platform',
        qualityRating: 'green',
        messageLimit: 1000,
        messagesSent: 245,
        lastActivity: new Date().toISOString(),
      });
      // }

      // Load message templates
      setTemplates([
        {
          id: 'order_confirm',
          name: 'Order Confirmation',
          category: 'utility',
          language: 'en',
          status: 'approved',
          content:
            'Hi {{name}}! Your order #{{order_id}} has been confirmed. Total: ₹{{amount}}. Track here: {{link}}',
          variables: ['name', 'order_id', 'amount', 'link'],
          createdAt: '2024-01-01',
        },
        {
          id: 'payment_reminder',
          name: 'Payment Reminder',
          category: 'utility',
          language: 'en',
          status: 'approved',
          content:
            'Hi {{name}}, your payment of ₹{{amount}} for order #{{order_id}} is due. Pay now: {{link}}',
          variables: ['name', 'amount', 'order_id', 'link'],
          createdAt: '2024-01-01',
        },
        {
          id: 'delivery_update',
          name: 'Delivery Update',
          category: 'utility',
          language: 'en',
          status: 'approved',
          content:
            'Your order #{{order_id}} is out for delivery! Expected arrival: {{time}}. Track: {{link}}',
          variables: ['order_id', 'time', 'link'],
          createdAt: '2024-01-01',
        },
      ]);

      // Load message logs
      setMessageLogs([
        {
          id: 'msg_001',
          recipient: '+91 98765 43210',
          templateId: 'order_confirm',
          content:
            'Hi John! Your order #ORD-2024-001 has been confirmed. Total: ₹1,200. Track here: https://hasivu.app/track',
          status: 'delivered',
          sentAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          deliveredAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        },
        {
          id: 'msg_002',
          recipient: '+91 98765 43211',
          templateId: 'payment_reminder',
          content:
            'Hi Sarah, your payment of ₹800 for order #ORD-2024-002 is due. Pay now: https://hasivu.app/pay',
          status: 'read',
          sentAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          deliveredAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          readAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
        },
      ]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!messageData.recipient || !messageData.templateId) {
      // Use toast notification instead of alert
      console.warn('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);

      const template = templates.find(t => t.id === messageData.templateId);
      if (!template) throw new Error('Template not found');

      // Replace variables in content
      let { content } = template;
      template.variables.forEach(variable => {
        const value = messageData.variables[variable] || `{{${variable}}}`;
        content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });

      // TODO: Implement notification service
      // const result = await notificationService.sendWhatsAppMessage({
      //   recipientId: messageData.recipient,
      //   message: content,
      // });

      // Mock success for demo
      const result = { success: true, error: '' };

      if (result.success) {
        // Add to message logs
        const newMessage: MessageLog = {
          id: `msg_${Date.now()}`,
          recipient: messageData.recipient,
          templateId: messageData.templateId,
          content,
          status: 'sent',
          sentAt: new Date().toISOString(),
        };
        setMessageLogs(prev => [newMessage, ...prev]);

        // Reset form
        setMessageData({
          recipient: '',
          templateId: '',
          variables: {},
        });
        setShowSendDialog(false);
      } else {
        throw new Error(result.error || 'Failed to send message');
      }
    } catch (error) {
      // Use console.error instead of alert for better error handling
      console.error('Failed to send WhatsApp message:', error);
    } finally {
      setSending(false);
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
                        placeholder="+91 98765 43210"
                        value={messageData.recipient}
                        onChange={e =>
                          setMessageData(prev => ({ ...prev, recipient: e.target.value }))
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
