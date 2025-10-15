#!/bin/bash

# CloudWatch Monitoring Deployment Script
# Infrastructure Reliability Expert - Monitoring Setup

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-development}
AWS_REGION=${AWS_REGION:-ap-south-1}
STACK_NAME="hasivu-cloudwatch-${ENVIRONMENT}"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}CloudWatch Monitoring Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Region: ${AWS_REGION}${NC}"
echo -e "${BLUE}======================================${NC}"

# Validate AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed${NC}"
    exit 1
fi

# Validate AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured${NC}"
    exit 1
fi

echo -e "${GREEN}✓ AWS CLI configured${NC}"

# Step 1: Deploy CloudWatch Alarms
echo -e "\n${BLUE}[1/5] Deploying CloudWatch Alarms...${NC}"

if [ -f "./monitoring/cloudwatch-alarms.yml" ]; then
    aws cloudformation deploy \
        --template-file ./monitoring/cloudwatch-alarms.yml \
        --stack-name "${STACK_NAME}-alarms" \
        --parameter-overrides \
            Environment="${ENVIRONMENT}" \
            AlertingEmail="${ALERT_EMAIL:-ops-alerts@hasivu.com}" \
            LambdaFunctionPrefix="hasivu-platform-${ENVIRONMENT}" \
            DatabaseInstanceId="hasivu-db" \
        --capabilities CAPABILITY_IAM \
        --region "${AWS_REGION}" \
        --no-fail-on-empty-changeset

    echo -e "${GREEN}✓ CloudWatch Alarms deployed${NC}"
else
    echo -e "${YELLOW}⚠ CloudWatch alarms template not found${NC}"
fi

# Step 2: Deploy CloudWatch Dashboards
echo -e "\n${BLUE}[2/5] Deploying CloudWatch Dashboards...${NC}"

if [ -f "./monitoring/cloudwatch-dashboards.yml" ]; then
    # Get API Gateway ID from existing stack or environment variable
    API_GATEWAY_ID=${API_GATEWAY_ID:-"placeholder"}

    aws cloudformation deploy \
        --template-file ./monitoring/cloudwatch-dashboards.yml \
        --stack-name "${STACK_NAME}-dashboards" \
        --parameter-overrides \
            Environment="${ENVIRONMENT}" \
            ApiGatewayId="${API_GATEWAY_ID}" \
            LambdaFunctionPrefix="hasivu-platform-${ENVIRONMENT}" \
        --region "${AWS_REGION}" \
        --no-fail-on-empty-changeset

    echo -e "${GREEN}✓ CloudWatch Dashboards deployed${NC}"
else
    echo -e "${YELLOW}⚠ CloudWatch dashboards template not found${NC}"
fi

# Step 3: Create CloudWatch Log Groups
echo -e "\n${BLUE}[3/5] Creating CloudWatch Log Groups...${NC}"

LOG_GROUPS=(
    "/aws/lambda/hasivu-platform-${ENVIRONMENT}"
    "/aws/lambda/hasivu-platform-${ENVIRONMENT}/errors"
    "/aws/lambda/hasivu-platform-${ENVIRONMENT}/business"
    "/aws/lambda/hasivu-platform-${ENVIRONMENT}/security"
    "/aws/lambda/hasivu-platform-${ENVIRONMENT}/performance"
)

for LOG_GROUP in "${LOG_GROUPS[@]}"; do
    if aws logs describe-log-groups --log-group-name-prefix "${LOG_GROUP}" --region "${AWS_REGION}" | grep -q "${LOG_GROUP}"; then
        echo -e "${YELLOW}⚠ Log group already exists: ${LOG_GROUP}${NC}"
    else
        aws logs create-log-group \
            --log-group-name "${LOG_GROUP}" \
            --region "${AWS_REGION}"

        # Set retention policy (30 days)
        aws logs put-retention-policy \
            --log-group-name "${LOG_GROUP}" \
            --retention-in-days 30 \
            --region "${AWS_REGION}"

        echo -e "${GREEN}✓ Created log group: ${LOG_GROUP}${NC}"
    fi
done

# Step 4: Configure SNS Topics for Alerts
echo -e "\n${BLUE}[4/5] Configuring SNS Topics...${NC}"

