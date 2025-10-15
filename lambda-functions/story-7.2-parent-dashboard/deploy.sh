#!/bin/bash

# Epic 7.2: Parent Dashboard Lambda Functions Deployment Script
# Deploys all 5 Lambda functions for the Advanced Parent Dashboard & Insights Portal

set -e

echo "🚀 Starting Epic 7.2 Lambda Functions Deployment"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION=${AWS_REGION:-us-east-1}
STAGE=${STAGE:-dev}
FUNCTIONS=(
  "parent-dashboard-orchestrator"
  "personalized-insights-engine"
  "child-progress-analytics"
  "engagement-intelligence"
  "dashboard-customization"
)

# Function to print status
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

# Check prerequisites
check_prerequisites() {
  print_status "Checking prerequisites..."

  # Check AWS CLI
  if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
  fi

  # Check Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
  fi

  # Check TypeScript
  if ! command -v tsc &> /dev/null; then
    print_warning "TypeScript not found globally, installing..."
    npm install -g typescript
  fi

  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured"
    exit 1
  fi

  print_success "Prerequisites check completed"
}

# Install dependencies for all functions
install_dependencies() {
  print_status "Installing dependencies for all functions..."

  for func in "${FUNCTIONS[@]}"; do
    if [ -d "$func" ]; then
      print_status "Installing dependencies for $func..."
      cd "$func"

      if [ -f "package.json" ]; then
        npm install --production
        print_success "Dependencies installed for $func"
      else
        print_warning "No package.json found for $func"
      fi

      cd ..
    else
      print_warning "Directory $func not found, skipping..."
    fi
  done
}

# Build TypeScript for all functions
build_functions() {
  print_status "Building TypeScript for all functions..."

  # Build from root directory using shared tsconfig
  if [ -f "tsconfig.json" ]; then
    tsc
    print_success "TypeScript compilation completed"
  else
    print_error "tsconfig.json not found"
    exit 1
  fi
}

# Package individual function
package_function() {
  local func_name=$1
  print_status "Packaging $func_name..."

  cd "$func_name"

  # Create deployment package
  if [ -f "dist/index.js" ]; then
    # Create zip with compiled code and node_modules
    zip -r "function.zip" dist/ node_modules/ > /dev/null 2>&1
    print_success "$func_name packaged successfully"
  else
    print_error "Compiled JavaScript not found for $func_name"
    cd ..
    return 1
  fi

  cd ..
  return 0
}

# Deploy individual function
deploy_function() {
  local func_name=$1
  print_status "Deploying $func_name to AWS Lambda..."

  cd "$func_name"

  if [ -f "function.zip" ]; then
    # Check if function exists
    if aws lambda get-function --function-name "$func_name" --region "$AWS_REGION" > /dev/null 2>&1; then
      # Update existing function
      aws lambda update-function-code \
        --function-name "$func_name" \
        --zip-file fileb://function.zip \
        --region "$AWS_REGION" > /dev/null
      print_success "$func_name updated successfully"
    else
      print_warning "Function $func_name does not exist. Creating new function..."
      # Create new function (requires additional configuration)
      create_lambda_function "$func_name"
    fi
  else
    print_error "Package not found for $func_name"
    cd ..
    return 1
  fi

  cd ..
  return 0
}

# Create new Lambda function
create_lambda_function() {
  local func_name=$1
  local role_arn="arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):role/lambda-execution-role"

  print_status "Creating new Lambda function: $func_name"

  aws lambda create-function \
    --function-name "$func_name" \
    --runtime "nodejs18.x" \
    --role "$role_arn" \
    --handler "dist/index.handler" \
    --zip-file fileb://function.zip \
    --timeout 30 \
    --memory-size 512 \
    --region "$AWS_REGION" \
    --environment Variables="{
      STAGE=$STAGE,
      AWS_REGION=$AWS_REGION,
      USERS_TABLE=hasivu-users-$STAGE,
      PARENT_CHILDREN_TABLE=hasivu-parent-children-$STAGE,
      ORDERS_TABLE=hasivu-orders-$STAGE,
      PAYMENTS_TABLE=hasivu-payments-$STAGE
    }" > /dev/null

  print_success "$func_name created successfully"
}

