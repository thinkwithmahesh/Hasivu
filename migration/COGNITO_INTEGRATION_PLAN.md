# AWS Cognito Integration Plan - HASIVU Platform

## **🔐 COGNITO MIGRATION STRATEGY**

This document outlines the complete strategy for migrating from custom JWT authentication to AWS Cognito User Pool integration.

## **Current vs. Target Authentication Architecture**

### **Current State (Express + Custom JWT)**

```typescript
// Current Authentication Flow
1. User registers → bcrypt hash password → Store in database
2. User logs in → Compare bcrypt hash → Generate custom JWT
3. Request authentication → Validate custom JWT → Extract user data
4. Session management → Redis-based sessions with TTL
5. Password reset → Custom email workflow → Update database
```

### **Target State (Lambda + AWS Cognito)**

```typescript
// Target Authentication Flow
1. User registers → Cognito.signUp() → Store additional data in database
2. User logs in → Cognito.initiateAuth() → Return Cognito tokens
3. Request authentication → API Gateway validates Cognito JWT → Lambda receives user claims
4. Session management → Cognito token refresh workflow
5. Password reset → Cognito.forgotPassword() → Cognito handles email workflow
```

## **Phase 1: Cognito User Pool Configuration**

### **1.1 User Pool Settings**

```json
{
  "poolName": "hasivu-platform-users",
  "policies": {
    "passwordPolicy": {
      process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_1: 8,
      "requireUppercase": true,
      "requireLowercase": true,
      "requireNumbers": true,
      "requireSymbols": true,
      process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_2: 7
    }
  },
  "autoVerifiedAttributes": ["email"],
  "aliasAttributes": ["email"],
  "usernameConfiguration": {
    "caseSensitive": false
  },
  "verificationMessageTemplate": {
    "emailSubject": "HASIVU Platform - Verify your account",
    "emailMessage": "Welcome to HASIVU Platform! Your verification code is {####}",
    "defaultEmailOption": "CONFIRM_WITH_CODE"
  },
  "mfaConfiguration": "OFF",
  "accountRecoverySetting": {
    "recoveryMechanisms": [
      {
        process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_3: 1,
        "name": "verified_email"
      }
    ]
  }
}
```

### **1.2 Custom Attributes Schema**

```json
{
  "schema": [
    {
      "name": "email",
      "attributeDataType": "String",
      "required": true,
      "mutable": true
    },
    {
      "name": "given_name",
      "attributeDataType": "String",
      "required": true,
      "mutable": true
    },
    {
      "name": "family_name",
      "attributeDataType": "String",
      "required": true,
      "mutable": true
    },
    {
      "name": "school_id",
      "attributeDataType": "String",
      "required": false,
      "mutable": true,
      "developerOnlyAttribute": false
    },
    {
      "name": "role",
      "attributeDataType": "String",
      "required": false,
      "mutable": true,
      "developerOnlyAttribute": false
    },
    {
      "name": "user_type",
      "attributeDataType": "String",
      "required": false,
      "mutable": true,
      "developerOnlyAttribute": false
    }
  ]
}
```

### **1.3 User Pool Client Configuration**

```json
{
  "clientName": "hasivu-platform-client",
  "generateSecret": false,
  "explicitAuthFlows": [
    "ADMIN_NO_SRP_AUTH",
    "USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ],
  "readAttributes": [
    "email",
    "given_name",
    "family_name",
    "custom:school_id",
    "custom:role",
    "custom:user_type",
    "email_verified"
  ],
  "writeAttributes": [
    "given_name",
    "family_name",
    "custom:school_id",
    "custom:role",
    "custom:user_type"
  ],
  process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_4: 1,
  process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_5: 1,
  process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_6: 30,
  "tokenValidityUnits": {
    "accessToken": "hours",
    "idToken": "hours",
    "refreshToken": "days"
  },
  "preventUserExistenceErrors": "ENABLED"
}
```

## **Phase 2: Data Migration Strategy**

### **2.1 User Data Migration Approach**

#### **Option A: Bulk Migration (Recommended for < 1000 users)**

```typescript
async function bulkMigrateUsers() {
  // 1. Export existing users from database
  const existingUsers = await db.user.findMany({
    where: { isActive: true },
  });

  // 2. Create users in Cognito with temporary passwords
  for (const user of existingUsers) {
    try {
      const cognitoResponse = await cognito.adminCreateUser({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: user.email,
        UserAttributes: [
          { Name: 'email', Value: user.email },
          { Name: 'given_name', Value: user.firstName },
          { Name: 'family_name', Value: user.lastName },
          { Name: 'custom:school_id', Value: user.schoolId },
          { Name: 'custom:role', Value: user.role },
          { Name: 'email_verified', Value: 'true' },
        ],
        TemporaryPassword: generateTemporaryPassword(),
        MessageAction: 'RESEND', // Send welcome email
      });

      // 3. Update local database with Cognito user ID
      await db.user.update({
        where: { id: user.id },
        data: {
          cognitoUserId: cognitoResponse.User?.Username,
          migrationStatus: 'migrated',
          migrationDate: new Date(),
        },
      });
    } catch (error) {
      await db.user.update({
        where: { id: user.id },
        data: {
          migrationStatus: 'failed',
          migrationError: error.message,
        },
      });
    }
  }
}
```

