#!/usr/bin/env node

/**
 * HASIVU Platform - Complete API Documentation Generator
 * Generates comprehensive OpenAPI 3.0 specification for all 106+ Lambda functions
 * Addresses Epic 7 requirement for 100% API documentation coverage
 */

const fs = require('fs');
const path = require('path');

// Lambda function categories and their endpoints
const API_ENDPOINTS = {
  // Authentication (7 functions)
  authentication: [
    { method: 'POST', path: '/auth/register', func: 'register.ts', summary: 'Register new user' },
    { method: 'POST', path: '/auth/login', func: 'login.ts', summary: 'User login' },
    { method: 'POST', path: '/auth/refresh', func: 'refresh.ts', summary: 'Refresh JWT token' },
    { method: 'GET', path: '/auth/me', func: 'profile.ts', summary: 'Get current user profile' },
    { method: 'POST', path: '/auth/logout', func: 'logout.ts', summary: 'User logout' },
    {
      method: 'PATCH',
      path: '/auth/change-password',
      func: 'change-password.ts',
      summary: 'Change user password',
    },
    {
      method: 'PATCH',
      path: '/auth/profile',
      func: 'update-profile.ts',
      summary: 'Update user profile',
    },
  ],

  // User Management (5 functions)
  userManagement: [
    { method: 'GET', path: '/users', func: 'getUsers.ts', summary: 'Get all users with filtering' },
    { method: 'GET', path: '/users/{id}', func: 'getUserById.ts', summary: 'Get user by ID' },
    {
      method: 'PUT',
      path: '/users/{id}',
      func: 'updateUser.ts',
      summary: 'Update user information',
    },
    {
      method: 'POST',
      path: '/users/bulk-import',
      func: 'bulkImport.ts',
      summary: 'Bulk import users from CSV',
    },
    {
      method: 'POST',
      path: '/users/{id}/children',
      func: 'manageChildren.ts',
      summary: 'Manage parent-child relationships',
    },
  ],

  // Health Check (11 functions)
  healthCheck: [
    { method: 'GET', path: '/health', func: 'basic.ts', summary: 'Basic health check' },
    {
      method: 'GET',
      path: '/health/detailed',
      func: 'detailed.ts',
      summary: 'Detailed health check with dependencies',
    },
    { method: 'GET', path: '/health/ready', func: 'ready.ts', summary: 'Readiness check for K8s' },
    { method: 'GET', path: '/health/live', func: 'live.ts', summary: 'Liveness check for K8s' },
    { method: 'GET', path: '/health/status', func: 'status.ts', summary: 'System status overview' },
    {
      method: 'GET',
      path: '/health/database',
      func: 'database-health.ts',
      summary: 'Database connectivity check',
    },
    {
      method: 'GET',
      path: '/health/comprehensive',
      func: 'comprehensive.ts',
      summary: 'Comprehensive system health',
    },
    {
      method: 'GET',
      path: '/health/dashboard',
      func: 'dashboard.ts',
      summary: 'Health dashboard data',
    },
    {
      method: 'GET',
      path: '/health/system',
      func: 'system-health.ts',
      summary: 'System health metrics',
    },
    {
      method: 'GET',
      path: '/health/system-status',
      func: 'system-status.ts',
      summary: 'Detailed system status',
    },
    {
      method: 'GET',
      path: '/health/check',
      func: 'health-check.ts',
      summary: 'General health check endpoint',
    },
  ],

  // Menu Management (9 functions)
  menuManagement: [
    {
      method: 'GET',
      path: '/menu/items',
      func: 'getMenuItems.ts',
      summary: 'Get menu items with filtering',
    },
    {
      method: 'GET',
      path: '/menu/items/{id}',
      func: 'getMenuItemById.ts',
      summary: 'Get menu item by ID',
    },
    {
      method: 'POST',
      path: '/menu/items',
      func: 'createMenuItem.ts',
      summary: 'Create new menu item',
    },
    {
      method: 'PUT',
      path: '/menu/items/{id}',
      func: 'updateMenuItem.ts',
      summary: 'Update menu item',
    },
    {
      method: 'DELETE',
      path: '/menu/items/{id}',
      func: 'deleteMenuItem.ts',
      summary: 'Delete menu item',
    },
    {
      method: 'GET',
      path: '/menu/search',
      func: 'searchMenuItems.ts',
      summary: 'Search menu items',
    },
    {
      method: 'POST',
      path: '/menu/daily',
      func: 'create-daily-menu.ts',
      summary: 'Create daily menu plan',
    },
    { method: 'POST', path: '/menu/plans', func: 'create-plan.ts', summary: 'Create meal plan' },
    {
      method: 'POST',
      path: '/menu/slots',
      func: 'manage-slots.ts',
      summary: 'Manage meal time slots',
    },
  ],

  // Order Management (5 functions)
  orderManagement: [
    {
      method: 'GET',
      path: '/orders',
      func: 'get-orders.ts',
      summary: 'Get orders with pagination',
    },
    { method: 'GET', path: '/orders/{id}', func: 'get-order.ts', summary: 'Get order by ID' },
    { method: 'POST', path: '/orders', func: 'create-order.ts', summary: 'Create new order' },
    {
      method: 'PUT',
      path: '/orders/{id}',
      func: 'update-order.ts',
      summary: 'Update order details',
    },
    {
      method: 'PATCH',
      path: '/orders/{id}/status',
      func: 'update-status.ts',
      summary: 'Update order status',
    },
  ],

  // RFID Management (9 functions)
  rfidManagement: [
    { method: 'POST', path: '/rfid/cards', func: 'create-card.ts', summary: 'Create RFID card' },
    {
      method: 'GET',
      path: '/rfid/cards/{cardNumber}',
      func: 'get-card.ts',
      summary: 'Get RFID card details',
    },
    {
      method: 'POST',
      path: '/rfid/verify',
      func: 'verify-card.ts',
      summary: 'Verify RFID card for delivery',
    },
    {
      method: 'POST',
      path: '/rfid/delivery/verify',
      func: 'delivery-verification.ts',
      summary: 'RFID delivery verification',
    },
    {
      method: 'POST',
      path: '/rfid/photo/verify',
      func: 'photo-verification.ts',
      summary: 'Photo verification for delivery',
    },
    {
      method: 'POST',
      path: '/rfid/cards/bulk-import',
      func: 'bulk-import-cards.ts',
      summary: 'Bulk import RFID cards',
    },
    {
      method: 'GET',
      path: '/rfid/readers',
      func: 'manage-readers.ts',
      summary: 'Manage RFID readers',
    },
    {
      method: 'GET',
      path: '/rfid/mobile/cards',
      func: 'mobile-card-management.ts',
      summary: 'Mobile RFID card management',
    },
    {
      method: 'GET',
      path: '/rfid/mobile/tracking',
      func: 'mobile-tracking.ts',
      summary: 'Mobile RFID tracking',
    },
  ],

  // Payment Processing (22 functions)
  paymentProcessing: [
    {
      method: 'POST',
      path: '/payment/orders',
      func: 'create-order.ts',
      summary: 'Create payment order',
    },
    {
      method: 'POST',
      path: '/payment/verify',
      func: 'verify.ts',
      summary: 'Verify payment status',
    },
    {
      method: 'POST',
      path: '/payment/webhook',
      func: 'webhook.ts',
      summary: 'Payment gateway webhook',
    },
    {
      method: 'POST',
      path: '/payment/webhook-handler',
      func: 'webhook-handler.ts',
      summary: 'Advanced webhook handler',
    },
    {
      method: 'GET',
      path: '/payment/methods',
      func: 'manage-payment-methods.ts',
      summary: 'Manage payment methods',
    },
    {
      method: 'POST',
      path: '/payment/retry',
      func: 'payment-retry.ts',
      summary: 'Retry failed payments',
    },
    {
      method: 'GET',
      path: '/payment/analytics',
      func: 'payment-analytics.ts',
      summary: 'Payment analytics dashboard',
    },
    {
      method: 'POST',
      path: '/payment/reconciliation',
      func: 'reconciliation.ts',
      summary: 'Payment reconciliation',
    },
    {
      method: 'GET',
      path: '/payment/invoices',
      func: 'invoice-generator.ts',
      summary: 'Generate invoices',
    },
    {
      method: 'POST',
      path: '/payment/invoices/send',
      func: 'invoice-mailer.ts',
      summary: 'Send invoice emails',
    },
    {
      method: 'GET',
      path: '/payment/invoices/templates',
      func: 'invoice-templates.ts',
      summary: 'Manage invoice templates',
    },
    {
      method: 'GET',
      path: '/payment/invoices/analytics',
      func: 'invoice-analytics.ts',
      summary: 'Invoice analytics',
    },
    {
      method: 'POST',
      path: '/payment/pdf/generate',
      func: 'pdf-generator.ts',
      summary: 'Generate payment PDFs',
    },
    {
      method: 'GET',
      path: '/payment/subscriptions',
      func: 'subscription-management.ts',
      summary: 'Manage subscriptions',
    },
    {
      method: 'GET',
      path: '/payment/subscriptions/plans',
      func: 'subscription-plans.ts',
      summary: 'Subscription plans',
    },
    {
      method: 'GET',
      path: '/payment/subscriptions/analytics',
      func: 'subscription-analytics.ts',
      summary: 'Subscription analytics',
    },
    {
      method: 'POST',
      path: '/payment/billing/automation',
      func: 'billing-automation.ts',
      summary: 'Automated billing',
    },
    {
      method: 'POST',
      path: '/payment/dunning',
      func: 'dunning-management.ts',
      summary: 'Dunning management',
    },
    {
      method: 'GET',
      path: '/payment/advanced',
      func: 'advanced-payment.ts',
      summary: 'Advanced payment features',
    },
    {
      method: 'GET',
      path: '/payment/intelligence',
      func: 'advanced-payment-intelligence.ts',
      summary: 'Payment intelligence',
    },
    {
      method: 'GET',
      path: '/payment/ml-insights',
      func: 'ml-payment-insights.ts',
      summary: 'ML payment insights',
    },
    {
      method: 'POST',
      path: '/payment/orders-fixed',
      func: 'create-order-fixed.ts',
      summary: 'Create payment order (fixed)',
    },
  ],

  // Notifications (3 functions)
  notifications: [
    {
      method: 'POST',
      path: '/notifications/send',
      func: 'notification.send.ts',
      summary: 'Send notification',
    },
    {
      method: 'GET',
      path: '/notifications',
      func: 'notification.get.ts',
      summary: 'Get user notifications',
    },
    {
      method: 'POST',
      path: '/notifications/webhooks/whatsapp',
      func: 'notification.whatsapp.ts',
      summary: 'WhatsApp webhook handler',
    },
  ],

  // Analytics (11 functions)
  analytics: [
    {
      method: 'GET',
      path: '/analytics/orchestrator',
      func: 'analytics-orchestrator.ts',
      summary: 'Analytics orchestration',
    },
    {
      method: 'GET',
      path: '/analytics/business-intelligence',
      func: 'business-intelligence-aggregator.ts',
      summary: 'BI aggregation',
    },
    {
      method: 'GET',
      path: '/analytics/cross-school',
      func: 'cross-school-analytics.ts',
      summary: 'Cross-school analytics',
    },
    {
      method: 'GET',
      path: '/analytics/executive-dashboard',
      func: 'executive-dashboard-engine.ts',
      summary: 'Executive dashboard',
    },
    {
      method: 'GET',
      path: '/analytics/federated-learning',
      func: 'federated-learning-engine.ts',
      summary: 'Federated learning engine',
    },
    {
      method: 'GET',
      path: '/analytics/payments-dashboard',
      func: 'payments-dashboard.ts',
      summary: 'Payments dashboard',
    },
    {
      method: 'GET',
      path: '/analytics/performance-benchmarking',
      func: 'performance-benchmarking.ts',
      summary: 'Performance benchmarking',
    },
    {
      method: 'GET',
      path: '/analytics/predictive-insights',
      func: 'predictive-insights-engine.ts',
      summary: 'Predictive insights',
    },
    {
      method: 'GET',
      path: '/analytics/real-time-benchmarking',
      func: 'real-time-benchmarking.ts',
      summary: 'Real-time benchmarking',
    },
    {
      method: 'GET',
      path: '/analytics/revenue-optimization',
      func: 'revenue-optimization-analyzer.ts',
      summary: 'Revenue optimization',
    },
    {
      method: 'GET',
      path: '/analytics/strategic-insights',
      func: 'strategic-insights-generator.ts',
      summary: 'Strategic insights',
    },
  ],

  // Nutrition (6 functions)
  nutrition: [
    {
      method: 'POST',
      path: '/nutrition/analyze',
      func: 'nutrition-analyzer.ts',
      summary: 'Analyze nutritional content',
    },
    {
      method: 'GET',
      path: '/nutrition/recommendations',
      func: 'dietary-recommendation-engine.ts',
      summary: 'Dietary recommendations',
    },
    {
      method: 'POST',
      path: '/nutrition/meal-planning',
      func: 'meal-planner-ai.ts',
      summary: 'AI meal planning',
    },
    {
      method: 'POST',
      path: '/nutrition/meal-optimization',
      func: 'meal-optimization-ai.ts',
      summary: 'Meal optimization AI',
    },
    {
      method: 'GET',
      path: '/nutrition/compliance',
      func: 'nutrition-compliance-checker.ts',
      summary: 'Nutrition compliance check',
    },
    {
      method: 'GET',
      path: '/nutrition/trends',
      func: 'nutritional-trend-analyzer.ts',
      summary: 'Nutritional trend analysis',
    },
  ],

  // Enterprise (6 functions)
  enterprise: [
    {
      method: 'GET',
      path: '/enterprise/cross-school-analytics',
      func: 'cross-school-analytics.ts',
      summary: 'Cross-school analytics',
    },
    {
      method: 'GET',
      path: '/enterprise/district-admin',
      func: 'district-admin.ts',
      summary: 'District administration',
    },
    {
      method: 'GET',
      path: '/enterprise/billing-consolidation',
      func: 'enterprise-billing-consolidation.ts',
      summary: 'Billing consolidation',
    },
    {
      method: 'GET',
      path: '/enterprise/multi-school',
      func: 'multi-school-orchestrator.ts',
      summary: 'Multi-school orchestration',
    },
    {
      method: 'GET',
      path: '/enterprise/school-hierarchy',
      func: 'school-hierarchy-manager.ts',
      summary: 'School hierarchy management',
    },
    {
      method: 'GET',
      path: '/enterprise/tenant-manager',
      func: 'tenant-manager.ts',
      summary: 'Tenant management',
    },
  ],

  // Epic 7 - Parent Dashboard (5 functions)
  parentDashboard: [
    {
      method: 'GET',
      path: '/parent-dashboard/orchestrator',
      func: 'parent-dashboard-orchestrator.ts',
      summary: 'Parent dashboard orchestration',
    },
    {
      method: 'GET',
      path: '/parent-dashboard/insights',
      func: 'personalized-insights-engine.ts',
      summary: 'Personalized insights',
    },
    {
      method: 'GET',
      path: '/parent-dashboard/child-progress',
      func: 'child-progress-analytics.ts',
      summary: 'Child progress analytics',
    },
    {
      method: 'GET',
      path: '/parent-dashboard/engagement',
      func: 'engagement-intelligence.ts',
      summary: 'Engagement intelligence',
    },
    {
      method: 'POST',
      path: '/parent-dashboard/customization',
      func: 'dashboard-customization.ts',
      summary: 'Dashboard customization',
    },
  ],

  // Templates (6 functions)
  templates: [
    {
      method: 'GET',
      path: '/templates/ai-personalization',
      func: 'ai-personalization.ts',
      summary: 'AI personalization',
    },
    {
      method: 'GET',
      path: '/templates/behavioral-analytics',
      func: 'behavioral-analytics.ts',
      summary: 'Behavioral analytics',
    },
    {
      method: 'POST',
      path: '/templates/content-generator',
      func: 'content-generator.ts',
      summary: 'Content generation',
    },
    {
      method: 'POST',
      path: '/templates/cultural-adapter',
      func: 'cultural-adapter.ts',
      summary: 'Cultural adaptation',
    },
    {
      method: 'GET',
      path: '/templates/recommendation-engine',
      func: 'recommendation-engine.ts',
      summary: 'Recommendation engine',
    },
    {
      method: 'POST',
      path: '/templates/optimizer',
      func: 'template-optimizer.ts',
      summary: 'Template optimization',
    },
  ],

  // Mobile (3 functions)
  mobile: [
    {
      method: 'GET',
      path: '/mobile/delivery-tracking',
      func: 'delivery-tracking.ts',
      summary: 'Mobile delivery tracking',
    },
    {
      method: 'POST',
      path: '/mobile/device-registration',
      func: 'device-registration.ts',
      summary: 'Mobile device registration',
    },
    {
      method: 'GET',
      path: '/mobile/parent-notifications',
      func: 'parent-notifications.ts',
      summary: 'Mobile parent notifications',
    },
  ],

  // Vendor Management (1 function)
  vendorManagement: [
    {
      method: 'POST',
      path: '/vendor/ai-procurement',
      func: 'ai-procurement-engine.ts',
      summary: 'AI procurement engine',
    },
  ],

  // Static Content (2 functions)
  staticContent: [
    {
      method: 'GET',
      path: '/static/{path+}',
      func: 'serve-static.ts',
      summary: 'Serve static files',
    },
    {
      method: 'GET',
      path: '/content/{path+}',
      func: 'serve-content.ts',
      summary: 'Serve dynamic content',
    },
  ],

  // Monitoring (1 function)
  monitoring: [
    {
      method: 'GET',
      path: '/monitoring/dashboard',
      func: 'dashboard.ts',
      summary: 'Monitoring dashboard',
    },
  ],
};

