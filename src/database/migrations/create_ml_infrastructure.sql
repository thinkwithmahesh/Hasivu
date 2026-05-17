-- HASIVU PREDICTIVE ANALYTICS ENGINE DATABASE SCHEMA
-- Epic 3 → Story 1: ML Infrastructure Database Tables
--
-- Comprehensive database schema for the ML platform with model management,
-- prediction logging, federated learning, and comprehensive analytics.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Model Artifacts and Metadata
CREATE TABLE IF NOT EXISTS model_artifacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(255) UNIQUE NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    school_id UUID REFERENCES schools(id),
    version VARCHAR(50) NOT NULL,
    algorithm VARCHAR(100) NOT NULL,
    hyperparameters JSONB NOT NULL DEFAULT '{}',
    training_config JSONB NOT NULL DEFAULT '{}',
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    artifact_path TEXT NOT NULL,
    model_size BIGINT DEFAULT 0,
    feature_schema JSONB NOT NULL DEFAULT '{}',
    training_data_hash VARCHAR(64),
    training_data_size INTEGER DEFAULT 0,
    training_duration INTEGER DEFAULT 0, -- seconds
    status VARCHAR(50) DEFAULT 'training',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

CREATE INDEX idx_model_artifacts_model_type ON model_artifacts(model_type);
CREATE INDEX idx_model_artifacts_school_id ON model_artifacts(school_id);
CREATE INDEX idx_model_artifacts_status ON model_artifacts(status);
CREATE INDEX idx_model_artifacts_created_at ON model_artifacts(created_at);

-- Prediction Logs
CREATE TABLE IF NOT EXISTS prediction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(255) NOT NULL,
    school_id UUID NOT NULL,
    user_id UUID REFERENCES users(id),
    prediction_id VARCHAR(255) UNIQUE NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    input_features JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence REAL DEFAULT 0.0,
    latency INTEGER NOT NULL, -- milliseconds
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    actual_outcome JSONB,
    feedback_score REAL,
    explanation JSONB,
    error_message TEXT,
    experiment_group VARCHAR(100),
    prediction_horizon VARCHAR(20),
    cache_hit BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_prediction_logs_model_id ON prediction_logs(model_id);
CREATE INDEX idx_prediction_logs_school_id ON prediction_logs(school_id);
CREATE INDEX idx_prediction_logs_timestamp ON prediction_logs(timestamp DESC);
CREATE INDEX idx_prediction_logs_model_type ON prediction_logs(model_type);
CREATE INDEX idx_prediction_logs_experiment_group ON prediction_logs(experiment_group);

-- Feature Store
CREATE TABLE IF NOT EXISTS feature_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- categorical, numerical, text, embedding, derived
    description TEXT NOT NULL,
    source JSONB NOT NULL, -- table, column, computation, dependencies
    transformation JSONB NOT NULL, -- method, parameters
    validation JSONB NOT NULL, -- constraints, rules
    versioning JSONB NOT NULL, -- version, dates, compatibility
    metadata JSONB NOT NULL, -- owner, tags, sla
    deprecated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feature_definitions_name ON feature_definitions(name);
CREATE INDEX idx_feature_definitions_type ON feature_definitions(type);
CREATE INDEX idx_feature_definitions_deprecated ON feature_definitions(deprecated);

-- Feature Values Store
CREATE TABLE IF NOT EXISTS feature_store (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feature_name VARCHAR(255) NOT NULL,
    school_id UUID NOT NULL,
    entity_id VARCHAR(255) NOT NULL, -- student_id, meal_id, etc.
    feature_value JSONB NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    version VARCHAR(50) NOT NULL,
    quality_score REAL DEFAULT 1.0,
    computation_time INTEGER DEFAULT 0, -- milliseconds
    source VARCHAR(255),
    UNIQUE(feature_name, school_id, entity_id, version)
);

CREATE INDEX idx_feature_store_feature_name ON feature_store(feature_name);
CREATE INDEX idx_feature_store_school_id ON feature_store(school_id);
CREATE INDEX idx_feature_store_entity_id ON feature_store(entity_id);
CREATE INDEX idx_feature_store_computed_at ON feature_store(computed_at DESC);
CREATE INDEX idx_feature_store_expires_at ON feature_store(expires_at);

-- Federated Learning Participants
CREATE TABLE IF NOT EXISTS federated_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id VARCHAR(255) UNIQUE NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id),
    public_key TEXT NOT NULL,
    capabilities JSONB NOT NULL DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    trust_score REAL DEFAULT 0.5,
    contribution_score REAL DEFAULT 0.0,
    privacy_budget JSONB NOT NULL DEFAULT '{}',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_federated_participants_school_id ON federated_participants(school_id);
