/**
 * HASIVU Platform - Vendor Analytics Component
 *
 * Epic 2 Story 5: Vendor Marketplace & Supply Chain
 * Advanced analytics and insights for vendor search results
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Award, AlertTriangle, CheckCircle } from 'lucide-react';

interface VendorSearchResult {
  vendorId: string;
  name: string;
  matchScore: number;
  scores: {
    qualityScore: number;
    priceScore: number;
    deliveryScore: number;
    reliabilityScore: number;
    sustainabilityScore: number;
    riskScore: number;
  };
  pricing: {
    unitPrice: number;
    totalPrice: number;
    discounts: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
    paymentTerms: string;
  };
  capabilities: {
    capacity: number;
    leadTime: number;
    minimumOrder: number;
    maximumOrder: number;
    certifications: string[];
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high';
    riskFactors: string[];
  };
  location: string;
  rating: number;
  totalOrders: number;
  verified: boolean;
  sustainabilityBadges: string[];
}

interface SearchCriteria {
  categoryId: string;
  itemType: string;
  quantity: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  location: string;
  deliveryDate: string;
  qualitySpecs: {
    certifications: string[];
    standards: string[];
    customRequirements: string;
  };
  sustainabilityRequirements: {
    organicRequired: boolean;
    localPreferred: boolean;
    carbonFootprintLimit?: number;
    packagingRequirements: string[];
  };
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  diversificationRequired: boolean;
}

interface SearchMetadata {
  executionTime: number;
  totalResults: number;
  searchId: string;
}

interface VendorAnalyticsProps {
  results: VendorSearchResult[];
  criteria: SearchCriteria;
  metadata: SearchMetadata | null;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function VendorAnalytics({ results, criteria, metadata }: VendorAnalyticsProps) {
  // Calculate analytics data
  const scoreDistribution = React.useMemo(() => {
    const ranges = [
      { name: '90-100%', min: 90, max: 100, count: 0 },
      { name: '80-89%', min: 80, max: 89, count: 0 },
      { name: '70-79%', min: 70, max: 79, count: 0 },
      { name: '60-69%', min: 60, max: 69, count: 0 },
      { name: '<60%', min: 0, max: 59, count: 0 },
    ];

    results.forEach(vendor => {
      const range = ranges.find(r => vendor.matchScore >= r.min && vendor.matchScore <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [results]);

  const priceVsQuality = React.useMemo(() => {
    return results.map(vendor => ({
      name: vendor.name.slice(0, 10),
      price: vendor.pricing.totalPrice,
      quality: vendor.scores.qualityScore,
      match: vendor.matchScore,
    }));
  }, [results]);

  const riskDistribution = React.useMemo(() => {
    const riskCounts = { low: 0, medium: 0, high: 0 };
    results.forEach(vendor => {
      riskCounts[vendor.riskAssessment.overallRisk]++;
    });

    return Object.entries(riskCounts).map(([risk, count]) => ({
      name: risk.charAt(0).toUpperCase() + risk.slice(1),
      value: count,
      color: risk === 'low' ? '#10b981' : risk === 'medium' ? '#f59e0b' : '#ef4444',
    }));
  }, [results]);

  const certificationStats = React.useMemo(() => {
    const certCounts: { [key: string]: number } = {};
    results.forEach(vendor => {
      vendor.capabilities.certifications.forEach(cert => {
        certCounts[cert] = (certCounts[cert] || 0) + 1;
      });
    });

    return Object.entries(certCounts)
      .map(([cert, count]) => ({ name: cert, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [results]);

  const radarData = React.useMemo(() => {
    if (results.length === 0) return [];

    const avgScores = results.reduce(
      (acc, vendor) => ({
        quality: acc.quality + vendor.scores.qualityScore,
        price: acc.price + vendor.scores.priceScore,
        delivery: acc.delivery + vendor.scores.deliveryScore,
        reliability: acc.reliability + vendor.scores.reliabilityScore,
        sustainability: acc.sustainability + vendor.scores.sustainabilityScore,
        risk: acc.risk + (100 - vendor.scores.riskScore), // Invert risk score
      }),
      { quality: 0, price: 0, delivery: 0, reliability: 0, sustainability: 0, risk: 0 }
    );

    const count = results.length;
    return [
      { subject: 'Quality', A: Math.round(avgScores.quality / count) },
      { subject: 'Price', A: Math.round(avgScores.price / count) },
      { subject: 'Delivery', A: Math.round(avgScores.delivery / count) },
      { subject: 'Reliability', A: Math.round(avgScores.reliability / count) },
      { subject: 'Sustainability', A: Math.round(avgScores.sustainability / count) },
      { subject: 'Risk Management', A: Math.round(avgScores.risk / count) },
    ];
  }, [results]);

  const topPerformers = React.useMemo(() => {
    return [...results].sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
  }, [results]);

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Search Analytics</h3>
          <p className="text-sm text-gray-600">
            Detailed insights from {results.length} vendor matches
          </p>
        </div>
        {metadata && (
          <div className="text-right">
            <div className="text-sm text-gray-600">Search Time</div>
            <div className="font-medium">{metadata.executionTime}ms</div>
          </div>
        )}
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {Math.round(
                        results.reduce((sum, v) => sum + v.matchScore, 0) / results.length
                      )}
                      %
                    </div>
                    <div className="text-xs text-gray-600">Avg Match Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {results.filter(v => v.verified).length}
                    </div>
                    <div className="text-xs text-gray-600">Verified Vendors</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {results.filter(v => v.riskAssessment.overallRisk === 'low').length}
                    </div>
                    <div className="text-xs text-gray-600">Low Risk</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      ₹
                      {Math.round(
                        results.reduce((sum, v) => sum + v.pricing.totalPrice, 0) / results.length
                      ).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Avg Price</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Match Score Distribution</CardTitle>
              <CardDescription>How vendors scored against your criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Risk Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
              <CardDescription>Risk levels across all matched vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Price vs Quality Scatter */}
          <Card>
            <CardHeader>
              <CardTitle>Price vs Quality Analysis</CardTitle>
              <CardDescription>Trade-off between cost and quality scores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={priceVsQuality}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="price"
                    name="Price"
                    domain={['dataMin - 100', 'dataMax + 100']}
                  />
                  <YAxis type="number" dataKey="quality" name="Quality Score" domain={[0, 100]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value, name) => [
                      name === 'price' ? `₹${value}` : `${value}%`,
                      name === 'price' ? 'Price' : 'Quality Score',
                    ]}
                  />
                  <Scatter dataKey="quality" fill="#3b82f6" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vendors</CardTitle>
              <CardDescription>Best matches based on overall score</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPerformers.map((vendor, index) => (
                  <div
                    key={vendor.vendorId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{vendor.name}</div>
                        <div className="text-sm text-gray-600">{vendor.location}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{vendor.matchScore}%</div>
                      <div className="text-sm text-gray-600">
                        ₹{vendor.pricing.totalPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-6">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quality Dimensions</CardTitle>
              <CardDescription>Average scores across all quality criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 100]} />
                  <Radar
                    name="Average Score"
                    dataKey="A"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader>
              <CardTitle>Certification Distribution</CardTitle>
              <CardDescription>Most common certifications among vendors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {certificationStats.map((cert, index) => (
                  <div key={cert.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{cert.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Progress value={(cert.count / results.length) * 100} className="w-20 h-2" />
                      <span className="text-sm text-gray-600 w-8">{cert.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Insights based on your search criteria</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-blue-900">Best Value Option</div>
                    <div className="text-sm text-blue-700">
                      Consider vendors with quality scores above 85% and prices within 10% of your
                      budget minimum.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900">Risk Mitigation</div>
                    <div className="text-sm text-green-700">
                      {results.filter(v => v.riskAssessment.overallRisk === 'low').length} vendors
                      have low risk profiles. Consider diversifying across multiple suppliers.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-900">Quality Considerations</div>
                    <div className="text-sm text-yellow-700">
                      {results.filter(v => v.scores.qualityScore < 70).length} vendors scored below
                      70% on quality. Review their certifications before proceeding.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Criteria Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Search Criteria Summary</CardTitle>
              <CardDescription>Your requirements and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-2">Basic Requirements</div>
                  <div className="space-y-1 text-sm">
                    <div>
                      Item: <span className="font-medium">{criteria.itemType}</span>
                    </div>
                    <div>
                      Quantity: <span className="font-medium">{criteria.quantity} units</span>
                    </div>
                    <div>
                      Urgency: <span className="font-medium capitalize">{criteria.urgency}</span>
                    </div>
                    <div>
                      Budget:{' '}
                      <span className="font-medium">
                        ₹{criteria.budget.min} - ₹{criteria.budget.max}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Quality Preferences</div>
                  <div className="space-y-1 text-sm">
                    <div>
                      Certifications:{' '}
                      <span className="font-medium">
                        {criteria.qualitySpecs.certifications.length > 0
                          ? criteria.qualitySpecs.certifications.join(', ')
                          : 'None specified'}
                      </span>
                    </div>
                    <div>
                      Sustainability:{' '}
                      <span className="font-medium">
                        {criteria.sustainabilityRequirements.organicRequired
                          ? 'Organic required'
                          : 'Not required'}
                      </span>
                    </div>
                    <div>
                      Risk Tolerance:{' '}
                      <span className="font-medium capitalize">{criteria.riskTolerance}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VendorAnalytics;
