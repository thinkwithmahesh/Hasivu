'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  TrendingUp,
  Brain,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Activity,
  DollarSign,
  Users,
  Zap,
  RefreshCw,
} from 'lucide-react';
import { hasiviApi as _hasiviApi } from '@/services/api/hasivu-api.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button as Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Demo payment transactions for testing
const DEMOTRANSACTIONS = [
  {
    id: 'TXN-001',
    amount: 150,
    studentName: 'Emma Johnson',
    time: '09:15 AM',
    riskScore: 12,
    status: 'approved',
    paymentMethod: 'Credit Card',
    location: 'Springfield Elementary',
  },
  {
    id: 'TXN-002',
    amount: 75,
    studentName: 'Michael Chen',
    time: '09:18 AM',
    riskScore: 95,
    status: 'flagged',
    paymentMethod: 'Debit Card',
    location: 'Unknown Location',
    anomaly: 'Unusual location pattern',
  },
  {
    id: 'TXN-003',
    amount: 200,
    studentName: 'Sofia Rodriguez',
    time: '09:21 AM',
    riskScore: 8,
    status: 'approved',
    paymentMethod: 'Wallet',
    location: 'Springfield Elementary',
  },
];

// ML Model metrics
const MLMETRICS = {
  fraudDetection: {
    accuracy: 99.7,
    falsePositives: 0.1,
    truePositives: 99.6,
    processingTime: 187,
  },
  churnPrediction: {
    accuracy: 94,
    precision: 92,
    recall: 96,
    f1Score: 94,
  },
  revenueForecasting: {
    accuracy: 97,
    mape: 3.2, // Mean Absolute Percentage Error
    confidence: 95,
  },
};

// Revenue data for charts
const revenueData = [
  { month: 'Jan', actual: 45000, predicted: 44500, transactions: 1200 },
  { month: 'Feb', actual: 52000, predicted: 51800, transactions: 1400 },
  { month: 'Mar', actual: 48000, predicted: 48500, transactions: 1300 },
  { month: 'Apr', actual: 55000, predicted: 54200, transactions: 1500 },
  { month: 'May', actual: 61000, predicted: 60500, transactions: 1650 },
  { month: 'Jun', actual: 58000, predicted: 58300, transactions: 1580 },
];

// Payment success rate data
const paymentSuccessData = [
  { name: 'Credit Card', success: 98, failed: 2 },
  { name: 'Debit Card', success: 96, failed: 4 },
  { name: 'Wallet', success: 99.5, failed: 0.5 },
  { name: 'UPI', success: 97, failed: 3 },
];

