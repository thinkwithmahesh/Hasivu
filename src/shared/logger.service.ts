/**
 * Shared Logger Service
 * Re-export of the main logger for shared functions
 */

import { logger as mainLogger } from '../utils/logger';

export { logger, logger as default, LogLevel } from '../utils/logger';

// For compatibility with different import patterns
export class LoggerService {
  private static instance: LoggerService;

  private constructor() {}

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  public info(message: string, context?: any): void {
    mainLogger.info(message, context);
  }

  public error(message: string, error?: Error, context?: any): void {
    mainLogger.error(message, error, context);
  }

  public warn(message: string, context?: any): void {
    mainLogger.warn(message, context);
  }

  public debug(message: string, context?: any): void {
    mainLogger.debug(message, context);
  }

  public logFunctionStart(functionName: string, context?: any): void {
    mainLogger.logFunctionStart(functionName, context);
  }

  public logFunctionEnd(functionName: string, context?: any): void {
    mainLogger.logFunctionEnd(functionName, context);
  }
}
