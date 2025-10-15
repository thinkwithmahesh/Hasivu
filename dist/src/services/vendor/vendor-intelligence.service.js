"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorIntelligenceService = void 0;
const zod_1 = require("zod");
const logger_1 = require("../../utils/logger");
const notification_service_1 = require("../notification.service");
const events_1 = require("events");
const VendorProfileSchema = zod_1.z.object({
    vendorId: zod_1.z.string(),
    basicInfo: zod_1.z.object({
        name: zod_1.z.string(),
        registrationNumber: zod_1.z.string(),
        taxId: zod_1.z.string(),
        businessType: zod_1.z.enum(['corporation', 'llc', 'partnership', 'sole_proprietorship']),
        establishedDate: zod_1.z.string(),
        yearsInBusiness: zod_1.z.number(),
        headquarters: zod_1.z.string(),
        serviceAreas: zod_1.z.array(zod_1.z.string()),
        website: zod_1.z.string().url().optional(),
        contactInfo: zod_1.z.object({
            primaryContact: zod_1.z.string(),
            email: zod_1.z.string().email(),
            phone: zod_1.z.string(),
            emergencyContact: zod_1.z.string().optional()
        })
    }),
    capabilities: zod_1.z.object({
        categories: zod_1.z.array(zod_1.z.string()),
        specializations: zod_1.z.array(zod_1.z.string()),
        capacity: zod_1.z.object({
            dailyVolume: zod_1.z.number(),
            monthlyVolume: zod_1.z.number(),
            peakCapacity: zod_1.z.number(),
            scalabilityFactor: zod_1.z.number()
        }),
        certifications: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            issuedBy: zod_1.z.string(),
            validUntil: zod_1.z.string(),
            status: zod_1.z.enum(['active', 'expired', 'pending'])
        })),
        qualityStandards: zod_1.z.array(zod_1.z.string()),
        technologyStack: zod_1.z.array(zod_1.z.string()).optional()
    }),
    performance: zod_1.z.object({
        overallScore: zod_1.z.number().min(0).max(100),
        metrics: zod_1.z.object({
            qualityScore: zod_1.z.number().min(0).max(100),
            deliveryReliability: zod_1.z.number().min(0).max(100),
            communicationScore: zod_1.z.number().min(0).max(100),
            innovationScore: zod_1.z.number().min(0).max(100),
            sustainabilityScore: zod_1.z.number().min(0).max(100),
            complianceScore: zod_1.z.number().min(0).max(100)
        }),
        trends: zod_1.z.object({
            overall: zod_1.z.enum(['improving', 'declining', 'stable']),
            periods: zod_1.z.array(zod_1.z.object({
                period: zod_1.z.string(),
                score: zod_1.z.number(),
                trend: zod_1.z.enum(['up', 'down', 'stable'])
            }))
        })
    }),
    financialHealth: zod_1.z.object({
        creditRating: zod_1.z.enum(['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D']),
        financialStability: zod_1.z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
        riskLevel: zod_1.z.enum(['low', 'medium', 'high', 'critical']),
        cashFlow: zod_1.z.object({
            status: zod_1.z.enum(['positive', 'negative', 'volatile']),
            trend: zod_1.z.enum(['improving', 'declining', 'stable']),
            score: zod_1.z.number().min(0).max(100)
        }),
        debtToEquityRatio: zod_1.z.number().optional(),
        liquidityRatio: zod_1.z.number().optional(),
        paymentHistory: zod_1.z.object({
            averagePaymentDays: zod_1.z.number(),
            latePaymentRate: zod_1.z.number(),
            disputeRate: zod_1.z.number()
        })
    }),
    compliance: zod_1.z.object({
        status: zod_1.z.enum(['compliant', 'minor_issues', 'major_issues', 'critical']),
        regulations: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            status: zod_1.z.enum(['compliant', 'non_compliant', 'pending']),
            lastAuditDate: zod_1.z.string(),
            nextAuditDate: zod_1.z.string(),
            issues: zod_1.z.array(zod_1.z.string()).optional()
        })),
        certificationStatus: zod_1.z.object({
            current: zod_1.z.number(),
            expired: zod_1.z.number(),
            pending: zod_1.z.number()
        }),
        riskAssessment: zod_1.z.object({
            score: zod_1.z.number().min(0).max(100),
            factors: zod_1.z.array(zod_1.z.string()),
            recommendations: zod_1.z.array(zod_1.z.string())
        })
    }),
    marketPosition: zod_1.z.object({
        competitiveRanking: zod_1.z.number(),
        marketShare: zod_1.z.number().min(0).max(100),
        uniqueSellingPoints: zod_1.z.array(zod_1.z.string()),
        competitorComparison: zod_1.z.array(zod_1.z.object({
            competitorId: zod_1.z.string(),
            strengthComparison: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
            recommendedStrategy: zod_1.z.string()
        })),
        pricingPosition: zod_1.z.enum(['premium', 'competitive', 'budget', 'discount'])
    })
});
const MonitoringAlertSchema = zod_1.z.object({
    id: zod_1.z.string(),
    vendorId: zod_1.z.string(),
    type: zod_1.z.enum(['performance', 'financial', 'compliance', 'quality', 'delivery']),
    severity: zod_1.z.enum(['info', 'warning', 'critical', 'emergency']),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    metrics: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()),
    threshold: zod_1.z.object({
        metric: zod_1.z.string(),
        threshold: zod_1.z.number(),
        current: zod_1.z.number(),
        direction: zod_1.z.enum(['above', 'below'])
    }),
    recommendedActions: zod_1.z.array(zod_1.z.string()),
    escalationRequired: zod_1.z.boolean(),
    createdAt: zod_1.z.string(),
    resolvedAt: zod_1.z.string().optional()
});
const VendorAnalyticsSchema = zod_1.z.object({
    vendorId: zod_1.z.string(),
    period: zod_1.z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
    metrics: zod_1.z.object({
        orders: zod_1.z.object({
            total: zod_1.z.number(),
            completed: zod_1.z.number(),
            cancelled: zod_1.z.number(),
            averageValue: zod_1.z.number(),
            totalValue: zod_1.z.number()
        }),
        performance: zod_1.z.object({
            onTimeDelivery: zod_1.z.number(),
            qualityScore: zod_1.z.number(),
            customerSatisfaction: zod_1.z.number(),
            issueResolutionTime: zod_1.z.number()
        }),
        financial: zod_1.z.object({
            revenue: zod_1.z.number(),
            profitability: zod_1.z.number(),
            paymentSpeed: zod_1.z.number(),
            costEfficiency: zod_1.z.number()
        }),
        sustainability: zod_1.z.object({
            carbonFootprint: zod_1.z.number(),
            wasteReduction: zod_1.z.number(),
            localSourcing: zod_1.z.number(),
            sustainablePractices: zod_1.z.number()
        })
    }),
    comparisons: zod_1.z.object({
        industryAverage: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
        previousPeriod: zod_1.z.record(zod_1.z.string(), zod_1.z.number()),
        topPerformers: zod_1.z.record(zod_1.z.string(), zod_1.z.number())
    }),
    insights: zod_1.z.object({
        strengths: zod_1.z.array(zod_1.z.string()),
        improvements: zod_1.z.array(zod_1.z.string()),
        opportunities: zod_1.z.array(zod_1.z.string()),
        risks: zod_1.z.array(zod_1.z.string())
    })
});
class VendorIntelligenceService extends events_1.EventEmitter {
    db;
    cache;
    notifications;
    monitoringConfig = {
        intervals: {
            realtime: 60000,
            hourly: 3600000,
            daily: 86400000,
            weekly: 604800000
        },
        thresholds: {
            performance: {
                critical: 60,
                warning: 75,
                good: 85
            },
            financial: {
                critical: 40,
                warning: 60,
                good: 80
            },
            compliance: {
                critical: 70,
                warning: 85,
                good: 95
            }
        },
        alerting: {
            escalation_levels: ['team', 'manager', 'director', 'c_suite'],
            notification_channels: ['email', 'sms', 'slack', 'dashboard']
        }
    };
    constructor(db, cache, notifications) {
        super();
        this.db = db;
        this.cache = cache;
        this.notifications = notifications;
        this.initializeMonitoring();
    }
    async getVendorProfile(vendorId) {
        const startTime = Date.now();
        try {
            const cacheKey = `vendor_profile_${vendorId}`;
            const cached = await this.cache.get(cacheKey);
            if (cached)
                return cached;
            const basicInfo = await this.getVendorBasicInfo(vendorId);
            const capabilities = await this.getVendorCapabilities(vendorId);
            const performance = await this.calculatePerformanceMetrics(vendorId);
            const financialHealth = await this.assessFinancialHealth(vendorId);
            const compliance = await this.assessComplianceStatus(vendorId);
            const marketPosition = await this.analyzeMarketPosition(vendorId);
            const profile = {
                vendorId,
                basicInfo,
                capabilities,
                performance,
                financialHealth,
                compliance,
                marketPosition
            };
            await this.cache.set(cacheKey, profile, { ttl: 1800 });
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('Vendor profile generated', {
                vendorId,
                executionTime,
                profileSize: JSON.stringify(profile).length
            });
            return profile;
        }
        catch (error) {
            logger_1.logger.error('Error getting vendor profile', {
                error: error instanceof Error ? error.message : String(error),
                vendorId,
                executionTime: Date.now() - startTime
            });
            throw error;
        }
    }
    async updateVendorProfile(vendorId, updates) {
        try {
            const currentProfile = await this.getVendorProfile(vendorId);
            const updatedProfile = { ...currentProfile, ...updates };
            await this.storeVendorProfileUpdate(vendorId, updates);
            await this.cache.delete(`vendor_profile_${vendorId}`);
            this.emit('vendor_profile_updated', { vendorId, updates });
            await this.checkAlertConditions(vendorId, updatedProfile);
            return updatedProfile;
        }
        catch (error) {
            logger_1.logger.error('Error updating vendor profile', { error: error instanceof Error ? error.message : String(error), vendorId, updates });
            throw error;
        }
    }
    async getVendorAnalytics(vendorId, period, startDate, endDate) {
        try {
            const cacheKey = `vendor_analytics_${vendorId}_${period}_${startDate}_${endDate}`;
            const cached = await this.cache.get(cacheKey);
            if (cached)
                return cached;
            const metrics = await this.calculatePeriodMetrics(vendorId, period, startDate, endDate);
            const comparisons = await this.getComparisonData(vendorId, period);
            const insights = await this.generateVendorInsights(vendorId, metrics, comparisons);
            const analytics = {
                vendorId,
                period,
                metrics,
                comparisons,
                insights
            };
            await this.cache.set(cacheKey, analytics, { ttl: 3600 });
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Error getting vendor analytics', { error: error instanceof Error ? error.message : String(error), vendorId, period });
            throw error;
        }
    }
    initializeMonitoring() {
        setInterval(() => {
            this.monitorVendorPerformance();
        }, this.monitoringConfig.intervals.realtime);
        setInterval(() => {
            this.monitorFinancialHealth();
        }, this.monitoringConfig.intervals.hourly);
        setInterval(() => {
            this.monitorCompliance();
        }, this.monitoringConfig.intervals.daily);
        setInterval(() => {
            this.updateCompetitiveAnalysis();
        }, this.monitoringConfig.intervals.weekly);
        logger_1.logger.info('Vendor intelligence monitoring initialized');
    }
    async monitorVendorPerformance() {
        try {
            const activeVendors = await this.getActiveVendors();
            for (const vendor of activeVendors) {
                const recentMetrics = await this.getRecentPerformanceMetrics(vendor.id);
                const metrics = recentMetrics;
                if (metrics.overallScore < this.monitoringConfig.thresholds.performance.critical) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'performance',
                        severity: 'critical',
                        title: 'Critical Performance Drop',
                        description: `Vendor ${vendor.name} performance dropped to ${metrics.overallScore}%`,
                        metrics: metrics,
                        threshold: {
                            metric: 'overallScore',
                            threshold: this.monitoringConfig.thresholds.performance.critical,
                            current: metrics.overallScore,
                            direction: 'below'
                        }
                    });
                }
                if (metrics.deliveryReliability < 80) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'delivery',
                        severity: 'warning',
                        title: 'Delivery Reliability Issue',
                        description: `Delivery reliability dropped to ${metrics.deliveryReliability}%`,
                        metrics: metrics,
                        threshold: {
                            metric: 'deliveryReliability',
                            threshold: 80,
                            current: metrics.deliveryReliability,
                            direction: 'below'
                        }
                    });
                }
                if (metrics.qualityScore < 75) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'quality',
                        severity: 'warning',
                        title: 'Quality Score Decline',
                        description: `Quality score dropped to ${metrics.qualityScore}%`,
                        metrics: metrics,
                        threshold: {
                            metric: 'qualityScore',
                            threshold: 75,
                            current: metrics.qualityScore,
                            direction: 'below'
                        }
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error monitoring vendor performance', { error: error instanceof Error ? error.message : String(error) });
        }
    }
    async monitorFinancialHealth() {
        try {
            const vendors = await this.getVendorsForFinancialMonitoring();
            for (const vendor of vendors) {
                const financialData = await this.getLatestFinancialData(vendor.id);
                const riskScore = this.calculateFinancialRiskScore(financialData);
                if (riskScore > 70) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'financial',
                        severity: 'critical',
                        title: 'Financial Health Warning',
                        description: `High financial risk detected (score: ${riskScore})`,
                        metrics: financialData,
                        threshold: {
                            metric: 'financialRisk',
                            threshold: 70,
                            current: riskScore,
                            direction: 'above'
                        }
                    });
                }
                if (financialData.averagePaymentDays > 45) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'financial',
                        severity: 'warning',
                        title: 'Payment Delay Pattern',
                        description: `Average payment time increased to ${financialData.averagePaymentDays} days`,
                        metrics: financialData,
                        threshold: {
                            metric: 'averagePaymentDays',
                            threshold: 45,
                            current: financialData.averagePaymentDays,
                            direction: 'above'
                        }
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error monitoring financial health', { error: error instanceof Error ? error.message : String(error) });
        }
    }
    async monitorCompliance() {
        try {
            const vendors = await this.getVendorsForComplianceMonitoring();
            for (const vendor of vendors) {
                const compliance = await this.getComplianceStatus(vendor.id);
                const expiredCerts = await this.getExpiredCertifications(vendor.id);
                if (expiredCerts.length > 0) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'compliance',
                        severity: 'critical',
                        title: 'Expired Certifications',
                        description: `${expiredCerts.length} certifications have expired`,
                        metrics: { expiredCertifications: expiredCerts },
                        threshold: {
                            metric: 'expiredCertifications',
                            threshold: 0,
                            current: expiredCerts.length,
                            direction: 'above'
                        }
                    });
                }
                const expiringSoon = await this.getCertificationsExpiringSoon(vendor.id, 30);
                if (expiringSoon.length > 0) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'compliance',
                        severity: 'warning',
                        title: 'Certifications Expiring Soon',
                        description: `${expiringSoon.length} certifications expire within 30 days`,
                        metrics: { expiringSoon },
                        threshold: {
                            metric: 'certificationRenewal',
                            threshold: 30,
                            current: expiringSoon.length,
                            direction: 'above'
                        }
                    });
                }
                const complianceScore = compliance.riskAssessment.score;
                if (complianceScore < this.monitoringConfig.thresholds.compliance.critical) {
                    await this.createAlert({
                        vendorId: vendor.id,
                        type: 'compliance',
                        severity: 'critical',
                        title: 'Compliance Risk Alert',
                        description: `Compliance score dropped to ${complianceScore}%`,
                        metrics: compliance,
                        threshold: {
                            metric: 'complianceScore',
                            threshold: this.monitoringConfig.thresholds.compliance.critical,
                            current: complianceScore,
                            direction: 'below'
                        }
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Error monitoring compliance', { error: error instanceof Error ? error.message : String(error) });
        }
    }
    async createAlert(alertData) {
        try {
            const alert = {
                id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...alertData,
                recommendedActions: this.generateRecommendedActions(alertData),
                escalationRequired: this.shouldEscalate(alertData),
                createdAt: new Date().toISOString()
            };
            await this.storeAlert(alert);
            await this.sendAlertNotifications(alert);
            this.emit('alert_created', alert);
            logger_1.logger.warn('Vendor monitoring alert created', {
                alertId: alert.id,
                vendorId: alert.vendorId,
                type: alert.type,
                severity: alert.severity
            });
        }
        catch (error) {
            logger_1.logger.error('Error creating alert', { error: error instanceof Error ? error.message : String(error), alertData });
        }
    }
    async getVendorBasicInfo(vendorId) {
        const vendor = await this.db.query(`
      SELECT * FROM vendors
      WHERE id = ? AND is_active = true
    `, [vendorId]);
        return vendor.rows[0];
        if (!vendor) {
            throw new Error(`Vendor ${vendorId} not found`);
        }
        return {
            name: vendor.name,
            registrationNumber: vendor.registration_number,
            taxId: vendor.tax_id,
            businessType: vendor.business_type,
            establishedDate: vendor.established_date,
            yearsInBusiness: new Date().getFullYear() - new Date(vendor.established_date).getFullYear(),
            headquarters: vendor.headquarters,
            serviceAreas: JSON.parse(vendor.service_areas || '[]'),
            website: vendor.website,
            contactInfo: {
                primaryContact: vendor.primary_contact,
                email: vendor.email,
                phone: vendor.phone,
                emergencyContact: vendor.emergency_contact
            }
        };
    }
    async getVendorCapabilities(vendorId) {
        const capabilities = await this.db.query(`
      SELECT * FROM vendor_capabilities
      WHERE vendor_id = ?
    `, [vendorId]);
        const capabilitiesData = capabilities.rows[0];
        const certifications = await this.db.query(`
      SELECT * FROM vendor_certifications
      WHERE vendor_id = ? AND status = 'active'
    `, [vendorId]);
        return {
            categories: JSON.parse(capabilitiesData?.categories || '[]'),
            specializations: JSON.parse(capabilitiesData?.specializations || '[]'),
            capacity: {
                dailyVolume: capabilitiesData?.daily_volume || 0,
                monthlyVolume: capabilitiesData?.monthly_volume || 0,
                peakCapacity: capabilitiesData?.peak_capacity || 0,
                scalabilityFactor: capabilitiesData?.scalability_factor || 1.0
            },
            certifications: certifications.rows.map((cert) => ({
                name: cert.name,
                issuedBy: cert.issued_by,
                validUntil: cert.valid_until,
                status: cert.status
            })),
            qualityStandards: JSON.parse(capabilitiesData?.quality_standards || '[]'),
            technologyStack: JSON.parse(capabilitiesData?.technology_stack || '[]')
        };
    }
    async calculatePerformanceMetrics(vendorId) {
        const metrics = await this.db.query(`
      SELECT
        AVG(quality_score) as quality_score,
        AVG(delivery_reliability_score) as delivery_reliability,
        AVG(communication_score) as communication_score,
        AVG(innovation_score) as innovation_score,
        AVG(sustainability_score) as sustainability_score,
        AVG(compliance_score) as compliance_score
      FROM vendor_performance_metrics
      WHERE vendor_id = ?
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [vendorId]);
        const metricsData = metrics.rows[0];
        const overallScore = ((metricsData.quality_score || 0) +
            (metricsData.delivery_reliability || 0) +
            (metricsData.communication_score || 0) +
            (metricsData.innovation_score || 0) +
            (metricsData.sustainability_score || 0) +
            (metricsData.compliance_score || 0)) / 6;
        const trends = await this.getPerformanceTrends(vendorId);
        return {
            overallScore: Math.round(overallScore),
            metrics: {
                qualityScore: Math.round(metricsData.quality_score || 0),
                deliveryReliability: Math.round(metricsData.delivery_reliability || 0),
                communicationScore: Math.round(metricsData.communication_score || 0),
                innovationScore: Math.round(metricsData.innovation_score || 0),
                sustainabilityScore: Math.round(metricsData.sustainability_score || 0),
                complianceScore: Math.round(metricsData.compliance_score || 0)
            },
            trends
        };
    }
    async assessFinancialHealth(vendorId) {
        const financial = await this.db.query(`
      SELECT * FROM vendor_financial_health
      WHERE vendor_id = ?
      ORDER BY assessment_date DESC
      LIMIT 1
    `, [vendorId]);
        const paymentHistory = await this.db.query(`
      SELECT
        AVG(payment_days) as avg_payment_days,
        SUM(CASE WHEN payment_days > 30 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as late_payment_rate,
        COUNT(CASE WHEN status = 'disputed' THEN 1 END) * 100.0 / COUNT(*) as dispute_rate
      FROM vendor_payments
      WHERE vendor_id = ?
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    `, [vendorId]);
        return {
            creditRating: financial?.credit_rating || 'B',
            financialStability: financial?.stability_rating || 'fair',
            riskLevel: financial?.risk_level || 'medium',
            cashFlow: {
                status: financial?.cash_flow_status || 'positive',
                trend: financial?.cash_flow_trend || 'stable',
                score: financial?.cash_flow_score || 70
            },
            debtToEquityRatio: financial?.debt_to_equity_ratio,
            liquidityRatio: financial?.liquidity_ratio,
            paymentHistory: {
                averagePaymentDays: Math.round(paymentHistory?.avg_payment_days || 30),
                latePaymentRate: Math.round(paymentHistory?.late_payment_rate || 0),
                disputeRate: Math.round(paymentHistory?.dispute_rate || 0)
            }
        };
    }
    async assessComplianceStatus(vendorId) {
        const compliance = await this.db.query(`
      SELECT * FROM vendor_compliance_status
      WHERE vendor_id = ?
      ORDER BY assessment_date DESC
      LIMIT 1
    `, [vendorId]);
        const regulations = await this.db.query(`
      SELECT * FROM vendor_regulation_compliance
      WHERE vendor_id = ?
    `, [vendorId]);
        const certificationCounts = await this.db.query(`
      SELECT
        COUNT(CASE WHEN status = 'active' THEN 1 END) as current,
        COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM vendor_certifications
      WHERE vendor_id = ?
    `, [vendorId]);
        return {
            status: compliance?.overall_status || 'compliant',
            regulations: regulations.map((reg) => ({
                name: reg.regulation_name,
                status: reg.compliance_status,
                lastAuditDate: reg.last_audit_date,
                nextAuditDate: reg.next_audit_date,
                issues: JSON.parse(reg.issues || '[]')
            })),
            certificationStatus: {
                current: certificationCounts?.current || 0,
                expired: certificationCounts?.expired || 0,
                pending: certificationCounts?.pending || 0
            },
            riskAssessment: {
                score: compliance?.compliance_score || 85,
                factors: JSON.parse(compliance?.risk_factors || '[]'),
                recommendations: JSON.parse(compliance?.recommendations || '[]')
            }
        };
    }
    async analyzeMarketPosition(vendorId) {
        const position = await this.db.query(`
      SELECT * FROM vendor_market_analysis
      WHERE vendor_id = ?
      ORDER BY analysis_date DESC
      LIMIT 1
    `, [vendorId]);
        const competitors = await this.db.query(`
      SELECT * FROM vendor_competitor_analysis
      WHERE vendor_id = ?
      ORDER BY competitive_score DESC
      LIMIT 5
    `, [vendorId]);
        return {
            competitiveRanking: position?.competitive_ranking || 0,
            marketShare: position?.market_share_percentage || 0,
            uniqueSellingPoints: JSON.parse(position?.unique_selling_points || '[]'),
            competitorComparison: competitors.map((comp) => ({
                competitorId: comp.competitor_id,
                strengthComparison: JSON.parse(comp.strength_comparison || '{}'),
                recommendedStrategy: comp.recommended_strategy
            })),
            pricingPosition: position?.pricing_position || 'competitive'
        };
    }
    async getActiveVendors() {
        return await this.db.query(`
      SELECT id, name FROM vendors
      WHERE is_active = true
    `);
    }
    async getRecentPerformanceMetrics(vendorId) {
        return await this.db.query(`
      SELECT * FROM vendor_performance_metrics
      WHERE vendor_id = ?
      ORDER BY created_at DESC
      LIMIT 1
    `, [vendorId]);
    }
    async getPerformanceTrends(vendorId) {
        const trends = await this.db.query(`
      SELECT
        DATE(created_at) as period,
        AVG(overall_score) as score
      FROM vendor_performance_metrics
      WHERE vendor_id = ?
      AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
      GROUP BY DATE(created_at)
      ORDER BY period
    `, [vendorId]);
        let overall = 'stable';
        if (trends.length >= 2) {
            const recent = trends.slice(-7).reduce((sum, t) => sum + t.score, 0) / 7;
            const earlier = trends.slice(-14, -7).reduce((sum, t) => sum + t.score, 0) / 7;
            const change = (recent - earlier) / earlier;
            if (change > 0.05)
                overall = 'improving';
            else if (change < -0.05)
                overall = 'declining';
        }
        return {
            overall,
            periods: trends.map((t) => ({
                period: t.period,
                score: Math.round(t.score),
                trend: 'stable'
            }))
        };
    }
    calculateFinancialRiskScore(financialData) {
        let riskScore = 0;
        if (financialData.averagePaymentDays > 45)
            riskScore += 20;
        if (financialData.latePaymentRate > 10)
            riskScore += 15;
        if (financialData.disputeRate > 5)
            riskScore += 10;
        if (financialData.cashFlowStatus === 'negative')
            riskScore += 25;
        if (financialData.cashFlowTrend === 'declining')
            riskScore += 15;
        if (financialData.liquidityRatio && financialData.liquidityRatio < 1.0)
            riskScore += 20;
        if (financialData.debtToEquityRatio && financialData.debtToEquityRatio > 2.0)
            riskScore += 15;
        return Math.min(100, riskScore);
    }
    generateRecommendedActions(alertData) {
        const actions = [];
        switch (alertData.type) {
            case 'performance':
                actions.push('Review recent order performance');
                actions.push('Schedule vendor meeting to discuss issues');
                actions.push('Consider performance improvement plan');
                break;
            case 'financial':
                actions.push('Review payment terms and history');
                actions.push('Consider credit limit adjustment');
                actions.push('Evaluate vendor financial stability');
                break;
            case 'compliance':
                actions.push('Request updated certification documentation');
                actions.push('Schedule compliance audit');
                actions.push('Review regulatory requirements');
                break;
            case 'quality':
                actions.push('Increase quality inspection frequency');
                actions.push('Review quality standards with vendor');
                actions.push('Consider quality improvement training');
                break;
            case 'delivery':
                actions.push('Review delivery schedules and constraints');
                actions.push('Evaluate logistics optimization opportunities');
                actions.push('Consider backup delivery options');
                break;
        }
        return actions;
    }
    shouldEscalate(alertData) {
        return alertData.severity === 'critical' || alertData.severity === 'emergency';
    }
    async storeAlert(alert) {
        await this.db.query(`
      INSERT INTO vendor_monitoring_alerts (
        id, vendor_id, type, severity, title, description,
        metrics, threshold_config, recommended_actions,
        escalation_required, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            alert.id,
            alert.vendorId,
            alert.type,
            alert.severity,
            alert.title,
            alert.description,
            JSON.stringify(alert.metrics),
            JSON.stringify(alert.threshold),
            JSON.stringify(alert.recommendedActions),
            alert.escalationRequired,
            alert.createdAt
        ]);
    }
    async sendAlertNotifications(alert) {
        const recipients = await this.getAlertRecipients(alert);
        for (const recipient of recipients) {
            await notification_service_1.NotificationService.sendNotification({
                recipientId: recipient.id,
                recipientType: 'user',
                channels: ['push', 'email'],
                priority: alert.severity === 'critical' ? 'high' : 'normal',
                title: alert.title,
                body: alert.description,
                data: {
                    alertId: alert.id,
                    vendorId: alert.vendorId,
                    alertType: alert.type,
                    severity: alert.severity,
                    recommendedActions: alert.recommendedActions
                }
            });
        }
    }
    async getAlertRecipients(alert) {
        return await this.db.query(`
      SELECT DISTINCT u.id, u.email
      FROM users u
      JOIN user_alert_subscriptions uas ON u.id = uas.user_id
      WHERE uas.alert_type = ?
      AND uas.severity_level <= ?
      AND u.is_active = true
    `, [alert.type, this.getSeverityLevel(alert.severity)]);
    }
    getSeverityLevel(severity) {
        const levels = { info: 1, warning: 2, critical: 3, emergency: 4 };
        return levels[severity] || 1;
    }
    async storeVendorProfileUpdate(vendorId, updates) {
        await this.db.query(`
      INSERT INTO vendor_profile_updates (
        vendor_id, updates, updated_at
      ) VALUES (?, ?, NOW())
    `, [vendorId, JSON.stringify(updates)]);
    }
    async checkAlertConditions(vendorId, profile) {
    }
    async calculatePeriodMetrics(vendorId, period, startDate, endDate) {
        const metrics = await this.db.query(`
      SELECT
        COUNT(o.id) as total_orders,
        COUNT(CASE WHEN o.status = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END) as cancelled_orders,
        AVG(o.total_amount) as average_order_value,
        SUM(o.total_amount) as total_order_value,
        AVG(vm.delivery_score) as on_time_delivery,
        AVG(vm.quality_score) as quality_score,
        AVG(vm.satisfaction_score) as customer_satisfaction,
        AVG(vm.resolution_time) as issue_resolution_time
      FROM vendors v
      LEFT JOIN orders o ON v.id = o.vendor_id
      LEFT JOIN vendor_metrics vm ON v.id = vm.vendor_id
      WHERE v.id = ?
      ${startDate ? 'AND o.created_at >= ?' : ''}
      ${endDate ? 'AND o.created_at <= ?' : ''}
    `, [vendorId, startDate, endDate].filter(Boolean));
        return {
            orders: {
                total: metrics.total_orders || 0,
                completed: metrics.completed_orders || 0,
                cancelled: metrics.cancelled_orders || 0,
                averageValue: metrics.average_order_value || 0,
                totalValue: metrics.total_order_value || 0
            },
            performance: {
                onTimeDelivery: metrics.on_time_delivery || 0,
                qualityScore: metrics.quality_score || 0,
                customerSatisfaction: metrics.customer_satisfaction || 0,
                issueResolutionTime: metrics.issue_resolution_time || 0
            },
            financial: {
                revenue: metrics.total_order_value || 0,
                profitability: 0,
                paymentSpeed: 0,
                costEfficiency: 0
            },
            sustainability: {
                carbonFootprint: 0,
                wasteReduction: 0,
                localSourcing: 0,
                sustainablePractices: 0
            }
        };
    }
    async getComparisonData(vendorId, _period) {
        return {
            industryAverage: {
                onTimeDelivery: 85,
                qualityScore: 82,
                customerSatisfaction: 78
            },
            previousPeriod: {
                onTimeDelivery: 0,
                qualityScore: 0,
                customerSatisfaction: 0
            },
            topPerformers: {
                onTimeDelivery: 95,
                qualityScore: 92,
                customerSatisfaction: 90
            }
        };
    }
    async generateVendorInsights(vendorId, metrics, comparisons) {
        const insights = {
            strengths: [],
            improvements: [],
            opportunities: [],
            risks: []
        };
        if (metrics.performance.onTimeDelivery > comparisons.industryAverage.onTimeDelivery) {
            insights.strengths.push('Excellent delivery performance');
        }
        if (metrics.performance.qualityScore > comparisons.industryAverage.qualityScore) {
            insights.strengths.push('Above-average quality standards');
        }
        if (metrics.performance.customerSatisfaction < comparisons.industryAverage.customerSatisfaction) {
            insights.improvements.push('Customer satisfaction below industry average');
        }
        if (metrics.performance.issueResolutionTime > 24) {
            insights.improvements.push('Issue resolution time needs improvement');
        }
        if (metrics.orders.total > 0 && metrics.orders.cancelled / metrics.orders.total < 0.05) {
            insights.opportunities.push('Low cancellation rate indicates growth potential');
        }
        if (metrics.orders.cancelled / metrics.orders.total > 0.1) {
            insights.risks.push('High cancellation rate indicates potential issues');
        }
        return insights;
    }
    async getVendorsForFinancialMonitoring() {
        return await this.db.query(`
      SELECT id, name FROM vendors
      WHERE is_active = true
      AND financial_monitoring_enabled = true
    `);
    }
    async getLatestFinancialData(vendorId) {
        return await this.db.query(`
      SELECT * FROM vendor_financial_metrics
      WHERE vendor_id = ?
      ORDER BY assessment_date DESC
      LIMIT 1
    `, [vendorId]);
    }
    async getVendorsForComplianceMonitoring() {
        return await this.db.query(`
      SELECT id, name FROM vendors
      WHERE is_active = true
      AND compliance_monitoring_enabled = true
    `);
    }
    async getComplianceStatus(vendorId) {
        return await this.db.query(`
      SELECT * FROM vendor_compliance_summary
      WHERE vendor_id = ?
      ORDER BY assessment_date DESC
      LIMIT 1
    `, [vendorId]);
    }
    async getExpiredCertifications(vendorId) {
        return await this.db.query(`
      SELECT * FROM vendor_certifications
      WHERE vendor_id = ?
      AND valid_until < NOW()
      AND status = 'expired'
    `, [vendorId]);
    }
    async getCertificationsExpiringSoon(vendorId, days) {
        return await this.db.query(`
      SELECT * FROM vendor_certifications
      WHERE vendor_id = ?
      AND valid_until BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL ? DAY)
      AND status = 'active'
    `, [vendorId, days]);
    }
    async updateCompetitiveAnalysis() {
        logger_1.logger.info('Updating competitive analysis');
    }
}
exports.VendorIntelligenceService = VendorIntelligenceService;
exports.default = VendorIntelligenceService;
//# sourceMappingURL=vendor-intelligence.service.js.map