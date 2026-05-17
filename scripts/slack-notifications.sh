#!/bin/bash

# Enhanced Slack Notifications for CI/CD Pipeline
# Provides detailed deployment status, metrics, and alerts

set -euo pipefail

# Configuration
WEBHOOK_URL=${SLACK_WEBHOOK_URL:-}
ENVIRONMENT=${ENVIRONMENT:-production}
DEPLOYMENT_ID=${DEPLOYMENT_ID:-unknown}

# Colors for Slack messages (using Slack's color coding)
COLOR_SUCCESS="good"
COLOR_WARNING="warning"
COLOR_ERROR="danger"
COLOR_INFO="#439FE0"

# Function to send Slack notification
send_slack_notification() {
    local title=$1
    local message=$2
    local color=$3
    local fields=${4:-}
    local actions=${5:-}

    if [[ -z "$WEBHOOK_URL" ]]; then
        echo "SLACK_WEBHOOK_URL not set, skipping notification"
        return 0
    fi

    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": $fields,
            "actions": $actions,
            "footer": "Hasivu Platform",
            "ts": $(date +%s)
        }
    ]
}
EOF
)

    curl -X POST -H 'Content-Type: application/json' -d "$payload" "$WEBHOOK_URL" || true
}

# Function to send deployment start notification
notify_deployment_start() {
    local commit_sha=$1
    local branch=$2
    local triggered_by=${3:-"Automated"}

    local title="🚀 Deployment Started"
    local message="Starting deployment to $ENVIRONMENT environment"
    local fields

    fields=$(cat <<EOF
[
    {
        "title": "Environment",
        "value": "$ENVIRONMENT",
        "short": true
    },
    {
        "title": "Branch",
        "value": "$branch",
        "short": true
    },
    {
        "title": "Commit",
        "value": "$commit_sha",
        "short": true
    },
    {
        "title": "Triggered By",
        "value": "$triggered_by",
        "short": true
    },
    {
        "title": "Deployment ID",
        "value": "$DEPLOYMENT_ID",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$COLOR_INFO" "$fields"
}

# Function to send build status notification
notify_build_status() {
    local status=$1
    local build_time=$2
    local image_tag=$3

    local title
    local message
    local color

    case $status in
        "success")
            title="✅ Build Successful"
            message="Docker images built and pushed successfully"
            color="$COLOR_SUCCESS"
            ;;
        "failure")
            title="❌ Build Failed"
            message="Docker image build failed"
            color="$COLOR_ERROR"
            ;;
        *)
            title="⚠️ Build Status Unknown"
            message="Build completed with unknown status"
            color="$COLOR_WARNING"
            ;;
    esac

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Build Time",
        "value": "${build_time}s",
        "short": true
    },
    {
        "title": "Image Tag",
        "value": "$image_tag",
        "short": true
    },
    {
        "title": "Environment",
        "value": "$ENVIRONMENT",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields"
}

# Function to send deployment status notification
notify_deployment_status() {
    local status=$1
    local deployment_time=$2
    local active_environment=$3
    local commit_sha=$4

    local title
    local message
    local color
    local actions="[]"

    case $status in
        "success")
            title="🎉 Deployment Successful"
            message="Application deployed successfully with zero-downtime"
            color="$COLOR_SUCCESS"
            actions=$(cat <<EOF
[
    {
        "type": "button",
        "text": "View Application",
        "url": "https://hasivu.com"
    },
    {
        "type": "button",
        "text": "View Monitoring",
        "url": "http://monitoring.hasivu.com"
    }
]
EOF
)
            ;;
        "failure")
            title="💥 Deployment Failed"
            message="Deployment failed, rollback initiated"
            color="$COLOR_ERROR"
            ;;
        "rollback")
            title="🔄 Rollback Completed"
            message="Application rolled back to previous version"
            color="$COLOR_WARNING"
            ;;
        *)
            title="⚠️ Deployment Status Unknown"
            message="Deployment completed with unknown status"
            color="$COLOR_WARNING"
            ;;
    esac

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Environment",
        "value": "$ENVIRONMENT",
        "short": true
    },
    {
        "title": "Active Environment",
        "value": "$active_environment",
        "short": true
    },
    {
        "title": "Deployment Time",
        "value": "${deployment_time}s",
        "short": true
    },
    {
        "title": "Commit",
        "value": "$commit_sha",
        "short": true
    },
    {
        "title": "Deployment ID",
        "value": "$DEPLOYMENT_ID",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields" "$actions"
}

# Function to send test results notification
notify_test_results() {
    local unit_tests=$1
    local integration_tests=$2
    local e2e_tests=$3
    local coverage=$4

    local title="🧪 Test Results"
    local message="Test execution completed"
    local color

    # Determine color based on test results
    if [[ "$unit_tests" == "passed" && "$integration_tests" == "passed" && "$e2e_tests" == "passed" ]]; then
        color="$COLOR_SUCCESS"
    elif [[ "$unit_tests" == "failed" || "$integration_tests" == "failed" || "$e2e_tests" == "failed" ]]; then
        color="$COLOR_ERROR"
    else
        color="$COLOR_WARNING"
    fi

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Unit Tests",
        "value": "$unit_tests",
        "short": true
    },
    {
        "title": "Integration Tests",
        "value": "$integration_tests",
        "short": true
    },
    {
        "title": "E2E Tests",
        "value": "$e2e_tests",
        "short": true
    },
    {
        "title": "Code Coverage",
        "value": "$coverage%",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields"
}

