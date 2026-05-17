#!/bin/bash

# HASIVU Platform Deployment Script
# Usage: ./scripts/deploy.sh [staging|production]

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-staging}
PROJECT_NAME="hasivu-platform"
BUILD_DIR="out"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    error "Invalid environment. Use 'staging' or 'production'"
fi

log "🚀 Starting deployment to $ENVIRONMENT environment"

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if required tools are installed
command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
command -v pnpm >/dev/null 2>&1 || error "pnpm is required but not installed"
command -v aws >/dev/null 2>&1 || error "AWS CLI is required but not installed"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error "Node.js version 16 or higher is required. Current: $(node -v)"
fi

success "Pre-deployment checks passed"

# Load environment variables
log "Loading environment variables..."

if [ -f ".env.$ENVIRONMENT" ]; then
    set -a
    source ".env.$ENVIRONMENT"
    set +a
    success "Environment variables loaded from .env.$ENVIRONMENT"
else
    warning "No .env.$ENVIRONMENT file found. Using system environment variables"
fi

# Verify required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_WS_URL"
    "NEXT_PUBLIC_COGNITO_USER_POOL_ID"
    "NEXT_PUBLIC_COGNITO_CLIENT_ID"
    "AWS_ACCESS_KEY_ID"
    "AWS_SECRET_ACCESS_KEY"
    "AWS_REGION"
)

if [ "$ENVIRONMENT" = "staging" ]; then
    REQUIRED_VARS+=(
        "STAGING_S3_BUCKET"
        "STAGING_CLOUDFRONT_ID"
    )
else
    REQUIRED_VARS+=(
        "PRODUCTION_S3_BUCKET"
        "PRODUCTION_CLOUDFRONT_ID"
        "BACKUP_S3_BUCKET"
    )
fi

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        error "Required environment variable $var is not set"
    fi
done

success "All required environment variables are set"

# Install dependencies
log "Installing dependencies..."
pnpm install --frozen-lockfile || error "Failed to install dependencies"
success "Dependencies installed"

# Run tests
log "Running tests..."
pnpm run test --coverage --watchAll=false || error "Tests failed"
success "All tests passed"

# Type checking
log "Running TypeScript checks..."
pnpm run type-check || error "TypeScript checks failed"
success "TypeScript checks passed"

# Linting
log "Running ESLint..."
pnpm run lint || error "Linting failed"
success "Linting passed"

# Build the application
log "Building application for $ENVIRONMENT..."
pnpm run build || error "Build failed"
success "Build completed"

# Verify build output
if [ ! -d "$BUILD_DIR" ]; then
    error "Build directory $BUILD_DIR not found"
fi

BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
log "Build size: $BUILD_SIZE"

# Set AWS configuration based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
    S3_BUCKET="$STAGING_S3_BUCKET"
    CLOUDFRONT_ID="$STAGING_CLOUDFRONT_ID"
    BASE_URL="https://staging.hasivu.com"
else
    S3_BUCKET="$PRODUCTION_S3_BUCKET"
    CLOUDFRONT_ID="$PRODUCTION_CLOUDFRONT_ID"
    BASE_URL="https://app.hasivu.com"
    
    # Create backup for production
    if [ -n "$BACKUP_S3_BUCKET" ]; then
        log "Creating backup of current production deployment..."
        aws s3 sync "s3://$S3_BUCKET" "s3://$BACKUP_S3_BUCKET/backup-$TIMESTAMP/" --quiet || warning "Backup failed but continuing..."
        success "Backup created: backup-$TIMESTAMP"
    fi
fi

# Deploy to S3
log "Deploying to S3 bucket: $S3_BUCKET"
aws s3 sync "$BUILD_DIR/" "s3://$S3_BUCKET" \
    --delete \
    --cache-control "max-age=31536000,public" \
    --exclude "*.html" || error "S3 sync failed"

# Upload HTML files with no-cache headers
log "Uploading HTML files with no-cache headers..."
find "$BUILD_DIR" -name "*.html" -type f | while read -r file; do
    relative_path="${file#$BUILD_DIR/}"
    aws s3 cp "$file" "s3://$S3_BUCKET/$relative_path" \
        --cache-control "max-age=0,no-cache,no-store,must-revalidate" || error "Failed to upload $file"
done

success "Files uploaded to S3"

# Invalidate CloudFront cache
log "Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text) || error "CloudFront invalidation failed"

success "CloudFront invalidation created: $INVALIDATION_ID"

# Wait for invalidation to complete (optional, comment out for faster deployments)
if [ "$ENVIRONMENT" = "production" ]; then
    log "Waiting for CloudFront invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "$CLOUDFRONT_ID" \
        --id "$INVALIDATION_ID" || warning "Invalidation wait timeout (deployment may still be successful)"
    success "CloudFront cache cleared"
fi

# Health checks
log "Running health checks..."
sleep 10  # Wait for deployment to propagate

# Check if the site is accessible
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
    success "Health check passed: $BASE_URL returned $HTTP_STATUS"
else
    warning "Health check warning: $BASE_URL returned $HTTP_STATUS"
fi

# Check API health endpoint if available
API_HEALTH_URL="$BASE_URL/api/health"
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_HEALTH_URL" || echo "000")
if [ "$API_STATUS" = "200" ]; then
    success "API health check passed: $API_HEALTH_URL returned $API_STATUS"
else
    warning "API health check warning: $API_HEALTH_URL returned $API_STATUS"
fi

# Performance check with Lighthouse (optional)
if command -v lighthouse >/dev/null 2>&1 && [ "$ENVIRONMENT" = "production" ]; then
    log "Running Lighthouse performance audit..."
    mkdir -p "reports"
    lighthouse "$BASE_URL" \
        --output=json \
        --output-path="reports/lighthouse-$TIMESTAMP.json" \
        --chrome-flags="--headless --no-sandbox" \
        --quiet || warning "Lighthouse audit failed"
    
    if [ -f "reports/lighthouse-$TIMESTAMP.json" ]; then
        PERFORMANCE_SCORE=$(jq -r '.categories.performance.score * 100' "reports/lighthouse-$TIMESTAMP.json" 2>/dev/null || echo "N/A")
        log "Lighthouse Performance Score: $PERFORMANCE_SCORE"
    fi
fi

# Deployment summary
log "📊 Deployment Summary:"
echo "Environment: $ENVIRONMENT"
echo "Build Size: $BUILD_SIZE"
echo "S3 Bucket: $S3_BUCKET"
echo "CloudFront ID: $CLOUDFRONT_ID"
echo "URL: $BASE_URL"
echo "Timestamp: $TIMESTAMP"

# Create deployment record
DEPLOY_LOG="deployments.log"
echo "[$TIMESTAMP] $ENVIRONMENT deployment completed - $BASE_URL" >> "$DEPLOY_LOG"

success "🎉 Deployment to $ENVIRONMENT completed successfully!"
success "🌐 Your application is now available at: $BASE_URL"

# Optional: Open URL in browser on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    read -p "Would you like to open the deployed application in your browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$BASE_URL"
    fi
fi