// Generate rate limiting documentation
const RATE_LIMITS = {
  authentication: '10 requests per minute per IP',
  userManagement: '100 requests per minute per user',
  healthCheck: 'No limit',
  menuManagement: '200 requests per minute per user',
  orderManagement: '50 requests per minute per user',
  rfidManagement: '100 requests per minute per device',
  paymentProcessing: '20 requests per minute per user',
  notifications: '50 requests per minute per user',
  analytics: '100 requests per minute per user',
  nutrition: '50 requests per minute per user',
  enterprise: '200 requests per minute per user',
  parentDashboard: '100 requests per minute per user',
  templates: '50 requests per minute per user',
  mobile: '200 requests per minute per device',
  vendorManagement: '50 requests per minute per user',
  staticContent: '1000 requests per minute per IP',
  monitoring: '100 requests per minute per user',
};

// Security requirements by category
const SECURITY_REQUIREMENTS = {
  authentication: [],
  userManagement: ['CognitoAuth'],
  healthCheck: [],
  menuManagement: ['CognitoAuth'],
  orderManagement: ['CognitoAuth'],
  rfidManagement: ['CognitoAuth'],
  paymentProcessing: ['CognitoAuth'],
  notifications: ['CognitoAuth'],
  analytics: ['CognitoAuth'],
  nutrition: ['CognitoAuth'],
  enterprise: ['CognitoAuth'],
  parentDashboard: ['CognitoAuth'],
  templates: ['CognitoAuth'],
  mobile: ['CognitoAuth'],
  vendorManagement: ['CognitoAuth'],
  staticContent: [],
  monitoring: ['CognitoAuth'],
};

