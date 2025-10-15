#!/bin/bash

# Performance Validation and Metrics Collection Script
# Validates pipeline performance to ensure <15 min builds and optimal efficiency

set -euo pipefail

# Configuration
BUILD_TIME_TARGET=900  # 15 minutes in seconds
PERFORMANCE_LOG="performance.log"
METRICS_DIR="metrics"
BUILD_TIME_THRESHOLD_WARNING=720  # 12 minutes
BUILD_TIME_THRESHOLD_CRITICAL=840  # 14 minutes

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

# Function to start performance monitoring
start_performance_monitoring() {
    local build_id=${1:-$(date +%s)}
    local start_time=$(date +%s)

    log_info "Starting performance monitoring for build: $build_id"

    # Create metrics directory
    mkdir -p "$METRICS_DIR"

    # Record start metrics
    cat > "$METRICS_DIR/build_$build_id.start.json" << EOF
{
    "build_id": "$build_id",
    "start_time": $start_time,
    "start_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "system_info": {
        "cpu_count": $(nproc 2>/dev/null || echo "4"),
        "memory_total": "$(free -h 2>/dev/null | grep '^Mem:' | awk '{print $2}' || echo "unknown")",
        "disk_free": "$(df -h . 2>/dev/null | tail -1 | awk '{print $4}' || echo "unknown")"
    },
    "environment": {
        "ci": "${CI:-false}",
        "runner_os": "${RUNNER_OS:-unknown}",
        "node_version": "${NODE_VERSION:-unknown}"
    }
}
EOF

    echo "$build_id"
}

# Function to record stage timing
record_stage_timing() {
    local build_id=$1
    local stage_name=$2
    local stage_start=$3
    local stage_end=${4:-$(date +%s)}

    local duration=$((stage_end - stage_start))

    log_info "Stage '$stage_name' completed in ${duration}s"

    # Append to performance log
    echo "$(date -u +%Y-%m-%dT%H:%M:%SZ),$build_id,$stage_name,$duration" >> "$PERFORMANCE_LOG"

    # Update build metrics
    local metrics_file="$METRICS_DIR/build_$build_id.metrics.json"

    if [[ ! -f "$metrics_file" ]]; then
        echo '{"stages": []}' > "$metrics_file"
    fi

    # Add stage timing (simplified JSON manipulation)
    local stage_record
    stage_record=$(cat << EOF
{
    "name": "$stage_name",
    "duration": $duration,
    "start_time": $stage_start,
    "end_time": $stage_end
}
EOF
)

    # Update metrics file
    local current_content
    current_content=$(cat "$metrics_file")
    local updated_content
    updated_content=$(echo "$current_content" | sed 's/"stages": \[/&'"$stage_record"', /')

    echo "$updated_content" > "$metrics_file.tmp"
    mv "$metrics_file.tmp" "$metrics_file"
}