CREATE INDEX idx_federated_participants_status ON federated_participants(status);
CREATE INDEX idx_federated_participants_last_seen ON federated_participants(last_seen DESC);

-- Federated Learning Rounds
CREATE TABLE IF NOT EXISTS federated_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id VARCHAR(255) UNIQUE NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    participants TEXT[] NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'initializing',
    aggregation_method VARCHAR(50) NOT NULL,
    privacy_config JSONB NOT NULL DEFAULT '{}',
    global_model_weights BYTEA,
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    round_number INTEGER NOT NULL,
    convergence_score REAL DEFAULT 0.0
);

CREATE INDEX idx_federated_rounds_model_type ON federated_rounds(model_type);
CREATE INDEX idx_federated_rounds_status ON federated_rounds(status);
CREATE INDEX idx_federated_rounds_start_time ON federated_rounds(start_time DESC);

-- Model Monitoring Configuration
CREATE TABLE IF NOT EXISTS model_monitoring_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(255) UNIQUE NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    school_id UUID REFERENCES schools(id),
    monitoring_frequency INTEGER DEFAULT 15, -- minutes
    thresholds JSONB NOT NULL DEFAULT '{}',
    alerts JSONB NOT NULL DEFAULT '{}',
    retraining JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_model_monitoring_configs_model_id ON model_monitoring_configs(model_id);
CREATE INDEX idx_model_monitoring_configs_school_id ON model_monitoring_configs(school_id);

-- Model Drift Detection Results
CREATE TABLE IF NOT EXISTS drift_detection_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    drift_type VARCHAR(50) NOT NULL, -- data_drift, model_drift, concept_drift
    severity VARCHAR(50) NOT NULL,
    drift_score REAL NOT NULL,
    affected_features JSONB NOT NULL DEFAULT '[]',
    root_cause JSONB,
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    statistical_tests JSONB NOT NULL DEFAULT '{}',
    baseline_period JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_drift_detection_model_id ON drift_detection_results(model_id);
CREATE INDEX idx_drift_detection_timestamp ON drift_detection_results(timestamp DESC);
CREATE INDEX idx_drift_detection_severity ON drift_detection_results(severity);

-- AutoML Experiments
CREATE TABLE IF NOT EXISTS automl_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'initializing',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    config JSONB NOT NULL,
    trials JSONB NOT NULL DEFAULT '[]',
    best_trial JSONB,
    leaderboard JSONB NOT NULL DEFAULT '[]',
    insights JSONB NOT NULL DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    school_id UUID REFERENCES schools(id)
);

CREATE INDEX idx_automl_experiments_status ON automl_experiments(status);
CREATE INDEX idx_automl_experiments_start_time ON automl_experiments(start_time DESC);
CREATE INDEX idx_automl_experiments_school_id ON automl_experiments(school_id);

-- Explanation Templates
CREATE TABLE IF NOT EXISTS explanation_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audience VARCHAR(50) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    complexity_level VARCHAR(50) NOT NULL,
    templates JSONB NOT NULL,
    terminology JSONB NOT NULL DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_explanation_templates_audience ON explanation_templates(audience);
CREATE INDEX idx_explanation_templates_active ON explanation_templates(active);

-- User Profiles for Recommendations
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    user_type VARCHAR(50) NOT NULL,
    school_id UUID NOT NULL REFERENCES schools(id),
    demographics JSONB NOT NULL DEFAULT '{}',
    preferences JSONB NOT NULL DEFAULT '{}',
    embedding JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_school_id ON user_profiles(school_id);
CREATE INDEX idx_user_profiles_user_type ON user_profiles(user_type);

