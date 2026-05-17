#!/bin/bash

# HASIVU Platform - Production Monitoring Deployment Script
# Deploys comprehensive monitoring infrastructure for production environment
# Created by DevOps Automation Specialist

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
AWS_REGION="${AWS_REGION:-ap-south-1}"
STACK_PREFIX="hasivu-platform"
ALERTING_EMAIL="${ALERTING_EMAIL:-ops-alerts@hasivu.com}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured properly."
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "serverless.yml" ]; then
        log_error "Please run this script from the HASIVU platform root directory."
        exit 1
    fi
    
    # Check monitoring directory exists
    if [ ! -d "monitoring" ]; then
        log_error "Monitoring directory not found. Please ensure monitoring files are present."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Validate stack parameters
validate_parameters() {
    log "Validating deployment parameters..."
    
    # Get current Lambda function prefix
    LAMBDA_FUNCTION_PREFIX=$(aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '${STACK_PREFIX}-${ENVIRONMENT}')].FunctionName" \
        --output text | head -1 | cut -d'-' -f1-2 || echo "${STACK_PREFIX}-${ENVIRONMENT}")
    
    # Get database instance ID
    DATABASE_INSTANCE_ID=$(aws rds describe-db-instances \
        --query "DBInstances[?contains(DBInstanceIdentifier, 'hasivu')].DBInstanceIdentifier" \
        --output text | head -1 || echo "${ENVIRONMENT}-hasivu-db")
    
    # Get API Gateway ID
    API_GATEWAY_ID=$(aws apigateway get-rest-apis \
        --query "items[?contains(name, 'hasivu')].id" \
        --output text | head -1 || echo "")
    
    log "Using parameters:"
    log "  Environment: ${ENVIRONMENT}"
    log "  AWS Region: ${AWS_REGION}"
    log "  Lambda Prefix: ${LAMBDA_FUNCTION_PREFIX}"
    log "  Database ID: ${DATABASE_INSTANCE_ID}"
    log "  API Gateway ID: ${API_GATEWAY_ID}"
    log "  Alerting Email: ${ALERTING_EMAIL}"
    
    log_success "Parameter validation completed"
}

# Deploy CloudWatch Dashboards
deploy_dashboards() {
    log "Deploying CloudWatch Dashboards..."
    
    local STACK_NAME="${STACK_PREFIX}-${ENVIRONMENT}-dashboards"
    
    aws cloudformation deploy \
        --template-file monitoring/cloudwatch-dashboards.yml \
        --stack-name "${STACK_NAME}" \
        --parameter-overrides \
            Environment="${ENVIRONMENT}" \
            ApiGatewayId="${API_GATEWAY_ID}" \
            LambdaFunctionPrefix="${LAMBDA_FUNCTION_PREFIX}" \
        --capabilities CAPABILITY_IAM \
        --region "${AWS_REGION}" \
        --no-fail-on-empty-changeset
    
    if [ $? -eq 0 ]; then
        log_success "CloudWatch Dashboards deployed successfully"
        
        # Get dashboard URLs
        local DASHBOARD_URLS=$(aws cloudformation describe-stacks \
            --stack-name "${STACK_NAME}" \
            --query 'Stacks[0].Outputs[?contains(OutputKey, `DashboardURL`)].OutputValue' \
            --output text \
            --region "${AWS_REGION}")
        
        log "Dashboard URLs:"
        echo "${DASHBOARD_URLS}" | while read -r url; do
            if [ -n "$url" ]; then
                log "  - ${url}"
            fi
        done
    else
        log_error "Failed to deploy CloudWatch Dashboards"
        return 1
    fi
}

