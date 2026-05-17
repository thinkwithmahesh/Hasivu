/**
 * HASIVU Platform - Vendor Search Interface
 *
 * Epic 2 Story 5: Vendor Marketplace & Supply Chain
 * Advanced vendor search with AI-powered matching and filtering
 *
 * Features:
 * - Intelligent search with 50+ criteria filtering
 * - Real-time vendor scoring and ranking
 * - Interactive comparison tools
 * - Advanced analytics visualization
 * - Mobile-responsive design
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Search, Filter, TrendingUp, GitCompare } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress as _Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider as _Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger as _DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useVendorSearch } from '@/hooks/useVendorSearch';
import { useAnalytics } from '@/hooks/useAnalytics';
import { VendorCard } from './VendorCard';
import { VendorComparison } from './VendorComparison';
import { VendorAnalytics } from './VendorAnalytics';

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

interface _VendorSearchResult {
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

export function VendorSearchInterface() {
  // State management
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({
    categoryId: '',
    itemType: '',
    quantity: 1,
    urgency: 'medium',
    budget: { min: 0, max: 100000, currency: 'INR' },
    location: '',
    deliveryDate: '',
    qualitySpecs: {
      certifications: [],
      standards: [],
      customRequirements: '',
    },
    sustainabilityRequirements: {
      organicRequired: false,
      localPreferred: false,
      packagingRequirements: [],
    },
    riskTolerance: 'moderate',
    diversificationRequired: false,
  });

  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'matchScore' | 'price' | 'rating' | 'distance'>(
    'matchScore'
  );
  const [filterOpen, setFilterOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  // Custom hooks
  const {
    searchResults,
    loading,
    error: _error,
    searchVendors,
    searchMetadata,
  } = useVendorSearch();

  const { trackEvent } = useAnalytics();

  // Handlers
  const handleSearch = useCallback(async () => {
    try {
      await searchVendors({
        criteria: searchCriteria,
      });

      trackEvent('vendor_search', {
        category: searchCriteria.categoryId,
        itemType: searchCriteria.itemType,
        quantity: searchCriteria.quantity,
        urgency: searchCriteria.urgency,
      });

      toast({
        title: 'Search Completed',
        description: `Found ${searchResults?.length || 0} matching vendors`,
      });
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Unable to complete vendor search. Please try again.',
        variant: 'destructive',
      });
    }
  }, [searchCriteria, searchVendors, trackEvent, searchResults]);

  const handleVendorSelect = useCallback((vendorId: string) => {
    setSelectedVendors(prev =>
      prev.includes(vendorId) ? prev.filter(id => id !== vendorId) : [...prev, vendorId]
    );
  }, []);

  const handleCompareVendors = useCallback(() => {
    if (selectedVendors.length < 2) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least 2 vendors to compare.',
        variant: 'destructive',
      });
      return;
    }

    setComparisonOpen(true);
    trackEvent('vendor_comparison', {
      vendorCount: selectedVendors.length,
    });
  }, [selectedVendors, trackEvent]);

  // Computed values
  const sortedResults = useMemo(() => {
    if (!searchResults) return [];

    return [...searchResults].sort((a, b) => {
      switch (sortBy) {
        case 'matchScore':
          return b.matchScore - a.matchScore;
        case 'price':
          return a.pricing.totalPrice - b.pricing.totalPrice;
        case 'rating':
          return b.rating - a.rating;
        case 'distance':
          return a.location.localeCompare(b.location);
        default:
          return 0;
      }
    });
  }, [searchResults, sortBy]);

  const filterCounts = useMemo(() => {
    if (!searchResults) return {};

    return {
      total: searchResults.length,
      premium: searchResults.filter(v => v.matchScore >= 90).length,
      verified: searchResults.filter(v => v.verified).length,
      sustainable: searchResults.filter(v => v.sustainabilityBadges.length > 0).length,
      lowRisk: searchResults.filter(v => v.riskAssessment.overallRisk === 'low').length,
    };
  }, [searchResults]);

  const averageScores = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return null;

    const totals = searchResults.reduce(
      (acc, vendor) => ({
        quality: acc.quality + vendor.scores.qualityScore,
        price: acc.price + vendor.scores.priceScore,
        delivery: acc.delivery + vendor.scores.deliveryScore,
        reliability: acc.reliability + vendor.scores.reliabilityScore,
        sustainability: acc.sustainability + vendor.scores.sustainabilityScore,
        risk: acc.risk + vendor.scores.riskScore,
      }),
      { quality: 0, price: 0, delivery: 0, reliability: 0, sustainability: 0, risk: 0 }
    );

    const count = searchResults.length;
    return {
      quality: Math.round(totals.quality / count),
      price: Math.round(totals.price / count),
      delivery: Math.round(totals.delivery / count),
      reliability: Math.round(totals.reliability / count),
      sustainability: Math.round(totals.sustainability / count),
      risk: Math.round(totals.risk / count),
    };
  }, [searchResults]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Marketplace</h1>
        <p className="text-gray-600">
          Find and connect with the best vendors using AI-powered matching
        </p>
      </div>

      {/* Search Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Smart Vendor Search
          </CardTitle>
          <CardDescription>
            Use AI-powered search to find vendors that match your specific requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Basic Search Fields */}
            <div>
              <Label htmlFor="itemType">Item Type</Label>
              <Input
                id="itemType"
                placeholder="e.g., Fresh Vegetables"
                value={searchCriteria.itemType}
                onChange={e =>
                  setSearchCriteria(prev => ({
                    ...prev,
                    itemType: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="1"
                value={searchCriteria.quantity}
                onChange={e =>
                  setSearchCriteria(prev => ({
                    ...prev,
                    quantity: parseInt(e.target.value) || 1,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="urgency">Urgency</Label>
              <Select
                value={searchCriteria.urgency}
                onValueChange={(value: any) =>
                  setSearchCriteria(prev => ({
                    ...prev,
                    urgency: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Delivery Location</Label>
              <Input
                id="location"
                placeholder="School Address"
                value={searchCriteria.location}
                onChange={e =>
                  setSearchCriteria(prev => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Budget Range */}
          <div className="mb-6">
            <Label>Budget Range (INR)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Input
                type="number"
                placeholder="Min"
                value={searchCriteria.budget.min}
                onChange={e =>
                  setSearchCriteria(prev => ({
                    ...prev,
                    budget: {
                      ...prev.budget,
                      min: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                className="w-32"
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max"
                value={searchCriteria.budget.max}
                onChange={e =>
                  setSearchCriteria(prev => ({
                    ...prev,
                    budget: {
                      ...prev.budget,
                      max: parseInt(e.target.value) || 100000,
                    },
                  }))
                }
                className="w-32"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleSearch}
              disabled={loading || !searchCriteria.itemType}
              className="flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              {loading ? 'Searching...' : 'Search Vendors'}
            </Button>

            <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                  <SheetTitle>Advanced Search Filters</SheetTitle>
                  <SheetDescription>Refine your search with specific requirements</SheetDescription>
                </SheetHeader>

                <AdvancedFilters criteria={searchCriteria} onChange={setSearchCriteria} />
              </SheetContent>
            </Sheet>

            {selectedVendors.length > 0 && (
              <Button
                variant="outline"
                onClick={handleCompareVendors}
                className="flex items-center gap-2"
              >
                <GitCompare className="h-4 w-4" />
                Compare ({selectedVendors.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults && (
        <>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Search Results ({searchResults.length})</h2>

              {searchMetadata && <Badge variant="outline">{searchMetadata.executionTime}ms</Badge>}
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matchScore">Best Match</SelectItem>
                  <SelectItem value="price">Lowest Price</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="distance">Nearest Location</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  List
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalyticsOpen(true)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Analytics
              </Button>
            </div>
          </div>

          {/* Summary Statistics */}
          {averageScores && (
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{filterCounts.total}</div>
                  <div className="text-sm text-gray-600">Total Vendors</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{filterCounts.premium}</div>
                  <div className="text-sm text-gray-600">Premium (90+)</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{filterCounts.verified}</div>
                  <div className="text-sm text-gray-600">Verified</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{filterCounts.sustainable}</div>
                  <div className="text-sm text-gray-600">Sustainable</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{filterCounts.lowRisk}</div>
                  <div className="text-sm text-gray-600">Low Risk</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{averageScores.quality}</div>
                  <div className="text-sm text-gray-600">Avg Quality</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Vendor Results */}
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {sortedResults.map(vendor => (
              <VendorCard
                key={vendor.vendorId}
                vendor={vendor}
                selected={selectedVendors.includes(vendor.vendorId)}
                onSelect={() => handleVendorSelect(vendor.vendorId)}
                viewMode={viewMode}
                searchCriteria={searchCriteria}
              />
            ))}
          </div>

          {/* Empty State */}
          {sortedResults.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No vendors found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
                <Button variant="outline" onClick={() => setFilterOpen(true)}>
                  Adjust Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Comparison Modal */}
      <Dialog open={comparisonOpen} onOpenChange={setComparisonOpen}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Vendor Comparison</DialogTitle>
            <DialogDescription>Compare selected vendors across all criteria</DialogDescription>
          </DialogHeader>
          <VendorComparison
            vendors={sortedResults.filter(v => selectedVendors.includes(v.vendorId))}
            criteria={searchCriteria}
          />
        </DialogContent>
      </Dialog>

      {/* Analytics Modal */}
      <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Search Analytics</DialogTitle>
            <DialogDescription>
              Detailed insights about your vendor search results
            </DialogDescription>
          </DialogHeader>
          <VendorAnalytics
            results={searchResults || []}
            criteria={searchCriteria}
            metadata={searchMetadata}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Advanced Filters Component
function AdvancedFilters({
  criteria,
  onChange,
}: {
  criteria: SearchCriteria;
  onChange: (criteria: SearchCriteria) => void;
}) {
  return (
    <div className="space-y-6 mt-6">
      <Tabs defaultValue="quality" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="sustainability">Sustainability</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
        </TabsList>

        <TabsContent value="quality" className="space-y-4">
          <div>
            <Label>Required Certifications</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {['ISO 22000', 'HACCP', 'Organic', 'Fair Trade', 'Halal', 'FDA'].map(cert => (
                <div key={cert} className="flex items-center space-x-2">
                  <Checkbox
                    id={cert}
                    checked={criteria.qualitySpecs.certifications.includes(cert)}
                    onCheckedChange={checked => {
                      const certs = checked
                        ? [...criteria.qualitySpecs.certifications, cert]
                        : criteria.qualitySpecs.certifications.filter(c => c !== cert);

                      onChange({
                        ...criteria,
                        qualitySpecs: {
                          ...criteria.qualitySpecs,
                          certifications: certs,
                        },
                      });
                    }}
                  />
                  <Label htmlFor={cert} className="text-sm">
                    {cert}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="customRequirements">Custom Requirements</Label>
            <textarea
              id="customRequirements"
              className="w-full mt-2 p-2 border rounded-md"
              rows={3}
              placeholder="Describe any specific quality requirements..."
              value={criteria.qualitySpecs.customRequirements}
              onChange={e =>
                onChange({
                  ...criteria,
                  qualitySpecs: {
                    ...criteria.qualitySpecs,
                    customRequirements: e.target.value,
                  },
                })
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="sustainability" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="organic"
                checked={criteria.sustainabilityRequirements.organicRequired}
                onCheckedChange={checked =>
                  onChange({
                    ...criteria,
                    sustainabilityRequirements: {
                      ...criteria.sustainabilityRequirements,
                      organicRequired: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="organic">Organic certification required</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="local"
                checked={criteria.sustainabilityRequirements.localPreferred}
                onCheckedChange={checked =>
                  onChange({
                    ...criteria,
                    sustainabilityRequirements: {
                      ...criteria.sustainabilityRequirements,
                      localPreferred: checked as boolean,
                    },
                  })
                }
              />
              <Label htmlFor="local">Prefer local suppliers</Label>
            </div>

            <div>
              <Label>Maximum Carbon Footprint (kg CO2)</Label>
              <Input
                type="number"
                placeholder="e.g., 5.0"
                value={criteria.sustainabilityRequirements.carbonFootprintLimit || ''}
                onChange={e =>
                  onChange({
                    ...criteria,
                    sustainabilityRequirements: {
                      ...criteria.sustainabilityRequirements,
                      carbonFootprintLimit: parseFloat(e.target.value) || undefined,
                    },
                  })
                }
                className="mt-2"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div>
            <Label>Risk Tolerance</Label>
            <Select
              value={criteria.riskTolerance}
              onValueChange={(value: any) =>
                onChange({
                  ...criteria,
                  riskTolerance: value,
                })
              }
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="diversification"
              checked={criteria.diversificationRequired}
              onCheckedChange={checked =>
                onChange({
                  ...criteria,
                  diversificationRequired: checked as boolean,
                })
              }
            />
            <Label htmlFor="diversification">Require vendor diversification</Label>
          </div>
        </TabsContent>

        <TabsContent value="delivery" className="space-y-4">
          <div>
            <Label htmlFor="deliveryDate">Preferred Delivery Date</Label>
            <Input
              id="deliveryDate"
              type="date"
              value={criteria.deliveryDate}
              onChange={e =>
                onChange({
                  ...criteria,
                  deliveryDate: e.target.value,
                })
              }
              className="mt-2"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default VendorSearchInterface;
