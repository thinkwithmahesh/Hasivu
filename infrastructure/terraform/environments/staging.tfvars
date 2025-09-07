# HASIVU Platform - Staging Environment Configuration
# Terraform variables for staging infrastructure deployment

# Environment Configuration
environment = "staging"
project_name = "hasivu"
aws_region = "ap-south-1"
availability_zones = ["ap-south-1a", "ap-south-1b"]

# Domain and SSL Configuration
domain_name = "hasivu.com"
api_domain_name = "api-staging.hasivu.com"
admin_domain_name = "admin-staging.hasivu.com"
app_domain_name = "app-staging.hasivu.com"

# VPC Configuration
vpc_cidr = "10.1.0.0/16"
public_subnet_cidrs = ["10.1.1.0/24", "10.1.2.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24"]
database_subnet_cidrs = ["10.1.21.0/24", "10.1.22.0/24"]

# RDS PostgreSQL Configuration (Smaller for staging)
db_instance_class = "db.t4g.medium"
db_allocated_storage = 20
db_max_allocated_storage = 100
db_storage_type = "gp3"
db_storage_encrypted = true
db_backup_retention_period = 7
db_backup_window = "03:00-04:00"
db_maintenance_window = "sun:04:00-sun:05:00"
db_multi_az = false  # Cost optimization for staging
db_deletion_protection = false  # Allow easier cleanup in staging
db_performance_insights_enabled = true
db_performance_insights_retention_period = 7
db_monitoring_interval = 60
db_engine_version = "15.4"

# RDS Proxy Configuration
db_proxy_enabled = true
db_proxy_idle_client_timeout = 1800
db_proxy_max_connections_percent = 75
db_proxy_max_idle_connections_percent = 50

# ElastiCache Redis Configuration (Smaller for staging)
redis_node_type = "cache.t4g.micro"
redis_num_cache_nodes = 1
redis_parameter_group_name = "default.redis7"
redis_engine_version = "7.0"
redis_port = 6379
redis_at_rest_encryption_enabled = true
redis_transit_encryption_enabled = true
redis_auth_token_enabled = true
redis_automatic_failover_enabled = false  # Single node for staging
redis_multi_az_enabled = false
redis_backup_retention_limit = 1
redis_backup_window = "03:30-04:30"
redis_maintenance_window = "sun:05:00-sun:06:00"

# S3 Configuration
s3_versioning_enabled = true
s3_mfa_delete = false
s3_lifecycle_enabled = true
s3_lifecycle_expiration_days = 365  # 1 year for staging
s3_lifecycle_noncurrent_version_expiration_days = 30
s3_lifecycle_multipart_upload_days = 3
s3_public_access_block = true
s3_bucket_encryption = "AES256"
s3_cors_allowed_origins = ["https://app-staging.hasivu.com", "https://admin-staging.hasivu.com"]

# CloudFront Configuration
cloudfront_enabled = true
cloudfront_price_class = "PriceClass_100"  # Cost optimization
cloudfront_minimum_protocol_version = "TLSv1.2_2021"
cloudfront_compress = true
cloudfront_default_ttl = 3600
cloudfront_max_ttl = 86400

# Lambda Configuration
lambda_memory_size = 512  # Smaller for staging
lambda_timeout = 30
lambda_reserved_concurrency = 50
lambda_provisioned_concurrency = 0  # No provisioned concurrency for staging
lambda_dead_letter_queue_enabled = true
lambda_tracing_mode = "Active"
lambda_environment_variables = {
  NODE_ENV = "staging"
  LOG_LEVEL = "debug"
  X_RAY_TRACING = "true"
  POWERTOOLS_SERVICE_NAME = "hasivu-platform-api"
  POWERTOOLS_METRICS_NAMESPACE = "HASIVU/Platform/Staging"
}

# API Gateway Configuration
api_gateway_throttle_burst_limit = 500
api_gateway_throttle_rate_limit = 250
api_gateway_logging_level = "INFO"
api_gateway_data_trace_enabled = true  # More detailed logging for staging
api_gateway_metrics_enabled = true
api_gateway_caching_enabled = false  # Disable caching for testing
api_gateway_cache_cluster_size = "0.5"
api_gateway_cache_ttl = 300

# WAF Configuration (Simplified for staging)
waf_enabled = true
waf_rate_limit = 1000
waf_block_countries = []  # Allow all countries in staging
waf_whitelist_ips = []
waf_enable_geo_blocking = false
waf_enable_rate_limiting = true
waf_enable_ip_reputation = false  # Disable for easier testing
waf_enable_sql_injection_protection = true
waf_enable_xss_protection = true

# CloudWatch Configuration
cloudwatch_log_retention_days = 14  # Shorter retention for staging
cloudwatch_metrics_enabled = true
cloudwatch_detailed_monitoring = false  # Cost optimization
cloudwatch_dashboard_enabled = true

# CloudWatch Alarms Configuration (Less sensitive for staging)
alarms_enabled = true
alarm_notification_email = "staging-alerts@hasivu.com"
lambda_error_threshold = 20
lambda_duration_threshold = 28000  # 28 seconds
lambda_throttles_threshold = 10
api_gateway_4xx_threshold = 100
api_gateway_5xx_threshold = 20
api_gateway_latency_threshold = 10000  # 10 seconds
rds_cpu_threshold = 90
rds_connections_threshold = 90
redis_cpu_threshold = 90
redis_memory_threshold = 90

# Security Configuration (Relaxed for staging)
enable_vpc_flow_logs = false  # Cost optimization
enable_cloudtrail = true
enable_config = false  # Cost optimization
enable_guardduty = false  # Cost optimization
enable_security_hub = false  # Cost optimization
enable_inspector = false  # Cost optimization
kms_key_rotation_enabled = false  # Cost optimization

# Secrets Manager Configuration
secrets_automatic_rotation = false  # Manual rotation for staging
secrets_rotation_days = 180

# Backup Configuration (Minimal for staging)
backup_enabled = true
backup_schedule = "cron(0 3 * * 0)"  # Weekly backups only
backup_retention_days = 7
backup_cold_storage_after_days = 30

# Auto Scaling Configuration (Minimal for staging)
auto_scaling_enabled = false  # Manual scaling for staging
auto_scaling_min_capacity = 1
auto_scaling_max_capacity = 10
auto_scaling_target_cpu = 80
auto_scaling_scale_in_cooldown = 300
auto_scaling_scale_out_cooldown = 300

# Monitoring and Observability
enable_xray_tracing = true
enable_application_insights = false  # Cost optimization
enable_container_insights = false  # Cost optimization

# Cost Optimization (More aggressive for staging)
enable_cost_optimization = true
schedule_enabled = true
schedule_start_time = "09:00"  # Later start for staging
schedule_stop_time = "21:00"   # Earlier stop for staging
schedule_timezone = "Asia/Kolkata"

# Tags
tags = {
  Environment = "staging"
  Project = "HASIVU"
  ManagedBy = "Terraform"
  Owner = "DevOps-Team"
  CostCenter = "Engineering"
  Purpose = "Testing"
  AutoShutdown = "enabled"
  DataRetention = "short"
}