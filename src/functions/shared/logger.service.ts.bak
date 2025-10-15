/**
 * HASIVU Platform - Lambda-Optimized Logger Service
 * CloudWatch-integrated logging optimized for AWS Lambda environment
 * Migration from Express-based winston logger
 */

/**
 * Log levels for Lambda functions
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log entry interface for structured logging
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  functionName?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    name?: string;
  };
}

/**
 * Lambda-optimized logger service
 * Uses structured JSON logging for CloudWatch integration
 */
export class LoggerService {
  private static instance: LoggerService;
  private requestId?: string;
  private functionName?: string;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Set request ID for request-scoped logging
   */
  public setRequestId(requestId: string): void {
    this.requestId = requestId;
  }

  /**
   * Set function name context
   */
  public setFunctionName(functionName: string): void {
    this.functionName = functionName;
  }

  /**
   * Create structured log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      requestId: this.requestId,
      functionName: this.functionName
    };

    if (metadata) {
      entry.metadata = metadata;
    }

    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
        name: error.name
      };
    }

    return entry;
  }

  /**
   * Output log entry to CloudWatch
   */
  private output(entry: LogEntry): void {
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(JSON.stringify(entry));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(entry));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(entry));
        break;
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(entry));
        break;
      default:
        console.log(JSON.stringify(entry));
    }
  }

  /**
   * Log error message
   */
  public error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const logError = error instanceof Error ? error : undefined;
    const logMetadata = error && !(error instanceof Error) ? { ...metadata, error } : metadata;
    const entry = this.createLogEntry(LogLevel.ERROR, message, logMetadata, logError);
    this.output(entry);
  }

  /**
   * Log warning message
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
    this.output(entry);
  }

  /**
   * Log info message
   */
  public info(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
    this.output(entry);
  }

  /**
   * Log debug message
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
    this.output(entry);
  }

  /**
   * Log Lambda function start
   */
  public logFunctionStart(event: any, context: any): void {
    this.setRequestId(context.awsRequestId);
    this.setFunctionName(context.functionName);
    this.info('Lambda function started', {
      functionName: context.functionName,
      functionVersion: context.functionVersion,
      requestId: context.awsRequestId,
      remainingTime: context.getRemainingTimeInMillis()
    });
  }

  /**
   * Log Lambda function end
   */
  public logFunctionEnd(statusCode: number, duration: number): void {
    this.info('Lambda function completed', {
      statusCode,
      duration: `${duration}ms`
    });
  }

  /**
   * Log authentication events
   */
  public logAuthentication(event: string, metadata?: Record<string, any>): void {
    this.info(`Authentication: ${event}`, metadata);
  }

  /**
   * Log Cognito operations
   */
  public logCognito(operation: string, metadata?: Record<string, any>): void {
    this.info(`Cognito: ${operation}`, metadata);
  }

  /**
   * Log timer operations
   */
  public logTimer(label: string, startTime: number): void {
    const duration = Date.now() - startTime;
    this.debug(`Timer: ${label}`, { duration: `${duration}ms` });
  }
}