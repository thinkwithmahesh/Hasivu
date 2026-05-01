# Hasivu Production Security Checklist

> **CRITICAL**: This repository's git history contains `.env` files with real secrets.
> Before any production deployment, ALL secrets must be rotated.

## Pre-Launch Secret Rotation

### 1. JWT Secrets (MANDATORY)

```bash
# Generate new secrets (run twice for JWT_SECRET and JWT_REFRESH_SECRET)
openssl rand -base64 48
```

- [ ] `JWT_SECRET` — rotated, 32+ characters
- [ ] `JWT_REFRESH_SECRET` — rotated, 32+ characters

### 2. Database Credentials (MANDATORY)

- [ ] `POSTGRES_PASSWORD` — changed from dev default
- [ ] `POSTGRES_USER` — changed from dev default
- [ ] `DATABASE_URL` — uses new credentials

### 3. Payment Gateway (MANDATORY before accepting payments)

- [ ] `RAZORPAY_KEY_ID` — production key (not test)
- [ ] `RAZORPAY_KEY_SECRET` — production secret
- [ ] `RAZORPAY_WEBHOOK_SECRET` — production webhook secret

### 4. Encryption (MANDATORY)

```bash
openssl rand -hex 32
```

- [ ] `ENCRYPTION_KEY` — unique per environment

### 5. AWS Credentials (if using Lambda/CloudWatch)

- [ ] `AWS_ACCESS_KEY_ID` — IAM user with least privilege
- [ ] `AWS_SECRET_ACCESS_KEY` — rotated from any historically committed value

### 6. Email/SMTP (if notifications enabled)

- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

## Environment Verification Commands

```bash
# Verify no secrets in current .env match the git history
git log --all -p -- .env | grep -E '(JWT_SECRET|RAZORPAY|POSTGRES_PASSWORD)' | head -20

# Verify .gitignore blocks sensitive files
cat .gitignore | grep -E '\.env'
```

## Infrastructure Checklist

- [ ] PostgreSQL is running with TLS in production
- [ ] Redis is configured with `requirepass` in production
- [ ] CORS_ORIGINS is set to the exact production domain (not `*`)
- [ ] NODE_ENV=production is set in all production containers
- [ ] HTTPS is enforced via nginx/load balancer
- [ ] Rate limiting is configured per deployment tier
