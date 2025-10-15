#!/bin/bash

# HASIVU Production Deployment Script
# Usage: ./deploy.sh [environment] [version]

set -e

# Configuration
ENVIRONMENT=${1:-production}
VERSION=${2:-$(date +%Y%m%d-%H%M%S)}
PROJECT_NAME="hasivu-platform"
REGISTRY="your-registry.com"  # Replace with your container registry

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Check if required files exist
    local required_files=(
        "web/package.json"
        "web/Dockerfile.prod"
        "deployment/docker-compose.prod.yml"
        "deployment/nginx.prod.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done
    
    log_success "Pre-deployment checks passed"
}

# Build applications
build_applications() {
    log_info "Building applications..."
    
    # Build frontend
    log_info "Building frontend..."
    cd web
    npm ci --only=production
    npm run build
    cd ..
    
    # Test backend compilation
    log_info "Testing backend compilation..."
    npx tsc --noEmit --skipLibCheck src/simple-server.ts
    
    log_success "Applications built successfully"
}

# Run tests
run_tests() {
    log_info "Running test suite..."
    
    # Frontend unit tests
    log_info "Running frontend unit tests..."
    cd web
    npm test -- --coverage --watchAll=false --passWithNoTests
    cd ..
    
    # Backend tests (if available)
    log_info "Running backend tests..."
    # Add backend test commands here when available
    
    log_success "All tests passed"
}

# Build Docker images
build_docker_images() {
    log_info "Building Docker images..."
    
    # Build frontend image
    log_info "Building frontend Docker image..."
    docker build -f web/Dockerfile.prod -t "${PROJECT_NAME}-frontend:${VERSION}" web/
    docker tag "${PROJECT_NAME}-frontend:${VERSION}" "${PROJECT_NAME}-frontend:latest"
    
    # Build backend image
    log_info "Building backend Docker image..."
    docker build -f deployment/Dockerfile.backend -t "${PROJECT_NAME}-backend:${VERSION}" .
    docker tag "${PROJECT_NAME}-backend:${VERSION}" "${PROJECT_NAME}-backend:latest"
    
    log_success "Docker images built successfully"
}

# Security scan
security_scan() {
    log_info "Running security scans..."
    
    # Scan frontend dependencies
    cd web
    npm audit --audit-level moderate || log_warning "Frontend security vulnerabilities detected"
    cd ..
    
    # Scan Docker images (if docker scan is available)
    if command -v docker &> /dev/null; then
        log_info "Scanning Docker images for vulnerabilities..."
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            -v $PWD:/tmp aquasec/trivy image "${PROJECT_NAME}-frontend:${VERSION}" || true
        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
            -v $PWD:/tmp aquasec/trivy image "${PROJECT_NAME}-backend:${VERSION}" || true
    fi
    
    log_success "Security scans completed"
}

# Deploy to environment
deploy_to_environment() {
    log_info "Deploying to ${ENVIRONMENT} environment..."
    
    # Create deployment directory
    mkdir -p "deployments/${ENVIRONMENT}"
    
    # Copy deployment files
    cp deployment/docker-compose.prod.yml "deployments/${ENVIRONMENT}/docker-compose.yml"
    cp deployment/nginx.prod.conf "deployments/${ENVIRONMENT}/"
    
    # Update image tags in docker-compose
    sed -i.bak "s/:latest/:${VERSION}/g" "deployments/${ENVIRONMENT}/docker-compose.yml"
    
    # Deploy using docker-compose
    cd "deployments/${ENVIRONMENT}"
    
    log_info "Starting deployment..."
    docker-compose down --remove-orphans || true
    docker-compose up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    sleep 30
    
    # Health checks
    log_info "Running health checks..."
    
    # Check frontend health
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi
    
    # Check backend health
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi
    
    cd ../..
    
    log_success "Deployment to ${ENVIRONMENT} completed successfully"
}

# Post-deployment monitoring setup
setup_monitoring() {
    log_info "Setting up monitoring..."
    
    # Start monitoring services
    docker-compose -f deployment/docker-compose.prod.yml up -d monitoring
    
    log_info "Monitoring setup completed"
    log_info "Prometheus available at: http://localhost:9090"
}

# Rollback function
rollback() {
    local previous_version=$1
    if [[ -z "$previous_version" ]]; then
        log_error "Previous version not specified for rollback"
        exit 1
    fi
    
    log_warning "Rolling back to version: $previous_version"
    
    cd "deployments/${ENVIRONMENT}"
    
    # Update docker-compose to use previous version
    sed -i.bak "s/:.*/:${previous_version}/g" docker-compose.yml
    
    # Restart services with previous version
    docker-compose down --remove-orphans
    docker-compose up -d
    
    log_success "Rollback completed"
}

# Cleanup old images
cleanup() {
    log_info "Cleaning up old Docker images..."
    
    # Remove images older than 7 days
    docker image prune -af --filter "until=168h"
    
    # Remove unused volumes
    docker volume prune -f
    
    log_success "Cleanup completed"
}

# Main deployment flow
main() {
    log_info "Starting HASIVU deployment process..."
    log_info "Environment: ${ENVIRONMENT}"
    log_info "Version: ${VERSION}"
    
    # Handle special commands
    case "$1" in
        "rollback")
            rollback "$2"
            exit 0
            ;;
        "cleanup")
            cleanup
            exit 0
            ;;
    esac
    
    # Main deployment pipeline
    pre_deployment_checks
    build_applications
    run_tests
    build_docker_images
    security_scan
    deploy_to_environment
    setup_monitoring
    
    log_success "🚀 HASIVU deployment completed successfully!"
    log_info "Frontend: http://localhost:3000"
    log_info "Backend API: http://localhost:3001"
    log_info "Monitoring: http://localhost:9090"
    
    # Save deployment info
    echo "ENVIRONMENT=${ENVIRONMENT}" > "deployments/${ENVIRONMENT}/.env.deploy"
    echo "VERSION=${VERSION}" >> "deployments/${ENVIRONMENT}/.env.deploy"
    echo "DEPLOY_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "deployments/${ENVIRONMENT}/.env.deploy"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO. Exit code: $?"' ERR

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi