# CI/CD Pipeline & Deployment Automation

## Overview

The Hasivu Platform uses a comprehensive CI/CD pipeline built with GitHub Actions, providing automated testing, building, and deployment to multiple environments.

## Pipeline Architecture

### Pipeline Stages

```
┌─────────────┐
│   Setup     │ → Dependency caching and installation
└─────────────┘
      ↓
┌─────────────────────────────────────┐
│  Code Quality & Security            │
│  - Linting (ESLint)                 │
│  - Type checking (TypeScript)       │
│  - Format checking (Prettier)       │
│  - Security scanning (npm audit)    │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Testing                            │
│  - Unit tests (Jest)                │
│  - Integration tests (with DB)      │
│  - E2E tests (Playwright)           │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Build                              │
│  - Backend build (TypeScript)       │
│  - Frontend build (Next.js)         │
│  - Docker image build               │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│  Deploy                             │
│  - Staging (develop branch)         │
│  - Production (main branch)         │
└─────────────────────────────────────┘
```

## Workflow Configuration

### Main CI/CD Workflow

Location: `.github/workflows/ci-cd.yml`

#### Triggers

- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop`
- **Manual** workflow dispatch

#### Jobs

**1. Setup Job**

- Installs Node.js dependencies
- Creates dependency cache for faster subsequent runs
- Installs both root and web dependencies

**2. Code Quality Job**

- Runs ESLint on all TypeScript/JavaScript files
- Performs TypeScript type checking
- Validates code formatting with Prettier
- **Success Criteria**: Zero linting errors, zero type errors

**3. Security Job**

- Runs npm audit for dependency vulnerabilities
- Performs Snyk security scanning
- **Success Criteria**: No high-severity vulnerabilities

**4. Unit Tests Job**

- Runs Jest unit tests with coverage
- Uploads coverage reports to Codecov
- **Success Criteria**: All tests pass, >80% coverage

**5. Integration Tests Job**

- Spins up PostgreSQL and Redis services
- Runs database migrations
- Executes integration tests
- **Success Criteria**: All integration tests pass

**6. Build Job**

- Builds backend TypeScript code
- Builds Next.js frontend
- Creates build artifacts
- **Success Criteria**: Successful builds with no errors

**7. Docker Build Job**

- Builds multi-stage Docker images
- Pushes to Docker Hub
- Uses BuildKit caching for efficiency
- **Success Criteria**: Image built and pushed successfully

**8. E2E Tests Job**

- Installs Playwright browsers
- Runs end-to-end tests
- Generates test reports
- **Success Criteria**: All E2E tests pass

**9. Deploy Staging Job**

- Triggers on `develop` branch push
- Deploys to AWS staging environment
- Runs smoke tests
- Sends Slack notification
- **Success Criteria**: Deployment successful, smoke tests pass

**10. Deploy Production Job**

- Triggers on `main` branch push
- Requires manual approval (GitHub environment)
- Runs production readiness check
- Deploys to production
- Runs smoke tests and health checks
- Automatic rollback on failure
- **Success Criteria**: Deployment successful, all checks pass

## Environment Setup

### GitHub Secrets

Required secrets for CI/CD:

**AWS Credentials**

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
AWS_REGION (optional, defaults to ap-south-1)
```

**Docker Hub**

```
DOCKER_USERNAME
DOCKER_PASSWORD
```

**API Configuration**

```
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_API_URL_STAGING
NEXT_PUBLIC_API_URL_PROD
```

**Notifications**

```
SLACK_WEBHOOK_URL
SNYK_TOKEN (optional)
```

**Database**

```
DATABASE_URL (for CI tests)
```

### Environment Protection Rules

**Staging Environment**

- Automatic deployment on `develop` branch
- No approval required
- Deployment URL: https://staging.hasivu.com

**Production Environment**

- Automatic deployment on `main` branch
- Requires approval from designated reviewers
- Deployment URL: https://hasivu.com

## Local Development & Testing

### Prerequisites

```bash
# Required software
- Node.js 18.x or higher
- Docker and Docker Compose
- AWS CLI configured
- Serverless Framework
```

### Local Setup

1. **Install dependencies**

```bash
npm ci
cd web && npm ci
```

2. **Set up environment variables**

```bash
cp .env.example .env
# Edit .env with your local configuration
```

3. **Start services with Docker Compose**

```bash
docker-compose up -d
```

4. **Run database migrations**

```bash
npm run db:migrate
```

5. **Start development servers**

```bash
# Terminal 1: Backend
npm run dev

# Terminal 2: Frontend
cd web && npm run dev
```

### Running Tests Locally

**Unit Tests**

```bash
npm run test:unit
```

**Integration Tests**

```bash
docker-compose up -d postgres redis
npm run test:integration
```

**E2E Tests**

```bash
cd web
npm run test:playwright
```

**All Tests with Coverage**

```bash
npm run test:coverage
```

## Deployment

### Automated Deployment

**Staging Deployment**

```bash
# Push to develop branch
git checkout develop
git push origin develop
# Automatically deploys to staging
```

**Production Deployment**

```bash
# Push to main branch
git checkout main
git merge develop
git push origin main
# Requires approval, then deploys to production
```

### Manual Deployment

**Using Deployment Script**

