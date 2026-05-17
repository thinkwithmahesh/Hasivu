#!/bin/bash

# Deployment Frequency Monitoring and Failure Rate Tracking Script
# Tracks deployment metrics to achieve 10+/week deployments with <5% failure rate

set -euo pipefail

# Configuration
METRICS_DIR="metrics"
DEPLOYMENT_LOG="$METRICS_DIR/deployments.log"
METRICS_DB="$METRICS_DIR/metrics.db"
TARGET_DEPLOYMENTS_PER_WEEK=10
MAX_FAILURE_RATE=5.0

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

# Function to initialize metrics storage
init_metrics() {
    mkdir -p "$METRICS_DIR"

    # Create metrics database if it doesn't exist
    if [[ ! -f "$METRICS_DB" ]]; then
        cat > "$METRICS_DB" << EOF
{
    "deployments": [],
    "weekly_stats": {},
    "monthly_stats": {},
    "targets": {
        "deployments_per_week": $TARGET_DEPLOYMENTS_PER_WEEK,
        "max_failure_rate": $MAX_FAILURE_RATE
    }
}
EOF
    fi

    # Create deployment log if it doesn't exist
    touch "$DEPLOYMENT_LOG"
}

# Function to record deployment
record_deployment() {
    local deployment_id=$1
    local environment=$2
    local status=$3
    local duration=$4
    local commit_sha=$5
    local triggered_by=${6:-"automated"}

    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local week=$(date +%V)
    local month=$(date +%Y-%m)

    # Create deployment record
    local record
    record=$(cat << EOF
{
    "id": "$deployment_id",
    "environment": "$environment",
    "status": "$status",
    "duration": $duration,
    "commit_sha": "$commit_sha",
    "triggered_by": "$triggered_by",
    "timestamp": "$timestamp",
    "week": "$week",
    "month": "$month"
}
EOF
)

    # Append to deployment log
    echo "$record" >> "$DEPLOYMENT_LOG"

    # Update metrics database
    update_metrics_database "$record"

    log_success "Recorded deployment: $deployment_id ($status) - ${duration}s"
}

# Function to update metrics database
update_metrics_database() {
    local new_record=$1

    # Read current metrics
    local current_metrics
    current_metrics=$(cat "$METRICS_DB")

    # Add new deployment to array (simplified - in production use jq or similar)
    # For this implementation, we'll maintain a simple structure
    local updated_deployments
    updated_deployments=$(echo "$current_metrics" | sed 's/"deployments": \[/&'"$new_record"', /')

    echo "$updated_deployments" > "$METRICS_DB.tmp"
    mv "$METRICS_DB.tmp" "$METRICS_DB"

    # Update weekly stats
    update_weekly_stats
}

# Function to update weekly statistics
update_weekly_stats() {
    local current_week=$(date +%V)
    local week_start=$(date -d "monday this week" +%Y-%m-%d)
    local week_end=$(date -d "sunday this week" +%Y-%m-%d)

    # Count deployments this week
    local weekly_deployments
    weekly_deployments=$(grep -c "\"week\": \"$current_week\"" "$DEPLOYMENT_LOG" || echo "0")

    # Count successful deployments this week
    local weekly_successes
    weekly_successes=$(grep "\"week\": \"$current_week\"" "$DEPLOYMENT_LOG" | grep -c "\"status\": \"success\"" || echo "0")

    # Calculate failure rate
    local weekly_failure_rate=0
    if [[ $weekly_deployments -gt 0 ]]; then
        weekly_failure_rate=$(echo "scale=2; (($weekly_deployments - $weekly_successes) * 100) / $weekly_deployments" | bc)
    fi

    # Update metrics
    local weekly_stats
    weekly_stats=$(cat << EOF
{
    "week": "$current_week",
    "week_start": "$week_start",
    "week_end": "$week_end",
    "total_deployments": $weekly_deployments,
    "successful_deployments": $weekly_successes,
    "failure_rate": $weekly_failure_rate,
    "target_achieved": $([ $weekly_deployments -ge $TARGET_DEPLOYMENTS_PER_WEEK ] && echo "true" || echo "false"),
    "failure_rate_acceptable": $(echo "$weekly_failure_rate <= $MAX_FAILURE_RATE" | bc -l)
}
EOF
)

    # Update database with weekly stats
    # This is simplified - in production, use proper JSON manipulation
    sed -i.bak 's/"weekly_stats": {[^}]*}/"weekly_stats": '"$weekly_stats"'/' "$METRICS_DB"
}