/**
 * Generate complete OpenAPI specification
 */
function generateCompleteAPISpec() {
  console.log('🚀 Generating complete HASIVU Platform API documentation...');

  // Load base OpenAPI spec
  const baseSpecPath = path.join(__dirname, '../docs/api/complete-openapi-spec.json');
  const baseSpec = JSON.parse(fs.readFileSync(baseSpecPath, 'utf8'));

  // Load authentication endpoints
  const authSpecPath = path.join(__dirname, '../docs/api/auth-endpoints.json');
  const authSpec = JSON.parse(fs.readFileSync(authSpecPath, 'utf8'));

  // Merge authentication endpoints
  Object.assign(baseSpec.paths, authSpec.paths);

  let totalEndpoints = Object.keys(authSpec.paths).length;

  // Generate endpoints for each category
  Object.keys(API_ENDPOINTS).forEach(category => {
    if (category === 'authentication') return; // Already added

    const endpoints = API_ENDPOINTS[category];
    const security = SECURITY_REQUIREMENTS[category];
    const rateLimit = RATE_LIMITS[category];

    endpoints.forEach(endpoint => {
      const pathSpec = generateEndpointSpec(endpoint, category, security, rateLimit);
      baseSpec.paths[endpoint.path] = baseSpec.paths[endpoint.path] || {};
      baseSpec.paths[endpoint.path][endpoint.method.toLowerCase()] = pathSpec;
      totalEndpoints++;
    });
  });

  // Add security documentation
  baseSpec.info.description += `\\n\\n## Security\\n\\nThis API implements comprehensive security measures:\\n\\n- **JWT Authentication**: Bearer token authentication using AWS Cognito\\n- **Rate Limiting**: Endpoint-specific rate limits to prevent abuse\\n- **Input Validation**: Strict validation using Zod schemas\\n- **CORS**: Properly configured cross-origin resource sharing\\n- **ReDoS Protection**: All regex patterns use secure, bounded constructs\\n\\n## Rate Limiting\\n\\nRate limits are enforced per endpoint category:\\n\\n${Object.keys(
    RATE_LIMITS
  )
    .map(cat => `- **${cat}**: ${RATE_LIMITS[cat]}`)
    .join('\\n')}`;

  // Add API versioning info
  baseSpec.info.description += `\\n\\n## API Versioning\\n\\nThis API uses semantic versioning. Breaking changes increment the major version.\\n\\nCurrent version: **v1.0.0**\\n\\nVersioning strategies supported:\\n- URL path versioning: \`/api/v1/...\`\\n- Accept header versioning: \`application/vnd.hasivu.v1+json\``;

  // Write complete specification
  const outputPath = path.join(__dirname, '../docs/api/complete-api-specification.json');
  fs.writeFileSync(outputPath, JSON.stringify(baseSpec, null, 2));

  console.log(`✅ Complete API documentation generated successfully!`);
  console.log(`📊 Total endpoints documented: ${totalEndpoints}`);
  console.log(`📁 Output: ${outputPath}`);
  console.log(`🌐 Swagger UI: https://api.hasivu.com/docs`);

  return {
    totalEndpoints,
    outputPath,
    spec: baseSpec,
  };
}

