"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandlingService = exports.ErrorHandlingService = exports.ErrorHandlingServiceError = void 0;
const SQSClient = class {
    constructor() { }
};
const SendMessageCommand = class {
    constructor() { }
};
const SNSClient = class {
    constructor() { }
};
const PublishCommand = class {
    constructor() { }
};
const logger = {
    info: (message, data) => console.log(message, data),
    warn: (message, data) => console.warn(message, data),
    error: (message, data) => console.error(message, data),
    debug: (message, data) => console.debug(message, data)
};
class ErrorHandlingServiceError extends Error {
    code;
    statusCode;
    details;
    constructor(message, code = 'ERROR_HANDLER_ERROR', statusCode = 500, details) {
        super(message);
        this.name = 'ErrorHandlingServiceError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        Object.setPrototypeOf(this, ErrorHandlingServiceError.prototype);
    }
}
exports.ErrorHandlingServiceError = ErrorHandlingServiceError;
class ErrorHandlingService {
    static instance;
    sqsClient;
    snsClient;
    circuitBreakers;
    deadLetterQueueUrl;
    retryQueueUrl;
    notificationTopicArn;
    environment;
    serviceName;
    defaultRetryConfig = {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true,
        retryableErrors: [
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND',
            'EAI_AGAIN',
            'NETWORK_ERROR',
            'SERVICE_UNAVAILABLE',
            'TIMEOUT_ERROR'
        ]
    };
    defaultCircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 2,
        timeout: 60000,
        monitoringWindow: 300000
    };
    constructor() {
        this.sqsClient = new SQSClient();
        this.snsClient = new SNSClient();
        this.circuitBreakers = new Map();
        this.deadLetterQueueUrl = process.env.DEAD_LETTER_QUEUE_URL || '';
        this.retryQueueUrl = process.env.RETRY_QUEUE_URL || '';
        this.notificationTopicArn = process.env.NOTIFICATION_TOPIC_ARN || '';
        this.environment = process.env.NODE_ENV || 'development';
        this.serviceName = process.env.SERVICE_NAME || 'hasivu-platform';
        this.validateConfiguration();
        logger.info('ErrorHandlingService initialized', {
            environment: this.environment,
            serviceName: this.serviceName,
            dlqConfigured: !!this.deadLetterQueueUrl,
            retryQueueConfigured: !!this.retryQueueUrl,
            notificationsConfigured: !!this.notificationTopicArn
        });
    }
    static getInstance() {
        if (!ErrorHandlingService.instance) {
            ErrorHandlingService.instance = new ErrorHandlingService();
        }
        return ErrorHandlingService.instance;
    }
    validateConfiguration() {
        if (!this.deadLetterQueueUrl) {
            logger.warn('Dead Letter Queue URL not configured - DLQ functionality disabled');
        }
        if (!this.retryQueueUrl) {
            logger.warn('Retry Queue URL not configured - retry queue functionality disabled');
        }
        if (!this.notificationTopicArn) {
            logger.warn('Notification Topic ARN not configured - error notifications disabled');
        }
    }
    async executeWithRetry(operation, context, config = {}) {
        const retryConfig = { ...this.defaultRetryConfig, ...config };
        let lastError;
        for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
            try {
                const result = await operation();
                if (attempt > 0) {
                    logger.info('Operation succeeded after retries', {
                        operation: context.operation,
                        attempt: attempt + 1,
                        totalAttempts: retryConfig.maxRetries + 1,
                        context
                    });
                }
                return result;
            }
            catch (error) {
                lastError = error;
                logger.warn('Operation failed, considering retry', {
                    operation: context.operation,
                    attempt: attempt + 1,
                    maxRetries: retryConfig.maxRetries,
                    error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                    errorCode: error.code,
                    context
                });
                if (attempt === retryConfig.maxRetries) {
                    break;
                }
                if (!this.isRetryableError(error, retryConfig.retryableErrors)) {
                    logger.info('Error is not retryable, aborting retry attempts', {
                        operation: context.operation,
                        error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
                        errorCode: error.code,
                        context
                    });
                    break;
                }
                const baseDelay = Math.min(retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt), retryConfig.maxDelay);
                const delay = retryConfig.jitter
                    ? baseDelay + Math.random() * baseDelay * 0.1
                    : baseDelay;
                await this.sleep(delay);
            }
        }
        await this.recordCircuitBreakerFailure(context.operation);
        await this.sendToDeadLetterQueue(lastError, context);
        throw lastError;
    }
    async executeWithCircuitBreaker(operation, operationName, config = {}) {
        const circuitConfig = { ...this.defaultCircuitBreakerConfig, ...config };
        const state = this.getCircuitBreakerState(operationName);
        const now = Date.now();
        if (state.state === 'OPEN') {
            if (now < state.nextAttemptTime) {
                throw new ErrorHandlingServiceError(`Circuit breaker is OPEN for operation: ${operationName}. Next attempt allowed at: ${new Date(state.nextAttemptTime)}`, 'CIRCUIT_BREAKER_OPEN', 503);
            }
            else {
                state.state = 'HALF_OPEN';
                state.successes = 0;
                logger.info('Circuit breaker moved to HALF_OPEN state', { operationName });
            }
        }
        try {
            const result = await operation();
            await this.recordCircuitBreakerSuccess(operationName, circuitConfig);
            return result;
        }
        catch (error) {
            await this.recordCircuitBreakerFailure(operationName, circuitConfig);
            throw error;
        }
    }
    async executeWithFullProtection(operation, context, retryConfig = {}, circuitConfig = {}) {
        const protectedOperation = () => this.executeWithCircuitBreaker(operation, context.operation, circuitConfig);
        return this.executeWithRetry(protectedOperation, context, retryConfig);
    }
    async handleUnrecoverableError(error, context) {
        logger.error('Unrecoverable error occurred', {
            error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error),
            stack: error.stack,
            context,
            timestamp: Date.now()
        });
        await this.sendToDeadLetterQueue(error, context);
        if (context.severity === 'CRITICAL' || context.severity === 'HIGH') {
            await this.sendErrorNotification(error, context);
        }
    }
    async sendToDeadLetterQueue(error, context) {
        if (!this.deadLetterQueueUrl) {
            logger.warn('Dead Letter Queue not configured, skipping DLQ send');
            return;
        }
        try {
            const dlqMessage = {
                originalError: {
                    name: error.name,
                    message: error instanceof Error ? error.message : String(error),
                    stack: error.stack,
                    code: error.code
                },
                context: {
                    ...context,
                    timestamp: context.timestamp || Date.now()
                },
                retryAttempts: 0,
                timestamp: Date.now(),
                environment: this.environment,
                service: this.serviceName
            };
            const command = new SendMessageCommand({
                QueueUrl: this.deadLetterQueueUrl,
                MessageBody: JSON.stringify(dlqMessage),
                MessageAttributes: {
                    ErrorType: {
                        StringValue: error.name,
                        DataType: 'String'
                    },
                    Operation: {
                        StringValue: context.operation,
                        DataType: 'String'
                    },
                    Severity: {
                        StringValue: context.severity,
                        DataType: 'String'
                    },
                    Environment: {
                        StringValue: this.environment,
                        DataType: 'String'
                    }
                }
            });
            await this.sqsClient.send(command);
            logger.info('Error sent to Dead Letter Queue', {
                operation: context.operation,
                errorType: error.name,
                severity: context.severity
            });
        }
        catch (dlqError) {
            logger.error('Failed to send error to Dead Letter Queue', {
                error: dlqError.message,
                originalError: error instanceof Error ? error.message : String(error),
                context
            });
        }
    }
    async sendErrorNotification(error, context) {
        if (!this.notificationTopicArn) {
            logger.warn('Notification Topic not configured, skipping error notification');
            return;
        }
        try {
            const isCritical = context.severity === 'CRITICAL';
            const notification = {
                subject: `${isCritical ? '[CRITICAL]' : '[WARNING]'} HASIVU Platform Error: ${context.operation}`,
                message: this.formatErrorNotification(error, context),
                severity: context.severity,
                timestamp: Date.now(),
                context,
                environment: this.environment
            };
            const command = new PublishCommand({
                TopicArn: this.notificationTopicArn,
                Subject: notification.subject,
                Message: JSON.stringify(notification, null, 2),
                MessageAttributes: {
                    Severity: {
                        StringValue: context.severity,
                        DataType: 'String'
                    },
                    Environment: {
                        StringValue: this.environment,
                        DataType: 'String'
                    },
                    Operation: {
                        StringValue: context.operation,
                        DataType: 'String'
                    }
                }
            });
            await this.snsClient.send(command);
            logger.info('Error notification sent', {
                operation: context.operation,
                severity: context.severity,
                notificationType: isCritical ? 'CRITICAL' : 'WARNING'
            });
        }
        catch (notificationError) {
            logger.error('Failed to send error notification', {
                error: notificationError.message,
                originalError: error instanceof Error ? error.message : String(error),
                context
            });
        }
    }
    formatErrorNotification(error, context) {
        return `
🚨 Error Alert - ${this.environment.toUpperCase()} Environment

Operation: ${context.operation}
Service: ${this.serviceName}
Severity: ${context.severity}
Timestamp: ${new Date(context.timestamp || Date.now()).toISOString()}

Error Details:
- Type: ${error.name}
- Message: ${error instanceof Error ? error.message : String(error)}
- Code: ${error.code || 'N/A'}

Context:
- User ID: ${context.userId || 'N/A'}
- Request ID: ${context.requestId || 'N/A'}
- Metadata: ${JSON.stringify(context.metadata || {}, null, 2)}

Stack Trace:
${error.stack || 'No stack trace available'}

Environment: ${this.environment}
Service: ${this.serviceName}
Generated: ${new Date().toISOString()}
    `.trim();
    }
    getCircuitBreakerState(operationName) {
        if (!this.circuitBreakers.has(operationName)) {
            this.circuitBreakers.set(operationName, {
                state: 'CLOSED',
                failures: 0,
                successes: 0,
                lastFailureTime: 0,
                nextAttemptTime: 0
            });
        }
        return this.circuitBreakers.get(operationName);
    }
    async recordCircuitBreakerSuccess(operationName, config) {
        const state = this.getCircuitBreakerState(operationName);
        if (state.state === 'HALF_OPEN') {
            state.successes++;
            if (state.successes >= config.successThreshold) {
                state.state = 'CLOSED';
                state.failures = 0;
                state.successes = 0;
                logger.info('Circuit breaker closed after successful recovery', {
                    operationName,
                    successes: state.successes
                });
            }
        }
        else if (state.state === 'CLOSED') {
            state.failures = 0;
        }
    }
    async recordCircuitBreakerFailure(operationName, config) {
        const circuitConfig = config || this.defaultCircuitBreakerConfig;
        const state = this.getCircuitBreakerState(operationName);
        const now = Date.now();
        state.failures++;
        state.lastFailureTime = now;
        if (state.state === 'HALF_OPEN') {
            state.state = 'OPEN';
            state.nextAttemptTime = now + circuitConfig.timeout;
            state.successes = 0;
            logger.warn('Circuit breaker opened after failure in HALF_OPEN state', {
                operationName,
                failures: state.failures
            });
        }
        else if (state.state === 'CLOSED' && state.failures >= circuitConfig.failureThreshold) {
            state.state = 'OPEN';
            state.nextAttemptTime = now + circuitConfig.timeout;
            logger.error('Circuit breaker opened after exceeding failure threshold', {
                operationName,
                failures: state.failures,
                threshold: circuitConfig.failureThreshold,
                nextAttemptTime: new Date(state.nextAttemptTime).toISOString()
            });
            await this.sendErrorNotification(new Error(`Circuit breaker opened for ${operationName} after ${state.failures} failures`), {
                operation: `circuit-breaker-${operationName}`,
                severity: 'HIGH',
                metadata: {
                    failures: state.failures,
                    threshold: circuitConfig.failureThreshold,
                    nextAttemptTime: state.nextAttemptTime
                }
            });
        }
    }
    isRetryableError(error, retryableErrors) {
        const errorCode = error.code;
        const errorType = error.constructor.name;
        if (errorCode && retryableErrors.includes(errorCode)) {
            return true;
        }
        if (retryableErrors.includes(errorType)) {
            return true;
        }
        const retryablePatterns = [
            /timeout/i,
            /connection/i,
            /network/i,
            /service unavailable/i,
            /temporary/i,
            /rate limit/i
        ];
        return retryablePatterns.some(pattern => pattern.test(error instanceof Error ? error.message : String(error)));
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getCircuitBreakerStatus() {
        const status = {};
        for (const [operationName, state] of this.circuitBreakers) {
            status[operationName] = { ...state };
        }
        return status;
    }
    resetCircuitBreaker(operationName) {
        if (this.circuitBreakers.has(operationName)) {
            const state = this.circuitBreakers.get(operationName);
            state.state = 'CLOSED';
            state.failures = 0;
            state.successes = 0;
            state.lastFailureTime = 0;
            state.nextAttemptTime = 0;
            logger.info('Circuit breaker manually reset', { operationName });
        }
    }
    async healthCheck() {
        try {
            const circuitBreakerStats = {
                total: this.circuitBreakers.size,
                open: 0,
                halfOpen: 0,
                closed: 0
            };
            for (const state of this.circuitBreakers.values()) {
                switch (state.state) {
                    case 'OPEN':
                        circuitBreakerStats.open++;
                        break;
                    case 'HALF_OPEN':
                        circuitBreakerStats.halfOpen++;
                        break;
                    case 'CLOSED':
                        circuitBreakerStats.closed++;
                        break;
                }
            }
            return {
                status: 'healthy',
                timestamp: Date.now(),
                configuration: {
                    dlqConfigured: !!this.deadLetterQueueUrl,
                    retryQueueConfigured: !!this.retryQueueUrl,
                    notificationsConfigured: !!this.notificationTopicArn,
                    environment: this.environment,
                    serviceName: this.serviceName
                },
                circuitBreakers: circuitBreakerStats
            };
        }
        catch (error) {
            logger.error('Error handling service health check failed', {
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            });
            return {
                status: 'unhealthy',
                timestamp: Date.now(),
                configuration: {
                    dlqConfigured: !!this.deadLetterQueueUrl,
                    retryQueueConfigured: !!this.retryQueueUrl,
                    notificationsConfigured: !!this.notificationTopicArn,
                    environment: this.environment,
                    serviceName: this.serviceName
                },
                circuitBreakers: {
                    total: 0,
                    open: 0,
                    halfOpen: 0,
                    closed: 0
                },
                error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)
            };
        }
    }
}
exports.ErrorHandlingService = ErrorHandlingService;
exports.errorHandlingService = ErrorHandlingService.getInstance();
//# sourceMappingURL=error-handling.service.js.map