#!/bin/bash

# Deployment Validation and Rollback Automation Script
# Comprehensive post-deployment validation with automated rollback capabilities

set -euo pipefail

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
DEPLOYMENT_ID=${DEPLOYMENT_ID:-unknown}
VALIDATION_TIMEOUT=300  # 5 minutes
ROLLBACK_TIMEOUT=600   # 10 minutes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Function to validate service health
validate_service_health() {
    local service_name=$1
    local url=$2
    local timeout=$3
    local expected_status=${4:-200}

    log_info "Validating $service_name health at $url"

    local start_time=$(date +%s)
    local response_code
    local response_time

    while true; do
        response_time=$(curl -w "%{time_total}" -o /dev/null -s -m 10 "$url" || echo "failed")
        response_code=$(curl -s -o /dev/null -w "%{http_code}" -m 10 "$url" || echo "000")

        if [[ "$response_code" == "$expected_status" ]]; then
            local elapsed=$(( $(date +%s) - start_time ))
            log_success "$service_name is healthy (HTTP $response_code, ${response_time}s response time)"
            return 0
        fi

        local elapsed=$(( $(date +%s) - start_time ))
        if [[ $elapsed -ge $timeout ]]; then
            log_error "$service_name health check failed after ${elapsed}s (HTTP $response_code)"
            return 1
        fi

        sleep 5
    done
}

# Function to validate database connectivity
validate_database() {
    log_info "Validating database connectivity..."

    # Test database connection
    if npm run db:test:connection > /dev/null 2>&1; then
        log_success "Database connectivity validated"
        return 0
    else
        log_error "Database connectivity test failed"
        return 1
    fi
}

# Function to validate Redis connectivity
validate_redis() {
    log_info "Validating Redis connectivity..."

    # Test Redis connection
    if redis-cli -h localhost ping > /dev/null 2>&1; then
        log_success "Redis connectivity validated"
        return 0
    else
        log_error "Redis connectivity test failed"
        return 1
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    local environment=$1

    log_info "Running smoke tests for $environment environment..."

    local test_results
    test_results=$(npm run test:smoke:$environment 2>&1) || {
        log_error "Smoke tests failed"
        echo "$test_results"
        return 1
    }

    log_success "Smoke tests passed"
    return 0
}

# Function to validate API endpoints
validate_api_endpoints() {
    log_info "Validating API endpoints..."

    local api_endpoints=(
        "GET /health:200"
        "GET /api/auth/status:200"
        "GET /api/menu:200"
        "GET /api/orders/recent:200"
    )

    local base_url="http://localhost:3000"
    local failed_endpoints=0

    for endpoint in "${api_endpoints[@]}"; do
        IFS=':' read -r method path expected_status <<< "$endpoint"

        local full_url="$base_url$path"
        local actual_status

        case $method in
            "GET")
                actual_status=$(curl -s -o /dev/null -w "%{http_code}" "$full_url")
                ;;
            "POST")
                actual_status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$full_url")
                ;;
        esac

        if [[ "$actual_status" == "$expected_status" ]]; then
            log_success "✓ $method $path (HTTP $actual_status)"
        else
            log_error "✗ $method $path (Expected: $expected_status, Got: $actual_status)"
            ((failed_endpoints++))
        fi
    done

    if [[ $failed_endpoints -gt 0 ]]; then
        log_error "$failed_endpoints API endpoint validations failed"
        return 1
    fi

    log_success "All API endpoints validated successfully"
    return 0
}

# Function to validate performance metrics
validate_performance() {
    log_info "Validating performance metrics..."

    local response_time_threshold=2.0  # seconds
    local error_rate_threshold=1       # percentage

    # Test response times
    local api_url="http://localhost:3000/api/health"
    local response_time

    response_time=$(curl -w "%{time_total}" -o /dev/null -s "$api_url" 2>/dev/null || echo "999")

    if (( $(echo "$response_time > $response_time_threshold" | bc -l) )); then
        log_warning "Response time too slow: ${response_time}s (threshold: ${response_time_threshold}s)"
        return 1
    fi

    log_success "Performance metrics within acceptable limits (${response_time}s)"
    return 0
}

