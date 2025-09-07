#!/bin/bash

# HASIVU Platform Deployment Script
# Supports: dev, staging, production environments
# Usage: ./scripts/deploy.sh [environment] [options]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="hasivu-platform"
AWS_REGION="${AWS_REGION:-ap-south-1}"
NODE_VERSION="18"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

show_usage() {
    cat << EOF
HASIVU Platform Deployment Script

Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENTS:
    dev         Deploy to development environment
    staging     Deploy to staging environment
    production  Deploy to production environment (requires confirmation)

OPTIONS:
    --skip-tests        Skip running tests before deployment
    --skip-migration    Skip database migration
    --skip-warmup       Skip Lambda warmup after deployment
    --dry-run          Show what would be deployed without actually deploying
    --rollback         Rollback to previous version
    --force            Force deployment without confirmations
    --help             Show this help message

EXAMPLES:
    $0 dev
    $0 staging --skip-tests
    $0 production --force
    $0 production --rollback

REQUIREMENTS:
    - Node.js ${NODE_VERSION}.x
    - AWS CLI configured
    - Serverless Framework installed
    - Required environment variables set in AWS SSM

EOF
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    NODE_MAJOR_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        log_error "Node.js version 18.x or higher is required"
        exit 1
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check Serverless Framework
    if ! command -v serverless &> /dev/null && ! command -v sls &> /dev/null; then
        log_error "Serverless Framework is not installed. Run: npm install -g serverless"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

validate_environment() {
    local env=$1
    
    case $env in
        dev|staging|production)
            log_info "Environment: $env"
            ;;
        *)
            log_error "Invalid environment: $env"
            log_error "Valid environments: dev, staging, production"
            exit 1
            ;;
    esac
    
    # Check if required SSM parameters exist
    log_info "Validating environment configuration..."
    
    local required_params=(
        "/hasivu/$env/database-url"
        "/hasivu/$env/cognito-user-pool-id"
        "/hasivu/$env/cognito-client-id"
        "/hasivu/$env/razorpay-key-id"
        "/hasivu/$env/razorpay-key-secret"
        "/hasivu/$env/jwt-secret"
    )
    
    for param in "${required_params[@]}"; do
        if ! aws ssm get-parameter --name "$param" --region "$AWS_REGION" &> /dev/null; then
            log_error "Required SSM parameter not found: $param"
            log_error "Please set up all required parameters before deployment"
            exit 1
        fi
    done
    
    log_success "Environment configuration validated"
}

install_dependencies() {
    log_info "Installing dependencies..."
    npm ci
    log_success "Dependencies installed"
}

generate_prisma_client() {
    log_info "Generating Prisma client..."
    npx prisma generate
    log_success "Prisma client generated"
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log_warning "Skipping tests"
        return
    fi
    
    log_info "Running tests..."
    
    # Run linting
    log_info "Running linting..."
    npm run lint
    
    # Run type checking
    log_info "Running type checking..."
    npm run type-check
    
    # Run unit tests
    log_info "Running unit tests..."
    npm run test:unit
    
    # Run integration tests
    log_info "Running integration tests..."
    npm run test:integration
    
    log_success "All tests passed"
}

run_production_readiness_check() {
    log_info "Running production readiness check..."
    npm run check:production
    log_success "Production readiness check passed"
}

run_database_migration() {
    if [ "$SKIP_MIGRATION" = true ]; then
        log_warning "Skipping database migration"
        return
    fi
    
    log_info "Running database migration..."
    npx prisma migrate deploy
    log_success "Database migration completed"
}

create_deployment_backup() {
    local env=$1
    
    if [ "$env" = "production" ]; then
        log_info "Creating deployment backup..."
        
        # Create timestamp for backup
        BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        # Create Lambda function aliases for rollback
        aws lambda create-alias \
            --function-name "$PROJECT_NAME-$env-health" \
            --name "backup-$BACKUP_TIMESTAMP" \
            --function-version '$LATEST' \
            --region "$AWS_REGION" || log_warning "Could not create backup alias"
        
        log_success "Deployment backup created: backup-$BACKUP_TIMESTAMP"
    fi
}

deploy_infrastructure() {
    local env=$1
    
    if [ "$DRY_RUN" = true ]; then
        log_info "DRY RUN: Would deploy to $env environment"
        return
    fi
    
    log_info "Deploying to $env environment..."
    
    case $env in
        production)
            # Blue-green deployment for production
            log_info "Using blue-green deployment strategy..."
            npm run deploy:production:blue-green
            ;;
        *)
            # Regular deployment for dev/staging
            npm run deploy:$env
            ;;
    esac
    
    log_success "Infrastructure deployment completed"
}

