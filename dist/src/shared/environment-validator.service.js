"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.environmentValidator = exports.EnvironmentValidatorService = exports.ValidationCategory = void 0;
const environment_1 = require("../config/environment");
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
var ValidationCategory;
(function (ValidationCategory) {
    ValidationCategory["DATABASE"] = "database";
    ValidationCategory["REDIS"] = "redis";
    ValidationCategory["JWT"] = "jwt";
    ValidationCategory["SECURITY"] = "security";
    ValidationCategory["PAYMENT"] = "payment";
    ValidationCategory["AWS"] = "aws";
    ValidationCategory["EXTERNAL_SERVICES"] = "external_services";
    ValidationCategory["MONITORING"] = "monitoring";
    ValidationCategory["GENERAL"] = "general";
})(ValidationCategory || (exports.ValidationCategory = ValidationCategory = {}));
class EnvironmentValidatorService {
    static instance;
    errors = [];
    warnings = [];
    checkCount = 0;
    passedChecks = 0;
    constructor() {
    }
    static getInstance() {
        if (!EnvironmentValidatorService.instance) {
            EnvironmentValidatorService.instance = new EnvironmentValidatorService();
        }
        return EnvironmentValidatorService.instance;
    }
    validateEnvironment() {
        this.reset();
        try {
            this.validateDatabase();
            this.validateRedis();
            this.validateJWT();
            this.validateSecurity();
            this.validatePayment();
            this.validateAWS();
            this.validateExternalServices();
            this.validateMonitoring();
            this.validateGeneral();
            const result = this.buildValidationResult();
            this.logValidationResult(result);
            return result;
        }
        catch (error) {
            const criticalError = {
                category: ValidationCategory.GENERAL,
                field: 'validation_process',
                message: `Environment validation failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : 'Unknown error'}`,
                severity: 'critical',
                suggestion: 'Check environment configuration files and ensure all required variables are set'
            };
            this.errors.push(criticalError);
            const result = this.buildValidationResult();
            this.logValidationResult(result);
            return result;
        }
    }
    validateProduction() {
        this.reset();
        this.validateProductionSecurity();
        this.validateProductionDatabase();
        this.validateProductionMonitoring();
        this.validateProductionAWS();
        const result = this.buildValidationResult();
        this.logValidationResult(result);
        return result;
    }
    validateDevelopment() {
        this.reset();
        this.validateDevelopmentDatabase();
        this.validateDevelopmentSecurity();
        const result = this.buildValidationResult();
        this.logValidationResult(result);
        return result;
    }
    reset() {
        this.errors = [];
        this.warnings = [];
        this.checkCount = 0;
        this.passedChecks = 0;
    }
    addError(category, field, message, severity = 'high', suggestion) {
        this.errors.push({
            category,
            field,
            message,
            severity,
            suggestion
        });
        this.checkCount++;
    }
    addWarning(category, field, message, suggestion) {
        this.warnings.push({
            category,
            field,
            message,
            suggestion
        });
        this.checkCount++;
    }
    addSuccess() {
        this.checkCount++;
        this.passedChecks++;
    }
    validateDatabase() {
        const category = ValidationCategory.DATABASE;
        if (!environment_1.config.database.url) {
            this.addError(category, 'DATABASE_URL', 'Database URL is required', 'critical', 'Set DATABASE_URL environment variable');
        }
        else {
            this.addSuccess();
        }
        if (!environment_1.config.database.username) {
            this.addError(category, 'DB_USERNAME', 'Database username is required', 'high');
        }
        if (!environment_1.config.database.password) {
            this.addError(category, 'DB_PASSWORD', 'Database password is required', 'high');
        }
        if (environment_1.config.database.poolMax < environment_1.config.database.poolMin) {
            this.addError(category, 'CONNECTION_POOL', 'Database pool max size must be greater than or equal to min size', 'medium', `Set DB_POOL_MAX (${environment_1.config.database.poolMax}) >= DB_POOL_MIN (${environment_1.config.database.poolMin})`);
        }
        if (environment_1.config.server.nodeEnv === 'production' && !environment_1.config.database.ssl) {
            this.addWarning(category, 'SSL_CONFIG', 'SSL should be enabled for production database connections', 'Set DB_SSL=true for production environment');
        }
        if (environment_1.config.database.connectionTimeoutMillis && environment_1.config.database.connectionTimeoutMillis < 1000) {
            this.addWarning(category, 'CONNECTION_TIMEOUT', 'Database connection timeout is very low', 'Consider setting DB_CONNECTION_TIMEOUT_MILLIS to at least 1000ms');
        }
    }
    validateRedis() {
        const category = ValidationCategory.REDIS;
        if (!environment_1.config.redis.url) {
            this.addError(category, 'REDIS_URL', 'Redis URL is required', 'critical', 'Set REDIS_URL environment variable');
            return;
        }
        if (!environment_1.config.redis.host) {
            this.addError(category, 'REDIS_HOST', 'Redis host is required', 'high');
        }
        if (environment_1.config.redis.port < 1 || environment_1.config.redis.port > 65535) {
            this.addError(category, 'REDIS_PORT', 'Redis port must be between 1 and 65535', 'high');
        }
        if (environment_1.config.server.nodeEnv === 'production' && !environment_1.config.redis.password) {
            this.addError(category, 'REDIS_PASSWORD', 'Redis password is required for production', 'critical', 'Set REDIS_PASSWORD environment variable');
        }
        if (environment_1.config.redis.db < 0 || environment_1.config.redis.db > 15) {
            this.addWarning(category, 'REDIS_DB', 'Redis database number should be between 0 and 15', 'Set REDIS_DB to a value between 0-15');
        }
        this.addSuccess();
    }
    validateJWT() {
        const category = ValidationCategory.JWT;
        if (!environment_1.config.jwt.secret) {
            this.addError(category, 'JWT_SECRET', 'JWT secret is required', 'critical', 'Set JWT_SECRET environment variable');
        }
        else if (environment_1.config.jwt.secret.length < 32) {
            this.addError(category, 'JWT_SECRET_LENGTH', 'JWT secret should be at least 32 characters long', 'high', 'Use a longer, more secure JWT secret');
        }
        else {
            this.addSuccess();
        }
        if (!environment_1.config.jwt.issuer) {
            this.addWarning(category, 'JWT_ISSUER', 'JWT issuer should be set for better security', 'Set JWT_ISSUER environment variable');
        }
        if (!environment_1.config.jwt.audience) {
            this.addWarning(category, 'JWT_AUDIENCE', 'JWT audience should be set for better security', 'Set JWT_AUDIENCE environment variable');
        }
        if (!environment_1.config.jwt.expiresIn) {
            this.addError(category, 'JWT_EXPIRES_IN', 'JWT expiration time is required', 'medium', 'Set JWT_EXPIRES_IN environment variable');
        }
        if (!environment_1.config.jwt.refreshSecret) {
            this.addError(category, 'JWT_REFRESH_SECRET', 'JWT refresh token secret is required', 'high', 'Set JWT_REFRESH_SECRET environment variable');
        }
    }
    validateSecurity() {
        const category = ValidationCategory.SECURITY;
        if (environment_1.config.security.bcryptRounds < 12) {
            this.addError(category, 'BCRYPT_ROUNDS', 'Bcrypt rounds should be at least 12 for security', 'high', `Increase BCRYPT_ROUNDS from ${environment_1.config.security.bcryptRounds} to at least 12`);
        }
        else {
            this.addSuccess();
        }
        if (environment_1.config.server.nodeEnv === 'production' && environment_1.config.security.corsOrigins.includes('*')) {
            this.addError(category, 'CORS_ORIGINS', 'CORS should not allow all origins in production', 'critical', 'Set specific allowed origins in CORS_ORIGINS environment variable');
        }
        if (!environment_1.config.security.rateLimitWindowMs || environment_1.config.security.rateLimitWindowMs < 60000) {
            this.addWarning(category, 'RATE_LIMIT_WINDOW', 'Rate limit window should be at least 1 minute', 'Set RATE_LIMIT_WINDOW_MS to at least 60000');
        }
        if (!environment_1.config.security.sessionSecret) {
            this.addError(category, 'SESSION_SECRET', 'Session secret is required', 'high', 'Set SESSION_SECRET environment variable');
        }
    }
    validatePayment() {
        const category = ValidationCategory.PAYMENT;
        if (!environment_1.config.razorpay.keyId) {
            this.addError(category, 'RAZORPAY_KEY_ID', 'Razorpay key ID is required', 'high', 'Set RAZORPAY_KEY_ID environment variable');
        }
        if (!environment_1.config.razorpay.keySecret) {
            this.addError(category, 'RAZORPAY_KEY_SECRET', 'Razorpay key secret is required', 'critical', 'Set RAZORPAY_KEY_SECRET environment variable');
        }
        if (!environment_1.config.razorpay.webhookSecret) {
            this.addError(category, 'RAZORPAY_WEBHOOK_SECRET', 'Razorpay webhook secret is required', 'high', 'Set RAZORPAY_WEBHOOK_SECRET environment variable');
        }
        if (environment_1.config.razorpay.keyId && !environment_1.config.razorpay.keyId.match(/^rzp_(test|live)_[A-Za-z0-9]{14}$/)) {
            this.addError(category, 'RAZORPAY_KEY_FORMAT', 'Razorpay key ID format is invalid', 'high', 'Ensure key ID follows format: rzp_test_XXXXXXXXXXXXXX or rzp_live_XXXXXXXXXXXXXX');
        }
        else if (environment_1.config.razorpay.keyId) {
            this.addSuccess();
        }
        if (environment_1.config.server.nodeEnv === 'production' && environment_1.config.razorpay.keyId?.startsWith('rzp_test_')) {
            this.addError(category, 'RAZORPAY_PRODUCTION_KEY', 'Production environment should use live Razorpay keys', 'critical', 'Use rzp_live_ keys for production environment');
        }
    }
    validateAWS() {
        const category = ValidationCategory.AWS;
        if (!environment_1.config.aws.accessKeyId) {
            this.addError(category, 'AWS_ACCESS_KEY_ID', 'AWS access key ID is required', 'high', 'Set AWS_ACCESS_KEY_ID environment variable');
        }
        if (!environment_1.config.aws.secretAccessKey) {
            this.addError(category, 'AWS_SECRET_ACCESS_KEY', 'AWS secret access key is required', 'critical', 'Set AWS_SECRET_ACCESS_KEY environment variable');
        }
        if (!environment_1.config.aws.region) {
            this.addError(category, 'AWS_REGION', 'AWS region is required', 'high', 'Set AWS_REGION environment variable');
        }
        else {
            this.addSuccess();
        }
        if (!environment_1.config.aws.s3Bucket) {
            this.addError(category, 'AWS_S3_BUCKET', 'AWS S3 bucket name is required', 'medium', 'Set AWS_S3_BUCKET environment variable');
        }
        if (!environment_1.config.aws.sesFromEmail) {
            this.addError(category, 'AWS_SES_FROM_EMAIL', 'AWS SES from email is required', 'medium', 'Set AWS_SES_FROM_EMAIL environment variable');
        }
        if (environment_1.config.aws.isLambda) {
            if (!environment_1.config.aws.lambdaFunctionName) {
                this.addWarning(category, 'LAMBDA_FUNCTION_NAME', 'Lambda function name should be set', 'Set AWS_LAMBDA_FUNCTION_NAME');
            }
        }
    }
    validateExternalServices() {
        const category = ValidationCategory.EXTERNAL_SERVICES;
        if (!environment_1.config.whatsapp.accessToken) {
            this.addError(category, 'WHATSAPP_ACCESS_TOKEN', 'WhatsApp access token is required', 'high', 'Set WHATSAPP_ACCESS_TOKEN environment variable');
        }
        if (!environment_1.config.whatsapp.phoneNumberId) {
            this.addError(category, 'WHATSAPP_PHONE_NUMBER_ID', 'WhatsApp phone number ID is required', 'high', 'Set WHATSAPP_PHONE_NUMBER_ID environment variable');
        }
        if (!environment_1.config.whatsapp.webhookVerifyToken) {
            this.addError(category, 'WHATSAPP_WEBHOOK_VERIFY_TOKEN', 'WhatsApp webhook verify token is required', 'medium', 'Set WHATSAPP_WEBHOOK_VERIFY_TOKEN environment variable');
        }
        if (!environment_1.config.firebase.projectId) {
            this.addError(category, 'FIREBASE_PROJECT_ID', 'Firebase project ID is required', 'medium', 'Set FIREBASE_PROJECT_ID environment variable');
        }
        if (!environment_1.config.firebase.serviceAccountKey) {
            this.addError(category, 'FIREBASE_SERVICE_ACCOUNT_KEY', 'Firebase service account key is required', 'medium', 'Set FIREBASE_SERVICE_ACCOUNT_KEY environment variable');
        }
        if (!environment_1.config.email?.smtpHost) {
            this.addWarning(category, 'SMTP_HOST', 'SMTP host should be configured for email functionality', 'Set SMTP_HOST environment variable');
        }
        this.addSuccess();
    }
    validateMonitoring() {
        const category = ValidationCategory.MONITORING;
        if (environment_1.config.server.nodeEnv === 'production') {
            if (!environment_1.config.monitoring.enableCloudwatch) {
                this.addWarning(category, 'CLOUDWATCH', 'CloudWatch monitoring should be enabled in production', 'Set ENABLE_CLOUDWATCH=true');
            }
        }
        const validLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
        if (!validLogLevels.includes(environment_1.config.monitoring.logLevel)) {
            this.addError(category, 'LOG_LEVEL', `Invalid log level: ${environment_1.config.monitoring.logLevel}`, 'medium', `Use one of: ${validLogLevels.join(', ')}`);
        }
        else {
            this.addSuccess();
        }
        if (!environment_1.config.monitoring.healthCheckPath) {
            this.addWarning(category, 'HEALTH_CHECK_PATH', 'Health check path should be configured', 'Set HEALTH_CHECK_PATH environment variable');
        }
        if (environment_1.config.server.nodeEnv === 'production' && !environment_1.config.monitoring.enableErrorTracking) {
            this.addWarning(category, 'ERROR_TRACKING', 'Error tracking should be enabled in production', 'Set ENABLE_ERROR_TRACKING=true');
        }
    }
    validateGeneral() {
        const category = ValidationCategory.GENERAL;
        const validEnvironments = ['development', 'staging', 'production', 'test'];
        if (!validEnvironments.includes(environment_1.config.server.nodeEnv)) {
            this.addError(category, 'NODE_ENV', `Invalid NODE_ENV: ${environment_1.config.server.nodeEnv}`, 'high', `Use one of: ${validEnvironments.join(', ')}`);
        }
        else {
            this.addSuccess();
        }
        if (!environment_1.config.server.port || environment_1.config.server.port < 1 || environment_1.config.server.port > 65535) {
            this.addError(category, 'PORT', 'Valid port number is required', 'medium', 'Set PORT environment variable (1-65535)');
        }
        else {
            this.addSuccess();
        }
        if (!environment_1.config.server.apiVersion) {
            this.addWarning(category, 'API_VERSION', 'API version should be set', 'Set API_VERSION environment variable');
        }
        if (!environment_1.config.server.baseUrl) {
            this.addError(category, 'BASE_URL', 'Base URL is required', 'medium', 'Set BASE_URL environment variable');
        }
    }
    validateProductionSecurity() {
        if (environment_1.config.server.nodeEnv !== 'production')
            return;
        const category = ValidationCategory.SECURITY;
        if (!environment_1.config.security.forceHttps) {
            this.addError(category, 'FORCE_HTTPS', 'HTTPS should be enforced in production', 'critical', 'Set FORCE_HTTPS=true');
        }
        if (!environment_1.config.security.enableSecurityHeaders) {
            this.addError(category, 'SECURITY_HEADERS', 'Security headers should be enabled in production', 'high', 'Set ENABLE_SECURITY_HEADERS=true');
        }
        if (!environment_1.config.security.cspPolicy) {
            this.addWarning(category, 'CSP_POLICY', 'Content Security Policy should be configured', 'Set CSP_POLICY environment variable');
        }
    }
    validateProductionDatabase() {
        if (environment_1.config.server.nodeEnv !== 'production')
            return;
        const category = ValidationCategory.DATABASE;
        if (!environment_1.config.database.ssl) {
            this.addError(category, 'DATABASE_SSL', 'SSL must be enabled for production database', 'critical', 'Set DB_SSL=true');
        }
        if (environment_1.config.database.poolMax > 20) {
            this.addWarning(category, 'CONNECTION_POOL_SIZE', 'Large connection pool may impact performance', `Consider reducing DB_POOL_MAX from ${environment_1.config.database.poolMax} to <= 20`);
        }
    }
    validateProductionMonitoring() {
        if (environment_1.config.server.nodeEnv !== 'production')
            return;
        const category = ValidationCategory.MONITORING;
        if (!environment_1.config.monitoring.enableCloudwatch) {
            this.addError(category, 'CLOUDWATCH_REQUIRED', 'CloudWatch is required for production monitoring', 'high', 'Set ENABLE_CLOUDWATCH=true');
        }
        if (!environment_1.config.monitoring.enableErrorTracking) {
            this.addError(category, 'ERROR_TRACKING_REQUIRED', 'Error tracking is required for production', 'high', 'Set ENABLE_ERROR_TRACKING=true');
        }
        if (environment_1.config.monitoring.logLevel === 'debug' || environment_1.config.monitoring.logLevel === 'verbose') {
            this.addWarning(category, 'PRODUCTION_LOG_LEVEL', 'Debug log levels may impact performance in production', 'Set LOG_LEVEL to info or warn for production');
        }
    }
    validateProductionAWS() {
        if (environment_1.config.server.nodeEnv !== 'production')
            return;
        const category = ValidationCategory.AWS;
        if (!environment_1.config.aws.cloudwatchLogGroup) {
            this.addWarning(category, 'CLOUDWATCH_LOGS', 'CloudWatch log group should be configured for production', 'Set AWS_CLOUDWATCH_LOG_GROUP');
        }
        if (!environment_1.config.aws.s3ServerSideEncryption) {
            this.addError(category, 'S3_ENCRYPTION', 'S3 server-side encryption should be enabled in production', 'high', 'Set AWS_S3_SERVER_SIDE_ENCRYPTION=true');
        }
    }
    validateDevelopmentDatabase() {
        if (environment_1.config.server.nodeEnv !== 'development')
            return;
        const category = ValidationCategory.DATABASE;
        if (environment_1.config.database.url.includes('localhost') || environment_1.config.database.url.includes('127.0.0.1')) {
            this.addWarning(category, 'LOCAL_DATABASE', 'Using local database for development', 'Consider using Docker for consistent development environment');
        }
    }
    validateDevelopmentSecurity() {
        if (environment_1.config.server.nodeEnv !== 'development')
            return;
        const category = ValidationCategory.SECURITY;
        if (environment_1.config.jwt.secret === 'development-secret' || environment_1.config.jwt.secret.length < 16) {
            this.addWarning(category, 'DEV_JWT_SECRET', 'Using weak JWT secret for development', 'Use a stronger secret even in development');
        }
    }
    buildValidationResult() {
        const criticalErrors = this.errors.filter(e => e.severity === 'critical').length;
        const isValid = this.errors.length === 0;
        return {
            isValid,
            errors: this.errors,
            warnings: this.warnings,
            summary: {
                totalChecks: this.checkCount,
                passedChecks: this.passedChecks,
                criticalErrors,
                warnings: this.warnings.length,
                environment: environment_1.config.server.nodeEnv
            }
        };
    }
    logValidationResult(result) {
        const { summary, errors, warnings } = result;
        if (result.isValid) {
            logger.info('Environment validation completed successfully', {
                summary,
                timestamp: new Date().toISOString()
            });
        }
        else {
            const criticalErrors = errors.filter(e => e.severity === 'critical');
            if (criticalErrors.length > 0) {
                logger.error('Critical configuration errors found', {
                    summary,
                    criticalErrors: criticalErrors.map(e => ({
                        field: e.field,
                        message: e.message,
                        suggestion: e.suggestion
                    })),
                    timestamp: new Date().toISOString()
                });
                const errorMessages = criticalErrors.map(e => `${e.field}: ${e.message}`);
                throw new Error(`Critical configuration errors found: ${errorMessages.join(', ')}`);
            }
            else {
                logger.warn('Environment validation completed with warnings', {
                    summary,
                    errors: errors.map(e => ({
                        field: e.field,
                        message: e.message,
                        severity: e.severity
                    })),
                    warnings: warnings.map(w => ({
                        field: w.field,
                        message: w.message
                    })),
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    getValidationSummary() {
        const result = this.validateEnvironment();
        return {
            isHealthy: result.isValid,
            lastValidation: new Date(),
            summary: result.summary
        };
    }
    validateCategory(category) {
        this.reset();
        switch (category) {
            case ValidationCategory.DATABASE:
                this.validateDatabase();
                break;
            case ValidationCategory.REDIS:
                this.validateRedis();
                break;
            case ValidationCategory.JWT:
                this.validateJWT();
                break;
            case ValidationCategory.SECURITY:
                this.validateSecurity();
                break;
            case ValidationCategory.PAYMENT:
                this.validatePayment();
                break;
            case ValidationCategory.AWS:
                this.validateAWS();
                break;
            case ValidationCategory.EXTERNAL_SERVICES:
                this.validateExternalServices();
                break;
            case ValidationCategory.MONITORING:
                this.validateMonitoring();
                break;
            case ValidationCategory.GENERAL:
                this.validateGeneral();
                break;
            default:
                this.addError(ValidationCategory.GENERAL, 'UNKNOWN_CATEGORY', `Unknown validation category: ${category}`, 'medium');
        }
        return this.buildValidationResult();
    }
    getValidationCategories() {
        return Object.values(ValidationCategory);
    }
    isProductionReady() {
        const result = this.validateProduction();
        const blockers = result.errors.filter(e => e.severity === 'critical' || e.severity === 'high');
        return {
            ready: blockers.length === 0,
            blockers,
            warnings: result.warnings
        };
    }
}
exports.EnvironmentValidatorService = EnvironmentValidatorService;
exports.environmentValidator = EnvironmentValidatorService.getInstance();
//# sourceMappingURL=environment-validator.service.js.map