# Function to send security scan results
notify_security_scan() {
    local vulnerabilities=$1
    local severity=$2

    local title="🔒 Security Scan Results"
    local message="Security scan completed"
    local color

    if [[ "$severity" == "high" ]] || [[ $vulnerabilities -gt 10 ]]; then
        color="$COLOR_ERROR"
        message="Critical security issues found!"
    elif [[ "$severity" == "medium" ]] || [[ $vulnerabilities -gt 5 ]]; then
        color="$COLOR_WARNING"
        message="Security vulnerabilities detected"
    else
        color="$COLOR_SUCCESS"
        message="Security scan passed"
    fi

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Vulnerabilities Found",
        "value": "$vulnerabilities",
        "short": true
    },
    {
        "title": "Highest Severity",
        "value": "$severity",
        "short": true
    },
    {
        "title": "Environment",
        "value": "$ENVIRONMENT",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields"
}

# Function to send performance metrics
notify_performance_metrics() {
    local build_time=$1
    local test_time=$2
    local deployment_time=$3
    local failure_rate=$4

    local title="📊 Performance Metrics"
    local message="Pipeline performance summary"
    local color="$COLOR_INFO"

    # Determine color based on performance
    if [[ $(echo "$failure_rate > 5" | bc -l) -eq 1 ]]; then
        color="$COLOR_WARNING"
        message="Performance degradation detected"
    fi

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Build Time",
        "value": "${build_time}s",
        "short": true
    },
    {
        "title": "Test Time",
        "value": "${test_time}s",
        "short": true
    },
    {
        "title": "Deployment Time",
        "value": "${deployment_time}s",
        "short": true
    },
    {
        "title": "Failure Rate",
        "value": "${failure_rate}%",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields"
}

# Function to send alert for deployment frequency
notify_deployment_frequency() {
    local weekly_deployments=$1
    local target_frequency=10

    local title="📈 Deployment Frequency Report"
    local message="Weekly deployment summary"
    local color

    if [[ $weekly_deployments -ge $target_frequency ]]; then
        color="$COLOR_SUCCESS"
        message="🎯 Target deployment frequency achieved!"
    elif [[ $weekly_deployments -ge 5 ]]; then
        color="$COLOR_WARNING"
        message="Deployment frequency is moderate"
    else
        color="$COLOR_ERROR"
        message="Low deployment frequency detected"
    fi

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Weekly Deployments",
        "value": "$weekly_deployments",
        "short": true
    },
    {
        "title": "Target Frequency",
        "value": "$target_frequency/week",
        "short": true
    },
    {
        "title": "Environment",
        "value": "$ENVIRONMENT",
        "short": true
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields"
}

# Function to send pipeline failure alert
notify_pipeline_failure() {
    local stage=$1
    local error_message=$2
    local commit_sha=$3

    local title="🚨 Pipeline Failure Alert"
    local message="Pipeline failed at $stage stage"
    local color="$COLOR_ERROR"

    local fields
    fields=$(cat <<EOF
[
    {
        "title": "Failed Stage",
        "value": "$stage",
        "short": true
    },
    {
        "title": "Environment",
        "value": "$ENVIRONMENT",
        "short": true
    },
    {
        "title": "Commit",
        "value": "$commit_sha",
        "short": true
    },
    {
        "title": "Error",
        "value": "$error_message",
        "short": false
    }
]
EOF
)

    local actions
    actions=$(cat <<EOF
[
    {
        "type": "button",
        "text": "View Pipeline",
        "url": "https://github.com/your-org/hasivu-platform/actions"
    },
    {
        "type": "button",
        "text": "View Commit",
        "url": "https://github.com/your-org/hasivu-platform/commit/$commit_sha"
    }
]
EOF
)

    send_slack_notification "$title" "$message" "$color" "$fields" "$actions"
}

# Main function
main() {
    case "${1:-}" in
        "deployment-start")
            shift
            notify_deployment_start "$@"
            ;;
        "build-status")
            shift
            notify_build_status "$@"
            ;;
        "deployment-status")
            shift
            notify_deployment_status "$@"
            ;;
        "test-results")
            shift
            notify_test_results "$@"
            ;;
        "security-scan")
            shift
            notify_security_scan "$@"
            ;;
        "performance-metrics")
            shift
            notify_performance_metrics "$@"
            ;;
        "deployment-frequency")
            shift
            notify_deployment_frequency "$@"
            ;;
        "pipeline-failure")
            shift
            notify_pipeline_failure "$@"
            ;;
        *)
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  deployment-start <commit> <branch> [triggered_by]"
            echo "  build-status <status> <build_time> <image_tag>"
            echo "  deployment-status <status> <deployment_time> <active_env> <commit>"
            echo "  test-results <unit> <integration> <e2e> <coverage>"
            echo "  security-scan <vulnerabilities> <severity>"
            echo "  performance-metrics <build_time> <test_time> <deploy_time> <failure_rate>"
            echo "  deployment-frequency <weekly_deployments>"
            echo "  pipeline-failure <stage> <error_message> <commit_sha>"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"