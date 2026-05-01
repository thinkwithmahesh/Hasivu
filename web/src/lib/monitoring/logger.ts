type LogDetails = Record<string, unknown>;

function writeLog(level: 'info' | 'warn' | 'error', message: string, details?: LogDetails): void {
  if (typeof console === 'undefined') {
    return;
  }

  const payload = details ? { message, ...details } : { message };

  if (level === 'error') {
    console.error(payload);
    return;
  }

  if (level === 'warn') {
    console.warn(payload);
    return;
  }

  console.info(payload);
}

export const logger = {
  info(message: string, details?: LogDetails): void {
    writeLog('info', message, details);
  },
  warn(message: string, details?: LogDetails): void {
    writeLog('warn', message, details);
  },
  error(message: string, error?: Error, details?: LogDetails): void {
    writeLog('error', message, {
      ...(details || {}),
      ...(error ? { error: error.message } : {}),
    });
  },
  logSecurityEvent(message: string, details?: LogDetails): void {
    writeLog('warn', message, details);
  },
};