# Deploy CloudWatch Alarms
deploy_alarms() {
    log "Deploying CloudWatch Alarms..."
    
    local STACK_NAME="${STACK_PREFIX}-${ENVIRONMENT}-alarms"
    
    aws cloudformation deploy \
        --template-file monitoring/cloudwatch-alarms.yml \
        --stack-name "${STACK_NAME}" \
        --parameter-overrides \
            Environment="${ENVIRONMENT}" \
            AlertingEmail="${ALERTING_EMAIL}" \
            SlackWebhookURL="${SLACK_WEBHOOK_URL}" \
            LambdaFunctionPrefix="${LAMBDA_FUNCTION_PREFIX}" \
            DatabaseInstanceId="${DATABASE_INSTANCE_ID}" \
        --capabilities CAPABILITY_IAM \
        --region "${AWS_REGION}" \
        --no-fail-on-empty-changeset
    
    if [ $? -eq 0 ]; then
        log_success "CloudWatch Alarms deployed successfully"
        
        # Get SNS topic ARNs
        local TOPICS=$(aws cloudformation describe-stacks \
            --stack-name "${STACK_NAME}" \
            --query 'Stacks[0].Outputs[?contains(OutputKey, `TopicArn`)].OutputValue' \
            --output text \
            --region "${AWS_REGION}")
        
        log "SNS Topics created:"
        echo "${TOPICS}" | while read -r topic; do
            if [ -n "$topic" ]; then
                log "  - ${topic}"
            fi
        done
    else
        log_error "Failed to deploy CloudWatch Alarms"
        return 1
    fi
}

# Setup X-Ray tracing
setup_xray_tracing() {
    log "Setting up X-Ray tracing..."
    
    # Enable X-Ray tracing on Lambda functions
    local FUNCTIONS=$(aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '${LAMBDA_FUNCTION_PREFIX}')].FunctionName" \
        --output text)
    
    if [ -n "$FUNCTIONS" ]; then
        echo "$FUNCTIONS" | tr '\t' '\n' | while read -r function; do
            if [ -n "$function" ]; then
                log "Enabling X-Ray for function: $function"
                aws lambda put-function-configuration \
                    --function-name "$function" \
                    --tracing-config Mode=Active \
                    --region "${AWS_REGION}" > /dev/null
                
                if [ $? -eq 0 ]; then
                    log_success "X-Ray enabled for $function"
                else
                    log_warning "Failed to enable X-Ray for $function"
                fi
            fi
        done
    else
        log_warning "No Lambda functions found with prefix ${LAMBDA_FUNCTION_PREFIX}"
    fi
    
    # Enable X-Ray tracing on API Gateway
    if [ -n "$API_GATEWAY_ID" ]; then
        log "Enabling X-Ray for API Gateway: $API_GATEWAY_ID"
        aws apigateway put-stage \
            --rest-api-id "$API_GATEWAY_ID" \
            --stage-name "$ENVIRONMENT" \
            --patch-ops op=replace,path=/tracingEnabled,value=true \
            --region "${AWS_REGION}" > /dev/null
        
        if [ $? -eq 0 ]; then
            log_success "X-Ray enabled for API Gateway"
        else
            log_warning "Failed to enable X-Ray for API Gateway"
        fi
    fi
}

# Create IAM roles for monitoring
create_monitoring_roles() {
    log "Creating IAM roles for monitoring..."
    
    # Create CloudWatch role for Lambda
    cat > /tmp/cloudwatch-lambda-role.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF

    cat > /tmp/cloudwatch-lambda-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "cloudwatch:PutMetricData",
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            "Resource": "*"
        }
    ]
}
EOF

    # Create the role if it doesn't exist
    if ! aws iam get-role --role-name "hasivu-monitoring-lambda-role" &> /dev/null; then
        aws iam create-role \
            --role-name "hasivu-monitoring-lambda-role" \
            --assume-role-policy-document file:///tmp/cloudwatch-lambda-role.json \
            --region "${AWS_REGION}"
        
        aws iam put-role-policy \
            --role-name "hasivu-monitoring-lambda-role" \
            --policy-name "CloudWatchMonitoringPolicy" \
            --policy-document file:///tmp/cloudwatch-lambda-policy.json
        
        log_success "Monitoring IAM role created"
    else
        log "Monitoring IAM role already exists"
    fi
    
    # Cleanup
    rm -f /tmp/cloudwatch-lambda-role.json /tmp/cloudwatch-lambda-policy.json
}

