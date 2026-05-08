#!/bin/bash
# =============================================================================
# HASIVU Platform - Canary Deployment Script
# Gradual traffic shifting with automated monitoring and rollback
# =============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
STAGE="${1:-production}"
CANARY_PERCENTAGE="${2:-10}"
MONITOR_DURATION="${3:-600}"  # 10 minutes in seconds
INTERVAL=60
ERROR_THRESHOLD=5
LATENCY_THRESHOLD=5000  # 5 seconds

# Derived variables
FUNCTION_PREFIX="hasivu-${STAGE}"
DEPLOYMENT_ID=$(date +%s)
ROLLBACK_FILE="/tmp/hasivu-rollback-${DEPLOYMENT_ID}.json"

# =============================================================================
# Utility Functions
# =============================================================================

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

send_slack_notification() {
    local message="$1"
    local status="${2:-info}"
    local emoji="ℹ️"

    case "$status" in
        success) emoji="✅" ;;
        warning) emoji="⚠️" ;;
        error) emoji="🚨" ;;
    esac

    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"${emoji} ${message}\"}" \
            > /dev/null 2>&1 || true
    fi
}

# =============================================================================
# Pre-Deployment Validation
# =============================================================================

validate_prerequisites() {
    log_info "Validating prerequisites..."

    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI not found. Please install it."
        exit 1
    fi

    # Check jq for JSON parsing
    if ! command -v jq &> /dev/null; then
        log_error "jq not found. Please install it."
        exit 1
    fi

    # Check serverless CLI
    if ! command -v serverless &> /dev/null; then
        log_error "Serverless Framework not found. Please install it."
        exit 1
    fi

    # Validate AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi

    log_success "Prerequisites validated"
}

# =============================================================================
# Save Current State for Rollback
# =============================================================================

save_current_state() {
    log_info "Saving current deployment state for rollback..."

    local functions=$(aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '${FUNCTION_PREFIX}')].FunctionName" \
        --output text)

    local state_json="{\"deployment_id\": \"${DEPLOYMENT_ID}\", \"stage\": \"${STAGE}\", \"functions\": []}"

    for func in $functions; do
        # Get current production alias version
        local current_version=$(aws lambda get-alias \
            --function-name "$func" \
            --name production \
            --query 'FunctionVersion' \
            --output text 2>/dev/null || echo "\$LATEST")

        # Add to state
        state_json=$(echo "$state_json" | jq \
            --arg fn "$func" \
            --arg ver "$current_version" \
            '.functions += [{"name": $fn, "version": $ver}]')
    done

    echo "$state_json" > "$ROLLBACK_FILE"
    log_success "Current state saved to $ROLLBACK_FILE"
}

# =============================================================================
# Deploy to Canary
# =============================================================================

deploy_canary() {
    log_info "Deploying canary version..."

    # Deploy with serverless
    if ! serverless deploy \
        --stage "$STAGE" \
        --alias canary \
        --conceal \
        2>&1 | tee /tmp/serverless-deploy.log; then
        log_error "Canary deployment failed"
        cat /tmp/serverless-deploy.log
        exit 1
    fi

    log_success "Canary version deployed"
}

# =============================================================================
# Update Traffic Weights
# =============================================================================

update_traffic_weights() {
    local percentage="$1"
    log_info "Routing ${percentage}% traffic to canary..."

    local functions=$(aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '${FUNCTION_PREFIX}')].FunctionName" \
        --output text)

    for func in $functions; do
        # Skip non-production functions
        if [[ "$func" == *"-warmup"* ]] || [[ "$func" == *"-prune"* ]]; then
            continue
        fi

        log_info "Updating traffic for $func"

        # Get canary version
        local canary_version=$(aws lambda get-alias \
            --function-name "$func" \
            --name canary \
            --query 'FunctionVersion' \
            --output text 2>/dev/null || echo "\$LATEST")

        # Update production alias with traffic split
        if [ "$canary_version" != "\$LATEST" ]; then
            aws lambda update-alias \
                --function-name "$func" \
                --name production \
                --routing-config "AdditionalVersionWeights={${canary_version}=$((percentage))}" \
                > /dev/null

            log_success "Traffic updated for $func: ${percentage}% → canary"
        else
            log_warning "Skipping $func (no canary version found)"
        fi
    done

    log_success "Traffic routing updated: ${percentage}% to canary"
}

# =============================================================================
# Monitor Canary Health
# =============================================================================

get_metric_value() {
    local namespace="$1"
    local metric="$2"
    local dimensions="$3"
    local statistic="${4:-Sum}"

    local value=$(aws cloudwatch get-metric-statistics \
        --namespace "$namespace" \
        --metric-name "$metric" \
        --dimensions $dimensions \
        --start-time "$(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S)" \
        --end-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
        --period 300 \
        --statistics "$statistic" \
        --query 'Datapoints[0].'"$statistic" \
        --output text 2>/dev/null || echo "0")

    echo "${value:-0}"
}

