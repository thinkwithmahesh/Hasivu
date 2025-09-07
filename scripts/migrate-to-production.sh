#!/bin/bash

# HASIVU Platform - Production Database Migration Script
# This script migrates from SQLite (dev) to PostgreSQL (production)

set -e  # Exit on any error
set -u  # Exit on undefined variables

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required tools are installed
    local tools=("node" "npm" "psql" "aws")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool is required but not installed"
            exit 1
        fi
    done
    
    # Check if we're in the right directory
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    # Check if Prisma is available
    if ! npx prisma --version &> /dev/null; then
        log_error "Prisma CLI not available"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log_info "Loading environment configuration for: $ENVIRONMENT"
    
    local env_file="$PROJECT_ROOT/.env.$ENVIRONMENT"
    if [[ -f "$env_file" ]]; then
        # Load environment file, but don't export variables yet
        log_info "Found environment file: $env_file"
    else
        log_error "Environment file not found: $env_file"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    log_success "Environment configuration loaded"
}

# Backup existing database (if any)
backup_database() {
    log_info "Creating database backup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create database backup"
        return
    fi
    
    # Get database URL from AWS Parameter Store
    local db_url
    db_url=$(aws ssm get-parameter \
        --name "/hasivu-platform/$ENVIRONMENT/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$db_url" ]]; then
        local backup_file="$PROJECT_ROOT/backups/database-backup-$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p "$(dirname "$backup_file")"
        
        log_info "Creating backup: $backup_file"
        
        # Extract database connection info
        local db_name db_host db_port db_user
        db_name=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\).*/\1/p')
        db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        db_user=$(echo "$db_url" | sed -n 's/.*\/\/\([^:]*\).*/\1/p')
        
        # Create backup using pg_dump
        PGPASSWORD=$(echo "$db_url" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p') \
        pg_dump -h "$db_host" -p "$db_port" -U "$db_user" -d "$db_name" \
            --no-owner --no-privileges --create --clean > "$backup_file"
        
        log_success "Database backup created: $backup_file"
    else
        log_info "No existing database found, skipping backup"
    fi
}

# Update Prisma schema for production
update_prisma_schema() {
    log_info "Updating Prisma schema for production..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update Prisma schema"
        return
    fi
    
    # Copy production schema
    cp "$PROJECT_ROOT/prisma/schema-production.prisma" "$PROJECT_ROOT/prisma/schema.prisma"
    
    log_success "Prisma schema updated for production"
}

# Generate Prisma client
generate_prisma_client() {
    log_info "Generating Prisma client..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would generate Prisma client"
        return
    fi
    
    cd "$PROJECT_ROOT"
    npx prisma generate
    
    log_success "Prisma client generated"
}

