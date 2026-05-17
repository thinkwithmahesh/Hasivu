-- HASIVU Platform - Vendor Marketplace Database Schema
-- Epic 2 Story 5: Vendor Marketplace & Supply Chain
-- Comprehensive database schema for vendor marketplace system

-- =====================================================
-- VENDOR MANAGEMENT TABLES
-- =====================================================

-- Core vendor information table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  registration_number VARCHAR(100) UNIQUE,
  tax_id VARCHAR(50),
  business_type VARCHAR(50), -- corporation, llc, partnership, sole_proprietorship
  established_date DATE,
  headquarters TEXT,
  service_areas JSONB DEFAULT '[]',
  website VARCHAR(255),
  primary_contact VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  emergency_contact VARCHAR(255),
  categories JSONB DEFAULT '[]', -- Categories they serve
  is_active BOOLEAN DEFAULT true,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verification_date TIMESTAMP,
  verified_by UUID,
  onboarding_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor profiles with detailed information
CREATE TABLE vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  company_description TEXT,
  mission_statement TEXT,
  specializations JSONB DEFAULT '[]',
  capacity JSONB DEFAULT '{}', -- Daily, monthly, peak capacity
  technology_stack JSONB DEFAULT '[]',
  quality_standards JSONB DEFAULT '[]',
  sustainability_practices TEXT,
  insurance_info JSONB DEFAULT '{}',
  banking_details JSONB DEFAULT '{}', -- Encrypted banking information
  compliance_certificates JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor certifications and compliance
CREATE TABLE vendor_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issued_by VARCHAR(255),
  certificate_number VARCHAR(100),
  valid_from DATE,
  valid_until DATE,
  status VARCHAR(50) DEFAULT 'active', -- active, expired, suspended, pending
  document_url VARCHAR(500),
  auto_renewal BOOLEAN DEFAULT false,
  renewal_notification_days INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor performance metrics
CREATE TABLE vendor_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  delivery_reliability_score DECIMAL(5,2),
  communication_score DECIMAL(5,2),
  innovation_score DECIMAL(5,2),
  sustainability_score DECIMAL(5,2),
  compliance_score DECIMAL(5,2),
  financial_stability_score DECIMAL(5,2),
  risk_score DECIMAL(5,2),
  total_orders INTEGER DEFAULT 0,
  successful_orders INTEGER DEFAULT 0,
  on_time_deliveries INTEGER DEFAULT 0,
  quality_incidents INTEGER DEFAULT 0,
  customer_complaints INTEGER DEFAULT 0,
  average_resolution_time_hours DECIMAL(8,2),
  response_time_hours DECIMAL(8,2),
  measurement_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- PROCUREMENT AND RFP TABLES
-- =====================================================

-- RFP documents and generation
CREATE TABLE rfp_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  procurement_id VARCHAR(100) UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  rfp_template VARCHAR(50), -- standard, food_service, equipment, services, maintenance
  urgency VARCHAR(50) DEFAULT 'standard', -- standard, expedited, emergency
  document_content TEXT, -- Full RFP document
  evaluation_criteria JSONB DEFAULT '{}',
  timeline JSONB DEFAULT '{}',
  compliance_checklist JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft', -- draft, published, closed, awarded
  published_at TIMESTAMP,
  submission_deadline TIMESTAMP,
  evaluation_deadline TIMESTAMP,
  award_date TIMESTAMP,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RFP submissions from vendors
CREATE TABLE rfp_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfp_id UUID REFERENCES rfp_documents(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  submission_data JSONB DEFAULT '{}', -- All submission details
  technical_score DECIMAL(5,2),
  financial_score DECIMAL(5,2),
  overall_score DECIMAL(5,2),
  evaluation_notes TEXT,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, accepted, rejected
  submitted_at TIMESTAMP DEFAULT NOW(),
  evaluated_at TIMESTAMP,
  evaluated_by UUID REFERENCES users(id)
);