-- User Behavior for Recommendations
CREATE TABLE IF NOT EXISTS user_behavior (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    behavior JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_behavior_user_id ON user_behavior(user_id);

-- User Health Profiles
CREATE TABLE IF NOT EXISTS user_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    health_profile JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_health_user_id ON user_health(user_id);

-- Item Profiles for Recommendations
CREATE TABLE IF NOT EXISTS item_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id VARCHAR(255) UNIQUE NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    school_id UUID REFERENCES schools(id),
    properties JSONB NOT NULL DEFAULT '{}',
    relationships JSONB NOT NULL DEFAULT '[]',
    embedding JSONB NOT NULL DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_item_profiles_item_id ON item_profiles(item_id);
CREATE INDEX idx_item_profiles_item_type ON item_profiles(item_type);
CREATE INDEX idx_item_profiles_school_id ON item_profiles(school_id);

-- Item Metrics for Recommendations
CREATE TABLE IF NOT EXISTS item_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id VARCHAR(255) NOT NULL,
    performance_metrics JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_item_metrics_item_id ON item_metrics(item_id);

-- Recommendation Logs
CREATE TABLE IF NOT EXISTS recommendation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recommendation_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    school_id UUID NOT NULL REFERENCES schools(id),
    recommendation_type VARCHAR(100) NOT NULL,
    recommendations JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendation_logs_user_id ON recommendation_logs(user_id);
CREATE INDEX idx_recommendation_logs_school_id ON recommendation_logs(school_id);
CREATE INDEX idx_recommendation_logs_created_at ON recommendation_logs(created_at DESC);

-- A/B Test Experiments
CREATE TABLE IF NOT EXISTS ab_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experiment_id VARCHAR(255) UNIQUE NOT NULL,
    model_a VARCHAR(255) NOT NULL,
    model_b VARCHAR(255) NOT NULL,
    traffic_split REAL NOT NULL DEFAULT 0.5,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'running',
    results JSONB NOT NULL DEFAULT '{}',
    statistical_significance JSONB NOT NULL DEFAULT '{}',
    winner VARCHAR(10), -- 'A', 'B', or null
    school_id UUID REFERENCES schools(id)
);

CREATE INDEX idx_ab_experiments_status ON ab_experiments(status);
CREATE INDEX idx_ab_experiments_school_id ON ab_experiments(school_id);
CREATE INDEX idx_ab_experiments_start_time ON ab_experiments(start_time DESC);

-- Training Data for Models
CREATE TABLE IF NOT EXISTS training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_type VARCHAR(100) NOT NULL,
    school_id UUID REFERENCES schools(id),
    data_hash VARCHAR(64) NOT NULL,
    features JSONB NOT NULL,
    target JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    data_quality REAL DEFAULT 1.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_validation BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_training_data_model_type ON training_data(model_type);
CREATE INDEX idx_training_data_school_id ON training_data(school_id);
CREATE INDEX idx_training_data_created_at ON training_data(created_at DESC);
CREATE INDEX idx_training_data_data_hash ON training_data(data_hash);

-- Data Quality Reports
CREATE TABLE IF NOT EXISTS data_quality_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id),
    report_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    overall_score REAL NOT NULL,
    feature_quality JSONB NOT NULL DEFAULT '{}',
    issues JSONB NOT NULL DEFAULT '[]',
    drift_detection JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX idx_data_quality_reports_school_id ON data_quality_reports(school_id);
CREATE INDEX idx_data_quality_reports_date ON data_quality_reports(report_date DESC);

-- Compliance Reports
CREATE TABLE IF NOT EXISTS compliance_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id VARCHAR(255) NOT NULL,
    school_id UUID REFERENCES schools(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    regulations JSONB NOT NULL DEFAULT '[]',
    audit_trail JSONB NOT NULL DEFAULT '[]',
    data_lineage JSONB NOT NULL DEFAULT '{}',
    privacy_assessment JSONB NOT NULL DEFAULT '{}',
    compliant BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_compliance_reports_model_id ON compliance_reports(model_id);
CREATE INDEX idx_compliance_reports_school_id ON compliance_reports(school_id);
CREATE INDEX idx_compliance_reports_timestamp ON compliance_reports(timestamp DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_model_artifacts_updated_at BEFORE UPDATE ON model_artifacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_definitions_updated_at BEFORE UPDATE ON feature_definitions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_federated_participants_updated_at BEFORE UPDATE ON federated_participants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_model_monitoring_configs_updated_at BEFORE UPDATE ON model_monitoring_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_explanation_templates_updated_at BEFORE UPDATE ON explanation_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_behavior_updated_at BEFORE UPDATE ON user_behavior FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_health_updated_at BEFORE UPDATE ON user_health FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_profiles_updated_at BEFORE UPDATE ON item_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_item_metrics_updated_at BEFORE UPDATE ON item_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default explanation templates
INSERT INTO explanation_templates (audience, language, complexity_level, templates, terminology) VALUES
('technical', 'en', 'advanced',
 '{"summary": "Model {model_type} predicted {prediction} with {confidence}% confidence based on feature analysis.",
   "feature_importance": "Key contributing factors: {top_features}",
   "uncertainty": "Prediction uncertainty: ±{uncertainty_range} with {confidence_level}% confidence interval",
   "recommendation": "Recommended actions: {actions}",
   "caveat": "Limitations: {limitations}"}',
 '{"accuracy": "model accuracy", "precision": "positive predictive value", "recall": "sensitivity"}'
),
('business', 'en', 'intermediate',
 '{"summary": "Based on data analysis, we predict {prediction} with {confidence}% confidence.",
   "feature_importance": "Main factors influencing this prediction: {top_features}",
   "uncertainty": "This prediction has an uncertainty range of ±{uncertainty_range}",
   "recommendation": "We recommend: {actions}",
   "caveat": "Please note: {limitations}"}',
 '{"accuracy": "how often predictions are correct", "confidence": "certainty level", "drift": "data pattern changes"}'
),
('student', 'en', 'simple',
 '{"summary": "We think {prediction} will happen with {confidence}% chance.",
   "feature_importance": "This is mainly because of: {top_features}",
   "uncertainty": "We could be off by about {uncertainty_range}",
   "recommendation": "You might want to: {actions}",
   "caveat": "Keep in mind: {limitations}"}',
 '{"prediction": "what we think will happen", "confidence": "how sure we are", "factors": "things that matter"}'
),
('parent', 'en', 'simple',
 '{"summary": "Our analysis suggests {prediction} with {confidence}% confidence for your child.",
   "feature_importance": "Key factors include: {top_features}",
   "uncertainty": "The prediction range is ±{uncertainty_range}",
   "recommendation": "Consider: {actions}",
   "caveat": "Important to know: {limitations}"}',
 '{"analysis": "data review", "factors": "important influences", "confidence": "certainty level"}'
);