# Setup log retention
setup_log_retention() {
    log "Setting up log retention policies..."
    
    # Set retention for Lambda function logs
    local FUNCTIONS=$(aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '${LAMBDA_FUNCTION_PREFIX}')].FunctionName" \
        --output text)
    
    if [ -n "$FUNCTIONS" ]; then
        echo "$FUNCTIONS" | tr '\t' '\n' | while read -r function; do
            if [ -n "$function" ]; then
                local LOG_GROUP="/aws/lambda/$function"
                
                # Check if log group exists
                if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query 'logGroups[0].logGroupName' --output text | grep -q "$LOG_GROUP"; then
                    # Set retention to 30 days for production, 7 days for dev/staging
                    local RETENTION_DAYS=30
                    if [ "$ENVIRONMENT" != "production" ]; then
                        RETENTION_DAYS=7
                    fi
                    
                    aws logs put-retention-policy \
                        --log-group-name "$LOG_GROUP" \
                        --retention-in-days $RETENTION_DAYS \
                        --region "${AWS_REGION}"
                    
                    if [ $? -eq 0 ]; then
                        log_success "Set ${RETENTION_DAYS}d retention for $function"
                    else
                        log_warning "Failed to set retention for $function"
                    fi
                fi
            fi
        done
    fi
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Check CloudWatch dashboards
    local DASHBOARD_COUNT=$(aws cloudwatch list-dashboards \
        --query "DashboardEntries[?contains(DashboardName, '${ENVIRONMENT}-HASIVU')].DashboardName" \
        --output text | wc -w)
    
    log "Found $DASHBOARD_COUNT CloudWatch dashboards"
    
    # Check CloudWatch alarms
    local ALARM_COUNT=$(aws cloudwatch describe-alarms \
        --query "MetricAlarms[?contains(AlarmName, '${ENVIRONMENT}-HASIVU')].AlarmName" \
        --output text | wc -w)
    
    log "Found $ALARM_COUNT CloudWatch alarms"
    
    # Check X-Ray service map
    log "Checking X-Ray service map..."
    local XRAY_SERVICES=$(aws xray get-service-graph \
        --start-time $(date -d '1 hour ago' -u +%s) \
        --end-time $(date -u +%s) \
        --query 'Services[].Name' \
        --output text 2>/dev/null | wc -w)
    
    log "Found $XRAY_SERVICES services in X-Ray"
    
    if [ $DASHBOARD_COUNT -gt 0 ] && [ $ALARM_COUNT -gt 0 ]; then
        log_success "Deployment verification completed successfully"
        log_success "Monitoring infrastructure is now active!"
        
        # Display summary
        echo ""
        echo "=== MONITORING DEPLOYMENT SUMMARY ==="
        echo "Environment: $ENVIRONMENT"
        echo "Region: $AWS_REGION"
        echo "Dashboards: $DASHBOARD_COUNT"
        echo "Alarms: $ALARM_COUNT"
        echo "X-Ray Services: $XRAY_SERVICES"
        echo "Alerting Email: $ALERTING_EMAIL"
        echo ""
        echo "Next Steps:"
        echo "1. Review dashboard URLs above"
        echo "2. Confirm email subscription to SNS topics"
        echo "3. Test alarm notifications"
        echo "4. Monitor X-Ray traces"
        echo "5. Set up Slack notifications (if webhook provided)"
        echo ""
    else
        log_error "Deployment verification failed"
        return 1
    fi
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f /tmp/cloudwatch-*
}

# Main deployment function
main() {
    log "Starting HASIVU Platform Monitoring Deployment"
    log "Environment: $ENVIRONMENT"
    log "Region: $AWS_REGION"
    echo ""
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Run deployment steps
    check_prerequisites
    validate_parameters
    create_monitoring_roles
    deploy_dashboards
    deploy_alarms
    setup_xray_tracing
    setup_log_retention
    verify_deployment
    
    log_success "HASIVU Platform monitoring deployment completed!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "cleanup")
        log "Cleaning up monitoring infrastructure..."
        
        # Delete CloudFormation stacks
        aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-${ENVIRONMENT}-dashboards" --region "${AWS_REGION}" || true
        aws cloudformation delete-stack --stack-name "${STACK_PREFIX}-${ENVIRONMENT}-alarms" --region "${AWS_REGION}" || true
        
        log_success "Cleanup initiated"
        ;;
    "verify")
        verify_deployment
        ;;
    "help"|"-h"|"--help")
        echo "HASIVU Platform Monitoring Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy    Deploy monitoring infrastructure (default)"
        echo "  cleanup   Remove monitoring infrastructure"
        echo "  verify    Verify existing deployment"
        echo "  help      Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  ENVIRONMENT          - Deployment environment (default: production)"
        echo "  AWS_REGION          - AWS region (default: ap-south-1)"
        echo "  ALERTING_EMAIL      - Email for alerts (default: ops-alerts@hasivu.com)"
        echo "  SLACK_WEBHOOK_URL   - Slack webhook for notifications (optional)"
        echo ""
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac