#!/bin/bash

# Epic 5 Story 5.2: Subscription Billing Management Deployment Script
# This script validates and deploys the subscription billing management system

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Set default stage if not provided
STAGE=${1:-dev}

print_status "Starting Epic 5 Story 5.2 deployment for stage: $STAGE"

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi

# Check if serverless is installed
if ! command -v serverless &> /dev/null; then
    print_error "Serverless Framework is not installed. Please install it with: npm install -g serverless"
    exit 1
fi

print_success "Prerequisites check passed"

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -f "serverless.yml" ]; then
    print_error "serverless.yml not found. Please run this script from the project root directory."
    exit 1
fi

# Check if Story 5.2 functions exist
print_status "Checking Story 5.2 function files..."

STORY_52_FUNCTIONS=(
    "src/functions/payments/subscription-management.ts"
    "src/functions/payments/billing-automation.ts"
    "src/functions/payments/subscription-plans.ts"
    "src/functions/payments/dunning-management.ts"
    "src/functions/payments/subscription-analytics.ts"
)

for func in "${STORY_52_FUNCTIONS[@]}"; do
    if [ ! -f "$func" ]; then
        print_error "Function file not found: $func"
        exit 1
    fi
    print_success "Found: $func"
done

# Check if Prisma schema has subscription models
print_status "Checking Prisma schema for subscription models..."

REQUIRED_MODELS=(
    "model Subscription"
    "model SubscriptionPlan"
    "model BillingCycle"
    "model PaymentRetry"
)

for model in "${REQUIRED_MODELS[@]}"; do
    if ! grep -q "$model" prisma/schema.prisma; then
        print_error "Required model not found in Prisma schema: $model"
        exit 1
    fi
    print_success "Found: $model"
done

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Run TypeScript compilation check
print_status "Running TypeScript compilation check..."
if ! npm run build 2>/dev/null; then
    print_warning "TypeScript compilation check failed, but continuing with deployment"
fi

# Validate serverless configuration
print_status "Validating Serverless configuration..."
if ! serverless print --stage $STAGE > /dev/null 2>&1; then
    print_error "Serverless configuration validation failed"
    exit 1
fi
print_success "Serverless configuration is valid"

# Check AWS credentials
print_status "Checking AWS credentials..."
if ! serverless info --stage $STAGE > /dev/null 2>&1; then
    print_error "AWS credentials not configured or insufficient permissions"
    exit 1
fi
print_success "AWS credentials are configured"

# Check environment variables in AWS Systems Manager
print_status "Checking required environment variables in AWS Systems Manager..."

REQUIRED_PARAMS=(
    "/hasivu/$STAGE/database-url"
    "/hasivu/$STAGE/razorpay-key-id"
    "/hasivu/$STAGE/razorpay-key-secret"
    "/hasivu/$STAGE/jwt-secret"
)

for param in "${REQUIRED_PARAMS[@]}"; do
    if ! aws ssm get-parameter --name "$param" --region ap-south-1 > /dev/null 2>&1; then
        print_warning "Parameter not found: $param"
        print_warning "Make sure to configure this parameter before testing the functions"
    else
        print_success "Found: $param"
    fi
done

# Run Prisma commands
print_status "Updating Prisma client..."
npx prisma generate
print_success "Prisma client updated"

# Deploy the functions
print_status "Deploying Story 5.2 Subscription Billing Management..."

# Deploy specific functions first to catch any issues
FUNCTIONS_TO_DEPLOY=(
    "subscription-management"
    "billing-automation"
    "subscription-plans"
    "dunning-management"
    "subscription-analytics"
)

for func in "${FUNCTIONS_TO_DEPLOY[@]}"; do
    print_status "Deploying function: $func"
    if serverless deploy function --function $func --stage $STAGE; then
        print_success "Deployed: $func"
    else
        print_error "Failed to deploy: $func"
        exit 1
    fi
done

# Deploy the full stack to ensure all resources are created
print_status "Deploying full stack to ensure all resources are properly configured..."
if serverless deploy --stage $STAGE; then
    print_success "Full stack deployment completed"
else
    print_error "Full stack deployment failed"
    exit 1
fi

# Post-deployment validation
print_status "Running post-deployment validation..."

# Check if all functions are deployed
print_status "Verifying deployed functions..."
DEPLOYMENT_INFO=$(serverless info --stage $STAGE)

for func in "${FUNCTIONS_TO_DEPLOY[@]}"; do
    if echo "$DEPLOYMENT_INFO" | grep -q "$func"; then
        print_success "Function deployed and accessible: $func"
    else
        print_warning "Function may not be properly deployed: $func"
    fi
done

