'use client';

import { useState, useCallback } from 'react';

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

interface SearchMetadata {
  executionTime: number;
  totalResults: number;
  searchId: string;
}

export function useVendorSearch() {
  const [searchResults, setSearchResults] = useState<VendorSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMetadata, setSearchMetadata] = useState<SearchMetadata | null>(null);

  const searchVendors = useCallback(async ({ criteria }: { criteria: SearchCriteria }) => {
    setLoading(true);
    setError(null);

    try {
      const startTime = Date.now();
      const params = new URLSearchParams();
      if (criteria.location) params.set('location', criteria.location);
      if (criteria.itemType) params.set('itemType', criteria.itemType);

      const response = await fetch(`/api/inventory/suppliers?${params.toString()}`, {
        credentials: 'include',
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error?.message || payload?.error || 'Vendor search failed');
      }

      const suppliers: any[] = Array.isArray(payload.data) ? payload.data : [];
      const results: VendorSearchResult[] = suppliers
        .map(supplier => mapSupplierToSearchResult(supplier, criteria))
        .filter(result => {
          const withinBudget =
            criteria.budget.max <= 0 || result.pricing.unitPrice <= criteria.budget.max;
          const locationMatches =
            !criteria.location ||
            result.location.toLowerCase().includes(criteria.location.toLowerCase());
          return withinBudget && locationMatches;
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      const executionTime = Date.now() - startTime;

      setSearchResults(results);
      setSearchMetadata({
        executionTime,
        totalResults: results.length,
        searchId: payload.requestId || `vendor-search-${Date.now()}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setSearchResults(null);
      setSearchMetadata(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    searchResults,
    loading,
    error,
    searchVendors,
    searchMetadata,
  };
}

function mapSupplierToSearchResult(supplier: any, criteria: SearchCriteria): VendorSearchResult {
  const rating = Number(supplier.rating ?? supplier.qualityRating ?? 4);
  const reliability = Number(supplier.reliabilityScore ?? supplier.onTimeDeliveryRate ?? 80);
  const leadTime = Number(supplier.leadTimeHours ?? supplier.leadTime ?? 48);
  const unitPrice = Number(
    supplier.unitPrice ?? supplier.averageUnitPrice ?? criteria.budget.min ?? 0
  );
  const certifications = parseStringList(supplier.certifications);
  const sustainabilityBadges = parseStringList(supplier.sustainabilityBadges);
  const riskFactors = buildRiskFactors(supplier, criteria, leadTime, certifications);
  const riskScore = Math.min(100, riskFactors.length * 20 + Math.max(0, 60 - reliability));
  const deliveryScore = Math.max(0, Math.min(100, 100 - Math.max(0, leadTime - 24)));
  const qualityScore = Math.max(0, Math.min(100, rating * 20));
  const sustainabilityScore = calculateSustainabilityScore(
    criteria,
    sustainabilityBadges,
    supplier
  );
  const priceScore = calculatePriceScore(criteria, unitPrice);
  const matchScore = Math.round(
    qualityScore * 0.25 +
      priceScore * 0.2 +
      deliveryScore * 0.2 +
      reliability * 0.2 +
      sustainabilityScore * 0.1 +
      (100 - riskScore) * 0.05
  );

  return {
    vendorId: supplier.id || supplier.vendorId,
    name: supplier.name || supplier.companyName || 'Unnamed supplier',
    matchScore,
    scores: {
      qualityScore,
      priceScore,
      deliveryScore,
      reliabilityScore: reliability,
      sustainabilityScore,
      riskScore,
    },
    pricing: {
      unitPrice,
      totalPrice: unitPrice * Math.max(criteria.quantity, 1),
      discounts: parseDiscounts(supplier.discounts),
      paymentTerms: supplier.paymentTerms || 'Configured by supplier',
    },
    capabilities: {
      capacity: Number(supplier.capacity ?? supplier.monthlyCapacity ?? criteria.quantity),
      leadTime,
      minimumOrder: Number(supplier.minimumOrder ?? 1),
      maximumOrder: Number(supplier.maximumOrder ?? supplier.capacity ?? criteria.quantity),
      certifications,
    },
    riskAssessment: {
      overallRisk: riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low',
      riskFactors,
    },
    location: supplier.location || supplier.city || '',
    rating,
    totalOrders: Number(supplier.totalOrders ?? supplier.orderCount ?? 0),
    verified: Boolean(supplier.verified ?? supplier.isVerified ?? false),
    sustainabilityBadges,
  };
}

function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : value.split(',').map(item => item.trim());
    } catch {
      return value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

function parseDiscounts(value: unknown): VendorSearchResult['pricing']['discounts'] {
  if (!value) return [];
  if (Array.isArray(value)) return value as VendorSearchResult['pricing']['discounts'];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function calculatePriceScore(criteria: SearchCriteria, unitPrice: number): number {
  if (!criteria.budget.max || unitPrice <= 0) return 70;
  if (unitPrice <= criteria.budget.min) return 100;
  if (unitPrice >= criteria.budget.max) return 40;
  const range = Math.max(criteria.budget.max - criteria.budget.min, 1);
  return Math.round(100 - ((unitPrice - criteria.budget.min) / range) * 60);
}

function calculateSustainabilityScore(
  criteria: SearchCriteria,
  badges: string[],
  supplier: any
): number {
  let score = 60;
  const normalized = badges.map(badge => badge.toLowerCase());
  if (criteria.sustainabilityRequirements.organicRequired) {
    score += normalized.some(badge => badge.includes('organic')) ? 25 : -30;
  }
  if (criteria.sustainabilityRequirements.localPreferred) {
    score += Boolean(supplier.isLocal || normalized.some(badge => badge.includes('local')))
      ? 15
      : 0;
  }
  return Math.max(0, Math.min(100, score));
}

function buildRiskFactors(
  supplier: any,
  criteria: SearchCriteria,
  leadTime: number,
  certifications: string[]
): string[] {
  const factors: string[] = [];
  if (criteria.urgency === 'critical' && leadTime > 24) {
    factors.push('Lead time may not satisfy critical urgency');
  }
  const missingCertifications = criteria.qualitySpecs.certifications.filter(
    required => !certifications.some(cert => cert.toLowerCase() === required.toLowerCase())
  );
  if (missingCertifications.length > 0) {
    factors.push(`Missing certifications: ${missingCertifications.join(', ')}`);
  }
  if (supplier.status && supplier.status !== 'active') {
    factors.push(`Supplier status is ${supplier.status}`);
  }
  return factors;
}
