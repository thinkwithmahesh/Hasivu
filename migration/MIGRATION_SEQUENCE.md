# HASIVU Platform - Serverless Migration Sequence

## **🚨 CRITICAL ARCHITECTURAL MIGRATION PLAN**

This document outlines the complete sequence for migrating from Express.js monolith to AWS Lambda serverless architecture with AWS Cognito authentication.

## **Phase 1: Foundation Setup (Week 1)**

### **Day 1-2: AWS Infrastructure Setup**

#### **1.1 AWS Cognito User Pool Creation**
```bash
# Create Cognito User Pool
aws cognito-idp create-user-pool \
  --pool-name "hasivu-platform-users" \
  --policies PasswordPolicy=process.env.MIGRATION_MIGRATION_SEQUENCE_PASSWORD_1 \
  --auto-verified-attributes email \
  --alias-attributes email \
  --schema file://migration/cognito-schema.json
```

#### **1.2 Environment Configuration**
```bash
# Update environment variables
echo "COGNITO_USER_POOL_ID=<user_pool_id>" >> .env
echo "COGNITO_CLIENT_ID=<client_id>" >> .env
echo process.env.MIGRATION_MIGRATION_SEQUENCE_PASSWORD_2 >> .env
```

### **Day 3-5: Lambda Function Development**

#### **1.3 Install Serverless Dependencies**
```bash
npm install --save-dev serverless @serverless/typescript serverless-offline
npm install --save @aws-sdk/client-cognito-identity-provider @aws-sdk/client-secrets-manager
npm install --save aws-lambda @types/aws-lambda
```

#### **1.4 Create Lambda Function Structure**
```
src/functions/
├── auth/
│   ├── register.ts
│   ├── login.ts
│   ├── refresh.ts
│   ├── profile.ts
│   └── logout.ts
├── health/
│   ├── basic.ts
│   ├── detailed.ts
│   ├── ready.ts
│   └── live.ts
├── rfid/
│   ├── create-card.ts
│   ├── verify-card.ts
│   └── get-card.ts
└── shared/
    ├── database.service.ts
    ├── logger.service.ts
    ├── validation.service.ts
    └── cognito.service.ts
```

## **Phase 2: Service Layer Migration (Week 2)**

### **Day 1-3: Shared Services Development**

#### **2.1 Database Service Migration**
- **Source**: `src/services/database.service.ts` (Express)
- **Target**: `src/functions/shared/database.service.ts` (Lambda)
- **Changes**: Connection pooling optimized for Lambda cold starts

#### **2.2 Logger Service Migration**
- **Source**: `src/services/logger.service.ts` (Express)
- **Target**: `src/functions/shared/logger.service.ts` (Lambda)
- **Changes**: CloudWatch integration, structured logging

#### **2.3 Validation Service Migration**
- **Source**: `src/middleware/validation.middleware.ts` (Express)
- **Target**: `src/functions/shared/validation.service.ts` (Lambda)
- **Changes**: Standalone validation without Express middleware

### **Day 4-7: Authentication Service Migration**

#### **2.4 Cognito Integration Service**
```typescript
// New service: src/functions/shared/cognito.service.ts
export class CognitoService {
  async signUp(user: UserRegistration): Promise<CognitoResponse>
  async signIn(credentials: LoginCredentials): Promise<AuthResult>
  async refreshToken(refreshToken: string): Promise<TokenResponse>
  async signOut(accessToken: string): Promise<void>
  async updateUserAttributes(userId: string, attributes: UserAttributes): Promise<void>
}
```

## **Phase 3: Function-by-Function Migration (Week 3-4)**

### **Migration Priority Order**

#### **Priority 1: Core Authentication (Week 3, Days 1-2)**
1. **Health Check Functions** (Lowest risk)
   - `/health` → `src/functions/health/basic.ts`
   - `/health/detailed` → `src/functions/health/detailed.ts`
   - `/health/ready` → `src/functions/health/ready.ts`
   - `/health/live` → `src/functions/health/live.ts`

2. **User Registration & Login** (Medium risk)
   - `POST /auth/register` → `src/functions/auth/register.ts`
   - `POST /auth/login` → `src/functions/auth/login.ts`
   - `POST /auth/refresh` → `src/functions/auth/refresh.ts`

#### **Priority 2: User Management (Week 3, Days 3-5)**
3. **User Profile Functions**
   - `GET /auth/me` → `src/functions/auth/profile.ts`
   - `PATCH /auth/profile` → `src/functions/auth/update-profile.ts`
   - `PATCH /auth/change-password` → `src/functions/auth/change-password.ts`
   - `POST /auth/logout` → `src/functions/auth/logout.ts`

#### **Priority 3: Business Logic (Week 4)**
4. **RFID Functions**
   - `POST /rfid/cards` → `src/functions/rfid/create-card.ts`
   - `POST /rfid/verify` → `src/functions/rfid/verify-card.ts`
   - `GET /rfid/cards/:cardNumber` → `src/functions/rfid/get-card.ts`

5. **Payment Functions**
   - `POST /payment/orders` → `src/functions/payment/create-order.ts`
   - `POST /payment/verify` → `src/functions/payment/verify.ts`
   - `POST /payment/webhook` → `src/functions/payment/webhook.ts`

6. **Notification Functions**
   - `POST /notification/send` → `src/functions/notification/send.ts`
   - `GET /notification` → `src/functions/notification/get-notifications.ts`
   - `POST /notification/webhooks/whatsapp` → `src/functions/notification/whatsapp-webhook.ts`

## **Phase 4: Testing & Validation (Week 5)**

### **4.1 Lambda Function Testing**
```bash
# Install testing dependencies
npm install --save-dev @serverless/test aws-lambda-mock-context

# Run unit tests for Lambda functions
npm run test:lambda

# Run integration tests with local Cognito
npm run test:integration:lambda
```

