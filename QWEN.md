# HASIVU Platform - Qwen Code Context

## Project Overview

The HASIVU Platform is a comprehensive school food service management system with RFID-based delivery verification. It's built as a production-ready platform using Node.js with TypeScript, Express.js, PostgreSQL (via Prisma), Redis, and deployed on AWS infrastructure.

### Key Features
- **RFID Delivery Verification**: Real-time delivery confirmation using RFID technology
- **Payment Processing**: Razorpay integration with subscription billing
- **Multi-channel Notifications**: WhatsApp, email, and push notifications
- **Multi-tenant Architecture**: Support for multiple schools
- **Comprehensive Analytics**: Dashboards for all stakeholders

### Technology Stack
- **Backend**: Node.js 18.19+, TypeScript, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens
- **Infrastructure**: AWS (ECS Fargate, RDS, ElastiCache, S3, etc.)
- **DevOps**: Docker, Terraform, GitHub Actions

## Project Structure

```
hasivu-platform/
├── src/                    # Application source code
│   ├── config/            # Configuration files
│   ├── functions/         # Lambda functions
│   ├── middleware/        # Express middleware
│   ├── repositories/      # Data access layer
│   ├── routes/            # API route definitions
│   ├── scripts/           # Utility scripts
│   ├── services/          # Business logic
│   ├── shared/            # Shared utilities
│   ├── testing/           # Testing utilities
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── validation/        # Input validation
│   └── index.ts           # Application entry point
├── docs/                  # Documentation
│   ├── prd/              # Product requirements documents
│   ├── stories/          # User stories
│   └── architecture.md   # System architecture
├── scripts/               # Automation scripts
├── infrastructure/        # Infrastructure as Code
├── tests/                 # Test suites
├── .bmad-core/           # BMad Method AI agent framework
└── package.json          # Dependencies and scripts
```

## Development Guide

### Prerequisites
- Node.js 18.19.0+
- PostgreSQL 15+
- Redis 7+
- Docker 20.10+
- AWS CLI 2.0+

### Quick Start
```bash
# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
# Edit .env with your configuration

# Start development infrastructure
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Run database migrations
npm run db:migrate

# Seed database with test data
npm run db:seed

# Start development server
npm run dev
```

### Development Commands
```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test              # All tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:coverage    # Coverage report

# Code quality
npm run lint             # ESLint
npm run lint:fix         # Auto-fix linting issues
npm run format           # Prettier formatting
npm run type-check       # TypeScript compilation

# Database operations
npm run db:migrate       # Run migrations
npm run db:migrate:reset # Reset and re-run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open database GUI
```

## Deployment Guide

### Production Deployment
```bash
# Deploy using deployment script
./scripts/deploy.sh --environment production

# Or manual deployment
./scripts/deploy.sh --environment production --verbose
```

### Environment Configuration
- **Development**: Local Docker setup
- **Staging**: AWS staging environment
- **Production**: AWS production environment

## Testing

The platform includes comprehensive testing at multiple levels:
- **Unit Tests**: Component-level testing
- **Integration Tests**: Service integration testing
- **End-to-End Tests**: Full system workflow testing
- **Performance Tests**: Load and stress testing
- **Smoke Tests**: Basic functionality verification

### Running Tests
```bash
# Run all tests
npm run test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Performance testing
npm run test:performance:dev
npm run test:performance:staging
npm run test:performance:production
```

## BMad Method Integration

The platform integrates with the BMad Method, an AI agent framework for software development. The `.bmad-core/` directory contains:

- **Agents**: Specialized AI agents for different roles (developer, QA, architect, etc.)
- **Tasks**: Predefined workflows for common development activities
- **Templates**: Standard document templates

### Available BMad Agents
- `analyst`: Requirements analysis
- `architect`: System architecture design
- `dev`: Software development
- `qa`: Quality assurance and testing
- `pm`: Project management
- `po`: Product ownership
- `sm`: Scrum master
- `ux-expert`: User experience design

### Running BMad Agents
```bash
# Check BMad installation status
bmad-method status

# List available expansion packs
bmad-method list:expansions
```

## Key Scripts

The `scripts/` directory contains various automation tools:

1. **Deployment Scripts**
   - `deploy.sh`: Main deployment script
   - `deploy-story-5.2.sh`: Story-specific deployment
   - `migrate-to-production.sh`: Production migration

2. **Validation Scripts**
   - `validate-epic1.js`: Epic 1 validation
   - `validate-production-readiness.sh`: Production readiness check

3. **Monitoring & Health**
   - `healthcheck.js`: Container health check
   - `system-health-monitor.ts`: System monitoring
   - `monitoring-alerting-setup.js`: Alert configuration

4. **QA & Testing**
   - `qa-comprehensive-review.js`: Comprehensive QA review (created during our session)
   - `production-deployment-validation.ts`: Production deployment validation

## API Documentation

The platform exposes a REST API with the following key endpoints:

### Authentication
- `POST /auth/login`: User authentication
- `POST /auth/register`: User registration

### Core Services
- `GET /orders`: List orders
- `POST /orders`: Create order
- `GET /menus`: List available menus
- `GET /products`: List products
- `GET /users/profile`: User profile
- `POST /payments/initialize`: Initialize payment
- `POST /rfid/scan`: Process RFID scan

### WebSocket Events
- `order:updated`: Order status updates
- `delivery:confirmed`: Delivery confirmation

## Infrastructure

The platform is designed for deployment on AWS with the following components:
- **ECS Fargate**: Container orchestration
- **RDS PostgreSQL**: Primary database
- **ElastiCache Redis**: Caching layer
- **S3**: File storage
- **API Gateway**: Request routing
- **CloudWatch**: Monitoring and logging

Infrastructure is managed via Terraform scripts in `infrastructure/terraform/`.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

Follow the code review guidelines and ensure all tests pass before submission.

## Security

The platform implements multiple security measures:
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting
- Data encryption

For security vulnerabilities, contact security@hasivu.com.