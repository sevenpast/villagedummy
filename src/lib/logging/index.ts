// ============================================================================
// STRUCTURED LOGGING SYSTEM
// Production-safe logging with different levels and contexts
// ============================================================================

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      };
    }

    return logEntry;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true; // Log everything in development
    }

    // In production, only log warnings and errors
    return level === LogLevel.WARN || level === LogLevel.ERROR;
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    const logString = JSON.stringify(entry, null, this.isDevelopment ? 2 : 0);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.INFO:
        console.info(logString);
        break;
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.output(this.formatLog(LogLevel.ERROR, message, context, error));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.WARN, message, context));
  }

  info(message: string, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.INFO, message, context));
  }

  debug(message: string, context?: LogContext): void {
    this.output(this.formatLog(LogLevel.DEBUG, message, context));
  }

  // API-specific logging methods
  apiRequest(method: string, endpoint: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint
    });
  }

  apiResponse(method: string, endpoint: string, statusCode: number, context?: LogContext): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.output(this.formatLog(level, `API Response: ${method} ${endpoint} - ${statusCode}`, {
      ...context,
      method,
      endpoint,
      statusCode
    }));
  }

  apiError(method: string, endpoint: string, error: Error, context?: LogContext): void {
    this.error(`API Error: ${method} ${endpoint}`, {
      ...context,
      method,
      endpoint
    }, error);
  }

  // Security-specific logging
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: true
    });
  }

  authEvent(event: string, context?: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      ...context,
      authEvent: true
    });
  }

  // Database-specific logging
  dbQuery(table: string, operation: string, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table}`, {
      ...context,
      table,
      operation
    });
  }

  dbError(table: string, operation: string, error: Error, context?: LogContext): void {
    this.error(`DB Error: ${operation} on ${table}`, {
      ...context,
      table,
      operation
    }, error);
  }
}

// Export singleton instance
export const logger = new Logger();

// Helper function to create request context
export function createRequestContext(request: Request, userId?: string): LogContext {
  return {
    userId,
    requestId: request.headers.get('x-request-id') || undefined,
    endpoint: new URL(request.url).pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown'
  };
}