const PaymentIntelligenceDemo: React.FC = () => {
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState({
    totalTransactions: 2347892,
    fraudsPrevented: 180,
    moneySaved: 2300000,
    activeModels: 4,
  });
  const [activeTab, setActiveTab] = useState('fraud-detection');

  // Simulate live metrics updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveMetrics(prev => ({
        totalTransactions: prev.totalTransactions + Math.floor(Math.random() * 10),
        fraudsPrevented: prev.fraudsPrevented + (Math.random() > 0.95 ? 1 : 0),
        moneySaved: prev.moneySaved + Math.floor(Math.random() * 1000),
        activeModels: 4,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const analyzeTransaction = async (transaction: any) => {
    setIsAnalyzing(true);
    setSelectedTransaction(null);

    // Simulate ML analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = {
      ...transaction,
      mlAnalysis: {
        riskFactors: [
          transaction.riskScore > 80 ? 'Unusual location pattern' : null,
          transaction.amount > 500 ? 'High transaction amount' : null,
          'First-time payment method',
        ].filter(Boolean),
        recommendation: transaction.riskScore > 80 ? 'Manual Review Required' : 'Auto-Approve',
        confidence: 95 + Math.random() * 5,
        processingTime: 150 + Math.floor(Math.random() * 100),
      },
      behaviorAnalysis: {
        typicalAmount: 85,
        typicalTime: '12:00 PM',
        frequencyScore: 85,
        consistencyScore: transaction.riskScore < 50 ? 92 : 45,
      },
    };

    setSelectedTransaction(analysis);
    setIsAnalyzing(false);
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (score: number) => {
    if (score < 30) return { variant: 'default' as const, text: 'Low Risk' };
    if (score < 70) return { variant: 'secondary' as const, text: 'Medium Risk' };
    return { variant: 'destructive' as const, text: 'High Risk' };
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">AI Payment Intelligence Live Demo</h2>
        <p className="text-gray-600">
          Experience our ML-powered fraud detection and payment optimization
        </p>
      </div>

      {/* Live Metrics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Processed</p>
                <p className="text-2xl font-bold">
                  {liveMetrics.totalTransactions.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Frauds Prevented</p>
                <p className="text-2xl font-bold text-green-600">{liveMetrics.fraudsPrevented}</p>
              </div>
              <Shield className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Money Saved</p>
                <p className="text-2xl font-bold">
                  ₹{(liveMetrics.moneySaved / 100000).toFixed(1)}L
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">ML Models Active</p>
                <p className="text-2xl font-bold">{liveMetrics.activeModels}</p>
              </div>
              <Brain className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fraud-detection">Fraud Detection</TabsTrigger>
          <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Payment Optimization</TabsTrigger>
        </TabsList>

        {/* Fraud Detection Tab */}
        <TabsContent value="fraud-detection" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Transaction Stream */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Live Transaction Stream
                </CardTitle>
                <CardDescription>Click on a transaction to see AI analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DEMOTRANSACTIONS.map(transaction => (
                  <motion.div
                    key={transaction.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => analyzeTransaction(transaction)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            transaction.status === 'approved' ? 'bg-green-100' : 'bg-yellow-100'
                          }`}
                        >
                          {transaction.status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{transaction.studentName}</p>
                          <p className="text-xs text-gray-500">
                            {transaction.time} • {transaction.paymentMethod}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">₹{transaction.amount}</p>
                        <Badge {...getRiskBadge(transaction.riskScore)} className="text-xs">
                          Risk: {transaction.riskScore}%
                        </Badge>
                      </div>
                    </div>
                    {transaction.anomaly && (
                      <Alert className="mt-2 p-2 bg-yellow-50 border-yellow-200">
                        <AlertDescription className="text-xs">
                          ⚠️ {transaction.anomaly}
                        </AlertDescription>
                      </Alert>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* AI Analysis Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Analysis Engine
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Brain className="h-12 w-12 text-blue-600" />
                    </motion.div>
                    <p className="mt-4 text-gray-600">Analyzing transaction patterns...</p>
                  </div>
                ) : selectedTransaction ? (
                  <div className="space-y-4">
                    {/* Risk Assessment */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Risk Assessment</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Risk Score</span>
                        <span
                          className={`font-bold ${getRiskColor(selectedTransaction.riskScore)}`}
                        >
                          {selectedTransaction.riskScore}%
                        </span>
                      </div>
                      <Progress value={selectedTransaction.riskScore} className="h-2" />
                    </div>

                    {/* ML Analysis */}
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">ML Analysis</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Confidence</span>
                          <span className="font-medium">
                            {selectedTransaction.mlAnalysis.confidence.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Processing Time</span>
                          <span className="font-medium">
                            {selectedTransaction.mlAnalysis.processingTime}ms
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Recommendation</span>
                          <Badge variant="outline" className="text-xs">
                            {selectedTransaction.mlAnalysis.recommendation}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Risk Factors */}
                    {selectedTransaction.mlAnalysis.riskFactors.length > 0 && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium mb-2">Risk Factors Detected</p>
                        <ul className="text-sm text-yellow-800 space-y-1">
                          {selectedTransaction.mlAnalysis.riskFactors.map(
                            (factor: string, i: number) => (
                              <li key={i}>• {factor}</li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Behavior Analysis */}
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Behavioral Analysis</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-600">Consistency</span>
                          <p className="font-medium">
                            {selectedTransaction.behaviorAnalysis.consistencyScore}%
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Frequency</span>
                          <p className="font-medium">
                            {selectedTransaction.behaviorAnalysis.frequencyScore}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <CreditCard className="h-12 w-12 mb-4" />
                    <p>Select a transaction to analyze</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ML Model Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Model Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {MLMETRICS.fraudDetection.accuracy}%
                  </div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {MLMETRICS.fraudDetection.truePositives}%
                  </div>
                  <p className="text-sm text-gray-600">True Positives</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">
                    {MLMETRICS.fraudDetection.falsePositives}%
                  </div>
                  <p className="text-sm text-gray-600">False Positives</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {MLMETRICS.fraudDetection.processingTime}ms
                  </div>
                  <p className="text-sm text-gray-600">Avg. Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Revenue Forecasting */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue Forecasting
                </CardTitle>
                <CardDescription>
                  AI-powered revenue predictions with {MLMETRICS.revenueForecasting.accuracy}%
                  accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#4CAF50"
                      strokeWidth={2}
                      name="Actual Revenue"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#2196F3"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="ML Prediction"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Next Month Forecast</p>
                  <p className="text-2xl font-bold text-blue-600">₹64,500</p>
                  <p className="text-xs text-gray-600">
                    Confidence: {MLMETRICS.revenueForecasting.confidence}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Churn Prediction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Churn Prediction Analysis
                </CardTitle>
                <CardDescription>
                  Identify at-risk customers with {MLMETRICS.churnPrediction.accuracy}% accuracy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Churn Risk Distribution */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Low Risk (0-30%)</span>
                      <span className="font-medium text-green-600">782 users</span>
                    </div>
                    <Progress value={78} className="h-2 bg-green-100" />

                    <div className="flex justify-between text-sm">
                      <span>Medium Risk (30-70%)</span>
                      <span className="font-medium text-yellow-600">156 users</span>
                    </div>
                    <Progress value={15} className="h-2 bg-yellow-100" />

                    <div className="flex justify-between text-sm">
                      <span>High Risk (70-100%)</span>
                      <span className="font-medium text-red-600">62 users</span>
                    </div>
                    <Progress value={6} className="h-2 bg-red-100" />
                  </div>

                  {/* Model Metrics */}
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold">{MLMETRICS.churnPrediction.precision}%</p>
                      <p className="text-xs text-gray-600">Precision</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <p className="text-lg font-bold">{MLMETRICS.churnPrediction.recall}%</p>
                      <p className="text-xs text-gray-600">Recall</p>
                    </div>
                  </div>

                  <Alert className="bg-orange-50 border-orange-200">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-sm">
                      <strong>Alert:</strong> 12 high-value customers show increased churn risk this
                      week
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payment Optimization Tab */}
        <TabsContent value="optimization" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Smart Retry Logic */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  AI-Powered Retry Optimization
                </CardTitle>
                <CardDescription>Intelligent payment retry scheduling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Recovery Rate</span>
                      <span className="text-2xl font-bold text-green-600">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Optimal Retry Times</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-bold text-blue-600">2h</p>
                        <p className="text-xs text-gray-600">First Retry</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-bold text-blue-600">24h</p>
                        <p className="text-xs text-gray-600">Second Retry</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="font-bold text-blue-600">72h</p>
                        <p className="text-xs text-gray-600">Final Retry</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">ML Insights</p>
                    <ul className="text-sm text-purple-800 space-y-1">
                      <li>• Best retry time: Weekday mornings</li>
                      <li>• 23% higher success with email reminder</li>
                      <li>• Wallet payments: 89% first-retry success</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Success Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Payment Method Optimization
                </CardTitle>
                <CardDescription>AI-recommended payment methods by success rate</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentSuccessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="success" fill="#4CAF50" name="Success Rate %" />
                  </BarChart>
                </ResponsiveContainer>

                <Alert className="mt-4 bg-green-50 border-green-200">
                  <Zap className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-sm">
                    <strong>AI Recommendation:</strong> Promote Wallet payments for 2.5% higher
                    success rate
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentIntelligenceDemo;