```bash
# Deploy to staging
./scripts/deploy.sh staging

# Deploy to production (with confirmation)
./scripts/deploy.sh production

# Deploy with options
./scripts/deploy.sh production --skip-tests --force
```

**Using npm scripts**

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:production
```

### Rollback

**Automatic Rollback**

- Production deployments automatically rollback if smoke tests or health checks fail
- Rollback happens within 2-3 minutes

**Manual Rollback**

```bash
# Via deployment script
./scripts/deploy.sh production --rollback

# Via npm script
npm run deploy:rollback
```

## Docker

### Building Docker Images

**Build all stages**

```bash
docker build -t hasivu-platform .
```

**Build specific stage**

```bash
# Backend only
docker build --target backend-production -t hasivu-backend .

# Frontend only
docker build --target frontend-production -t hasivu-frontend .
```

### Running Docker Containers

**Using Docker Compose**

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Individual containers**

```bash
# Run backend
docker run -p 3000:3000 --env-file .env hasivu-backend

# Run frontend
docker run -p 3001:3000 --env-file .env hasivu-frontend
```

### Docker Image Optimization

Our multi-stage Dockerfile provides:

- **Production images**: 200-300 MB (vs 1GB+ unoptimized)
- **Security**: Non-root user, minimal attack surface
- **Performance**: Optimized layers, BuildKit caching
- **Health checks**: Built-in health monitoring

## Monitoring & Alerts

### Health Checks

**Application Health**

```bash
# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost:3001/api/health
```

**Response Format**

```json
{
  "status": "ok",
  "timestamp": "2025-10-12T10:00:00.000Z",
  "services": {
    "database": { "status": "up", "responseTime": "12ms" },
    "redis": { "status": "up", "responseTime": "3ms" }
  },
  "metrics": {
    "uptime": "3600s",
    "memory": {
      "rss": "150MB",
      "heapUsed": "80MB"
    }
  }
}
```

### Deployment Notifications

**Slack Integration**

- Deployment start notifications
- Success/failure notifications
- Rollback notifications

**Email Notifications** (optional)

- Critical deployment failures
- Production approval requests

## Performance Optimization

### Pipeline Speed

Current pipeline performance:

- **Setup**: ~1 min (with cache)
- **Code Quality**: ~2 min
- **Tests**: ~5 min (parallel)
- **Build**: ~3 min (parallel)
- **Docker**: ~4 min (with BuildKit cache)
- **Total**: ~15 min for full pipeline

### Caching Strategy

**Dependency Caching**

- npm dependencies cached by lock file hash
- Restored in ~10 seconds
- Reduces setup time by 80%

**Docker Layer Caching**

- BuildKit remote cache
- Reduces build time by 60%
- Shared across branches

**Playwright Browser Caching**

- Browser binaries cached
- Reduces E2E setup time by 90%

## Best Practices

### Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

### Commit Messages

Follow conventional commits:

```
feat: add payment gateway integration
fix: resolve authentication timeout issue
docs: update deployment guide
test: add E2E tests for checkout flow
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push and create PR to `develop`
4. CI/CD runs automatically
5. Request review from team
6. Merge to `develop` after approval
7. Automatic deployment to staging
8. Test on staging
9. Create PR from `develop` to `main`
10. Approve and merge for production deployment

### Deployment Checklist

**Pre-deployment**

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Documentation updated
- [ ] Changelog updated

**Post-deployment**

- [ ] Smoke tests passed
- [ ] Health checks green
- [ ] Monitoring dashboards reviewed
- [ ] Performance metrics normal
- [ ] Error rates normal
- [ ] Stakeholders notified

## Troubleshooting

### Common Issues

**1. Pipeline Fails on Dependencies**

```bash
# Clear cache and retry
# In GitHub Actions, re-run jobs
# Locally:
rm -rf node_modules web/node_modules
npm ci && cd web && npm ci
```

**2. Docker Build Fails**

```bash
# Clear Docker cache
docker builder prune -a

# Build without cache
docker build --no-cache -t hasivu-platform .
```

**3. Deployment Fails**

```bash
# Check AWS credentials
aws sts get-caller-identity

# Check Serverless deployment
serverless deploy --verbose --stage staging

# Check logs
npm run logs
```

**4. Tests Fail in CI but Pass Locally**

```bash
# Run tests with same environment as CI
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hasivu_test \
NODE_ENV=test \
npm run test:integration
```

### Getting Help

- Check GitHub Actions logs
- Review deployment script output
- Check CloudWatch logs in AWS
- Contact DevOps team on Slack

## Metrics & KPIs

### Deployment Metrics

- **Deployment Frequency**: 10+ per week
- **Lead Time**: <1 hour (code to production)
- **MTTR**: <15 minutes (mean time to recovery)
- **Change Failure Rate**: <5%

### Pipeline Metrics

- **Success Rate**: >95%
- **Average Duration**: ~15 minutes
- **Cache Hit Rate**: >80%
- **Test Coverage**: >80%

## Future Enhancements

- [ ] Automated performance testing
- [ ] Canary deployments
- [ ] Feature flag integration
- [ ] Automated security scanning with SAST/DAST
- [ ] Infrastructure as Code validation
- [ ] Cost optimization automation
- [ ] Multi-region deployment support

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [Docker Documentation](https://docs.docker.com)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda)