# Create database migration
create_migration() {
    log_info "Creating database migration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would create database migration"
        return
    fi
    
    # Set production database URL
    export DATABASE_URL=$(aws ssm get-parameter \
        --name "/hasivu-platform/$ENVIRONMENT/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    cd "$PROJECT_ROOT"
    
    # Create migration
    local migration_name="production_migration_$(date +%Y%m%d_%H%M%S)"
    npx prisma migrate dev --name "$migration_name" --create-only
    
    log_success "Migration created: $migration_name"
}

# Deploy migration to production
deploy_migration() {
    log_info "Deploying migration to production database..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would deploy migration to production"
        return
    fi
    
    # Set production database URL
    export DATABASE_URL=$(aws ssm get-parameter \
        --name "/hasivu-platform/$ENVIRONMENT/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    cd "$PROJECT_ROOT"
    
    # Deploy migration
    npx prisma migrate deploy
    
    log_success "Migration deployed to production database"
}

# Seed production database
seed_database() {
    log_info "Seeding production database with initial data..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would seed production database"
        return
    fi
    
    # Set production database URL
    export DATABASE_URL=$(aws ssm get-parameter \
        --name "/hasivu-platform/$ENVIRONMENT/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    cd "$PROJECT_ROOT"
    
    # Run seed script
    npm run db:seed
    
    log_success "Production database seeded"
}

# Verify database setup
verify_database() {
    log_info "Verifying database setup..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would verify database setup"
        return
    fi
    
    # Set production database URL
    export DATABASE_URL=$(aws ssm get-parameter \
        --name "/hasivu-platform/$ENVIRONMENT/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    cd "$PROJECT_ROOT"
    
    # Check database connection
    npx prisma db execute --stdin <<< "SELECT 1 as test;" > /dev/null
    
    # Verify tables exist
    local tables=("users" "schools" "menu_items" "orders" "payment_orders")
    for table in "${tables[@]}"; do
        local count
        count=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM $table;" | tail -n 1 | xargs)
        log_info "Table '$table' has $count records"
    done
    
    log_success "Database verification completed"
}

# Update application configuration
update_app_config() {
    log_info "Updating application configuration..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would update application configuration"
        return
    fi
    
    # Update serverless.yml to use production schema
    if [[ -f "$PROJECT_ROOT/serverless-production.yml" ]]; then
        cp "$PROJECT_ROOT/serverless-production.yml" "$PROJECT_ROOT/serverless.yml"
        log_info "Serverless configuration updated for production"
    fi
    
    # Install production dependencies
    cd "$PROJECT_ROOT"
    npm ci --only=production --no-audit
    
    log_success "Application configuration updated"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY RUN] Would run health checks"
        return
    fi
    
    # Set production database URL
    export DATABASE_URL=$(aws ssm get-parameter \
        --name "/hasivu-platform/$ENVIRONMENT/database/url" \
        --with-decryption \
        --query 'Parameter.Value' \
        --output text)
    
    cd "$PROJECT_ROOT"
    
    # Test database connection
    npm run health
    
    # Run smoke tests
    if [[ -f "$PROJECT_ROOT/test/smoke.test.js" ]]; then
        npm run test:smoke
    fi
    
    log_success "Health checks completed"
}

# Cleanup temporary files
cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove any temporary migration files
    rm -f "$PROJECT_ROOT/prisma/migrations/.tmp*"
    
    # Clean npm cache
    npm cache clean --force
    
    log_success "Cleanup completed"
}

# Main migration function
main() {
    log_info "Starting HASIVU Platform production migration..."
    log_info "Environment: $ENVIRONMENT"
    log_info "Dry run: $DRY_RUN"
    
    # Confirm production deployment
    if [[ "$ENVIRONMENT" == "production" && "$DRY_RUN" != "true" ]]; then
        echo ""
        log_warning "⚠️  You are about to migrate to PRODUCTION environment!"
        log_warning "This will:"
        log_warning "  - Update the database schema"
        log_warning "  - Run migrations on the production database"
        log_warning "  - Update application configuration"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " confirm
        
        if [[ "$confirm" != "yes" ]]; then
            log_info "Migration cancelled by user"
            exit 0
        fi
    fi
    
    # Execute migration steps
    check_prerequisites
    load_environment
    backup_database
    update_prisma_schema
    generate_prisma_client
    create_migration
    deploy_migration
    seed_database
    verify_database
    update_app_config
    run_health_checks
    cleanup
    
    log_success "🎉 Production migration completed successfully!"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo ""
        log_info "Next steps:"
        log_info "1. Deploy the serverless application: npm run serverless:deploy:prod"
        log_info "2. Run post-deployment tests: npm run test:smoke:production"
        log_info "3. Monitor the application logs and metrics"
        echo ""
    fi
}

# Show usage information
usage() {
    cat << EOF
Usage: $0 [ENVIRONMENT] [OPTIONS]

ENVIRONMENT:
    staging     Deploy to staging environment (default: production)
    production  Deploy to production environment

OPTIONS:
    --dry-run   Show what would be done without making changes
    --help      Show this help message

ENVIRONMENT VARIABLES:
    DRY_RUN     Set to 'true' for dry run mode

Examples:
    $0 production           # Migrate to production
    $0 staging              # Migrate to staging
    $0 production --dry-run # Dry run for production
    DRY_RUN=true $0 staging # Dry run for staging

Prerequisites:
    - AWS CLI configured with appropriate permissions
    - Node.js and npm installed
    - PostgreSQL client (psql) installed
    - Environment configuration files present

EOF
}

# Handle command line arguments
case "${1:-}" in
    --help|-h)
        usage
        exit 0
        ;;
    --dry-run)
        DRY_RUN="true"
        ENVIRONMENT="${2:-production}"
        ;;
    staging|production)
        ENVIRONMENT="$1"
        if [[ "${2:-}" == "--dry-run" ]]; then
            DRY_RUN="true"
        fi
        ;;
    "")
        ENVIRONMENT="production"
        ;;
    *)
        log_error "Invalid argument: $1"
        usage
        exit 1
        ;;
esac

# Run the main function
main "$@"