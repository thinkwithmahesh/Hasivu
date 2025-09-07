# HASIVU Platform - Production Environment Configuration
# Terraform variables for production infrastructure deployment

# Environment Configuration
environment = "production"
project_name = "hasivu"
aws_region = "ap-south-1"
availability_zones = ["ap-south-1a", "ap-south-1b", "ap-south-1c"]

# Domain and SSL Configuration
domain_name = "hasivu.com"
api_domain_name = "api.hasivu.com"
admin_domain_name = "admin.hasivu.com"
app_domain_name = "app.hasivu.com"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]

# RDS PostgreSQL Configuration
db_instance_class = "db.r6g.large"
db_allocated_storage = 100
db_max_allocated_storage = 1000
db_storage_type = "gp3"
db_storage_encrypted = true
db_backup_retention_period = 30
db_backup_window = "03:00-04:00"
db_maintenance_window = "sun:04:00-sun:05:00"
db_multi_az = true
db_deletion_protection = true
db_performance_insights_enabled = true
db_performance_insights_retention_period = 7
db_monitoring_interval = 60
db_engine_version = "15.4"

# RDS Proxy Configuration
db_proxy_enabled = true
db_proxy_idle_client_timeout = 1800
db_proxy_max_connections_percent = 80
db_proxy_max_idle_connections_percent = 50

# ElastiCache Redis Configuration
redis_node_type = "cache.r7g.large"
redis_num_cache_nodes = 3
redis_parameter_group_name = "default.redis7"
redis_engine_version = "7.0"
redis_port = 6379
redis_at_rest_encryption_enabled = true
redis_transit_encryption_enabled = true
redis_auth_token_enabled = true
redis_automatic_failover_enabled = true
redis_multi_az_enabled = true
redis_backup_retention_limit = 7
redis_backup_window = "03:30-04:30"
redis_maintenance_window = "sun:05:00-sun:06:00"

# S3 Configuration
s3_versioning_enabled = true
s3_mfa_delete = false
s3_lifecycle_enabled = true
s3_lifecycle_expiration_days = 2555  # 7 years
s3_lifecycle_noncurrent_version_expiration_days = 90
s3_lifecycle_multipart_upload_days = 7
s3_public_access_block = true
s3_bucket_encryption = "AES256"
s3_cors_allowed_origins = ["https://app.hasivu.com", "https://admin.hasivu.com", "https://www.hasivu.com"]

# CloudFront Configuration
cloudfront_enabled = true
cloudfront_price_class = "PriceClass_All"
cloudfront_minimum_protocol_version = "TLSv1.2_2021"
cloudfront_compress = true
cloudfront_default_ttl = 86400
cloudfront_max_ttl = 31536000

# Lambda Configuration
lambda_memory_size = 1024
lambda_timeout = 30
lambda_reserved_concurrency = 100
lambda_provisioned_concurrency = 10
lambda_dead_letter_queue_enabled = true
lambda_tracing_mode = "Active"
lambda_environment_variables = {
  NODE_ENV = "production"
  LOG_LEVEL = "info"
  X_RAY_TRACING = "true"
  POWERTOOLS_SERVICE_NAME = "hasivu-platform-api"
  POWERTOOLS_METRICS_NAMESPACE = "HASIVU/Platform"
}

# API Gateway Configuration
api_gateway_throttle_burst_limit = 2000
api_gateway_throttle_rate_limit = 1000
api_gateway_logging_level = "INFO"
api_gateway_data_trace_enabled = false
api_gateway_metrics_enabled = true
api_gateway_caching_enabled = true
api_gateway_cache_cluster_size = "0.5"
api_gateway_cache_ttl = 300

# WAF Configuration
waf_enabled = true
waf_rate_limit = 2000
waf_block_countries = ["CN", "RU", "KP"]  # Block certain countries
waf_whitelist_ips = []  # Add trusted IPs if needed
waf_enable_geo_blocking = true
waf_enable_rate_limiting = true
waf_enable_ip_reputation = true
waf_enable_sql_injection_protection = true
waf_enable_xss_protection = true

# CloudWatch Configuration
cloudwatch_log_retention_days = 30
cloudwatch_metrics_enabled = true
cloudwatch_detailed_monitoring = true
cloudwatch_dashboard_enabled = true

# CloudWatch Alarms Configuration
alarms_enabled = true
alarm_notification_email = "alerts@hasivu.com"
lambda_error_threshold = 10
lambda_duration_threshold = 25000  # 25 seconds
lambda_throttles_threshold = 5
api_gateway_4xx_threshold = 50
api_gateway_5xx_threshold = 10
api_gateway_latency_threshold = 5000  # 5 seconds
rds_cpu_threshold = 80
rds_connections_threshold = 80  # Percentage of max connections
redis_cpu_threshold = 80
redis_memory_threshold = 80

# Security Configuration
enable_vpc_flow_logs = true
enable_cloudtrail = true
enable_config = true
enable_guardduty = true
enable_security_hub = true
enable_inspector = true
kms_key_rotation_enabled = true

# Secrets Manager Configuration
secrets_automatic_rotation = true
secrets_rotation_days = 90

# Backup Configuration
backup_enabled = true
backup_schedule = "cron(0 2 * * ? *)"  # Daily at 2 AM
backup_retention_days = 35
backup_cold_storage_after_days = 30

# Auto Scaling Configuration
auto_scaling_enabled = true
auto_scaling_min_capacity = 2
auto_scaling_max_capacity = 100
auto_scaling_target_cpu = 70
auto_scaling_scale_in_cooldown = 300
auto_scaling_scale_out_cooldown = 300

# Monitoring and Observability
enable_xray_tracing = true
enable_application_insights = true
enable_container_insights = true

# Cost Optimization
enable_cost_optimization = true
schedule_enabled = true
schedule_start_time = "06:00"  # IST morning
schedule_stop_time = "23:00"   # IST night
schedule_timezone = "Asia/Kolkata"

# Tags
tags = {
  Environment = "production"
  Project = "HASIVU"
  ManagedBy = "Terraform"
  Owner = "DevOps-Team"
  CostCenter = "Engineering"
  Compliance = "SOC2"
  BackupEnabled = "true"
  MonitoringEnabled = "true"
  SecurityScanning = "enabled"
  DataClassification = "internal"
}