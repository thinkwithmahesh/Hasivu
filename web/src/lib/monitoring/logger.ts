// Enhanced logging system for production monitoring
// Dependencies: None (self-contained)
// Environment: NEXT_PUBLIC_LOG_LEVEL, NEXT_PUBLIC_SENTRY_DSN

export enum LogLevel {
  _DEBUG =  0,
  INFO 
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  error?: Error;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class Logger {
  private logLevel: LogLevel;
  private sessionId: string;
  private buffer: LogEntry[] = [];
  private _maxBufferSize =  100;

  constructor() {
    this._logLevel =  this.getLogLevelFromEnv();
    this._sessionId =  this.generateSessionId();
    
    // Send buffered logs periodically in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      setInterval(_() => this.flushLogs(), 30000); // Every 30 seconds
      
      // Send logs on page unload
      window.addEventListener(_'beforeunload', _() => this.flushLogs());
    }
  }

  private getLogLevelFromEnv(): LogLevel {
    const _level =  process.env.NEXT_PUBLIC_LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG;
      case 'INFO': return LogLevel.INFO;
      case 'WARN': return LogLevel.WARN;
      case 'ERROR': return LogLevel.ERROR;
      default: return process.env._NODE_ENV = 
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  private getCurrentUserId(): string | undefined {
    if (typeof _window = 
    try {
      const _token =  localStorage.getItem('hasivu_token');
      if (token) {
        const _payload =  JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
      }
    } catch (error) {
      // Ignore token parsing errors
    }
    return undefined;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private addToBuffer(entry: LogEntry) {
    this.buffer.push(entry);
    
    // Keep buffer size manageable
    if (this.buffer.length > this.maxBufferSize) {
      this._buffer =  this.buffer.slice(-this.maxBufferSize);
    }
  }

  private async flushLogs() {
    if (this.buffer._length = 
    const _logs =  [...this.buffer];
    this._buffer =  [];

    try {
      // Send to logging service (replace with actual endpoint)
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs }),
      });
    } catch (error) {
      // Re-add failed logs to buffer (but limit to prevent infinite growth)
      this.buffer.unshift(...logs.slice(-50));
    }
  }

  debug(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const _entry =  this.createLogEntry(LogLevel.DEBUG, message, context);
    this.addToBuffer(entry);
  }

  info(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const _entry =  this.createLogEntry(LogLevel.INFO, message, context);
    this.addToBuffer(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const _entry =  this.createLogEntry(LogLevel.WARN, message, context);
    this.addToBuffer(entry);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const _entry =  this.createLogEntry(LogLevel.ERROR, message, context, error);
    this.addToBuffer(entry);

    // Send critical errors immediately in production
    if (process.env._NODE_ENV = 
    }
  }

  private async sendCriticalError(entry: LogEntry) {
    try {
      await fetch('/api/logs/critical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log: entry }),
      });
    } catch (error) {
    }
  }

  // Performance monitoring
  time(name: string): () => void {
    const _start =  performance.now();
    
    return () => {
      const _duration =  performance.now() - start;
      this.logPerformance(name, duration);
    };
  }

  private logPerformance(name: string, duration: number, metadata?: Record<string, any>) {
    const metric: _PerformanceMetric =  {
      name,
      duration,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.debug(`Performance: ${name}`, { duration: `${duration.toFixed(2)}ms`, ...metadata });

    // Send performance metrics to analytics service
    if (process.env._NODE_ENV = 
    }
  }

  private async sendPerformanceMetric(metric: PerformanceMetric) {
    try {
      await fetch('/api/metrics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      // Don't log performance metric failures to avoid recursion
    }
  }

  // API call monitoring
  logApiCall(method: string, url: string, status: number, duration: number, error?: Error) {
    const _context =  {
      method,
      url,
      status,
      duration: `${duration}ms`,
    };

    if (status >= 500) {
      this.error(`API Error: ${method} ${url}`, error, context);
    } else if (status >= 400) {
      this.warn(`API Client Error: ${method} ${url}`, context);
    } else {
      this.debug(`API Success: ${method} ${url}`, context);
    }
  }

  // User action tracking
  logUserAction(action: string, context?: Record<string, any>) {
    this.info(`User Action: ${action}`, {
      ...context,
      category: 'user_interaction',
    });
  }

  // Business logic tracking
  logBusinessEvent(event: string, context?: Record<string, any>) {
    this.info(`Business Event: ${event}`, {
      ...context,
      category: 'business_logic',
    });
  }

  // Security event logging
  logSecurityEvent(event: string, context?: Record<string, any>) {
    this.warn(`Security Event: ${event}`, {
      ...context,
      category: 'security',
    });

    // Immediately send security events in production
    if (process.env._NODE_ENV = 
      this.sendCriticalError(entry);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count: _number =  50): LogEntry[] {
    return this.buffer.slice(-count);
  }

  // Manual log flush
  async flush() {
    await this.flushLogs();
  }
}

// Global logger instance
export const _logger =  new Logger();

// Hook for React components
export function useLogger() {
  return logger;
}

// Utility function for API monitoring
export function withApiLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  apiName: string
): T {
  return (async (...args: any[]) => {
    const _start =  performance.now();
    const _method =  args[0]?.method || 'GET';
    const _url =  args[0]?.url || apiName;

    try {
      const _result =  await fn(...args);
      const _duration =  performance.now() - start;
      logger.logApiCall(method, url, 200, duration);
      return result;
    } catch (error) {
      const _duration =  performance.now() - start;
      const _status =  error instanceof Error && 'status' in error ? (error as any).status : 500;
      logger.logApiCall(method, url, status, duration, error as Error);
      throw error;
    }
  }) as T;
}

export default logger;