# Function to end performance monitoring
end_performance_monitoring() {
    local build_id=$1
    local build_status=$2
    local end_time=$(date +%s)

    log_info "Ending performance monitoring for build: $build_id"

    local start_file="$METRICS_DIR/build_$build_id.start.json"
    local metrics_file="$METRICS_DIR/build_$build_id.metrics.json"

    if [[ ! -f "$start_file" ]]; then
        log_error "Start metrics file not found for build: $build_id"
        return 1
    fi

    local start_time
    start_time=$(jq -r '.start_time' "$start_file" 2>/dev/null || echo "$end_time")

    local total_duration=$((end_time - start_time))

    # Create final metrics report
    local final_report
    final_report=$(cat << EOF
{
    "build_id": "$build_id",
    "status": "$build_status",
    "total_duration": $total_duration,
    "target_duration": $BUILD_TIME_TARGET,
    "target_met": $([ $total_duration -le $BUILD_TIME_TARGET ] && echo "true" || echo "false"),
    "start_time": $start_time,
    "end_time": $end_time,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

    echo "$final_report" > "$METRICS_DIR/build_$build_id.final.json"

    # Validate performance targets
    validate_performance_targets "$build_id" "$total_duration" "$build_status"

    log_success "Performance monitoring completed for build: $build_id (${total_duration}s total)"
}

# Function to validate performance targets
validate_performance_targets() {
    local build_id=$1
    local total_duration=$2
    local build_status=$3

    log_info "Validating performance targets for build: $build_id"

    local target_met=false
    local warnings=()
    local critical_issues=()

    # Check build time target
    if [[ $total_duration -le $BUILD_TIME_TARGET ]]; then
        target_met=true
        log_success "✅ Build time target met: ${total_duration}s ≤ ${BUILD_TIME_TARGET}s"
    else
        log_error "❌ Build time target missed: ${total_duration}s > ${BUILD_TIME_TARGET}s"
        critical_issues+=("Build time exceeded target by $((total_duration - BUILD_TIME_TARGET))s")
    fi

    # Check for performance warnings
    if [[ $total_duration -gt $BUILD_TIME_THRESHOLD_WARNING ]]; then
        warnings+=("Build time approaching critical threshold")
    fi

    if [[ $total_duration -gt $BUILD_TIME_THRESHOLD_CRITICAL ]]; then
        critical_issues+=("Build time in critical range")
    fi

    # Check build status
    if [[ "$build_status" != "success" ]]; then
        critical_issues+=("Build failed with status: $build_status")
    fi

    # Analyze stage performance
    analyze_stage_performance "$build_id"

    # Report issues
    if [[ ${#critical_issues[@]} -gt 0 ]]; then
        log_error "Critical performance issues found:"
        printf '  - %s\n' "${critical_issues[@]}"
    fi

    if [[ ${#warnings[@]} -gt 0 ]]; then
        log_warning "Performance warnings:"
        printf '  - %s\n' "${warnings[@]}"
    fi

    # Send notifications if configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        send_performance_notification "$build_id" "$total_duration" "$target_met" "${#critical_issues[@]}"
    fi
}

# Function to analyze stage performance
analyze_stage_performance() {
    local build_id=$1
    local metrics_file="$METRICS_DIR/build_$build_id.metrics.json"

    if [[ ! -f "$metrics_file" ]]; then
        log_warning "Metrics file not found for stage analysis: $metrics_file"
        return
    fi

    log_info "Analyzing stage performance..."

    # Define expected stage time limits (in seconds)
    declare -A stage_limits=(
        ["setup-backend"]="120"
        ["setup-frontend"]="120"
        ["code-quality-backend"]="180"
        ["code-quality-frontend"]="180"
        ["security-scan"]="300"
        ["unit-tests-backend"]="300"
        ["unit-tests-frontend"]="300"
        ["integration-tests"]="400"
        ["build-backend"]="180"
        ["build-frontend"]="180"
        ["docker-build"]="300"
        ["e2e-tests"]="400"
        ["deploy-staging"]="300"
        ["deploy-production"]="400"
    )

    # Analyze each stage (simplified - would use jq in production)
    local slow_stages=()

    while IFS= read -r line; do
        if [[ $line == *"\"name\":"* ]]; then
            local stage_name=$(echo "$line" | sed 's/.*"name": "\([^"]*\)".*/\1/')
            local duration_line=$(echo "$line" | sed -n 's/.*"duration": \([0-9]*\).*/\1/p')

            if [[ -n "$stage_name" && -n "$duration_line" ]]; then
                local expected_limit=${stage_limits[$stage_name]:-300}

                if [[ $duration_line -gt $expected_limit ]]; then
                    slow_stages+=("$stage_name: ${duration_line}s (limit: ${expected_limit}s)")
                    log_warning "Slow stage detected: $stage_name (${duration_line}s > ${expected_limit}s)"
                fi
            fi
        fi
    done < "$metrics_file"

    if [[ ${#slow_stages[@]} -gt 0 ]]; then
        log_warning "Performance optimization opportunities:"
        printf '  - %s\n' "${slow_stages[@]}"
    fi
}

# Function to send performance notification
send_performance_notification() {
    local build_id=$1
    local duration=$2
    local target_met=$3
    local critical_issues=$4

    local title
    local message
    local color

    if [[ "$target_met" == "true" && $critical_issues -eq 0 ]]; then
        title="✅ Build Performance Excellent"
        message="Build completed within target time with no issues"
        color="good"
    elif [[ "$target_met" == "true" ]]; then
        title="⚠️ Build Performance Acceptable"
        message="Build completed within target time but with some issues"
        color="warning"
    else
        title="❌ Build Performance Issues"
        message="Build exceeded target time or has critical issues"
        color="danger"
    fi

    local fields
    fields=$(cat << EOF
[
    {
        "title": "Build ID",
        "value": "$build_id",
        "short": true
    },
    {
        "title": "Duration",
        "value": "${duration}s",
        "short": true
    },
    {
        "title": "Target",
        "value": "${BUILD_TIME_TARGET}s",
        "short": true
    },
    {
        "title": "Target Met",
        "value": "$target_met",
        "short": true
    }
]
EOF
)

    # Send Slack notification
    curl -X POST "${SLACK_WEBHOOK_URL}" \
        -H 'Content-Type: application/json' \
        -d "{\"attachments\": [{\"color\": \"$color\", \"title\": \"$title\", \"text\": \"$message\", \"fields\": $fields}]}" \
        || log_warning "Failed to send performance notification"
}

# Function to generate performance report
generate_performance_report() {
    local period=${1:-week}
    local output_file=${2:-}

    log_info "Generating performance report for period: $period"

    local report_content
    report_content=$(cat << EOF
# Hasivu Platform - Performance Report
Generated: $(date)
Period: $period

## Build Performance Summary
EOF
)

    # Analyze recent builds
    local recent_builds
    recent_builds=$(find "$METRICS_DIR" -name "build_*.final.json" -mtime -7 | wc -l)

    local successful_builds
    successful_builds=$(find "$METRICS_DIR" -name "build_*.final.json" -mtime -7 -exec grep -l '"status": "success"' {} \; | wc -l)

    local avg_build_time
    avg_build_time=$(find "$METRICS_DIR" -name "build_*.final.json" -mtime -7 -exec jq -r '.total_duration' {} \; 2>/dev/null | awk '{sum+=$1; count++} END {if(count>0) print int(sum/count); else print "0"}')

    local target_met_count
    target_met_count=$(find "$METRICS_DIR" -name "build_*.final.json" -mtime -7 -exec jq -r '.target_met' {} \; 2>/dev/null | grep -c "true")

    report_content="$report_content
- Total Builds: $recent_builds
- Successful Builds: $successful_builds
- Average Build Time: ${avg_build_time}s
- Target Met: $target_met_count/$recent_builds
- Target Build Time: ${BUILD_TIME_TARGET}s

## Performance Analysis
"

    # Performance analysis
    if [[ $recent_builds -gt 0 ]]; then
        local success_rate=$((successful_builds * 100 / recent_builds))
        local target_rate=$((target_met_count * 100 / recent_builds))

        report_content="$report_content
- Success Rate: ${success_rate}%
- Target Achievement Rate: ${target_rate}%

## Recommendations
"

        if [[ $avg_build_time -gt $BUILD_TIME_TARGET ]]; then
            report_content="$report_content
- Optimize build times (current avg: ${avg_build_time}s > target: ${BUILD_TIME_TARGET}s)
"
        fi

        if [[ $success_rate -lt 95 ]]; then
            report_content="$report_content
- Improve build reliability (current: ${success_rate}% < target: 95%)
"
        fi

        if [[ $target_rate -lt 80 ]]; then
            report_content="$report_content
- Address performance bottlenecks to meet build time targets
"
        fi
    fi

    # Output report
    if [[ -n "$output_file" ]]; then
        echo "$report_content" > "$output_file"
        log_success "Performance report saved to $output_file"
    else
        echo "$report_content"
    fi
}

# Function to benchmark build performance
benchmark_build_performance() {
    local iterations=${1:-3}

    log_info "Running build performance benchmark ($iterations iterations)..."

    local results=()

    for i in $(seq 1 "$iterations"); do
        log_info "Benchmark iteration $i/$iterations"

        local build_start=$(date +%s)

        # Run a basic build test (adjust based on your build process)
        if npm run build > /dev/null 2>&1; then
            local build_end=$(date +%s)
            local duration=$((build_end - build_start))
            results+=("$duration")
            log_success "Iteration $i completed in ${duration}s"
        else
            log_error "Iteration $i failed"
            results+=("failed")
        fi

        # Cleanup between iterations
        rm -rf dist/ .next/ 2>/dev/null || true
        sleep 2
    done

    # Calculate statistics
    local successful_runs=()
    for result in "${results[@]}"; do
        if [[ "$result" != "failed" ]]; then
            successful_runs+=("$result")
        fi
    done

    if [[ ${#successful_runs[@]} -gt 0 ]]; then
        local min_time=$(printf '%s\n' "${successful_runs[@]}" | sort -n | head -1)
        local max_time=$(printf '%s\n' "${successful_runs[@]}" | sort -n | tail -1)
        local avg_time=$(printf '%s\n' "${successful_runs[@]}" | awk '{sum+=$1} END {print int(sum/NR)}')

        log_info "Benchmark Results:"
        log_info "  Iterations: $iterations"
        log_info "  Successful: ${#successful_runs[@]}/$iterations"
        log_info "  Min Time: ${min_time}s"
        log_info "  Max Time: ${max_time}s"
        log_info "  Avg Time: ${avg_time}s"
        log_info "  Target: ${BUILD_TIME_TARGET}s"

        if [[ $avg_time -le $BUILD_TIME_TARGET ]]; then
            log_success "✅ Benchmark passed: average time within target"
        else
            log_warning "⚠️  Benchmark failed: average time exceeds target by $((avg_time - BUILD_TIME_TARGET))s"
        fi
    else
        log_error "❌ All benchmark iterations failed"
    fi
}

# Main function
main() {
    case "${1:-}" in
        "start")
            local build_id
            build_id=$(start_performance_monitoring "${2:-}")
            echo "$build_id"
            ;;
        "stage")
            if [[ $# -lt 4 ]]; then
                log_error "Usage: $0 stage <build_id> <stage_name> <start_time> [end_time]"
                exit 1
            fi
            record_stage_timing "$2" "$3" "$4" "${5:-}"
            ;;
        "end")
            if [[ $# -lt 3 ]]; then
                log_error "Usage: $0 end <build_id> <status>"
                exit 1
            fi
            end_performance_monitoring "$2" "$3"
            ;;
        "report")
            generate_performance_report "${2:-week}" "${3:-}"
            ;;
        "benchmark")
            benchmark_build_performance "${2:-3}"
            ;;
        *)
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  start [build_id]                    - Start performance monitoring"
            echo "  stage <build_id> <name> <start>      - Record stage timing"
            echo "  end <build_id> <status>              - End performance monitoring"
            echo "  report [period] [output_file]        - Generate performance report"
            echo "  benchmark [iterations]               - Run build performance benchmark"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"