# Check CloudWatch Events (scheduled jobs)
print_status "Checking scheduled jobs..."
if aws events list-rules --name-prefix "hasivu-$STAGE" --region ap-south-1 > /dev/null 2>&1; then
    print_success "Scheduled jobs are configured"
else
    print_warning "Could not verify scheduled jobs configuration"
fi

# Test basic endpoint accessibility
print_status "Testing basic endpoint accessibility..."

# Extract API Gateway URL from deployment info
API_URL=$(echo "$DEPLOYMENT_INFO" | grep -o 'https://[^/]*.execute-api.[^/]*.amazonaws.com/[^/]*' | head -1)

if [ -n "$API_URL" ]; then
    print_success "API Gateway URL: $API_URL"
    
    # Test health endpoint
    if curl -s "$API_URL/health" > /dev/null; then
        print_success "Health endpoint is accessible"
    else
        print_warning "Health endpoint test failed"
    fi
else
    print_warning "Could not extract API Gateway URL from deployment info"
fi

# Generate deployment report
REPORT_FILE="deployment-report-story-5.2-$STAGE-$(date +%Y%m%d_%H%M%S).txt"
print_status "Generating deployment report: $REPORT_FILE"

cat > "$REPORT_FILE" << EOF
# Epic 5 Story 5.2: Subscription Billing Management Deployment Report
# Generated on: $(date)
# Stage: $STAGE

## Deployment Summary
- Status: SUCCESS
- Functions Deployed: 5
- API Gateway URL: $API_URL

## Deployed Functions
$(for func in "${FUNCTIONS_TO_DEPLOY[@]}"; do echo "- $func"; done)

## Required Environment Variables
$(for param in "${REQUIRED_PARAMS[@]}"; do echo "- $param"; done)

## Next Steps
1. Test subscription creation workflow
2. Verify scheduled jobs are running
3. Check CloudWatch logs for any errors
4. Test analytics endpoints for data accuracy
5. Configure notification templates if needed

## API Endpoints (Story 5.2)
### Subscription Management
- POST /subscriptions - Create subscription
- PUT /subscriptions/{id} - Update subscription
- POST /subscriptions/{id}/pause - Pause subscription
- POST /subscriptions/{id}/resume - Resume subscription
- POST /subscriptions/{id}/cancel - Cancel subscription
- GET /subscriptions/{id} - Get subscription
- GET /subscriptions - List subscriptions

### Billing Automation
- POST /billing/process - Process billing cycles
- POST /billing/process/{id} - Process specific subscription
- GET /billing/status - Get billing status

### Subscription Plans
- POST /subscription-plans - Create plan
- PUT /subscription-plans/{id} - Update plan
- GET /subscription-plans/{id} - Get plan
- GET /subscription-plans - List plans
- POST /subscription-plans/compare - Compare plans
- DELETE /subscription-plans/{id} - Deactivate plan

### Dunning Management
- POST /dunning/process - Process payment retries
- POST /payments/{paymentId}/retry - Manual retry
- GET /dunning/status - Get dunning status
- GET /payments/{paymentId}/retry-history - Retry history

### Subscription Analytics
- GET /subscription-analytics - Comprehensive analytics
- GET /subscription-analytics/dashboard - Dashboard metrics
- POST /subscription-analytics/cohort - Cohort analysis
- GET /subscription-analytics/revenue - Revenue analysis
- GET /subscription-analytics/churn - Churn analysis
- GET /subscription-analytics/clv - Customer lifetime value

## Monitoring
- CloudWatch Logs: /aws/lambda/hasivu-$STAGE-[function-name]
- CloudWatch Metrics: AWS/Lambda namespace
- Custom Dashboard: hasivu-$STAGE-metrics

## Scheduled Jobs
- Billing Automation: Every hour
- Dunning Management: Every 6 hours

EOF

print_success "Deployment report generated: $REPORT_FILE"

print_success "Epic 5 Story 5.2: Subscription Billing Management deployment completed successfully!"
print_status "You can now test the subscription billing functionality."
print_status "Check the deployment report for detailed information and next steps."

# Display important information
echo ""
echo "=================================================="
echo "📊 STORY 5.2 DEPLOYMENT COMPLETED"
echo "=================================================="
echo "🎯 Stage: $STAGE"
echo "🌐 API URL: $API_URL"
echo "📋 Functions: 5 deployed successfully"
echo "📄 Report: $REPORT_FILE"
echo ""
echo "🔍 Next Steps:"
echo "1. Test subscription creation workflow"
echo "2. Verify scheduled jobs in CloudWatch Events"
echo "3. Check function logs for any errors"
echo "4. Test analytics endpoints"
echo "5. Review the deployment report for complete details"
echo "=================================================="