run_post_deployment_checks() {
    local env=$1
    
    log_info "Running post-deployment health checks..."
    
    # Wait for functions to be ready
    sleep 10
    
    # Run health checks
    case $env in
        production)
            npm run health:check:production
            npm run test:smoke:production
            ;;
        staging)
            npm run test:e2e:staging
            ;;
        dev)
            npm run test:e2e:dev || log_warning "E2E tests failed for dev environment"
            ;;
    esac
    
    log_success "Post-deployment checks completed"
}

warmup_functions() {
    if [ "$SKIP_WARMUP" = true ]; then
        log_warning "Skipping function warmup"
        return
    fi
    
    log_info "Warming up Lambda functions..."
    
    # Call health endpoint to warm up
    local health_url
    case $ENVIRONMENT in
        production)
            health_url="$PRODUCTION_API_BASE_URL/health"
            ;;
        staging)
            health_url="$STAGING_API_BASE_URL/health"
            ;;
        dev)
            health_url="$DEV_API_BASE_URL/health"
            ;;
    esac
    
    if [ -n "$health_url" ]; then
        curl -s "$health_url" > /dev/null || log_warning "Could not warm up functions"
        log_success "Functions warmed up"
    fi
}

rollback_deployment() {
    local env=$1
    
    log_warning "Initiating rollback for $env environment..."
    
    if [ "$env" = "production" ]; then
        # Get the latest backup alias
        local backup_alias=$(aws lambda list-aliases \
            --function-name "$PROJECT_NAME-$env-health" \
            --query 'Aliases[?starts_with(Name, `backup-`)].Name' \
            --output text | sort -r | head -1)
        
        if [ -n "$backup_alias" ]; then
            log_info "Rolling back to: $backup_alias"
            aws lambda update-alias \
                --function-name "$PROJECT_NAME-$env-health" \
                --name LIVE \
                --function-version "$backup_alias" \
                --region "$AWS_REGION"
            log_success "Rollback completed"
        else
            log_error "No backup aliases found for rollback"
            exit 1
        fi
    else
        log_error "Rollback is only supported for production environment"
        exit 1
    fi
}

confirm_production_deployment() {
    if [ "$FORCE" = true ]; then
        return
    fi
    
    echo
    log_warning "⚠️  PRODUCTION DEPLOYMENT CONFIRMATION ⚠️"
    echo
    echo "You are about to deploy to the PRODUCTION environment."
    echo "This will affect live users and real data."
    echo
    echo "Environment: production"
    echo "Region: $AWS_REGION"
    echo "Timestamp: $(date)"
    echo
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        log_error "Production deployment cancelled"
        exit 1
    fi
    
    log_info "Production deployment confirmed"
}

send_deployment_notification() {
    local env=$1
    local status=$2
    
    # This would integrate with Slack, email, or other notification systems
    log_info "Deployment notification: $env deployment $status"
}

cleanup() {
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log_success "Deployment completed successfully!"
        send_deployment_notification "$ENVIRONMENT" "succeeded"
    else
        log_error "Deployment failed!"
        send_deployment_notification "$ENVIRONMENT" "failed"
    fi
    
    exit $exit_code
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    # Parse command line arguments
    ENVIRONMENT=""
    SKIP_TESTS=false
    SKIP_MIGRATION=false
    SKIP_WARMUP=false
    DRY_RUN=false
    ROLLBACK=false
    FORCE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            dev|staging|production)
                ENVIRONMENT=$1
                shift
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-migration)
                SKIP_MIGRATION=true
                shift
                ;;
            --skip-warmup)
                SKIP_WARMUP=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --rollback)
                ROLLBACK=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Validate arguments
    if [ -z "$ENVIRONMENT" ]; then
        log_error "Environment is required"
        show_usage
        exit 1
    fi
    
    # Set trap for cleanup
    trap cleanup EXIT
    
    # Handle rollback
    if [ "$ROLLBACK" = true ]; then
        rollback_deployment "$ENVIRONMENT"
        return
    fi
    
    # Start deployment process
    log_info "Starting deployment process..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Region: $AWS_REGION"
    log_info "Timestamp: $(date)"
    
    # Run all deployment steps
    check_prerequisites
    validate_environment "$ENVIRONMENT"
    
    # Production confirmation
    if [ "$ENVIRONMENT" = "production" ]; then
        confirm_production_deployment
    fi
    
    install_dependencies
    generate_prisma_client
    run_tests
    run_production_readiness_check
    run_database_migration
    create_deployment_backup "$ENVIRONMENT"
    deploy_infrastructure "$ENVIRONMENT"
    run_post_deployment_checks "$ENVIRONMENT"
    warmup_functions
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Deployment completed in ${duration} seconds!"
}

# Run main function with all arguments
main "$@"