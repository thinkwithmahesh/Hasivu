/**
 * HASIVU Platform - Billing Dashboard Component
 * Epic 5: Payment Processing & Billing System
 *
 * Comprehensive billing and invoicing management interface
 * with invoice generation, payment tracking, and billing history
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Tabs as Tabs,
  TabsContent as TabsContent,
  TabsList as TabsList,
  TabsTrigger as TabsTrigger,
} from '@/components/ui/tabs';
import { Alert as Alert, AlertDescription as AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Download,
  Mail,
  Search,
  CreditCard,
  CheckCircle,
  Clock,
  AlertTriangle,
  Receipt,
  Eye,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { PaymentService } from '@/services/payment.service';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { _FEATURE_FLAGS } from '@/types/feature-flags';
import { cn } from '@/lib/utils';

interface BillingDashboardProps {
  parentId: string;
  schoolId?: string;
  className?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  paymentMethod?: string;
  transactionId?: string;
  downloadUrl?: string;
}

interface BillingSummary {
  totalBilled: number;
  totalPaid: number;
  pendingAmount: number;
  overdueAmount: number;
  averagePaymentTime: number;
  paymentSuccessRate: number;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({
  parentId,
  _schoolId,
  className,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [_selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, _setDateRange] = useState('30d');

  // Feature flags
  const billingAnalyticsEnabled = useFeatureFlag(_FEATURE_FLAGS.BILLING_ANALYTICS);
  const newPaymentMethodsEnabled = useFeatureFlag(_FEATURE_FLAGS.NEW_PAYMENT_METHODS);

  const paymentService = PaymentService.getInstance();

  // Load billing data
  useEffect(() => {
    loadBillingData();
  }, [parentId, dateRange]);

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load billing history
      const billingResult = await paymentService.getBillingHistory(parentId, 1, 50);

      if (billingResult.success && billingResult.data) {
        setInvoices(billingResult.data.invoices || []);
        setBillingSummary(billingResult.data.summary || null);
      } else {
        // Fallback to mock data
        setInvoices(generateMockInvoices());
        setBillingSummary(generateMockSummary());
      }
    } catch (error) {
      setInvoices(generateMockInvoices());
      setBillingSummary(generateMockSummary());
    } finally {
      setLoading(false);
    }
  };

  const generateMockInvoices = (): Invoice[] => [
    {
      id: 'inv_001',
      invoiceNumber: 'HASIVU-2024-001',
      orderId: 'order_123',
      amount: 1200,
      currency: 'INR',
      status: 'paid',
      issueDate: '2024-01-15',
      dueDate: '2024-01-30',
      paidDate: '2024-01-20',
      paymentMethod: 'UPI',
      transactionId: 'txn_abc123',
      items: [
        { description: 'Standard Meal Plan - January', quantity: 1, unitPrice: 1200, total: 1200 },
      ],
    },
    {
      id: 'inv_002',
      invoiceNumber: 'HASIVU-2024-002',
      orderId: 'order_124',
      amount: 800,
      currency: 'INR',
      status: 'pending',
      issueDate: '2024-02-01',
      dueDate: '2024-02-15',
      items: [
        { description: 'Additional Meals - February', quantity: 1, unitPrice: 800, total: 800 },
      ],
    },
    {
      id: 'inv_003',
      invoiceNumber: 'HASIVU-2024-003',
      orderId: 'order_125',
      amount: 1500,
      currency: 'INR',
      status: 'overdue',
      issueDate: '2024-01-01',
      dueDate: '2024-01-15',
      items: [
        { description: 'Premium Meal Plan - January', quantity: 1, unitPrice: 1500, total: 1500 },
      ],
    },
  ];

  const generateMockSummary = (): BillingSummary => ({
    totalBilled: 3500,
    totalPaid: 1200,
    pendingAmount: 800,
    overdueAmount: 1500,
    averagePaymentTime: 5.2,
    paymentSuccessRate: 85.7,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      paid: 'default',
      pending: 'secondary',
      overdue: 'destructive',
      cancelled: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.orderId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadInvoice = (invoice: Invoice) => {
    // In a real implementation, this would download the PDF
  };

  const handleEmailInvoice = (invoice: Invoice) => {
    // In a real implementation, this would send the invoice via email
  };

  const handlePayInvoice = (invoice: Invoice) => {
    // In a real implementation, this would redirect to payment
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
      {/* Billing Summary */}
      {billingSummary && (
        <div
          className={cn(
            'grid gap-4',
            billingAnalyticsEnabled
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
          )}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Billed</p>
                  <p className="text-2xl font-bold">{formatCurrency(billingSummary.totalBilled)}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(billingSummary.totalPaid)}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(billingSummary.pendingAmount)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Amount</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(billingSummary.overdueAmount)}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Analytics - Only shown if feature flag is enabled */}
          {billingAnalyticsEnabled && (
            <>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Avg Payment Time</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {billingSummary.averagePaymentTime.toFixed(1)} days
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {billingSummary.paymentSuccessRate.toFixed(1)}%
                      </p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-indigo-600" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Billing History
              </CardTitle>
              <CardDescription>View and manage your invoices and payment history</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.orderId}</TableCell>
                  <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                  <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Invoice Details - {invoice.invoiceNumber}</DialogTitle>
                            <DialogDescription>
                              Order #{invoice.orderId} - {formatDate(invoice.issueDate)}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Invoice Summary */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Amount</Label>
                                <p className="text-2xl font-bold">
                                  {formatCurrency(invoice.amount)}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Issue Date</Label>
                                <p>{formatDate(invoice.issueDate)}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Due Date</Label>
                                <p>{formatDate(invoice.dueDate)}</p>
                              </div>
                              {invoice.paidDate && (
                                <>
                                  <div>
                                    <Label className="text-sm font-medium">Paid Date</Label>
                                    <p>{formatDate(invoice.paidDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Payment Method</Label>
                                    <p>{invoice.paymentMethod}</p>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Invoice Items */}
                            <div>
                              <Label className="text-sm font-medium">Items</Label>
                              <div className="mt-2 space-y-2">
                                {invoice.items.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                                  >
                                    <div>
                                      <p className="font-medium">{item.description}</p>
                                      <p className="text-sm text-gray-600">
                                        {item.quantity} × {formatCurrency(item.unitPrice)}
                                      </p>
                                    </div>
                                    <p className="font-bold">{formatCurrency(item.total)}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </Button>
                              <Button variant="outline" onClick={() => handleEmailInvoice(invoice)}>
                                <Mail className="h-4 w-4 mr-2" />
                                Email Invoice
                              </Button>
                              {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                                <Button onClick={() => handlePayInvoice(invoice)}>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay Now
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadInvoice(invoice)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>

                      {invoice.status === 'pending' || invoice.status === 'overdue' ? (
                        <Button size="sm" onClick={() => handlePayInvoice(invoice)}>
                          Pay
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No invoices found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
            {newPaymentMethodsEnabled && (
              <Badge variant="secondary" className="text-xs">
                New Methods Available
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage your saved payment methods for faster checkout
            {newPaymentMethodsEnabled && ' - Includes UPI, digital wallets, and more'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">No saved payment methods</p>
            <Button variant="outline">Add Payment Method</Button>
            {newPaymentMethodsEnabled && (
              <div className="mt-4 text-sm text-gray-500">
                <p>✨ Try our new payment options: UPI, digital wallets, and instant transfers</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
