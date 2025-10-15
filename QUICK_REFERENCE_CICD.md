# CI/CD Quick Reference Card

## Essential Commands

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Run tests
npm test
npm run test:unit
npm run test:integration
cd web && npm run test:playwright
```

### Deployment

```bash
# Staging (automatic on develop branch push)
git push origin develop

# Production (automatic on main branch push)
git push origin main

# Manual deployment
npm run deploy:staging
npm run deploy:production

# Rollback
npm run deploy:rollback
```

### Health Checks

```bash
# Production health
npm run health:check:production

# Staging health
node scripts/health-check.js --env=staging

# Production readiness
npm run check:production
```

### Docker Operations

```bash
# Build all
docker build -t hasivu-platform .

# Build backend only
docker build --target backend-production -t hasivu-backend .

# Build frontend only
docker build --target frontend-production -t hasivu-frontend .

# Run with docker-compose
docker-compose up -d
```

## Pipeline Status

### Workflow Triggers

- **Push to main**: Production deployment
- **Push to develop**: Staging deployment
- **Pull Request**: Full validation (no deploy)
- **Manual**: GitHub Actions workflow dispatch

### Pipeline Jobs

1. Setup & Cache (1 min)
2. Code Quality (2 min)
3. Security Scan (1 min)
4. Unit Tests (2 min)
5. Integration Tests (3 min)
6. Build (3 min)
7. Docker Build (4 min)
8. E2E Tests (5 min)
9. Deploy (2-3 min)

**Total**: ~15 minutes

## Key Files

```
.github/workflows/ci-cd.yml          # Main pipeline
Dockerfile                           # Multi-stage build
docker-compose.yml                   # Local development
scripts/deploy.sh                    # Deployment script
scripts/health-check.js              # Health validation
scripts/production-readiness-check.js # Pre-deploy checks
docs/CI-CD-DEPLOYMENT.md            # Full documentation
```

## Required Secrets

### GitHub Secrets

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_ACCESS_KEY_ID_PROD
AWS_SECRET_ACCESS_KEY_PROD
DOCKER_USERNAME
DOCKER_PASSWORD
NEXT_PUBLIC_API_URL
SLACK_WEBHOOK_URL
```

## Health Endpoints

```
Backend:  http://localhost:3000/health
Frontend: http://localhost:3001/api/health

Staging:     https://staging.hasivu.com/health
Production:  https://hasivu.com/health
```

## Troubleshooting

### Pipeline Fails

1. Check GitHub Actions logs
2. Re-run failed jobs
3. Clear cache if needed

### Deployment Fails

1. Check AWS credentials: `aws sts get-caller-identity`
2. Check Serverless: `serverless deploy --verbose`
3. Check CloudWatch logs

### Tests Fail

1. Run locally: `npm test`
2. Check services: `docker-compose ps`
3. Review test logs

### Docker Issues

1. Clean: `docker builder prune -a`
2. Rebuild: `docker-compose build --no-cache`
3. Restart: `docker-compose restart`

## Support

- **Documentation**: `/docs/CI-CD-DEPLOYMENT.md`
- **Summary**: `/CICD_DEPLOYMENT_SUMMARY.md`
- **GitHub Actions**: Check workflow runs
- **Health Status**: Run health checks
- **AWS Logs**: CloudWatch console

## Quick Start

1. **Clone repository**

   ```bash
   git clone <repository>
   cd hasivu-platform
   ```

2. **Install dependencies**

   ```bash
   npm ci
   cd web && npm ci
   ```

3. **Set up environment**

   ```bash
   cp .env.example .env
   # Edit .env
   ```

4. **Start development**

   ```bash
   docker-compose up -d
   npm run dev
   ```

5. **Run tests**

   ```bash
   npm test
   ```

6. **Deploy**
   ```bash
   git push origin develop  # Staging
   git push origin main     # Production
   ```

## Success Criteria

✅ Pipeline runs on every commit
✅ Automated testing before deployment
✅ Docker containerization working
✅ Deployment scripts functional
✅ Health checks operational
✅ Rollback capability
✅ <15 min deployment time

## Metrics

- **Deployment Frequency**: 10+ per week
- **Lead Time**: <1 hour
- **MTTR**: <15 minutes
- **Pipeline Duration**: ~15 minutes
- **Test Coverage**: >80%
- **Change Failure Rate**: <5%

---

**Last Updated**: October 12, 2025
**Status**: Production Ready ✅
