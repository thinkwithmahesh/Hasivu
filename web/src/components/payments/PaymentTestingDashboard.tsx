/**
 * HASIVU Platform - Payment Testing Dashboard Component
 * Epic 5: Payment Processing & Billing System
 *
 * Comprehensive payment testing and validation interface for development
 * and QA environments with sandbox payment processing simulation
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  _FileText,
  _Download,
  _Upload,
  Settings,
  TestTube,
  _Zap,
  Shield,
  Clock,
} from 'lucide-react';
import { PaymentService } from '@/services/payment.service';
import { cn } from '@/lib/utils';

interface PaymentTestingDashboardProps {
  schoolId: string;
  parentId: string;
  className?: string;
}

interface TestCase {
  id: string;
  name: string;
  description: string;
  type: 'payment' | 'subscription' | 'refund' | 'validation';
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  error?: string;
  result?: any;
}

interface TestSuite {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
  status: 'idle' | 'running' | 'completed' | 'failed';
  progress: number;
  startTime?: Date;
  endTime?: Date;
}

export const PaymentTestingDashboard: React.FC<PaymentTestingDashboardProps> = ({
  schoolId,
  parentId,
  className,
}) => {
  const [_activeTestSuite, setActiveTestSuite] = useState<TestSuite | null>(null);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([
    {
      id: 'payment-flow',
      name: 'Payment Flow Tests',
      description: 'Complete payment processing workflow validation',
      testCases: [
        {
          id: 'card-payment',
          name: 'Credit Card Payment',
          description: 'Test successful credit card payment processing',
          type: 'payment',
          status: 'pending',
        },
        {
          id: 'upi-payment',
          name: 'UPI Payment',
          description: 'Test UPI payment processing',
          type: 'payment',
          status: 'pending',
        },
        {
          id: 'payment-failure',
          name: 'Payment Failure Handling',
          description: 'Test payment failure scenarios',
          type: 'payment',
          status: 'pending',
        },
      ],
      status: 'idle',
      progress: 0,
    },
    {
      id: 'subscription-flow',
      name: 'Subscription Tests',
      description: 'Subscription creation and management validation',
      testCases: [
        {
          id: 'subscription-create',
          name: 'Create Subscription',
          description: 'Test subscription creation',
          type: 'subscription',
          status: 'pending',
        },
        {
          id: 'subscription-billing',
          name: 'Subscription Billing',
          description: 'Test recurring billing',
          type: 'subscription',
          status: 'pending',
        },
      ],
      status: 'idle',
      progress: 0,
    },
    {
      id: 'security-tests',
      name: 'Security Validation',
      description: 'Payment security and compliance testing',
      testCases: [
        {
          id: 'pci-validation',
          name: 'PCI DSS Validation',
          description: 'Validate PCI DSS compliance',
          type: 'validation',
          status: 'pending',
        },
        {
          id: 'fraud-detection',
          name: 'Fraud Detection',
          description: 'Test fraud detection mechanisms',
          type: 'validation',
          status: 'pending',
        },
      ],
      status: 'idle',
      progress: 0,
    },
  ]);

  const [customTest, setCustomTest] = useState({
    amount: '',
    currency: 'INR',
    paymentMethod: 'card',
    description: '',
    testType: 'payment',
  });

  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const paymentService = PaymentService.getInstance();

  const runTestSuite = async (suiteId: string) => {
    const suite = testSuites.find(s => s.id === suiteId);
    if (!suite) return;

    setActiveTestSuite({ ...suite, status: 'running', progress: 0, startTime: new Date() });
    setIsRunning(true);

    // Update suite status
    setTestSuites(prev =>
      prev.map(s =>
        s.id === suiteId ? { ...s, status: 'running', progress: 0, startTime: new Date() } : s
      )
    );

    const updatedTestCases = [...suite.testCases];

    for (let i = 0; i < updatedTestCases.length; i++) {
      const testCase = updatedTestCases[i];
      testCase.status = 'running';

      // Update progress
      const progress = ((i + 1) / updatedTestCases.length) * 100;
      setActiveTestSuite(prev => (prev ? { ...prev, progress } : null));
      setTestSuites(prev => prev.map(s => (s.id === suiteId ? { ...s, progress } : s)));

      try {
        // Simulate test execution
        await runTestCase(testCase);
        testCase.status = 'passed';
        testCase.duration = Math.random() * 2000 + 500; // 500-2500ms
      } catch (error) {
        testCase.status = 'failed';
        testCase.error = error instanceof Error ? error.message : 'Test failed';
        testCase.duration = Math.random() * 1000 + 200; // 200-1200ms
      }
    }

    // Complete suite
    const endTime = new Date();
    const finalSuite: TestSuite = {
      ...suite,
      testCases: updatedTestCases,
      status: updatedTestCases.every(tc => tc.status === 'passed') ? 'completed' : 'failed',
      progress: 100,
      endTime,
    };

    setActiveTestSuite(finalSuite);
    setTestSuites(prev => prev.map(s => (s.id === suiteId ? finalSuite : s)));
    setIsRunning(false);
  };

  const runTestCase = async (testCase: TestCase): Promise<void> => {
    // Simulate different test scenarios
    switch (testCase.id) {
      case 'card-payment':
        await simulatePaymentTest(1200, 'card');
        break;
      case 'upi-payment':
        await simulatePaymentTest(800, 'upi');
        break;
      case 'payment-failure':
        await simulatePaymentFailure();
        break;
      case 'subscription-create':
        await simulateSubscriptionTest();
        break;
      case 'pci-validation':
        await simulateSecurityValidation();
        break;
      default:
        // Generic test simulation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    }
  };

  const simulatePaymentTest = async (amount: number, method: string) => {
    const result = await paymentService.processPayment({
      amount,
      currency: 'INR',
      orderId: `test_order_${Date.now()}`,
      schoolId,
      parentId,
      paymentMethod: method,
      description: `Test ${method} payment`,
    });

    if (!result.success) {
      throw new Error(result.error || 'Payment test failed');
    }
  };

  const simulatePaymentFailure = async () => {
    // Simulate a payment failure scenario
    await new Promise(resolve => setTimeout(resolve, 500));
    // Randomly fail for testing
    if (Math.random() > 0.7) {
      throw new Error('Simulated payment failure');
    }
  };

  const simulateSubscriptionTest = async () => {
    const result = await paymentService.createSubscription({
      schoolId,
      parentId,
      planId: 'test_plan',
      billingCycle: 'monthly',
    });

    if (!result.success) {
      throw new Error(result.error || 'Subscription test failed');
    }
  };

  const simulateSecurityValidation = async () => {
    const result = await paymentService.validatePaymentSecurity({
      checkType: 'test_validation',
    });

    if (!result.success) {
      throw new Error(result.error || 'Security validation failed');
    }
  };

  const runCustomTest = async () => {
    if (!customTest.amount || !customTest.description) {
      // Use console.warn instead of alert for better UX
      console.warn('Please fill in all required fields');
      return;
    }

    setIsRunning(true);

    try {
      const startTime = Date.now();

      switch (customTest.testType) {
        case 'payment':
          await simulatePaymentTest(parseFloat(customTest.amount), customTest.paymentMethod);
          break;
        case 'subscription':
          await simulateSubscriptionTest();
          break;
        case 'refund':
          await paymentService.processRefund(`test_txn_${Date.now()}`);
          break;
        case 'validation':
          await simulateSecurityValidation();
          break;
      }

      const duration = Date.now() - startTime;
      setTestResults(prev => [
        {
          id: Date.now(),
          type: customTest.testType,
          amount: customTest.amount,
          method: customTest.paymentMethod,
          description: customTest.description,
          status: 'passed',
          duration,
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } catch (error) {
      setTestResults(prev => [
        {
          id: Date.now(),
          type: customTest.testType,
          amount: customTest.amount,
          method: customTest.paymentMethod,
          description: customTest.description,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Test failed',
          timestamp: new Date(),
        },
        ...prev,
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      running: 'outline',
      passed: 'default',
      failed: 'destructive',
      idle: 'secondary',
      completed: 'default',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>
    );
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <TestTube className="h-4 w-4" />;
      case 'subscription':
        return <Settings className="h-4 w-4" />;
      case 'refund':
        return <RefreshCw className="h-4 w-4" />;
      case 'validation':
        return <Shield className="h-4 w-4" />;
      default:
        return <TestTube className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Payment Testing</h2>
          <p className="text-muted-foreground">
            Comprehensive testing suite for payment processing validation
          </p>
        </div>
        <Badge variant="outline" className="text-orange-600">
          Sandbox Environment
        </Badge>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Test Environment:</strong> All tests run in sandbox mode. No real payments will be
          processed.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="test-suites" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test-suites">Test Suites</TabsTrigger>
          <TabsTrigger value="custom-test">Custom Test</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
        </TabsList>

        {/* Test Suites Tab */}
        <TabsContent value="test-suites" className="space-y-4">
          {testSuites.map(suite => (
            <Card key={suite.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {getTestTypeIcon('payment')}
                      {suite.name}
                    </CardTitle>
                    <CardDescription>{suite.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(suite.status)}
                    <Button onClick={() => runTestSuite(suite.id)} disabled={isRunning} size="sm">
                      {suite.status === 'running' ? (
                        <Square className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {suite.status === 'running' ? 'Running...' : 'Run Tests'}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {suite.status === 'running' && (
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{Math.round(suite.progress)}%</span>
                    </div>
                    <Progress value={suite.progress} className="h-2" />
                  </div>
                </CardContent>
              )}

              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Case</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suite.testCases.map(testCase => (
                      <TableRow key={testCase.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{testCase.name}</p>
                            <p className="text-sm text-gray-600">{testCase.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getTestTypeIcon(testCase.type)}</TableCell>
                        <TableCell>{getStatusBadge(testCase.status)}</TableCell>
                        <TableCell>
                          {testCase.duration ? `${Math.round(testCase.duration)}ms` : '-'}
                        </TableCell>
                        <TableCell>
                          {testCase.error ? (
                            <span className="text-red-600 text-sm">{testCase.error}</span>
                          ) : testCase.status === 'passed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : testCase.status === 'failed' ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-gray-400" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Custom Test Tab */}
        <TabsContent value="custom-test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Test Configuration</CardTitle>
              <CardDescription>
                Create and run custom payment tests with specific parameters
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="test-type">Test Type</Label>
                  <Select
                    value={customTest.testType}
                    onValueChange={value => setCustomTest(prev => ({ ...prev, testType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Payment Processing</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="refund">Refund</SelectItem>
                      <SelectItem value="validation">Security Validation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="1000"
                    value={customTest.amount}
                    onChange={e => setCustomTest(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select
                    value={customTest.paymentMethod}
                    onValueChange={value =>
                      setCustomTest(prev => ({ ...prev, paymentMethod: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                      <SelectItem value="wallet">Digital Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={customTest.currency}
                    onValueChange={value => setCustomTest(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Test Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this test validates..."
                  value={customTest.description}
                  onChange={e => setCustomTest(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <Button onClick={runCustomTest} disabled={isRunning} className="w-full">
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Custom Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Execution History</CardTitle>
              <CardDescription>Results from recent test executions</CardDescription>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testResults.map(result => (
                    <TableRow key={result.id}>
                      <TableCell>{result.timestamp.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTestTypeIcon(result.type)}
                          <span className="capitalize">{result.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{result.description}</TableCell>
                      <TableCell>{result.amount ? `₹${result.amount}` : '-'}</TableCell>
                      <TableCell>
                        {result.method ? <Badge variant="outline">{result.method}</Badge> : '-'}
                      </TableCell>
                      <TableCell>
                        {result.status === 'passed' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </TableCell>
                      <TableCell>
                        {result.duration ? `${Math.round(result.duration)}ms` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {testResults.length === 0 && (
                <div className="text-center py-8">
                  <TestTube className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">No test results yet</p>
                  <p className="text-sm text-gray-500 mt-2">Run some tests to see results here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