-- Procurement requests and tracking
CREATE TABLE procurement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  request_number VARCHAR(100) UNIQUE,
  requester_id UUID REFERENCES users(id),
  category_id VARCHAR(100),
  item_type VARCHAR(255),
  quantity INTEGER,
  urgency VARCHAR(50), -- low, medium, high, critical
  budget_min DECIMAL(12,2),
  budget_max DECIMAL(12,2),
  currency VARCHAR(10) DEFAULT 'INR',
  delivery_location TEXT,
  preferred_delivery_date TIMESTAMP,
  max_delivery_time_hours INTEGER,
  quality_specifications JSONB DEFAULT '{}',
  sustainability_requirements JSONB DEFAULT '{}',
  risk_tolerance VARCHAR(50), -- conservative, moderate, aggressive
  diversification_required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rfp_generated, awarded, completed
  ai_recommendations JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ORDER ORCHESTRATION TABLES
-- =====================================================

-- Order orchestration tracking
CREATE TABLE order_orchestrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  orchestration_id VARCHAR(100) UNIQUE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  order_type VARCHAR(50), -- standard, urgent, bulk, special
  total_vendors INTEGER,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, failed, cancelled
  vendor_assignments JSONB DEFAULT '[]',
  timeline JSONB DEFAULT '{}',
  risk_assessment JSONB DEFAULT '{}',
  sustainability_impact JSONB DEFAULT '{}',
  cost_optimization JSONB DEFAULT '{}',
  automation_level VARCHAR(50), -- manual, semi_automated, fully_automated
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Vendor assignments for orders
CREATE TABLE vendor_order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id UUID REFERENCES order_orchestrations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  order_items JSONB DEFAULT '[]',
  assigned_quantity INTEGER,
  estimated_cost DECIMAL(12,2),
  estimated_delivery TIMESTAMP,
  quality_score DECIMAL(5,2),
  assignment_reason TEXT,
  status VARCHAR(50) DEFAULT 'assigned', -- assigned, confirmed, in_progress, completed, failed
  confirmed_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- QUALITY CONTROL TABLES
-- =====================================================

-- Quality inspections
CREATE TABLE quality_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id VARCHAR(100) UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  inspection_type VARCHAR(50), -- visual, automated, hybrid, laboratory
  items_inspected JSONB DEFAULT '[]',
  quality_checks JSONB DEFAULT '[]',
  sampling_strategy JSONB DEFAULT '{}',
  overall_score DECIMAL(5,2),
  passed_checks INTEGER DEFAULT 0,
  failed_checks INTEGER DEFAULT 0,
  warning_checks INTEGER DEFAULT 0,
  automation_confidence DECIMAL(5,2),
  human_review_required BOOLEAN DEFAULT true,
  recommended_action VARCHAR(50), -- approve, reject, review
  inspector_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, approved, rejected
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  results JSONB DEFAULT '{}',
  documentation JSONB DEFAULT '{}', -- Images, videos, reports
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quality control automation results
CREATE TABLE quality_automation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES quality_inspections(id) ON DELETE CASCADE,
  check_type VARCHAR(100),
  automation_method VARCHAR(100), -- computer_vision, sensor, manual
  result VARCHAR(50), -- pass, fail, warning
  confidence_score DECIMAL(5,2),
  measured_values JSONB DEFAULT '{}',
  acceptance_criteria JSONB DEFAULT '{}',
  deviation_analysis JSONB DEFAULT '{}',
  ai_model_version VARCHAR(50),
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Inventory optimization tracking
CREATE TABLE inventory_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  item_id VARCHAR(100),
  item_name VARCHAR(255),
  current_stock DECIMAL(10,2),
  safety_stock_level DECIMAL(10,2),
  reorder_point DECIMAL(10,2),
  max_stock_level DECIMAL(10,2),
  demand_patterns JSONB DEFAULT '{}',
  supplier_info JSONB DEFAULT '{}',
  quality_requirements JSONB DEFAULT '{}',
  ai_recommendations JSONB DEFAULT '{}',
  forecast_data JSONB DEFAULT '{}',
  optimization_suggestions JSONB DEFAULT '[]',
  auto_reorder_triggered BOOLEAN DEFAULT false,
  reorder_quantity DECIMAL(10,2),
  selected_vendor_id UUID REFERENCES vendors(id),
  estimated_delivery TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active', -- active, reordered, completed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Demand forecasting data
