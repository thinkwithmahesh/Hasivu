# HASIVU Platform - Integration Tests Documentation

## Overview

Comprehensive integration tests covering all critical user journeys and system workflows across multiple business domains (epics).

## Test Suites

### 1. Order to Payment Flow (`order-payment-flow.integration.test.ts`)

**Purpose**: Tests complete order-to-payment workflow

**Coverage**:
- Order creation and validation
- Payment processing (success/failure)
- Payment retry mechanisms
- Order modifications with additional payments
- Bulk order processing
- Concurrent order/payment load
- Cross-epic data consistency

**Test Scenarios**:
1. Complete order-to-payment flow (happy path)
2. Payment failure and successful retry
3. Order modification with additional payment
4. Bulk order processing (5+ orders)
5. Concurrent load (10+ simultaneous orders)
6. Cross-epic data consistency verification

**Performance Targets**:
- Order creation: < 5 seconds
- Payment processing: < 3 seconds
- Total flow: < 10 seconds
- Concurrent operations: < 1 second per operation

### 2. RFID Delivery Verification (`rfid-delivery.integration.test.ts`)

**Purpose**: Tests RFID-based delivery verification system

**Coverage**:
- RFID card registration and activation
- Delivery verification with card scanning
- Reader status and connectivity
- Failed verification handling
- Multiple deliveries per student
- Photo verification support
- Complete audit trail

**Test Scenarios**:
1. Successful delivery verification with RFID scan
2. Invalid/inactive card rejection
3. RFID reader status monitoring
4. Multiple deliveries same day
5. Delivery with photo evidence
6. RFID card lifecycle management
7. Complete audit trail verification
8. Order-to-delivery integration

**Security Features**:
- Card validation before verification
- Reader status checks
- GPS coordinates tracking
- Photo evidence storage
- Complete audit logging

### 3. Security Integration (`security.integration.test.ts`)

**Purpose**: Comprehensive security testing

**Coverage**:
- Authentication & password hashing (bcrypt)
- Role-Based Access Control (RBAC)
- SQL injection prevention
- XSS attack prevention
- Unauthorized access prevention
- Session security management
- Input validation
- Data encryption
- Audit logging for security events
- CSRF prevention infrastructure

**Test Scenarios**:
1. Password hashing and verification (bcrypt)
2. Role-based access control enforcement
3. SQL injection attack prevention
4. XSS attack prevention
5. Unauthorized access blocking
6. Secure session management
7. Input validation and sanitization
8. Data encryption verification
9. Security event audit logging
10. CSRF token infrastructure

**Security Standards**:
- Bcrypt password hashing (cost factor: 12)
- JWT token-based authentication
- Role-based authorization
- Parameterized queries (Prisma ORM)
- Input sanitization at presentation layer
- Complete audit trail for security events

## Running Integration Tests

### Prerequisites

1. **Database**: SQLite test database (auto-configured)
2. **Environment**: `.env.integration` file with test configuration
3. **Dependencies**: All npm packages installed

### Commands

```bash
# Run all integration tests
npm run test:integration

# Run specific test suite
npm test tests/integration/order-payment-flow.integration.test.ts

# Run with coverage
npm run test:coverage -- --testPathPattern=integration

# Run in watch mode
npm run test:watch -- --testPathPattern=integration
```

### Environment Setup

Create `.env.integration` file:

```env
# Database
DATABASE_URL="file:./test.db"

# JWT
JWT_SECRET="test_jwt_secret_key_for_integration_tests"
SESSION_SECRET="test_session_secret_key"

# Test Configuration
TEST_SERVER_PORT=3001
TEST_SERVER_HOST="localhost"

# Redis (optional)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_DB=1

# AWS (optional, for S3/SES tests)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="test-key"
AWS_SECRET_ACCESS_KEY="test-secret"
```

## Test Data Management

### Setup

Each test suite creates its own isolated test data:
- Schools, users, menu items
- RFID cards and readers
- Orders and payments
- Sessions and audit logs

### Cleanup

Automatic cleanup after each test and test suite:
- `beforeEach`: Cleans relevant tables
- `afterAll`: Complete cleanup and disconnect

### Data Isolation

Tests use unique identifiers (UUIDs) to prevent conflicts:
- School codes: `SCHOOL_${uuid}`
- User emails: `user-${uuid}@test.com`
- Order numbers: `ORD-${timestamp}`

## Test Architecture

### Structure

