/**
 * Logger Service
 * Re-export from utils/logger for backward compatibility
 */
import { Logger } from '../utils/logger';

export * from '../utils/logger';
export { default } from '../utils/logger';
export { Logger } from '../utils/logger';

// Create alias for LoggerService to Logger for backward compatibility
export const _LoggerService = Logger;
