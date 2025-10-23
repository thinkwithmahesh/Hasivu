type PredictionValue = string | number | boolean | Record<string, unknown>;
type FeatureValue = string | number | boolean | null;
type VisualizationData = Record<string, unknown>;
export interface ExplanationRequest {
    modelType: string;
    features: Record<string, FeatureValue>;
    prediction: PredictionValue;
    schoolId: string;
    userId?: string;
    explanationType: 'shap' | 'lime' | 'natural_language' | 'counterfactual' | 'feature_importance' | 'comprehensive';
    audience: 'technical' | 'business' | 'student' | 'parent';
    detailLevel: 'simple' | 'detailed' | 'expert';
    includeUncertainty: boolean;
    includeBiasAnalysis: boolean;
}
export interface Explanation {
    explanationType: string;
    prediction: PredictionValue;
    confidence: number;
    uncertainty: {
        lower_bound: number;
        upper_bound: number;
        confidence_interval: number;
        sources_of_uncertainty: string[];
    };
    feature_importance: Array<{
        feature: string;
        importance: number;
        direction: 'positive' | 'negative';
        description: string;
        confidence: number;
    }>;
    natural_language: {
        summary: string;
        key_factors: string[];
        reasoning: string;
        recommendations: string[];
        caveats: string[];
    };
    shap_values?: {
        feature_contributions: Record<string, number>;
        base_value: number;
        expected_value: number;
        visualization_data: VisualizationData;
    };
    lime_explanation?: {
        local_weights: Record<string, number>;
        intercept: number;
        score: number;
        local_prediction: number;
    };
    counterfactuals?: Array<{
        scenario: string;
        changed_features: Record<string, FeatureValue>;
        predicted_outcome: PredictionValue;
        probability: number;
        feasibility: number;
    }>;
    bias_analysis?: {
        fairness_metrics: Record<string, number>;
        protected_attributes: string[];
        bias_score: number;
        mitigation_suggestions: string[];
    };
    metadata: {
        model_version: string;
        explanation_algorithm: string;
        computation_time: number;
        data_sources: string[];
        limitations: string[];
    };
}
export interface UncertaintyResult {
    prediction_uncertainty: {
        epistemic: number;
        aleatoric: number;
        total: number;
    };
    confidence_intervals: Array<{
        confidence_level: number;
        lower_bound: number;
        upper_bound: number;
        interval_width: number;
    }>;
    prediction_intervals: {
        percentile_5: number;
        percentile_25: number;
        percentile_75: number;
        percentile_95: number;
    };
    uncertainty_sources: Array<{
        source: string;
        contribution: number;
        description: string;
        mitigation: string;
    }>;
    reliability_assessment: {
        confidence_score: number;
        prediction_stability: number;
        data_quality_impact: number;
        model_confidence: number;
    };
}
export interface BiasDetectionResult {
    overall_bias_score: number;
    fairness_metrics: {
        demographic_parity: number;
        equalized_odds: number;
        calibration: number;
        individual_fairness: number;
    };
    protected_attributes: string[];
    recommendations: string[];
    compliance_status: Array<{
        regulation: string;
        compliant: boolean;
        issues?: string[];
    }>;
}
export interface CounterfactualResult {
    original_prediction: PredictionValue;
    counterfactuals: Array<{
        scenario: string;
        changes: Record<string, FeatureValue>;
        new_prediction: PredictionValue;
        feasibility: number;
    }>;
    sensitivity_analysis: {
        most_influential_features: string[];
        stability_score: number;
        robustness_metrics: Record<string, number>;
    };
}
export interface PredictionWithProtectedAttributes {
    features: Record<string, FeatureValue>;
    prediction: PredictionValue;
    actual?: PredictionValue;
    protected_attributes: Record<string, FeatureValue>;
}
export declare class ExplainabilityService {
    initialize(): Promise<void>;
    generateExplanation(request: ExplanationRequest): Promise<Explanation>;
    calculateUncertainty(_modelType: string, _features: Record<string, FeatureValue>, _prediction: PredictionValue): Promise<UncertaintyResult>;
    detectBias(_modelType: string, _predictions: PredictionWithProtectedAttributes[], _schoolId: string): Promise<BiasDetectionResult>;
    generateCounterfactualExplanation(_modelType: string, _features: Record<string, FeatureValue>, prediction: PredictionValue): Promise<CounterfactualResult>;
    generateNaturalLanguageExplanation(_explanation: Explanation, _audience: string, _detailLevel: string): Promise<{
        summary: string;
        key_factors: string[];
        reasoning: string;
        recommendations: string[];
        caveats: string[];
    }>;
}
export {};
//# sourceMappingURL=explainability.service.d.ts.map