#### **Option B: Lazy Migration (Recommended for > 1000 users)**

```typescript
// During login, migrate user if not already migrated
async function lazyMigrateUser(email: string, password: string) {
  const user = await db.user.findFirst({ where: { email } });

  if (!user.cognitoUserId) {
    // User not migrated yet, validate against old system
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

    if (isValidPassword) {
      // Migrate user to Cognito
      await cognito.adminCreateUser({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        TemporaryPassword: password,
        UserAttributes: [
          /* ... */
        ],
        MessageAction: 'SUPPRESS', // No welcome email
      });

      // Set permanent password
      await cognito.adminSetUserPassword({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        Password: password,
        Permanent: true,
      });

      // Continue with normal Cognito login
      return await cognito.initiateAuth({
        ClientId: COGNITO_CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: { USERNAME: email, PASSWORD: password },
      });
    }
  }

  // User already migrated or invalid password
  return await cognito.initiateAuth({
    ClientId: COGNITO_CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
}
```

### **2.2 Database Schema Updates**

```sql
-- Add Cognito integration columns
ALTER TABLE users
ADD COLUMN cognito_user_id VARCHAR(255) UNIQUE,
ADD COLUMN migration_status ENUM('pending', 'migrated', 'failed') DEFAULT 'pending',
ADD COLUMN migration_date TIMESTAMP NULL,
ADD COLUMN migration_error TEXT NULL;

-- Create index for performance
CREATE INDEX idx_users_cognito_user_id ON users(cognito_user_id);
CREATE INDEX idx_users_migration_status ON users(migration_status);

-- Create migration tracking table
CREATE TABLE user_migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    cognito_user_id VARCHAR(255),
    old_auth_method ENUM('jwt', 'session') NOT NULL,
    new_auth_method VARCHAR(50) DEFAULT 'cognito',
    migration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    migration_status ENUM('success', 'failed', 'partial') NOT NULL,
    error_message TEXT,
    migration_metadata JSON,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_migration_status (migration_status),
    INDEX idx_migration_date (migration_date)
);
```

## **Phase 3: API Gateway Cognito Integration**

### **3.1 API Gateway Authorizer Configuration**

```yaml
# serverless.yml authorizer configuration
httpApi:
  authorizers:
    cognitoAuthorizer:
      type: jwt
      identitySource: $request.header.Authorization
      audienceUrls:
        - ${env:COGNITO_CLIENT_ID}
      issuerUrl: https://cognito-idp.${env:AWS_REGION}.amazonaws.com/${env:COGNITO_USER_POOL_ID}
```

### **3.2 Lambda Function Authorization**

```typescript
// Extract user information from API Gateway event
export const protectedHandler = async (event: APIGatewayProxyEvent) => {
  // User information automatically injected by API Gateway
  const userId = event.requestContext.authorizer?.claims?.sub;
  const email = event.requestContext.authorizer?.claims?.email;
  const role = event.requestContext.authorizer?.claims?.['custom:role'];
  const schoolId =
    event.requestContext.authorizer?.claims?.['custom:school_id'];

  // Use user information in business logic
  const user = await db.user.findFirst({
    where: { cognitoUserId: userId },
  });

  // Proceed with protected operation
  return createResponse(200, { user, message: 'Access granted' });
};
```

## **Phase 4: Frontend Integration Changes**

### **4.1 Authentication Service Update**

```typescript
// New AuthService using AWS Cognito
export class AuthService {
  private cognitoConfig = {
    region: process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_7,
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
    clientId: process.env.REACT_APP_COGNITO_CLIENT_ID,
  };

  async login(email: string, password: string): Promise<AuthResult> {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();

      // Store tokens in secure storage
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('idToken', data.tokens.idToken);

      return { success: true, user: data.user };
    }

    throw new Error('Authentication failed');
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('idToken', data.tokens.idToken);

      return data.tokens.accessToken;
    }

    throw new Error('Token refresh failed');
  }

  async logout(): Promise<void> {
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('idToken');
  }

  getAuthHeaders(): Record<string, string> {
    const accessToken = localStorage.getItem('accessToken');

    return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  }
}
```

