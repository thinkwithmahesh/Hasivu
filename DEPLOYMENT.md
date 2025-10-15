# HASIVU Platform - Complete Deployment Guide

## 📋 Overview

This comprehensive deployment guide covers the complete setup and deployment process for the HASIVU Platform, from development environment setup through production deployment with AWS Lambda functions.

## 🛠️ Infrastructure Overview

### Architecture Components

- **Frontend**: Next.js web application with environment-specific configurations
- **Backend**: Node.js/TypeScript API with comprehensive service layers
- **Database**: SQLite (development), PostgreSQL (staging/production)
- **Cache**: Redis for session management and performance optimization
- **Cloud**: AWS Lambda functions with API Gateway
- **Monitoring**: CloudWatch integration for production monitoring

### Environment Structure

```
Development  → Local Node.js + SQLite + Redis
Staging      → AWS Lambda + PostgreSQL + Redis Cluster
Production   → AWS Lambda + PostgreSQL + Redis Cluster
```

## 🔧 Development Environment Setup

### Prerequisites

- Node.js ≥18.19.0
- npm ≥9.0.0
- Git
- AWS CLI (optional, fallback available)

### 1. Repository Setup

```bash
git clone https://github.com/hasivu/platform.git
cd hasivu-platform
npm install
```

### 2. Environment Configuration

```bash
# Copy base environment file
cp .env.example .env

# Configure development settings
DATABASE_URL="file:./prisma/dev.db"
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3001
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate:dev

# Seed development data (optional)
npm run db:seed
```

### 4. Development Server

```bash
# Start development server
npm run dev

# Or start with debugging
npm run dev -- --inspect
```

## ☁️ AWS Infrastructure Setup

### 1. AWS Credentials Configuration

The platform includes automatic AWS validation with multiple fallback methods:

**Method 1: AWS CLI**

```bash
aws configure
aws sts get-caller-identity
```

**Method 2: Environment Variables**

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=ap-south-1
```

**Method 3: AWS SDK Fallback**
The setup script automatically detects and validates AWS credentials using the AWS SDK v3 when CLI is unavailable.

### 2. Infrastructure Validation

```bash
# Comprehensive infrastructure validation
npm run setup:infrastructure:validate

# Environment-specific setup
npm run setup:infrastructure:dev
npm run setup:infrastructure:staging
npm run setup:infrastructure:production
```

### 3. Lambda URL Configuration

The platform includes automated Lambda URL configuration that discovers deployed functions and updates environment files:

```bash
# Configure URLs for all environments
npm run configure:lambda-urls

# Environment-specific configuration
npm run configure:lambda-urls:staging
npm run configure:lambda-urls:production
```

## 🚀 Staging Deployment

### 1. Staging Environment Setup

```bash
# Deploy to staging
npm run deploy:staging

# Configure staging URLs
npm run configure:lambda-urls:staging
```

### 2. Staging Configuration

Staging environment automatically configures:

- **API Gateway**: `def567ghi8.execute-api.ap-south-1.amazonaws.com`
- **Database**: PostgreSQL cluster on RDS
- **Cache**: Redis cluster on ElastiCache
- **Monitoring**: CloudWatch integration

### 3. Staging Validation

```bash
# Run staging smoke tests
npm run test:smoke:staging

# Run staging performance tests
npm run test:performance:staging
```

## 🏭 Production Deployment

### 1. Production Deployment Process

```bash
# Full production deployment
npm run deploy:production

# Blue-green deployment (recommended)
npm run deploy:production:blue-green

# Configure production URLs
npm run configure:lambda-urls:production
```

### 2. Production Configuration

Production environment features:

- **API Gateway**: `ghi901jkl2.execute-api.ap-south-1.amazonaws.com`
- **High Availability**: Multi-AZ database and cache setup
- **Security**: Enhanced security groups and IAM policies
- **Monitoring**: Comprehensive CloudWatch monitoring and alerting

### 3. Production Validation

```bash
# Production readiness check
npm run check:production

# Production health monitoring
npm run health:check:production

# Production smoke tests
npm run test:smoke:production
```

## 🧪 Testing Framework

### Comprehensive Testing Suite

The platform includes extensive testing capabilities:

#### Test Categories

- **Unit Tests**: Service layer and utility function testing
- **Integration Tests**: Database and service integration validation
- **E2E Tests**: Complete user journey testing
- **Smoke Tests**: Critical endpoint accessibility validation
- **Performance Tests**: Load testing and performance monitoring
- **Security Tests**: Vulnerability scanning and security validation

#### Test Execution

```bash
# All tests
npm test

# Specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:smoke

# Environment-specific testing
npm run test:smoke:staging
npm run test:performance:production
```

#### Lambda Endpoint Testing

The platform includes specialized Lambda endpoint testing:

```bash
# Test Lambda endpoints in staging
TEST_ENVIRONMENT=staging npm run test:smoke -- --testPathPattern=lambda-endpoints

