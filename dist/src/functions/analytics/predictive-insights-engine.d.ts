import { TrendDirection } from '../../types/analytics.types';
interface ForecastingModel {
    modelId: string;
    modelType: 'enrollment_forecast' | 'demand_forecast' | 'revenue_forecast' | 'cost_forecast' | 'risk_forecast';
    algorithm: 'arima' | 'linear_regression' | 'seasonal_decomposition' | 'neural_network' | 'ensemble';
    accuracy: number;
    mape: number;
    rmse: number;
    r2Score: number;
    trainedOn: Date;
    trainingDataPoints: number;
    validationDataPoints: number;
    features: string[];
    seasonalityPeriod: number;
    trendComponents: {
        linear: number;
        exponential: number;
        logarithmic: number;
    };
    seasonalComponents: {
        weekly: number;
        monthly: number;
        quarterly: number;
        yearly: number;
    };
    hyperparameters: Record<string, any>;
}
interface EnrollmentForecast {
    forecastId: string;
    schoolId?: string;
    generatedAt: Date;
    forecastType: 'individual_school' | 'peer_group' | 'regional' | 'system_wide';
    forecasts: {
        shortTerm: {
            horizon: number;
            predictions: Array<{
                date: Date;
                predictedEnrollment: number;
                confidenceInterval: {
                    lower: number;
                    upper: number;
                    confidence: number;
                };
                factors: Array<{
                    factor: string;
                    impact: number;
                    description: string;
                }>;
            }>;
        };
        mediumTerm: {
            horizon: number;
            predictions: Array<{
                date: Date;
                predictedEnrollment: number;
                confidenceInterval: {
                    lower: number;
                    upper: number;
                    confidence: number;
                };
                factors: Array<{
                    factor: string;
                    impact: number;
                    description: string;
                }>;
            }>;
        };
        longTerm: {
            horizon: number;
            predictions: Array<{
                date: Date;
                predictedEnrollment: number;
                confidenceInterval: {
                    lower: number;
                    upper: number;
                    confidence: number;
                };
                factors: Array<{
                    factor: string;
                    impact: number;
                    description: string;
                }>;
            }>;
        };
    };
    seasonalPatterns: {
        weeklyPattern: number[];
        monthlyPattern: number[];
        academicCalendarImpact: Array<{
            event: string;
            startDate: Date;
            endDate: Date;
            expectedImpact: number;
        }>;
    };
    growthAnalysis: {
        currentTrend: 'growing' | 'stable' | 'declining' | 'volatile';
        trendStrength: number;
        growthRate: {
            daily: number;
            weekly: number;
            monthly: number;
            yearly: number;
        };
        saturationAnalysis: {
            currentCapacityUtilization: number;
            projectedSaturationDate?: Date;
            maxSustainableEnrollment: number;
        };
    };
}
interface DemandForecast {
    forecastId: string;
    schoolId?: string;
    generatedAt: Date;
    mealDemandPredictions: {
        daily: Array<{
            date: Date;
            mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner';
            predictedDemand: number;
            confidenceInterval: {
                lower: number;
                upper: number;
                confidence: number;
            };
            peakTimeDistribution: Array<{
                timeSlot: string;
                demandPercentage: number;
            }>;
        }>;
        weekly: Array<{
            weekStartDate: Date;
            totalMealDemand: number;
            mealTypeDistribution: {
                breakfast: number;
                lunch: number;
                snack: number;
                dinner: number;
            };
            specialDietaryRequirements: {
                vegetarian: number;
                vegan: number;
                glutenFree: number;
                allergenFree: number;
                diabeticFriendly: number;
            };
        }>;
    };
    menuPopularityForecast: Array<{
        menuItem: string;
        category: string;
        predictedPopularity: number;
        seasonalVariation: number;
        demographicAppeal: {
            ageGroups: Record<string, number>;
            dietaryPreferences: Record<string, number>;
        };
        recommendedFrequency: {
            optimal: number;
            minimum: number;
            maximum: number;
        };
    }>;
    capacityRequirements: {
        kitchenCapacity: Array<{
            date: Date;
            requiredCapacity: number;
            peakHourRequirement: number;
            equipmentUtilization: Record<string, number>;
            staffingRequirement: number;
        }>;
        storageRequirements: Array<{
            date: Date;
            ingredientCategory: string;
            requiredStorage: number;
            turnoverRate: number;
        }>;
    };
}
interface BudgetOptimizationModel {
    optimizationId: string;
    schoolId?: string;
    generatedAt: Date;
    optimizationPeriod: {
        startDate: Date;
        endDate: Date;
    };
    costForecasts: {
        ingredientCosts: Array<{
            category: string;
            currentCost: number;
            predictedCost: number;
            costTrend: 'increasing' | 'stable' | 'decreasing';
            volatilityIndex: number;
            seasonalFactors: number[];
            suppliers: Array<{
                supplierId: string;
                marketShare: number;
                priceCompetitiveness: number;
                reliabilityScore: number;
            }>;
        }>;
        operationalCosts: Array<{
            costCategory: 'labor' | 'utilities' | 'equipment' | 'maintenance' | 'logistics';
            currentCost: number;
            predictedCost: number;
            optimizationPotential: number;
            optimizationStrategies: Array<{
                strategy: string;
                potentialSavings: number;
                implementationCost: number;
                paybackPeriod: number;
                riskLevel: 'low' | 'medium' | 'high';
            }>;
        }>;
    };
    revenueOptimization: {
        pricingOptimization: Array<{
            mealPlan: string;
            currentPrice: number;
            optimizedPrice: number;
            demandElasticity: number;
            expectedVolumeChange: number;
            expectedRevenueChange: number;
            competitivePosition: number;
        }>;
        subscriptionOptimization: Array<{
            planType: string;
            currentSubscribers: number;
            churnRate: number;
            acquisitionCost: number;
            lifetimeValue: number;
            optimizationRecommendations: Array<{
                recommendation: string;
                expectedImpact: number;
                confidence: number;
            }>;
        }>;
    };
    budgetAllocation: {
        currentAllocation: Record<string, number>;
        optimizedAllocation: Record<string, number>;
        reallocationRecommendations: Array<{
            fromCategory: string;
            toCategory: string;
            amount: number;
            rationale: string;
            expectedROI: number;
            implementationTimeline: string;
        }>;
        contingencyRecommendations: {
            emergencyFund: number;
            riskMitigationFund: number;
            opportunityFund: number;
        };
    };
}
interface RiskAssessmentModel {
    assessmentId: string;
    schoolId?: string;
    generatedAt: Date;
    assessmentPeriod: {
        startDate: Date;
        endDate: Date;
    };
    riskCategories: {
        operational: {
            overallScore: number;
            risks: Array<{
                riskId: string;
                riskName: string;
                probability: number;
                impact: number;
                riskScore: number;
                category: 'supply_chain' | 'staff_shortage' | 'equipment_failure' | 'quality_control';
                description: string;
                earlyWarningIndicators: Array<{
                    indicator: string;
                    currentValue: number;
                    thresholdValue: number;
                    trendDirection: TrendDirection;
                    daysToThreshold: number;
                }>;
                mitigationStrategies: Array<{
                    strategy: string;
                    effectiveness: number;
                    implementationCost: number;
                    timeToImplement: number;
                    resourceRequirements: string[];
                }>;
            }>;
        };
        financial: {
            overallScore: number;
            risks: Array<{
                riskId: string;
                riskName: string;
                probability: number;
                impact: number;
                riskScore: number;
                category: 'cash_flow' | 'bad_debt' | 'cost_inflation' | 'revenue_decline';
                description: string;
                financialImpact: {
                    worstCase: number;
                    mostLikely: number;
                    bestCase: number;
                };
                mitigationStrategies: Array<{
                    strategy: string;
                    effectiveness: number;
                    implementationCost: number;
                    timeToImplement: number;
                    resourceRequirements: string[];
                }>;
            }>;
        };
        compliance: {
            overallScore: number;
            risks: Array<{
                riskId: string;
                riskName: string;
                probability: number;
                impact: number;
                riskScore: number;
                category: 'food_safety' | 'health_regulations' | 'labor_compliance' | 'data_privacy';
                regulatoryRequirement: string;
                complianceStatus: 'compliant' | 'partially_compliant' | 'non_compliant' | 'unknown';
                lastAuditDate?: Date;
                nextAuditDate?: Date;
                remedialActions: Array<{
                    action: string;
                    priority: 'immediate' | 'high' | 'medium' | 'low';
                    deadline?: Date;
                    assignedTo?: string;
                    status: 'pending' | 'in_progress' | 'completed';
                }>;
            }>;
        };
        reputation: {
            overallScore: number;
            risks: Array<{
                riskId: string;
                riskName: string;
                probability: number;
                impact: number;
                riskScore: number;
                category: 'customer_satisfaction' | 'food_quality' | 'service_delivery' | 'social_media';
                currentSentiment: number;
                trendAnalysis: {
                    direction: 'improving' | 'stable' | 'declining';
                    velocity: number;
                };
                stakeholderImpact: {
                    students: number;
                    parents: number;
                    school_administration: number;
                    community: number;
                };
            }>;
        };
    };
    earlyWarningAlerts: Array<{
        alertId: string;
        riskCategory: string;
        alertLevel: 'info' | 'warning' | 'critical';
        message: string;
        triggeredAt: Date;
        estimatedImpactDate: Date;
        recommendedActions: Array<{
            action: string;
            urgency: 'immediate' | 'within_24h' | 'within_week';
            resourceRequirement: string;
        }>;
        escalationPath: string[];
    }>;
    mitigationRoadmap: {
        immediate: Array<{
            action: string;
            targetRisks: string[];
            estimatedEffectiveness: number;
            cost: number;
            timeline: string;
        }>;
        shortTerm: Array<{
            action: string;
            targetRisks: string[];
            estimatedEffectiveness: number;
            cost: number;
            timeline: string;
        }>;
        longTerm: Array<{
            action: string;
            targetRisks: string[];
            estimatedEffectiveness: number;
            cost: number;
            timeline: string;
        }>;
    };
}
interface GrowthPlanningModel {
    planningId: string;
    schoolId?: string;
    generatedAt: Date;
    planningHorizon: {
        startDate: Date;
        endDate: Date;
    };
    growthOpportunities: Array<{
        opportunityId: string;
        title: string;
        category: 'geographic_expansion' | 'service_expansion' | 'market_penetration' | 'product_innovation';
        description: string;
        marketPotential: {
            totalAddressableMarket: number;
            servicableAddressableMarket: number;
            servicableObtainableMarket: number;
            marketGrowthRate: number;
            competitiveIntensity: number;
        };
        investmentRequirements: {
            initialInvestment: number;
            workingCapital: number;
            infrastructureInvestment: number;
            technologyInvestment: number;
            marketingInvestment: number;
            totalInvestment: number;
        };
        financialProjections: {
            revenueProjection: Array<{
                period: string;
                projectedRevenue: number;
                confidenceInterval: {
                    lower: number;
                    upper: number;
                };
            }>;
            breakEvenAnalysis: {
                breakEvenPoint: number;
                breakEvenRevenue: number;
                breakEvenUnits: number;
            };
            returnOnInvestment: {
                roi: number;
                paybackPeriod: number;
                netPresentValue: number;
                internalRateOfReturn: number;
            };
        };
        riskAssessment: {
            overallRiskLevel: 'low' | 'medium' | 'high' | 'very_high';
            keyRisks: Array<{
                risk: string;
                probability: number;
                impact: number;
                mitigationStrategy: string;
            }>;
            successProbability: number;
        };
        implementationPlan: Array<{
            phase: string;
            startDate: Date;
            endDate: Date;
            milestones: Array<{
                milestone: string;
                targetDate: Date;
                successMetrics: string[];
            }>;
            resourceRequirements: {
                humanResources: string[];
                financialResources: number;
                technicalResources: string[];
            };
        }>;
    }>;
    capacityExpansion: Array<{
        expansionId: string;
        triggerConditions: Array<{
            condition: string;
            currentValue: number;
            thresholdValue: number;
            timeToThreshold: number;
        }>;
        expansionOptions: Array<{
            option: string;
            description: string;
            capacityIncrease: number;
            investmentRequired: number;
            implementationTime: number;
            operationalImpact: string;
            riskFactors: string[];
        }>;
        recommendedExpansion: {
            option: string;
            rationale: string;
            timing: Date;
            phaseApproach: Array<{
                phase: number;
                description: string;
                capacityAddition: number;
                investment: number;
                startDate: Date;
                completionDate: Date;
            }>;
        };
    }>;
    marketAnalysis: {
        competitiveLandscape: Array<{
            competitor: string;
            marketShare: number;
            strengths: string[];
            weaknesses: string[];
            competitiveAdvantage: string;
        }>;
        marketTrends: Array<{
            trend: string;
            trendStrength: number;
            impactOnBusiness: number;
            timeHorizon: string;
            adaptationStrategy: string;
        }>;
        customerSegments: Array<{
            segment: string;
            size: number;
            growthRate: number;
            profitability: number;
            acquisitionCost: number;
            retentionRate: number;
            keyNeeds: string[];
        }>;
    };
    strategicRecommendations: Array<{
        recommendation: string;
        category: 'growth_strategy' | 'operational_excellence' | 'market_positioning' | 'risk_management';
        priority: 'critical' | 'high' | 'medium' | 'low';
        timeline: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
        expectedImpact: string;
        resourceRequirements: string;
        successMetrics: string[];
    }>;
}
declare class PredictiveInsightsEngine {
    private logger;
    private database;
    private forecastingModels;
    private historicalDataCache;
    private predictionCache;
    constructor();
    initialize(schools: any[] | undefined): Promise<void>;
    private initializeForecastingModels;
    private loadHistoricalData;
    private generateHistoricalEnrollmentData;
    private generateHistoricalDemandData;
    private generateHistoricalRevenueData;
    private trainForecastingModels;
    private trainSingleModel;
    private applyForecastingAlgorithm;
    private calculateTrend;
    private calculateAccuracy;
    private calculateMAPE;
    private calculateRMSE;
    private calculateR2Score;
    generateEnrollmentForecast(schoolId?: string): Promise<EnrollmentForecast>;
    private generateForecastPredictions;
    private calculateUncertaintyFactor;
    private identifyForecastFactors;
    private analyzeSeasonalPatterns;
    private analyzeGrowthTrajectory;
    generateDemandForecast(schoolId?: string): Promise<DemandForecast>;
    private generateDailyMealDemandPredictions;
    private generatePeakTimeDistribution;
    private generateWeeklyMealDemandPredictions;
    private generateMenuPopularityForecast;
    private generateCapacityPlanningInsights;
    getEngineStatus(): {
        status: 'healthy' | 'degraded' | 'critical';
        modelsLoaded: number;
        historicalDataSets: number;
        averageModelAccuracy: number;
        lastTrainingDate: Date;
    };
}
export declare const predictiveInsightsEngine: PredictiveInsightsEngine;
export { PredictiveInsightsEngine };
export type { EnrollmentForecast, DemandForecast, BudgetOptimizationModel, RiskAssessmentModel, GrowthPlanningModel, ForecastingModel, };
//# sourceMappingURL=predictive-insights-engine.d.ts.map