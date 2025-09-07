# HASIVU Platform - Production Deployment Guide

## 🚀 Overview

This guide covers the complete deployment process for the HASIVU Platform, including environment setup, CI/CD configuration, and production launch procedures.

## 📋 Prerequisites

### Required Tools
- **Node.js** 18.x or higher
- **pnpm** 8.x or higher
- **AWS CLI** v2 configured with appropriate credentials
- **Git** for version control
- **Docker** (optional, for containerized deployments)

### AWS Services Required
- **S3** buckets for static hosting and backups
- **CloudFront** CDN for global content delivery
- **Route 53** for DNS management
- **Certificate Manager** for SSL certificates
- **IAM** roles and policies for secure access

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │───▶│   AWS S3 +      │
│                 │    │    CI/CD         │    │   CloudFront    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                                              ┌─────────────────┐
                                              │   Production    │
                                              │   Environment   │
                                              │ app.hasivu.com  │
                                              └─────────────────┘
```

## 🔧 Environment Setup

### 1. AWS Infrastructure Setup

#### S3 Buckets
Create the following S3 buckets with appropriate policies:

```bash
# Production bucket
aws s3 mb s3://hasivu-prod-frontend

# Staging bucket  
aws s3 mb s3://hasivu-staging-frontend

# Backup bucket
aws s3 mb s3://hasivu-prod-backups
```

#### CloudFront Distribution
Create CloudFront distributions for both staging and production environments with:
- Origin pointing to respective S3 buckets
- Custom error pages for SPA routing
- Appropriate caching behaviors
- SSL certificates from ACM

#### IAM Policies
Create an IAM user with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hasivu-*",
        "arn:aws:s3:::hasivu-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2. GitHub Repository Setup

#### Required Secrets
Configure the following secrets in your GitHub repository settings:

**AWS Configuration:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`

**Staging Environment:**
- `STAGING_S3_BUCKET`
- `STAGING_CLOUDFRONT_ID`
- `STAGING_API_URL`
- `STAGING_WS_URL`
- `STAGING_COGNITO_USER_POOL_ID`
- `STAGING_COGNITO_CLIENT_ID`
- `STAGING_RAZORPAY_KEY_ID`

**Production Environment:**
- `PRODUCTION_S3_BUCKET`
- `PRODUCTION_CLOUDFRONT_ID`
- `PRODUCTION_API_URL`
- `PRODUCTION_WS_URL`
- `PRODUCTION_COGNITO_USER_POOL_ID`
- `PRODUCTION_COGNITO_CLIENT_ID`
- `PRODUCTION_RAZORPAY_KEY_ID`
- `BACKUP_S3_BUCKET`

**Monitoring & Notifications:**
- `SENTRY_DSN`
- `ANALYTICS_ID`
- `SLACK_WEBHOOK_URL`
- `LHCI_GITHUB_APP_TOKEN`

#### Branch Structure
- `main` - Staging deployments
- `production` - Production deployments
- `develop` - Development branch
- `feature/*` - Feature branches

## 🔄 CI/CD Pipeline

The GitHub Actions workflow includes:

### 1. Quality Checks
- TypeScript compilation
- ESLint linting  
- Prettier formatting
- Security audits
- Dependency vulnerability scanning

### 2. Testing
- Unit tests with Jest
- Integration tests
- E2E tests with Playwright
- Coverage reporting

### 3. Performance Testing
- Lighthouse audits
- Bundle size analysis
- Performance regression detection

### 4. Deployment
- Automated staging deployment on `main` branch
- Manual production deployment on `production` branch
- Rollback capabilities
- Health checks and monitoring

## 📦 Manual Deployment

### Local Deployment Script

Use the provided deployment script for manual deployments:

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production  
./scripts/deploy.sh production
```

### Environment Files

Create environment-specific configuration files:

**.env.staging:**
```env
NEXT_PUBLIC_API_URL=https://api-staging.hasivu.com
NEXT_PUBLIC_WS_URL=wss://ws-staging.hasivu.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
NEXT_PUBLIC_ENVIRONMENT=staging

AWS_REGION=us-east-1
STAGING_S3_BUCKET=hasivu-staging-frontend
STAGING_CLOUDFRONT_ID=EXXXXXXXXXXXXX
```

**.env.production:**
```env
NEXT_PUBLIC_API_URL=https://api.hasivu.com
NEXT_PUBLIC_WS_URL=wss://ws.hasivu.com
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXXXX
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SENTRY_DSN=https://XXXXXXXX@sentry.io/XXXXXXX
NEXT_PUBLIC_ANALYTICS_ID=GA_MEASUREMENT_ID

