#!/bin/bash

# Blue-Green Deployment Script for Hasivu Platform
# Implements zero-downtime deployments with automatic rollback capabilities

set -euo pipefail

# Configuration
PROJECT_NAME="hasivu-platform"
DEPLOYMENT_TIMEOUT=600  # 10 minutes
HEALTH_CHECK_TIMEOUT=120  # 2 minutes
TRAFFIC_SWITCH_TIMEOUT=60  # 1 minute

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment variables
ENVIRONMENT=${ENVIRONMENT:-production}
DEPLOYMENT_ID=${DEPLOYMENT_ID:-$(date +%s)}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"your-registry.com"}
IMAGE_TAG=${IMAGE_TAG:-"latest"}

# Logging functions
log_info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Function to get current active environment
get_active_environment() {
    # Check which environment is currently active
    if docker ps --filter "name=${PROJECT_NAME}-blue" --filter "status=running" | grep -q "${PROJECT_NAME}-blue"; then
        echo "blue"
    elif docker ps --filter "name=${PROJECT_NAME}-green" --filter "status=running" | grep -q "${PROJECT_NAME}-green"; then
        echo "green"
    else
        echo "none"
    fi
}

# Function to get inactive environment
get_inactive_environment() {
    local active_env=$(get_active_environment)
    if [ "$active_env" = "blue" ]; then
        echo "green"
    elif [ "$active_env" = "green" ]; then
        echo "blue"
    else
        echo "blue"  # Default to blue for first deployment
    fi
}

# Function to check service health
check_service_health() {
    local service_name=$1
    local url=$2
    local timeout=$3

    log_info "Checking health of $service_name at $url"

    local start_time=$(date +%s)
    while true; do
        if curl -f --max-time 10 --silent "$url" > /dev/null 2>&1; then
            local elapsed=$(( $(date +%s) - start_time ))
            log_success "$service_name is healthy after ${elapsed}s"
            return 0
        fi

        local elapsed=$(( $(date +%s) - start_time ))
        if [ $elapsed -ge $timeout ]; then
            log_error "$service_name health check failed after ${elapsed}s"
            return 1
        fi

        sleep 5
    done
}

# Function to deploy to specific environment
deploy_to_environment() {
    local target_env=$1
    local image_tag=$2

    log_info "Deploying to $target_env environment with image tag: $image_tag"

    # Create deployment directory
    local deploy_dir="deployments/${ENVIRONMENT}/${target_env}"
    mkdir -p "$deploy_dir"

    # Pull latest images
    log_info "Pulling Docker images..."
    docker pull "${DOCKER_REGISTRY}/${PROJECT_NAME}:${image_tag}" || {
        log_error "Failed to pull Docker image"
        return 1
    }

    # Stop existing containers in target environment
    log_info "Stopping existing containers in $target_env environment..."
    docker-compose -f "deployment/docker-compose.${ENVIRONMENT}.yml" \
        --project-name "${PROJECT_NAME}-${target_env}" \
        down --remove-orphans || true

    # Update docker-compose file with new image tag
    local compose_file="deployment/docker-compose.${ENVIRONMENT}.yml"
    sed -i.bak "s|${DOCKER_REGISTRY}/${PROJECT_NAME}:.*|${DOCKER_REGISTRY}/${PROJECT_NAME}:${image_tag}|g" "$compose_file"

    # Start new containers
    log_info "Starting new containers in $target_env environment..."
    DEPLOYMENT_ENV=$target_env \
    docker-compose -f "$compose_file" \
        --project-name "${PROJECT_NAME}-${target_env}" \
        up -d

    # Wait for services to be healthy
    local backend_url="http://localhost:3001"
    local frontend_url="http://localhost:3000"

    if [ "$target_env" = "blue" ]; then
        backend_url="http://localhost:3003"  # Blue environment ports
        frontend_url="http://localhost:3002"
    elif [ "$target_env" = "green" ]; then
        backend_url="http://localhost:3005"  # Green environment ports
        frontend_url="http://localhost:3004"
    fi

    if ! check_service_health "Backend ($target_env)" "$backend_url/health" $HEALTH_CHECK_TIMEOUT; then
        log_error "Backend health check failed for $target_env environment"
        return 1
    fi

    if ! check_service_health "Frontend ($target_env)" "$frontend_url/api/health" $HEALTH_CHECK_TIMEOUT; then
        log_error "Frontend health check failed for $target_env environment"
        return 1
    fi

    log_success "Successfully deployed to $target_env environment"
    return 0
}

# Function to switch traffic
switch_traffic() {
    local new_active_env=$1

    log_info "Switching traffic to $new_active_env environment..."

    # Update nginx configuration or load balancer
    local nginx_config="deployment/nginx.${ENVIRONMENT}.conf"

    if [ "$new_active_env" = "blue" ]; then
        sed -i.bak 's/upstream_backend green/upstream_backend blue/g' "$nginx_config"
        sed -i.bak 's/upstream_frontend green/upstream_frontend blue/g' "$nginx_config"
    elif [ "$new_active_env" = "green" ]; then
        sed -i.bak 's/upstream_backend blue/upstream_backend green/g' "$nginx_config"
        sed -i.bak 's/upstream_frontend blue/upstream_frontend green/g' "$nginx_config"
    fi

    # Reload nginx configuration
    docker exec ${PROJECT_NAME}-nginx nginx -s reload || {
        log_error "Failed to reload nginx configuration"
        return 1
    }

    # Wait for traffic switch to complete
    sleep $TRAFFIC_SWITCH_TIMEOUT

    log_success "Traffic successfully switched to $new_active_env environment"
    return 0
}