monitor_canary() {
    log_info "Monitoring canary for ${MONITOR_DURATION} seconds..."
    send_slack_notification "🐦 Canary deployment started: monitoring for $((MONITOR_DURATION / 60)) minutes" "info"

    local checks=$((MONITOR_DURATION / INTERVAL))
    local failed_checks=0

    for i in $(seq 1 "$checks"); do
        log_info "Health check ${i}/${checks}..."

        local all_healthy=true

        # Get list of functions
        local functions=$(aws lambda list-functions \
            --query "Functions[?starts_with(FunctionName, '${FUNCTION_PREFIX}')].FunctionName" \
            --output text)

        for func in $functions; do
            # Skip warmup and utility functions
            if [[ "$func" == *"-warmup"* ]] || [[ "$func" == *"-prune"* ]]; then
                continue
            fi

            # Get canary version
            local canary_version=$(aws lambda get-alias \
                --function-name "$func" \
                --name canary \
                --query 'FunctionVersion' \
                --output text 2>/dev/null || echo "none")

            if [ "$canary_version" = "none" ]; then
                continue
            fi

            # Check error rate
            local errors=$(get_metric_value \
                "AWS/Lambda" \
                "Errors" \
                "Name=FunctionName,Value=${func} Name=Resource,Value=${canary_version}" \
                "Sum")

            local invocations=$(get_metric_value \
                "AWS/Lambda" \
                "Invocations" \
                "Name=FunctionName,Value=${func} Name=Resource,Value=${canary_version}" \
                "Sum")

            if [ "$invocations" != "0" ] && [ "$invocations" != "None" ]; then
                local error_rate=$(echo "scale=2; ($errors / $invocations) * 100" | bc)

                if (( $(echo "$error_rate > $ERROR_THRESHOLD" | bc -l) )); then
                    log_error "Canary error rate too high for $func: ${error_rate}% (threshold: ${ERROR_THRESHOLD}%)"
                    all_healthy=false
                    break
                fi
            fi

            # Check latency (duration)
            local duration=$(get_metric_value \
                "AWS/Lambda" \
                "Duration" \
                "Name=FunctionName,Value=${func} Name=Resource,Value=${canary_version}" \
                "Average")

            if [ "$duration" != "0" ] && [ "$duration" != "None" ]; then
                if (( $(echo "$duration > $LATENCY_THRESHOLD" | bc -l) )); then
                    log_error "Canary latency too high for $func: ${duration}ms (threshold: ${LATENCY_THRESHOLD}ms)"
                    all_healthy=false
                    break
                fi
            fi
        done

        if [ "$all_healthy" = false ]; then
            ((failed_checks++))
            log_warning "Health check failed (${failed_checks}/3)"

            if [ "$failed_checks" -ge 3 ]; then
                log_error "Too many failed health checks - initiating rollback"
                send_slack_notification "🚨 Canary deployment failed health checks - rolling back" "error"
                return 1
            fi
        else
            failed_checks=0
            log_success "Health check passed"
        fi

        # Sleep before next check
        if [ "$i" -lt "$checks" ]; then
            sleep "$INTERVAL"
        fi
    done

    log_success "Canary monitoring complete - all checks passed"
    return 0
}

# =============================================================================
# Promote Canary
# =============================================================================

promote_canary() {
    log_info "Promoting canary to 100% traffic..."
    send_slack_notification "🎉 Canary promotion starting - switching to 100% traffic" "info"

    local functions=$(aws lambda list-functions \
        --query "Functions[?starts_with(FunctionName, '${FUNCTION_PREFIX}')].FunctionName" \
        --output text)

    for func in $functions; do
        # Skip utility functions
        if [[ "$func" == *"-warmup"* ]] || [[ "$func" == *"-prune"* ]]; then
            continue
        fi

        # Get canary version
        local canary_version=$(aws lambda get-alias \
            --function-name "$func" \
            --name canary \
            --query 'FunctionVersion' \
            --output text 2>/dev/null || continue)

        # Update production alias to point to canary version with 100% traffic
        aws lambda update-alias \
            --function-name "$func" \
            --name production \
            --function-version "$canary_version" \
            --routing-config '{}' \
            > /dev/null

        log_success "Promoted $func to production (version: $canary_version)"
    done

    log_success "Canary promoted successfully"
    send_slack_notification "✅ Canary deployment promoted to production successfully" "success"
}

# =============================================================================
# Rollback Canary
# =============================================================================

rollback_canary() {
    log_error "Rolling back canary deployment..."
    send_slack_notification "🔴 Rolling back canary deployment" "error"

    if [ ! -f "$ROLLBACK_FILE" ]; then
        log_error "Rollback file not found: $ROLLBACK_FILE"
        return 1
    fi

    # Read rollback state
    local functions=$(jq -r '.functions[] | "\(.name):\(.version)"' "$ROLLBACK_FILE")

    while IFS=: read -r func version; do
        log_info "Rolling back $func to version $version"

        # Restore previous version
        aws lambda update-alias \
            --function-name "$func" \
            --name production \
            --function-version "$version" \
            --routing-config '{}' \
            > /dev/null

        log_success "Rolled back $func"
    done <<< "$functions"

    log_success "Rollback complete"
    send_slack_notification "✅ Rollback complete - restored to previous version" "warning"
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup() {
    log_info "Cleaning up..."

    # Remove rollback file
    if [ -f "$ROLLBACK_FILE" ]; then
        rm -f "$ROLLBACK_FILE"
    fi

    # Remove temporary files
    rm -f /tmp/serverless-deploy.log

    log_success "Cleanup complete"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    log_info "🐦 Starting canary deployment to $STAGE (${CANARY_PERCENTAGE}% traffic)"

    # Validate prerequisites
    validate_prerequisites

    # Save current state for potential rollback
    save_current_state

    # Deploy canary version
    deploy_canary

    # Update traffic weights
    update_traffic_weights "$CANARY_PERCENTAGE"

    # Monitor canary health
    if monitor_canary; then
        # Health checks passed - promote canary
        promote_canary

        # Cleanup
        cleanup

        log_success "🎉 Canary deployment successful!"
        exit 0
    else
        # Health checks failed - rollback
        rollback_canary

        # Cleanup
        cleanup

        log_error "💥 Canary deployment failed and was rolled back"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; rollback_canary; cleanup; exit 130' INT TERM

# Run main function
main
