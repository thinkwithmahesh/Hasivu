/**
 * HASIVU Platform - SMS Communication Component
 * Epic 6: Notifications & Communication System - Story 6.5
 *
 * SMS notification management with templates, bulk messaging,
 * and delivery analytics for Indian telecom networks
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress as _Progress } from '@/components/ui/progress';
import {
  Send,
  FileText,
  BarChart3,
  CheckCircle,
  IndianRupee,
  TrendingUp,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { NotificationService } from '@/services/notification.service';
import { cn } from '@/lib/utils';

interface SMSCommunicationProps {
  className?: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  content: string;
  category: 'transactional' | 'promotional' | 'otp' | 'alert';
  variables: string[];
  maxLength: number;
  dltTemplateId?: string;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
  usageCount: number;
}

interface SMSBatch {
  id: string;
  name: string;
  templateId: string;
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledFor?: string;
  sentAt?: string;
  metrics: {
    sent: number;
    delivered: number;
    failed: number;
    cost: number;
  };
  recipients: string[];
}

interface SMSAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number;
  totalCost: number;
  averageCostPerSMS: number;
  monthlyUsage: Array<{
    month: string;
    sent: number;
    cost: number;
  }>;
}

export const SMSCommunication: React.FC<SMSCommunicationProps> = ({ className }) => {
  const [templates, setTemplates] = useState<SMSTemplate[]>([]);
  const [batches, setBatches] = useState<SMSBatch[]>([]);
  const [analytics, setAnalytics] = useState<SMSAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [sending, setSending] = useState(false);

  const [templateData, setTemplateData] = useState({
    name: '',
    content: '',
    category: 'transactional' as const,
    variables: [] as string[],
    dltTemplateId: '',
  });

  const [batchData, setBatchData] = useState({
    name: '',
    templateId: '',
    recipients: '',
    scheduledFor: '',
  });

  const _notificationService = NotificationService.getInstance();

  // Load SMS data
  useEffect(() => {
    loadSMSData();
  }, []);

  const loadSMSData = async () => {
    try {
      setLoading(true);

      // Mock SMS templates (DLT compliant)
      setTemplates([
        {
          id: 'order_confirm_sms',
          name: 'Order Confirmation',
          content:
            'Hi {{name}}! Your order #{{order_id}} for ₹{{amount}} is confirmed. Track: {{link}} - HASIVU',
          category: 'transactional',
          variables: ['name', 'order_id', 'amount', 'link'],
          maxLength: 160,
          dltTemplateId: 'DLT001',
          status: 'approved',
          createdAt: '2024-01-01',
          usageCount: 1250,
        },
        {
          id: 'payment_reminder_sms',
          name: 'Payment Reminder',
          content:
            'Payment reminder: ₹{{amount}} due for order #{{order_id}}. Pay now: {{link}} - HASIVU',
          category: 'transactional',
          variables: ['amount', 'order_id', 'link'],
          maxLength: 160,
          dltTemplateId: 'DLT002',
          status: 'approved',
          createdAt: '2024-01-01',
          usageCount: 890,
        },
        {
          id: 'otp_sms',
          name: 'OTP Verification',
          content: 'Your HASIVU verification code is {{otp}}. Valid for 5 minutes. Do not share.',
          category: 'otp',
          variables: ['otp'],
          maxLength: 160,
          dltTemplateId: 'DLT003',
          status: 'approved',
          createdAt: '2024-01-01',
          usageCount: 3450,
        },
        {
          id: 'delivery_alert_sms',
          name: 'Delivery Alert',
          content:
            'Your HASIVU order #{{order_id}} is out for delivery. Expected: {{time}}. Contact: {{support}}',
          category: 'alert',
          variables: ['order_id', 'time', 'support'],
          maxLength: 160,
          dltTemplateId: 'DLT004',
          status: 'approved',
          createdAt: '2024-01-05',
          usageCount: 567,
        },
      ]);

      // Mock SMS batches
      setBatches([
        {
          id: 'batch_001',
          name: 'Payment Reminders - Week 1',
          templateId: 'payment_reminder_sms',
          recipientCount: 150,
          status: 'completed',
          sentAt: '2024-01-15T10:00:00Z',
          metrics: {
            sent: 150,
            delivered: 147,
            failed: 3,
            cost: 225,
          },
          recipients: [],
        },
        {
          id: 'batch_002',
          name: 'Order Confirmations - Today',
          templateId: 'order_confirm_sms',
          recipientCount: 45,
          status: 'completed',
          sentAt: '2024-01-20T14:30:00Z',
          metrics: {
            sent: 45,
            delivered: 44,
            failed: 1,
            cost: 67.5,
          },
          recipients: [],
        },
        {
          id: 'batch_003',
          name: 'Delivery Updates - Evening',
          templateId: 'delivery_alert_sms',
          recipientCount: 78,
          status: 'scheduled',
          scheduledFor: '2024-01-21T18:00:00Z',
          metrics: {
            sent: 0,
            delivered: 0,
            failed: 0,
            cost: 0,
          },
          recipients: [],
        },
      ]);

      // Mock analytics
      setAnalytics({
        totalSent: 12500,
        totalDelivered: 12100,
        totalFailed: 400,
        deliveryRate: 96.8,
        totalCost: 18750,
        averageCostPerSMS: 1.5,
        monthlyUsage: [
          { month: 'Dec 2023', sent: 3200, cost: 4800 },
          { month: 'Jan 2024', sent: 4100, cost: 6150 },
          { month: 'Feb 2024', sent: 5200, cost: 7800 },
        ],
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const createTemplate = async () => {
    if (!templateData.name || !templateData.content) {
      // Use console.warn instead of alert for better UX
      console.warn('Please fill in all required fields');
      return;
    }

    // Validate SMS length (160 characters max for single SMS)
    if (templateData.content.length > 160) {
      // Use console.warn instead of alert for better UX
      console.warn('SMS content exceeds 160 characters limit');
      return;
    }

    try {
      setSending(true);

      const newTemplate: SMSTemplate = {
        id: `sms_template_${Date.now()}`,
        name: templateData.name,
        content: templateData.content,
        category: templateData.category,
        variables: templateData.variables,
        maxLength: 160,
        dltTemplateId: templateData.dltTemplateId || `DLT${Date.now()}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
        usageCount: 0,
      };

      setTemplates(prev => [newTemplate, ...prev]);

      // Reset form
      setTemplateData({
        name: '',
        content: '',
        category: 'transactional',
        variables: [],
        dltTemplateId: '',
      });
      setShowTemplateDialog(false);
    } catch (error) {
      // Use console.error instead of alert for better error handling
      console.error('Failed to create template:', error);
    } finally {
      setSending(false);
    }
  };

  const createBatch = async () => {
    if (!batchData.name || !batchData.templateId || !batchData.recipients) {
      // Use console.warn instead of alert for better UX
      console.warn('Please fill in all required fields');
      return;
    }

    const recipients = batchData.recipients.split('\n').filter(phone => phone.trim());
    if (recipients.length === 0) {
      // Use console.warn instead of alert for better UX
      console.warn('Please add at least one recipient');
      return;
    }

    // Validate Indian phone numbers
    const invalidPhones = recipients.filter(
      phone => !/^(\+91|91)?[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))
    );
    if (invalidPhones.length > 0) {
      // Use console.warn instead of alert for better UX
      console.warn(`Invalid phone numbers: ${invalidPhones.slice(0, 3).join(', ')}`);
      return;
    }

    try {
      setSending(true);

      const newBatch: SMSBatch = {
        id: `sms_batch_${Date.now()}`,
        name: batchData.name,
        templateId: batchData.templateId,
        recipientCount: recipients.length,
        status: batchData.scheduledFor ? 'scheduled' : 'draft',
        scheduledFor: batchData.scheduledFor || undefined,
        metrics: {
          sent: 0,
          delivered: 0,
          failed: 0,
          cost: 0,
        },
        recipients,
      };

      setBatches(prev => [newBatch, ...prev]);

      // Reset form
      setBatchData({
        name: '',
        templateId: '',
        recipients: '',
        scheduledFor: '',
      });
      setShowBatchDialog(false);
    } catch (error) {
      // Use console.error instead of alert for better error handling
      console.error('Failed to create batch:', error);
    } finally {
      setSending(false);
    }
  };

  const sendBatch = async (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    try {
      // Simulate sending SMS batch
      setBatches(prev =>
        prev.map(b => (b.id === batchId ? { ...b, status: 'sending' as const } : b))
      );

      // Simulate API call delay
      setTimeout(() => {
        const sent = Math.floor(batch.recipientCount * 0.95); // 95% success rate
        const delivered = Math.floor(sent * 0.98); // 98% delivery rate
        const failed = batch.recipientCount - sent;
        const cost = sent * 1.5; // ₹1.50 per SMS

        setBatches(prev =>
          prev.map(b =>
            b.id === batchId
              ? {
                  ...b,
                  status: 'completed' as const,
                  sentAt: new Date().toISOString(),
                  metrics: { sent, delivered, failed, cost },
                }
              : b
          )
        );
      }, 2000);
    } catch (error) {
      setBatches(prev =>
        prev.map(b => (b.id === batchId ? { ...b, status: 'failed' as const } : b))
      );
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      draft: 'secondary',
      scheduled: 'outline',
      sending: 'secondary',
      completed: 'default',
      failed: 'destructive',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

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
      {/* SMS Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold">{analytics.totalSent.toLocaleString()}</p>
                </div>
                <Send className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Delivery Rate</p>
                  <p className="text-2xl font-bold">{formatPercentage(analytics.deliveryRate)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(analytics.totalCost)}</p>
                </div>
                <IndianRupee className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cost per SMS</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(analytics.averageCostPerSMS)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>DLT Compliance:</strong> All SMS templates must be registered with DLT platform
          for Indian telecom compliance. Promotional SMS can only be sent between 10 AM - 9 PM.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">SMS Templates</TabsTrigger>
          <TabsTrigger value="batches">SMS Batches</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* SMS Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SMS Templates</CardTitle>
                  <CardDescription>
                    DLT-compliant SMS templates for different message types
                  </CardDescription>
                </div>
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setTemplateData({
                          name: '',
                          content: '',
                          category: 'transactional',
                          variables: [],
                          dltTemplateId: '',
                        });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Template
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create SMS Template</DialogTitle>
                      <DialogDescription>
                        Create DLT-compliant SMS templates with variables
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="sms-name">Template Name</Label>
                          <Input
                            id="sms-name"
                            value={templateData.name}
                            onChange={e =>
                              setTemplateData(prev => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Order Confirmation"
                          />
                        </div>

                        <div>
                          <Label htmlFor="sms-category">Category</Label>
                          <Select
                            value={templateData.category}
                            onValueChange={(value: any) =>
                              setTemplateData(prev => ({ ...prev, category: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="transactional">Transactional</SelectItem>
                              <SelectItem value="promotional">Promotional</SelectItem>
                              <SelectItem value="otp">OTP</SelectItem>
                              <SelectItem value="alert">Alert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="sms-content">SMS Content (Max 160 chars)</Label>
                        <Textarea
                          id="sms-content"
                          value={templateData.content}
                          onChange={e =>
                            setTemplateData(prev => ({ ...prev, content: e.target.value }))
                          }
                          placeholder="Hi {{name}}! Your order #{{order_id}} is confirmed. - HASIVU"
                          rows={3}
                          maxLength={160}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          {templateData.content.length}/160 characters
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Variables (comma-separated)</Label>
                          <Input
                            value={templateData.variables.join(', ')}
                            onChange={e =>
                              setTemplateData(prev => ({
                                ...prev,
                                variables: e.target.value
                                  .split(',')
                                  .map(v => v.trim())
                                  .filter(v => v),
                              }))
                            }
                            placeholder="name, order_id, amount"
                          />
                        </div>

                        <div>
                          <Label htmlFor="dlt-id">DLT Template ID</Label>
                          <Input
                            id="dlt-id"
                            value={templateData.dltTemplateId}
                            onChange={e =>
                              setTemplateData(prev => ({ ...prev, dltTemplateId: e.target.value }))
                            }
                            placeholder="DLT001"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createTemplate} disabled={sending}>
                          {sending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-4 w-4 mr-2" />
                              Create Template
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {templates.map(template => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{template.name}</h4>
                          {getStatusBadge(template.status)}
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                        <p className="text-sm bg-gray-50 p-3 rounded font-mono mb-2">
                          {template.content}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Variables: {template.variables.join(', ') || 'None'}</span>
                          <span>DLT ID: {template.dltTemplateId}</span>
                          <span>Used {template.usageCount} times</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Batches */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SMS Batches</CardTitle>
                  <CardDescription>
                    Manage bulk SMS campaigns and scheduled messages
                  </CardDescription>
                </div>
                <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Batch
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create SMS Batch</DialogTitle>
                      <DialogDescription>
                        Send bulk SMS messages using approved templates
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="batch-name">Batch Name</Label>
                          <Input
                            id="batch-name"
                            value={batchData.name}
                            onChange={e =>
                              setBatchData(prev => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Payment Reminders"
                          />
                        </div>

                        <div>
                          <Label htmlFor="batch-template">SMS Template</Label>
                          <Select
                            value={batchData.templateId}
                            onValueChange={value =>
                              setBatchData(prev => ({ ...prev, templateId: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select template" />
                            </SelectTrigger>
                            <SelectContent>
                              {templates
                                .filter(t => t.status === 'approved')
                                .map(template => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="recipients">Recipients (one phone number per line)</Label>
                        <Textarea
                          id="recipients"
                          value={batchData.recipients}
                          onChange={e =>
                            setBatchData(prev => ({ ...prev, recipients: e.target.value }))
                          }
                          placeholder="9876543210
9876543211
9876543212"
                          rows={6}
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          {batchData.recipients.split('\n').filter(phone => phone.trim()).length}{' '}
                          recipients
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="schedule">Schedule (optional)</Label>
                        <Input
                          id="schedule"
                          type="datetime-local"
                          value={batchData.scheduledFor}
                          onChange={e =>
                            setBatchData(prev => ({ ...prev, scheduledFor: e.target.value }))
                          }
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={createBatch} disabled={sending}>
                          {sending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Create Batch
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Name</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Delivered</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map(batch => (
                    <TableRow key={batch.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{batch.name}</p>
                          <p className="text-sm text-gray-600">
                            {batch.sentAt
                              ? new Date(batch.sentAt).toLocaleDateString()
                              : batch.scheduledFor
                                ? `Scheduled: ${new Date(batch.scheduledFor).toLocaleString()}`
                                : 'Draft'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{batch.recipientCount}</TableCell>
                      <TableCell>{getStatusBadge(batch.status)}</TableCell>
                      <TableCell>{batch.metrics.sent}</TableCell>
                      <TableCell>{batch.metrics.delivered}</TableCell>
                      <TableCell>{formatCurrency(batch.metrics.cost)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {batch.status === 'draft' && (
                            <Button variant="ghost" size="sm" onClick={() => sendBatch(batch.id)}>
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.monthlyUsage.map(month => (
                      <div
                        key={month.month}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{month.month}</p>
                          <p className="text-sm text-gray-600">{month.sent} SMS sent</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(month.cost)}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(month.cost / month.sent)} per SMS
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Rate</span>
                      <span className="font-medium">
                        {formatPercentage(analytics.deliveryRate)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Failure Rate</span>
                      <span className="font-medium text-red-600">
                        {formatPercentage((analytics.totalFailed / analytics.totalSent) * 100)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Cost per SMS</span>
                      <span className="font-medium">
                        {formatCurrency(analytics.averageCostPerSMS)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Total Cost</span>
                      <span className="font-medium">{formatCurrency(analytics.totalCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