-- Insert default feature definitions for common model types
INSERT INTO feature_definitions (name, type, description, source, transformation, validation, versioning, metadata) VALUES
('student_age', 'numerical', 'Student age in years',
 '{"table": "students", "column": "age"}',
 '{"method": "standardization", "parameters": {"mean": 12, "std": 3}}',
 '{"required": true, "min": 5, "max": 18}',
 '{"version": "1.0", "createdAt": "2024-01-01", "updatedAt": "2024-01-01", "backwardCompatible": true}',
 '{"owner": "ml_team", "tags": ["demographic"], "businessLogic": "Age influences meal preferences", "sla": {"freshness": 86400, "availability": 99.9, "accuracy": 95.0}}'
),
('meal_preferences', 'categorical', 'Student meal preference categories',
 '{"table": "meal_preferences", "column": "category"}',
 '{"method": "encoding", "parameters": {"type": "one_hot"}}',
 '{"required": false, "allowedValues": ["vegetarian", "vegan", "regular", "gluten_free"]}',
 '{"version": "1.0", "createdAt": "2024-01-01", "updatedAt": "2024-01-01", "backwardCompatible": true}',
 '{"owner": "nutrition_team", "tags": ["preference"], "businessLogic": "Dietary preferences affect meal selection", "sla": {"freshness": 3600, "availability": 99.5, "accuracy": 90.0}}'
),
('historical_demand', 'numerical', 'Historical meal demand patterns',
 '{"table": "orders", "computation": "COUNT(*) GROUP BY meal_id, date"}',
 '{"method": "normalization", "parameters": {"min": 0, "max": 1000}}',
 '{"required": true, "min": 0}',
 '{"version": "1.0", "createdAt": "2024-01-01", "updatedAt": "2024-01-01", "backwardCompatible": true}',
 '{"owner": "operations_team", "tags": ["demand", "historical"], "businessLogic": "Past demand predicts future needs", "sla": {"freshness": 1800, "availability": 99.9, "accuracy": 85.0}}'
);

COMMENT ON TABLE model_artifacts IS 'Stores ML model metadata, performance metrics, and artifact locations';
COMMENT ON TABLE prediction_logs IS 'Logs all predictions made by ML models for monitoring and analysis';
COMMENT ON TABLE feature_definitions IS 'Defines features used in ML models with validation and transformation rules';
COMMENT ON TABLE feature_store IS 'Stores computed feature values for efficient model serving';
COMMENT ON TABLE federated_participants IS 'Tracks schools participating in federated learning';
COMMENT ON TABLE federated_rounds IS 'Records federated learning training rounds and results';
COMMENT ON TABLE model_monitoring_configs IS 'Configuration for monitoring ML models in production';
COMMENT ON TABLE drift_detection_results IS 'Results from model and data drift detection algorithms';
COMMENT ON TABLE automl_experiments IS 'Tracks AutoML experiments and their results';
COMMENT ON TABLE user_profiles IS 'User profiles for personalized recommendations';
COMMENT ON TABLE recommendation_logs IS 'Logs generated recommendations and user feedback';