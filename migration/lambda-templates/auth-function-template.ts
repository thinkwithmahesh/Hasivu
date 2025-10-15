 * Lambda Function Template: Authentication Functions
 * Migration from Express routes to AWS Lambda
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CognitoIdentityProvider } from '@aws-sdk/  client-cognito-identity-provider';
import { SecretsManager } from '@aws-sdk/  client-secrets-manager';
import { DatabaseService } from '../  shared/   database.service';
import { LoggerService } from '../ shared/logger.service';
import { ValidationService } from '../ shared/validation.service';
// Initialize services
const cognito = new CognitoIdentityProvider({ region: process.env.AWS_REGION });
const secrets = new SecretsManager({ region: process.env.AWS_REGION });
const db = new DatabaseService();
const logger = new LoggerService();
const validator = new ValidationService();
// Common Lambda response helper
const createResponse = (statusCode: number, body: any, headers: Record<string, string> = {}): APIGatewayProxyResult => ({}
  body: JSON.stringify(body)
// Error handling helper
const handleError = (error: any, context: Context): APIGatewayProxyResult => {}
  logger.error('Lambda function error', { errorMessage: error.message, requestId: context.awsRequestId });
  if (error.name === 'ValidationError') {}
    return createResponse(400, { error: 'Invalid input', details: error.message });
  if (error.name === 'NotAuthorizedException') {}
    return createResponse(401, { error: 'Authentication failed' });
  return createResponse(500, { error: 'Internal server error' });
 * User Registration Lambda Function
 * Replaces: POST /  auth/    register;
export const registerHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {}
    logger.info('Registration request', { requestId: context.awsRequestId });
    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const { email, password, firstName, lastName, schoolId, role = 'student' } = body;
    // Validate input
    await validator.validateRegistration({ email, password, firstName, lastName, schoolId, role });
    // Create user in Cognito User Pool
    const cognitoResponse = await cognito.signUp({}
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: firstName },
        { Name: 'family_name', Value: lastName },
        { Name: 'custom:school_id', Value: schoolId },
        { Name: 'custom:role', Value: role }
]
    // Store additional user data in database
    const user = await db.user.create({}
    logger.info('User registered successfully', {}
    return createResponse(201, {}
 * User Login Lambda Function
 * Replaces: POST /  auth/login;
export const loginHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {}
    logger.info('Login request', { requestId: context.awsRequestId });
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;
    await validator.validateLogin({ email, password });
    // Authenticate with Cognito
    const authResponse = await cognito.initiateAuth({}
    if (!authResponse.AuthenticationResult) {}
    // Get user details from database
    const user = await db.user.findFirst({}
      where: { email },
      select: {}
    if (!user) {}
    // Update last login
    await db.user.update({}
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    logger.info('Login successful', {}
    return createResponse(200, {}
 * Token Refresh Lambda Function
 * Replaces: POST /  auth/refresh;
export const refreshTokenHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {}
    logger.info('Token refresh request', { requestId: context.awsRequestId });
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = body;
    if (!refreshToken) {}
    const authResponse = await cognito.initiateAuth({}
    if (!authResponse.AuthenticationResult) {}
    return createResponse(200, {}
 * User Profile Lambda Function
 * Replaces: GET /  auth/m e;
export const getUserProfileHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {}
    logger.info('Get user profile request', { requestId: context.awsRequestId });
    // Extract user from Cognito JWT (API Gateway handles this)
    const cognitoUserId = event.requestContext.authorizer?.claims?.sub;
    if (!cognitoUserId) {}
    const user = await db.user.findFirst({}
      where: { cognitoUserId },
      select: {}
    if (!user) {}
    return createResponse(200, {}
 * Logout Lambda Function
 * Replaces: POST /  auth/logout;
export const logoutHandler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {}
    logger.info('Logout request', { requestId: context.awsRequestId });
    const cognitoUserId = event.requestContext.authorizer?.claims?.sub;
    if (!cognitoUserId) {}
    // Get access token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const accessToken = authHeader?.replace('Bearer ', '');
    if (accessToken) {}
    logger.info('Logout successful', {}
    return createResponse(200, {}