/**
 * Generate endpoint specification
 */
function generateEndpointSpec(endpoint, category, security, rateLimit) {
  const spec = {
    tags: [getCategoryDisplayName(category)],
    summary: endpoint.summary,
    description: `${endpoint.summary}. Part of ${getCategoryDisplayName(category)} API.`,
    operationId: generateOperationId(endpoint.method, endpoint.path),
    security: security.length > 0 ? security.map(s => ({ [s]: [] })) : [],
    parameters: generateParameters(endpoint.path),
    responses: generateResponses(endpoint.method),
    'x-rate-limit': rateLimit,
  };

  // Add request body for POST, PUT, PATCH methods
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
    spec.requestBody = generateRequestBody(category, endpoint.method);
  }

  return spec;
}

/**
 * Generate operation ID from method and path
 */
function generateOperationId(method, path) {
  const cleanPath = path
    .replace(/^\//, '')
    .replace(/\/{[^}]+}/g, 'ById')
    .replace(/\//g, '_')
    .replace(/{[^}]+}/g, 'Item');

  return method.toLowerCase() + cleanPath.charAt(0).toUpperCase() + cleanPath.slice(1);
}

/**
 * Generate parameters for path
 */
function generateParameters(path) {
  const parameters = [];

  // Extract path parameters
  const pathParams = path.match(/{([^}]+)}/g);
  if (pathParams) {
    pathParams.forEach(param => {
      const paramName = param.slice(1, -1);
      parameters.push({
        name: paramName,
        in: 'path',
        required: true,
        schema: {
          type: paramName.includes('id') ? 'string' : 'string',
          format: paramName.includes('id') ? 'uuid' : undefined,
        },
        description: `${paramName.charAt(0).toUpperCase() + paramName.slice(1)} identifier`,
      });
    });
  }

  // Add common query parameters for GET requests
  if (path.includes('GET') || path.endsWith('s')) {
    parameters.push(
      { $ref: '#/components/parameters/PageParam' },
      { $ref: '#/components/parameters/LimitParam' },
      { $ref: '#/components/parameters/SearchParam' },
      { $ref: '#/components/parameters/SortParam' }
    );
  }

  return parameters;
}

