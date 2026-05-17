/**
 * HASIVU Platform - Vendor Card Component
 *
 * Epic 2 Story 5: Vendor Marketplace & Supply Chain
 * Interactive vendor display card with comprehensive metrics
 *
 * Features:
 * - Multi-dimensional scoring visualization
 * - Real-time performance indicators
 * - Interactive comparison selection
 * - Risk assessment display
 * - Sustainability badges
 */

'use client';

import React from 'react';
import { Star, MapPin, Truck, Shield, Leaf, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface VendorCardProps {
  vendor: {
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
  };
  selected: boolean;
  onSelect: () => void;
  viewMode: 'grid' | 'list';
  searchCriteria: any;
}

export function VendorCard({
  vendor,
  selected,
  onSelect,
  viewMode,
  searchCriteria: _searchCriteria,
}: VendorCardProps) {
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

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return CheckCircle;
      case 'medium':
        return AlertTriangle;
      case 'high':
        return AlertTriangle;
      default:
        return AlertTriangle;
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalSavings = vendor.pricing.discounts.reduce((sum, discount) => sum + discount.amount, 0);
  const finalPrice = vendor.pricing.totalPrice - totalSavings;

  if (viewMode === 'list') {
    return (
      <Card
        className={cn(
          'transition-all duration-200 hover:shadow-md',
          selected && 'ring-2 ring-blue-500'
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {/* Vendor Info */}
            <div className="flex items-center gap-4">
              <Checkbox checked={selected} onCheckedChange={onSelect} className="h-5 w-5" />

              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${vendor.name}`}
                />
                <AvatarFallback>{vendor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{vendor.name}</h3>
                  {vendor.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {vendor.location}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {vendor.rating.toFixed(1)} ({vendor.totalOrders} orders)
                  </div>
                </div>
              </div>
            </div>

            {/* Match Score */}
            <div className="text-center">
              <div className={cn('text-3xl font-bold', getMatchScoreColor(vendor.matchScore))}>
                {vendor.matchScore}%
              </div>
              <div className="text-sm text-gray-600">Match Score</div>
            </div>

            {/* Pricing */}
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(finalPrice)}</div>
              {totalSavings > 0 && (
                <div className="text-sm text-green-600">Save {formatCurrency(totalSavings)}</div>
              )}
              <div className="text-sm text-gray-600">{vendor.pricing.paymentTerms}</div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{vendor.scores.qualityScore}%</div>
                <div className="text-xs text-gray-600">Quality</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{vendor.scores.deliveryScore}%</div>
                <div className="text-xs text-gray-600">Delivery</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{vendor.capabilities.leadTime}h</div>
                <div className="text-xs text-gray-600">Lead Time</div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="text-center">
              {React.createElement(getRiskIcon(vendor.riskAssessment.overallRisk), {
                className: cn('h-6 w-6 mx-auto', getRiskColor(vendor.riskAssessment.overallRisk)),
              })}
              <div
                className={cn(
                  'text-sm font-medium',
                  getRiskColor(vendor.riskAssessment.overallRisk)
                )}
              >
                {vendor.riskAssessment.overallRisk.toUpperCase()} RISK
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                View Details
              </Button>
              <Button size="sm">Contact</Button>
            </div>
          </div>

          {/* Badges */}
          {(vendor.sustainabilityBadges.length > 0 ||
            vendor.capabilities.certifications.length > 0) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {vendor.sustainabilityBadges.map(badge => (
                  <Badge key={badge} variant="outline" className="text-green-600 border-green-200">
                    <Leaf className="h-3 w-3 mr-1" />
                    {badge}
                  </Badge>
                ))}
                {vendor.capabilities.certifications.slice(0, 3).map(cert => (
                  <Badge key={cert} variant="outline">
                    <Shield className="h-3 w-3 mr-1" />
                    {cert}
                  </Badge>
                ))}
                {vendor.capabilities.certifications.length > 3 && (
                  <Badge variant="outline">
                    +{vendor.capabilities.certifications.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      className={cn(
        'transition-all duration-200 hover:shadow-lg hover:scale-[1.02]',
        selected && 'ring-2 ring-blue-500'
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Checkbox checked={selected} onCheckedChange={onSelect} className="h-5 w-5" />

            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${vendor.name}`} />
              <AvatarFallback>{vendor.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                {vendor.name}
                {vendor.verified && <CheckCircle className="h-4 w-4 text-green-600" />}
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {vendor.location}
              </CardDescription>
            </div>
          </div>

          <div className="text-right">
            <div className={cn('text-2xl font-bold', getMatchScoreColor(vendor.matchScore))}>
              {vendor.matchScore}%
            </div>
            <div className="text-xs text-gray-600">Match</div>
          </div>
        </div>

        {/* Rating and Orders */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{vendor.rating.toFixed(1)}</span>
            <span className="text-sm text-gray-600">({vendor.totalOrders} orders)</span>
          </div>

          <div className="flex items-center gap-1">
            {React.createElement(getRiskIcon(vendor.riskAssessment.overallRisk), {
              className: cn('h-4 w-4', getRiskColor(vendor.riskAssessment.overallRisk)),
            })}
            <span
              className={cn('text-sm font-medium', getRiskColor(vendor.riskAssessment.overallRisk))}
            >
              {vendor.riskAssessment.overallRisk} risk
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Pricing */}
        <div className="text-center py-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold">{formatCurrency(finalPrice)}</div>
          {totalSavings > 0 && (
            <>
              <div className="text-sm text-gray-500 line-through">
                {formatCurrency(vendor.pricing.totalPrice)}
              </div>
              <div className="text-sm text-green-600">Save {formatCurrency(totalSavings)}</div>
            </>
          )}
          <div className="text-xs text-gray-600 mt-1">{vendor.pricing.paymentTerms}</div>
        </div>

        {/* Key Capabilities */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{vendor.capabilities.leadTime}h delivery</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Truck className="h-4 w-4 text-gray-400" />
            <span>Min {vendor.capabilities.minimumOrder}</span>
          </div>
        </div>

        {/* Performance Scores */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Quality</span>
            <span className="text-sm font-medium">{vendor.scores.qualityScore}%</span>
          </div>
          <Progress value={vendor.scores.qualityScore} className="h-2" />

          <div className="flex justify-between items-center">
            <span className="text-sm">Delivery</span>
            <span className="text-sm font-medium">{vendor.scores.deliveryScore}%</span>
          </div>
          <Progress value={vendor.scores.deliveryScore} className="h-2" />

          <div className="flex justify-between items-center">
            <span className="text-sm">Sustainability</span>
            <span className="text-sm font-medium">{vendor.scores.sustainabilityScore}%</span>
          </div>
          <Progress value={vendor.scores.sustainabilityScore} className="h-2" />
        </div>

        {/* Badges */}
        <div className="space-y-2">
          {vendor.sustainabilityBadges.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vendor.sustainabilityBadges.map(badge => (
                <Badge
                  key={badge}
                  variant="outline"
                  className="text-green-600 border-green-200 text-xs"
                >
                  <Leaf className="h-3 w-3 mr-1" />
                  {badge}
                </Badge>
              ))}
            </div>
          )}

          {vendor.capabilities.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {vendor.capabilities.certifications.slice(0, 2).map(cert => (
                <Badge key={cert} variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  {cert}
                </Badge>
              ))}
              {vendor.capabilities.certifications.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{vendor.capabilities.certifications.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Discounts */}
        {vendor.pricing.discounts.length > 0 && (
          <div className="space-y-1">
            {vendor.pricing.discounts.slice(0, 2).map((discount, index) => (
              <div key={index} className="text-xs text-green-600 bg-green-50 p-2 rounded">
                <span className="font-medium">{discount.type}:</span> {discount.description}
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            Details
          </Button>
          <Button size="sm" className="flex-1">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default VendorCard;