# Set environment variables for functions
set_environment_variables() {
  print_status "Setting environment variables for Lambda functions..."

  # Common environment variables
  local common_vars=$(cat <<EOF
{
  "STAGE": "$STAGE",
  "AWS_REGION": "$AWS_REGION",
  "USERS_TABLE": "hasivu-users-$STAGE",
  "PARENT_CHILDREN_TABLE": "hasivu-parent-children-$STAGE",
  "ORDERS_TABLE": "hasivu-orders-$STAGE",
  "PAYMENTS_TABLE": "hasivu-payments-$STAGE",
  "NODE_ENV": "production"
}
EOF
)

  # Function-specific environment variables
  local orchestrator_vars=$(cat <<EOF
{
  "STAGE": "$STAGE",
  "AWS_REGION": "$AWS_REGION",
  "USERS_TABLE": "hasivu-users-$STAGE",
  "PARENT_CHILDREN_TABLE": "hasivu-parent-children-$STAGE",
  "ORDERS_TABLE": "hasivu-orders-$STAGE",
  "PAYMENTS_TABLE": "hasivu-payments-$STAGE",
  "DASHBOARD_CACHE_TABLE": "hasivu-dashboard-cache-$STAGE",
  "DASHBOARD_PREFERENCES_TABLE": "hasivu-dashboard-preferences-$STAGE",
  "NODE_ENV": "production"
}
EOF
)

  local insights_vars=$(cat <<EOF
{
  "STAGE": "$STAGE",
  "AWS_REGION": "$AWS_REGION",
  "USERS_TABLE": "hasivu-users-$STAGE",
  "PARENT_CHILDREN_TABLE": "hasivu-parent-children-$STAGE",
  "ORDERS_TABLE": "hasivu-orders-$STAGE",
  "PAYMENTS_TABLE": "hasivu-payments-$STAGE",
  "SPENDING_PATTERNS_MODEL": "hasivu-spending-patterns-endpoint-$STAGE",
  "NUTRITION_ANALYSIS_MODEL": "hasivu-nutrition-analysis-endpoint-$STAGE",
  "ENGAGEMENT_PREDICTION_MODEL": "hasivu-engagement-prediction-endpoint-$STAGE",
  "RECOMMENDATION_ENGINE_MODEL": "hasivu-recommendation-engine-endpoint-$STAGE",
  "NODE_ENV": "production"
}
EOF
)

  local analytics_vars=$(cat <<EOF
{
  "STAGE": "$STAGE",
  "AWS_REGION": "$AWS_REGION",
  "USERS_TABLE": "hasivu-users-$STAGE",
  "PARENT_CHILDREN_TABLE": "hasivu-parent-children-$STAGE",
  "ORDERS_TABLE": "hasivu-orders-$STAGE",
  "PAYMENTS_TABLE": "hasivu-payments-$STAGE",
  "MEALS_TABLE": "hasivu-meals-$STAGE",
  "NUTRITION_TRACKING_TABLE": "hasivu-nutrition-tracking-$STAGE",
  "ENGAGEMENT_TRACKING_TABLE": "hasivu-engagement-tracking-$STAGE",
  "STUDENT_PREFERENCES_TABLE": "hasivu-student-preferences-$STAGE",
  "NODE_ENV": "production"
}
EOF
)

  local engagement_vars=$(cat <<EOF
{
  "STAGE": "$STAGE",
  "AWS_REGION": "$AWS_REGION",
  "USERS_TABLE": "hasivu-users-$STAGE",
  "ENGAGEMENT_EVENTS_TABLE": "hasivu-engagement-events-$STAGE",
  "USER_SESSIONS_TABLE": "hasivu-user-sessions-$STAGE",
  "FEATURE_USAGE_TABLE": "hasivu-feature-usage-$STAGE",
  "ENGAGEMENT_STREAM": "hasivu-engagement-stream-$STAGE",
  "REAL_TIME_METRICS_TABLE": "hasivu-real-time-metrics-$STAGE",
  "NODE_ENV": "production"
}
EOF
)

  local customization_vars=$(cat <<EOF
{
  "STAGE": "$STAGE",
  "AWS_REGION": "$AWS_REGION",
  "USERS_TABLE": "hasivu-users-$STAGE",
  "DASHBOARD_CUSTOMIZATION_TABLE": "hasivu-dashboard-customization-$STAGE",
  "CUSTOMIZATION_BACKUP_BUCKET": "hasivu-customization-backups-$STAGE",
  "NODE_ENV": "production"
}
EOF
)

  # Set environment variables for each function
  aws lambda update-function-configuration \
    --function-name "parent-dashboard-orchestrator" \
    --environment "Variables=$orchestrator_vars" \
    --region "$AWS_REGION" > /dev/null 2>&1 || print_warning "Failed to update orchestrator environment"

  aws lambda update-function-configuration \
    --function-name "personalized-insights-engine" \
    --environment "Variables=$insights_vars" \
    --region "$AWS_REGION" > /dev/null 2>&1 || print_warning "Failed to update insights environment"

  aws lambda update-function-configuration \
    --function-name "child-progress-analytics" \
    --environment "Variables=$analytics_vars" \
    --region "$AWS_REGION" > /dev/null 2>&1 || print_warning "Failed to update analytics environment"

  aws lambda update-function-configuration \
    --function-name "engagement-intelligence" \
    --environment "Variables=$engagement_vars" \
    --region "$AWS_REGION" > /dev/null 2>&1 || print_warning "Failed to update engagement environment"

  aws lambda update-function-configuration \
    --function-name "dashboard-customization" \
    --environment "Variables=$customization_vars" \
    --region "$AWS_REGION" > /dev/null 2>&1 || print_warning "Failed to update customization environment"

  print_success "Environment variables updated"
}