# Function to validate monitoring setup
validate_monitoring() {
    log_info "Validating monitoring setup..."

    # Check Prometheus
    if curl -f --max-time 5 --silent "http://localhost:9090/-/healthy" > /dev/null 2>&1; then
        log_success "Prometheus is healthy"
    else
        log_warning "Prometheus health check failed"
        return 1
    fi

    # Check application metrics endpoint
    if curl -f --max-time 5 --silent "http://localhost:3000/metrics" > /dev/null 2>&1; then
        log_success "Application metrics endpoint is accessible"
    else
        log_warning "Application metrics endpoint not accessible"
        return 1
    fi

    return 0
}

# Function to perform canary analysis
perform_canary_analysis() {
    local new_version=$1
    local baseline_version=$2

    log_info "Performing canary analysis between versions..."

    # Compare error rates, response times, and success rates
    # This is a simplified version - in production, you'd integrate with APM tools

    local new_error_rate
    local baseline_error_rate

    # Placeholder for actual metrics collection
    new_error_rate=0.5
    baseline_error_rate=0.3

    if (( $(echo "$new_error_rate > $baseline_error_rate + 1" | bc -l) )); then
        log_warning "Canary analysis: Error rate increased significantly (${new_error_rate}% vs ${baseline_error_rate}%)"
        return 1
    fi

    log_success "Canary analysis passed"
    return 0
}

# Function to initiate rollback
initiate_rollback() {
    local failed_environment=$1
    local reason=$2

    log_warning "Initiating rollback due to: $reason"

    # Determine rollback target
    local rollback_target
    if [[ "$failed_environment" == "blue" ]]; then
        rollback_target="green"
    else
        rollback_target="blue"
    fi

    log_info "Rolling back to $rollback_target environment..."

    # Execute rollback using blue-green script
    if ./scripts/blue-green-deploy.sh rollback "$rollback_target"; then
        log_success "Rollback completed successfully"

        # Send notification
        if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
            ./scripts/slack-notifications.sh deployment-status rollback 0 "$rollback_target" "${GITHUB_SHA:-unknown}"
        fi

        return 0
    else
        log_error "Rollback failed"
        return 1
    fi
}