# Function to rollback
rollback() {
    local failed_env=$1
    local previous_env=$(get_active_environment)

    log_warning "Rolling back from $failed_env to $previous_env environment..."

    if [ "$previous_env" = "none" ]; then
        log_error "No previous environment to rollback to"
        return 1
    fi

    # Switch traffic back
    if ! switch_traffic "$previous_env"; then
        log_error "Failed to switch traffic back during rollback"
        return 1
    fi

    # Stop failed environment
    log_info "Stopping failed $failed_env environment..."
    docker-compose -f "deployment/docker-compose.${ENVIRONMENT}.yml" \
        --project-name "${PROJECT_NAME}-${failed_env}" \
        down --remove-orphans || true

    log_success "Rollback completed successfully"
    return 0
}

# Function to run smoke tests
run_smoke_tests() {
    local target_env=$1

    log_info "Running smoke tests on $target_env environment..."

    # Define test endpoints
    local test_endpoints=(
        "http://localhost:3000/api/health"
        "http://localhost:3001/health"
        "http://localhost:3000/api/auth/status"
        "http://localhost:3001/api/menu"
    )

    local failed_tests=0

    for endpoint in "${test_endpoints[@]}"; do
        if ! curl -f --max-time 10 --silent "$endpoint" > /dev/null 2>&1; then
            log_error "Smoke test failed for $endpoint"
            ((failed_tests++))
        else
            log_success "Smoke test passed for $endpoint"
        fi
    done

    if [ $failed_tests -gt 0 ]; then
        log_error "$failed_tests smoke tests failed"
        return 1
    fi

    log_success "All smoke tests passed"
    return 0
}

# Main deployment function
main() {
    log_info "🚀 Starting Blue-Green Deployment"
    log_info "Environment: $ENVIRONMENT"
    log_info "Deployment ID: $DEPLOYMENT_ID"
    log_info "Image Tag: $IMAGE_TAG"

    # Pre-deployment checks
    log_info "Running pre-deployment checks..."

    # Check Docker availability
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not available"
        exit 1
    fi

    # Check required files
    local required_files=(
        "deployment/docker-compose.${ENVIRONMENT}.yml"
        "deployment/nginx.${ENVIRONMENT}.conf"
    )

    for file in "${required_files[@]}"; do
        if [[ ! -f "$file" ]]; then
            log_error "Required file not found: $file"
            exit 1
        fi
    done

    # Determine deployment strategy
    local active_env=$(get_active_environment)
    local target_env=$(get_inactive_environment)

    log_info "Current active environment: $active_env"
    log_info "Target deployment environment: $target_env"

    # Deploy to target environment
    if ! deploy_to_environment "$target_env" "$IMAGE_TAG"; then
        log_error "Deployment to $target_env environment failed"
        exit 1
    fi

    # Run smoke tests on new environment
    if ! run_smoke_tests "$target_env"; then
        log_error "Smoke tests failed on $target_env environment"
        rollback "$target_env"
        exit 1
    fi

    # Switch traffic to new environment
    if ! switch_traffic "$target_env"; then
        log_error "Traffic switch failed"
        rollback "$target_env"
        exit 1
    fi

    # Wait for traffic to stabilize
    log_info "Waiting for traffic to stabilize..."
    sleep 30

    # Final health check
    if ! run_smoke_tests "$target_env"; then
        log_error "Final health check failed"
        rollback "$target_env"
        exit 1
    fi

    # Clean up old environment after successful deployment
    if [ "$active_env" != "none" ]; then
        log_info "Cleaning up old $active_env environment..."
        docker-compose -f "deployment/docker-compose.${ENVIRONMENT}.yml" \
            --project-name "${PROJECT_NAME}-${active_env}" \
            down --remove-orphans || true

        # Keep containers for potential rollback (configurable)
        if [ "${KEEP_OLD_ENV_FOR_ROLLBACK:-true}" = "true" ]; then
            log_info "Keeping old environment for potential rollback"
        fi
    fi

    # Save deployment information
    local deploy_info="deployments/${ENVIRONMENT}/deployment-${DEPLOYMENT_ID}.json"
    cat > "$deploy_info" << EOF
{
    "deployment_id": "$DEPLOYMENT_ID",
    "environment": "$ENVIRONMENT",
    "active_environment": "$target_env",
    "image_tag": "$IMAGE_TAG",
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "status": "success"
}
EOF

    log_success "🎉 Blue-Green deployment completed successfully!"
    log_info "Active environment: $target_env"
    log_info "Deployment info saved to: $deploy_info"

    # Send success notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"✅ Blue-Green deployment successful!\\nEnvironment: $ENVIRONMENT\\nActive: $target_env\\nImage: $IMAGE_TAG\\nDeployment ID: $DEPLOYMENT_ID\"}" || true
    fi
}

# Handle command line arguments
case "${1:-}" in
    "rollback")
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 rollback <environment>"
            exit 1
        fi
        rollback "$2"
        ;;
    "status")
        active_env=$(get_active_environment)
        log_info "Current active environment: $active_env"
        ;;
    "switch")
        if [ $# -lt 2 ]; then
            log_error "Usage: $0 switch <environment>"
            exit 1
        fi
        switch_traffic "$2"
        ;;
    *)
        main "$@"
        ;;
esac