# Get SNS topic ARNs from CloudFormation stack
CRITICAL_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-alarms" \
    --query 'Stacks[0].Outputs[?OutputKey==`CriticalAlertsTopicArn`].OutputValue' \
    --output text \
    --region "${AWS_REGION}" 2>/dev/null || echo "")

WARNING_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-alarms" \
    --query 'Stacks[0].Outputs[?OutputKey==`WarningAlertsTopicArn`].OutputValue' \
    --output text \
    --region "${AWS_REGION}" 2>/dev/null || echo "")

BUSINESS_TOPIC_ARN=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}-alarms" \
    --query 'Stacks[0].Outputs[?OutputKey==`BusinessAlertsTopicArn`].OutputValue' \
    --output text \
    --region "${AWS_REGION}" 2>/dev/null || echo "")

if [ -n "${CRITICAL_TOPIC_ARN}" ]; then
    echo -e "${GREEN}✓ SNS Topics configured:${NC}"
    echo -e "  Critical: ${CRITICAL_TOPIC_ARN}"
    echo -e "  Warning: ${WARNING_TOPIC_ARN}"
    echo -e "  Business: ${BUSINESS_TOPIC_ARN}"

    # Update environment variables or .env file
    echo -e "\n${YELLOW}Add these to your .env file:${NC}"
    echo "SNS_TOPIC_CRITICAL_ALERTS=${CRITICAL_TOPIC_ARN}"
    echo "SNS_TOPIC_WARNING_ALERTS=${WARNING_TOPIC_ARN}"
    echo "SNS_TOPIC_BUSINESS_ALERTS=${BUSINESS_TOPIC_ARN}"
else
    echo -e "${YELLOW}⚠ SNS Topics not found in CloudFormation outputs${NC}"
fi

# Step 5: Verify Deployment
echo -e "\n${BLUE}[5/5] Verifying Deployment...${NC}"

# Check alarms
ALARM_COUNT=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "${ENVIRONMENT}-HASIVU-" \
    --region "${AWS_REGION}" \
    --query 'length(MetricAlarms)' \
    --output text 2>/dev/null || echo "0")

echo -e "${GREEN}✓ Deployed ${ALARM_COUNT} CloudWatch Alarms${NC}"

# Check dashboards
DASHBOARD_COUNT=$(aws cloudwatch list-dashboards \
    --dashboard-name-prefix "${ENVIRONMENT}-HASIVU-" \
    --region "${AWS_REGION}" \
    --query 'length(DashboardEntries)' \
    --output text 2>/dev/null || echo "0")

echo -e "${GREEN}✓ Deployed ${DASHBOARD_COUNT} CloudWatch Dashboards${NC}"

# Output Dashboard URLs
echo -e "\n${BLUE}======================================${NC}"
echo -e "${BLUE}Dashboard URLs:${NC}"
echo -e "${BLUE}======================================${NC}"

echo -e "${GREEN}Executive Overview:${NC}"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${ENVIRONMENT}-HASIVU-Executive-Overview"

echo -e "\n${GREEN}Lambda Performance:${NC}"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${ENVIRONMENT}-HASIVU-Lambda-Performance"

echo -e "\n${GREEN}API Gateway:${NC}"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${ENVIRONMENT}-HASIVU-API-Gateway"

echo -e "\n${GREEN}Database Performance:${NC}"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${ENVIRONMENT}-HASIVU-Database-Performance"

echo -e "\n${GREEN}Business Metrics:${NC}"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${ENVIRONMENT}-HASIVU-Business-Metrics"

echo -e "\n${GREEN}Cost Optimization:${NC}"
echo -e "https://console.aws.amazon.com/cloudwatch/home?region=${AWS_REGION}#dashboards:name=${ENVIRONMENT}-HASIVU-Cost-Optimization"

echo -e "\n${BLUE}======================================${NC}"
echo -e "${GREEN}✓ CloudWatch Monitoring Deployment Complete!${NC}"
echo -e "${BLUE}======================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo -e "1. Verify SNS email subscriptions (check your email)"
echo -e "2. Update application .env file with SNS topic ARNs"
echo -e "3. Deploy application code with monitoring enabled"
echo -e "4. Test metrics collection with sample requests"
echo -e "5. Review dashboards and adjust alarm thresholds as needed"

exit 0
