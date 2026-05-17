/**
 * HASIVU Platform - Vendor Comparison Component
 *
 * Epic 2 Story 5: Vendor Marketplace & Supply Chain
 * Side-by-side vendor comparison with detailed metrics
 */

'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Star, MapPin, Truck, Shield } from 'lucide-react';

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

interface VendorComparisonProps {
  vendors: VendorSearchResult[];
  criteria: SearchCriteria;
}

export function VendorComparison({ vendors, criteria }: VendorComparisonProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Comparison Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Vendor Comparison</h3>
          <p className="text-sm text-gray-600">
            Comparing {vendors.length} vendors for {criteria.itemType} ({criteria.quantity} units)
          </p>
        </div>
        <Badge variant="outline">{criteria.urgency} priority</Badge>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-4 font-medium">Vendor</th>
              <th className="text-center p-4 font-medium">Match Score</th>
              <th className="text-center p-4 font-medium">Price</th>
              <th className="text-center p-4 font-medium">Quality</th>
              <th className="text-center p-4 font-medium">Delivery</th>
              <th className="text-center p-4 font-medium">Risk</th>
              <th className="text-center p-4 font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map(vendor => (
              <tr key={vendor.vendorId} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="font-medium flex items-center">
                        {vendor.name}
                        {vendor.verified && <CheckCircle className="w-4 h-4 text-green-600 ml-2" />}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {vendor.location}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className={`text-lg font-bold ${getScoreColor(vendor.matchScore)}`}>
                      {vendor.matchScore}%
                    </div>
                    <Progress value={vendor.matchScore} className="w-16 h-2 mt-1" />
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="font-medium">₹{vendor.pricing.totalPrice.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">₹{vendor.pricing.unitPrice}/unit</div>
                </td>
                <td className="p-4 text-center">
                  <div className={`font-medium ${getScoreColor(vendor.scores.qualityScore)}`}>
                    {vendor.scores.qualityScore}%
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex flex-col items-center">
                    <div className={`font-medium ${getScoreColor(vendor.scores.deliveryScore)}`}>
                      {vendor.scores.deliveryScore}%
                    </div>
                    <div className="text-xs text-gray-600">{vendor.capabilities.leadTime}h</div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <Badge
                    variant={
                      vendor.riskAssessment.overallRisk === 'low' ? 'default' : 'destructive'
                    }
                    className={getRiskColor(vendor.riskAssessment.overallRisk)}
                  >
                    {vendor.riskAssessment.overallRisk}
                  </Badge>
                </td>
                <td className="p-4 text-center">
                  <div className="flex items-center justify-center">
                    <Star className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="font-medium">{vendor.rating}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detailed Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors.map(vendor => (
          <Card key={vendor.vendorId} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{vendor.name}</CardTitle>
                {vendor.verified && (
                  <Badge variant="secondary" className="text-green-600">
                    <Shield className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <CardDescription>{vendor.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{vendor.matchScore}%</div>
                  <div className="text-xs text-gray-600">Match Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{vendor.pricing.totalPrice.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">Total Price</div>
                </div>
              </div>

              {/* Scores Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Quality</span>
                  <span className={getScoreColor(vendor.scores.qualityScore)}>
                    {vendor.scores.qualityScore}%
                  </span>
                </div>
                <Progress value={vendor.scores.qualityScore} className="h-2" />

                <div className="flex justify-between text-sm">
                  <span>Reliability</span>
                  <span className={getScoreColor(vendor.scores.reliabilityScore)}>
                    {vendor.scores.reliabilityScore}%
                  </span>
                </div>
                <Progress value={vendor.scores.reliabilityScore} className="h-2" />

                <div className="flex justify-between text-sm">
                  <span>Sustainability</span>
                  <span className={getScoreColor(vendor.scores.sustainabilityScore)}>
                    {vendor.scores.sustainabilityScore}%
                  </span>
                </div>
                <Progress value={vendor.scores.sustainabilityScore} className="h-2" />
              </div>

              {/* Certifications */}
              {vendor.capabilities.certifications.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Certifications</div>
                  <div className="flex flex-wrap gap-1">
                    {vendor.capabilities.certifications.map(cert => (
                      <Badge key={cert} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sustainability Badges */}
              {vendor.sustainabilityBadges.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Sustainability</div>
                  <div className="flex flex-wrap gap-1">
                    {vendor.sustainabilityBadges.map(badge => (
                      <Badge key={badge} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Risk Assessment */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Level</span>
                  <Badge
                    variant={
                      vendor.riskAssessment.overallRisk === 'low' ? 'default' : 'destructive'
                    }
                  >
                    {vendor.riskAssessment.overallRisk}
                  </Badge>
                </div>
                {vendor.riskAssessment.riskFactors.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600">Risk Factors:</div>
                    <ul className="text-xs text-red-600 mt-1">
                      {vendor.riskAssessment.riskFactors.map((factor, index) => (
                        <li key={index}>• {factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default VendorComparison;