# Function to get deployment statistics
get_deployment_stats() {
    local period=${1:-week}

    case $period in
        "week")
            local current_week=$(date +%V)
            local deployments=$(grep -c "\"week\": \"$current_week\"" "$DEPLOYMENT_LOG" || echo "0")
            local successes=$(grep "\"week\": \"$current_week\"" "$DEPLOYMENT_LOG" | grep -c "\"status\": \"success\"" || echo "0")
            ;;
        "month")
            local current_month=$(date +%Y-%m)
            local deployments=$(grep -c "\"month\": \"$current_month\"" "$DEPLOYMENT_LOG" || echo "0")
            local successes=$(grep "\"month\": \"$current_month\"" "$DEPLOYMENT_LOG" | grep -c "\"status\": \"success\"" || echo "0")
            ;;
        *)
            log_error "Invalid period: $period"
            return 1
            ;;
    esac

    local failures=$((deployments - successes))
    local failure_rate=0

    if [[ $deployments -gt 0 ]]; then
        failure_rate=$(echo "scale=2; ($failures * 100) / $deployments" | bc)
    fi

    echo "Period: $period"
    echo "Total Deployments: $deployments"
    echo "Successful: $successes"
    echo "Failed: $failures"
    echo "Failure Rate: ${failure_rate}%"
    echo "Target: $TARGET_DEPLOYMENTS_PER_WEEK/week"
    echo "Max Failure Rate: ${MAX_FAILURE_RATE}%"

    # Check targets
    if [[ $deployments -ge $TARGET_DEPLOYMENTS_PER_WEEK ]]; then
        log_success "✅ Deployment frequency target achieved ($deployments >= $TARGET_DEPLOYMENTS_PER_WEEK)"
    else
        log_warning "⚠️  Deployment frequency below target ($deployments < $TARGET_DEPLOYMENTS_PER_WEEK)"
    fi

    if (( $(echo "$failure_rate <= $MAX_FAILURE_RATE" | bc -l) )); then
        log_success "✅ Failure rate within acceptable limits (${failure_rate}% <= ${MAX_FAILURE_RATE}%)"
    else
        log_error "❌ Failure rate exceeds acceptable limits (${failure_rate}% > ${MAX_FAILURE_RATE}%)"
    fi
}