```
tests/
├── integration/
│   ├── order-payment-flow.integration.test.ts    # 240+ lines, 6 tests
│   ├── rfid-delivery.integration.test.ts         # 485+ lines, 8 tests
│   ├── security.integration.test.ts              # 515+ lines, 10 tests
│   └── README.md                                 # This file
├── setup-integration.ts                          # Shared test utilities
└── globalSetup.ts                                # Global test configuration
```

### Test Utilities

Located in `setup-integration.ts`:
- `setupIntegrationTests()`: Initialize test environment
- `teardownIntegrationTests()`: Cleanup after tests
- `cleanTestDatabase()`: Clean all test data
- `generateTestJWT()`: Create test JWT tokens
- `IntegrationTestConfig`: Test configuration

## Coverage Goals

### Current Coverage

- **Order to Payment**: 6 test scenarios
- **RFID Delivery**: 8 test scenarios
- **Security**: 10 test scenarios
- **Total**: 24 comprehensive integration tests

### Target Metrics

- **Integration Test Coverage**: ≥ 70% (target: 75%)
- **Critical Path Coverage**: 100%
- **Cross-Epic Workflows**: 100%
- **Security Tests**: Comprehensive

## Performance Benchmarks

### Order to Payment Flow

| Metric | Target | Typical |
|--------|--------|---------|
| Order Creation | < 5s | ~2s |
| Payment Processing | < 3s | ~1.5s |
| Total Flow | < 10s | ~5s |
| Concurrent (10) | < 1s/op | ~0.5s/op |

### RFID Delivery

| Metric | Target | Typical |
|--------|--------|---------|
| Card Scan | < 1s | ~0.3s |
| Verification | < 2s | ~0.8s |
| Photo Upload | < 5s | ~2s |

### Security Tests

| Metric | Target | Typical |
|--------|--------|---------|
| Password Hash | < 500ms | ~200ms |
| JWT Generation | < 100ms | ~50ms |
| Session Check | < 200ms | ~100ms |

## Continuous Integration

### GitHub Actions Integration

```yaml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        run: npm run test:integration
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Troubleshooting

### Common Issues

1. **Database Lock**: SQLite file locked
   - Solution: Ensure previous tests cleaned up properly
   - Run: `rm test.db` and retry

2. **Timeout Errors**: Tests taking too long
   - Solution: Increase Jest timeout
   - In test: `test('name', async () => {...}, 60000)`

3. **Port Already in Use**: Test server can't start
   - Solution: Kill existing process
   - Run: `lsof -ti:3001 | xargs kill -9`

4. **Connection Errors**: Can't connect to database
   - Solution: Check DATABASE_URL in .env.integration
   - Verify file permissions

### Debug Mode

Enable verbose logging:

```bash
DEBUG=* npm run test:integration
```

## Best Practices

### Writing Integration Tests

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data
3. **Assertions**: Use meaningful expect statements
4. **Logging**: Add console.log for debugging
5. **Performance**: Monitor test execution time

### Test Organization

1. **Naming**: Use descriptive test names
2. **Grouping**: Group related tests in describe blocks
3. **Setup**: Use beforeAll/beforeEach appropriately
4. **Comments**: Document complex test scenarios

### Performance Optimization

1. **Parallel Execution**: Use Promise.all where possible
2. **Minimal Data**: Create only necessary test data
3. **Connection Pooling**: Reuse database connections
4. **Selective Cleanup**: Clean only relevant data

## Contributing

### Adding New Tests

1. Create test file: `tests/integration/new-feature.integration.test.ts`
2. Follow existing pattern (setup/teardown/tests)
3. Add to this README
4. Update coverage targets
5. Run tests locally before committing

### Code Review Checklist

- [ ] Tests are isolated and independent
- [ ] Proper cleanup in afterAll/afterEach
- [ ] Performance targets met
- [ ] Error cases covered
- [ ] Documentation updated
- [ ] No console.error in passing tests

## Future Enhancements

### Planned Additions

1. **Notification Integration Tests**
   - WhatsApp message delivery
   - Email notification sending
   - Push notification delivery

2. **Menu Management Tests**
   - Menu plan creation and approval
   - Daily menu publishing
   - Menu item availability

3. **Analytics Integration Tests**
   - Report generation
   - Data aggregation
   - Performance metrics

4. **Subscription Management Tests**
   - Subscription creation
   - Billing cycle processing
   - Payment retries

## Support

For issues or questions:
- Check troubleshooting section above
- Review existing test patterns
- Contact: platform@hasivu.com

## License

MIT License - See LICENSE file for details