### **4.2 End-to-End Testing Strategy**
```bash
# Start serverless offline
serverless offline start

# Run E2E tests against local Lambda functions
npm run test:e2e:lambda

# Test with staging Cognito User Pool
npm run test:staging
```

## **Phase 5: Deployment & Cutover (Week 6)**

### **5.1 Staging Deployment**
```bash
# Deploy to staging environment
serverless deploy --stage staging

# Smoke tests against staging
npm run test:smoke:staging

# Load testing
npm run test:load:staging
```

### **5.2 Production Deployment**
```bash
# Deploy to production
serverless deploy --stage production

# Blue-green deployment with API Gateway stages
aws apigateway update-stage --rest-api-id <api-id> --stage-name production --patch-ops op=replace,path=/deploymentId,value=<new-deployment-id>
```

### **5.3 DNS Cutover**
```bash
# Update Route 53 record to point to new API Gateway
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> --change-batch file://dns-cutover.json
```

## **Rollback Strategy**

### **Emergency Rollback (< 5 minutes)**
```bash
# Immediate DNS rollback to Express server
aws route53 change-resource-record-sets --hosted-zone-id <zone-id> --change-batch file://dns-rollback.json

# Restart Express server if needed
pm2 restart hasivu-platform
```

### **Partial Rollback (Function-level)**
```bash
# Rollback specific Lambda functions
serverless rollback function --function <function-name> --stage production

# API Gateway stage rollback
aws apigateway update-stage --rest-api-id <api-id> --stage-name production --patch-ops op=replace,path=/deploymentId,value=<previous-deployment-id>
```

### **Complete Infrastructure Rollback**
```bash
# Remove entire serverless stack
serverless remove --stage production

# Restore Express routes
git checkout express-backup-branch
npm run build && npm start
```

## **Data Migration Strategy**

### **User Data Migration**
```sql
-- Migrate existing users to include Cognito references
ALTER TABLE users ADD COLUMN cognito_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN migration_status ENUM('pending', 'migrated', 'failed') DEFAULT 'pending';

-- Create migration tracking table
CREATE TABLE user_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cognito_user_id VARCHAR(255),
    migration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('success', 'failed') NOT NULL,
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### **Session Migration**
- **Current**: Redis sessions with custom JWT
- **Target**: AWS Cognito tokens only
- **Strategy**: Force logout all users during cutover

## **Monitoring & Observability**

### **CloudWatch Setup**
```yaml
# Custom CloudWatch metrics
- LambdaFunctionErrors
- CognitoSignInErrors
- DatabaseConnectionErrors
- APIGatewayLatency
- CogniteTokenRefreshRate
```

### **Alerting Thresholds**
- **Error Rate**: > 1% (5-minute window)
- **Latency**: > 3s (99th percentile)
- **Cognito Failures**: > 5% (5-minute window)
- **Database Timeouts**: > 0 (immediate alert)

## **Success Criteria**

### **Performance Metrics**
- **API Response Time**: < 500ms (95th percentile)
- **Lambda Cold Start**: < 1s
- **Error Rate**: < 0.1%
- **Availability**: > 99.9%

### **Security Validation**
- **Cognito Integration**: All authentication flows working
- **JWT Validation**: Proper token validation at API Gateway
- **RBAC**: Role-based access control functional
- **Session Management**: Secure token refresh working

### **Business Continuity**
- **Zero Data Loss**: All existing user data preserved
- **Feature Parity**: All Express functionality replicated
- **Mobile App Compatibility**: No breaking changes to API contracts
- **Admin Dashboard**: All admin functions operational

## **Risk Mitigation**

### **High-Risk Areas**
1. **Database Connections**: Lambda connection pooling vs. Express persistent connections
2. **File Uploads**: S3 integration vs. local file handling
3. **WebSocket Connections**: API Gateway WebSocket vs. Socket.IO
4. **Background Jobs**: Lambda scheduled functions vs. Node.js cron jobs

### **Mitigation Strategies**
1. **Database**: Implement RDS Proxy for connection pooling
2. **File Uploads**: Complete S3 integration before cutover
3. **WebSocket**: Deploy API Gateway WebSocket alongside Lambda functions
4. **Background Jobs**: Convert to EventBridge scheduled Lambda invocations

## **Communication Plan**

### **Stakeholder Updates**
- **Week 1**: Infrastructure setup complete
- **Week 3**: Authentication migration complete
- **Week 5**: Full migration testing complete
- **Week 6**: Production cutover complete

### **User Communication**
- **T-7 days**: Advance notice of maintenance window
- **T-24 hours**: Maintenance reminder with downtime estimate
- **T-1 hour**: Final maintenance notification
- **T+0**: Migration complete confirmation

## **Post-Migration Tasks**

### **Cleanup (Week 7)**
```bash
# Remove old Express routes after successful migration
git branch express-backup-$(date +%Y%m%d)
rm -rf src/routes/
rm -rf src/middleware/
rm -rf src/services/auth.service.ts

# Update package.json to remove Express dependencies
npm uninstall express express-rate-limit morgan helmet cors compression

# Archive migration artifacts
tar -czf migration-artifacts-$(date +%Y%m%d).tar.gz migration/
```

### **Performance Optimization**
- **Lambda Memory Tuning**: Optimize based on CloudWatch metrics
- **Connection Pool Sizing**: Adjust based on actual usage patterns
- **Caching Strategy**: Implement Lambda function response caching
- **Cost Optimization**: Review and optimize Lambda pricing tiers

This migration plan ensures minimal downtime, comprehensive testing, and full rollback capabilities while achieving the architectural alignment required for the HASIVU Platform.