# Cleanup function
cleanup() {
  print_status "Cleaning up temporary files..."

  for func in "${FUNCTIONS[@]}"; do
    if [ -f "$func/function.zip" ]; then
      rm "$func/function.zip"
    fi
  done

  print_success "Cleanup completed"
}

# Main deployment process
main() {
  echo "Deployment Configuration:"
  echo "  Region: $AWS_REGION"
  echo "  Stage: $STAGE"
  echo "  Functions: ${FUNCTIONS[*]}"
  echo ""

  # Check prerequisites
  check_prerequisites

  # Install dependencies
  install_dependencies

  # Build TypeScript
  build_functions

  # Deploy each function
  local failed_functions=()

  for func in "${FUNCTIONS[@]}"; do
    print_status "Processing $func..."

    if package_function "$func" && deploy_function "$func"; then
      print_success "$func deployed successfully"
    else
      print_error "Failed to deploy $func"
      failed_functions+=("$func")
    fi

    echo ""
  done

  # Set environment variables
  set_environment_variables

  # Report results
  echo ""
  echo "=================================================="
  echo "🎉 Deployment Summary"
  echo "=================================================="

  if [ ${#failed_functions[@]} -eq 0 ]; then
    print_success "All functions deployed successfully!"

    echo ""
    echo "Function URLs:"
    for func in "${FUNCTIONS[@]}"; do
      local func_arn=$(aws lambda get-function --function-name "$func" --region "$AWS_REGION" --query 'Configuration.FunctionArn' --output text 2>/dev/null || echo "Not found")
      echo "  $func: $func_arn"
    done

  else
    print_warning "Some functions failed to deploy:"
    for func in "${failed_functions[@]}"; do
      echo "  ❌ $func"
    done
    exit 1
  fi

  # Cleanup
  cleanup

  echo ""
  print_success "Epic 7.2 Lambda deployment completed!"
  echo ""
  echo "Next steps:"
  echo "1. Configure API Gateway endpoints"
  echo "2. Set up CloudWatch monitoring"
  echo "3. Test the Lambda functions"
  echo "4. Update frontend integration"
}

# Handle script interruption
trap cleanup EXIT

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --region)
      AWS_REGION="$2"
      shift 2
      ;;
    --stage)
      STAGE="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--region REGION] [--stage STAGE] [--help]"
      echo ""
      echo "Options:"
      echo "  --region    AWS region (default: us-east-1)"
      echo "  --stage     Deployment stage (default: dev)"
      echo "  --help      Show this help message"
      exit 0
      ;;
    *)
      print_error "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Run main deployment
main