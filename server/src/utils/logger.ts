/**
 * Vynexa CRM — Enterprise Structured Logging Utility
 * Produces structured JSON logs in production with automatic redaction of sensitive credentials.
 */

const SENSITIVE_LOG_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'secret',
  'authsecret',
  'authorization',
  'cookie',
  'set-cookie',
  'database_url',
  'apikey'
]);

/**
 * Recursively redacts sensitive keys from log metadata objects.
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
      ...(data as any)
    };
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (Array.from(SENSITIVE_LOG_KEYS).some((s) => lowerKey.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  private output(level: LogLevel, message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta !== undefined ? sanitizeLogData(meta) : undefined;

    if (this.isProduction) {
      const logEntry: Record<string, any> = {
        timestamp,
        level,
        message
      };
      if (sanitizedMeta !== undefined) {
        logEntry.meta = sanitizedMeta;
      }
      const serialized = JSON.stringify(logEntry);
      if (level === 'ERROR') {
        console.error(serialized);
      } else if (level === 'WARN') {
        console.warn(serialized);
      } else {
        console.log(serialized);
      }
    } else {
      const metaStr = sanitizedMeta ? ` ${JSON.stringify(sanitizedMeta)}` : '';
      const formatted = `[${timestamp}] [${level}] ${message}${metaStr}`;
      if (level === 'ERROR') {
        console.error(formatted);
      } else if (level === 'WARN') {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }
  }

  public debug(message: string, meta?: any): void {
    if (!this.isProduction) {
      this.output('DEBUG', message, meta);
    }
  }

  public info(message: string, meta?: any): void {
    this.output('INFO', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.output('WARN', message, meta);
  }

  public error(message: string, meta?: any): void {
    this.output('ERROR', message, meta);
  }
}

export const logger = new Logger();