# Test Lambda endpoints in production
TEST_ENVIRONMENT=production npm run test:smoke -- --testPathPattern=lambda-endpoints
```

### Test Results Interpretation

- **200 responses**: Lambda functions deployed and working correctly
- **404 responses**: Lambda functions not yet deployed (expected during setup)
- **ENOTFOUND errors**: API Gateway not configured (placeholder URLs)
- **Database errors**: Environment configuration issues (resolved by infrastructure setup)

## 📊 Monitoring and Observability

### CloudWatch Integration

```bash
# Set up CloudWatch monitoring
npm run configure:monitoring

# View logs
npm run logs

# Performance monitoring
npm run perf:monitor
```

### Performance Monitoring

```bash
# Comprehensive performance analysis
npm run perf:comprehensive

# Environment-specific performance testing
npm run perf:development
npm run perf:staging
npm run perf:production

# Quick performance check
npm run perf:quick
```

### Health Monitoring

```bash
# Application health check
npm run health

# Database performance analysis
npm run db:performance:analyze

# Redis performance testing
npm run redis:performance:test
```

## 🔐 Security Configuration

### Environment Security

- **Development**: Local SQLite with file-based security
- **Staging**: Encrypted connections, VPC isolation, IAM roles
- **Production**: Full security hardening, compliance monitoring

### Security Validation

```bash
# Security audit
npm run security:audit

# Dependency security check
npm run security:fix
```

## 📈 Performance Optimization

### Database Optimization

```bash
# Database performance testing
npm run db:performance:test

# Automatic optimizations
npm run db:performance:optimize
```

### Lambda Performance

```bash
# Lambda-specific performance analysis
npm run perf:lambda

# Real-time performance testing
npm run perf:realtime
```

## 🔄 CI/CD Pipeline

### Automated Deployment

The platform supports automated deployment through:

1. **Infrastructure Setup**: Automated AWS resource validation
2. **Environment Configuration**: Automatic Lambda URL discovery
3. **Testing Validation**: Comprehensive test suite execution
4. **Deployment Verification**: Post-deployment health checks

### Rollback Procedures

```bash
# Rollback production deployment
npm run deploy:rollback

# Promote staging to production
npm run deploy:promote
```

## 🛡️ Error Handling and Troubleshooting

### Common Issues and Solutions

#### Database Connection Issues

```bash
# Validate database configuration
DATABASE_URL="file:./prisma/dev.db" npm run setup:infrastructure:validate

# Regenerate Prisma client
npm run db:generate
```

#### AWS Configuration Issues

```bash
# Validate AWS credentials
npm run setup:infrastructure:validate

# Check AWS CLI configuration
aws sts get-caller-identity
```

#### Lambda Deployment Issues

```bash
# Verify serverless configuration
npx serverless print

# Deploy with verbose output
npx serverless deploy --verbose
```

#### Testing Issues

```bash
# Fix database URL format
export DATABASE_URL="file:./prisma/dev.db"

# Run tests with environment setup
NODE_ENV=test npm test
```

### Performance Issues

```bash
# Comprehensive performance analysis
npm run perf:comprehensive

# Database performance optimization
npm run db:performance:optimize
```

## 📋 Deployment Checklist

### Pre-deployment

- [ ] AWS credentials configured and validated
- [ ] Environment variables properly set
- [ ] Database migrations up to date
- [ ] Dependencies installed and security audited
- [ ] Unit and integration tests passing

### Deployment

- [ ] Infrastructure setup completed
- [ ] Lambda functions deployed successfully
- [ ] API Gateway URLs configured
- [ ] Database connected and migrations applied
- [ ] Redis cache accessible

### Post-deployment

- [ ] Smoke tests passing
- [ ] Health endpoints responding
- [ ] Performance metrics within acceptable ranges
- [ ] Monitoring and alerting configured
- [ ] Security scans completed

### Production-specific

- [ ] Blue-green deployment validated
- [ ] Rollback procedures tested
- [ ] Production monitoring active
- [ ] Compliance requirements met
- [ ] Documentation updated

## 🔗 Additional Resources

### Scripts Reference

```bash
# Infrastructure
npm run setup:infrastructure:*
npm run configure:lambda-urls:*

# Testing
npm run test:*
npm run perf:*

# Deployment
npm run deploy:*
npm run check:production

# Monitoring
npm run health
npm run logs
```

### Environment Files

- **Development**: `.env`
- **Staging**: `web/.env.staging`
- **Production**: `web/.env.production`

### Key Directories

- **Infrastructure**: `scripts/` directory
- **Testing**: `tests/` directory
- **Frontend**: `web/` directory
- **Documentation**: Root directory markdown files

---

## 🆘 Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review the comprehensive test results
3. Validate infrastructure setup with provided scripts
4. Contact the platform team with specific error messages and environment details

This deployment guide provides complete instructions for setting up, deploying, and maintaining the HASIVU Platform across all environments with comprehensive testing and monitoring capabilities.