AWS_REGION=us-east-1
PRODUCTION_S3_BUCKET=hasivu-prod-frontend
PRODUCTION_CLOUDFRONT_ID=EXXXXXXXXXXXXX
BACKUP_S3_BUCKET=hasivu-prod-backups
```

## 🚦 Deployment Process

### Staging Deployment

1. **Push to `main` branch:**
   ```bash
   git push origin main
   ```

2. **Automated pipeline runs:**
   - Quality checks and tests
   - Build and deploy to staging
   - Health checks and notifications

3. **Verify staging environment:**
   - Visit https://staging.hasivu.com
   - Test critical user flows
   - Verify integrations

### Production Deployment

1. **Create production release:**
   ```bash
   git checkout production
   git merge main
   git push origin production
   ```

2. **Pipeline executes:**
   - All quality and performance checks
   - Backup creation
   - Production deployment
   - Health checks and monitoring

3. **Post-deployment verification:**
   - Automated health checks
   - Performance monitoring
   - Error tracking
   - User acceptance testing

## 🔍 Monitoring & Maintenance

### Health Checks

The deployment includes automated health checks:

```bash
# Application health
curl -f https://app.hasivu.com/api/health

# Frontend availability
curl -f https://app.hasivu.com

# Performance monitoring
lighthouse https://app.hasivu.com --chrome-flags="--headless"
```

### Performance Metrics

Monitor the following key metrics:
- **Lighthouse Performance Score:** Target 90+
- **First Contentful Paint:** Target <1.5s
- **Largest Contentful Paint:** Target <2.5s
- **Time to Interactive:** Target <3.5s
- **Cumulative Layout Shift:** Target <0.1

### Error Monitoring

- **Sentry** for error tracking and performance monitoring
- **CloudWatch** for AWS infrastructure monitoring
- **Real User Monitoring** for actual user experience metrics

## 🔄 Rollback Procedures

### Automatic Rollback

The production deployment creates automatic backups:

```bash
# List available backups
aws s3 ls s3://hasivu-prod-backups/

# Rollback to previous version
aws s3 sync s3://hasivu-prod-backups/backup-YYYYMMDD-HHMMSS/ s3://hasivu-prod-frontend/
aws cloudfront create-invalidation --distribution-id EXXXXXXXXXXXXX --paths "/*"
```

### Emergency Procedures

1. **Immediate rollback:**
   ```bash
   ./scripts/rollback.sh production
   ```

2. **CloudFront cache clearing:**
   ```bash
   aws cloudfront create-invalidation --distribution-id EXXXXXXXXXXXXX --paths "/*"
   ```

3. **Health check verification:**
   ```bash
   curl -f https://app.hasivu.com
   ```

## 📊 Performance Optimization

### Build Optimization

- **Code splitting** for optimal bundle sizes
- **Tree shaking** to remove unused code
- **Image optimization** with Next.js Image component
- **Font optimization** with system font fallbacks

### CDN Configuration

- **Aggressive caching** for static assets (1 year)
- **No caching** for HTML files (immediate updates)
- **Gzip compression** for all text assets
- **Brotli compression** where supported

### Runtime Optimization

- **Service workers** for offline functionality
- **Resource hints** for critical resources
- **Lazy loading** for non-critical components
- **Progressive enhancement** for better UX

## 🔐 Security Considerations

### HTTPS and SSL

- **SSL/TLS certificates** managed by AWS Certificate Manager
- **HSTS headers** for secure connections
- **Mixed content prevention**

### Content Security Policy

```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline' *.hasivu.com;
  child-src *.hasivu.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data: *.hasivu.com;
  media-src 'none';
  connect-src 'self' *.hasivu.com wss:;
  font-src 'self';
`;
```

### Environment Security

- **Environment variables** for sensitive configuration
- **IAM roles** with minimal required permissions
- **S3 bucket policies** restricting public access
- **CloudFront signed URLs** for protected content

## 🎯 Success Metrics

### Technical Metrics
- ✅ **Deployment Success Rate:** 99.5%+
- ✅ **Build Time:** <5 minutes
- ✅ **Deploy Time:** <2 minutes
- ✅ **Zero-downtime deployments**

### Performance Metrics
- ✅ **Lighthouse Score:** 90+
- ✅ **Load Time:** <2 seconds
- ✅ **Time to Interactive:** <3 seconds
- ✅ **Core Web Vitals:** Green scores

### Business Metrics
- ✅ **User Conversion:** Monitor post-deployment
- ✅ **Error Rate:** <0.1%
- ✅ **Availability:** 99.9%+
- ✅ **User Satisfaction:** Monitor feedback

## 📞 Support and Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check TypeScript errors
   - Verify environment variables
   - Review dependency conflicts

2. **Deployment Issues:**
   - Verify AWS credentials
   - Check S3 bucket permissions
   - Confirm CloudFront configuration

3. **Performance Issues:**
   - Analyze Lighthouse reports
   - Check bundle sizes
   - Review network requests

### Getting Help

- **Documentation:** This deployment guide
- **Monitoring:** CloudWatch dashboards
- **Error Tracking:** Sentry alerts
- **Team Communication:** Slack notifications

## 🎉 Conclusion

The HASIVU platform is now configured for production deployment with:
- **Automated CI/CD pipeline** for reliable deployments
- **Comprehensive testing** ensuring quality
- **Performance monitoring** for optimal user experience
- **Security best practices** protecting user data
- **Rollback procedures** for quick issue resolution

Your platform is ready to scale and serve thousands of schools with confidence! 🚀