# Function to generate deployment report
generate_report() {
    local report_type=${1:-weekly}
    local output_file=${2:-}

    log_info "Generating $report_type deployment report..."

    local report_content
    report_content=$(cat << EOF
# Hasivu Platform - Deployment Report
Generated: $(date)

## $report_type Statistics
$(get_deployment_stats "$report_type")

## Recent Deployments
EOF
)

    # Add recent deployments (last 10)
    local recent_deployments
    recent_deployments=$(tail -10 "$DEPLOYMENT_LOG" | while read -r line; do
        # Extract key information from JSON (simplified)
        local id=$(echo "$line" | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
        local status=$(echo "$line" | grep -o '"status": "[^"]*"' | cut -d'"' -f4)
        local duration=$(echo "$line" | grep -o '"duration": [0-9]*' | cut -d' ' -f2)
        local timestamp=$(echo "$line" | grep -o '"timestamp": "[^"]*"' | cut -d'"' -f4)

        echo "- $timestamp | $id | $status | ${duration}s"
    done)

    report_content="$report_content$recent_deployments"

    # Add recommendations
    report_content="$report_content

## Recommendations
"

    local current_stats
    current_stats=$(get_deployment_stats "$report_type" 2>/dev/null)

    if echo "$current_stats" | grep -q "below target"; then
        report_content="$report_content- Increase deployment frequency to meet weekly target
"
    fi

    if echo "$current_stats" | grep -q "exceeds acceptable limits"; then
        report_content="$report_content- Review and fix deployment failures to reduce failure rate
"
    fi

    # Output report
    if [[ -n "$output_file" ]]; then
        echo "$report_content" > "$output_file"
        log_success "Report saved to $output_file"
    else
        echo "$report_content"
    fi
}

# Function to send metrics to monitoring system
send_metrics_to_monitoring() {
    local metrics_endpoint=${METRICS_ENDPOINT:-}

    if [[ -z "$metrics_endpoint" ]]; then
        log_info "Metrics endpoint not configured, skipping..."
        return 0
    fi

    # Collect current metrics
    local weekly_stats
    weekly_stats=$(get_deployment_stats "week")

    local deployments=$(echo "$weekly_stats" | grep "Total Deployments:" | cut -d' ' -f3)
    local failure_rate=$(echo "$weekly_stats" | grep "Failure Rate:" | cut -d' ' -f3 | sed 's/%//')

    # Send metrics
    curl -X POST "$metrics_endpoint" \
        -H 'Content-Type: application/json' \
        -d "{\"weekly_deployments\": $deployments, \"failure_rate\": $failure_rate, \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
        || log_warning "Failed to send metrics to monitoring system"
}

# Function to check deployment health
check_deployment_health() {
    log_info "Checking deployment pipeline health..."

    local issues=0

    # Check if metrics are being collected
    if [[ ! -f "$METRICS_DB" ]]; then
        log_error "Metrics database not found"
        ((issues++))
    fi

    # Check recent deployment activity
    local recent_deployments
    recent_deployments=$(find "$METRICS_DIR" -name "*.log" -mtime -7 | wc -l)

    if [[ $recent_deployments -eq 0 ]]; then
        log_warning "No deployments recorded in the last 7 days"
        ((issues++))
    fi

    # Check failure rate trends
    local current_failure_rate
    current_failure_rate=$(get_deployment_stats "week" 2>/dev/null | grep "Failure Rate:" | cut -d' ' -f3 | sed 's/%//' || echo "0")

    if (( $(echo "$current_failure_rate > $MAX_FAILURE_RATE" | bc -l) )); then
        log_error "Current failure rate (${current_failure_rate}%) exceeds threshold (${MAX_FAILURE_RATE}%)"
        ((issues++))
    fi

    if [[ $issues -gt 0 ]]; then
        log_warning "Found $issues deployment health issues"
        return 1
    else
        log_success "Deployment pipeline health check passed"
        return 0
    fi
}

# Function to cleanup old metrics
cleanup_old_metrics() {
    local retention_days=${1:-90}

    log_info "Cleaning up metrics older than $retention_days days..."

    # Remove old deployment records (keep last N entries)
    local total_lines
    total_lines=$(wc -l < "$DEPLOYMENT_LOG")

    if [[ $total_lines -gt 1000 ]]; then
        local lines_to_keep=500
        tail -n $lines_to_keep "$DEPLOYMENT_LOG" > "$DEPLOYMENT_LOG.tmp"
        mv "$DEPLOYMENT_LOG.tmp" "$DEPLOYMENT_LOG"
        log_info "Cleaned up old deployment records (kept last $lines_to_keep)"
    fi

    # Remove old backup files
    find "$METRICS_DIR" -name "*.bak" -mtime +$retention_days -delete 2>/dev/null || true
}

# Main function
main() {
    # Initialize metrics system
    init_metrics

    case "${1:-}" in
        "record")
            if [[ $# -lt 6 ]]; then
                log_error "Usage: $0 record <id> <env> <status> <duration> <commit> [triggered_by]"
                exit 1
            fi
            record_deployment "$2" "$3" "$4" "$5" "$6" "${7:-automated}"
            ;;
        "stats")
            get_deployment_stats "${2:-week}"
            ;;
        "report")
            generate_report "${2:-weekly}" "${3:-}"
            ;;
        "health")
            check_deployment_health
            ;;
        "cleanup")
            cleanup_old_metrics "${2:-90}"
            ;;
        "send-metrics")
            send_metrics_to_monitoring
            ;;
        *)
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  record <id> <env> <status> <duration> <commit> [triggered_by] - Record deployment"
            echo "  stats [week|month]                                         - Show deployment statistics"
            echo "  report [weekly|monthly] [output_file]                      - Generate deployment report"
            echo "  health                                                     - Check deployment health"
            echo "  cleanup [days]                                             - Cleanup old metrics"
            echo "  send-metrics                                               - Send metrics to monitoring"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"