CREATE TABLE demand_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  item_id VARCHAR(100),
  forecast_date DATE,
  forecast_horizon_days INTEGER,
  predicted_demand DECIMAL(10,2),
  confidence_lower DECIMAL(10,2),
  confidence_upper DECIMAL(10,2),
  confidence_level DECIMAL(3,2),
  trend VARCHAR(50), -- increasing, decreasing, stable, seasonal
  seasonality_factors JSONB DEFAULT '[]',
  external_factors JSONB DEFAULT '{}',
  model_accuracy DECIMAL(5,2),
  model_version VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- SUSTAINABILITY TRACKING TABLES
-- =====================================================

-- Sustainability tracking
CREATE TABLE sustainability_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id VARCHAR(100) UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  items_tracked JSONB DEFAULT '[]',
  carbon_footprint JSONB DEFAULT '{}', -- production, transportation, packaging, total
  sustainability_metrics JSONB DEFAULT '{}', -- organic, local, fair_trade, etc.
  waste_metrics JSONB DEFAULT '{}',
  social_impact JSONB DEFAULT '{}',
  sustainability_score DECIMAL(5,2),
  carbon_offset_purchased BOOLEAN DEFAULT false,
  offset_amount DECIMAL(10,2),
  offset_provider VARCHAR(255),
  report_generated BOOLEAN DEFAULT false,
  report_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Carbon footprint calculations
CREATE TABLE carbon_footprint_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_id UUID REFERENCES sustainability_tracking(id) ON DELETE CASCADE,
  emission_source VARCHAR(100), -- production, transportation, packaging, storage
  emission_factor DECIMAL(10,6),
  activity_data DECIMAL(10,2),
  emission_amount DECIMAL(10,4), -- kg CO2 equivalent
  calculation_method VARCHAR(100),
  data_source VARCHAR(255),
  uncertainty_percentage DECIMAL(5,2),
  calculation_date TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- LOGISTICS AND DELIVERY TABLES
-- =====================================================

-- Logistics optimization
CREATE TABLE logistics_optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  optimization_id VARCHAR(100) UNIQUE,
  delivery_date DATE,
  region VARCHAR(100),
  total_deliveries INTEGER,
  total_distance DECIMAL(10,2),
  total_time_minutes INTEGER,
  estimated_cost DECIMAL(12,2),
  fuel_consumption DECIMAL(10,2),
  carbon_emissions DECIMAL(10,4),
  optimization_algorithm VARCHAR(100),
  efficiency_gain DECIMAL(5,2),
  cost_savings DECIMAL(12,2),
  route_data JSONB DEFAULT '{}',
  vehicle_assignments JSONB DEFAULT '[]',
  constraints JSONB DEFAULT '{}',
  objectives JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'optimized', -- optimized, in_progress, completed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time delivery tracking
CREATE TABLE delivery_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  orchestration_id UUID REFERENCES order_orchestrations(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  tracking_number VARCHAR(100) UNIQUE,
  current_status VARCHAR(50), -- picked_up, in_transit, out_for_delivery, delivered, failed
  current_location JSONB DEFAULT '{}', -- coordinates and address
  estimated_delivery TIMESTAMP,
  actual_delivery TIMESTAMP,
  delivery_person VARCHAR(255),
  delivery_contact VARCHAR(50),
  special_instructions TEXT,
  delivery_proof JSONB DEFAULT '{}', -- photos, signatures, etc.
  tracking_history JSONB DEFAULT '[]',
  delays JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  customer_notifications JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS AND REPORTING TABLES
-- =====================================================

-- Vendor analytics aggregations
CREATE TABLE vendor_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  period_type VARCHAR(50), -- daily, weekly, monthly, quarterly
  period_start DATE,
  period_end DATE,
  total_orders INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  average_order_value DECIMAL(12,2),
  total_order_value DECIMAL(12,2),
  on_time_delivery_rate DECIMAL(5,2),
  quality_score_avg DECIMAL(5,2),
  customer_satisfaction_avg DECIMAL(5,2),
  issue_resolution_time_avg DECIMAL(8,2),
  revenue DECIMAL(12,2),
  profitability DECIMAL(5,2),
  cost_efficiency DECIMAL(5,2),
  sustainability_score_avg DECIMAL(5,2),
  carbon_footprint_total DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Cost analysis and optimization
CREATE TABLE cost_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  analysis_period_start DATE,
  analysis_period_end DATE,
  total_procurement_cost DECIMAL(12,2),
  cost_per_vendor JSONB DEFAULT '{}',
  cost_per_category JSONB DEFAULT '{}',
  optimization_opportunities JSONB DEFAULT '[]',
  potential_savings DECIMAL(12,2),
  actual_savings DECIMAL(12,2),
  cost_trends JSONB DEFAULT '{}',
  benchmark_comparison JSONB DEFAULT '{}',
  recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Risk assessments
CREATE TABLE risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50), -- vendor, supply_chain, category, overall
  assessment_date DATE DEFAULT CURRENT_DATE,
  overall_risk_score DECIMAL(5,2),
  vendor_risks JSONB DEFAULT '[]',
  supply_chain_risks JSONB DEFAULT '{}',
  risk_factors JSONB DEFAULT '[]',
  mitigation_strategies JSONB DEFAULT '[]',
  contingency_plans JSONB DEFAULT '[]',
  monitoring_frequency VARCHAR(50), -- daily, weekly, monthly
  next_assessment_date DATE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INTEGRATION AND EVENT TRACKING TABLES