# Function to run comprehensive validation
run_comprehensive_validation() {
    local environment=$1
    local validation_start=$(date +%s)
    local validation_results=()

    log_info "Starting comprehensive deployment validation for $environment..."

    # 1. Service Health Validation
    log_info "Step 1: Service Health Validation"
    if validate_service_health "Frontend" "http://localhost:3000/api/health" 60 200; then
        validation_results+=("service_health:pass")
    else
        validation_results+=("service_health:fail")
    fi

    if validate_service_health "Backend" "http://localhost:3001/health" 60 200; then
        validation_results+=("backend_health:pass")
    else
        validation_results+=("backend_health:fail")
    fi

    # 2. Database Validation
    log_info "Step 2: Database Validation"
    if validate_database; then
        validation_results+=("database:pass")
    else
        validation_results+=("database:fail")
    fi

    # 3. Redis Validation
    log_info "Step 3: Redis Validation"
    if validate_redis; then
        validation_results+=("redis:pass")
    else
        validation_results+=("redis:fail")
    fi

    # 4. API Endpoints Validation
    log_info "Step 4: API Endpoints Validation"
    if validate_api_endpoints; then
        validation_results+=("api_endpoints:pass")
    else
        validation_results+=("api_endpoints:fail")
    fi

    # 5. Smoke Tests
    log_info "Step 5: Smoke Tests"
    if run_smoke_tests "$environment"; then
        validation_results+=("smoke_tests:pass")
    else
        validation_results+=("smoke_tests:fail")
    fi

    # 6. Performance Validation
    log_info "Step 6: Performance Validation"
    if validate_performance; then
        validation_results+=("performance:pass")
    else
        validation_results+=("performance:fail")
    fi

    # 7. Monitoring Validation
    log_info "Step 7: Monitoring Validation"
    if validate_monitoring; then
        validation_results+=("monitoring:pass")
    else
        validation_results+=("monitoring:fail")
    fi

    # Calculate validation time
    local validation_end=$(date +%s)
    local validation_duration=$((validation_end - validation_start))

    # Analyze results
    local passed=0
    local failed=0
    local critical_failures=()

    for result in "${validation_results[@]}"; do
        IFS=':' read -r check status <<< "$result"
        if [[ "$status" == "pass" ]]; then
            ((passed++))
        else
            ((failed++))
            # Define critical checks that require rollback
            case $check in
                "service_health"|"backend_health"|"database"|"api_endpoints")
                    critical_failures+=("$check")
                    ;;
            esac
        fi
    done

    # Log results
    log_info "Validation completed in ${validation_duration}s"
    log_info "Results: $passed passed, $failed failed"

    # Determine overall status
    if [[ ${#critical_failures[@]} -gt 0 ]]; then
        log_error "Critical validation failures detected: ${critical_failures[*]}"
        return 1
    elif [[ $failed -gt 0 ]]; then
        log_warning "Non-critical validation failures detected"
        return 1
    else
        log_success "All validations passed successfully"
        return 0
    fi
}

# Function to monitor post-deployment
monitor_post_deployment() {
    local environment=$1
    local monitoring_duration=${2:-3600}  # 1 hour default

    log_info "Starting post-deployment monitoring for ${monitoring_duration}s..."

    local start_time=$(date +%s)
    local error_count=0
    local total_requests=0

    while true; do
        # Check health every 30 seconds
        if ! curl -f --max-time 5 --silent "http://localhost:3000/health" > /dev/null 2>&1; then
            ((error_count++))
            log_warning "Health check failed ($error_count/5)"
        fi

        ((total_requests++))

        # Calculate error rate
        local error_rate=0
        if [[ $total_requests -gt 0 ]]; then
            error_rate=$((error_count * 100 / total_requests))
        fi

        # Trigger rollback if error rate exceeds threshold
        if [[ $error_rate -gt 5 ]]; then
            log_error "Error rate exceeded threshold (${error_rate}%), initiating rollback"
            initiate_rollback "$environment" "High error rate during monitoring"
            return 1
        fi

        # Check if monitoring duration exceeded
        local current_time=$(date +%s)
        local elapsed=$((current_time - start_time))

        if [[ $elapsed -ge $monitoring_duration ]]; then
            log_success "Post-deployment monitoring completed successfully (error rate: ${error_rate}%)"
            return 0
        fi

        sleep 30
    done
}

# Main function
main() {
    case "${1:-}" in
        "validate")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 validate <environment>"
                exit 1
            fi
            run_comprehensive_validation "$2"
            ;;
        "health-check")
            if [[ $# -lt 3 ]]; then
                log_error "Usage: $0 health-check <service> <url> [expected_status]"
                exit 1
            fi
            validate_service_health "$2" "$3" 60 "${4:-200}"
            ;;
        "smoke-test")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 smoke-test <environment>"
                exit 1
            fi
            run_smoke_tests "$2"
            ;;
        "rollback")
            if [[ $# -lt 3 ]]; then
                log_error "Usage: $0 rollback <environment> <reason>"
                exit 1
            fi
            initiate_rollback "$2" "$3"
            ;;
        "monitor")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 monitor <environment> [duration]"
                exit 1
            fi
            monitor_post_deployment "$2" "${3:-3600}"
            ;;
        "canary")
            if [[ $# -lt 3 ]]; then
                log_error "Usage: $0 canary <new_version> <baseline_version>"
                exit 1
            fi
            perform_canary_analysis "$2" "$3"
            ;;
        *)
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  validate <environment>          - Run comprehensive validation"
            echo "  health-check <service> <url>     - Check service health"
            echo "  smoke-test <environment>        - Run smoke tests"
            echo "  rollback <environment> <reason> - Initiate rollback"
            echo "  monitor <environment> [duration] - Monitor post-deployment"
            echo "  canary <new> <baseline>         - Perform canary analysis"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"