### **4.2 HTTP Interceptor Updates**

```typescript
// Update Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const authService = new AuthService();
        const newToken = await authService.refreshToken();

        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## **Phase 5: Testing Strategy**

### **5.1 Unit Testing Cognito Integration**

```typescript
// Mock Cognito for unit tests
jest.mock('@aws-sdk/client-cognito-identity-provider', () => ({
  CognitoIdentityProvider: jest.fn().mockImplementation(() => ({
    signUp: jest.fn(),
    initiateAuth: jest.fn(),
    adminCreateUser: jest.fn(),
    adminSetUserPassword: jest.fn(),
  })),
}));

describe('Cognito Authentication', () => {
  test('should register user successfully', async () => {
    // Test implementation
  });

  test('should handle authentication errors', async () => {
    // Test implementation
  });

  test('should refresh tokens correctly', async () => {
    // Test implementation
  });
});
```

### **5.2 Integration Testing**

```typescript
// Integration tests with actual Cognito test pool
describe('Cognito Integration Tests', () => {
  beforeAll(async () => {
    // Set up test Cognito User Pool
    testUserPool = await createTestUserPool();
  });

  test('end-to-end user registration flow', async () => {
    // Test complete registration process
  });

  test('login with migrated user', async () => {
    // Test login for users migrated from old system
  });

  afterAll(async () => {
    // Clean up test resources
    await deleteTestUserPool(testUserPool.Id);
  });
});
```

## **Phase 6: Rollback Strategy for Cognito Migration**

### **6.1 Emergency Rollback**

```typescript
// Fallback authentication service
class FallbackAuthService {
  async authenticate(token: string): Promise<User | null> {
    try {
      // Try Cognito first
      return await this.authenticateWithCognito(token);
    } catch (cognitoError) {
      // Fall back to old JWT validation
      return await this.authenticateWithJWT(token);
    }
  }
}
```

### **6.2 Data Rollback**

```sql
-- Rollback user data if migration fails
UPDATE users
SET cognito_user_id = NULL,
    migration_status = 'pending',
    migration_date = NULL,
    migration_error = NULL
WHERE migration_status = 'failed';

-- Remove failed Cognito users (if needed)
-- This would be done via AWS CLI or SDK, not SQL
```

## **Phase 7: Monitoring & Observability**

### **7.1 CloudWatch Metrics**

```typescript
// Custom metrics for monitoring Cognito integration
const cloudWatch = new CloudWatch();

const putMetric = async (metricName: string, value: number, unit = 'Count') => {
  await cloudWatch
    .putMetricData({
      Namespace: 'HASIVU/Authentication',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date(),
        },
      ],
    })
    .promise();
};

// Track key metrics
await putMetric(process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_8, 1);
await putMetric(process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_9, 1);
await putMetric(process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_10, 1);
await putMetric(process.env.MIGRATION_COGNITO_INTEGRATION_PLAN_PASSWORD_11, 1);
```

### **7.2 Alerting Setup**

```yaml
# CloudWatch Alarms
CognitoLoginFailureRate:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: High-Cognito-Login-Failure-Rate
    MetricName: CognitoLoginFailure
    Namespace: HASIVU/Authentication
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 2
    Threshold: 10
    ComparisonOperator: GreaterThanThreshold
    TreatMissingData: notBreaching

TokenRefreshFailureRate:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: High-Token-Refresh-Failure-Rate
    MetricName: TokenRefreshFailure
    Namespace: HASIVU/Authentication
    Statistic: Sum
    Period: 300
    EvaluationPeriods: 1
    Threshold: 5
    ComparisonOperator: GreaterThanThreshold
```

## **Success Criteria & Validation**

### **Authentication Flow Validation**

- ✅ User registration creates Cognito user and database entry
- ✅ Login returns valid Cognito tokens
- ✅ Token refresh works seamlessly
- ✅ API Gateway properly validates Cognito tokens
- ✅ Lambda functions receive correct user claims
- ✅ Logout invalidates tokens in Cognito
- ✅ Password reset flow works end-to-end
- ✅ Migrated users can login without issues

### **Security Validation**

- ✅ No plaintext passwords stored anywhere
- ✅ Tokens follow AWS security best practices
- ✅ Session management via Cognito tokens only
- ✅ Proper RBAC implementation with Cognito attributes
- ✅ Email verification working correctly
- ✅ Password policy enforcement active

### **Performance Validation**

- ✅ Authentication latency < 500ms
- ✅ Token refresh latency < 200ms
- ✅ API Gateway authorization latency < 50ms
- ✅ No impact on existing API performance
- ✅ Database query performance maintained

This comprehensive Cognito integration plan ensures a smooth transition from custom JWT to AWS Cognito while maintaining security, performance, and user experience standards.