-- =====================================================

-- Integration events
CREATE TABLE integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(100) UNIQUE,
  event_type VARCHAR(100),
  source VARCHAR(100),
  target VARCHAR(100),
  priority VARCHAR(50), -- low, medium, high, critical
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  data JSONB DEFAULT '{}',
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vendor monitoring alerts
CREATE TABLE vendor_monitoring_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  alert_type VARCHAR(50), -- performance, financial, compliance, quality, delivery
  severity VARCHAR(50), -- info, warning, critical, emergency
  title VARCHAR(255),
  description TEXT,
  metrics JSONB DEFAULT '{}',
  threshold_config JSONB DEFAULT '{}',
  recommended_actions JSONB DEFAULT '[]',
  escalation_required BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMP,
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- API request tracking
CREATE TABLE api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR(100),
  user_id UUID REFERENCES users(id),
  school_id UUID REFERENCES schools(id),
  endpoint VARCHAR(255),
  method VARCHAR(10),
  action VARCHAR(100),
  parameters JSONB DEFAULT '{}',
  response_status INTEGER,
  response_time_ms INTEGER,
  cache_hit BOOLEAN DEFAULT false,
  services_involved JSONB DEFAULT '[]',
  error_message TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Vendor indexes
CREATE INDEX idx_vendors_active ON vendors(is_active);
CREATE INDEX idx_vendors_categories ON vendors USING GIN(categories);
CREATE INDEX idx_vendors_service_areas ON vendors USING GIN(service_areas);
CREATE INDEX idx_vendors_verification ON vendors(verification_status);

-- Performance metrics indexes
CREATE INDEX idx_vendor_performance_vendor_date ON vendor_performance_metrics(vendor_id, measurement_date DESC);
CREATE INDEX idx_vendor_performance_overall_score ON vendor_performance_metrics(overall_score DESC);

-- RFP indexes
CREATE INDEX idx_rfp_school_status ON rfp_documents(school_id, status);
CREATE INDEX idx_rfp_deadline ON rfp_documents(submission_deadline);
CREATE INDEX idx_rfp_submissions_vendor ON rfp_submissions(vendor_id, submitted_at DESC);

-- Order orchestration indexes
CREATE INDEX idx_order_orchestrations_school ON order_orchestrations(school_id, created_at DESC);
CREATE INDEX idx_vendor_assignments_vendor ON vendor_order_assignments(vendor_id, created_at DESC);

-- Quality inspection indexes
CREATE INDEX idx_quality_inspections_order ON quality_inspections(order_id);
CREATE INDEX idx_quality_inspections_vendor ON quality_inspections(vendor_id, completed_at DESC);
CREATE INDEX idx_quality_inspections_status ON quality_inspections(status);

-- Inventory optimization indexes
CREATE INDEX idx_inventory_school_item ON inventory_optimizations(school_id, item_id);
CREATE INDEX idx_inventory_status ON inventory_optimizations(status);
CREATE INDEX idx_demand_forecasts_school_item ON demand_forecasts(school_id, item_id, forecast_date DESC);

-- Sustainability tracking indexes
CREATE INDEX idx_sustainability_order ON sustainability_tracking(order_id);
CREATE INDEX idx_sustainability_vendor ON sustainability_tracking(vendor_id, created_at DESC);
CREATE INDEX idx_sustainability_school ON sustainability_tracking(school_id, created_at DESC);

