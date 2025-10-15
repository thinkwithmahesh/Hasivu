"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProcurementEngine = void 0;
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const ProcurementCriteriaSchema = zod_1.z.object({
    schoolId: zod_1.z.string(),
    categoryId: zod_1.z.string(),
    itemType: zod_1.z.string(),
    quantity: zod_1.z.number().positive(),
    urgency: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
    budget: zod_1.z.object({
        min: zod_1.z.number().min(0),
        max: zod_1.z.number().positive(),
        currency: zod_1.z.string().default('INR')
    }),
    qualitySpecs: zod_1.z.object({
        certifications: zod_1.z.array(zod_1.z.string()).optional(),
        standards: zod_1.z.array(zod_1.z.string()).optional(),
        customRequirements: zod_1.z.string().optional()
    }),
    deliveryRequirements: zod_1.z.object({
        location: zod_1.z.string(),
        preferredDate: zod_1.z.string(),
        maxDeliveryTime: zod_1.z.number(),
        specialHandling: zod_1.z.array(zod_1.z.string()).optional()
    }),
    sustainabilityRequirements: zod_1.z.object({
        organicRequired: zod_1.z.boolean().default(false),
        localPreferred: zod_1.z.boolean().default(false),
        carbonFootprintLimit: zod_1.z.number().optional(),
        packagingRequirements: zod_1.z.array(zod_1.z.string()).optional()
    }),
    riskTolerance: zod_1.z.enum(['conservative', 'moderate', 'aggressive']),
    diversificationRequired: zod_1.z.boolean().default(false)
});
const VendorMatchingResultSchema = zod_1.z.object({
    vendorId: zod_1.z.string(),
    matchScore: zod_1.z.number().min(0).max(100),
    scores: zod_1.z.object({
        qualityScore: zod_1.z.number().min(0).max(100),
        priceScore: zod_1.z.number().min(0).max(100),
        deliveryScore: zod_1.z.number().min(0).max(100),
        reliabilityScore: zod_1.z.number().min(0).max(100),
        sustainabilityScore: zod_1.z.number().min(0).max(100),
        riskScore: zod_1.z.number().min(0).max(100),
        historicalPerformance: zod_1.z.number().min(0).max(100),
        financialStability: zod_1.z.number().min(0).max(100)
    }),
    pricing: zod_1.z.object({
        unitPrice: zod_1.z.number(),
        totalPrice: zod_1.z.number(),
        discounts: zod_1.z.array(zod_1.z.object({
            type: zod_1.z.string(),
            amount: zod_1.z.number(),
            description: zod_1.z.string()
        })).optional(),
        paymentTerms: zod_1.z.string()
    }),
    capabilities: zod_1.z.object({
        capacity: zod_1.z.number(),
        leadTime: zod_1.z.number(),
        minimumOrder: zod_1.z.number(),
        maximumOrder: zod_1.z.number(),
        certifications: zod_1.z.array(zod_1.z.string())
    }),
    riskAssessment: zod_1.z.object({
        overallRisk: zod_1.z.enum(['low', 'medium', 'high']),
        riskFactors: zod_1.z.array(zod_1.z.string()),
        mitigationStrategies: zod_1.z.array(zod_1.z.string())
    }),
    recommendations: zod_1.z.array(zod_1.z.string())
});
const DemandForecastSchema = zod_1.z.object({
    schoolId: zod_1.z.string(),
    itemType: zod_1.z.string(),
    timeframe: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    forecast: zod_1.z.object({
        predicted_demand: zod_1.z.number(),
        confidence_interval: zod_1.z.object({
            lower: zod_1.z.number(),
            upper: zod_1.z.number(),
            confidence_level: zod_1.z.number().min(0).max(1)
        }),
        trend: zod_1.z.enum(['increasing', 'decreasing', 'stable', 'seasonal']),
        seasonality_factors: zod_1.z.array(zod_1.z.object({
            factor: zod_1.z.string(),
            impact: zod_1.z.number(),
            period: zod_1.z.string()
        }))
    }),
    external_factors: zod_1.z.object({
        weather_impact: zod_1.z.number().optional(),
        event_impact: zod_1.z.number().optional(),
        market_trends: zod_1.z.array(zod_1.z.string()).optional(),
        economic_indicators: zod_1.z.object({
            inflation_rate: zod_1.z.number().optional(),
            commodity_prices: zod_1.z.record(zod_1.z.string(), zod_1.z.number()).optional()
        }).optional()
    }),
    recommendations: zod_1.z.object({
        optimal_order_quantity: zod_1.z.number(),
        optimal_order_timing: zod_1.z.string(),
        safety_stock_level: zod_1.z.number(),
        cost_optimization_suggestions: zod_1.z.array(zod_1.z.string())
    })
});
const RFPGenerationConfigSchema = zod_1.z.object({
    schoolId: zod_1.z.string(),
    procurementId: zod_1.z.string(),
    template: zod_1.z.enum(['standard', 'food_service', 'equipment', 'services', 'maintenance']),
    urgency: zod_1.z.enum(['standard', 'expedited', 'emergency']),
    evaluationCriteria: zod_1.z.object({
        price_weight: zod_1.z.number().min(0).max(1),
        quality_weight: zod_1.z.number().min(0).max(1),
        delivery_weight: zod_1.z.number().min(0).max(1),
        sustainability_weight: zod_1.z.number().min(0).max(1),
        innovation_weight: zod_1.z.number().min(0).max(1)
    }),
    customRequirements: zod_1.z.array(zod_1.z.string()).optional(),
    complianceRequirements: zod_1.z.array(zod_1.z.string()).optional()
});
class AIProcurementEngine {
    db;
    cache;
    notifications;
    vendorIntelligence;
    supplyChain;
    modelConfig = {
        vendorMatching: {
            algorithm: 'ensemble_gradient_boosting',
            features: 50,
            weights: {
                historical_performance: 0.25,
                price_competitiveness: 0.20,
                quality_metrics: 0.20,
                delivery_reliability: 0.15,
                financial_stability: 0.10,
                sustainability_score: 0.10
            }
        },
        demandForecasting: {
            algorithm: 'lstm_with_external_regressors',
            lookback_window: 90,
            forecast_horizon: 30,
            external_features: ['weather', 'events', 'holidays', 'market_trends']
        },
        priceOptimization: {
            algorithm: 'dynamic_pricing_reinforcement_learning',
            update_frequency: 'hourly',
            market_sensitivity: 0.8
        }
    };
    constructor(db, cache, notifications, vendorIntelligence, supplyChain) {
        this.db = db;
        this.cache = cache;
        this.notifications = notifications;
        this.vendorIntelligence = vendorIntelligence;
        this.supplyChain = supplyChain;
    }
    async generateProcurementRecommendations(criteria) {
        const startTime = Date.now();
        try {
            const validatedCriteria = ProcurementCriteriaSchema.parse(criteria);
            const demandForecast = await this.generateDemandForecast(validatedCriteria.schoolId, validatedCriteria.itemType);
            const vendors = await this.findOptimalVendors(validatedCriteria);
            const optimizedTiming = await this.calculateOptimalTiming(validatedCriteria, demandForecast);
            const riskAssessment = await this.assessProcurementRisks(validatedCriteria, vendors);
            const cacheKey = `procurement_recommendations_${validatedCriteria.schoolId}_${validatedCriteria.itemType}`;
            await this.cache.set(cacheKey, {
                vendors,
                demandForecast,
                optimizedTiming,
                riskAssessment
            }, { ttl: 3600 });
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('AI Procurement recommendations generated', {
                schoolId: validatedCriteria.schoolId,
                itemType: validatedCriteria.itemType,
                vendorsEvaluated: vendors.length,
                executionTime,
                cacheKey
            });
            return {
                vendors,
                demandForecast,
                optimizedTiming,
                riskAssessment
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating procurement recommendations', {
                error: error instanceof Error ? (error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)) : 'Unknown error',
                criteria,
                executionTime: Date.now() - startTime
            });
            throw error;
        }
    }
    async findOptimalVendors(criteria) {
        try {
            const vendorPool = await this.db.query(`
        SELECT DISTINCT v.*, vp.*, vm.* FROM vendors v
        LEFT JOIN vendor_profiles vp ON v.id = vp.vendor_id
        LEFT JOIN vendor_metrics vm ON v.id = vm.vendor_id
        WHERE v.is_active = true
        AND v.categories LIKE '%${criteria.categoryId}%'
        AND v.service_areas LIKE '%${criteria.deliveryRequirements.location}%'
        ORDER BY vm.overall_score DESC
        LIMIT 100
      `);
            const scoredVendors = await Promise.all(vendorPool.map((vendor) => this.calculateVendorMatchScore(vendor, criteria)));
            const qualifiedVendors = scoredVendors
                .filter(vendor => vendor.matchScore >= 60)
                .sort((a, b) => b.matchScore - a.matchScore)
                .slice(0, 10);
            if (criteria.diversificationRequired) {
                return this.applyVendorDiversification(qualifiedVendors, criteria);
            }
            return qualifiedVendors;
        }
        catch (error) {
            logger_1.logger.error('Error finding optimal vendors', { error, criteria });
            throw new Error('Failed to find optimal vendors');
        }
    }
    async calculateVendorMatchScore(vendor, criteria) {
        try {
            const vendorIntelligence = await this.vendorIntelligence.getVendorProfile(vendor.id);
            const qualityScore = this.calculateQualityScore(vendor, criteria);
            const priceScore = this.calculatePriceScore(vendor, criteria);
            const deliveryScore = this.calculateDeliveryScore(vendor, criteria);
            const reliabilityScore = this.calculateReliabilityScore(vendor, vendorIntelligence);
            const sustainabilityScore = this.calculateSustainabilityScore(vendor, criteria);
            const riskScore = this.calculateRiskScore(vendor, vendorIntelligence);
            const historicalPerformance = this.calculateHistoricalPerformance(vendor);
            const financialStability = this.calculateFinancialStability(vendor, vendorIntelligence);
            const weights = this.modelConfig.vendorMatching.weights;
            const matchScore = Math.round((historicalPerformance * weights.historical_performance) +
                (priceScore * weights.price_competitiveness) +
                (qualityScore * weights.quality_metrics) +
                (deliveryScore * weights.delivery_reliability) +
                (financialStability * weights.financial_stability) +
                (sustainabilityScore * weights.sustainability_score));
            const pricing = await this.generatePricingEstimate(vendor, criteria);
            const capabilities = {
                capacity: vendor.capacity || 1000,
                leadTime: vendor.lead_time_hours || 24,
                minimumOrder: vendor.minimum_order_value || 100,
                maximumOrder: vendor.maximum_order_value || 100000,
                certifications: vendor.certifications ? JSON.parse(vendor.certifications) : []
            };
            const riskAssessment = await this.generateVendorRiskAssessment(vendor, vendorIntelligence);
            const recommendations = this.generateVendorRecommendations(vendor, criteria, {
                qualityScore,
                priceScore,
                deliveryScore,
                reliabilityScore,
                sustainabilityScore,
                riskScore
            });
            return {
                vendorId: vendor.id,
                matchScore,
                scores: {
                    qualityScore,
                    priceScore,
                    deliveryScore,
                    reliabilityScore,
                    sustainabilityScore,
                    riskScore,
                    historicalPerformance,
                    financialStability
                },
                pricing,
                capabilities,
                riskAssessment,
                recommendations
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating vendor match score', { error, vendorId: vendor.id });
            throw error;
        }
    }
    async generateDemandForecast(schoolId, itemType) {
        try {
            const cacheKey = `demand_forecast_${schoolId}_${itemType}`;
            const cached = await this.cache.get(cacheKey);
            if (cached)
                return cached;
            const historicalData = await this.db.query(`
        SELECT
          date_trunc('day', created_at) as date,
          SUM(quantity) as demand,
          AVG(unit_price) as avg_price
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        WHERE o.school_id = ? AND mi.category = ?
        AND o.created_at >= NOW() - INTERVAL 90 DAY
        GROUP BY date_trunc('day', created_at)
        ORDER BY date
      `, [schoolId, itemType]);
            const externalFactors = await this.getExternalFactors(schoolId);
            const forecast = await this.applyDemandForecastingModel(historicalData, externalFactors, itemType);
            const result = {
                schoolId,
                itemType,
                timeframe: 'daily',
                forecast: {
                    predicted_demand: forecast.prediction,
                    confidence_interval: {
                        lower: forecast.prediction * 0.85,
                        upper: forecast.prediction * 1.15,
                        confidence_level: 0.90
                    },
                    trend: forecast.trend,
                    seasonality_factors: forecast.seasonality
                },
                external_factors: externalFactors,
                recommendations: {
                    optimal_order_quantity: Math.ceil(forecast.prediction * 7),
                    optimal_order_timing: forecast.optimal_timing,
                    safety_stock_level: Math.ceil(forecast.prediction * 0.2),
                    cost_optimization_suggestions: forecast.cost_suggestions
                }
            };
            await this.cache.set(cacheKey, result, { ttl: 14400 });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error generating demand forecast', { error, schoolId, itemType });
            throw error;
        }
    }
    async calculateOptimalTiming(criteria, forecast) {
        try {
            const demandPattern = forecast.forecast.trend;
            const seasonality = forecast.forecast.seasonality_factors;
            const priceData = await this.getMarketPriceTrends(criteria.itemType);
            const optimalDate = this.calculateOptimalOrderDate(criteria, forecast, priceData);
            const deliveryWindow = this.calculateDeliveryWindow(optimalDate, criteria.deliveryRequirements);
            const costOptimization = this.calculateCostOptimization(criteria, optimalDate, priceData);
            return {
                recommendedOrderDate: optimalDate,
                deliveryWindow,
                costOptimization
            };
        }
        catch (error) {
            logger_1.logger.error('Error calculating optimal timing', { error, criteria });
            throw error;
        }
    }
    async generateAutomatedRFP(config, criteria) {
        try {
            const validatedConfig = RFPGenerationConfigSchema.parse(config);
            const requirementAnalysis = await this.analyzeRequirements(criteria);
            const rfpSections = {
                executive_summary: this.generateExecutiveSummary(criteria, requirementAnalysis),
                scope_of_work: this.generateScopeOfWork(criteria, requirementAnalysis),
                technical_specifications: this.generateTechnicalSpecs(criteria),
                evaluation_criteria: this.generateEvaluationCriteria(validatedConfig),
                terms_and_conditions: this.generateTermsAndConditions(criteria),
                submission_requirements: this.generateSubmissionRequirements(validatedConfig)
            };
            const rfpDocument = this.compileRFPDocument(rfpSections, validatedConfig);
            const evaluationMatrix = this.generateEvaluationMatrix(validatedConfig);
            const timeline = this.generateRFPTimeline(validatedConfig);
            const complianceChecklist = this.generateComplianceChecklist(criteria, validatedConfig);
            await this.storeRFP({
                id: `rfp_${validatedConfig.procurementId}`,
                schoolId: validatedConfig.schoolId,
                document: rfpDocument,
                evaluationMatrix,
                timeline,
                complianceChecklist,
                status: 'draft',
                created_at: new Date().toISOString()
            });
            return {
                rfpDocument,
                evaluationMatrix,
                timeline,
                complianceChecklist
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating automated RFP', { error, config });
            throw error;
        }
    }
    calculateQualityScore(vendor, criteria) {
        let score = 70;
        const vendorCertifications = vendor.certifications ? JSON.parse(vendor.certifications) : [];
        const requiredCertifications = criteria.qualitySpecs.certifications || [];
        const certificationMatch = requiredCertifications.filter(req => vendorCertifications.some((cert) => cert.toLowerCase().includes(req.toLowerCase()))).length;
        score += (certificationMatch / Math.max(requiredCertifications.length, 1)) * 20;
        if (vendor.quality_rating) {
            score += (vendor.quality_rating - 3) * 5;
        }
        const standardsMatch = criteria.qualitySpecs.standards?.length || 0;
        if (standardsMatch > 0 && vendor.standards_compliance) {
            score += 5;
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    calculatePriceScore(vendor, criteria) {
        if (!vendor.base_price)
            return 50;
        const vendorPrice = vendor.base_price * criteria.quantity;
        const budgetMidpoint = (criteria.budget.min + criteria.budget.max) / 2;
        if (vendorPrice <= criteria.budget.min)
            return 100;
        if (vendorPrice >= criteria.budget.max)
            return 0;
        const priceScore = 100 - ((vendorPrice - criteria.budget.min) / (criteria.budget.max - criteria.budget.min)) * 100;
        return Math.round(Math.max(0, priceScore));
    }
    calculateDeliveryScore(vendor, criteria) {
        let score = 70;
        if (vendor.lead_time_hours && criteria.deliveryRequirements.maxDeliveryTime) {
            if (vendor.lead_time_hours <= criteria.deliveryRequirements.maxDeliveryTime) {
                score += 20;
            }
            else {
                const penalty = Math.min(30, (vendor.lead_time_hours - criteria.deliveryRequirements.maxDeliveryTime) / 24 * 10);
                score -= penalty;
            }
        }
        if (vendor.delivery_reliability_score) {
            score += (vendor.delivery_reliability_score - 80) / 4;
        }
        if (vendor.service_areas && criteria.deliveryRequirements.location) {
            const locationMatch = vendor.service_areas.includes(criteria.deliveryRequirements.location);
            if (locationMatch)
                score += 10;
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    calculateReliabilityScore(vendor, intelligence) {
        let score = 60;
        if (intelligence?.fulfillment_rate) {
            score += (intelligence.fulfillment_rate - 85) / 3;
        }
        if (intelligence?.on_time_delivery_rate) {
            score += (intelligence.on_time_delivery_rate - 85) / 3;
        }
        if (vendor.response_time_hours && vendor.response_time_hours <= 24) {
            score += 15;
        }
        if (intelligence?.performance_trend === 'improving') {
            score += 10;
        }
        else if (intelligence?.performance_trend === 'declining') {
            score -= 10;
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    calculateSustainabilityScore(vendor, criteria) {
        let score = 50;
        if (criteria.sustainabilityRequirements.organicRequired && vendor.organic_certified) {
            score += 25;
        }
        if (criteria.sustainabilityRequirements.localPreferred && vendor.local_sourcing) {
            score += 15;
        }
        if (vendor.carbon_footprint_score) {
            score += vendor.carbon_footprint_score / 5;
        }
        if (vendor.sustainable_packaging) {
            score += 10;
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    calculateRiskScore(vendor, intelligence) {
        let riskScore = 20;
        if (intelligence?.financial_health === 'poor') {
            riskScore += 30;
        }
        else if (intelligence?.financial_health === 'fair') {
            riskScore += 15;
        }
        if (intelligence?.dependency_risk === 'high') {
            riskScore += 20;
        }
        if (intelligence?.compliance_issues > 0) {
            riskScore += intelligence.compliance_issues * 5;
        }
        return Math.min(100, Math.max(0, 100 - riskScore));
    }
    calculateHistoricalPerformance(vendor) {
        let score = 70;
        if (vendor.total_orders > 0) {
            const experienceBonus = Math.min(15, vendor.total_orders / 10);
            score += experienceBonus;
            if (vendor.success_rate) {
                score += (vendor.success_rate - 85) / 3;
            }
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    calculateFinancialStability(vendor, intelligence) {
        let score = 60;
        if (intelligence?.credit_rating) {
            const ratingMap = {
                'AAA': 100, 'AA': 90, 'A': 80, 'BBB': 70, 'BB': 60, 'B': 50
            };
            score = ratingMap[intelligence.credit_rating] || 40;
        }
        if (intelligence?.revenue_trend === 'stable' || intelligence?.revenue_trend === 'growing') {
            score += 10;
        }
        if (vendor.years_in_business > 5) {
            score += Math.min(15, vendor.years_in_business);
        }
        return Math.min(100, Math.max(0, Math.round(score)));
    }
    async generatePricingEstimate(vendor, criteria) {
        const basePrice = vendor.base_price || 0;
        const quantity = criteria.quantity;
        const discounts = [];
        if (quantity > 100) {
            discounts.push({
                type: 'volume_discount',
                amount: basePrice * quantity * 0.05,
                description: 'Volume discount for orders over 100 units'
            });
        }
        const totalPrice = basePrice * quantity;
        const discountAmount = discounts.reduce((sum, d) => sum + d.amount, 0);
        return {
            unitPrice: basePrice,
            totalPrice: totalPrice - discountAmount,
            discounts,
            paymentTerms: vendor.payment_terms || 'Net 30'
        };
    }
    async generateVendorRiskAssessment(vendor, intelligence) {
        const riskFactors = [];
        let overallRisk = 'low';
        if (intelligence?.financial_health === 'poor') {
            riskFactors.push('Poor financial health');
            overallRisk = 'high';
        }
        if (vendor.lead_time_hours > 72) {
            riskFactors.push('Extended lead times');
            if (overallRisk === 'low')
                overallRisk = 'medium';
        }
        if (intelligence?.compliance_issues > 0) {
            riskFactors.push('Previous compliance issues');
            overallRisk = 'high';
        }
        const mitigationStrategies = [
            'Regular performance monitoring',
            'Diversified supplier base',
            'Contractual SLA enforcement'
        ];
        return {
            overallRisk: overallRisk,
            riskFactors,
            mitigationStrategies
        };
    }
    generateVendorRecommendations(vendor, criteria, scores) {
        const recommendations = [];
        if (scores.priceScore < 70) {
            recommendations.push('Consider negotiating price for better value');
        }
        if (scores.deliveryScore < 80) {
            recommendations.push('Discuss delivery timeline improvements');
        }
        if (scores.sustainabilityScore > 80 && criteria.sustainabilityRequirements.localPreferred) {
            recommendations.push('Excellent sustainability match - recommend for green initiatives');
        }
        if (scores.reliabilityScore > 90) {
            recommendations.push('High reliability vendor - suitable for critical supplies');
        }
        return recommendations;
    }
    async applyVendorDiversification(vendors, criteria) {
        const diversified = [];
        const regions = new Set();
        const sizes = new Set();
        for (const vendor of vendors) {
            if (diversified.length < 3 ||
                !regions.has(vendor.vendorId) ||
                !sizes.has(vendor.vendorId) ||
                vendor.matchScore > 90) {
                diversified.push(vendor);
                regions.add(vendor.vendorId);
                sizes.add(vendor.vendorId);
            }
            if (diversified.length >= 5)
                break;
        }
        return diversified;
    }
    async getExternalFactors(schoolId) {
        return {
            weather_impact: 0.1,
            event_impact: 0.05,
            market_trends: ['increasing_demand', 'supply_chain_stability'],
            economic_indicators: {
                inflation_rate: 0.03,
                commodity_prices: {
                    grains: 1.02,
                    vegetables: 0.98,
                    dairy: 1.05
                }
            }
        };
    }
    async applyDemandForecastingModel(historicalData, externalFactors, itemType) {
        const avgDemand = (historicalData || []).reduce((sum, d) => sum + d.demand, 0) / (historicalData || []).length;
        const trend = this.detectTrend(historicalData);
        return {
            prediction: Math.round(avgDemand * 1.1),
            trend,
            seasonality: [
                { factor: 'school_term', impact: 0.15, period: 'academic_year' },
                { factor: 'weather', impact: 0.08, period: 'seasonal' }
            ],
            optimal_timing: '2024-09-20T10:00:00Z',
            cost_suggestions: [
                'Order during off-peak hours for better rates',
                'Consider bulk ordering for volume discounts'
            ]
        };
    }
    detectTrend(data) {
        if (!data || data.length < 7)
            return 'stable';
        const recent = data.slice(-7);
        const earlier = data.slice(-14, -7);
        const recentAvg = recent.reduce((sum, d) => sum + d.demand, 0) / recent.length;
        const earlierAvg = earlier.reduce((sum, d) => sum + d.demand, 0) / earlier.length;
        const change = (recentAvg - earlierAvg) / earlierAvg;
        if (change > 0.1)
            return 'increasing';
        if (change < -0.1)
            return 'decreasing';
        return 'stable';
    }
    async getMarketPriceTrends(itemType) {
        return {
            current_price: 100,
            trend: 'stable',
            volatility: 0.05,
            seasonal_factors: []
        };
    }
    calculateOptimalOrderDate(criteria, forecast, priceData) {
        const targetDate = new Date(criteria.deliveryRequirements.preferredDate);
        const leadTime = 48;
        const optimalDate = new Date(targetDate.getTime() - leadTime * 60 * 60 * 1000);
        return optimalDate.toISOString();
    }
    calculateDeliveryWindow(orderDate, requirements) {
        const start = new Date(orderDate);
        start.setHours(start.getHours() + 24);
        const end = new Date(start);
        end.setHours(end.getHours() + requirements.maxDeliveryTime);
        return {
            start: start.toISOString(),
            end: end.toISOString()
        };
    }
    calculateCostOptimization(criteria, optimalDate, priceData) {
        const baseCost = criteria.budget.max;
        const optimizedCost = baseCost * 0.95;
        return {
            savings: baseCost - optimizedCost,
            strategy: 'Off-peak ordering and volume optimization'
        };
    }
    async assessProcurementRisks(criteria, vendors) {
        const riskFactors = [];
        let overallRisk = 'low';
        if (vendors.length < 3) {
            riskFactors.push('Limited vendor options - supply chain concentration risk');
            overallRisk = 'medium';
        }
        const avgPrice = vendors.reduce((sum, v) => sum + v.pricing.totalPrice, 0) / vendors.length;
        if (avgPrice > criteria.budget.max * 0.9) {
            riskFactors.push('High cost pressure - budget constraint risk');
            overallRisk = 'high';
        }
        const avgQuality = vendors.reduce((sum, v) => sum + v.scores.qualityScore, 0) / vendors.length;
        if (avgQuality < 70) {
            riskFactors.push('Quality concerns with available vendors');
            overallRisk = 'medium';
        }
        const diversificationStrategy = [
            'Maintain relationships with 3+ vendors per category',
            'Regular vendor performance audits',
            'Emergency supplier backup plans'
        ];
        const contingencyPlans = [
            'Alternative vendor activation within 24 hours',
            'Emergency procurement through approved channels',
            'Inventory buffer management for critical items'
        ];
        return {
            overallRisk,
            diversificationStrategy,
            contingencyPlans
        };
    }
    async analyzeRequirements(criteria) {
        return {
            complexity: 'medium',
            critical_requirements: [
                'Quality certifications',
                'Delivery timeline',
                'Sustainability standards'
            ],
            optional_features: [
                'Organic certification',
                'Local sourcing',
                'Eco-friendly packaging'
            ]
        };
    }
    generateExecutiveSummary(criteria, analysis) {
        return `
Executive Summary

This Request for Proposal (RFP) seeks qualified vendors to supply ${criteria.itemType} for ${criteria.schoolId}.
The procurement involves ${criteria.quantity} units with delivery requirements by ${criteria.deliveryRequirements.preferredDate}.

Key Requirements:
- Quality specifications as detailed in Section 3
- Delivery to ${criteria.deliveryRequirements.location}
- Budget range: ${criteria.budget.currency} ${criteria.budget.min} - ${criteria.budget.max}
- Urgency level: ${criteria.urgency}

This procurement supports our commitment to quality education and sustainable practices.
`;
    }
    generateScopeOfWork(criteria, analysis) {
        return `
Scope of Work

1. Product/Service Description
   - Item Type: ${criteria.itemType}
   - Quantity: ${criteria.quantity}
   - Quality Requirements: ${JSON.stringify(criteria.qualitySpecs)}

2. Delivery Requirements
   - Location: ${criteria.deliveryRequirements.location}
   - Preferred Date: ${criteria.deliveryRequirements.preferredDate}
   - Maximum Delivery Time: ${criteria.deliveryRequirements.maxDeliveryTime} hours

3. Sustainability Requirements
   - Organic Required: ${criteria.sustainabilityRequirements.organicRequired}
   - Local Preferred: ${criteria.sustainabilityRequirements.localPreferred}
   - Packaging Requirements: ${criteria.sustainabilityRequirements.packagingRequirements?.join(', ') || 'Standard'}
`;
    }
    generateTechnicalSpecs(criteria) {
        return `
Technical Specifications

Quality Standards:
${criteria.qualitySpecs.standards?.map(s => `- ${s}`).join('\n') || '- Standard industry requirements'}

Certifications Required:
${criteria.qualitySpecs.certifications?.map(c => `- ${c}`).join('\n') || '- No specific certifications required'}

Custom Requirements:
${criteria.qualitySpecs.customRequirements || 'None specified'}
`;
    }
    generateEvaluationCriteria(config) {
        const criteria = config.evaluationCriteria;
        return `
Evaluation Criteria

Proposals will be evaluated based on the following weighted criteria:

1. Price (${(criteria.price_weight * 100).toFixed(0)}%)
2. Quality (${(criteria.quality_weight * 100).toFixed(0)}%)
3. Delivery (${(criteria.delivery_weight * 100).toFixed(0)}%)
4. Sustainability (${(criteria.sustainability_weight * 100).toFixed(0)}%)
5. Innovation (${(criteria.innovation_weight * 100).toFixed(0)}%)

Total: 100%
`;
    }
    generateTermsAndConditions(criteria) {
        return `
Terms and Conditions

1. Payment Terms: Net 30 days
2. Delivery Terms: FOB Destination
3. Risk Tolerance: ${criteria.riskTolerance}
4. Performance Guarantees: Required
5. Insurance Requirements: General liability minimum $1M
6. Compliance: All applicable regulations must be met
`;
    }
    generateSubmissionRequirements(config) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + (config.urgency === 'emergency' ? 3 : 14));
        return `
Submission Requirements

1. Proposal Deadline: ${deadline.toISOString()}
2. Format: PDF, maximum 20 pages
3. Required Documents:
   - Company profile and certifications
   - Technical specifications and compliance
   - Pricing breakdown
   - References from similar projects
   - Insurance certificates

4. Submission Method: Electronic submission via vendor portal
`;
    }
    compileRFPDocument(sections, config) {
        return `
REQUEST FOR PROPOSAL
${config.schoolId} - ${config.procurementId}

Generated: ${new Date().toISOString()}
Template: ${config.template}
Urgency: ${config.urgency}

${sections.executive_summary}

${sections.scope_of_work}

${sections.technical_specifications}

${sections.evaluation_criteria}

${sections.terms_and_conditions}

${sections.submission_requirements}
`;
    }
    generateEvaluationMatrix(config) {
        return {
            criteria: config.evaluationCriteria,
            scoring_method: 'weighted_average',
            minimum_scores: {
                technical: 70,
                financial: 60,
                overall: 75
            },
            evaluation_team: [
                'procurement_manager',
                'technical_specialist',
                'quality_assurance'
            ]
        };
    }
    generateRFPTimeline(config) {
        const now = new Date();
        const isUrgent = config.urgency === 'emergency';
        return {
            rfp_release: now.toISOString(),
            questions_deadline: new Date(now.getTime() + (isUrgent ? 1 : 7) * 24 * 60 * 60 * 1000).toISOString(),
            proposal_deadline: new Date(now.getTime() + (isUrgent ? 3 : 14) * 24 * 60 * 60 * 1000).toISOString(),
            evaluation_period: new Date(now.getTime() + (isUrgent ? 5 : 21) * 24 * 60 * 60 * 1000).toISOString(),
            award_notification: new Date(now.getTime() + (isUrgent ? 7 : 28) * 24 * 60 * 60 * 1000).toISOString()
        };
    }
    generateComplianceChecklist(criteria, config) {
        const checklist = [
            'Vendor registration and eligibility verification',
            'Insurance requirements validation',
            'Quality certifications verification',
            'Financial stability assessment',
            'References and past performance review'
        ];
        if (criteria.qualitySpecs.certifications?.length) {
            checklist.push('Required certifications validation');
        }
        if (criteria.sustainabilityRequirements.organicRequired) {
            checklist.push('Organic certification verification');
        }
        if (config.complianceRequirements?.length) {
            checklist.push(...config.complianceRequirements);
        }
        return checklist;
    }
    async storeRFP(rfpData) {
        await this.db.query(`
      INSERT INTO rfp_documents (
        id, school_id, document, evaluation_matrix,
        timeline, compliance_checklist, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            rfpData.id,
            rfpData.schoolId,
            rfpData.document,
            JSON.stringify(rfpData.evaluationMatrix),
            JSON.stringify(rfpData.timeline),
            JSON.stringify(rfpData.complianceChecklist),
            rfpData.status,
            rfpData.created_at
        ]);
    }
}
exports.AIProcurementEngine = AIProcurementEngine;
exports.default = AIProcurementEngine;
//# sourceMappingURL=ai-procurement-engine.js.map