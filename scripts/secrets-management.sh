#!/bin/bash

# Comprehensive Secrets Management and Environment Protection Script
# Handles production secrets validation, rotation, and security hardening

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${ENVIRONMENT:-production}

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

# Function to validate required secrets
validate_secrets() {
    local env_file=$1
    local missing_secrets=()
    local weak_secrets=()

    log_info "Validating secrets in $env_file..."

    # Required secrets for production
    local required_secrets=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "SLACK_WEBHOOK_URL"
        "DOCKER_USERNAME"
        "DOCKER_PASSWORD"
        "GRAFANA_ADMIN_PASSWORD"
    )

    # Frontend required secrets
    local frontend_secrets=(
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    )

    # Check if file exists
    if [[ ! -f "$env_file" ]]; then
        log_error "Environment file not found: $env_file"
        return 1
    fi

    # Load environment variables
    set -a
    source "$env_file"
    set +a

    # Validate required secrets
    for secret in "${required_secrets[@]}"; do
        if [[ -z "${!secret:-}" ]]; then
            missing_secrets+=("$secret")
        fi
    done

    # Validate frontend secrets
    for secret in "${frontend_secrets[@]}"; do
        if [[ -z "${!secret:-}" ]]; then
            missing_secrets+=("$secret")
        fi
    done

    # Check for weak secrets
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        weak_secrets+=("JWT_SECRET (should be at least 32 characters)")
    fi

    if [[ ${#ENCRYPTION_KEY} -lt 32 ]]; then
        weak_secrets+=("ENCRYPTION_KEY (should be at least 32 characters)")
    fi

    # Report issues
    if [[ ${#missing_secrets[@]} -gt 0 ]]; then
        log_error "Missing required secrets:"
        printf '  - %s\n' "${missing_secrets[@]}"
        return 1
    fi

    if [[ ${#weak_secrets[@]} -gt 0 ]]; then
        log_warning "Weak secrets detected:"
        printf '  - %s\n' "${weak_secrets[@]}"
        return 1
    fi

    log_success "All secrets validation passed"
    return 0
}

# Function to rotate secrets
rotate_secrets() {
    local env_file=$1
    local backup_file="${env_file}.backup.$(date +%Y%m%d_%H%M%S)"

    log_info "Rotating secrets..."

    # Create backup
    cp "$env_file" "$backup_file"
    log_info "Backup created: $backup_file"

    # Generate new secrets
    local new_jwt_secret=$(openssl rand -hex 32)
    local new_encryption_key=$(openssl rand -hex 32)

    # Update secrets in file
    sed -i.bak \
        -e "s|^JWT_SECRET=.*|JWT_SECRET=$new_jwt_secret|" \
        -e "s|^ENCRYPTION_KEY=.*|ENCRYPTION_KEY=$new_encryption_key|" \
        "$env_file"

    log_success "Secrets rotated successfully"
    log_info "New JWT_SECRET generated"
    log_info "New ENCRYPTION_KEY generated"

    # Validate new secrets
    if validate_secrets "$env_file"; then
        log_success "New secrets validation passed"
        return 0
    else
        log_error "New secrets validation failed, restoring backup..."
        cp "$backup_file" "$env_file"
        return 1
    fi
}

# Function to check environment security
check_environment_security() {
    log_info "Checking environment security..."

    local issues_found=0

    # Check file permissions
    local env_files=(
        ".env"
        ".env.production"
        ".env.staging"
        "deployment/.env.production"
    )

    for env_file in "${env_files[@]}"; do
        if [[ -f "$env_file" ]]; then
            local permissions=$(stat -c "%a" "$env_file" 2>/dev/null || stat -f "%A" "$env_file" 2>/dev/null)
            if [[ "$permissions" != "600" ]]; then
                log_warning "Insecure permissions on $env_file: $permissions (should be 600)"
                ((issues_found++))
            fi
        fi
    done

    # Check for hardcoded secrets in code
    log_info "Scanning for hardcoded secrets in code..."
    local hardcoded_patterns=(
        "password.*="
        "secret.*="
        "key.*="
        "token.*="
    )

    local files_with_hardcoded=()
    for pattern in "${hardcoded_patterns[@]}"; do
        while IFS= read -r -d '' file; do
            if grep -q "$pattern" "$file" && [[ "$file" != *.env* ]] && [[ "$file" != *.log* ]]; then
                files_with_hardcoded+=("$file")
            fi
        done < <(find . -name "*.ts" -o -name "*.js" -o -name "*.json" -type f -print0 2>/dev/null)
    done

    if [[ ${#files_with_hardcoded[@]} -gt 0 ]]; then
        log_warning "Potential hardcoded secrets found in:"
        printf '  - %s\n' "${files_with_hardcoded[@]}"
        ((issues_found++))
    fi

    # Check Docker security
    if command -v docker &> /dev/null; then
        log_info "Checking Docker security..."

        # Check for running containers as root
        local root_containers=$(docker ps --format "table {{.Names}}\t{{.Image}}" | grep -v "NAMES" | while read name image; do
            if docker inspect "$name" | grep -q '"User":\s*""'; then
                echo "$name ($image)"
            fi
        done)

        if [[ -n "$root_containers" ]]; then
            log_warning "Containers running as root:"
            echo "$root_containers"
            ((issues_found++))
        fi
    fi

    if [[ $issues_found -gt 0 ]]; then
        log_warning "Found $issues_found security issues"
        return 1
    else
        log_success "Environment security check passed"
        return 0
    fi
}

# Function to setup secrets for deployment
setup_deployment_secrets() {
    local env_file=$1
    local deployment_dir="deployment/${ENVIRONMENT}"

    log_info "Setting up deployment secrets..."

    # Create deployment directory
    mkdir -p "$deployment_dir"

    # Copy and sanitize environment file
    local deployment_env="$deployment_dir/.env"

    if [[ -f "$env_file" ]]; then
        # Remove comments and empty lines, keep only key=value pairs
        grep -E '^[A-Z_][A-Z0-9_]*=' "$env_file" > "$deployment_env"
        log_info "Deployment secrets prepared at $deployment_env"
    else
        log_error "Source environment file not found: $env_file"
        return 1
    fi

    # Set secure permissions
    chmod 600 "$deployment_env"

    # Create secrets for docker-compose
    local docker_secrets="$deployment_dir/.docker-secrets"
    cat > "$docker_secrets" << EOF
# Docker Compose Secrets
# This file is used by docker-compose for secret management

DATABASE_URL=${DATABASE_URL:-}
REDIS_URL=${REDIS_URL:-}
JWT_SECRET=${JWT_SECRET:-}
ENCRYPTION_KEY=${ENCRYPTION_KEY:-}
EOF

    chmod 600 "$docker_secrets"
    log_success "Deployment secrets setup completed"
}

# Function to audit secret usage
audit_secret_usage() {
    log_info "Auditing secret usage..."

    local secrets_used=()
    local secrets_unused=()

    # Define expected secrets
    local expected_secrets=(
        "DATABASE_URL"
        "REDIS_URL"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "SLACK_WEBHOOK_URL"
        "DOCKER_USERNAME"
        "DOCKER_PASSWORD"
        "GRAFANA_ADMIN_PASSWORD"
        "NEXT_PUBLIC_API_URL"
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    )

    # Check which secrets are referenced in code
    for secret in "${expected_secrets[@]}"; do
        if grep -r "$secret" --include="*.ts" --include="*.js" --include="*.json" src/ web/ > /dev/null 2>&1; then
            secrets_used+=("$secret")
        else
            secrets_unused+=("$secret")
        fi
    done

    log_info "Secrets in use: ${#secrets_used[@]}"
    log_info "Secrets not found in code: ${#secrets_unused[@]}"

    if [[ ${#secrets_unused[@]} -gt 0 ]]; then
        log_warning "Potentially unused secrets:"
        printf '  - %s\n' "${secrets_unused[@]}"
    fi

    log_success "Secret usage audit completed"
}

# Function to generate secure random secrets
generate_secure_secrets() {
    local output_file=$1

    log_info "Generating secure random secrets..."

    cat > "$output_file" << EOF
# Generated Secure Secrets - $(date)
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hasivu_prod

# Redis
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 32)

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=ap-south-1

# Docker Registry
DOCKER_USERNAME=your-docker-username
DOCKER_PASSWORD=your-docker-password

# Monitoring
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 12)

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Frontend
NEXT_PUBLIC_API_URL=https://api.hasivu.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Payment Gateway
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
PAYMENT_GATEWAY_API_KEY=your-payment-gateway-key
EOF

    chmod 600 "$output_file"
    log_success "Secure secrets template generated: $output_file"
    log_warning "Remember to update placeholder values with actual secrets!"
}

# Main function
main() {
    case "${1:-}" in
        "validate")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 validate <env-file>"
                exit 1
            fi
            validate_secrets "$2"
            ;;
        "rotate")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 rotate <env-file>"
                exit 1
            fi
            rotate_secrets "$2"
            ;;
        "security-check")
            check_environment_security
            ;;
        "setup-deployment")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 setup-deployment <env-file>"
                exit 1
            fi
            setup_deployment_secrets "$2"
            ;;
        "audit")
            audit_secret_usage
            ;;
        "generate")
            if [[ $# -lt 2 ]]; then
                log_error "Usage: $0 generate <output-file>"
                exit 1
            fi
            generate_secure_secrets "$2"
            ;;
        "all")
            log_info "Running all secrets management checks..."

            local env_file=".env.${ENVIRONMENT}"
            if [[ ! -f "$env_file" ]]; then
                env_file=".env"
            fi

            if [[ -f "$env_file" ]]; then
                validate_secrets "$env_file" && \
                check_environment_security && \
                audit_secret_usage && \
                setup_deployment_secrets "$env_file"
            else
                log_error "No environment file found. Run '$0 generate .env.${ENVIRONMENT}' first"
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 <command> [args]"
            echo ""
            echo "Commands:"
            echo "  validate <env-file>        - Validate secrets in environment file"
            echo "  rotate <env-file>          - Rotate JWT and encryption secrets"
            echo "  security-check             - Check environment security"
            echo "  setup-deployment <env-file> - Setup secrets for deployment"
            echo "  audit                      - Audit secret usage in codebase"
            echo "  generate <output-file>     - Generate secure secrets template"
            echo "  all                        - Run all checks and setup"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"