/**
 * Generate request body schema
 */
function generateRequestBody(category, method) {
  return {
    required: true,
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              description: `${category} ${method.toLowerCase()} data`,
            },
          },
        },
      },
    },
  };
}

/**
 * Generate response specifications
 */
function generateResponses(method) {
  const responses = {
    400: { $ref: '#/components/responses/BadRequest' },
    401: { $ref: '#/components/responses/Unauthorized' },
    403: { $ref: '#/components/responses/Forbidden' },
    500: { $ref: '#/components/responses/InternalServerError' },
  };

  switch (method) {
    case 'GET':
      responses['200'] = {
        description: 'Operation successful',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' },
          },
        },
      };
      responses['404'] = { $ref: '#/components/responses/NotFound' };
      break;

    case 'POST':
      responses['201'] = {
        description: 'Resource created successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' },
          },
        },
      };
      responses['409'] = { $ref: '#/components/responses/Conflict' };
      break;

    case 'PUT':
    case 'PATCH':
      responses['200'] = {
        description: 'Resource updated successfully',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SuccessResponse' },
          },
        },
      };
      responses['404'] = { $ref: '#/components/responses/NotFound' };
      break;

    case 'DELETE':
      responses['204'] = {
        description: 'Resource deleted successfully',
      };
      responses['404'] = { $ref: '#/components/responses/NotFound' };
      break;
  }

  return responses;
}

/**
 * Get display name for category
 */
function getCategoryDisplayName(category) {
  const categoryMap = {
    authentication: 'Authentication',
    userManagement: 'User Management',
    healthCheck: 'Health Check',
    menuManagement: 'Menu Management',
    orderManagement: 'Order Management',
    rfidManagement: 'RFID Management',
    paymentProcessing: 'Payment Processing',
    notifications: 'Notifications',
    analytics: 'Analytics',
    nutrition: 'Nutrition',
    enterprise: 'Enterprise',
    parentDashboard: 'Epic 7 - Parent Dashboard',
    templates: 'Templates',
    mobile: 'Mobile',
    vendorManagement: 'Vendor Management',
    staticContent: 'Static Content',
    monitoring: 'Monitoring',
  };

  return categoryMap[category] || category;
}

// Generate the complete API documentation
if (require.main === module) {
  generateCompleteAPISpec();
}

module.exports = { generateCompleteAPISpec, API_ENDPOINTS };