-- Analytics indexes
CREATE INDEX idx_vendor_analytics_vendor_period ON vendor_analytics(vendor_id, period_start DESC);
CREATE INDEX idx_vendor_analytics_school ON vendor_analytics(school_id, period_start DESC);
CREATE INDEX idx_cost_analysis_school ON cost_analysis(school_id, analysis_period_start DESC);

-- Alert and event indexes
CREATE INDEX idx_alerts_vendor_severity ON vendor_monitoring_alerts(vendor_id, severity, created_at DESC);
CREATE INDEX idx_alerts_unresolved ON vendor_monitoring_alerts(resolved, created_at DESC) WHERE NOT resolved;
CREATE INDEX idx_integration_events_status ON integration_events(status, priority, created_at);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update vendor performance scores automatically
CREATE OR REPLACE FUNCTION update_vendor_performance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update overall vendor performance when new metrics are added
  UPDATE vendors SET updated_at = NOW() WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vendor_performance
  AFTER INSERT OR UPDATE ON vendor_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_vendor_performance();

-- Auto-update certification status
CREATE OR REPLACE FUNCTION check_certification_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valid_until < CURRENT_DATE THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_certification_expiry
  BEFORE INSERT OR UPDATE ON vendor_certifications
  FOR EACH ROW EXECUTE FUNCTION check_certification_expiry();

-- Generate unique tracking numbers
CREATE OR REPLACE FUNCTION generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL THEN
    NEW.tracking_number = 'TRK' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_tracking_number
  BEFORE INSERT ON delivery_tracking
  FOR EACH ROW EXECUTE FUNCTION generate_tracking_number();

-- =====================================================
-- INITIAL DATA AND CONFIGURATION
-- =====================================================

-- Insert default vendor categories
INSERT INTO vendor_categories (name, description) VALUES
('Food & Beverages', 'Fresh food, packaged foods, beverages'),
('Kitchen Equipment', 'Cooking equipment, appliances, utensils'),
('Cleaning Supplies', 'Cleaning chemicals, equipment, maintenance'),
('Educational Materials', 'Books, stationery, teaching aids'),
('Technology', 'Computer equipment, software, digital services'),
('Maintenance Services', 'Facility maintenance, repairs, upgrades'),
('Transportation', 'Bus services, fuel, vehicle maintenance'),
('Utilities', 'Electricity, water, gas, internet services');

-- Insert default quality standards
INSERT INTO quality_standards (name, category, requirements) VALUES
('ISO 22000', 'Food Safety', 'Food safety management system requirements'),
('HACCP', 'Food Safety', 'Hazard Analysis and Critical Control Points'),
('Organic Certification', 'Sustainability', 'Certified organic products and processes'),
('Fair Trade', 'Social Responsibility', 'Fair trade certified products'),
('Halal Certification', 'Religious Compliance', 'Halal food certification'),
('FDA Approved', 'Regulatory', 'FDA approved products and facilities');

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hasivu_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hasivu_app;

-- Create materialized views for analytics performance
CREATE MATERIALIZED VIEW mv_vendor_performance_summary AS
SELECT
  v.id as vendor_id,
  v.name,
  v.verification_status,
  COUNT(o.id) as total_orders,
  AVG(vpm.overall_score) as avg_performance_score,
  AVG(vpm.quality_score) as avg_quality_score,
  AVG(vpm.delivery_reliability_score) as avg_delivery_score,
  SUM(o.total_amount) as total_revenue,
  MAX(vpm.created_at) as last_measured
FROM vendors v
LEFT JOIN orders o ON v.id = o.vendor_id
LEFT JOIN vendor_performance_metrics vpm ON v.id = vpm.vendor_id
WHERE v.is_active = true
GROUP BY v.id, v.name, v.verification_status;

CREATE UNIQUE INDEX idx_mv_vendor_performance_vendor_id ON mv_vendor_performance_summary(vendor_id);

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_vendor_performance_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vendor_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule daily refresh (requires pg_cron extension)
-- SELECT cron.schedule('refresh-vendor-performance', '0 6 * * *', 'SELECT refresh_vendor_performance_summary();');

COMMIT;